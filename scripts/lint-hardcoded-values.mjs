/**
 * Fails when a component hardcodes a value that should be a token. VCP's
 * guardrail (VCP-design-system/scripts/lint-hardcoded-values.mjs), pointed at
 * GDL, which owns CAF's scales:
 *
 * 1. No hex, rgb()/hsl(), raw px, or arbitrary Tailwind value (`bg-[…]`,
 *    `p-[…]`) in src/. Colours come from the semantic utilities
 *    (`bg-action-primary-surface-default`), sizes from GDL's scales.
 * 2. Spacing and size utilities stay on GDL's space scale (`space.*`, in px).
 *    Tailwind's numeric scale is 4px a step, so `h-9` is 36px = space.36,
 *    but `gap-2.5` (10px) is not a GDL value.
 * 3. The scales declared in src/lib/cn.ts (type ramp, radius, elevation) match
 *    GDL's tokens, so tailwind-merge never drops a class it doesn't know.
 *
 * Stories are exempt: they lay out the gallery, they don't ship. Comments are
 * not checked. A line can opt out with `ds-lint-ignore` and a reason.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const GDL = 'node_modules/@vdm-design-team/gdl/tokens';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const names = (node) => Object.keys(node).filter((k) => !k.startsWith('$'));

const dimension = read(`${GDL}/core/dimension.json`);
const SPACE_PX = new Set(names(dimension.space).map(Number));

const RULES = [
  [/#[0-9a-fA-F]{3,8}\b/g, 'hex colour — use a semantic colour utility'],
  [/\b(rgb|rgba|hsl|hsla|oklch)\(/g, 'raw colour function — use a semantic colour utility'],
  [/\b(bg|text|border|fill|stroke|outline|ring|inset-ring|shadow|decoration)-\[[^\]]+\]/g, 'arbitrary Tailwind colour — use a token utility'],
  [/\b(p|m|gap|w|h|size|min-w|min-h|max-w|max-h|top|left|right|bottom|inset|rounded|leading|tracking)[trblxyse]?-\[[^\]]+\]/g, 'arbitrary Tailwind size — use a GDL scale'],
  [/\b\d+(\.\d+)?px\b/g, 'raw px value — use a GDL scale'],
];

/* `h-9`, `px-5`, `gap-x-2`, `-mt-1`, `size-5` … → 4px a step, checked against space.* */
const SPACING =
  /(?<![\w-])-?(p[trblxyse]?|m[trblxyse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|size|min-w|min-h|max-w|max-h|w|h|top|left|right|bottom|start|end)-(\d+(?:\.\d+)?)(?![\w./-])/g;

/* Comments may mention px ("20px sides"); only code is checked. Blanking them
   keeps line numbers. */
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : ['.tsx', '.ts', '.css'].includes(extname(p)) ? [p] : [];
  });

let failed = 0;
const fail = (msg) => {
  console.error(msg);
  failed++;
};

for (const file of walk('src')) {
  if (/\.stories\.tsx?$/.test(file)) continue;
  stripComments(readFileSync(file, 'utf8'))
    .split('\n')
    .forEach((line, i) => {
      if (/ds-lint-ignore/.test(line)) return;
      for (const [re, msg] of RULES) for (const m of line.matchAll(re)) fail(`${file}:${i + 1}  ${m[0]}  →  ${msg}`);
      for (const m of line.matchAll(SPACING)) {
        const px = Number(m[2]) * 4;
        if (!SPACE_PX.has(px)) fail(`${file}:${i + 1}  ${m[0]}  →  ${px}px is not on GDL's space scale (${[...SPACE_PX].join(', ')})`);
      }
    });
}

/* Rule 3 — src/lib/cn.ts declares GDL's scales for tailwind-merge. */
const cn = readFileSync('src/lib/cn.ts', 'utf8');
const declared = (constName) => {
  const body = cn.match(new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\] as const`))?.[1] ?? '';
  return [...body.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);
};
const expected = {
  TYPE_RAMP: names(read(`${GDL}/semantic/type.json`).type),
  RADIUS: names(dimension.radius),
  ELEVATION: names(read(`${GDL}/core/elevation.json`).shadow.elevation).map((n) => `elevation-${n}`),
};
for (const [constName, tokens] of Object.entries(expected)) {
  const list = declared(constName);
  const missing = tokens.filter((t) => !list.includes(t));
  const stale = list.filter((d) => !tokens.includes(d));
  if (missing.length || stale.length)
    fail(
      `src/lib/cn.ts ${constName} is out of step with GDL's tokens` +
        (missing.length ? `\n  missing: ${missing.join(', ')}` : '') +
        (stale.length ? `\n  stale:   ${stale.join(', ')}` : ''),
    );
}

if (failed) {
  console.error(`\n✖ ${failed} problem(s). Components use token utilities only; a missing value goes into Figma and tokens/ first.`);
  process.exit(1);
}
console.log('✔ No hardcoded values in src/; cn() matches GDL’s scales');
