---
bump: minor
---
### Tonal status pills, a filled table header and the new Sidebar (November 2026)

The first components of the new CAF design, using the colours decided on
23 Nov 2026.

- **StatusPill** moves from filled to tonal pairs, in Light and Dark:
  Pending orange, Approved ("To be paid") info blue, Paid green, Rejected
  red, Stopped and Inactive neutral. **Active** (a running recurring cost)
  moves from the primary colour to green. Two new statuses:
  `payment-rejected`, an outlined red pill, and `waiting` ("Waiting on you",
  "New"), the one solid pill (slate-900 with white text in Light, slate-200
  with slate-900 text in Dark). The Costs, Recurring Costs and Announcements
  tables show the new pills.
- **TableHeaderRow** gets a fill, `surface.table.header` (slate-50 in Light,
  slate-900 in Dark), and **TableRow**'s hover is `surface.table.row.hover`
  (slate-100 in Light, slate-700 in Dark) instead of white. Every table
  shows both. On a hovered row, TableCell's grey secondary text (the second
  line, the date) turns `text.secondary`, as on a selected row: `text.subtle`
  is below 4.5:1 on the hover fill (4.34:1 in Light, 4.03:1 in Dark).
- **Sidebar** (new), with **SidebarGroup** and **SidebarLink**: the dark app
  navigation down the left of the signed-in app, dark in both themes.
- **Logo** gets `inverse`, the version for a dark surface such as the
  Sidebar.
