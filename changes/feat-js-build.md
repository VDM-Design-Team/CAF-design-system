---
bump: minor
---
### Apps can install and import the components (November 2026)

`@vdm-design-team/caf` now ships CAF's React components, not only the
tokens and CSS. `import { Button, DateField, SelectField, … } from
'@vdm-design-team/caf'` works in a React 18 or 19 app, with types, and
everything in `src/index.ts` is exported. Set up as VCP's package is.

- **`.`** → `dist/index.js` (ESM, starts with `"use client"`) and
  `dist/types/src/index.d.ts`. React, React DOM, `class-variance-authority`,
  `clsx` and `tailwind-merge` stay external, so the app keeps one React.
- **`./tokens`** → `dist/tokens.js`: the token values as a JS object
  (Light, and Dark under `tokens.dark`). Not a client module, so server
  code can read it.
- **`theme.css`** adds one line, `@source "./index.js"`, under its
  `@import "tailwindcss"`: an app's Tailwind generates the components'
  classes from the bundle, with no `@source` of its own. An app still
  imports `@vdm-design-team/caf/theme.css` in place of `@import "tailwindcss"`;
  the tokens, Light and Dark (`.dark` on `<html>`) are unchanged. An app
  that doesn't use the components gets their classes in its CSS too
  (about 47 kB minified).
- **Peers:** `tailwindcss >=4` joins `react` and `react-dom` as an
  optional peer dependency. Optional, because an app that only reads
  `tokens.css` or the JSON needs none of them.
- The other exports (`tokens.css`, `tokens.dark.css`,
  `typography.desktop.css`, `tokens.json`, `tokens.flat.json`, `tokens/*`)
  are unchanged.

No component looks different, in Light or Dark. How an app sets it up
(the CSS line, Dark, Inter): "Using CAF in an app" in the README.
