Generate two SVG images for a blog post: a horizontal one (`image.svg`) and a square one (`thumbnail.svg`).

## Usage

The user provides a blog slug or path. If none given, infer from context or ask.

## Your task

1. **Read the post** at `content/blogs/<slug>/index.md` to understand:
   - Title, categories, description/tldr
   - Core topic, key concepts, and any notable tech (protocols, tools, attack names, etc.)

2. **Generate `image.svg`** — horizontal, 1200×630px
   - Used as the post header and OG image
   - Include a mini flow/architecture diagram relevant to the post topic
   - Include a styled title bar at the top with the post title and subtitle tags
   - Include decorative code/XML/config snippets if relevant to the topic
   - Include any notable labels (attack names, key terms) as callout boxes

3. **Generate `thumbnail.svg`** — square, 500×500px
   - Used as the blog card image in the list view
   - Centered icon or symbol that represents the topic (shield, key, lock, token, document, etc.)
   - Large bold acronym or short title (e.g. "SAML", "OAuth2", "SCIM")
   - Horizontal divider line
   - Subtitle text (e.g. "Fundamentals & Deep Dive")
   - Row of small pill tags (key concepts from the post)
   - Mini flow diagram at the bottom (3 boxes with arrows: e.g. IdP → SP → App)

4. **Save both files** into `content/blogs/<slug>/`

5. **Update frontmatter** in `index.md`:
   ```yaml
   image: "blogs/<slug>/image.svg"
   thumbnail: "blogs/<slug>/thumbnail.svg"
   ```

## Design system (use consistently across all posts)

**Colors — choose a palette that fits the post topic:**
- Pick a dark background (near-black base, e.g. very dark navy, slate, charcoal, or deep teal)
- Choose 1-2 accent colors that evoke the topic's mood:
  - Security/auth/identity: indigo, violet, purple
  - Performance/systems: amber, orange, red
  - Networking/protocols: cyan, sky blue, teal
  - Data/storage: emerald, green
  - Attacks/danger: red with dark bg
  - General/neutral: slate blue, cool gray accents
- Text: near-white for primary, muted grays for secondary/labels
- Box fills: slightly lighter than the background
- Keep contrast high — text must be clearly readable
- Use the same palette for both `image.svg` and `thumbnail.svg`

**Structural elements:**
- Subtle grid lines: `stroke-opacity="0.03"` white, 1px
- Glow blobs: `<ellipse>` with `fill-opacity="0.07"` using accent colors
- Box borders: `stroke-width="1.5"`, rounded corners `rx="8"` or `rx="10"`
- Arrows: marker-end with filled triangle, `stroke-width="1.5"`
- Dashed arrows for request flows: `stroke-dasharray="6,3"`
- Solid arrows for response flows
- Top accent bar (thumbnail): 4px tall rect with accent gradient

**Typography:**
- Title: `system-ui, -apple-system, sans-serif`, bold
- Code/labels/tags: `monospace`
- Acronym in thumbnail: `monospace`, `font-size="42"`, `font-weight="700"`, `letter-spacing="6"`

**Tag pills:**
- `rx="12"`, `fill-opacity="0.2"`, `stroke-width="1"`
- Use indigo for general tags, purple for secondary, red for attack/danger tags

**Icons to use per topic** (draw with SVG paths/shapes — no external references):
- Identity/auth: shield shape (`<path d="M0,-70 L55,-45...">`)
- Keys/crypto: circle + horizontal line with notches
- Documents/specs: rect with horizontal lines inside
- Users: circle (head) + arc (shoulders)
- Tokens/JWT: rectangle with sections
- Flow/protocol: connected boxes with arrows

## Quality rules

- All SVGs must include `width`, `height`, and `viewBox`
- Use `&amp;` for `&` in text nodes
- Defs block must come before usage (markers, gradients, filters)
- Do not reference external resources (no `<image href>`, no web fonts)
- Keep the visual hierarchy clear: icon > title > tags > diagram
- Tailor the diagram and snippets to the actual post content — no generic placeholders
