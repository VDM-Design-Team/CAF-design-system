# Unreleased changes

Every PR that changes what CAF ships (`tokens/`,
`style-dictionary.config.mjs`, or the GDL version in `package-lock.json`)
adds **one file here** with its changelog entry, instead of editing
`CHANGELOG.md`. Two PRs never write the same file, so entries can't
conflict. At release time `npm run changelog` combines the files into
`CHANGELOG.md`, newest first, and deletes them.

## Writing one

Name it after your branch, with the slash as a dash:
`tokens/dark-primary-contrast` → `changes/tokens-dark-primary-contrast.md`.

```markdown
---
bump: patch
---
### Dark-mode primary buttons pass contrast (November 2026)

`action.primary.surface.*` in Dark moves to caf-blue-on-dark/600–800 …
```

- **`bump`** is `patch`, `minor` or `major`:
  - `patch`: a value fix with no new name, or a GDL bump that changes no
    CAF output.
  - `minor`: a new token or semantic name, or a GDL bump that adds tokens.
  - `major`: a rename or removal, or a GDL major. It must include a
    `Migration:` note saying what CAF apps change.
- **The body** is the entry as it will read in `CHANGELOG.md`: a `### `
  heading naming the change and the month, then the prose. Say which screens
  or components look different, in Light and Dark.

`npm test` (and CI) fails three kinds of PR:
- one that changes those files without a file here
- one that edits `CHANGELOG.md` directly
- one with a malformed file

## Releasing

```bash
npm run changelog -- --dry-run
npm run changelog
```
