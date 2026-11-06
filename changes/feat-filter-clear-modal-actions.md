---
bump: minor
---
### Clear Filters, modal header actions and Button links (November 2026)

Code follows the CAF Figma library's 5 Nov 2026 additions (published 6 Nov).

- **New `FilterClear`** (Figma `Filter / Clear`): Clear Filters, an Outlined Button (Normal) with ArrowsClockwise in a box as tall as a filter field, for the filter bar's right end. Default, Hover, Pressed, Focus and Disabled are the button's own states, with Button's Outlined colours in Light and Dark. Show it only while a filter is in use: when nothing is filtered it is hidden, never disabled.
- **`ModalDialog` takes `actions`** (Figma's Show Actions on `Modal / Dialog`): icon buttons before the close button, 4px apart, such as Audit Logs' Refresh (ArrowsClockwise). A dialog without `actions` looks as before.
- **`Button` takes `href`**: a Button that navigates renders an `<a href>` with the same look and states, such as "Go back home" on the 404 page. With `disabled` it stays a disabled `<button>`. Hover and Pressed now use `not-disabled:` instead of `enabled:`, so the same classes style the link; a `<button>` looks the same as before. Its ref type is `HTMLButtonElement | HTMLAnchorElement`.
- **`AppHeader` and `MobileMenu`, docs only:** Figma's new Header Page=None is `page` left out (no link is current), and `Navigation / Mobile Menu`'s Links=Admin / Links=User is `links`. No API change.

Screens that look different, in Light and Dark: every filter bar's Clear Filters gains the ArrowsClockwise icon (Costs, Cost Centers, Users, Exports, Announcements). Recurring Costs (U04) and Drafts (U03) now sit in the filter bar's frame, with Clear Filters on its far right only while filtering; Drafts no longer shows a disabled Clear Filters. The Audit Logs dialog shows Refresh beside ×. The Users page's failed load shows Retry inside the Error Alert instead of under it.
