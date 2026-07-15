Review a written blog post for technical accuracy, clarity, and quality.

## Context
- Writer: 10+ years engineering experience — direct, opinionated, technically precise
- Readers: 5+ years experienced engineers — they will notice technical inaccuracies, vague claims, and padding

## Your task

The user will provide a file path or slug. Do the following:

1. **Read the post** from `content/blogs/<slug>/index.md`

2. **Technical accuracy review**:
   - Flag any claims that seem incorrect, outdated, or overly broad
   - Identify hand-wavy statements that experienced readers will push back on
   - Note missing caveats for platform/version-specific behaviour
   - Check that code examples (if any) are syntactically correct and idiomatic

3. **Clarity and structure review**:
   - Does the intro start with the problem or tension? Flag it if it throat-clears instead
   - Are sections in a logical order? Note any that should be moved or split
   - Are there paragraphs doing too many things at once?
   - Does the conclusion deliver a real takeaway, or just restate what was written?
   - Are bullet lists used only for genuinely list-like items? Flag prose disguised as lists
   - Are paragraphs 3–5 lines max? Flag walls of text

4. **Voice and language review** — check against these rules from the writing guide:
   - **No AI-giveaway phrases**: flag "dive into", "delve into", "unleash", "game-changing", "revolutionary", "it's worth noting", "in the realm of", "seamlessly", "leverage" (as a verb), "robust", "cutting-edge", or marketing copy
   - **No em dashes (`—`)**: flag any em dash outside code, XML, or quoted content
   - **No filler adjectives/adverbs**: flag words that don't earn their place
   - **No hype**: flag overselling of content or technology
   - **Passive voice or hedging** that weakens a claim without good reason
   - **Stiff or unnatural tone**: flag sentences that sound corporate or AI-generated
   - Does the post assume the right level of reader knowledge? (too basic = condescending, too advanced = loses them)

5. **Frontmatter check**:
   - `title`: specific and direct?
   - `description`: accurate meta description, under 160 characters?
   - `tldr`: captures the core insight in 1–2 sentences?
   - `categories`: appropriate?
   - `<!--more-->` present after the intro paragraph?

6. Produce a **review summary** in three tiers:
   - **Must fix** (blockers: factual errors, broken structure, missing frontmatter fields)
   - **Should fix** (quality issues: voice violations, weak conclusion, unclear sections)
   - **Optional polish** (minor improvements)

Then ask the user which issues to address. Apply agreed fixes directly to the file.
