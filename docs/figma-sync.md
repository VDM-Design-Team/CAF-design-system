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
| Radius | Bound to a remote `radius-4` variable whose value is 8px | `rounded-8` | Rebind to GDL `radius/8` |
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
| `Menu / Row Actions Button` (`405:551`, 56 on the screens) | Radius 6, 20px glyph in `text/primary`, no hover, **pinned to Dark** | `<IconButton icon="dots-three" label="Row actions" />` |
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

