Write the full content of a technical blog post.

## Context
- Writer: 10+ years engineering experience — write in their voice: direct, opinionated, technically precise
- Readers: 5+ years experienced engineers — no hand-holding, no "first let's understand what X is"
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

3. **Voice and language rules** — these are non-negotiable:
   - **Shift into peer-engineer voice ~30% of the time to keep the reader engaged**: for roughly a third of the writing, drop into an engineer-talking-to-a-peer register (thinking out loud, short plain declaratives, the occasional offhand aside) so the post feels like a real person walking a colleague through it, not a spec. The other ~70% stays normal blog prose: connective tissue and structure so it clearly reads as an article, not a chat log. Bare fragments are rare.
   - **Cause-and-effect chains**: narrate system behavior as tight links with "since" / "but" / "thus" or "->": "redirects to 2FA after sign-in, but bounces back since 2FA is off for SSO users."
   - **Plain language only**: short sentences, common words. If a simpler word exists, use it
   - **No AI-giveaway phrases**: never use "dive into", "delve into", "unleash", "game-changing", "revolutionary", "it's worth noting", "in the realm of", "seamlessly", "leverage" (as a verb), "robust", "cutting-edge", or any phrase that sounds like marketing copy
   - **Direct and specific**: cut every word that doesn't add meaning. "We should meet tomorrow" beats "It would be beneficial for us to schedule a meeting for tomorrow"
   - **Natural tone**: write like you're talking to a colleague — it's fine to start a sentence with "And" or "But". Conversational is good; stiff is not
   - **No hype**: don't oversell the content or the technology. "This approach can help with X" beats "This powerful technique will transform how you think about X"
   - **Honest over friendly**: don't force enthusiasm. If something has trade-offs, say so plainly
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
