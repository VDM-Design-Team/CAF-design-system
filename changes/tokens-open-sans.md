---
bump: minor
---
### CAF's UI face is Open Sans (November 2026)

Every CAF component and text style is now set in Open Sans instead of Inter.
`font.family.sans` points at GDL 1.1.0's new `font.family.open-sans`
(`Open Sans`, `system-ui`, `sans-serif`), so `--font-sans` and the
`font-sans` utility change with it. The type ramp is GDL's and unchanged:
sizes, weights (400, 500, 600, 700), line heights and letter spacing are the
same, so heights in code don't move. Widths do: Open Sans is wider than
Inter, so labels, table columns and truncation points shift.

Apps now load Open Sans instead of Inter, for example:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap" />
```

Requires `@vdm-design-team/gdl` ^1.1.0 (was ^1.0.0). In the CAF Figma
library the 45 text styles are Open Sans; Figma's Open Sans has no Medium,
so the 8 `-medium` styles show SemiBold there while code keeps 500
(`docs/figma-sync.md` → Open Sans).

In Storybook, Light and Dark: every story's text is Open Sans.
