---
bump: minor
---
### Components: Icon and IconButton (October 2026)

**`Icon`** draws the Phosphor icons (MIT) the CAF Figma library uses, at
Regular weight: 39 glyphs, by Phosphor's name (`caret-down`,
`dots-three`, `calendar-blank` …), at 16, 20, 24, 32 or 48px. It takes the
text colour around it, so it follows Light and Dark. To add a glyph, add
its name to `scripts/icons.mjs` and run `npm run icons`.

**`IconButton`** is the icon-only button, built straight from the CAF
Figma library (page **Buttons**, `Button / Icon`), for refresh, close,
theme, trash and the table row's •••.
- `size` is Figma's Size: `32` (16px glyph, default) or `40` (20px).
- `tone` is Figma's Tone: `ghost` (default), `tonal` or `destructive`.
  Hover is `:hover`.
- `label` is required: it's the button's accessible name.

Every colour is the one the Figma layer is bound to, and every glyph
passes contrast in Light and Dark. Code adds a `stroke.focused` focus
ring, as on Button.

**TableHeaderCell's** sort arrows now come from `Icon`. Nothing looks
different.
