---
bump: minor
---
### Components: TableCell (October 2026)

`TableCell` is the generic table body cell, built straight from the CAF
Figma library (page **Table**, `Table / Cell`). It is a `<td>`, so tables
built from it keep real row and column semantics for screen readers.
- `type` is Figma's Type: `text` (default, the old Cell Text), `two-line`,
  `tag`, `checkbox`, `actions`, `list` and `status-date`.
- Value is `children`. Primary, Secondary and Date are `primary`,
  `secondary` and `date`.
- `list` shows the first item and "+N more", and expands to a bulleted list
  with "Show less". It's a real toggle button, with `aria-expanded`.
- Type=Checkbox takes the CAF `Checkbox`. Tag, Actions and Status + Date
  take Status Pill, the row actions button and Tag as `children`, until
  those are built.

Every text style and colour is the one the Figma layer is bound to, in
Light and Dark. Where code differs from Figma (details in
`docs/figma-sync.md`):
- **Vertical padding** is 12px, not Figma's raw 14px, so a Text cell is
  44px (Figma 45).
- **Line heights** are GDL's, so multi-line cells run a little taller.
