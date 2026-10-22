# CAF Design System

CAF's design system, built on **GDL** (the General Design Library), the same
way the CAF Figma library subscribes to the GDL Figma library.

```
@vdm-design-team/caf
├─ tokens/core/color.json         CAF's own ramps: caf-blue, caf-blue-on-dark
├─ tokens/core/typography.json    font.family.sans → Inter (CAF's one override of GDL)
├─ tokens/semantic/color*.json    the 312 semantic colours, Light + Dark
├─ dist/                          theme.css, tokens.css, tokens.dark.css, …
│                                 = GDL's tokens + CAF's, in GDL's output format
└─ src/components/                CAF's React components (Button), on dist/theme.css

from @vdm-design-team/gdl (never copied here)
   palette (slate, green, red, …), spacing, radius, stroke, fonts,
   elevation 1–7, the 47-style type ramp, dark elevation, desktop sizes,
   the semantic colour contract, the build formats, gdl-check-contract
```

What comes from where, and why: [`docs/inheritance.md`](docs/inheritance.md).

## Using it in a CAF app

```css
/* in place of @import "tailwindcss" */
@import "@vdm-design-team/caf/theme.css";
```

Utilities follow the token names: `bg-surface-canvas`, `text-text-primary`,
`bg-action-primary-surface-default`, `border-stroke-default`,
`text-body-md-regular`, `rounded-8`, `shadow-elevation-3`, `bg-caf-blue-500`.
Dark theme: put `.dark` on `<html>`.

The package is published to GitHub Packages (`.npmrc`:
`@vdm-design-team:registry=https://npm.pkg.github.com`, plus a token with
`read:packages`).

## Working on CAF

```bash
npm install            # pulls GDL from its git tag — no token needed
npx playwright install chromium   # once: the browser the story tests run in
npm test               # lint, build, GDL contract, contrast (strict), changelog entry, typecheck, story tests
npm run storybook      # the components on :6006, Light/Dark in the toolbar
npm run storybook:build && npm run test:static   # every story against the production build, as Chromatic runs it
npm run import:figma   # after refreshing figma-export/ — see docs/figma-sync.md
```

- Tokens are generated from the CAF Figma library — never hand-edit `tokens/`.
- Anything GDL has stays in GDL. `lint:tokens` fails on a copied GDL colour
  family or an override that isn't on its allow-list.
- Every PR touching `tokens/`, the build config, the GDL version or a
  component adds a `changes/<branch>.md` entry (see
  [`changes/README.md`](changes/README.md)).
- Rules for people and AI agents: [`CLAUDE.md`](CLAUDE.md).

## Components

Built straight from the CAF Figma library (page by page, no intermediate
export), in React with Tailwind v4 on `dist/theme.css`. Props use Figma's
names. A component that a second brand needs moves up to GDL.

| Component | Figma | Story |
|---|---|---|
| `Button` | Buttons → `Button / Big`, `/ Normal`, `/ Small` | Components/Button |
| `Checkbox` | Selection Controls → `Checkbox` | Components/Checkbox |
| `TableCell` | Table → `Table / Cell` (replaces `Table / Cell Text`) | Components/TableCell |

```tsx
// src/components — not in the published package yet (see below)
<Button>Save</Button>                                   // Style=Default, Normal
<Button variant="outlined" size="small">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="tonal" leftIcon={<Plus />}>View Changes</Button>  // Phosphor icon

<label><Checkbox defaultChecked /> Restricted user</label>          // Selected, 16px
<Checkbox aria-label="Select all rows" indeterminate />           // Mixed-State

<tr>                                                               // TableCell is a <td>
  <TableCell type="checkbox"><Checkbox aria-label="Select row" /></TableCell>
  <TableCell>123456</TableCell>                                    // Type=Text
  <TableCell type="two-line" primary="Admin Account" secondary="admin1@geekee.com" />
  <TableCell type="list" items={['Reporting', 'Exports']} />       // +1 more
</tr>
```

- `variant` is Figma's Style: `default`, `outlined`, `text`, `destructive`,
  `tonal`, `success`. `size` is `big`, `normal` or `small`.
- `leftIcon` / `rightIcon` are Show Icons. The icon takes the button's
  colour and Figma's icon size (24 / 20 / 16).
- Hover, Pressed and Disabled are the element's own states.
- `Checkbox` is a native checkbox: `size` is `16` or `20`, and Figma's
  Selected and Mixed-State are `checked` and `indeterminate`. Label it with
  a `<label>` or `aria-label`.

Each component's stories show every variant × state in Light and Dark,
with Hover and Pressed forced by `storybook-addon-pseudo-states`. Every story
is a Vitest test: it must render, its play function must pass, and axe must
find nothing. One exception: Tonal's label/fill pairs are below AA in Figma.
Their own story reports them in the a11y panel without failing, until the
Figma fix lands. Vitest renders stories differently from the static build
Chromatic snapshots, so `npm run test:static` runs every story again against
`storybook-static/`, as Chromatic does, and fails on the same errors. CI runs
it after building Storybook; run it before opening a component PR.
Components use only token utilities:
`bg-action-primary-surface-default`, `text-label-md-semibold`, `rounded-8`,
`shadow-elevation-2`, and spacing on GDL's scale. `npm run lint:components`
fails on hex, px or arbitrary values. Where code departs from Figma, the
reason is in [`docs/figma-sync.md`](docs/figma-sync.md#components).

Components aren't in the published package yet: there's no JS build
(`tsup`) until an app needs to install them. For now they live in Storybook.
Visual review runs through Chromatic once the CAF project's token is set
(`CHROMATIC_PROJECT_TOKEN`). Until then the Chromatic check passes without
snapshotting.

## Upgrading GDL

A GDL release is CAF's "Library updates available". Bump it in its own PR:

```bash
npm install --save-dev "github:VDM-Design-Team/GDL-design-system#semver:^0.2.0"
npm run import:figma && npm test
```

Read GDL's `CHANGELOG.md` for the versions in between. A `major` GDL release
lists what CAF must change under `Migration:`.

## Releasing

```bash
npm run changelog      # fold changes/ into CHANGELOG.md and bump the version
```

Merge that as the release PR, then create a GitHub release tagged
`v<version>`. The release workflow publishes `@vdm-design-team/caf`.

## Status (v0.1)

- Tokens, plus the first components (`Button`, `Checkbox`, `TableCell`) in Storybook. More
  components follow, built straight from the CAF Figma library onto these
  tokens (shared ones move up into GDL once a second brand needs them).
- Every semantic pair meets WCAG AA in Light and Dark: text and labels
  4.5:1, the focus ring and component borders 3:1. `npm test` runs
  `check:contrast --strict`, so a new failure fails CI. Fix it in Figma.
- No `stroke.field` or `surface.track` yet. GDL recommends both.

## Figma

- CAF Design Library: `WhVkTrQRI9bDTfOeAJXTrR` (components only).
- CAF Design file (screens): `z7L8r4nq6nL6Yfa8vvxJhO`.
- Parent: GDL `1rBM831Vs5ZS4OsRwIPH52`.
