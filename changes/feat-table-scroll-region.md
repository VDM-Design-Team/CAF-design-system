---
bump: minor
---
### Tables scroll in their own region on narrow screens; row menus open outside it (November 2026)

From the CAF design decision add-phone-table-layout ("a table that scrolls in
its own region; row menus open outside it"). Figma has no phone layout, so
this is code only.

- **`TableList`** wraps its `<table>` in a scroll region that takes its
  container's width and scrolls sideways when the columns need more, so the
  page itself no longer scrolls sideways on a phone. While it can scroll, the
  region is a tab stop (the arrow keys scroll it), a `role="region"` named
  like the table (its `aria-label` or `aria-labelledby`), and shows the 2px
  `stroke.focused` ring inside its edge. While the table fits, the region is
  a plain `<div>` with no tab stop. New prop `regionClassName` styles the
  region; `className` and `ref` still go to the `<table>`.
- **`Popover`** has a new opt-in prop, `portal`: the panel renders on
  `document.body`, fixed at the trigger, and follows it on scroll and resize,
  so a container that scrolls or clips can't cut it off. The ARIA wiring,
  outside click, Escape, focus return and the Tab order (trigger → panel →
  what follows the trigger) are kept. The default is unchanged. `MenuDropdown`
  passes it through: use it for a menu in a table.
- **`RowActionsMenu`** opens its menu with `portal` by default, so a row's •••
  menu opens over the table's scroll region and the page, never clipped.
  `portal={false}` keeps it inline. Tests that look for the menu need
  `screen` instead of `within(canvasElement)`.
- **`Overlay`** leaves Tab alone in a popup it opened in a portal, so a
  RowActionsMenu inside a dialog or side sheet still closes on Tab and hands
  focus back to its •••.

Nothing looks different at desktop widths, in Light or Dark: menus open where
they did. On a phone every list page (Costs, Drafts, Cost Centers, Recurring
Costs, Exports, Announcements, Users) now fits the screen, with the table
scrolling in its region. At 1024 the Admin Costs table needs a few pixels
more than the 976 it gets, so it scrolls by those pixels inside its region.
