# Changelog

## 0.1.0 — unreleased

### First release — CAF's tokens on GDL (October 2026)

- **Built on GDL 0.1** (`@vdm-design-team/gdl`, from its git tag). It
  inherits the palette, spacing, radius, stroke, fonts, elevation 1–7, the
  47-style type ramp, dark elevation, desktop sizes and the build formats.
  The output uses the same file and CSS variable names as GDL's.
- **CAF's own tokens, generated from the CAF Figma library**
  (`figma-export/` → `npm run import:figma`):
  - `color.caf-blue` and `color.caf-blue-on-dark` (11 steps each)
  - `font.family.sans` → Inter, CAF's only override of GDL
  - 312 semantic colours in Light and Dark
- **Checked against GDL.** The GDL contract is satisfied: 247/247 required
  names, plus 7 known CAF extensions. All semantic aliases resolve to GDL
  Primitives or CAF's Brand Primitives. CAF's 45 text styles and 10
  elevations match GDL's exactly.
- **Contrast report** (`npm run check:contrast`): 37 semantic pairs below
  WCAG AA, 3 in Light (`text.subtle`) and 34 in Dark. The report doesn't
  fail the build yet. The fixes belong in Figma.
