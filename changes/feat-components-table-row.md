---
bump: minor
---
### Components: TableRow, and darker text in selected rows (October 2026)

`TableRow` is the generic table body row, built straight from the CAF
Figma library (page **Table**, `Table / Row`). It is a `<tr>` of
TableCells.
- Figma's State: Default; Hover is `:hover` (a `surface.base` fill);
  Selected is `selected` (`action.primary.surface.default` at 16%).
- Put a checked `Checkbox` in a selected row, as in Figma: it's what
  screen readers announce, because a table row can't carry
  `aria-selected`.

**TableCell, on a selected row:** secondary text (the second line, the
date) uses `text.secondary` instead of `text.subtle`, and the list's
"+N more" link uses `text.link.selected` instead of `text.link.default`.
On the Selected tint in Light, `text.subtle` was 3.6–3.7 and the link
3.8–3.9, below AA. They're now 7.8–8.1 and 5.1–5.4. Dark already passed
and still does. Nothing changes outside selected rows.
