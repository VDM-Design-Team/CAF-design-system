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

/* theme.css is the stylesheet a CAF app imports in place of
 * `@import "tailwindcss"`, so it keeps GDL's `@import "tailwindcss"` line.
 * Below it CAF adds an `@source` on the component bundle beside it
 * (dist/index.js): Tailwind skips node_modules when it scans, so without
 * this an app would get the components with no styles. With it, the app's
 * Tailwind generates the components' classes with no `@source` of its own.
 * (VCP does the same, but its theme.css drops the Tailwind import, because
 * VCP apps import Tailwind themselves.) */
const gdlTheme = StyleDictionary.hooks.formats['gdl/tailwind-theme'];
StyleDictionary.registerFormat({
  name: 'caf/tailwind-theme',
  format: async (args) => {
    const css = await gdlTheme(args);
    const tailwind = '@import "tailwindcss";\n';
    const themed = css.replace(tailwind, `${tailwind}@source "./index.js";\n`);
    if (themed === css) throw new Error('caf/tailwind-theme: GDL\'s theme no longer has @import "tailwindcss" — update this wrapper.');
    return themed;
  },
});

const platforms = gdlPlatforms();
platforms.tailwind.files = platforms.tailwind.files.map((f) =>
  f.destination === 'theme.css' ? { ...f, format: 'caf/tailwind-theme' } : f,
);

export default {
  include: gdlIncludes(),
  source: ['tokens/**/*.json'],
  platforms,
  log: { warnings: 'disabled' },
};
