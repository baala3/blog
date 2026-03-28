---
title: 'OAuth 2.0 Dynamic Client Registration: RFC 7591, 7592'
date: "2026-03-28T00:00:00Z"
url: "/blogs/oauth2-dynamic-client-registration"
description: "Static OAuth client registration breaks at scale. RFC 7591 and 7592 define how clients register and manage themselves at runtime, with no admin portal required."
tldr: "RFC 7591 defines a single HTTP endpoint where clients register themselves with an authorization server at runtime. RFC 7592 adds read, update, and delete operations on that registration. Together they remove the human from client provisioning."
image: "blogs/oauth2-dynamic-client-registration/image.svg"
credit: ""
thumbnail: "blogs/oauth2-dynamic-client-registration/thumbnail.svg"
categories:
- OAuth
- Security
classes:
- feature-mermaid
---

Whether you're building a massive SaaS platform or a niche API, OAuth is the gold standard for authorization. But there is a hurdle that every developer hits eventually: **Registration**.
<!--more-->

Traditionally, every OAuth client needs to be manually registered with an authorization server before it can request its first token. Usually, this means an admin opens a portal, types in a name and redirect URI, copies the client_id and client_secret into a config file, and hits deploy. For a few internal apps, that’s fine. But that manual flow breaks completely when you want to register thousands of clients. This whre Dynamic Client Registration (DCR) enters.

## The Specs: RFC 7591 and 7592

To solve the scaling problem, we turn to two key standards:
- [RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591): Defines a protocol for clients to register themselves at runtime by posting JSON metadata to a registration endpoint.
- [RFC 7592](https://datatracker.ietf.org/doc/html/rfc7592): Extends the protocol with a management API to read, update, and delete those registrations.

In this post, we’ll dive into how these specs work and walk through a working Ruby implementation built on [Roda](https://roda.jeremyevans.net/) and [rodauth-oauth](https://github.com/HoneyryderChuck/rodauth-oauth).

# The Problem with Static Client Registration

Why do we need a new way to register? Static registration suffers from three structural flaws:

- **The Human in the Loop**: A person has to manually provision every client. In a multi-tenant environment, this forces you to either give every tenant admin access (a massive security risk) or build a custom "wrapper" API for a process that wasn't meant to be automated.
- **No Lifecycle Standard**: Every provider has a different UI or proprietary API. If your client needs to rotate its secret, update its redirect URIs, or delete itself when a customer churns, you’re stuck writing bespoke code for every single provider.
- **Zero Verification**: Credentials go into a config file and sit there forever. There is no cryptographic link between the software itself and the registration record.

DCR addresses all three by turning registration into a standardized, machine-to-machine conversation.

# RFC 7591: The Registration Protocol

The entire protocol is one HTTP endpoint: `POST /register`.

The client sends a JSON body with its metadata, and the server responds with a `client_id` and (if applicable) a `client_secret`. The response code is `201 Created`, not `200 OK`.

A minimal registration request looks like this:

```http
POST /register HTTP/1.1
Host: auth.example.com
Content-Type: application/json
Authorization: Bearer <initial_access_token>

{
  "client_name": "Billing Service",
  "redirect_uris": ["https://billing.example.com/callback"],
  "grant_types": ["authorization_code"],
  "token_endpoint_auth_method": "client_secret_basic",
  "scope": "read write"
}
```

And after successful response:

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "client_id": "s6BhdRkqt3",
  "client_secret": "cf136dc3c1fd86244b075d2e....",
  "client_secret_expires_at": 0,
  "client_name": "Billing Service",
  "redirect_uris": ["https://billing.example.com/callback"],
  "grant_types": ["authorization_code"],
  "token_endpoint_auth_method": "client_secret_basic",
  "scope": "read write",
  "registration_client_uri": "https://auth.example.com/register/s6BhdRkqt3",
  "registration_access_token": "this.is.the.management.token"
}
```

A few things to note here.

- A `client_secret_expires_at` value of `0` means the secret is permanent. Any other value is a standard Unix timestamp.
- The `registration_client_uri` and `registration_access_token` are only returned if the server supports RFC 7592 (the management spec). These are your keys to updating the client later.
- The `Authorization: Bearer` header contains the initial access token. This is a pre-shared credential that determines who is allowed to register. Without this, your endpoint is open to the entire internet—and you'll be drowning in "garbage" registrations in no time.
- DCR introduces `software_id` and `software_version` to identify the "version" of the app, distinct from the specific instance (client_id). For high-security environments, a `software_statement` (a signed JWT) allows the server to cryptographically verify exactly what software is knocking at the door.

## Error responses

On failure, the server returns `400 Bad Request` with one of four error codes:

- `invalid_redirect_uri`: one of the submitted redirect URIs is malformed or disallowed.
- `invalid_client_metadata`: a metadata field has an unacceptable value.
- `invalid_software_statement`: the JWT in `software_statement` is malformed.
- `unapproved_software_statement`: the software statement issuer is not trusted.

# RFC 7592: The Management Protocol

RFC 7592 defines what happens after registration. The registration response includes a `registration_client_uri` (a URL unique to the client) and a `registration_access_token`. Using those, the client can manage its own registration without involving an admin.

Three operations are supported on the client URI:

## Read (GET)

```http
GET /register/s6BhdRkqt3 HTTP/1.1
Authorization: Bearer this.is.the.management.token
```

Returns the current client metadata. 

>note: The server may rotate the `registration_access_token` on every read response; if it does, the old token must be discarded.

## Update (PUT)

```http
PUT /register/s6BhdRkqt3 HTTP/1.1
Authorization: Bearer this.is.the.management.token
Content-Type: application/json

{
  "client_id": "s6BhdRkqt3",
  "client_name": "Billing Service v2",
  "redirect_uris": ["https://billing.example.com/callback", "https://billing.example.com/callback2"],
  "grant_types": ["authorization_code"],
  "token_endpoint_auth_method": "client_secret_basic",
  "scope": "read write"
}
```

**PUT is a full replacement, not a patch.** The spec is explicit: "valid values of client metadata fields in this request MUST replace, not augment, the values previously associated with this client." If you omit `redirect_uris`, they're gone so send all fields every time.

The response send back the current metadata. If the server rotated the `registration_access_token`, a new one appears in the response. The old one is invalid from that point forward.

You cannot include `registration_access_token`, `registration_client_uri`, or `client_secret_expires_at` in the PUT body. The server ignores/rejects them.

## Delete (DELETE)

```http
DELETE /register/s6BhdRkqt3 HTTP/1.1
Authorization: Bearer this.is.the.management.token
```

Successful deletion returns `204 No Content`. After deletion, any subsequent request to the same `registration_client_uri` returns `401 Unauthorized`, not `404`. The endpoint still exists, it's the authentication that fails because the client no longer exists.

>note: RFC 7592 is entirely optional. A server that implements RFC 7591 is not restricted to support management operations. Whether the management API is available can be found by presence (or absence) of `registration_client_uri` in the registration response.

# The Full Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant AS as Authorization Server

    C->>AS: POST /register (with initial_access_token)
    AS-->>C: 201 Created (client_id, client_secret, registration_access_token)

    Note over C,AS: Client uses tokens normally

    C->>AS: GET /register/:client_id (registration_access_token)
    AS-->>C: 200 OK (current metadata)

    C->>AS: PUT /register/:client_id (all fields + registration_access_token)
    AS-->>C: 200 OK (updated metadata, possibly new registration_access_token)

    C->>AS: DELETE /register/:client_id (registration_access_token)
    AS-->>C: 204 No Content
```

Each step requires the `registration_access_token` issued at registration. If the server rotates it on GET or PUT, treat the new token as the only valid one immediately.

# Security Considerations

**Protect the registration endpoint.** An open `POST /register` is a gift to attackers. They can flood your DB with junk clients or use your server to launch phishing attacks. Always require an initial access token in production.

**Validate URI fields before fetching.** Fields like `jwks_uri` or `logo_uri` tell your server to go fetch something from the web. If you don't validate these URLs, an attacker can point them at your internal metadata services (like 169.254.169.254). Always allowlist hostnames.

**An open registration endpoint weakens your consent model.** Because DCR gives anyone a legitimate `client_id`, it can be used to make phishing sites look "official." Consider restricting the scopes available to dynamic clients until an admin flags them as "trusted."

# When to Use Dynamic Client Registration

DCR fits well in these scenarios:

- **Multi-tenant SaaS**: Each tenant's integration registers its own client at onboarding time. No manual admin steps; no shared credentials across tenants.
- **Mobile or third-party SDKs**: Every installation of your SDK registers a unique client, giving you per-instance visibility and the ability to revoke individual instances.
- **Federated environments**: A client needs to register with multiple authorization servers (different regions, different organizations). DCR gives you one standard flow regardless of AS vendor.
- **API gateway self-registration**: Services in a microservices mesh register their own clients on startup and deregister on shutdown.

**When to skip it?**
If you only have five internal apps that rarely change, static registration is simpler, easier to audit, and carries less overhead.

## AI Agents and MCP

DCR may also be the right fit for AI agent systems. As agents use protocols like the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) to interact with tools and APIs, manually provisioning a `client_id` for every sub-agent spawned at runtime isn't practical. Dynamic registration lets an agent register its own instance on startup, request only the scopes it needs for that session, and clean up its credentials via RFC 7592 when the task is done.

## OIDC Dynamic Registration

[OpenID Connect Dynamic Client Registration 1.0](https://openid.net/specs/openid-connect-registration-1_0.html) is built on the same pattern as RFC 7591, but it's a parallel spec, not a strict superset. It adds OIDC-specific fields (`id_token_signed_response_alg`, `subject_type`, `default_max_age`, and others), mandates TLS on the registration endpoint, and strictly couples `registration_client_uri` with `registration_access_token` in the response. The endpoint is found via `registration_endpoint` in `.well-known/openid-configuration`.

# Hands-On: A Ruby Implementation

I created a sample app [roda-oauth-dynamic-registration](https://github.com/baala3/roda-oauth-dynamic-registration) that implements both RFCs using [Roda](https://roda.jeremyevans.net/) and [rodauth-oauth](https://github.com/HoneyryderChuck/rodauth-oauth) in about 100 lines.

#### 1. Spin up the Server
```bash
bundle install
MASTER_TOKEN=secret bundle exec rackup -p 9292
```

#### 2. Register a client

```bash
curl -s -X POST http://localhost:9292/register \
  -H "Authorization: Bearer secret" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My App",
    "redirect_uris": ["https://myapp.example.com/callback"],
    "grant_types": ["authorization_code"],
    "token_endpoint_auth_method": "client_secret_basic",
    "scope": "read write"
  }' | jq .
```

```json
{
  "client_id": "AhkNkIp0OtMnFp6vKrxRZ8tS",
  "client_secret": "N7bqkTnEtFvH3aWmRLpG...",
  "client_secret_expires_at": 0,
  "client_name": "My App",
  "grant_types": ["authorization_code"],
  "redirect_uris": ["https://myapp.example.com/callback"],
  "scope": "read write",
  "token_endpoint_auth_method": "client_secret_basic",
  "registration_client_uri": "http://localhost:9292/register/AhkNkIp0OtMnFp6vKrxRZ8tS",
  "registration_access_token": "wjTsXFIBz4M6GvQq..."
}
```

#### 3. Manage the Lifecycle

Save the `registration_access_token`. It's bcrypt-hashed in the database immediately so you won't see it again. Use it for all subsequent management calls:

```bash
# Read
curl -s http://localhost:9292/register/AhkNkIp0OtMnFp6vKrxRZ8tS \
  -H "Authorization: Bearer wjTsXFIBz4M6GvQq..." | jq .

# Update (remember: PUT replaces everything — send all fields)
curl -s -X PUT http://localhost:9292/register/AhkNkIp0OtMnFp6vKrxRZ8tS \
  -H "Authorization: Bearer wjTsXFIBz4M6GvQq..." \
  -H "Content-Type: application/json" \
  -d '{ "client_id": "AhkNkIp0OtMnFp6vKrxRZ8tS", "client_name": "My App", ... }' | jq .

# Delete
curl -s -X DELETE http://localhost:9292/register/AhkNkIp0OtMnFp6vKrxRZ8tS \
  -H "Authorization: Bearer wjTsXFIBz4M6GvQq..."
# 204 No Content
```

---

## Conclusion

The two RFCs split cleary 7591 owns the initial registration, 7592 owns everything after. A server can implement just 7591 and skip the management layer entirely, but if it does, clients have no standard way to update or deregister themselves. Most real deployments need both.


