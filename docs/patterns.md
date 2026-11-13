# Patterns and templates

The CAF Figma library documents how its components are used together, on
two pages: **Patterns – Admin** (01–16) and **Patterns – User** (U01–U08).
The CAF Design file (`z7L8r4nq6nL6Yfa8vvxJhO`) draws the real screens on
**Admin screens** (2102:4) and **User Screens** (2102:3). Storybook has both:

- **Patterns** (`src/patterns/`, Storybook `Patterns/…`): compositions of DS
  components that solve one task, such as a list page, a confirm before
  delete, or a form in a side sheet. Each story plays the task through with
  the mouse and the keyboard, and each pattern has a Dark story.
- **Templates** (`src/templates/`, Storybook `Templates/…`): the screens'
  page layouts, built from the patterns: the app shell, a list page, an
  overview list, a form page and a page with an overlay open. They are shown
  in Light, Dark and at 320 wide.

The sidebar reads Components, then Patterns, then Templates.

**Only DS components.** Every pattern and template is built from the
components in `src/components/` and GDL's tokens. Where the library has no
component for something Figma draws (a table layout for phones, a Clear
Filters control), the pattern stands in with what exists and says so. Those
gaps are collected under [Missing components](#missing-components).

**The Costs organisms are stories, not components** (COMPONENT-PLAN
decision 4). The Costs table, the Costs filter bar, Form / New Cost,
Form / Bulk Upload, the Stat Rows, the Recurring Costs table, the page header
and the page compositions are app compositions. They live under
`src/patterns/` as story-level code and are **not exported from
`src/index.ts`**, so the published package doesn't change. An app copies them
or builds its own from the components.

**One set of sample data.** Every pattern and template draws from
`src/patterns/fixtures.ts` (see [Shared building blocks](#shared-building-blocks)),
so the stories agree with each other and with Figma.

## Contents

| # | Pattern or template | Figma | Story |
|---|---|---|---|
| 01 | List page | 518:900 | Patterns/List page |
| 02 | Search & filter | 520:1873 | Patterns/Search & filter |
| 03 | Row actions menu | 520:2387 | Patterns/Row actions menu |
| 04 | Confirm destructive actions | 523:2612 | Patterns/Confirm destructive actions |
| 05 | Create or edit in a modal | 523:3452 | Patterns/Create or edit in a modal |
| 06 | Edit in a side sheet | 524:3609 | Patterns/Edit in a side sheet |
| 07 | Bulk selection & actions | 524:4713 | Patterns/Bulk selection & actions |
| 08 | Expand for details & change history | 526:5189 | Patterns/Expand for details & change history |
| 09 / U02 | Multi-section form | 527:5661, U02 545:17897 | Patterns/Multi-section form |
| 10 / U05 | File upload & attachments | 527:6028, U05 545:19071 | Patterns/File upload & attachments |
| 11 | Loading, empty & error states | 528:6035 | Patterns/Loading, empty & error states |
| 12 | Feedback messages | 528:6347 | Patterns/Feedback messages |
| 13 | Overview & record details | 529:6821 | Patterns/Overview & record details |
| 14 / U07 | Announcements & what’s new | 529:7639, U07 545:25222 | Patterns/Announcements & what’s new |
| 15 / U08 | App shell & navigation | 530:7799, U08 545:26643 | Patterns/App shell & navigation |
| 16 | Contact messages | 951:7846 | Patterns/Contact messages |
| U01 | My costs list | 545:13220 | Patterns/My costs list |
| U03 | Save and resume drafts | 545:18365 | Patterns/Save and resume drafts |
| U04 | Manage recurring costs | 545:18695 | Patterns/Manage recurring costs |
| U06 | Account, settings & currencies | 545:23189 | Patterns/Account, settings & currencies |
| Organism | Costs table | 121:4938, 121:2782, 121:5197 | Patterns/Costs table |
| Organism | Page header | 518:232 | Patterns/Page header |
| Organism | Recurring costs table | 260:1065, 260:1021, 260:1000 | Patterns/Recurring costs table |
| Template | App shell | Admin screens 2102:4, User Screens 2102:3 | Templates/App shell |
| Template | List page | 2102:5749, 2102:1069, 2102:1342, 2102:7086, 2102:6234 | Templates/List page |
| Template | Overview list | 2102:6902, 2102:6628 | Templates/Overview list |
| Template | Form page | 2102:1154, 2102:1159, 2102:6027, 2102:1223 | Templates/Form page |
| Template | Overlay flows | 2102:6074, 2102:5857, 2102:1201, 2102:1266, 2102:1284; 523:2612 | Templates/Overlay flows |

U02, U05, U07 and U08 are the user side of 09, 10, 14 and 15, so they share
a section with them.

### Story-level organisms

Compositions the patterns share. None is exported from the package.

| Organism | Figma | File |
|---|---|---|
| `CostsTable` (+ `CostBreakdownTable`, `CostStatusBadge`, `sortCosts`) | Table / Header – Costs 121:4938, Table / Row – Cost 121:2782 (+ Selectable 121:5197) | `src/patterns/costs/CostsTable.tsx` |
| `PageHeader` | Layout → Page Header (since 2 Nov 2026) | `src/components/page-header` (a DS component now) |
| `CostsFilterBar` (+ `FilterBar`, `filterCosts`; the DS's FilterSelect and FilterDateRange since 2 Nov 2026) | Filter / Bar – Costs 256:4585, Filter / Bar 256:5338 | `src/patterns/filters/CostsFilterBar.tsx` |
| `CostsListPage` | 01 B 518:514, U01 545:13511 | `src/patterns/list-page/CostsListPage.tsx` |
| `AuditLogTable`, `AuditLogsDialog` | 526:4980 | `src/patterns/expand-details/AuditLogs.tsx` |
| `RecurringCostsTable` | Table / Recurring Costs 260:1065, Header 260:1021, Row 260:1000 | `src/patterns/recurring/RecurringCostsTable.tsx` |
| `EditRecurringCostForm` | U04 545:18695 (step 4) | `src/patterns/recurring/EditRecurringCostForm.tsx` |
| `NewCostForm` | Form / New Cost 184:3119 | `src/patterns/forms/NewCostForm.tsx` |
| `BulkUploadForm` | Form / Bulk Upload 191:433 | `src/patterns/forms/BulkUploadForm.tsx` |
| `CostBreakdownDialog`, `BreakdownsSection` | 527:5473, 545:18317; 184:3263, 524:3295 | `src/patterns/forms/` |
| `TableList` (was `RecordsTable`) | Table → Table / List (since 2 Nov 2026); 523:1988, 524:2961, 545:18586 | `src/components/table-list` (a DS component now) |
| `CostCentreDialog`, `CostCentresPage` | 523:2985, 523:1968 | `src/patterns/modal-form/` |
| `RecurringCostSheet`, `RecurringCostsPage` | 524:3295, 524:2956 | `src/patterns/side-sheet/` |
| `DraftsList` | 545:18578, 545:18649 | `src/patterns/drafts/DraftsList.tsx` |
| `ContactsFilterBar` (+ `filterContacts`) | Filter / Bar Page=Contacts 949:11457 | `src/patterns/filters/ContactsFilterBar.tsx` |
| `ContactsListPage` | 16 951:7846; Table / Header – Contacts 951:11007, Table / Row – Contact 951:11026 | `src/patterns/contacts/ContactsListPage.tsx` |
| `UsersPage`, `UsersTable` | 528:5768, 528:5814, 528:6194 | `src/patterns/states/` |
| `AddUserDialog` | 528:6197 | `src/patterns/feedback/AddUserDialog.tsx` |
| `ExportsStatRow`, `AnnouncementsStatRow` | Card / Stat Row – Exports 387:3601, – Announcements 389:163 | `src/patterns/overview/StatRows.tsx` |
| `ExportsTable`, `ExportDetailsDialog` | 529:6211, 529:6740, 528:5884 | `src/patterns/overview/` |
| `AnnouncementsTable`, `CreateAnnouncementDialog` | 528:5948, 529:7050 | `src/patterns/announcements/` |
| `AppShell`, `useDocumentTheme` | 530:7296, 530:7582, 530:7659; 545:27687 | `src/patterns/app-shell/AppShell.tsx` |
| `ManageCurrenciesDialog`, `SettingsPage` | 545:24755, 545:25204 | `src/patterns/account-settings/` |
| `TemplateFrame`, the screens (`APP_SCREENS`) | Admin screens 2102:4, User Screens 2102:3 | `src/templates/TemplateFrame.tsx`, `src/templates/screens.tsx` |

Known overlaps, to settle once design answers the questions below:
- Two Edit Recurring Cost forms: `EditRecurringCostForm` follows U04,
  `RecurringCostSheet` follows 06 (the two Figma forms differ).
- ~~Two filter dropdown stand-ins (`FilterMenu`)~~: every filter bar uses
  the DS's FilterSelect since 2 Nov 2026.
- The Cost Centers list is drawn in the List page story and in
  `CostCentresPage`.
- `CostsListPage` and `UsersPage` render `<main>` by default (`as="div"`
  inside a template); `CostCentresPage`, `RecurringCostsPage`,
  `DraftsList` and `ContactsListPage` render a `<div>`.

## Shared building blocks

### Sample data (Figma Patterns – Admin 504:13180, Patterns – User 544:13219; CAF Design screens 2102:4, 2102:3)

**What it solves.** Every pattern and template shows the same believable CAF data, so stories agree with each other and with Figma. `src/patterns/fixtures.ts` is plain typed data: no randomness, fixed ISO dates.

**What it holds.**
- 32 costs: the Admin and User Costs screens' rows, the library's pattern rows, and more in the same shape so filters and pagination have something to do.
- Recurring costs with their payment schedules.
- Cost centres, partners, users, contacts, drafts and exports (with stats).
- Announcements (with stats), the changelog and the audit log (change history).
- The menus' copy and the formatters the screens use (`formatDate` "September 24, 2026", `formatAmount` "USD 5130553.37", `formatPeriod`, `formatTimestamp`, `formatFrequency`).
- A section per pattern group at the end, each headed with the branch that added it: list-page and filters (`LIST_TODAY`, `COSTS_PAGE_SIZE`, `myCosts`), forms (`currentUser`, `costCentreNames`, `natureOfServices`, `recurrenceSummary`, `costInvoices`, …), feedback (`toastMessages`, `emptyStateCopy`, `changelogPage`, …), app-shell and account-settings (`signedInAccounts`, `managedCurrencies`) and templates (`TEMPLATE_TODAY`, `userRecurringCosts`, `NEW_DRAFT_ID`).

**What Figma draws that it doesn't.** Real-looking email addresses and contact-form messages on the screens. These are replaced with fictional ones on example.com. The library's own sample people (Admin Account, Maria Santos, John Reyes, Ana Cruz) are kept.

**Design questions.**
- ~~Status Pill has no Paid or Rejected variant.~~ Added on 2 Nov 2026 (Approved, Paid, Rejected, Stopped, Inactive).
- The library's sample cost 32430 has three different amounts (121:2782, 121:2957, 520:1873).
- Audit Logs tag "Updated" as Completed on the screen (2102:5857) but as Info in pattern 08 (526:5189).

### Costs table (Figma 121:4938, 121:2782, 121:5197)

**What it solves.** The Costs list's table, which admins and users scan, select, sort, expand and act on. It is a story-level organism (`src/patterns/costs/CostsTable.tsx`, COMPONENT-PLAN decision 4), not a DS component.

**Components.** TableList, TableHeaderRow (Show Expand, Show Checkbox with Mixed, Show Actions), TableHeaderCell (sortable), TableRow (selected), TableCell (Custom for the expand button and Account Details), Checkbox (Mixed), TableExpandButton, TableAccountDetails + TableDetailLabel (with a "Recurring" StatusPill), StatusPill or Tag for the status, RowActionsMenu + MenuItem.

**The flow the stories show** (`Patterns/Costs table`):
- **Default:** the Admin Costs screen's eight rows.
- **Select all and mixed:** one row makes the header checkbox Mixed. The header selects all, then none, including with Space.
- **Sort:** a new column sorts ascending and the same column flips. `aria-sort` follows the sorted column. Enter sorts too.
- **Expand:** the caret opens the cost's breakdown in the row under it, with `aria-controls` pointing at it. Rows open independently, and Enter closes one with focus kept on the caret.
- **Row menu:** ••• opens Approve, Reject, View invoices, Request adjustment, Delete. Approve changes the status pill, and focus returns to •••. From the keyboard, ↓ ↓ Enter rejects, and Escape closes the menu without choosing.
- **Dark:** two rows selected, one expanded, sorted by date.
- **At a phone's width** (320, decision add-phone-table-layout): the table (about 980 wide) scrolls sideways in its own region, a tab stop named Costs, and the page doesn't. The last row's ••• menu opens on `<body>`, over the region's bottom edge, all of it in the viewport.

**What Figma draws that the stories don't.**
- Row – Cost's selected outline (stroke/focused 2px): code uses TableRow's selected fill.
- Row – Cost's surface/base fill at rest.
- The breakdown block's left accent border, radius and type styles, which are not a component.
- ~~The header's single 68px checkbox cell~~: Table / Header Row (2 Nov 2026) has one column per control, as code does.

The confirm dialog and toast after a destructive action belong to patterns 03 and 04.

**Design questions.**
- ~~Paid and Rejected statuses (no Status Pill variants).~~ Added on 2 Nov 2026.
- Selected outline vs fill (464:950).
- ~~Breakdown block (121:2956).~~ Decided (add-table-breakdown): built from the generic table parts; `CostBreakdownTable` is a TableList.
- ~~Header checkbox cell width (89:1126).~~ Decided (add-table-header-row): a column per control, with the rows' padding.
- Amount format (518:672 vs 520:1873).
- Both components are pinned to Dark.

### Page header (Figma 518:232)

**What it solves.** Every list and form page opens the same way: the page's `<h1>` on the left, page actions on the right, and optionally a description under the title or the type tabs next to it. `src/patterns/page/PageHeader.tsx` is a story-level scaffold. The library has no Page Header component, so Figma draws it as a frame on each page (518:273, 518:557, 2102:5749, 2102:6628).

**Components.**
- Type ramp: Heading/xl-bold in text.primary for the title, Body/sm-regular in text.secondary for the description.
- In the stories: Button, Tabs + TabItem, MenuTriggerButton + MenuItem.

**The flow the stories show** (`Patterns/Page header`):
- **Basic** (Cost Centers + Add New): the title on the left, the action on the right, on one line.
- **With tabs and actions** (Costs): the type tabs move with the arrow keys. View Audit Logs sits left of Export, and Export opens Export Costs and Export Invoices.
- **With description** (Announcements): the description sits 4px under the title.
- **Dark.**

**What Figma draws that the stories don't.** Nothing since 2 Nov 2026: PageHeader draws the 1px divider between the Costs title and its tabs.

**Design questions.** On the Announcements screen, the actions sit below the stat row rather than right of the title (2102:6628 vs the rule in 518:247). The Costs screen's buttons differ from pattern 01 B's (icon on View Audit Logs; a Default button vs a Menu Trigger for Export).

## Patterns – Admin (01–16)

### 01 · List page (Figma 518:900)

**What it solves.** The layout of every admin and user list (Costs, Cost Centers, Partners, Contacts, Users, Recurring Costs, Announcements, Exports, Drafts). It has a page header, a filter bar, a data table and pagination, always in that order, 24 apart in a 40-padded page.

**Components.**
- PageHeader (`src/patterns/page`): Tabs / TabItem (Tabs / Cost Type), Button (View Audit Logs, Add New), MenuTriggerButton + MenuItem (Export).
- The Costs filter bar (`src/patterns/filters/CostsFilterBar.tsx`).
- CostsTable (`src/patterns/costs`): TableList, TableHeaderRow, TableHeaderCell, TableRow, TableCell, TableExpandButton, TableAccountDetails, StatusPill / Tag.
- EmptyState (compact), Pagination, Toast / ToastProvider.
- The Costs page is one composition, `src/patterns/list-page/CostsListPage.tsx`. It is shared with U01 and 02.

**Flow the stories show** (`Patterns/List page`):
- **Costs** (example B, 518:514):
  - The order is header, bar, table, pagination, and pagination sits at the bottom right.
  - View Audit Logs sits left of Export.
  - Page 1 is the eight newest of 32 costs, on 4 pages. › moves to the next eight.
  - The Recurring tab (arrow keys) keeps only recurring costs and returns to page 1 (2 pages).
  - Amount sorts the whole list, not just the page shown.
  - Clear Filters is hidden while no filter is in use.
- **Page actions:** Export opens Export Costs / Export Invoices. Enter starts an export, and pattern 12's Info toast says "Export started. It will appear in Exports when it's ready." Focus returns to Export.
- **Cost Centers** (example A, 518:252):
  - Add New sits on the right. The headers don't sort (a short reference list).
  - There are 3 pages of 5 rows. Search ("legal") narrows the rows and returns to page 1.
  - The cost center dropdown, from the keyboard (↓, ↓↓↓, Enter), leaves "No items." in the table, and pagination goes.
  - Clear Filters restores everything and puts focus in the search box.
- **Dark:** page 2 with one breakdown open.

**What Figma draws that the stories don't.**
- Example B's row ••• menu and checkbox column: those are patterns 03 (row actions) and 07 (bulk selection), so each story shows one task.
- What View Audit Logs (pattern 08's side sheet) and Add New (pattern 05's modal) open: the buttons are there, inert.
- ~~The 1px divider between the title and the tabs~~: PageHeader draws it since 2 Nov 2026.

**Design questions.**
- Short lists are drawn sortable but described as not sortable.
- Clear Filters is on its own row in Filter / Bar – Costs but at the far right in the patterns. Since 5 Nov 2026 both are `Filter / Clear`, and pattern 01's guidance says "Clear Filters (far right, only while filtering) resets all" (518:247).
- How should the bar and the ~977px Costs table behave on narrower screens?
- Does a new sort return to page 1?
- 240 vs 256 field width.

### 02 · Search & filter (Figma 520:1873)

**What it solves.** How users narrow a list.
- Search and filters sit in one bar above the table. They apply as soon as they change; there is no Apply button.
- Every change returns to page 1.
- Once a filter is in use, Clear Filters appears and the search box shows its ×.
- When nothing matches, the compact Empty State ("No items.") shows inside the table, with the bar still in place.
- Date filters open a two-month range picker under the field: the first day picked is the start, the second the end.

**Components.** The organism `src/patterns/filters/CostsFilterBar.tsx` (Filter / Bar – Costs 256:4585; Filter / Bar 256:5338, Page=Costs / Recurring) is story-level, not exported from `src/index.ts`:
- **FilterBar:** Figma's Bar as a `search` landmark: surface.neutral.faint, a 1px stroke.subtle inset stroke, radius 12, 16 padding, fields 12 apart, with an optional row under the fields. `showClear` (Filter / Bar's Show Clear, since 5 Nov 2026) puts **FilterClear** (DS, `Filter / Clear`: an Outlined Button with ArrowsClockwise) on the far right; `onClear` resets. Every bar sets it only while a filter or a search is in use: hidden, never disabled (decision filter-clear-disabled).
- **FilterSelect** (DS, Filter / Field – Select, since 2 Nov 2026): the Status, Payment Method and Currency dropdowns. A Select / Menu under the field with the chosen option checked; "All Status" is the reset item. Select's keys.
- **FilterDateRange** (DS, Filter / Field – Date range, since 2 Nov 2026): Select Period and Creation Date. Focus goes into the calendar, and the picker closes after the second pick with focus back on the field, which shows the range as "12–24 Oct" (no year in the current year; a screen reader hears it). Filter / Summary keeps the ISO days.
- **Filter / Summary:** "Current Filters" with the lines in use, when `showSummary` is set.
- **Helpers:** `filterCosts` (search over ID, title, invoice #, applicant name and email, beneficiary and account; status, payment method, currency; Period overlaps the cost's period; Creation Date contains the submitted date), `hasActiveCostFilters`, `costFilterSummary`.

**Flow the stories show** (`Patterns/Search & filter`):
- **Search a list (Users)** (steps 1–3 exactly as drawn, 520:773 / 520:950 / 520:1074):
  - The full list, with no Clear Filters.
  - Typing "maria" on page 2 leaves Maria Santos on page 1, and Clear Filters and × appear.
  - "zzz" shows "No items." in the table, with no pagination.
  - Clear Filters restores the list and puts focus in the search box.
  - All Roles → Admin from the keyboard.
- **Filter costs:**
  - From page 3, Status → Pending from the keyboard returns to page 1 (19 costs). The summary reads "Status: Pending".
  - Creation Date opens the picker on October and November with focus on today. Picking the 12th, then the 24th, gives step 4's rows (32436, 32431, 32430). The field reads "2026-10-12 – 2026-10-24".
  - Typing "maria" leaves 32431, and the summary lists all three filters.
- **No results, then Clear Filters:** "No items." in the table, with the bar in place and no pagination. Clear Filters resets every field, restores the full list, hides itself and the summary, and puts focus in the search box.
- **Filter by a date range** (step 4, keyboard): Enter opens Select Period on today. ←×12 Enter starts the range and →×12 Enter ends it. The costs whose period overlaps October 12–24 remain (32436, 32431), and focus returns to the field.
- **Date range picker open:** step 4 as drawn, the picker open under Select Period. It renders open for Chromatic and is not on the docs page.
- **Bar presets:** Page=Costs has six fields; Page=Recurring has search and status. Clear Filters shows only while one of a bar's filters is in use, on its far right.
- **Dark:** step 4's result with the summary.

**What Figma draws that the stories don't.**
- Users' sortable headers: not wired, per pattern 01's text.
- Filter / Bar – Costs puts Filter / Clear on its own line under the wrapped fields: code keeps it at the end of the wrapping row, on the far right.
- The open state of a status dropdown: Figma doesn't draw it, so code uses a Menu / Dropdown.

**What code adds.**
- A visually hidden results line ("Showing 3 of 32 costs") so screen readers hear the change.
- Focus moving to the search box after Clear Filters.
- Filter / Summary (opt-in).

**Design questions.**
- Select Period vs Creation Date.
- ~~The Funnel icon and the truncated range on step 4's period field~~: the calendar icon and the short format without the current year (2 Nov 2026): every current-year range fits the 256 field (the widest, "30 May – 30 Nov", is 118px). Only a long range in another year is still cut (docs/figma-sync.md, "FilterDateRange").
- ~~Which list a dropdown filter opens~~: Select / Menu with the chosen option checked (FilterSelect, 2 Nov 2026).
- Filter / Summary or chips on list pages.
- A visible results count.
- A per-field ×.
- ~~The "Filter by Cost Center" vs "All Status" wording~~: a value, "All Cost Centers" (decision filter-wording); the Cost Centers list and the Exports screen read so since 2 Nov 2026.
- How the bar wraps.
- 240 vs 256 width.

**Missing components.**
- ~~Filter / Field – Select~~ and ~~Filter / Field – Date range~~: FilterSelect and FilterDateRange since 2 Nov 2026.
- ~~A Clear Filters control~~: FilterClear (`Filter / Clear`) since 6 Nov 2026.

### 03 · Row actions menu (Figma 520:2387)

**What it solves:** every table row ends with a ••• button that opens a short menu of actions for that one record, so rows stay clean and the actions stay consistent across lists.

**Components:** RowActionsMenu (IconButton ••• + MenuDropdown), MenuItem (Default, Destructive), TableList, TableHeaderRow (Show Actions), TableHeaderCell, TableRow, TableCell, ModalConfirm (Destructive), ModalDialog (Medium) with TextField and SelectField, PaymentSchedules with PaymentRow, ToastProvider/Toast, PageHeader, and RecurringCostsTable for the View step.

**Flow in the stories** (`src/patterns/row-actions/RowActions.stories.tsx`, on the Cost Centers list):
- *Delete from the row menu*: ••• opens the menu under the button, right-aligned, with focus on its first item. A click outside closes it. Delete opens “Delete cost center?”, “‘Employee Expenses’ will be permanently deleted. This can’t be undone.”, with focus on Cancel. Escape cancels and focus returns to the •••. From the keyboard, ↑ opens the menu on Delete, then Enter, Tab and Enter delete the row. The next row’s ••• takes focus and the toast says “Cost center deleted.”.
- *Edit from the row menu*: Edit opens pattern 05’s form, pre-filled, as “Edit Cost Center”, with focus on the first field. An empty Location shows “Location is required.” and keeps the dialog open. Save sends the form’s FormData, closes the dialog, returns focus to the •••, updates the row and shows the toast “Cost center updated.”.
- *Menus for each page*: the Costs, Recurring Costs, Exports and “most lists” menus open together. Each follows Figma’s order, with Delete last and red.
- *View opens a modal*: on Recurring Costs, View Schedules opens the read-only Payment Schedules. × or Escape closes it and focus returns to the •••.
- Snapshots: *Menu open*, *Delete confirmation open*, *Dark*.

**On a narrow screen** (decision add-phone-table-layout): the table scrolls sideways in its own region, and every row menu opens outside it, on `<body>` (RowActionsMenu's portal), so the region never cuts a menu off. The stories find the menus with `screen`.

**What Figma draws that the stories don’t:** the Cost Centers headers are Sortable in Figma (sorting belongs to the list page pattern, 01/02). The Table / Row Hover state is TableRow’s own `:hover` and isn’t asserted. Add New belongs to pattern 05.

**Design questions:** the edit title and its toast aren’t drawn (“Edit Cost Center”, “Cost center updated.”). Focus after a row is deleted isn’t drawn either: the stories move it to the next row’s •••. The recurring columns in step 3 (520:2172) differ from the library row (see Manage recurring costs).

### 04 · Confirm destructive actions (Figma 523:2612)

**What it solves:** anything that deletes, rejects or stops a record is confirmed first, in a small dialog that names the record and says what will happen.

**Components:** RowActionsMenu, MenuItem (destructive), ModalConfirm (destructive), ToastProvider / Toast (Success, Error), PageHeader, and the list table (TableList, TableHeaderRow, TableHeaderCell, TableRow, TableCell). It runs on the Cost Centers list (`src/patterns/modal-form/CostCentresPage.tsx`), which pattern 05 shares.

**Flow the stories show:**
- *Delete:* the row menu lists Edit, then Delete (red, last). From the keyboard, Delete opens "Delete cost center?" with the message "“Employee Expenses” will be permanently deleted. This can’t be undone.", and focus opens on Cancel. Escape changes nothing and puts focus back on the •••. Confirming removes the row and shows "Cost center deleted.", and focus moves to the next row's •••.
- *Delete fails:* a cost centre that costs still use stays. The error toast "Couldn’t delete. This cost center is used by 12 costs." stays until dismissed.
- *Confirm open* and *Dark:* the dialog open, for Chromatic.

**What Figma draws that the stories don't:** the Hover row state (523:2012), which is the row's own `:hover`.

**Design questions:**
- Figma says a click outside closes the dialog, but ModalConfirm ignores backdrop clicks.
- Figma doesn't say where focus goes after the row is gone. The stories move it to the next row's •••.

### 05 · Create or edit in a modal (Figma 523:3452)

**What it solves:** short records are created and edited in a dialog over the list, so the user keeps their place.

**Components:** ModalDialog (Medium), SelectField, TextField, Button (Default, Text), ToastProvider, PageHeader, RowActionsMenu, and the list table, a TableList (`src/patterns/modal-form/CostCentreDialog.tsx`, `CostCentresPage.tsx`).

**Flow the stories show:**
- *Add new:* Add New opens "Add New Cost Center", with focus on Cost Center and every field marked *. Save with Location empty shows "Location is required." in place, focuses Location and keeps the other values. From the keyboard, Save closes the dialog and puts the new record at the top of the list. "Cost center added." confirms it, focus returns to Add New, and the FormData is checked. Cancel and Escape save nothing, and each opening starts with a fresh form.
- *Edit from the row menu:* the same dialog, pre-filled and titled "Edit Cost Center". Save updates the row and focus returns to its •••.
- *Validation errors* and *Dark:* the dialog open, for Chromatic.

**What Figma draws that the stories don't:** the Add New button's Hover state (523:2715), which is the button's own `:hover`.

**Design questions:**
- The Cost Center is chosen from a dropdown while a cost center is being created.
- The primary button is "Save", although the guidance asks for a button that names the result.

### 06 · Edit in a side sheet (Figma 524:3609)

**What it solves:** long or multi-section records, such as a recurring cost with its schedule and breakdowns, are edited in a panel from the right, with the list visible behind it.

**Components:** SideSheet, FormSectionHeader (h3 in the sheet), TextField, SelectField, DateField, TextareaField, BreakdownItem with its RowActionsMenu, the Cost Breakdown ModalDialog stacked over the sheet, ModalConfirm, PaymentSchedules and PaymentRow (View Schedules), Tag and StatusPill, and ToastProvider (`src/patterns/side-sheet/`, `src/patterns/forms/BreakdownsSection.tsx`).

**Flow the stories show:**
- *Edit and update:* Edit is first in the menu (Edit, View Schedules, Stop, Delete). It opens "Edit Recurring Cost #1882" with the record's values. Update catches an emptied Frequency Value in place. The frequency changes to every 1 month. "Add new" opens the Cost Breakdown dialog over the sheet; that dialog is checked on its own and filled from the keyboard for the dates, and the new card appears. Update closes the sheet and the row shows "1 month". "Recurring cost #1882 updated." confirms it, and focus is back on the row's •••. The update and the FormData (the `breakdown` entries) are checked.
- *Discard changes:* with nothing changed, × closes at once. After a change, Escape and Cancel ask "Discard changes?". "Keep editing" goes back with the text kept; "Discard" closes without saving.
- *Sheet open* and *Dark:* the sheet open, against the right edge at full height.

**What Figma draws that the stories don't:**
- The panel's own URL (`/admin/recurring-costs/1882`), which is the app's routing.
- A single Frequency dropdown. The stories use Frequency Value and Unit (U02), to match the data.

**Design questions:**
- 06's values don't match U04's #1882.
- The discard confirmation isn't drawn.
- There is no Status pill for a stopped cost.

### 07 · Bulk selection & actions (Figma 524:4713)

**What it solves:** admins select several costs and change their status in one go. Selection lives in the table, and the bulk action appears in the page header only while something is selected.

**Components:** CostsTable (Checkbox per row, header Checkbox with Mixed, TableRow Selected), PageHeader with Tabs / TabItem (Cost type), MenuTriggerButton (“Change Status (n)” and Export), MenuItem, Pagination, Button (View Audit Logs, which opens pattern 08’s AuditLogsDialog), ToastProvider/Toast (Success, Info).

**Flow in the stories** (`src/patterns/bulk-actions/BulkActions.stories.tsx`):
- *Select and change status*: ticking two rows (mouse and Space) highlights them, sets the header to Mixed and shows “Change Status (2)” between View Audit Logs and Export. ↓ opens the menu on Reject. Choosing Approve updates both rows and clears the selection. The button goes, focus moves to “Select all costs”, and the toast says “Status updated for 2 costs.”. With one row, Mark as Paid shows “Status updated for 1 cost.”.
- *Select all, then change page or tab*: the header selects the 8 rows on the page (“Change Status (8)”). Next page clears the selection, and so does the Recurring tab, which filters the table (a tabpanel labelled by the tab).
- *Export while selected*: Export → Export Costs shows the Info toast “Export started. It will appear in Exports when it’s ready.” (pattern 12’s copy). View Audit Logs opens and closes with focus returned.
- Snapshots: *Change status menu open*, *Dark*.

**What Figma draws that the stories don’t:** Filter / Bar – Costs (patterns 01/02 cover it; the Cost type tabs stand in as the filter that clears the selection) and each row’s ••• (pattern 03). Figma’s Change Status is a Tonal Button / Normal with a caret; code uses MenuTriggerButton.

**Design questions:** Tonal Button vs Menu Trigger for Change Status. Where focus goes once the button disappears. Whether a bulk Reject needs pattern 04’s confirmation. Whether the menu should leave out statuses the selection can’t move to. There are no Paid or Rejected pills.

### 08 · Expand for details & change history (Figma 526:5189)

**What it solves:** rows show a summary and open in place to reveal more (a cost’s breakdown, or what changed in an audit log entry), so the user keeps their place in the list.

**Components:** CostsTable (TableExpandButton, TableAccountDetails, the breakdown table under the row), PageHeader, Button (outlined View Audit Logs, small Text View Changes), ModalDialog (Large, with `actions`: an IconButton Refresh), TableList, TableHeaderRow, TableHeaderCell, TableRow, TableCell (text, two-line; Custom for the detail row), Tag (Created, Updated, Deleted), ChangeDiff and ChangeDiffRow, Alert (Error, Compact) and Pagination. The audit log is a story-level composition, `src/patterns/expand-details/AuditLogs.tsx` (AuditLogTable, AuditLogsDialog).

**Flow in the stories** (`ExpandDetails.stories.tsx`):
- *Expand for details*: rows start collapsed with the account summary (ID, Applicant, Beneficiary, IBAN, Recurring). The caret opens cost 32430’s six-line breakdown under its row and pushes the next row down. Several rows can be open, and Enter closes one again with focus kept on the caret.
- *Audit logs: view changes*: View Audit Logs opens “Audit Logs” (Cost ID, User, Timestamp, Activity), with Refresh beside × (Modal / Dialog's Show Actions, since 5 Nov 2026: `actions`; Refresh calls `onRefresh`). View Changes is a disclosure (`aria-expanded`, `aria-controls`) that opens a Field / Before / After table (Status: Unknown → Pending, `<del>` and `<ins>`) and then reads Hide Changes. A deleted record (#32418) shows the Alert “This cost was deleted”. Pagination shows four entries a page and open entries stay open. Escape closes the dialog and focus returns to View Audit Logs.
- Snapshots: *Audit logs open* (the first two entries open, as Figma), *Dark* (a row expanded), *Audit logs — Dark*.

**What Figma draws that the stories don’t:** the Costs rows’ checkboxes and the page header’s tabs and Export (patterns 07 and 01). The audit table’s Pagination shows 3 pages, not Figma’s 25: the fixtures hold 12 entries.

**Design questions:** “This cost was deleted” vs “This cost was deleted.”. An Error Alert is role=alert, so it interrupts a screen reader on expand. Updated’s Tag is Info here but Completed on the Admin Audit Logs screen.

### 09 / U02 · Multi-section form (Figma 527:5661, U02 545:17897)

**What it solves:** creating a cost, the longest form in the product. It is a full page in titled sections, with repeatable breakdowns and attachments, and it can be saved as a draft at any point.

**Components:** the organism **Form / New Cost** (`src/patterns/forms/NewCostForm.tsx`) is built from PageHeader, PanelCard (the card the form sits in, since 3 Nov 2026), Divider (Figma's two rules, since 3 Nov 2026), FormTabNavigation with TabItems (its tab panel holds the fields), FormSectionHeader, TextField, SelectField (Currency with FormEditLink "[Edit]"), DateField, FileUploadField, FormHint (the recurrence summary, since 2 Nov 2026), BreakdownsSection (BreakdownItem with RowActionsMenu, and CostBreakdownDialog: ModalDialog, TextField, SelectField, ComboboxField, DateField) and Button (Outlined "Save to Drafts", Default "Save").

**Flow the stories show:**
- *Layout* (Single cost, Recurring cost, Dark): "New Cost" is the page's PageHeader, and 24 under it a PanelCard holds only the form, in a centred column as wide as Figma's card (`max-w-xl`, 576; Figma 578, the nearest container width, as GDL has no width scale). A Divider opens Beneficiary Information and Breakdowns, 24 from what is above and below it, on both tabs (U02 draws them on the Recurring tab too). "Cost Details" stays a section header (decision add-divider). Below 640px Save to Drafts and Save stack, as the Frequency row does: on a 320 phone the card leaves 224 for the fields, too narrow for both side by side.
- *Single cost:* Applicant name and Email are pre-filled from the account, and "[Edit]" calls `onEditCurrency`. Save with the cost half done marks every section that needs something: Currency, Partner, Payment method, the invoice, and "Add at least one breakdown." in an Alert. Focus goes to the first error. Currency is chosen by typeahead, then an invoice is attached and a breakdown added through the dialog. Save sends the FormData (`type`, the fields, `invoices`, one JSON `breakdown` per breakdown), and a toast confirms it.
- *Recurring cost:* → switches the tab. "Recurring Details" and "Cost Details" are inserted and Invoice number goes; what was typed is kept. The summary follows Value and Unit ("This will recur every 3 weeks"). Save starts its checks at Starts At, and ← goes back.
- *Edit and remove breakdowns:* Edit opens the dialog pre-filled, with an Update button, and an amount of 0 is rejected. Remove moves focus to the next •••, then to "Add new".
- *Cost Breakdown dialog* and *Dark:* the dialog open; the Recurring tab in Dark.

**What Figma draws that the stories don't, and why:**
- ~~The card around the form, and the two Dividers~~: PanelCard and Divider since 3 Nov 2026 (decisions add-card-panel, add-divider).
- ~~The Title/md-bold heading inside the card~~: decided (add-form-heading): form pages use the PageHeader (Heading/xl-bold) above the card. Form / New Cost (184:3121) and the screens still draw the heading in the card. Fix in Figma: take the Page Heading out of Form / New Cost and place a Page Header above it.
- Figma's rules are the remote Divider (184:1944): 184:3182 binds its line to `stroke/stronger`, 184:3260 too. Code uses the library's Divider (Layout 765:15396, `stroke/subtle`). Fix in Figma: swap them to Layout → Divider.
- The card is `max-w-xl` (576) where Figma draws 578, so the fields are 512 wide (Figma 510).
- 09's Frequency dropdown and Ends At: the stories follow U02.
- The tabs' own URLs (`/new-cost/single`, `/new-cost/recurring`): the app routes them.
- Manage Currencies: that is U06.

**Design questions:**
- Which fields are required.
- The Recurring Details layout differs between 09 and U02.
- The Cost Breakdown dialog differs between 09 and U02 ("Amount" and "Add", or "Total Amount" and "Submit").
- Notes is a text field or a textarea, and is missing from U02's Recurring frame.
- Whether a recurring cost needs an invoice up front.

### 10 / U05 · File upload & attachments (Figma 527:6028, U05 545:19071)

**What it solves:** adding files by dragging or browsing, with a chip per file that can be removed before saving or downloaded later. It also covers bulk upload from a CSV.

**Components:** FileUploadField (`_File Upload Zone` and FileChip), FileChip (Download), ModalDialog (Small), EmptyState (Compact), CostsTable (from the foundation) with MenuItem, and the organism **Form / Bulk Upload** (`src/patterns/forms/BulkUploadForm.tsx`: PageHeader, PanelCard, SelectField, FileUploadField, Divider, Button Outlined with download-simple, Button Default). Results come from ToastProvider.

**Flow the stories show:**
- *Layout* (Attach and remove, Bulk upload, Dark): each form is alone in a PanelCard under the page's PageHeader, 24 apart, in a centred `max-w-xl` column (576; Figma 578). Bulk Upload's Divider sits between the CSV upload and the template row, 12 from each.
- *Attach and remove:* the hint describes the input. Files become chips with their sizes (245 KB, 1.2 MB). contract.zip gets a red chip, "File type not supported…", and isn't in the input. × removes a file and focus moves to the next ×. Save's FormData holds exactly the files shown.
- *View invoices:* Costs → ••• → View invoices opens "Invoices" with the description "Cost #32430 · 2 files" and a chip with Download per file. Escape returns focus to the •••. A cost without invoices says so.
- *Bulk upload:* Download asks for a payment method first, then calls `onDownloadTemplate('Wiretransfer')`. Upload with no file marks the field and focuses it. An .xlsx is turned down in a red chip and the .csv is accepted. Upload's FormData is `paymentMethod` and `file`, and the toast says "12 costs uploaded."
- *Bulk upload, rows fail:* an error toast names rows 4 and 9 and why, and stays until dismissed.
- *Invoices open* and *Dark:* for Chromatic.

**What Figma draws that the stories don't, and why:**
- ~~Bulk Upload's card and Divider~~: PanelCard and Divider since 3 Nov 2026 (decisions add-card-panel, add-divider). The heading is the PageHeader above the card (add-form-heading); Form / Bulk Upload (191:435) still draws it in the card.
- Figma's rule (191:459) is the remote Divider (184:1944) with a raw slate line (#475569, no variable). Code uses the library's Divider (`stroke/subtle`). Fix in Figma: swap it to Layout → Divider.

**Design questions:**
- No Required markers on Bulk Upload.
- Download before a payment method is chosen.
- A long failure list in a toast.

### 11 · Loading, empty & error states (Figma 528:6035)

**Solves:** every list and dialog has to handle waiting, having nothing to show, failing, and pages that don't exist. It does this without the layout jumping, and it tells the user what to do next.

**Components:** SkeletonTableRow (Skeleton), Spinner (24), EmptyState (Default and Compact), Alert (Error), Button, TableList / TableHeaderRow / TableHeaderCell / TableRow / TableCell, FilterField, FilterSelect (Role), ModalDialog (via `ExportDetailsDialog`), PageHeader. Story-level organisms in `src/patterns/states/`: `UsersPage` (the Users screen, shared with pattern 12) and `UsersTable` (Name, Role, Date Created).

**Flow the stories show:**
- *Loading a list* (Step 1): the Users header, filters and table header are in place at once. The body shows five SkeletonTableRows of three cells, the table is `aria-busy`, and a visually hidden status says "Loading users". This story never answers, so it can be snapshotted.
- *Loads, then no results*: the skeletons give way to 12 rows in the same columns, at least as tall as the skeletons. Searching for "zzz" shows the Compact Empty State "No items." inside the table, with the filters still visible. Escape clears the search and the rows come back.
- *Load fails, then retry*: the first request fails. An Error Alert ("Couldn’t load users." / "Check your connection and try again.") appears above the table, which keeps its header, with Retry as its own action (Alert's Show Action, `action="Retry"`, since 6 Nov 2026; it was a Button under the Alert). Retry (from the keyboard) loads again and moves focus to the table, because the alert and its button disappear. Then the rows arrive.
- *Loading a dialog* (Step 2): Export Details opens straight away with a 24px Spinner, centred over "Loading…", and has no footer. The Spinner's status says "Loading export details", so the visible text is hidden from screen readers to avoid reading it twice. Pattern 13's View Details shows the content arriving.
- *Nothing here yet* (Step 3): Announcements has no rows. The Default Empty State ("No announcements yet" / "Create an announcement to tell users what’s new.") sits in the table with Add New, which opens Create Announcement (pattern 14). Escape closes it and returns focus to that button.
- *Page not found* (Step 4): "404" (Display/xl-bold, text.brand.medium) sits over the Empty State. "Go back home" is a link with the Button's look (Button `href`, since 6 Nov 2026). It shows Costs and moves focus to the new page, as a router would.
- *Dark*: the list loading.

**What Figma draws that the stories don't:** nothing is left out. The stories add a failed load, which Figma doesn't draw.

**Design questions:** what a failed list load should look like, and its copy (Figma draws none). ~~Alert has no action slot for Retry~~ (it has since 2 Nov 2026; UsersPage uses it since 6 Nov). ~~"Go back home" navigates, but Button has no link form~~ (Button `href`, 6 Nov 2026). Should the 404 page sit inside the app shell?

### 12 · Feedback messages (Figma 528:6347)

**Solves:** choosing the lightest way to tell the user something. A **Toast** reports the result of an action. An inline **Alert** gives context that stays on screen. A **field error** marks one value to fix. A **Tooltip** names an icon-only button.

**Components:** Toast (ToastProvider / useToast), Alert (Info), TextField (with error), SelectField, CheckboxField (Bordered), ModalDialog (Medium), Button, UserActions (ThemeToggle in a Tooltip, AccountMenu), plus pattern 11's `UsersPage`. Story-level organism in `src/patterns/feedback/`: `AddUserDialog` (Add New User, 528:6197).

**Flow the stories show:**
- *Alert, field errors and a toast*: Users → Add New opens Add New User. The Info Alert "Temporary password" sits in the dialog, after the fields and before the footer. Save with nothing filled in puts an error under Name and under Email ("Enter a valid email address, like name@company.com.") and focuses Name. Each error clears as soon as its value is valid: "maria.santos@" is still wrong, and adding "geekee.com" fixes it. The Alert stays the whole time. Restricted User is ticked with Space, and Save is pressed from the keyboard. The form is read with FormData. The dialog closes, focus returns to Add New, the user is added to the table (Restricted User), and a Success toast "User added." appears; it closes on its own after 5 seconds.
- *Alert that stays* (Step 2): the dialog open and filled in as Figma shows it.
- *Toasts* (Step 1): Figma's four, newest last, at the bottom right, 16px in: "Cost saved.", "Export started. It will appear in Exports when it’s ready.", "3 rows were skipped because the currency is disabled.", and "Upload failed. Check your connection and try again." with Retry. Warning and Error have no timer. Retry (from the keyboard) removes the error and reports "Costs uploaded.". Success and Info are held open here (`duration: null`) so the snapshot is stable; in the app they close after 5 seconds.
- *Tooltip* (Step 4): the theme toggle's tooltip names it on hover and on keyboard focus, and Escape hides it without moving focus. When the toggle is pressed, the name and tooltip follow the new theme.
- *Dark*: Add New User with the email error and the Alert.

**What Figma draws that the stories don't:** Step 3's second reference field (a valid Invoice number) isn't shown, because the Email error covers the state. Step 4 pairs the toggle with a DotsThree icon button; the stories use UserActions, the real header group, whose second button is the account menu. UserActions places the tooltip below the toggle (the header is at the top), not above it as Figma draws.

**Design questions:** Figma's tooltip copy "Switch to light mode" vs the component's "Switch to light theme". Top vs bottom placement for header icons. Role dropdown plus a Restricted User checkbox, vs Restricted User as a third role. The copy for "User added." and "Costs uploaded.", which Figma doesn't draw.

### 13 · Overview & record details (Figma 529:6821)

**Solves:** pages that track jobs (Exports) show totals above the list, and open each record's full details read-only in a dialog.

**Components:** StatRow + StatCard via `ExportsStatRow` (**Card / Stat Row – Exports**, 387:3601), PageHeader, FilterField, FilterSelect, TableCell (Two Line, Status + Date), Tag, RowActionsMenu + MenuItem, Pagination, ModalDialog (Medium), Spinner, DescriptionList, FilterSummary, ModalConfirm (Destructive), Toast. Story-level organisms in `src/patterns/overview/`: `StatRows.tsx` (`ExportsStatRow`, and `AnnouncementsStatRow`, **Card / Stat Row – Announcements** 389:163, used by pattern 14), `ExportsTable`, `ExportDetailsDialog`.

**Flow the stories show:**
- *Stats, filters and pages* (Step 1): the group "Export totals" (Total Exports 6003, Completed 5665, Processing 0, Failed 338) sits between the page header and the filter bar. The table shows pattern 13's columns, four rows a page. Page 2 shows the next four. Choosing Type Excel from the keyboard goes back to page 1. Adding Status Failed finds nothing: the Compact "No items." appears in the table and the filters stay. Searching "09-24" narrows by name. The totals never change, because they count the whole collection.
- *View details* (Step 2): ••• on a completed export offers Download, View Details and Delete. View Details opens Export Details straight away with the Spinner, then shows a DescriptionList (Name, Type, Created By, File Size, Created, Completed, Valid until (created + 7 days), Downloads) and a FilterSummary ("Current Filters"). Download in the footer increases the count in the dialog and in the table. Escape, or the footer's Close, closes it, and focus returns to the •••. The keyboard path is ↓, ↓, Enter.
- *Retry and delete*: a failed export offers Retry, View Details and Delete. Retry sets it to Processing, moves the totals (Failed 337, Processing 1) and raises the Info toast "Export started. It will appear in Exports when it’s ready.". Delete opens Modal / Confirm ("Delete export?", "“…” will be permanently deleted. This can’t be undone.", with focus on Cancel). Confirming removes the row, updates the totals and raises "Export deleted.", and focus moves to the next row's •••.
- *Details open*: the dialog, loaded. *Dark*: the overview.

**What Figma draws that the stories don't:** the pattern's own sample rows ("costs-2026-10-07-91822", CSV, 18 KB) and totals (5981 / 5648 / 0 / 333). The stories use the Admin Exports screen's data from the shared fixtures, so every pattern draws from one data set. The pagination "1 … 25" becomes two pages of the eight sample rows. The dropdown filters' open menu isn't drawn in pattern 13; FilterSelect draws Filter / Field – Select's.

**Design questions:** the pattern's table vs the Admin screen's (columns, title "Export Management"). The totals that differ. Which filters Current Filters lists. Showing Download and Retry only where they apply. The footer "Close", which has the same name as the header's X. A selected state for filter options.

### 14 / U07 · Announcements & what’s new (Figma 529:7639, U07 545:25222)

**Solves:** admins publish release notes as announcements for an audience. Users see the newest one once, in a "what's new" dialog after sign-in, and can read every release on the Changelog page.

**Components:** PageHeader, `AnnouncementsStatRow` (389:163), AnnouncementsTable (Tag, RowActionsMenu), ModalDialog (Large) with TextField, DateField, RadioGroup, RepeatableField (with its error state) and ToggleField, **ChangelogModal** (Modal / Changelog 391:174, the DS component) with BulletItem, ChangelogEntry, AppHeader (Header – User) with NavLink, Tabs, CostsTable, ModalConfirm, Toast. Story-level organisms in `src/patterns/announcements/`: `AnnouncementsTable` and `CreateAnnouncementDialog`.

**Flow the stories show:**
- *Admin publishes* (Step 1): the totals read 7, 2.5.6 and Aug 10, 2026. Add New opens Create Announcement. Create with nothing filled in shows "Enter a title.", "Enter a version, like 2.5.6.", "Choose a release date." and the features error, and focuses Title. Each error clears as its value becomes valid ("2.6" stays wrong; "2.6.0" is fine). The release date is picked from the calendar, the audience is User, and there are two features; Active is on by default. Create submits with FormData. The dialog closes, focus returns to Add New, the announcement is first in the list (v2.6.0, User, Active), the totals become 8, 2.6.0 and Nov 2, 2026, and "Announcement created." appears.
- *Preview and delete*: ••• → Preview (from the keyboard) shows the release in Modal / Changelog, as users will see it. Got It closes it and focus returns to the •••. ••• → Delete confirms first, removes the row, updates the totals, raises "Announcement deleted." and focuses the next row's •••.
- *Create announcement, open*: the dialog, filled in as Figma shows it.
- *User sees it once* (Step 2 / U07 Step 1): QA Test's Costs page, under the user header, with the newest active release for the user's audience open over it. The dialog takes focus and the page behind is inert. Tab reaches View Change Log, then Got It. Got It closes it for good: going to Recurring Costs and back doesn't reopen it.
- *View the changelog* (Step 3 / U07 Step 2): View Change Log closes the dialog for good and opens the Changelog ("Everything that’s new in the Cost Application Form."), with focus on the page. The ChangelogEntry cards are listed newest first, as h2s under the page's h1, with "Version 2.5.6 • August 10, 2026" meta, and only the latest is marked New. Going back to Costs doesn't reopen the dialog.
- *What’s new, open*, *Already seen* (no dialog for a version already seen), *Dark*: the dialog over the Costs page.

**What Figma draws that the stories don't:** Step 1 draws no table under the totals (a Spacer); the stories add `AnnouncementsTable` with pattern 11's columns. Step 2's Costs table repeats one row; the stories show QA Test's own costs. Whether the user has seen a release is kept in story state; the app stores it per user. The Changelog isn't in the nav, so on that page no link is active, as U07 says.

**Design questions:** the dialog's title vs the Changelog's for v2.5.6. The Changelog's releases (2.5.0, 2.4.0) that aren't announcements. Latest by date or by version. "Add New" vs "New Announcement", and the column sets. A status for inactive announcements. What View Change Log does in an admin preview. ~~A Changelog item in the account menu (U07 guidance)~~ (AccountMenu's `changelog` since 2 Nov 2026, #33). ~~RepeatableField has no error state~~ (added 2 Nov 2026).

### 15 / U08 · App shell & navigation (Figma 530:7799, U08 545:26643)

**What it solves.** The frame around every signed-in page (patterns 15 and U08). At the top: the CAF logo, "Hi, {name}", the theme toggle and the account menu. Below them: the app's navigation. Admins get ten links and users get five. Below 768px the links fold into a menu behind ☰.

**Components.** AppHeader (Header – Admin and Header – User; it is built from TopBar, NavBar, NavLink, UserActions, ThemeToggle with its Tooltip, AccountMenu, MobileHeader and MobileMenu) and PageHeader. `src/patterns/app-shell/AppShell.tsx` is a scaffold at story level, not a library component. It puts the AppHeader over a single `<main>`, inside the header's centred `container`, so a page's title lines up with the logo. The padding follows Figma's Content frame: 32 top on desktop, 24 top and 16 at the sides on a phone. `useDocumentTheme` is the app's side of ThemeToggle. It switches `.dark` on `<html>`, where Storybook's Theme toolbar does, and puts the document back as it was on unmount.

**The flow in the stories.**
- *Admin* (step 1): the admin's ten links, with Recurring Costs current. A click, or Tab then Enter, opens another page: its `<h1>` changes and the Active link moves with it. The page's title lines up under the logo.
- *User* (U08): the user's five links over Costs, the home page after sign-in. None of the admin-only pages appear. The keyboard reaches Create Cost.
- *Theme toggle*: a click switches the document to Dark, and the button's name changes to offer the way back. Keyboard focus shows the tooltip; Enter switches back.
- *Account menu*: Enter opens it on its first item, the arrow keys move, and Escape closes it with focus back on the icon. Enter on Settings chooses it. The story then leaves the menu open, under the icon and flush with its right edge.
- *Mobile, menu open* (steps 2 and 3, at 320): the menu starts open with focus on ✕, every link listed, Costs Active and the account row last. Choosing a link closes the menu and opens that page, and nothing scrolls sideways. ☰ reopens it from the keyboard, Escape closes it and focus returns to ☰.
- *Mobile, user menu open* (U08 step 5): the same menu with the user's five links.
- *Dark*: step 1 in Dark.

**What Figma draws that the stories don't.**
- The mobile step 2 screen (530:7582) shows the Costs page's Tabs and two filters stacked full width. Those belong to the list page and its search and filter (patterns 01 and 02). Here, each page is only its PageHeader, as Figma's step 1 draws Recurring Costs.
- "Remembers the choice" (530:7290) is the app's job, for example local storage. A story doesn't persist the theme, so one story never changes the next.

**Design questions.**
- ~~Figma has no Mobile Menu – User yet (545:26655). Could Mobile Menu take its links as a property instead?~~ Yes: `Navigation / Mobile Menu` has Links=Admin / User since 5 Nov 2026, as code's `links`.
- AppHeader with `defaultMenuOpen` leaves focus on `<body>` when the menu closes. It could pass ☰ to MobileMenu as `returnFocusRef`.

### 16 · Contact messages (Figma 951:7846)

**What it solves.** Admin → Contacts: the messages people send through the CAF contact form. An admin searches, filters and removes them. A message can’t be opened, added or edited, so rows aren’t clickable, there is no message view, and the page has no Add New. Use it for any admin list of read-only submissions the admin can only remove; records the admin creates or changes use the List page (01) with a row actions menu (03).

**Components.** PageHeader (the title only), FilterBar with FilterField (Search contacts), FilterDateRange (Select Period) and FilterClear (`ContactsFilterBar`, Figma's Filter / Bar Page=Contacts), TableList with TableHeaderRow and TableHeaderCell (Table / Header – Contacts), TableRow and TableCell (Table / Row – Contact: Two Line, Text, the new Text (Truncated) and Button types), Button (Small, Destructive), Pagination, ModalConfirm (Destructive), ToastProvider / Toast (Success) and EmptyState (Default and Compact). The page is `ContactsListPage` (`src/patterns/contacts/`); `APP_SCREENS.admin.Contacts` renders it in the templates.

**The table.** Email with the sender’s name below (320), Date Received (sortable, newest first, a click toggles oldest first), Subject, Message (the rest: one line ending in …) and Actions, where every row has a red **Remove**. Figma’s 160 and 112 aren’t on GDL’s scale, so Date Received and Subject take 128 (Date Received grows to its label) and Actions hugs its button (112); see figma-sync.md. The table is at least 1024 wide, so on a narrow screen it scrolls in its own region and the columns keep their widths. Each Remove is named for its message ("Remove message from Sam Holt, received 2025-07-16"), since the visible label repeats on every row.

**The flow in the stories** (each step in Light, Dark and Mobile at 320):
- *1 · Browse and filter:* eight messages, newest first; a row holds no link and one button. "free demo" finds Rhea Valdez’s message; "Lena" finds her two. Clear Filters appears only while a filter is in use, resets the search, brings every message back and puts focus in the search field. Date Received sorts both ways.
- *2 · Confirm remove:* "Remove this message?", "The message from Sam Holt (sam.holt@example.com), received 2025-07-16, will be removed from Contacts. This can’t be undone.", with Cancel and a red Remove. *Cancel keeps the message:* Cancel and Escape close it, nothing is removed, and focus goes back to the row’s Remove.
- *3 · Removed:* Remove takes the row out, the Success toast says "Message removed.", and focus moves to the Remove that took the row’s place.
- *4 · No matching messages:* "refund" leaves the header and the compact Empty State ("No items.") in the table, no pagination, and Clear Filters in the bar. *Filter by period:* March 2025 leaves the four March messages.
- *5 · No messages yet:* the Default Empty State "No messages yet" / "Messages sent through the contact form will appear here." in place of the table, under the filter bar. *Remove the last message* ends there, with focus in the search field.

**What Figma draws that the stories don't.**
- Figma’s compact Empty State reads "No items found"; the stories use the patterns’ shared "No items." (`emptyStateCopy.noResults`).
- Pagination: Figma draws "Page 1 of 25" over the eight sample rows. The fixture has eight messages, so the stories show one page of ten.
- Figma’s Sam Holt message is longer than the fixture’s; both cut to one line.

**Design questions.**
- With no messages, the filter bar still shows (Figma step 5). Hiding it, as Drafts does, would be simpler.
- A cut message can’t be read anywhere. That follows the decision (an admin doesn’t read messages), but past the ellipsis a long message looks like a short one.

## Patterns – User (U01–U08)

U02 (Multi-section form), U05 (File upload), U07 (What's new & changelog)
and U08 (App shell) are covered with 09, 10, 14 and 15 above.

### U01 · My costs list (Figma 545:13220)

**What it solves.** The user's Costs page: every cost they submitted, where it is in review, and its breakdown. Users read and export; they can't change a status.

**Components.**
- AppHeader (Navigation / Header – User, Page=Costs, "Hi, QA Test").
- CostsListPage with `audience="user"`:
  - PageHeader with Tabs and Export (MenuTriggerButton). There is no Add New, Change Status or View Audit Logs.
  - The Costs filter bar, with every field.
  - CostsTable with no checkbox column and no ••• column, expandable and sortable.
  - Pagination, ToastProvider.

**Flow the stories show** (`Patterns/My costs list`):
- **Your costs, newest first** (step 1, 545:13511):
  - One banner, one main and uniquely named navs ("Main", "Pagination"). Costs is the current link.
  - Figma's columns and the screen's eight rows in its order (37022 … 36078). A recurring row carries the Recurring pill.
  - The full Costs bar.
  - 15 costs make 2 pages.
- **Expand for the breakdown** (step 2, 545:13566): the caret opens the breakdown lines (Title, Amount, Nature of Service, Cost Center, Location, Period). A second row opens too. Enter closes the first, and focus stays.
- **Export menu** (step 3 as drawn, 545:13621): the menu is open under Export, flush right, with Export Costs and Export Invoices. It renders open for Chromatic and is not on the docs page.
- **Export invoices:** keyboard ↓ opens on Export Costs, then ↓ Enter. The toast appears and focus returns to Export.
- **Dark:** step 2.

**What Figma draws that the stories don't.**
- ••• → View invoices and its invoices dialog: pattern 03's flow, and U01's steps don't draw it.
- The title/tabs divider.
- Figma's loose Pagination / Items (545:13532): Pagination is used instead.

**Design questions.**
- Applicants other than the signed-in user in "my" costs.
- Export is drawn as a plain Button but described as a Menu Trigger.
- The export toast points users to an Exports page they can't reach.
- Four status colours vs the two Status Pills.

### U03 · Save and resume drafts (Figma 545:18365)

**What it solves:** parking an unfinished cost and picking it up again later from Drafts.

**Components:** NewCostForm (Save to Drafts; the form in its PanelCard under the page's PageHeader, which names the open draft), and the organism `src/patterns/drafts/DraftsList.tsx`: PageHeader, FilterBar with FilterField (Search) and FilterClear (Clear Filters, only while there is a search; it was a disabled Text Button until 6 Nov 2026), the list table (TableList, two-line cells, RowActionsMenu), Pagination, ModalConfirm, EmptyState (Default and Compact). Plus ToastProvider.

**Flow the stories show:**
- *Save and resume:* a half-done cost is saved to Drafts without checks, and the FormData is checked. The view switches to Drafts with focus on its heading, and "Draft #36742 saved." appears. The new draft is the first row (Single, QA Test, November 2, 2026). Edit reopens New Cost with "Draft #36742" in the page's header, above the form's card, and the values loaded. Saving again updates the row instead of adding one.
- *Resume a recurring draft:* it opens on the Recurring Cost tab with every 1 month.
- *Search and delete:* the search narrows the list or says nothing matched. Clear Filters appears on the bar's far right only while there is a search; it brings the list back and puts focus in the search box. Delete asks "Delete draft?", then "Draft deleted." appears and focus moves to the next •••.
- *No drafts:* an Empty State with Create Cost, which opens a blank New Cost.
- *Delete confirm open* and *Dark.*

**What Figma draws that the stories don't, and why:**
- The User header (Navigation / Header – User): templates add the app shell. The story switches between the two pages itself and moves focus to each page's heading.
- The `?draft_id=` URL: the app routes it.

**Design questions:**
- ~~"Clear Filters" is drawn as a search Filter / Field.~~ It is `Filter / Clear` since 5 Nov 2026, hidden while the search is empty.
- The toast copy isn't drawn.

### U04 · Manage recurring costs (Figma 545:18695)

**What it solves:** where a user reviews, changes or ends a cost that repeats on a schedule. Each due date creates a cost with a Recurring tag.

**Components:** AppHeader (Header – User, Page=Recurring Costs), PageHeader, FilterBar (Filter / Bar, Page=Recurring, since 6 Nov 2026) with FilterField (Search), FilterSelect (the Status filter) and FilterClear (only while filtering), Button, RecurringCostsTable (story-level: `src/patterns/recurring/RecurringCostsTable.tsx`, the library’s Table / Header – Recurring Costs 260:1021, Row – Recurring Cost 260:1000 and Table / Recurring Costs 260:1065), RowActionsMenu, PaymentSchedules + PaymentRow, SideSheet with `EditRecurringCostForm` (story-level: FormSectionHeader, DateField, TextField, SelectField with FormEditLink, Alert, FileUploadField, BreakdownItem), ModalConfirm (Destructive), EmptyState (Compact), ToastProvider/Toast.

**Flow in the stories** (`ManageRecurringCosts.stories.tsx`, full page):
- *Filter and view schedules* (steps 1–3): search by ID, name or email. Clear Filters resets and focuses the search. The Status filter offers All Status, Active and Stopped. A stopped schedule’s menu leaves out Stop. ••• lists Edit, View Schedules, Stop and Delete, with Delete last and red. View Schedules opens Payment Schedules: Done “Processed on Jul 30, 2026” or Upcoming “Scheduled”. Escape closes it and focus returns to the •••.
- *Edit in the side sheet* (step 4): Edit opens “Edit Recurring Cost #1882” with Figma’s four sections. The “This will recur every …” line follows the frequency value and unit. Update validates: an empty applicant name and a broken email show their errors, focus goes to the first, and each error clears as soon as its field is valid. Then Update sends the FormData values, closes the sheet, returns focus to the •••, updates the row and shows the toast “Recurring cost #1882 updated.” (pattern 06’s copy). Cancel closes without saving.
- *Stop and delete* (step 5): both ask first (pattern 04). Stop changes the row to Stopped and keeps only the processed payments. Delete is reachable by keyboard (↑ opens the menu on Delete), and Escape cancels it. Confirming removes the row and moves focus to the next row’s •••. Each ends with a success toast.
- Snapshots: *Payment schedules open*, *Edit side sheet open*, *Dark*, *Edit side sheet — Dark*.
- The table also has its own stories, *Patterns/Recurring costs table*: Default, Sort (Frequency sorts by length in days), Empty and Dark.

**What Figma draws that the stories don’t:** the side sheet’s own URL (`/recurring-costs/{id}`), because Storybook has no router. Where Add New, Breakdowns’ Add new and Currency’s [Edit] lead (Create Cost U02, the breakdown form, Manage Currencies U06); they are plain buttons. The Dividers between sections (545:19054): Divider exists since 2 Nov 2026, but the side sheet's form doesn't use it yet (the form pages and Settings did first, 3 Nov 2026). A Stopped status, which Figma doesn’t draw: a neutral Tag stands in.

**Design questions:** Status Pill vs Tag, and Stopped. The Recurring Costs columns differ between patterns 03/06 and the library row. ~~Starts At is a Text field or a Date field~~ (a Date field in U02 and U04 too since 4 Nov 2026). U04’s form isn’t the same as pattern 06’s.  ~~The “recur every” line has no component~~ (FormHint since 2 Nov 2026). ~~Clear Filters shows by default in Figma.~~ U04's bars set Show Clear off since 5 Nov 2026. The Stop/Delete copy and what Stop does to Upcoming payments aren’t drawn. Payment Schedules doesn’t name its record.

### U06 · Account, settings & currencies (Figma 545:23189)

**What it solves.** What sits behind the account icon in the user header (U06): Manage Currencies (which currencies the Currency dropdown offers), Settings (the account's name and email) and Logout.

**Components.** AppShell (pattern 15), AccountMenu, ModalDialog (Medium, no footer), TableList, TableHeaderRow, TableHeaderCell, TableRow, TableCell (Custom for the Toggle), Toggle, Pagination (no page info), ToastProvider with Toast (Success), PageHeader, PanelCard, FormSectionHeader, TextField and Button. There are two compositions at story level, in `src/patterns/account-settings/`:
- `ManageCurrenciesDialog`: Figma's `_Pattern Content / Manage Currencies`, a table of Currency Name, Code and an Enabled Toggle, seven rows to a page, with Pagination straight under it. It starts on page 1 each time it opens.
- `SettingsPage`: "Settings" as the page's PageHeader, and 24 under it a PanelCard (the Settings Card) with only the form: My Account Details, Email, Name and Save, 20 apart. Save reads the form's FormData and checks it. An empty or badly formed field shows its error and takes focus; otherwise `onSave` gets the details.

**The flow in the stories.**
- *Flow*: Enter on the account icon opens the menu, and Enter opens Manage Currencies. Space on Albanian Lek's switch turns it on at once, and a Toast confirms it. Page 2 shows the next seven currencies. Escape closes the dialog and focus goes back to the icon. Reopened, the dialog is back on page 1 and the change has stuck. Settings opens its page, where no nav link is current. Logout calls `onLogout`.
- *Account menu* (step 1): Manage Currencies, Settings, a divider, then Logout.
- *Manage Currencies* (step 2, open): Figma's seven rows, with only Albanian Lek off. There is no footer. Paging from the keyboard turns ‹ off on the first page and › off on the last, and Tab wraps inside the dialog.
- *Settings* (step 3): an empty Name and a badly formed Email both show errors, and focus goes to the first one. Once fixed, Enter saves (`{ email, name }`), a Toast confirms it and the header greets the new name. The heading and the card share a centred column as wide as Figma's card (`max-w-xl`, 576; Figma 578).
- *Dark*: Manage Currencies, open, in Dark.

**What Figma draws that the stories don't.**
- ~~The Settings Card's surface~~: a PanelCard since 3 Nov 2026 (decision add-card-panel). "Settings" is the PageHeader above it (add-form-heading); the pattern (545:25208) still draws it inside the card, at 115% (662 wide). Fix in Figma: move the title to a Page Header above a Card / Panel, as Layout's example does (765:15978).
- ~~The Enabled column's bare frame: TableCell `type="tag"` stands in.~~ Rebuilt from the generic parts (decision add-table-cell-custom): a TableHeaderRow, TableRows, and the Toggle in a TableCell `type="custom"`. Figma's pattern (545:22175) still draws bare Header Cells (no line, 6px padding) and a frame round the Toggle; the library's example 772:1406 shows the rebuilt row.
- The dialog over the New Cost form, opened from the [Edit] link next to Currency: that is the multi-section form pattern (09 / U02). Here the dialog opens over the Costs page.
- What follows Logout: the sign-in screen isn't in the library.

**Design questions.**
- Manage Currencies has no footer, but its copy says "Close, × or Esc".
- The Settings screen's header is Page=Bulk Upload, and its frame is named "User / Bulk Upload".
- The Settings fields show no required marker. There is also no Figma copy for a badly formed email, or for the two success Toasts.
- The Name differs from the header greeting ("QA test" vs "QA Test").
- Component issue: a Toast raised while a dialog is open lands under the scrim, inert, so it is dimmed, can't be dismissed and isn't announced. ToastProvider's stack should go in a portal above overlays.
- ~~Missing: a Card / Panel component~~ (PanelCard, added on 2 Nov 2026; Settings uses it since 3 Nov 2026), ~~and a Table / Cell that holds a control~~ (TableCell `type="custom"`, 2 Nov 2026).

## Templates

### App shell (Figma: Admin screens 2102:4, User Screens 2102:3)

**What it solves.** Every signed-in screen sits in the same frame: the app's header and one page container under it. The container is each screen's Content frame: 1536 wide at 1920 (192 at the sides), 32 above the page, 24 between its parts. Below 768px the header becomes the Mobile Header, and ☰ opens the Mobile Menu.

**Built from.**
- AppShell (pattern 15): AppHeader, NavLink, Mobile Header and Mobile Menu, ThemeToggle, AccountMenu.
- ToastProvider.
- `TemplateFrame` (`src/templates/TemplateFrame.tsx`): the frame every template renders. It holds the current page and the theme.
- `APP_SCREENS` (`src/templates/screens.tsx`): routes each navigation label (and Settings, from the account menu) to the other templates' screens.

**Stories.**
- **Admin:** Header – Admin over the admin's home, Costs. The page title lines up under the logo. Choosing Cost Centers moves the page and the Active link.
- **User:** Header – User (five links) over the user's Costs. Account → Settings, from the keyboard, opens Settings; no link is Active there.
- **Admin, mobile** (320): Bulk Upload with 16 at the sides and no sideways scroll. ☰ from the keyboard opens the Mobile Menu with Bulk Upload Active; Escape closes it and returns focus to ☰.
- **User, mobile** (320): Create Cost, the longest form, fits the phone.
- **Dark.**

**What Figma draws that the stories don't.**
- The file has no phone frames, so the mobile layout is AppShell's (patterns 15 and U08).
- Partners (2102:6128) has no page composition yet, so the frame shows only its title. Contacts (2102:6234) is pattern 16’s page.
- Routing goes no further than swapping the page in the container.

**Design questions.** ~~The list pages' tables don't fit a phone, which is why the mobile stories open on form pages (see List page).~~ Decided (add-phone-table-layout) and built on 3 Nov 2026: the tables scroll in their own region, so the list pages fit a phone too (the List page template's mobile stories). The mobile stories here still open on form pages.

### List page (Figma: Admin / Costs 2102:5749, User / Costs 2102:1069, Drafts 2102:1342 / 2102:7086, Admin / Contacts 2102:6234)

**What it solves.** The layout of every list, top to bottom, 24 apart:
- the page title, with Tabs beside it where the list has types, and the actions on the right (primary last);
- the filter bar;
- the table;
- pagination at the bottom right.

Cost Centers, Partners, Users and Recurring Costs follow it too.

**Built from.**
- CostsListPage (patterns 01, 02, U01): PageHeader, Tabs, CostsFilterBar, CostsTable, Pagination, MenuTriggerButton (Export). It now takes `as="div"` so it can sit in AppShell's `<main>`.
- DraftsList (U03): FilterField, TableList, Pagination, ModalConfirm.
- ContactsListPage (pattern 16): ContactsFilterBar, TableList, Button (Destructive, Small), Pagination, ModalConfirm, EmptyState.
- Composed in `AdminCostsScreen`, `UserCostsScreen`, `DraftsScreen` and `APP_SCREENS.admin.Contacts` (`src/templates/screens.tsx`).

**Stories.** Each screen has a Light, a Dark and a Mobile (320) story: **Costs** (admin), **My costs** (user), **Drafts** and **Contacts** (admin). Each play checks:
- one banner, one main and one h1, with headings that don't skip a level;
- the parts in order;
- pagination's right edge on the filter bar's;
- a page of eight costs and no selection column;
- for the admin: View Audit Logs and Export, right of the title and tabs. The user has Export only.
- Drafts' columns and the ••• named for the draft; Contacts' columns and a Remove on every row, named for its message.
- the table in its own scroll region and no sideways page scroll: on a phone the region scrolls, is a tab stop and is named like the table; where the table fits it is a plain box.

**Costs, 1024** (a 1024 × 768 viewport; `chromatic.viewports: [1024]`): AppShell's content box is 976, and the Costs table needs a few pixels more (the decision's estimate was 977; 982 in headless Chromium with Inter), so it scrolls by those pixels inside its region and the page doesn't scroll. The other lists fit at 1024.

**What Figma draws that the stories don't.** The rows' menus, bulk selection, expanded details and the audit sheet are patterns 03, 07, 08 and 01's own stories. The template shows the page as it opens.

**Design questions.**
- ~~Tables are wider than a phone: on mobile the page scrolls sideways under a 320-wide header. A mobile table pattern is needed.~~ Decided (add-phone-table-layout) and built on 3 Nov 2026: each table scrolls sideways in its own region (TableList), and the row menus open outside it. Figma still has no phone layout.
- The Costs table at 1024 scrolls by a few pixels in its region (above). Narrowing a column so it fits would be a design change.
- ~~Clear Filters has three treatments~~: one since 6 Nov 2026, `Filter / Clear` (FilterClear), shown only while a filter is in use. The CAF Design screens' Filter / Field stand-ins (2102:6045, 2102:6642) are still to swap.

### Overview list (Figma: Admin / Exports 2102:6902, Admin / Announcements 2102:6628)

**What it solves.** A list with its totals on top. The Card / Stat Row sits between the title and the list and counts the whole collection, not the page.

**Built from.**
- ExportsStatRow, ExportsTable and ExportDetailsDialog (pattern 13).
- AnnouncementsStatRow, AnnouncementsTable and CreateAnnouncementDialog (patterns 11 and 14), plus ChangelogModal for Preview.
- FilterBar (pattern 02), FilterSelect and FilterDateRange, PageHeader, Pagination and EmptyState.
- Composed in `ExportsScreen` and `AnnouncementsScreen`.

**Stories.**
- **Exports**, Light, Dark and Mobile: "Export Management", four totals (Total Exports 6003 while the table shows four rows), Search / status / type filters, the table and pagination, in that order. ••• offers Download (a completed export) and View Details.
- **Announcements**, Light, Dark and Mobile: title and description, three totals, then New Announcement and View Changelog, the filter bar (Search, Filter Date) and the table. New Announcement opens Create Announcement; ••• → Preview shows the release.
- Both check the table in its own scroll region and no sideways page scroll: at 320 the region scrolls and is a tab stop named like the table.

**What Figma draws that the stories don't.**
- Pattern 13's Retry and Delete, and pattern 14's Delete: those flows are the patterns' stories.
- The screen's Exports columns and 601 pages. The template uses pattern 13's table, 4 rows a page.
- View Changelog is a story action (the Changelog page is U07's).

**Design questions.**
- The title: "Export Management" or "Exports"?
- The Exports columns.
- Where the Announcements actions go (row under the stats, or the page header) and their label.
- Whether Filter Date is one date or a range.

### Form page (Figma: User / Create Cost 2102:1154, 2102:1159; Bulk Upload 2102:6027, 2102:1223)

**What it solves.** A page that is one form: the page's PageHeader, then, 24 under it, the form alone in a PanelCard (Card / Panel), centred in the page container at the form cards' width (`max-w-xl`, 576; Figma 578). Its sections run in one column, with a Divider where Figma draws a rule, and its actions at the end.

**Built from.**
- NewCostForm (patterns 09, U02): PageHeader, PanelCard, Divider, FormTabNavigation, TextField, SelectField, DateField, FileUploadField, FormSectionHeader, BreakdownsSection.
- BulkUploadForm (patterns 10, U05): PageHeader, PanelCard, Divider.
- ToastProvider.
- Composed in `CreateCostScreen` and `BulkUploadScreen`. Save, Save to Drafts and Upload hand over the FormData and confirm with a toast.

**Stories.**
- **Create cost, single**, **recurring**, **dark** and **mobile**: the heading above the card, and the card holding only the form (its fill, edge, radius 12 and 32 padding; 24 under the heading); the two Dividers, 24 from their neighbours; the selected tab, the tab panel and the applicant pre-filled from the account; section headings in order (Recurring adds Recurring Details and Cost Details); Save to Drafts then Save at the end, Save being the submit (side by side from 640px, stacked below, each label fitting its button); the heading and card 576 wide and centred, or filling the container on a phone with no sideways scroll (the card keeps its 32 padding there).
- **Bulk upload** (user), **admin**, **dark** and **mobile**: the heading above the card; Payment Method, the CSV upload, the Divider (12 from each side), Download and Upload, in that order, centred.
- **App shell**'s *User* (Settings) and *User, mobile* (Create Cost) check the same card.

**What Figma draws that the stories don't.**
- ~~The card around each form (fill, stroke, radius 12, 32 padding) and its dividers~~: PanelCard and Divider since 3 Nov 2026.
- ~~The Title/md heading inside the card~~: decided (add-form-heading); the PageHeader's h1 (Heading/xl) sits above the card. The screens still draw the heading inside the card: Form / New Cost and Form / Bulk Upload instances (2102:1157, 2102:6030, 2102:1226) and the detached New Cost Form / Recurring (2102:1162).
- Figma's forms place the remote Divider (stroke/stronger or a raw slate) where code has the library's Divider (stroke/subtle); see 09 and 10.
- The card is 576 wide (`max-w-xl`), Figma's 578.

**Design questions.**
- The Bulk Upload toast: "Costs uploaded." (pattern 12) or "{n} costs uploaded." (U05)?
- On a 320 phone the card's 32 padding (inside the page's 16) leaves 224 for the fields, so New Cost's two buttons stack there. Figma draws no narrow form: keep 32, or a smaller padding below 640?

### Overlay flows (Figma: 2102:6074, 2102:5857, 2102:1201, 2102:1266, 2102:1284; pattern 04 523:2612)

**What it solves.** A page with its overlay open. The page stays in place, dimmed and inert, under one of:
- a Modal / Dialog;
- a Modal / Confirm;
- Payment Schedules;
- a Panel / Side Sheet.

**Built from.**
- CostCentresPage with CostCentreDialog and ModalConfirm (patterns 04, 05).
- CostsListPage with AuditLogsDialog (pattern 08). CostsListPage's View Audit Logs now calls `onViewAuditLogs`.
- NewCostForm with CostBreakdownDialog (pattern 09).
- RecurringCostsPage with PaymentSchedules and RecurringCostSheet (patterns 06, U04). It gained `defaultSchedules`.

**Stories.** Each opens with the overlay shown:
- **Add New Cost Center**;
- **Delete cost center** (an alertdialog naming the record);
- **Audit Logs** (the wide dialog with its pagination);
- **Cost Breakdown** (over the Create Cost form);
- **Payment Schedules** (#1882's five payments);
- **Edit Recurring Cost** (the sheet against the right edge, full height);
- **Dark** (the sheet);
- **Mobile** (the dialog keeps 16 from a 320 screen's edges).

Each play checks:
- the page's frame and h1 behind the overlay;
- the page's `<body>` child is inert;
- the overlay is `aria-modal`, named by its title, outside main, within the screen, with focus inside it.

**What Figma draws that the stories don't.**
- Opening, filling and closing each overlay, the toasts and focus return: these are the patterns' stories. The template snapshots the open state.
- Add New Partner and Add New User exist as screens (2102:6175, 2102:6466). Users has a pattern (12); Partners has no composition yet.

**Design questions.**
- Footer verbs: the screens say "Submit" where patterns 05 and 09 say "Save" and "Add".
- ~~The Audit Logs header's refresh icon (ModalDialog has no header action slot).~~ ModalDialog's `actions` (Show Actions) since 6 Nov 2026: Refresh sits beside ×.
- ~~Recurring Costs has two compositions: pattern 06's plain table, and the screens' and U04's filter bar with pagination.~~ Decided (add-plain-list-table): the screens' and U04's layout is canonical. The stories still show both.

## Missing components

What Figma draws that the library has no component for, found while
building the patterns and templates. Each is stood in for with existing
components (or left out) until the library and code have it.

**Page structure**
- ~~**Page Header.**~~ Added on 2 Nov 2026 (`PageHeader`); every pattern and template uses it.
- ~~**Divider**~~ Added on 2 Nov 2026 (`Divider`, plain only; the labelled one stays a Form / Section Header). New Cost and Bulk Upload use it since 3 Nov 2026; U04's side-sheet form (545:19054) doesn't yet.
- ~~**Card / Panel**~~ Added on 2 Nov 2026 (`PanelCard`). The form pages (New Cost, Bulk Upload, Attach invoice) and Settings sit in it since 3 Nov 2026, under the page's PageHeader.
- ~~**Form heading in Title/md-bold**~~ (184:3121, 191:435). Not added (decision add-form-heading): form pages use the PageHeader, above the card.

**Tables**
- ~~**Table header row**~~ Added on 2 Nov 2026 (`TableHeaderRow`, Table / Header Row): every table's header uses it.
- ~~**Table / Breakdown**~~ Not added (decision add-table-breakdown): the expanded Cost row's breakdown (121:2956 with 121:2957) is built from the generic parts; `CostBreakdownTable` is a TableList.
- ~~**Table / Cell for custom content or a control**~~ Added on 2 Nov 2026 (TableCell `type="custom"`, Table / Cell Type=Custom): Account Details, the expand button, Manage Currencies' Toggle and the lists' Empty State rows use it.
- ~~**A plain list table**~~ Added on 2 Nov 2026 (`TableList`, Table / List); it replaces `RecordsTable`, and every plain list (Cost Centers, Recurring Costs, Drafts, Users, Exports, Announcements, Audit Logs) uses it.
- ~~**A table layout for phones**~~ Built on 3 Nov 2026 (decision add-phone-table-layout): every TableList scrolls sideways in its own region (a tab stop named like the table while it can scroll), and RowActionsMenu opens its menu outside it (Popover's new `portal`). Code only: Figma has no mobile list screens (2102:4, 2102:3) and no phone table layout.

**Statuses**
- ~~**Status Pill Approved, Paid and Rejected**~~ and ~~**Inactive / Stopped**~~: added to Status Pill on 2 Nov 2026; the costs, recurring costs and announcements tables use them.

**Filters**
- ~~**Filter / Field – Select**~~ Added on 2 Nov 2026 (`FilterSelect`); every dropdown filter uses it (the two `FilterMenu` stand-ins and U04's inline one are gone).
- ~~**Filter / Field – Date range**~~ Added on 2 Nov 2026 (`FilterDateRange`); the Costs bar and Announcements use it.
- ~~**A single-date Filter / Field**~~ Not needed: a range is right (decision); Announcements' Filter Date is a `FilterDateRange`.
- ~~**A Clear Filters control**~~ Added on 6 Nov 2026 (`FilterClear`, Figma `Filter / Clear` 863:3420, 5 Nov): an Outlined Button with ArrowsClockwise. FilterBar shows it while a filter is in use (`showClear`, Filter / Bar's Show Clear); every bar uses it, Drafts and Recurring Costs included. The CAF Design screens' stand-ins (2102:6045, 2102:6642) are still to swap.
- ~~**A removable active-filter chip**~~ Not added (decision, 2 Nov 2026): Filter / Summary, with a visible count.

**Forms and feedback**
- ~~**Form hint / inline note**~~ Added on 2 Nov 2026 (`FormHint`); U02 and U04's recurrence summary uses it.
- ~~**Alert action**~~ Already there since 2 Nov 2026 (#33: `showAction`, `action`, `onAction`; Figma Show Action). Pattern 11's failed load uses it since 6 Nov 2026, in place of the Button under the Alert.
- ~~**RepeatableField error / helper**~~ Added on 2 Nov 2026 (`helper`, `error`); Create Announcement's Features uses it.
- ~~**Button as a link**~~ Added on 6 Nov 2026 (Button `href`: an `<a href>` with the same look; code only, as Button / Normal's description asks). Pattern 11's "Go back home" (528:6013) uses it.
- ~~**Modal Header actions**~~ Added on 6 Nov 2026 (ModalDialog `actions`, Figma Modal / Dialog's Show Actions, 5 Nov). Audit Logs (pattern 08 and the 2102:5857 template) shows Refresh beside ×. Modal / Header had them since 2 Nov (#33).

**Navigation**
- ~~**Account Menu "Changelog" item**~~ Already there since 2 Nov 2026 (#33: AccountMenu's `changelog`; Figma Item / Changelog 765:15596). U07's guidance says so since 5 Nov.
- ~~**Figma only: Navigation / Mobile Menu – User**~~ Added in Figma on 5 Nov 2026 as `Navigation / Mobile Menu`, Links=User (864:1290). Code's MobileMenu already took the user's links (`links`), so code needed nothing new.
- ~~**A header with no current page**~~ Added in Figma on 5 Nov 2026 (Header – Admin / – User, Page=None) for Settings and the Changelog page. Code: leave AppHeader's `page` out.
