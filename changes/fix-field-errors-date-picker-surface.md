---
bump: patch
---
### Red field errors on Checkbox, Toggle and Radio Group; date pickers on the elevated surface (November 2026)

Follow-ups to the 3 November Figma clean-up:

- **`CheckboxField`, `ToggleField` and `RadioGroup`** show their `error`
  message in `accent.critical.tonal.content.default`, as `FormField` does
  since 0.10.0 (7.99 / 9.30:1 on the canvas). It was `text.subtle`.
- **`Calendar`, `RangeCalendar`** (and the pickers in `DateInput` and
  `FilterDateRange`) sit on `surface.elevated`, like every other popover,
  as the CAF Figma library has them since 4 November (decision
  menu-surface). It was `surface.neutral.faint`, the canvas colour. Every
  day state still passes.
- **`FileChip`**: its Download button no longer needs a contrast exception,
  since Button's Tonal label passes AA (0.10.0). Its stories check every
  cell again.
