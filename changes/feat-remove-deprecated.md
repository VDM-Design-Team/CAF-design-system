---
bump: major
---
### Deprecated APIs removed: TableDetailLabel `children` and VersionBadge (November 2026)

The two APIs deprecated in 0.10.0 (3 November 2026) are gone, as decided
for the next major release:

- **`TableDetailLabel`** takes only `label` and `value`, Figma's Label and
  Value. The whole line as `children` (Figma's old Text property) no longer
  renders, and the `TableDetailLabelLineProps` / `TableDetailLabelTextProps`
  types are now one `TableDetailLabelProps`.
- **`VersionBadge`** (Figma's deprecated `Modal / Version Badge`) is removed,
  with `VersionBadgeProps`. A release version is a
  `<Tag status="info" showIcon={false}>`, as the Announcements table and
  ChangelogHeader show it.

Nothing in CAF used either, so no screen looks different in Light or Dark.

Migration:
- `<TableDetailLabel>ID: 32430</TableDetailLabel>` becomes
  `<TableDetailLabel label="ID:" value="32430" />`.
- `<VersionBadge>v2.5.6</VersionBadge>` becomes
  `<Tag status="info" showIcon={false}>v2.5.6</Tag>`.
- Replace `TableDetailLabelLineProps` and `TableDetailLabelTextProps` with
  `TableDetailLabelProps`, and `VersionBadgeProps` with `TagProps`.
