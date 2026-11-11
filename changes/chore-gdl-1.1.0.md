---
bump: minor
---
### CAF installs GDL 1.1.0 (November 2026)

`@vdm-design-team/gdl` goes from ^1.0.0 to ^1.1.0. It only adds tokens,
which CAF now ships but doesn't use yet:

- **The type ramp's metrics:** `--font-line-height-<tier>` and
  `--font-letter-spacing-<tier>` for all 15 tiers (in `tokens.css`,
  `tokens.json` and `tokens.ts`). They are the values the `text-*`
  utilities already use, now also as Figma variables, so CAF's text styles
  can bind them.
- **Open Sans:** `font.family.open-sans` (`--font-open-sans`, the
  `font-open-sans` utility). CAF's UI face is still Inter.

No `text-*` utility, colour or component changes, so nothing looks different
in Light or Dark.
