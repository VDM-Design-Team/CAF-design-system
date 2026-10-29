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
| `Navigation / Icon Button` (`4:235`) | 40×40 with a 24px glyph whose colour isn't bound | `<IconButton size={40} …/>` (20px glyph) |
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
| Disabled | `surface/elevated secondary` | 1px `stroke/subtle` | `text/subtle` |

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

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke is below WCAG 1.4.11,** which wants 3:1 for a
  field's edge. `stroke/subtle` is 1.23:1 (Light) and 1.72:1 (Dark) on the
  fill, and 1.18 / 1.72 on the canvas. In Light the fill is white on a
  `#F8FAFC` page (1.05), so the stroke is the only edge. GDL's contract
  recommends `stroke.field` (as for Checkbox). Among the existing strokes,
  only `stroke/stronger` passes in both themes (7.58 / 12.02). axe doesn't
  check non-text contrast, so the story tests can't catch it.
- **Disabled looks the same as Default:** same fill, stroke and
  `text/subtle`. Pagination / Item's Disabled uses `text/disabled`.

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
| Disabled | `surface/elevated secondary` | 1px `stroke/subtle` | `text/subtle` | same |
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
| Semantics | None | `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded` from `open`. Select passes `aria-controls` | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke is below WCAG 1.4.11:** the same as TextInput
  (1.23 / 1.72).
- **Disabled looks the same as Default.**

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
