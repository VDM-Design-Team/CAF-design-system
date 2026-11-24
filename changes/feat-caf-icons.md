---
bump: minor
---
### CAF Icons v1.4 replace the Phosphor icons (November 2026)

Icon now draws CAF Icons v1.4, the set drawn for the new CAF design: a
24-unit grid, 2px lines with round caps and joins, and an open ring on
outlined circles. There are 79 of them, from `add` to `x-circle`, in
`icons/caf/` (the source; `npm run icons` builds them). Every component that
shows an icon looks different, in Light and Dark: chevrons, close, search,
delete, the status icons in Alerts, Toasts and Tags, the theme toggle, and
the table sort arrows (now `sort`, `sort-ascending` and `sort-descending`).

**Old names still work.** The Phosphor names that have a CAF counterpart are
deprecated aliases (`caret-down` draws `chevron-down`, `trash` draws
`delete`, `x` draws `close`; `ICON_ALIASES` lists all 22). Use the CAF name
in new code.

Eight Phosphor glyphs with no CAF counterpart yet still draw as Phosphor:
`arrow-up`, `files`, `funnel`, `lightning`, `minus-circle`, `rocket-launch`,
`tag` and `tray`.
