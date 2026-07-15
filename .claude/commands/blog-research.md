Research and technically verify content for a blog post before or during writing.

## Context
- Writer: 10+ years engineering experience — they will catch wrong facts
- The goal is accuracy and depth, not padding with citations
- This is a technical blog; readers will test claims against their own production experience

## Your task

The user will provide either:
- A list of claims/concepts to verify, OR
- A blog outline (from `/blog-plan`) with flagged research needs, OR
- A topic to research from scratch

Do the following:

1. **Identify what needs verification** — distinguish between:
   - Facts that can be checked (spec behaviour, version numbers, API contracts)
   - Claims that need nuance (performance characteristics, trade-offs)
   - Opinions that should be labelled as such

2. **For each research item**, provide:
   - Verified fact or corrected version
   - Source / reference (RFC, official docs, spec, well-known engineering post)
   - Edge cases or caveats worth calling out in the post
   - Any version/context dependency (e.g., "true as of Kubernetes 1.28")

3. **Flag hand-wavy areas** — if a claim is hard to verify or varies by environment, say so clearly so the writer can hedge appropriately

4. **Suggest code snippets or diagrams** where they would make an abstract concept concrete

5. If doing broad topic research, produce a **research brief**: key concepts, mental model, common misconceptions, and the 2–3 things most experienced engineers get wrong about this topic

Keep output structured and scannable — the writer will use this as a reference while writing.
