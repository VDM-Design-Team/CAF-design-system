/**
 * The release step: combines the fragments in `changes/` into `CHANGELOG.md`,
 * newest first, and deletes them. See changes/README.md.
 *
 * - If the top section is still `## <version> — unreleased` (the version in
 *   `package.json`), the entries go into it, above the ones already there,
 *   and it gets today's date.
 * - Otherwise a new section starts with the next version — the highest
 *   `bump` among the fragments — and `package.json` (and its lockfile) move
 *   to it.
 * - With no fragments, an unreleased top section that already has its entries
 *   (0.1.0's were written straight into `CHANGELOG.md`) just gets today's date.
 *
 * `--dry-run` prints the new section and the version, and writes nothing.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { BUMPS, fragmentPaths, parseFragment } from './changes.mjs';

const dryRun = process.argv.includes('--dry-run');
const LOG = 'CHANGELOG.md';

const fragments = fragmentPaths().map(parseFragment);
const bad = fragments.filter((f) => f.problems.length);
if (bad.length) {
  for (const f of bad) for (const p of f.problems) console.error(`${f.path}: ${p}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const log = readFileSync(LOG, 'utf8');
const unreleased = log.match(/^## (\S+) — unreleased\n/m);

if (!fragments.length) {
  if (!(unreleased && unreleased[1] === pkg.version)) {
    console.log('Nothing to release: changes/ has no entries.');
    process.exit(0);
  }
  if (dryRun) {
    console.log(`Would release ${pkg.version} with the entries already in ${LOG}.`);
    process.exit(0);
  }
  writeFileSync(LOG, log.replace(unreleased[0], `## ${pkg.version} — ${today}\n`));
  console.log(`✔ ${LOG}: ${pkg.version} dated ${today}. Commit this as the release PR.`);
  process.exit(0);
}

/* Newest first, by when each fragment was first committed (its file time if never committed). */
const addedAt = (path) => {
  try {
    const t = execSync(`git log --diff-filter=A --format=%ct -1 -- "${path}"`, { encoding: 'utf8' }).trim();
    if (t) return Number(t);
  } catch {}
  return statSync(path).mtimeMs / 1000;
};
fragments.sort((a, b) => addedAt(b.path) - addedAt(a.path));

const entries = fragments.map((f) => f.body).join('\n\n');

let version, next;
if (unreleased && unreleased[1] === pkg.version) {
  version = pkg.version;
  next = log.replace(unreleased[0], `## ${version} — ${today}\n\n${entries}\n`);
} else {
  const highest = Math.max(...fragments.map((f) => BUMPS.indexOf(f.bump)));
  const [maj, min, pat] = pkg.version.split('.').map(Number);
  version = [
    `${maj + 1}.0.0`,
    `${maj}.${min + 1}.0`,
    `${maj}.${min}.${pat + 1}`,
  ].at(2 - highest);
  const firstSection = log.search(/^## /m);
  const at = firstSection === -1 ? log.length : firstSection;
  next = `${log.slice(0, at)}## ${version} — ${today}\n\n${entries}\n\n${log.slice(at)}`;
}

if (dryRun) {
  console.log(`Would release ${version} with ${fragments.length} entries:\n`);
  console.log(entries);
  process.exit(0);
}

writeFileSync(LOG, next.replace(/\n{3,}/g, '\n\n'));
if (version !== pkg.version) execSync(`npm version ${version} --no-git-tag-version`, { stdio: 'inherit' });
for (const f of fragments) rmSync(f.path);
console.log(`✔ ${LOG}: ${version} — ${fragments.length} entries. Deleted them from changes/. Commit this as the release PR.`);
