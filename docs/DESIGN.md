You are building a web app. This file defines the complete design system. Reference it for every styling decision. Do not deviate from the fonts, colors, or tokens specified below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPOGRAPHY RULES:
→ Use Zain for ALL headings (h1–h4), display text, and hero copy
→ Use Nunito for ALL body text, captions, labels, and UI copy
→ Use the system monospace stack ONLY for literal code and technical values
→ Do NOT substitute with Inter, Georgia, or any other primary font
→ Apply a typographic scale: hero 48–64px, h1 36px, h2 28px, h3 22px, body 16px, caption 13px
→ Font weight: 400 for body, 500 for headings
  (Zain is served by Google Fonts at 200/300/400/700/800/900 — it has no 500/600, so a
   `font-medium` heading resolves to the 400 face. Do not request 500/600 from Google Fonts.)
→ Letter spacing: slightly loose on headings (-0.01em to 0), normal on body

FONTS:
| Role | Font | Weights | Stylesheet URL |
|------|------|---------|----------------|
| Headings | Zain | 300, 400, 700 | `https://fonts.googleapis.com/css2?family=Zain:wght@300;400;700&display=swap` |
| Body | Nunito | 400, 500 | `https://fonts.googleapis.com/css2?family=Nunito:wght@400;500&display=swap` |

LOADING RULE:
→ Load these via <link rel="stylesheet"> tags in the route head (e.g. `app/layout.tsx` <head>),
  NOT via CSS @import in the stylesheet. Tailwind v4 / Lightning CSS cannot resolve remote @import URLs
  and will silently fall back to system fonts.
→ Add the following tags exactly:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zain:wght@300;400;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500&display=swap">
```

CSS TOKENS:
→ Map each font to a CSS custom property so components reference the token, NOT the raw font name:

```css
:root {
  --font-heading: 'Zain', system-ui, sans-serif;
  --font-body: 'Nunito', system-ui, sans-serif;
}
```

→ In Tailwind, expose these as: `fontFamily: { heading: 'var(--font-heading)', sans: 'var(--font-body)' }`
→ Use `font-heading` on headings/display and `font-sans` (or `font-body`) on body text — never hardcode the font name in components.

COLOR RULES:
→ Background: #131530 — use for the page background
→ Surface: #1A1D42 — use for cards and raised surfaces
→ Foreground: #FFFFFF — use for all primary text, headings, and icons
→ Foreground Muted: #B3B8F0 — use for secondary text, placeholders, and metadata
→ Primary: #F092DD — use for CTAs, active states, links, and key UI accents
→ Support: #1E3A8A — supporting surfaces only; never use it as text on #131530 (only 1.72:1)
→ Border: rgb(255 255 255 / 0.24) — use for dividers, input borders, and card outlines
  (the 12% white value is decorative only — never rely on it for a control boundary)
→ Destructive: #F87171
→ Status colors on dark surfaces: success #4ADE80, warning #FBBF24, error #F87171
→ Do NOT use pure black (#000000) — use #131530 as the darkest value

CONTRAST:
→ Normal text meets 4.5:1 and large text / meaningful UI indicators meet 3:1 on #131530 and #1A1D42
→ Never communicate a state by color alone — keep an icon or text label alongside it

ICON RULES:
→ Use lucide-react exclusively (the icon library already used in this project)
→ Do NOT add a second icon library
→ Match icon size to surrounding text scale (16px inline, 20px UI, 24px feature icons)
→ Pair icons with a visible label where possible; give icon-only controls an accessible name
→ Mark decorative icons `aria-hidden`

COMPONENT RULES:
→ Buttons: Primary (#F092DD) background with #131530 text, rounded-lg; outline/secondary variants use the surface and border tokens
→ Cards: Background (#1A1D42) surface with a subtle ring/outline; consistent padding (16–24px)
→ Inputs: border token outline; Foreground Muted placeholder text
→ Links: Primary (#F092DD); do not rely on color alone — underline in prose and provide visible focus

FRAMEWORK RULES:
→ Use shadcn/ui components with Tailwind CSS
→ Map semantic tokens: primary → #F092DD, background → #131530, foreground → #FFFFFF, card → #1A1D42, muted-foreground → #B3B8F0, border → rgb(255 255 255 / 0.24), ring → #FFFFFF
→ Fonts: reference the --font-heading and --font-body tokens defined above — do NOT re-declare or @import the font families elsewhere
→ Prefer the palette above over Tailwind's default color scales

OUTPUT RULES:
→ Every component must reference the design tokens — no hardcoded arbitrary values
→ Do not introduce UI elements, colors, or fonts not specified in this file
→ The final output must feel cohesive — as if designed by one person with one system
→ When in doubt, use less decoration, not more
