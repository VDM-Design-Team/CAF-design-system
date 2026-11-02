---
bump: minor
---
### StatusPill: Approved, Paid, Rejected, Stopped and Inactive (November 2026)

`StatusPill` has five new `status` values, added to the CAF Figma library's
Status Pill first:

- **`approved`** (blue, accent.info filled), **`paid`** (green, accent.success
  filled) and **`rejected`** (red, accent.critical filled): the cost statuses,
  beside Pending's orange, as U01 asks.
- **`stopped`** (a recurring cost) and **`inactive`** (an announcement):
  neutral filled.

Every label passes AA in Light and Dark (the closest: Rejected 4.77,
Stopped / Inactive 4.76, in Light). The costs, recurring costs and
announcements tables in Storybook's patterns now use them instead of the
stand-ins (Active for Approved and Paid, an Error Tag for Rejected, neutral
Tags for Stopped and Inactive).
