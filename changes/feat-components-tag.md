---
bump: minor
---
### Components: Tag (October 2026)

`Tag` is the tonal status tag, built straight from the CAF Figma library
(page **Tags**, `Tag`): Completed and Failed on Exports, Deleted and
Updated in Costs' change history, versions on Announcements.
- `status` is Figma's Status: `pending` (default), `active`, `completed`,
  `error`, `warning`, `info` or `neutral`. It sets the tonal colours and
  the icon.
- `showIcon` is Figma's Show Icon (default true).
- The label is `children`, because the screens use their own words.

Every colour is the one the Figma layer is bound to, and every label
passes AA in Light and Dark. TableCell's Status + Date cell now takes a
`Tag`. The icon set gains `lightning`, for Active.

Where code differs from Figma (details in `docs/figma-sync.md`):
- **Active's icon** is Phosphor's lightning; Figma's Bolt is a Heroicons
  glyph. **Pending's clock** is Phosphor's filled glyph, not Figma's 1px
  outline.
- **Height:** 26px (Figma 25), on GDL's line height.
