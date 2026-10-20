/**
 * Checks CAF's token files against its parent, GDL:
 *
 * 1. Every `{reference}` in tokens/ resolves — to a GDL token or a CAF one.
 * 2. Token names are lower-case kebab segments (they become CSS variable and
 *    Tailwind class names).
 * 3. CAF's core colour families are CAF's own (`caf-*`) and never a copy of
 *    a GDL family. Slate, green, orange … come from GDL.
 * 4. CAF overrides no GDL token except those on the allow-list below. Adding
 *    one means editing the list in the same PR, so a reviewer sees that CAF
 *    is departing from GDL.
 * 5. Semantic tokens sit under the contract's roots (text, surface, stroke,
 *    action, neutral, accent) — the rest of the contract is gdl-check-contract's job.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const GDL = 'node_modules/@vdm-design-team/gdl';
const ALLOWED_OVERRIDES = {
  'font.family.sans': "CAF's UI face is Inter (GDL default: Poppins)",
};
const MODE_ROOTS = ['dark', 'desktop'];

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const files = (dir) => readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));
const tokensIn = (node, path = [], out = new Map()) => {
  for (const [k, v] of Object.entries(node ?? {})) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if ('$value' in v) out.set([...path, k], v.$value);
    else tokensIn(v, [...path, k], out);
  }
  return out;
};
const collect = (dir) => {
  const all = new Map();
  for (const f of files(dir)) for (const [path, value] of tokensIn(read(f))) all.set(path.join('.'), { path, value, file: f });
  return all;
};
const unmoded = (p) => (MODE_ROOTS.includes(p[0]) ? p.slice(1) : p).join('.');

const gdl = collect(join(GDL, 'tokens'));
const caf = collect('tokens');
const { roots } = read(join(GDL, 'contract/semantic-color.json'));

let failed = 0;
const fail = (m) => { console.error(`✖ ${m}`); failed++; };
const known = new Set([...gdl.values(), ...caf.values()].map((t) => unmoded(t.path)));

const refsIn = (v) => (typeof v === 'string' ? [...v.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]) : v && typeof v === 'object' ? Object.values(v).flatMap(refsIn) : []);
for (const [key, { path, value, file }] of caf) {
  for (const seg of path) if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(seg)) fail(`${file}: ${key} — "${seg}" is not lower-case kebab`);
  for (const ref of refsIn(value)) if (!known.has(ref)) fail(`${file}: ${key} → {${ref}} does not resolve (not in GDL or CAF)`);
  if (gdl.has(key) && !(key in ALLOWED_OVERRIDES)) fail(`${file}: ${key} overrides GDL — CAF inherits it. If CAF really differs, add it to ALLOWED_OVERRIDES in scripts/lint-tokens.mjs`);
  const root = unmoded(path).split('.')[0];
  if (file.includes('semantic') && !roots.includes(root)) fail(`${file}: ${key} — semantic tokens live under ${roots.join(', ')}`);
}

const gdlFamilies = new Set([...gdl.keys()].filter((k) => k.startsWith('color.')).map((k) => k.split('.')[1]));
const families = Object.keys(read('tokens/core/color.json').color).filter((k) => !k.startsWith('$'));
for (const f of families) {
  if (gdlFamilies.has(f)) fail(`tokens/core/color.json: color.${f} is a GDL family — reference GDL's instead of keeping a copy`);
  else if (!f.startsWith('caf-')) fail(`tokens/core/color.json: color.${f} — CAF's own ramps are named caf-*`);
}

for (const key of Object.keys(ALLOWED_OVERRIDES)) if (!caf.has(key)) fail(`ALLOWED_OVERRIDES lists ${key}, which CAF no longer overrides — remove it from the list`);

if (failed) process.exit(1);
const overrides = [...caf.keys()].filter((k) => gdl.has(k));
console.log(`✔ ${caf.size} CAF tokens on ${gdl.size} GDL tokens: names valid, references resolve, ${families.length} brand families (${families.join(', ')}), overrides: ${overrides.join(', ') || 'none'}`);
