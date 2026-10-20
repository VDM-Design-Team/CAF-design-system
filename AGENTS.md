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
   `style-dictionary.config.mjs` or the GDL version adds
   `changes/<branch-name>.md` with `bump: patch|minor|major`. Never edit
   `CHANGELOG.md` directly. See `changes/README.md`.
8. **Contrast is reported, not yet enforced.** `npm run check:contrast`
   lists every semantic pair below WCAG AA. Don't add new failures. Fixes go
   to Figma (rule 2), not into `tokens/`.

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
| `npm run check:contrast` | WCAG AA report for the semantic pairs |
| `npm test` | What CI runs: lint, build, contract, contrast report, changelog-entry lint |
| `npm run changelog` | At release: fold `changes/` into `CHANGELOG.md` and set the version |

## Workflow

- One branch per task (`feat/…`, `fix/…`, `tokens/…`, `docs/…`), from a
  freshly pulled `origin/main`. Never push to `main`.
- Touch only the files the task needs. Before committing, list the changed
  files and confirm they match the task.
- Open a draft PR early. Describe the change in product terms and say which
  CAF screens or components look different, in Light and Dark.
- Merge `main` into your branch, never rebase; never force-push.
- Finish by reporting files changed and why, checks run with results, any
  breaking change, and a PR description.
