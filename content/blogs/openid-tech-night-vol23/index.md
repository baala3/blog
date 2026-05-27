---
title: 'OpenID TechNight vol.23 ~ AI x API x Enterprise'
date: "2026-05-27T23:22:24+09:00"
url: "/blogs/openid-tech-night-vol23/openid-tech-night-vol23"
description: "A summary of OpenID TechNight vol.23 covering enterprise IAM challenges for AI agents, Remote MCP production concerns, and authorization patterns for AI systems."
tldr: "AI is forcing enterprise identity systems to rethink authorization boundaries, delegation models, workload identities, and consent handling."
image: "https://media.connpass.com/thumbs/92/48/92485717a8147b2c86eaffe5501e6653.png"
credit: ""
thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_kobviZWJwzmdgO9Btmtvaha-4AWNR-IqzRECUa4Hr3Zw=s900-c-k-c0x00ffffff-no-rj"
categories:
- OpenID
- AI
---

This blog is simple summary of **[OpenID TechNight vol.23 ~ AI x API x Enterprise](https://openid.connpass.com/event/391821/)**, organized by the [nov-san](https://x.com/nov), a member of OpenID Foundation Japan. This event focused on something many teams are starting to face: AI agents are becoming consumers of enterprise APIs, but most enterprise IAM systems were designed assuming the consumer was a human.<!--more-->

For me, working in ID services, one thing I found from these talks that:

> AI is not introducing completely new authentication problems. It is exposing assumptions that many enterprise systems have been carrying for years.

The three talks:

- Enterprise ID system challenges for AI adoption
- Production challenges of Remote MCP implementations
- Scaling authorization without bursting users with consents

YouTube live here - https://www.youtube.com/live/ZU6-lUxLtWU

## Speakers

- Takayuki Komatsu - SoftBank
- Terara - freee
- Keiko Itakura - Okta Japan

## Talk 1: The "Authorization Cliff" for enterprise AI

slides: https://speakerdeck.com/oidfj/20260525-openid-technight-vol23-01

Takayuki Komatsu san's session described what happens when companies start introducing AI into their internal systems.

Today, enterprise ID systems commonly assumes:

```text
Human
   ↓
SSO/Login
   ↓
Application
```

But AI introduces:

```text
Human
   ↓
AI Agent
   ↓
Multiple APIs
```

That sounds like small change, but it creates several problems:

- Legacy IdPs often support human centric SSO patterns while AI ecosystems increasingly rely on OAuth based flows
- AI agents should not simply impersonate users
- Existing permissions are often defined around screens or UI components rather than APIs
- AI workloads run across local machines, internal infrastructure, and external SaaS platforms

For ex: Many systems still effectively have permissions like:

```text
Sales User
   ✓ Customer Screen
```

while AI needs something like:

```text
read:customer
create:invoice
```

The migration from UI permissions to API level permissions is much larger than most teams initially expect.

There are some proposed short term solutions:

- Keep existing employee IdP unchanged
- Introduce dedicated AI authorization layer
- Route AI traffic centrally
- Keep AI capabilities mostly read-only initially

---

## Talk 2: Local MCP → Remote MCP Challenges

slides: https://speakerdeck.com/terara/freee-mcpwo-local-remote-dechu-sitewakatuta-mcpren-ke-shi-zhuang-noriaru

Terara from `freee` talked about lessons learned from releasing **freee-mcp**. He mentioned that Moving from Local MCP to Remote MCP is not just moving code to server.

Local MCP feels simple:

```text
My machine
   ↓
Local MCP
   ↓
API
```

Remote MCP becomes:

```text
AI Client
   ↓
Remote MCP
   ↓
Business APIs
```

Now the service suddenly owns Client trust management, Redirect URI validation, Token boundaries, Consent design and Audit requirements.

One architectural point I liked was the distinction between:

**MCP scope**

```text
invoice.create
```

and

**API scopes**

```text
read:customer
read:tax
write:invoice
```

Users should approve business actions, while backend systems translate those actions into the API permissions actually required.

Otherwise, you either end up with too many permission prompts or overly broad permissions, and neither is desirable.

The talk also stressed about known principle of identity:

> Tokens should not freely cross security boundaries.

An MCP token intended for one system should not simply be passed downstream to every internal API.

---

## Talk 3: Solving consent fatigue

The final session by Keiko Itakur-san focused on problem that becomes obvious at scale.

Imagine an AI assistant needs to access:

- Slack
- Calendar
- Jira
- CRM
- HR system
- Accounting system

Traditional OAuth becomes:

```text
Allow?
Allow?
Allow?
Allow?
Allow?
```

Eventually users stop reading and simply click accept.

The proposed approach, called `Cross-App Access / ID-JAG`, changes the model from:

```text
User decides everything
```

to:

```text
Enterprise policy decides everything
```

The flow becomes

```text
User login
   ↓
Identity assertion
   ↓
Policy evaluation
   ↓
Short-lived access token
   ↓
API
```

few ideas she mentioned:

- Identity systems approve intent
- Resource systems still issue actual access tokens
- Long-lived refresh tokens should be avoided
- Highly sensitive exchanged tokens should have very short lifetimes

The overall idea is like similar to applying least privilege principles to AI agents.

---

## Takeaway

For AI integration, it is not only about exposing APIs, but also about designing clear authorization boundaries. As AI agents start acting on behalf of users, identity systems need to think beyond human login flows and focus more on delegation, permissions, and trust between systems.
