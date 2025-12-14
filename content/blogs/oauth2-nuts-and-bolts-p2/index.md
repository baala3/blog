---
title: 'The nuts and bolts of oauth2.0 (part2)'
date: "2023-06-15T10:52:44+09:00"
url: "/blogs/oauth2-nuts-and-bolts/oauth2-nuts-and-bolts-p2"
description: ""
tldr: ""
image: "https://i.ibb.co/dsmwGmhR/image.png"
credit: ""
thumbnail: "https://owncloud.com/wp-content/uploads/2020/10/openidconnect.png"
categories:
- Oauth
- OpenId
---

This is part 2 of nuts and bolts of OAuth 2.0, continuing [part 1](https://blog.balashekhar.me/blogs/oauth2-nuts-and-bolts/oauth2-nuts-and-bolts-p1/). In this section, I'll explore the client credentials flow for machine-to-machine communication<!--more-->,  dive deep into OAuth scopes and their proper usage, get introduced to OpenID Connect and ID tokens, learn different access token types (reference vs self-encoded), and see how to handle revoked or invalid tokens in OAuth flows that we learned.

Ok! let'z go..

# OAuth Client Credentials flow

This flow is much simpler compared to authorization code, since there’s no user involved at all. 
The app just exchanges its own credentials (`client_id` and `client_secre`) with the auth server to get an `access token`, and then uses that token to call APIs. You might think, why not let API server just accept credentials directly? The idea is that API server shouldn’t care about who the caller is, it should only focus on validating an access token and responding. It’s the auth server’s job to handle the credential exchange and issue tokens.

Typical use cases of this flow include machine-to-machine communication (like one backend service talking to another), or when an app needs credentials to call special endpoints such as the `token introspection` API. In such cases, client credentials act like service account that represents the app itself rather than an individual user.

**Client Credentials Flow**

First, the app gets registered in auth server (usually as `machine-to-machine` or `service account` type). When the app needs an access token, it sends a request with `grant_type=client_credentials` and the required scope. The auth server returns an access token, and that’s it.

Since there’s no user in picture here, there’s no concept of refresh tokens. Whenever the app needs a new token, it just repeats the same request with credentials.

---

# OAuth Scopes

Scopes can be little confusing because OAuth spec doesn’t strictly define them. At high level, scopes are just a way for an app to request limited access instead of full control. For ex: scope like read might only let the app fetch data, but not modify it. During the OAuth flow, the app explicitly asks for these scopes, and the access token it receives will only be valid for those permissions.

**Common Misconception**

Sometimes people assume scopes can handle all types of user access control like separating consumer users from admin users, or managing roles, groups, and permissions. That’s not really what scopes are for. OAuth scopes are more about limiting what an app can do with a user’s account, not defining user roles. For role based stuff (like “admin can upload photos, consumer can only view”), you still need separate concepts like permissions, groups, or RBAC outside of OAuth itself.

### 1. <u>How to Define Scopes</u>

OAuth itself doesn’t tell you how to define scopes. To OAuth, scopes are just strings that flow through the protocol. The meaning of those strings is entirely up to service provider.

A good way is to look at how big services do it. For ex: GitHub defines scopes like `repo:invite`, `repo:read`, `repo:write`. Others use URL fomated scopes like `example/scope/read`. What really matters is that once you define them, you also document them clearly so developers know what each scope means.

For smaller apps, scopes can be very high-level (e.g: just `read` and `write`). But in larger systems like Google’s ecosystem, scopes are broken down per service (YouTube, Gmail, Drive, etc.), since those APIs are segmented and don’t directly depend on each other.

Scopes can also play a role in things like `user consent` clarity, chaining access across services, or even billing APIs. So defining them in a way that’s secure, meaningful, and developer friendly is very imp thing.

### 2. <u>Prompting User for Consent Screen</u>

The consent screen is best place to show users what scopes mean and what access the app is requesting. But explaining scopes directly is tough as users don’t understand `repo:write` or `profile.read`. That’s why it’s important for your OAuth server to support a `display phrase` or `friendly description` for each scope (something like “Allow this app to update your repositories”).

The goal is to inform users clearly but concisely, without overwhelming them. This step is especially important for third-party apps, since users need to make an informed choice before granting access.

Even for public clients (like SPAs or native apps), showing a consent screen is recommended as these apps don’t have a client secret, meaning anyone could impersonate your app.

---

# Introduction to OpenID Connect

While OAuth is all about apps getting access to APIs, OpenID Connect (OIDC) focuses on sharing user identity information with the app.

The main addition OIDC brings on top of OAuth is the **ID Token**.

- The access token can be in any format and is used to call APIs.
- The ID token, however, is a **JWT** specifically meant for apps to understand *who the user is*.

This makes OIDC the standard way to handle authentication (who the user is), while OAuth alone is about authorization (what the app can do).


### 1. <u>Format of an ID Token in OpenID Connect</u>

An **ID token** is a JWT consisting of three parts:

```
Header.Payload.Signature

```

**Header**

- Contains metadata like the signing algorithm (`alg`) and the key ID (`kid`) that identifies which key was used to sign the token.

**Payload**

Contains claims about the user and the token itself, for example:

- `sub` → unique user ID (must be stable and never reused)
- `iss` → identifier of the server that issued the token
- `aud` → audience (which app the token is for)
- `iat` → issued at (timestamp)
- `exp` → expiration time
- User profile info like `email`, `name`, etc. (depends on server config)

**Signature**

- Ensures the token is valid and hasn’t been tampered with.
- Created by the authorization server using its private key.

So in short: Access Token → lets app call APIs. ID Token → tells the app who the user is.

### 2. <u>Access Token vs ID Token</u>

<div style="display: flex; flex-wrap: wrap; gap: 2px; font-size: 12px; width: 100%; align-items: stretch;">
  <div style="flex: 1; display: flex; align-items: center; border-radius: 5px;">
    <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; width: 100%;">
{
  "access_token": {
    "ver": 1,
    "jti": "9PhB7Kh81RRVRApHbS39eXhrphiHray46Rz5gAr5gbY...",
    "iss": "https://bala-demo.okta.com/oauth2/default",
    "aud": "api://default",
    "iat": 1602029659,
    "exp": 1602044059,
    "cid": "0oa5sso3mrYKdvde0357",
    "uid": "00ugi4dbxSUVca12X356",
    "scp": ["offline_access",
     "profile",
     "email", 
     "opend"],
    "sub": "bala@example.com",
    "name": "Bala Shekhar"
  }
}
    </pre>
  </div>
  <div style="flex: 1; display: flex; align-items: center; border-radius: 5px;">
    <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; width: 100%;">
{
  "id_token": {
    "sub": "00ugi4dbxSUVca12X356",
    "name": "Bala Shekhar",
    "email": "bala@example.com",
    "ver": 1,
    "iss": "https://bala-demo.okta.com/oauth2/default",
    "aud": "0oa5sso3mrYKdvde0357",
    "iat": 1602029659,
    "exp": 1602033259,
    "jti": "pif6Rz6CcrdfA2gI9IKKKQNsLhccSLlymcAysxM0",
    "amr": ["pwd"],
    "idp": "00ogi4d8xCXNSYWW1356",
    "preferred_username": "bala@example.com",
    "auth_time": 1602029658,
    "at_hash": "10rjYZK8AKao21MoxbTRig"
  }
}
    </pre>
  </div>
</div>


Even though access tokens and ID tokens may look similar since many servers issue them as JWTs, they serve completely different purposes. An `access token` is meant only for calling APIs and should be treated as *opaque* by the app. The app should never try to read or interpret it, since its audience (aud) is always the API (resource server). But, ID token is specifically designed for the app itself. It is readable, the app must validate its signature and claims, and then learn user details such as the unique identifier (sub), email, or name. This also means the audience for the ID token is the client application. So, application simply passes the access token when making API calls, it directly consumes the ID token to understand who the user is.

### 3. <u>Getting an ID Token</u>

An application can obtain an ID token in a few different ways. 

In the standard OAuth authorization code flow, simply adding the `openid` scope ensures that when the app exchanges the authorization code for an access token, it also receives an `ID token`. Since this exchange happens on a trusted back-channel, the app doesn’t need to perform JWT validation just to prove delivery, it comes from the authorization server directly. 

However, there is also another way: by requesting `response_type=id_token`, the app can receive the ID token directly in the front channel, similar to `OAuth implicit flow`. While this method does carry risks, ID tokens are always JWTs and signed, so the app can validate them properly. Still, it’s generally safer to use the auth code flow. 

It’s also worth noting that when using the `openid` scope flow, the ID token often contains only minimal information, usually just the sub claim. To request more user details, OpenID Connect defines extra scopes such as `profile`, `email`, `address`, and `phone`. And in some cases, even these details aren’t fully included in the ID token itself, app must call the `/userinfo` endpoint with the `access token` to retrieve them. 

Also with `response_type=id_token`, while apps can validate the token, the authorization server can’t always guarantee that the token reached the correct audience. Since ID tokens don’t provide access by themselves, this may not be a huge risk, but if sensitive information is being added in them, the safer approach is to stick with the auth code flow so that data is always delivered through the back-channel.

### 4. <u>Hybrid OpenID Connect flows</u>
Till now, we’ve seen `response_type=code` (the standard authorization code flow) and `response_type=id_token` (directly receiving the ID token in the front channel). OpenID Connect also allows combining them, for ex: `response_type=code+id_token`, which delivers the access token via back channel, ID token via front channel. There’s also `response_type=token+id_token`, a legacy OAuth implicit flow. While OpenID Connect provides mechanisms to prevent access token injection attacks in this case, it is generally discouraged because access tokens should always be delivered through the back channel for better security.

That leaves us with two main approaches: `code`, `id_token` and `code+id_token`. In the `code+id_token` flow, the ID token is returned right away for the application to use, along with a special claim called `c_hash`, which is a hash of the authorization code. The app must validate this carefully to ensure the authorization code hasn’t been tampered with, otherwise it risks `auth code injection` attacks. From the authorization server’s POV, PKCE is the main protection way against these attacks, but in this hybrid flow every client implementation still needs to correctly validate the `c_hash` and the `ID token`. Because of this complexity, the spec recommends that both public and confidential clients stick to the authorization code flow with PKCE to obtain ID and access tokens. This keeps things simpler, pushes the security burden onto the authorization server, and avoids requiring every app to handle advanced token validation logic on its own.

### 5. <u>Validating and using ID tokens</u>

When an application receives an ID token, the general rule is that it must validate both the **signature** and the **claims** inside the token.

**Validate the Signature**
- Use the algorithm and key identifier (`kid`) provided in the token’s header.
- Fetch the corresponding public key from the identity provider’s JWKS endpoint.
- Rely on a standard JWT library to perform signature verification.
- This ensures the ID token hasn’t been tampered with.

**Validate the Claims**

<pre>
{
  "sub": "00ugi4dbxSUVcAi2X356",
  "name": "Balashekhar kamandla",
  "locale": "ja-JP",
  "email": "bala@example.com",
  "ver": 1,
  "iss": "https://bala-demo.okta.com/oauth2/default",
  "aud": "0oa5sso3mrYKdvde0357",
  "iat": 1602104200,
  "exp": 1602107800,
  "jti": "ID.VymjFpTPYZETjLmYEDqqANEWOQs5JMTPwaD6te8yTLg",
  "amr": ["pwd"],
  "idp": "00ogi4d8xcXNsYWWi356",
  "nonce": "ff935284e4",
  "preferred_username": "bala@example.com",
  "given_name": "Balashekhar",
  "family_name": "Kamandla",
  "zoneinfo": "Japan/Tokyo",
  "updated_at": 1601943403,
  "email_verified": true,
  "auth_time": 1602104159,
  "c_hash": "ZZJZX3ikphV9YDhw793jTg"
}
</pre>

Key claims to check include:

- `iss` (issuer) → must match the expected authorization server.
- `aud` (audience) → must include the client ID of your app.
- `iat` (issued at) and `exp` (expiry) → token must be within its validity window.
- `nonce` → protects against replay or injection attacks; the client generates it during the request and must check it against the returned token.
- Other claims (optional, but useful):
    - `email` → verify ownership if email is required.
    - `amr` (Authentication Method Reference) → how the user authenticated (e.g., password, MFA).
    - `auth_time` → when the user last logged in.

In Authorization Code Flow with PKCE, the ID token is delivered directly to the application over a trusted HTTPS connection and tied to the app’s own request. Because of this, checks such as audience, issuer, or even signature verification are less critical—the app already knows which server it is talking to and that the token was issued in direct response to its request. As long as the token is consumed internally and not exposed elsewhere, skipping these validations is generally acceptable.

But, if ID token is ever passed outside the backend like store in cookies, send to frontend, or obtained through the front channel, then validation becomes important. In these cases, the app must verify the signature and claims to ensure the token is genuine, has not expired, and has not been tampered with.

---

# Access Token types and their Tradeoffs
 access tokens, generally comes into two categories: `reference tokens` and `structured tokens` (also called `Self-Encoded Token`). 

### 1. <u>Reference Tokens vs Self-Encoded Token</u>
 A reference token is essentially just a pointer or reference to information stored elsewhere. The authorization server keeps the actual data in a backend system, such as a `relational database` (with the token value acting as an ID and other fields stored in columns) or a `cache` like Memcached or Redis. The API, when presented with such a token, must call back to the authorization server or its datastore to look up the details. 
 
 And `structured token` contains the data directly inside the token itself. This data might include information such as the user identifier, the client application, issued and expiry timestamps, scopes, the issuing authorization server, and even metadata like the user’s last login. The authorization server takes this data, encodes it (commonly in a JWT format), and then either signs or encrypts it. That way, the resource server can validate and trust the token without making a network call back to the authorization server. There is also spec for using JWT as access tokens ([RFC 9068](https://datatracker.ietf.org/doc/html/rfc9068)), which defines how to structure them so that APIs can consume and validate them, while still treating them as opaque to client app.

### 2. <u>Pros and Cons of Reference Tokens</u> 

*Pros of Reference Tokens*
- Simple and easy to build.
- Easy revocation, just delete the token from the database.
- Tokens are opaque, so apps, APIs, or developers cannot see sensitive data.

*Cons of Reference Tokens*
- Tokens must be stored and managed.
- Expired tokens can remain in the database, leading to clutter.
- API servers must call back for token verification, which doesn’t scale well since all servers depend on a central DB or service.

**Note:** To address verification overhead, authorization servers often provide a `token introspection endpoint` so that APIs can validate tokens over HTTP instead of directly accessing the database.

### 3. <u>Pros and Cons of Self-Encoded Token</u> 

*Pros of Self-Encoded Tokens*
- No need for a token store on the authorization server.
- API servers can validate tokens locally without extra API calls.
- Scales well in large systems, since the OAuth server and API servers don’t need to share a database, this makes the design more modular and efficient.

*Cons of Self-Encoded Tokens*
- Often not encrypted, so token data may be exposed if intercepted.
- No central storage means tokens cannot be directly revoked.
   - This can be mitigated by the authorization server maintaining extra state (e.g, state or revocation lists, etc) and exposing a `/introspection` endpoint for APIs to check token validity.

Despite these drawbacks, Self-Encoded tokens are generally preferred for large-scale systems because their performance and scalability benefits outweigh limitations. And careful system design when implementing so.

---

# JWT Access Tokens

### 1. <u>Structure of a JWT access token</u>

JSON Web Tokens (JWT) are a general-purpose specification that can be used in many contexts from OpenID Connect to systems completely outside the web. In OAuth 2.0, JWT is often used as format for access tokens because it allows embedding structured claims that APIs can validate directly. also many OAuth servers choose to only sign the access token rather than encrypt it.

The JWT specification defines set of standard claims, but it does not mandate their use. This flexibility exists because JWT is designed for multiple scenarios beyond OAuth. As a result, not all fields are always present in access tokens it depends on how the authorization server implements them.

To bring consistency, OAuth defines the `JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens (RFC 9068)`. This  standardizes which claims should be included in access tokens, making it easier for APIs and clients to rely on a predictable set of fields. Many of fields in a JWT access token are standardized (“reserved claims”), but OAuth servers can also include custom claims depending on application needs. For ex: claims may include user details, group memberships, or application-specific metadata.

<pre style="margin: 0; word-wrap: break-word;">
{
  "access_token": {
    "iss": "https://bala-demo.okta.com/oauth2/default",
    "exp": 1602044059,
    "iat": 1602029659,
    "aud": "api://default",
    "sub": "bala@example.com",
    "client_id": "0oa5sso3mrYKdvde0357
    "jti": "9PhB7Kh81RRVRApHbS39eXhrphiHray46Rz5gAr5gbY...",
    "scope": [
     "offline_access",
     "photo"
     ],
     "auth_time": 1602029653,
     "acr": 0,
     "amr" "pwd" 
  }
}
</pre>

*Common Claims in Access Tokens*
- iss (Issuer): Identifies the authorization server that issued the token.
- exp (Expiration): Defines when the token becomes invalid. Required field.
- iat (Issued At): The timestamp when the token was created.
- aud (Audience): Specifies the intended recipient(s), usually the API that should accept the token.
- sub (Subject): Represents the identity associated with the token — this could be the user’s ID in user flows or the client ID in client-credentials flows.
- client_id: Identifies the client application to which the token was issued.
- jti (JWT ID): A unique identifier for token, useful for detecting replay attacks (i.e, ensuring the same token is not reused fraudulently).
- auth_time: The time the user actually authenticated.
- acr (Authentication Context Class Reference): Indicates the level of assurance of authentication. For example, it might be "0" if the user was already logged in and no fresh login was required.
- amr (Authentication Methods Reference): Lists the methods used during authentication, such as password (pwd), fingerprint (fpt), or SMS OTP (sms).

Beyond the above ones, OAuth servers may include application specific claims like groups, email, or roles.

### 2. <u>Remote token Introspection ("slow way")</u>

When an API server receives access token, one option for validation is to call back to the authorization server. This is done via a POST request to the `introspection` endpoint (defined in RFC 7662). For reference tokens, this is essentially the only way to check validity. Even with JWT access tokens, many systems still calls token introspection for consistency. 

The authorization server exposes /introspection endpoint (often discoverable via OAuth metadata). The API server authenticates itself (the spec doesn’t mandate how, so the method is up to the authorization server), then sends the token. The response includes an active: `true/false` flag, and if the token is valid, it may also return metadata such as expiration time (exp), user ID, audience, or scopes. And authorization server performs most of the heavy lifting it won’t return a token as active if it’s expired or targeted for the wrong audience, so some fields are more informational than required for validation.

This centralizes token validation and greatly simplifies the API server logic, the API doesn’t need to parse or understand the token format and just asks “is this valid?” and trusts the answer. The trade-off however, is network latency and overhead. Each validation call is network round trip, which add up in high-traffic especially in distributed systems. 

next, we’ll see faster, more scalable approache to validate tokens that avoid making a network call for every request.

### 3. <u>Local Token Validation ("fast way")</u>

Local Validation is preferred approach when performance and scalability are imp. While libraries and SDKs make this process easier, it’s useful to understand the underlying steps. First, the API server should never accept tokens with algorithm "none" (explicitly discouraged by the spec). Instead, it should only allow algorithms it’s configured to trust. Each JWT header contains key identifier (kid), which points to signing key used. The authorization server publishes its keys in metadata document (like well-known path), with jwks_uri field providing the location. By fetching this endpoint, the API server can look up the correct key to verify the token signature.

Once signature is validated, the API server must check the token claims. Core claims include iss (issuer), aud (audience), exp (expiration), and iat (issued at), while additional claims may vary depending on API requirements. If all checks pass, the token is considered valid. However, it’s important to remember that local validation only proves the token was valid at the moment it was issued. It acts like `cached snapshot of system state`for, meaning later events (like token revocation or user logout) won’t be reflected unless additional mechanisms are in place.

### 4. <u>Best of both Worlds: Using API gateway/middleware</u>
The API gateway handles all incoming traffic and performing local validation of tokens. This allows the majority of requests to be processed quickly without repeatedly calling the authorization server. However, local validation alone can’t detect revoked tokens, so, even revoked token can still pass this step.

For routine endpoints, local validation may be enough. But for critical APIs—such as financial transactions or admin operations the API can perform an extra token introspection call to confirm that the token hasn’t been revoked. This hybrid approach filters out huge volumes of traffic at the gateway while still preserving strong security controls where it matters most. Middleware frameworks can also implement the same strategy.

---

# Choosing Token lifetimes

The lifetime of an access token is an important design tool because it directly affects both performance and security. A longer token lifetime means fewer tokens need to be issued, but it also increases the no. of calls your APIs may need to make to the introspection endpoint for validation. On the other hand, shorter lifetimes reduce calls on introspection since local validation can quickly reject expired tokens.

From a security standpoint, short-lived tokens are often preferable. For ex: if an access token is valid for only one minute, even if it gets revoked or leaked, the maximum window of misuse is just that 1min. This limits the risk exposure and gives you tighter control, but it comes at the cost of needing more frequent reissuance of tokens. And system architect should be tuned to the needs.

### 1. <u>Improving User Experience with Long Token lifetimes</u>

User experience is as important as security when deciding access token lifetimes. A very short lifetime can create disruptions if users are frequently forced to auth server for new tokens. To balance this, systems often use long lived refresh tokens.

- In mobile apps, a short access token paired with longer refresh token to provide security while keeping the experience smooth.
- In single-page applications (SPA) since we cannot use refresh tokens, very short access token lifetimes can harm UX. Even if the user is already logged in, they may need to be redirected back to the OAuth server just to refresh the token, which feels disruptive, though the flow may complete quickly. 
- For browsers, the trade-off depends on the use case: shorter tokens may be acceptable when redirect happen silently in background, while longer tokens might be necessary when interaction is more visible to the user.

>Note: Access token lifetime is independent of user’s session on OAuth server. so even if user session is still valid, the token may expire, requires a fresh one.

### 2. <u>Contexually choosing token</u>
Token lifetimes can be bind contextually by the authorization server, varying based on the client, user, group, or scope. For ex: admin users may receive shorter-lived tokens to prioritize security (with enforced logins or MFA), while regular customers might get longer sessions for better UX. However, sensitive actions like checkout—can trigger issuance of a short lived scope specific token (e.g., scope=checkout valid for 1 hour), requiring reauthentication with new OAuth flow.
lo

---

# Handling Revoked or Invalidated Access Tokens

Access tokens can be revoked before their expiration, for ex: when an admin or user deactivates an account, a user revokes an app’s access, or when an authorization server invalidates tokens after a password change. Because of this, applications must always be prepared for API calls to fail, even with tokens that appear valid. If the failure is due to expiration, the app can attempt to use a refresh token, but if that also fails, the only recovery path is to prompt the user to log in again. And API server should validate tokens and avoid serving data if the token is no longer valid. 

> Note:
>
> - As we know its importannt to indentify the sensitivity of API method and get judment whether we need to call for introspection endpoint or not (to filter out revoked tokens)
> - reducing token lfetime means reducing the burden of API to worry whether or not its reponsing to revoked tokens incase of local validation.


*revocation endpoint*: OAuth 2.0 also defines a dedicated revocation endpoint, which allows apps to explicitly revoke access or refresh tokens. The exact behavior depends on the oauth server: for ex: revoking a refresh token may also cause all access tokens issued from it to be invalidated. This provides a centralized and standardized way for apps and servers to handle token invalidation securely.

---

# OAuth2.1 & Conclusion

*OAuth 2.1* is not a completely new protocol but more like cleanup of OAuth 2.0, going through years of best practices into a single modern spec. Instead of going through lot of overlapping and conflicting RFCs, OAuth 2.1 gives developers a clear starting point: use Authorization Code Flow with PKCE, avoid implicit and password flows, and follow the updated security recommendations. In other words, if you’re already following current best practices, you already know OAuth 2.1.

At the end of the day, OAuth’s goal is about making secure implementation easier and less error prone. By standardizing the proven approaches, OAuth 2.1 lowers the learning curve for new developers and provides more reliable base for building authentication and authorization systems at scale.
