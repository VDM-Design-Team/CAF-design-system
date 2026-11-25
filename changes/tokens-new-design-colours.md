---
bump: minor
---
### Colours for the new CAF design: GDL blue links, and tokens for the sidebar, table and two new pills (November 2026)

These follow the colour decisions for the new CAF design (23 Nov 2026).
Every colour comes from GDL; CAF's brand ramp is unchanged.

**Links** move from CAF's own raw blues to GDL blue. In Light they are
blue-700, with blue-800 on hover and selected and blue-900 when pressed. In
Dark they are blue-300, with blue-400 on hover and pressed. Every
`text.link.*` reference now resolves to GDL, so links in the Toast, table
cells, form edit links and anything else using `text-link-*` look a little
different in both modes.

**New semantic names** (nothing uses them yet; the components follow):

| Token | Light | Dark | For |
|---|---|---|---|
| `surface.table.header` | slate-50 | slate-900 | Table header row fill |
| `surface.table.row.hover` | slate-100 | slate-700 | Table row on hover |
| `neutral.sidebar.surface.default` / `.content.default` | slate-900 / slate-300 | slate-950 / slate-300 | The new sidebar and its items |
| `neutral.sidebar.surface.selected` / `.content.selected` | slate-800 / white | slate-800 / white | The current sidebar item |
| `neutral.inverted.surface.default` / `.content.default` | slate-900 / white | slate-200 / slate-900 | The "Waiting on you" pill |
| `accent.critical.soft-outline.surface/border/content.default` | white, red-500, red-800 | slate-800, red-300, red-300 | The "Payment rejected" pill |

The decided Light outline for "Payment rejected" was red-300, but it reaches
only 1.9:1 on white and the 3:1 border rule fails it, so Light uses red-500
(3.8:1).
