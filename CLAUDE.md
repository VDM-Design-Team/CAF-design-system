# Working on CAF

The CAF Design System is a **child of GDL** (`@vdm-design-team/gdl`, repo
`VDM-Design-Team/GDL-design-system`). GDL owns everything shared: palette,
spacing, radius, stroke, fonts, elevation, the type ramp, the semantic
colour contract and the build tooling. This repo keeps only what is CAF's.
Read `docs/inheritance.md` before changing anything structural.

## Rules — apply to every change

1. **Only CAF's own things live here.** That means CAF's brand ramps
   (`color.caf-blue`, `color.caf-blue-on-dark`), CAF's UI face
   (`font.family.sans` → Open Sans) and CAF's semantic colour values. Never copy
   a GDL token in. `npm run lint:tokens` fails on a GDL colour family in
   `tokens/core/color.json` and on any GDL token CAF overrides that isn't on
   `ALLOWED_OVERRIDES` in `scripts/lint-tokens.mjs`. Adding to that list is a
   reviewed decision that CAF departs from GDL.
2. **The repo is the source of truth.** CAF left Figma on 23 Nov 2026, so
   nothing is generated or copied from it any more. Edit `tokens/` directly:
   `tokens/core/color.json` (CAF's brand ramps), `tokens/core/typography.json`
   (CAF's UI face), and `tokens/semantic/color.json` with
   `tokens/semantic/color.dark.json` (the semantic names, Light and Dark;
   change both in the same PR). A colour that isn't CAF's brand is a GDL
   colour: reference it (`{color.slate.500}`), and if GDL doesn't have it,
   add it to GDL first (rule 6). Don't type a new hex into a semantic token;
   `check:contract` counts the raw values that are left. `docs/figma-sync.md`
   is the record of how the tokens and components came from Figma up to
   1.2.0. It is history, not a process.
3. **CAF's semantics reference only GDL's colours or CAF's brand ramps.**
   `npm run lint:tokens` fails on a reference that resolves to neither, and
   `check:contract` fails on one that points outside GDL and CAF's own core.
4. **CAF inherits the type ramp and elevation.** CAF's tokens don't define
   them, and `lint:tokens` fails on a GDL token CAF overrides. A real
   CAF-only decision goes through rule 1's allow-list.
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
   CI. Fix a failure in `tokens/` (rule 2), in Light and Dark, not with a
   one-off in a component.

## Components

`src/components/<name>/` holds `<Name>.tsx`, `<Name>.stories.tsx` and
`index.ts`, exported from `src/index.ts`. Button is the reference.

- **Storybook is the reference.** The components were built from the CAF
  Figma library up to 1.2.0. Now a component's stories are its spec, and
  the design for new work comes with the task (a design canvas, a prototype,
  a written decision). Translate its colours and sizes to tokens; never copy
  its raw values.
- **The API keeps its vocabulary.** The names came from Figma and stay:
  `variant` for the style (React reserves `style`), `size` for the size, and
  other properties lower-cased (`big`, `outlined`). Name new props the same
  way. A state is the element's own state: Hover is `:hover`, Pressed is
  `:active`, Disabled is `disabled`. Don't add a prop no design or screen
  needs.
- **Use the semantic token for the role, in every state.** If a pair looks
  wrong or fails contrast, fix the token (rule 2), not the component.
- **Only token utilities.** Semantic colours (`bg-action-primary-surface-default`),
  GDL's type ramp (`text-label-md-semibold`), radius (`rounded-8`),
  elevation (`shadow-elevation-2`) and spacing on GDL's scale (`h-9` = 36px
  = `space.36`). `npm run lint:components` fails on hex, px, arbitrary
  values and off-scale spacing. Merge classes with `cn()` from
  `src/lib/cn.ts`, which knows GDL's names.
- **When a design has a raw value**, use the nearest GDL token and say so
  in the PR. "Components" in `docs/figma-sync.md` lists where the code
  departed from Figma, and why. It is history, so don't add to it.
- **Stories show every variant × state, in Light and Dark.** Force Hover
  and Pressed with `storybook-addon-pseudo-states`
  (`pseudo: { rootSelector: 'body', … }`), and check them in the story's
  `afterEach`, not `play`: the addon rewrites its CSS on `STORY_RENDERED`,
  which fires after play, so a play function never sees the forced states
  in a static build (Chromatic). Every story is an axe test that fails
  `npm test` (contrast is enforced, rule 8). If a component pair is
  below AA (Tonal, today), the grids skip only those cells,
  and only in axe's contrast check. A separate story for them uses
  `a11y: { test: 'todo' }`, so the pairs stay visible in the a11y panel.
  The ratios are in `docs/figma-sync.md`; remove the exception when the
  tokens pass. A story that sets a mobile `viewport` global also sets
  `parameters.chromatic.viewports` (e.g. `[320]`): Chromatic ignores the
  global and would snapshot it at desktop width. Run `npm run storybook:build && npm run test:static`
  before opening a component PR: Vitest renders stories differently from
  the static build Chromatic snapshots, so a story can pass `npm test` and
  still fail there.
- A component a second brand needs moves up to GDL (rule 6).

## Naming

- Brand colour: `color.caf-blue.<step>` → `--color-caf-blue-500`, `bg-caf-blue-500`.
- Semantic: `surface.elevated-secondary` →
  `--color-surface-elevated-secondary`, `bg-surface-elevated-secondary`.
- Everything else is GDL's naming (see GDL's `CLAUDE.md`): `space.16`,
  `radius.8`, `type.body-md-regular`, `shadow.elevation.3`.
- Every path segment is lower-case kebab (`lint:tokens` enforces it).

## Commands

| | |
|---|---|
| `npm run tokens` | GDL tokens + CAF tokens → `dist/` (GDL's formats) |
| `npm run build` | `tokens`, then the components, one file per module (`dist/index.js`, `dist/components/`, `dist/lib/`, tsup), and their types (`dist/types/`, `tsc -p tsconfig.build.json`): what the package ships |
| `npm run check:package` | What `npm publish` would ship: every export and module import resolves, every component module has `"use client"` and none is stray, the types and CSS are there, no stories or Storybook build |
| `npm run check:contract` | GDL's semantic contract, Light and Dark |
| `npm run check:contrast` | WCAG AA report for the semantic text, focus and border pairs (`-- --strict` fails on any) |
| `npm run lint:components` | No hex, px or arbitrary values in `src/`; spacing on GDL's scale; `cn()` in step with GDL |
| `npm run typecheck` | `tsc --noEmit` over `src/` and `.storybook/` |
| `npm run test:stories` | Every story in Vitest + Playwright: renders, play and afterEach pass, axe clean |
| `npm run test:static` | Every story against `storybook-static/` (run `storybook:build` first), as Chromatic runs it: fresh page per story (at the story's `chromatic.viewports` width if it has one), then switched over the channel twice. Fails on any play, afterEach, render or axe error. `-- --shard=i/n` runs one slice; CI runs 8 slices in parallel jobs |
| `npm run storybook` | Build the tokens, then Storybook on :6006 (Light/Dark toolbar) |
| `npm test` | What CI runs: the lints, build, package check, contract, contrast (strict), changelog-entry lint, typecheck, story tests |
| `npm run changelog` | At release: fold `changes/` into `CHANGELOG.md` and set the version |

## Workflow

- One branch per task (`feat/…`, `fix/…`, `tokens/…`, `docs/…`), from a
  freshly pulled `origin/main`. Never push to `main`.
- Touch only the files the task needs. Before committing, list the changed
  files and confirm they match the task.
- Open a draft PR early. Describe the change in product terms and say which
  CAF screens or components look different, in Light and Dark. A component
  change is checked in Storybook, in Light and Dark.
- Merge `main` into your branch, never rebase; never force-push.
- Finish by reporting files changed and why, checks run with results, any
  breaking change, and a PR description.
