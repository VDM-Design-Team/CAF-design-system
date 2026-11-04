---
bump: patch
---
### Popovers stay open while focus moves inside them; Starts At shows the date format (November 2026)

- **`Popover`** (and everything built on it: `FilterDateRange`, `DateInput`,
  `Select`, `SelectMenu`, `FilterSelect`, `Combobox`, `MenuDropdown`) no longer closes when focus moves inside
  the panel while the Popover re-renders. Its refs were set again in every
  commit, so for a moment the panel looked empty, and a focus move in that
  moment read as focus leaving. In Select Period, an arrow key could close
  the range picker and drop focus to the page. Nothing looks different.
- **New Cost** (recurring): Starts At shows the date field's own placeholder,
  "yyyy-mm-dd", instead of "Select start date". In the CAF Figma library,
  U02's and U04's Starts At are Form / Field – Date since 4 November.
