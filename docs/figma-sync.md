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

## Tokens added on 2 Nov 2026

`stroke/field` and `surface/track`, GDL's recommended `stroke.field` and
`surface.track`, are in the Semantics collection. Both alias GDL's slate 500
(Light) and slate 400 (Dark); GDL's reference `surface.track` (slate 200 /
800) is below 3:1, so the track uses the same steps as the field border.
Bound to: the five inputs' Default and Filled border, Filter / Field,
Radio Deselected, Checkbox's unchecked border, and Toggle's off track.

## CI guard

CI runs `npm run import:figma` and fails if `tokens/` changes. So `tokens/`
can only move together with the snapshot.

## Open Figma housekeeping (snapshot of 3 Nov 2026)

Fixed in Figma on 3 Nov 2026 (no value changed): Heading/md-bold and the
Title/sm-* styles bind GDL's `font/size/…`; the Label/md-* styles bind
`font/size/label-md`; Label/sm-bold binds `font/size/label-sm`;
Heading/lg-regular binds `font/family/inter`. `npm run import:figma` no
longer lists any of them.

Still open:

- `text.link.*` and `surface.overlay` are raw colours, not aliases. The
  contract check reports them as warnings. `surface.overlay` Dark is
  `#020617bf` since 3 Nov (GDL slate 950 at 75%, decision dark-modal-edge;
  it stays a CAF value, decision fc-modals-overlay-gdl).
- Caption/md-medium's 16px line height and 0.3px letter spacing are typed
  on the style, not bound: GDL's Figma has no line-height or
  letter-spacing variables yet (a GDL change). The other styles keep AUTO
  and 0%; code takes every metric from GDL.

## Components

Components are built straight from the CAF Design Library, never from an
intermediate export. Each one reads its variants, states and variable
bindings from the Figma component set. Where code has to depart from
Figma, the reason is listed below with the Figma change that would make the
two agree.

### Button (20 Oct 2026)

Source: page **Buttons** (`217:1679`), sets `Button / Big` (`252:3133`),
`Button / Normal` (`252:2890`) and `Button / Small` (`252:2649`), each Style ×
State (Default, Hover, Pressed, Disabled, Focus) × Show Icons. Code:
`src/components/button/`. Every colour binding is copied exactly. The
Storybook grids check every cell against them in Light and Dark: the fill,
the label and icon, Outlined's stroke, the hover lift and the focus ring.
axe checks every cell's contrast, Tonal included.

**Changed in Figma on 3 Nov 2026** (decisions button-rebind,
fc-buttons-tonal, fc-buttons-disabled, button-outlined-disabled-dark,
fc-buttons-default-disabled-dark and states-code-adds; the library is
published). Code follows:
- **Tonal's label passes AA.** It was `action/primary/surface/default`
  (Light Hover 3.98, Pressed 2.48; Dark 3.59 / 2.79 / 1.77). It is now
  `text/brand/strong` at rest and on hover and `text/brand/stronger` while
  pressed, on the same `surface/brand` faint / subtle / medium fills. The
  Storybook exception for it (`CONTRAST_TODO` and the "Tonal contrast"
  stories) is gone.
- **Destructive and Success labels** use their own
  `accent/critical/filled/content/*` and `accent/success/filled/content/*`
  in every state, not `action/primary/content/default`. Light is unchanged
  (white); Dark is #020617.
- **Disabled.** Default and Tonal: fill `neutral/tonal/surface/disabled`,
  label and icon `neutral/tonal/content/disabled` (Tonal's Disabled was
  the same as its Default; Default's Dark #D6D8EB box was louder than the
  enabled one). Outlined: border `neutral/outline/border/disabled`, label
  `neutral/outline/content/disabled`. Text: label
  `neutral/outline/content/disabled`. Destructive and Success keep their
  `*/surface/disabled` fills, with their own `*/content/disabled` labels.
- **Focus** is a State: the Default look plus a Focus Ring 4px outside the
  button, 2px `stroke/focused` (`stroke/2`), `radius/12`. Code's ring
  already drew it: a 2px outline at a 2px offset, whose outer edge follows
  the 8px radius out to 12. The "No Focus state" departure is gone.

Contrast of the label on its fill (AA 4.5):

| | Default | Hover | Pressed |
|---|---|---|---|
| Tonal, Light | 11.08 | 8.07 | 7.07 |
| Tonal, Dark | 8.07 | 6.28 | 5.46 |
| Destructive, Light | 4.77 | 6.42 | 8.36 |
| Destructive, Dark | 5.30 | 6.98 | 10.51 |
| Success, Light | 4.95 | 7.13 | 9.05 |
| Success, Dark | 6.27 | 9.10 | 11.34 |

Disabled is exempt (WCAG 1.4.3). Tonal and Default Disabled are 2.34
(Light) and 1.93 (Dark); Outlined and Text Disabled labels 2.45–2.56 /
3.07–3.75.

Code departs from Figma here. Fix these in Figma:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Hugs Inter's auto line height: Big 46 / 48 with icon, Normal 35 / 36, Small 33 | Fixed 48 / 36 / 32, on GDL's line heights | Fixed heights 48 / 36 / 32 |
| Icon gap | Big and Normal: raw 10px, unbound | 8px (`space/8`, as Small already uses) | Bind item spacing to `space/8` |
| Hover shadow (Default, Destructive, Tonal, Success) | Two raw drop shadows, `0 1 2` and `0 4 4` at 25% black | `shadow.elevation.2`, the closest GDL elevation (Figma's is darker) | Apply the Elevation 2 effect style |
| Radius | Bound to GDL's `radius/8`, which the file shows under its old name `radius-4` (see TableExpandButton) | `rounded-8` | None: take GDL's library update in the CAF library |

Also in Figma: Text / Hover keeps a zero-width raw-blue stroke, which is
invisible and has no effect on code. The label's letter spacing is 0 in
Figma; the GDL ramp gives Label/md-semibold 0.1px.

Not in Figma: a Label text property on the three sets. The label sits
inside a nested GDL base button, so it is a GDL task (decision
fc-buttons-gdl-label). In code the label is `children` either way.

`Button / Icon` (`461:1151`) is IconButton and `Button / Menu Trigger`
(`461:1459`) is MenuTriggerButton: see their sections.

### Checkbox (21 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Checkbox`
(`253:248`): State (Deselected, Hover, Focus, Selected, Mixed-State,
Disabled, Disabled Selected) × Size (16px, 20px). Code:
`src/components/checkbox/`. Every colour binding is copied exactly. The
Storybook grids check each state's radius, fill, border, glyph and glyph
colour, and the focus ring, in Light and Dark.

| State | Fill | Border (1px) | Glyph |
|---|---|---|---|
| Deselected | `surface/base` | `stroke/field` | none |
| Hover | `surface/base` | `stroke/stronger` | none |
| Focus | as Deselected, plus a 2px `stroke/focused` ring 2px outside (`radius/8`) | | |
| Selected, Mixed-State | `action/primary/surface/default` | none | check / bar, `action/primary/content/default` |
| Disabled | `neutral/tonal/surface/disabled` | `neutral/outline/border/disabled` | none |
| Disabled Selected | `surface/brand/medium` | none | check, `action/primary/content/disabled` |

Every state is `radius/4`.

**Changed in Figma on 3 Nov 2026** (decisions fc-buttons-checkbox-radius,
fc-buttons-checkbox-states, fc-buttons-disabled, states-code-adds,
review Tokens open 1 and 3, fc-buttons-checkbox-pin; published). Code
follows:
- **One radius**, `radius/4`, in every state. It was 2 unchecked and 4
  checked; code drew the same (`rounded-2`, `checked:rounded-4`).
- **Hover's border is `stroke/stronger`** (7.58 Light / 9.85 Dark on
  `surface/base`). It was `stroke/strong` (2.56 / 3.07), lighter than the
  resting `stroke/field`.
- **A checked box has no border.** Selected and Mixed-State had a 1px
  edge around the blue fill. Code's border is transparent while checked.
- **Focus, Disabled and Disabled Selected** are States. Focus is code's
  ring (a 2px outline at a 2px offset reaches the same 4px out and radius
  8). Disabled uses the neutral disabled pair (Text Input's Disabled in
  Figma); Disabled Selected `surface/brand/medium` with a white
  `action/primary/content/disabled` check, not
  `action/primary/surface/disabled`, which is #D6D8EB in Dark and louder
  than enabled. Code dropped its "only the cursor changes" disabled.
- **The set's Light pin is cleared** and its white background removed, so
  the masters follow their Dark section. Instances were not pinned.

Contrast: the checked fill is 6.81 (Light) / 3.80 (Dark) on `surface/base`;
the resting border (`stroke/field`) 4.76 / 5.71; the focus ring 6.81 / 5.33.
Disabled is exempt (border 1.48 / 1.93).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Selected artwork | Exports as one flattened SVG with the Light colours baked in | The box is drawn with the bound tokens. The check and the mixed bar are Figma's vectors (same path, 1.5 / 2px stroke, round caps and joins), drawn in the box's own coordinates | None needed |
| Disabled Mixed-State | Not drawn (decision fc-buttons-checkbox-states) | As Disabled Selected, with the bar | None needed |
| Invalid | No Error state; Form / Checkbox Field's State=Error overrides the box's border to `accent/critical/outline/border/default` | `aria-invalid` on an unchecked, enabled box draws that border (3.81 / 3.07 on `surface/base`), so CheckboxField's `error` shows it | Add it to the set if a lone checkbox needs it |

Figma gaps the code copies exactly: Hover is defined only for Deselected,
so a checked box doesn't change on hover.

### TableCell (22 Oct 2026)

Source: page **Table** (`3:1823`), set `Table / Cell` (`460:900`), the
generic body cell, Type × its text properties. Code:
`src/components/table-cell/`. This replaces the older `Table / Cell Text`
(`99:203`), which is only a Body/sm-regular text layer with no padding.
Type=Text is that same text inside the cell. Every text style and colour
binding is copied exactly. The Storybook grids are checked against them:
58 checks in Light and 59 in Dark (padding, alignment, every text layer's
style and colour, gaps, the list bullet), with no mismatches.

**Changed in Figma on 3 Nov 2026** (decisions offscale-spacing,
dark-pins-components and dark-pins-showcase; published): every Table / Cell
type's padding is bound, `space/12` top and bottom and `space/16` at the
sides (was a raw 14 / 16), and its gaps to `space/2` / `space/4`, as code's
`px-4 py-3`. Each cell is 4px shorter (Text 45 → 41). The Semantics → Dark
pins on `Table / Row – Cost`, `Table / Header – Costs`, `Table / Header –
Recurring Costs`, `Table / Row – Recurring Cost` and `Table / Recurring
Costs` are cleared, so their instances follow their frame. The Generic
Table Parts section has a Light frame beside the Dark one.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Line height | Inter's auto line height (17px for Body/sm) | GDL's ramp (20px), so a Text cell is 44px (Figma 41) and List (Expanded) 106px | Bind the text styles' line heights to the ramp |
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

- **Widths are set per column** (Figma: 200 / 56 / 220 / 180px). The cell
  has no width; the table sets it.

### StatusPill (22 Oct 2026)

Source: page **Tags** (`89:858`), set `Status Pill` (`446:11344`): Status
(Pending, Active, and since 2 Nov 2026 Approved, Paid, Rejected, Stopped,
Inactive) and a Label text property. It's the filled pill in the
Costs and Recurring Costs tables, nested in every cost row (128 instances
on the CAF screens). Its labels there are "Pending", "Recurring" and
"Active". Code: `src/components/status-pill/`. Every colour binding is
copied exactly, and the Storybook grids check each pill against the
variables its layers are bound to, in Light and Dark.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Line height | Inter's auto (15px for Caption/md) | GDL's ramp (16px), so the pill is 24px tall (Figma 23) | Bind the text style's line height to the ramp |
| Letter spacing | 0 | GDL's Caption/md-semibold, 0.3px | As above |

With the letter spacing, "Pending" is 74px wide (Figma 72) and
"Recurring" 84px (Figma 81).

Contrast: every label passes AA.

| Status | Light | Dark |
|---|---|---|
| Pending | 5.18 | 7.20 |
| Active | 6.81 | 4.77 |
| Approved (`accent/info/filled`) | 5.25 | 5.36 |
| Paid (`accent/success/filled`) | 4.95 | 6.27 |
| Rejected (`accent/critical/filled`) | 4.77 | 5.30 |
| Stopped, Inactive (`neutral/filled`) | 4.76 | 7.87 |

Added in Figma on 2 Nov 2026 (decisions add-status-pill-approved-paid-rejected
and add-inactive-stopped-statuses): Approved, Paid and Rejected in U01's blue,
green and red (545:13232), Stopped and Inactive neutral. Each binds the
accent's (or neutral's) filled surface and content pair, as Active binds
action.primary's. They replace the patterns' stand-ins (Active for Approved and
Paid, Tag Error for Rejected, a neutral Tag for Stopped and Inactive).

**Changed in Figma on 3 Nov 2026** (decisions dark-pins-components and
review Status Pill open 1–3; published). Code follows:
- **Pending's label** is `accent/pending/filled/content/default`, not
  `accent/warning/filled/content/default` (the same white / slate-950
  today, so nothing looks different). Code binds it too.
- **Status=Pending's Light pin is cleared,** on the variant and so on its
  instances. Pending now follows the frame's mode, as code always did: in
  the Dark cost rows on the screens it turns orange-500 with a slate-950
  label (7.20:1), next to a Dark Active pill.
- **Padding and radius are bound** on all seven variants: `space/12` /
  `space/4` and `radius/full`, as code draws them. The sides were raw 10,
  so each pill in Figma is 4px wider. Those three departures are gone.

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
| Padding and gap | Raw 6px, unbound | 6px (`space/6`). Inside a TableHeaderRow, `space/16` sides and `space/12` top and bottom, as the Header Row overrides it (since 2 Nov 2026) | Bind to `space/6` |
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

**Changed in Figma on 3 Nov 2026** (review Table #2 and
dark-pins-components; published): the Sort=Ascending and Sort=Descending
variants' label is linked to `Label`, as the other two, so a sorted header
takes its text from the property (code's `label` already did for every
sort). `Table / Header – Recurring Costs`' Dark pin is cleared.

Figma gaps the code doesn't copy: none.

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

**Read back on 2 Nov 2026:** State=Selected (`460:943`) is still
`action/primary/surface/default` at 16% opacity (0.16), and so are both
placed instances in the Header Row example (`771:1405` Light, `771:1556`
Dark); Figma's own render shows the light tint. The 100% seen while
drafting came from the plugin API's `node.screenshot()`, which renders an
instance without its frame's explicit Light mode. Code keeps the 16% tint.

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
Size (32, 40) × Tone (Ghost, Tonal, Destructive) × State (Default, Hover,
Disabled). Code: `src/components/icon-button/`. Every colour binding is
copied exactly, and the Storybook grids check each tone's fill at rest, on
hover and disabled (hovered: no hover fill), its glyph colour and its glyph
size, in Light and Dark.

| Tone | Fill at rest | Fill on hover | Glyph |
|---|---|---|---|
| Ghost | none | `neutral/tonal/surface/default` | `text/secondary` |
| Tonal | `surface/base` | `neutral/tonal/surface/default` | `text/primary` |
| Destructive | none | `accent/critical/tonal/surface/default` | `accent/critical/tonal/content/default` |
| Disabled (every tone) | the tone's fill at rest | none | `text/disabled` |

Size 32 holds a 16px glyph and size 40 a 20px one.

**Changed in Figma on 3 Nov 2026** (decisions fc-buttons-icon-disabled
and review Filters and form open 2; published): `State=Disabled` for every
Size × Tone, the Default container with a `text/disabled` glyph (in
Light #CBD5E1, in Dark #64748B; exempt from contrast) and no hover. Code: the
native `disabled` draws the glyph in `text-text-disabled`; the hover fills
were already enabled-only.

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
| Pressed | No such state | No Pressed look | Add it if the screens need it |
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

Behaviour is hand-built like VCP's Popover, with no positioning library and, by default, no portal:
- The trigger is cloned with `aria-expanded`, `aria-haspopup` (from `panelRole`) and, while open, `aria-controls`.
- The panel opens below the trigger, 4px away, flush with its left or right edge (`placement`, `align`).
- It flips above the trigger, or to the other edge, when the viewport has no room.
- A pointer down outside, Escape or focus leaving closes it. If focus was inside, it goes back to the trigger.
- It doesn't trap focus: it is non-modal.

The stories check the surface against the tokens in Light and Dark, and test flipping in all four corners of the viewport.

**`portal` (3 Nov 2026, decision add-phone-table-layout).** An opt-in way to render the panel outside the trigger's wrapper, so a container that scrolls or clips can't cut it off. Figma has no phone layout and no Popover, so this is code only. RowActionsMenu turns it on (a TableList now scrolls sideways in its own region, which clips what is inside it). Everything else keeps the default.
- The panel renders in a portal on `document.body`, `position: fixed` (`fixed` instead of `absolute`), with its top or bottom and its left or right edge set inline from the trigger's box. The gap is still the panel's own `mt-1` / `mb-1` (`space/4`), so it sits where the inline panel would.
- It is placed before paint, and again on any scroll (capturing, so a scrolling table region counts), on resize, when the trigger, the panel or the page changes size (the same ResizeObserver), and every frame while open, so a layout shift that moves the trigger without a scroll or a size change moves the panel too (state changes only when an edge moved). It flips as the inline panel does.
- Z-order: `z-50`, after the page in the DOM, so it is above the page and above a dialog it was opened from.
- The ARIA wiring is unchanged (`aria-expanded`, `aria-haspopup`, `aria-controls` to the panel's id). Outside click, Escape and focus leaving count the panel as inside although it is no longer in the wrapper.
- Tab keeps the inline order, which the portal would otherwise break: Tab on the open trigger goes into the panel; Tab past its last control goes to whatever follows the trigger (which closes it); Shift+Tab before its first control goes back to the trigger. A handler that moves focus itself (MenuDropdown's Tab) calls `preventDefault()` and wins.
- Opened from inside a dialog, the panel is outside the dialog in the DOM. Overlay leaves Tab alone when focus is in a portalled popup whose trigger is in the dialog (the panel carries `data-popover-portal`), so the popup's own Tab handling runs; the panel isn't made inert, because it is added after the dialog opened.
- Nothing touches `document` on a server: the portal waits for the browser (`useSyncExternalStore`, true from the first client render).
- Tests find a portalled panel with `screen` (it is outside `canvasElement`). The stories: Portal (a trigger in a box that scrolls: outside the box, over its edge, following it as it scrolls; Tab, Shift+Tab, Escape, outside click) and Surface, portal in Light and Dark.

| Layer | Figma (Menu / Dropdown) | Code |
|---|---|---|
| Fill | `surface/elevated` (`surface/neutral/faint` until 3 Nov) | `bg-surface-elevated` |
| Stroke | 1px inside `stroke/subtle` | `inset-ring inset-ring-stroke-subtle` |
| Radius | `radius/8` (raw 8 until 29 Oct) | `rounded-8` |
| Effect | `Effects/Elevation Light/3` style (Dark/3 until 3 Nov) | `shadow-elevation-3` |
| Padding | `space/6`, every side (raw 6 until 29 Oct) | `p-1.5` (`space/6`) |

Contrast. The panel on `surface/canvas` is 1.05 (Light) and 1.22 (Dark); the stroke (`stroke/subtle` on the panel, 1.23 / 1.41) and the shadow set it apart. The panel is a container, not a control, so WCAG 1.4.11 doesn't apply. Content on it: `text/primary` 20.17 / 14.63, `text/subtle` 4.76 / 5.71; the focus ring (`stroke/focused`) 6.81 / 5.33.

**Changed in Figma on 3 Nov 2026** (decisions menu-surface, elevation-dark-3): Menu / Dropdown's fill is `surface/elevated` ("Cards, Widgets, Popovers") and its effect Elevation Light/3. Code: `popoverSurface` fills with `bg-surface-elevated`. Everything that floats on it follows: MenuDropdown, AccountMenu, RowActionsMenu, MenuTriggerButton's menu, and the lists of Select, FilterSelect and Combobox. Figma's Select / Menu still binds `surface/neutral/faint` (see SelectMenu). The date pickers (Calendar, RangeCalendar) draw their own surface and are unchanged.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Component | None | A code-only Popover with Menu / Dropdown's surface | Add a panel component if designers want overlays other than menus |
| Gap to the trigger | Pattern 03 draws the menu 4px under the ••• | `mt-1` / `mb-1` (`space/4`) | None needed |
| Placement | Pattern 03: under the button, right-aligned | `placement` bottom / top, `align` left / right, flipping at the viewport's edges | None needed |
| Text colour | None on the panel | `text/primary`, for content that sets none | None needed |
| Width | Fixed 212 (Menu / Dropdown) | Hugs its content (`w-max`); MenuDropdown sets its own minimum | None needed |

Limits:
- **No portal by default.** A parent with `overflow: hidden` or `auto`, such as a TableList's scroll region, clips the inline panel. Pass `portal` there (RowActionsMenu does).
- **A portalled panel follows its trigger, not the trigger's clip.** If a container scrolls the trigger out of sight while the panel is open (a trackpad scroll of the table region), the panel stays where the trigger is. A touch or a click on the region closes it first (outside pointer down).
- **Dark elevation doesn't reach components.** `dist/tokens.dark.css` redefines `--shadow-elevation-*` under `.dark`, but Tailwind v4 compiles `shadow-elevation-*` with the values inlined. Every elevated component is Light Elevation in Dark, Button's hover shadow included. The fix belongs in GDL's theme output.

### MenuItem (29 Oct 2026)

Source: page **Menus** (`446:11509`), set `Menu / Item` (`405:561`): Type (Default, Hover, Destructive, Destructive Hover) with a Label. Code: `src/components/menu-item/`.
- Type=Hover is `:hover`.
- Type=Destructive is `destructive`; Type=Destructive Hover is `destructive` on `:hover`.
- Label is `children`.

It is a `<button role="menuitem">` outside the tab order, used inside MenuDropdown. The Storybook grids check fill, label colour, focus ring, type style, padding and radius in Light and Dark, with Hover and keyboard focus forced.

| Type | Fill | Label |
|---|---|---|
| Default | none | `text/primary` |
| Hover | `neutral/tonal/surface/default` | `text/primary` |
| Destructive | none | `accent/critical/tonal/content/default` |
| Destructive Hover | `neutral/tonal/surface/default` | `accent/critical/tonal/content/hover` |
| The keyboard's item (`:focus-visible`, code only) | Hover's fill (Destructive Hover's label on a destructive item), plus the focus ring | as Hover / Destructive Hover |

The label is Body/sm-regular, with 8 / 12 padding and radius 6.

Contrast: every label passes AA. Ratios are on the menu's `surface/elevated` at rest, and on `neutral/tonal/surface/default` on hover:

| Label | Light, rest / hover | Dark, rest / hover |
|---|---|---|
| `text/primary` | 20.17 / 16.36 | 14.63 / 7.58 |
| Destructive: `…/content/default` at rest, `…/content/hover` on hover | 8.36 / 8.13 | 7.62 / 5.21 |

Destructive's own `…/content/default` on the hover fill would be 6.78 / **3.95**, so Destructive Hover (and the keyboard's destructive item) uses `…/content/hover`. The hover fill on the panel is 1.23 / 1.93: the label carries the state. The focus ring (`stroke/focused`) sits 2px outside the item, on the panel: 6.81 / 5.33.

**Changed in Figma on 3 Nov 2026** (decisions weak-fills, states-code-adds, dark-pins-components; fc-modals-menu-item): Hover's fill is `neutral/tonal/surface/default` (was `surface/base`, 1.00:1 on the new panel); a fourth Type, **Destructive Hover** (`793:20113`), draws the destructive item on hover; the set's Semantics → Dark pin is cleared. Type stays one property (no Type × State split for now). Code: `enabled:hover:bg-neutral-tonal-surface-default`, the same fill on `focus-visible` (the decision gives the keyboard's item the Hover fill), and `enabled:hover:` / `focus-visible:text-accent-critical-tonal-content-hover` on a destructive item.

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
| Focus | No Focus state | Hover's fill plus a 2px `stroke.focused` outline, 2px offset, as on Button | Add a Focus state |
| Disabled | No such state | No `disabled` prop: leave out an action the user can't take | Add one if the screens need it |

Figma gaps the code doesn't copy: none since 3 Nov 2026 (the pin is cleared and Hover shows).

### MenuDropdown (29 Oct 2026)

Source: page **Menus** (`446:11509`), `Menu / Dropdown` (`446:11510`). How it opens comes from pattern **03 · Row actions menu** (`520:2387`): "opens Menu / Dropdown under the button, right-aligned", and it closes on a choice, a click outside or Esc. Code: `src/components/menu-dropdown/`. It's a Popover with `role="menu"`, named by its trigger, and the WAI-ARIA menu button pattern. The MenuItems are `children`; Figma's "hide unused items" is leaving them out.

| | Figma | Code |
|---|---|---|
| Surface | `surface/elevated` fill, 1px inside `stroke/subtle`, radius 8, Elevation Light/3, padding 6 | Popover's surface |
| Layout | Vertical auto layout, 2px item spacing, items Fill | `flex flex-col gap-0.5`; items `w-full` |
| Width | Fixed 212 | `min-w-64` (256), wider for a longer label |
| Items | Menu / Item instances, Destructive last | MenuItem `children` |

Keyboard. On the trigger, Enter, Space or ↓ opens the menu on the first item, and ↑ opens it on the last. A click also opens it on the first item. In the menu:
- ↓ / ↑ move and wrap.
- Home / End go to the first / last item.
- Enter or Space chooses an item, which closes the menu.
- Escape and Tab close it.

Focus then goes back to the trigger. A click outside closes the menu and leaves focus where the click put it. The Keyboard story tests every key.

In a table, or in anything else that scrolls or clips, pass Popover's `portal` (3 Nov 2026): the menu opens on `document.body`, over the table's scroll region, instead of being cut off inside it. RowActionsMenu does this. MenuDropdown's default is unchanged (inline), and its Tab handling (close, focus back to the trigger) is the same either way.

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
| Behaviour | Pattern 03: closes on a choice, a click outside or Esc | That, plus the arrow keys, Home / End and Tab | None needed |
| Name | None | Named by its trigger (`aria-labelledby`), or by `label` | None needed |

**Changed in Figma on 3 Nov 2026** (decisions menu-surface, elevation-dark-3, dark-pins-components): the fill is `surface/elevated` (was `surface/neutral/faint`, the canvas colour), the effect Elevation Light/3 (was Dark/3), and the Semantics → Dark pin is cleared; the 9 placements on Patterns – Admin follow. Code: Popover's surface, `bg-surface-elevated` (see Popover).

Figma gaps the code doesn't copy: none.

### RowActionsMenu (29 Oct 2026)

Source: page **Menus** (`446:11509`), `Menu / Row Actions Button` (`405:551`, 56 on the screens), with the `Menu / Dropdown` it opens, placed as pattern 03 places it. Code: `src/components/row-actions-menu/`.
- The trigger is `<IconButton icon="dots-three" label="Row actions" />` (Ghost, 32).
- The menu is a MenuDropdown below the button, flush with its right edge.
- Put it in a TableCell of type `actions`.
- `label` names the button and its menu. Name the record when a table has many rows ("Actions for cost 123456").
- The menu opens outside the table (3 Nov 2026, decision add-phone-table-layout: "row menus open outside" the table's scroll region): Popover's `portal`, on `document.body`, fixed at the button, 4px under it and flush with its right edge as before. `portal={false}` keeps it inline. Tests find the menu with `screen`.

Stories: in a TableRow (pointer and keyboard, with the menu over the next rows, on `<body>`), and open in a table in Light and Dark. TableList's and the Costs table's phone stories open it over the scroll region's edge.

| | Figma | Code |
|---|---|---|
| Button | The one-off 32×32 ••• | IconButton Ghost 32: `text/secondary` glyph (16px); `neutral/tonal/surface/default` on hover |
| Menu | Menu / Dropdown | MenuDropdown, `align="right"` |
| Placement | 4px under the button, right-aligned | `mt-1`, flush with the button's right edge (fixed, on `<body>`); flips at the viewport's edges |

Contrast: the ••• glyph needs 3:1. It is 9.90 (Light) and 14.48 (Dark) on the canvas, and 8.40 / 6.15 on its hover fill (see IconButton). The menu is as MenuItem.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Button | One-off: radius 6, 20px DotsThree in `text/primary`, no hover | IconButton Ghost 32 (see "IconButton") | Swap it for a `Button / Icon` instance, Ghost 32 |
| Name | None | `label`, default "Row actions" | None needed |

**Changed in Figma on 3 Nov 2026** (decisions dark-pins-components, menu-surface): Menu / Row Actions Button's Semantics → Dark pin is cleared (its placements sit in Dark-pinned screens, so they still render Dark), and the menu it opens is on `surface/elevated` (see Popover).

Figma gaps the code doesn't copy: none.

### TextInput (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Text Input` (`441:11488`): State
(Default, Filled, Focus, Error, Error + Focus, Disabled) with a Value text
property.
Code: `src/components/text-input/`. It is a native `<input>`, so each
state is the element's own: Default is empty with a `placeholder`, Filled
has a value, Focus is `:focus`, Error is `aria-invalid` and Disabled is
`disabled`. Form / Field – Text (`184:3056`) sets it to Fill, so in code
it fills its container (`w-full`). Every binding is copied exactly. The
Storybook grids check each state's fill, stroke colour and width, text
colour and height, in Light and Dark.

| State | Fill | Stroke (inside) | Text |
|---|---|---|---|
| Default | `surface/elevated secondary` | 1px `stroke/field` | placeholder, `text/subtle` |
| Filled | `surface/elevated secondary` | 1px `stroke/field` | value, `text/primary` |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` |
| Error + Focus | `surface/elevated secondary` | 2px `accent/critical/outline/border/default` | `text/primary` |
| Disabled | `neutral/tonal/surface/disabled` | 1px `neutral/outline/border/disabled` | value or placeholder, `text/disabled` |

Every state is Body/sm-regular with radius 8, a fixed 40 high (`space/40`).

Contrast, on the field fill:

| Pair | Light | Dark |
|---|---|---|
| Value, `text/primary` (4.5:1) | 20.17 | 17.85 |
| Placeholder, `text/subtle` (4.5:1) | 4.76 | 6.96 |
| Focus stroke, `stroke/focused` (3:1) | 6.81 | 6.51 |
| Error stroke, `accent/critical/outline/border/default` (3:1) | 3.81 | 3.74 |
| Resting stroke, `stroke/field` (3:1) | 4.76 | 6.96 |
| Disabled text, `text/disabled` on `neutral/tonal/surface/disabled` | 1.36 | 3.07 |
| Disabled stroke, `neutral/outline/border/disabled` on `surface/base` | 1.48 | 1.93 |

Disabled is exempt (WCAG 1.4.3 and 1.4.11: an inactive control).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius and side padding** of every state are bound to `radius/8` and
  `space/12`. They were raw 8 and 12, so nothing looks different.

**Changed in Figma on 3 Nov 2026** (decisions `input-height`,
`disabled-look` / `fc-form-disabled` and `states-code-adds`; published):
- **Height:** a fixed 40 (`space/40`), top and bottom padding 0, strokes
  outside the layout, the text centred. Code was already 40, so the Height
  and Padding departures are gone.
- **Disabled:** opacity 100%, fill `neutral/tonal/surface/disabled`, stroke
  `neutral/outline/border/disabled`, text `text/disabled`. Code follows:
  `disabled:bg-neutral-tonal-surface-disabled
  disabled:inset-ring-neutral-outline-border-disabled
  disabled:text-text-disabled` (placeholder too), and no `opacity-50`.
- **Error + Focus** is a state: Focus's look with the critical stroke at
  2px, as code already drew it.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Letter spacing | 0, auto line height (17px, centred in the 40) | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp (left to the text-style work) |
| Focus | The Focus state is the 2px stroke | Copied on `:focus`. The browser's outline is hidden, but stays transparent so forced-colours mode still shows a ring | None needed |
| Disabled with a value | Only the placeholder is shown | A value also takes Disabled's `text/disabled` | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke reaches 3:1 since 2 Nov 2026.** Changed in Figma on
  2 Nov 2026: Default and Filled moved from `stroke/subtle` (1.23:1 Light,
  1.72:1 Dark on the fill) to the new `stroke/field` (4.76:1 / 6.96:1), on
  _Text Input, _Dropdown Input, _Date Input, _Combobox Input and _Textarea
  alike.

Figma gaps the code doesn't copy: none (no pinned modes).

### SelectTrigger (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Dropdown Input` (`441:11504`):
State (Default, Filled, Focus, Error, Error + Focus, Disabled, Open,
Error + Open) with a Value text
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
| Default | `surface/elevated secondary` | 1px `stroke/field` | placeholder, `text/subtle` | `text/subtle` |
| Filled | `surface/elevated secondary` | 1px `stroke/field` | value, `text/primary` | same |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` | same |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` | same |
| Error + Focus | `surface/elevated secondary` | 2px `accent/critical/outline/border/default` | `text/primary` | same |
| Disabled | `neutral/tonal/surface/disabled` | 1px `neutral/outline/border/disabled` | `text/disabled` | `text/disabled` |
| Open | `surface/elevated secondary` | 2px `stroke/focused` | placeholder, `text/subtle` | `text/subtle` |
| Error + Open | `surface/elevated secondary` | 2px `accent/critical/outline/border/default` | placeholder, `text/subtle` | `text/subtle` |

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
| Resting stroke, `stroke/field` (3:1) | 4.76 | 6.96 |

Disabled is exempt (as TextInput: 1.36 / 3.07 for the text).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The caret** in every state was a raw `#E5E5E5` override, 1.26:1 on the
  Light field. It's now bound to `colors/text/subtle` (4.76 Light / 6.96
  Dark), as `_Combobox Input` and `_Date Input` bind theirs. The seven
  placements on the Form page follow it.
- **Radius and side padding** of every state are bound to `radius/8` and
  `space/12` (no visual change).

**Changed in Figma on 3 Nov 2026** (decisions `input-height`,
`disabled-look` / `fc-form-disabled` and `states-code-adds`; published):
- **Height:** a fixed 40, padding 0 top and bottom, strokes outside the
  layout. Code was already 40.
- **Disabled:** the disabled fill and stroke, the value and the caret in
  `text/disabled`, no opacity. Code follows (the caret switches to
  `text-text-disabled` when disabled).
- **Error + Focus and Error + Open** are states, drawn as code already did.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Gap | 0, space-between | 8px (`space/8`), so a long value truncates (…) before the caret | Set item spacing to `space/8` |
| Letter spacing | 0, auto line height | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp |
| Focus | The Focus state is the 2px stroke | Copied on `:focus-visible` (keyboard focus). The browser's outline is hidden, but stays transparent in forced-colours mode | None needed |
| Semantics | None | `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded` from `open`. Select passes `aria-controls` | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke reaches 3:1 since 2 Nov 2026** (`stroke/field`), as
  on TextInput.

Figma gaps the code doesn't copy: none. The caret's raw fill was fixed in
Figma (above).

### TableExpandButton (29 Oct 2026)

Source: page **Table** (`3:1823`), set `Table / Expand Button`
(`792:17121`, in Atoms `99:197`): the 28×28 caret button that opens a cost
row to show its breakdown. Expanded (false, true) × State (Default, Hover,
Focus); `99:199` is Expanded=false, State=Default. Code:
`src/components/table-expand-button/`. `expanded` is Expanded: it swaps the
caret and sets `aria-expanded`, and `aria-controls` points at what it
opens. State is the button's own: Hover is `:hover`, Focus is
`:focus-visible`. The Storybook grids (States, Light and Dark) show every
Expanded × State, with Hover and Focus forced, and check the fill, glyph
colour, radius, size, glyph size and position, the caret, and the focus
ring.

| Layer | Figma binding | Code |
|---|---|---|
| Fill, Default and Focus | `colors/neutral/tonal/surface/default` | `bg-neutral-tonal-surface-default` |
| Fill, Hover | `colors/neutral/tonal/surface/hover` | `enabled:hover:bg-neutral-tonal-surface-hover` |
| Glyph: CaretDown (Expanded=false), CaretUp (true), 20×20 | `colors/text/primary` | `<Icon size={20}>` `caret-down` / `caret-up`, `text-text-primary` |
| Size | 28×28, fixed | `size-7` |
| Radius | GDL's `radius/4` (4px; the file still shows its old name, `radius-2`) | `rounded-4` |
| Padding | `space/4` | `p-1` |
| Focus Ring (Focus) | An absolute 36×36 frame at −4 / −4: 2px inside `colors/stroke/focused` (`stroke/2`), `radius/8`, so the ring sits 2px outside the button | `focus-visible:outline-2 outline-offset-2 outline-stroke-focused`: the outline follows the 4px radius, 8 at its outer edge and 6 at its inner, as Figma's ring |

Contrast: the glyph is a graphic, so it needs 3:1 (WCAG 1.4.11).

| Pair | Light | Dark |
|---|---|---|
| Glyph `text/primary` on its fill | 16.36 | 7.58 |
| Glyph `text/primary` on the Hover fill | 13.59 | 4.76 |
| Fill on `surface/base` / `surface/canvas` (the shape only; the glyph carries it) | 1.23 / 1.18 | 1.93 / 2.36 |
| Focus ring `stroke/focused` on `surface/base` / `surface/canvas` | 6.81 / 6.51 | 5.33 / 6.51 |

**Changed in Figma on 29 Oct 2026** (clear binding fixes): in
`Table / Row – Cost` Expanded=true, the CaretUp vector was bound to the
primitive `colors/CAF-blue/50` (about 1.1:1 on the fill in Light). It became
`colors/text/primary`, as CaretDown.

**Changed in Figma on 3 Nov 2026** (decisions expand-button and
dark-pins-components; published):
- **`Table / Expand Button` is a set**, Expanded × State. Expanded=true
  swaps CaretDown for CaretUp; Hover fills `neutral/tonal/surface/hover`;
  Focus adds the Focus Ring. The original component (`99:199`) is the
  Expanded=false, Default variant, so the 71 placed instances stayed linked.
  Code adds the Hover fill; Expanded and Focus were already code's.
- **The glyph** is a 20×20 instance (it was a 16px box the 20px glyph
  overflowed) and the padding is `space/4` (was `Spacings/6`). Same size and
  look as before, and as code.
- **`Table / Row – Cost` Expanded=true** uses Expanded=true instead of a
  hand-swapped CaretUp.
- **The Semantics → Dark pin** on the button is cleared, so it follows its
  frame, as code follows the page's theme.

The radius needs no fix. It is GDL's `radius/4`, which the file shows
under its old name `radius-2` because GDL renamed its Radius variables
(`radius-2` → `radius/4`, `radius-4` → `radius/8`) and the CAF library
hasn't taken that library update yet.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Disabled | No such state | Native `disabled`: a not-allowed cursor, and no Hover fill | Add it if the screens need it |
| Pressed | No such state | None (the fill stays as on Hover) | Add it if the screens need it |
| Name | The glyph is the only content | `label` is required and becomes `aria-label`. It stays the same in both Expanded states; `aria-expanded` says the state | None needed |

Figma gaps the code doesn't copy: none.

### TableDetailLabel (29 Oct 2026)

Source: page **Table** (`3:1823`), component `Table / Detail Label`
(`99:205`): one "Label: Value" line, two texts: Label (`Label#793:1`,
default "Label:") and Value (`Value#99:1`, default "Value"), `space/4`
apart. TableAccountDetails stacks them. Code:
`src/components/table-detail-label/`. Label is `label`, with its colon as
Figma's text has it ("ID:"); Value is `value` ("32430"). The Storybook
stories check each part's colour and type style, the 4px gap and the line's
text in Light and Dark, and the truncation (Truncated).

| Layer | Figma binding | Code |
|---|---|---|
| Line | Horizontal, gap `space/4`, hugs | `<p>` `flex max-w-full gap-1` |
| Label | Body/sm-regular, `colors/text/primary`, hugs | `<span>` `shrink-0`: it never shrinks |
| Value | Body/sm-regular, `colors/text/primary`; truncates (ending …, 1 line) when the line has a fixed width | `<span>` `min-w-0 truncate`: one line, cut with … when the line is narrower than it |
| Text style | Body/sm-regular (`font/size/body-sm`, `font/weight/regular`, `font/family/inter`) | `text-body-sm-regular text-text-primary` on the line |

A space between the two spans, which the flex layout doesn't draw, keeps
the line's text "ID: 32430" when it is copied or read by a screen reader.

Contrast: it has no fill, so it sits on the row.

| Text | Light, `surface/base` / `canvas` | Dark, `surface/base` / `canvas` |
|---|---|---|
| `text/primary` | 20.17 / 19.28 | 14.63 / 17.85 |
| `text/primary` on a Selected row's tint | 15.76 / 15.12 | 11.98 / 14.68 |

**Changed in Figma on 3 Nov 2026** (decisions account-details and
fc-table-detail-label; published): the one "Label: Value" text (`Text#99:1`)
is two, Label and Value (`Text` renamed `Value`, same id), both Body/sm-regular
in `text/primary` (fc-table-detail-label: the label stays `text/primary`),
`space/4` apart; Value truncates. Every placed line was split, so it still
reads as before ("ID: 37022"). Code takes `label` and `value`.

`children` (the whole line, Figma's old Text) still renders, as one wrapping
`<p>`, so existing callers keep working. It is deprecated: removing it is a
`major` change for the next major release.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Line height | Inter's auto line height, 17px | GDL's Body/sm, 20px. Four lines are 80px (Figma 68) | Bind the text style's line height to the ramp |
| Letter spacing | 0 | GDL's Body/sm-regular, 0.4px | As above |
| When the value truncates | When the line is given a fixed width | When its container is narrower than the line (`max-w-full`). In a table, give the column a width | None needed |

### TableAccountDetails (29 Oct 2026)

Source: page **Table** (`3:1823`), component `Table / Account Details`
(`99:214`): the cost row's Account column. It holds four nested
`Table / Detail Label` instances (ID, Applicant, Beneficiary name, IBAN
Account) and a Category Tag (`Category Tag#99:3`, an instance swap whose
default is `Tag / Status=Info` (`330:3826`) with Show Icon off, labelled
"Recurring"; its preferred values are Tag Info and Tag Neutral). It is
nested in every `Table / Row – Cost`. Code:
`src/components/table-account-details/`. The Storybook grids check the
lines' colour and stacking, the 12px gap to the tag and the tag's colours,
for Tag Info, Tag Neutral and no tag, in Light and Dark. They also check it
in a TableRow (Default, Hover, Selected, Expanded) next to a
TableExpandButton.

| Figma | Code |
|---|---|
| Frame: vertical, gap `space/12`, hugs | `flex flex-col items-start gap-3` |
| Details: vertical, gap 0 | `flex flex-col items-start` |
| The four `Table / Detail Label` instances | `children`: one `<TableDetailLabel label value>` per line |
| Category Tag (instance swap; default Tag Info, Show Icon off, "Recurring") | `categoryTag`: `<Tag status="info" showIcon={false}>Recurring</Tag>`, or a Tag Neutral. Optional |

Contrast: the lines are `text/primary` (see TableDetailLabel). The
category tag keeps Tag's own bindings: Tag Info's "Recurring" is 5.60
(Light) / 5.72 (Dark), Tag Neutral's 8.40 / 5.10.

**Changed in Figma on 29 Oct 2026** (clear binding fixes): the Category
Tag's label had been overridden to `text/primary` on the orange pill (3.90 /
2.80); it took Status Pill's own binding. The gap is bound to `space/12`.

**Changed in Figma on 3 Nov 2026** (decisions account-details and
dark-pins-components; published):
- **The Category Tag's default** is `Tag / Status=Info`, Show Icon off,
  "Recurring" (was `Status Pill / Status=Pending`, pinned Light), so the
  category no longer reads as a second status. Its preferred values are Tag
  Info and Tag Neutral. The placed rows follow. Code's stories, and the
  Costs table's recurring costs, use `<Tag status="info" showIcon={false}>`.
- **The Detail Labels** are Label + Value (see TableDetailLabel).
- **The Semantics → Dark pin** on the component is cleared, and the
  Category Tag's Light pin went with the swap. Code follows the page's
  theme.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Category Tag | Always shown | `categoryTag` is optional, and has no default: leave it out for no tag (a single cost has none) | Add a Show Category Tag boolean if the screens need one |
| Height | 105 (17px lines, 25px tag) | 116 (20px lines, 24px tag), on GDL's ramp | Bind the text styles' line heights to the ramp |
| Width | 301 in the cost row | Hugs; the table sets the column width | None needed |

Figma gaps the code doesn't copy:

- **The breakdown panel** under an expanded row (`Table / Row – Cost`
  Expanded=true: a `surface/base` panel with a 4px `stroke/brand/strong`
  left border, and the row in `surface/canvas`) belongs to the cost row
  (the Costs table pattern). The component's stories show a labelled
  stand-in.

### TabItem (29 Oct 2026)

Source: page **Tabs** (`89:812`), set `Tabs / Tab Item` (`297:284`):
Style (Segmented, Form) × State (Selected, Default, Hover), with a Label.

Code: `src/components/tab-item/`. It is a `<button role="tab">` that is
always inside a tab list. Style is the list's: Tabs draws Segmented and
FormTabNavigation draws Form (the list's `appearance`), so TabItem has no
prop for it. State=Selected means the list's `selected` (or `active`) is
this tab's `value`, which sets `aria-selected`; Hover is `:hover` on a tab
that isn't selected. The Label is `children`. `value` names the tab: Figma
has no such property, but the list needs a name to refer to it. Only the
selected tab is in the tab order, and the list moves focus with the arrow
keys.

| Style, State | Fill | Label |
|---|---|---|
| Segmented, Selected | `action/primary/surface/default` | `action/primary/content/default`, Body/sm-semibold |
| Segmented, Default | none | `text/subtle`, Body/sm-semibold |
| Segmented, Hover | `neutral/outline/surface/hover` | `text/primary`, Body/sm-semibold |
| Form, Selected | `neutral/tonal/surface/default` | `text/primary`, Body/sm-medium |
| Form, Default | none | `text/subtle`, Body/sm-regular |
| Form, Hover | `neutral/outline/surface/hover` | `text/primary`, Body/sm-regular |

Segmented is 32px high (fixed), with 0 / 16 padding (`space/16`) and
`radius/8`. Form hugs its label with 8 / 16 padding (`space/8`,
`space/16`) and `radius/6`, and in FormTabNavigation the tabs share the
bar's width. The Storybook grids check all six variants' fill, label
colour, type, height, padding and radius, Hover forced, in Light and
Dark.

Contrast: the labels pass AA. Segmented Selected is 6.81 (Light) and 4.77
(Dark) on the blue; Form Selected 16.36 / 7.58 on its pill; Hover 18.41 /
10.35; Default is `text/subtle` on the bar's
`surface/elevated-secondary`, 4.76 / 6.96. The focus ring
(`stroke/focused`) is 6.81 / 6.51 on the bar. The Hover fill against the
bar is 1.10 / 1.72; a hover doesn't need 3:1.

**Changed in Figma on 3 Nov 2026** (decisions fc-buttons-tab-hover,
fc-buttons-tabs-one-set, tabs-one-set, weak-fills, states-code-adds and
dark-pins-components; published). Code follows:
- **Style** (Segmented, Form) is a new variant property: the old variants
  became Style=Segmented, and Style=Form draws Form / Tab Navigation's tab.
  It is code's `appearance`. Tabs / Cost Type and Form / Tab Navigation
  stay two sets (fc-buttons-tabs-one-set).
- **Hover** for both Styles: `neutral/outline/surface/hover` with a
  `text/primary` label. Code: `hover:bg-neutral-outline-surface-hover
  hover:text-text-primary` on a tab that isn't selected.
- **Form Selected's fill** is `neutral/tonal/surface/default` (was
  `surface/base`, the same as the track in Light, 1.00:1). It is now 1.23
  (Light) / 2.36 (Dark) against the track; the weight and the
  `text/primary` label still carry the state.
- **The set's Dark pin is cleared.** It never reached instances.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Focus, Disabled | No such states | 2px `stroke/focused` focus ring, as on Button. No `disabled` | Add a Focus state if tabs need it |
| Style | A variant property | Chosen by the list (Tabs or FormTabNavigation), not a TabItem prop | None needed |
| `value` | None: the Selected variant names the tab | Each TabItem has a `value`, which the list's `selected` / `active` refers to | None needed |
| Letter spacing | 0 | GDL's 0.4px (Body/sm), so "Recurring" is 102px wide (Figma 98) | Bind the text styles to the ramp |

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

**Changed in Figma on 3 Nov 2026** (decision dark-pins-components;
published): the set's Dark pin is cleared, so the library page shows the
tabs in Light too; placed instances always rendered their screen's mode.
Its Tab Items gained Hover (see TabItem), which code follows. The Tabs
page has Light and Dark example frames (`793:18516`).

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
| Selected fill | `action/primary/surface/default` (blue) | `neutral/tonal/surface/default` (a neutral pill) |
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
| Active tab | `neutral/tonal/surface/default`, radius 6, 8 / 16 padding | `text/primary`, Body/sm-medium |
| Other tab | none | `text/subtle`, Body/sm-regular |
| Other tab, hovered | `neutral/outline/surface/hover` | `text/primary`, Body/sm-regular |

Contrast: the labels pass AA. Active is 16.36 (Light) and 7.58 (Dark) on
its pill. The other tab is 4.76 / 6.96 on the bar. The active pill
against the bar is 1.23 in Light and 2.36 in Dark; the label's colour
and weight also mark the active tab.

**Changed in Figma on 3 Nov 2026** (decision weak-fills; published): the
active Tab 1 / Tab 2 frame's fill is `neutral/tonal/surface/default`
(was `surface/base`, 1.00 / 1.22 against the bar). Code's active tab
follows, and the tabs get Tab Item's Form Hover. One placed instance
(`545:18249`) overrides these fills by hand and keeps its old look.

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
| Tab 1 / Tab 2 | Plain frames, not instances (Tab Item's Style=Form draws the same tab) | TabItem in Style=Form | None: the sets stay apart (fc-buttons-tabs-one-set) |
| Focus | None | 2px `stroke/focused` focus ring | Add a Focus state |
| Hover | Tab 1 / Tab 2 have no Hover | Tab Item's Style=Form Hover | Swap the frames for Tab Item instances, if the sets merge |
| Letter spacing | 0 | GDL's 0.4px | Bind the text styles to the ramp |

Figma gaps the code doesn't copy:

- **The Form page's Molecules section (`510:2701`) is pinned to Semantics
  Dark**, so Form / Tab Navigation (and the section's other molecules)
  show only Dark there. Clear the explicit mode.

### DatePickerDay (29 Oct 2026)

Source: page **Form** (`183:1765`), set `Date Picker / Day` (`456:671`):
State (Default, Today, Selected, Today + Selected, In Range, Outside
Month), with a Day text property. Code: `src/components/date-picker-day/`. Every colour binding is
copied exactly. The Storybook grids check, in Light and Dark and on the
calendar's surface, each state's label colour, its fill, Today's ring,
Today + Selected's Today Mark, the radius and the 36×36 size.

| State | Fill | Stroke | Label | In code |
|---|---|---|---|---|
| Default | none | none | `text/primary` | (no prop) |
| Today | none | 1px inside `stroke/focused` | `text/primary` | `today`, sets `aria-current="date"` |
| Selected | `action/primary/surface/default` | none | `action/primary/content/default` | `selected` |
| Today + Selected | Selected's | the Today Mark: 1px inside `action/primary/content/default`, inset 2px, `radius/4` | `action/primary/content/default` | `today` and `selected`: a `::before` (`inset-0.5 rounded-4 border border-action-primary-content-default`), no `stroke/focused` ring |
| In Range | `neutral/tonal/surface/default` | none | `text/primary` | `inRange` |
| Outside Month | none | none | `text/disabled` | `outsideMonth`, which makes the button `disabled` |

Every state is 36×36 with radius 6, in Body/sm-regular. Day is `children`.

Contrast on the calendar's `surface/elevated` (since 4 Nov 2026; `surface/neutral/faint` before):

| Pair | Light | Dark | Needs |
|---|---|---|---|
| Default and Today, label | 20.17 | 14.63 | 4.5 |
| Today, ring | 6.81 | 5.33 | 3 |
| Selected, label on fill | 6.81 | 4.77 | 4.5 |
| Today + Selected, the Today Mark on the fill | 6.81 | 4.77 | 3 |
| (Today's `stroke/focused` ring on the Selected fill, before 3 Nov) | **1.00** | **1.40** | 3 |
| In Range, label on fill | 16.36 | 7.58 | 4.5 |
| In Range, fill against the panel | 1.23 | 1.93 | (decorative: the ends carry the range) |
| Outside Month, label | **1.42** | **3.75** | exempt: inactive |

- **Outside Month is below AA in both themes.** Code makes these days
  inactive (`disabled`), and WCAG 1.4.3 exempts inactive components, so
  axe passes with no exception. This is a design question.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The radius** of the five variants is bound to `radius/6` (no visual
  change).

**Changed in Figma on 3 Nov 2026** (decisions `weak-fills` and `date-days`
/ `fc-form-today-selected`; published):
- **In Range** fill `surface/base` → `neutral/tonal/surface/default`. Code
  follows (RangeCalendar's in-range days are DatePickerDays).
- **Today + Selected** is a variant: Selected plus the Today Mark. Code
  follows, as a pseudo-element so the focus ring (an outline) still shows
  around a focused day.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Focus, Hover | No such states | 2px `stroke.focused` focus ring with a 2px offset, as on Button; no hover | Add a Focus state, and Hover if wanted |
| States combine | One State each; Today + Selected is its own | `today` adds its ring to In Range too (Figma has no Today + In Range); `outsideMonth` wins over everything | Draw Today + In Range if it should differ |
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
| Panel fill | `surface/elevated` (since 3 Nov 2026, decision menu-surface; `surface/neutral/faint` before) | `bg-surface-elevated` (`calendarSurface`, shared with RangeCalendar) |
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

Contrast on `surface/elevated`, Light / Dark (since 4 Nov 2026):
- Month: 20.17 / 14.63.
- Weekdays: 4.76 / 5.71.
- Carets: 10.35 / 11.87 (3:1 needed).
- Focus ring: 6.81 / 5.33.
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
  Range's Light problem. Since 3 Nov 2026 a Light twin ("Date Ranges ·
  Light", `794:2504`) sits beside it. Calendar's new Show Previous / Show
  Next (default on) are what the single Calendar shows; see RangeCalendar.

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

Contrast: as Calendar. The In Range label on its fill is 16.36 / 7.58.
The In Range fill against the panel is 1.23 / 1.93 (decorative).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, padding and gap** are bound to `radius/12` and `space/8` (no
  visual change).

**Changed in Figma on 3 Nov 2026** (decisions `calendar-nav` and
`weak-fills`; published):
- **Date Picker / Calendar has Show Previous and Show Next** (default on).
  The Range's Month / Start turns Show Next off and Month / End turns Show
  Previous off, instead of silent overrides. Code already shows ‹ on the
  first month and › on the second (the inner months get only `onPrevious` /
  `onNext`), so that departure is gone.
- **In Range** fill → `neutral/tonal/surface/default` (see DatePickerDay).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Size | 642×354 (strokes included in layout) | 640×352 | As Calendar |
| Picking | A static frame | Two picks, in either order. The first shows Selected alone until the second, and Escape drops it. `onChange({ start, end })` gets start on or before end | None needed |
| Across months | Not drawn | A range shows in its own month's grid. The other grid's copies of those days stay Outside Month | None needed |
| Keyboard | (none) | One tab stop across both months (the start, else today, else the first month's 1st). The arrows cross from one month into the other, and the view pages only when the focus leaves both | None needed |
| Today | Not in the frame | `today` gets its ring when it's in view | None needed |

Figma gaps the code doesn't copy: the Date Ranges section's Dark pin (see
Calendar). Since 3 Nov 2026 a Light twin ("Date Ranges · Light",
`794:2504`) shows the Range in Light.

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
  only: FilterSelect (status, payment method, currency) and
  FilterDateRange (period, creation date) put it in a Popover, since 2 Nov
  2026. Popover adds `aria-expanded`, `aria-haspopup` and `aria-controls`.
- **`icon`** is the leading icon, Figma's Icon swap (`Icon#793:49`, since
  3 Nov 2026). Search defaults to `magnifying-glass`, Dropdown to `funnel`.
- **`value`** (Dropdown) and the input's value (Search) are Figma's Value
  text property (`Value#793:38`, since 3 Nov 2026).
- **`label`** (required) is the accessible name. On Search it is the
  input's `aria-label`. On Dropdown it is a visually hidden prefix, so the
  button reads "Status: All Status" and its name contains the visible text.
  A Dropdown given `role="combobox"` (FilterSelect and FilterDateRange,
  since 2 Nov 2026) takes `label` as its `aria-label` and drops the prefix:
  a combobox's text is its value.

| Layer | Binding | Code |
|---|---|---|
| Box fill | `colors/surface/elevated secondary` | `bg-surface-elevated-secondary` |
| Box stroke | 1px inside `colors/stroke/field` (since 2 Nov 2026) | `inset-ring inset-ring-stroke-field` |
| Padding left / right | `24` (Spacings) | `px-6` |
| Gap (Search: icon → query → ×) | `16` | `gap-4` |
| Gap (Dropdown content: icon → value) | `12` | `gap-3` |
| Gap (Dropdown: content → caret) | 16, space-between (the variant's own since 3 Nov 2026) | `gap-4`, `justify-between` |
| Width | Fixed 256 (since 3 Nov 2026) | Fills its container; the bars' slots are `w-64` (256, `FILTER_SLOT`) |
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
| `stroke/field` (border, since 2 Nov 2026; was `stroke/strong`, 2.56 / 2.45 in Light), on the field / on the bar's `surface/neutral/faint` | 4.76 / 4.55 | 6.96 / 6.96 |
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

**Changed in Figma on 3 Nov 2026** (decisions filter-dropdown-packing,
offscale-widths, fc-table-filter-icon, fc-table-filter-bar,
dark-pins-components and fc-table-dark-frames; published; code follows
already, so nothing in code changed):
- **Width:** the three variants are a fixed 256 (they filled the set's 180),
  code's `w-64`. Filter / Bar – Costs' fields are 256 too, and its Filters
  row wraps with `space/12` both ways (5 fields, then Creation Date on a
  second row at 1500), as CostsFilterBar's `flex flex-wrap gap-3` with
  `w-64` slots.
- **Dropdown** packs space-between, with the gap bound to 16, as every
  placed instance had overridden it.
- **Value** (text) and **Icon** (swap; default MagnifyingGlass, preferred
  MagnifyingGlass, Funnel, CreditCard, CurrencyCircleDollar, CalendarBlank,
  ArrowsClockwise) are properties of all three variants. Every Dropdown
  instance that relied on Funnel was set to Icon=Funnel.
- **The Semantics → Dark pins** on Filter / Field, Filter / Bar – Costs,
  Filter / Bar and their Clear Filters instances are cleared. Page=Recurring's
  Clear Filters label and icon are rebound from `text/inverted/primary` to
  `text/primary`, as the Costs bar's.
- The Filters page has Dark frames of Fields and Filter Bars beside the
  Light ones.

The radius needs no fix. It is already GDL's `radius/8`, shown under its
old name `radius-4` because the CAF library hasn't taken GDL's rename (see
TableExpandButton).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Hugs 42px | 40px, as TextInput and SelectTrigger | Fix the height at 40 |
| Dropdown with no value | No such state. The bar's Select Period and Creation Date are Type=Search instances with a calendar icon | Dropdown shows `placeholder` (default: `label`) in `text/subtle` | Swap those instances to Type=Dropdown and add the look (design question) |
| Clear (×) | A 16px icon with no states | A 24px `<button>` named "Clear search" (`clearLabel`). It pulls 4px into the gap and padding, so the glyph sits where Figma puts it. Escape clears too | Add Focus |
| Focus | No Focus state | 2px `stroke.focused` outline, 2px offset, as on Button. It goes on the box when the search input has focus, on the dropdown button, and on × | Add a Focus state |
| Hover, Disabled, Open | No such states | No hover. Native `disabled` only changes the cursor. Open is `aria-expanded` with no visual change | Add them if the screens need them |
| Icon default | One default for the set, MagnifyingGlass; a Dropdown picks Funnel (decision fc-table-filter-icon) | Search defaults to `magnifying-glass`, Dropdown to `funnel` | None needed: Figma has one default per set |
| Long values | No truncation; at 256 Figma's values fit ("All Payment Method" needed 250 of the old 240) | Truncated with an ellipsis | Turn on text truncation |
| Line height, letter spacing | Inter's auto line height (17px), 0 | GDL's Body/sm-regular, 20px and 0.4px | Bind the text style to the ramp |

Figma gaps the code doesn't copy:

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
| Disabled | `neutral/tonal/surface/disabled` (since 3 Nov) | `neutral/tonal/content/disabled` (since 3 Nov) | `Colors/Neutral/300` | the label's colour |

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

**Changed in Figma on 3 Nov 2026** (decision fc-buttons-default-disabled-dark;
published): State=Disabled nests Button / Normal's Default Disabled, which
is now `neutral/tonal/surface/disabled` with a `neutral/tonal/content/disabled`
label (see Button). Code follows through Button. Its caret override was
not updated: see below.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height, icon gap, hover shadow, radius | Button / Normal's (35px hug, raw 10px gap, two raw shadows, remote `radius-4`) | Button's: 36px, `space/8`, `shadow.elevation.2`, `radius/8` | As listed under Button |
| Disabled caret | Still overridden to `action/primary/content/disabled` (white) on the grey disabled fill, while the label is `neutral/tonal/content/disabled` | The label's colour, as in every other state | Bind the Disabled caret to `neutral/tonal/content/disabled`, or clear the override |
| Focus | No Focus state on Button / Menu Trigger (Button / Normal has one since 3 Nov) | Button's 2px `stroke.focused` ring | Add a Focus state |
| The menu | Not part of the component. The description says it opens `Menu / Dropdown` | MenuDropdown, below the button, 4px away and flush with its left edge (`align="right"` for a header's right end). It flips at the viewport's edges. Keyboard and focus return are MenuDropdown's | None needed |
| Open | No such state | `aria-expanded` only, with no visual change | Add an Open state if wanted |

Figma gaps the code doesn't copy: none.

### SelectOption (29 Oct 2026)

Source: page **Form** (`183:1765`), set `Select / Option` (`456:630`):
State (Default, Hover, Active, Selected) with a Label. Code:
`src/components/select-option/`. It is a `<div role="option">` inside a
SelectMenu. It never takes focus: Select keeps focus on its trigger and
points at the option with `aria-activedescendant`. Every colour and type
binding is copied exactly. The Storybook grids force Hover and check each
state's fill, label, check, padding, radius and height in Light and Dark.

| State | Fill | Label | Check |
|---|---|---|---|
| Default | none | `text/primary` | hidden |
| Hover (`:hover`) | `neutral/tonal/surface/default` | `text/primary` | hidden |
| Active (`data-active`, the option the arrow keys are on) | `neutral/tonal/surface/default`, plus the Focus Ring: 2px `stroke/focused` outside, 2px out, `radius/8` (`data-focus-visible`) | `text/primary` | hidden |
| Selected (`selected`, `aria-selected`) | `neutral/tonal/surface/default` | `text/primary` | Phosphor `check`, 16px, `text/primary` |

Every option is Body/sm-regular, with 8 / 12 padding, an 8px gap and
radius 6. It is 36px tall: 8 + GDL's 20px line height + 8, the same as
Figma's fixed 36.

Contrast passes AA:
- Label (`text/primary`) on the menu (`surface/neutral/faint`): 19.28 Light / 17.85 Dark.
- Label on `neutral/tonal/surface/default` (Hover, Active, Selected): 16.36 / 7.58.
- Check, a graphic needing 3:1, `text/primary` on that fill: 16.36 / 7.58.
  (`action/primary/surface/default` there was 5.53 / **1.97**, why Figma
  moved the check to `text/primary`.)
- Focus ring (`stroke/focused`) on the menu: 6.51 / 6.51.

The fill is 1.18 / 2.36 against the menu (it was `surface/base`, 1.05 /
1.22). AA doesn't require a hover fill; the label and the check carry the
state.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, padding and gap** of the three variants are bound to
  `radius/6`, `space/8` / `space/12` and `space/8` (no visual change).

**Changed in Figma on 3 Nov 2026** (decisions `weak-fills`,
`fc-form-check-colour` and `states-code-adds`; published):
- **Hover and Selected** fill `surface/base` → `neutral/tonal/surface/default`.
  Code follows: `hover:` / `data-active:` / `aria-selected:bg-neutral-tonal-surface-default`.
- **The check** `action/primary/surface/default` → `text/primary` (it was
  1.97:1 on the new fill in Dark). Code follows: `text-text-primary`.
- **State=Active** is new: Hover's fill and the Focus Ring, as code drew
  the arrow keys' option.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 280 in the set; Fill in the menu | Fills the menu | None needed |
| Height | Fixed 36 | Hugs: 8 + 20 + 8 = 36 (GDL's Body/sm line height; Figma's label is 17px tall on Inter's auto line height) | Bind the text style's line height to the ramp |
| Letter spacing | 0 | GDL's 0.4px (Body/sm) | As above |
| Active from the pointer | Active always has the Focus Ring | The ring only when the keyboard put the option there (`data-focus-visible`); from the pointer, Hover's fill alone | None needed |
| Selected + Hover | Not drawn | Stays `neutral/tonal/surface/default` | None needed |
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
| Fill | `surface/neutral/faint` | `bg-surface-elevated`, Popover's surface since 3 Nov 2026 (below) |
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

**Changed in Figma on 3 Nov 2026, published 4 Nov** (decision menu-surface): Select / Menu's fill is `surface/elevated`, as code's (Popover's surface). Options on it: `text/primary` 20.17 / 14.63; the active ring 6.81 / 5.33.

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
- Since 2 Nov 2026 the listbox (value, open state, the active option, the
  keys and typeahead) lives in `useSelectListbox`
  (`src/components/select/useSelectListbox.ts`, not exported), which
  FilterSelect shares. Select's behaviour is unchanged.

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
- Tab leaves a popup alone that the dialog opened in a portal (a RowActionsMenu's menu, marked `data-popover-portal`): the popup's own Tab handling closes it and returns focus to its trigger in the dialog (3 Nov 2026).
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
| Glyph | **Icon** instance swap (`Icon#793:20`, default `CalendarBlank` 24), `accent/info/tonal/content/default` | `icon` (default `calendar-blank`), 24px, `accent/info/tonal/content/default` |

**Changed in Figma on 3 Nov 2026** (decision confirm-and-header-props): the glyph is an **Icon** instance-swap property (default CalendarBlank 24). A swapped glyph keeps the tile's content colour (5.60 / 5.72). Code already had `icon`; the IconSwap story on ModalHeader checks it goes through.

**Changed in Figma on 29 Oct 2026** (the library needs publishing):
- **The glyph's fill** (`I348:8269;3167:83758`) was a raw #7EB3F7: 1.78:1
  on the tile in Light, below the 3:1 an icon needs. It's now bound to
  `accent/info/tonal/content/default`, the pairing Modal / Confirm's info
  tile already uses on the same fill.
- **The tile's radius** was a raw 8. It's now bound to `radius/8`.

Contrast (the glyph needs 3:1): 5.60 in Light, 5.72 in Dark. Figma's old raw #7EB3F7 was 1.78 / 4.78.

Code departs from Figma here: nothing since 3 Nov 2026.

### ModalHeader (29 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Header` (`348:8299`), with Title and Description. Payment Schedules (`348:8311`) uses it. Code: `src/components/modal-header/`. Modal / Dialog and Panel / Side Sheet draw their own headers, so ModalDialog and SideSheet don't use ModalHeader.

| Layer | Figma | Code |
|---|---|---|
| Header | Horizontal, centred; padding `space/16` / `space/24`, gap `space/12` | `py-4 px-6 gap-3 items-center` |
| Size | Fixed 512×80 | Fills its container, at least 80 tall (`min-h-20`) |
| Header Icon | `Modal / Header Icon` instance, its Icon swap exposed (since 3 Nov) | `ModalHeaderIcon`; `icon` passes through |
| Title Container | Vertical, gap 0, Fill | `flex-1` column |
| Title | Body/lg-semibold, `text/primary` (Title) | `<h2>` `text-body-lg-semibold text-text-primary` (`title`, `titleId`) |
| Description | Body/sm-regular, `text/subtle` (Description) | `<p>` `text-body-sm-regular text-text-subtle` (`description`, `descriptionId`) |
| Close | `Button / Icon`, Ghost, 32, X 16 (since 2 Nov) | `<IconButton icon="x" label="Close">`, calls `onClose` |

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
| Height | Fixed 80; the text is 39 tall on Inter's auto line height | At least 80; the text is 44 tall on GDL's line heights | None needed |
| Width | Fixed 512 | Fills its container | Set the width to Fill |
| Description | Always shown | Renders only when given | Add Show Description, as Modal / Dialog has |
| Element | n/a | A `<div>`, because a `<header>` could become a second banner landmark | None needed |


**Changed in Figma on 2 Nov 2026** (decisions add-modal-header-actions, icon-buttons-to-button-icon): Modal / Header has **Show Actions** and an Actions slot of Button / Icon (Ghost, 32) instances, such as Audit Logs' refresh (ArrowsClockwise), 4px (`space/4`) before the close button. Its close button is now Button / Icon (Ghost, 32), as code already drew it. Code: `actions`, rendered before the Close IconButton in a `gap-1` group.

**Changed in Figma on 3 Nov 2026** (decision confirm-and-header-props): the nested Modal / Header Icon is an exposed instance, so every Modal / Header shows its **Icon** swap (default CalendarBlank 24). Code already passed `icon` to ModalHeaderIcon; nothing looks different.

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
| Width | Small 384, Medium 576, Large 768 (400 / 560 / 800 until 3 Nov) | `max-w-sm` 384, `max-w-xl` 576, `max-w-3xl` 768; narrower on a small screen |
| Header | Padding 20 / 24, gap 16, Space Between, centred; 1px `stroke/subtle` below | `px-6 py-5 gap-4 justify-between border-b border-stroke-subtle` |
| Title Group | Vertical, gap 4 | `gap-1` |
| Title | Body/lg-semibold, `text/primary` | `<h2>`, same tokens |
| Description | Body/sm-regular, `text/subtle`, hidden by default | `<p>`, same tokens |
| Close | `Button / Icon`, Ghost, 32, X 16 in `text/secondary` (since 3 Nov) | `IconButton icon="x" label="Close"` |
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
| Elevation | Effects/Elevation Dark/4 | `shadow-elevation-4`. Tailwind compiles it to GDL's Light Elevation 4 in both themes, so Dark is a little lighter than Figma until the theme output carries Dark elevation (as on Popover) | None in Figma |
| Height | Hugs; footer 68 with Inter's 35px buttons | Footer 69 (GDL's 36px Button); never taller than the viewport minus 16 on each side; the body scrolls | None needed |
| Show Description default | Off | On whenever there is a description | None needed |
| Focus, keyboard | n/a | Focus moves to the dialog and is trapped; Escape, Close and a backdrop click call `onClose`; focus returns to the opener | None needed |
| Header and footer elements | n/a | `<div>`s, because `<header>` and `<footer>` can become landmarks | None needed |

Figma gaps the code doesn't copy:
- **`_Slot` (`458:338`)** is a placeholder: a dashed `stroke/default` box on `surface/elevated secondary`. It isn't built; Content is `children`.
- **The Description layer is a fixed 213×17,** so a longer description is clipped. Code wraps it.
- **Placed dialogs keep their old widths.** The Patterns – Admin ×9 and Patterns – User ×1 instances carry width overrides from when the screens were built (400 / 560 / 800, Audit Logs 1200). Code's sizes are the component's.

**Changed in Figma on 3 Nov 2026** (decisions modal-widths, icon-buttons-to-button-icon): the widths are 384 / 576 / 768, as code, and the header's Modal / Close Button is swapped for Button / Icon (Ghost, 32, X 16 in `text/secondary`), as code's IconButton. Header heights are unchanged (73). No code change.

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
| Panel | 448 fixed (420 until 3 Nov), padding 24, gap 20, `surface/base`, 1px `stroke/subtle`, `radius/12`, Elevation Dark/4 | `max-w-md p-6 gap-5 bg-surface-base border border-stroke-subtle rounded-12 shadow-elevation-4` |
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
| Elevation | Elevation Dark/4 | `shadow-elevation-4` (see ModalDialog) | None in Figma |
| Role, focus | n/a | `alertdialog`, described by the Message; focus opens on Cancel | None needed |
| Closing | No close button | Escape and Cancel close it; a backdrop click doesn't | None needed |
| Labels | Text overrides on the button instances | `confirmLabel` and `cancelLabel` | Text properties, once Button / Normal has a Label property (decided 3 Nov) |

**Changed in Figma on 3 Nov 2026** (decision modal-widths): the width is 448 (was 420), as code. Its placement on Patterns – Admin follows. No code change.

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

**Changed in Figma on 3 Nov 2026** (decision icon-buttons-to-button-icon): the header's Modal / Close Button is swapped for Button / Icon (Ghost, 32, X 16 in `text/secondary`), as code's IconButton. No code change.

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
| Height | Default 66 (68 until 3 Nov), on Inter's auto line height; Compact 44, as code | Default 70, on GDL's 20px Body/sm and 16px Caption/md line heights | Bind the text styles' line heights to the ramp |
| Letter spacing | 0 | GDL's ramp (0.4px Body/sm, 0.3px Caption/md) | As above |
| Focus | No Focus state | 2px `stroke.focused` ring on the X, as on Button | Add a Focus state |
| Role | None | `role="alert"` for Error and Warning, `role="status"` for Info and Success | None needed |

Figma gaps the code doesn't copy: none since 3 Nov 2026.

**Changed in Figma on 3 Nov 2026** (decisions alert-compact, offscale-spacing, icon-buttons-to-button-icon, dark-pins-showcase; fc-modals-close-slot, fc-modals-stroke-layout): Compact's Message is connected to `Message`, and its top and bottom padding is `space/12` (was raw 10), as code. Show Dismiss now shows Button / Icon (Ghost, 32, X 16 in `text/secondary`) in a 16px slot it overflows by 8px each side, as code's `-m-2`. The strokes are no longer counted in the layout (Default 66, Compact 44). The Feedback page has an "Alerts – Light" frame (`798:17518`) beside the Dark one. No code change.


**Changed in Figma on 2 Nov 2026** (decision add-alert-action): Alert has **Show Action** (default off) and an Action button, Button / Small Style=Text ("Retry"), between the text and the dismiss button, as Toast places its action. Code: `showAction`, `action` (the label) and `onAction`; a `Button variant="text" size="small"`. Its label is `action/tertiary/content/default`: 5.58–8.66:1 on every Type's fill. Figma can't expose the label as an Alert text property (it sits inside a nested Button instance), so designers override it. With the action, Compact is 56px tall in code (53 in Figma: its raw 10 top and bottom vs code's `space/12`).

### Toast (29 Oct 2026)

Source: page **Feedback** (`459:232`), set `Toast` (`459:379`): Type
(Info, Success, Warning, Error) × Action State (Default, Hover), with
Message, Action and Show Action.
Behaviour from **Patterns – Admin**, 12 · Feedback messages (`528:6347`).
Code: `src/components/toast/`: `Toast`, plus `ToastProvider` and
`useToast` (the host, code only). Every colour binding is copied exactly.
Action State is the action's own state: Hover is its `:hover`, the label
in `text/link/hover`. The card is `surface/base` with a 1px inside
`stroke/subtle` and Elevation 3, padding `space/12` / `space/16`, gap
`space/12`, centred. The message is Body/sm-regular in `text/primary`, and the action
Body/sm-semibold in `text/link/default`. The Storybook grids check each
Type with Show Action off and on, with the action hovered (Action
State=Hover) and with the X hovered, in Light and Dark.
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
| Action on hover (`text/link/hover`) | 6.85 | 4.60 |
| Icon: Info / Success / Warning / Error | 6.83 / 7.13 / 4.93 / 8.36 | 8.07 / 10.44 / 11.03 / 7.62 |
| X (`text/secondary`), at rest / on hover | 10.35 / 8.40 | 11.87 / 6.15 |

`stroke/subtle` on `surface/base` is 1.23 / 1.41. It's a decorative edge,
not a control's boundary: the elevation separates the card.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 380 | 384 (`w-sm`), never wider than the screen | Set the width to 384 |
| Effect | `Elevation Dark/3` style in both modes | `shadow-elevation-3`: Tailwind inlines GDL's Light Elevation 3 in both themes, as on Popover | None in Figma; code follows when the theme output carries Dark elevation |
| Action focus | No Focus state | A `<button>` with Button's focus ring | Add a Focus state if wanted |
| Action default | "Undo" | `action` defaults to "Undo"; `showAction` defaults to false | None needed |
| Host | None (pattern 12 describes it) | `ToastProvider` and `useToast` | None needed |

Figma gaps the code doesn't copy: none since 3 Nov 2026.

**Changed in Figma on 3 Nov 2026** (decisions toast-radius, icon-buttons-to-button-icon, toast-action-hover, dark-pins-showcase; fc-modals-toast-action, fc-modals-close-slot, fc-modals-stroke-layout): the radius is bound to `radius/8`; the X is Button / Icon (Ghost, 32, X 16 in `text/secondary`) overflowing its 16px slot, as code's `-m-2`; strokes are no longer counted in the layout (44 tall, as code); a new **Action State** (Default / Hover) gives the action a Hover in `text/link/hover`, colour only; and the Feedback page has a "Toasts – Light" frame (`798:17591`). Code: the action gets `hover:text-text-link-hover`.

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
| Body padding | `space/6` top and bottom, `space/8` at the sides (raw 10 until 3 Nov) | `py-1.5 px-2` (`space/6`, `space/8`) |
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
| Arrow construction | Top: a frame holding a vector. Bottom: a 3-point polygon | One SVG with the same 10×6 geometry, flipped for Bottom | Build both arrows the same way |
| Gap to the target | Not drawn: no screen or pattern places a Tooltip | `space/4` from the arrow tip to the target, as Popover. It is the tooltip's own padding, so the pointer can cross onto it | Add a placed example |
| Width | Hugs one line | Wraps at 256px (`max-w-64`) | Add a maximum width and a wrapping example |
| Behaviour | Static | Opens on hover after 300ms and at once on keyboard focus (`:focus-visible`). Closes on Escape (focus stays on the target), blur and pointer leave. The pointer can move onto it (WCAG 1.4.13). It flips to the other side when there's no room. At the viewport's sides it's nudged back in, 4px from the edge, and the arrow stays on the target (runtime inline offsets, not design values). No portal, so a parent with `overflow: hidden` clips it | None needed |
| Accessibility | None | `role="tooltip"`, and the target gets `aria-describedby`. When closed it's `hidden` but still the target's description. Escape from the target is used by the tooltip, so it doesn't also close a dialog or menu behind it | None needed |
| Focus | No Focus state | None on the tooltip, which is never focusable. The target brings its own focus ring | None needed |

**Changed in Figma on 3 Nov 2026** (decisions text-style-drift, fc-nav-caption-metrics; published): the Caption/md-medium text style has GDL's 16px line height and 0.3px letter spacing (typed on the style; GDL's Figma has no line-height or letter-spacing variables yet). Tooltip Top / Bottom grow from 85 × 33 to 89 × 34, code's size, so the height and letter-spacing departures are gone. No code change.

Figma gaps the code doesn't copy: none since 3 Nov 2026.

**Changed in Figma on 3 Nov 2026** (decisions offscale-spacing, dark-pins-showcase): the side padding is `space/8` (was raw 10), as code, and the Feedback page has a "Tooltips – Light" frame (`798:17680`) beside the Dark section. No code change.

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
| Indicator | `action/tertiary/content/default` (`action/primary/surface/default` until 3 Nov) |

Contrast: the ring is a graphic, so it needs 3:1 (WCAG 1.4.11).

| Pair | Light | Dark |
|---|---|---|
| Indicator on canvas / base | 6.51 / 6.81 | 14.91 / 12.22 |
| Indicator on its track | 5.53 | 6.33 (was **1.97**) |
| Track on canvas | 1.18 | 2.36 |

**Changed in Figma on 3 Nov 2026** (decision spinner-dark; fc-modals-spinner): the indicator is `action/tertiary/content/default`: Light unchanged (the same CAF blue), Dark near-white (#EAEAF1). Code: `stroke-action-tertiary-content-default`.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Drawing | Two arc ellipses | SVG strokes on a 16-unit box: radius 7, width 2 (the same ring: outer 8, inner 6), square ends. It scales with `size` | None needed |
| Motion | Rotates in prototypes only | Tailwind's `animate-spin` (one turn a second), only under `prefers-reduced-motion: no-preference`. Otherwise it stands still. Stories are static | None needed |
| Name | No label | `role="status"` with a visually hidden `label` (default "Loading"), e.g. "Loading export details" | None needed |

Figma gaps the code doesn't copy: none (no pinned modes).

### EmptyState (29 Oct 2026)

Source: page **Feedback** (`459:232`), set `Empty State` (`464:12461`):
Size (Default, Compact) × Title × Description × Show Action × Icon. Pattern 11
places Default in an empty Announcements table and on the 404 page. Code:
`src/components/empty-state/`. `size` is Size, `title` is Title,
`description` is Description, and `action` is Show Action plus its nested
Button (pass the Button, or leave it out). `icon` is the Icon swap (an
Icon name, default `tray`). Compact has no description, action or icon,
and its types don't allow them. Every binding is
copied exactly. The Storybook grids check each part's colour, type style,
size and padding, in Light and Dark.

| Part | Size=Default | Size=Compact |
|---|---|---|
| Layout | Vertical, centred; 48px top and bottom, 24px sides, 12px gap; 480px wide | 24px padding, 6px gap; 480px wide |
| Icon tile | 64×64, `neutral/tonal/surface/default` (`surface/base` until 3 Nov), `radius/full` | 24×24, no fill |
| Icon | **Icon** swap (`Icon#798:6`, default Phosphor Tray 32px), `neutral/tonal/content/default` (`text/subtle` until 3 Nov) | Tray 20px, fixed, `text/subtle` |
| Title | Body/md-semibold, `text/primary` | Body/sm-regular, `text/subtle` |
| Description | Body/sm-regular, `text/subtle`, centred | — |
| Action | `Button / Normal`, Style=Default, Plus icon ("Create Cost") | — |

Contrast: the text passes AA, and the icon passes 3:1.

| Pair | Light (canvas / base) | Dark (canvas / base) |
|---|---|---|
| Title, `text/primary` | 19.28 / 20.17 | 17.85 / 14.63 |
| Description and Compact title, `text/subtle` | 4.55 / 4.76 | 6.96 / 5.71 |
| Icon on its tile (`neutral/tonal/content/default` on `neutral/tonal/surface/default`) | 8.40 | 5.10 |
| Tile on canvas / base (decorative) | 1.18 / 1.23 | 2.36 / 1.93 |
| Compact icon, `text/subtle` | 4.55 / 4.76 | 6.96 / 5.71 |

**Changed in Figma on 3 Nov 2026** (decision empty-state; fc-modals-empty-compact): the Default tile is the neutral tonal pair (fill `neutral/tonal/surface/default`, glyph `neutral/tonal/content/default`; `text/subtle` on the new tile would be 2.96 in Dark), and the set has an **Icon** instance swap (default Tray 32) bound to Size=Default only: Compact's 20px Tray stays fixed. Code: the tile's new bindings, and a new `icon` prop (Default only; default `tray`).

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
| Icon | An Icon swap on the component set, bound to Size=Default only | `icon` on Size=Default; Compact has no `icon` (its types don't allow one) | None needed (fc-modals-empty-compact) |

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
(`456:830`) and `– File Upload` (`184:3085`). Since 3 Nov 2026 each is a
set with State (Default, Error) and an Error text property. Each is a
column with no gap: the Label Row (the `_Form Label`, 20px bottom
padding) and the Input Wrapper, a column `space/8` apart holding the
control (set to Fill) and, under it, the Helper Text (Show Helper + Helper,
hidden by default) or, in State=Error, the Error Text. Code: `src/components/form-field/`. TextField,
SelectField, TextareaField, DateField, ComboboxField and FileUploadField are
FormField around their control.

What code maps:
- Label Row → `label` and `required` (a FormLabel), and `action` beside it
  (Dropdown with Edit's `_Edit Link`), `space/8` from the label.
- Input Wrapper → `children`: the control, full width.
- Show Helper + Helper → `helper` (`FormHelperText`, which is exported for
  groups that build their own fieldset).
- State=Error + Error → `error`: the control's State=Error (it is
  `aria-invalid` and described by the message) and the Error Text in the
  helper's place.
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
| Input Wrapper gap | `space/8`: the message 8 under the control, nothing while it's hidden | `mt-2` on the message |
| Helper Text | `colors/text/subtle`, Caption/md-regular, fills the width and wraps | `text-text-subtle text-caption-md-regular` (`FormHelperText`, a block `<p>`) |
| Error Text (State=Error) | `colors/accent/critical/tonal/content/default`, Caption/md-regular (the Required marker's colour) | `text-accent-critical-tonal-content-default` on the same `<p>` |

`FormHelperText` itself keeps its look and has no margin: FormField adds
`mt-2` and, with `error`, the critical colour. RadioGroup (owned by the
buttons work) uses `FormHelperText` in its own 8px column, so it is
unchanged here.

The Message stories (Light and Dark) and every *Field grid check these:
the label and marker colours, the 20px from the label to the control, the
control's bindings, and the message's colour, type and place, 8px under
the control.

Contrast (Light / Dark):

| Pair | Canvas | Base |
|---|---|---|
| Helper Text, `text/subtle` (4.5:1) | 4.55 / 6.96 | 4.76 / 5.71 |
| Error Text, `accent/critical/tonal/content/default` (4.5:1) | 7.99 / 9.30 | 8.36 / 7.62 |

The label is FormLabel's, and the control's are its own.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **The Label Row's bottom padding** in every Form / Field (Text
  `184:3057`, Dropdown `184:3064`, Dropdown with Edit `184:3074`, Textarea
  `456:810`, Date `456:819`, Combobox `456:831`, File Upload `184:3086`) is
  bound to `space/20`. It was raw 20, so nothing looks different.
- **Dropdown with Edit's label-to-link gap** (`184:3074`) is bound to
  `space/8`. It was raw 8, so nothing looks different.

**Changed in Figma on 3 Nov 2026** (decisions `field-message-spacing` and
`fc-form-error-wording`; published), on all seven Form / Field sets (Text
`793:18796`, Dropdown `793:18931`, Dropdown with Edit `793:19070`, Textarea
`793:18610`, Date `793:19231`, Combobox `793:19298`, File Upload
`793:19800`):
- **The message sits `space/8` under the control** (it was flush, gap 0).
  Code follows: `mt-2`.
- **State=Error and an Error text property**: the control at State=Error
  and the Error Text in `accent/critical/tonal/content/default` (it was
  the grey Helper). Code follows: `error` is shown in that colour. The
  generic default ("This field is required.") stays in Figma; screens
  pass their own messages.
- **Helper Text fills the width and wraps** (it was a fixed 510 × 15), as
  code's block `<p>` does.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Label Row height | 37px: Inter's auto 17px line plus 20 | 40px: GDL's 20px line plus 20 | Bind the label's text style to the ramp |
| Width | Fixed 510 | Fills its container, as every placement does | Set the components to Fill |
| Helper and error | State=Error swaps the Helper for the Error Text | `error` wins over `helper` while both are given | None needed |
| Wiring | Not defined | `htmlFor`, `aria-describedby`, `aria-invalid`, `required` on the control | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **20px from label to control** in every Form / Field, but 8px in Form /
  Repeatable Field (`463:780`).
- **Two pattern instances still write an error into the Helper**
  (Patterns – Admin `523:2702` "Location is required.", `528:6288`):
  they should switch to State=Error. That's a Patterns-page edit.

Figma gaps the code doesn't copy: none. The components pin no mode (the
patterns' "Pattern Slot Content" section is pinned to Dark, which code
doesn't copy).

### FormEditLink (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Edit Link` (`793:18231`): State
(Default `184:3016`, Hover, Pressed, Disabled), with a Label text property
(default "[Edit]") and an invisible "Hit Area (24×24 target)" in each
variant. It is placed only in `Form / Field
– Dropdown with Edit` (Currency, in Form / New Cost and pattern 09). Code:
`src/components/form-edit-link/`.

- Label → `children`, default "[Edit]".
- State → the button's own state: Hover is `:hover`, Pressed is `:active`,
  Disabled is `disabled`.
- Hit Area → a `::before`, 24 high, the label's width but at least 24,
  centred on the label and absolutely placed, so the button hugs its
  label and the label row keeps its height.
- It is a `<button type="button">`: it opens an editor, and never submits
  the form around it. Pass it as a field's `action`.
- Inside a FormField it is named by its own text and the field's label
  (`aria-labelledby`), so it reads "[Edit] Currency". `aria-label` or
  `aria-labelledby` replace that.

| Layer | Figma | Code |
|---|---|---|
| Label, Default | `colors/text/link/default`, Caption/sm-regular | `text-text-link-default text-caption-sm-regular` |
| Hover | `colors/text/link/hover` | `enabled:hover:text-text-link-hover` |
| Pressed | `colors/text/link/pressed` | `enabled:active:text-text-link-pressed` |
| Disabled | `colors/text/disabled` | `disabled:text-text-disabled` |
| Hit Area | No fill or stroke, absolute, 24 high, centred, stretching with the label (26 wide) | `relative`, `before:absolute before:top-1/2 before:left-1/2 before:h-6 before:w-full before:min-w-6 before:-translate-x-1/2 before:-translate-y-1/2` |

The Storybook grids check every state's colour (Hover and Pressed forced),
the type, the focus ring and the target (24 high, at least 24 wide, the
label row as high as one without the link), in Light and Dark. The Target
story presses it 4px under the label; Disabled checks it can't be pressed.

Contrast (Light / Dark):

| Pair | Canvas | Base |
|---|---|---|
| Label, `text/link/default` (4.5:1) | 4.79 / 8.22 | 5.01 / 6.73 |
| Hover, `text/link/hover` (4.5:1) | 6.55 / 5.61 | 6.85 / 4.60 |
| Pressed, `text/link/pressed` (4.5:1) | 9.68 / 6.77 | 10.13 / 5.55 |

Disabled is exempt.

**Changed in Figma on 3 Nov 2026** (decisions `edit-link` and
`fc-form-edit-link`; published):
- **A set with State** Default, Hover, Pressed and Disabled. Code follows
  with `:hover`, `:active` and `disabled`.
- **The 24×24 target** is an invisible Hit Area outside the layout, so the
  button hugs its label and Form / Field – Dropdown with Edit's label row
  stays 17. Code follows with a `::before`, not a `min-h-6` (which would
  grow the row).
- **The description** says it's a button (an action), as built.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Element | Text | `<button type="button">` | None needed |
| Focus | No Focus state | 2px `stroke/focused` outline, 2px offset, as on Button | Add a Focus state |
| Accessible name | "[Edit]" | "[Edit] Currency" inside a field | None needed |
| Line height | Inter's auto line height (12px) | GDL's Caption/sm: 14px | Bind the text style to the ramp |

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
colour and height, and the message (colour, 8px under the input).

Contrast: as FormLabel, FormField and TextInput.

Code departs from Figma as FormField and TextInput do, and here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Required | The marker only | The marker and the input's native `required` | None needed |

TextInput changed with it: inside a FormField it takes the field's id,
message, error and required (`useFormFieldControl`). Its own props win.
Outside a FormField nothing changes.

**Changed in Figma on 3 Nov 2026** (decision `field-message-spacing`;
published): the component is a set (`793:18796`) with State (Default,
Error) and an Error text property, and the message sits `space/8` under
the input. See FormField; code follows there.

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

**Changed in Figma on 3 Nov 2026** (decisions `field-message-spacing` and
`edit-link`; published): Form / Field – Dropdown (`793:18931`) and –
Dropdown with Edit (`793:19070`) are sets with State (Default, Error) and
an Error text property, and the message sits `space/8` under the trigger
(see FormField). Dropdown with Edit's label row stays 17: the `_Edit Link`
target is outside the layout (see FormEditLink).

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
(Default, Filled, Focus, Error, Error + Focus, Disabled) with a Value text property
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
| Default | `surface/elevated secondary` | 1px `stroke/field` | placeholder, `text/subtle` |
| Filled | `surface/elevated secondary` | 1px `stroke/field` | value, `text/primary` |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` |
| Error + Focus | `surface/elevated secondary` | 2px `accent/critical/outline/border/default` | `text/primary` |
| Disabled | `neutral/tonal/surface/disabled` | 1px `neutral/outline/border/disabled` | value or placeholder, `text/disabled` |

Every state is Body/sm-regular (`text-body-sm-regular`) with radius
`radius/8` (`rounded-8`), padding `space/8` / `space/12`, the text
top-left.

Contrast, on the field fill (the same pairs as TextInput):

| Pair | Light | Dark |
|---|---|---|
| Value, `text/primary` (4.5:1) | 20.17 | 17.85 |
| Placeholder, `text/subtle` (4.5:1) | 4.76 | 6.96 |
| Focus stroke, `stroke/focused` (3:1) | 6.81 | 6.51 |
| Error stroke, `accent/critical/outline/border/default` (3:1) | 3.81 | 3.74 |
| Resting stroke, `stroke/field` (3:1) | 4.76 | 6.96 |

Disabled is exempt (as TextInput).

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius and side padding** of all five states are bound to `radius/8`
  and `space/12`, as on `_Text Input`. They were raw 8 and 12, so nothing
  looks different.

**Changed in Figma on 3 Nov 2026** (decisions `input-height`,
`offscale-spacing`, `disabled-look` / `fc-form-disabled` and
`states-code-adds`; published):
- **Top and bottom padding** raw 10 → `space/8`, strokes outside the
  layout. Code was already `py-2`, so that departure is gone.
- **Disabled:** the disabled fill, stroke and text, no opacity, as on
  TextInput. Code follows.
- **Error + Focus** is a state, drawn as code already did.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Fixed 96 | `rows`, 4 by default: 4 × 20 + 8 + 8 = 96. More `rows` make it taller | None needed |
| Resize | "Resize height as needed" (the description) | `rows`, and the native vertical resize handle (`resize-y`). Disabled can't be resized | None needed |
| Letter spacing | 0, auto line height | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp |
| Focus | The Focus state is the 2px stroke | Copied on `:focus`. The browser's outline is hidden, but stays transparent so forced-colours mode still shows a ring | None needed |
| Disabled with a value | Only the placeholder is shown | A value also takes Disabled's `text/disabled` | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke reaches 3:1 since 2 Nov 2026** (`stroke/field`), as
  on TextInput.

Every form input's Disabled (TextInput, SelectTrigger, Textarea, DateInput,
Combobox) is the same since 3 Nov 2026: the disabled tokens, no opacity.

Figma gaps the code doesn't copy:

- **The Additional Inputs section (`510:2704`) pins Semantics to Dark,**
  so it shows `_Textarea`, `_Date Input` and `_Combobox Input` in Dark.
  Since 3 Nov 2026 a Light twin beside it ("Additional Inputs · Light",
  `794:2299`) shows them in Light. The components aren't pinned, and code
  follows the theme.

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
| Helper Text | Caption/md-regular, `text/subtle`, `space/8` under the textarea, hidden by default | `helper`: `text-caption-md-regular text-text-subtle`, `mt-2` |
| Error Text (State=Error) | Caption/md-regular, `accent/critical/tonal/content/default`, `space/8` under the textarea | `error`: the same, in the helper's place |

The Storybook grids check the label, the marker, the 20px label row, the
textarea's bindings and 96px height, and the Helper, in Light and Dark.
SubmitsWithForm checks the browser's own `required` check and the FormData.

Contrast: as FormField and Textarea (above).

**Changed in Figma on 3 Nov 2026** (decision `field-message-spacing`;
published): the component is a set (`793:18610`) with State (Default,
Error) and an Error text property, and the message sits `space/8` under
the textarea. See FormField; code follows there.

Code departs from Figma here: as FormField and Textarea.

Figma gaps the code doesn't copy:

- **The Additional Fields section (`510:2706`) pins Semantics to Dark,**
  as Additional Inputs does. Since 3 Nov 2026 a Light twin
  ("Additional Fields · Light", `794:2431`) sits beside it.

### DateInput (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Date Input` (`455:510`): State
(Default, Filled, Focus, Error, Error + Focus, Disabled, Open, Error +
Open) with a Value text property ("yyyy-mm-dd" since 4 Nov 2026, was "Select date"), a Show Clear boolean
(the Clear Button, Button / Icon Size=32 Ghost with X 16, before the icon)
and a nested `CalendarBlank / Style=Regular, Size=20px` (Icon / Calendar). Its description says it "opens Date Picker / Calendar"
and "A typed or pasted yyyy-mm-dd works as well as picking", and Form /
Field – Date's says "Pair with Date Picker / Calendar for the open state".
Code: `src/components/date-input/`. Since 4 Nov 2026 (decision
`date-input`) it is an `<input role="combobox" aria-haspopup="dialog">`
(TextInput, which is _Text Input with the same bindings) that takes a
typed or pasted date, with Icon / Calendar as the button that opens
Calendar (`456:672`) in a Popover. Before, it was a `<button
role="combobox">` and the date could only be picked.

What code maps:
- Value → `value` / `defaultValue`, the date as `yyyy-mm-dd`: the
  format every placement shows (Starts At 2026-09-01, Period From
  2026-11-01, Period To 2026-11-30, Release Date 2026-08-10), and the text
  the user types. Empty is State=Default and shows `placeholder`
  ("yyyy-mm-dd" by default, Figma's default Value, so the format shows
  before anything is typed). A `value` that isn't a real date counts as
  empty.
- `onValueChange` gets the date as `yyyy-mm-dd`, picked or typed, when it
  changes, and `''` for none. Dates are local calendar days; nothing goes
  through `toISOString()`.
- Focus → `:focus` (typing, as _Text Input). Open shows the same stroke.
- Error → `aria-invalid`, from the prop, the FormField's `error`, or typed
  text that isn't a date (below). Disabled → `disabled`.
- Open → the calendar showing (`open` / `defaultOpen` / `onOpenChange`),
  which sets `aria-expanded` and, while open, `aria-controls`.
- Icon / Calendar → Icon `calendar-blank`, 20px, `text/subtle`
  (`text/disabled` when disabled), 12px from the right, inside the
  calendar's button (see the departures).
- Show Clear + Clear Button → shown by itself for an optional field (not
  `required`) with text (a date, or typed text), while it is enabled and
  the calendar is closed: Figma draws it in Filled, Focus, Error and Error
  + Focus, and not in Default, Open, Error + Open or Disabled. It is an
  IconButton (ghost, 32, `x`, named "Clear date"), a tab stop after the
  field, over the field's right padding, which grows by 32 + 8 while it
  shows (text, `space/8`, button, `space/8`, icon). It clears the text and
  the date (`onValueChange('')`, as a native date input reports none), the
  placeholder comes back and focus returns to the field. Pressing it
  doesn't take focus, so typed text isn't checked on the way.
- `name` → a hidden input carrying the `yyyy-mm-dd` value ("" for none),
  disabled with the field, as Select does. The visible input has no name,
  so typed text is never submitted.
- `required` → `aria-required`, not the native attribute: the browser
  doesn't block the form, and its submit handler checks it, as before.

Typed dates (decision `date-input`, Figma's description since 3 Nov 2026):
- Typed or pasted text is checked on blur, on Enter and when the calendar
  opens, strictly: `yyyy-mm-dd`, a real calendar day ("2026-02-30" and
  "2026-9-1" aren't), spaces around it ignored. Nothing is checked while
  the user types. A paste is checked the same way.
- A date becomes the value (`onValueChange`, when it differs) and shows as
  `yyyy-mm-dd`. Empty text clears the date.
- Anything else stays as typed, so it can be fixed. The field is
  `aria-invalid` (State=Error; Error + Focus while focused) and calls
  `onInvalidChange(true)`; DateField shows "Enter a date as yyyy-mm-dd."
  under it. The field holds no date (`onValueChange('')`), so a form never
  submits a date the field no longer shows. Fixing or clearing the text, or
  picking a day, ends it (`onInvalidChange(false)`).
- A new controlled `value` from outside replaces typed text and its error.
  The field's own `onValueChange('')` coming back as `value` doesn't.
- No `min` / `max`: _Date Input has none, so any real day is accepted.

Behaviour (the WAI-ARIA date picker combobox; the calendar is a non-modal
dialog):
- Closed: ↓ or ↑ (Alt too), Enter while nothing new is typed, or the
  calendar button open the calendar, with focus on the date (else today,
  else the 1st). Typed text is checked first, so a typed date opens the
  calendar on its month. A click in the field (or on its label) is for
  typing and doesn't open it; nor does typing.
- Open: the Calendar's keys (arrows, Home / End, Page Up / Page Down, with
  Shift by year). Enter, Space or a click chooses the day, closes the
  calendar and returns focus to the field. Escape closes without choosing
  and returns focus, with the text as it was. A click outside, or Tab out
  of the calendar, closes it and leaves focus where the user put it. ↓ on
  the field while it is open moves focus into the calendar; typing or a
  click in the field closes it. The calendar button closes it too.
- Enter with new text checks it, and doesn't submit the form or open the
  calendar.
- The calendar is a `role="dialog"` panel named like the field: by its
  `aria-label`, its `aria-labelledby`, or the FormField's label.

Every binding is copied exactly. The Storybook grids check each state's
fill, stroke colour and width, radius, opacity, text (or placeholder)
colour, the icon's colour, size and place, the calendar button (32 × 32,
no fill, not a tab stop, `aria-expanded`), the Clear Button (32,
`text/secondary`, 8px from the text and the icon) where Show Clear applies,
the 40px height, `aria-expanded` and the open calendar (placed below the
field), in Light and Dark. The Open stories check the calendar's surface
and its place under the field. The Typing, Pasting, Invalid date,
Keyboard, Clear, Controlled and SubmitsWithForm stories check typed dates,
and Typed, not a date — Light / Dark checks the Error look they give.

| State | Fill | Stroke (inside) | Text | Icon |
|---|---|---|---|---|
| Default | `surface/elevated secondary` | 1px `stroke/field` | placeholder, `text/subtle` | `text/subtle` |
| Filled | `surface/elevated secondary` | 1px `stroke/field` | value, `text/primary` | same |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` | same |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` | same |
| Error + Focus | `surface/elevated secondary` | 2px `accent/critical/outline/border/default` | `text/primary` | same |
| Disabled | `neutral/tonal/surface/disabled` | 1px `neutral/outline/border/disabled` | `text/disabled` | `text/disabled` |
| Open | `surface/elevated secondary` | 2px `stroke/focused` | placeholder, `text/subtle` | `text/subtle` |
| Error + Open | `surface/elevated secondary` | 2px `accent/critical/outline/border/default` | placeholder, `text/subtle` | `text/subtle` |

The Clear Button is Button / Icon's Ghost 32: no fill (its hover fill is
`neutral/tonal/surface/default`), the X glyph 16 in `text/secondary`.

Every state is Body/sm-regular with radius `radius/8`, side padding
`space/12`, 40 high, the value on the left and the icon on the right,
`space/8` apart. The open calendar draws its own surface
(`surface/elevated` since 4 Nov 2026, 1px `stroke/subtle`, radius 12,
Elevation 3; see Calendar).
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
| Resting stroke, `stroke/field` (3:1) | 4.76 | 6.96 |
| Clear Button glyph, `text/secondary` (3:1), on the field / on its hover fill | 10.35 / 8.40 | 14.48 / 6.15 |

Disabled is exempt. The calendar's pairs are Calendar's and
DatePickerDay's.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, side padding and gap** of all six states are bound to
  `radius/8`, `space/12` and `space/8`, as on `_Text Input` and
  `_Dropdown Input`. They were raw 8, 12 and 8, so nothing looks different.

**Changed in Figma on 3 Nov 2026** (decisions `input-height`,
`disabled-look` / `fc-form-disabled`, `states-code-adds`, `date-input` /
`fc-form-caret-clear` and `descriptions-and-names`; published):
- **Height:** a fixed 40, padding 0, strokes outside the layout (as code).
- **Disabled:** the disabled fill, stroke, text and icon, no opacity. Code
  follows.
- **Error + Focus and Error + Open** are states, drawn as code already did.
- **Show Clear** and the Clear Button are new. Code adds the clear button
  (above).
- **The description** lists all eight states, Show Clear and typed dates.
  Code takes typed and pasted dates since 4 Nov 2026 (decision
  `date-input`), so that departure is gone.

**Changed in Figma on 4 Nov 2026** (decision `date-input`; the user's call
on PR #49, to show the format up front): the Value's default, which is the
placeholder, is "yyyy-mm-dd" instead of "Select date". Code's `placeholder`
defaults to the same, and the patterns no longer pass "Select date".

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Letter spacing | 0, auto line height | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp |
| Focus | The Focus state is the 2px stroke | Copied on `:focus`, as TextInput. The browser's outline is hidden, but stays transparent in forced-colours mode | None needed |
| Disabled with a value | Only the placeholder is shown | A value also takes Disabled's `text/disabled` | None needed |
| Show Clear | A boolean the designer turns on | On by itself: an optional field with text (a date or typed), enabled and closed. No prop | None needed |
| Clear Button | Inside the field's auto layout | Over the input's right padding (an input can't hold one), which grows by 32 + 8 while it shows | None needed |
| Icon / Calendar | An icon (CalendarBlank 20, `text/subtle`), not a button | The calendar's button: 32 × 32 around the glyph, which stays where Figma draws it; no fill or hover look of its own; named "Choose date", `aria-expanded`, not a tab stop (↓ / ↑ open the calendar from the field), like Combobox's Caret Button | Optional, for the user: make it a Button / Icon (Ghost 32) like _Combobox Input's Caret Button. That changes its look (16px glyph in `text/secondary`, a hover fill) |
| Error from typed text | Error is a state the designer sets | The field sets `aria-invalid` itself for typed text that isn't a date; DateField shows "Enter a date as yyyy-mm-dd." | Optional: an example on Form / Field – Date with typed text and that message |
| Open | The field alone, with Focus's stroke | The field plus Calendar in a Popover: below, `space/4` away, flush left. It flips above when there's no room below | Add an open example to Form / Field – Date (the field with Date Picker / Calendar under it) |
| Value | A free text property | `value` as `yyyy-mm-dd`, the format the placements use. The same string is submitted | None needed |
| Semantics | None | An `<input role="combobox">` with `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` while open. The calendar is a named non-modal dialog | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke reaches 3:1 since 2 Nov 2026** (`stroke/field`), as
  on TextInput.

Figma gaps the code doesn't copy:

- **The Additional Inputs section (`510:2704`) pins Semantics to Dark**,
  with a Light twin since 3 Nov 2026 (see Textarea).

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
  `defaultValue` / `onValueChange` as `yyyy-mm-dd`, typed or picked,
  `placeholder`, `disabled`, `open`. Clicking the label puts focus in the
  field, to type (since 4 Nov 2026; it used to open the calendar).
- Show Helper + Helper → `helper`. The error message in the Helper →
  `error`, which makes the field `aria-invalid` and describes it.
- Typed text that isn't a date (DateInput's `onInvalidChange`) → the
  field's own Error Text, "Enter a date as yyyy-mm-dd.", in the Helper's
  place, until it is fixed, cleared or replaced by a pick. While it shows
  it takes the place of `error`, since it says what is wrong with the text
  in the field now.
- The label names the calendar dialog.
- Every other prop, and the ref (the input), go to the DateInput. `name`
  submits the date as `yyyy-mm-dd`. The submit handler checks a required
  date.

| Layer | Figma | Code |
|---|---|---|
| Field | Vertical, gap 0, Fill | FormField: `flex flex-col`, `w-full` |
| Label Row | `_Form Label`, `space/20` bottom padding | FormLabel, `pb-5` (`space/20`) |
| Label | Body/sm-regular, `text/secondary` | `text-body-sm-regular text-text-secondary` |
| Required marker | `accent/critical/tonal/content/default` | the same |
| Input Wrapper | `_Date Input`, Fill, 40 high | DateInput, `w-full`, `h-10` |
| Helper Text | Caption/md-regular, `text/subtle`, `space/8` under the field, hidden by default | `helper`: `text-caption-md-regular text-text-subtle`, `mt-2` |
| Error Text (State=Error) | Caption/md-regular, `accent/critical/tonal/content/default`, `space/8` under the field | `error`: the same, in the helper's place |

The Storybook grids check the label, the marker, the 20px label row, the
field's bindings, icon and height, the Helper and the open calendar, in
Light and Dark. Typed, not a date — Light / Dark checks the typed-text
error (the critical stroke, and the message in
`accent/critical/tonal/content/default`, `space/8` under the field).
SubmitsWithForm checks the required check in the submit handler and the
FormData (`yyyy-mm-dd`, "" for none or for text that isn't a date,
nothing for a disabled field).

Contrast: as FormField and DateInput.

**Changed in Figma on 3 Nov 2026** (decision `field-message-spacing`;
published): the component is a set (`793:19231`) with State (Default,
Error) and an Error text property, and the message sits `space/8` under
the field. See FormField; code follows there. An optional DateField with a
date shows DateInput's clear button (Ends At, in Edit Recurring Cost).

Code departs from Figma here: as FormField and DateInput, plus:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Open | No example | The DateInput's calendar, under the field | Add an open example (see DateInput) |
| Typed-text error | No example; Error's text is a property the designer sets | "Enter a date as yyyy-mm-dd." while typed text isn't a date, over `error` | Optional: an Error example with that text |

Figma gaps the code doesn't copy:

- **The Additional Fields section (`510:2706`) pins Semantics to Dark**,
  with a Light twin since 3 Nov 2026 (see TextareaField).

No range input was built. The Date Ranges section (`510:2708`) holds only
`Date Picker / Range` (the panel), and no form places a range field. The
only range control is the filter bar's Filter / Select Period (Patterns –
Admin, "2026-10-12 – 2026-10-24"), which in code is FilterField with a
RangeCalendar.

### Combobox (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_Combobox Input` (`455:555`):
State (Default, Filled, Focus, Error, Error + Focus, Disabled, Open, Error
+ Open), a Value text property, a nested `MagnifyingGlass /
Style=Regular, Size=20px` (Icon / Search) and the Caret Button (Button /
Icon Size=32 Ghost with CaretDown 16). Figma's
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
- Icon / Search → Icon `magnifying-glass`, 20px, `text/subtle`, 12px in,
  over the input's 40px left padding (12 + 20 + 8). Clicks pass through it
  to the input.
- Caret Button → an IconButton (ghost, 32, `caret-down`, named "Show
  options"), 4px from the right (`space/4`), so its 16px glyph is 12px in,
  over the input's 44px right padding (4 + 32 + 8). A click opens the full
  list without typing, and closes it when open. It is `tabIndex={-1}` (the
  input's ↓ / ↑ do the same), keeps focus in the input, and has
  `aria-expanded`, as in the WAI-ARIA list-autocomplete example.
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
| Default | `surface/elevated secondary` | 1px `stroke/field` | placeholder, `text/subtle` | search `text/subtle`, caret `text/secondary` |
| Filled | `surface/elevated secondary` | 1px `stroke/field` | value, `text/primary` | same |
| Focus | `surface/elevated secondary` | 2px `stroke/focused` | `text/primary` | same |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | `text/primary` | same |
| Error + Focus | `surface/elevated secondary` | 2px `accent/critical/outline/border/default` | `text/primary` | same |
| Disabled | `neutral/tonal/surface/disabled` | 1px `neutral/outline/border/disabled` | `text/disabled` | both `text/disabled` (the caret's is an override) |
| Open | `surface/elevated secondary` | 2px `stroke/focused` | placeholder, `text/subtle` | search `text/subtle`, caret `text/secondary` |
| Error + Open | `surface/elevated secondary` | 2px `accent/critical/outline/border/default` | placeholder, `text/subtle` | same |

Every state is Body/sm-regular, radius `radius/8`, 40px high (Figma: a
fixed 40). The Caret Button is Ghost: no fill, `neutral/tonal/surface/default`
on hover. The list and the
options use SelectMenu's and SelectOption's bindings. Code adds the "No
results" row: Body/sm-regular in `text/subtle`, with an option's 8 / 12
padding and no fill.

The Storybook grids check, for each state in Light and Dark: fill, stroke
colour and width, no opacity, value or placeholder colour, the search icon
(colour, 20px, 12px inset, centred), the Caret Button (32, 4px inset, its
16px glyph 12px in, its colour, disabled with the input), the 40 / 44 text
inset, the height and `aria-expanded` on the input and the button. The
CaretButton story checks the toggle, focus staying in the input, and Tab
skipping the button.
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
| Search icon, `text/subtle` (3:1) | 4.76 | 6.96 |
| Caret glyph, `text/secondary` (3:1), on the field / on its hover fill | 10.35 / 8.40 | 14.48 / 6.15 |
| Focus and Open stroke, `stroke/focused` (3:1) | 6.81 | 6.51 |
| Error stroke, `accent/critical/outline/border/default` (3:1) | 3.81 | 3.74 |
| Resting stroke, `stroke/field` (3:1) | 4.76 | 6.96 |
| "No results", `text/subtle` on `surface/neutral faint` (4.5:1) | 4.55 | 6.96 |

Disabled is exempt.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius, side padding and gap** of all six states are bound to
  `radius/8`, `space/12` and `space/8`, as on `_Text Input` and
  `_Dropdown Input`. They were raw 8, 12 and 8, so nothing looks different.

**Changed in Figma on 3 Nov 2026** (decisions `input-height`,
`disabled-look` / `fc-form-disabled`, `states-code-adds`,
`combobox-matching` / `fc-form-caret-clear` and `combobox-list`;
published):
- **Height:** a fixed 40, padding 0, strokes outside the layout (as code).
- **Disabled:** the disabled fill, stroke, text and icons, no opacity. Code
  follows: the box's `has-disabled:opacity-50` is gone.
- **Error + Focus and Error + Open** are states, drawn as code already did.
- **The caret is its own Caret Button** (Button / Icon Ghost 32), right
  padding `space/4`. Code makes it a toggle IconButton (above).
- **Select / Menu has Content=No results** (an Empty Text row), as code
  draws it, and Select / Option has State=Active.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Layout | Auto layout: icon, Value (Fill), Caret Button, `space/8` gap, `space/12` / `space/4` sides | One `<input>` fills the box. The search icon sits over its left padding (12 + 20 + 8 = 40) and lets clicks through; the Caret Button sits over its right padding (4 + 32 + 8 = 44) | None needed |
| Letter spacing | 0, auto line height | GDL's ramp: 0.4px, 20px | Bind the text style to the ramp (as TextInput) |
| Focus | Focus ("typing") is the 2px stroke | Copied on `:focus`. The browser's outline stays transparent, so forced-colours mode still shows one | None needed |
| Open with a value | Only the placeholder is drawn | The chosen label in `text/primary` | None needed |
| Filtering, keyboard | Not drawn | The WAI-ARIA behaviour above. The active option is Select / Option's State=Active (the ring only when the keyboard put it there) | None needed |
| Empty result | Select / Menu Content=No results | The same row (`emptyText`), plus a status announcement | None needed |
| Long lists | Five rows | Scrolls past `space/256` | See SelectMenu |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke reaches 3:1 since 2 Nov 2026** (`stroke/field`), as
  on TextInput.

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
the label. The Helper (`text/subtle`), or the Error Text in its place
(`accent/critical/tonal/content/default`), is Caption/md-regular,
`space/8` under the input. The grids check these with each
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
| Open | "Pair with Select / Menu" (no open example) | The Combobox's own list | Add an open example |

**Changed in Figma on 3 Nov 2026** (decision `field-message-spacing`;
published): the component is a set (`793:19298`) with State (Default,
Error) and an Error text property, and the message sits `space/8` under
the input. See FormField; code follows there.

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
fill, and the knob's size, fill and position, for all four variants in
Light and Dark.

| Layer | Checked=false | Checked=true | Code |
|---|---|---|---|
| Track (36 × 20, `radius/full`) | `surface/track` | `action/primary/surface/default` | `bg-surface-track checked:bg-action-primary-surface-default`, `rounded-full` |
| Track, Disabled=true | `surface/neutral/medium` | `surface/brand/medium` | `disabled:not-checked:bg-surface-neutral-medium disabled:checked:bg-surface-brand-medium` |
| Knob (16, `space/2` in) | `action/primary/content/default`, at the start | the same, at the end | `bg-action-primary-content-default`, `top-0.5 left-0.5`, `peer-checked:translate-x-4` |
| Knob, Disabled=true | `action/primary/content/disabled` | the same | `peer-disabled:bg-action-primary-content-disabled` |

Contrast (WCAG 1.4.11 wants 3:1 for a control's parts):

| Pair | Light | Dark |
|---|---|---|
| Checked=true track on `surface/canvas` | 6.51 | 4.63 |
| Checked=true track on `surface/base` | 6.81 | 3.80 |
| Knob on the Checked=true track | 6.81 | 4.77 |
| Checked=false track (`surface/track`, since 2 Nov 2026) on `surface/canvas` | 4.55 | 6.96 |
| Checked=false track on `surface/base` | 4.76 | 5.71 |
| Knob on the Checked=false track | 4.76 | 7.16 |
| Focus ring (`stroke/focused`) on `surface/canvas` | 6.51 | 6.51 |

Disabled is exempt: the knob on the track is 1.48 (Light) / 4.76 (Dark)
off and 2.74 / 6.81 on.

**Changed in Figma on 3 Nov 2026** (decisions fc-buttons-disabled and
disabled-look; published): Disabled is drawn with its own colours, not 50%
layer opacity. The off track is `surface/neutral/medium` (was
`neutral/tonal/surface/default` at 50%), the on track `surface/brand/medium`
(was `action/primary/surface/default` at 50%) and the knob
`action/primary/content/disabled`. Code dropped `has-disabled:opacity-50`
and binds the same.

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
| Forced colours | — | `forced-color-adjust: none`, so Windows High Contrast doesn't drop the track's and knob's fills and leave nothing visible | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **Checked=false reaches 3:1 since 2 Nov 2026.** Changed in Figma on
  2 Nov 2026: the off track moved from `neutral/tonal/surface/default`
  (1.18:1 Light, 2.36:1 Dark on the canvas) to the new `surface/track`
  (the table above). On and off tracks are 1.43 / 1.5:1 apart; the knob's
  position still shows the state.

Figma gaps the code doesn't copy: none. No modes are pinned.

### Radio (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Radio` (`457:247`):
State (Deselected, Hover, Selected, Disabled, Error). Code:
`src/components/radio/`. It is a native `<input type="radio">`, so each
state is the element's own: Deselected is unchecked, Hover is `:hover` on
an unchecked, enabled radio, Selected is `checked`, Error is `aria-invalid`
on an unchecked, enabled radio and Disabled is `disabled`. Radios that
share a `name` are one group: the browser gives the arrow keys and one tab
stop. Every binding is copied exactly. The Storybook grids force Hover and
check each state's size, radius, fill, stroke colour and width and the
dot, in Light and Dark.

| State | Fill | Stroke (inside) | Dot |
|---|---|---|---|
| Deselected | `surface/elevated secondary` | 1px `stroke/field` | none |
| Hover | `surface/elevated secondary` | 1px `stroke/focused` | none |
| Selected | `surface/elevated secondary` | 2px `action/primary/surface/default` | 8px, `action/primary/surface/default`, centred |
| Error | `surface/elevated secondary` | 1px `accent/critical/outline/border/default` | none |
| Disabled | `neutral/tonal/surface/disabled` | 1px `neutral/outline/border/disabled` | none |

Every state is 20 × 20 and round (`radius/full`).

Contrast (3:1 for the radio's edge and dot):

| Pair | Light | Dark |
|---|---|---|
| Deselected stroke (`stroke/field`, since 2 Nov 2026; was `stroke/strong`, 2.56 / 2.45 in Light) on the fill | 4.76 | 6.96 |
| Deselected stroke on `surface/canvas` | 4.55 | 6.96 |
| Hover stroke (`stroke/focused`) on the fill | 6.81 | 6.51 |
| Selected stroke and dot (`action/primary/surface/default`) on the fill | 6.81 | 4.63 |
| Error stroke (`accent/critical/outline/border/default`) on the fill | 3.81 | 3.74 |
| Error stroke on `surface/base` | 3.81 | 3.07 |
| Focus ring (`stroke/focused`) on `surface/canvas` | 6.51 | 6.51 |

Disabled is exempt (its stroke is 1.48 / 1.93).

**Changed in Figma on 3 Nov 2026** (decisions fc-buttons-disabled,
disabled-look and radio-group; published). Code follows:
- **Disabled** is drawn with its own colours, not 50% layer opacity: fill
  `neutral/tonal/surface/disabled`, stroke `neutral/outline/border/disabled`
  (was `surface/elevated secondary` and `stroke/strong` at 50%). Code
  dropped `has-disabled:opacity-50`.
- **State=Error** is new: the Deselected radio with the inputs' error
  stroke, for an invalid Radio Group. Code: `aria-invalid` on an
  unchecked, enabled radio (RadioGroup's `error` sets it). It stays while
  hovered, as Text Input's error stays while focused.

**Changed in Figma on 29 Oct 2026** (clear binding fixes; the library needs
publishing):
- **Radius** of all four states is bound to `radius/full`. It was raw 10:
  the same circle at 20px, so nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Focus | No Focus state | 2px `stroke/focused` outline, 2px offset, as on Button and Checkbox | Add a Focus state |
| Disabled + Selected | Not drawn (Disabled is unchecked) | The disabled fill, with the 2px stroke and the dot in `surface/brand/medium`, as Checkbox's Disabled Selected | Add a Disabled Selected state |
| Selected + Hover | Not drawn | Stays Selected | None needed |
| Error + Hover | Not drawn | Stays Error | None needed |
| Forced colours | — | `forced-color-adjust: none`, so Windows High Contrast keeps the inside stroke (a box-shadow) and the dot | None needed |

Figma gaps the code copies exactly. These are for the designer to decide:

- **The resting stroke reaches 3:1 since 2 Nov 2026.** Changed in Figma
  on 2 Nov 2026: Deselected moved from `stroke/strong` (2.56:1 Light) to
  the new `stroke/field`.
- **Error in Dark on `surface/base` is 3.07:1,** just over 3:1.

Figma gaps the code doesn't copy: none. No modes are pinned.

### RadioOption (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Radio Option`
(`457:255`): Selected × Error (Selected=false, Error=true is the third
variant), with a Label text property. Code:
`src/components/radio-option/`. It is a `<label>` around a Radio, so a
click on the text checks it and the text is the radio's accessible name.
`label` is Figma's Label, Selected is the radio's `checked` (or
`defaultChecked`) and Error=true is `aria-invalid` on the radio. Every
other prop, and the ref, go to the radio. The Storybook grids check the
three variants: the label's colour and type, the 8px gap, the alignment
and Error's stroke, in Light and Dark.

**Changed in Figma on 3 Nov 2026** (decision radio-group; published): the
Error variant property, whose Error=true holds Radio's State=Error. Code
passes `aria-invalid` through to the Radio, which draws it; no new prop.

| Layer | Binding | Code |
|---|---|---|
| Radio | `Radio` instance, State=Deselected / Selected / Error | `Radio` |
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
| Disabled | Not drawn | The radio's Disabled; the label unchanged | Add it if the label should dim |
| Hover | Only the Radio's own | Hovering the radio; hovering the label text shows no Hover | Add it if the label should trigger Hover |

Figma gaps the code doesn't copy: none. The Label is connected to the
Label property in both variants, and no modes are pinned.

### RadioGroup (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Form / Radio
Group` (`798:16784`): State (Default `457:294`, Error `798:16777`), an
exposed `_Form Label`, Show Helper, Helper and Error text properties over
three Radio Options (All selected, Admin, User). Create Announcement
(Patterns – Admin 05 and 14) places it as "Target Audience". Code:
`src/components/radio-group/`.

What code maps:
- `_Form Label`'s Label → `label`, rendered with FormLabel as the
  fieldset's `<legend>`; its Required → `required`.
- The Radio Options → `options`, one RadioOption each. A plain string is
  `{ value: s, label: s }`; an option can be `disabled`.
- Each option's Selected → `value` (controlled, `null` for none) with
  `onValueChange`, or `defaultValue`.
- Show Helper + Helper → `helper`.

- State=Error + Error → `error`: the message in the Helper's place, with
  `aria-invalid` on the group and its radios, which draw Radio's Error
  stroke (every option is Radio Option Error=true in Figma).

Code adds what a form needs:
- `required` also sets native `required` on every radio (the browser
  won't submit until one is chosen, and focuses the first) and
  `aria-required` on the group.
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
| Label | `_Form Label`: Body/sm-regular, `text/secondary` | FormLabel: `text-body-sm-regular text-text-secondary` |
| Required marker | `_Form Label`'s, `accent/critical/tonal/content/default` | the same, 2px after the label |
| Options row | Horizontal, `space/24` gap | `flex flex-wrap gap-x-6` (`space/24`) |
| Helper | Caption/md-regular, `text/subtle` | FormHelperText: `text-caption-md-regular text-text-subtle` |
| Error (State=Error) | Caption/md-regular, `accent/critical/tonal/content/default`, in the Helper's place | FormHelperText with `text-accent-critical-tonal-content-default`, as FormField's error |
| Radios (State=Error) | Radio Option Error=true | `aria-invalid` on each radio: Radio's Error stroke |
| Column gap | `space/8` between Label, Options and Helper | 8px (`space/8`): `gap-2`, and `mb-2` on the legend |

Contrast, on `surface/canvas` (and `surface/base`, inside a modal):

| Pair | Light | Dark |
|---|---|---|
| Label, `text/secondary` (4.5:1) | 9.90 (10.35) | 14.48 (11.87) |
| Helper, `text/subtle` (4.5:1) | 4.55 (4.76) | 6.96 (5.71) |
| Error, `accent/critical/tonal/content/default` (4.5:1) | 7.99 (8.36) | 9.30 (7.62) |
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
| Disabled | Not drawn | As above | See the design question |
| Label's line height | Inter's auto (17px) | GDL's 20px | Bind the text style to the ramp |

Figma gaps the code copies exactly. These are for the designer to decide:

- **No Disabled look.** A disabled option shows only its radio's
  Disabled, not a dimmed label.

**Changed in Figma on 3 Nov 2026** (decision radio-group; published):
- **The Label is an exposed `_Form Label`** (Required=false, "Target
  Audience"), the same look; Required is set on it. Code already rendered
  FormLabel.
- **The component became a set with State=Error**: every option shows
  Radio's Error stroke, the Helper is hidden and an Error text
  ("Select an option.") takes its place. Code already put `error` there;
  its radios now show the Error stroke.

Figma gaps the code doesn't copy: none. The Label, Helper and Error are
connected to their properties, and no modes are pinned.

### CheckboxField (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Form / Checkbox
Field` (`457:280`): Checked × Bordered × State (Default, Disabled, Error),
with Label, Required, Description, Show Description and Error properties.
Add New User (Patterns – Admin 05 and 12) places it Bordered as
"Restricted User". Code: `src/components/checkbox-field/`.

What code maps:
- The Checkbox → the existing Checkbox at 16px.
- Label → `label`; Required → `required`; Show Description + Description
  → `description`.
- Checked → the box's `checked` (or `defaultChecked`).
- Bordered → `bordered`.
- State=Error + Error → `error` (new): the message under the description,
  `aria-invalid` on the box (whose border turns critical while unchecked)
  and the card's stroke critical.
- State=Disabled → `disabled` (or a disabled fieldset): the box's Disabled
  look and the text in `text/disabled`.

The whole field is a `<label>`, so a click anywhere on it (the card's
padding included) toggles the box. The label text names the checkbox
(`aria-labelledby`) and the description describes it
(`aria-describedby`). Every other prop, and the ref, go to the native
checkbox: `name`, `value`, `onChange`, `disabled`, `required`. In a form
it submits `name` = `value` ("on") while checked. The Storybook grids
check all twelve variants plus Required (enabled and disabled) and no
description in Light and Dark: the box, the text styles and colours, the
error message, the gaps, and the card's padding, radius and stroke.

| Layer | Bordered=false | Bordered=true | Code |
|---|---|---|---|
| Checkbox | `Checkbox` 16px, Deselected / Selected | the same | `Checkbox` |
| Label | Body/sm-semibold, `text/primary` | the same | `text-body-sm-semibold text-text-primary` |
| Description | Caption/md-regular, `text/secondary`, `space/2` under the label | the same | `text-caption-md-regular text-text-secondary`, `gap-0.5` |
| Gap, box to text | `space/12`, top-aligned | the same | `gap-3` (`space/12`), `items-start` |
| Card | none | `space/16` padding, `radius/8`, 1px inside `stroke/default`; Checked: `stroke/focused` | `p-4 rounded-8 inset-ring inset-ring-stroke-default has-checked:inset-ring-stroke-focused` |
| Required Marker | "*", Body/sm-semibold, `accent/critical/tonal/content/default`, `space/2` after the label | the same | `ms-0.5 text-accent-critical-tonal-content-default` |
| State=Error | Box: the inputs' `accent/critical/outline/border/default` while unchecked; Error text under the description, Caption/md-regular, `accent/critical/tonal/content/default` | Card: `accent/critical/outline/border/default` | Box: Checkbox's `aria-invalid`; message: the shared field message, as on main (`text/subtle`, see below); card: `inset-ring-accent-critical-outline-border-default` |
| State=Disabled | Checkbox Disabled / Disabled Selected; label, marker and description `text/disabled` | Card: `neutral/outline/border/disabled` | `group-has-disabled/checkbox-field:text-text-disabled`; card `has-disabled:inset-ring-neutral-outline-border-disabled` |

Contrast, on `surface/canvas` (and `surface/base`, inside a modal):

| Pair | Light | Dark |
|---|---|---|
| Label, `text/primary` (4.5:1) | 19.28 (20.17) | 17.85 (14.63) |
| Description, `text/secondary` (4.5:1) | 9.90 (10.35) | 14.48 (11.87) |
| Card stroke, `stroke/default` | 1.42 (1.48) | 2.36 (1.93) |
| Checked card stroke, `stroke/focused` | 6.51 (6.81) | 6.51 (5.33) |
| Error box and card stroke, `accent/critical/outline/border/default` | 3.64 (3.81) | 3.74 (3.07) |
| Error message, `accent/critical/tonal/content/default` (4.5:1) | 7.99 (8.36) | 9.30 (7.62) |

Disabled is exempt: `text/disabled` is 1.42–1.48 (Light) and 3.07–3.75
(Dark).

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
| Focus | Checkbox's Focus, not a field State | Checkbox's 2px `stroke/focused` ring on the box | None needed |
| Error message element | A text layer | FormHelperText's type in the critical colour (`text-caption-md-regular text-accent-critical-tonal-content-default`), on a `<span>`: a `<p>` can't sit in the field's `<label>` | None needed |
| Disabled + Error | Not drawn | Disabled wins: the box and card take their disabled colours, the message stays | None needed |

**Changed in Figma on 3 Nov 2026** (decision checkbox-toggle-field-states;
published): a BOOLEAN **Required** (the "*" marker in a Label Row, as
code already drew it) and a VARIANT **State**: Default, Disabled and
Error, with an Error text ("Select this to continue."). The old variants
are State=Default. Code adds `error`, and the disabled text and card
colours; `required` was already there.

Figma gaps the code doesn't copy: none. Label and Description are
connected to their properties in every variant, and no modes are pinned.

### ToggleField (29 Oct 2026)

Source: page **Selection Controls** (`241:5133`), set `Form / Toggle
Field` (`457:293`): Checked × State (Default, Disabled, Error), with
Label, Required, Description, Show Description and Error properties.
Create Announcement (Patterns – Admin 05 and 14) places it as "Active",
checked. Code: `src/components/toggle-field/`.

What code maps:
- Label → `label`; Required → `required`; Show Description + Description
  → `description`.
- The Toggle → a Toggle at the end of the row.
- Checked → the switch's `checked` (or `defaultChecked`).
- State=Error + Error → `error` (new): the message under the description
  and `aria-invalid` on the switch. The toggle has no error look.
- State=Disabled → `disabled` (or a disabled fieldset): the Toggle's
  Disabled=true and the text in `text/disabled`.

The whole field is a `<label>`, so a click on the text flips the switch.
The label text names the switch (`aria-labelledby`) and the description
describes it (`aria-describedby`). Every other prop, and the ref, go to
the native switch: `name`, `value`, `onChange`, `disabled`, `required`. In
a form it submits `name` = `value` ("on") while on. The Storybook grids
check all six variants plus Required (enabled and disabled) and no
description in Light and Dark: the text styles and colours, the error
message, the switch's fill, its place at the row's end and the 16px gap.

| Layer | Binding | Code |
|---|---|---|
| Label | Body/sm-semibold, `text/primary` | `text-body-sm-semibold text-text-primary` |
| Description | Caption/md-regular, `text/secondary`, `space/2` under the label | `text-caption-md-regular text-text-secondary`, `gap-0.5` |
| Text | Fill | `flex-1` |
| Toggle | `Toggle` instance, Checked false / true | `Toggle` |
| Gap, text to switch | `space/16`, centred | `gap-4` (`space/16`), `items-center` |
| Required Marker | "*", Body/sm-semibold, `accent/critical/tonal/content/default` | `ms-0.5 text-accent-critical-tonal-content-default` |
| State=Error | Error text under the description, Caption/md-regular, `accent/critical/tonal/content/default` | The shared field message's style as on main (`text-caption-md-regular text-text-subtle`, see below); `aria-invalid` on the switch |
| State=Disabled | Toggle Disabled=true; label, marker and description `text/disabled` | `group-has-disabled/toggle-field:text-text-disabled` |

Contrast, on `surface/canvas` (and `surface/base`): the label 19.28
(20.17) Light / 17.85 (14.63) Dark, the description 9.90 (10.35) / 14.48
(11.87). The switch's are Toggle's (its Checked=false track reaches 3:1 since 2 Nov 2026).

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
| Error message element | A text layer | `text-caption-md-regular text-accent-critical-tonal-content-default` (8.36 / 7.62) on a `<span>` inside the `<label>` | None needed |

**Changed in Figma on 3 Nov 2026** (decision checkbox-toggle-field-states;
published): a BOOLEAN **Required** (the "*" marker, as code already drew
it) and a VARIANT **State**: Default, Disabled and Error, with an Error
text ("Error message"). The old variants are State=Default. Code adds
`error` and the disabled text colour; `required` was already there.
Disabled's text (`text/disabled`) is exempt from contrast.

Figma gaps the code doesn't copy: none. Label and Description are
connected to their properties in both variants, and no modes are pinned.

### FileUploadZone (29 Oct 2026)

Source: page **Form** (`183:1765`), set `_File Upload Zone` (`793:19709`):
State (Default `184:3022`, Drag-over, Error, Disabled), with Title and
Hint text properties. Form / Field –
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
| Zone | No fill; 1px dashed `stroke/field` stroke inside (dash 6, gap 4, in the layout); `radius/8`; `space/24` padding; `space/8` gap; centred column |
| Icon / Upload | Phosphor FileArrowUp 24px, `text/subtle` (a raw `#E5E5E5` until 29 Oct) |
| Title | Body/sm-regular, `text/secondary` |
| Hint | Caption/md-regular, `text/subtle` |

| State | Figma | Code |
|---|---|---|
| Default | 1px dashed `stroke/field` | `border border-dashed border-stroke-field` |
| Drag-over (files held over the zone) | 2px dashed `stroke/focused` (the zone is 2px taller: 124) | `border-2 border-stroke-focused` (also 2px taller); it wins over Error |
| Error (`aria-invalid`, which FormField's `error` sets) | 1px dashed `accent/critical/outline/border/default` | `border-accent-critical-outline-border-default` |
| Disabled | Title, Hint and icon `text/disabled`; 1px dashed `stroke/subtle` | The same, plus a not-allowed cursor, no dialog, drops ignored, and `aria-disabled` on the zone |
| Focus (keyboard, on the hidden input) | No such state | 2px `stroke/focused` outline, 2px out, as Button's ring |

`aria-disabled` tells assistive tech and axe that the zone's Title and Hint
belong to an inactive control: they are `<p>`s outside the disabled
`<input>`, so without it axe would hold them to 4.5:1. WCAG 1.4.3 exempts
an inactive component's text.

Contrast. The zone has no fill, so it is measured on `surface/canvas` / `surface/base`:

| Pair | Light | Dark |
|---|---|---|
| Title, `text/secondary` (4.5:1) | 9.90 / 10.35 | 14.48 / 11.87 |
| Hint, `text/subtle` (4.5:1) | 4.55 / 4.76 | 6.96 / 5.71 |
| Icon, `text/subtle` (3:1) | 4.55 / 4.76 | 6.96 / 5.71 |
| Focus ring and drag-over stroke, `stroke/focused` (3:1) | 6.51 / 6.81 | 6.51 / 5.33 |
| Error stroke, `accent/critical/outline/border/default` (3:1) | 3.64 / 3.81 | 3.74 / 3.07 |
| Resting stroke, `stroke/field` (3:1) | 4.55 / 4.76 | 6.96 / 5.71 |
| Drag-over against Default, `stroke/focused` vs `stroke/field` | 1.43 | 1.07 (why Drag-over is 2px) |
| Disabled Title, Hint and icon, `text/disabled` | 1.42 / 1.48 | 3.75 / 3.07 |
| Disabled stroke, `stroke/subtle` | 1.18 / 1.23 | 1.72 / 1.41 |

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

**Changed in Figma on 3 Nov 2026** (decisions `upload-and-chip`,
`fc-form-upload-border` and `fc-form-upload-disabled`; published):
- **A set with State** Default, Drag-over, Error and Disabled, as code drew
  them.
- **The resting stroke** `stroke/subtle` (1.23 / 1.41:1) → `stroke/field`
  (4.76 / 5.71 on base), like the inputs. Code follows: `border-stroke-field`.
- **Drag-over is 2px**, so it still stands out from the stronger resting
  stroke (1.07:1 apart in Dark at 1px). Code follows: `border-2
  border-stroke-focused`.
- **Disabled** dims the Title, Hint and icon to `text/disabled` (it was the
  Title alone, in `text/subtle`). The stroke stays `stroke/subtle`. Code
  follows.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Dash pattern | Dash 6, gap 4 | CSS `border-dashed`, with the browser's dash length. CSS can't set the pattern without an SVG border | None needed |
| Width | Fixed 510 (Fill inside the field) | Fills its container (`w-full`) | None needed |
| Height | 122px (124 in Drag-over): Inter's auto line heights (17, 15), strokes in layout | 126px (128 in Drag-over): GDL's 20px and 16px line heights | Bind the text styles to the ramp |
| Focus | No such state | The ring, as above | Add a Focus state (design question) |

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
| Download label: Button's Tonal, `text/brand/strong` on `surface/brand/faint` (since 3 Nov 2026) | 11.08 | 8.07 |

Download's pair is Button's Tonal pair, which passes AA in both themes
since 3 Nov 2026 (Button). The contrast exception and the two "Download
contrast" stories are gone (4 Nov 2026): axe checks every cell. The chip's fill has the same value as `surface/canvas` in both
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
| Label, Required, Helper, error | FormField's (see FormField): the label 20px above the zone, the Helper or the Error Text `space/8` under it |
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
| Error | State=Error: the zone at State=Error and the Error Text | `error`: the Error Text (FormField's) and the zone's critical stroke | None needed |
| Size rejection | Pattern 10 shows only the type message | Whatever `validate` returns | Add the copy (design question) |

**Changed in Figma on 3 Nov 2026** (decisions `field-message-spacing` and
`bulk-upload-overrides`; published): the component is a set (`793:19800`)
with State (Default, Error) and an Error text property, the message
`space/8` under the zone (see FormField). Form / Bulk Upload's field
instances were reset to the component's spacing, so that departure is
gone.

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

**Changed in Figma on 2 Nov 2026** (decisions add-repeatable-field-error,
repeatable-field, field-message-spacing; published by the user):
`Form / Repeatable Field` is now a set (`768:2247`): **State** Default /
Error × **Rows** Default / Minimum / Full, with **Show Helper** + **Helper**
and an **Error** text property. Example: `770:8683`.
- **Label Row**: `_Form Label` in a row with a raw 20 bottom padding, so the
  label sits 20px above the first row, as in every Form / Field. Code: the
  legend's bottom padding is 20 (`pb-5`); it was 8. Placed fields grow 12px
  (the Create Announcement dialog's Features).
- **List**: the rows, then Helper Text (Caption/md-regular, `text/subtle`,
  hidden unless Show Helper) or, in State=Error, Error Text
  (Caption/md-regular, `accent/critical/tonal/content/default`), then the
  Add Button, `space/8` apart. Code: `helper` and `error`, a `<p>` between
  the rows and Add; `error` takes the helper's place.
- **State=Error** sets the empty row's `_Text Input` to State=Error
  (`accent/critical/outline/border/default`). Code: with `error`, the empty
  rows are `aria-invalid` (TextInput draws the critical border), or the rows
  `invalidRows` names. The message describes every row
  (`aria-describedby`), so a form that focuses its first invalid field on
  submit lands on the first offending row.
- **Rows=Minimum**: one row, its Remove recoloured to `text/disabled`.
  **Rows=Full**: five rows, Add Button State=Disabled.

| Layer (2 Nov 2026) | Bound to | In code |
|---|---|---|
| Label Row padding | raw 20 (bottom) | `pb-5` on the legend (`space/20`) |
| Helper Text | Caption/md-regular, `text/subtle` | `helper`: `text-caption-md-regular text-text-subtle` |
| Error Text | Caption/md-regular, `accent/critical/tonal/content/default` | `error`: `text-caption-md-regular text-accent-critical-tonal-content-default` |
| The offending row | `_Text Input` State=Error, stroke `accent/critical/outline/border/default` | TextInput with `aria-invalid` |
| List gap | `space/8` | `gap-2` |

Contrast of the messages (Caption, 4.5:1), on `surface/base` / `surface/canvas`:
Helper `text/subtle` 4.76 / 4.55 (Light), 5.71 / 6.96 (Dark); Error 8.36 /
7.99 (Light), 7.62 / 9.30 (Dark).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Label | `_Form Label` in a Label Row, 20 above the first row (since 2 Nov 2026) | A `<legend>` with 20px bottom padding: a fieldset's legend isn't a flex item. Same 20px | Bind the Label Row's raw 20 to `space/20` |
| Group semantics | None | `<fieldset>` named by the legend. Each input is "<label> <n>" ("Features 2"), each remove button "Remove <label> <n>" (`rowLabel` / `removeLabel` override them, and must when `label` isn't plain text) | None needed |
| Row count | Rows are duplicated instances ("add or remove rows per instance") | The user adds and removes rows; `min` and `max` bound the count | None needed |
| Show Remove | On in every row; Rows=Minimum recolours the glyph to `text/disabled` (Button / Icon has no Disabled) | Hidden at `min` rows (default 0, or 1 when `required`), as before | Open question: add Disabled to Button / Icon, or hide Remove at the minimum as code does |
| Max | Rows=Full: five rows, Add disabled ("You can add up to 5 features." is a guess) | `max`: the add button takes Button's Disabled. No default maximum | Confirm a maximum, if there is one |
| Offending rows | State=Error marks the empty row | The empty rows by default; `invalidRows` names others (a duplicate, say) | None needed |
| Message wording | Error "Enter a feature in every row." (the example: "Enter at least one feature.") | The form's own message; Create Announcement says "Add at least one feature." | Check the wording (open question 4) |
| Required | The marker | The marker, `required` on every row's input (an empty row stops the submit), and one row always stays | None needed |
| Heights | `_Text Input` hugs 39px; Add Button hugs 33px | 40px and 32px, as TextInput and Button | As listed under TextInput and Button |
| Focus | No Focus states | TextInput's 2px `stroke/focused` stroke, and the 2px `stroke.focused` ring of IconButton and Button. Focus moves on add and remove | Add Focus states |
| Description | Reads `an &quot;Add …&quot; button` | Not applicable | Replace the entities with quotation marks |

Figma gaps the code copies exactly. These are for the designer to decide:

- ~~The label sits 8px above the first row~~ and ~~no Helper and no error
  state~~: fixed in Figma on 2 Nov 2026 (above).
- **In Dark, Button / Small Outlined's Disabled** (the full list's add
  button) has a `#d6d8eb` border and label, which looks more prominent
  than the enabled `#6875f5` border.
- **No component properties.** The label, the add label and the row count
  are overrides on nested instances.

Figma gaps the code doesn't copy: none (no pinned modes).

### StatCard (30 Oct 2026)

Source: page **Cards** (`311:2719`), component `Card / Stat` (`387:3593`)
and its private set `_Stat Icon` (`387:3592`, Tone ×4, with an Icon swap).
Card / Stat has Label, Value and Status Indicator (an instance swap of
`_Stat Icon`, exposed on the card, so an instance shows Tone and Icon). It
is nested in both stat rows (`Card / Stat Row – Exports` `387:3601`,
`– Announcements` `389:163`). Patterns – Admin 13 and 14 place those rows
above the Exports and Announcements lists. Code: `src/components/stat-card/`.
`label` is Label and names the card. `value` is Value. The Status
Indicator is `tone` + `icon`. `_Stat Icon` is used only here, so it is part
of StatCard, not a component of its own. The Storybook grids (Tones, Light
and Dark) check the seven cards of the two stat rows, which cover the four
tones:

- the card's fill, edge, radius, padding and gap
- the tile's size, radius and fill
- the glyph's size and colour
- the label's and value's colour and type style
- the card's accessible name

| Figma | Code |
|---|---|
| Card: horizontal, centred; padding `space/24`, gap `space/12`, radius `radius/12`; `surface/base` | `<article>` `flex items-center gap-3 p-6 rounded-12 bg-surface-base` |
| Stroke: 1px `colors/stroke/subtle`, inside, not in the layout | `inset-ring inset-ring-stroke-subtle` |
| Width: fixed 372 | Fills what it is given (`StatRow` shares the row) |
| `_Stat Icon`: 40×40, radius `radius/8`, `accent/<tone>/tonal/surface/default` | `size-10 rounded-8 bg-accent-<tone>-tonal-surface-default`, `aria-hidden` |
| Glyph (`Icon`, a swap; default FileText): Phosphor Regular 24px, `accent/<tone>/tonal/content/default` | `<Icon name={icon} size={24}>` in `text-accent-<tone>-tonal-content-default` |
| Text Group: vertical, gap `space/4`, Fill | `flex min-w-0 flex-1 flex-col gap-1` |
| Label: Body/sm-regular, `text/subtle` | `<p>` `text-body-sm-regular text-text-subtle`; names the article (`aria-labelledby`) |
| Value: Heading/lg-semibold, `text/primary` | `<p>` `text-heading-lg-semibold text-text-primary` |

`_Stat Icon` Tone → `tone`, and the icon each card of the two stat rows picks:

| Tone | `tone` (accent family) | Cards |
|---|---|---|
| Info (default) | `info` | Total Exports (`file-text`), Total Announcements (`bell`), Last Updated (`calendar-blank`) |
| Success | `success` | Completed (`check-circle`), Latest Version (`tag`) |
| Pending | `pending` | Processing (`clock`) |
| Critical | `critical` | Failed (`x-circle`) |

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
| Edge, `stroke/subtle` on the card's `surface/base` / on `surface/canvas` (decorative) | 1.23 / 1.18 | 1.41 / 1.72 |

The `stroke/subtle` edge is a decorative card edge, not a control border,
as on Card / Panel (PanelCard), Breakdown Item and Changelog Entry: the
label and value carry the card's meaning, so WCAG 1.4.11's 3:1 doesn't
apply (decision fc-table-card-edges, 3 Nov 2026).

**Changed in Figma on 30 Oct 2026** (clear binding fixes): `Card / Stat`'s
radius 12, padding 24 and gap 12 are bound to `radius/12`, `space/24` and
`space/12`, and its Text Group's gap 4 to `space/4`. The `_Stat Icon`
variants' radius 8 is bound to `radius/8`. Nothing looked different.

**Changed in Figma on 3 Nov 2026** (decisions stat-card-edge,
stat-card-structure, dark-pins-components, fc-table-card-edges and
fc-table-dark-frames; published):
- **`Card / Stat`** has a 1px inside `stroke/subtle` stroke, out of the
  layout (as Card / Panel), so it stays 372×98. Code adds `inset-ring
  inset-ring-stroke-subtle`.
- **`_Stat Icon`** is Tone (Info, Success, Pending, Critical) × an `Icon`
  swap (default FileText). Its seven content-named Types are gone: Total
  Exports → Info, Completed → Success, Processing → Pending, Failed →
  Critical, and the three Announcements Types were removed. Card / Stat
  exposes it, and the cards in both stat rows set their tone and icon.
- **The Semantics → Dark pins** on `Card / Stat` and `_Stat Icon` are
  cleared: they follow their frame, as code follows the page's theme.
- The Cards page has Dark frames of Stat Foundations and Stat Rows beside
  the Light ones.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Element | A frame | An `<article>` named by its label. The value is a `<p>`, not a heading, though its style is Heading/lg-semibold: as headings, bare numbers would fill heading navigation | None needed (decision stat-card-structure) |
| Width | Fixed 372 | Fills its container | None needed |
| Height | 98 (17px label, 29px value on Inter's auto line height) | 102 (20px and 30px, GDL's ramp) | Bind the text styles' line heights to the ramp |

Figma gaps the code doesn't copy: none.

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

Figma gaps the code doesn't copy: none. The cards no longer inherit a Dark
pin: `Card / Stat`'s was cleared on 3 Nov 2026 (see StatCard), and each card
in the two rows now sets its own Tone and Icon.

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
| Filters: vertical; padding `space/12` / `space/16`, gap `space/6`, radius `radius/8`; `surface/elevated secondary`; 1px `stroke/subtle` inside, not in the layout; hugs | `<dl>` `flex flex-col gap-1.5 rounded-8 bg-surface-elevated-secondary px-4 py-3 inset-ring inset-ring-stroke-subtle` |
| Summary Line: horizontal, gap `space/4` | `<div>` `flex gap-1` |
| Key: Body/sm-semibold, `text/primary` ("Search:") | `<dt>` `text-body-sm-semibold text-text-primary`, rendering `{key}:` |
| Value: Body/sm-regular, `text/secondary` ("All") | `<dd>` `text-body-sm-regular text-text-secondary` |

Contrast: the text passes AA. The box's fill matches what it sits on in
one surface in each theme, so its `stroke/subtle` edge shows where it is.
The edge is decorative, as Card / Panel's (decision fc-table-card-edges):
the title and lines carry the meaning.

| Pair | Light | Dark |
|---|---|---|
| Title, `text/secondary` on canvas / base | 9.90 / 10.35 | 14.48 / 11.87 |
| Key, `text/primary` on `surface/elevated secondary` | 20.17 | 17.85 |
| Value, `text/secondary` on `surface/elevated secondary` | 10.35 | 14.48 |
| Box fill on `surface/base` (a dialog) | 1.00 | 1.22 |
| Box fill on `surface/canvas` | 1.05 | 1.00 |
| Edge, `stroke/subtle` on the box / on `surface/base` / on `surface/canvas` (decorative) | 1.23 / 1.23 / 1.18 | 1.72 / 1.41 / 1.72 |

**Changed in Figma on 30 Oct 2026** (clear binding fixes): `Filter /
Summary`'s gap 8 is bound to `space/8`. Its Filters frame's padding 12 / 16,
gap 6 and radius 8 are bound to `space/12`, `space/16`, `space/6` and
`radius/8`, and `Filter / Summary Line`'s gap 4 to `space/4`. Nothing looked
different.

**Changed in Figma on 3 Nov 2026** (decisions filter-summary-surface,
fc-table-card-edges and dark-pins-showcase; published): the Filters box has
a 1px inside `stroke/subtle` stroke, out of the layout (it stays 105×87), so
it shows on a dialog and on the canvas. Code adds `inset-ring
inset-ring-stroke-subtle`. The Filters page has a Light frame of the
summaries beside the Dark one.

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

Source: page **Table** (`3:1823`), components `Table / Change Diff` (`464:1169`) and `Table / Change Diff Row` (`464:978`; Field, Before, After, Show Before). Pattern 08 opens one under an Audit Logs entry ("View Changes": Status, Unknown → Pending). A deleted record shows a compact Alert instead, as the component's description says. Code: `src/components/change-diff/`. The Storybook stories check the table's semantics and every binding, with a row of each Show Before, in Light and Dark, and a Created entry.

How it maps:
- ChangeDiff is a real `<table>`. Field, Before and After are `<th scope="col">`. Each row's field is a `<th scope="row">`, so a screen reader reads every value with its column and its field. Name it with `aria-label` ("Changes to cost #32430").
- The Row instances → `children`: one `<ChangeDiffRow field before after />` per changed field.
- Before is a `<del>`, struck through, and After an `<ins>`. Each starts with a visually hidden "Removed:" or "Added:" for screen readers that don't announce deletions and insertions. With the visible column headers and the strike, colour is never the only cue.
- Show Before → whether `before` is given. Leave it out for a Created entry, whose fields had no value: the Before cell stays empty, After keeps its column, and the row keeps its height.

| Layer | Figma | Code |
|---|---|---|
| Frame | Vertical, gap 0; `radius/8`; `surface/neutral/faint`; 1px `stroke/subtle` inside | `<table>`, `rounded-8 bg-surface-neutral-faint inset-ring inset-ring-stroke-subtle`, fills its container |
| Header | Padding `space/8` / `space/16`, gap `space/16`; 1px `stroke/subtle` below | `<th>`s, `py-2 pl-4` (the last also `pr-4`), `border-b border-stroke-subtle` |
| Header labels | Field, Before, After: Body/sm-regular, `text/subtle` | Same, fixed text as in Figma |
| Row | Horizontal, centred; padding `space/8` / `space/16`, gap `space/16` | `<tr>`; cells `py-2 pl-4 align-middle`, the last also `pr-4` |
| Field | Fixed 200; Body/sm-semibold, `text/primary` | `w-1/4` of the table; `text-body-sm-semibold text-text-primary` |
| Before box (shown while Show Before is on) | `accent/critical/tonal/surface/default`; 1px `accent/critical/outline/border/default` inside; `radius/6`; padding `space/6` / `space/8` | `<del>`: `bg-accent-critical-tonal-surface-default inset-ring-accent-critical-outline-border-default rounded-6 py-1.5 px-2`, only when `before` is given |
| Before value | Body/sm-regular, `accent/critical/tonal/content/default`, Strikethrough | Same, `line-through` |
| After box | `accent/success/tonal/surface/default`; 1px `accent/success/outline/border/default` inside; `radius/6`; padding `space/6` / `space/8` | `<ins>`: the success tokens, same shape |
| After value | Body/sm-regular, `accent/success/tonal/content/default` | Same; `no-underline` clears the browser's underline |

Contrast, Light / Dark:
- Header labels (`text/subtle` on `surface/neutral/faint`): 4.55 / 6.96
- Field: 19.28 / 17.85
- Before value on its box: 6.85 / 5.22
- After value on its box: 6.49 / 6.46

The boxes' 1px borders are decoration, not control borders. Against the panel they are 3.64 / 3.74 (critical) and 3.08 / 5.55 (success).

**Changed in Figma on 30 Oct 2026** (clear binding fixes): the frame's radius is bound to `radius/8` and the value boxes' to `radius/6`; the header's and row's side padding and gap to `space/16`, and the boxes' top and bottom padding to `space/6`.

**Changed in Figma on 3 Nov 2026** (decisions change-diff and offscale-spacing; published):
- **Before is struck through** (Value: Strikethrough). Code drops `no-underline` from the `<del>` and sets `line-through`.
- **Show Before** (`Show Before#792:19`, default on) hides the Before box, for a Created entry. Code makes `before` optional; the patterns' Created audit entry (#32411) leaves it out, instead of a struck "-".
- **The raw 10s are `space/8`:** the row's and header's top and bottom padding, and the value boxes' sides, as code already had. A row is 47 high (was 51) and the panel 83 (was 91).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Field column | Fixed 200 of 960 | A quarter of the table: 240 at 960, with its 16px gap. GDL has no width scale | None needed (decision change-diff: a proportional column is fine) |
| Row height | 47: the boxes' strokes are in the layout, on Inter's 17px line | 48: the boxes' rings are drawn inside, on GDL's 20px line | Bind the text styles' line heights to the ramp |
| Width | Fixed 960 | Fills its container | Set the width to Fill |
| Header labels | Fixed text | Fixed text | None needed |
| Removed / added in text | Colour, column and the strike | Also `<del>` / `<ins>`, each led by a visually hidden "Removed:" / "Added:" | None needed |

Figma gaps the code doesn't copy:
- **Frame 1 and Frame 2** (`453:12898`, `453:12902`) wrap each box in a vertical frame with a `space/8` gap and a single child. They are the `<td>`s; the gap does nothing.

### PaymentRow (30 Oct 2026)

Source: page **Modals** (`299:3301`), set `Modal / Payment Row` (`348:8298`): Status (Done `348:8278`, Upcoming `348:8288`), Date, Subtitle and Amount. It nests `Modal / Status Icon` (`348:8258`) and, since 3 Nov 2026, a `Tag` for the status. Payment Schedules places five. Code: `src/components/payment-row/`. The Storybook grids check both statuses against every binding, in Light and Dark.

How the Figma properties map:
- Status → `status`: `done` (default) or `upcoming`.
- Date → `date`. Subtitle → `subtitle`. Amount (`Amount#793:13`, default "USD 900") → `amount`; left out, nothing renders for it.
- Status Icon is part of the row, not a component of its own. Only Payment Row places it, in the library and on both Patterns pages.
- The status (`348:8286`, `348:8296`) is a Tag, Show Icon off: Status=Completed "Done" or Status=Warning "Upcoming" → `<Tag status="completed" | "warning" showIcon={false}>`.
- The icon is decorative (`aria-hidden`): the Tag says the status in text.

| Layer | Figma | Code |
|---|---|---|
| Frame | Horizontal, centred; padding and gap `space/12`; 460 wide, hugs 60 | `flex items-center p-3 gap-3`; fills its container, hugs its height (60) |
| Fill, edge | `surface/canvas`; 1px inside, `accent/success/outline/border/default` (Done) or `accent/warning/outline/border/default` (Upcoming); `radius/8` | `bg-surface-canvas inset-ring` + the status's border colour; `rounded-8` |
| Status Icon | 36×36 circle (`radius/full`), `accent/<success or warning>/tonal/surface/default` | `size-9 rounded-full`, same fill |
| Its glyph | 24px CheckCircle (Done) / Clock (Upcoming), `accent/<status>/tonal/content/default` (raw #31C48D / #FBBF24 until 30 Oct) | `check-circle` / `clock`, 24px, `accent/<status>/tonal/content/default` |
| Text Content | Vertical, gap 0, Fill | `flex-1 flex-col` |
| Date | Body/sm-regular, `text/primary` | Same |
| Subtitle | Caption/md-regular; `text/subtle` (Done), `accent/warning/tonal/content/default` (Upcoming) | Same, per status |
| Amount | Body/sm-semibold, `text/primary`, hugs, between Text Content and Status | `text-body-sm-semibold text-text-primary whitespace-nowrap` |
| Status | `Tag`, Show Icon off: Completed "Done" / Warning "Upcoming" (Label/sm-medium, 4 / 12 padding) | `<Tag status="completed" / "warning" showIcon={false}>` |

Contrast, Light / Dark:
- Date on `surface/canvas`: 19.28 / 17.85
- Subtitle, Done (`text/subtle`): 4.55 / 6.96
- Subtitle, Upcoming (warning content on canvas): 4.71 / 13.46
- Amount on `surface/canvas`: 19.28 / 17.85
- Tag, Done (Completed): 6.49 / 6.46. Tag, Upcoming (Warning): 4.59 / 6.53
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
| Width | Fixed 460 (Fill in the modal) | Fills its container | Set the width to Fill |
| Amount | Always shown | Renders only when given | None needed |

Figma gaps the code doesn't copy: none since 3 Nov 2026.

**Changed in Figma on 3 Nov 2026** (decisions payment-row, offscale-spacing, dark-pins-components; fc-modals-payment-amount, fc-modals-deprecate): a new **Amount** text property and text (Body/sm-semibold, `text/primary`) between the date block and the status; the status is a Tag (Show Icon off) instead of Modal / Status Badge, which is marked deprecated; the padding is `space/12` (was raw 13); the row hugs at 60 (was fixed 62); the Semantics → Dark pins are cleared. Code: the new `amount` prop and the Tag. The Recurring Costs patterns pass each cost's amount per payment ("USD 900").

### PaymentSchedules (30 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Payment Schedules` (`348:8311`), with no properties. Pattern 03's "View" action (Patterns – Admin) and pattern U04 (Patterns – User) open it from Recurring Costs. Code: `src/components/payment-schedules/`. It is built on Overlay and ModalHeader, as the Overlay stories had sketched it. The Storybook stories render it open in Light and Dark, and test Close, Escape and focus return, and a list long enough to scroll.

How it maps:
- The `Modal / Header` instance → ModalHeader. Its Title ("Payment Schedules") → `title`, its Description ("Upcoming and processed payments") → `description`, and its tile's glyph → `icon`. The defaults are Figma's.
- The Payment Row instances → `children`: one `<PaymentRow>` per payment. Code lists them in a `<ul>`, one `<li>` each.
- `open`, `onClose`, `dismissible`, `initialFocusRef` and `returnFocusRef` are Overlay's. The dialog is named by the title and described by the description.

| Layer | Figma | Code |
|---|---|---|
| Panel | Vertical, gap 0; `surface/base`; `radius/12`; 1px inside `stroke/subtle` (strokes included in layout); Effects/Elevation Dark/4; clips content | `flex flex-col overflow-hidden bg-surface-base rounded-12 border border-stroke-subtle shadow-elevation-4`, as ModalDialog |
| Width | Fixed 512 | `w-full max-w-lg` (512), narrower on a small screen |
| Header | `Modal / Header` (`348:8299`) | `ModalHeader` |
| Rows Container | Vertical; padding 0 / `space/24` / `space/24` / `space/24`, gap `space/8` | `px-6 pb-6`, a `<ul>` with `gap-2`; scrolls (and is a tab stop) when the rows are taller than the viewport |
| Rows | `Modal / Payment Row` ×5, Fill | `PaymentRow`s |

Contrast, Light / Dark on `surface/base`: Title 20.17 / 14.63, Description 4.76 / 5.71, Close glyph 10.35 / 11.87 (see ModalHeader). The rows are as PaymentRow. The panel's edge (`stroke/subtle`, 1.23 / 1.41 on the panel) and the shadow set it apart from the scrim; they are decorative.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Behaviour | A static frame | Overlay's portal, focus trap, Escape and backdrop click, inert page, scroll lock, focus return | None needed |
| Height | Hugs: 438 for five rows | Hugs, never taller than the viewport minus 16 on each side; the rows scroll | None needed |
| Rows container | A frame | A `<ul>` of `<li>`s | None needed |
| Elevation | Effects/Elevation Dark/4 | `shadow-elevation-4`: GDL's Light Elevation 4 in both themes (see ModalDialog) | None in Figma |

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing; nothing looks different, and code already uses these tokens):
- The panel's radius (raw 12) is bound to `radius/12`.
- The Rows Container's padding (raw 24) is bound to `space/24`, and its gap (raw 8) to `space/8`.
- The Done rows' Status Icon fill override is reset (see PaymentRow).

Figma gaps the code doesn't copy: none since 3 Nov 2026.

**Changed in Figma on 3 Nov 2026** (decisions overlay-surfaces, dark-pins-components): the panel has Modal / Dialog's edge and elevation, a 1px inside `stroke/subtle` and Elevation Dark/4, and the Semantics → Dark pins on it and its rows are cleared. Code: `border border-stroke-subtle shadow-elevation-4`.

### VersionBadge (30 Oct 2026)

**Deprecated (3 Nov 2026, decision version-badge).** Show a release version as `<Tag status="info" showIcon={false}>`, as the Announcements table and, since 3 Nov, ChangelogHeader do. Figma's `Modal / Version Badge` is kept with a "Deprecated" description and has no placements left; code keeps `VersionBadge` exported, marked `@deprecated`, until a major release removes it.

Source: page **Modals** (`299:3301`), component `Modal / Version Badge` (`359:10826`), with Version. Until 3 Nov 2026 Modal / Changelog Header placed it next to the date. Code: `src/components/version-badge/`. Version is `children`. The badge is plain text with no states.

**It isn't a Tag.** Tag Status=Info, which the Announcements table uses for its version column, has the `accent/info/tonal` fill and Label/sm-medium. The badge has a `surface/base` fill and Body/sm-semibold. Only the text colour is the same.

| Layer | Figma | Code |
|---|---|---|
| Badge | Horizontal, centred; padding `space/4` / `space/12`; `radius/full` | `py-1 px-3 rounded-full` |
| Fill | `surface/base` | `bg-surface-base` |
| Version | Body/sm-semibold, `accent/info/tonal/content/default` | `text-body-sm-semibold text-accent-info-tonal-content-default` |

Contrast, Light / Dark: the version text on its fill is 6.83 / 8.07. On the dialog's new `surface/base` the pill would vanish (1.00), one reason for the decision.

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

Contrast, Light / Dark, on `surface/base` (the dialog, since 3 Nov 2026) and on `surface/neutral/faint` (the card):
- Text: 20.17 / 14.63 in the dialog, 19.28 / 17.85 on the card
- Dot: 7.13 / 10.44 in the dialog, 6.82 / 12.74 on the card. It's decorative, because the list says "bullet".

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

Contrast, Light / Dark, on the dialog's `surface/base` (since 3 Nov 2026): section title 20.17 / 14.63. For the items, see BulletItem.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing): the gap (raw 12) is bound to `space/12`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Hugs | Fills its container | None needed |
| Semantics | n/a | The title names the `<ul>` | None needed |

Figma gaps the code doesn't copy: none.

### ChangelogHeader (30 Oct 2026)

Source: page **Modals** (`299:3301`), component `Modal / Changelog Header` (`359:10835`), with Title and Date. It nests `Modal / Changelog Icon` (`359:10822`) and, since 3 Nov 2026, a `Tag` Status=Info for the version (`359:10843`). Modal / Changelog places it. Code: `src/components/changelog-header/`.

How the Figma properties map:
- Title → `title`, an `<h2>`. Pass `titleId` and point the dialog's `aria-labelledby` at it.
- Date → `date`.
- The Version Tag's label ("v2.5.6", an override) → `version`. Without it, no Tag renders.

**Changelog Icon** appears only here, so it's drawn inline and isn't a component of its own. It's decorative (`aria-hidden`).

| Layer | Figma | Code |
|---|---|---|
| Header | Vertical, gap `space/16`, hugs 186 | `flex-col gap-4`, fills its container |
| Changelog Icon | 48×48 frame, Phosphor RocketLaunch 48px, `accent/critical/tonal/content/default` | `<Icon name="rocket-launch" size={48}>` `text-accent-critical-tonal-content-default`, `aria-hidden` |
| Title | Title/md-bold, `text/primary`, Fill, wraps | `<h2>` `text-title-md-bold text-text-primary` |
| Metadata Row | Horizontal, centred, gap `space/12` | `flex items-center gap-3`, wrapping |
| Date | Body/sm-regular, `text/secondary` | `<p>` `text-body-sm-regular text-text-secondary` |
| Version | `Tag` Status=Info, Show Icon off | `<Tag status="info" showIcon={false}>` |

Contrast, Light / Dark, on the dialog's `surface/base`:
- Title: 20.17 / 14.63
- Date: 10.35 / 11.87
- Version (Tag Info label on its fill): 5.60 / 5.72
- Rocket: 8.36 / 7.62 (it was 2.76 / 4.69 in `accent/red/medium`). It's decorative, but now passes 3:1 anyway.

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing): the header's gap (raw 16) is bound to `space/16` and the Metadata Row's (raw 12) to `space/12`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Hugs (186) | Fills its container, as the dialog's instance does | None needed |
| Metadata Row | Never wraps | Wraps on a narrow width | None needed |
| Date and version | Always shown | Each renders only when given | None needed |
| Title height | Inter's auto line height | GDL's 28px Title/md line height | Bind the text style's line height to the ramp |
| Element | n/a | A `<div>`, because a `<header>` could become a second banner landmark | None needed |

Figma gaps the code doesn't copy: none since 3 Nov 2026.

**Changed in Figma on 3 Nov 2026** (decisions changelog-colours, version-badge, dark-pins-components): the rocket is `accent/critical/tonal/content/default` (was `accent/red/medium`, 2.76:1 in Light), the Date `text/secondary` (was `text/subtle`), the version a Tag Status=Info with Show Icon off (was Modal / Version Badge, now deprecated), and the Changelog Icon's Semantics → Dark pin is cleared. Code: `text-accent-critical-tonal-content-default`, `text-text-secondary` and `<Tag status="info" showIcon={false}>`.

### ChangelogEntry (30 Oct 2026)

Source: page **Cards** (`311:2719`), component `Card / Changelog Entry` (`464:12396`), with Title, Meta and Show New. It nests `Tag` Status=Info and `Modal / Bullet Item`. Patterns 14 and U07 list one per release on the Changelog page. Code: `src/components/changelog-entry/`.

How the Figma properties map:
- Title → `title`, an `<h2>`. `headingLevel` moves it without changing the look.
- Meta → `meta` ("Version 2.5.6 • August 10, 2026").
- Show New → `showNew`. It defaults to false, as in Figma (since 3 Nov 2026). The Changelog sets it on the latest release only.
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

**Changed in Figma on 30 Oct 2026** (clear binding fixes): the card's radius (raw 8) is bound to `radius/8`, the Header's and Notes' padding (raw 16 / 20) to `space/16` and `space/20`, the Title Group's gap (raw 2) to `space/2` and the Notes' gap (raw 6) to `space/6`. Nothing looked different.

**Changed in Figma on 3 Nov 2026** (decisions changelog-entry-show-new and dark-pins-showcase; published): Show New (`Show New#464:28`) defaults to false, so a new entry shows no New tag; placed entries kept their values (the newest on both Patterns pages still shows New). Code's `showNew` defaults to false too. The Cards page has a Light frame of the Changelog cards (Show New off and on) beside the Dark one.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 640 | Fills its container | Set the width to Fill |
| Header gap | 0 (Space Between) | 16 between the title group and the New tag, so a long title never touches it | Set the gap to `space/16` |
| Height | Inter's auto line heights (header 69) | GDL's line heights (header 75) | Bind the text styles' line heights to the ramp |
| Semantics | n/a | An `<article>` named by its `<h2>` title; the notes are a `<ul>` | None needed |

Figma gaps the code doesn't copy: none. The component pins no mode. The Cards page shows it in Dark and in Light.

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
| Panel | Vertical, padding `space/32`, gap `space/24`; `radius/12`; `surface/base`; 1px inside `stroke/subtle` (not in the layout); Effects/Elevation Dark/4; fixed 500 | `p-8 gap-6 rounded-12 bg-surface-base inset-ring inset-ring-stroke-subtle shadow-elevation-4`, `max-w-lg` (512), narrower on a small screen; scrolls if taller than the viewport |
| Header | `Modal / Changelog Header`, Fill, no overrides | `ChangelogHeader` |
| Release Notes | `Modal / Release Notes`, Fill | `ReleaseNotes` |
| Modal Actions | Horizontal, gap `space/16`; two Fill buttons | `grid gap-4 @sm:grid-cols-2`: two equal columns, stacked when the panel is under 384 inside |
| View Change Log | `Button / Normal`, Style=Default | `<Button>`, calls `onViewChangeLog` |
| Got It | `Button / Normal`, Style=Outlined | `<Button variant="outlined">`, calls `onClose` |
| Scrim | the "Overlay" frame on the pattern pages | `Overlay`, `surface/overlay` |

Contrast, Light / Dark, on `surface/base`:
- Title and notes: 20.17 / 14.63
- Date (`text/secondary`): 10.35 / 11.87
- Version (Tag Info): 5.60 / 5.72
- View Change Log label on its fill: 6.81 / 4.77
- Got It label: 6.81 / 12.22
- Got It border: 6.81 / 3.80
- Rocket: 8.36 / 7.62 (decorative)
- The panel's edge, `stroke/subtle` on the panel: 1.23 / 1.41 (decorative, as ModalDialog's)

**Changed in Figma on 30 Oct 2026** (clear binding fixes; the library needs publishing): the panel's padding (raw 32), gap (raw 24) and radius (raw 16) are bound to `space/32`, `space/24` and `radius/16`, and the Modal Actions' gap (raw 16) to `space/16`. Nothing looks different.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 500 | Capped at 512 (`max-w-lg`, the nearest container width; GDL has no width scale) | Resize to 512, or bind to a width scale |
| Elevation | Effects/Elevation Dark/4 | `shadow-elevation-4`. Tailwind compiles it to GDL's Light Elevation 4 in both themes (as on ModalDialog) | None in Figma |
| Actions on a phone | Always side by side | Stacked under 384 inside the panel (a container query), so "View Change Log" isn't cut | None needed, or add a narrow variant |
| Button height | 35, on Inter | 36 (GDL's Button) | As Button |
| Close | No close button | Got It, Escape and a backdrop click call `onClose`; focus moves into the dialog, is trapped there and returns to the opener | None needed |
| Height | Hugs | Never taller than the viewport minus 16 on each side; the panel scrolls | None needed |

Figma gaps the code doesn't copy: none since 3 Nov 2026.

**Changed in Figma on 3 Nov 2026** (decisions overlay-surfaces, changelog-colours, version-badge, dark-pins-components): the panel has Modal / Dialog's surface: `surface/base` (was `surface/canvas`), `radius/12` (was 16), a 1px inside `stroke/subtle` (none before) and Elevation Dark/4 (was Dark/2). Its header instance has no overrides left (the Date is the header's own `text/secondary`), and the Semantics → Dark pins are cleared. Code: `rounded-12 bg-surface-base inset-ring inset-ring-stroke-subtle shadow-elevation-4`; the date override is gone. The stroke isn't counted in Figma's layout, so code draws it as an inset ring and the content stays 32px in (the ledger's `border` would move it 1px).
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
  `aria-current="page"`. Its label is semibold, and its Indicator is a
  pseudo-element: `::after` under the label on a horizontal link,
  `::before` at the row's left edge on a vertical one.
- State=Hover is `:hover`. An Active link has no hover look, because
  Figma has no Active + Hover state.
- The Label is `children`.
- It is an `<a href>`. A router link goes in `as`
  (`<NavLink as={RouterLink} to="/costs">`), which receives the classes,
  `aria-current` and every other prop.

| Orientation | State | Fill | Label | Indicator |
|---|---|---|---|---|
| horizontal | Default | none | `text/primary`, Body/sm-regular | none |
| horizontal | Hover | `neutral/tonal/surface/default` | `text/primary`, Body/sm-regular | none |
| horizontal | Active | `neutral/tonal/surface/default` | `text/primary`, Body/sm-semibold | 2px at the bottom, 12 in from each side (under the label), `action/primary/surface/selected`: `after:absolute after:inset-x-3 after:bottom-0 after:h-0.5` |
| vertical | Default | none | `text/secondary`, Body/md-medium | none |
| vertical | Hover | `surface/neutral/faint` | `text/primary`, Body/md-medium | none |
| vertical | Active | `surface/base` | `text/primary`, Body/md-semibold | 2px at the left edge, 8 in from the top and bottom, `action/primary/surface/selected`: `before:absolute before:inset-y-2 before:left-0 before:w-0.5` |

Horizontal links have 8 / 12 padding and radius 6, at 36 high. Vertical
links have 8 / 12 padding and radius 6, at 40 high, and fill their
container's width. The Storybook grids force Hover and Focus with
pseudo-states and check, per state, the fill, label colour,
`aria-current`, type, the Indicator (its colour, size and place, and none
off Active), height, padding, radius and focus ring, in Light and Dark.

Contrast: every label passes AA, as does the focus ring.

| Pair | Light | Dark |
|---|---|---|
| Horizontal Default, `text/primary` on the canvas / `surface/base` | 19.28 / 20.17 | 17.85 / 14.63 |
| Horizontal Hover and Active, `text/primary` on `neutral/tonal/surface/default` | 16.36 | 7.58 |
| Vertical Default, `text/secondary` on the menu's `surface/neutral/base` | 10.35 | 16.36 |
| Vertical Hover, `text/primary` on `surface/neutral/faint` | 19.28 | 17.85 |
| Vertical Active, `text/primary` on `surface/base` | 20.17 | 14.63 |
| Focus ring, `stroke/focused` on the canvas / the menu | 6.51 / 6.81 | 6.51 / 7.36 |
| Horizontal Indicator, `action/primary/surface/selected` on the Active fill / the header's `surface/neutral/faint` band | 8.73 / 10.28 | 3.07 / 7.22 |
| Vertical Indicator, on the row's `surface/base` / the menu's `surface/neutral/base` | 10.76 / 10.76 | 5.92 / 8.16 |

The Active fill against what surrounds it is still below 3:1, but the
Indicator now marks the current link at 3:1 or more in both themes (the
closest is 3.07 on the Active fill in Dark), with the semibold label and
`aria-current`. `action/primary/surface/default` would be 1.97:1 on the
Active fill in Dark, which is why Figma uses `selected`.

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
| Height | 33 (horizontal), 35 (vertical): Figma's labels are 17 and 19 high | 36 and 40, from GDL's 20px Body/sm and 24px Body/md line heights | Bind the text styles to the ramp |
| Indicator | A 2px rectangle layer, absolutely placed (constraints Left & Right / Bottom, and Left / Top & Bottom) | A pseudo-element on the link, the same place and size | None needed |
| Letter spacing | 0 | GDL's ramp (0.4px on Body/sm), so "Recurring Costs" is 136px (Figma 130) | Bind the text styles to the ramp |
| Focus | No Focus state | 2px `stroke/focused` outline, 2px offset, as on Button | Add a Focus state |
| Active + Hover | Not drawn | Active keeps its look on hover | None needed |
| Name | Two component sets | One NavLink with `orientation` | None needed |

**Changed in Figma on 3 Nov 2026** (decisions nav-active, offscale-spacing,
fc-nav-underline, fc-nav-indicator-size, dark-pins-showcase; published):
- **State=Active** of both sets: the label is Body/sm-semibold (Nav Link,
  `446:11505`) and Body/md-semibold (Nav Link – Vertical, `462:806`), and
  each has a new 2px "Indicator" in `action/primary/surface/selected`:
  under the label on Nav Link (`792:17145`), at the left edge on Nav Link
  – Vertical (`792:17185`). Code: `text-body-sm-semibold` /
  `text-body-md-semibold` and the `after:` / `before:` bars above.
- **Nav Link – Vertical** (`462:801`, `462:803`, `462:805`): the top and
  bottom padding is bound to `space/8` (it was raw 10), as code already
  drew it, so that departure is gone. Figma's rows are 35 high.
- A Light showcase frame (`793:18395`) now shows Nav Link – Vertical, the
  Mobile Header, the Mobile Menu, Theme Toggle and Account Menu in Light,
  beside the Dark-pinned "Account, Theme & Mobile" section.

Figma gaps the code doesn't copy:

- **Nav Link – Vertical's section is still pinned to Semantics Dark**
  ("Account, Theme & Mobile"). The Light frame beside it (`793:18395`)
  shows the Light bindings.

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

Contrast: as in NavLink. The bar has no fill of its own. In Figma's
header it sits on the Navigation Area's `surface/neutral/faint` (#F8FAFC
in Light, #0F172A in Dark, since 3 Nov; `surface/base` before, raw
#212737 until 30 Oct).

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
- It is IconButton size 40, Ghost (Button / Icon, whose description names it for the theme button). Figma binds its glyph to `text/secondary`, Ghost's colour, so code adds no override.
- Its accessible name says what a click does: "Switch to light theme" in Dark, "Switch to dark theme" in Light (`THEME_TOGGLE_LABELS`). Pass `aria-label` to translate it. UserActions adds the tooltip.

The grids check each variant's glyph, glyph colour, fill at rest and on Hover, size, radius and name in Light and Dark. The Controlled story tests pointer, Enter and Space, and checks that the document's theme is untouched. The Focus story checks the ring.

| Layer | Figma | Code |
|---|---|---|
| Frame | 40×40, `radius/8`, no fill, no stroke | IconButton size 40: `size-10 rounded-8` |
| Glyph | Moon (Dark) / Sun (Light), Phosphor Regular 20px, fill `text/secondary` | `moon` / `sun`, 20px, IconButton Ghost's `text-text-secondary` |
| Hover | None | Button / Icon Ghost's `neutral/tonal/surface/default` fill |
| Focus | None | 2px `stroke/focused` outline, 2px offset |

Contrast (the glyph and the ring are graphics, 3:1):

| Pair | Light | Dark |
|---|---|---|
| Glyph `text/secondary` on `surface/canvas` | 9.90 | 14.48 |
| Glyph on `surface/base` (pattern 12's tooltip reference) | 10.35 | 11.87 |
| Glyph on the header's `surface/neutral/base` | 10.35 | 16.36 |
| Glyph on the hover fill `neutral/tonal/surface/default` | 8.40 | 6.15 |
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
| Name | None | "Switch to light theme" / "Switch to dark theme" | None needed |
| Behaviour | Pattern 15: switches right away and remembers | Controlled: reports the theme asked for; the app switches and stores it | None needed |

**Changed in Figma on 3 Nov 2026** (decisions user-actions, fc-nav-theme-toggle, dark-pins-showcase; published): both variants' glyphs (`I462:785;3167:72312`, `I462:789;3167:72816`) are bound to `colors/text/secondary`, Button / Icon Ghost's glyph colour, instead of `text/primary`. Code drops its `text-text-primary` override and keeps IconButton Ghost's `text-text-secondary`, so that departure is gone. Theme Toggle now also sits in User Actions (`4:262`) and both Mobile Header variants (`793:17752`, `793:17756`), and is exposed through Top Bar and Header, so a placed header sets its Theme (code's `theme`).

Figma gaps the code doesn't copy:
- **The frame holding the set on the Navigation page ("Account, Theme & Mobile") is still pinned to Semantics Dark** (mode `1:2`). The component itself pins nothing, and the Light frame beside it (`793:18395`) shows both variants in Light.

### AccountMenu (30 Oct 2026)

Source: page **Navigation** (`3:368`), `Navigation / Account Menu` (`462:793`), with no properties. Its rows are Item / Manage Currencies, Item / Settings, a Divider and Item / Logout (Menu / Item, all Type=Default). Pattern **15** (`530:7799`) draws it under the account icon at the top right. Pattern **U06** (`545:23189`) says what each row does: Manage Currencies opens a dialog, Settings is its own page, and Logout signs out. Code: `src/components/account-menu/`.
- It is a MenuDropdown with Figma's fixed rows. `onSelect` gets `'manage-currencies'`, `'settings'` or `'logout'`.
- The default trigger is the header's account icon. That is Navigation / Icon Button as IconButton size 40, Ghost, with the 20px `user` glyph in Ghost's `text/secondary`, named "Account", and that name also names the menu. `trigger` replaces it (MobileMenu's Account Row does).
- The menu opens below the icon, flush with its right edge (`align="right"` by default).

Keyboard: as MenuDropdown, and the arrows skip the divider. The Keyboard story tests open (Enter, Space, ↓, ↑), the arrows, Home / End, Escape and Tab, and focus return. The Open stories check the panel, labels, Settings on Hover, the divider, the icon at rest and on Hover, the auto layout and the placement in Light and Dark.

| | Figma | Code |
|---|---|---|
| Surface | `surface/elevated` fill, 1px inside `stroke/subtle`, `radius/8`, Effects/Elevation Light/3, `space/6` padding | Popover's surface, through MenuDropdown |
| Layout | Vertical auto layout, `space/2` spacing, rows Fill | `flex flex-col gap-0.5`; rows `w-full` |
| Width | Fixed 256 (220 until 3 Nov) | `min-w-64` (256), wider for a longer label |
| Items | Menu / Item ×3, Type=Default: `text/primary` Body/sm-regular, 8 / 12 padding, radius 6 | MenuItem ×3 (Logout is not `destructive`) |
| Divider | 1px rectangle filled `stroke/subtle`, Fill width | `<div role="separator">` with `border-t border-stroke-subtle` |
| Trigger | Navigation / Icon Button: 40×40, User 20px, the glyph `text/secondary` | IconButton size 40, Ghost: `user` 20px, `text-text-secondary`, Ghost's hover |
| Placement | Under the icon with no gap; its right edge 8px in from the icon's | `space/4` below, flush right (Popover's, as pattern 03) |

Contrast:
- Labels: as MenuItem, `text/primary` 20.17 / 14.63 at rest and 16.36 / 7.58 on Hover.
- Trigger glyph (`text/secondary`): as ThemeToggle, 9.90 / 14.48 on the canvas, 10.35 / 16.36 on the header and 8.40 / 6.15 on its hover fill.
- Focus ring: 6.81 / 5.33 on the panel.
- Divider: `stroke/subtle` on `surface/elevated` is 1.23 (Light) and 1.41 (Dark). It separates groups; it is not a control boundary, so WCAG 1.4.11 doesn't apply.

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
| Placement | No gap, 8px in from the icon's right edge | `space/4` gap, flush right | None needed |
| Item height, letter spacing | As Menu / Item: 33px, 0 | As MenuItem: 36px, GDL's 0.4px | As MenuItem |
| Name | None | The trigger's "Account" names the button and the menu | None needed |

Figma gaps the code doesn't copy:
- **The frame holding it on the Navigation page ("Account, Theme & Mobile") is pinned to Semantics Dark** (mode `1:2`). The component itself pins nothing. Clear the frame's explicit mode.


**Changed in Figma on 3 Nov 2026** (decisions menu-surface, elevation-dark-3, offscale-widths): the panel's fill is `surface/elevated` (was `surface/neutral/faint`), its effect Elevation Light/3 (was Dark/3) and its width 256 (was 220), as code already drew it. Code: the panel is Popover's surface, now `bg-surface-elevated`; the trigger is unchanged here.

**Changed in Figma on 2 Nov 2026** (decision add-account-menu-changelog, U07): a **Changelog** row (Menu / Item, Type=Default, no icon, like the others) after Settings, before the divider and Logout. Code: `ACCOUNT_MENU_ITEMS` gains `{ item: 'changelog', label: 'Changelog' }`; `onSelect('changelog')` asks the app to open the what's-new dialog (ChangelogModal).

**Changed in Figma on 3 Nov 2026, the trigger** (decisions user-actions, fc-nav-glyph-size, fc-nav-mobile-account, fc-nav-account-row; published):
- Navigation / Icon Button (`4:235`) draws User 20px (it was 24) in `text/secondary` (it was `text/primary`), Button / Icon Ghost's colour. Code's default trigger drops its `text-text-primary` override and keeps Ghost's `text-text-secondary`; the 20px glyph was already code's. Both trigger departures are gone.
- Mobile Header's Account (`793:17776`, `793:17782`) is Button / Icon 40 Ghost with User 20 in `text/secondary`: the same default trigger.
- Pattern 15 step 3 opens Navigation / Account Menu from the Mobile Menu's Account Row (`793:18612`). MobileMenu passes the row as `trigger` (see MobileMenu).

### UserActions (30 Oct 2026)

Source: page **Navigation** (`3:368`), `Navigation / User Actions` (`4:259`), with no properties of its own: Navigation / User Greeting, Navigation / Theme Toggle (exposed, so its Theme shows on a placed header) and Navigation / Icon Button with the User glyph. It is a horizontal auto layout, centred, with `space/8` between the items. Its description is "Greeting + theme toggle + account icon buttons". Patterns **15** and **U08** say the same: "Hi, {name}", the theme toggle (give it a tooltip) and the account icon (pattern U06). Code: `src/components/user-actions/`.
- `username` goes to UserGreeting.
- `theme` and `onThemeChange` go to a ThemeToggle in a Tooltip that shows the toggle's name, below it (the header sits at the top of the page).
- `onAccountSelect` goes to AccountMenu, whose trigger is the account icon.
- It is a plain group, not a landmark: the header's `<header>` banner holds it.

The stories cover pointer and keyboard use (Tab order, the tooltip, the menu's arrows, Escape and focus return). States Light / Dark checks colours, Hover, glyphs, the 8px gaps, centring and 40px height. Menu open Light / Dark checks the open account menu's surface and placement.

| | Figma | Code |
|---|---|---|
| Layout | Horizontal auto layout, centred, `space/8` between, Hug (170 wide) | `flex items-center gap-2` |
| Greeting | Navigation / User Greeting | UserGreeting |
| Theme | Navigation / Theme Toggle, Theme=Dark, exposed | ThemeToggle (`theme`), in a Tooltip (`placement="bottom"`) |
| Account | Navigation / Icon Button, User 20, `text/secondary` | AccountMenu's trigger, which opens Navigation / Account Menu |

Contrast: as its parts (UserGreeting, ThemeToggle, AccountMenu). The tooltip is as Tooltip.

**Changed in Figma on 30 Oct 2026** (the library needs publishing): both
icon buttons' glyphs follow Navigation / Icon Button's new `text/primary`
binding (see AccountMenu). The first button is still a User icon: swapping
it for Navigation / Theme Toggle changes what the component shows, so it
is a design question, not a binding fix.

**Changed in Figma on 3 Nov 2026** (decisions user-actions,
fc-nav-user-actions-gap, fc-nav-theme-toggle, fc-nav-glyph-size;
published):
- The first icon button (`4:262`) is Navigation / Theme Toggle, Theme=Dark
  (it was a second User icon), and it is exposed through Top Bar and
  Header, so a placed header sets its Theme. Code already rendered
  ThemeToggle there, with `theme`.
- Item spacing is bound to `space/8` (it was 0), between every item. Code:
  `gap-2`.
- Both glyphs are 20px in `text/secondary` (see ThemeToggle and
  AccountMenu). Code drops the `text-text-primary` overrides.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Tooltip | None in the component; patterns 15 and U08 ask for one | Tooltip with the toggle's name, below it | None needed (wording is a design question) |

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
- Wordmark (`text/primary`): 20.17 / 20.17
- Greeting and glyphs (`text/secondary`, since 3 Nov): 10.35 / 16.36
- Glyphs on hover (`neutral/tonal/surface/default`): 8.40 / 6.15
- Focus ring (`stroke/focused`): 6.81 / 7.36

User Actions is exposed in Top Bar since 3 Nov (fc-nav-theme-toggle), so a
placed header lists its Theme Toggle; code passes `theme` through.

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
- The menu closes when a link or an account item is chosen, and when the screen widens past 768px.
- `navLabel` names the `<nav>` (default "Main").
- `username`, `theme`, `onThemeChange` and `onAccountSelect` go to TopBar and MobileHeader / MobileMenu. The theme is controlled; nothing here changes the document.

| Layer | Figma | Code |
|---|---|---|
| Frame | Vertical, no gap, fixed 1920, hugs 124; `surface/neutral/base` | `<header>` (the banner), `bg-surface-neutral-base` |
| Top Bar Area | Fixed 72 high, padding 0 / 192, centred; `surface/neutral/base` | `px-6 py-3` around the 48px TopBar (72), `bg-surface-neutral-base` |
| Navigation Area | Fixed 52 high, padding 0 / 192, left, centred; `surface/neutral/faint` | `px-6 bg-surface-neutral-faint`; the NavBar's 8 / 0 padding around 36px links makes the 52 |
| Content width | 1536, from the 192px sides of the 1920 frame | A centred `container` in each row: 1536 at 1920 and wider, as Figma; at each smaller breakpoint, that breakpoint's width, inside 24px gutters |
| Nav Bar | Header – User: a Navigation / Nav Bar instance. Header – Admin: a "Navigation Bar" frame laid out the same | NavBar with one NavLink per link |
| Below 768px | Navigation / Mobile Header + Mobile Menu – Admin | `md:hidden` MobileHeader; MobileMenu in a portal |

Contrast, Light / Dark:
- Top bar: as TopBar.
- Links (`text/primary` on `surface/neutral/faint`): 19.28 / 17.85
- Active link (`text/primary` on `neutral/tonal/surface/default`): 16.36 / 7.58
- Active Indicator (`action/primary/surface/selected` on the Active fill / on the band): 8.73 / 3.07 and 10.28 / 7.22
- Focus ring on `surface/neutral/faint`: 6.51 / 6.51

The Navigation Area (`surface/neutral/faint`) under the Top Bar Area (`surface/neutral/base`) is 1.05:1 in Light (#F8FAFC under #FFFFFF) and 1.13:1 in Dark (#0F172A under #020617). The bands are decorative surfaces, not a contrast requirement; decision fc-nav-band chose `faint` over `subtle` (1.10 / 1.95).

**Changed in Figma on 3 Nov 2026** (decisions nav-active, fc-nav-band,
dark-pins-components, fc-nav-theme-toggle, fc-nav-glyph-size; published):
- **Navigation Area** of Navigation / Header (`4:306`) and all fifteen
  Header – Admin and Header – User variants: `colors/surface/base` →
  `colors/surface/neutral/faint`. Code: `bg-surface-neutral-faint`.
- **The Semantics Dark pin is cleared** on both sets and all fifteen
  variants. Every placed instance sits in a Dark frame, so no screen
  changes; the library page shows them in Light too. Code always followed
  the page's theme, so that gap is gone.
- **Top Bar is exposed** in every header, and User Actions in Top Bar, so a
  placed header sets Theme Toggle's Theme: code's `theme`. The account
  glyph is 20px, as code draws it. No component change.

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

Figma gaps the code doesn't copy: none on the components since 3 Nov. The CAF Design screens' Settings page fakes the active link with a fill override on Nav Link / Bulk Upload, so those six headers show the fill without the semibold label and Indicator; setting the header's Page there fixes it (the screens are read-only from here).

### MobileHeader (30 Oct 2026)

Source: page **Navigation** (`3:368`), set `Navigation / Mobile Header` (`462:850`): Menu Open=false (`462:808`) and Menu Open=true (`462:829`). Its description: "Header below 768px: logo, theme, account and a hamburger. Menu Open=true swaps the hamburger for a close icon." Code: `src/components/mobile-header/`.

How Figma maps:
- Menu Open → `menuOpen`.
- The menu button → IconButton size 40, `list` "Open menu" or `x` "Close menu". It is a disclosure: `aria-expanded` is `menuOpen`, and `aria-controls` comes from `menuId`. A click calls `onMenuOpenChange(!menuOpen)`.
- Theme → ThemeToggle (`theme`, `onThemeChange`) in a Tooltip with its name, as pattern 15 asks for the icon-only toggle.
- Account (Button / Icon 40 Ghost, User 20) → AccountMenu, whose default trigger is the same button (`onAccountSelect`).
- `menuButtonRef` lets MobileMenu focus ✕.

| Layer | Figma | Code |
|---|---|---|
| Variant | Fixed 375 wide, hugs 64; padding `space/12` / `space/16`; Space Between, centred; `surface/neutral/base` | `flex items-center justify-between px-4 py-3 bg-surface-neutral-base`, full width, 64 high |
| Logo | Navigation / Logo at 92 × 36 | `<Logo className="h-9" />` |
| Actions | Horizontal, gap `space/8`, centred | `flex items-center gap-2` |
| Theme | Navigation / Theme Toggle, Theme=Dark; Moon 20, `text/secondary` | ThemeToggle (IconButton 40 Ghost, `text-text-secondary`) in a Tooltip |
| Account | Button / Icon, Size=40, Tone=Ghost; User 20, `text/secondary` | AccountMenu's trigger (IconButton 40 Ghost `user`, `text-text-secondary`) |
| Open Menu / Close Menu | 40 × 40 frame; List 24 / X 24, `text/secondary` | IconButton 40 Ghost `list` / `x` (20px glyph), `text-text-secondary` |
| Hover | Theme and Account: Ghost's, as instances. Open / Close Menu: none | IconButton Ghost's: `neutral/tonal/surface/default` fill |

Contrast, Light / Dark (on `surface/neutral/base`):
- Glyphs (`text/secondary`, since 3 Nov): 10.35 / 16.36
- Glyphs on hover (on `neutral/tonal/surface/default`): 8.40 / 6.15
- Focus ring (`stroke/focused`): 6.81 / 7.36

**Changed in Figma on 3 Nov 2026** (HANDOFF open item 3, decisions
user-actions, fc-nav-mobile-account, fc-nav-theme-toggle; published), both
variants:
- **Theme** (`793:17752`, `793:17756`) is a Navigation / Theme Toggle
  instance, Theme=Dark (it was a detached frame with a Moon).
- **Account** (`793:17776`, `793:17782`) is Button / Icon, Size=40,
  Tone=Ghost, with User 20 (it was a detached frame with a User).
- **Every glyph is `text/secondary`**, Ghost's colour, Open / Close Menu's
  too (`I462:826;3167:104584`, `I462:847;3167:101704`). Code drops the
  menu button's `text-text-primary` override, as ThemeToggle's and the
  account trigger's.
- **Padding and gap** are bound to `space/12`, `space/16` and `space/8`,
  the values code already used.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Menu glyph | List / X at 24, in detached 40 × 40 frames | 20, IconButton 40's glyph | Design question (mobile-header-glyph): keep 24 (then Button / Icon needs a 24px option) or swap for `Button / Icon` Size=40 |
| Width | Fixed 375 | Full width | None needed |
| Hover, focus | Open / Close Menu: none (detached frames) | IconButton's hover fill and `stroke/focused` ring | Comes with the swap above |
| Tooltip | None | The theme toggle's name, below it | None needed (pattern 15 asks for it) |
| Element | n/a | A `<div>`: AppHeader's `<header>` is the banner | None needed |

Figma gaps the code doesn't copy:
- **The "Account, Theme & Mobile" section (`511:1155`) is pinned to Semantics Dark,** and the mobile screens in patterns 15 and U08 are too. The code follows the page's theme. The Light frame beside the section (`793:18395`) shows both variants in Light, with the sun.

### MobileMenu (30 Oct 2026)

Source: page **Navigation** (`3:368`), component `Navigation / Mobile Menu – Admin` (`462:851`): "Open mobile navigation for admins: header with close, the 10 admin links (one Active), and the account row. Swap link labels for the user app." Pattern 15 step 3 (`530:7793`) places it at the top of a 375 × 812 screen. U08 asks for a Mobile Menu – User that doesn't exist yet. Code: `src/components/mobile-menu/`.

How Figma maps:
- Mobile Header (Menu Open=true) → MobileHeader `menuOpen`, with ✕ asking `onClose`.
- Links → `links` and `page` (the Active link), as on AppHeader, rendered as NavLink `orientation="vertical"` (or by `renderLink`).
- Account Row → AccountMenu's `trigger`: a full-width `<button>` with the User glyph and `username`, which opens Navigation / Account Menu below it (`onAccountSelect`), as pattern 15 step 3 draws it.
- Its open state → `open`. It asks `onClose` on ✕, Escape, a tap on the scrim, a chosen link (pattern 15: "Choosing a link or tapping ✕ closes it") or a chosen account item.

It is a modal dialog on Overlay (as SideSheet is): portal, `aria-modal`, named "Menu" (`aria-label`). Focus opens on ✕, where ☰ was, and Tab / Shift+Tab wrap inside; the Account Row is the last stop. The page behind is inert and its scroll is locked. Escape closes an open account menu first. Focus returns to ☰.

The Account Row's menu is AccountMenu with `portal`, `align="left"` and `label="Account"`: it renders on `document.body`, so the panel's own scroll (`overflow-y-auto`) doesn't cut it off, and it sits over the scrim. Its left edge is 16 in from the row's (`ml-4`), under the glyph, as pattern 15 places it; it opens `space/4` below the row, as every Popover, and flips above on a screen too short for it (320 × 568). Its keyboard is MenuDropdown's; Tab, Escape or a tap outside closes only the Account Menu and returns focus to the row, inside the dialog.

**Choosing an account item closes both menus** (decided by you on 3 Nov, after PR #41), from the Account Row and from the header's account icon in the open menu alike. The Account Menu closes, MobileMenu asks `onClose`, focus goes back to ☰, and then `onAccountSelect` gets the item. The call waits for the commit that closed the menu, so a handler that moves focus on (into the dialog it opens, such as Manage Currencies) keeps it there. The stories check the row (a button named by `username`, `aria-haspopup="menu"`), its focus ring, the menu's place and items, Tab, Escape and a tap outside (the Mobile Menu stays open), and choosing (both close, focus on ☰, then `onAccountSelect`; or focus where the handler put it), in Light and Dark.

| Layer | Figma | Code |
|---|---|---|
| Menu | Fixed 375, vertical, no gap; `surface/neutral/base`; Effects/Elevation Dark/3 | `w-full bg-surface-neutral-base shadow-elevation-3`, against the top of the screen; `max-h-full overflow-y-auto` |
| Mobile Header | Navigation / Mobile Header, Menu Open=true | `<MobileHeader menuOpen />` |
| Links | Vertical, padding 8 / 16, gap 2 (raw) | `<nav aria-label="Main">` > `<ul class="flex flex-col gap-0.5 px-4 py-2">` |
| Link | Navigation / Nav Link – Vertical, State Default / Active | NavLink `orientation="vertical"`, `active` for `page` |
| Account Row | Padding 12 / 16, gap 12 (raw); 1px `stroke/subtle` on top, inside; opens the Account Menu (pattern 15 step 3) | AccountMenu's trigger: `<button class="flex w-full gap-3 px-4 py-3 border-t border-stroke-subtle">` |
| Account icon | User 20, `text/secondary` | `<Icon name="user" size={20} />` in `text-text-secondary` |
| Name | "Admin Account", Body/sm-medium, `text/secondary` | `username`, `text-body-sm-medium text-text-secondary` |
| Account Menu | Navigation / Account Menu, flush under the row, 16 in (`793:18612`) | AccountMenu `portal`, `ml-4`, `space/4` below the row |

Contrast, Light / Dark (on `surface/neutral/base`):
- Links, Default (`text/secondary`): 10.35 / 16.36
- Link, Hover (`text/primary` on `surface/neutral/faint`): 19.28 / 17.85
- Link, Active (`text/primary` on `surface/base`): 20.17 / 14.63
- Account Row (`text/secondary`): 10.35 / 16.36
- Account Row focus ring (`stroke/focused`): 6.81 / 7.36
- Active Indicator (`action/primary/surface/selected` on the menu): 10.76 / 8.16
- Header: as MobileHeader

The Active link's `surface/base` fill on the menu's `surface/neutral/base` is 1.00:1 in Light (both white) and 1.38:1 in Dark. Since 3 Nov the current page also shows through its semibold label and the 2px left Indicator (see NavLink). The `stroke/subtle` line (1.23 / 1.95) is a divider, not a control boundary.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 375 | The screen's full width | None needed |
| Height | Hugs (533) | Hugs, up to the screen's height; scrolls beyond that (a phone held sideways) | None needed |
| Elevation | Effects/Elevation Dark/3 | `shadow-elevation-3`. Tailwind compiles it to GDL's Light Elevation 3 in both themes, as on Popover | None in Figma |
| Padding and gap | Raw 8 / 16, 2, 12 / 16, 12 | `space/8`, `space/16`, `space/2`, `space/12` | Bind to GDL's `space/*` |
| User links | No Mobile Menu – User (U08: "add it next to Mobile Menu – Admin") | One MobileMenu; the links are data | Add Mobile Menu – User, or give Mobile Menu – Admin a links slot |
| Account Row states | No Hover, Focus or open look (decision fc-nav-account-row: leave the row as it is) | No hover or open look, as drawn; a 2px `stroke/focused` ring inside the row on keyboard focus (the panel clips outside it), as code adds to every control | None needed |
| Account Menu placement | Flush under the row (0 gap) | `space/4` below, Popover's, as the desktop account menu; above the row when there's no room below | None needed |
| Behaviour | Static | Dialog, focus on ✕ and trapped, Escape / ✕ / scrim / a link closes it, focus back to ☰, page inert and still | None needed |

**Changed in Figma on 3 Nov 2026** (decisions mobile-menu, fc-nav-account-row, nav-active, offscale-spacing; published):
- **Pattern 15 step 3** (`530:7659`) draws the scrim behind the menu ("Scrim (tap to close)", `793:18611`, `surface/overlay`), as code's Overlay does, so that departure is gone. Its caption: "The menu opens over a scrim (a tap or ✕ closes it). The account row opens the Account Menu."
- **The Account Row opens the Account Menu:** Navigation / Account Menu (`793:18612`) sits directly under the row, 16 in. Code: the row is AccountMenu's trigger.
- The links follow Nav Link – Vertical (35-high rows in Figma, the Active one semibold with a left Indicator) and Mobile Header (Ghost glyphs). See NavLink and MobileHeader.

Figma gaps the code doesn't copy:
- **The "Account, Theme & Mobile" section (`511:1155`) is pinned to Semantics Dark,** like the mobile screens in pattern 15. The code follows the page's theme. The Light frame beside it (`793:18395`) shows Mobile Menu – Admin in Light.


### PageHeader (2 Nov 2026)

Source: page **Layout** (`765:15143`), component `Page Header` (`765:15400`), drafted from the design decisions (add-page-header, add-form-heading, page-actions-placement-label) and published on 2 Nov 2026. Code: `src/components/page-header/`. It replaces the patterns' story-level page header.

| Figma | Binding | Code |
|---|---|---|
| Root | horizontal, centred, gap `space/24` | `flex flex-wrap items-center gap-6` |
| Title + Tabs | fills, gap `space/20` | `flex min-w-0 flex-1 flex-wrap items-center gap-5` |
| Title + Description | vertical, gap `space/4` | `flex flex-col gap-1` |
| Title (`Title`) | Heading/xl-bold, `text/primary` | `<h1>` (`headingLevel`), `text-heading-xl-bold text-text-primary` |
| Description (`Show Description`, `Description`) | Body/sm-regular, `text/secondary` | `description`, `text-body-sm-regular text-text-secondary` |
| Tabs Group (`Show Tabs`, `Tabs`) | a vertical Divider and a Tabs instance, gap `space/20` | `tabs`, after `<Divider orientation="vertical" aria-hidden>` |
| Actions (`Show Actions`, `Show Secondary Action`, `Secondary Action`, `Primary Action`) | Button / Normal or Menu Trigger instances, gap `space/12` | `actions`, `flex flex-wrap items-center gap-3` |

Contrast: the title 20.17 (Light) / 17.85 (Dark) on `surface/canvas`, the description 9.90 / 14.48.

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Actions | Two instance-swap slots and three booleans | One `actions` slot: the page passes its buttons, primary last | None needed |
| Narrow screens | Fixed 1200, no wrap | Wraps: actions under the title, tabs under the title | Draw a narrow layout |
| Heading level | (visual only) | `<h1>` by default, `headingLevel={2}` where a page already has one | None needed |

### Divider (2 Nov 2026)

Source: page **Layout**, set `Divider` (`765:15396`): Orientation Horizontal / Vertical, a 1px `colors/stroke/subtle` stroke inside (top or left). Code: `src/components/divider/`, a `role="separator"` with `aria-orientation`.

| Orientation | Figma | Code |
|---|---|---|
| Horizontal | 320 × 1 (set to Fill in use) | `h-0 w-full border-t border-stroke-subtle` |
| Vertical | 1 × 32 | `h-8 w-0 self-center border-l border-stroke-subtle` |

Contrast: `stroke/subtle` is 1.23:1 on white and 1.18:1 on the canvas in Light (1.41–1.95 in Dark). The rule is decorative: it separates regions that are already apart, so WCAG 1.4.11's 3:1 doesn't apply. In PageHeader it is `aria-hidden`.

### PanelCard (2 Nov 2026)

Source: page **Layout**, component `Card / Panel` (`765:15457`): the Settings Card's surface (545:25208) for form pages and Settings. Code: `src/components/panel-card/`.

| Figma | Binding | Code |
|---|---|---|
| Fill | `colors/surface/base` | `bg-surface-base` |
| Stroke | 1px `colors/stroke/subtle`, inside | `inset-ring inset-ring-stroke-subtle` |
| Radius | `radius/12` | `rounded-12` |
| Padding | `space/32` | `p-8` |
| Gap | `space/20` (vertical) | `flex flex-col gap-5` |
| Content (`Content`, a slot) | `_Slot` placeholder | `children` |

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 578 (the form cards') | Its container's width; pages set a max width. The form pages and Settings (3 Nov 2026) use `max-w-xl`, 576: the nearest container width, as GDL has no width scale | None in the component; 576 for the form cards, or a GDL width scale once there is one |

In Light the card's fill is the same white as `surface/base` pages, so its edge is the 1.23:1 stroke only: an open design question (the review notes, "stroke/subtle under 3:1").

### TableHeaderRow (2 Nov 2026)

Source: page **Table** (`3:1823`), set `Table / Header Row` (`767:1082`, in section `767:829`): Columns 2–8 (`767:830` … `767:1028`) × Show Expand (default off), Show Checkbox (default on) and Show Actions (default on). Drafted from the design decision add-table-header-row ("one cell per control and the rows' padding") and published on 2 Nov 2026. Example `771:1342`. Code: `src/components/table-header-row/`, a `<tr>` for a table's `<thead>`.

| Figma | Binding | Code |
|---|---|---|
| Root | horizontal, gap 0, no padding, no fill; bottom stroke `stroke/1` in `colors/stroke/subtle`, inside (included in layout) | `<tr>`, `border-b border-stroke-subtle` |
| Expand (`Show Expand`) | 60 wide, empty; padding `space/12` top and bottom, `space/16` sides | `showExpand`: a `<th scope="col">` named "Details" (visually hidden), `w-1 px-4 py-3` |
| Checkbox (`Show Checkbox`) | 56 wide, padding as above, centred; Checkbox 16px Deselected (Mixed and Selected set per instance) | `showCheckbox`: a `<th>` with a centred 16px `Checkbox`; `checkboxProps` go to it (`aria-label`, `checked`, `indeterminate`, `disabled`, `onChange`) |
| Column 1 … N (`Columns`) | Table / Header Cell instances, 200 wide, their padding overridden to `space/12` / `space/16`, gap 6 | `children`: TableHeaderCells. In the row they take `px-4 py-3` (TableHeaderCell reads the row's context), so the labels sit 16 in, at the same x as the cells' text |
| Actions (`Show Actions`) | 56 wide, empty, padding as above | `showActions`: a `<th>` named "Actions" (visually hidden) |
| Height | 45: 44 (12 + the label + 12) and the 1px stroke | The same: 44 inside the line on GDL's 20px Body/sm line height, plus the 1px line |

The order is Figma's: Expand, Checkbox, the columns, Actions, each its own column, as on Table / Row.

**API: cells as children.** The header's data columns are TableHeaderCells passed as `children`, because that is how TableRow takes its TableCells today, and how every pattern composes its rows. A header cell keeps its own props in place (`sortable`, `sort`, `onSort`, a width in `className`), so a sortable Costs header and a plain Cost Centers header read the same way. A `columns` array would have to restate those props, and the cells would no longer match how their rows are written. The control columns are Figma's booleans, because their content is fixed: an empty header over the expand buttons, a select-all box, an empty header over the ••• menus.

Contrast: the row has no fill, so it sits on the page or dialog.

| Colour | Light, `surface/base` / `canvas` | Dark, `surface/base` / `canvas` |
|---|---|---|
| Labels, `text/secondary` (TableHeaderCell) | 10.35 / 9.90 | 11.87 / 14.48 |
| Select-all box border, `stroke/field` | 4.76 / 4.55 | 5.71 / 6.96 |
| Bottom line, `stroke/subtle` | 1.23 / 1.18 | 1.41 / 1.95 |

The bottom line is decorative, as Divider's: it separates the header from rows that are already apart, so WCAG 1.4.11's 3:1 doesn't apply.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Columns | A variant, 2 to 8 | The number of TableHeaderCell `children`: any number | None needed |
| Control column widths | Expand 60, Checkbox and Actions 56, fixed | As narrow as their content (`w-1`): the rows' expand button, checkbox and ••• set them (60, 48 and 64 with padding). 56 and 60 aren't on GDL's space scale | Hug the content, or use a width on the scale |
| Defaults | Show Checkbox and Show Actions on | All three off unless set: a select-all box needs a label and a handler, and an Actions column needs row menus | None needed |
| Control column names | Empty frames | Visually hidden "Details" and "Actions", so screen readers can name every column | None needed |
| Header Cell padding | Each instance in the row overrides the Header Cell's raw 6px to `space/12` / `space/16` | TableHeaderCell keeps `p-1.5` (6px) on its own and takes `px-4 py-3` inside a TableHeaderRow | None needed |

**Changed in Figma on 3 Nov 2026** (published): the "Draft 2 Nov 2026" note is gone from the descriptions of Table / Header Row, Table / List and Table / Cell, and sorted Header Cells take their text from Label (see TableHeaderCell), so a sorted column no longer shows "Column".

Figma gaps the code doesn't copy:

- **The rows' padding at the table edges** is 16, as drawn and as Table / Row's cells; the decision mentions 24. Open in the review notes (header inset, 16 or 24).

### TableCell type="custom" (2 Nov 2026)

Source: set `Table / Cell` (`460:900`), new variant **Type=Custom** (`766:1480`) with a native slot, Content (`Content#766:6`; preferred: Table / Account Details, Toggle, Table / Expand Button, Checkbox). Drafted from the design decision add-table-cell-custom ("a Custom/Content type; Manage Currencies rebuilt from Table / Row") and published on 2 Nov 2026. Example `772:1406`. Code: `type="custom"` in `src/components/table-cell/`.

| Figma | Binding | Code |
|---|---|---|
| Root | vertical, gap 0; padding `space/16` sides, `space/12` top and bottom; content centred vertically, at the start | `px-4 py-3 align-middle text-left` |
| Content (a slot) | fills the width, hugs its content; vertical, gap 0, at the start; the placed content keeps its own size | `children`, in `flex flex-col items-start` |

Contrast: the cell has no colours of its own; its content brings them.

Where the patterns use it: Account Details in the Costs rows, the expand button (as in the Header Row example), Manage Currencies' Enabled Toggle, the Empty State row of every list, the expanded Costs and Audit Logs rows, and SkeletonTableRow's lines. Each was a `type="tag"` (or `type="actions"`) stand-in.

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Height | Fixed 44 (instances resize: 127 with Account Details) | Hugs its content: 44 with a Toggle, 40 with a Checkbox | None needed |
| `_Slot` placeholder | A dashed "Content slot" placeholder until content is placed | Nothing: `children` is the content | None needed |

Every Table / Cell type now has its vertical padding bound to `space/12`, as Type=Custom had first (3 Nov 2026; see TableCell).

### TableList (2 Nov 2026)

Source: page **Table**, component `Table / List` (`768:1009`): a Table / Header Row instance (Columns=5, Show Checkbox and Show Actions on) over a native slot, Rows (`Rows#768:0`, preferred: Table / Row), with no fill and no outer border. Drafted from the design decision add-plain-list-table and published on 2 Nov 2026. Example `773:1468` (Cost Centers: Columns=3, Show Actions, Sortable=false). Code: `src/components/table-list/`. It replaces the patterns' `RecordsTable`.

| Figma | Binding | Code |
|---|---|---|
| Root | vertical, gap 0, no padding, no fill, no stroke; 1112 wide, hugs its rows | `<table>`, `w-full border-collapse` |
| Header Row (nested instance) | fills the width | `header`: a `<TableHeaderRow>`, in the `<thead>` |
| Rows (a slot of Table / Rows) | fills the width, vertical, gap 0 | `children`: `<TableRow>`s, in the `<tbody>` |

Contrast: no colours of its own (the header row's and rows' lines are theirs).

Code departs from Figma here:

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Width | Fixed 1112 (the sample's) | Its container's width; the columns share it by content unless the header sets widths | None needed |
| Clipping | The Rows slot clips its content | The scroll region clips (it scrolls sideways); the rows' ••• menus open outside it, on `<body>` | Turn off Clip content |
| Narrow screens | Not drawn: no phone layout | The table scrolls sideways in its own region (below) | Draw a phone frame if designers want rows as cards later |
| Focus ring | None | The region's 2px `stroke/focused` outline, inside its edge (`-outline-offset-2`), while it can scroll | None needed |
| No rows | Not drawn | One TableRow whose TableCell `type="custom"` spans every column and holds an EmptyState (the patterns' "No items.") | Draw the empty list |
| Name | (visual only) | Give the table an `aria-label` | None needed |

**Narrow screens (3 Nov 2026, decision add-phone-table-layout).** The user chose "a table that scrolls in its own region; row menus open outside it" over rows as cards. Figma draws no phone layout (no mobile list screens, 2102:4 and 2102:3; Table / List is 1112 wide), so this is code only and nothing changed in the library.
- The `<table>` sits in a `<div data-part="scroll-region">` that takes its container's width (`w-full`) and scrolls sideways (`overflow-x-auto`). The table's `className` and `ref` stay on the `<table>`; `regionClassName` styles the region. The region is `relative`, so what is absolutely placed in the cells (a visually hidden header label) is held by it too; without that, Drafts, Exports, Announcements and Cost Centers still widened the page at 320.
- While the columns need more than the region's width, the region is a tab stop (`tabIndex` 0), so the keyboard can reach it and the arrow keys scroll it (WCAG 2.1.1; axe's scrollable-region-focusable), a `role="region"` named like the table (its `aria-label`, or its `aria-labelledby`), and shows the focus ring. While everything fits, it is a plain `<div>`: no tab stop, no landmark. It is measured before paint and again on any size change (`useScrollableTabStop(ref, true, 'x')`, the hook the modal bodies use for `y`). An unnamed table gets the tab stop but no region role.
- Row menus open outside it: RowActionsMenu renders its menu on `<body>` (Popover's `portal`), so the region never cuts one off.
- Every list in the patterns and templates is a TableList (Costs, Cost Centers, Recurring Costs, Drafts, Users, Exports, Announcements, Audit Logs, Manage Currencies, the Costs breakdown), so every one scrolls in its region. At 320 no template scrolls sideways any more.
- **The Costs table at 1024:** AppShell's content box is 976 (24 at each side). The table needs a few pixels more (the decision's estimate was 977; 982 in headless Chromium with Inter), so at 1024 it scrolls by those pixels inside its region, a tab stop named Costs, and the page doesn't scroll. The other lists fit at 1024. Making Costs fit would mean narrowing a column, a design change.
- Stories: TableList At a phone's width (Light, Dark; the mobile viewport and `chromatic.viewports: [320]`, in a 320 frame with AppShell's 16 gutters so every runner gets 288): the region scrolls and the page doesn't; Tab stops on the region, then on the rows' •••; the last row's menu opens on `<body>`, 4px under its •••, past the region's bottom edge, inside the viewport and not clipped (its last item is the menu's own pixels). Focus ring (Light, Dark; forced `:focus-visible`). Playground checks that a table that fits has no tab stop. Costs table At a phone's width; the List page and Overview list templates check the region on every screen; List page Costs, 1024. The arrow keys are the browser's own scrolling of a focused scroll container, which a play's synthetic key events don't trigger; checked with Playwright's real keyboard instead (Tab reaches the region, → scrolls it 40px a press, ← back).

### FilterSelect (2 Nov 2026)

Source: page **Filters** (`89:836`), section Drafts – 2 Nov 2026 (`765:15532`), set `Filter / Field – Select` (`765:15595`): State Closed (`765:15533`) / Open (`765:15546`), drafted from the design decisions add-filter-field-select and filter-wording and published by the user. Example: `765:15875` (Closed on All Status; Open with Pending chosen). Code: `src/components/filter-select/`. It replaces the patterns' two `FilterMenu` stand-ins (a FilterField opening a MenuDropdown, with no checked option) and U04's inline one.

| Figma | Binding | Code |
|---|---|---|
| Root | vertical, gap `space/4`, 256 wide | Popover: the list `space/4` under the field (`mt-1`); the wrapper takes `className` (`w-64` in the bar) |
| Field | Filter / Field Type=Dropdown: fill `colors/surface/elevated secondary`, 1px inside `colors/stroke/field`, radius `radius-4` (8), padding `24`, gap `16`, space-between | FilterField `type="dropdown"`, unchanged |
| Field / Funnel, CaretDown | `colors/text/subtle` | `text-text-subtle` (FilterField) |
| Field / Value ("All Status") | Body/sm-regular, `colors/text/primary` (an override) | the chosen option's label; `allLabel` while `value` is null |
| Menu | Select / Menu, Fill: fill `colors/surface/elevated` (since 3 Nov 2026), 1px inside `colors/stroke/subtle`, `radius/8`, padding `space/6`, gap `space/2`, Effects/Elevation Dark/3 | Popover's surface with `selectMenuLayout`, `min-w-full` (as wide as the field) |
| Option 1 ("All Status") | Select / Option State=Selected (`colors/neutral/tonal/surface/default`, Check `colors/text/primary`, since 3 Nov 2026; see SelectOption) | `allLabel`, the first SelectOption; `onValueChange(null)` |
| Options 2…5 | Select / Option State=Default, Body/sm-regular `colors/text/primary`, padding `space/8` / `space/12`, `radius/6` | one SelectOption per `options` entry |

Behaviour: Select's listbox, shared through `useSelectListbox` rather than written twice. The field is the `<button role="combobox" aria-haspopup="listbox">`, named by `label` ("Status") with the chosen option as its value; focus stays on it, and `aria-activedescendant` names the option the keys are on. Enter, Space, ↓, ↑, Home and End open the list; ↓ / ↑ / Home / End / Page Up / Page Down move; typing jumps; Enter, Space and Alt + ↑ choose; Tab chooses and moves on; Escape closes. The list is a `listbox` with the same name.

Contrast, Light / Dark: the value 20.17 / 17.85 on the field; the icons and an unset value (`text/subtle`) 4.76 / 6.96; the border (`stroke/field`) 4.76 / 6.96 on the field and 4.55 / 6.96 on the bar; options 19.28 / 17.85 on the menu, 16.36 / 7.58 on Selected's fill; the check 16.36 / 7.58 on Selected's fill (a 3:1 glyph).

**Changed in Figma on 3 Nov 2026** (review Filters #1; published): the nested Filter / Field is exposed, so an instance shows the Field's Value, Icon, Type and State; the draft note is gone from the description. Nothing in code changed.

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Value and option labels | The nested Field is exposed, so an instance sets its Value and Icon (since 3 Nov 2026); Select / Option's Label is reached through the menu | `allLabel`, `options` and the chosen option | None needed |
| Open | The menu sits inside the component and pushes content down | The list floats over the page (Popover), and flips above when there's no room | None needed: designers place State=Open over the content (open point 6) |
| Width | Menu Fill: exactly the field's 256 | At least the field's width; wider only for a label that needs it | None needed |
| Name | (visual only) | A combobox named by `label`; FilterField drops its "Status: " prefix for it | None needed |
| Active option | Select / Option State=Active (since 3 Nov 2026) | Hover's fill on the option the keys are on, and the 2px `stroke/focused` ring when the keyboard put it there (SelectOption) | None needed |
| No reset item | Every example has one | Without `allLabel`, only `options`, and the field shows `label` in `text/subtle` until one is chosen | None needed |

### FilterDateRange (2 Nov 2026)

Source: page **Filters** (`89:836`), section `765:15532`, set `Filter / Field – Date range` (`765:16277`): State Closed (`765:16020`) / Open (`765:16035`), drafted from the design decisions add-filter-date-range and period-field-width and published by the user. Example: `765:16278`. Code: `src/components/filter-date-range/`. It replaces the pattern-level `FilterDateRange` in `src/patterns/filters/CostsFilterBar.tsx`.

| Figma | Binding | Code |
|---|---|---|
| Root | vertical, gap `space/4` | Popover (`panelRole="dialog"`, `surface={false}`): the picker `space/4` under the field, flush left |
| Field | Filter / Field Type=Dropdown (as FilterSelect), Leading Icon swapped to CalendarBlank (`colors/text/subtle`) | FilterField `type="dropdown"`, `icon` `calendar-blank` (the default) |
| Field / Value ("12–24 Oct", since 3 Nov 2026) | Body/sm-regular, `colors/text/primary` (the exposed Field's Value) | `formatDateRange(value, today)` ("12–24 Oct"); `placeholder` ("Select Period") in `text/subtle` while there is none |
| Date Picker / Range | fill `colors/surface/elevated` (since 3 Nov 2026), 1px inside `colors/stroke/subtle`, `radius/12`, padding and gap `space/8`, Effects/Elevation Dark/3; Month / Start and Month / End | RangeCalendar, unchanged |

Behaviour: like DateInput's calendar (a range is picked, not typed). The field is a `<button role="combobox" aria-haspopup="dialog">` named by `label` ("Period"), with the range (or the placeholder) as its value. A click, Enter, Space, ↓ or ↑ open the picker and move focus to the calendar (the range's start, else today). The first pick is the start and the second the end, in either order; then the picker closes, focus comes back to the field, and `onValueChange` gets `{ start, end }` (only when the range changed). Escape, a click outside or Tab past the calendar close it without a change. The picker is a non-modal dialog with the field's name.

The range's format (decision period-field-width, "shorter range text", and the user's decision on 2 Nov 2026, "drop the current year"), from `formatDateRange(range, today)`:
- **Both ends in `today`'s year** (the component's `today`, default the real today): no year, and the month once within one month: "12–24 Oct", "1–31 Oct", "28 Sep – 31 Oct", "12 Oct".
- **Both ends in another year**: the year once: "12–24 Oct 2025", "28 Sep – 31 Oct 2025".
- **Across years**: both years: "28 Dec 2025 – 3 Jan 2026".
- **A screen reader always gets the full dates**: when the year is left out, the shown text is `aria-hidden` and a visually hidden copy carries the year ("12–24 Oct 2026"), so the combobox's value has it. `formatDateRange(range, null)` gives that full form. Filter / Summary keeps the ISO days ("2026-10-12 – 2026-10-24").

**The 256 width, measured in code.** The field holds 256 − 2 × 24 (padding) − 20 (icon) − 12 − 20 (caret) − the content-to-caret gap: 140px of text with Filter / Field's 16 gap, 144 with 12. Figma sets the value with 0 letter spacing, where "12 Oct – 24 Oct 2026" is 141px (the drafting note's "about 1px too long"). Code uses GDL's Body/sm-regular, with 0.4px letter spacing, where the same text is **147.5px**: 7.5px too long with the 16 gap and 3.5px with 12. So code:
- **Keeps the year out of a current-year range** and writes one month once. Measured in Inter with the ramp's letter spacing over every range in a year (66,795 of them), the widest is **"30 May – 30 Nov", 118.4px**; the widest one-month range is "20–30 May" (77.6px). Every current-year range fits: the widest leaves **25.6px** of the field's 144px spare (about 18%; 21.6px with the 16 gap), enough for a platform that draws Inter a little wider (CI's Linux runner did, by a pixel or two).
- **Sets the gap to `space/12`** on this field (`gap-3` over FilterField's `gap-4`). With space-between it only shows when the text is long; it lets a short range from another year fit ("12 Oct – 4 Nov 2025", 142px).

A range in another year can still be cut with an ellipsis ("28 Sep – 31 Oct 2025" is 150px; "28 Dec 2025 – 3 Jan 2026" is 185px). Its value keeps the whole text for a screen reader. The Formats story checks each case's text with `today` pinned to 24 October 2026, and measures the fit only where the margin is wide (18% or more spare, or 25% or more over), once Inter has loaded, so text rendering can't flip it.

Contrast: as FilterSelect's field (value 20.17 / 17.85, placeholder and icons 4.76 / 6.96), and RangeCalendar's.

**Changed in Figma on 3 Nov 2026** (decision period-field-width and review Filters #1; published): the Field's value is "12–24 Oct" (was "12 Oct – 24 Oct 2026") and its gap `space/12` (was 16), as code; the nested Field is exposed; the description records the short format, and the draft note is gone. Nothing in code changed.

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Letter spacing | 0 | GDL's Body/sm-regular (0.4px); a screen reader hears "12–24 Oct 2026" | Bind the Value to the ramp's letter spacing (FilterField's "Line height, letter spacing") |
| Another year's long ranges | Not drawn | Cut with an ellipsis; the full text stays in the value | None needed (rare in a costs filter) |
| Open | The picker sits inside the component and pushes content down | It floats (Popover), and flips above or to the right edge when there's no room | None needed (open point 6) |
| Name | (visual only) | A combobox named by `label`; the picker takes the same name | None needed |
| Value | The nested Field's Value, exposed on the instance (since 3 Nov 2026) | `value` / `defaultValue` (`{ start, end }`), formatted | None needed |

### FormHint (2 Nov 2026)

Source: page **Form** (`183:1765`), section Drafts – 2 Nov 2026 (`766:863`), component `_Form Hint` (`766:864`): **Hint** (text, "This will recur every 3 weeks") and **Icon** (instance swap, Info 16), drafted from the design decision add-form-hint and published by the user. Example: `766:3040` (under Form / Field – Dropdown · Frequency, `space/8` apart). Code: `src/components/form-hint/`. It replaces the compact Info Alerts under the frequency fields in U02 (NewCostForm) and U04 (EditRecurringCostForm).

| Figma | Binding | Code |
|---|---|---|
| Root | horizontal, gap `space/8`, centred, Fill | `<p className="flex w-full items-center gap-2">` |
| Icon (Info, 16) | vector `colors/text/subtle` | `icon` (default `info`), `<Icon size={16}>`, `aria-hidden`, in the text's colour |
| Hint | Caption/md-regular, `colors/text/subtle`, Fill, auto height | `children`, `text-caption-md-regular text-text-subtle`, wraps |

Contrast (Caption, 4.5:1): `text/subtle` 4.76 on `surface/base`, 4.55 on `surface/canvas` (Light); 5.71 / 6.96 (Dark).

| | Figma | Code | Fix in Figma |
|---|---|---|---|
| Placement | `space/8` under the field (the example's gap) | The form puts the field and the hint in a `gap-2` column | None needed |
| Live summary | (visual only) | The recurrence summary passes `role="status"`, as the Info Alert had; a static hint has no role. Point the field's `aria-describedby` at it when it describes one control | None needed |
| Colour | `text/subtle` (the original was `text/tertiary`, lighter in Dark) | `text/subtle`, as drawn | Open point 7: confirm `text/subtle` |
| Two lines | One line drawn; the text wraps | Wraps; the icon stays centred on the text, as Figma's centred auto layout puts it | Draw a two-line hint if the icon should sit at the top |
