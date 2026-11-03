---
bump: minor
---
### Buttons, selection controls, Status Pill and tabs follow the 3 Nov Figma clean-up (November 2026)

The CAF Figma library's buttons, controls, tags and tabs were cleaned up and
published on 3 Nov 2026 (the user took every recommendation, decisions
fc-buttons-*). Code follows Figma's new bindings.

- **`Button`**: Tonal's label is `text.brand.strong` (`text.brand.stronger`
  while pressed) and passes AA in every state (it was 1.77–3.98:1 in places).
  Destructive and Success labels use their own `accent.*.filled.content`
  tokens, which are #020617 in Dark (from #13141B). Disabled: Default and
  Tonal use the neutral tonal disabled pair, Outlined and Text the neutral
  outline one, so in Dark a disabled button is no longer louder than an
  enabled one (and Tonal Disabled no longer looks enabled). Figma's new Focus
  state matches code's ring. **`MenuTriggerButton`** (Export, Change Status)
  takes the new Default Disabled look through Button.
- **`IconButton`**: Disabled draws the glyph in `text.disabled`, with no hover.
- **`StatusPill`**: Pending's label is `accent.pending.filled.content` (the
  same colours today).
- **`TabItem`**: a hover on tabs that aren't selected
  (`neutral.outline.surface.hover`, `text.primary` label), in Tabs and
  FormTabNavigation. **`FormTabNavigation`**'s active tab is
  `neutral.tonal.surface.default` (was `surface.base`), so it shows against
  the track in Light.
- **`Checkbox`**: radius 4 in every state (unchecked was 2); Hover's border is
  `stroke.stronger`; a checked box has no border; Disabled and Disabled
  Selected have their own colours (they only changed the cursor). An
  `aria-invalid` unchecked box has the critical border.
- **`Radio`** and **`Toggle`**: Disabled has its own colours instead of 50%
  opacity. Radio's new Error state is `aria-invalid` (the critical stroke),
  so **`RadioGroup`**'s `error` now marks its radios too, and **`RadioOption`**
  shows Error=true.
- **`CheckboxField`** and **`ToggleField`**: new prop `error` (Figma's
  State=Error): the message under the description and the control
  `aria-invalid`; CheckboxField's box, or its card, turns critical. Disabled
  turns the label, marker and description `text.disabled` (and the card's
  stroke `neutral.outline.border.disabled`).

Screens: every disabled button, checkbox, radio and toggle looks different
in Light and Dark; Tonal buttons (View Changes, Download) have darker labels
in Light and lighter ones in Dark; Destructive and Success labels are
slightly darker in Dark; the New Cost form's active tab shows as a grey pill.
