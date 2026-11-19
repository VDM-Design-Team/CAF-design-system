---
bump: patch
---
### Focus after removing a row stays near its place on the last page (November 2026)

Drafts (••• → Delete) and Admin → Contacts (Remove) now share one rule for
where focus goes after a row is removed, `useFocusAfterRemoval` in
`src/patterns/`. When the removed row was the only one on the last page, that
page goes and focus lands on the last row of the page before it, the row just
above where the removed one was. Until now it went to that page's first row.
Otherwise focus behaves as before: it goes to the next row's action, to the
first row's when the removed row wasn't on screen, and to the search field
(Drafts: Create Cost) when no row is left. Drafts no longer fails when the
draft being deleted is filtered out of view. Nothing looks different, in
Light or Dark.
