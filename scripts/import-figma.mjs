/**
 * Figma → tokens. Turns the snapshots in figma-export/ into CAF's token files
 * in tokens/. Re-runnable: it overwrites every file it writes, so a Figma
 * change is "re-export the snapshot, run this, review the diff".
 *
 *   npm run import:figma
 *
 * How to refresh the snapshots is in docs/figma-sync.md.
 *
 * What it reads
 *   figma-export/caf-variables.json  CAF's two variable collections:
 *                                    Brand Primitives (CAF's own ramps) and
 *                                    Semantics (Light / Dark)
 *   figma-export/caf-styles.json     CAF's text styles and Elevation effect styles
 *   node_modules/@vdm-design-team/gdl  the parent: its colour palette, type ramp
 *                                    and elevation, to resolve and compare against
 *
 * What it writes — only what is CAF's own
 *   tokens/core/color.json           color.caf-blue.*, color.caf-blue-on-dark.*
 *   tokens/core/typography.json      font.family.sans → CAF's UI face
 *   tokens/semantic/color.json       the semantic names → references, Light
 *   tokens/semantic/color.dark.json  the same under a "dark" root
 *
 * What it checks (and fails on)
 *   - a Semantics alias that points anywhere but GDL's Primitives or CAF's
 *     Brand Primitives (the Figma equivalent of a foreign import)
 *   - a reference GDL doesn't have
 *   - a CAF text style or elevation that differs from GDL's. CAF inherits the
 *     type ramp and elevation; a difference means either CAF's Figma drifted
 *     (fix it there) or CAF made a real brand decision (then it needs an
 *     override here and an entry on lint-tokens' allow-list).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const GDL = 'node_modules/@vdm-design-team/gdl';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, obj) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
  console.log('✔', p);
};
const kebab = (s) => s.trim().toLowerCase().replace(/\s+/g, '-');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const tokensIn = (node, path = [], out = new Map()) => {
  for (const [k, v] of Object.entries(node ?? {})) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if ('$value' in v) out.set([...path, k].join('.'), v);
    else tokensIn(v, [...path, k], out);
  }
  return out;
};

const vars = read('figma-export/caf-variables.json');
const styles = read('figma-export/caf-styles.json');
const collection = (name) => {
  const c = vars.collections.find((x) => x.name === name);
  if (!c) throw new Error(`figma-export has no "${name}" collection`);
  return c;
};
const gdlColor = tokensIn(read(join(GDL, 'tokens/core/color.json')));

const errors = [];
const notes = [];

/* ---------- Brand Primitives → color.<caf-family>.<step> ---------- */
const BRAND_LIB = 'Brand Primitives';
const color = { $type: 'color' };
const descriptions = {};
const brandPath = (name) => {
  const [, family, step] = name.split('/');
  return ['color', kebab(family), kebab(step)];
};
for (const v of collection(BRAND_LIB).variables) {
  const [, family, step] = brandPath(v.n);
  const value = v.v[0];
  if (typeof value !== 'string') errors.push(`${v.n}: brand primitives must be raw colours, found ${JSON.stringify(value)}`);
  ((descriptions[family] ??= {})[v.d ?? ''] ??= []).push(step);
  (color[family] ??= {})[step] = { $value: value, ...(v.d ? { $description: decode(v.d) } : {}) };
}
/* A description most of a family's steps share moves up to the family; the rest stay on their step. */
for (const [family, byText] of Object.entries(descriptions)) {
  const [text, steps] = Object.entries(byText).sort((a, b) => b[1].length - a[1].length)[0];
  if (!text || steps.length * 2 <= Object.keys(color[family]).length) continue;
  color[family] = { $description: decode(text), ...color[family] };
  for (const step of steps) delete color[family][step].$description;
}
const brand = new Set(tokensIn({ color }).keys());

/* ---------- Semantics → the contract's names, Light and Dark ---------- */
/* Figma's generated descriptions ("Fill colour: accent › info › …") only repeat the name; keep the ones a designer wrote. */
const GENERATED = /^(Text|Surface\/background|Fill|Border|Border\/stroke|Content \(text & icon\)|Accent) colour: .+\.$/;
const semantics = collection('Semantics');
const LIGHT = semantics.modes.indexOf('Light');
const DARK = semantics.modes.indexOf('Dark');
if (LIGHT < 0 || DARK < 0) throw new Error(`Semantics modes are ${semantics.modes.join(', ')}; expected Light and Dark`);

const reference = (name, value) => {
  if (typeof value === 'string') return value; // raw colour — gdl-check-contract reports these
  const target = value.alias;
  if (value.lib === undefined) {
    /* Local alias: must be one of CAF's own Brand Primitives. */
    const path = brandPath(target).join('.');
    if (!brand.has(path)) errors.push(`${name}: aliases local ${target}, which is not a Brand Primitive`);
    return `{${path}}`;
  }
  if (value.lib !== 'Primitives') {
    errors.push(`${name}: aliases ${target} from the "${value.lib}" library — CAF Semantics may only alias GDL's Primitives or CAF's Brand Primitives`);
    return `{${target}}`;
  }
  const [root, family, step] = target.split('/');
  const path = ['color', kebab(family), kebab(step)].join('.');
  if (root !== 'colors' || !gdlColor.has(path)) errors.push(`${name}: aliases GDL ${target}, which GDL's tokens/core/color.json does not have (${path})`);
  return `{${path}}`;
};

const light = {};
const dark = {};
for (const v of semantics.variables) {
  const [root, ...rest] = v.n.split('/');
  if (root !== 'colors') { errors.push(`${v.n}: expected a colors/… name`); continue; }
  const path = rest.map(kebab);
  const description = v.d && !GENERATED.test(decode(v.d)) ? decode(v.d) : null;
  for (const [tree, mode] of [[light, LIGHT], [dark, DARK]]) {
    let cur = (tree[path[0]] ??= { $type: 'color' });
    for (const seg of path.slice(1, -1)) cur = cur[seg] ??= {};
    cur[path.at(-1)] = { $value: reference(v.n, v.v[mode]), ...(description && tree === light ? { $description: description } : {}) };
  }
}

/* ---------- Text styles → font.family.sans; the ramp itself is GDL's ---------- */
const WEIGHT = { Light: 'light', Regular: 'regular', Medium: 'medium', 'Semi Bold': 'semibold', SemiBold: 'semibold', Bold: 'bold' };
const gdlType = tokensIn(read(join(GDL, 'tokens/semantic/type.json')));
const gdlFamilies = read(join(GDL, 'tokens/core/typography.json')).font.family;

const families = [...new Set(styles.text.map(([, family]) => family))];
if (families.length !== 1) errors.push(`CAF text styles use ${families.length} families (${families.join(', ')}); expected one UI face`);
const familyKey = Object.keys(gdlFamilies).find((k) => !k.startsWith('$') && Array.isArray(gdlFamilies[k].$value) && gdlFamilies[k].$value[0] === families[0]);
if (!familyKey) errors.push(`CAF's UI face ${families[0]} is not one of GDL's font.family.* — add it to GDL first`);
const typography = {
  font: {
    family: {
      sans: {
        $type: 'fontFamily',
        $value: `{font.family.${familyKey}}`,
        $description: `CAF's UI face: every CAF Figma text style is set in ${families[0]}. Overrides GDL's default; the type ramp (sizes, line heights, weights, tracking) is GDL's.`,
      },
    },
  },
};

const cafStyles = new Set();
for (const [name, , style, size, sizeVar, familyVar] of styles.text) {
  const [group, rest] = name.split('/');
  const [tier, weightName] = rest.split('-');
  const key = `type.${group.toLowerCase()}-${tier}-${weightName}`;
  cafStyles.add(key);
  const gdl = gdlType.get(key);
  if (WEIGHT[style] !== weightName) errors.push(`${name}: the name says ${weightName} but the font style is ${style}`);
  if (!gdl) { errors.push(`${name}: GDL's type ramp has no ${key} — a CAF-only style needs proposing to GDL`); continue; }
  if (gdl.$value.fontSize !== `${size}px`) errors.push(`${name}: ${size}px in CAF Figma, ${gdl.$value.fontSize} in GDL — CAF inherits the type ramp`);
  if (gdl.$value.fontWeight !== `{font.weight.${weightName}}`) errors.push(`${name}: weight ${weightName} in CAF Figma, ${gdl.$value.fontWeight} in GDL`);
  if (!sizeVar) notes.push(`${name}: font size not bound to a variable`);
  else if (!sizeVar.startsWith('font/size/')) notes.push(`${name}: font size bound to "${sizeVar}" — not GDL's font/size/* (foreign or legacy variable)`);
  else if (sizeVar !== `font/size/${group.toLowerCase()}-${tier}`) notes.push(`${name}: font size bound to ${sizeVar} (same value, different tier)`);
  if (!familyVar) notes.push(`${name}: font family not bound to a variable`);
}
const inherited = [...gdlType.keys()].filter((k) => !cafStyles.has(k));
if (inherited.length) notes.push(`GDL styles CAF Figma doesn't have (inherited as-is): ${inherited.join(', ')}`);

/* ---------- Elevation: inherited — the effect styles must match GDL's ---------- */
const gdlElevation = {
  Light: read(join(GDL, 'tokens/core/elevation.json')).shadow.elevation,
  Dark: read(join(GDL, 'tokens/modes/elevation.dark.json')).dark.shadow.elevation,
};
const layer = ([x, y, blur, spread, a]) => `#000000${Math.round(a * 255).toString(16).padStart(2, '0')} ${x}px ${y}px ${blur}px ${spread}px`;
const gdlLayer = (l) => `${l.color} ${l.offsetX} ${l.offsetY} ${l.blur} ${l.spread}`;
for (const [name, list] of Object.entries(styles.effects)) {
  const [theme, level] = name.split('/');
  const gdl = gdlElevation[theme]?.[level];
  if (!gdl) { errors.push(`Elevation ${name}: GDL has no ${theme} elevation ${level}`); continue; }
  const ours = list.map(layer).join(', ');
  const theirs = gdl.$value.map(gdlLayer).join(', ');
  if (ours !== theirs) errors.push(`Elevation ${name}: CAF Figma has ${ours}; GDL has ${theirs} — CAF inherits elevation`);
}

/* ---------- write ---------- */
if (errors.length) {
  for (const e of errors) console.error(`✖ ${e}`);
  console.error(`\n${errors.length} problem(s) — nothing written.`);
  process.exit(1);
}
write('tokens/core/color.json', { color });
write('tokens/core/typography.json', typography);
write('tokens/semantic/color.json', light);
write('tokens/semantic/color.dark.json', { dark });

const count = (o) => Object.entries(o).filter(([k]) => !k.startsWith('$')).reduce((n, [, v]) => n + ('$value' in v ? 1 : count(v)), 0);
console.log(`brand colours ${brand.size} · semantic ${count(light)} light + ${count(dark)} dark · UI face ${families[0]} · ${cafStyles.size} text styles and ${Object.keys(styles.effects).length} elevations match GDL`);
for (const n of notes) console.log(`  ℹ ${n}`);
