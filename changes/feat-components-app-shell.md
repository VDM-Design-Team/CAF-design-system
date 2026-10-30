---
bump: minor
---
### Components: app shell and navigation (October 2026)

Eleven components from the CAF Figma library's **Navigation** page: the
header every signed-in CAF screen shares, on desktop and below 768px, and
the parts it is built from. Every colour is the one the Figma layer is
bound to. They follow the page's theme, Light or Dark (Figma pins the
headers and the mobile section to Dark).

**`AppHeader`** is `Navigation / Header`, `Header – Admin` (ten links) and
`Header – User` (five links), from patterns 15 and U08. The Top Bar sits
over the Nav Bar. In Dark the bands are `surface/neutral/base` and
`surface/base`; in Light both are white. The links are data: `links`
(label and `href`) and `page`, the current one. `APP_HEADER_ADMIN_PAGES`
and `APP_HEADER_USER_PAGES` give Figma's labels, and `renderLink` takes a
router's link. Below 768px the Mobile Header replaces it, and ☰ opens the
Mobile Menu.

**`TopBar`** is `Navigation / Top Bar`: the CAF logo on the left; "Hi,
{name}", the theme toggle and the account menu on the right.

**`NavBar`** is `Navigation / Nav Bar`, the row of links under the Top
Bar: a `<nav>` landmark with a list of NavLinks. It takes the user app's
five links or the admin app's ten. `aria-label` is required.

**`NavLink`** is one navigation link. `orientation="horizontal"` (the
default) is `Navigation / Nav Link`, the header's Body/sm links;
`orientation="vertical"` is `Navigation / Nav Link – Vertical`, the Mobile
Menu's full-width Body/md rows. `active` is State=Active, the current page,
and sets `aria-current="page"`. Hover is `:hover`. It is an `<a href>`, and
`as` takes a router's link component.

**`Logo`** is `Navigation / Logo`, an inline `<svg role="img">` named
"CAF", 48px high by default; set `h-9` for the Mobile Header's 36px. The
wordmark is `text/primary`, so it follows the theme. The mark keeps CAF's
brand colours in both themes: Figma's raw logo colours map to the nearest
`caf-blue` steps (600, 300, 400).

**`UserActions`** is `Navigation / User Actions`, the right end of the top
bar: "Hi, {username}", the theme toggle (with a tooltip) and the account
icon, which opens the account menu. It takes `username`, `theme`,
`onThemeChange` and `onAccountSelect`.

**`UserGreeting`** is `Navigation / User Greeting`, the "Hi, {name}" in
the top bar.

**`ThemeToggle`** is `Navigation / Theme Toggle`. `theme` is the theme in
use: Dark shows the moon and Light the sun. It is controlled: a click calls
`onThemeChange` with the other theme, and the app switches CAF's theme
(`.dark` on `<html>`) and remembers it. Its accessible name says what a
click does ("Switch to light theme").

**`AccountMenu`** is `Navigation / Account Menu`, behind the account icon:
Manage Currencies, Settings, a divider, Logout. It opens below the icon,
flush right, with the menu button keyboard pattern. `onSelect` gets the
item chosen.

**`MobileHeader`** is `Navigation / Mobile Header`: the logo, the theme
toggle, the account menu and ☰, which turns into ✕ when the menu is open
(`menuOpen`).

**`MobileMenu`** is `Navigation / Mobile Menu – Admin`, and with the
user's links it is also the user app's menu. It is a full-width panel at
the top of the screen: the header with ✕, the links as vertical rows with
the current page highlighted, and the signed-in account at the bottom. It
opens as a modal: focus moves to ✕ and stays inside, and the page behind
dims and stops scrolling. ✕, Escape, a tap outside or choosing a link
closes it, and focus goes back to ☰.

Every label passes AA in Light and Dark. Where code differs from Figma
(details in `docs/figma-sync.md`):
- **Height:** links are 36px (Figma 33), vertical rows 40px (Figma 39),
  and the bar is 52px (Figma 49), because GDL's line heights are taller.
  The vertical rows' raw 10px padding becomes `space/8`.
- **Focus and hover:** every link and header icon gets Button's
  `stroke/focused` focus ring, and the header icons get IconButton Ghost's
  hover fill. Figma has neither.
- **Header icons:** the theme and account icons are both `text/primary`.
  Figma's User Actions shows a second account icon where its description
  puts the theme toggle; code shows the theme toggle.
- **Theme:** the Admin and User headers, which Figma pins to Dark, follow
  the page's theme.
