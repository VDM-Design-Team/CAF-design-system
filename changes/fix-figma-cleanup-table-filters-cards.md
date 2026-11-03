---
bump: minor
---
### Table, filter and card parts follow the 3 November Figma clean-up (November 2026)

The CAF Figma library's Table, Filters and Cards pages were cleaned up on
3 November 2026 from the CAF design decisions and published. Code follows:

- **`StatCard`** has a 1px `stroke.subtle` edge inside (as `PanelCard`), so
  a card shows on the canvas in Light. Its size doesn't change. The edge is
  decorative. Figma's `_Stat Icon` is now Tone × Icon, which `tone` and
  `icon` already were.
- **`FilterSummary`**'s box has the same 1px `stroke.subtle` edge, so it
  shows on a dialog in Light and on the canvas in Dark.
- **`TableExpandButton`** has a Hover fill, `neutral.tonal.surface.hover`
  (Figma's Expanded × State set: Default, Hover, Focus).
- **`ChangeDiffRow`**: Before is struck through, as Figma draws it.
  `before` is optional (Figma's Show Before): leave it out for a Created
  entry, and the Before cell stays empty while After keeps its column.
- **`TableDetailLabel`** takes `label` ("ID:") and `value` ("32430"), Figma's
  Label and Value, 4px apart. The value stays on one line and ends in …
  when the line is narrower than it. The whole line as `children` still
  renders, and is deprecated.
- **`ChangelogEntry`**'s `showNew` defaults to false, as Figma's Show New
  now does: pass `showNew` on the latest release. An entry that relied on
  the old default loses its New tag.
- **`TableAccountDetails`**: Figma's default Category Tag is a Tag Info
  without its icon, "Recurring" (it was an orange Status Pill), so it
  doesn't read as a second status. Pass `<Tag status="info"
  showIcon={false}>Recurring</Tag>` as `categoryTag`.

In Storybook, Light and Dark: stat cards and filter summaries gain their
edge; the Costs table's recurring costs show a blue "Recurring" tag
instead of the orange pill; the Audit Logs' Created entry shows only its
After values; an expand button's fill changes on hover (darker in Light,
lighter in Dark).
