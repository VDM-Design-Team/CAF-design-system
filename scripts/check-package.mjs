/**
 * Checks what `npm publish` would ship (run `npm run build` first):
 *
 * 1. Every target in package.json `exports` is in the package, so no import
 *    an app makes (`@vdm-design-team/caf`, `/theme.css`, `/tokens.json` …)
 *    resolves to a missing file.
 * 2. The component modules, their types and the CSS are there.
 *    - Every module dist/index.js imports, directly or through another
 *      module, is in the package, and every module in dist/components/ and
 *      dist/lib/ is one of them (nothing stale or stray).
 *    - Each of those modules starts with "use client"; dist/index.js
 *      doesn't, and no module uses `export *` (Next.js rejects it in a
 *      client module and can't trim one that leads into them).
 *    - Packages they import are dependencies or peerDependencies.
 *    - theme.css has the `@source` lines on the modules.
 * 3. Nothing that isn't the product is: stories, story helpers, patterns,
 *    templates, the Storybook build, src/ itself.
 *
 * It reads `npm pack --dry-run --json` with scripts off, so it checks the
 * dist/ that is there and doesn't rebuild it.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [pack] = JSON.parse(execSync('npm pack --dry-run --json --ignore-scripts', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
const files = new Set(pack.files.map((f) => f.path));

let failed = 0;
const fail = (msg) => { console.error(`✘ ${msg}`); failed++; };

/* 1. Every exports target (wildcards: at least one file under the prefix). */
const targets = (value) => (typeof value === 'string' ? [value] : Object.values(value).flatMap(targets));
for (const [entry, value] of Object.entries(pkg.exports)) {
  for (const target of targets(value)) {
    const path = target.replace(/^\.\//, '');
    const ok = path.includes('*') ? [...files].some((f) => f.startsWith(path.split('*')[0])) : files.has(path);
    if (!ok) fail(`exports["${entry}"] → ${target} is not in the package (run \`npm run build\`).`);
  }
}

/* 2. What an app needs. */
for (const path of ['dist/index.js', 'dist/types/src/index.d.ts', 'dist/theme.css', 'dist/tokens.css', 'dist/tokens.dark.css']) {
  if (!files.has(path)) fail(`${path} is not in the package.`);
}
const theme = readFileSync('dist/theme.css', 'utf8');
for (const dir of ['components', 'lib']) {
  if (!theme.includes(`@source "./${dir}";`)) fail(`dist/theme.css has no @source on dist/${dir}/, so apps get unstyled components.`);
}

/* The modules: walk the imports from dist/index.js. */
const external = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})]);
const reached = new Set();
const walk = (path) => {
  if (reached.has(path)) return;
  reached.add(path);
  if (!files.has(path)) return fail(`${path} is imported but is not in the package.`);
  const code = readFileSync(path, 'utf8');
  const client = code.startsWith('"use client";');
  if (path === 'dist/index.js' ? client : !client) fail(`${path} ${client ? 'starts' : "doesn't start"} with "use client".`);
  if (/^export \*/m.test(code)) fail(`${path} has \`export *\`: Next.js rejects it in a client module and can't trim one that leads into them. Re-export by name.`);
  for (const [, from, bare] of code.matchAll(/^(?:import|export)\b[^'"]*?\bfrom\s*["']([^"']+)["']|^import\s*["']([^"']+)["']/gm)) {
    const spec = from ?? bare;
    if (spec.startsWith('.')) walk(posix.join(posix.dirname(path), spec));
    else if (!external.has(spec.split('/').slice(0, spec.startsWith('@') ? 2 : 1).join('/'))) {
      fail(`${path} imports ${spec}, which isn't a dependency or peerDependency.`);
    }
  }
};
walk('dist/index.js');
const modules = [...files].filter((f) => /^dist\/(components|lib)\/.*\.js$/.test(f));
for (const f of modules) if (!reached.has(f)) fail(`${f} is in the package, but dist/index.js never imports it.`);

/* 3. Nothing else. */
const stray = [...files].filter((f) =>
  /(^|\/)storybook-static\//.test(f) || /^src\//.test(f) || /\.stories\./.test(f) || /(^|\/)(patterns|templates)\//.test(f) || /(^|\/)checks\.(d\.ts|js|ts)$/.test(f),
);
for (const f of stray) fail(`${f} is in the package but isn't part of the product.`);

if (failed) {
  console.error(`\n${failed} problem(s) in what \`npm publish\` would ship.`);
  process.exit(1);
}
const types = [...files].filter((f) => f.endsWith('.d.ts')).length;
console.log(`✔ package: ${files.size} files (${reached.size} JS modules, ${types} .d.ts), every export and import resolves, no stories or Storybook build. ${(pack.size / 1000).toFixed(1)} kB packed.`);
