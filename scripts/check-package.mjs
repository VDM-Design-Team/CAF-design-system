/**
 * Checks what `npm publish` would ship (run `npm run build` first):
 *
 * 1. Every target in package.json `exports` is in the package, so no import
 *    an app makes (`@vdm-design-team/caf`, `/theme.css`, `/tokens.json` …)
 *    resolves to a missing file.
 * 2. The component bundle, its types and the CSS are there.
 * 3. Nothing that isn't the product is: stories, story helpers, patterns,
 *    templates, the Storybook build, src/ itself.
 *
 * It reads `npm pack --dry-run --json` with scripts off, so it checks the
 * dist/ that is there and doesn't rebuild it.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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
if (!theme.includes('@source "./index.js";')) fail('dist/theme.css has no @source on the component bundle, so apps get unstyled components.');

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
console.log(`✔ package: ${files.size} files (${types} .d.ts), every export resolves, no stories or Storybook build. ${(pack.size / 1000).toFixed(1)} kB packed.`);
