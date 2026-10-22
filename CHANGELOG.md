# Changelog

## 0.3.0 — 2026-10-22

### Components: TableCell (October 2026)

`TableCell` is the generic table body cell, built straight from the CAF
Figma library (page **Table**, `Table / Cell`). It is a `<td>`, so tables
built from it keep real row and column semantics for screen readers.
- `type` is Figma's Type: `text` (default, the old Cell Text), `two-line`,
  `tag`, `checkbox`, `actions`, `list` and `status-date`.
- Value is `children`. Primary, Secondary and Date are `primary`,
  `secondary` and `date`.
- `list` shows the first item and "+N more", and expands to a bulleted list
  with "Show less". It's a real toggle button, with `aria-expanded`.
- Type=Checkbox takes the CAF `Checkbox`. Tag, Actions and Status + Date
  take Status Pill, the row actions button and Tag as `children`, until
  those are built.

Every text style and colour is the one the Figma layer is bound to, in
Light and Dark. Where code differs from Figma (details in
`docs/figma-sync.md`):
- **Vertical padding** is 12px, not Figma's raw 14px, so a Text cell is
  44px (Figma 45).
- **Line heights** are GDL's, so multi-line cells run a little taller.

## 0.2.0 — 2026-10-22

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

### Component borders meet WCAG 1.4.11, Light and Dark (October 2026)

The contrast report now checks borders as well as text. Every
`….border.<state>` must reach 3:1 against `surface.canvas`, `surface.base`
and its own fill when that fill is opaque. Disabled and deselected states
are exempt. The 15 failing pairs came from 7 Figma variables. Each now
aliases another step of the same ramp in the CAF Figma library: 5 in Light,
2 in Dark. No names change.

- **Light, outline buttons and badges.** Default borders are one step
  darker: neutral is slate-500, success green-600 and pending orange-600.
  Each now matches its hover border, and the hover and pressed fills still
  change. Warning's default and hover borders are yellow-700, the same as
  pressed. That makes them clearly visible on white.
- **Dark, info outline.** The default border is blue-500, the same as hover.
- **Dark, selected secondary buttons.** The border is caf-blue-on-dark-600,
  the same as hover. The old border was dark navy and nearly vanished on
  the fill. This matches Light, where selected and hover share CAF-blue-600.

## 0.1.0 — 2026-10-21

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

### Every semantic pair meets WCAG AA, Light and Dark (October 2026)

The 37 pairs the contrast report flagged now pass. Each fix moves an alias
to another step of the same ramp in the CAF Figma library: 1 variable in
Light, 28 in Dark. No names change. `npm test` now runs `check:contrast
--strict`, so a pair that drops below AA fails CI.

- **Light.** `text.subtle` is slate-500 instead of slate-400, so subtle
  text reads a little darker.
- **Dark, text and focus.** Brand text is lighter: `text.brand.medium` is
  caf-blue-300 and `text.brand.strong` is caf-blue-200. The focus ring
  (`stroke.focused`) is caf-blue-300. The pressed link colour
  (`text.link.pressed`) is GDL blue-400 instead of a raw hex.
- **Dark, primary buttons.** Labels and icons are near-black
  (caf-blue-on-dark-100) on the unchanged periwinkle fill, in every state
  including selected.
- **Dark, selected secondary and tertiary buttons.** Labels are
  caf-blue-on-dark-700 instead of a dark tint that disappeared on the fill.
- **Dark, neutral buttons.** Outline labels stay slate-300 in every state.
  Tonal hover, pressed and selected use a slate-50 label on a slate-500 fill,
  so the three states now look the same. Filled buttons lighten on hover and
  selected (slate-300) and pressed (slate-200) instead of darkening.
- **Dark, accent tonal badges and buttons.** Hover labels on pending and
  critical are one step lighter (/200). Pressed labels are lighter on all
  five accents (/100, or blue-200 for info). Info outline's default label is
  blue-400, the same as its hover.

### First release — CAF's tokens on GDL (October 2026)

- **Built on GDL 0.1** (`@vdm-design-team/gdl`, from its git tag). It
  inherits the palette, spacing, radius, stroke, fonts, elevation 1–7, the
  47-style type ramp, dark elevation, desktop sizes and the build formats.
  The output uses the same file and CSS variable names as GDL's.
- **CAF's own tokens, generated from the CAF Figma library**
  (`figma-export/` → `npm run import:figma`):
  - `color.caf-blue` and `color.caf-blue-on-dark` (11 steps each)
  - `font.family.sans` → Inter, CAF's only override of GDL
  - 312 semantic colours in Light and Dark
- **Checked against GDL.** The GDL contract is satisfied: 247/247 required
  names, plus 7 known CAF extensions. All semantic aliases resolve to GDL
  Primitives or CAF's Brand Primitives. CAF's 45 text styles and 10
  elevations match GDL's exactly.
- **Contrast report** (`npm run check:contrast`): 37 semantic pairs below
  WCAG AA, 3 in Light (`text.subtle`) and 34 in Dark. The report doesn't
  fail the build yet. The fixes belong in Figma.
