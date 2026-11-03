---
bump: minor
---
### The header follows the 3 Nov Figma clean-up: Active link indicator, a lighter nav band, Ghost glyphs, and the mobile Account Row opens the Account Menu (November 2026)

From the CAF Figma library's clean-up of 3 Nov 2026 (decisions nav-active,
user-actions, mobile-menu and the fc-nav recommendations), published in
Figma first.

- **`NavLink`**: the Active link's label is semibold (Body/sm-semibold
  horizontal, Body/md-semibold vertical), and a 2px
  `action.primary.surface.selected` Indicator marks it: under the label on a
  header link, at the left edge of a Mobile Menu row. The Active fill is
  kept. The current page now shows in Light too, where the fill alone barely
  did (3.07:1 at the closest, the underline on the Active fill in Dark).
- **`AppHeader`**: the Navigation Area under the top bar is
  `surface.neutral.faint` (was `surface.base`). In Light the two bands now
  separate (#F8FAFC under white); in Dark the step is smaller than before.
- **`UserActions`**: 8px (`space.8`) between the greeting, the theme toggle
  and the account icon (was no gap), so the group is 16px wider.
- **`ThemeToggle`**, **`AccountMenu`**'s account icon and **`MobileHeader`**'s
  ☰ / ✕: the glyphs are `text.secondary`, IconButton Ghost's colour (were
  `text.primary`), in the desktop header and below 768px, Light and Dark.
- **`MobileMenu`**: the Account Row is now a button, AccountMenu's trigger.
  It opens the Account Menu below it, 16px in, on `document.body` (so the
  menu's scroll can't cut it off), and `onAccountSelect` gets the item chosen.
  It looks as before, with a focus ring on keyboard focus, and it is the last
  Tab stop in the menu. No prop changes; the row's element changes from `<p>`
  to `<button>`.
