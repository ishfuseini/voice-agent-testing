You are building a web app. This file defines the complete design system. Reference it for every styling decision. Do not deviate from the fonts, colors, or tokens specified below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPOGRAPHY RULES:
→ Use Elms Sans for ALL headings (h1–h4), display text, and hero copy
→ Use Fragment Mono for ALL body text, captions, labels, and UI copy
→ Do NOT substitute with Inter, system-ui, Georgia, or any fallback font
→ Apply a typographic scale: hero 48–64px, h1 36px, h2 28px, h3 22px, body 16px, caption 13px
→ Font weight: 400 for body, 500–600 for headings — do not use 700+ unless explicitly needed
→ Letter spacing: slightly loose on headings (-0.01em to 0), normal on body

FONTS:
| Role | Font | Weights | Stylesheet URL |
|------|------|---------|----------------|
| Headings | Elms Sans | 400, 500, 600 | `https://fonts.googleapis.com/css2?family=Elms+Sans:wght@400;500;600&display=swap` |
| Body | Fragment Mono | 400, 500 | `https://fonts.googleapis.com/css2?family=Fragment+Mono:wght@400;500&display=swap` |

LOADING RULE:
→ Load these via <link rel="stylesheet"> tags in the route head (e.g. index.html <head> or react-helmet),
  NOT via CSS @import in styles.css. Tailwind v4 / Lightning CSS cannot resolve remote @import URLs
  and will silently fall back to system fonts.
→ Add the following tags exactly:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Elms+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fragment+Mono:wght@400;500&display=swap">
```

CSS TOKENS:
→ Map each font to a CSS custom property so components reference the token, NOT the raw font name:

```css
:root {
  --font-heading: 'Elms Sans', sans-serif;
  --font-body: 'Fragment Mono', sans-serif;
}
```

→ In Tailwind config, expose these as: `fontFamily: { heading: 'var(--font-heading)', sans: 'var(--font-body)' }`
→ Use `font-heading` on headings/display and `font-sans` (or `font-body`) on body text — never hardcode the font name in components.

COLOR RULES:
→ Background: #111111 — use for page background and card surfaces
→ Foreground: #F7F7F5 — use for all primary text, headings, and icons
→ Foreground Muted: #B6B6B5 — use for secondary text, placeholders, and metadata
→ Primary: #8A2BE2 — use for CTAs, active states, links, and key UI accents
→ Accent: #00FF9C — use for hover states, pressed buttons, and deep emphasis
→ Border: #353534 — use for all dividers, input borders, and card outlines
→ Do NOT introduce colors outside this palette (no Tailwind defaults like blue-500 or gray-400)
→ Do NOT use pure black (#000000) — use #111111 as the darkest value

ICON RULES:
→ Use Feather Icons exclusively for all icons
→ Install via: https://feathericons.com
→ Do NOT use Heroicons, Lucide, or any other icon library
→ Match icon size to surrounding text scale (16px inline, 20px UI, 24px feature icons)

COMPONENT RULES:
→ Every button must use Primary (#8A2BE2) background with #111111 text, rounded-md
→ Every card must use Border (#353534) outline, Background (#111111) surface, consistent padding (16–24px)
→ Every input must use Border (#353534) outline, Foreground Muted placeholder text
→ Every link must use Primary (#8A2BE2), Accent (#00FF9C) on hover — no underline by default


FRAMEWORK RULES:
→ Use shadcn/ui components with Tailwind CSS
→ Map semantic tokens: primary → #8A2BE2, foreground → #F7F7F5, muted → #B6B6B5, border → #353534
→ Fonts: reference --font-heading and --font-body tokens defined above — do NOT re-declare or @import the font families elsewhere
→ Do NOT use Tailwind's default color scales — all colors must reference the palette above

OUTPUT RULES:
→ Every component must reference the design tokens — no hardcoded arbitrary values
→ Do not introduce UI elements, colors, or fonts not specified in this file
→ The final output must feel cohesive — as if designed by one person with one system
→ When in doubt, use less decoration, not more

— Powered by Fontpair
