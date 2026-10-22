# Working on CAF

The CAF Design System is a **child of GDL** (`@vdm-design-team/gdl`, repo
`VDM-Design-Team/GDL-design-system`). GDL owns everything shared: palette,
spacing, radius, stroke, fonts, elevation, the type ramp, the semantic
colour contract and the build tooling. This repo keeps only what is CAF's.
Read `docs/inheritance.md` before changing anything structural.

## Rules — apply to every change

1. **Only CAF's own things live here.** That means CAF's brand ramps
   (`color.caf-blue`, `color.caf-blue-on-dark`), CAF's UI face
   (`font.family.sans` → Inter) and CAF's semantic colour values. Never copy
   a GDL token in. `npm run lint:tokens` fails on a GDL colour family in
   `tokens/core/color.json` and on any GDL token CAF overrides that isn't on
   `ALLOWED_OVERRIDES` in `scripts/lint-tokens.mjs`. Adding to that list is a
   reviewed decision that CAF departs from GDL.
2. **Tokens come from the CAF Figma library.** `tokens/` is generated from
   `figma-export/` by `npm run import:figma`. Never hand-edit `tokens/`. To
   change a value, change the CAF Figma library first, then refresh the
   snapshot (`docs/figma-sync.md`) and run the import. Commit the snapshot
   and the tokens together. CI fails if `tokens/` differs from what the
   snapshot produces.
3. **CAF's semantics alias only GDL's Primitives or CAF's Brand Primitives.**
   The importer fails on an alias to any other library (VCP, shadcn, a
   Material kit). That is the repo enforcing what Figma can't.
4. **CAF inherits the type ramp and elevation.** The importer fails if a CAF
   text style's size or weight, or an elevation effect, differs from GDL's.
   Fix drift in CAF Figma. A real CAF-only decision goes through rule 1's
   allow-list.
5. **The GDL contract must hold.** `gdl-check-contract` runs in `npm test`.
   A new semantic name is allowed, and it is reported. If a second brand
   needs it, propose it to GDL; don't wait for it to spread.
6. **Something a second brand needs moves up to GDL.** Make the change in
   GDL (its own PR and release), then bump GDL here.
7. **Changes are versioned.** Every PR that changes `tokens/`,
   `style-dictionary.config.mjs`, the GDL version or a component in `src/`
   (stories aside) adds `changes/<branch-name>.md` with
   `bump: patch|minor|major`. Never edit `CHANGELOG.md` directly. See
   `changes/README.md`.
8. **Contrast is enforced.** Every semantic pair meets WCAG AA in Light
   and Dark: text and labels 4.5:1, the focus ring and component borders
   3:1. `npm test` runs `check:contrast --strict`, so a new failure fails
   CI. Fix a failure in Figma (rule 2), not in `tokens/`.

## Components

`src/components/<name>/` holds `<Name>.tsx`, `<Name>.stories.tsx` and
`index.ts`, exported from `src/index.ts`. Button is the reference.

- **Build from the CAF Figma library itself.** Read the component set's
  variants, states and variable bindings with the Figma connector (the
  `figma-design-to-code` skill). Never go through an intermediate export:
  VCP's Claude Design export invented its own vocabulary.
- **Figma's names are the API.** Figma's Style becomes `variant`, because
  React reserves `style`. The component set's size becomes `size`. Other
  properties keep their names, lower-cased (`big`, `outlined`). A Figma
  state is the element's own state: Hover is `:hover`, Pressed is `:active`,
  Disabled is `disabled`. Don't add props Figma doesn't have.
- **Copy every binding exactly.** Use the semantic utility for the variable
  the layer is bound to in that state, even when it looks wrong. A wrong
  binding is fixed in Figma, then here.
- **Only token utilities.** Semantic colours (`bg-action-primary-surface-default`),
  GDL's type ramp (`text-label-md-semibold`), radius (`rounded-8`),
  elevation (`shadow-elevation-2`) and spacing on GDL's scale (`h-9` = 36px
  = `space.36`). `npm run lint:components` fails on hex, px, arbitrary
  values and off-scale spacing. Merge classes with `cn()` from
  `src/lib/cn.ts`, which knows GDL's names.
- **When Figma has a raw value**, use the nearest GDL token. Record the
  departure, and the Figma fix that would remove it, under "Components" in
  `docs/figma-sync.md`. Do the same for anything code adds that Figma
  lacks, like a focus ring.
- **Stories show every variant × state, in Light and Dark.** Force Hover
  and Pressed with `storybook-addon-pseudo-states`
  (`pseudo: { rootSelector: 'body', … }`), and check them in the story's
  `afterEach`, not `play`: the addon rewrites its CSS on `STORY_RENDERED`,
  which fires after play, so a play function never sees the forced states
  in a static build (Chromatic). Every story is an axe test that fails
  `npm test` (contrast is enforced, rule 8). If a Figma binding gives a
  component pair below AA (Tonal, today), the grids skip only those cells,
  and only in axe's contrast check. A separate story for them uses
  `a11y: { test: 'todo' }`, so the pairs stay visible in the a11y panel.
  List the ratios in `docs/figma-sync.md`, and remove the exception when
  Figma passes. Run `npm run storybook:build && npm run test:static`
  before opening a component PR: Vitest renders stories differently from
  the static build Chromatic snapshots, so a story can pass `npm test` and
  still fail there.
- A component a second brand needs moves up to GDL (rule 6).

## Naming

- Brand colour: `color.caf-blue.<step>` → `--color-caf-blue-500`, `bg-caf-blue-500`.
- Semantic: Figma `colors/surface/elevated secondary` → `surface.elevated-secondary`
  → `--color-surface-elevated-secondary`, `bg-surface-elevated-secondary`.
- Everything else is GDL's naming (see GDL's `CLAUDE.md`): `space.16`,
  `radius.8`, `type.body-md-regular`, `shadow.elevation.3`.
- Every path segment is lower-case kebab (`lint:tokens` enforces it).

## Commands

| | |
|---|---|
| `npm run import:figma` | `figma-export/` → `tokens/`, checked against GDL |
| `npm run build` | GDL tokens + CAF tokens → `dist/` (GDL's formats) |
| `npm run check:contract` | GDL's semantic contract, Light and Dark |
| `npm run check:contrast` | WCAG AA report for the semantic text, focus and border pairs (`-- --strict` fails on any) |
| `npm run lint:components` | No hex, px or arbitrary values in `src/`; spacing on GDL's scale; `cn()` in step with GDL |
| `npm run typecheck` | `tsc --noEmit` over `src/` and `.storybook/` |
| `npm run test:stories` | Every story in Vitest + Playwright: renders, play and afterEach pass, axe clean |
| `npm run test:static` | Every story against `storybook-static/` (run `storybook:build` first), as Chromatic runs it: fresh page per story, then switched over the channel twice. Fails on any play, afterEach, render or axe error. CI runs it after the build |
| `npm run storybook` | Build `dist/`, then Storybook on :6006 (Light/Dark toolbar) |
| `npm test` | What CI runs: the lints, build, contract, contrast (strict), changelog-entry lint, typecheck, story tests |
| `npm run changelog` | At release: fold `changes/` into `CHANGELOG.md` and set the version |

## Workflow

- One branch per task (`feat/…`, `fix/…`, `tokens/…`, `docs/…`), from a
  freshly pulled `origin/main`. Never push to `main`.
- Touch only the files the task needs. Before committing, list the changed
  files and confirm they match the task.
- Open a draft PR early. Describe the change in product terms and say which
  CAF screens or components look different, in Light and Dark. A component
  change is checked in Storybook against the Figma render.
- Merge `main` into your branch, never rebase; never force-push.
- Finish by reporting files changed and why, checks run with results, any
  breaking change, and a PR description.
