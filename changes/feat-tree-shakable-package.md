---
bump: patch
---
### Apps ship only the components they import (November 2026)

The package's JS is now one file per module instead of one bundle, and
`package.json` says `"sideEffects": ["*.css"]`, so an app's bundler drops
every component the app doesn't import. In a Vite + React 19 app,
importing only `Button` adds 35.2 kB of CAF's JS (10.4 kB gzip), down
from 160.9 kB (45.6 kB gzip) in 1.0.0. An app that imports everything
gets the same JS as before.

- **Imports don't change.** `import { Button } from '@vdm-design-team/caf'`
  works as before, with the same types; no export is added or removed.
- **Next.js App Router.** Every component module starts with
  `"use client"`, so Server Components can still import and render
  components directly. With Turbopack (Next's default since 16) and in
  Client Components, an app gets only what it imports. A webpack build
  (`next build --webpack`) brings in every component for a Server
  Component's import unless the app lists `@vdm-design-team/caf` in
  `experimental.optimizePackageImports`.
- **CSS.** `theme.css` now has `@source "./components"` and
  `@source "./lib"` in place of `@source "./index.js"`. Tailwind scans
  files, not imports, so an app's CSS still has every component's classes
  (about 49 kB minified, 7 kB gzip, on top of the theme). Apps keep
  importing `theme.css` in place of `@import "tailwindcss"`; nothing in
  the app changes.

No component looks different, in Light or Dark.
