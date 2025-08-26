---
title: 'The nuts and bolts of oauth2.0 (part3)'
date: "2023-06-15T10:52:44+09:00"
url: "/blogs/oauth2-nuts-and-bolts/oauth2-nuts-and-bolts-p3"
description: ""
tldr: ""
image: "https://i.ibb.co/dsmwGmhR/image.png"
credit: ""
thumbnail: "https://owncloud.com/wp-content/uploads/2020/10/openidconnect.png"
categories:
- Oauth
- OpenId
---

This is part3 of The nuts and bolts of oauth2.0, continuing [part2](https://balashekhar-blog.netlify.app/blogs/oauth2-nuts-and-bolts/oauth2-nuts-and-bolts-p2/). In this section we will check out client credentials flow, Oauth scopes, and a bit of introduction to OpenID Connect.

Ok! let'z go..

 <!--more-->

## What is Client Credentials flow and when to use it?

This flow is much simpler compared to authorization code, since there’s no user involved at all. 
The app just exchanges its own credentials (`client_id` and `client_secre`) with the auth server to get an `access token`, and then uses that token to call APIs. You might thing, why not let API server just accept credentials directly? The idea is that the API server shouldn’t care about who the caller is, it should only focus on validating an access token and responding. It’s the auth server’s job to handle the credential exchange and issue tokens.

Typical use cases of this flow include machine-to-machine communication (like one backend service talking to another), or when an app needs credentials to call special endpoints such as the `token introspection` API. In such cases, client credentials act like a service account that represents the app itself rather than an individual user.

**Client Credentials Flow**

first, the app gets registered in auth server (usually as `machine-to-machine` or `service account` type). When the app needs an access token, it sends a request with `grant_type=client_credentials` and the required scope. The auth server returns an access token, and that’s it.

Since there’s no user in picture here, there’s no concept of refresh tokens. Whenever the app needs a new token, it just repeats the same request with credentials.

---

## OAuth Scopes

Scopes can be little confusing because OAuth spec doesn’t strictly define them. At high level, scopes are just a way for an app to request limited access instead of full control. For ex: scope like read might only let the app fetch data, but not modify it. During the OAuth flow, the app explicitly asks for these scopes, and the access token it receives will only be valid for those permissions.

**Common Misconception**

Sometimes people assume scopes can handle all types of user access control like separating consumer users from admin users, or managing roles, groups, and permissions. That’s not really what scopes are for. OAuth scopes are more about limiting what an app can do with a user’s account, not defining user roles. For role based stuff (like “admin can upload photos, consumer can only view”), you still need separate concepts like permissions, groups, or RBAC outside of OAuth itself.

#### 1. <u>How to Define Scopes</u>

OAuth itself doesn’t tell you how to define scopes. To OAuth, scopes are just strings that flow through the protocol. The meaning of those strings is entirely up to service provider.

A good way is to look at how big services do it. For ex: GitHub defines scopes like `repo:invite`, `repo:read`, `repo:write`. Others use URL fomated scopes like `example/scope/read`. What really matters is that once you define them, you also document them clearly so developers know what each scope means.

For smaller apps, scopes can be very high-level (e.g: just `read` and `write`). But in larger systems like Google’s ecosystem, scopes are broken down per service (YouTube, Gmail, Drive, etc.), since those APIs are segmented and don’t directly depend on each other.

Scopes can also play a role in things like `user consent` clarity, chaining access across services, or even billing APIs. So defining them in a way that’s secure, meaningful, and developer friendly is very imp thing.

#### 2. <u>Prompting User for Consent Screen</u>

The consent screen is best place to show users what scopes mean and what access the app is requesting. But explaining scopes directly is tough as users don’t understand `repo:write` or `profile.read`. That’s why it’s important for your OAuth server to support a `display phrase` or `friendly description` for each scope (something like “Allow this app to update your repositories”).

The goal is to inform users clearly but concisely, without overwhelming them. This step is especially important for third-party apps, since users need to make an informed choice before granting access.

Even for public clients (like SPAs or native apps), showing a consent screen is recommended as these apps don’t have a client secret, meaning anyone could impersonate your app.

---

## Introduction to OpenID Connect

While OAuth is all about apps getting access to APIs, OpenID Connect (OIDC) focuses on sharing user identity information with the app.

The main addition OIDC brings on top of OAuth is the **ID Token**.

- The access token can be in any format and is used to call APIs.
- The ID token, however, is a **JWT** specifically meant for apps to understand *who the user is*.

This makes OIDC the standard way to handle authentication (who the user is), while OAuth alone is about authorization (what the app can do).


#### 1. <u>Format of an ID Token in OpenID Connect</u>

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



#### 2. <u>Access Token vs ID Token</u>

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

#### 3. <u>Getting an ID Token</u>

An application can obtain an ID token in a few different ways. 

In the standard OAuth authorization code flow, simply adding the `openid` scope ensures that when the app exchanges the authorization code for an access token, it also receives an `ID token`. Since this exchange happens on a trusted back-channel, the app doesn’t need to perform JWT validation just to prove delivery, it comes from the authorization server directly. 

However, there is also another way: by requesting `response_type=id_token`, the app can receive the ID token directly in the front channel, similar to `OAuth implicit flow`. While this method does carry risks, ID tokens are always JWTs and signed, so the app can validate them properly. Still, it’s generally safer to use the auth code flow. 

It’s also worth noting that when using the `openid` scope flow, the ID token often contains only minimal information, usually just the sub claim. To request more user details, OpenID Connect defines extra scopes such as `profile`, `email`, `address`, and `phone`. And in some cases, even these details aren’t fully included in the ID token itself, app must call the `/userinfo` endpoint with the `access token` to retrieve them. 

Also with `response_type=id_token`, while apps can validate the token, the authorization server can’t always guarantee that the token reached the correct audience. Since ID tokens don’t provide access by themselves, this may not be a huge risk, but if sensitive information is being added in them, the safer approach is to stick with the auth code flow so that data is always delivered through the back-channel.


#### 4. <u>Hybrid OpenID Connect flows</u>
Till now, we’ve seen `response_type=code` (the standard authorization code flow) and `response_type=id_token` (directly receiving the ID token in the front channel). OpenID Connect also allows combining them, for ex: `response_type=code+id_token`, which delivers the access token via back channel, ID token via front channel. There’s also `response_type=token+id_token`, a legacy OAuth implicit flow. While OpenID Connect provides mechanisms to prevent access token injection attacks in this case, it is generally discouraged because access tokens should always be delivered through the back channel for better security.

That leaves us with two main approaches: `code`, `id_token` and `code+id_token`. In the `code+id_token` flow, the ID token is returned right away for the application to use, along with a special claim called `c_hash`, which is a hash of the authorization code. The app must validate this carefully to ensure the authorization code hasn’t been tampered with, otherwise it risks `auth code injection` attacks. From the authorization server’s POV, PKCE is the main protection way against these attacks, but in this hybrid flow every client implementation still needs to correctly validate the `c_hash` and the `ID token`. Because of this complexity, the spec recommends that both public and confidential clients stick to the authorization code flow with PKCE to obtain ID and access tokens. This keeps things simpler, pushes the security burden onto the authorization server, and avoids requiring every app to handle advanced token validation logic on its own.

#### 5. <u>Validating and using ID tokens</u>

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

That’s all from part3… see yaa 👋
