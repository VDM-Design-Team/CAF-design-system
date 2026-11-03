---
bump: minor
---
### Modals, menus and feedback follow the 3 Nov Figma clean-up (November 2026)

Code follows the CAF Figma library's 3 Nov 2026 clean-up of the Modals, Menus
and Feedback pages, published by the user.

- **Menus and popovers** are on `surface.elevated` instead of
  `surface.neutral.faint` (decision menu-surface): Popover's shared surface
  (`popoverSurface`), so MenuDropdown, AccountMenu's panel, RowActionsMenu,
  MenuTriggerButton's menu and the lists of Select, FilterSelect and Combobox.
  In Light the panel is white on the slate-50 canvas; in Dark it is slate-800.
- **MenuItem** Hover is `neutral.tonal.surface.default` (was `surface.base`,
  invisible on the new panel), and the item the keyboard is on takes the same
  fill. A destructive item on hover or keyboard focus has the new
  Destructive Hover label, `accent.critical.tonal.content.hover`, which passes
  on that fill in Dark.
- **PaymentSchedules** has Modal / Dialog's 1px `stroke.subtle` edge and
  Elevation 4. **ChangelogModal** has Modal / Dialog's surface: `surface.base`,
  radius 12 (was 16), a 1px inside `stroke.subtle` and Elevation 4 (was 2).
- **ChangelogHeader**: the rocket is `accent.critical.tonal.content.default`
  (was `accent.red.medium`, 2.76:1 in Light), the date `text.secondary`, and the
  version a Tag Status=Info without its icon.
- **VersionBadge** is deprecated: show a version as
  `<Tag status="info" showIcon={false}>`. It stays exported for now.
- **PaymentRow** has a new `amount` prop (Body/sm-semibold, `text.primary`)
  between the date block and the status, and its status is a Tag (Completed
  "Done", Warning "Upcoming", no icon) instead of its own smaller badge. It is
  still 60 tall. The Recurring Costs patterns show each payment's amount.
- **Toast**: the action has a Hover, `text.link.hover`.
- **Spinner**: the indicator is `action.tertiary.content.default`. Light looks
  the same; in Dark it is near-white, 6.33:1 on the track (was 1.97).
- **EmptyState**: the Default tile is the neutral tonal pair
  (`neutral.tonal.surface.default` with the glyph in
  `neutral.tonal.content.default`), and a new `icon` prop (an Icon name,
  default `tray`) swaps the glyph. Compact is unchanged and has no `icon`.

Screens that look different, in Light and Dark: every open menu and select
list, the View Schedules and what's-new dialogs, toasts with an action on
hover, spinners in Dark, and the empty states on the Announcements and 404
pages.
