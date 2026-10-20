/**
 * Reads the changelog fragments in `changes/` — one file per PR, so that no
 * two PRs ever edit the same lines of `CHANGELOG.md`. Shared by
 * `lint-changes.mjs` (the check) and `changelog.mjs` (the release step).
 * See changes/README.md for the format.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const DIR = 'changes';
export const BUMPS = ['patch', 'minor', 'major'];

/** Every fragment file, `changes/README.md` excluded. */
export const fragmentPaths = () =>
  existsSync(DIR)
    ? readdirSync(DIR)
        .filter((f) => f.endsWith('.md') && f !== 'README.md')
        .map((f) => join(DIR, f))
    : [];

/**
 * Parses one fragment into `{ path, bump, body, problems }`. `problems` lists
 * what is wrong with it, in words a contributor can act on; empty = valid.
 */
export const parseFragment = (path) => {
  const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const problems = [];
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) {
    return { path, bump: null, body: '', problems: ['starts without a `---` / `bump: …` / `---` header'] };
  }
  const bump = m[1].match(/^bump:\s*(\S+)\s*$/m)?.[1] ?? null;
  const body = m[2].trim();
  if (!BUMPS.includes(bump)) problems.push(`\`bump:\` must be ${BUMPS.join(', ')} (found ${bump ?? 'none'})`);
  if (!body.startsWith('### ')) problems.push('the entry must start with a `### ` heading');
  /* Anywhere in the entry: a breaking bullet often reads "- **Breaking:** … Migration: …". */
  if (bump === 'major' && !/Migration:/.test(body))
    problems.push('a `major` entry needs a `Migration:` note saying what callers change');
  return { path, bump, body, problems };
};
