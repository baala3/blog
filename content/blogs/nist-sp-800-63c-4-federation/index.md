---
title: 'NIST SP 800-63C-4: How Identity Crosses Trust Boundaries'
date: "2025-06-05T00:00:00+09:00"
url: "/blogs/nist-sp-800-63c-4-federation"
description: "A technical breakdown of NIST SP 800-63C-4's federation assurance levels, assertion security requirements, injection attack defenses, pairwise pseudonymous identifiers, and the new subscriber-controlled wallet model."
tldr: "SP 800-63C-4 defines three federation assurance levels covering bearer tokens through holder-of-key assertions, with specific requirements for trust agreements, injection defenses, and subscriber privacy. It also introduces subscriber-controlled wallets as a new federation model that removes the IdP from the assertion path entirely."
image: "https://www.cyberark.com/wp-content/uploads/2020/09/NIST-blog-hero-1.jpg"
credit: "https://pages.nist.gov/800-63-4/sp800-63c.html"
thumbnail: "https://www.entrust.com/sites/default/files/2025-03/regulatory-nist-feature-1200x628.jpg"
categories:
- Identity
- Security
- Federation
- NIST
classes:
- feature-mermaid
---

Every time a user clicks "Sign in with Google" or gets SSO'd into a third-party app from their corporate IdP, identity crosses a trust boundary. The proofing was done somewhere. The authentication happened somewhere. Now a different system needs to act on it. <!--more-->

That handoff is where a lot goes wrong. [NIST SP 800-63C-4](https://pages.nist.gov/800-63-4/sp800-63c.html) is the federation volume of the 800-63-4 suite. It defines what a trustworthy assertion looks like, what defenses are required against injection and replay attacks, what privacy protections are expected, and how the new subscriber-controlled wallet model changes the relationship between the IdP and the RP entirely.

---

**Series: NIST SP 800-63-4**
- Part 1: [SP 800-63-4 — The Framework, Assurance Levels, and Risk Management](/blogs/nist-sp-800-63-4-overview)
- Part 2: [SP 800-63A-4 — Identity Proofing and Enrollment](/blogs/nist-sp-800-63a-4-identity-proofing)
- Part 3: [SP 800-63B-4 — Authentication and Authenticator Management](/blogs/nist-sp-800-63b-4-authentication)
- **Part 4 (this blog):** SP 800-63C-4 — Federation and Assertions

---

# Why Federation Is Its Own Security Problem

The appeal of federation is real. Proof a user once at IAL2, authenticate them strongly at AAL2, and any relying party in the ecosystem can act on that with confidence. One identity, many services, no redundant enrollment.

The risk is that the handoff itself becomes the attack surface. A strong identity proofing process and a phishing-resistant authenticator accomplish nothing if the assertion conveying that authentication event can be stolen, replayed, or injected.

The threat categories in federation:

**Assertion theft.** An attacker intercepts a valid assertion in transit and uses it to establish a session at the RP before the legitimate subscriber does. Bearer tokens in URL fragments are particularly vulnerable to this: they show up in browser history, server logs, and referrer headers.

**Assertion replay.** An attacker captures a valid assertion and reuses it after the original session ends. Without replay protection (nonces, short expiry, one-time-use enforcement), a stolen assertion can be used multiple times.

**Assertion injection.** An attacker substitutes a valid assertion from one context into a different context. They may have legitimately obtained an assertion for one RP and inject it into a session at a different RP, or obtained an assertion from a previous session and inject it into a new one.

**Cross-RP tracking.** Not an attack on authentication, but a privacy violation. If every RP receives the same subject identifier for a given user, any two RPs can collude (or be breached together) and correlate that user's activity across services without their knowledge or consent.

The FAL axis in 800-63-4 is specifically about federation security. It's independent of IAL and AAL, and it only applies when a federated identity protocol is in use. If your app authenticates users directly with no assertion exchange, FAL is not relevant.

---

# Core Roles and the Federation Flow

The spec defines three roles. In practice they often collapse, but understanding them separately is useful.

**CSP (Credential Service Provider):** Collects and validates identity attributes, manages subscriber accounts, and binds authenticators. The CSP is responsible for what the subscriber's identity actually is.

**IdP (Identity Provider):** Authenticates subscribers and issues assertions to relying parties. The IdP says "this subscriber authenticated successfully, here are their attributes."

**RP (Relying Party):** Receives and validates assertions from the IdP, then grants the subscriber access based on what the assertion says.

In most commercial deployments, the CSP and IdP are the same entity. Google manages your identity (CSP) and also issues assertions to apps you sign into with Google (IdP). Your corporate Okta or Entra tenant does the same.

```mermaid
sequenceDiagram
    actor S as Subscriber
    participant CSP
    participant IdP
    participant RP

    CSP->>IdP: Provisions subscriber account
    S->>IdP: (1) Authenticate
    IdP->>RP: (2) Issue signed assertion
    RP->>RP: (3) Validate assertion
    RP->>S: Provision session
```

For [SAML](/blogs/introduction-to-saml) flows, the assertion is a signed XML document passed through the browser. For [OIDC](/blogs/oauth2-nuts-and-bolts-p1), it's a signed JWT (the ID token), typically retrieved via a back-channel token endpoint after an authorization code exchange. The mechanics differ; the trust model is the same.

---

# Federation Assurance Levels

**FAL1: Basic protection.** Bearer assertions are acceptable. A single assertion can be used by multiple RPs. Trust between IdP and RP can be established dynamically (at the time of the first interaction) or through a pre-existing agreement.

**FAL2: High protection.** Each assertion must be bound to a single RP: the assertion is useless to any other RP even if stolen. Strong injection attack prevention is required. Pre-established trust agreements are mandatory (no dynamic trust). Manual identifier and key setup is recommended over dynamic discovery.

**FAL3: Maximum protection.** The subscriber must prove possession of a key at assertion time, not just present a bearer token. This is holder-of-key: the RP doesn't just trust that the IdP vouches for the subscriber, it requires the subscriber to demonstrate they hold a specific cryptographic key that the assertion was bound to. Pre-established trust and manual key establishment are required.

| | FAL1 | FAL2 | FAL3 |
|---|---|---|---|
| Assertion type | Bearer | Bearer, single-RP | Holder-of-key |
| Injection prevention | Basic | Strong (required) | Strong (required) |
| Trust agreement | Dynamic or pre-established | Pre-established | Pre-established |
| Identifier/key setup | Dynamic or manual | Dynamic or manual | Manual (required) |
| Subscriber key proof | Not required | Not required | Required |

**How this maps to OIDC in practice:**

FAL1 corresponds to basic OIDC with an authorization code flow: you get an ID token, you validate the signature, you trust the claims. Most "Sign in with X" integrations are here.

FAL2 corresponds to OIDC with proper `nonce` and `state` parameter handling, audience restriction enforced, short token lifetimes, and a pre-registered client. The `nonce` binds the token to the specific authentication request; `state` protects against CSRF; audience restriction ensures the token is only valid for your client ID.

FAL3 corresponds to OIDC with [DPoP](https://datatracker.ietf.org/doc/html/rfc9449) (Demonstrating Proof of Possession) or mutual TLS ([RFC 8705](https://datatracker.ietf.org/doc/html/rfc8705)), where the access or ID token is cryptographically bound to a client key and the client must prove possession of that key on every request.

---

# Trust Agreements

A trust agreement is the documented basis for a federation relationship. At FAL2 and FAL3, these are required. At FAL1, they can be established dynamically.

A trust agreement must cover:

- The rights and responsibilities of each party
- Vetting practices for all parties in the federation
- The xALs that assertions in this federation may claim
- What subscriber attributes can be requested and under what conditions
- How data must be handled, retained, and deleted
- Redress mechanisms and dispute resolution procedures
- Key management: how signing keys are established, rotated, and revoked

One normative requirement that's easy to miss: the terms of the trust agreement must be made available to subscribers in clear and understandable language. This is a normative requirement, not a best practice, and it affects how you document the federation relationship to end users.

**Bilateral agreements** are direct between an IdP and an RP. Most enterprise OIDC integrations work this way: you register a client in Okta or Entra, agree to their terms of service, and that constitutes the agreement (often implicitly).

**Multilateral agreements** are managed through a federation authority: a third party that vets IdPs and RPs, establishes common rules, and maintains a trust registry. Government identity federations (like those built on SAML metadata aggregates in higher education) are the most common example.

One thing worth naming: most commercial OIDC integrations are implicit bilateral agreements with no documented terms beyond the IdP's ToS. That's fine for FAL1. It's not compliant at FAL2, which requires a pre-established agreement that covers the items above. If you're building a government service or a high-assurance B2B integration and targeting FAL2, you need an actual agreement, not just a registered OAuth client.

---

# Assertion Security Requirements

Every assertion must be cryptographically signed (using a digital signature) or protected with a message authentication code (MAC). The IdP's signing key must be managed securely; federal agencies must use [FIPS 140](https://csrc.nist.gov/publications/detail/fips/140/3/final) validated cryptographic modules.

**Required assertion contents:**

- Subject identifier (who this assertion is about)
- Audience (which RP this assertion is for)
- Issuer (which IdP issued it)
- Expiry time (when it becomes invalid)
- Authentication event (when and how the subscriber authenticated)
- Assurance levels claimed (IAL, AAL, and optionally FAL)

The audience field is not optional at FAL2+. An assertion that doesn't specify an audience can be taken from one RP and used at another. Validating the audience claim is the RP's responsibility: if the `aud` claim in the JWT doesn't match your client ID, reject the token. Accepting any validly signed token from a trusted IdP regardless of audience is a common misconfiguration.

**Replay protection:**

At FAL1, basic expiry is sufficient. At FAL2 and above, assertions must be one-time-use or include nonces that bind the assertion to a specific authentication request. Short validity windows (minutes, not hours) reduce the replay window. If the IdP issues a token with a 24-hour expiry and no one-time-use constraint, a stolen token can be replayed for hours.

**xAL reporting:**

The IdP must always indicate the resulting IAL, AAL, and FAL in the assertion for every transaction, even when the RP's requested minimums weren't met. The RP must determine the minimum xALs it will accept and check every assertion against those minimums before granting access. RPs can vary what functionality they expose based on the xALs in a specific transaction. This makes xAL a per-transaction signal, not just an account-level configuration.

**Key storage:**

All signing keys, decryption keys, and symmetric keys must be stored securely. Symmetric keys used in a federation relationship must be unique to the pair of participants: the same key must not be shared across different federation relationships. Domain names and URIs used in federation must not use wildcards. A wildcard expands the effective scope of the trust relationship to any subdomain, which can include subdomains you don't control.

---

# Injection Attack Defenses

Assertion injection is distinct from assertion theft. Theft means someone takes your token. Injection means someone uses a token from one context in a different context, often a token they legitimately obtained for one RP being used at another.

## Why the Implicit Flow Is the Problem

In the [OAuth 2.0](/blogs/oauth2-nuts-and-bolts-p2) implicit flow, the access token or ID token is returned directly in the URL fragment after authorization. This means:

- The token appears in the browser's address bar
- It's stored in browser history
- It may appear in server logs if the fragment leaks via referrer headers
- It can be extracted by JavaScript on the page

The authorization code flow avoids this: the browser receives a short-lived, single-use authorization code, which is exchanged for tokens via a back-channel POST to the token endpoint. The tokens never appear in the URL. The implicit flow is effectively deprecated in [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics) and is not a valid path to FAL2.

```mermaid
sequenceDiagram
    actor S as Subscriber
    participant B as Browser
    participant RP
    participant IdP

    Note over B,IdP: Authorization Code Flow (FAL2-safe)
    S->>B: Visit RP
    B->>IdP: Authorization request (state, nonce, code_challenge)
    S->>IdP: Authenticate
    IdP->>B: Redirect with authorization code (not a token)
    B->>RP: Authorization code
    RP->>IdP: Exchange code for tokens (back-channel POST)
    IdP->>RP: ID token + access token (never in browser)
    RP->>S: Session established
```

## PKCE

For public clients (mobile apps, SPAs) that can't keep a client secret, [PKCE](https://datatracker.ietf.org/doc/html/rfc7636) (Proof Key for Code Exchange) prevents authorization code injection. The client generates a random `code_verifier`, hashes it to a `code_challenge`, includes the challenge in the authorization request, and proves knowledge of the verifier when exchanging the code for tokens. An attacker who intercepts the code can't use it without the verifier.

## Required Controls at FAL2+

To meet FAL2 injection prevention requirements, the RP must:

- Use the authorization code flow (not implicit)
- Use PKCE for public clients
- Include a `nonce` in the authorization request and verify it matches in the ID token
- Use and validate `state` to bind the authorization response to the original request
- Enforce audience restriction on all tokens
- Use short token lifetimes with one-time-use enforcement where possible

These aren't new ideas. They're documented in the [OAuth security BCP](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics) and standard OIDC implementation guidance. The spec formalizes them as requirements at FAL2.

---

# Privacy: Pairwise Pseudonymous Identifiers

If every RP receives the same `sub` claim for a given user, two RPs can trivially correlate activity for that user. They don't need to coordinate: both see `sub: abc123`, and they know that's the same person. This is true even if the user never intended to link their accounts at those two services.

At scale, a large IdP issuing consistent subject identifiers across thousands of RPs creates a detailed cross-service profile of every user's activity, available to anyone who can get the data.

Pairwise pseudonymous identifiers solve this. The IdP generates a different `sub` value for each (subscriber, RP) pair, derived deterministically so it's consistent across sessions but unique across RPs.

```mermaid
graph TD
    IdP["IdP (knows real identity)"]
    S["Subscriber: Bala"]
    A["RP-A\nsub: x7k2p"]
    B["RP-B\nsub: m3q9r"]

    IdP -->|derives pairwise sub| S
    S -->|asserts sub: x7k2p| A
    S -->|asserts sub: m3q9r| B
    A -. "cannot correlate" .- B
```

RP-A and RP-B each see a different identifier for the same subscriber. They can't correlate the two without the IdP's cooperation.

**When pairwise identifiers are required:** The spec requires pairwise identifiers when the IdP knows the RP doesn't need a globally unique identifier and where the privacy risk of pairwise-correlation is significant. At FAL2 and FAL3, the privacy controls are stronger and pairwise identifiers are the expected default unless there's a documented reason for global identifiers.

**Shared PPIs** are permitted, but only under specific conditions: the trust agreement must stipulate it, an authorized party must consent, the RPs must have a demonstrable relationship that justifies correlating subscriber activity, and all RPs in the set must consent. You can't informally share identifiers across RPs. Federated identifiers more broadly must not contain plaintext personal information (email addresses, usernames, employee numbers). At FAL2 and above this is a hard requirement, not a recommendation.

**Ephemeral identifiers** go further: a new `sub` value is generated per session. These provide maximum unlinkability but break any RP-side functionality that depends on recognizing a returning user.

**Attribute minimization** is the other side of the privacy requirement. The IdP must only release attributes that the RP actually needs, and at FAL2+, runtime consent is required for attribute release. If a user is logging into a service that only needs their email address, the IdP shouldn't be releasing their name, phone number, and address in the same token. The RP's registered scope should reflect its actual needs.

**Permitted uses for subscriber data.** The IdP may only transmit subscriber information for:

- Identity proofing, authentication, or attribute assertion purposes
- A specific request from the subscriber
- Fraud mitigation related to the identity service itself
- Security incident response

The IdP must not make consent for additional data processing a condition of using the identity service. You can't bundle "agree to let us sell your data" into the authentication flow.

**Federal agency obligations.** Agencies acting as an IdP or RP must consult their Senior Agency Official for Privacy on Privacy Act applicability, publish a System of Records Notice (SORN) if the Privacy Act applies, consult the Senior Agency Official for Privacy on E-Government Act applicability, and publish a Privacy Impact Assessment (PIA) if required. These aren't suggestions: the spec makes them normative for federal systems. If you're building a government identity service, the privacy compliance work isn't separate from the technical implementation.

---

# Subscriber-Controlled Wallets

The traditional federation model has a structural privacy problem: the IdP knows every time a subscriber visits an RP. The assertion flow goes through the IdP at every login. Even with pairwise identifiers, the IdP can build a complete picture of where each subscriber goes and when.

The subscriber-controlled wallet model breaks this. Instead of the IdP issuing a live assertion at login time, the CSP issues signed credential bundles directly to the subscriber at enrollment time. The subscriber's wallet holds these credentials. When an RP needs identity attributes, the subscriber presents the relevant credentials directly, and the RP verifies the CSP's signature. The IdP is not in the loop at all.

```mermaid
sequenceDiagram
    participant CSP
    actor W as Subscriber Wallet
    participant RP

    Note over CSP,W: Enrollment
    CSP->>W: Issue signed attribute bundle (with verification keys)

    Note over W,RP: Login (IdP not involved)
    W->>RP: Present credential
    RP->>RP: Verify CSP signature
    RP->>W: Grant access
```

The privacy benefit is significant. The CSP doesn't know which RPs the subscriber visits after issuing the credential. The RP can verify the credential's authenticity without contacting the IdP. The subscriber decides what to disclose and to whom at presentation time.

**Attribute bundles vs. assertions.** There's a structural difference between what a CSP issues to a wallet and what a general-purpose IdP issues. Attribute bundles from the CSP contain verification keys: the RP uses those keys to verify the credential was issued by that CSP. General-purpose IdP assertions don't include CSP-originated verification keys. The wallet software may itself act as an RP to an external IdP in some configurations (acting as a proxy), but the core point is that the CSP is out of the real-time authentication path.

**Key storage for FAL3 wallets.** Signing keys must be stored in hardware that prohibits key export: a secure element, TEE (Trusted Execution Environment), or TPM (Trusted Platform Module) that is separate from the host processor and cannot be reprogrammed by the host to extract keys. This requirement exists because if the wallet device is compromised and the key storage isn't properly isolated, the attacker may have the credentials.

**Current standards alignment.** The wallet model in 800-63-4 aligns with [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) and [ISO/IEC 18013-5](https://www.iso.org/standard/69084.html) (the mdoc format used for mobile driver's licenses). These are live standards with real implementations: Apple Wallet and Google Wallet both support mdoc-format IDs in some jurisdictions.

**The trade-offs are real.** Credential revocation is harder without a live IdP in the path. In traditional federation, the IdP can refuse to issue a new assertion for a suspended account immediately. With a wallet, the credential is already issued and sitting in the subscriber's wallet. Revocation requires either short-lived credentials (the subscriber re-fetches frequently), a revocation registry the RP checks, or accepting that revocation has a lag. None of these are as clean as the IdP just not issuing an assertion.

Wallet security is also a new problem surface. If the subscriber's wallet is compromised, the attacker has the credentials. Whereas in traditional federation, compromising the subscriber's device doesn't directly give the attacker the IdP's signing key.

This model is promising, but it's early. The spec treats it as a first-class option, not an experimental path, which is a meaningful signal about where identity is heading.

---

# Proxied Federation

A federation proxy sits in the middle of a federation relationship, acting as an RP to an upstream IdP and as an IdP to one or more downstream RPs.

```mermaid
sequenceDiagram
    actor S as Subscriber
    participant RP as Downstream RP
    participant P as Proxy
    participant IdP as Upstream IdP

    S->>RP: Access request
    RP->>P: Forward auth request (Proxy acts as IdP)
    P->>IdP: Auth request (Proxy acts as RP)
    S->>IdP: Authenticate
    IdP->>P: Upstream assertion
    P->>RP: New proxy assertion (issuer = Proxy)
    RP->>S: Session established
```

Common use cases:

- **B2B federation:** A SaaS product needs to accept logins from dozens of enterprise customer IdPs. Running direct federation with each one is operationally expensive. A proxy consolidates the upstream relationships.
- **Multi-tenant SaaS:** The proxy routes authentication to the correct tenant IdP based on the subscriber's domain.
- **Legacy bridging:** An older SAML IdP needs to be accessible to OIDC-only RPs. A proxy translates between protocols.

**Assertion handling options** in a proxy:

- Create a new assertion with no upstream information (full blinding)
- Copy upstream attributes into the proxy assertion
- Include the entire upstream assertion within the proxy assertion

**Blinding** is an optional privacy property. The proxy can hide the downstream RP's identity from the upstream IdP (RP blinding), or hide the upstream IdP's identity from the downstream RP (IdP blinding). RP blinding has a strong privacy rationale: the upstream IdP (a corporate SSO) shouldn't necessarily know which third-party services the employee uses.

**FAL propagation rule:** The FAL of the connection between the proxy and the downstream RP is the lowest FAL along the entire path. If any segment is FAL1, the downstream RP gets FAL1, regardless of what the upstream segment provides. The federated identifier in the proxy's assertion must indicate the proxy as the issuer.

A proxy that strips nonces, relaxes audience restrictions, or converts a back-channel token exchange into a front-channel redirect is reducing the effective FAL without the RP knowing.

If you're using a proxy and targeting FAL2, verify that the proxy explicitly maintains FAL2 properties through the translation. Most general-purpose identity brokers don't advertise this and may not guarantee it.

---

# RP Subscriber Account Lifecycle

The RP's subscriber account is separate from the IdP's subscriber account. They have independent lifecycles, and this creates operational problems that are easy to ignore until they cause an incident.

**Account states** the spec defines:

- **Provisioned:** Attributes associated with an RP data record. May happen before or after first authentication.
- **Available:** Bound to federated identifiers or accessible through the account resolution process.
- **Disabled:** No access permitted, but information is retained for records or investigation purposes.
- **Terminated:** All access removed, including all federated identifiers, bound authenticators, and attributes.

```mermaid
stateDiagram-v2
    [*] --> Provisioned: Attributes associated with RP record
    Provisioned --> Available: Bound to federated identifier
    Available --> Disabled: Access suspended (data retained)
    Disabled --> Available: Access restored
    Available --> Terminated: All identifiers and attributes removed
    Disabled --> Terminated: All identifiers and attributes removed
    Terminated --> [*]
```

**Linking:** When a subscriber first authenticates to an RP via federation, the RP creates a local account and links it to the federated identifier (typically the pairwise `sub` and the IdP issuer). Subsequent logins resolve to the same local account via this link. A single RP account may be associated with more than one federated identifier, but all linking operations require an authenticated session.

**Account resolution:** When a subscriber presents credentials without a federated identifier (the wallet case), the RP must resolve the subscriber from attributes alone. The spec requires that the attributes be sufficient to uniquely resolve the subscriber, and the design must prevent attributing the presentation to the wrong account.

**Provisioning and deprovisioning:** The RP may need to create resources, assign permissions, or set defaults when a new federated account is first seen. Deprovisioning is the harder problem. If a subscriber's account is terminated at the IdP, the RP may not find out until the next attempted login fails. Where provisioning APIs are in use, the IdP must use that API to deprovision RP subscriber accounts when the subscriber account is terminated (except where regulation or retention requirements prevent it).

SCIM (System for Cross-domain Identity Management) is the standard protocol for proactive provisioning and deprovisioning across federation boundaries. Without it, RPs are in a reactive posture: they only learn about account terminations when authentication fails. With it, the IdP can push deprovisioning events in real time.

**Identifier conflicts:** When the same subscriber tries to link a second IdP to an existing account, or when an identifier previously used by one subscriber is reused for a different one (rare but possible with pairwise identifiers if the derivation scheme changes), the RP needs a defined policy for how to handle the conflict. The spec requires that RPs have documented procedures for these cases.

**Subscriber notice:** The RP must notify subscribers of significant changes to their federated account, including account linking, attribute changes that affect access, and account termination. The notice requirement applies even when the change originates at the IdP.

---

# Requesting and Validating xALs

The trust agreement defines the xALs a federation relationship supports. But at runtime, an RP may need to enforce a minimum for a specific transaction.

The spec requires IdPs to support a mechanism for RPs to specify minimum acceptable xALs as part of the trust agreement. At runtime, the IdP should support the RP specifying a stricter minimum. If the IdP can fulfill the request, it should. If it can't, it should fail rather than issue an assertion that doesn't meet the requested minimum.

The IdP must always indicate the resulting xAL in the assertion for every transaction, even when the request wasn't met. This means the RP can't just trust that the IdP honored its request: it must inspect the xAL claims in the assertion and reject the transaction if the levels don't meet its minimums. An assertion with `acr: aal1` when you required AAL2 is a failed transaction, not a degraded one.

RPs may vary the functionality they expose based on the xALs in a specific transaction. A service could allow read-only access at AAL1 but require AAL2 for writes. This requires checking xAL claims on each request, not just at session establishment.

---

# Concluding the Series

The four volumes of 800-63-4 form a chain. Identity proofing (63A) establishes who the subscriber is. Authentication (63B) establishes that the person authenticating now is the same subscriber. Federation (63C) conveys that authentication event to a relying party securely and with appropriate privacy protections.

A failure at any point in the chain undermines the whole thing. Strong authentication doesn't help if the identity was never properly proofed. Strong proofing and authentication don't help if the assertion conveying them can be injected or replayed. And all three are undermined if the federation layer leaks subscriber behavior across RPs without their knowledge.

The framework's value is making these tradeoffs explicit and putting them in the same decision process. When you pick IAL2 + AAL2 + FAL2 for a service, you've made a documented risk decision that you can revisit when the threat model changes. That's a better position than "we have MFA and SSO, so we're fine."
