---
title: 'OpenID TechNight vol.23 ~ AI x API x Enterprise'
date: "2026-05-27T23:22:24+09:00"
url: "/blogs/openid-tech-night-vol23"
description: "OpenID TechNight vol.23 recap: enterprise MCP authorization limits, freee remote MCP rollout, and Cross App Access / ID-JAG for consent-free AI access."
tldr: "AI is forcing enterprise identity systems to rethink authorization boundaries, delegation models, workload identities, and consent handling."
image: "https://media.connpass.com/thumbs/92/48/92485717a8147b2c86eaffe5501e6653.png"
credit: ""
thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_kobviZWJwzmdgO9Btmtvaha-4AWNR-IqzRECUa4Hr3Zw=s900-c-k-c0x00ffffff-no-rj"
categories:
- OpenID
- AI
- Security
---

Enterprise IAM has one assumption baked into it: whoever's on the other end of a login is a human. AI agents break that assumption, and not with some clever new attack. They just walk straight through shortcuts we've always taken: screen-level permissions instead of API-level ones, one consent prompt per app, identity lifecycles tied to HR events instead of agent lifecycles.<!--more-->

**[OpenID TechNight vol.23 ~ AI x API x Enterprise](https://openid.connpass.com/event/391821/)**, organized by [nov-san](https://x.com/nov) of OpenID Foundation Japan, spent three talks on exactly that gap, and what different company teams are doing about it.

<iframe width="100%" height="400" src="https://www.youtube.com/embed/ZU6-lUxLtWU" title="OpenID TechNight vol.23 live recording" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

**Speakers:** Takayuki Komatsu (SoftBank), Terara (freee), Keiko Itakura (Okta Japan)

---

## Talk 1: The authorization cliff when enterprise IT rolls out MCP

slides: https://speakerdeck.com/oidfj/20260525-openid-technight-vol23-01 · Komatsu-san (SoftBank)

OAuth-based authorization landed in [MCP](https://modelcontextprotocol.io/) back in March 2025 and has already been revised twice since. The next release (targeting **July 28, 2026**) pushes it toward a more stateless design. One addition worth flagging: [RFC 9207](https://datatracker.ietf.org/doc/html/rfc9207) (Authorization Server Issuer Identification) is now recommended. MCP clients talk to a bunch of servers and IdPs at once, so without it, a client can get tricked into sending a token meant for server A to server B.

The OpenID Foundation's whitepaper (Oct 2025) recommends:

- Give AI agents their own identities, not human impersonation
- Model agent access as **delegation** of a person's authority
- Deprovision agent identities the moment they stop being used
- Keep it governed and auditable

Easy to agree with. Harder to build, because most enterprise permissions are still tied to screens, not APIs:

```text
Sales User
   ✓ Customer Screen        (legacy: UI-level grant)

vs.

read:customer
create:invoice             (needed: API-level grant)
```

A single screen usually bundles a bunch of data fields together. Mapping that to MCP scopes means breaking resources down much smaller than the system was ever built for.

Building this in practice hits four blockers:

1. **Protocol compliance.** Most enterprise IdPs speak SAML or plain OIDC, not OAuth 2.1. You can bolt on [DCR](/blogs/oauth2-dynamic-client-registration) and the metadata endpoints, but that forces a choice: a dedicated AI authorization server, or reuse the existing corporate one? Either way you're stuck with a lifecycle mismatch, since AI tooling moves in weeks while enterprise identity moves in quarters.
2. **Workload identity per agent.** Every agent needs its own identity, set up for it specifically. It's the same shadow-SaaS problem as before, just with agents instead of apps, so the fix is the same too: build the governance, win departments over as allies, soak up shadow usage over time.
3. **Permission detail.** Screen-based permissions don't map cleanly onto API scopes. The target is a Policy Decision Point (a PDP: a central service the MCP server asks "is this allowed?" at call time), moving from coarse to fine-grained control over time.
4. **Local vs. hosted MCP servers.** Local keeps credentials on-device: low risk, low reach. But shared, cross-department use needs a hosted server, and that drags the governance question right back in. There's no universal answer here, it depends on the use case.

Komatsu's fix: stand up a dedicated AI-facing authorization server, federated with (not replacing) the existing employee IdPs. Mirror today's screen-based permissions as the PDP's starting data, start read-only, and expand from there. Shadow AI tools get handled case by case, since there's no shortcut around that part.

---

## Talk 2: Local MCP → Remote MCP - the reality of authorization

slides: https://speakerdeck.com/terara/freee-mcpwo-local-remote-dechu-sitewakatuta-mcpren-ke-shi-zhuang-noriaru · Terara-san (freee)

Talk 1 looked at MCP from inside an enterprise adopting it. Talk 2 is about building a remote MCP server for other companies to connect to, so every governance question Komatsu raised is one Terara actually has to ship. freee-mcp started local for fast validation, then went remote once the idea proved out. His framing: local vs. remote isn't a maturity ladder where one beats the other, it's a trade-off in *where responsibility sits*.

```text
Local MCP:   User's machine → Local MCP server → API      (credentials stay local)
Remote MCP:  AI platform / many clients → Vendor-hosted MCP server → Vendor's APIs
```

Going remote doesn't change where the server runs, it changes who owns client trust, redirect URI validation, token boundaries, consent design, and audit. And since freee is multi-tenant B2B SaaS, that's another layer of complexity stacked on top.

Five problems came up:

1. **Client trust.** How do you trust unknown or dynamically-registered clients? Do you validate redirect URIs? What does the consent screen even show? And underneath all that: does MCP-facing auth share freee's existing third-party auth platform, or run separately?
2. **Scope detail.** Cut scopes at business-action level, not per-endpoint. An `invoice.create` MCP scope translates internally into `read:customer`, `read:tax`, `write:invoice`. Go too fine-grained and you get prompt fatigue; go too coarse and you get over-broad grants.
3. **Reuse the existing permission model.** Don't build a parallel MCP permission system. Extend the one that already handles multi-tenant, contract, and billing state, since a second source of truth is exactly how these things drift out of sync.
4. **Keep token boundaries separate.** MCP-facing and API-facing tokens shouldn't get forwarded interchangeably. Missing MCP scope means the user steps up. Missing API scope but still within the granted MCP scope means a silent, short-lived token exchange. But a clearly higher-risk action (his example: a money transfer) should always force a fresh, explicit re-authorization, never a silent one.
5. **Consent UX through the AI intermediary.** How does a remote server tell a human, through the agent, that it needs consent or step-up? Still unsolved industry-wide, and honestly, nobody in the room had a clean answer either.

The design checklist Terara actually uses:

- What capability is visible to the end user?
- What's the API's minimum required permission?
- Who's responsible when a scope turns out to be insufficient?
- Is audience restriction or token exchange happening at each hop?
- Can this be explained and audited after the fact?

---

## Talk 3: Cross App Access / ID-JAG - killing consent fatigue at the IdP

Terara's talk ended on an open problem: one global scope model can't fit clients who each want different AI policies. Keiko Itakura (Regional CSO, Okta Japan) picked up a bigger version of that same problem: how do you handle consent once one user is connected to dozens of AI tools, not just one? Her answer is [Cross App Access](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/), an IETF draft co-authored by Okta and Ping Identity.

Classic OAuth assumes a human reviews one consent screen at a time. That assumption holds up fine at human scale, but it breaks the moment agents start doing the connecting:

- **Usability collapses.** Twenty tools means twenty consent prompts, so fatigue sets in and users start clicking "Allow" without reading, the same failure mode behind MFA-fatigue attacks.
- **Governance disappears.** Every app issuing its own tokens means IT loses visibility into which AI has which data, and forgotten long-lived tokens pile up, which is especially dangerous during offboarding.

Okta's own telemetry backs this up: attacks have shifted from login itself to what happens *after*, session hijacking and **device code phishing**. Register a fake internal-looking app, get someone to approve its consent screen (it renders on the real IdP login page, so nothing looks off), and walk away with delegated access. At the scale of thousands of apps, no user can realistically spot the malicious one. That's a design problem, not a training one.

So the fix is blunt: drop the per-app consent screen. An IT admin sets policy at the IdP, and access is granted automatically once a request clears it. Enterprise data belongs to the company, not the employee, so making the employee "consent" per app was arguably the wrong model to begin with.

```text
User logs in once → ID token → IdP evaluates policy → ID-JAG → Access token → Resource
                  (only user interaction in the entire flow)
```

Three terms, cleanly separated:

- **Cross App Access** - the overall framework
- **ID-JAG** (Identity Assertion Authorization Grant) - the token/grant type itself, an extension of existing OAuth token-exchange machinery rather than something new
- **Enterprise Managed Authorization** - the same concept, framed as an official MCP spec extension

The flow:

1. **User authentication** - the client sends the user to the IdP, which returns an [ID token](/blogs/oauth2-nuts-and-bolts-p2): identity only, nothing more
2. **ID-JAG issuance** - the client exchanges that ID token for an ID-JAG scoped to a specific target resource. The IdP checks the request against admin-defined policy (requested scope isn't automatically granted scope, policy has the final say) and returns a short-lived ID-JAG that's explicitly not a bearer token
3. **Access token issuance** - the client hands that ID-JAG to the *target resource's own* authorization server, which returns a normal bearer access token
4. **Resource access** - used exactly like any other OAuth access token

### A few things worth knowing

- **It's vendor-neutral.** Cross App Access is a general spec. Okta's implementation is just one IdP's beta, and other IdPs are reportedly building support too.
- **Real momentum out of Japan.** Kii is implementing ID-JAG issuance and verification; Assured (LY/Yahoo) is implementing verification. A Hitachi pull request into Kii's implementation got shown live during the talk.
- **Three tokens exist on purpose.** The ID token is identity only. The ID-JAG is a *grant*, not a usable credential. The access token comes from the resource's own authorization server, so existing resource servers need zero new logic to support ID-JAGs.
- **Short-lived by design.** ID-JAGs live for seconds, and only the IdP may issue refresh tokens. That's specifically to stop long-lived tokens from building up under long-running background agents.
- **Revocation isn't solved by the spec itself.** It's expected to plug into existing mechanisms like Global Token Revocation.
- **Policy evaluation isn't the same as consent.** What legally counts as consent for a given dataset is a separate legal question the protocol doesn't answer.

Reference implementations exist at `crossaccess.dev`, plus an Okta GitHub repo with MCP SDK middleware (`withCrossAppAccess`).

Against classic OAuth, the differences land in three places: no per-request consent screen, grants that are signed JWT-style [federation assertions](/blogs/nist-sp-800-63c-4-federation) instead of short-lived authorization codes, and a refresh-token model that works completely differently.

---

## Takeaway

Same fault line runs through all three talks: AI agents force enterprise identity systems to separate concerns that used to be fused together, screen access vs. data access, authentication vs. delegation, "who's allowed" vs. "who's responsible."

- **Talk 1** - rolling out MCP internally means rebuilding workload identity, delegation modeling, and screen-based permissions from scratch
- **Talk 2** - hosting a remote MCP server shifts client trust, token boundaries, and consent design onto you
- **Talk 3** - Cross App Access / ID-JAG replaces per-app consent with IdP-defined policy, aimed at making delegation manageable at agent scale

None of this is fully solved yet. But the direction holds across all three: design for delegation and granular permissions first, and treat the human login flow as just one input to that, not the whole model.
