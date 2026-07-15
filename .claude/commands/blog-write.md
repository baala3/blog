Write the full content of a technical blog post.

## Context
- Writer: 5+ years engineering experience — write in their voice: direct, opinionated, technically precise
- Readers: 2-3 years experienced engineers — no hand-holding, no "first let's understand what X is"
- Blog is Hugo-based. Post goes in `content/blogs/<slug>/index.md`

## Hugo frontmatter format
```yaml
---
title: ''
date: "<ISO8601 date>"
url: "/blogs/<slug>"
description: ""
tldr: ""
image: ""
credit: ""
thumbnail: ""
categories:
- Category1
- Category2
---
```

## Your task

The user will provide an outline (from `/blog-plan`) and optionally research notes (from `/blog-research`). Do the following:

1. **Write the complete post** in markdown, including frontmatter
   - Fill all frontmatter fields; leave `image` and `thumbnail` as empty strings if not provided
   - `description`: 1–2 sentence meta description (for SEO and preview cards)
   - `tldr`: 1–2 sentence summary of the key takeaway
   - Use `<!--more-->` after the intro paragraph to mark the summary cut-off

2. **Writing style rules**:
   - Start with the problem or the tension — not background or history unless it's the point
   - Use `#` for top-level sections, `##` for sub-sections
   - Code blocks must specify language: ` ```go `, ` ```yaml `, etc.
   - Prefer concrete examples over abstract descriptions
   - Short paragraphs — 3–5 lines max. Use bullet lists only when items are genuinely list-like
   - Opinionated where appropriate — hedge only when genuinely uncertain
   - End with a clear takeaway or conclusion, not a summary of what was just written
   - **Flow between sections**: a post is not a stack of disconnected notes. When moving to a new `##` section, open with a sentence that links back to what the last section just established (what question it leaves open, what it sets up, what changes now) instead of jumping straight into the new topic cold. Read the post start to finish before finishing: if a section could be reordered or deleted without anyone noticing, fix the transition around it

3. **Voice and language rules** — these are non-negotiable:
   - **Shift into peer-engineer voice ~30% of the time to keep the reader engaged**: for roughly a third of the writing, drop into an engineer-talking-to-a-peer register (thinking out loud, short plain declaratives, the occasional offhand aside) so the post feels like a real person walking a colleague through it, not a spec. The other ~70% stays normal blog prose: connective tissue and structure so it clearly reads as an article, not a chat log. Bare fragments are rare.
   - **Think out loud, in order**: when reasoning through a problem, state the guess, then the reasoning, then the conclusion, in that order — don't jump straight to the polished answer. It's fine to end a genuinely tentative point with a question mark.
   - **Hedge honestly, don't overclaim**: use "maybe", "I guess", "probably", "should be fine", "a bit" when the certainty is real. Don't manufacture confidence you don't have, but don't hedge things you're actually sure of either.
   - **"We" for shared/industry practice, "I" for personal calls**: shared engineering reality is "we hit latency alerts, we scale out". A personal opinion or choice is "I'd rather provision a distinct identity than overload an existing one".
   - **Cause-and-effect chains**: narrate system behavior as tight links with "since" / "but" / "thus" or "->": "redirects to 2FA after sign-in, but bounces back since 2FA is off for SSO users."
   - **Explain the why, often in a parenthetical**: don't just state a decision or fact, give the reasoning right next to it. "(since a second source of truth is how these things drift out of sync)".
   - **Plain language only**: short sentences, common words. If a simpler word exists, use it. No "leverage", "synergy", "circle back", or "deep dive" — say "check", "run", "fix", "speed up"
   - **Simple vocabulary, not just simple grammar**: the writer isn't a native/fluent English speaker, so favor everyday words over formal or academic ones, even correct and precise ones, in roughly half the sentences. Swap "entitlements" → "permissions" or "access rights", "ephemeral" → "short-lived" or "temporary", "granular" → "fine-grained" or "detailed", "mitigate" → "reduce" or "cut down", "leverage" → "use", "facilitate" → "help", "utilize" → "use", "necessitate" → "need", "commence" → "start". Keep exact technical terms (protocol names, RFC titles, field names) unchanged — this rule is about the connective prose around them, not the jargon itself
   - **No decorative idioms**: avoid phrases that dress up a plain statement — "on offer", "wearing a new hat", "at the end of the day", "when the dust settles", "under the hood" (unless literally about internals). Say the thing directly: "the fix is" beats "the fix on offer is"
   - **No AI-giveaway phrases**: never use "dive into", "delve into", "unleash", "game-changing", "revolutionary", "it's worth noting", "in the realm of", "seamlessly", "leverage" (as a verb), "robust", "cutting-edge", or any phrase that sounds like marketing copy
   - **Direct and specific**: cut every word that doesn't add meaning. "We should meet tomorrow" beats "It would be beneficial for us to schedule a meeting for tomorrow"
   - **Natural tone, contractions on**: write like you're talking to a colleague — "I'm", "it's", "that's", "didn't", "haven't", "don't", not their expanded forms. It's fine to start a sentence with "And" or "But". Conversational is good; stiff is not
   - **No hype**: don't oversell the content or the technology. "This approach can help with X" beats "This powerful technique will transform how you think about X"
   - **Candid about trade-offs and worst cases**: don't force enthusiasm. Name the risk or the worst case plainly instead of burying it — "absolute worst case, this doesn't support X" beats vague caveats
   - **No filler adjectives/adverbs**: "We finished the task" beats "We successfully completed the challenging task". Earn your adjectives
   - **Clarity over cleverness**: if a sentence needs to be read twice, rewrite it
   - **No em dashes (`—`)**: avoid em dashes. Use a colon, comma, period, or parentheses depending on context. Em dashes are a common AI writing tell. The only exception is inside code, XML, or quoted external content.

4. **Attach links where relevant**:
   - Inline links for: external tools, libraries, specs, docs, RFCs, or anything a reader might want to look up
   - Prefer linking the specific term or phrase, not "click here" or "read more"
   - Don't over-link — link a term the first time it appears, not every occurrence
   - If research notes include URLs, use those. Otherwise leave a `<!-- TODO: link -->` comment so the user can fill in the URL later
   - Never fabricate URLs. Only use URLs from the outline, research notes, or that you are confident are accurate

5. After writing, create the directory `content/blogs/<slug>/` and write `index.md` into it

6. Print the relative file path of the created file so the user can open it
