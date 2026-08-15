---
title: 'OAuth 2.0 Dynamic Client Registration: RFC 7591, 7592'
date: "2026-02-28T00:00:00Z"
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

Whether you're building a massive SaaS platform or a niche API, OAuth is the standard for authorization. But every OAuth setup runs into the same wall eventually: **registration**.
<!--more-->

Every OAuth client has to be registered with an authorization server before it can request tokens. Usually that means an admin opens a portal, types in a name and redirect URI, copies the `client_id` and `client_secret` into a config file, and deploys. Fine for a handful of internal apps. But that manual flow breaks completely once you need to register hundreds or thousands of clients, and that's the gap Dynamic Client Registration (DCR) fills.

## The Specs: RFC 7591 and 7592

Two standards solve the scaling problem:

- [RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591): a protocol for clients to register themselves at runtime by posting JSON metadata to a registration endpoint.
- [RFC 7592](https://datatracker.ietf.org/doc/html/rfc7592): a management API on top of that, to read, update, and delete registrations.

In this post I'll walk through how both specs work, then through a working Ruby implementation I built on [Roda](https://roda.jeremyevans.net/) and [rodauth-oauth](https://github.com/HoneyryderChuck/rodauth-oauth).

## The Problem with Static Client Registration

Why do we need a new way to register at all? Static registration has three structural flaws.

- **A human has to be in the loop.** Someone manually provisions every client. In a multi-tenant setup, that forces you to either give every tenant admin access (a real security risk) or build a custom wrapper API for a process that was never meant to be automated.
- **There's no lifecycle standard.** Every provider has its own UI or proprietary API. If a client needs to rotate its secret, update its redirect URIs, or delete itself when a customer churns, you're writing bespoke code for every provider you talk to.
- **There's zero verification.** Credentials go into a config file and sit there forever. Nothing cryptographically ties the software itself to the registration record.

DCR fixes all three by turning registration into a standardized, machine-to-machine exchange instead of a form someone fills out once and forgets.

---

# RFC 7591: The Registration Protocol

The whole protocol is one HTTP endpoint: `POST /register`.

The client sends a JSON body describing itself, and the server responds with a `client_id` and, if applicable, a `client_secret`. The response code is `201 Created`, not `200 OK` (it's creating a resource, so treat it like one).

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

On success:

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

A few things worth calling out here:

- A `client_secret_expires_at` of `0` means the secret never expires. Any other value is a standard Unix timestamp.
- `registration_client_uri` and `registration_access_token` only show up if the server also supports RFC 7592 (the management spec). These two values are your keys to managing the client afterward, so don't drop them.
- The `Authorization: Bearer` header carries the initial access token: a pre-shared credential that gates who's allowed to register at all. Skip it and your endpoint is open to the entire internet, which means junk registrations and DoS traffic showing up in your database.
- DCR adds `software_id` and `software_version` to identify the app's "version," as distinct from the specific instance (`client_id`). For higher-security setups, `software_statement` (a signed JWT) lets the server cryptographically verify exactly what software is asking to register.

## Error responses

On failure, the server returns `400 Bad Request` with one of four error codes:

- `invalid_redirect_uri`: a submitted redirect URI is malformed or not allowed.
- `invalid_client_metadata`: some metadata field has an unacceptable value.
- `invalid_software_statement`: the JWT in `software_statement` is malformed.
- `unapproved_software_statement`: the software statement's issuer isn't trusted.

---

# RFC 7592: The Management Protocol

RFC 7591 gets you a client_id. It doesn't tell you what to do next, and that's where RFC 7592 picks up. The registration response includes a `registration_client_uri` (a URL unique to that client) and a `registration_access_token`. With those two, the client can manage its own registration without an admin touching anything.

Three operations live on that client URI:

## Read (GET)

```http
GET /register/s6BhdRkqt3 HTTP/1.1
Authorization: Bearer this.is.the.management.token
```

Returns the current client metadata.

>note: the server may rotate the `registration_access_token` on every read. If it does (and returns the new one in the response), the old token is dead the moment the response lands.

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

**PUT is a full replacement, not a patch.** The spec is explicit: "valid values of client metadata fields in this request MUST replace, not augment, the values previously associated with this client." Omit `redirect_uris` and they're gone, so send every field, every time, even the ones you're not changing.

The response returns the current metadata. If the server rotated the `registration_access_token`, the new one shows up here, and the old one is invalid from that point on.

You can't include `registration_access_token`, `registration_client_uri`, or `client_secret_expires_at` in the PUT body. The server ignores or rejects them.

## Delete (DELETE)

```http
DELETE /register/s6BhdRkqt3 HTTP/1.1
Authorization: Bearer this.is.the.management.token
```

A successful delete returns `204 No Content`. After that, any request to the same `registration_client_uri` returns `401 Unauthorized`, not `404`. The endpoint still exists, it's just that authentication fails now, since the client it was authenticating no longer exists.

>note: RFC 7592 is entirely optional. A server can implement RFC 7591 and stop there. Whether the management API is available shows up as the presence (or absence) of `registration_client_uri` in the registration response.

---

# The Full Lifecycle

Put the two specs together and you get one continuous flow, from creation to teardown, all driven by the client:

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

Every step needs the `registration_access_token` issued at registration. If the server rotates it on a GET or PUT, treat the new token as the only valid one immediately, since the old one won't work on the next call.

---

# Security Considerations

That lifecycle only holds up if the endpoints behind it are locked down. A few things to get right:

**Protect the registration endpoint.** An open `POST /register` is a gift to attackers: they can flood your database with junk clients or use your server as infrastructure for phishing. Always require an initial access token in production.

**Validate URI fields before fetching them.** Fields like `jwks_uri` or `logo_uri` tell your server to go fetch something from the web. Skip validation and an attacker can point them at internal metadata services (think `169.254.169.254`). Allowlist hostnames, don't just trust what's submitted.

**An open registration endpoint weakens your consent model.** Since DCR hands out a legitimate `client_id` to anyone who asks, it can be used to make a phishing site look official. Consider restricting the scopes available to dynamic clients until an admin flags them as trusted.

---

# When to Use Dynamic Client Registration

Given those trade-offs, DCR isn't the default choice, it's the right choice for specific shapes of problem:

- **Multi-tenant SaaS**: each tenant's integration registers its own client at onboarding. No manual admin step, no shared credentials across tenants.
- **Mobile or third-party SDKs**: every installation registers a unique client, which gives you per-instance visibility and the ability to revoke one instance without touching the rest.
- **Federated environments**: a client that needs to register with multiple authorization servers (different regions, different organizations) gets one standard flow regardless of which vendor is on the other end.
- **API gateway self-registration**: services in a microservices mesh register their own clients on startup and deregister on shutdown.

**When should you skip it?** If you've got a small, stable number of internal apps that rarely change, static registration is simpler, easier to audit, and carries less overhead. Don't add a runtime registration protocol to solve a problem you don't have.

## AI Agents and MCP

There's a newer case where DCR fits well: AI agent systems. As agents use protocols like [Model Context Protocol (MCP)](https://modelcontextprotocol.io) to talk to tools and APIs, manually provisioning a `client_id` for every sub-agent spawned at runtime isn't practical, there could be dozens spinning up and tearing down in a single session. Dynamic registration lets an agent register its own instance on startup, request only the scopes it needs for that session, and clean up its credentials through RFC 7592 once the task is done.

## OIDC Dynamic Registration

[OpenID Connect Dynamic Client Registration 1.0](https://openid.net/specs/openid-connect-registration-1_0.html) follows the same pattern as RFC 7591, but it's a parallel spec, not a strict superset. It adds OIDC-specific fields (`id_token_signed_response_alg`, `subject_type`, `default_max_age`, and others), requires TLS on the registration endpoint, and strictly couples `registration_client_uri` with `registration_access_token` in the response. You find the endpoint through `registration_endpoint` in `.well-known/openid-configuration`.

---

# Hands-On: A Ruby Implementation

Reading the spec only gets you so far, so I put together a sample app to see it work end to end: [roda-oauth-dynamic-registration](https://github.com/baala3/roda-oauth-dynamic-registration). It implements both RFCs with the [Roda](https://roda.jeremyevans.net/) web toolkit and [rodauth-oauth](https://github.com/HoneyryderChuck/rodauth-oauth) in about 100 lines of code.

If you want to test the registration flow yourself, clone the repo and follow the setup guide in the README.

---

# Conclusion

The two RFCs split cleanly: 7591 owns initial registration, 7592 owns everything after. A server can implement just 7591 and skip the management layer, but then clients have no standard way to update or deregister themselves. Most real deployments end up needing both.
