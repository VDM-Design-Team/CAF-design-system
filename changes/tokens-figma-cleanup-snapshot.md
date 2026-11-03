---
bump: patch
---
### Darker scrim in Dark (November 2026)

`surface.overlay` in Dark changes from slate 800 at 75% (`#1e293bbf`) to
slate 950 at 75% (`#020617bf`), as the CAF Figma library now has it. The
scrim behind every modal and side sheet is darker in Dark, so a dialog's
edge stands out from the page under it (1.06:1 → 1.34:1 over the canvas).
Light is unchanged.

The snapshot also picks up the text-style bindings fixed in Figma (GDL's
`font/size/*` and `font/family/*` variables on 11 styles). No text style
changes value.
