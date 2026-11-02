---
bump: minor
---
### Alert action, ModalHeader actions and a Changelog item in the Account Menu (November 2026)

Three additions from the CAF design decisions, made in the CAF Figma library
first:

- **`Alert`** takes `showAction`, `action` (the label, e.g. "Retry") and
  `onAction`: a small Text button after the text and before the dismiss
  button, as Toast places its action. For a list that failed to load.
- **`ModalHeader`** takes `actions`: icon buttons beside the close button,
  4px apart, such as Audit Logs' refresh.
- **`AccountMenu`** has a **Changelog** row after Settings
  (`onSelect('changelog')`), so people can reopen what's new. It shows in
  the header's account menu and in the mobile menu's account rows.
