## What changed


## Why
<!-- Product terms: "Dark-mode primary buttons now pass contrast" -->

## Effect on CAF screens
<!-- Which components / screens look different, Light and Dark. -->

## Breaking change
No <!-- If yes: what CAF apps change — also as a `Migration:` line in your changes/ file -->

---
- [ ] `changes/<branch>.md` added (or: no change under tokens/, the build config, the GDL version or a component in src/)
- [ ] Components: built from the CAF Figma library, matched in Storybook in Light and Dark, departures listed in `docs/figma-sync.md`
- [ ] Token changes made in the CAF Figma library first, snapshot refreshed, `npm run import:figma` run
- [ ] Nothing GDL already has was copied in (`npm run lint:tokens`)
- [ ] `npm test` passes (contract check output pasted below if semantic names changed)
