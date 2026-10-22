---
bump: minor
---
### Components: Checkbox (October 2026)

`Checkbox` is built straight from the CAF Figma library (page **Selection
Controls**, `Checkbox`). It is a real `<input type="checkbox">`, so forms,
labels, the keyboard and screen readers work as usual, including "mixed".
Its API uses Figma's own names:
- `size` is `16` (default) or `20`.
- The States are the checkbox's own: Deselected is unchecked, Selected is
  `checked`, Mixed-State is `indeterminate`, and Hover is hovering an
  unchecked box.

Every colour is the semantic token the Figma layer is bound to, in Light and
Dark. The check and the mixed bar are Figma's own vectors.

Where the code differs from Figma (details in `docs/figma-sync.md`):
- **Focus ring:** a `stroke.focused` outline, as on Button. Figma has no
  Focus state yet.
- **Disabled:** Figma has no Disabled state, so a disabled checkbox only
  changes its cursor.

The unchecked border is 1.48:1 in Light and 1.93:1 in Dark, below the 3:1
WCAG asks of a control's boundary. That's a Figma binding, and
`docs/figma-sync.md` has the suggested fix.

Checkbox is the first piece of Table selection: the CAF screens use it 65
times, in table headers and selectable rows.
