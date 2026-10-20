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
