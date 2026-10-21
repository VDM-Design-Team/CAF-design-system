---
bump: patch
---
### Component borders meet WCAG 1.4.11, Light and Dark (October 2026)

The contrast report now checks borders as well as text. Every
`….border.<state>` must reach 3:1 against `surface.canvas`, `surface.base`
and its own fill when that fill is opaque. Disabled and deselected states
are exempt. The 15 failing pairs came from 7 Figma variables. Each now
aliases another step of the same ramp in the CAF Figma library: 5 in Light,
2 in Dark. No names change.

- **Light, outline buttons and badges.** Default borders are one step
  darker: neutral is slate-500, success green-600 and pending orange-600.
  Each now matches its hover border, and the hover and pressed fills still
  change. Warning's default and hover borders are yellow-700, the same as
  pressed. That makes them clearly visible on white.
- **Dark, info outline.** The default border is blue-500, the same as hover.
- **Dark, selected secondary buttons.** The border is caf-blue-on-dark-600,
  the same as hover. The old border was dark navy and nearly vanished on
  the fill. This matches Light, where selected and hover share CAF-blue-600.
