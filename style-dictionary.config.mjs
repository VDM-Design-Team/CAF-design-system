import StyleDictionary from 'style-dictionary';
import { registerGdlFormats, gdlPlatforms, gdlIncludes } from '@vdm-design-team/gdl/build';

/* ------------------------------------------------------------------ *
 * CAF's build — GDL's formats over GDL's tokens plus CAF's own.
 *
 *   include  GDL: palette, spacing, radius, stroke, fonts, elevation,
 *            the 47-style type ramp, dark elevation, desktop sizes
 *   source   CAF: caf-blue ramps, font.family.sans → Inter, and the
 *            semantic colours (Light + Dark)
 *
 * CAF's files win on a collision, which is how CAF overrides a GDL
 * default. The only one allowed is font.family.sans (Style Dictionary
 * reports it as a collision); lint:tokens fails on any other.
 *
 * Output (dist/) has the same file names and CSS variable names as
 * GDL's, so an app swaps `@vdm-design-team/gdl/theme.css` for
 * `@vdm-design-team/caf/theme.css` and nothing else changes.
 * ------------------------------------------------------------------ */
registerGdlFormats(StyleDictionary);

export default {
  include: gdlIncludes(),
  source: ['tokens/**/*.json'],
  platforms: gdlPlatforms(),
  log: { warnings: 'disabled' },
};
