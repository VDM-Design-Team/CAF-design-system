import { defineConfig } from 'tsup';

/* ------------------------------------------------------------------ *
 * The package's JS (`npm run build`, after `npm run tokens`). VCP's
 * setup (VCP-design-system/tsup.config.ts), unchanged in substance.
 *
 *   src/index.ts    → dist/index.js     the "." export — every component
 *   dist/tokens.ts  → dist/tokens.js    the "./tokens" export — token values
 *
 * ESM only. Types come from `tsc -p tsconfig.build.json` (see there for why
 * tsup's dts step is off). dependencies and peerDependencies stay external,
 * so the app gets one React.
 *
 * `clean` stays off: dist/ also holds what the token build just wrote —
 * theme.css, tokens.css, the JSON — and the package exports those too.
 * ------------------------------------------------------------------ */

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    target: 'es2022',
    outDir: 'dist',
    clean: false,
    sourcemap: true,
    /* Next.js App Router: the components use state, effects and handlers, so
       the whole entry is a client module. esbuild drops a per-file
       "use client" when it bundles, so the directive goes on the output. */
    banner: { js: '"use client";' },
  },
  {
    /* Plain data — no directive, so server components can read it. */
    entry: { tokens: 'dist/tokens.ts' },
    format: ['esm'],
    target: 'es2022',
    outDir: 'dist',
    clean: false,
  },
]);
