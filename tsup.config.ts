import { existsSync, rmSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { defineConfig, type Options } from 'tsup';
import type { Plugin } from 'esbuild';

/* ------------------------------------------------------------------ *
 * The package's JS (`npm run build`, after `npm run tokens`).
 *
 *   src/index.ts             → dist/index.js     the "." export: named
 *                                                re-exports of every module
 *   src/components/**, lib/  → dist/components/**, dist/lib/**
 *                                                one file per source module
 *   dist/tokens.ts           → dist/tokens.js    the "./tokens" export
 *
 * One file per module, not one bundle, so an app ships only the
 * components it imports. With `"sideEffects": ["*.css"]` in package.json,
 * the app's bundler drops every module the app's imports don't reach.
 * (A single bundle can't be tree-shaken: each component's top-level
 * `forwardRef()`, `cva()` and `displayName` keep it in.)
 *
 * `"use client"` (Next.js App Router) goes on every module in
 * components/ and lib/: each is a client module, as the one bundle was.
 * esbuild drops a per-file directive when it bundles, so the banner adds
 * it to the output. dist/index.js has none and only re-exports: were it a
 * client module, Next.js (Turbopack) would send everything it imports to
 * the browser; as it is, a Server Component's `import { Button }` sends
 * Button's folder alone. The re-exports are named: Next.js rejects
 * `export *` in a client module and can't trim one that leads into them.
 *
 * ESM only. Types come from `tsc -p tsconfig.build.json` (see there for
 * why tsup's dts step is off). dependencies and peerDependencies stay
 * external, so the app gets one React.
 *
 * `clean` stays off: dist/ also holds what the token build just wrote —
 * theme.css, tokens.css, the JSON — and the package exports those too.
 * So the old module folders are removed here instead, and a deleted
 * component can't linger in dist/.
 * ------------------------------------------------------------------ */

const SRC = resolve('src');
for (const dir of ['components', 'lib']) rmSync(resolve('dist', dir), { recursive: true, force: true });

/** The source file a relative import names: `./Button` → Button.tsx, `../overlay` → overlay/index.ts. */
const sourceFile = (path: string) =>
  ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((ext) => path + ext).find(existsSync);

/**
 * Keeps every module in its own output file: a relative import stays an
 * import, of that module's `.js` output, instead of being bundled in.
 *
 * In src/index.ts (`root`), each `export * from './components/button'`
 * becomes named re-exports from that folder's index.js:
 * `import { Button, BUTTON_SIZES, … } from './components/button/index.js'`.
 * esbuild can only list the names if it reads the folder's index.ts, so
 * that file is bundled in, and its own re-exports point back at its output.
 */
const oneFilePerModule = ({ root }: { root: boolean }): Plugin => ({
  name: 'one-file-per-module',
  setup(build) {
    const external = (from: string, file: string) => {
      const path = relative(from, file).replace(/\.tsx?$/, '.js');
      return { path: path.startsWith('.') ? path : `./${path}`, external: true };
    };
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (args.kind === 'entry-point') return undefined;
      const file = sourceFile(resolve(args.resolveDir, args.path));
      if (!file) return undefined;
      if (!root) return external(args.resolveDir, file);
      if (args.importer !== resolve(SRC, 'index.ts')) return external(SRC, args.importer);
      return /\/index\.tsx?$/.test(file) ? { path: file } : external(SRC, file);
    });
  },
});

const modules: Options = {
  format: ['esm'],
  target: 'es2022',
  outDir: 'dist',
  clean: false,
  sourcemap: true,
};

export default defineConfig([
  { ...modules, entry: ['src/index.ts'], esbuildPlugins: [oneFilePerModule({ root: true })] },
  {
    ...modules,
    entry: ['src/components/**/*.{ts,tsx}', 'src/lib/*.ts', '!src/**/*.stories.tsx'],
    esbuildPlugins: [oneFilePerModule({ root: false })],
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
