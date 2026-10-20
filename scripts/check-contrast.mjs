/**
 * WCAG contrast report for CAF's semantic colours, Light and Dark.
 *
 *   npm run check:contrast            report (exit 0)
 *   npm run check:contrast -- --strict  exit 1 on any failure
 *
 * Reads the built dist/tokens.json (run `npm run build` first), so every
 * reference is already resolved to GDL's or CAF's hex values.
 *
 * Pairs checked, in each mode:
 *   - text.{primary,secondary,tertiary,subtle}, text.link.*, text.brand.{medium,strong,stronger}
 *     on surface.{canvas,base,elevated}                         4.5:1
 *   - every `….content.<state>` on its sibling `….surface.<state>`
 *     (action, neutral and accent styles)                       4.5:1
 *   - stroke.focused on surface.{canvas,base}                   3:1 (WCAG 1.4.11)
 * Disabled and deselected states are exempt (WCAG 1.4.3). A translucent
 * surface is composited over surface.base first.
 *
 * Report-only for now: the values come from the CAF Figma file, so a fix
 * belongs there (then refresh the snapshot). Make it --strict in CI once
 * Light and Dark both pass.
 */
import { readFileSync } from 'node:fs';

const strict = process.argv.includes('--strict');
const all = JSON.parse(readFileSync('dist/tokens.json', 'utf8'));

const flatten = (node, path = [], out = new Map()) => {
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === 'string') out.set([...path, k].join('.'), v);
    else if (v && typeof v === 'object') flatten(v, [...path, k], out);
  }
  return out;
};
const SEMANTIC = ['text', 'surface', 'stroke', 'action', 'neutral', 'accent'];
const light = flatten(Object.fromEntries(SEMANTIC.map((r) => [r, all[r]])));
const dark = flatten(Object.fromEntries(SEMANTIC.map((r) => [r, all.dark[r]])));

const rgba = (hex) => {
  const h = hex.replace('#', '');
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  return [n(0), n(2), n(4), h.length === 8 ? n(6) : 1];
};
const over = ([r, g, b, a], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a), 1];
const lum = ([r, g, b]) => {
  const c = (x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const pairsFor = (tokens) => {
  const pairs = [];
  const texts = [...tokens.keys()].filter((k) => /^text\.(primary|secondary|tertiary|subtle|link\.(default|hover|pressed|selected)|brand\.(medium|strong|stronger))$/.test(k));
  for (const fg of texts) for (const bg of ['surface.canvas', 'surface.base', 'surface.elevated']) pairs.push([fg, bg, 4.5]);
  for (const fg of tokens.keys()) {
    const m = fg.match(/^(.+)\.content\.(\w+)$/);
    if (!m || ['disabled', 'deselected'].includes(m[2])) continue;
    const bg = `${m[1]}.surface.${m[2]}`;
    if (tokens.has(bg)) pairs.push([fg, bg, 4.5]);
  }
  for (const bg of ['surface.canvas', 'surface.base']) pairs.push(['stroke.focused', bg, 3]);
  return pairs;
};

let failures = 0;
for (const [mode, tokens] of [['light', light], ['dark', dark]]) {
  const base = rgba(tokens.get('surface.base'));
  const pairs = pairsFor(tokens);
  const failing = [];
  for (const [fg, bg, min] of pairs) {
    const back = over(rgba(tokens.get(bg)), base);
    const front = over(rgba(tokens.get(fg)), back);
    const r = ratio(front, back);
    if (r < min) failing.push({ fg, bg, r, min });
  }
  failures += failing.length;
  console.log(`${mode}: ${pairs.length - failing.length}/${pairs.length} pairs pass`);
  for (const { fg, bg, r, min } of failing.sort((a, b) => a.r - b.r))
    console.log(`  ✖ ${fg} on ${bg}: ${r.toFixed(2)}:1 (needs ${min}:1)  ${tokens.get(fg)} on ${tokens.get(bg)}`);
}
if (failures && strict) process.exit(1);
if (failures) console.log(`⚠ ${failures} pair(s) below WCAG AA — report only. Fix in the CAF Figma file, then refresh the snapshot (docs/figma-sync.md).`);
else console.log('✔ every checked pair meets WCAG AA');
