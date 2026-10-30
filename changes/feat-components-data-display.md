---
bump: minor
---
### Components: stats, details, payments and changelog (October 2026)

Sixteen data display components from the CAF Figma library's **Cards**,
**Filters**, **Table** and **Modals** pages. They cover the overview pages
(Patterns – Admin 13 and 14), cost breakdowns, Audit Logs changes, payment
schedules, and the what's-new dialog and Changelog page (patterns 14 and
U07). Every colour is the one the Figma layer is bound to. They follow the
page's theme, Light or Dark (Figma pins Card / Stat, Payment Row, Payment
Schedules and Modal / Changelog to Dark).

**`StatCard`** is `Card / Stat`: one total above a list (Exports,
Announcements). It takes a `label`, a `value`, and the Status Indicator
tile as `icon` (a Phosphor name) and `tone` (`info`, `success`, `pending`
or `critical`). It is an article named by its label.

**`StatRow`** is the layout of `Card / Stat Row – Exports` and
`– Announcements`. The StatCards it holds share the row equally, 16px
apart, and wrap on narrower screens, stacking on a phone.

**`DescriptionList`** and **`DescriptionListItem`** are `Description List`
and its Item: the label and value pairs of a record's details (Export
Details), a `dl` in two columns.

**`FilterSummary`** is `Filter / Summary`: the read-only "Current Filters"
box listing what each filter was set to ("Status: Completed").

**`BreakdownItem`** is `Card / Breakdown Item`: one breakdown line of a
cost, as in the Edit Recurring Cost side sheet. `title`, `meta`, `period`
and `amount` are its text properties. Show Actions is `actions`: the
MenuItems of a RowActionsMenu, whose ••• button is named "Actions for
<title>".

**`ChangeDiff`** and **`ChangeDiffRow`** are `Table / Change Diff` and its
Row: the "View Changes" panel under an Audit Logs entry. It is a real
table: Field / Before / After headers, then one row per changed field
(`field`, `before`, `after`). The old value is tinted red and the new one
green. They are also `<del>` and `<ins>`, with hidden "Removed:" /
"Added:" text, so colour is never the only cue.

**`PaymentRow`** is `Modal / Payment Row`: one payment, `status` Done or
Upcoming, with `date` and `subtitle`. Its round status icon and "Done" /
"Upcoming" badge are part of it. The icon glyphs use the tonal content
colour, which Figma now uses too (its raw greens and yellows were below
3:1 in Light).

**`PaymentSchedules`** is `Modal / Payment Schedules`, the modal Recurring
Costs' View Schedules opens: a ModalHeader over a list of PaymentRows,
built on Overlay. Focus moves in and is trapped. Close, Escape or a
backdrop click ask `onClose`, and focus returns to the opener. A long
schedule scrolls inside the dialog.

**`ChangelogModal`** is `Modal / Changelog`, the dialog that opens once
after sign-in with the newest release. It shows a rocket, the release's
title, its date and version, "What's new in this release:" with its
notes, and two buttons. View Change Log calls `onViewChangeLog`. Got It
calls `onClose`, and so do Escape and a click on the backdrop. It traps
focus and returns it, like the other modals, and its two buttons stack on
a phone. Figma shows it in Dark only, so its Light look is new, including
a lighter red rocket.

**`ChangelogEntry`** is `Card / Changelog Entry`, one release on the
Changelog page. It takes a `title`, a `meta` line ("Version 2.5.6 •
August 10, 2026"), the Info Tag "New" (`showNew`) and its notes.

**`ChangelogHeader`** and **`ReleaseNotes`** are the dialog's header and
notes list. **`BulletItem`** is one note, and **`VersionBadge`** is the
version pill.
