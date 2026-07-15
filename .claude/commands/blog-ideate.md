Generate technical blog post ideas based on a given topic, domain, or technology area.

## Context
- Writer: 5+ years engineering experience
- Readers: 2-3 years experienced engineers — skip basics, they want depth, trade-offs, and real-world nuance
- Blog format: Hugo markdown with frontmatter (title, description, tldr, categories)
- Existing blogs are in `content/blogs/` — scan them to avoid duplicate topics

## Your task

The user will either provide a topic/domain, or ask for open-ended ideas. Do the following:

1. Scan `content/blogs/` to understand what has already been written (titles, categories)
2. Generate **5–8 blog post ideas** relevant to the topic or to the writer's apparent domain
3. For each idea provide:
   - **Title** (punchy, specific — no clickbait)
   - **Core angle**: What unique perspective or insight makes this worth writing?
   - **Why it's worth writing**: gap in existing content, relevance, timeliness
   - **Possible sections** (3–5 bullet points)
   - **Estimated depth**: single post / multi-part series

## Tone guidelines
- Prefer opinionated, experience-driven angles over generic tutorials
- Ideas should go beyond surface-level — e.g., not "What is Kafka" but "Why Kafka's consumer group rebalance will bite you in production"
- Favour posts that explain *why* something works the way it does, not just *how* to use it

After presenting ideas, ask the user which one they want to move forward with (or if they want refinements).
