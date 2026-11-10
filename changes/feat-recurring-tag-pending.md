---
bump: patch
---
### The "Recurring" tag on a cost is orange again (November 2026)

The CAF Figma library's `Table / Account Details` now defaults its Category
Tag to Tag Pending, without its icon, still labelled "Recurring" (it was Tag
Info, blue). The Costs table's recurring costs follow:
`<Tag status="pending" showIcon={false}>Recurring</Tag>`. It is the tonal
Tag, not the filled Status Pill, so it stays lighter than the row's status.
`TableAccountDetails` itself is unchanged: `categoryTag` still takes any
Tag, and Figma now offers only Tag Pending and Tag Neutral for it (Tag Info
is no longer a preferred value).

In Storybook, Light and Dark: the Costs table's and TableAccountDetails'
"Recurring" tag is orange (Tag Pending's tonal fill) instead of blue. Its
label passes AA: 4.52 (Light), 5.56 (Dark).
