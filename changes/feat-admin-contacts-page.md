---
bump: minor
---
### Table cells for a cut-off value and a single row button (November 2026)

`TableCell` has two new types from the CAF Figma library's `Table / Cell`:

- `type="text-truncated"` (Figma Text (Truncated)): the value on one line,
  ending in … at the width its column leaves, as Contacts' Message column
  shows a long message. The whole value stays readable by screen readers.
- `type="button"` (Figma Button): one row action as a `<Button size="small">`,
  such as the red Destructive **Remove** on every Contacts row. Two or more
  actions still use `type="actions"` and the ••• menu.

Nothing else changes: existing cells look the same in Light and Dark. The
Storybook patterns and templates add Admin → Contacts (pattern 16 · Contact
messages): the list, the remove confirmation and toast, and its empty states,
in Light, Dark and at 320 wide.
