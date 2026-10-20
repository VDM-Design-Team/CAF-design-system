# How CAF inherits from GDL

```
GDL  (@vdm-design-team/gdl)                     CAF  (this repo)
├─ tokens/core      palette, space, radius,     ├─ tokens/core/color.json        caf-blue, caf-blue-on-dark
│                   stroke, fonts, elevation    ├─ tokens/core/typography.json   font.family.sans → Inter
├─ tokens/modes     dark elevation, desktop     └─ tokens/semantic/              312 names, Light + Dark
├─ tokens/semantic  the 47-style type ramp
├─ contract/        247 required semantic names   ──▶ gdl-check-contract in CAF's npm test
└─ build/           Style Dictionary formats      ──▶ CAF's style-dictionary.config.mjs
```

CAF's build reads GDL's `tokens/` first (`include`) and then CAF's own
`tokens/` (`source`). On a collision CAF wins, which is how a brand
overrides a GDL default. Only `font.family.sans` is allowed to collide.

## Figma ↔ GitHub

| Figma | GitHub |
|---|---|
| CAF Design Library subscribes to GDL | `package.json` depends on `@vdm-design-team/gdl` |
| "Library updates available → Review" | a GDL-bump PR here; CI, the contrast report and the visual review show the effect |
| CAF's Brand Primitives collection | `tokens/core/color.json` |
| CAF's Semantics collection (Light / Dark) | `tokens/semantic/color.json` / `color.dark.json` |
| A Semantics variable aliases GDL `colors/slate/500` | `{color.slate.500}`, resolved from GDL |
| CAF's text styles (Inter) | GDL's type ramp + `font.family.sans` → Inter |
| CAF's Elevation effect styles | GDL's `shadow.elevation.*` (identical; the importer checks) |

## What CAF overrides, and why

| Token | GDL | CAF | Why |
|---|---|---|---|
| `font.family.sans` | Poppins | Inter | All 45 CAF text styles are set in Inter |

That's the whole list. Everything else is GDL's, unchanged. The proof is
`dist/`: apart from the semantic colours, CAF's build differs from GDL's
only in the two `caf-blue` ramps and `--font-sans`. Dark elevation and the
desktop type sizes are byte-identical.

## CAF's extensions to the contract

GDL's contract lists these as known CAF extensions. They are all in use:

- `accent.pending.*` (28), an orange status family for "pending"
- `accent.orange.*` (6), decorative tints
- `neutral.filled.*` (12), plus selected and deselected states on
  every neutral style
- `neutral.textual.surface.*` (6)
- `surface.elevated-secondary`, for modals and inputs

If VCP, BeyondFriends or WHU picks one of these up, propose it to GDL as
`required`.

## Why GDL comes from git, not GitHub Packages

GDL is published to GitHub Packages, but installing from there needs a token
with `read:packages`, even for a public package. GDL's repo is public, so
CAF depends on its release tag instead:

```json
"@vdm-design-team/gdl": "github:VDM-Design-Team/GDL-design-system#semver:^0.1.0"
```

This is the same version range a registry dependency would have. It
resolves only to tagged releases, and `package-lock.json` pins the exact
commit. npm clones over https (the lockfile's `git+ssh` URL is only npm's
canonical form). So `npm ci` needs no token, locally or in CI.

Switching to the registry later is a one-line change, once every machine
and workflow that installs CAF has `read:packages`.

## Decisions (October 2026)

- **Tokens first (v0.1).** Components come next, built straight from the CAF
  Figma library. VCP's experience: an intermediate export invents its own
  vocabulary.
- **Faithful to Figma.** Contrast failures are reported, not patched in the
  repo (VCP patched them in its importer). Fixes go to Figma, so design and
  code can't drift.
- **Descriptions.** A designer-written Figma description ("Modals, inputs")
  ships as a CSS comment. The generated ones ("Fill colour: accent › …")
  are dropped, because they only repeat the name.
