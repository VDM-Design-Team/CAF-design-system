---
bump: minor
---
### Components: Button, and the component layer (October 2026)

CAF gets its first component, `Button`, built straight from the CAF Figma
library (page **Buttons**: `Button / Big`, `Button / Normal`,
`Button / Small`). Its API uses Figma's own names:
- `variant` is the Style: `default`, `outlined`, `text`, `destructive`,
  `tonal`, `success`.
- `size` is `big`, `normal` or `small`.
- `leftIcon` and `rightIcon` are Show Icons.
- Hover, Pressed and Disabled are the button's own states.

Every colour is the semantic token the Figma layer is bound to, in Light and
Dark. Spacing, radius, type and elevation come from GDL.

Where the code differs from Figma (details in `docs/figma-sync.md`):
- **Heights** are fixed at 48 / 36 / 32px. Figma's heights follow Inter's
  auto line height, so they come out at 46–48 / 35–36 / 33px.
- **Icon gap** is 8px. Figma's Big and Normal use a raw 10px, which isn't on
  GDL's space scale.
- **Hover shadow** is `shadow.elevation.2`, the closest GDL elevation to
  Figma's raw hover shadow.
- **Focus ring** is a `stroke.focused` outline. Figma has no Focus state yet.

The component layer comes with it:
- React and Tailwind v4 via `cn()`, which knows GDL's type ramp, radius and
  elevation names.
- Storybook 10 on `dist/theme.css`, with a Light/Dark toolbar (`.dark` on
  `<html>`).
- Story tests with axe in Vitest, plus `lint:components` (no hex, px or
  arbitrary values; spacing on GDL's scale) and a typecheck, all in
  `npm test`.

Components aren't in the published package yet. They're Storybook-only until
the JS build is wired up.
