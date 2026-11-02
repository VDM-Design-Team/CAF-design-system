---
bump: minor
---
### Patterns and templates in Storybook (November 2026)

Storybook now has the CAF Figma library's patterns and the CAF screens'
templates, built only from the DS components. The sidebar reads
**Components**, then **Patterns**, then **Templates**. The full list, with
each one's Figma section and the design questions they raised, is in
[`docs/patterns.md`](docs/patterns.md).

**Patterns** (`src/patterns/`, Storybook `Patterns/…`) are Figma's
Patterns – Admin 01–15 and Patterns – User U01–U08: List page, Search &
filter, Row actions menu, Confirm destructive actions, Create or edit in a
modal, Edit in a side sheet, Bulk selection & actions, Expand for details &
change history, Multi-section form, File upload & attachments, Loading,
empty & error states, Feedback messages, Overview & record details,
Announcements & what’s new, App shell & navigation, My costs list, Save and
resume drafts, Manage recurring costs, and Account, settings & currencies.
Each one plays its task through with the mouse and the keyboard, and has a
Dark story. They share one set of sample data (`src/patterns/fixtures.ts`).

**Templates** (`src/templates/`, Storybook `Templates/…`) are the page
layouts of the Admin and User screens: App shell, List page, Overview list,
Form page and Overlay flows, in Light, Dark and at 320 wide.

**The Costs organisms are stories, not components** (COMPONENT-PLAN
decision 4). The Costs table, the Costs filter bar, Form / New Cost,
Form / Bulk Upload, the Stat Rows, the Recurring Costs table, the page
header and the other compositions live under `src/patterns/` and are not
exported from the package. An app copies them or builds its own from the
components.

Nothing in the published package changes: no token, no component and no
export is added or changed, so no CAF screen looks different.
