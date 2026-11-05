---
bump: major
---
### CAF installs GDL 1.0.0 (November 2026)

CAF now installs GDL 1.0.0 (it was 0.1.0). GDL 1.0.0 stops shipping its
placeholder brand ramps, the pink `color.primary` and the teal
`color.secondary`, to brands, and its contract check fails a brand token
that points at either. CAF never used them, and every CAF token, semantic
colour, type style and elevation is unchanged in Light and Dark. Nothing
looks different on any CAF screen.

Migration: `theme.css`, `tokens.css` and the JSON no longer carry the 22
`--color-primary-*` and `--color-secondary-*` variables (50–950), so the
`bg-primary-*` / `text-secondary-*` style utilities they made are gone. An
app that used them switches to CAF's own ramp (`caf-blue-*`) or, better, a
semantic colour such as `bg-action-primary-surface-default`.
