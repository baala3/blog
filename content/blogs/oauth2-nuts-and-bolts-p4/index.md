---
title: 'The nuts and bolts of oauth2.0 (part4)'
date: "2023-07-20T10:52:44+09:00"
url: "/blogs/oauth2-nuts-and-bolts/oauth2-nuts-and-bolts-p4"
description: ""
tldr: ""
image: "https://i.ibb.co/dsmwGmhR/image.png"
credit: ""
thumbnail: "https://owncloud.com/wp-content/uploads/2020/10/openidconnect.png"
categories:
- Oauth
- OpenId
---

This is part4 (final) of The nuts and bolts of oauth2.0, continuing [part3](https://balashekhar-blog.netlify.app/blogs/oauth2-nuts-and-bolts/oauth2-nuts-and-bolts-p3/).

In this section, we’ll focus on OAuth from the perspective of API security. Since the application doesn't care about the format of the access token, it's now the API's job to handle it. <!--more--> Let’s explore topics like access token formats and the trade-offs involved with different token lifetimes.


Ok! let'z go..

 ## Access Token types and their Tradeoffs
 access tokens, generally comes into two categories: `reference tokens` and `structured tokens` (also called `Self-Encoded Token`). 

 #### 1. <u>Reference Tokens vs Self-Encoded Token</u>
 A reference token is essentially just a pointer or reference to information stored elsewhere. The authorization server keeps the actual data in a backend system, such as a `relational database` (with the token value acting as an ID and other fields stored in columns) or a `cache` like Memcached or Redis. The API, when presented with such a token, must call back to the authorization server or its datastore to look up the details. 
 
 And `structured token` contains the data directly inside the token itself. This data might include information such as the user identifier, the client application, issued and expiry timestamps, scopes, the issuing authorization server, and even metadata like the user’s last login. The authorization server takes this data, encodes it (commonly in a JWT format), and then either signs or encrypts it. That way, the resource server can validate and trust the token without making a network call back to the authorization server. There is also spec for using JWT as access tokens ([RFC 9068](https://datatracker.ietf.org/doc/html/rfc9068)), which defines how to structure them so that APIs can consume and validate them, while still treating them as opaque to client app.

#### 2. <u>Pros and Cons of Reference Tokens</u> 

*Pros of Reference Tokens*
- Simple and easy to build.
- Easy revocation, just delete the token from the database.
- Tokens are opaque, so apps, APIs, or developers cannot see sensitive data.

*Cons of Reference Tokens*
- Tokens must be stored and managed.
- Expired tokens can remain in the database, leading to clutter.
- API servers must call back for token verification, which doesn’t scale well since all servers depend on a central DB or service.

**Note:** To address verification overhead, authorization servers often provide a `token introspection endpoint` so that APIs can validate tokens over HTTP instead of directly accessing the database.

#### 3. <u>Pros and Cons of Self-Encoded Token</u> 

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

## JWT Access Tokens

#### 1. <u>Structure of a JWT access token</u>

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

#### 2. <u>Remote token Introspection ("slow way")</u>

When an API server receives access token, one option for validation is to call back to the authorization server. This is done via a POST request to the `introspection` endpoint (defined in RFC 7662). For reference tokens, this is essentially the only way to check validity. Even with JWT access tokens, many systems still calls token introspection for consistency. 

The authorization server exposes /introspection endpoint (often discoverable via OAuth metadata). The API server authenticates itself (the spec doesn’t mandate how, so the method is up to the authorization server), then sends the token. The response includes an active: `true/false` flag, and if the token is valid, it may also return metadata such as expiration time (exp), user ID, audience, or scopes. And authorization server performs most of the heavy lifting it won’t return a token as active if it’s expired or targeted for the wrong audience, so some fields are more informational than required for validation.

This centralizes token validation and greatly simplifies the API server logic, the API doesn’t need to parse or understand the token format and just asks “is this valid?” and trusts the answer. The trade-off however, is network latency and overhead. Each validation call is network round trip, which add up in high-traffic especially in distributed systems. 

next, we’ll see faster, more scalable approache to validate tokens that avoid making a network call for every request.

#### 3. <u>Local Token Validation ("fast way")</u>

Local Validation is preferred approach when performance and scalability are imp. While libraries and SDKs make this process easier, it’s useful to understand the underlying steps. First, the API server should never accept tokens with algorithm "none" (explicitly discouraged by the spec). Instead, it should only allow algorithms it’s configured to trust. Each JWT header contains key identifier (kid), which points to signing key used. The authorization server publishes its keys in metadata document (like well-known path), with jwks_uri field providing the location. By fetching this endpoint, the API server can look up the correct key to verify the token signature.

Once signature is validated, the API server must check the token claims. Core claims include iss (issuer), aud (audience), exp (expiration), and iat (issued at), while additional claims may vary depending on API requirements. If all checks pass, the token is considered valid. However, it’s important to remember that local validation only proves the token was valid at the moment it was issued. It acts like `cached snapshot of system state`for, meaning later events (like token revocation or user logout) won’t be reflected unless additional mechanisms are in place.

#### 4. <u>Best of both Worlds: Using API gateway/middleware</u>
The API gateway handles all incoming traffic and performing local validation of tokens. This allows the majority of requests to be processed quickly without repeatedly calling the authorization server. However, local validation alone can’t detect revoked tokens, so, even revoked token can still pass this step.

For routine endpoints, local validation may be enough. But for critical APIs—such as financial transactions or admin operations the API can perform an extra token introspection call to confirm that the token hasn’t been revoked. This hybrid approach filters out huge volumes of traffic at the gateway while still preserving strong security controls where it matters most. Middleware frameworks can also implement the same strategy.

---

## Choosing Token lifetimes

The lifetime of an access token is an important design tool because it directly affects both performance and security. A longer token lifetime means fewer tokens need to be issued, but it also increases the no. of calls your APIs may need to make to the introspection endpoint for validation. On the other hand, shorter lifetimes reduce calls on introspection since local validation can quickly reject expired tokens.

From a security standpoint, short-lived tokens are often preferable. For ex: if an access token is valid for only one minute, even if it gets revoked or leaked, the maximum window of misuse is just that 1min. This limits the risk exposure and gives you tighter control, but it comes at the cost of needing more frequent reissuance of tokens. And system architect should be tuned to the needs.

#### 1. <u>Improving User Experience with Long Token lifetimes</u>

User experience is as important as security when deciding access token lifetimes. A very short lifetime can create disruptions if users are frequently forced to auth server for new tokens. To balance this, systems often use long lived refresh tokens.

- In mobile apps, a short access token paired with longer refresh token to provide security while keeping the experience smooth.
- In single-page applications (SPA) since we cannot use refresh tokens, very short access token lifetimes can harm UX. Even if the user is already logged in, they may need to be redirected back to the OAuth server just to refresh the token, which feels disruptive, though the flow may complete quickly. 
- For browsers, the trade-off depends on the use case: shorter tokens may be acceptable when redirect happen silently in background, while longer tokens might be necessary when interaction is more visible to the user.

*note*: access token lifetime is independent of user’s session on OAuth server. so even if user session is still valid, the token may expire, requires a fresh one.

#### 2. <u>Contexually choosing token</u>
Token lifetimes can be bind contextually by the authorization server, varying based on the client, user, group, or scope. For ex: admin users may receive shorter-lived tokens to prioritize security (with enforced logins or MFA), while regular customers might get longer sessions for better UX. However, sensitive actions like checkout—can trigger issuance of a short lived scope specific token (e.g., scope=checkout valid for 1 hour), requiring reauthentication with new OAuth flow.
lo

---

## Handling Revoked or Invalidated Access Tokens

Access tokens can be revoked before their expiration, for ex: when an admin or user deactivates an account, a user revokes an app’s access, or when an authorization server invalidates tokens after a password change. Because of this, applications must always be prepared for API calls to fail, even with tokens that appear valid. If the failure is due to expiration, the app can attempt to use a refresh token, but if that also fails, the only recovery path is to prompt the user to log in again. And API server should validate tokens and avoid serving data if the token is no longer valid. 

*note:*
- and as we know its importannt to indentify the sensitivity of API method and get judment whether we need to call for introspection endpoint or not (to filter out revoked tokens)
- reducing token lfetime means reducing the burden of API to worry whether or not its reponsing to revoked tokens incase of local validation.


*revocation endpoint*: OAuth 2.0 also defines a dedicated revocation endpoint, which allows apps to explicitly revoke access or refresh tokens. The exact behavior depends on the oauth server: for ex: revoking a refresh token may also cause all access tokens issued from it to be invalidated. This provides a centralized and standardized way for apps and servers to handle token invalidation securely.

---

## OAuth2.1 & Conclusion

*OAuth 2.1* is not a completely new protocol but more like cleanup of OAuth 2.0, going through years of best practices into a single modern spec. Instead of going through lot of overlapping and conflicting RFCs, OAuth 2.1 gives developers a clear starting point: use Authorization Code Flow with PKCE, avoid implicit and password flows, and follow the updated security recommendations. In other words, if you’re already following current best practices, you already know OAuth 2.1.

At the end of the day, OAuth’s evolution is about making secure implementation easier and less error prone. By standardizing the proven approaches, OAuth 2.1 lowers the learning curve for new developers and provides more reliable foundation for building authentication and authorization systems at scale.
