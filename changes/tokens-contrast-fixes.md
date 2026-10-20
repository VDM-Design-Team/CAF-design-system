---
bump: patch
---
### Every semantic pair meets WCAG AA, Light and Dark (October 2026)

The 37 pairs the contrast report flagged now pass. Each fix moves an alias
to another step of the same ramp in the CAF Figma library: 1 variable in
Light, 28 in Dark. No names change. `npm test` now runs `check:contrast
--strict`, so a pair that drops below AA fails CI.

- **Light.** `text.subtle` is slate-500 instead of slate-400, so subtle
  text reads a little darker.
- **Dark, text and focus.** Brand text is lighter: `text.brand.medium` is
  caf-blue-300 and `text.brand.strong` is caf-blue-200. The focus ring
  (`stroke.focused`) is caf-blue-300. The pressed link colour
  (`text.link.pressed`) is GDL blue-400 instead of a raw hex.
- **Dark, primary buttons.** Labels and icons are near-black
  (caf-blue-on-dark-100) on the unchanged periwinkle fill, in every state
  including selected.
- **Dark, selected secondary and tertiary buttons.** Labels are
  caf-blue-on-dark-700 instead of a dark tint that disappeared on the fill.
- **Dark, neutral buttons.** Outline labels stay slate-300 in every state.
  Tonal hover, pressed and selected use a slate-50 label on a slate-500 fill,
  so the three states now look the same. Filled buttons lighten on hover and
  selected (slate-300) and pressed (slate-200) instead of darkening.
- **Dark, accent tonal badges and buttons.** Hover labels on pending and
  critical are one step lighter (/200). Pressed labels are lighter on all
  five accents (/100, or blue-200 for info). Info outline's default label is
  blue-400, the same as its hover.
