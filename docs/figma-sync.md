# Syncing tokens from Figma

CAF's tokens are generated from the CAF Design Library
(`WhVkTrQRI9bDTfOeAJXTrR`). Figma's REST variables API needs an Enterprise
plan, so the snapshot is taken through the Figma plugin API (Claude's Figma
connector) and committed as plain JSON. This is the same process GDL uses.

## Refresh

1. Change the CAF Figma library and publish it.
2. Ask Claude, in this repo: *"Refresh figma-export from the CAF Figma
   library."* It rewrites two files:
   - `figma-export/caf-variables.json`: the Brand Primitives and Semantics
     collections. It holds names, modes, values, descriptions and scopes.
     An alias is kept as `{ "alias": "<name>" }`, plus `"lib": "Primitives"`
     when it points into GDL.
   - `figma-export/caf-styles.json`: the text styles (name, family, style,
     size, bound size and family variables) and the Elevation effect styles.
3. `npm run import:figma` regenerates `tokens/`. It fails on any of these:
   - an alias outside GDL Primitives or CAF Brand Primitives
   - a GDL colour that doesn't exist
   - a text style or elevation that differs from GDL's

   It also prints Figma housekeeping notes, such as unbound or foreign
   variables on text styles.
4. Run `git diff`. Every token change should be one you meant. Then run
   `npm test`.
5. Commit the snapshot and the tokens together, add a `changes/` entry, and
   open a PR.

## Snapshot format

`caf-variables.json`, one variable per line so diffs stay readable:

```json
{ "name": "Semantics", "modes": ["Light", "Dark"], "variables": [
  {"n":"colors/text/primary","t":"C","v":[{"alias":"colors/slate/950","lib":"Primitives"},{"alias":"colors/monochrome/white","lib":"Primitives"}],"d":"…","s":["SHAPE_FILL","TEXT_FILL"]},
```

- `n`: name
- `t`: type (C = colour)
- `v`: one value per mode
- `d`: description
- `s`: scopes (omitted when ALL_SCOPES)

Brand Primitives have `"s": []`, meaning hidden from pickers.

## CI guard

CI runs `npm run import:figma` and fails if `tokens/` changes. So `tokens/`
can only move together with the snapshot.

## Open Figma housekeeping (snapshot of 20 Oct 2026)

`npm run import:figma` lists these. None of them changes a value:

- Heading/md-bold and the four Title/sm-* styles bind their size to
  `Font/Size/…`, a capitalised variable that isn't GDL's `font/size/…`.
- The three Label/md-* styles have no size variable bound.
- Label/sm-bold's size is bound to `font/size/body-sm`. It is the same
  14px, but the wrong tier.
- Heading/lg-regular has no family variable bound.
- `text.link.*` and `surface.overlay` are raw colours, not aliases. The
  contract check reports them as warnings.

## Components

Components are built straight from the CAF Design Library, never from an
intermediate export. Each one reads its variants, states and variable
bindings from the Figma component set. Where code has to depart from
Figma, the reason is listed below with the Figma change that would make the
two agree.

### Button (20 Oct 2026)

Source: page **Buttons** (`217:1679`), sets `Button / Big` (`252:3133`),
`Button / Normal` (`252:2890`) and `Button / Small` (`252:2649`), each Style ×
State × Show Icons. Code: `src/components/button/`. Every colour binding is
copied exactly, and the Storybook grids are checked against them in Light and
Dark.

Code departs from Figma here. Fix these in Figma:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Hugs Inter's auto line height: Big 46 / 48 with icon, Normal 35 / 36, Small 33 | Fixed 48 / 36 / 32, on GDL's line heights | Fixed heights 48 / 36 / 32 |
| Icon gap | Big and Normal: raw 10px, unbound | 8px (`space/8`, as Small already uses) | Bind item spacing to `space/8` |
| Hover shadow (Default, Destructive, Tonal, Success) | Two raw drop shadows, `0 1 2` and `0 4 4` at 25% black | `shadow.elevation.2`, the closest GDL elevation (Figma's is darker) | Apply the Elevation 2 effect style |
| Radius | Bound to GDL's `radius/8`, which the file shows under its old name `radius-4` (see TableExpandButton) | `rounded-8` | None: take GDL's library update in the CAF library |
| Focus | No Focus state | 2px `stroke.focused` outline, 2px offset | Add a Focus state |

Also in Figma: Text / Hover keeps a zero-width raw-blue stroke, which is
invisible and has no effect on code. The label's letter spacing is 0 in
Figma; the GDL ramp gives Label/md-semibold 0.1px.

Figma gaps the code copies exactly. These are for the designer to decide
(ratios from the tokens after PR #1's contrast fixes):

- **Tonal fails WCAG AA.** Its label is `action/primary/surface/default` on
  `surface/brand/faint → subtle → medium`:

  | Tonal | Default | Hover | Pressed |
  |---|---|---|---|
  | Light | 5.46 | **3.98** | **2.48** |
  | Dark | **3.59** | **2.79** | **1.77** |

  These are component pairs, so `npm run check:contrast` doesn't list them.
  In Storybook the per-size grids skip Tonal in axe's contrast check only.
  The "Tonal contrast — Light/Dark" stories report them in the a11y panel
  without failing the run. Once Figma's Tonal passes, delete
  `CONTRAST_TODO` in `Button.stories.tsx`.
- **Tonal Disabled looks the same as Tonal Default.** It has no disabled
  look.
- **Destructive and Success labels use `action/primary/content/default`,**
  not their own `accent/*/filled/content`. They pass AA now:
  - Dark Destructive: 4.82 / 6.36 / 9.57 (Default / Hover / Pressed).
  - Dark Success: 5.70 / 8.28 / 10.32.
  - Light: both white, 4.77 and up.

  The binding still ties them to the primary button's label, so a future
  change to `action/primary/content` moves them too. Their own tokens would
  give Dark 5.30 / 6.98 / 10.51 and 6.27 / 9.10 / 11.34.

Not built yet: `Button / Icon` (`461:1151`) and `Button / Menu Trigger`
(`461:1459`). They are separate components on the same page.

### Checkbox (21 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Checkbox`
(`253:248`): State (Deselected, Hover, Selected, Mixed-State) × Size
(16px, 20px). Code: `src/components/checkbox/`. Every colour binding is
copied exactly. The Storybook grids are checked against them: 36 checks in
Light and 36 in Dark, with no mismatches.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Selected artwork | Exports as one flattened SVG with the Light colours baked in (#5145CD fill, #CBD5E1 border, white check) | The box is drawn with the bound tokens. The check and the mixed bar are Figma's vectors (same path, 1.5 / 2px stroke, round caps and joins), drawn in the box's own coordinates in `action.primary.content.default` | None needed |
| Focus | No Focus state | 2px `stroke.focused` outline, 2px offset, as on Button | Add a Focus state |
| Disabled | No Disabled state | The native `disabled` attribute works, but only the cursor changes | Add a Disabled state (Radio has one) |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The unchecked border is below WCAG 1.4.11,** which wants 3:1 for a
  control's boundary.
  - Light: `stroke/default` on `surface/base` is 1.48:1; Hover's
    `stroke/strong` is 2.56:1.
  - Dark: 1.93:1 and 3.07:1.

  GDL's contract recommends `stroke.field` ("Resting border of a form
  control. Must reach 3:1"), which CAF doesn't have yet. Binding the
  Checkbox border to it would fix this. axe doesn't check non-text
  contrast, so the story tests can't catch it.
- **The corner radius changes on check.** Deselected and Hover use radius 2
  (the inner rectangle); Selected and Mixed-State use radius 4.
- **Selected and Mixed-State keep the `stroke/default` border** around the
  blue fill, which shows as a light grey edge in Light.
- **Hover is defined only for Deselected.** A checked box doesn't change on
  hover.

### TableCell (22 Oct 2026)

Source: page **Table** (`3:1823`), set `Table / Cell` (`460:900`), the
generic body cell, Type × its text properties. Code:
`src/components/table-cell/`. This replaces the older `Table / Cell Text`
(`99:203`), which is only a Body/sm-regular text layer with no padding.
Type=Text is that same text inside the cell. Every text style and colour
binding is copied exactly. The Storybook grids are checked against them:
58 checks in Light and 59 in Dark (padding, alignment, every text layer's
style and colour, gaps, the list bullet), with no mismatches.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Vertical padding | Raw 14px, unbound | 12px (`space/12`). With GDL's 20px Body/sm line height, a Text cell is 44px (Figma 45) | Bind to `space/12` |
| Line height | Inter's auto line height (17px for Body/sm) | GDL's ramp (20px), so List (Expanded) is 106px (Figma 100) | Bind the text styles' line heights to the ramp |
| List toggle | A text layer with no states | A `<button>` with `aria-expanded`, in `text/link/default`, with a 2px `stroke.focused` focus ring | Add Hover and Focus states for the toggle |
| Nested Status Pill, Tag, Row Actions | Instances | `children`. Type=Tag takes `StatusPill`; the stories show labelled stand-ins for Tag and Row Actions until they're built | None needed |

Contrast: the cell has no fill of its own, so its text sits on the row.

| Text | Light, `surface/base` / `canvas` | Dark, `surface/base` / `canvas` |
|---|---|---|
| `text/primary` | 20.17 / 19.28 | 14.63 / 17.85 |
| `text/subtle` (secondary line, date) | 4.76 / 4.55 | 5.71 / 6.96 |
| `text/link/default` (list toggle) | 5.01 / 4.79 | 6.73 / 8.22 |

All of them pass. `text/subtle` on Light canvas (4.55) is the closest to
the 4.5:1 limit.

For Table / Row: the generic Row's **Selected** fill is
`action/primary/surface/default` at **16% opacity**, a light tint. An
earlier version of this note measured it at full opacity. Composited over
`surface/base` / `surface/canvas`, the cell text on it is:

| Text on a Selected row | Light | Dark |
|---|---|---|
| `text/primary` | 15.76 / 15.12 | 11.98 / 14.68 |
| `text/subtle` (secondary line, date) | **3.72 / 3.57** | 4.67 / 5.72 |
| `text/link/default` (list toggle) | **3.92 / 3.76** | 5.51 / 6.76 |

No visible tint can fix the Light failures: `text/subtle` is only 4.55 on
`surface/canvas` without one. The fix (22 Oct 2026) keeps the tint and
darkens the text in a Selected row only:

| In a Selected row | Light | Dark |
|---|---|---|
| Secondary text → `text/secondary` | 8.09 / 7.76 | 9.72 / 11.90 |
| Links → `text/link/selected` | 5.36 / 5.14 | 5.51 / 6.76 |

`text/link/hover` would look the same in Light, but it fails in Dark
(3.77), so links use `text/link/selected`. In Figma, `Table / Row`
State=Selected now overrides the Two Line cell's secondary text to
`text/secondary`. The component's description records the rule for other
cell types, because Figma can't bind a cell's text to its row's state.
Code applies it when Table / Row is built.

Figma gaps the code doesn't copy:

- **Frames pinned to Dark.** The "Generic Table Parts" section holding
  `Table / Cell` and `Table / Row` is pinned to Semantics Dark. That only
  affects how the library page looks: instances placed elsewhere follow
  their own frame. But the variants of the older `Table / Row – Cost` and
  `Table / Header – Costs` are pinned to Dark themselves, so every
  instance of them renders Dark, Light screens included (56 cost rows on
  the CAF screens). Clear those explicit modes, as with Pagination.
- **Widths are set per column** (Figma: 200 / 56 / 220 / 180px). The cell
  has no width; the table sets it.

### StatusPill (22 Oct 2026)

Source: page **Tags** (`89:858`), set `Status Pill` (`446:11344`): Status
(Pending, Active) and a Label text property. It's the filled pill in the
Costs and Recurring Costs tables, nested in every cost row (128 instances
on the CAF screens). Its labels there are "Pending", "Recurring" and
"Active". Code: `src/components/status-pill/`. Every colour binding is
copied exactly, and the Storybook grids check each pill against the
variables its layers are bound to, in Light and Dark.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Horizontal padding | Raw 10px, unbound | 12px (`space/12`), as Tag binds | Bind to `space/12` |
| Vertical padding | Raw 4px, unbound | 4px (`space/4`) | Bind to `space/4` |
| Radius | Raw 9999 | `radius/full`, as Tag binds | Bind to `radius-full` |
| Line height | Inter's auto (15px for Caption/md) | GDL's ramp (16px), so the pill is 24px tall (Figma 23) | Bind the text style's line height to the ramp |
| Letter spacing | 0 | GDL's Caption/md-semibold, 0.3px | As above |

With the padding and letter spacing, "Pending" is 74px wide (Figma 68)
and "Recurring" 84px (Figma 77).

Contrast: every label passes AA.

| Status | Light | Dark |
|---|---|---|
| Pending | 5.18 | 7.20 |
| Active | 6.81 | 4.77 |

Figma gaps the code copies exactly:

- **Pending's label is bound to `accent/warning/filled/content/default`,**
  not `accent/pending/filled/content/default`. Both are white in Light and
  slate-950 in Dark today, so nothing looks different. But a change to the
  warning label would move the pending pill too. Rebind it to
  `accent/pending/filled/content/default`.

Figma gaps the code doesn't copy:

- **Status=Pending is pinned to Semantics Light,** on the variant and on
  every Pending instance (17 on the Table page). It always renders Light, even on a
  Dark screen. Inside the cost rows, which are pinned to Dark (see
  TableCell), Pending shows Light (orange-700, white label) next to an
  Active pill that shows Dark. In code both statuses follow the page's
  theme: Pending is orange-500 with a slate-950 label in Dark. Clear the
  explicit mode on the variant.

### TableHeaderCell (22 Oct 2026)

Source: page **Table** (`3:1823`), set `Table / Header Cell` (`460:717`):
Sortable × Sort, with a Label text property. It heads the columns of the
Costs and Recurring Costs tables (124 instances on the CAF screens, all
Sortable=true, Sort=None). Code: `src/components/table-header-cell/`.
Every colour binding is copied exactly, and the Storybook grids check
each variant's label and arrows against the variables they're bound to,
in Light and Dark.

- **Label:** Body/sm-regular, `text/secondary` when unsorted and
  `text/primary` when sorted.
- **Arrows:** Phosphor Regular at 20px: ArrowsDownUp in `text/tertiary`
  when unsorted, ArrowUp / ArrowDown in `text/primary` when sorted. Code
  draws Phosphor's own paths, which match Figma's vectors exactly.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Padding and gap | Raw 6px, unbound | 6px (`space/6`) | Bind to `space/6` |
| Height | Hugs Inter's auto line height: 32 with the arrows, 29 without | 32 for both, on GDL's 20px Body/sm line height | Bind the text style's line height to the ramp |
| Letter spacing | 0 | GDL's Body/sm-regular, 0.4px, so a label is about 2px wider | As above |
| Sort control | Part of the cell, with no states | A `<button>` around the label and arrows that calls `onSort`, with a 2px `stroke.focused` focus ring. A sorted column sets `aria-sort` on the `<th>` | Add Hover and Focus states for the sort control |
| Default | Sortable=true | `sortable` is off unless set, because a sortable header needs an `onSort` handler | None needed |

Contrast: the cell has no fill, so it sits on the header row. Every
pair passes. The label must reach 4.5:1 and the arrows 3:1 (WCAG 1.4.11).

| Colour | Light, `surface/base` / `canvas` | Dark, `surface/base` / `canvas` |
|---|---|---|
| `text/primary` (sorted label and arrows) | 20.17 / 19.28 | 14.63 / 17.85 |
| `text/secondary` (unsorted label) | 10.35 / 9.90 | 11.87 / 14.48 |
| `text/tertiary` (unsorted arrows) | 4.76 / 4.55 | 9.85 / 12.02 |

Figma gaps the code doesn't copy:

- **The sorted variants don't use the Label property.** In Sort=Ascending
  and Sort=Descending the label text isn't connected to `Label`, so the
  property doesn't set a sorted header's text; it has to be edited by
  hand. Connect the text layer to the Label property in those two
  variants.
- **Header rows pinned to Dark.** `Table / Header – Recurring Costs` is
  pinned to Semantics Dark, like `Table / Header – Costs` (see TableCell),
  so its header cells render Dark on Light screens. Clear the explicit
  mode.

### TableRow (22 Oct 2026)

Source: page **Table** (`3:1823`), set `Table / Row` (`460:964`): State
(Default, Hover, Selected), the generic body row built from `Table / Cell`.
Code: `src/components/table-row/`, a `<tr>` with a `selected` prop. The
Storybook grids check the row fills and the selected-row text colours in
Light and Dark, and axe checks every text pair on the tint.

- **Default:** no fill, and a 1px `stroke/subtle` bottom border.
- **Hover:** `surface/base`.
- **Selected:** `action/primary/surface/default` at 16% opacity. The row's
  checkbox is checked.
- **Height:** 63px with a Two Line cell, as in Figma.

On the Selected tint, TableCell darkens its secondary text to
`text/secondary` and its links to `text/link/selected`, so they pass AA in
Light. The ratios and the decision are under TableCell. Figma overrides
only the sample row's Two Line cell; code applies the rule to every
secondary line, date and link a cell can show.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Selected + Hover | No such state | A selected row keeps its Selected fill under the pointer | None needed |
| Selected, for assistive tech | The checkbox is checked | The same: put a checked `Checkbox` in the row. A plain table row can't carry `aria-selected`, so the checkbox is what screen readers announce | None needed |

Not built: the older `Table / Row – Cost`, `Table / Row – Cost
(Selectable)` and `Table / Row – Recurring Cost`. Their Selected state is
a 2px `stroke/focused` border, not a tint, and the cost rows are pinned to
Dark (see TableCell).

### Icon (23 Oct 2026)

The CAF Figma library places Phosphor icons (MIT) at Regular weight, as
components named like `CaretDown / Style=Regular, Size=20px`. Code:
`src/components/icon/`. Each glyph is Phosphor's own path, from
`@phosphor-icons/core`. Checked against Figma's vectors (bounds of
caret, x, calendar, file, download, trash, arrows), they match.

- **The set** is the 39 icons the library and the CAF screens place,
  listed in `scripts/icons.mjs`. `npm run icons` writes
  `src/components/icon/icons.ts`, and `npm test` fails if that file is out
  of date. To add an icon, add its Phosphor name there.
- **Sizes:** 16, 20, 24, 32 and 48, the sizes Figma places.
- **Colour:** currentColor, so an icon takes the text token around it.

Not Phosphor, so not in the set yet:

- **`Bolt`** (Tag, Status=Active) is Heroicons' micro "bolt": its vector
  bounds (12×14 at 2,1 on a 16 grid) match Heroicons, not Phosphor. Code
  uses Phosphor `lightning` instead (see Tag).
- The older screens also place `heroicons-micro/check` and
  `heroicons-solid/plus`. Their library equivalents are Phosphor `check`
  and `plus`.

### IconButton (23 Oct 2026)

Source: page **Buttons** (`217:1679`), set `Button / Icon` (`461:1151`):
Size (32, 40) × Tone (Ghost, Tonal, Destructive) × State (Default, Hover).
Code: `src/components/icon-button/`. Every colour binding is copied
exactly, and the Storybook grids check each tone's fill at rest and on
hover, its glyph colour and its glyph size, in Light and Dark.

| Tone | Fill at rest | Fill on hover | Glyph |
|---|---|---|---|
| Ghost | none | `neutral/tonal/surface/default` | `text/secondary` |
| Tonal | `surface/base` | `neutral/tonal/surface/default` | `text/primary` |
| Destructive | none | `accent/critical/tonal/surface/default` | `accent/critical/tonal/content/default` |

Size 32 holds a 16px glyph and size 40 a 20px one.

Contrast: the glyph is a graphic, so it needs 3:1 (WCAG 1.4.11). Every
pair passes, the lowest being 5.22:

| Tone | Light, at rest (base / canvas) / hover | Dark, at rest (base / canvas) / hover |
|---|---|---|
| Ghost | 10.35 / 9.90 / 8.40 | 11.87 / 14.48 / 6.15 |
| Tonal | 20.17 / — / 16.36 | 14.63 / — / 7.58 |
| Destructive | 8.36 / 7.99 / 6.85 | 7.62 / 9.30 / 5.22 |

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Radius | Raw 8 | `radius/8` | Bind to `radius/8` |
| Focus | No Focus state | 2px `stroke.focused` outline, 2px offset, as on Button | Add a Focus state |
| Disabled, Pressed | No such states | Native `disabled` only removes the hover and shows a not-allowed cursor; no Pressed look | Add them if the screens need them |
| Name | The glyph is the only content | `label` is required and becomes `aria-label` | None needed |

Older icon buttons in the library that Button / Icon replaces. Code has
no separate component for them; each is an IconButton:

| Figma component | Differences from Button / Icon | In code |
|---|---|---|
| `Menu / Row Actions Button` (`405:551`, 56 on the screens) | Radius 6, 20px glyph in `text/primary`, no hover, **pinned to Dark** | `<RowActionsMenu>`: `<IconButton icon="dots-three" label="Row actions" />` plus its menu |
| `Navigation / Icon Button` (`4:235`) | 40×40 with a 24px glyph, bound to `text/primary` since 30 Oct (it was raw) | `<IconButton size={40} …/>` (20px glyph). The header's account icon (AccountMenu's default trigger) draws it in `text/primary` |
| `Modal / Close Button` (`348:8264`) | 24×32, 24px X | `<IconButton icon="x" label="Close" />` |

Fix in Figma: swap these for `Button / Icon` instances (Ghost 32 for row
actions and close, Ghost 40 in the header).

### Tag (23 Oct 2026)

Source: page **Tags** (`89:858`), set `Tag` (`330:3828`): Status
(Pending, Active, Completed, Error, Warning, Info, Neutral) × Show Icon.
Code: `src/components/tag/`. Every binding is copied exactly: padding
`space/4` / `space/12`, gap `space/4`, `radius-full`, Label/sm-medium. The
Storybook grids check each status's fill, label and icon colour, in Light
and Dark.

| Status | Fill / label and icon | Icon |
|---|---|---|
| Pending | `accent/pending/tonal` surface / content | `clock` |
| Active | `accent/info/tonal` | `lightning` (see below) |
| Completed | `accent/success/tonal` | `check-circle` |
| Error | `accent/critical/tonal` | `x-circle` |
| Warning | `accent/warning/tonal` | `warning` |
| Info | `accent/info/tonal` | `info` |
| Neutral | `neutral/tonal` | `minus-circle` |

Active and Info share the same colours and differ only by icon.

**The label** isn't a Figma property: each variant's text is its status
name. The screens override it ("Deleted", "Updated", "Failed", "Excel",
"Zip", version numbers), so in code it's `children`.

Contrast: every label passes AA on its fill. Light Pending and Warning
are close to the limit.

| Status | Light | Dark |
|---|---|---|
| Pending | 4.52 | 5.56 |
| Active, Info | 5.60 | 5.72 |
| Completed | 6.49 | 6.46 |
| Error | 6.85 | 5.22 |
| Warning | 4.59 | 6.53 |
| Neutral | 8.40 | 5.10 |

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Active's icon | `Bolt`: Heroicons' micro bolt, not Phosphor | Phosphor `lightning` | Swap to Phosphor `Lightning` |
| Pending's icon | `Clock` drawn as a 1px stroked outline, coloured through its stroke | Phosphor `clock` (filled path, like every other icon) | Use the Phosphor `Clock` glyph |
| Height | 25px, on Inter's auto line height | 26px, on GDL's 18px Label/sm line height | Bind the text style's line height to the ramp |
| Letter spacing | 0 | GDL's 0.2px; widths stay within about 1px of Figma | As above |

Figma gaps the code doesn't copy:

- **Status=Completed pins a remote "Semantics" collection** (another
  library's, not CAF's) to Light. Its bindings are CAF's own variables, so
  the pin does nothing. Clear the explicit mode.

### PaginationItem and Pagination (29 Oct 2026)

Source: page **Pagination** (`256:2590`):
- `Pagination / Item` (`405:566`): State (Default, Selected, Disabled)
  with a Page label.
- `Pagination` (`446:11483`): Page Info, Show Page Info, and the nested
  items ‹ 1 2 3 4 5 … 25 ›.

Code: `src/components/pagination-item/` and `src/components/pagination/`.
The CAF screens place 89 items directly rather than through `Pagination`,
so in code the bar is what tables use.

| Item state | Fill | Stroke | Label |
|---|---|---|---|
| Default | none | 1px inside `stroke/subtle` | `text/primary` |
| Selected | `action/primary/surface/default` | none | `action/primary/content/default` |
| Disabled | none | 1px inside `stroke/subtle` | `text/disabled` |

All items are Body/sm-semibold, 32×32. "Page X of Y" is Body/sm-regular in
`text/subtle`, with an 8px gap.

**Changed in Figma on 29 Oct 2026** (the user chose these; the library
needs publishing):
- **Selected's label** was bound to `text/primary`: 2.96 (Light) and 3.85
  (Dark) on the blue, below AA. It's now `action/primary/content/default`
  (6.81 / 4.77), as on Button and Status Pill.
- **Disabled's label** was `text/primary`, identical to Default, so ‹ on
  the first page looked clickable. It's now `text/disabled`.
- **Disabled's text wasn't connected to the Page property,** so the
  Previous arrow in `Pagination` showed the variant's default "1". It's
  connected now and shows ‹.

Contrast: the labels pass AA. Default is `text/primary` on the page
(20.17 Light, 14.63 Dark, on `surface/base`); Selected is 6.81 / 4.77;
Page Info is 4.76 / 5.71 on `surface/base`. Disabled is exempt.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Radius | Raw 6 | `radius/6` | Bind to `radius/6` |
| Focus, Hover | No such states | 2px `stroke.focused` focus ring, as on Button; no hover | Add Hover and Focus states |
| The … gap | An Item with the label "…" | A non-interactive `<span>` with the item's look, hidden from screen readers | None needed |
| Arrows and pages | Labels only | `aria-label` "Previous page", "Next page" and "Page N"; the current page has `aria-current="page"`; ‹ / › are `disabled` at the ends | None needed |
| Page window | Figma shows 1 2 3 4 5 … 25 | Up to 7 pages show them all. Otherwise the first and last, plus five pages at an end or three around the current page | None needed |
| Letter spacing | 0 | GDL's ramp, so "Page 1 of 25" is 86px (Figma 83) | Bind the text styles to the ramp |

Figma gaps the code doesn't copy:

- **`Pagination` is pinned to Semantics Dark,** so it renders Dark on
  Light screens. Clear the explicit mode.

### Popover (29 Oct 2026)

Source: none. The CAF Figma library has no Popover. Its surface is page **Menus** (`446:11509`) → `Menu / Dropdown` (`446:11510`), and it opens where pattern **03 · Row actions menu** (Patterns – Admin, `520:2387`) draws the menu. Code: `src/components/popover/`. MenuDropdown and Select are built on it, and a Date field will be.

Behaviour is hand-built like VCP's Popover, with no positioning library and no portal:
- The trigger is cloned with `aria-expanded`, `aria-haspopup` (from `panelRole`) and, while open, `aria-controls`.
- The panel opens below the trigger, 4px away, flush with its left or right edge (`placement`, `align`).
- It flips above the trigger, or to the other edge, when the viewport has no room.
- A pointer down outside, Escape or focus leaving closes it. If focus was inside, it goes back to the trigger.
- It doesn't trap focus: it is non-modal.

The stories check the surface against the tokens in Light and Dark, and test flipping in all four corners of the viewport.

| Layer | Figma (Menu / Dropdown) | Code |
|---|---|---|
| Fill | `surface/neutral/faint` | `bg-surface-neutral-faint` |
| Stroke | 1px inside `stroke/subtle` | `inset-ring inset-ring-stroke-subtle` |
| Radius | `radius/8` (raw 8 until 29 Oct) | `rounded-8` |
| Effect | `Effects/Elevation Dark/3` style | `shadow-elevation-3` |
| Padding | `space/6`, every side (raw 6 until 29 Oct) | `p-1.5` (`space/6`) |

Contrast. The panel's fill is the canvas colour (1.00 in both themes), so its edge is the stroke: `stroke/subtle` on `surface/canvas` is 1.18 (Light) and 1.72 (Dark), plus the shadow. The panel is a container, not a control, so WCAG 1.4.11 doesn't apply (see the design question under MenuDropdown). Content on it: `text/primary` 19.28 / 17.85; the focus ring (`stroke/focused`) 6.51 / 6.51.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Component | None | A code-only Popover with Menu / Dropdown's surface | Add a panel component if designers want overlays other than menus |
| Elevation in Dark | Elevation Dark/3: 15% and 20% black | `shadow-elevation-3`. Tailwind inlines theme shadows into the utility, so it is GDL's Light Elevation 3 (10% / 15%) in both themes | None in Figma: GDL's theme output has to carry Dark elevation (below) |
| Gap to the trigger | Pattern 03 draws the menu 4px under the ••• | `mt-1` / `mb-1` (`space/4`) | None needed |
| Placement | Pattern 03: under the button, right-aligned | `placement` bottom / top, `align` left / right, flipping at the viewport's edges | None needed |
| Text colour | None on the panel | `text/primary`, for content that sets none | None needed |
| Width | Fixed 212 (Menu / Dropdown) | Hugs its content (`w-max`); MenuDropdown sets its own minimum | None needed |

Limits:
- **No portal.** A parent with `overflow: hidden` or `auto`, such as a horizontally scrolling table, clips the panel.
- **Dark elevation doesn't reach components.** `dist/tokens.dark.css` redefines `--shadow-elevation-*` under `.dark`, but Tailwind v4 compiles `shadow-elevation-*` with the values inlined. Every elevated component is Light Elevation in Dark, Button's hover shadow included. The fix belongs in GDL's theme output.

### MenuItem (29 Oct 2026)

Source: page **Menus** (`446:11509`), set `Menu / Item` (`405:561`): Type (Default, Hover, Destructive) with a Label. Code: `src/components/menu-item/`.
- Type=Hover is `:hover`.
- Type=Destructive is `destructive`.
- Label is `children`.

It is a `<button role="menuitem">` outside the tab order, used inside MenuDropdown. The Storybook grids check fill, label colour, type style, padding and radius in Light and Dark, with Hover forced.

| Type | Fill | Label |
|---|---|---|
| Default | none | `text/primary` |
| Hover | `surface/base` | `text/primary` |
| Destructive | none | `accent/critical/tonal/content/default` |
| Destructive on hover (code only) | `surface/base` | `accent/critical/tonal/content/default` |

The label is Body/sm-regular, with 8 / 12 padding and radius 6.

Contrast: every label passes AA. Ratios are on the menu's `surface/neutral/faint` at rest, and on `surface/base` on hover:

| Label | Light, rest / hover | Dark, rest / hover |
|---|---|---|
| `text/primary` | 19.28 / 20.17 | 17.85 / 14.63 |
| `accent/critical/tonal/content/default` | 7.99 / 8.36 | 9.30 / 7.62 |

The focus ring (`stroke/focused`) on the menu is 6.51 in both themes.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius and padding** of the three variants are bound to `radius/6`,
  `space/8` and `space/12`. They were raw 6, 8 and 12, so nothing looks
  different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Hugs Inter's auto line height: 33 | 36, on Body/sm's 20px line height | Use the ramp's line height |
| Letter spacing | 0 | GDL's ramp (0.4px for Body/sm) | Bind the text style to the ramp |
| Width | Fixed 200 in the set (Fill inside Menu / Dropdown) | Fills the menu | None needed |
| Destructive + Hover | Not drawn | Hover's `surface/base` fill under the red label | Add it, or confirm (design question) |
| Focus | No Focus state | 2px `stroke.focused` outline, 2px offset, as on Button | Add a Focus state |
| Disabled | No such state | No `disabled` prop: leave out an action the user can't take | Add one if the screens need it |

Figma gaps the code doesn't copy:
- **The set is pinned to Semantics Dark** (mode `1:2`). Clear the explicit mode.
- **Hover is barely visible in Light:** `surface/base` (white) on `surface/neutral/faint` (slate-50) is 1.05:1 (Dark 1.22). This is a design question.

### MenuDropdown (29 Oct 2026)

Source: page **Menus** (`446:11509`), `Menu / Dropdown` (`446:11510`). How it opens comes from pattern **03 · Row actions menu** (`520:2387`): "opens Menu / Dropdown under the button, right-aligned", and it closes on a choice, a click outside or Esc. Code: `src/components/menu-dropdown/`. It's a Popover with `role="menu"`, named by its trigger, and the WAI-ARIA menu button pattern. The MenuItems are `children`; Figma's "hide unused items" is leaving them out.

| | Figma | Code |
|---|---|---|
| Surface | `surface/neutral/faint` fill, 1px inside `stroke/subtle`, radius 8, Elevation Dark/3, padding 6 | Popover's surface |
| Layout | Vertical auto layout, 2px item spacing, items Fill | `flex flex-col gap-0.5`; items `w-full` |
| Width | Fixed 212 | `min-w-64` (256), wider for a longer label |
| Items | Menu / Item instances, Destructive last | MenuItem `children` |

Keyboard. On the trigger, Enter, Space or ↓ opens the menu on the first item, and ↑ opens it on the last. A click also opens it on the first item. In the menu:
- ↓ / ↑ move and wrap.
- Home / End go to the first / last item.
- Enter or Space chooses an item, which closes the menu.
- Escape and Tab close it.

Focus then goes back to the trigger. A click outside closes the menu and leaves focus where the click put it. The Keyboard story tests every key.

Contrast: as MenuItem.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, padding and item spacing** of `Menu / Dropdown` are bound to
  `radius/8`, `space/6` and `space/2`. They were raw 8, 6 and 2, so nothing
  looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 212, raw and off GDL's scale | At least 256 (`space/256`) | Set the width to 256, or hug with a 256 minimum |
| Elevation in Dark | Elevation Dark/3 | `shadow-elevation-3`, Light values in both themes (see Popover) | None in Figma; fix GDL's theme output |
| Behaviour | Pattern 03: closes on a choice, a click outside or Esc | That, plus the arrow keys, Home / End and Tab | None needed |
| Name | None | Named by its trigger (`aria-labelledby`), or by `label` | None needed |

Figma gaps the code doesn't copy:
- **Menu / Dropdown is pinned to Semantics Dark** (mode `1:2`), as is every placement on pattern 03, so it renders Dark on Light screens. Clear the explicit mode.
- **Its effect is `Effects/Elevation Dark/3`,** a Dark style applied directly, to match the pin. With the pin cleared, use `Effects/Elevation Light/3`. Code uses GDL's Elevation 3 token.
- **The fill is the canvas colour** in both themes (1.00:1), so only the stroke (1.18 Light, 1.72 Dark) and the shadow set the menu apart. CAF's `surface/elevated` is described as "Cards, Widgets, Popovers". This is a design question.

### RowActionsMenu (29 Oct 2026)

Source: page **Menus** (`446:11509`), `Menu / Row Actions Button` (`405:551`, 56 on the screens), with the `Menu / Dropdown` it opens, placed as pattern 03 places it. Code: `src/components/row-actions-menu/`.
- The trigger is `<IconButton icon="dots-three" label="Row actions" />` (Ghost, 32).
- The menu is a MenuDropdown below the button, flush with its right edge.
- Put it in a TableCell of type `actions`.
- `label` names the button and its menu. Name the record when a table has many rows ("Actions for cost 123456").

Stories: in a TableRow (pointer and keyboard, with the menu over the next rows), and open in a table in Light and Dark.

| | Figma | Code |
|---|---|---|
| Button | The one-off 32×32 ••• | IconButton Ghost 32: `text/secondary` glyph (16px); `neutral/tonal/surface/default` on hover |
| Menu | Menu / Dropdown | MenuDropdown, `align="right"` |
| Placement | 4px under the button, right-aligned | `mt-1`, `right-0`; flips at the viewport's edges |

Contrast: the ••• glyph needs 3:1. It is 9.90 (Light) and 14.48 (Dark) on the canvas, and 8.40 / 6.15 on its hover fill (see IconButton). The menu is as MenuItem.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Button | One-off: radius 6, 20px DotsThree in `text/primary`, no hover | IconButton Ghost 32 (see "IconButton") | Swap it for a `Button / Icon` instance, Ghost 32 |
| Name | None | `label`, default "Row actions" | None needed |

Figma gaps the code doesn't copy:
- **The button is pinned to Semantics Dark** (mode `1:2`), like every placement in pattern 03. Clear the explicit mode.

### TextInput (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Text Input` (`441:11488`): State
(Default, Filled, Focus, Error, Disabled) with a Value text property.
Code: `src/components/text-input/`. It is a native `<input>`, so each
state is the element's own: Default is empty with a `placeholder`, Filled
has a value, Focus is `:focus`, Error is `aria-invalid` and Disabled is
`disabled`. Form / Field – Text (`184:3056`) sets it to Fill, so in code
it fills its container (`w-full`). Every binding is copied exactly. The
Storybook grids check each state's fill, stroke colour and width, text
colour and height, in Light and Dark.

| State | Fill | Stroke (inside) | Text |
|---|---|---|---|
| Default | `surface/elevated secondary` | 1px `stroke/subtle` | placeholder, `text/subtle` |
| Filled | `surface/elevated secondary` | 1px `stroke/subtle` | value, `text/primary` |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` |
| Disabled (50% layer opacity) | `surface/elevated secondary` | 1px `stroke/subtle` | `text/subtle` |

Every state is Body/sm-regular with radius 8.

Contrast, on the field fill:

| Pair | Light | Dark |
|---|---|---|
| Value, `text/primary` (4.5:1) | 20.17 | 17.85 |
| Placeholder, `text/subtle` (4.5:1) | 4.76 | 6.96 |
| Focus stroke, `stroke/focused` (3:1) | 6.81 | 6.51 |
| Error stroke, `accent/critical/outline/border/default` (3:1) | 3.81 | 3.74 |
| Resting stroke, `stroke/subtle` (3:1) | **1.23** | **1.72** |

Disabled is exempt.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius and side padding** of every state are bound to `radius/8` and
  `space/12`. They were raw 8 and 12, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Hugs raw 10px padding around Inter's auto line height: 39px, and 41px in Focus (strokes are included in layout, so the 2px stroke grows the field) | Fixed 40px (`space/40`) on GDL's 20px Body/sm line height. The stroke is drawn inside and never moves the layout | Fixed height 40, strokes not in layout (a 1px change, so it's the designer's call) |
| Padding | Raw 10 top and bottom; the sides are `space/12` | 12px sides (`space/12`). GDL has no 10; the 40px height centres the text | See Height |
| Letter spacing | 0, auto line height | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp |
| Focus | The Focus state is the 2px stroke | Copied on `:focus`. The browser's outline is hidden, but stays transparent so forced-colours mode still shows a ring | None needed |
| Error + Focus | No such state | The critical stroke at Focus's 2px, so the error stays visible while typing | Add it if it should look different |
| Disabled with a value | Only the placeholder is shown | A value also takes Disabled's `text/subtle` | None needed |
| Disabled opacity | Layer opacity raw 0.5 | `disabled:opacity-50` (copied since the forms phase; before, code missed it) | None in CAF: GDL has no opacity token to bind |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke is below WCAG 1.4.11,** which wants 3:1 for a
  field's edge. `stroke/subtle` is 1.23:1 (Light) and 1.72:1 (Dark) on the
  fill, and 1.18 / 1.72 on the canvas. In Light the fill is white on a
  `#F8FAFC` page (1.05), so the stroke is the only edge. GDL's contract
  recommends `stroke.field` (as for Checkbox). Among the existing strokes,
  only `stroke/stronger` passes in both themes (7.58 / 12.02). axe doesn't
  check non-text contrast, so the story tests can't catch it.
- **Disabled is 50% layer opacity** over Default's fill and stroke, with
  the text in `text/subtle`. Pagination / Item's Disabled uses
  `text/disabled` instead, and GDL has no opacity token.

Figma gaps the code doesn't copy: none (no pinned modes).

### SelectTrigger (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Dropdown Input` (`441:11504`):
State (Default, Filled, Focus, Error, Disabled, Open) with a Value text
property and a nested `CaretDown / Style=Regular, Size=20px`. Code:
`src/components/select-trigger/`. It is the closed select. The list it
opens (Select / Menu, `456:631`) belongs to Select, which isn't built yet.

- Value → `value`, the chosen option's label. Left empty, it is
  State=Default and shows `placeholder` (default "Select option", Figma's
  default Value).
- Focus → `:focus-visible`. A mouse press opens it, and Open shows the
  same stroke.
- Error → `aria-invalid`.
- Disabled → `disabled`.
- Open → `open`, which sets `aria-expanded`.
- The caret → Icon `caret-down`, 20px.

It is a `<button role="combobox" aria-haspopup="listbox">`, the trigger
of a select-only combobox. A combobox isn't named by its text (that's its
value), so it's named by a `<label htmlFor>` (as in Form / Field –
Dropdown, `184:3063`), `aria-label` or `aria-labelledby`. While open,
Select passes `aria-controls` with the list's id. Form / Field – Dropdown
sets it to Fill, so in code it fills its container.

Every binding is copied exactly. The caret's was fixed in Figma first
(below). The Storybook
grids check each state's fill, stroke colour and width, text colour,
caret colour and size, height and `aria-expanded`, in Light and Dark.

| State | Fill | Stroke (inside) | Text | Caret |
|---|---|---|---|---|
| Default | `surface/elevated secondary` | 1px `stroke/subtle` | placeholder, `text/subtle` | `text/subtle` |
| Filled | `surface/elevated secondary` | 1px `stroke/subtle` | value, `text/primary` | same |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` | same |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` | same |
| Disabled (50% layer opacity) | `surface/elevated secondary` | 1px `stroke/subtle` | `text/subtle` | same |
| Open | `surface/elevated secondary` | 2px `stroke/focused` | placeholder, `text/subtle` | same |

Every state is Body/sm-regular with radius 8, the value on the left and
the caret on the right.

Contrast, on the field fill:

| Pair | Light | Dark |
|---|---|---|
| Value, `text/primary` (4.5:1) | 20.17 | 17.85 |
| Placeholder, `text/subtle` (4.5:1) | 4.76 | 6.96 |
| Caret, `text/subtle` (3:1) | 4.76 | 6.96 |
| Caret before the 29 Oct fix, raw `#E5E5E5` (3:1) | **1.26** | 14.17 |
| Focus and Open stroke, `stroke/focused` (3:1) | 6.81 | 6.51 |
| Error stroke (3:1) | 3.81 | 3.74 |
| Resting stroke, `stroke/subtle` (3:1) | **1.23** | **1.72** |

Disabled is exempt.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The caret** in every state was a raw `#E5E5E5` override, 1.26:1 on the
  Light field. It's now bound to `colors/text/subtle` (4.76 Light / 6.96
  Dark), as `_Combobox Input` and `_Date Input` bind theirs. The seven
  placements on the Form page follow it.
- **Radius and side padding** of every state are bound to `radius/8` and
  `space/12` (no visual change).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Hugs raw 10px padding around the 20px caret: 42px, and 44px in Focus and Open (strokes are included in layout) | Fixed 40px (`space/40`), the same as TextInput. The stroke is drawn inside | Fixed height 40, strokes not in layout (the designer's call) |
| Padding | Raw 10 top and bottom; the sides are `space/12` | 12px sides (`space/12`) | See Height |
| Gap | 0, space-between | 8px (`space/8`), so a long value truncates (…) before the caret | Set item spacing to `space/8` |
| Letter spacing | 0, auto line height | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp |
| Focus | The Focus state is the 2px stroke | Copied on `:focus-visible` (keyboard focus). The browser's outline is hidden, but stays transparent in forced-colours mode | None needed |
| Error + Focus or Open | No such state | The critical stroke at the 2px width | Add it if it should look different |
| Disabled opacity | Layer opacity raw 0.5 | `disabled:opacity-50`, caret included (copied since the forms phase; before, code missed it) | None in CAF: GDL has no opacity token to bind |
| Semantics | None | `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded` from `open`. Select passes `aria-controls` | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke is below WCAG 1.4.11:** the same as TextInput
  (1.23 / 1.72).
- **Disabled is 50% layer opacity,** as on TextInput.

Figma gaps the code doesn't copy: none. The caret's raw fill was fixed in
Figma (above).

### TableExpandButton (29 Oct 2026)

Source: page **Table** (`3:1823`), component `Table / Expand Button`
(`99:199`): the 28×28 caret button that opens a cost row to show its
breakdown. It has no component properties. Its expanded look comes from
`Table / Row – Cost` (`121:2782`) Expanded=true, which swaps the nested
CaretDown for CaretUp. Code: `src/components/table-expand-button/`.
`expanded` swaps the caret and sets `aria-expanded`, and `aria-controls`
points at what it opens. The Storybook grids check the fill, glyph colour,
radius, size, glyph size and position, the caret per state, and
`aria-expanded`, in Light and Dark.

| Layer | Figma binding | Code |
|---|---|---|
| Fill | `colors/neutral/tonal/surface/default` | `bg-neutral-tonal-surface-default` |
| Glyph (CaretDown, CaretUp) | `colors/text/primary` | `text-text-primary` (the Icon is `currentColor`) |
| Size | 28×28, fixed | `size-7` |
| Radius | GDL's `radius/4` (4px; the file still shows its old name, `radius-2`) | `rounded-4` |
| Padding | `Spacings/6`, around a 16px box | `p-1` (`space/4`), around the 20px glyph (see below) |

Contrast: the glyph is a graphic, so it needs 3:1 (WCAG 1.4.11).

| Pair | Light | Dark |
|---|---|---|
| Glyph `text/primary` on its fill | 16.36 | 7.58 |
| Fill on `surface/base` / `surface/canvas` (the shape only; the glyph carries it) | 1.23 / 1.18 | 1.93 / 2.36 |
| Focus ring `stroke/focused` on `surface/base` / `surface/canvas` | 6.81 / 6.51 | 5.33 / 6.51 |

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The expanded caret:** in `Table / Row – Cost` Expanded=true, the CaretUp
  vector was bound to the primitive `colors/CAF-blue/50` (about 1.1:1 on
  the fill in Light). It's now `colors/text/primary`, as CaretDown.

The radius needs no fix. It is GDL's `radius/4`, which the file shows
under its old name `radius-2` because GDL renamed its Radius variables
(`radius-2` → `radius/4`, `radius-4` → `radius/8`) and the CAF library
hasn't taken that library update yet.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Glyph size | `CaretDown / Size=20px` placed in a 16px box with 6px padding. The 20px glyph overflows the box and renders at 20px, 4px from each edge | A 20px Icon with 4px padding: the same rendering | Size the instance 20×20 and bind the padding to `Spacings/4` |
| Expanded | No property. `Table / Row – Cost` Expanded=true overrides the nested glyph to CaretUp | `expanded`: `caret-up` and `aria-expanded="true"` | Add an Expanded variant (design question) |
| Focus | No Focus state | 2px `stroke.focused` outline, 2px offset, as on Button | Add a Focus state |
| Hover, Disabled | No such states | No hover. Native `disabled` only shows a not-allowed cursor | Add them if the screens need them |
| Name | The glyph is the only content | `label` is required and becomes `aria-label`. It stays the same in both states; `aria-expanded` says the state | None needed |

Figma gaps the code doesn't copy:

- **The component is pinned to Semantics Dark** (`99:199`, and its
  instances in `Table / Row – Cost`), so it renders Dark on Light screens.
  Clear the explicit mode.

### TableDetailLabel (29 Oct 2026)

Source: page **Table** (`3:1823`), component `Table / Detail Label`
(`99:205`): one "Label: Value" line, with a Text property (`Text#99:1`).
TableAccountDetails stacks four of them. Code:
`src/components/table-detail-label/`. The Text property is `children`.
The Storybook grids check each line's colour and type style against the
bound tokens, in Light and Dark.

| Layer | Figma binding | Code |
|---|---|---|
| Text | Body/sm-regular (`font/size/body-sm`, `font/weight/regular`, `font/family/inter`) | `text-body-sm-regular` |
| Colour | `colors/text/primary` | `text-text-primary` |
| Text property | `Text` ("Label: Value") | `children`, the whole line |

Contrast: it has no fill, so it sits on the row.

| Text | Light, `surface/base` / `canvas` | Dark, `surface/base` / `canvas` |
|---|---|---|
| `text/primary` | 20.17 / 19.28 | 14.63 / 17.85 |
| `text/primary` on a Selected row's tint | 15.76 / 15.12 | 11.98 / 14.68 |

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Line height | Inter's auto line height, 17px | GDL's Body/sm, 20px. Four lines are 80px (Figma 68) | Bind the text style's line height to the ramp |
| Letter spacing | 0 | GDL's Body/sm-regular, 0.4px | As above |
| Wrapping | The text hugs, on one line | A `<p>`: it wraps if its column is narrower than the line | None needed |

### TableAccountDetails (29 Oct 2026)

Source: page **Table** (`3:1823`), component `Table / Account Details`
(`99:214`): the cost row's Account column. It holds four nested
`Table / Detail Label` instances (ID, Applicant, Beneficiary name, IBAN
Account) and a Category Tag (`Category Tag#99:3`, an instance swap whose
default is `Status Pill / Status=Pending` (`96:232`) labelled
"Recurring"). It is nested in every `Table / Row – Cost` (56 on the
screens). Code: `src/components/table-account-details/`. The Storybook
grids check the lines' colour and stacking and the 12px gap to the tag, in
Light and Dark. They also check it in a TableRow (Default, Hover,
Selected, Expanded) next to a TableExpandButton.

| Figma | Code |
|---|---|
| Frame: vertical, gap `space/12`, hugs | `flex flex-col items-start gap-3` |
| Details: vertical, gap 0 | `flex flex-col items-start` |
| The four `Table / Detail Label` instances | `children`: one `<TableDetailLabel>` per line |
| Category Tag (instance swap) | `categoryTag`: a `<StatusPill>` (Figma's default) or a `<Tag>`. Optional |

Contrast: the lines are `text/primary` (see TableDetailLabel). The
category pill keeps Status Pill's own label binding: Pending is 5.18
(Light) / 7.20 (Dark), and a Tag Info is 5.60 / 5.72.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The Category Tag's label** was overridden to `text/primary`: 3.90
  (Light) and 2.80 (Dark) on the orange, below AA. It now has Status Pill's
  own binding, `accent/warning/filled/content/default` (5.18 / 7.20), and
  the tags in every `Table / Row – Cost` variant follow. Figma still lists
  a fill override on `99:223`, but it holds the same variable; Reset in
  Figma's UI clears it.
- **The gap** is bound to `space/12` (it was raw 12; no visual change).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Category Tag | Always shown | `categoryTag` is optional; leave it out for no tag | Add a Show Category Tag boolean if the screens need one |
| Height | 103 (17px lines, 23px pill) | 116 (20px lines, 24px pill), on GDL's ramp | Bind the text styles' line heights to the ramp |
| Width | 301 in the cost row | Hugs; the table sets the column width | None needed |

Figma gaps the code doesn't copy:

- **The component is pinned to Semantics Dark** (`99:214`), and its
  Category Tag is pinned to Light (Status Pill's known pin). Code follows
  the page's theme. Clear both explicit modes.
- **The breakdown panel** under an expanded row (`Table / Row – Cost`
  Expanded=true: a `surface/base` panel with a 4px `stroke/brand/strong`
  left border, and the row in `surface/canvas`) belongs to the cost row,
  which isn't built yet. The stories show a labelled stand-in.

### TabItem (29 Oct 2026)

Source: page **Tabs** (`89:812`), set `Tabs / Tab Item` (`297:284`):
State (Selected, Default) with a Label.

Code: `src/components/tab-item/`. It is a `<button role="tab">` that is
always inside a tab list (Tabs or FormTabNavigation). State=Selected means
the list's `selected` (or `active`) is this tab's `value`, which sets
`aria-selected`. The Label is `children`. `value` names the tab: Figma
has no such property, but the list needs a name to refer to it. Inside
FormTabNavigation the tab takes that component's look (see
FormTabNavigation). Only the selected tab is in the tab order, and the list
moves focus with the arrow keys.

| State | Fill | Label |
|---|---|---|
| Selected | `action/primary/surface/default` | `action/primary/content/default` |
| Default | none | `text/subtle` |

Both are Body/sm-semibold, 32px high (fixed), with 0 / 16 padding and
radius 8. The Storybook grids check each state's fill, label colour, type,
height, padding and radius, in Light and Dark.

Contrast: the labels pass AA. Selected is 6.81 (Light) and 4.77 (Dark) on
the blue. Default is `text/subtle` on the bar's
`surface/elevated-secondary`: 4.76 / 6.96. The focus ring
(`stroke/focused`) is 6.81 / 6.51 on the bar.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Selected's label** was `text/primary`: 2.96 (Light) and 3.85 (Dark) on
  the blue, below AA. It's now `action/primary/content/default` (6.81 /
  4.77), as on Button, Status Pill and Pagination / Item, and the Cost Type
  tabs follow. In Dark the label turns near-black on the blue.
- **Radius and side padding** are bound to `radius/8` and `space/16` (no
  visual change).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Focus, Hover, Disabled | No such states | 2px `stroke/focused` focus ring, as on Button. No hover, no `disabled` | Add Hover and Focus states if tabs need them |
| `value` | None: the Selected variant names the tab | Each TabItem has a `value`, which the list's `selected` / `active` refers to | None needed |
| Letter spacing | 0 | GDL's 0.4px (Body/sm), so "Recurring" is 102px wide (Figma 98) | Bind the text styles to the ramp |

Figma gaps the code doesn't copy:

- **The set is pinned to Semantics Dark** (`297:284`), so the library page
  shows the tab only in Dark. Clear the explicit mode.

### Tabs (29 Oct 2026)

Source: page **Tabs** (`89:812`), set `Tabs / Cost Type` (`297:317`):
Selected (All, Recurring, Single), with three nested `Tabs / Tab Item`
instances. The Costs list uses it above the table.

Code: `src/components/tabs/`, built as a generic segmented tab list. Cost
Type is one use of it: `<TabItem value="all">All</TabItem>` and so on.
- Selected → `selected`, the selected tab's `value`. Uncontrolled, use
  `defaultSelected` (default: the first tab). `onSelectedChange` receives the
  value of the tab the user picks.
- The nested Tab Items → TabItem `children`.
- It is a `role="tablist"`: give it an `aria-label`. Keyboard follows the
  WAI-ARIA tabs pattern, and selection follows focus. ← / → move to the
  previous or next tab and wrap, and Home / End go to the first or last.
  Only the selected tab is in the tab order. The With Panel story wires
  the panel it switches with `aria-controls` and `aria-labelledby`.

| Part | Binding |
|---|---|
| Bar fill | `surface/elevated-secondary` |
| Bar layout | Horizontal, 8 / 4 padding, gap 4, radius 8. It hugs its tabs and is 48px high |
| Tabs | TabItem (see above) |

Contrast: the tab labels are as in TabItem. The bar has no contrast
requirement. In Light it is white on the canvas (1.05).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, padding and gap** of the three variants are bound to
  `radius/8`, `space/8` / `space/4` and `space/4` (no visual change).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Selected | One variant per value (All, Recurring, Single) | `selected` takes any tab's `value`, and the tabs are `children` | None needed |
| Width | 238 | 245, from GDL's letter spacing on the labels | Bind the text styles to the ramp |
| Focus | None | Each tab's focus ring (see TabItem) | Add a Focus state |

Figma gaps the code doesn't copy:

- **The set is pinned to Semantics Dark** (`297:317`), so the library page
  shows the tabs only in Dark. Clear the explicit mode.

### FormTabNavigation (29 Oct 2026)

Source: page **Form** (`183:1765`), set `Form / Tab Navigation`
(`441:11479`): Active (Tab 1, Tab 2), Tab 1 Label and Tab 2 Label. It is
the Single Cost / Recurring Cost switch at the top of the New Cost form.

This is not the same look as Tabs / Cost Type, so Tabs doesn't cover it.
It is its own component, but it shares TabItem and Tabs' keyboard and
roles. The differences:

| | Tabs / Cost Type | Form / Tab Navigation |
|---|---|---|
| Bar | Hugs its tabs; 8 / 4 padding; gap 4 | Fixed 510 (code: full width); 4 padding; gap 0 |
| Tabs | Hug their labels | Share the width equally |
| Tab size | 32 fixed; 0 / 16 padding; radius 8 | Hugs (33); 8 / 16 padding; radius 6 |
| Selected fill | `action/primary/surface/default` (blue) | `surface/base` (a raised neutral pill) |
| Selected label | `action/primary/content/default`, Body/sm-semibold | `text/primary`, Body/sm-medium |
| Other label | `text/subtle`, Body/sm-semibold | `text/subtle`, Body/sm-regular |

Code: `src/components/form-tab-navigation/`.
- Active → `active`, the active tab's `value`. Uncontrolled, use
  `defaultActive` (default: the first tab). `onActiveChange` receives the
  value of the tab the user picks.
- Tab 1 Label and Tab 2 Label → the TabItems' `children`, in order. Figma
  draws two tabs; code takes any number.

| Part | Fill | Label |
|---|---|---|
| Bar | `surface/elevated-secondary`, 4 padding, radius 8 | |
| Active tab | `surface/base`, radius 6, 8 / 16 padding | `text/primary`, Body/sm-medium |
| Other tab | none | `text/subtle`, Body/sm-regular |

Contrast: the labels pass AA. Active is 20.17 (Light) and 14.63 (Dark) on
`surface/base`. The other tab is 4.76 / 6.96 on the bar. The active pill
against the bar is 1.00 in Light and 1.22 in Dark. In Light the pill
doesn't show, and only the label's colour and weight mark the active tab
(a design question).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius and padding:** in both variants, the bar is bound to `radius/8`
  and `space/4`, and the Tab 1 / Tab 2 frames to `radius/6` and `space/8` /
  `space/16` (no visual change).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 510 | Full width of its container (`w-full`), shared equally by the tabs | None needed |
| Height | Tabs 33, bar 41 (Inter's auto line height, 17) | 36 and 44 (GDL's Body/sm line height, 20) | Bind the text styles' line height to the ramp |
| Active values | Tab 1, Tab 2 (positions) | The active tab's `value` | None needed |
| Tab 1 / Tab 2 | Plain frames, not instances | TabItem, which takes this look inside FormTabNavigation | Consider making them a Tab Item variant |
| Focus | None | 2px `stroke/focused` focus ring | Add a Focus state |
| Letter spacing | 0 | GDL's 0.4px | Bind the text styles to the ramp |

Figma gaps the code doesn't copy:

- **The Form page's Molecules section (`510:2701`) is pinned to Semantics
  Dark**, so Form / Tab Navigation (and the section's other molecules)
  show only Dark there. Clear the explicit mode.

### DatePickerDay (29 Oct 2026)

Source: page **Form** (`183:1765`), set `Date Picker / Day` (`456:671`):
State (Default, Today, Selected, In Range, Outside Month), with a Day text
property. Code: `src/components/date-picker-day/`. Every colour binding is
copied exactly. The Storybook grids check, in Light and Dark and on the
calendar's surface, each state's label colour, its fill, Today's ring, the
radius and the 36×36 size.

| State | Fill | Stroke | Label | In code |
|---|---|---|---|---|
| Default | none | none | `text/primary` | (no prop) |
| Today | none | 1px inside `stroke/focused` | `text/primary` | `today`, sets `aria-current="date"` |
| Selected | `action/primary/surface/default` | none | `action/primary/content/default` | `selected` |
| In Range | `surface/base` | none | `text/primary` | `inRange` |
| Outside Month | none | none | `text/disabled` | `outsideMonth`, which makes the button `disabled` |

Every state is 36×36 with radius 6, in Body/sm-regular. Day is `children`.

Contrast on the calendar's `surface/neutral/faint`:

| Pair | Light | Dark | Needs |
|---|---|---|---|
| Default and Today, label | 19.28 | 17.85 | 4.5 |
| Today, ring | 6.51 | 6.51 | 3 |
| Selected, label on fill | 6.81 | 4.77 | 4.5 |
| In Range, label on fill | 20.17 | 14.63 | 4.5 |
| In Range, fill against the panel | **1.05** | **1.22** | (a visible range) |
| Outside Month, label | **1.42** | **3.75** | exempt: inactive |

- **In Range barely shows in Light:** a white fill on a near-white panel.
  Code copies Figma. This is a design question.
- **Outside Month is below AA in both themes.** Code makes these days
  inactive (`disabled`), and WCAG 1.4.3 exempts inactive components, so
  axe passes with no exception. This is a design question.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The radius** of the five variants is bound to `radius/6` (no visual
  change).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Focus, Hover | No such states | 2px `stroke.focused` focus ring with a 2px offset, as on Button; no hover | Add a Focus state, and Hover if wanted |
| States combine | State is a single choice | `today` adds its ring to Selected or In Range; `outsideMonth` wins over everything | Decide how Today + Selected looks: on the Light fill the ring disappears |
| Outside Month | A look only | The button is `disabled`, so clicks and Tab skip it | None needed |
| Line height | Body/sm-regular, auto (17) | GDL's 20, with 0.4px letter spacing. The cell is a fixed 36, so nothing moves | Bind the text style to the ramp |

### Calendar (29 Oct 2026)

Source: page **Form** (`183:1765`), component `Date Picker / Calendar`
(`456:672`): a Month text property ("September 2026") and 42 Day
instances, each with its state set by hand. Its description says weeks
start on Monday, as in the app. Code: `src/components/calendar/`. That's
`Calendar` plus two internal files RangeCalendar shares: `CalendarMonth.tsx`
(one month and the keyboard) and `dates.ts` (plain Date maths, no
library). The stories check every layer's bound colour and Figma's sizes
in Light and Dark, mouse paging and the keyboard.

| Layer | Figma | Code |
|---|---|---|
| Panel fill | `surface/neutral/faint` | `bg-surface-neutral-faint` |
| Panel stroke | 1px inside `stroke/subtle` | `inset-ring inset-ring-stroke-subtle` |
| Panel radius | `radius/12` | `rounded-12` |
| Panel effect | Effects/Elevation Dark/3 | `shadow-elevation-3` (as Popover) |
| Padding, gap | `space/16`, `space/12` | `p-4`, `gap-3` |
| Month | Body/sm-semibold, `text/primary` | `text-body-sm-semibold text-text-primary` |
| ‹ › | `CaretLeft` / `CaretRight`, Regular 20px, `text/secondary` | `Icon` `caret-left` / `caret-right` at 20, `text-text-secondary` |
| Weekdays | Mo … Su: Caption/md-medium, `text/subtle`, 36×24, `space/4` apart | `text-caption-md-medium text-text-subtle`, `h-6 w-9`, `gap-1` |
| Days | 6 weeks × 7 Day instances, `space/4` apart both ways | `DatePickerDay`s, `gap-1` |

Code works out each day's state that Figma sets by hand:
- `value` is Selected.
- `today` is Today.
- Days of the neighbouring months are Outside Month.

There are always six weeks, from the Monday on or before the 1st, as
Figma draws them. `month` is the visible month (default: the selected
day's month, else today's), and ‹ / › call `onMonthChange` with its 1st.
Choosing a day calls `onChange` with it at local midnight.

Contrast, Light / Dark:
- Month: 19.28 / 17.85.
- Weekdays: 4.55 / 6.96. Light is just over AA.
- Carets: 9.90 / 14.48 (3:1 needed).
- Focus ring: 6.51 / 6.51.
- The days: as in DatePickerDay.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, padding and gaps:** the panel is bound to `radius/12`,
  `space/16` and `space/12`, and the Weekdays, Days and Week 1–6 gaps to
  `space/4` (no visual change). The Range's two months follow.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Size | 310×338: "include strokes in layout" adds the 1px stroke to the hug | 308×336: the stroke is an inset ring drawn over the padding | Turn off "strokes included in layout", or accept 2px |
| Elevation | The Elevation Dark/3 style, in both themes | `shadow-elevation-3`, which is GDL's Light Elevation 3 in both themes (see Popover) | As Popover |
| ‹ › | Bare 20px icons | 20×20 buttons named "Previous month" / "Next month", with the focus ring (`radius/4`, so the ring is rounded) | Make them Button / Icon instances (design question), or none needed |
| Month | Free text property | Built from `month` ("September 2026"). It is a polite live region and labels the grid | None needed |
| Weekdays | "Mo" … "Su" | Shown as Figma; screen readers hear "Monday" … as column headers | None needed |
| Structure | Frames | An ARIA grid: weekday column headers, and a gridcell per day with `aria-selected` | None needed |
| Keyboard | (none) | One tab stop (the selected day, else today, else the 1st). Arrows move by day and week, Home / End go to Monday / Sunday, Page Up / Page Down move by month (with Shift, by year), clamped to the month's length. The view follows the focus | None needed |
| Line height | Body/sm-semibold 17, Caption/md-medium 15 (auto) | GDL's 20 and 16, with letter spacing; header 20 and weekday 24 as in Figma | Bind the text styles to the ramp |

Figma gaps the code doesn't copy:

- **The Date Ranges section (`510:2708`) pins Semantics to Dark,** so the
  library page shows Day, Calendar and Range only in Dark. The components
  themselves aren't pinned, so their instances follow their screen. Clear
  the section's explicit mode so Light gets reviewed too: the pin hid In
  Range's Light problem.

### RangeCalendar (29 Oct 2026)

Source: page **Form** (`183:1765`), component `Date Picker / Range`
(`463:11925`), used by the Select Period and Creation Date filters. It
holds two `Date Picker / Calendar` instances, Month / Start ("October
2026") and Month / End ("November 2026"), with 12 and 24 October Selected
and 13–23 In Range. Code: `src/components/range-calendar/`, built on
Calendar's `CalendarMonth` and `dates.ts`.

| Layer | Figma | Code |
|---|---|---|
| Panel | Calendar's fill, stroke, radius 12 and Elevation Dark/3 | The same surface |
| Padding, gap | `space/8`, `space/8` | `p-2`, `gap-2` |
| Month / Start, Month / End | Calendar instances with their fill, stroke and effect removed | Two months with no surface of their own (`p-4 gap-3`): `month` and the month after |
| ‹ on Start, › on End | Each instance is missing the other arrow | ‹ on the first month and › on the second. Both page the pair by one month (`onMonthChange` gets the first month's 1st) |
| Range ends | Day State=Selected | `selected` |
| Between | Day State=In Range, each a 36×36 tile with radius 6, 4 apart | `inRange`, the same tiles, as Figma |

Contrast: as Calendar. The In Range label on its fill is 20.17 / 14.63.
The In Range fill against the panel is 1.05 / 1.22 (design question).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, padding and gap** are bound to `radius/12` and `space/8` (no
  visual change).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Size | 642×354 (strokes included in layout) | 640×352 | As Calendar |
| Arrows | No property: the Range's instances just lack › (Start) and ‹ (End) | Each month shows only its own arrow | Add Show Previous / Show Next booleans to Calendar |
| Picking | A static frame | Two picks, in either order. The first shows Selected alone until the second, and Escape drops it. `onChange({ start, end })` gets start on or before end | None needed |
| Across months | Not drawn | A range shows in its own month's grid. The other grid's copies of those days stay Outside Month | None needed |
| Keyboard | (none) | One tab stop across both months (the start, else today, else the first month's 1st). The arrows cross from one month into the other, and the view pages only when the focus leaves both | None needed |
| Today | Not in the frame | `today` gets its ring when it's in view | None needed |

Figma gaps the code doesn't copy: the Date Ranges section's Dark pin (see
Calendar).

### FilterField (29 Oct 2026)

Source: page **Filters** (`89:836`), set `Filter / Field` (`95:10`): Type
(Search, Dropdown) × State (Default, Filled). The set has three variants:
Search / Default, Search / Filled and Dropdown / Default. The real icons and
labels come from the instances in `Filter / Bar – Costs` (`256:4585`): Search
costs…, All Status (Funnel), All Payment Method (CreditCard), All Currency
(CurrencyCircleDollar), Select Period and Creation Date (CalendarBlank).
Code: `src/components/filter-field/`. The Storybook grids check every
binding in Light and Dark: the box's fill, stroke, radius and height, every
text and icon colour, and the auto layout's padding and gaps. They cover
the set and the Costs bar.

- **Type=Search** (`type="search"`, the default) is a search box: a leading
  magnifying glass and an `<input role="searchbox">`. **State=Filled** is
  the input having a value: the query in `text/primary`, plus the clear
  (×) button. The button, or Escape, empties the input, fires `onChange`
  with "", calls `onClear` and keeps focus in the box.
- **Type=Dropdown** (`type="dropdown"`) is a trigger `<button>`: a leading
  icon, the chosen `value` in `text/primary` and a caret. It is a trigger
  only. The List page pattern puts it in a Popover as the `trigger`, with
  a Select (status, payment method, currency) or a RangeCalendar (period,
  creation date) as the panel. Popover adds `aria-expanded`,
  `aria-haspopup` and `aria-controls`.
- **`icon`** is the leading icon instance swap. Search defaults to
  `magnifying-glass`, Dropdown to `funnel`.
- **`label`** (required) is the accessible name. On Search it is the
  input's `aria-label`. On Dropdown it is a visually hidden prefix, so the
  button reads "Status: All Status" and its name contains the visible text.

| Layer | Binding | Code |
|---|---|---|
| Box fill | `colors/surface/elevated secondary` | `bg-surface-elevated-secondary` |
| Box stroke | 1px inside `colors/stroke/strong` | `inset-ring inset-ring-stroke-strong` |
| Padding left / right | `24` (Spacings) | `px-6` |
| Gap (Search: icon → query → ×) | `16` | `gap-4` |
| Gap (Dropdown content: icon → value) | `12` | `gap-3` |
| Gap (Dropdown: content → caret) | 16 (unbound on the instances) | `gap-4`, `justify-between` |
| Radius | GDL `radius/8` (the file still shows its old name, `radius-4`) | `rounded-8` |
| Value / query | `colors/text/primary`, Body/sm-regular | `text-text-primary text-body-sm-regular` |
| Placeholder (Search / Default) | `colors/text/subtle` | `placeholder:text-text-subtle` |
| Icon / Clear (X, 16px) | `colors/text/subtle` | `text-text-subtle`, in a 24px `<button>` |
| Leading icon, caret (20px) | `colors/text/subtle` (raw #A3A3A3 until 29 Oct) | `text-text-subtle` |

Contrast:

| Colour | Light, on the field | Dark, on the field |
|---|---|---|
| `text/primary` (value, query) | 20.17 | 17.85 |
| `text/subtle` (placeholder, icons, ×) | 4.76 | 6.96 |
| `stroke/strong` (border), on the field / on the bar's `surface/neutral/faint` | **2.56 / 2.45** | 3.75 / 3.75 |
| `stroke/focused` (code's focus ring), on the bar | 6.51 | 6.51 |

Figma's raw icon grey, before the 29 Oct fix, was **2.52** in Light (7.08
in Dark). The Light border fails 3:1. That is a Figma binding, so code copies it, and it is
listed under the design questions below. axe doesn't check non-text
contrast.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The leading icons and the caret** were raw `#A3A3A3`, 2.52:1 on a Light
  field. They're now bound to `colors/text/subtle` (4.76 / 6.96), as Icon /
  Clear already was: in the three variants, and on the swapped CreditCard,
  CurrencyCircleDollar and CalendarBlank icons in both `Filter / Bar – Costs`
  variants.

The radius needs no fix. It is already GDL's `radius/8`, shown under its
old name `radius-4` because the CAF library hasn't taken GDL's rename (see
TableExpandButton).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Hugs 42px | 40px, as TextInput and SelectTrigger | Fix the height at 40 |
| Dropdown alignment | The variant packs the content and caret left (MIN). Every placed instance overrides it to space-between with an unbound 16 gap | Space-between, so the caret sits at the right edge | Set the variant to space-between and bind the gap to `16` |
| Dropdown with no value | No such state. The bar's Select Period and Creation Date are Type=Search instances with a calendar icon | Dropdown shows `placeholder` (default: `label`) in `text/subtle` | Swap those instances to Type=Dropdown and add the look (design question) |
| Clear (×) | A 16px icon with no states | A 24px `<button>` named "Clear search" (`clearLabel`). It pulls 4px into the gap and padding, so the glyph sits where Figma puts it. Escape clears too | Add Focus |
| Focus | No Focus state | 2px `stroke.focused` outline, 2px offset, as on Button. It goes on the box when the search input has focus, on the dropdown button, and on × | Add a Focus state |
| Hover, Disabled, Open | No such states | No hover. Native `disabled` only changes the cursor. Open is `aria-expanded` with no visual change | Add them if the screens need them |
| Long values | Overflow the 240px field ("All Payment Method" needs 250) | Truncated with an ellipsis | Turn on text truncation |
| Line height, letter spacing | Inter's auto line height (17px), 0 | GDL's Body/sm-regular, 20px and 0.4px | Bind the text style to the ramp |

Figma gaps the code doesn't copy:

- **Pinned to Dark.** `Filter / Field`, `Filter / Bar – Costs`, `Filter /
  Bar` and the Clear Filters instances pin the Semantics collection to
  Dark, so every filter field renders Dark on Light screens. Clear the
  explicit modes.
- **The value isn't a property.** The Value text isn't connected to a
  component property, so every instance overrides its characters. Add a
  Value text property.
- **Clear Filters is a field.** In `Filter / Bar – Costs` it is a Filter /
  Field Type=Search instance with an ArrowsClockwise icon and a
  `text/primary` label. It belongs to `Filter / Bar` and should become a
  Button when the bar is built.

### MenuTriggerButton (29 Oct 2026)

Source: page **Buttons** (`217:1679`), set `Button / Menu Trigger`
(`461:1459`): State (Default, Hover, Pressed, Disabled). Each variant is a
`Button / Normal` instance, Style=Default with Show Icons on. Its nested
`Button_Normal` shows the right icon (`Icon / Caret`, CaretDown 20px) and
hides the left one. The label is "Change Status (1)", Label/md-semibold,
edited on the exposed Button. Figma's description and the Patterns – Admin
page place it as **Export** in the list page headers and as the bulk
**Change Status (n)** (menu: Reject, Approve, Mark as Paid). Code:
`src/components/menu-trigger-button/`. It is `<Button variant="default"
size="normal" rightIcon={<Icon name="caret-down" />}>` as the trigger of a
MenuDropdown: `label` is the button's text, the MenuItems are `children`,
and `disabled` is State=Disabled. The Storybook grids force Hover and
Pressed and check the fill, label, caret, elevation and size of each
state, in Light and Dark.

| State | Fill | Label | Caret in Figma until 29 Oct | Caret in code (and Figma now) |
|---|---|---|---|---|
| Default | `action/primary/surface/default` | `action/primary/content/default` | `Colors/Neutral/50` (remote primitive) | the label's colour |
| Hover | `action/primary/surface/hover`, plus the hover shadow | `action/primary/content/hover` | `Colors/Neutral/50` | the label's colour |
| Pressed | `action/primary/surface/pressed` | `action/primary/content/pressed` | `Colors/Neutral/50` | the label's colour |
| Disabled | `action/primary/surface/disabled` | `action/primary/content/disabled` | `Colors/Neutral/300` | the label's colour |

Contrast, on the fill (Default / Hover / Pressed; Disabled is exempt):

| | Light | Dark |
|---|---|---|
| Label and caret, as code draws them | 6.81 / 10.76 / 13.82 | 4.77 / 7.43 / 10.25 |
| Figma's caret before the 29 Oct fix (`Colors/Neutral/50`) | 6.47 / 10.22 / 13.13 | 3.66 / **2.35 / 1.70** |

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The caret** in each state was overridden to a primitive from outside
  CAF's libraries, `Colors/Neutral/50` (Disabled: `/300`) in a remote
  collection called "Variable collection". That broke rule 3, and in Dark it
  drew a near-white caret beside the dark label (2.35 on Hover, 1.70 on
  Pressed). It's now bound to the label's own
  `colors/action/primary/content/{default, hover, pressed, disabled}`, so in
  Dark the caret is dark like the label.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height, icon gap, hover shadow, radius | Button / Normal's (35px hug, raw 10px gap, two raw shadows, remote `radius-4`) | Button's: 36px, `space/8`, `shadow.elevation.2`, `radius/8` | As listed under Button |
| Focus | No Focus state | Button's 2px `stroke.focused` ring | Add a Focus state |
| The menu | Not part of the component. The description says it opens `Menu / Dropdown` | MenuDropdown, below the button, 4px away and flush with its left edge (`align="right"` for a header's right end). It flips at the viewport's edges. Keyboard and focus return are MenuDropdown's | None needed |
| Open | No such state | `aria-expanded` only, with no visual change | Add an Open state if wanted |

Figma gaps the code doesn't copy: none.

### SelectOption (29 Oct 2026)

Source: page **Form** (`183:1765`), set `Select / Option` (`456:630`):
State (Default, Hover, Selected) with a Label. Code:
`src/components/select-option/`. It is a `<div role="option">` inside a
SelectMenu. It never takes focus: Select keeps focus on its trigger and
points at the option with `aria-activedescendant`. Every colour and type
binding is copied exactly. The Storybook grids force Hover and check each
state's fill, label, check, padding, radius and height in Light and Dark.

| State | Fill | Label | Check |
|---|---|---|---|
| Default | none | `text/primary` | hidden |
| Hover (`:hover`) | `surface/base` | `text/primary` | hidden |
| Selected (`selected`, `aria-selected`) | `surface/base` | `text/primary` | Phosphor `check`, 16px, `action/primary/surface/default` |

Every option is Body/sm-regular, with 8 / 12 padding, an 8px gap and
radius 6. It is 36px tall: 8 + GDL's 20px line height + 8, the same as
Figma's fixed 36.

Contrast passes AA:
- Label (`text/primary`) on the menu (`surface/neutral/faint`): 19.28 Light / 17.85 Dark.
- Label on `surface/base` (Hover, Selected): 20.17 / 14.63.
- Check, a graphic needing 3:1, on `surface/base`: 6.81 / 3.80.
- Focus ring (`stroke/focused`) on the menu: 6.51 / 6.51.

The fill itself is only 1.05 / 1.22 against the menu. AA doesn't require
a hover fill, and the check carries Selected (see the design question).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, padding and gap** of the three variants are bound to
  `radius/6`, `space/8` / `space/12` and `space/8` (no visual change).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 280 in the set; Fill in the menu | Fills the menu | None needed |
| Height | Fixed 36 | Hugs: 8 + 20 + 8 = 36 (GDL's Body/sm line height; Figma's label is 17px tall on Inter's auto line height) | Bind the text style's line height to the ramp |
| Letter spacing | 0 | GDL's 0.4px (Body/sm) | As above |
| Keyboard state | None | The option the arrow keys are on: Hover's fill (`data-active`), plus Button's 2px `stroke/focused` ring 2px out when the keyboard put it there (`data-focus-visible`) | Add an Active / Focus state |
| Selected + Hover | Not drawn | Stays `surface/base` | None needed |
| Disabled | No such state | None: leave the choice out | Add one if the screens need it |
| Check | A hidden instance in Default and Hover | Rendered only when `selected`, `aria-hidden` (`aria-selected` says the same) | None needed |

Figma gaps the code doesn't copy: none. No explicit variable modes are
pinned, and the Label is connected to the Label property in every
variant.

### SelectMenu (29 Oct 2026)

Source: page **Form** (`183:1765`), component `Select / Menu`
(`456:631`): five Select / Option instances (Philippines selected, United
States, United Kingdom, Romania, Hungary). Code:
`src/components/select-menu/`. It is a `<div role="listbox">` on the same
surface as Popover and Menu / Dropdown. Select shows it under its trigger.
On its own, it is the list for a control that positions it and drives the
keys itself (Form / Field – Combobox, later). The stories check the fill,
the inside stroke, the elevation, the radius, the padding, the 2px gap,
full-width options and the 200px height, in Light and Dark.

| Layer | Binding | Code |
|---|---|---|
| Fill | `surface/neutral/faint` | `bg-surface-neutral-faint` |
| Stroke | 1px inside, `stroke/subtle` | `inset-ring inset-ring-stroke-subtle` |
| Effect | Elevation Dark/3 | `shadow-elevation-3` (see Popover) |
| Radius | `radius/8` | `rounded-8` |
| Padding / gap | `space/6` / `space/2` | `p-1.5`, `gap-0.5` |

Contrast: options carry their own (see SelectOption). The stroke is
decorative: the elevation separates the menu, as on Menu / Dropdown.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, padding and item spacing** are bound to `radius/8`, `space/6`
  and `space/2` (no visual change). The collapsed 38px width isn't changed:
  fixing it changes the look, so it's a design question.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Hug, with options set to Fill, so the menu has **collapsed to 38px** and every label wraps one letter per line | In Select, at least the trigger's width (wider for a longer label). On its own, its container's width | Set the width to Fixed (510, as `_Dropdown Input`) |
| Height | No limit | `max-h-64` (`space/256`), then it scrolls; Select keeps the active option in view | Add a max height or a scrolling example |
| Elevation in Dark | Elevation Dark/3 | GDL's Light Elevation 3 in both themes (Popover's note) | None in Figma |

Figma gaps the code doesn't copy: none. No modes are pinned.

### Select (29 Oct 2026)

Source: page **Form** (`183:1765`). Figma has the parts but no assembled
Select: `_Dropdown Input` (`441:11504`, built as SelectTrigger) opening
`Select / Menu` (`456:631`) of `Select / Option` (`456:630`). No screen
places the menu. Code: `src/components/select/`. It composes SelectTrigger,
Popover (`panelRole="listbox"`) and SelectOption, and lays out Popover's
panel with SelectMenu's layout (Popover draws the same surface).

What code maps:
- `options` (strings or `{ value, label }`) become one SelectOption each.
  `value` / `defaultValue` is State=Selected. `onValueChange` gets the
  value when the user chooses a different option.
- The trigger shows the chosen label, or `placeholder` (State=Default).
  State=Open is the list showing. Error (`aria-invalid`), Disabled and
  the accessible name are the trigger's props, passed through.
- The list opens below the trigger, `space/4` away, flush left and at
  least as wide as the trigger. It flips above when there's no room below
  (Popover).
- It is the WAI-ARIA select-only combobox. Focus stays on the trigger,
  whose `aria-activedescendant` names the option the keys are on.
  - Closed: Enter, Space, ↓ and ↑ open on the chosen option (else the
    first). Home and End open on the first and last. Typing opens on the
    first match.
  - Open: ↓ and ↑ move one option and stop at the ends. Home, End, Page
    Up and Page Down (ten) jump.
  - Typeahead: keys within 500 ms make one search. A repeated letter
    cycles through the options that start with it.
  - Enter, Space and Alt + ↑ choose and close. Tab chooses and moves on.
    Escape closes without choosing. A click chooses; a click outside
    closes.
- The list is named like the select. With `aria-label`, it gets the same
  label. With `aria-labelledby`, it points at the same element. With a
  `<label htmlFor>`, it is named through the trigger.

Bindings: the trigger's are SelectTrigger's, and the list's and options'
are SelectMenu's and SelectOption's (above). The Open stories check them
in place, in Light and Dark: the trigger's 2px `stroke/focused` inside
stroke while open, the menu fill and stroke, Selected's fill and check,
the other options with no fill, and the position under the trigger.

Contrast: as SelectTrigger, SelectMenu and SelectOption.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| The whole | Parts only; no open example | Select composes them | Add an Open example to Form / Field – Dropdown |
| Placement | Not drawn | Below, `space/4` gap, flush left, at least the trigger's width; flips above | As above |
| Keyboard, active option | Not drawn | WAI-ARIA select-only combobox (above); the active option's look is SelectOption's | Add an Active / Focus option state |
| Long lists | Five rows | Scrolls past `space/256` | See SelectMenu |
| Empty `options` | — | The list doesn't open | None needed |

Popover changed with it: `panelProps` may carry the panel's
`aria-labelledby`, which Popover used to overwrite with the trigger's id.
Select passes its own `aria-labelledby` there.

Figma gaps the code doesn't copy: none.

### Overlay (29 Oct 2026)

Source: page **Patterns – Admin** (`504:13180`). The library has no Overlay component. Each modal pattern draws a frame named "Overlay" over the page: 04 Confirm destructive actions (`523:2311`), 05 Create or edit in a modal (`523:3068`, `523:3271`) and 06 Edit in a side sheet (`524:3423`). Panel / Side Sheet's description says to place it "over a page Overlay". Code: `src/components/overlay/`. It is the modal layer that ModalDialog, ModalConfirm and SideSheet are built on. Modals that Figma composes from `Modal / Header` (Payment Schedules, Changelog) can use it too.

| Layer | Figma | Code |
|---|---|---|
| Fill | `surface/overlay` (the frame's 75% is the variable's own alpha) | `bg-surface-overlay`, fixed over the whole viewport |
| Layout, 04 and 05 | Auto layout, centred, no padding | `placement="center"` |
| Layout, 06 | Auto layout, aligned right and top | `placement="right"`: the panel against the right edge at full height |

Behaviour is code only, hand-built like VCP's Modal with no new dependency:
- It renders through a portal to `<body>`.
- The panel is `role="dialog"` (or `alertdialog`) with `aria-modal="true"`. It is named by `aria-labelledby` (or `aria-label`).
- Focus moves to `initialFocusRef` or to the panel. Tab and Shift+Tab wrap inside the panel.
- Escape asks `onClose`. If a popup inside the panel is open (a MenuDropdown), that popup closes first.
- A backdrop click asks `onClose` when `dismissible` (the default).
- Every other child of `<body>` becomes `inert`, and page scroll is locked without a layout shift.
- On close, focus goes back to the opener.

Contrast: the scrim carries no text. The panel's `surface/base` against the scrim over the canvas is 1.18:1 in Light and 1.06:1 in Dark. The panel's edge comes from its 1px `stroke/subtle` and its shadow.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Edge padding (centred) | None | 16px (`space/16`), so a dialog never touches the viewport on a small screen | None needed |
| Behaviour | Static frames | Portal, focus trap, Escape, backdrop click, inert page, scroll lock, focus return | None needed |
| Reuse | A plain frame repeated on each pattern | One `Overlay` component | Make "Overlay" a library component |

### ModalHeaderIcon (29 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Header Icon` (`348:8268`). Code: `src/components/modal-header-icon/`. The tile is decorative (`aria-hidden`), because the header's title already names the dialog.

| Layer | Figma | Code |
|---|---|---|
| Tile | 40×40, `radius/8` | `size-10 rounded-8` |
| Fill | `accent/info/tonal/surface/default` | `bg-accent-info-tonal-surface-default` |
| Glyph | `CalendarBlank`, 24px, `accent/info/tonal/content/default` | `icon` (default `calendar-blank`), 24px, `accent/info/tonal/content/default` |

**Changed in Figma on 29 Oct 2026** (the library needs publishing):
- **The glyph's fill** (`I348:8269;3167:83758`) was a raw #7EB3F7: 1.78:1
  on the tile in Light, below the 3:1 an icon needs. It's now bound to
  `accent/info/tonal/content/default`, the pairing Modal / Confirm's info
  tile already uses on the same fill.
- **The tile's radius** was a raw 8. It's now bound to `radius/8`.

Contrast (the glyph needs 3:1): 5.60 in Light, 5.72 in Dark. Figma's old raw #7EB3F7 was 1.78 / 4.78.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Glyph | Fixed CalendarBlank, not a property | `icon` prop (the nested instance, as on IconButton) | Expose an instance-swap property |

### ModalHeader (29 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Header` (`348:8299`), with Title and Description. Payment Schedules (`348:8311`) uses it. Code: `src/components/modal-header/`. Modal / Dialog and Panel / Side Sheet draw their own headers, so ModalDialog and SideSheet don't use ModalHeader.

| Layer | Figma | Code |
|---|---|---|
| Header | Horizontal, centred; padding `space/16` / `space/24`, gap `space/12` | `py-4 px-6 gap-3 items-center` |
| Size | Fixed 512×80 | Fills its container, at least 80 tall (`min-h-20`) |
| Header Icon | `Modal / Header Icon` instance | `ModalHeaderIcon` (`icon`) |
| Title Container | Vertical, gap 0, Fill | `flex-1` column |
| Title | Body/lg-semibold, `text/primary` (Title) | `<h2>` `text-body-lg-semibold text-text-primary` (`title`, `titleId`) |
| Description | Body/sm-regular, `text/subtle` (Description) | `<p>` `text-body-sm-regular text-text-subtle` (`description`, `descriptionId`) |
| Close | `Modal / Close Button` | `<IconButton icon="x" label="Close">`, calls `onClose` |

Contrast, Light / Dark on `surface/base`:
- Title: 20.17 / 14.63
- Description: 4.76 / 5.71
- Close glyph (`text/secondary`): 10.35 / 11.87

**Changed in Figma on 29 Oct 2026** (the library needs publishing): the
header's padding and gap were raw 16 / 24 / 12. They're now bound to
`space/16`, `space/24` and `space/12`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Close button | 24×32, 24px X in `text/secondary`, radius 8, no hover or focus | IconButton Ghost 32: 32×32, 16px X, `neutral/tonal` hover, focus ring | Swap for `Button / Icon` (Ghost, 32) |
| Height | Fixed 80; the text is 39 tall on Inter's auto line height | At least 80; the text is 44 tall on GDL's line heights | None needed |
| Width | Fixed 512 | Fills its container | Set the width to Fill |
| Description | Always shown | Renders only when given | Add Show Description, as Modal / Dialog has |
| Element | n/a | A `<div>`, because a `<header>` could become a second banner landmark | None needed |

### ModalDialog (29 Oct 2026)

Source: page **Modals** (`299:3301`), set `Modal / Dialog` (`458:398`): Size (Small `458:340`, Medium `458:360`, Large `458:379`), Title, Description, Show Description, Show Footer and Content. Code: `src/components/modal-dialog/`. The header, body and footer bands are shared with SideSheet in `src/components/overlay/parts.tsx`, which is private.

How the Figma properties map:
- Size → `size`.
- Title → `title`, which is also the accessible name.
- Description → `description` (it describes the dialog).
- Show Description → `showDescription`. Figma's default is off, because its default text is a placeholder. Code shows the description whenever there is one.
- Content → `children`.
- Show Footer → `showFooter` (default true).
- The footer's Button instances (Text Cancel, Default Submit) → `footer`.

| Band | Figma | Code |
|---|---|---|
| Panel | `surface/base`, 1px inside `stroke/subtle` (strokes included in layout), `radius/12`, Effects/Elevation Dark/4, clips content | `bg-surface-base border border-stroke-subtle rounded-12 shadow-elevation-4 overflow-hidden` |
| Width | Small 400, Medium 560, Large 800 | `max-w-sm` 384, `max-w-xl` 576, `max-w-3xl` 768; narrower on a small screen |
| Header | Padding 20 / 24, gap 16, Space Between, centred; 1px `stroke/subtle` below | `px-6 py-5 gap-4 justify-between border-b border-stroke-subtle` |
| Title Group | Vertical, gap 4 | `gap-1` |
| Title | Body/lg-semibold, `text/primary` | `<h2>`, same tokens |
| Description | Body/sm-regular, `text/subtle`, hidden by default | `<p>`, same tokens |
| Close | `Modal / Close Button` | `IconButton icon="x" label="Close"` |
| Body | Padding 24, gap 16, holds the `_Slot` | `p-6 gap-4`; scrolls, and becomes a tab stop while it does |
| Footer | Padding 16 / 24, gap 12, right-aligned; 1px `stroke/subtle` above | `px-6 py-4 gap-3 justify-end border-t border-stroke-subtle` |

Contrast, Light / Dark:
- Title: 20.17 / 14.63
- Description: 4.76 / 5.71
- Close glyph: 10.35 / 11.87
- Footer buttons: as Button

The 1px `stroke/subtle` lines (1.23 / 1.41) are decorative dividers, not control borders.

**Changed in Figma on 29 Oct 2026** (the library needs publishing): the
three sizes' radius (raw 12) and every padding and gap in the header,
title group, body and footer (raw 24 / 20 / 16 / 12 / 4) are now bound to
`radius/12` and GDL's `space/*`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Raw 400 / 560 / 800 | Capped at 384 / 576 / 768 (Tailwind's container widths; GDL has no width scale) | Resize to 384 / 576 / 768, or bind to a GDL width scale |
| Elevation | Effects/Elevation Dark/4 | `shadow-elevation-4`. Tailwind compiles it to GDL's Light Elevation 4 in both themes, so Dark is a little lighter than Figma until the theme output carries Dark elevation (as on Popover) | None in Figma |
| Close | `Modal / Close Button` | IconButton (see ModalHeader) | Swap for `Button / Icon` |
| Height | Hugs; footer 68 with Inter's 35px buttons | Footer 69 (GDL's 36px Button); never taller than the viewport minus 16 on each side; the body scrolls | None needed |
| Show Description default | Off | On whenever there is a description | None needed |
| Focus, keyboard | n/a | Focus moves to the dialog and is trapped; Escape, Close and a backdrop click call `onClose`; focus returns to the opener | None needed |
| Header and footer elements | n/a | `<div>`s, because `<header>` and `<footer>` can become landmarks | None needed |

Figma gaps the code doesn't copy:
- **`_Slot` (`458:338`)** is a placeholder: a dashed `stroke/default` box on `surface/elevated secondary`. It isn't built; Content is `children`.
- **The Description layer is a fixed 213×17,** so a longer description is clipped. Code wraps it.

### ModalConfirm (29 Oct 2026)

Source: page **Modals** (`299:3301`), set `Modal / Confirm` (`458:436`): Type (Default `458:399`, Destructive `458:417`), Title and Message. Code: `src/components/modal-confirm/`.

How the Figma properties map:
- Type → `type`.
- Title → `title`.
- Message → `message`.
- The button labels, which Figma's description says to edit → `cancelLabel` (default "Cancel") and `confirmLabel` (default "Confirm", or "Delete" when destructive).

It is an `alertdialog` described by its message:
- Focus opens on Cancel.
- Escape and Cancel call `onClose`; the other button calls `onConfirm`.
- A backdrop click does nothing.

| Layer | Figma | Code |
|---|---|---|
| Panel | 420 fixed, padding 24, gap 20, `surface/base`, 1px `stroke/subtle`, `radius/12`, Elevation Dark/4 | `max-w-md p-6 gap-5 bg-surface-base border border-stroke-subtle rounded-12 shadow-elevation-4` |
| Content row | Gap 16 | `gap-4` |
| Icon Tile | 40×40, `radius/20` | `size-10 rounded-20` |
| Default tile | `accent/info/tonal/surface/default`; Info glyph in `accent/info/tonal/content/default` | Same tokens, Icon `info` 24 |
| Destructive tile | `accent/critical/tonal/surface/default`; Warning glyph in `accent/critical/tonal/content/default` | Same tokens, Icon `warning` 24 |
| Text | Vertical, gap 6 | `gap-1.5` |
| Title | Body/lg-semibold, `text/primary` | `<h2>`, same tokens |
| Message | Body/sm-regular, `text/secondary` | `<p>`, same tokens |
| Actions | Gap 12, right-aligned | `gap-3 justify-end` |
| Buttons | Button / Normal Text "Cancel"; Default "Confirm" or Destructive "Delete" | `<Button variant="text">`; `variant="default"` or `"destructive"` |

Contrast, Light / Dark:
- Title: 20.17 / 14.63
- Message: 10.35 / 11.87
- Info glyph: 5.60 / 5.72
- Critical glyph: 6.85 / 5.22
- Buttons: as Button

**Changed in Figma on 29 Oct 2026** (the library needs publishing): both
types' radius (raw 12), the icon tile's radius (raw 20) and every padding
and gap (raw 24 / 20 / 16 / 12 / 6) are now bound to `radius/12`,
`radius/20` and GDL's `space/*`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Raw 420 | Capped at 448 (`max-w-md`) | Resize to 448, or bind to a GDL width scale |
| Elevation | Elevation Dark/4 | `shadow-elevation-4` (see ModalDialog) | None in Figma |
| Role, focus | n/a | `alertdialog`, described by the Message; focus opens on Cancel | None needed |
| Closing | No close button | Escape and Cancel close it; a backdrop click doesn't | None needed |
| Labels | Text overrides on the button instances | `confirmLabel` and `cancelLabel` | Consider text properties |

### SideSheet (29 Oct 2026)

Source: page **Modals** (`299:3301`), component `Panel / Side Sheet` (`458:437`): Title, Content and Show Footer. Code: `src/components/side-sheet/`.

How the Figma properties map:
- Title → `title`, which is also the accessible name.
- Content → `children`.
- Show Footer → `showFooter` (default true).
- The footer's buttons (Text Cancel, Default Update) → `footer`.

It sits on an Overlay with `placement="right"`.

| Layer | Figma | Code |
|---|---|---|
| Panel | 672×900 fixed, `surface/base`, a 1px `stroke/subtle` line on the left only, no radius, Elevation Dark/4 | `max-w-2xl h-full bg-surface-base border-l border-stroke-subtle shadow-elevation-4` |
| Placement | Against the right edge of the Overlay, from the top | Flush right, the viewport's full height; full width below 672 |
| Header | Padding 20 / 24, gap 16, Space Between; 1px `stroke/subtle` below | `px-6 py-5 gap-4 justify-between border-b border-stroke-subtle` |
| Title | Body/lg-semibold, `text/primary` | `<h2>`, same tokens |
| Body | Padding 24, gap 16, Fill | `p-6 gap-4 flex-1`; scrolls |
| Footer | As Modal / Dialog's | As ModalDialog's |

Contrast, Light / Dark:
- Title: 20.17 / 14.63
- Close glyph: 10.35 / 11.87
- Buttons: as Button

**Changed in Figma on 29 Oct 2026** (the library needs publishing):
- **The header's item spacing** (`458:438`) was 0. With Space Between, a
  long title ran into the close button. It's now bound to `space/16`, as
  on Modal / Dialog's header. A short title looks the same.
- **The header, body and footer padding and gaps** (raw 24 / 20 / 16 /
  12) are now bound to GDL's `space/*`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Fixed 900 | The viewport's height | None needed |
| Width | Raw 672 | `max-w-2xl` (672, Tailwind's container width) | Bind to a GDL width scale once there is one |
| Elevation | Elevation Dark/4 | `shadow-elevation-4` (see ModalDialog) | None in Figma |
| Close | `Modal / Close Button` | IconButton | Swap for `Button / Icon` |

### Alert (29 Oct 2026)

Source: page **Feedback** (`459:232`), set `Alert` (`459:342`): Type
(Info, Success, Warning, Error) × Size (Default, Compact), with Title,
Message and Show Dismiss. Code: `src/components/alert/`. Every colour
binding is copied exactly. Default has padding `space/16` and gap `space/12`, and is
top-aligned. The title and message are `space/2` apart, the title in
Body/sm-semibold and the message in Caption/md-regular, with a 20px icon.
The Storybook grids check each Type × Size with the dismiss button off, on
and hovered. They check the fill, border, icon, title and message colours,
the dismiss glyph and its hover fill, the radius, the padding and the
role, in Light and Dark.

| Type | Fill | 1px inside border | Icon, title, message | Icon | Role |
|---|---|---|---|---|---|
| Info | `accent/info/tonal/surface/default` | `accent/info/outline/border/default` | `accent/info/tonal/content/default` | `info` | `status` |
| Success | `accent/success/tonal/surface/default` | `accent/success/outline/border/default` | `accent/success/tonal/content/default` | `check-circle` | `status` |
| Warning | `accent/warning/tonal/surface/default` | `accent/warning/outline/border/default` | `accent/warning/tonal/content/default` | `warning` | `alert` |
| Error | `accent/critical/tonal/surface/default` | `accent/critical/outline/border/default` | `accent/critical/tonal/content/default` | `x-circle` | `alert` |

**Compact** is one line: the message only, centred. Figma hides the Title
layer in Compact.

**Show Dismiss** is an `IconButton` (Ghost, 32, `x`, named "Dismiss"),
with a `text/secondary` glyph and a `neutral/tonal/surface/default` hover
fill. Pressing it hides the alert and calls `onDismiss`.

The alert fills its container's width. Figma's set is a fixed 464, but
every instance on the patterns is stretched to its column (512, 510, 183).

Contrast: every pair passes. Text needs 4.5:1; the icon, border, X and
focus ring need 3:1.

| Type | Text and icon on the fill (Light / Dark) | Border on `surface/base` | X on the fill / on hover | Focus ring on the fill |
|---|---|---|---|---|
| Info | 5.60 / 5.72 | 3.76 / 3.89 | 8.49 / 8.41 · 8.40 / 6.15 | 5.58 / 3.78 |
| Success | 6.49 / 6.46 | 3.22 / 4.54 | 9.43 / 7.34 · 8.40 / 6.15 | 6.20 / 3.30 |
| Warning | 4.59 / 6.53 | 4.93 / 4.98 | 9.64 / 7.03 · 8.40 / 6.15 | 6.34 / 3.16 |
| Error | 6.85 / 5.22 | 3.81 / 3.07 | 8.50 / 8.13 · 8.40 / 6.15 | 5.59 / 3.66 |

Light Warning's text (4.59) is close to the limit.

**Changed in Figma on 29 Oct 2026** (the library needs publishing):
- **The radius** of all eight variants was a raw 8. It's now bound to
  `radius/8`.
- **Compact's side padding** was a raw 12. It's now bound to `space/12`.
  Its raw 10 top and bottom are unchanged: binding them to `space/12`
  would make Compact 2px taller, so that's a design question.
- **Compact's Title and Icon / Dismiss** are now connected to Title and
  Show Dismiss, as in Default. Both are hidden, so nothing looks
  different, but an instance can now show the X. Compact's **Message is
  still not connected** (below).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 464 | Fills its container | None needed: instances are stretched |
| Compact padding | Raw 10 top and bottom; `space/12` at the sides | `space/12` all round: 44px tall (Figma 42) | Bind top and bottom to `space/12` (design question) |
| Height | Default 68, on Inter's auto line height | 70, on GDL's 20px Body/sm and 16px Caption/md line heights | Bind the text styles' line heights to the ramp |
| Letter spacing | 0 | GDL's ramp (0.4px Body/sm, 0.3px Caption/md) | As above |
| Dismiss | A bare 16px X glyph, hidden in every variant (its colour override can't be read) | `IconButton` Ghost 32 with a `text/secondary` glyph. Its margin is -8px so it takes the X's 16px slot, and the alert keeps Figma's height | Swap for `Button / Icon` (Ghost, 32, X) |
| Focus | No Focus state | 2px `stroke.focused` ring on the X, as on Button | Add a Focus state |
| Compact text | Title hidden; Message hard-coded per variant | `message` only. `title` isn't shown in Compact | Connect Message (below) |
| Role | None | `role="alert"` for Error and Warning, `role="status"` for Info and Success | None needed |

Figma gaps the code doesn't copy:

- **Compact's Message isn't connected to the Message property,** so
  instances can't change the text. The Audit Logs instance (`526:4636`,
  also nested in pattern 08) sets Message "There are no changes to
  compare." but shows the variant's own "This cost was deleted". It's the
  only Compact instance in the file. It wasn't connected on 29 Oct,
  because connecting it changes what Audit Logs reads, and which line
  Compact should show is a design question.
- **The "Alerts" frame (`510:3008`) pins Semantics to Dark,** so the
  Feedback page shows only Dark. The set itself has no pinned mode. Clear
  the frame's explicit mode.

### Toast (29 Oct 2026)

Source: page **Feedback** (`459:232`), set `Toast` (`459:379`): Type
(Info, Success, Warning, Error), with Message, Action and Show Action.
Behaviour from **Patterns – Admin**, 12 · Feedback messages (`528:6347`).
Code: `src/components/toast/`: `Toast`, plus `ToastProvider` and
`useToast` (the host, code only). Every colour binding is copied exactly
except the X (below). The card is `surface/base` with a 1px inside
`stroke/subtle` and Elevation 3, padding `space/12` / `space/16`, gap
`space/12`, centred. The message is Body/sm-regular in `text/primary`, and the action
Body/sm-semibold in `text/link/default`. The Storybook grids check each
Type with Show Action off and on and with the X hovered, in Light and Dark.
They check the fill, inset ring and shadow, radius, padding, icon, message,
action and X colours.

| Type | Icon | Icon colour |
|---|---|---|
| Info | `info` | `accent/info/tonal/content/default` |
| Success | `check-circle` | `accent/success/tonal/content/default` |
| Warning | `warning` | `accent/warning/tonal/content/default` |
| Error | `x-circle` | `accent/critical/tonal/content/default` |

Everything else is the same for every Type: the card is neutral, and only
the icon carries the Type.

**The host** follows pattern 12's "How it works":
- Toasts stack at the bottom right, 16px from the edges, newest last,
  `space/12` apart (as on the pattern).
- Info and Success close after 5 seconds (`TOAST_DURATION`). Warning and
  Error stay until dismissed, and so does any toast with an action
  (WCAG 2.2.1). `duration` overrides the timer, except with an action.
- The timer pauses while the pointer is over a toast or focus is inside
  it, and resumes with the time left.
- The X dismisses it. If focus was on it, focus moves to the next
  toast's X (or the previous one's).
- The stack is a `<section aria-label="Notifications" aria-live="polite">`
  that is in the page from the first render, empty, so the first toast is
  announced. A toast has no role of its own, and focus never moves to it
  on its own. `useToast()` throws outside a `ToastProvider`.

Contrast: every pair passes.

| | Light | Dark |
|---|---|---|
| Message (`text/primary` on `surface/base`) | 20.17 | 14.63 |
| Action (`text/link/default`) | 5.01 | 6.73 |
| Icon: Info / Success / Warning / Error | 6.83 / 7.13 / 4.93 / 8.36 | 8.07 / 10.44 / 11.03 / 7.62 |
| X (`text/secondary`), at rest / on hover | 10.35 / 8.40 | 11.87 / 6.15 |

`stroke/subtle` on `surface/base` is 1.23 / 1.41. It's a decorative edge,
not a control's boundary: the elevation separates the card.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 380 | 384 (`w-sm`), never wider than the screen | Set the width to 384 |
| Radius | Raw 10 (off GDL's scale) | `radius/8`, as Alert and Menu / Dropdown | Bind to `radius/8` (or `radius/12`) |
| Effect | `Elevation Dark/3` style in both modes | `shadow-elevation-3`: Tailwind inlines GDL's Light Elevation 3 in both themes, as on Popover | None in Figma; code follows when the theme output carries Dark elevation |
| Height | 46, on Inter's auto line height | 44 (12 + 20 + 12), on GDL's 20px Body/sm line height | Bind the text styles' line heights to the ramp |
| The X | A bare 16px X glyph in `text/subtle`, always shown | `IconButton` Ghost 32 with a `text/secondary` glyph and a `neutral/tonal` hover fill, -8px margin so it takes the X's 16px slot. `text/subtle` on that hover fill is 3.86 / 2.96, below 3:1 | Swap for `Button / Icon` (Ghost, 32, X) |
| Action | A text layer, no states | A `<button>` with Button's focus ring; no hover | Add Hover and Focus if wanted |
| Action default | "Undo" | `action` defaults to "Undo"; `showAction` defaults to false | None needed |
| Host | None (pattern 12 describes it) | `ToastProvider` and `useToast` | None needed |

Figma gaps the code doesn't copy:

- **The "Toasts" frame (`510:3009`) pins Semantics to Dark,** so the
  Feedback page shows only Dark toasts. The set itself has no pinned mode.
  Clear the frame's explicit mode.

### Tooltip (29 Oct 2026)

Source: page **Feedback** (`459:232`), set `Tooltip` (`459:388`): Placement
(Top, Bottom) with a Text property. Code: `src/components/tooltip/`.
Figma's Text is `text` and Placement is `placement` (`top` by default,
`bottom`). The target is `children`, one focusable element. Every colour
binding is copied exactly. The stories check them against the tokens in
Light and Dark for both placements, along with the arrow's size, position
and gap.

| Layer | Figma | Code |
|---|---|---|
| Body fill | `surface/neutral/stronger` | `bg-surface-neutral-stronger` |
| Label | `text/inverted/primary`, Caption/md-medium | `text-text-inverted-primary`, `text-caption-md-medium` |
| Body radius | `radius/6` | `rounded-6` (`radius/6`) |
| Body padding | `space/6` top and bottom, raw 10 at the sides | `py-1.5 px-2` (`space/6`, `space/8`) |
| Arrow | 10×6 triangle in `surface/neutral/stronger`, centred and touching the body: below it for Top (pointing down), above it for Bottom (pointing up) | An SVG with Figma's geometry (`viewBox="0 0 10 6"`) and `fill-surface-neutral-stronger`, 6px tall (`h-1.5`); its width follows the viewBox |

Contrast: the label passes AA by a wide margin. In Light it's white on
slate-700 (10.35); in Dark it's slate-950 on slate-200 (16.36). The bubble
also stands out from the page: 10.35 on `surface/base` and 9.90 on
`surface/canvas` in Light, 11.87 and 14.48 in Dark.

**Changed in Figma on 29 Oct 2026** (the library needs publishing): in
both placements, Tooltip / Body's radius (raw 6) is now bound to
`radius/6`, and its top and bottom padding (raw 6) to `space/6`. Nothing
looks different. The raw 10 at the sides is unchanged: binding it to
`space/8` would make the bubble 4px narrower, so that's a design question.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Side padding | Raw 10, unbound | `space/8`. 10 isn't on GDL's scale; Button's raw 10 also became 8 | Bind to `space/8` (design question) |
| Height | 27, on Inter's auto line height (15) | 28, on GDL's 16px Caption/md line height | Bind the text style's line height to the ramp |
| Letter spacing | 0 | GDL's 0.3px | As above |
| Arrow construction | Top: a frame holding a vector. Bottom: a 3-point polygon | One SVG with the same 10×6 geometry, flipped for Bottom | Build both arrows the same way |
| Gap to the target | Not drawn: no screen or pattern places a Tooltip | `space/4` from the arrow tip to the target, as Popover. It is the tooltip's own padding, so the pointer can cross onto it | Add a placed example |
| Width | Hugs one line | Wraps at 256px (`max-w-64`) | Add a maximum width and a wrapping example |
| Behaviour | Static | Opens on hover after 300ms and at once on keyboard focus (`:focus-visible`). Closes on Escape (focus stays on the target), blur and pointer leave. The pointer can move onto it (WCAG 1.4.13). It flips to the other side when there's no room. At the viewport's sides it's nudged back in, 4px from the edge, and the arrow stays on the target (runtime inline offsets, not design values). No portal, so a parent with `overflow: hidden` clips it | None needed |
| Accessibility | None | `role="tooltip"`, and the target gets `aria-describedby`. When closed it's `hidden` but still the target's description. Escape from the target is used by the tooltip, so it doesn't also close a dialog or menu behind it | None needed |
| Focus | No Focus state | None on the tooltip, which is never focusable. The target brings its own focus ring | None needed |

Figma gaps the code doesn't copy:

- **The Tooltips section (`510:3010`) pins a variable mode to Dark,** so
  the library page shows Dark's light-grey bubble. The component itself
  pins nothing, so code follows the theme: a slate-700 bubble in Light and
  a slate-200 bubble in Dark.

### Skeleton (29 Oct 2026)

Source: page **Feedback** (`459:232`), set `Skeleton` (`459:411`): Shape
(Line, Circle, Block). "Resize instances to match the content they
replace." Code: `src/components/skeleton/`. `shape` is Shape. A skeleton
is sized with `className`, the way Figma resizes its instances. The fill
binding is copied exactly, and the Storybook grids check each shape's
fill, size and radius in Light and Dark.

| Shape | Fill | Figma size | Radius |
|---|---|---|---|
| Line | `neutral/tonal/surface/default` | 240×12 | `radius/6` |
| Circle | `neutral/tonal/surface/default` | 32×32 | `radius/full` |
| Block | `neutral/tonal/surface/default` | 240×80 | `radius/8` |

**Changed in Figma on 29 Oct 2026** (the library needs publishing): the
radii were raw 6, 16 and 8. They're now bound to `radius/6`, `radius/full`
(so a resized Circle stays round) and `radius/8`. Nothing looks different.

Contrast: a skeleton is a decorative placeholder, hidden from assistive
tech, so WCAG sets no minimum. For reference, the fill against the page
(canvas / base) is 1.18 / 1.23 in Light and 2.36 / 1.93 in Dark.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Line and Block are 240px wide | `w-full`: they fill their container (240 isn't on GDL's scale). Size them with `className` | None needed: instances are resized, as the description says |
| Motion | Static | A pulse (Tailwind's `animate-pulse`, opacity 1 → 0.5 over 2s), only under `prefers-reduced-motion: no-preference`. Stories are static | None needed (confirm the pulse) |
| Semantics | A layer | A `<span>` with display block, so it fits inside text, buttons and cells. It is `aria-hidden`: the loading region carries `aria-busy` | None needed |

Figma gaps the code doesn't copy: none (no pinned modes).

### SkeletonTableRow (29 Oct 2026)

Source: page **Feedback** (`459:232`), component `Skeleton / Table Row`
(`459:412`). It has no properties: five `Skeleton` Shape=Line instances
(160, 120, 140, 100 and 120px wide), 16px padding, a 24px gap and a 1px
bottom stroke, 45px high. Pattern 11 ("Loading a list") stacks five of
them under the Users table's header. Code:
`src/components/skeleton-table-row/`. It is a TableRow (`<tr>`) with one
TableCell per column, each holding a Skeleton line. The Storybook grids
check it in a real table, in Light and Dark: its stroke, the lines' fill,
height and widths, the row's height against a loaded row, and forced
Hover.

| Part | Figma | Code |
|---|---|---|
| Bottom stroke | 1px inside `stroke/subtle` | TableRow's `border-b border-stroke-subtle` |
| Lines | Skeleton Shape=Line, `neutral/tonal/surface/default`, 12px high | `Skeleton`, one per cell |
| Height | 45px (16 + 12 + 16 + 1) | 45px: cells `py-4` (16) + 12px line + 1px stroke. That is a loaded text row's height, so nothing jumps |

Contrast: as Skeleton (decorative, hidden from assistive tech).

**Changed in Figma on 29 Oct 2026** (the library needs publishing): the
row's padding (raw 16) and gap (raw 24) are now bound to `space/16` and
`space/24`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Columns | Five lines in a free row, not tied to a table's columns. Pattern 11 puts it under a three-column header | `columns` (default 5): one cell per column of the real table | Build it from Table / Cell widths, or add a column count |
| Line widths | 160 / 120 / 140 / 100 / 120px | The same proportions of each column: full, ¾, ⅞, ⅝, ¾, repeating after the fifth | Same as above |
| Spacing | `space/16` padding, `space/24` gaps | The cells' own 16px sides, so lines sit 32px apart and line up with the column's content | Same as Columns |
| Hover | No Hover | TableRow's hover fill is removed | None needed |
| Semantics | — | The row is `aria-hidden`. Mark the table `aria-busy` and say what is loading | None needed |

Figma gaps the code doesn't copy: none (no pinned modes).

### Spinner (29 Oct 2026)

Source: page **Feedback** (`459:232`), set `Spinner` (`464:12471`): Size
(16, 24, 32). Each size is two ellipses with a 75% inner radius, so the
ring is an eighth of the size thick. Track is the full ring. Indicator
runs from −90° to 90°, the right half (12 to 6 o'clock). "Animate with a
360° rotation in prototypes." Code: `src/components/spinner/`. The
Storybook grids check each size's box, both colours and the ring's
thickness, in Light and Dark.

| Part | Binding |
|---|---|
| Track | `neutral/tonal/surface/default` |
| Indicator | `action/primary/surface/default` |

Contrast: the ring is a graphic, so it needs 3:1 (WCAG 1.4.11).

| Pair | Light | Dark |
|---|---|---|
| Indicator on canvas / base | 6.51 / 6.81 | 4.63 / 3.80 |
| Indicator on its track | 5.53 | **1.97** (design question) |
| Track on canvas | 1.18 | 2.36 |

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Drawing | Two arc ellipses | SVG strokes on a 16-unit box: radius 7, width 2 (the same ring: outer 8, inner 6), square ends. It scales with `size` | None needed |
| Motion | Rotates in prototypes only | Tailwind's `animate-spin` (one turn a second), only under `prefers-reduced-motion: no-preference`. Otherwise it stands still. Stories are static | None needed |
| Name | No label | `role="status"` with a visually hidden `label` (default "Loading"), e.g. "Loading export details" | None needed |

Figma gaps the code doesn't copy: none (no pinned modes).

### EmptyState (29 Oct 2026)

Source: page **Feedback** (`459:232`), set `Empty State` (`464:12461`):
Size (Default, Compact) × Title × Description × Show Action. Pattern 11
places Default in an empty Announcements table and on the 404 page. Code:
`src/components/empty-state/`. `size` is Size, `title` is Title,
`description` is Description, and `action` is Show Action plus its nested
Button (pass the Button, or leave it out). Compact has neither
description nor action, and its types don't allow them. Every binding is
copied exactly. The Storybook grids check each part's colour, type style,
size and padding, in Light and Dark.

| Part | Size=Default | Size=Compact |
|---|---|---|
| Layout | Vertical, centred; 48px top and bottom, 24px sides, 12px gap; 480px wide | 24px padding, 6px gap; 480px wide |
| Icon tile | 64×64, `surface/base`, `radius/full` | 24×24, no fill |
| Icon | Phosphor Tray 32px, `text/subtle` | Tray 20px, `text/subtle` |
| Title | Body/md-semibold, `text/primary` | Body/sm-regular, `text/subtle` |
| Description | Body/sm-regular, `text/subtle`, centred | — |
| Action | `Button / Normal`, Style=Default, Plus icon ("Create Cost") | — |

Contrast: the text passes AA, and the icon passes 3:1.

| Pair | Light (canvas / base) | Dark (canvas / base) |
|---|---|---|
| Title, `text/primary` | 19.28 / 20.17 | 17.85 / 14.63 |
| Description and Compact title, `text/subtle` | 4.55 / 4.76 | 6.96 / 5.71 |
| Icon on its tile (`text/subtle` on `surface/base`) | 4.76 | 5.71 |
| Tile on canvas (decorative) | 1.05 | 1.22 (design question) |

**Changed in Figma on 29 Oct 2026** (the library needs publishing): the
Icon Tile's radius was a raw 32 (on a 64px tile in Default, and a 24px
unfilled tile in Compact). Both are now bound to `radius/full`. Nothing
looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 480px (not on GDL's scale) | `w-full max-w-lg` (512px), centred with `mx-auto` in the page or the table's `<td colSpan>`. 448 and 512 are equally near, and 512 keeps Figma's copy on the same lines | None needed, or 512 in Figma (design question) |
| Text wrapping | Title and Description hug their text, so long copy runs past 480px | They wrap within the width, centred | Make the text layers wrap (fixed width, auto height) |
| Title element | A text layer | A `<p>`, because the page or the table already has the heading | None needed |
| Action | Show Action toggles a nested Button instance | `action`: the Button the screen passes, with its own label, icon and handler | None needed |
| Icon | Tray, fixed (no swap property) | Tray, fixed | Add an icon swap if screens need other glyphs (design question) |
| Compact copy | The set's description says "No items." | The Title, whose Figma default is "No items found" | Align the description with the default |

Figma gaps the code doesn't copy: none (no pinned modes). The Tray
instance's inner frame has an unbound white fill. It is hidden behind the
glyph, and code doesn't draw it.

### FormLabel (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Form Label` (`463:592`): Required
(false, true) with a Label text property (default "Label text"). It is placed
93 times, always inside a Form / Field or Form / Repeatable Field. Code:
`src/components/form-label/`. FormField renders it in every field's Label
Row.

- Label → `children`.
- Required=true → `required`: the "*" marker after the label. The marker is
  `aria-hidden`. The control announces "required": FormField sets `required`
  on a native control and `aria-required` on a Select.
- It is a `<label>`. `as="legend"` labels a fieldset (a radio or checkbox
  group), and `as="span"` labels a control named with `aria-labelledby`.

Every binding is copied exactly. The Storybook grids check the label and
marker colours, the type and the marker's gap, in Light and Dark.

| Layer | Figma | Code |
|---|---|---|
| Label | `colors/text/secondary`, Body/sm-regular | `text-text-secondary text-body-sm-regular` |
| Required Marker "*" | `colors/accent/critical/tonal/content/default`, Body/sm-regular | `text-accent-critical-tonal-content-default` |
| Gap to the marker (Required=true) | `space/2` (raw 2 until 29 Oct) | `gap-0.5` (`space/2`) |

Contrast (Light / Dark), on the page (`surface/canvas`) and on a modal or side sheet (`surface/base`):

| Pair | Canvas | Base |
|---|---|---|
| Label, `text/secondary` (4.5:1) | 9.90 / 14.48 | 10.35 / 11.87 |
| Marker, `accent/critical/tonal/content/default` (4.5:1) | 7.99 / 9.30 | 8.36 / 7.62 |

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The marker's gap** on Required=true (`463:589`) is bound to `space/2`.
  It was raw 2, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Line height | Inter's auto line height (17px), letter spacing 0 | GDL's Body/sm: 20px, 0.4px | Bind the text style to the ramp |
| Marker semantics | Not defined | `aria-hidden`; the control is `required` or `aria-required` | None needed |

Figma gaps the code doesn't copy: none (no pinned modes).

### FormField (29 Oct 2026)

Source: page **Form** (`183:1765`). Figma has no FormField. It is the
structure every Form / Field repeats: `Form / Field – Text` (`184:3056`),
`– Dropdown` (`184:3063`), `– Dropdown with Edit` (`184:3073`), and the
same in `– Textarea` (`456:809`), `– Date` (`456:818`), `– Combobox`
(`456:830`) and `– File Upload` (`184:3085`). Each is a column with no gap:
the Label Row (the `_Form Label`, 20px bottom padding), the Input Wrapper
(the control, set to Fill), and the Helper Text (Show Helper + Helper,
hidden by default). Code: `src/components/form-field/`. TextField,
SelectField, TextareaField, DateField, ComboboxField and FileUploadField are
FormField around their control.

What code maps:
- Label Row → `label` and `required` (a FormLabel), and `action` beside it
  (Dropdown with Edit's `_Edit Link`), `space/8` from the label.
- Input Wrapper → `children`: the control, full width.
- Show Helper + Helper → `helper` (`FormHelperText`, which is exported for
  groups that build their own fieldset).
- Error: a field has no Error property. Figma's patterns ("Add Cost Center –
  Errors" `523:2702`, "Feedback messages" `528:6288`) set the input to
  State=Error and turn Show Helper on with the message. In code that is
  `error`: the message takes the helper's place, and the control is
  `aria-invalid` and described by it.
- `_Description Text` (`184:3020`, Body/sm-regular) isn't a field's: it
  belongs to Form / Section Header. A field's message is its own Helper Text
  layer (Caption/md-regular).

The wiring goes through a context. A control calls
`useFormFieldControl(props)`, as TextInput, SelectTrigger and Select do. It
gets the label's `htmlFor` as its `id`, the message's id in
`aria-describedby`, `aria-invalid` while there is an `error`, and
`required`. The control's own props win, and `aria-describedby` keeps the
ids of both. Any other control takes the same props from a function child:
`{(control) => <input {...control} />}`. `useFormField()` gives the raw ids,
including `labelId`, for a control named with `aria-labelledby`.

| Layer | Figma | Code |
|---|---|---|
| Field | Column, no gap, fixed 510 (each placement sets Fill) | `flex-col`, no gap, `w-full` |
| Label Row | Bottom padding `space/20`. Dropdown with Edit: item spacing `space/8`, centred (raw 20 and 8 until 29 Oct) | `pb-5` (`space/20`), `gap-2` (`space/8`), centred |
| _Form Label | See FormLabel | FormLabel |
| Input Wrapper | Fill | The control, `w-full` |
| Helper Text | `colors/text/subtle`, Caption/md-regular | `text-text-subtle text-caption-md-regular` |
| Error message | The same Helper Text layer, `colors/text/subtle` | The same |

The TextField and SelectField grids check these in Light and Dark: the label
and marker colours, the 20px from the label to the control, the control's
bindings, and the message's colour and type, flush under the control.

Contrast (Light / Dark):

| Pair | Canvas | Base |
|---|---|---|
| Helper and error message, `text/subtle` (4.5:1) | 4.55 / 6.96 | 4.76 / 5.71 |

The label is FormLabel's, and the control's are its own.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The Label Row's bottom padding** in every Form / Field (Text
  `184:3057`, Dropdown `184:3064`, Dropdown with Edit `184:3074`, Textarea
  `456:810`, Date `456:819`, Combobox `456:831`, File Upload `184:3086`) is
  bound to `space/20`. It was raw 20, so nothing looks different.
- **Dropdown with Edit's label-to-link gap** (`184:3074`) is bound to
  `space/8`. It was raw 8, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Label Row height | 37px: Inter's auto 17px line plus 20 | 40px: GDL's 20px line plus 20 | Bind the label's text style to the ramp |
| Width | Fixed 510 | Fills its container, as every placement does | Set the components to Fill |
| Helper Text box | Fixed 510 × 15 | Hugs its text (Caption/md, 16px line) | Set it to Fill × Hug |
| Error | No Error property on the field: the input's State=Error plus Show Helper | `error`: the message (in the helper's place) and `aria-invalid` on the control | Add an Error property to the fields if they should own it |
| Wiring | Not defined | `htmlFor`, `aria-describedby`, `aria-invalid`, `required` on the control | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The error message is grey.** The fields have one Helper layer, bound to
  `text/subtle`, and the error patterns show the message in it. Only the
  input's border turns red. The message still says what's wrong, so the
  error isn't shown by colour alone (WCAG 1.4.1).
- **The message sits flush under the control** (gap 0), while the label is
  20px above it.
- **20px from label to control** in every Form / Field, but 8px in Form /
  Repeatable Field (`463:780`).

Figma gaps the code doesn't copy: none. The components pin no mode (the
patterns' "Pattern Slot Content" section is pinned to Dark, which code
doesn't copy).

### FormEditLink (29 Oct 2026)

Source: page **Form** (`183:1765`), component `_Edit Link` (`184:3016`), with
a Label text property (default "[Edit]"). It is placed only in `Form / Field
– Dropdown with Edit` (Currency, in Form / New Cost and pattern 09). Code:
`src/components/form-edit-link/`.

- Label → `children`, default "[Edit]".
- It is a `<button type="button">`: it opens an editor, and never submits
  the form around it. Pass it as a field's `action`.
- Inside a FormField it is named by its own text and the field's label
  (`aria-labelledby`), so it reads "[Edit] Currency". `aria-label` or
  `aria-labelledby` replace that.

| Layer | Figma | Code |
|---|---|---|
| Label | `colors/text/link/default`, Caption/sm-regular | `text-text-link-default text-caption-sm-regular` |

The Storybook grids check the colour, the type and the focus ring, in Light
and Dark.

Contrast (Light / Dark):

| Pair | Canvas | Base |
|---|---|---|
| Label, `text/link/default` (4.5:1) | 4.79 / 8.22 | 5.01 / 6.73 |

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Element | Text | `<button type="button">` | None needed |
| Focus | No Focus state | 2px `stroke/focused` outline, 2px offset, as on Button | Add a Focus state |
| Accessible name | "[Edit]" | "[Edit] Currency" inside a field | None needed |
| Line height | Inter's auto line height (12px) | GDL's Caption/sm: 14px | Bind the text style to the ramp |

Figma gaps the code copies exactly. These are for the designer to decide:

- **No Hover, Pressed or Disabled state.** `text/link/hover` and
  `text/link/pressed` exist, and nothing uses them here.
- **It is small:** 10px text, a target about 26 × 14. It passes WCAG 2.5.8
  through the spacing exception: no other target is within its 24px circle.

Figma gaps the code doesn't copy: none.

### TextField (29 Oct 2026)

Source: page **Form** (`183:1765`), component `Form / Field – Text`
(`184:3056`). It exposes the nested `_Form Label` (Label, Required) and
`_Text Input` (Value, State), and has Show Helper + Helper. It is placed 27
times directly (37 with nesting): in Form / New Cost (Applicant name,
Email, Invoice number, Beneficiary name, Street, City, Postal code, IBAN
account number, Swift code, Notes) and the admin modals (Nature of Service,
Location, Title, Amount, Name, Email, Version). Code:
`src/components/text-field/`. It is FormField around a TextInput.

- _Form Label → `label`, `required`. `required` also sets the input's
  native `required`, so the browser stops a submit with the field empty.
- _Text Input → the input's own props. Default is a `placeholder`, Filled
  is `value` / `defaultValue`, Focus is `:focus`, Disabled is `disabled`,
  and Error is `error` (FormField).
- Show Helper + Helper → `helper`.
- Every other prop goes to the native `<input>`, and so does the ref:
  `name`, `type`, `value` / `defaultValue` / `onChange`, `autoComplete`.
  `id` is the input's, and the label points at it. `className` styles the
  field.

Bindings: FormLabel's, FormField's and TextInput's (above). The Storybook
grids check all seven cells (Default, Filled, Focus, Error with its message,
Disabled, Required, with a Helper), in Light and Dark: the label and
marker, the 20px gap, the input's fill, stroke colour and width, text
colour and height, and the message.

Contrast: as FormLabel, FormField and TextInput.

Code departs from Figma as FormField and TextInput do, and here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Required | The marker only | The marker and the input's native `required` | None needed |

TextInput changed with it: inside a FormField it takes the field's id,
message, error and required (`useFormFieldControl`). Its own props win.
Outside a FormField nothing changes.

Figma gaps the code doesn't copy: none.

### SelectField (29 Oct 2026)

Source: page **Form** (`183:1765`), components `Form / Field – Dropdown`
(`184:3063`) and `Form / Field – Dropdown with Edit` (`184:3073`). Both
expose the nested `_Form Label` and `_Dropdown Input` (Value, State) and
have Show Helper + Helper. Dropdown with Edit adds the `_Edit Link` to the
Label Row, `space/8` from the label, centred. They are placed 13 and 2
times directly (16 with nesting): Select Partner, Payment method, Country,
Cost Center, Frequency, Payment Method, New status, Nature of Service,
Role, and Currency with Edit. Code: `src/components/select-field/`. It is
FormField around a Select.

- _Form Label → `label`, `required` (`aria-required` on the trigger).
- _Dropdown Input → the Select. `options`, `value` / `defaultValue` /
  `onValueChange` (Filled), `placeholder` (Default), keyboard focus (Focus),
  the list showing (Open), `disabled`. Error is `error` (FormField).
- Show Helper + Helper → `helper`.
- Dropdown with Edit → `action={<FormEditLink onClick={…} />}`.
- Every other prop goes to the Select, and so does the ref (the trigger).
  `name` submits the chosen option's `value` with the form. `id` is the
  trigger's. `className` styles the field.
- Clicking the label focuses the select and opens its list, as a click on
  the trigger does.

Bindings: FormLabel's, FormField's, FormEditLink's and SelectTrigger's
(above). The Storybook grids check eight cells (Default, Filled, Focus,
Error with its message, Disabled, Required, with a Helper, with Edit), in
Light and Dark.

Contrast: as FormLabel, FormField, FormEditLink and SelectTrigger.

Code departs from Figma as FormField and SelectTrigger do, and here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Required | The marker only | The marker and `aria-required`. The browser doesn't check a custom select, so the form's submit handler does (the "Submits with form" story shows how) | None needed |
| Form value | Not defined | With `name`, the chosen option's `value` is submitted (a hidden input; "" while nothing is chosen). A disabled select submits nothing | None needed |

Select and SelectTrigger changed with it:
- Both take the field's id, message, error and required inside a FormField
  (`useFormFieldControl`). Their own props win. Outside a FormField nothing
  changes.
- SelectTrigger turns `required` into `aria-required`: a button has no
  `required`.
- Select's `name` used to land on the trigger button, which a form never
  submits. It now names a hidden input with the chosen value.

Figma gaps the code doesn't copy: none.

### FormSectionHeader (29 Oct 2026)

Source: page **Form** (`183:1765`), components `Form / Section Header`
(`184:3096`) and `Form / Section Header – Action` (`184:3101`). Section
Header is a column of `_Section Title` (`184:3018`) and `_Description Text`
(`184:3020`), with Show Description, item spacing `space/4`. Section
Header – Action is a row: `_Section Title`, and a `Button / Small`
(Style=Text, Show Icons, Plus 16px, "Add new") at the far end, centred,
with space-between and no gap. They are placed 6 times directly (16 with
nesting): Beneficiary Information and Recurring Details (with a
description), and Breakdowns (with the action). Code:
`src/components/form-section-header/`.

- _Section Title's Title → `title`: a heading, `<h2>` by default.
  `headingLevel` (2, 3, 4) moves it without changing the look: an `<h3>`
  inside a modal or a side sheet.
- Show Description + _Description Text's Text → `description`.
- The Action Button → `action`: `<Button size="small" variant="text"
  leftIcon={<Icon name="plus" />}>Add new</Button>`.

| Layer | Figma | Code |
|---|---|---|
| _Section Title | `colors/text/primary`, Body/lg-regular | `text-text-primary text-body-lg-regular` |
| _Description Text | `colors/text/subtle`, Body/sm-regular | `text-text-subtle text-body-sm-regular` |
| Title to description | `space/4` (raw 4 until 29 Oct) | `gap-1` (`space/4`) |
| Action | `Button / Small`, Style=Text, Plus | Button `small`, `text`, `plus` |

The Storybook grids check the colours, the type, the 4px gap, and the action
flush right and centred on the title, in Light and Dark.

Contrast (Light / Dark):

| Pair | Canvas | Base |
|---|---|---|
| Title, `text/primary` (4.5:1) | 19.28 / 17.85 | 20.17 / 14.63 |
| Description, `text/subtle` (4.5:1) | 4.55 / 6.96 | 4.76 / 5.71 |

The action is Button's (Text).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Title to description** on `Form / Section Header` (`184:3096`) is
  bound to `space/4`. It was raw 4, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Title element | Text | A heading, `<h2>` by default | None needed |
| Title to action | Space-between, gap 0 | Space-between, at least `space/16`, so a long title never touches the button | Set item spacing to `space/16` |
| Width | Section Header hugs; – Action is fixed 510 | Fills its container | Set both to Fill |
| Line heights | Inter's auto (22px, 17px) | GDL's ramp (26px, 20px) | Bind the text styles to the ramp |
| Description and action together | No such component | Both show: the title and description on the left, the action on the right | Add it if forms need it |
| The action's label | An override, not a property | `action` takes any Button | Expose the button's label |

Figma gaps the code doesn't copy: none.

### Textarea (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Textarea` (`455:489`): State
(Default, Filled, Focus, Error, Disabled) with a Value text property
("Add notes…"). Its description says "Resize height as needed". Code:
`src/components/textarea/`. It is a native `<textarea>` with TextInput's
look, so each state is the element's own: Default is empty with a
`placeholder`, Filled has a value, Focus is `:focus`, Error is
`aria-invalid` and Disabled is `disabled`. Form / Field – Textarea
(`456:809`) sets it to Fill, so in code it fills its container (`w-full`).
Figma's 96px height is `rows={4}`: four 20px lines and 8px above and
below. Every binding is copied exactly. The Storybook grids check each
state's fill, stroke colour and width, text colour, radius, padding,
opacity and 96px height, in Light and Dark.

| State | Fill | Stroke (inside) | Text |
|---|---|---|---|
| Default | `surface/elevated secondary` | 1px `stroke/subtle` | placeholder, `text/subtle` |
| Filled | `surface/elevated secondary` | 1px `stroke/subtle` | value, `text/primary` |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` |
| Disabled | `surface/elevated secondary` | 1px `stroke/subtle` | `text/subtle` |

In Disabled the whole layer is at 50% opacity (raw `0.5`, no variable):
`disabled:opacity-50`. Every state is Body/sm-regular
(`text-body-sm-regular`) with radius `radius/8` (`rounded-8`) and side
padding `space/12`, the text top-left.

Contrast, on the field fill (the same pairs as TextInput):

| Pair | Light | Dark |
|---|---|---|
| Value, `text/primary` (4.5:1) | 20.17 | 17.85 |
| Placeholder, `text/subtle` (4.5:1) | 4.76 | 6.96 |
| Focus stroke, `stroke/focused` (3:1) | 6.81 | 6.51 |
| Error stroke, `accent/critical/outline/border/default` (3:1) | 3.81 | 3.74 |
| Resting stroke, `stroke/subtle` (3:1) | **1.23** | **1.72** |

Disabled is exempt.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius and side padding** of all five states are bound to `radius/8`
  and `space/12`, as on `_Text Input`. They were raw 8 and 12, so nothing
  looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Top and bottom padding | Raw 10 around Inter's auto line height (17px) | 8px (`space/8`) around GDL's 20px line. GDL has no 10. This puts the first line's glyphs where Figma draws them | Pad `space/8` with the ramp's line height (the designer's call) |
| Height | Fixed 96 | `rows`, 4 by default: 4 × 20 + 8 + 8 = 96. More `rows` make it taller | None needed |
| Resize | "Resize height as needed" (the description) | `rows`, and the native vertical resize handle (`resize-y`). Disabled can't be resized | None needed |
| Letter spacing | 0, auto line height | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp |
| Focus | The Focus state is the 2px stroke | Copied on `:focus`. The browser's outline is hidden, but stays transparent so forced-colours mode still shows a ring | None needed |
| Error + Focus | No such state | The critical stroke at Focus's 2px, so the error stays visible while typing | Add it if it should look different |
| Disabled with a value | Only the placeholder is shown | A value also takes Disabled's `text/subtle` | None needed |
| Disabled opacity | Layer opacity raw 0.5 | `disabled:opacity-50` | None in CAF: GDL has no opacity token to bind |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke is below WCAG 1.4.11:** the same as TextInput
  (1.23 / 1.72).

`_Text Input`, `_Dropdown Input` and `_Combobox Input` also set
State=Disabled to 50% layer opacity, which TextInput's and SelectTrigger's
docs above used to miss ("Disabled looks the same as Default"). Since this
change TextInput, SelectTrigger and Combobox copy it too, so every form
field's Disabled is alike.

Figma gaps the code doesn't copy:

- **The Additional Inputs section (`510:2704`) pins Semantics to Dark,**
  so the library page shows `_Textarea`, `_Date Input` and `_Combobox
  Input` only in Dark. The components aren't pinned, so their instances
  follow their screen, and code follows the theme. Clear the section's
  explicit mode, as for Date Ranges.

### TextareaField (29 Oct 2026)

Source: page **Form** (`183:1765`), component `Form / Field – Textarea`
(`456:809`): a Label Row with the `_Form Label` ("Notes"), an Input
Wrapper with a `_Textarea`, and the Helper Text (Show Helper + Helper).
Placed as Notes (Edit Recurring Cost) and Reason (optional) (Change
Status) on Patterns – Admin. Code: `src/components/textarea-field/`. It is
FormField around a Textarea, built like TextField.

What code maps:
- `_Form Label`'s Label and Required → `label`, `required` (the marker,
  and the textarea's native `required`).
- `_Textarea`'s Value and State → the textarea's own props:
  `placeholder`, `value` / `defaultValue` / `onChange`, `disabled`, `rows`.
- Show Helper + Helper → `helper`. The error message in the Helper, with
  the textarea at State=Error → `error`, which makes it `aria-invalid`
  and describes it (`aria-describedby`).
- Every other prop, and the ref, go to the `<textarea>`. `name` reaches it,
  so FormData picks the value up, line breaks included.

| Layer | Figma | Code |
|---|---|---|
| Field | Vertical, gap 0, Fill | FormField: `flex flex-col`, `w-full` |
| Label Row | `_Form Label`, `space/20` bottom padding | FormLabel, `pb-5` (`space/20`) |
| Label | Body/sm-regular, `text/secondary` | `text-body-sm-regular text-text-secondary` |
| Required marker | `accent/critical/tonal/content/default` | the same |
| Input Wrapper | `_Textarea`, Fill, 96 high | Textarea, `w-full`, `rows={4}` |
| Helper Text | Caption/md-regular, `text/subtle`, hidden by default | `helper` / `error`: `text-caption-md-regular text-text-subtle` |

The Storybook grids check the label, the marker, the 20px label row, the
textarea's bindings and 96px height, and the Helper, in Light and Dark.
SubmitsWithForm checks the browser's own `required` check and the FormData.

Contrast: as FormField and Textarea (above).

Code departs from Figma here: as FormField and Textarea, plus:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Error message | One Helper layer, `text/subtle` | `error` replaces `helper`, in the Helper's style (as FormField) | See FormField's design question on the error colour |

Figma gaps the code doesn't copy:

- **The Additional Fields section (`510:2706`) pins Semantics to Dark,**
  as Additional Inputs does. Clear it.

### DateInput (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Date Input` (`455:510`): State
(Default, Filled, Focus, Error, Disabled, Open) with a Value text property
("Select date") and a nested `CalendarBlank / Style=Regular, Size=20px`
(Icon / Calendar). Its description says it "opens Date Picker / Calendar",
and Form / Field – Date's says "Pair with Date Picker / Calendar for the
open state". Code: `src/components/date-input/`. It is a `<button
role="combobox" aria-haspopup="dialog">` (SelectTrigger's look) that
opens Calendar (`456:672`) in a Popover.

What code maps:
- Value → `value` / `defaultValue`, the chosen date as `yyyy-mm-dd`: the
  format every placement shows (Starts At 2026-09-01, Period From
  2026-11-01, Period To 2026-11-30, Release Date 2026-08-10). Empty is
  State=Default and shows `placeholder` ("Select date", Figma's default
  Value). A string that isn't a real date counts as empty.
- `onValueChange` gets the chosen day as `yyyy-mm-dd`. Dates are local
  calendar days; nothing goes through `toISOString()`.
- Focus → `:focus-visible`. A mouse press opens it, and Open shows the
  same stroke.
- Error → `aria-invalid`. Disabled → `disabled`.
- Open → the calendar showing (`open` / `defaultOpen` / `onOpenChange`),
  which sets `aria-expanded` and, while open, `aria-controls`.
- Icon / Calendar → Icon `calendar-blank`, 20px, `text/subtle`.
- `name` → a hidden input carrying the `yyyy-mm-dd` value ("" for none),
  disabled with the field, as Select does.
- `required` → `aria-required` (a button can't be `required`). The form's
  submit handler checks it.

Behaviour (the WAI-ARIA date picker dialog, non-modal):
- Closed: a click (on the field or its label), Enter, Space, ↓ or ↑ open
  the calendar on the chosen day's month, with focus on the chosen day
  (else today, else the 1st).
- Open: the Calendar's keys (arrows, Home / End, Page Up / Page Down, with
  Shift by year). Enter, Space or a click chooses the day, closes the
  calendar and returns focus to the field. Escape closes without choosing
  and returns focus. A click outside, or Tab out of the calendar, closes it
  and leaves focus where the user put it. ↓ on the field while it is open
  moves focus into the calendar.
- The date is picked, not typed (design question).
- The calendar is a `role="dialog"` panel named like the field: by its
  `aria-label`, its `aria-labelledby`, or the FormField's label.

Every binding is copied exactly. The Storybook grids check each state's
fill, stroke colour and width, radius, opacity, text colour, the icon's
colour, size and 8px gap, the 40px height, `aria-expanded` and the open
calendar (placed below the field), in Light and Dark. The Open stories
check the calendar's surface and its place under the field.

| State | Fill | Stroke (inside) | Text | Icon |
|---|---|---|---|---|
| Default | `surface/elevated secondary` | 1px `stroke/subtle` | placeholder, `text/subtle` | `text/subtle` |
| Filled | `surface/elevated secondary` | 1px `stroke/subtle` | value, `text/primary` | same |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` | same |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` | same |
| Disabled (50% layer opacity) | `surface/elevated secondary` | 1px `stroke/subtle` | `text/subtle` | same |
| Open | `surface/elevated secondary` | 2px `stroke/focused` | placeholder, `text/subtle` | same |

Every state is Body/sm-regular with radius `radius/8`, side padding
`space/12`, 40 high, the value on the left and the icon on the right,
`space/8` apart. The open calendar draws its own surface
(`surface/neutral/faint`, 1px `stroke/subtle`, radius 12, Elevation 3).
Popover's panel draws nothing (`rounded-12 bg-transparent p-0 shadow-none
inset-ring-0`) and only positions it.

Contrast, on the field fill:

| Pair | Light | Dark |
|---|---|---|
| Value, `text/primary` (4.5:1) | 20.17 | 17.85 |
| Placeholder, `text/subtle` (4.5:1) | 4.76 | 6.96 |
| Icon, `text/subtle` (3:1) | 4.76 | 6.96 |
| Focus and Open stroke, `stroke/focused` (3:1) | 6.81 | 6.51 |
| Error stroke (3:1) | 3.81 | 3.74 |
| Resting stroke, `stroke/subtle` (3:1) | **1.23** | **1.72** |

Disabled is exempt. The calendar's pairs are Calendar's and
DatePickerDay's.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, side padding and gap** of all six states are bound to
  `radius/8`, `space/12` and `space/8`, as on `_Text Input` and
  `_Dropdown Input`. They were raw 8, 12 and 8, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Fixed 40, raw 10 top and bottom | 40px (`h-10`), the text centred. The stroke is drawn inside and never moves the layout | None needed |
| Letter spacing | 0, auto line height | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp |
| Focus | The Focus state is the 2px stroke | Copied on `:focus-visible` (keyboard focus). The browser's outline is hidden, but stays transparent in forced-colours mode | None needed |
| Error + Focus or Open | No such state | The critical stroke at the 2px width | Add it if it should look different |
| Disabled with a value | Only the placeholder is shown | A value also takes Disabled's `text/subtle` | None needed |
| Disabled opacity | Layer opacity raw 0.5 | `disabled:opacity-50` | None in CAF: GDL has no opacity token to bind |
| Open | The field alone, with Focus's stroke | The field plus Calendar in a Popover: below, `space/4` away, flush left. It flips above when there's no room below | Add an open example to Form / Field – Date (the field with Date Picker / Calendar under it) |
| Value | A free text property | `value` as `yyyy-mm-dd`, the format the placements use. The same string is submitted | None needed |
| Semantics | None | `role="combobox"`, `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` while open. The calendar is a named non-modal dialog | None needed |
| Description | Lists five states | Six, with Open | Add Open to the description |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke is below WCAG 1.4.11:** the same as TextInput
  (1.23 / 1.72).
- **A chosen date can't be cleared.** Ends At is optional, but once a
  date is picked the field can't go back to "Select date". Code adds no
  clear control (design question).

Figma gaps the code doesn't copy:

- **The Additional Inputs section (`510:2704`) pins Semantics to Dark**
  (see Textarea).

### DateField (29 Oct 2026)

Source: page **Form** (`183:1765`), component `Form / Field – Date`
(`456:818`): a Label Row with the `_Form Label` ("Starts At"), an Input
Wrapper with a `_Date Input`, and the Helper Text (Show Helper + Helper).
Placed on Patterns – Admin as Starts At and Ends At (Edit Recurring Cost),
Period From and Period To (Cost Breakdown) and Release Date (Create
Announcement). Starts At, Period From and Release Date show the required
marker. Code: `src/components/date-field/`. It is FormField around a
DateInput, built like SelectField.

What code maps:
- `_Form Label`'s Label and Required → `label`, `required` (the marker,
  and `aria-required` on the field).
- `_Date Input`'s Value and State → the DateInput: `value` /
  `defaultValue` / `onValueChange` as `yyyy-mm-dd`, `placeholder`,
  `disabled`, `open`. Clicking the label opens the calendar, as a click on
  the field does.
- Show Helper + Helper → `helper`. The error message in the Helper →
  `error`, which makes the field `aria-invalid` and describes it.
- The label names the calendar dialog.
- Every other prop, and the ref (the button), go to the DateInput. `name`
  submits the date as `yyyy-mm-dd`. The submit handler checks a required
  date.

| Layer | Figma | Code |
|---|---|---|
| Field | Vertical, gap 0, Fill | FormField: `flex flex-col`, `w-full` |
| Label Row | `_Form Label`, `space/20` bottom padding | FormLabel, `pb-5` (`space/20`) |
| Label | Body/sm-regular, `text/secondary` | `text-body-sm-regular text-text-secondary` |
| Required marker | `accent/critical/tonal/content/default` | the same |
| Input Wrapper | `_Date Input`, Fill, 40 high | DateInput, `w-full`, `h-10` |
| Helper Text | Caption/md-regular, `text/subtle`, hidden by default | `helper` / `error`: `text-caption-md-regular text-text-subtle` |

The Storybook grids check the label, the marker, the 20px label row, the
field's bindings, icon and height, the Helper and the open calendar, in
Light and Dark. SubmitsWithForm checks the required check in the submit
handler and the FormData (`yyyy-mm-dd`, "" for none, nothing for a
disabled field).

Contrast: as FormField and DateInput.

Code departs from Figma here: as FormField and DateInput, plus:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Open | No example | The DateInput's calendar, under the field | Add an open example (see DateInput) |
| Error message | One Helper layer, `text/subtle` | `error` replaces `helper`, in the Helper's style (as FormField) | See FormField's design question on the error colour |

Figma gaps the code doesn't copy:

- **The Additional Fields section (`510:2706`) pins Semantics to Dark**
  (see TextareaField).

No range input was built. The Date Ranges section (`510:2708`) holds only
`Date Picker / Range` (the panel), and no form places a range field. The
only range control is the filter bar's Filter / Select Period (Patterns –
Admin, "2026-10-12 – 2026-10-24"), which in code is FilterField with a
RangeCalendar.

### Combobox (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Combobox Input` (`455:555`):
State (Default, Filled, Focus, Error, Disabled, Open), a Value text
property, and nested `MagnifyingGlass / Style=Regular, Size=20px` (Icon /
Search) and `CaretDown / Style=Regular, Size=20px` (Icon / Caret). Figma's
description: "Searchable select: type to filter, then pick from Select /
Menu". The list is `Select / Menu` (`456:631`) of `Select / Option`
(`456:630`), the same list Select uses. Code: `src/components/combobox/`.
It reuses these parts:
- TextInput for the box. `_Text Input` binds the five states the two sets
  share in the same way.
- Popover (`panelRole="listbox"`).
- SelectMenu's layout.
- SelectOption.

What code maps:
- Value has three roles:
  - `placeholder` while nothing is chosen. There is no default text:
    Figma's "Select or type a location" belongs to the Location placement.
  - The chosen option's label once Filled.
  - The typed text while filtering.
- Focus (Figma: "typing") → `:focus`. Error → `aria-invalid`. Disabled →
  `disabled`. Open → the list is showing (`open`, `defaultOpen`, or the
  user opening it), which sets `aria-expanded`.
- Icon / Search → Icon `magnifying-glass`; Icon / Caret → Icon
  `caret-down`. Both are 20px, `text/subtle`, 12px in from each edge, and
  drawn over the input's 40px side padding (12 + 20 + 8). Clicks pass
  through them to the input.
- `options` (strings or `{ value, label }`), `value` / `defaultValue` /
  `onValueChange` (`null` for none), `name` (a hidden input submits the
  chosen value, never the typed text), and `emptyText`.
- It is the WAI-ARIA editable combobox with a listbox popup and list
  autocomplete: `<input role="combobox" aria-autocomplete="list">` with
  `aria-expanded`, `aria-controls` (from Popover, while open) and
  `aria-activedescendant`.
  - Typing opens the list and keeps the options whose label contains the
    text, in any case. The first match is active, so Enter takes it. An
    empty input has no active option.
  - A click, ↓ or ↑ opens the full list on the chosen option. With nothing
    chosen, ↓ starts on the first option and ↑ on the last. Open, ↓ / ↑
    move one option and stop at the ends. Home and End move the text
    cursor.
  - Enter or a click chooses an option and closes the list. With the list
    closed, Enter belongs to the form: it submits.
  - Escape closes the list and puts the chosen label back. Pressed again
    with the list closed, it clears the text and the choice.
  - Tab, a click outside or focus leaving closes the list. If the text is
    an exact label (any case), that option is chosen. Empty text clears the
    choice. Any other text gives way to the chosen label again. So the
    value is always an option or none.
  - When nothing matches, the list shows a "No results" row, and a visually
    hidden `role="status"` announces it. A listbox can hold only options,
    so the row itself is `aria-hidden`.
- The list takes the combobox's name: its `aria-label`, its
  `aria-labelledby`, or its FormField's label.
- `required` is the input's native `required`. Whenever the list is closed
  the input shows the chosen label, so the browser checks that an option
  is chosen.

Every binding is copied exactly. The box's bindings are TextInput's:

| State | Fill | Stroke (inside) | Text | Icons |
|---|---|---|---|---|
| Default | `surface/elevated secondary` | 1px `stroke/subtle` | placeholder, `text/subtle` | `text/subtle` |
| Filled | `surface/elevated secondary` | 1px `stroke/subtle` | value, `text/primary` | `text/subtle` |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` | `text/subtle` |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` | `text/subtle` |
| Disabled (50% layer opacity) | `surface/elevated secondary` | 1px `stroke/subtle` | `text/subtle` | `text/subtle` |
| Open | `surface/elevated secondary` | 2px `stroke/focused` | placeholder, `text/subtle` | `text/subtle` |

Every state is Body/sm-regular, radius `radius/8`, 40px high (Figma: a
fixed 40). In Disabled the whole box, icons included, is at 50% opacity
(`has-disabled:opacity-50`), as Figma's layer opacity. The list and the
options use SelectMenu's and SelectOption's bindings. Code adds the "No
results" row: Body/sm-regular in `text/subtle`, with an option's 8 / 12
padding and no fill.

The Storybook grids check, for each state in Light and Dark: fill, stroke
colour and width, value or placeholder colour, both icons (colour, 20px,
12px inset, centred), the 40px text inset, the height and `aria-expanded`.
The Open, Filtered and No results stories check the following in both
themes:
- the list surface and its place under the input;
- the selected option (fill and check);
- the active option (fill and the 2px `stroke/focused` ring);
- the empty row.

The Error, open story checks that the critical stroke stays at Open's 2px.

Contrast, on the field fill (the "No results" row on the list fill):

| Pair | Light | Dark |
|---|---|---|
| Value, `text/primary` (4.5:1) | 20.17 | 17.85 |
| Placeholder, `text/subtle` (4.5:1) | 4.76 | 6.96 |
| Icons, `text/subtle` (3:1) | 4.76 | 6.96 |
| Focus and Open stroke, `stroke/focused` (3:1) | 6.81 | 6.51 |
| Error stroke, `accent/critical/outline/border/default` (3:1) | 3.81 | 3.74 |
| Resting stroke, `stroke/subtle` (3:1) | **1.23** | **1.72** |
| "No results", `text/subtle` on `surface/neutral faint` (4.5:1) | 4.55 | 6.96 |

Disabled is exempt.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, side padding and gap** of all six states are bound to
  `radius/8`, `space/12` and `space/8`, as on `_Text Input` and
  `_Dropdown Input`. They were raw 8, 12 and 8, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Padding top and bottom | Raw 10 inside a fixed 40px | 40px (`space/40`) with the text centred. GDL has no 10 | None needed (the height is fixed) |
| Layout | Auto layout: icon, Value (Fill), caret, `space/8` gap | One `<input>` fills the box. The icons sit absolutely over its side padding (`space/12` + 20px icon + `space/8` = 40px) and let clicks through | None needed |
| Letter spacing | 0, auto line height | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp (as TextInput) |
| Focus | Focus ("typing") is the 2px stroke | Copied on `:focus`. The browser's outline stays transparent, so forced-colours mode still shows one | None needed |
| Error + Focus or Open | No such state | The critical stroke at the 2px width | Add it if it should look different |
| Open with a value | Only the placeholder is drawn | The chosen label in `text/primary` | None needed |
| Disabled opacity | Layer opacity raw 0.5 | `opacity-50` on the box, icons included | None in CAF: GDL has no opacity token to bind |
| Filtering, keyboard, active option | Not drawn | The WAI-ARIA behaviour above. The active option looks like SelectOption's (Hover's fill; the ring when the keyboard put it there) | Add an Active option state (as for Select) |
| Empty result | Not drawn | A "No results" row (`emptyText`), `text/subtle`, plus a status announcement | Add an empty row to Select / Menu (design question) |
| Long lists | Five rows | Scrolls past `space/256` | See SelectMenu |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke is below WCAG 1.4.11:** 1.23 (Light) / 1.72 (Dark),
  the same as TextInput.
- **Disabled is 50% layer opacity,** as on TextInput.

Figma gaps the code doesn't copy: none (no pinned modes).

### ComboboxField (29 Oct 2026)

Source: page **Form** (`183:1765`), component `Form / Field – Combobox`
(`456:830`). Its properties are Show Helper and Helper. It holds:
- a Label Row with `_Form Label` ("Location");
- an Input Wrapper with `_Combobox Input` (State=Default, set to Fill);
- Helper Text (Caption/md-regular, `text/subtle`, hidden by default).

Figma's description: "Labelled searchable select (e.g. Location). Pair with
Select / Menu for the open state". It appears in three places:
- once on the Form page;
- as "Form Field / Location" (required) in Patterns – Admin's Cost
  Breakdown content (`527:5385`);
- in 09 · Multi-section form.

Code: `src/components/combobox-field/`. It is FormField around a Combobox,
as TextField and SelectField are.

What code maps:
- _Form Label's Label and Required → `label`, `required`. Required shows
  the marker and sets the input's native `required`.
- Show Helper + Helper → `helper`. The error message, shown in the
  Helper's place → `error`, which also makes the input `aria-invalid`.
- `_Combobox Input` and the list it opens → the Combobox. Every other prop
  goes to the Combobox (`options`, `value` / `defaultValue` /
  `onValueChange`, `placeholder`, `name`, `disabled`, `defaultOpen`), and
  so does the ref (the `<input role="combobox">`). `id` is the input's;
  `className` styles the field.
- The label names the input and its list.

Bindings: FormField's and Combobox's. The label is Body/sm-regular in
`text/secondary`, with the marker when Required. The input sits 20px below
the label. The Helper, or the error in its place, is Caption/md-regular in
`text/subtle`, directly under the input. The grids check these with each
input state (Default, Filled, Focus, Error, Disabled, Required, Helper,
Open), in Light and Dark. The form story submits a real `<form>` and checks
three things:
- the browser blocks the submit while nothing is chosen (`valueMissing`);
- text that isn't an option doesn't count;
- FormData holds the option's value (`location: "HU"`), and a disabled
  ComboboxField sends nothing.

Contrast: as FormLabel, FormField and Combobox.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Required | The field has no Required property. The Cost Breakdown overrides the nested `_Form Label` to Required=true | `required` | Expose Required on the field (as the designer decides for every Form / Field) |
| Error | No field-level error: `_Combobox Input` State=Error, with the message in the Helper | `error`, as FormField | As FormField |
| Open | "Pair with Select / Menu" (no open example) | The Combobox's own list | Add an open example |

Figma gaps the code doesn't copy: none.

### Toggle (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Toggle`
(`457:241`): Checked × Disabled. Code: `src/components/toggle/`. It is a
native `<input type="checkbox" role="switch">`, so each variant is the
element's own state: Checked is `checked` (or `defaultChecked`) and
Disabled is `disabled`. The input is the track; the knob is drawn over
it. Space flips it, screen readers announce a switch that is on or off,
and in a form it submits `name` = `value` ("on") while on. Every binding is
copied exactly. The Storybook grids check the track's size, radius and
fill, the knob's size, fill and position, and the opacity of all four
variants in Light and Dark.

| Layer | Checked=false | Checked=true | Code |
|---|---|---|---|
| Track (36 × 20, `radius/full`) | `neutral/tonal/surface/default` | `action/primary/surface/default` | `bg-neutral-tonal-surface-default checked:bg-action-primary-surface-default`, `rounded-full` |
| Knob (16, `space/2` in) | `action/primary/content/default`, at the start | the same, at the end | `bg-action-primary-content-default`, `top-0.5 left-0.5`, `peer-checked:translate-x-4` |
| Disabled=true | 50% layer opacity | 50% layer opacity | `has-disabled:opacity-50` on the switch |

Contrast (WCAG 1.4.11 wants 3:1 for a control's parts):

| Pair | Light | Dark |
|---|---|---|
| Checked=true track on `surface/canvas` | 6.51 | 4.63 |
| Checked=true track on `surface/base` | 6.81 | 3.80 |
| Knob on the Checked=true track | 6.81 | 4.77 |
| Checked=false track on `surface/canvas` | **1.18** | **2.36** |
| Checked=false track on `surface/base` | **1.23** | **1.93** |
| Knob on the Checked=false track | **1.23** | **2.42** |
| Focus ring (`stroke/focused`) on `surface/canvas` | 6.51 | 6.51 |

Disabled is exempt.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius and padding** of all four variants are bound to `radius/full`
  and `space/2`. They were raw 10 and 2: the same pill and knob inset, so
  nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Focus | No Focus state | 2px `stroke/focused` outline, 2px offset, as on Button and Checkbox | Add a Focus state |
| Hover | No Hover state | None | Add one if the screens need it |
| Disabled | 50% layer opacity | Copied: `opacity-50` on the whole switch (GDL has no opacity token) | See the design question |
| Forced colours | — | `forced-color-adjust: none`, so Windows High Contrast doesn't drop the track's and knob's fills and leave nothing visible | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **Checked=false is below WCAG 1.4.11** in both themes (the table
  above). In Light the white knob on a `#E2E8F0` track on a `#F8FAFC`
  page is nearly invisible: 1.23:1 and 1.18:1. `surface/neutral/strong`
  for the off track would give 4.55 / 12.02 on the canvas and 4.76 /
  12.37 for the knob on it. axe doesn't check non-text contrast, so the
  story tests can't catch it.
- **Disabled is 50% layer opacity**, where Pagination / Item, Date Picker /
  Day and Button use their own disabled colours (`text/disabled`,
  `action/primary/surface/disabled`).

Figma gaps the code doesn't copy: none. No modes are pinned.

### Radio (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Radio` (`457:247`):
State (Deselected, Hover, Selected, Disabled). Code:
`src/components/radio/`. It is a native `<input type="radio">`, so each
state is the element's own: Deselected is unchecked, Hover is `:hover` on
an unchecked, enabled radio, Selected is `checked` and Disabled is
`disabled`. Radios that share a `name` are one group: the browser gives
the arrow keys and one tab stop. Every binding is copied exactly. The
Storybook grids force Hover and check each state's size, radius, fill,
stroke colour and width, the dot and the opacity, in Light and Dark.

| State | Fill | Stroke (inside) | Dot | Opacity |
|---|---|---|---|---|
| Deselected | `surface/elevated secondary` | 1px `stroke/strong` | none | 100% |
| Hover | `surface/elevated secondary` | 1px `stroke/focused` | none | 100% |
| Selected | `surface/elevated secondary` | 2px `action/primary/surface/default` | 8px, `action/primary/surface/default`, centred | 100% |
| Disabled | `surface/elevated secondary` | 1px `stroke/strong` | none | 50% |

Every state is 20 × 20 and round (`radius/full`).

Contrast (3:1 for the radio's edge and dot):

| Pair | Light | Dark |
|---|---|---|
| Deselected stroke (`stroke/strong`) on the fill | **2.56** | 3.75 |
| Deselected stroke on `surface/canvas` | **2.45** | 3.75 |
| Hover stroke (`stroke/focused`) on the fill | 6.81 | 6.51 |
| Selected stroke and dot (`action/primary/surface/default`) on the fill | 6.81 | 4.63 |
| Focus ring (`stroke/focused`) on `surface/canvas` | 6.51 | 6.51 |

Disabled is exempt.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius** of all four states is bound to `radius/full`. It was raw 10:
  the same circle at 20px, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Focus | No Focus state | 2px `stroke/focused` outline, 2px offset, as on Button and Checkbox | Add a Focus state |
| Disabled + Selected | Not drawn (Disabled is unchecked) | Selected at 50% | Add it if it should look different |
| Selected + Hover | Not drawn | Stays Selected | None needed |
| Forced colours | — | `forced-color-adjust: none`, so Windows High Contrast keeps the inside stroke (a box-shadow) and the dot | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke is below WCAG 1.4.11 in Light**: `stroke/strong`
  is 2.56:1 on the white fill and 2.45:1 on the canvas (Dark passes,
  3.75). `stroke/stronger` passes in both themes (7.58 / 12.02). axe
  doesn't check non-text contrast, so the story tests can't catch it.
- **Disabled is 50% layer opacity**, as on Toggle (see there).
- **No Error state.** RadioGroup's `error` shows the message and sets
  `aria-invalid`, but the radios look the same.

Figma gaps the code doesn't copy: none. No modes are pinned.

### RadioOption (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Radio Option`
(`457:255`): Selected, with a Label text property. Code:
`src/components/radio-option/`. It is a `<label>` around a Radio, so a
click on the text checks it and the text is the radio's accessible name.
`label` is Figma's Label and Selected is the radio's `checked` (or
`defaultChecked`). Every other prop, and the ref, go to the radio. The
Storybook grids check the label's colour and type, the 8px gap and the
alignment, in Light and Dark.

| Layer | Binding | Code |
|---|---|---|
| Radio | `Radio` instance, State=Deselected / Selected | `Radio` |
| Label | Body/sm-regular, `text/primary` | `text-body-sm-regular text-text-primary` |
| Gap | `space/8` (raw 8 until 29 Oct) | `gap-2` (`space/8`) |
| Alignment | Centre | `items-center` |

Contrast: the label (`text/primary`) is 19.28 Light / 17.85 Dark on
`surface/canvas` and 20.17 / 14.63 on `surface/base`. The radio's are
Radio's.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The gap** of both variants is bound to `space/8`. It was raw 8, so
  nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Letter spacing | 0 | GDL's 0.4px (Body/sm) | Bind the text style to the ramp |
| Disabled | Not drawn | The radio at 50%; the label unchanged | See RadioGroup's design question |
| Hover | Only the Radio's own | Hovering the radio; hovering the label text shows no Hover | Add it if the label should trigger Hover |

Figma gaps the code doesn't copy: none. The Label is connected to the
Label property in both variants, and no modes are pinned.

### RadioGroup (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), component `Form / Radio
Group` (`457:294`): Label, Show Helper and Helper text properties over
three Radio Options (All selected, Admin, User). Create Announcement
(Patterns – Admin 05 and 14) places it as "Target Audience". Code:
`src/components/radio-group/`.

What code maps:
- Label → `label`, rendered with FormLabel (the `_Form Label` look) as
  the fieldset's `<legend>`.
- The Radio Options → `options`, one RadioOption each. A plain string is
  `{ value: s, label: s }`; an option can be `disabled`.
- Each option's Selected → `value` (controlled, `null` for none) with
  `onValueChange`, or `defaultValue`.
- Show Helper + Helper → `helper`.

Code adds what a form needs and Figma doesn't draw:
- `required`: _Form Label's marker, native `required` on every radio (the
  browser won't submit until one is chosen, and focuses the first) and
  `aria-required` on the group.
- `error`: the message in the Helper's place and style, as FormField
  does, with `aria-invalid` on the group and its radios.
- `disabled`: the fieldset's own, which disables every radio.

It is a `<fieldset role="radiogroup">`, named by its legend
(`aria-labelledby`) and described by the Helper (`aria-describedby`). The
radios are native and share `name` (generated when omitted), so the
browser gives the keyboard: the group is one tab stop on the chosen radio
(or the first), and ← → ↑ ↓ move, choose and wrap, skipping disabled
options. With `name`, the chosen `value` is submitted. The ref is the
fieldset's. The Storybook grids force Hover on one option and check the
label, marker, options, Helper, spacing and radio states in Light and
Dark; the stories also check the keyboard and a real form submit.

| Layer | Binding | Code |
|---|---|---|
| Label | Body/sm-regular, `text/secondary` (a text layer, not a `_Form Label` instance) | FormLabel: `text-body-sm-regular text-text-secondary` |
| Required marker | — (from `_Form Label`) | `accent/critical/tonal/content/default`, 2px after the label |
| Options row | Horizontal, `space/24` gap | `flex flex-wrap gap-x-6` (`space/24`) |
| Helper | Caption/md-regular, `text/subtle` | FormHelperText: `text-caption-md-regular text-text-subtle` |
| Column gap | `space/8` between Label, Options and Helper | 8px (`space/8`): `gap-2`, and `mb-2` on the legend |

Contrast, on `surface/canvas` (and `surface/base`, inside a modal):

| Pair | Light | Dark |
|---|---|---|
| Label, `text/secondary` (4.5:1) | 9.90 (10.35) | 14.48 (11.87) |
| Helper and error, `text/subtle` (4.5:1) | 4.55 (4.76) | 6.96 (5.71) |
| Marker, `accent/critical/tonal/content/default` (4.5:1) | 7.99 | 9.30 |

The options and radios are RadioOption's and Radio's.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The gaps:** the group's column (`457:294`) is bound to `space/8` and
  its Options row (`457:296`) to `space/24`. They were raw 8 and 24, so
  nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Hugs (223) in the library; Fill (752) in Create Announcement | Fills its container | None needed |
| Narrow screens | One row, no wrap | The row wraps, with `space/8` between rows | Set the Options frame to wrap, if wanted |
| Required, Error, Disabled | Not drawn | As above | See the design questions |
| Label's line height | Inter's auto (17px) | GDL's 20px | Bind the text style to the ramp |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The Label is a text layer, not a `_Form Label` instance,** so the
  group has no Required. It looks the same as `_Form Label`; swapping in
  the instance would give it the marker every Form / Field has.
- **No Error or Disabled look.** Code's `error` puts the message in the
  Helper (in `text/subtle`, like FormField's) and the radios stay as
  they are; a disabled option dims only its radio, not its label.

Figma gaps the code doesn't copy: none. The Label and Helper are
connected to their properties, and no modes are pinned.

### CheckboxField (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Form / Checkbox
Field` (`457:280`): Checked × Bordered, with Label, Description and Show
Description properties. Add New User (Patterns – Admin 05 and 12) places
it Bordered as "Restricted User". Code: `src/components/checkbox-field/`.

What code maps:
- The Checkbox → the existing Checkbox at 16px.
- Label → `label`; Show Description + Description → `description`.
- Checked → the box's `checked` (or `defaultChecked`).
- Bordered → `bordered`.

The whole field is a `<label>`, so a click anywhere on it (the card's
padding included) toggles the box. The label text names the checkbox
(`aria-labelledby`) and the description describes it
(`aria-describedby`). Every other prop, and the ref, go to the native
checkbox: `name`, `value`, `onChange`, `disabled`, `required`. In a form
it submits `name` = `value` ("on") while checked. The Storybook grids
check all four variants plus Required, Disabled and no description in
Light and Dark: the box, the text styles and colours, the gaps, and the
card's padding, radius and stroke.

| Layer | Bordered=false | Bordered=true | Code |
|---|---|---|---|
| Checkbox | `Checkbox` 16px, Deselected / Selected | the same | `Checkbox` |
| Label | Body/sm-semibold, `text/primary` | the same | `text-body-sm-semibold text-text-primary` |
| Description | Caption/md-regular, `text/secondary`, `space/2` under the label | the same | `text-caption-md-regular text-text-secondary`, `gap-0.5` |
| Gap, box to text | `space/12`, top-aligned | the same | `gap-3` (`space/12`), `items-start` |
| Card | none | `space/16` padding, `radius/8`, 1px inside `stroke/default`; Checked: `stroke/focused` | `p-4 rounded-8 inset-ring inset-ring-stroke-default has-checked:inset-ring-stroke-focused` |

Contrast, on `surface/canvas` (and `surface/base`, inside a modal):

| Pair | Light | Dark |
|---|---|---|
| Label, `text/primary` (4.5:1) | 19.28 (20.17) | 17.85 (14.63) |
| Description, `text/secondary` (4.5:1) | 9.90 (10.35) | 14.48 (11.87) |
| Card stroke, `stroke/default` | 1.42 (1.48) | 2.36 (1.93) |
| Checked card stroke, `stroke/focused` | 6.51 (6.81) | 6.51 (5.33) |

The card's edge is decoration: the checkbox is the control, and its own
edge is Checkbox's open question. The box's contrast is Checkbox's.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Spacing and radius** of all four variants are bound: the gap to
  `space/12`, the Text frame's gap to `space/2`, and on Bordered=true the
  padding to `space/16` and the radius to `radius/8`. They were raw 12, 2,
  16 and 8, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Box position | Top-aligned with the label on Inter's 17px line | 2px down (`mt-0.5`), so the 16px box is centred on GDL's 20px Body/sm line | Bind the text style to the ramp |
| Width | Fixed 464 in the library; Fill (512) in Add New User | Fills its container | None needed |
| Click target | — | The whole field (a `<label>`) | None needed |
| Required | No such property | Native `required`, and `_Form Label`'s marker after the label | See the design question |
| Disabled | No such state (Checkbox has none either) | Native `disabled`: the not-allowed cursor only | Add a Disabled state |
| Focus | No Focus state | Checkbox's 2px `stroke/focused` ring on the box | Add a Focus state |

Figma gaps the code copies exactly. These are for the designer to decide:

- **No Required, Disabled or Error.** Code shows `_Form Label`'s marker
  for `required`; a disabled field only changes the cursor.

Figma gaps the code doesn't copy: none. Label and Description are
connected to their properties in every variant, and no modes are pinned.

### ToggleField (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Form / Toggle
Field` (`457:293`): Checked, with Label, Description and Show Description
properties. Create Announcement (Patterns – Admin 05 and 14) places it as
"Active", checked. Code: `src/components/toggle-field/`.

What code maps:
- Label → `label`; Show Description + Description → `description`.
- The Toggle → a Toggle at the end of the row.
- Checked → the switch's `checked` (or `defaultChecked`).

The whole field is a `<label>`, so a click on the text flips the switch.
The label text names the switch (`aria-labelledby`) and the description
describes it (`aria-describedby`). Every other prop, and the ref, go to
the native switch: `name`, `value`, `onChange`, `disabled`, `required`. In
a form it submits `name` = `value` ("on") while on. The Storybook grids
check both variants plus Required, Disabled and no description in Light
and Dark: the text styles and colours, the switch's fill, its place at
the row's end and the 16px gap.

| Layer | Binding | Code |
|---|---|---|
| Label | Body/sm-semibold, `text/primary` | `text-body-sm-semibold text-text-primary` |
| Description | Caption/md-regular, `text/secondary`, `space/2` under the label | `text-caption-md-regular text-text-secondary`, `gap-0.5` |
| Text | Fill | `flex-1` |
| Toggle | `Toggle` instance, Checked false / true | `Toggle` |
| Gap, text to switch | `space/16`, centred | `gap-4` (`space/16`), `items-center` |

Contrast, on `surface/canvas` (and `surface/base`): the label 19.28
(20.17) Light / 17.85 (14.63) Dark, the description 9.90 (10.35) / 14.48
(11.87). The switch's are Toggle's (its Checked=false track fails 3:1).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Spacing** of both variants is bound: the gap to `space/16` and the
  Text frame's gap to `space/2`. They were raw 16 and 2, so nothing looks
  different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 464 in the library; Fill (752) in Create Announcement | Fills its container | None needed |
| Click target | — | The whole field (a `<label>`) | None needed |
| Required | No such property | Native `required` (the switch must be on), and `_Form Label`'s marker | See the design question |
| Disabled | No such variant (the Toggle has one) | The switch at 50%; the text unchanged | See the design question |

Figma gaps the code copies exactly. These are for the designer to decide:

- **No Required or Disabled.** Code shows `_Form Label`'s marker for
  `required`, and a disabled field dims only the switch, as Toggle's
  Disabled does.

Figma gaps the code doesn't copy: none. Label and Description are
connected to their properties in both variants, and no modes are pinned.

### FileUploadZone (29 Oct 2026)

Source: page **Form** (`183:1765`), component `_File Upload Zone`
(`184:3022`): Title and Hint text properties, no variants. Form / Field –
File Upload (`184:3085`) exposes it. Form / Bulk Upload (`191:433`) and
pattern 10 place it with "Click or drag files to upload" / "DOC, DOCX,
PDF, PNG, JPG, JPEG accepted (Max 10.0MB)" and "Click or drag CSV file to
upload" / "Only CSV files are accepted". Code:
`src/components/file-upload-zone/`. `title` and `hint` are Title and Hint;
Figma's default Title is the default. It is a native `<input
type="file">`, visually hidden but focusable, inside the zone. Tab
reaches it and Enter or Space opens the dialog. A click anywhere on the
zone calls the input's `click()`. A drop puts the files in the input
(DataTransfer) and fires its change event: with `multiple` every file,
otherwise the first. `onFilesChange` gets the files. Every other prop,
and the ref, go to the input. Outside a field the Title names the input,
and inside one the Hint joins its description. Every binding is copied
exactly; the icon's raw fill was fixed in Figma first (below). The
Storybook grids check the stroke (style, width, colour), radius, padding,
icon, Title and Hint in every state, in Light and Dark.

| Part | Binding |
|---|---|
| Zone | No fill; 1px dashed `stroke/subtle` stroke inside (dash 6, gap 4); `radius/8`; `space/24` padding; `space/8` gap; centred column |
| Icon / Upload | Phosphor FileArrowUp 24px, `text/subtle` (a raw `#E5E5E5` until 29 Oct) |
| Title | Body/sm-regular, `text/secondary` |
| Hint | Caption/md-regular, `text/subtle` |

States the code adds (Figma draws none):

| State | Code |
|---|---|
| Focus (keyboard, on the hidden input) | 2px `stroke/focused` outline, 2px out, as Button's ring |
| Drag-over (files held over the zone) | The dashed stroke in `stroke/focused`, `_Text Input`'s Focus colour |
| Error (`aria-invalid`, which FormField's `error` sets) | The dashed stroke in `accent/critical/outline/border/default`, as `_Text Input`'s Error |
| Disabled | Title in `text/subtle` (as TextInput's disabled value), not-allowed cursor, no dialog, drops ignored |

Contrast. The zone has no fill, so it is measured on `surface/canvas` / `surface/base`:

| Pair | Light | Dark |
|---|---|---|
| Title, `text/secondary` (4.5:1) | 9.90 / 10.35 | 14.48 / 11.87 |
| Hint, `text/subtle` (4.5:1) | 4.55 / 4.76 | 6.96 / 5.71 |
| Icon, `text/subtle` (3:1) | 4.55 / 4.76 | 6.96 / 5.71 |
| Focus ring and drag-over stroke, `stroke/focused` (3:1) | 6.51 / 6.81 | 6.51 / 5.33 |
| Error stroke, `accent/critical/outline/border/default` (3:1) | 3.64 / 3.81 | 3.74 / 3.07 |
| Resting stroke, `stroke/subtle` (3:1) | **1.18 / 1.23** | **1.72 / 1.41** |

Disabled is exempt.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The upload icon** (`I184:3023;3167:102352`) was a raw `#E5E5E5`,
  about 1.2:1 on the Light canvas, so it nearly disappeared in Light. It's
  now bound to `colors/text/subtle`, as File Chip's FileText and the
  zone's own Hint are. The three placements on the Form page follow it.
- **Radius, padding and gap** of the zone are bound to `radius/8`,
  `space/24` and `space/8`. They were raw 8, 24 and 8, so nothing looks
  different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Dash pattern | Dash 6, gap 4 | CSS `border-dashed`, with the browser's dash length. CSS can't set the pattern without an SVG border | None needed |
| Width | Fixed 510 (Fill inside the field) | Fills its container (`w-full`) | None needed |
| Height | 122px: Inter's auto line heights (17, 15), strokes in layout | 126px: GDL's 20px and 16px line heights | Bind the text styles to the ramp |
| Focus, drag-over, error, disabled | No such states | As above | Add them to `_File Upload Zone` if they should look different (design question) |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting dashed stroke is below WCAG 1.4.11** (1.18 to 1.72:1).
  This is the open question TextInput and Checkbox share. The Title and
  the icon also mark the zone. axe doesn't check non-text contrast.

Figma gaps the code doesn't copy: none (no pinned modes).

### FileChip (29 Oct 2026)

Source: page **Form** (`183:1765`), set `File Chip` (`456:805`): State
(Default, Error) × Action (Remove, Download), with File Name, Meta and
Show Remove. The variants are Default/Remove `456:787`, Error/Remove
`456:797` and Default/Download `463:817`. Pattern 10 places
Default/Remove under the field (invoice-september.pdf · 245 KB,
receipt-0927.png · 1.2 MB) and Error/Remove for a rejected file
(contract.zip · "File type not supported. Use DOC, DOCX, PDF, PNG, JPG or
JPEG."). It places Default/Download in the Invoices dialog. Code:
`src/components/file-chip/`. `fileName` is File Name, `meta` is Meta,
`state` is State and `action` is Action. Show Remove is `onRemove`: the ×
shows when it is given. The × is an IconButton (ghost, 32) named "Remove
<file name>". Download is a Button (small, tonal, DownloadSimple icon)
labelled "Download", named "Download <file name>", which calls
`onDownload`. `formatFileSize(bytes)` writes Meta the way Figma does
("245 KB", "1.2 MB"). Every binding is copied exactly. The grids check
each cell's fill, stroke, radius, padding, height, icon, the name's and
the meta's type and colour, the × glyph at rest and hovered, and the
Download button, in Light and Dark.

| Part | State=Default | State=Error |
|---|---|---|
| Chip | `surface/neutral/faint`, 1px `stroke/subtle` inside, `radius/8`, `space/12` sides, 44px tall | Stroke `accent/critical/outline/border/default` |
| Icon / File | FileText 20px, `text/subtle` | Same |
| File Name | Body/sm-medium, `text/primary`, truncated at the end | Same |
| Meta | Caption/md-regular, `text/subtle`, `space/2` under the name | `accent/critical/tonal/content/default` |
| × (Action=Remove, Show Remove) | X 16px, `text/subtle` | Same |
| Download (Action=Download) | Button / Small, Style=Tonal, DownloadSimple, "Download" | — |

Contrast, on the chip's fill:

| Pair | Light | Dark |
|---|---|---|
| File Name, `text/primary` (4.5:1) | 19.28 | 17.85 |
| Meta, `text/subtle` (4.5:1) | 4.55 | 6.96 |
| Error Meta, `accent/critical/tonal/content/default` (4.5:1) | 7.99 | 9.30 |
| File icon and ×, `text/subtle` (3:1) | 4.55 | 6.96 |
| × hovered: `text/secondary` on `neutral/tonal/surface/default` (3:1) | 8.40 | 6.15 |
| Error stroke (3:1) | 3.64 | 3.74 |
| Resting stroke, `stroke/subtle` (3:1) | **1.18** | **1.72** |
| Download label, `action/primary/surface/default` on `surface/brand/faint` (hovered, on `surface/brand/subtle`) | 5.46 (3.98) | **3.59 (2.79)** |

Download's pair is Button's Tonal pair, which is below AA in Dark. The
grids skip the Download buttons in axe's contrast check only. The
"Download contrast" stories report them with `a11y: { test: 'todo' }`, as
Button's Tonal stories do. Remove the exception when Button's Tonal pair
passes. The chip's fill has the same value as `surface/canvas` in both
themes (1.00:1), so on a page the stroke is its only edge.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, side padding and text gap** of the three variants are bound to
  `radius/8`, `space/12` and `space/2` (on the chips `456:787`, `456:797`,
  `463:817` and their Text frames `456:791`, `456:799`, `463:819`). They
  were raw 8, 12 and 2, so nothing looks different. The raw 10 gap and the
  raw 10 top and bottom padding stay: GDL has no 10, so binding them would
  change the look (below).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| × | A bare 16px X glyph, with no hover | IconButton (ghost, 32px target), with the glyph in Figma's `text/subtle`. Hovered, it takes IconButton ghost's fill and glyph (`text/secondary`), because `text/subtle` on that fill is 2.96:1 in Dark. A −8px right margin keeps the glyph 12px from the edge, where Figma draws it | Place `Button / Icon` (Ghost, 32) in the chip (design question) |
| Gap | Raw 10 | `space/8`, as Button's raw 10 became | Bind to `space/8` |
| Height and padding | Fixed 44px, with raw 10 top and bottom; the 34px text column overflows the padding | At least 44px (`space/44`), with 2px top and bottom; the 38px text column (GDL line heights) is centred. A long reason wraps and the chip grows | Bind the height to 44, or the padding to the scale (design question) |
| Width | Fixed 510 (350 in the dialog) | Fills its container | None needed |
| Show Remove | A boolean on the × | The × shows when `onRemove` is given | None needed |
| File Name | Truncation: Ending | `truncate`, with the full name as its `title` | None needed |
| Download | Button / Small, Style=Tonal | Button `size="small" variant="tonal"`, with Button's own departures | As listed under Button |

Figma gaps the code copies exactly: the resting stroke below 3:1, and the
chip's fill equal to the canvas. Figma gaps the code doesn't copy: none
(no pinned modes).

### FileUploadField (29 Oct 2026)

Source: page **Form** (`183:1765`), component `Form / Field – File
Upload` (`184:3085`): a Label Row (`_Form Label`), an Input Wrapper (the
`_File Upload Zone`, at Fill) and the Helper Text (Show Helper + Helper).
Pattern 10, "File upload & attachments" (Patterns – Admin, `527:6028`),
places File Chips under it. Its guidance sets the behaviour: each
accepted file becomes a chip with its size and a ×, and a rejected file
becomes a red chip that says why, with nothing uploaded. Code:
`src/components/file-upload-field/`. It is FormField around a
FileUploadZone, then a `<ul>` of FileChips.

| Part | Binding and layout |
|---|---|
| Label, Required, Helper, error | FormField's (see FormField): the label 20px above the zone, the Helper right under it |
| Zone | FileUploadZone, filling the field |
| Chips | One FileChip per file, Action=Remove, Meta = `formatFileSize(file.size)`, 12px under the field and 12px apart (pattern 10's Screen · Added: raw 12, so `space/12`) |
| A rejected file | FileChip State=Error, with `validate`'s reason as its Meta |

Behaviour (code, following pattern 10's guidance):

- `files` / `defaultFiles` / `onFilesChange` hold the accepted files.
  With `multiple`, new files are added (the same file twice is kept
  once). Without it, a new file replaces the old one.
- `validate(file)` returns why a file is rejected. The file then shows as
  an Error chip and isn't added. Dropped files skip `accept`, so
  `validate` checks the type with `fileMatchesAccept`.
- The native input always holds the files shown (DataTransfer), also
  after a remove or a rejection. So `name` submits exactly those files,
  and `required` stops a submit with none.
- The list is `aria-live="polite"`, so added files and rejection reasons
  are announced. Removing a file moves focus to the next ×, or to the
  input after the last one.
- `disabled`: no dialog and no drop, and the chips have no ×.

Contrast: as FormField, FileUploadZone and FileChip (above).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Chips | Not part of the component; pattern 10 places them 12px under it | Part of FileUploadField, 12px under the field and 12px apart | None needed, or add the list to the component (design question) |
| Error | The zone has no Error state; the Helper carries the message | `error` shows in the Helper (`text/subtle`, as FormField does) and turns the zone's stroke critical | See FileUploadZone |
| Size rejection | Pattern 10 shows only the type message | Whatever `validate` returns | Add the copy (design question) |
| Spacing in Form / Bulk Upload | Its field instance overrides the gap to 12 and the Label Row padding to 0 (12px from label to zone) | FormField's 20px, as the component and pattern 10 use | Reset the instance overrides |

Figma gaps the code doesn't copy: none (no pinned modes).

### RepeatableField (29 Oct 2026)

Source: page **Form** (`183:1765`), section Repeatable Fields
(`510:2707`): `Form / Repeatable Field` (`463:780`) and its
`Form / Repeatable Field Row` (`463:594`, one boolean: Show Remove). It
is placed once, as the required "Features" list in the Create Announcement
modal (Patterns – Admin, 14 · Announcements & what's new, `529:6900`), with
rows "one", "two", "three" and an "Add Feature" button. Code:
`src/components/repeatable-field/`: `RepeatableField` and
`RepeatableFieldRow`. Every binding comes from the components it reuses
(FormLabel, TextInput, IconButton, Button). The Storybook grids check them
in Light and Dark, at rest and with the buttons hovered: the label and
marker, the 8px column and row gaps, each input's fill, stroke, text and
height, each Remove button's size, glyph and hover fill, and the add
button's fill, label and stroke at rest, on hover and disabled.

Figma → code:
- `_Form Label` (Label, Required) → `label`, `required`. It is the
  `<legend>` of a `<fieldset>` (a FormLabel), so the legend names the
  group. Required shows the marker, makes every row's input `required`,
  and keeps at least one row.
- The rows → one `RepeatableFieldRow` per entry of `values` (controlled,
  with `onValuesChange`) or `defaultValues` (uncontrolled, default one
  empty row). Every row's input takes `name`, so the form submits one entry
  per row (`formData.getAll(name)`, in order).
- Row: `_Text Input` (State=Filled for a value, Default for an empty row
  with `placeholder`) → TextInput, filling the row. `Remove` (Button /
  Icon, Size=40, Tone=Destructive, Trash) → IconButton. Show Remove →
  `showRemove`. RepeatableField shows it while the list holds more than
  `min` rows.
- `Add Button` (Button / Small, Style=Outlined, Show Icons, Plus) →
  `<Button variant="outlined" size="small" leftIcon={<Icon name="plus" />}>`,
  labelled `addLabel`. It is disabled at `max` rows.
- Behaviour Figma can't draw: adding a row focuses its input. Removing a
  row focuses the input that takes its place, else the one before it, else
  the add button. The ref is the `<fieldset>`, and its native `disabled`
  disables every row and button (none is submitted).

| Layer | Bound to | In code |
|---|---|---|
| _Form Label / Label | Body/sm-regular, `text/secondary` | FormLabel (`as="legend"`) |
| _Form Label / Required Marker | `accent/critical/tonal/content/default` | FormLabel |
| _Text Input | fill `surface/elevated secondary`; 1px inside `stroke/subtle`; value `text/primary`, placeholder `text/subtle`; `radius/8`; `space/12` sides | TextInput |
| Remove | Trash glyph `accent/critical/tonal/content/default`; no fill, hover `accent/critical/tonal/surface/default` | IconButton, `size={40}`, `tone="destructive"` |
| Add Button | fill `action/secondary/surface/default`; 1px inside `action/secondary/border/default`; label and Plus `action/secondary/content/default`; Hover → the `…/hover` set | Button, `variant="outlined"`, `size="small"` |
| Field and Row gaps | `space/8` (raw 8 until 29 Oct) | `gap-2` (`space/8`) |

Contrast. The field sits on `surface/base` (Modal / Dialog) or
`surface/canvas`:

| Pair | Light (base / canvas) | Dark (base / canvas) |
|---|---|---|
| Label, `text/secondary` (4.5:1) | 10.35 / 9.90 | 11.87 / 14.48 |
| Required marker (4.5:1) | 8.36 / 7.99 | 7.62 / 9.30 |
| Remove glyph (3:1), at rest; on its hover fill | 8.36 / 7.99; 6.85 | 7.62 / 9.30; 5.22 |
| Add label (4.5:1), at rest; on its hover fill | 6.81 / 6.51; 8.62 | 12.22 / 14.91; 8.65 |
| Add border (3:1), at rest; hover | 6.81 / 6.51; 8.62 | 3.80 / 4.63; 4.19 |
| Rows | As TextInput: value 20.17, placeholder 4.76, resting stroke **1.23** | 17.85, 6.96, **1.72** |

The resting input stroke is TextInput's open question (below 3:1, copied
from Figma). Disabled is exempt.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The gaps** of `Form / Repeatable Field` (`463:780`) and its Row
  (`463:594`) are bound to `space/8`. They were raw 8, so nothing looks
  different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Label | `_Form Label` is the column's first child, 8 above the first row | A `<legend>` with 8px bottom padding: a fieldset's legend isn't a flex item, so it can't take the column's gap. Same 8px | None needed |
| Group semantics | None | `<fieldset>` named by the legend. Each input is "<label> <n>" ("Features 2"), each remove button "Remove <label> <n>" (`rowLabel` / `removeLabel` override them, and must when `label` isn't plain text) | None needed |
| Row count | Rows are duplicated instances ("add or remove rows per instance") | The user adds and removes rows; `min` and `max` bound the count | None needed |
| Show Remove | On in every row | Shown while the list holds more than `min` rows (default 0, or 1 when `required`) | Draw the at-minimum row if it should look different |
| Max | No such state | The add button takes Button's Disabled at `max` | Draw the full list if it should look different |
| Required | The marker | The marker, `required` on every row's input (an empty row stops the submit), and one row always stays | None needed |
| Heights | `_Text Input` hugs 39px; Add Button hugs 33px | 40px and 32px, as TextInput and Button | As listed under TextInput and Button |
| Focus | No Focus states | TextInput's 2px `stroke/focused` stroke, and the 2px `stroke.focused` ring of IconButton and Button. Focus moves on add and remove | Add Focus states |
| Description | Reads `an &quot;Add …&quot; button` | Not applicable | Replace the entities with quotation marks |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The label sits 8px above the first row,** while every
  `Form / Field – *` has 20px under its label.
- **No Helper and no error state,** so a required list can't show a
  message. An empty row in a required list is caught by the browser's own
  check.
- **In Dark, Button / Small Outlined's Disabled** (the full list's add
  button) has a `#d6d8eb` border and label, which looks more prominent
  than the enabled `#6875f5` border.
- **No component properties.** The label, the add label and the row count
  are overrides on nested instances.

Figma gaps the code doesn't copy: none (no pinned modes).

### StatCard (30 Oct 2026)

Source: page **Cards** (`311:2719`), component `Card / Stat` (`387:3593`)
and its private set `_Stat Icon` (`387:3592`, Type ×7). Card / Stat has
Label, Value and Status Indicator (an instance swap of `_Stat Icon`). It is
nested in both stat rows (`Card / Stat Row – Exports` `387:3601`,
`– Announcements` `389:163`). Patterns – Admin 13 and 14 place those rows
above the Exports and Announcements lists. Code: `src/components/stat-card/`.
`label` is Label and names the card. `value` is Value. The Status
Indicator is `icon` + `tone`. `_Stat Icon` is used only here, so it is part
of StatCard, not a component of its own. The Storybook grids check each of
Figma's seven Types in Light and Dark:

- the card's fill, radius, padding and gap
- the tile's size, radius and fill
- the glyph's size and colour
- the label's and value's colour and type style
- the card's accessible name

| Figma | Code |
|---|---|
| Card: horizontal, centred; padding `space/24`, gap `space/12`, radius `radius/12`; `surface/base` | `<article>` `flex items-center gap-3 p-6 rounded-12 bg-surface-base` |
| Width: fixed 372 | Fills what it is given (`StatRow` shares the row) |
| `_Stat Icon`: 40×40, radius `radius/8`, `accent/<tone>/tonal/surface/default` | `size-10 rounded-8 bg-accent-<tone>-tonal-surface-default`, `aria-hidden` |
| Glyph: Phosphor Regular 24px, `accent/<tone>/tonal/content/default` | `<Icon size={24}>` in `text-accent-<tone>-tonal-content-default` |
| Text Group: vertical, gap `space/4`, Fill | `flex min-w-0 flex-1 flex-col gap-1` |
| Label: Body/sm-regular, `text/subtle` | `<p>` `text-body-sm-regular text-text-subtle`; names the article (`aria-labelledby`) |
| Value: Heading/lg-semibold, `text/primary` | `<p>` `text-heading-lg-semibold text-text-primary` |

`_Stat Icon` Type → `icon` + `tone`:

| Type | `icon` | `tone` (accent family) |
|---|---|---|
| Total Exports (default) | `file-text` | `info` |
| Completed | `check-circle` | `success` |
| Processing | `clock` | `pending` |
| Failed | `x-circle` | `critical` |
| Total Announcements | `bell` | `info` |
| Latest Version | `tag` | `success` |
| Last Updated | `calendar-blank` | `info` |

Contrast: the text passes AA, and every glyph passes 3:1 on its tile.

| Pair | Light | Dark |
|---|---|---|
| Label, `text/subtle` on `surface/base` | 4.76 | 5.71 |
| Value, `text/primary` on `surface/base` | 20.17 | 14.63 |
| Glyph on tile: info | 5.60 | 5.72 |
| Glyph on tile: success | 6.49 | 6.46 |
| Glyph on tile: pending | 4.52 | 5.56 |
| Glyph on tile: critical | 6.85 | 5.22 |
| Tile on card (decorative) | 1.10–1.22 | 1.41–1.62 |
| Card on `surface/canvas` (decorative) | 1.05 | 1.22 (design question) |

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs
publishing):
- **`Card / Stat`** (`387:3593`): its radius 12, padding 24 and gap 12 are
  bound to `radius/12`, `space/24` and `space/12`, and its Text Group's
  gap 4 to `space/4`. The seven `_Stat Icon` variants' radius 8 is bound to
  `radius/8`. They were raw values on GDL's scale, so nothing looks
  different.
- **The Status Indicator swap** (`Status Indicator#387:2`) lists the seven
  `_Stat Icon` variants as its preferred values. It listed none, so the
  swap picker offered every component in the library.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Status Indicator | An instance swap of `_Stat Icon`, whose Type (seven, named for screen content) sets glyph and colour | `icon` (any Phosphor glyph) and `tone` (`info`, `success`, `pending`, `critical`) | Make `_Stat Icon` Tone × an icon swap (design question) |
| Element | A frame | An `<article>` named by its label. The value is a `<p>`, not a heading, though its style is Heading/lg-semibold: as headings, bare numbers would fill heading navigation | None needed (design question) |
| Width | Fixed 372 | Fills its container | None needed |
| Height | 98 (17px label, 29px value on Inter's auto line height) | 102 (20px and 30px, GDL's ramp) | Bind the text styles' line heights to the ramp |

Figma gaps the code doesn't copy:

- **`Card / Stat` is pinned to Semantics Dark** (`387:3593`), and so is the
  `_Stat Icon` set (`387:3592`). Every card in the two stat rows inherits
  the pin. Code follows the page's theme. Clear both explicit modes. Not
  changed on 30 Oct: clearing them changes what the library and the
  patterns show, so it's the designer's call.
- The Announcements Types' glyphs (Bell, Tag, CalendarBlank) are fixed
  24×24 instances, and the others hug. Nothing looks different.

### StatRow (30 Oct 2026)

Source: page **Cards** (`311:2719`), two components:

- `Card / Stat Row – Exports` (`387:3601`): four `Card / Stat`s at a fixed
  372px, gap 16, the row hugging them at 1536.
- `Card / Stat Row – Announcements` (`389:163`): three cards set to Fill in
  a fixed 1536px row, 501 each, gap 16.

Patterns – Admin 13 (Overview & record details) puts the Exports row
between the page header and the filter bar. 14 (Announcements & what's
new) does the same with the Announcements row. The two rows are content;
StatRow is their layout. Code: `src/components/stat-row/`. The Storybook
stories render both rows at Figma's 1536px in Light and Dark, and check the
card widths, the gap, one line and the cards' colours. They also check the
wrapping at 344px (a phone) and 600px.

| Figma | Code |
|---|---|
| Horizontal, gap `space/16`, no fill | `flex flex-wrap gap-4` |
| Cards: fixed 372 (Exports) / Fill (Announcements) | Each direct child grows to share its line (`*:grow *:basis-64`): 372 and 501 at 1536, as in Figma |
| The `Card / Stat` instances | `children`: the `<StatCard>`s. Fragments and components that return several cards work, because the row lays out the elements directly inside it |

Contrast: none of its own (no fill); see StatCard.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs
publishing): both rows' gap (raw 16) is bound to `space/16`. Nothing looks
different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Two rows | `– Exports` and `– Announcements`, fixed content | One generic `StatRow`; the content is the cards passed in | None needed (plan decision 4: the rows are app compositions) |
| Narrow screens | Fixed 1536px rows | A card is at least 256px (`space.256`). Cards wrap, the last line's cards share it, and on a phone there is one per line | Add a narrow frame if the screens need a particular wrap (design question) |
| Semantics | A frame | A `<div>`; each card is a named article. Pass `role="group"` and `aria-label` to name the row | None needed |

Figma gaps the code doesn't copy: the cards inherit `Card / Stat`'s pin to
Dark (see StatCard).

### DescriptionList (30 Oct 2026)

Source: page **Cards** (`311:2719`), components `Description List`
(`464:12371`) and `Description List / Item` (`464:12368`, with Label and
Value text properties). Patterns – Admin 13 places it in Export Details
(`_Pattern Content / Export Details` `529:6476`, in a Medium
`Modal / Dialog`) with eight items: Name, Type, Created By, File Size,
Created, Completed, Valid until, Downloads. Code:
`src/components/description-list/`. `DescriptionList` is a `<dl>`.
`DescriptionListItem` takes `label` (a `<dt>`) and `value` (a `<dd>`),
wrapped in a `<div>`, as HTML allows. The Storybook grids run in Light and
Dark, on `surface/canvas` and on a dialog's `surface/base`. They check
Figma's layout (220px columns at 464, gaps of 24 and 16, 2px between label
and value), the bindings and the term and definition roles.

| Figma | Code |
|---|---|
| List: horizontal wrap; gap `space/24` and row gap `space/16`; fixed 464 | `<dl>` `grid grid-cols-2 gap-x-6 gap-y-4` |
| Item: vertical, gap `space/2`, fixed 220 | `<div>` `flex min-w-0 flex-col gap-0.5`, as wide as its column (220 at 464) |
| Label: Caption/md-regular, `text/subtle`, hugs | `<dt>` `text-caption-md-regular text-text-subtle` |
| Value: Body/sm-medium, `text/primary`, fills, wraps | `<dd>` `text-body-sm-medium text-text-primary break-words` |

Contrast: all text passes AA.

| Pair | Light (canvas / base) | Dark (canvas / base) |
|---|---|---|
| Label, `text/subtle` | 4.55 / 4.76 | 6.96 / 5.71 |
| Value, `text/primary` | 19.28 / 20.17 | 17.85 / 14.63 |

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs
publishing): `Description List`'s gap 24 and wrap gap 16 are bound to
`space/24` and `space/16`, and the Item's gap 2 to `space/2`. They were
raw, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Columns | Fixed 220px items wrapping in a 464px frame: one column below 464, and two with 48px to spare in the 512px dialog | Two equal columns at any width: 220 at 464, 244 in the 512px dialog. Pass `className="grid-cols-1"` for one column | None needed, or a narrow variant (design question) |
| Value | Text | Any content (a `Tag`, a link) | None needed |
| Long values | Break mid-word ("…05333" / "2.zip") | `break-words`: wrap at spaces, and break a word only when it doesn't fit | None needed |
| Height | 34 an item (15 + 2 + 17) | 38 (16 + 2 + 20), on GDL's ramp | Bind the text styles' line heights to the ramp |

Figma gaps the code doesn't copy: none (no pinned modes).

### FilterSummary (30 Oct 2026)

Source: page **Filters** (`89:836`), components `Filter / Summary`
(`463:12201`: a Title property over a "Filters" frame of lines) and
`Filter / Summary Line` (`463:12204`, with Key and Value properties).
Patterns – Admin 13 places it under the Description List in Export
Details, with Search, Status and Type all "All". Figma has no clear or
edit action: it is a read-only record of the filters an export used.
Code: `src/components/filter-summary/`. `title` is Title (default "Current
Filters") and names the summary (`role="group"`, `aria-labelledby`).
`filters` is the lines, one `{ key, value }` each. The lines are a `<dl>`.
`Filter / Summary Line` is used only here, so it is part of FilterSummary.
The grids check every binding, the box's hugging width and the roles, on
`surface/canvas` and on a dialog's `surface/base`, in Light and Dark.

| Figma | Code |
|---|---|
| Summary: vertical, gap `space/8`, fixed 464 | `flex flex-col items-start gap-2`, a `role="group"` named by the title |
| Title: Body/sm-medium, `text/secondary` | `<p>` `text-body-sm-medium text-text-secondary` |
| Filters: vertical; padding `space/12` / `space/16`, gap `space/6`, radius `radius/8`; `surface/elevated secondary`; hugs | `<dl>` `flex flex-col gap-1.5 rounded-8 bg-surface-elevated-secondary px-4 py-3` |
| Summary Line: horizontal, gap `space/4` | `<div>` `flex gap-1` |
| Key: Body/sm-semibold, `text/primary` ("Search:") | `<dt>` `text-body-sm-semibold text-text-primary`, rendering `{key}:` |
| Value: Body/sm-regular, `text/secondary` ("All") | `<dd>` `text-body-sm-regular text-text-secondary` |

Contrast: the text passes AA. On one surface in each theme, the box can't
be told apart from what it sits on (design question).

| Pair | Light | Dark |
|---|---|---|
| Title, `text/secondary` on canvas / base | 9.90 / 10.35 | 14.48 / 11.87 |
| Key, `text/primary` on `surface/elevated secondary` | 20.17 | 17.85 |
| Value, `text/secondary` on `surface/elevated secondary` | 10.35 | 14.48 |
| Box on `surface/base` (a dialog) | 1.00 | 1.22 |
| Box on `surface/canvas` | 1.05 | 1.00 |

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs
publishing): `Filter / Summary`'s gap 8 is bound to `space/8`. Its Filters
frame's padding 12 / 16, gap 6 and radius 8 are bound to `space/12`,
`space/16`, `space/6` and `radius/8`, and `Filter / Summary Line`'s gap 4
to `space/4`. They were raw, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| The Key's colon | Typed into the Key text ("Search:") | `key` is the filter's name ("Search"); code adds the colon | Optional: leave the colon out of the property's text |
| Lines | Summary Line instances, added or removed by hand | `filters`: an array with one line per entry | None needed |
| Width | Fixed 464 | Fills its container; the box hugs its lines, as in Figma | None needed |
| Height | 17px lines | 20px lines, on GDL's ramp | Bind the text styles' line heights to the ramp |

Figma gaps the code doesn't copy: none (no pinned modes).

### BreakdownItem (30 Oct 2026)

Source: page **Cards** (`311:2719`), component `Card / Breakdown Item` (`460:11644`): Title, Meta, Period, Amount and Show Actions. Pattern 06 places two in the Edit Recurring Cost side sheet and pattern 09 two in a new cost's review step, all with Show Actions on. Code: `src/components/breakdown-item/`. The Storybook grids check every binding with Show Actions off and on, and the ••• forced to Hover, in Light and Dark.

How the Figma properties map:
- Title → `title`, Meta → `meta`, Period → `period`, Amount → `amount`.
- Show Actions and its nested `Menu / Row Actions Button` → `actions`: the MenuItems of a RowActionsMenu. Leave it out to hide the •••.
- `actionsLabel` names the ••• button. It defaults to "Actions for <title>", so two items never share a name.
- The item is a `<div>`, not a heading or a landmark (the title's style is Body). The stories list items in a `<ul>`.

| Layer | Figma | Code |
|---|---|---|
| Frame | Horizontal, centred; padding and gap `space/16` | `flex items-center p-4 gap-4` |
| Fill, edge | `surface/neutral/faint`; 1px `stroke/subtle` inside; `radius/8` | `bg-surface-neutral-faint inset-ring inset-ring-stroke-subtle rounded-8` |
| Width | Fixed 624 | Fills its container |
| Details | Vertical, gap `space/4`, Fill | `flex-1 flex-col gap-1` |
| Title | Body/sm-semibold, `text/primary` | `text-body-sm-semibold text-text-primary` |
| Meta | Caption/md-regular, `text/secondary` | `text-caption-md-regular text-text-secondary` |
| Period | Caption/md-regular, `text/subtle` | `text-caption-md-regular text-text-subtle` |
| Amount | Body/sm-semibold, `text/primary` | `text-body-sm-semibold text-text-primary`, no wrap |
| Row Actions | `Menu / Row Actions Button`, hidden unless Show Actions | `RowActionsMenu` (IconButton Ghost 32 + MenuDropdown) |

Contrast, Light / Dark, on `surface/neutral/faint`:
- Title and Amount: 19.28 / 17.85
- Meta: 9.90 / 14.48
- Period: 4.55 / 6.96
- ••• glyph (`text/secondary`, needs 3:1): 9.90 / 14.48; on its hover fill 8.40 / 6.15

The 1px `stroke/subtle` edge (1.18 / 1.72) outlines a card, not a control, so 3:1 doesn't apply.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | 89, on Inter's auto line heights | 92, on GDL's 20 / 16px lines | Bind the text styles' line heights to the ramp |
| Width | Fixed 624 | Fills its container | Set the width to Fill |
| ••• button | The one-off 32×32: radius 6, 20px DotsThree in `text/primary`, no hover | IconButton Ghost 32 (see "RowActionsMenu") | Swap for a `Button / Icon` instance, Ghost 32 |
| Its name | None | `actionsLabel`, default "Actions for <title>" | None needed |
| Meta, Period | Always shown | Render only when given | None needed |

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing; nothing looks different, and code already uses these tokens):
- The frame's radius (raw 8) is bound to `radius/8`.
- Its padding and gap (raw 16) are bound to `space/16`, and the Details gap (raw 4) to `space/4`.

Figma gaps the code doesn't copy:
- **The Row Actions instance (`460:11650`) is pinned to Semantics Dark** (mode `1:2`), as every pattern 03 placement is. Code follows the page's theme. Clear the explicit mode.

### ChangeDiff and ChangeDiffRow (30 Oct 2026)

Source: page **Table** (`3:1823`), components `Table / Change Diff` (`464:1169`) and `Table / Change Diff Row` (`464:978`; Field, Before, After). Pattern 08 opens one under an Audit Logs entry ("View Changes": Status, Unknown → Pending). A deleted record shows a compact Alert instead, as the component's description says. Code: `src/components/change-diff/`. The Storybook stories check the table's semantics and every binding, in Light and Dark.

How it maps:
- ChangeDiff is a real `<table>`. Field, Before and After are `<th scope="col">`. Each row's field is a `<th scope="row">`, so a screen reader reads every value with its column and its field. Name it with `aria-label` ("Changes to cost #32430").
- The Row instances → `children`: one `<ChangeDiffRow field before after />` per changed field.
- Before is a `<del>` and After an `<ins>`. Each starts with a visually hidden "Removed:" or "Added:" for screen readers that don't announce deletions and insertions. With the visible column headers, colour is never the only cue.

| Layer | Figma | Code |
|---|---|---|
| Frame | Vertical, gap 0; `radius/8`; `surface/neutral/faint`; 1px `stroke/subtle` inside | `<table>`, `rounded-8 bg-surface-neutral-faint inset-ring inset-ring-stroke-subtle`, fills its container |
| Header | Padding 10 (raw) / `space/16`, gap `space/16`; 1px `stroke/subtle` below | `<th>`s, `py-2 pl-4` (the last also `pr-4`), `border-b border-stroke-subtle` |
| Header labels | Field, Before, After: Body/sm-regular, `text/subtle` | Same, fixed text as in Figma |
| Row | Horizontal, centred; padding 10 (raw) / `space/16`, gap `space/16` | `<tr>`; cells `py-2 pl-4 align-middle`, the last also `pr-4` |
| Field | Fixed 200; Body/sm-semibold, `text/primary` | `w-1/4` of the table; `text-body-sm-semibold text-text-primary` |
| Before box | `accent/critical/tonal/surface/default`; 1px `accent/critical/outline/border/default` inside; `radius/6`; padding `space/6` / 10 (raw) | `<del>`: `bg-accent-critical-tonal-surface-default inset-ring-accent-critical-outline-border-default rounded-6 py-1.5 px-2` |
| Before value | Body/sm-regular, `accent/critical/tonal/content/default` | Same; `no-underline` clears the browser's strike-through |
| After box | `accent/success/tonal/surface/default`; 1px `accent/success/outline/border/default` inside; `radius/6`; padding `space/6` / 10 (raw) | `<ins>`: the success tokens, same shape |
| After value | Body/sm-regular, `accent/success/tonal/content/default` | Same; `no-underline` clears the browser's underline |

Contrast, Light / Dark:
- Header labels (`text/subtle` on `surface/neutral/faint`): 4.55 / 6.96
- Field: 19.28 / 17.85
- Before value on its box: 6.85 / 5.22
- After value on its box: 6.49 / 6.46

The boxes' 1px borders are decoration, not control borders. Against the panel they are 3.64 / 3.74 (critical) and 3.08 / 5.55 (success).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Field column | Fixed 200 of 960 | A quarter of the table: 240 at 960, with its 16px gap. GDL has no width scale | None needed, or set Field to a share of the width (the designer's call) |
| Top and bottom padding | Raw 10 in the header and the rows | 8 (`space/8`), around GDL's 20px line: header 37 tall (Figma 38), row 48 (Figma 51) | Bind to `space/8` (design question) |
| Value box sides | Raw 10 | 8 (`space/8`), as Button's raw 10 became | Bind to `space/8` (design question) |
| Width | Fixed 960 | Fills its container | Set the width to Fill |
| Header labels | Fixed text | Fixed text | None needed |
| Removed / added in text | Colour and column only | Also `<del>` / `<ins>`, each led by a visually hidden "Removed:" / "Added:" | None needed |

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing; nothing looks different, and code already uses these tokens):
- The frame's radius (raw 8) is bound to `radius/8`, and the value boxes' (raw 6) to `radius/6`.
- The header's and row's side padding and gap (raw 16) are bound to `space/16`, and the boxes' top and bottom padding (raw 6) to `space/6`.
- The raw 10s stay: GDL has no 10, so binding them would change the look (design question).

Figma gaps the code doesn't copy:
- **Frame 1 and Frame 2** (`453:12898`, `453:12902`) wrap each box in a vertical frame with a raw 10 gap and a single child. They are the `<td>`s; the gap does nothing.

### PaymentRow (30 Oct 2026)

Source: page **Modals** (`299:3301`), set `Modal / Payment Row` (`348:8298`): Status (Done `348:8278`, Upcoming `348:8288`), Date and Subtitle. It nests `Modal / Status Icon` (`348:8258`) and `Modal / Status Badge` (`348:8263`). Payment Schedules places five. Code: `src/components/payment-row/`. The Storybook grids check both statuses against every binding, in Light and Dark.

How the Figma properties map:
- Status → `status`: `done` (default) or `upcoming`.
- Date → `date`. Subtitle → `subtitle`.
- Status Icon and Status Badge are part of the row, not components of their own. Only Payment Row places them, in the library and on both Patterns pages.
- Tag has the same tonal pairs, but its look is larger (Label/sm-medium, 4 / 12 padding, an icon), so the badge isn't a Tag (see the design question below).
- The icon is decorative (`aria-hidden`): the badge says the status in text.

| Layer | Figma | Code |
|---|---|---|
| Frame | Horizontal, centred; padding 13 (raw), gap `space/12`; fixed 460×62 | `flex items-center p-3 gap-3`; fills its container, hugs its height (60) |
| Fill, edge | `surface/canvas`; 1px inside, `accent/success/outline/border/default` (Done) or `accent/warning/outline/border/default` (Upcoming); `radius/8` | `bg-surface-canvas inset-ring` + the status's border colour; `rounded-8` |
| Status Icon | 36×36 circle (`radius/full`), `accent/<success or warning>/tonal/surface/default` | `size-9 rounded-full`, same fill |
| Its glyph | 24px CheckCircle (Done) / Clock (Upcoming), `accent/<status>/tonal/content/default` (raw #31C48D / #FBBF24 until 30 Oct) | `check-circle` / `clock`, 24px, `accent/<status>/tonal/content/default` |
| Text Content | Vertical, gap 0, Fill | `flex-1 flex-col` |
| Date | Body/sm-regular, `text/primary` | Same |
| Subtitle | Caption/md-regular; `text/subtle` (Done), `accent/warning/tonal/content/default` (Upcoming) | Same, per status |
| Status Badge | Padding `space/2` / `space/8`, `radius/full`; `accent/<status>/tonal/surface/default`; "Done" / "Upcoming" in Caption/md-regular, `accent/<status>/tonal/content/default` | `px-2 py-0.5 rounded-full text-caption-md-regular`, same colours and labels |

Contrast, Light / Dark:
- Date on `surface/canvas`: 19.28 / 17.85
- Subtitle, Done (`text/subtle`): 4.55 / 6.96
- Subtitle, Upcoming (warning content on canvas): 4.71 / 13.46
- Badge, Done: 6.49 / 6.46. Badge, Upcoming: 4.59 / 6.53
- Icon glyph (needs 3:1), as code draws it: Done 6.49 / 6.46, Upcoming 4.59 / 6.53. Figma's raw glyphs before 30 Oct: Done 2.03 / 4.06, Upcoming **1.55** / 5.19
- The edge on `surface/canvas`: Done 3.08 / 5.55, Upcoming 4.71 / 6.08

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing; code already uses these bindings):
- **The Status Icon glyphs** were raw #31C48D (Done) and #FBBF24 (Upcoming): 2.03 and 1.55 on their circles in Light, below the 3:1 an icon needs. They are bound to `accent/success/tonal/content/default` and `accent/warning/tonal/content/default`, the pairing Tag uses on the same fills and the one Modal / Header Icon's glyph got on 29 Oct. The glyphs are darker in Light (6.49 and 4.59), and in Dark they are 6.46 and 6.53.
- **Payment Schedules' three Done rows** (`348:8325`, `348:8335`, `348:8345`) overrode the Status Icon's fill with raw #31C48D at 15%. The override is reset, so the circle takes the component's `accent/success/tonal/surface/default`, as the Upcoming rows do.
- The row's radius (raw 8) is bound to `radius/8` and its gap (raw 12) to `space/12`. The circles' and badges' radius (raw 9999) is bound to `radius/full`, and the badge's padding (raw 2 / 8) to `space/2` / `space/8`. Nothing looks different.
- The raw 13 padding stays: GDL has no 13, so binding it would change the look (design question).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Padding | Raw 13 (off GDL's scale) | 12 (`space/12`), as the gap | Bind to `space/12` (design question) |
| Height | Fixed 62 | Hugs: 60 (12 + the 36px icon + 12) | Set the height to Hug |
| Width | Fixed 460 (Fill in the modal) | Fills its container | Set the width to Fill |
| Badge height | 19, on Inter's auto line height | 20, on GDL's 16px Caption line | Bind the text style's line height to the ramp |

Figma gaps the code doesn't copy:
- **Both variants are pinned to Semantics Dark** (mode `1:2`), and so is every row Payment Schedules places. Code follows the page's theme. Clear the explicit modes.

### PaymentSchedules (30 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Payment Schedules` (`348:8311`), with no properties. Pattern 03's "View" action (Patterns – Admin) and pattern U04 (Patterns – User) open it from Recurring Costs. Code: `src/components/payment-schedules/`. It is built on Overlay and ModalHeader, as the Overlay stories had sketched it. The Storybook stories render it open in Light and Dark, and test Close, Escape and focus return, and a list long enough to scroll.

How it maps:
- The `Modal / Header` instance → ModalHeader. Its Title ("Payment Schedules") → `title`, its Description ("Upcoming and processed payments") → `description`, and its tile's glyph → `icon`. The defaults are Figma's.
- The Payment Row instances → `children`: one `<PaymentRow>` per payment. Code lists them in a `<ul>`, one `<li>` each.
- `open`, `onClose`, `dismissible`, `initialFocusRef` and `returnFocusRef` are Overlay's. The dialog is named by the title and described by the description.

| Layer | Figma | Code |
|---|---|---|
| Panel | Vertical, gap 0; `surface/base`; `radius/12`; clips content; no stroke, no effect | `flex flex-col overflow-hidden bg-surface-base rounded-12` |
| Width | Fixed 512 | `w-full max-w-lg` (512), narrower on a small screen |
| Header | `Modal / Header` (`348:8299`) | `ModalHeader` |
| Rows Container | Vertical; padding 0 / `space/24` / `space/24` / `space/24`, gap `space/8` | `px-6 pb-6`, a `<ul>` with `gap-2`; scrolls (and is a tab stop) when the rows are taller than the viewport |
| Rows | `Modal / Payment Row` ×5, Fill | `PaymentRow`s |

Contrast, Light / Dark on `surface/base`: Title 20.17 / 14.63, Description 4.76 / 5.71, Close glyph 10.35 / 11.87 (see ModalHeader). The rows are as PaymentRow.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Behaviour | A static frame | Overlay's portal, focus trap, Escape and backdrop click, inert page, scroll lock, focus return | None needed |
| Height | Hugs: 446 for five rows | Hugs, never taller than the viewport minus 16 on each side; the rows scroll | None needed |
| Rows container | A frame | A `<ul>` of `<li>`s | None needed |
| Edge and shadow | None | None, as Figma. On the scrim, `surface/base` is 1.18 (Light) and 1.06 (Dark) | Add Modal / Dialog's 1px `stroke/subtle` and Elevation 4? (design question) |

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing; nothing looks different, and code already uses these tokens):
- The panel's radius (raw 12) is bound to `radius/12`.
- The Rows Container's padding (raw 24) is bound to `space/24`, and its gap (raw 8) to `space/8`.
- The Done rows' Status Icon fill override is reset (see PaymentRow).

Figma gaps the code doesn't copy:
- **The modal is pinned to Semantics Dark** (mode `1:2`), and so are its rows. Code follows the page's theme. Clear the explicit modes.

### VersionBadge (30 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Version Badge` (`359:10826`), with Version. Modal / Changelog Header places it next to the date. Code: `src/components/version-badge/`. Version is `children`. The badge is plain text with no states.

**It isn't a Tag.** Tag Status=Info, which the Announcements table uses for its version column, has the `accent/info/tonal` fill and Label/sm-medium. The badge has a `surface/base` fill and Body/sm-semibold. Only the text colour is the same.

| Layer | Figma | Code |
|---|---|---|
| Badge | Horizontal, centred; padding `space/4` / `space/12`; `radius/full` | `py-1 px-3 rounded-full` |
| Fill | `surface/base` | `bg-surface-base` |
| Version | Body/sm-semibold, `accent/info/tonal/content/default` | `text-body-sm-semibold text-accent-info-tonal-content-default` |

Contrast, Light / Dark: the version text on its fill is 6.83 / 8.07. The pill against the dialog's `surface/canvas` is 1.05 / 1.22. It's decorative: the text carries the meaning.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing): the radius (raw 9999) is bound to `radius/full` and the padding (raw 4 / 12) to `space/4` and `space/12`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | 25, on Inter's auto line height | 28, on GDL's 20px Body/sm line height (with GDL's 0.4px tracking) | Bind the text style's line height and letter spacing to the ramp (library-wide, as on Tag) |

Figma gaps the code doesn't copy: none.

### BulletItem (30 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Bullet Item` (`359:10832`), with Text. Modal / Release Notes and Card / Changelog Entry both place it, so it's a component of its own. Code: `src/components/bullet-item/`. Text is `children`. It's an `<li>`, so put it in a `<ul>` (ReleaseNotes and ChangelogEntry render one). The dot is the list marker and is `aria-hidden`.

| Layer | Figma | Code |
|---|---|---|
| Item | Horizontal, centred, gap `space/8` | `<li>` `flex gap-2` |
| Bullet Dot | 6×6 ellipse, `accent/success/tonal/content/default` | `size-1.5 rounded-full bg-accent-success-tonal-content-default`, in a 20px box (`h-5`) |
| Text | Body/sm-regular, `text/primary` | `text-body-sm-regular text-text-primary` |

Contrast, Light / Dark, on `surface/canvas` (the dialog) or `surface/neutral/faint` (the card), which have the same values:
- Text: 19.28 / 17.85
- Dot: 6.82 / 12.74. It's decorative, because the list says "bullet".

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing): the gap (raw 8) is bound to `space/8`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Dot alignment | Centred on the item | Centred on the first line (a 20px box, Body/sm's line height). A one-line note looks the same, and a wrapped note keeps its dot at the top | None needed, or top-align the dot |
| Width | Hugs its text | Fills the list and wraps | None needed |
| Element | n/a | `<li>`, with the dot hidden from assistive tech | None needed |

Figma gaps the code doesn't copy: none.

### ReleaseNotes (30 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Release Notes` (`359:10845`), with Section Title. Modal / Changelog places it. Code: `src/components/release-notes/`. Section Title is `sectionTitle`, which defaults to Figma's "What's new in this release:". The `Modal / Bullet Item` instances are `children` (BulletItems) in a `<ul>`. The section title names the list (`aria-labelledby`). It isn't a heading, because its style is Body and the dialog's title is already the heading.

| Layer | Figma | Code |
|---|---|---|
| Group | Vertical, gap `space/12`, one stack of title and items | `flex-col gap-3`, a `<p>` over a `<ul>` that is also `gap-3`, so the spacing is the same |
| Section Title | Body/sm-semibold, `text/primary` | `<p>` `text-body-sm-semibold text-text-primary` |
| Items | `Modal / Bullet Item` | `children`: `BulletItem`s |

Contrast, Light / Dark, on `surface/canvas`: section title 19.28 / 17.85. For the items, see BulletItem.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing): the gap (raw 12) is bound to `space/12`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Hugs | Fills its container | None needed |
| Semantics | n/a | The title names the `<ul>` | None needed |

Figma gaps the code doesn't copy: none.

### ChangelogHeader (30 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Changelog Header` (`359:10835`), with Title and Date. It nests `Modal / Changelog Icon` (`359:10822`) and `Modal / Version Badge`. Modal / Changelog places it. Code: `src/components/changelog-header/`.

How the Figma properties map:
- Title → `title`, an `<h2>`. Pass `titleId` and point the dialog's `aria-labelledby` at it.
- Date → `date`.
- The nested Version Badge's Version → `version`. Without it, no badge renders.

**Changelog Icon** appears only here, so it's drawn inline and isn't a component of its own. It's decorative (`aria-hidden`).

| Layer | Figma | Code |
|---|---|---|
| Header | Vertical, gap `space/16`, hugs 186 | `flex-col gap-4`, fills its container |
| Changelog Icon | 48×48 frame, Phosphor RocketLaunch 48px, `accent/red/medium` | `<Icon name="rocket-launch" size={48}>` `text-accent-red-medium`, `aria-hidden` |
| Title | Title/md-bold, `text/primary`, Fill, wraps | `<h2>` `text-title-md-bold text-text-primary` |
| Metadata Row | Horizontal, centred, gap `space/12` | `flex items-center gap-3`, wrapping |
| Date | Body/sm-regular, `text/subtle` | `<p>` `text-body-sm-regular text-text-subtle` |
| Version | `Modal / Version Badge` | `VersionBadge` |

Contrast, Light / Dark, on `surface/canvas`:
- Title: 19.28 / 17.85
- Date: 4.55 / 6.96
- Version: see VersionBadge
- Rocket: 2.76 / 4.69. It's below 3:1 in Light, a design question. The rocket is decorative, so axe and WCAG 1.4.11 don't require 3:1.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing): the header's gap (raw 16) is bound to `space/16` and the Metadata Row's (raw 12) to `space/12`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Hugs (186) | Fills its container, as the dialog's instance does | None needed |
| Metadata Row | Never wraps | Wraps on a narrow width | None needed |
| Date and version | Always shown | Each renders only when given | None needed |
| Title height | Inter's auto line height | GDL's 28px Title/md line height | Bind the text style's line height to the ramp |
| Element | n/a | A `<div>`, because a `<header>` could become a second banner landmark | None needed |

Figma gaps the code doesn't copy:
- **Modal / Changelog Icon pins the Semantics collection to Dark.** Code follows the page's theme. Clear the explicit mode. Not changed on 30 Oct: clearing it changes what the library shows, so it's the designer's call.

### ChangelogEntry (30 Oct 2026)

Source: page **Cards** (`311:2719`), component `Card / Changelog Entry` (`464:12396`), with Title, Meta and Show New. It nests `Tag` Status=Info and `Modal / Bullet Item`. Patterns 14 and U07 list one per release on the Changelog page. Code: `src/components/changelog-entry/`.

How the Figma properties map:
- Title → `title`, an `<h2>`. `headingLevel` moves it without changing the look.
- Meta → `meta` ("Version 2.5.6 • August 10, 2026").
- Show New → `showNew`. It defaults to true, as in Figma. The Changelog sets it only on the latest release.
- The Bullet Items → `children`.

It's an `<article>` named by its title. It has no states.

| Layer | Figma | Code |
|---|---|---|
| Card | `surface/neutral/faint`, 1px inside `stroke/subtle` (strokes included in layout), `radius/8`, fixed 640 | `bg-surface-neutral-faint border border-stroke-subtle rounded-8 overflow-hidden`, fills its container |
| Header | Padding `space/16` / `space/20`, Space Between, top-aligned; 1px `stroke/subtle` below | `py-4 px-5 justify-between items-start gap-4 border-b border-stroke-subtle` |
| Title Group | Vertical, gap `space/2` | `gap-0.5` |
| Title | Body/md-semibold, `text/primary` | `<h2>` `text-body-md-semibold text-text-primary` |
| Meta | Caption/md-regular, `text/subtle` | `<p>` `text-caption-md-regular text-text-subtle` |
| New Badge | `Tag` Status=Info, Show Icon off, "New" | `<Tag status="info" showIcon={false}>New</Tag>` |
| Notes | Vertical, padding `space/16` / `space/20`, gap `space/6` | `<ul>` `py-4 px-5 gap-1.5` |
| Bullet | `Modal / Bullet Item` | `BulletItem` |

Contrast, Light / Dark, on `surface/neutral/faint`:
- Title and notes: 19.28 / 17.85
- Meta: 4.55 / 6.96
- New: 5.60 / 5.72 (as Tag Info)
- Dots: 6.82 / 12.74

The `stroke/subtle` outline and divider (1.18 / 1.72) are decorative card edges, not control borders. In Light the card's fill equals the canvas.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing): the card's radius (raw 8) is bound to `radius/8`, the Header's and Notes' padding (raw 16 / 20) to `space/16` and `space/20`, the Title Group's gap (raw 2) to `space/2` and the Notes' gap (raw 6) to `space/6`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 640 | Fills its container | Set the width to Fill |
| Header gap | 0 (Space Between) | 16 between the title group and the New tag, so a long title never touches it | Set the gap to `space/16` |
| Height | Inter's auto line heights (header 69) | GDL's line heights (header 75) | Bind the text styles' line heights to the ramp |
| Semantics | n/a | An `<article>` named by its `<h2>` title; the notes are a `<ul>` | None needed |

Figma gaps the code doesn't copy: none. The component pins no mode. The Cards page shows it in Dark.

### ChangelogModal (30 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Changelog` (`391:174`). It has no properties of its own and nests `Modal / Changelog Header`, `Modal / Release Notes` and two `Button / Normal`s. Patterns 14 and U07 open it once after sign-in. Code: `src/components/changelog-modal/`, built on `Overlay`, like ModalConfirm.

How Figma maps:
- The header's Title, Date and Version → `title`, `date` and `version`. The title names the dialog.
- The release notes' Section Title → `sectionTitle`. The bullets → `children`.
- View Change Log (Default) → `onViewChangeLog`.
- Got It (Outlined) → `onClose`.

Figma has no close button. Got It, Escape and a backdrop click all call `onClose`. The owner sets `open` and records that the release was seen.

| Layer | Figma | Code |
|---|---|---|
| Panel | Vertical, padding `space/32`, gap `space/24`; `radius/16`; `surface/canvas`; Effects/Elevation Dark/2; no stroke; fixed 500 | `p-8 gap-6 rounded-16 bg-surface-canvas shadow-elevation-2`, `max-w-lg` (512), narrower on a small screen; scrolls if taller than the viewport |
| Header | `Modal / Changelog Header`, Fill; the Date is overridden to `text/secondary` | `ChangelogHeader`; the date is passed in `text-text-secondary` (copies the override) |
| Release Notes | `Modal / Release Notes`, Fill | `ReleaseNotes` |
| Modal Actions | Horizontal, gap `space/16`; two Fill buttons | `grid gap-4 @sm:grid-cols-2`: two equal columns, stacked when the panel is under 384 inside |
| View Change Log | `Button / Normal`, Style=Default | `<Button>`, calls `onViewChangeLog` |
| Got It | `Button / Normal`, Style=Outlined | `<Button variant="outlined">`, calls `onClose` |
| Scrim | the "Overlay" frame on the pattern pages | `Overlay`, `surface/overlay` |

Contrast, Light / Dark, on `surface/canvas`:
- Title and notes: 19.28 / 17.85
- Date (`text/secondary`): 9.90 / 14.48
- Version: 6.83 / 8.07
- View Change Log label on its fill: 6.81 / 4.77
- Got It label: 6.51 / 14.91
- Got It border: 6.51 / 4.63
- Rocket: 2.76 / 4.69 (decorative; design question)

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing): the panel's padding (raw 32), gap (raw 24) and radius (raw 16) are bound to `space/32`, `space/24` and `radius/16`, and the Modal Actions' gap (raw 16) to `space/16`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 500 | Capped at 512 (`max-w-lg`, the nearest container width; GDL has no width scale) | Resize to 512, or bind to a width scale |
| Elevation | Effects/Elevation Dark/2 | `shadow-elevation-2`. Tailwind compiles it to GDL's Light Elevation 2 in both themes (as on ModalDialog) | None in Figma |
| Actions on a phone | Always side by side | Stacked under 384 inside the panel (a container query), so "View Change Log" isn't cut | None needed, or add a narrow variant |
| Button height | 35, on Inter | 36 (GDL's Button) | As Button |
| Close | No close button | Got It, Escape and a backdrop click call `onClose`; focus moves into the dialog, is trapped there and returns to the opener | None needed |
| Height | Hugs | Never taller than the viewport minus 16 on each side; the panel scrolls | None needed |

Figma gaps the code doesn't copy:
- **Modal / Changelog pins the Semantics collection to Dark** (as does its Changelog Icon, and its instances on the pattern pages). Code follows the page's theme. Clear the explicit mode. Not changed on 30 Oct: clearing it changes what the library and the patterns show, so it's the designer's call.
### Logo (30 Oct 2026)

Source: page **Navigation** (`3:368`), component `Navigation / Logo`
(`4:238`, under Atoms). Figma gives it no properties and only one version.
Header – Admin, Header – User and Top Bar place it at 123 × 48. The Mobile
Header and Mobile Menu scale it to 92 × 36.

Code: `src/components/logo/`, an inline `<svg role="img">` named "CAF".
Pass another `aria-label` to rename it, or `aria-hidden` to hide it.
- The four Logo Mark vectors become four `<path>`s, using the vectors'
  own geometry from Figma's SVG export.
- The Wordmark ("Caf" set in upper case, Work Sans Medium 40, no text
  style) becomes one `<path>`, Figma's outline of the text. It needs no
  Work Sans font, and its fill is a token.
- Size: `h-12` (48) by default, with the width following the viewBox
  (123). The Mobile Header's 92 × 36 is `className="h-9"`.

| Part | Figma fill | Code |
|---|---|---|
| Logo Mark / Part 1 | raw #302C98 | `caf-blue/600` (#352C96) |
| Logo Mark / Part 2 | raw #9795CB | `caf-blue/300` (#9B96CF) |
| Logo Mark / Part 3 | raw #6361B2 | `caf-blue/400` (#6B63C5) |
| Logo Mark / Part 4 | raw #302C98 | `caf-blue/600` (#352C96) |
| Wordmark | `text/primary` | `text/primary` |

The mark uses the brand ramp itself, not a semantic token. No semantic
token matches a raw fill exactly. The ramp, like Figma's raw fills, stays
the same in Light and Dark, while the wordmark follows the theme. The
Storybook grids check each part's fill and both sizes, in Light and Dark.

Contrast: a logo is exempt from WCAG 1.4.3 and 1.4.11, but here are the
figures. The wordmark is 19.28 (Light) / 17.85 (Dark) on the canvas. On
the canvas the mark is:

| Part | Light | Dark |
|---|---|---|
| `caf-blue/600` | 10.28 | 1.66 |
| `caf-blue/400` | 4.76 | 3.58 |
| `caf-blue/300` | 2.62 | 6.51 |

In Figma's Dark header, the raw #302C98 is 1.86:1 on `surface/neutral/base`
(#020617; 1.83 on the raw #04091B the header had until 30 Oct).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Mark colours | Raw #302C98, #9795CB, #6361B2 | The nearest `caf-blue` steps: 600, 300, 400 | Move the artwork onto the ramp, or add logo primitives (design question) |
| Wordmark | Live text, Work Sans Medium 40 | Figma's outline of the text as a path | Outline the wordmark (flatten it to a vector) so the library doesn't depend on Work Sans |
| Name | None | `role="img"`, `aria-label="CAF"` | None needed |
| Clip | The Logo Mark frame clips at 30 × 48 | No clip: nothing reaches outside it | None needed |

Figma gaps the code doesn't copy:

- **No Dark version.** The Dark headers place the Light mark unchanged
  (see the contrast above). Code does the same and waits on the design
  question.

### NavLink (30 Oct 2026)

Source: page **Navigation** (`3:368`), two sets with the same State
property:
- `Navigation / Nav Link` (`446:11508`): State (Default, Active, Hover)
  with a Label. These are the header Nav Bar's links.
- `Navigation / Nav Link – Vertical` (`462:807`): State (Default, Hover,
  Active) with a Label. These are the Mobile Menu's full-width rows.

Code: `src/components/nav-link/`, one component with an `orientation`
prop (`horizontal`, the default, or `vertical`), not a separate
NavLinkVertical. Both sets are a label in a padded box with radius 6 and
the same three states. They differ only in type, padding and colours, so
they are compound variants of one `<a>`.
- State=Active is `active`, the current page. It sets
  `aria-current="page"`.
- State=Hover is `:hover`. An Active link has no hover look, because
  Figma has no Active + Hover state.
- The Label is `children`.
- It is an `<a href>`. A router link goes in `as`
  (`<NavLink as={RouterLink} to="/costs">`), which receives the classes,
  `aria-current` and every other prop.

| Orientation | State | Fill | Label |
|---|---|---|---|
| horizontal | Default | none | `text/primary` |
| horizontal | Hover | `neutral/tonal/surface/default` | `text/primary` |
| horizontal | Active | `neutral/tonal/surface/default` | `text/primary` |
| vertical | Default | none | `text/secondary` |
| vertical | Hover | `surface/neutral/faint` | `text/primary` |
| vertical | Active | `surface/base` | `text/primary` |

Horizontal links are Body/sm-regular with 8 / 12 padding and radius 6, at
36 high. Vertical links are Body/md-medium with 8 / 12 padding and radius
6, at 40 high, and fill their container's width. The Storybook grids force
Hover and Focus with pseudo-states and check, per state, the fill, label
colour, `aria-current`, type, height, padding, radius and focus ring, in
Light and Dark.

Contrast: every label passes AA, as does the focus ring.

| Pair | Light | Dark |
|---|---|---|
| Horizontal Default, `text/primary` on the canvas / `surface/base` | 19.28 / 20.17 | 17.85 / 14.63 |
| Horizontal Hover and Active, `text/primary` on `neutral/tonal/surface/default` | 16.36 | 7.58 |
| Vertical Default, `text/secondary` on the menu's `surface/neutral/base` | 10.35 | 16.36 |
| Vertical Hover, `text/primary` on `surface/neutral/faint` | 19.28 | 17.85 |
| Vertical Active, `text/primary` on `surface/base` | 20.17 | 14.63 |
| Focus ring, `stroke/focused` on the canvas / the menu | 6.51 / 6.81 | 6.51 / 7.36 |

The Active marker itself, the fill against what surrounds it, is below
3:1: 1.18 / 2.36 on the horizontal links (on the canvas) and 1.00 / 1.38
on the vertical ones (on `surface/neutral/base`). `aria-current` tells
assistive tech which link is current. Both are open design questions.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Nav Link** (`446:11508`, all three variants): the radius is bound to
  `radius/6`, the top and bottom padding to `space/8` and the side padding
  to `space/12`. They were raw 6, 8 and 12, so nothing looks different.
- **Nav Link – Vertical** (`462:807`, all three variants): the radius is
  bound to `radius/6` and the side padding to `space/12` (raw 6 and 12).
  The raw 10 top and bottom padding is unchanged: `space/8` would make the
  row 37 high instead of 39, so that's a design question.
- **The headers use State=Active.** In all ten Header – Admin and five
  Header – User variants, the current page's link was a State=Default
  instance with its fill overridden to `neutral/tonal/surface/default`. It
  is now State=Active with no fill override, so the header's Page property
  sets the link's State, as code's `active` does. Labels and layer names
  are kept, and nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Padding (vertical) | Raw 10 top and bottom (the sides are `space/12`) | `space/8` / `space/12` (10 is off GDL's scale) | Change to `space/8` (design question: the row becomes 37 high) |
| Height | 33 (horizontal), 39 (vertical): Figma's labels are 17 and 19 high | 36 and 40, from GDL's 20px Body/sm and 24px Body/md line heights | Bind the text styles to the ramp |
| Letter spacing | 0 | GDL's ramp (0.4px on Body/sm), so "Recurring Costs" is 136px (Figma 130) | Bind the text styles to the ramp |
| Focus | No Focus state | 2px `stroke/focused` outline, 2px offset, as on Button | Add a Focus state |
| Active + Hover | Not drawn | Active keeps its look on hover | None needed |
| Name | Two component sets | One NavLink with `orientation` | None needed |

Figma gaps the code doesn't copy:

- **Nav Link – Vertical's section is pinned to Semantics Dark** ("Account,
  Theme & Mobile"), so the library page shows it only in Dark, and the
  Light bindings were never seen (see the design question). Clear the
  explicit mode.

### NavBar (30 Oct 2026)

Source: page **Navigation** (`3:368`), component `Navigation / Nav Bar`
(`4:248`, under Molecules), described as a "Row of Nav Link items for the
user app". It holds five Nav Links: Costs, Create Cost, Bulk Upload,
Recurring Costs, Drafts. The placements come from `Navigation / Header –
User` (`420:1040`, Page ×5), which places a Nav Bar instance, and from
`Navigation / Header – Admin` (`403:3950`, Page ×10), which draws its ten
links (Costs, Bulk Upload, Cost Centers, Partners, Contacts, Users,
Recurring Costs, Announcements, Exports, Drafts) in a "Navigation Bar"
frame laid out the same way.

Code: `src/components/nav-bar/`.
- The frame is a `<nav>` landmark with a `<ul>`, and each NavLink child
  sits in its own `<li>`, fragments included.
- `aria-label` is required, so that several `<nav>`s on one page have
  distinct names.
- The headers' Page property is the one `active` NavLink. Tab moves
  through the links in document order.

| Part | Binding |
|---|---|
| Bar | No fill. Horizontal, `space/8` / 0 padding, gap 0, hugging its links |
| Links | NavLink, horizontal (see above) |

The Storybook stories run three checks:
- **Pages grid:** all fifteen Page variants in Light and Dark. Each one
  checks the 8 / 0 padding, the links sitting side by side with no gap,
  and that only the Page's link is Active (`aria-current`, the
  `neutral/tonal/surface/default` fill).
- **User story:** tabs through the links in order, then follows one with
  Enter.
- **Admin story:** moves the current page with a click.

Contrast: as in NavLink. The bar has no fill of its own. In Figma's Dark
header it sits on the Navigation Area's `surface/base` (#1E293B in Dark;
raw #212737 until 30 Oct).

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Padding:** the top and bottom padding of `Navigation / Nav Bar` and of
  the ten "Navigation Bar" frames Header – Admin draws is bound to
  `space/8`. It was raw 8, so nothing looks different. Header – User's Nav
  Bar instances follow.
- **Current page:** every header's current link is now State=Active (see
  NavLink).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Size | 466 × 49 (User), 909 × 49 (Admin) | 481 × 52 and 938 × 52, from GDL's line height and letter spacing on the links | Bind the text styles to the ramp |
| Semantics | A frame of instances | `<nav aria-label>` › `<ul>` › `<li>` › `<a>` | None needed |
| Focus | None | Each link's focus ring (see NavLink) | Add a Focus state to Nav Link |

Figma gaps the code doesn't copy:

- **Header – Admin and Header – User are pinned to Semantics Dark.**
  NavBar has no fill and takes its theme from the page. Clear the explicit
  mode (Header's own entry). Their fills are bound since 30 Oct (see
  AppHeader).
- **Header – Admin doesn't use Nav Bar.** It draws its own "Navigation
  Bar" frame, because a Nav Bar instance can't hold ten links. Code uses
  one NavBar for both.

### UserGreeting (30 Oct 2026)

Source: page **Navigation** (`3:368`), `Navigation / User Greeting` (`4:245`): one text layer with a Username text property (default "Hi, QA Test"). Its description is the template: "Hi, {name}" greeting shown in the top bar. Code: `src/components/user-greeting/`. It is a `<p>` that writes "Hi, {username}". `username` is the name alone, and the component adds "Hi, ", so every screen greets the same way. The stories check its colour, type style and single line in Light and Dark, with a short and a long name.

| Layer | Figma | Code |
|---|---|---|
| Text | `text/secondary`, Body/sm-regular (size, weight and family bound) | `text-text-secondary text-body-sm-regular` |
| Layout | Vertical auto layout, Hug × Hug, centred | `shrink-0 whitespace-nowrap`: one line, as wide as its text |
| Username | Text property holding the whole greeting, "Hi, QA Test" | `username` ("QA Test"); "Hi, " is fixed |

Contrast (4.5:1):

| Pair | Light | Dark |
|---|---|---|
| `text/secondary` on `surface/canvas` | 9.90 | 14.48 |
| `text/secondary` on `surface/base` | 10.35 | 11.87 |

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Line height | Auto (Inter): 17px | Body/sm's 20px | Use the ramp's line height |
| Letter spacing | 0 | GDL's ramp, 0.4px | Bind the text style to the ramp |
| Username | The property holds the whole greeting | `username` is the name; "Hi, " comes from the description's template | Optional: a fixed "Hi, " plus a Username property holding the name |

Figma gaps the code doesn't copy: none. No modes are pinned.

### ThemeToggle (30 Oct 2026)

Source: page **Navigation** (`3:368`), set `Navigation / Theme Toggle` (`462:792`): Theme (Dark, Light). Its description: "Theme=Dark shows the moon (click → light), Theme=Light shows the sun." Patterns **15 · App shell & navigation** (`530:7799`) and **U08** (`545:26643`) put it between the greeting and the account icon. It "switches between dark and light right away and remembers the choice", and since it's icon-only it gets a tooltip. Code: `src/components/theme-toggle/`.
- Theme → `theme`, the theme in use. Dark shows the moon and Light the sun. A click asks for the other one.
- It is controlled. `onThemeChange` gets the theme the user asked for, and the app switches CAF's theme (`.dark` on `<html>`, as the Storybook toolbar does) and stores the choice. The toggle never changes the document itself.
- It is IconButton size 40 (Button / Icon, whose description names it for the theme button), with Figma's `text/primary` glyph instead of Ghost's `text/secondary`.
- Its accessible name says what a click does: "Switch to light theme" in Dark, "Switch to dark theme" in Light (`THEME_TOGGLE_LABELS`). Pass `aria-label` to translate it. UserActions adds the tooltip.

The grids check each variant's glyph, glyph colour, fill at rest and on Hover, size, radius and name in Light and Dark. The Controlled story tests pointer, Enter and Space, and checks that the document's theme is untouched. The Focus story checks the ring.

| Layer | Figma | Code |
|---|---|---|
| Frame | 40×40, `radius/8`, no fill, no stroke | IconButton size 40: `size-10 rounded-8` |
| Glyph | Moon (Dark) / Sun (Light), Phosphor Regular 20px, fill `text/primary` | `moon` / `sun`, 20px, `text-text-primary` |
| Hover | None | Button / Icon Ghost's `neutral/tonal/surface/default` fill |
| Focus | None | 2px `stroke/focused` outline, 2px offset |

Contrast (the glyph and the ring are graphics, 3:1):

| Pair | Light | Dark |
|---|---|---|
| Glyph `text/primary` on `surface/canvas` | 19.28 | 17.85 |
| Glyph on `surface/base` | 20.17 | 14.63 |
| Glyph on the hover fill `neutral/tonal/surface/default` | 16.36 | 7.58 |
| Focus ring `stroke/focused` on `surface/canvas` | 6.51 | 6.51 |
| Focus ring on `surface/base` | 6.81 | 5.33 |

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs
publishing): the radius of both variants is bound to `radius/8`. It was
raw 8, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Hover | No Hover state | Button / Icon Ghost's `neutral/tonal/surface/default` fill | Add a Hover, or confirm Ghost's (design question) |
| Focus | No Focus state | 2px `stroke/focused` outline, 2px offset, as on IconButton | Add a Focus state |
| Glyph colour | `text/primary` | Copied, over Button / Icon Ghost's `text/secondary` | None, unless the header moves to Ghost's colour (design question) |
| Name | None | "Switch to light theme" / "Switch to dark theme" | None needed |
| Behaviour | Pattern 15: switches right away and remembers | Controlled: reports the theme asked for; the app switches and stores it | None needed |

Figma gaps the code doesn't copy:
- **The frame holding the set on the Navigation page ("Account, Theme & Mobile") is pinned to Semantics Dark** (mode `1:2`), so the set previews in Dark, and its white glyphs vanish when the set is viewed alone. The component itself pins nothing. Clear the frame's explicit mode.

### AccountMenu (30 Oct 2026)

Source: page **Navigation** (`3:368`), `Navigation / Account Menu` (`462:793`), with no properties. Its rows are Item / Manage Currencies, Item / Settings, a Divider and Item / Logout (Menu / Item, all Type=Default). Pattern **15** (`530:7799`) draws it under the account icon at the top right. Pattern **U06** (`545:23189`) says what each row does: Manage Currencies opens a dialog, Settings is its own page, and Logout signs out. Code: `src/components/account-menu/`.
- It is a MenuDropdown with Figma's fixed rows. `onSelect` gets `'manage-currencies'`, `'settings'` or `'logout'`.
- The default trigger is the header's account icon. That is Navigation / Icon Button as IconButton size 40, with the `user` glyph in `text/primary`, named "Account", and that name also names the menu. `trigger` replaces it.
- The menu opens below the icon, flush with its right edge (`align="right"` by default).

Keyboard: as MenuDropdown, and the arrows skip the divider. The Keyboard story tests open (Enter, Space, ↓, ↑), the arrows, Home / End, Escape and Tab, and focus return. The Open stories check the panel, labels, Settings on Hover, the divider, the icon at rest and on Hover, the auto layout and the placement in Light and Dark.

| | Figma | Code |
|---|---|---|
| Surface | `surface/neutral/faint` fill, 1px inside `stroke/subtle`, `radius/8`, Effects/Elevation Dark/3, `space/6` padding | Popover's surface, through MenuDropdown |
| Layout | Vertical auto layout, `space/2` spacing, rows Fill | `flex flex-col gap-0.5`; rows `w-full` |
| Width | Fixed 220 | `min-w-64` (256), wider for a longer label |
| Items | Menu / Item ×3, Type=Default: `text/primary` Body/sm-regular, 8 / 12 padding, radius 6 | MenuItem ×3 (Logout is not `destructive`) |
| Divider | 1px rectangle filled `stroke/subtle`, Fill width | `<div role="separator">` with `border-t border-stroke-subtle` |
| Trigger | Navigation / Icon Button: 40×40, User 24px, the glyph `text/primary` (raw #0F172A until 30 Oct) | IconButton size 40, `user` 20px, `text-text-primary`, with Ghost's hover |
| Placement | Under the icon with no gap; its right edge 8px in from the icon's | `space/4` below, flush right (Popover's, as pattern 03) |

Contrast:
- Labels: as MenuItem, `text/primary` 19.28 / 17.85 at rest and 20.17 / 14.63 on Hover.
- Trigger glyph: as ThemeToggle, 19.28 / 17.85 on the canvas and 16.36 / 7.58 on its hover fill.
- Focus ring: 6.51 / 6.51.
- Divider: `stroke/subtle` on `surface/neutral/faint` is 1.18 (Light) and 1.72 (Dark). It separates groups; it is not a control boundary, so WCAG 1.4.11 doesn't apply.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, padding and item spacing** of `Navigation / Account Menu` are
  bound to `radius/8`, `space/6` and `space/2`, as Menu / Dropdown's were
  on 29 Oct. They were raw 8, 6 and 2, so nothing looks different.
- **The account glyph** in `Navigation / Icon Button` (`4:235`) is bound
  to `colors/text/primary`. The icon instance carried that binding on a
  hidden fill, while the visible User vector was raw #0F172A. In Light it
  moves to `text/primary`'s #020617, which looks the same; in Dark the
  glyph turns light, where it had nearly vanished on the Dark headers
  (1.11:1 on their #04091B). Its 84 placements follow.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 220, raw and off GDL's scale | At least 256 (`space/256`) | Set the width to 256 (design question) |
| Elevation | Effects/Elevation Dark/3 on a component that isn't pinned to Dark | `shadow-elevation-3`: GDL's Light Elevation 3 in both themes (see Popover) | Use Effects/Elevation Light/3 (not applied: a style change, as on Menu / Dropdown) |
| Trigger glyph | 24px | 20px (IconButton 40) | Swap in Button / Icon 40 (design question) |
| Placement | No gap, 8px in from the icon's right edge | `space/4` gap, flush right | None needed |
| Item height, letter spacing | As Menu / Item: 33px, 0 | As MenuItem: 36px, GDL's 0.4px | As MenuItem |
| Name | None | The trigger's "Account" names the button and the menu | None needed |

Figma gaps the code doesn't copy:
- **The frame holding it on the Navigation page ("Account, Theme & Mobile") is pinned to Semantics Dark** (mode `1:2`). The component itself pins nothing. Clear the frame's explicit mode.

### UserActions (30 Oct 2026)

Source: page **Navigation** (`3:368`), `Navigation / User Actions` (`4:259`), with no properties: Navigation / User Greeting, then two Navigation / Icon Button instances, both with the User glyph. It is a horizontal auto layout, centred, with a 0 gap. Its description is "Greeting + theme toggle + account icon buttons". Patterns **15** and **U08** say the same: "Hi, {name}", the theme toggle (give it a tooltip) and the account icon (pattern U06). Code: `src/components/user-actions/`.
- `username` goes to UserGreeting.
- `theme` and `onThemeChange` go to a ThemeToggle in a Tooltip that shows the toggle's name, below it (the header sits at the top of the page).
- `onAccountSelect` goes to AccountMenu, whose trigger is the account icon.
- It is a plain group, not a landmark: the header's `<header>` banner holds it.

The stories cover pointer and keyboard use (Tab order, the tooltip, the menu's arrows, Escape and focus return). States Light / Dark checks colours, Hover, glyphs, the 0 gap, centring and 40px height. Menu open Light / Dark checks the open account menu's surface and placement.

| | Figma | Code |
|---|---|---|
| Layout | Horizontal auto layout, centred, 0 gap, Hug | `flex items-center` |
| Greeting | Navigation / User Greeting | UserGreeting |
| First icon button | Navigation / Icon Button, User glyph | ThemeToggle, in a Tooltip (`placement="bottom"`) |
| Second icon button | Navigation / Icon Button, User glyph | AccountMenu's trigger, which opens Navigation / Account Menu |

Contrast: as its parts (UserGreeting, ThemeToggle, AccountMenu). The tooltip is as Tooltip.

**Changed in Figma on 30 Oct 2026** (the library needs publishing): both
icon buttons' glyphs follow Navigation / Icon Button's new `text/primary`
binding (see AccountMenu). The first button is still a User icon: swapping
it for Navigation / Theme Toggle changes what the component shows, so it
is a design question, not a binding fix.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| First icon button | A second User (account) icon | ThemeToggle, as the description and patterns 15 / U08 say | Swap instance `4:262` for Navigation / Theme Toggle (design question) |
| Tooltip | None in the component; patterns 15 and U08 ask for one | Tooltip with the toggle's name, below it | None needed (wording is a design question) |
| Glyphs | 24px, `text/primary` | 20px (IconButton 40), `text/primary` | See AccountMenu |
| Gap | 0 | 0, copied | None (design question) |

Figma gaps the code doesn't copy: none on the component. No modes are pinned. Pattern 15's Navigation / Header – Admin instance is pinned to Semantics Dark, which is the header's entry, not this one.

### TopBar (30 Oct 2026)

Source: page **Navigation** (`3:368`), component `Navigation / Top Bar` (`4:268`): "Logo on the left, user greeting and utility icon buttons on the right." It has no properties. Code: `src/components/top-bar/`.

How Figma maps:
- Navigation / Logo → Logo (123 × 48).
- Spacer (a 1px-high frame set to Fill) → `justify-between`.
- Navigation / User Actions → UserActions, with `username`, `theme`, `onThemeChange` and `onAccountSelect`.

| Layer | Figma | Code |
|---|---|---|
| Frame | Horizontal, no gap, centred; fixed 1536 wide (Fill inside the header), hugs 48 high | `flex items-center justify-between`, full width, 48 high |
| Logo | Navigation / Logo, 123 × 48 | `<Logo />` (`h-12`) |
| Spacer | Frame, Fill × 1 | `justify-between` |
| User Actions | Navigation / User Actions (greeting, theme toggle, account icon) | `<UserActions />` |

Contrast, Light / Dark (on `surface/neutral/base`, the Top Bar Area):
- Wordmark and glyphs (`text/primary`): 20.17 / 20.17
- Greeting (`text/secondary`): 10.35 / 16.36
- Glyphs on hover (`neutral/tonal/surface/default`): 16.36 / 7.58
- Focus ring (`stroke/focused`): 6.81 / 7.36

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 1536 | Fills its container; AppHeader puts it in the same centred container as the Nav Bar | None needed |
| Spacer | A Fill frame | `justify-between` | None needed |

Figma gaps the code doesn't copy: none of its own. The theme slot is UserActions' (see UserActions).

### AppHeader (30 Oct 2026)

Source: page **Navigation** (`3:368`):
- `Navigation / Header` (`4:286`): "top bar … plus the global navigation bar".
- `Navigation / Header – Admin` (`403:3950`): Page ×10, Costs … Drafts.
- `Navigation / Header – User` (`420:1040`): Page ×5, Costs, Create Cost, Bulk Upload, Recurring Costs, Drafts.

Patterns 15 (`530:7799`) and U08 (`545:26643`) place it, with `Navigation / Mobile Header` and `Navigation / Mobile Menu – Admin` below 768px. Code: `src/components/app-header/`. The link data and render types are in `links.tsx`.

How Figma maps:
- Header – Admin and Header – User differ only in their links → one component with `links` (label and `href`, in order). `APP_HEADER_ADMIN_PAGES` and `APP_HEADER_USER_PAGES` export Figma's Page values, in Figma's order and words.
- Page → `page`, the current link's label. Its NavLink is State=Active and gets `aria-current="page"`.
- The links are `<a href>`. `renderLink` swaps in a router's link: `({ href, ...props }) => <NavLink {...props} as={RouterLink} to={href} />`.
- Below 768px (`md:`), MobileHeader replaces the two rows. Its ☰ opens MobileMenu with the same `links` and `page`. Mobile Header's Menu Open → `menuOpen` / `defaultMenuOpen` / `onMenuOpenChange`. It is uncontrolled by default.
- The menu closes when a link is chosen, and when the screen widens past 768px.
- `navLabel` names the `<nav>` (default "Main").
- `username`, `theme`, `onThemeChange` and `onAccountSelect` go to TopBar and MobileHeader / MobileMenu. The theme is controlled; nothing here changes the document.

| Layer | Figma | Code |
|---|---|---|
| Frame | Vertical, no gap, fixed 1920, hugs 124; `surface/neutral/base` | `<header>` (the banner), `bg-surface-neutral-base` |
| Top Bar Area | Fixed 72 high, padding 0 / 192, centred; `surface/neutral/base` | `px-6 py-3` around the 48px TopBar (72), `bg-surface-neutral-base` |
| Navigation Area | Fixed 52 high, padding 0 / 192, left, centred; `surface/base` | `px-6 bg-surface-base`; the NavBar's 8 / 0 padding around 36px links makes the 52 |
| Content width | 1536, from the 192px sides of the 1920 frame | A centred `container` in each row: 1536 at 1920 and wider, as Figma; at each smaller breakpoint, that breakpoint's width, inside 24px gutters |
| Nav Bar | Header – User: a Navigation / Nav Bar instance. Header – Admin: a "Navigation Bar" frame laid out the same | NavBar with one NavLink per link |
| Below 768px | Navigation / Mobile Header + Mobile Menu – Admin | `md:hidden` MobileHeader; MobileMenu in a portal |

Contrast, Light / Dark:
- Top bar: as TopBar.
- Links (`text/primary` on `surface/base`): 20.17 / 14.63
- Active link (`text/primary` on `neutral/tonal/surface/default`): 16.36 / 7.58
- Focus ring on `surface/base`: 6.81 / 5.33

In Light, `surface/neutral/base` and `surface/base` are both white (1.00:1), so the two rows read as one band. In Dark they are two bands (1.38:1). This is listed as a design question.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Fills:** in all ten Header – Admin and five Header – User variants, the
  variant frame and its Top Bar Area are bound to
  `colors/surface/neutral/base`, and the Navigation Area to
  `colors/surface/base`, as on `Navigation / Header` (`4:286`). They were
  raw #04091B and #212737. The variants are pinned to Dark, so they now
  show Dark's #020617 and #1E293B, a slight shift; with the pin cleared
  they will follow Light too.
- **Page:** each variant's current link is State=Active instead of a fill
  override on State=Default (see NavLink). Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 1920, padding 0 / 192 (raw) | Full width; content in a centred `container` (1536 at ≥1536) inside `px-6` gutters | None needed. A page's content should use the same container so it lines up |
| Row heights | Fixed 72 and 52 (raw) | Padding around the content: `py-3` + 48 = 72, and NavBar's `py-2` + 36 = 52 | None needed |
| Between 768 and about 960px | Not drawn | The Navigation Area scrolls sideways when the admin's ten links don't fit | Design question: draw a tablet width, or move the switch to 1024 for the admin header |
| Below 768px | Separate components (Mobile Header, Mobile Menu – Admin) placed by hand on mobile screens | The same component switches at `md` (768px) | None needed |
| Two headers | Header – Admin and Header – User, each with a Page variant per link | One AppHeader, links as data | None needed |
| Mobile menu on a wide screen | n/a | Closes when the screen widens past 768px | None needed |

Figma gaps the code doesn't copy:
- **Header – Admin and Header – User are pinned to Semantics Dark** (`403:3950`, `420:1040`, and their instances on the patterns). The code follows the page's theme.

### MobileHeader (30 Oct 2026)

Source: page **Navigation** (`3:368`), set `Navigation / Mobile Header` (`462:850`): Menu Open=false (`462:808`) and Menu Open=true (`462:829`). Its description: "Header below 768px: logo, theme, account and a hamburger. Menu Open=true swaps the hamburger for a close icon." Code: `src/components/mobile-header/`.

How Figma maps:
- Menu Open → `menuOpen`.
- The menu button → IconButton size 40, `list` "Open menu" or `x` "Close menu". It is a disclosure: `aria-expanded` is `menuOpen`, and `aria-controls` comes from `menuId`. A click calls `onMenuOpenChange(!menuOpen)`.
- Theme → ThemeToggle (`theme`, `onThemeChange`) in a Tooltip with its name, as pattern 15 asks for the icon-only toggle.
- Account → AccountMenu, whose default trigger is the same 40 × 40 User icon (`onAccountSelect`).
- `menuButtonRef` lets MobileMenu focus ✕.

| Layer | Figma | Code |
|---|---|---|
| Variant | Fixed 375 wide, hugs 64; padding 12 / 16 (raw); Space Between, centred; `surface/neutral/base` | `flex items-center justify-between px-4 py-3 bg-surface-neutral-base`, full width, 64 high |
| Logo | Navigation / Logo at 92 × 36 | `<Logo className="h-9" />` |
| Actions | Horizontal, gap 8 (raw), centred | `flex items-center gap-2` |
| Theme | 40 × 40 frame; Moon 20, `text/primary` | ThemeToggle (IconButton 40, `text-text-primary`) in a Tooltip |
| Account | 40 × 40 frame; User 20, `text/primary` | AccountMenu's trigger (IconButton 40 `user`, `text-text-primary`) |
| Open Menu / Close Menu | 40 × 40 frame; List 24 / X 24, `text/primary` | IconButton 40 `list` / `x` (20px glyph), `text-text-primary` |
| Hover | None | IconButton Ghost's: `neutral/tonal/surface/default` fill |

Contrast, Light / Dark (on `surface/neutral/base`):
- Glyphs (`text/primary`): 20.17 / 20.17
- Glyphs on hover (on `neutral/tonal/surface/default`): 16.36 / 7.58
- Focus ring (`stroke/focused`): 6.81 / 7.36

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Theme | A plain 40 × 40 frame with a Moon icon in both variants | ThemeToggle: the glyph follows `theme`, and the button is named for what it does | Swap the Theme frame for a `Navigation / Theme Toggle` instance |
| Account | A plain 40 × 40 frame with a User icon | AccountMenu (`Navigation / Icon Button` + `Navigation / Account Menu`) | Swap the Account frame for a `Navigation / Icon Button` instance |
| Menu glyph | List / X at 24 | 20, IconButton 40's glyph | Design question: keep 24 (then Button / Icon needs a 24px option) or swap for `Button / Icon` Size=40 |
| Width | Fixed 375 | Full width | None needed |
| Padding and gap | Raw 12 / 16 and 8 | `space/12`, `space/16`, `space/8` | Bind to GDL's `space/*` |
| Hover, focus | None | IconButton's hover fill and `stroke/focused` ring | Add Hover and Focus to the frames (they come with the instance swaps) |
| Tooltip | None | The theme toggle's name, below it | None needed (pattern 15 asks for it) |
| Element | n/a | A `<div>`: AppHeader's `<header>` is the banner | None needed |

Figma gaps the code doesn't copy:
- **The "Account, Theme & Mobile" section (`511:1155`) is pinned to Semantics Dark,** and the mobile screens in patterns 15 and U08 are too. The code follows the page's theme.

### MobileMenu (30 Oct 2026)

Source: page **Navigation** (`3:368`), component `Navigation / Mobile Menu – Admin` (`462:851`): "Open mobile navigation for admins: header with close, the 10 admin links (one Active), and the account row. Swap link labels for the user app." Pattern 15 step 3 (`530:7793`) places it at the top of a 375 × 812 screen. U08 asks for a Mobile Menu – User that doesn't exist yet. Code: `src/components/mobile-menu/`.

How Figma maps:
- Mobile Header (Menu Open=true) → MobileHeader `menuOpen`, with ✕ asking `onClose`.
- Links → `links` and `page` (the Active link), as on AppHeader, rendered as NavLink `orientation="vertical"` (or by `renderLink`).
- Account Row → `username`.
- Its open state → `open`. It asks `onClose` on ✕, Escape, a tap on the scrim, or a chosen link (pattern 15: "Choosing a link or tapping ✕ closes it").

It is a modal dialog on Overlay (as SideSheet is): portal, `aria-modal`, named "Menu" (`aria-label`). Focus opens on ✕, where ☰ was, and Tab / Shift+Tab wrap inside. The page behind is inert and its scroll is locked. Escape closes an open account menu first. Focus returns to ☰.

| Layer | Figma | Code |
|---|---|---|
| Menu | Fixed 375, vertical, no gap; `surface/neutral/base`; Effects/Elevation Dark/3 | `w-full bg-surface-neutral-base shadow-elevation-3`, against the top of the screen; `max-h-full overflow-y-auto` |
| Mobile Header | Navigation / Mobile Header, Menu Open=true | `<MobileHeader menuOpen />` |
| Links | Vertical, padding 8 / 16, gap 2 (raw) | `<nav aria-label="Main">` > `<ul class="flex flex-col gap-0.5 px-4 py-2">` |
| Link | Navigation / Nav Link – Vertical, State Default / Active | NavLink `orientation="vertical"`, `active` for `page` |
| Account Row | Padding 12 / 16, gap 12 (raw); 1px `stroke/subtle` on top, inside | `flex gap-3 px-4 py-3 border-t border-stroke-subtle` |
| Account icon | User 20, `text/secondary` | `<Icon name="user" size={20} />` in `text-text-secondary` |
| Name | "Admin Account", Body/sm-medium, `text/secondary` | `username`, `text-body-sm-medium text-text-secondary` |

Contrast, Light / Dark (on `surface/neutral/base`):
- Links, Default (`text/secondary`): 10.35 / 16.36
- Link, Hover (`text/primary` on `surface/neutral/faint`): 19.28 / 17.85
- Link, Active (`text/primary` on `surface/base`): 20.17 / 14.63
- Account Row (`text/secondary`): 10.35 / 16.36
- Header: as MobileHeader

The Active link's `surface/base` fill on the menu's `surface/neutral/base` is 1.00:1 in Light (both white) and 1.38:1 in Dark. In Light the current page shows only through its `text/primary` label and `aria-current`. The `stroke/subtle` line (1.23 / 1.95) is a divider. Both are listed as design questions.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| What's behind | Pattern 15 draws the open menu alone, nothing behind it | Overlay's `surface/overlay` scrim over the inert page; a tap on it closes the menu | Design question: draw the Overlay frame behind the menu in pattern 15 step 3 |
| Width | Fixed 375 | The screen's full width | None needed |
| Height | Hugs (533) | Hugs, up to the screen's height; scrolls beyond that (a phone held sideways) | None needed |
| Elevation | Effects/Elevation Dark/3 | `shadow-elevation-3`. Tailwind compiles it to GDL's Light Elevation 3 in both themes, as on Popover | None in Figma |
| Padding and gap | Raw 8 / 16, 2, 12 / 16, 12 | `space/8`, `space/16`, `space/2`, `space/12` | Bind to GDL's `space/*` |
| User links | No Mobile Menu – User (U08: "add it next to Mobile Menu – Admin") | One MobileMenu; the links are data | Add Mobile Menu – User, or give Mobile Menu – Admin a links slot |
| Account Row | A row with no states | Text, as drawn; the account menu is the header's User icon | Design question: should the row open the Account Menu? |
| Behaviour | Static | Dialog, focus on ✕ and trapped, Escape / ✕ / scrim / a link closes it, focus back to ☰, page inert and still | None needed |

Figma gaps the code doesn't copy:
- **The "Account, Theme & Mobile" section (`511:1155`) is pinned to Semantics Dark,** like the mobile screens in pattern 15. The code follows the page's theme.

