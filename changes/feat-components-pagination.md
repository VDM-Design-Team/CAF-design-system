---
bump: minor
---
### Components: Pagination and PaginationItem (October 2026)

**`Pagination`** is the table pagination bar, built straight from the CAF
Figma library (page **Pagination**): "Page 1 of 25", the ‹ / › arrows, the
page numbers and a … gap.
- `page` and `pageCount` set the items. `onPageChange` is called with the
  page to show.
- `pageInfo` is Figma's Page Info (default "Page {page} of {pageCount}").
  `showPageInfo` is Show Page Info (default true).
- Up to 7 pages show them all. Longer tables show the first and last
  pages and a window around the current one, as Figma's 1 2 3 4 5 … 25.
- It is a `<nav>`. The current page has `aria-current="page"`, and ‹ / ›
  are disabled at the ends.

**`PaginationItem`** is one page number or arrow (Figma's
`Pagination / Item`): `selected` is State=Selected, and `disabled` is
State=Disabled.

Changed in the CAF Figma library first (needs publishing):
- **The selected page's number** now uses `action/primary/content/default`.
  It was `text/primary`, which failed contrast on the blue in both themes
  (2.96 / 3.85; now 6.81 / 4.77).
- **Disabled** now uses `text/disabled`, so ‹ on the first page reads as
  unavailable.
