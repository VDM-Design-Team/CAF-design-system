---
bump: minor
---
### Field borders and switch tracks reach 3:1 (November 2026)

Two new semantic tokens from the CAF Figma library, GDL's recommended names:

- **`stroke.field`**: the resting border of fields and controls. Slate 500 in
  Light, slate 400 in Dark (GDL's reference values): 4.55:1 or more on every
  surface a field sits on, in both themes.
- **`surface.track`**: the unfilled track of a toggle (and later sliders and
  progress bars). The same steps, so it reaches 3:1 too.

The library now binds them, and so does code:

- **TextInput, SelectTrigger, Select, Combobox, DateInput, Textarea** and their
  fields: the Default and Filled border moves from `stroke.subtle` (1.23:1 in
  Light, 1.72:1 in Dark) to `stroke.field`.
- **FilterField** and **Radio** (Deselected): from `stroke.strong` (2.45–2.56:1
  in Light) to `stroke.field`.
- **Checkbox** (unchecked): from `stroke.default` (1.48:1 / 1.93:1) to
  `stroke.field`.
- **Toggle** (off): the track moves from `neutral.tonal.surface.default`
  (1.18:1 / 2.36:1) to `surface.track`.

Every field and control border is visibly darker in Light and lighter in Dark.
Disabled states keep their look (the inputs' `stroke.subtle`, Radio's
`stroke.strong`, Toggle's tonal track, all at 50%), as Figma still draws them.
