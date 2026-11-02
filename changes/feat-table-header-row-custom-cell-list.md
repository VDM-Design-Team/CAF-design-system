---
bump: minor
---
### TableHeaderRow, TableList and TableCell type="custom" (November 2026)

Three table parts from the CAF Figma library's **Table** page, added there
first from the CAF design decisions:

- **`TableHeaderRow`** (Table / Header Row): the header over a table of
  TableRows. Its `TableHeaderCell`s are `children`, one per column, and
  `showExpand`, `showCheckbox` (a select-all box; `checkboxProps` go to it)
  and `showActions` add a column per control. Inside it, header cells take the
  rows' padding (16 at the sides, 12 above and below), so the labels line up
  with the cells under them, and a 1px `stroke.subtle` line runs under the row.
- **`TableList`** (Table / List): the plain list table, a `TableHeaderRow`
  (`header`) over `TableRow`s (`children`), with no fill or outer border, at
  its container's width.
- **`TableCell` `type="custom"`** (Table / Cell Type=Custom): any content or
  control at its own size (Account Details, a Toggle, the expand button, an
  Empty State across the row), with the other types' padding.

`TableHeaderCell` keeps its 6px padding on its own and takes the rows'
padding inside a `TableHeaderRow`. `SkeletonTableRow`'s cells are now
`type="custom"`; nothing looks different.

In Storybook, every table's header is now a `TableHeaderRow`: header rows are
45px tall (44 and the line) instead of 33, in Light and Dark, and Manage
Currencies' header gains its bottom line. The patterns' `RecordsTable` is
replaced by `TableList`.
