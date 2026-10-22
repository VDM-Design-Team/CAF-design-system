---
bump: minor
---
### Components: TableHeaderCell (October 2026)

`TableHeaderCell` is the column header of CAF's tables, built straight
from the CAF Figma library (page **Table**, `Table / Header Cell`). It is
a `<th scope="col">`, so screen readers announce every body cell with its
column.
- The label is `children`.
- `sortable` is Figma's Sortable. The label and arrows become a button
  that calls `onSort`; the table decides the order.
- `sort` is Figma's Sort: `none` (default), `ascending` or `descending`. A
  sorted column shows ArrowUp or ArrowDown, darkens its label and sets
  `aria-sort`.

Every colour is the one the Figma layer is bound to, and every label and
arrow passes contrast in Light and Dark. Where code differs from Figma
(details in `docs/figma-sync.md`):
- **Focus ring:** the sort button gets a `stroke.focused` outline, as on
  Button. Figma has no Hover or Focus state for it.
- **Height:** 32px with or without arrows (Figma: 29 without), on GDL's
  line height. Labels are about 2px wider, from GDL's letter spacing.
- **`sortable` is off by default,** because a sortable header needs an
  `onSort` handler. Figma's default variant is sortable.
