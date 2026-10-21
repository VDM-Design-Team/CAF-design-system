/**
 * Changelog entries live one per PR in `changes/` (see changes/README.md), so
 * a merge never breaks every other open PR's `CHANGELOG.md`. This check:
 *
 * 1. Fails a branch that changes what CAF ships — tokens/, the build config,
 *    the GDL version it builds on, or a component in src/ (stories aside) —
 *    without adding or editing a file in `changes/`.
 * 2. Fails a branch that edits `CHANGELOG.md` directly. The release step is
 *    the exception: it edits `CHANGELOG.md` while deleting fragments, or, with
 *    none to fold in, only dates the `— unreleased` heading.
 * 3. Fails any fragment in the tree that is malformed (header, heading, or a
 *    `major` without a `Migration:` note).
 *
 * The branch is compared with its merge base on `main` (in CI, the PR's base
 * branch), working-tree edits and new files included, so it gives the same
 * answer locally before a commit as it does in CI.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { DIR, fragmentPaths, parseFragment } from './changes.mjs';

const git = (args) => execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

let failed = 0;
const fail = (msg) => { console.error(msg); failed++; };

/* Rule 3 — every fragment in the tree is well formed. */
const fragments = fragmentPaths().map(parseFragment);
for (const f of fragments) for (const p of f.problems) fail(`${f.path}: ${p}`);

/* Rules 1 and 2 need something to compare with. */
const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main';
let mergeBase = null;
try {
  mergeBase = git(`merge-base ${base} HEAD`);
} catch {
  console.warn(`⚠ lint:changes: no ${base} to compare with — checked fragment format only.`);
}

if (mergeBase) {
  /* Committed + uncommitted changes since the merge base, and new untracked files. */
  const changed = git(`diff --name-status ${mergeBase}`)
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t'))
    .map(([status, ...paths]) => ({ status: status[0], path: paths.at(-1) }));
  /* Untracked dotfiles (.DS_Store and the like) are not changes anyone made. */
  for (const path of git('ls-files --others --exclude-standard').split('\n').filter(Boolean))
    if (!path.split('/').at(-1).startsWith('.')) changed.push({ status: 'A', path });

  const inChanges = (c) => c.path.startsWith(`${DIR}/`) && c.path !== `${DIR}/README.md`;
  /* A GDL bump changes CAF's output as much as a token edit: compare the GDL commit the lockfile pins. */
  const gdlCommit = (lock) => JSON.parse(lock).packages?.['node_modules/@vdm-design-team/gdl']?.resolved ?? null;
  const bumpsGdl = () => {
    try {
      return gdlCommit(git(`show ${mergeBase}:package-lock.json`)) !== gdlCommit(readFileSync('package-lock.json', 'utf8'));
    } catch {
      return false;
    }
  };
  const isComponent = (p) => /^src\//.test(p) && !/\.stories\.tsx?$/.test(p);
  const touchesCode =
    changed.some((c) => /^tokens\//.test(c.path) || c.path === 'style-dictionary.config.mjs' || isComponent(c.path)) ||
    (changed.some((c) => c.path === 'package-lock.json') && bumpsGdl());
  const addsFragment = changed.some((c) => inChanges(c) && c.status !== 'D');
  const deletesFragment = changed.some((c) => inChanges(c) && c.status === 'D');
  const editsChangelog = changed.some((c) => c.path === 'CHANGELOG.md');
  /* The release step with no fragments: the only edit is `— unreleased` → today's date. */
  const onlyDatesRelease = () => {
    const after = readFileSync('CHANGELOG.md', 'utf8').trim();
    const dated = after.match(/^## (\S+) — \d{4}-\d{2}-\d{2}$/m);
    if (!dated) return false;
    try {
      return git(`show ${mergeBase}:CHANGELOG.md`).replace(`## ${dated[1]} — unreleased`, dated[0]) === after;
    } catch {
      return false;
    }
  };

  if (touchesCode && !addsFragment)
    fail(
      `This branch changes tokens/, the build config, the GDL version or a component in src/ but adds no changelog entry.\n` +
        `  Add changes/<branch-name>.md — see changes/README.md for the format.`,
    );
  if (editsChangelog && !deletesFragment && !onlyDatesRelease())
    fail(
      `This branch edits CHANGELOG.md directly.\n` +
        `  Put the entry in changes/<branch-name>.md instead; npm run changelog writes CHANGELOG.md at release.`,
    );
}

if (failed) process.exit(1);
console.log(`✔ Changelog entries OK (${fragments.length} unreleased in ${DIR}/)`);
