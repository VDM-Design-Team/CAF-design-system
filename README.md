# CAF Design System

CAF's design system, built on **GDL** (the General Design Library), the same
way the CAF Figma library subscribes to the GDL Figma library.

```
@vdm-design-team/caf
├─ tokens/core/color.json         CAF's own ramps: caf-blue, caf-blue-on-dark
├─ tokens/core/typography.json    font.family.sans → Inter (CAF's one override of GDL)
├─ tokens/semantic/color*.json    the 312 semantic colours, Light + Dark
├─ dist/                          theme.css, tokens.css, tokens.dark.css, …
│                                 = GDL's tokens + CAF's, in GDL's output format
└─ src/components/                CAF's React components (Button), on dist/theme.css

from @vdm-design-team/gdl (never copied here)
   palette (slate, green, red, …), spacing, radius, stroke, fonts,
   elevation 1–7, the 47-style type ramp, dark elevation, desktop sizes,
   the semantic colour contract, the build formats, gdl-check-contract
```

What comes from where, and why: [`docs/inheritance.md`](docs/inheritance.md).

## Using it in a CAF app

```css
/* in place of @import "tailwindcss" */
@import "@vdm-design-team/caf/theme.css";
```

Utilities follow the token names: `bg-surface-canvas`, `text-text-primary`,
`bg-action-primary-surface-default`, `border-stroke-default`,
`text-body-md-regular`, `rounded-8`, `shadow-elevation-3`, `bg-caf-blue-500`.
Dark theme: put `.dark` on `<html>`.

The package is published to GitHub Packages (`.npmrc`:
`@vdm-design-team:registry=https://npm.pkg.github.com`, plus a token with
`read:packages`).

## Working on CAF

```bash
npm install            # pulls GDL from its git tag — no token needed
npx playwright install chromium   # once: the browser the story tests run in
npm test               # lint, build, GDL contract, contrast (strict), changelog entry, typecheck, story tests
npm run storybook      # the components on :6006, Light/Dark in the toolbar
npm run storybook:build && npm run test:static   # every story against the production build, as Chromatic runs it
npm run import:figma   # after refreshing figma-export/ — see docs/figma-sync.md
```

- Tokens are generated from the CAF Figma library — never hand-edit `tokens/`.
- Anything GDL has stays in GDL. `lint:tokens` fails on a copied GDL colour
  family or an override that isn't on its allow-list.
- Every PR touching `tokens/`, the build config, the GDL version or a
  component adds a `changes/<branch>.md` entry (see
  [`changes/README.md`](changes/README.md)).
- Rules for people and AI agents: [`CLAUDE.md`](CLAUDE.md).

## Components

Built straight from the CAF Figma library (page by page, no intermediate
export), in React with Tailwind v4 on `dist/theme.css`. Props use Figma's
names. A component that a second brand needs moves up to GDL.

| Component | Figma | Story |
|---|---|---|
| `Button` | Buttons → `Button / Big`, `/ Normal`, `/ Small` | Components/Button |
| `Checkbox` | Selection Controls → `Checkbox` | Components/Checkbox |
| `PaginationItem` | Pagination → `Pagination / Item` | Components/PaginationItem |
| `Pagination` | Pagination → `Pagination` | Components/Pagination |
| `Icon` | Phosphor icons (Regular) the library places | Components/Icon |
| `IconButton` | Buttons → `Button / Icon` | Components/IconButton |
| `TableCell` | Table → `Table / Cell` (replaces `Table / Cell Text`) | Components/TableCell |
| `StatusPill` | Tags → `Status Pill` | Components/StatusPill |
| `Tag` | Tags → `Tag` | Components/Tag |
| `TableHeaderCell` | Table → `Table / Header Cell` | Components/TableHeaderCell |
| `TableRow` | Table → `Table / Row` | Components/TableRow |
| `Popover` | None: code only, with Menus → `Menu / Dropdown`'s surface | Components/Popover |
| `MenuItem` | Menus → `Menu / Item` | Components/MenuItem |
| `MenuDropdown` | Menus → `Menu / Dropdown` | Components/MenuDropdown |
| `RowActionsMenu` | Menus → `Menu / Row Actions Button`, with the Dropdown it opens | Components/RowActionsMenu |
| `TextInput` | Form → `_Text Input` | Components/TextInput |
| `SelectTrigger` | Form → `_Dropdown Input` | Components/SelectTrigger |
| `TableExpandButton` | Table → `Table / Expand Button` | Components/TableExpandButton |
| `TableDetailLabel` | Table → `Table / Detail Label` | Components/TableDetailLabel |
| `TableAccountDetails` | Table → `Table / Account Details` | Components/TableAccountDetails |
| `TabItem` | Tabs → `Tabs / Tab Item` | Components/TabItem |
| `Tabs` | Tabs → `Tabs / Cost Type` (as generic segmented tabs) | Components/Tabs |
| `FormTabNavigation` | Form → `Form / Tab Navigation` | Components/FormTabNavigation |
| `DatePickerDay` | Form → `Date Picker / Day` | Components/DatePickerDay |
| `Calendar` | Form → `Date Picker / Calendar` | Components/Calendar |
| `RangeCalendar` | Form → `Date Picker / Range` | Components/RangeCalendar |
| `FilterField` | Filters → `Filter / Field` | Components/FilterField |
| `MenuTriggerButton` | Buttons → `Button / Menu Trigger` | Components/MenuTriggerButton |
| `SelectOption` | Form → `Select / Option` | Components/SelectOption |
| `SelectMenu` | Form → `Select / Menu` | Components/SelectMenu |
| `Select` | Form → `_Dropdown Input` + `Select / Menu` (composed) | Components/Select |
| `Overlay` | Patterns – Admin → the "Overlay" frame (code only) | Components/Overlay |
| `ModalHeaderIcon` | Modals → `Modal / Header Icon` | Components/ModalHeaderIcon |
| `ModalHeader` | Modals → `Modal / Header` | Components/ModalHeader |
| `ModalDialog` | Modals → `Modal / Dialog` | Components/ModalDialog |
| `ModalConfirm` | Modals → `Modal / Confirm` | Components/ModalConfirm |
| `SideSheet` | Modals → `Panel / Side Sheet` | Components/SideSheet |
| `Alert` | Feedback → `Alert` | Components/Alert |
| `Toast`, `ToastProvider`, `useToast` | Feedback → `Toast` (the host is code only, from pattern 12) | Components/Toast |
| `Tooltip` | Feedback → `Tooltip` | Components/Tooltip |
| `Skeleton` | Feedback → `Skeleton` | Components/Skeleton |
| `SkeletonTableRow` | Feedback → `Skeleton / Table Row` | Components/SkeletonTableRow |
| `Spinner` | Feedback → `Spinner` | Components/Spinner |
| `EmptyState` | Feedback → `Empty State` | Components/EmptyState |
| `FormLabel` | Form → `_Form Label` | Components/FormLabel |
| `FormField`, `FormHelperText`, `useFormField`, `useFormFieldControl` | Form → the part every `Form / Field – *` shares (code only) | Components/FormField |
| `FormEditLink` | Form → `_Edit Link` | Components/FormEditLink |
| `TextField` | Form → `Form / Field – Text` | Components/TextField |
| `SelectField` | Form → `Form / Field – Dropdown`, `Form / Field – Dropdown with Edit` | Components/SelectField |
| `FormSectionHeader` | Form → `Form / Section Header`, `Form / Section Header – Action` | Components/FormSectionHeader |
| `Textarea` | Form → `_Textarea` | Components/Textarea |
| `TextareaField` | Form → `Form / Field – Textarea` | Components/TextareaField |
| `DateInput` | Form → `_Date Input`, opening `Date Picker / Calendar` | Components/DateInput |
| `DateField` | Form → `Form / Field – Date` | Components/DateField |
| `Combobox` | Form → `_Combobox Input` + `Select / Menu` (composed) | Components/Combobox |
| `ComboboxField` | Form → `Form / Field – Combobox` | Components/ComboboxField |
| `Toggle` | Selection Controls → `Toggle` | Components/Toggle |
| `Radio` | Selection Controls → `Radio` | Components/Radio |
| `RadioOption` | Selection Controls → `Radio Option` | Components/RadioOption |
| `RadioGroup` | Selection Controls → `Form / Radio Group` | Components/RadioGroup |
| `CheckboxField` | Selection Controls → `Form / Checkbox Field` | Components/CheckboxField |
| `ToggleField` | Selection Controls → `Form / Toggle Field` | Components/ToggleField |
| `FileUploadZone`, `fileMatchesAccept` | Form → `_File Upload Zone` | Components/FileUploadZone |
| `FileChip`, `formatFileSize` | Form → `File Chip` | Components/FileChip |
| `FileUploadField` | Form → `Form / Field – File Upload`, with pattern 10's File Chips | Components/FileUploadField |
| `RepeatableField` | Form → `Form / Repeatable Field` | Components/RepeatableField |
| `RepeatableFieldRow` | Form → `Form / Repeatable Field Row` | Components/RepeatableField |
| `StatCard` | Cards → `Card / Stat` (with its `_Stat Icon`) | Components/StatCard |
| `StatRow` | Cards → `Card / Stat Row – Exports`, `– Announcements` (as one generic row) | Components/StatRow |
| `DescriptionList`, `DescriptionListItem` | Cards → `Description List`, `Description List / Item` | Components/DescriptionList |
| `FilterSummary` | Filters → `Filter / Summary` (with its `Filter / Summary Line`s) | Components/FilterSummary |
| `BreakdownItem` | Cards → `Card / Breakdown Item` | Components/BreakdownItem |
| `ChangeDiff` | Table → `Table / Change Diff` | Components/ChangeDiff |
| `ChangeDiffRow` | Table → `Table / Change Diff Row` | Components/ChangeDiff |
| `PaymentRow` | Modals → `Modal / Payment Row` (with its `Modal / Status Icon` and `Modal / Status Badge`) | Components/PaymentRow |
| `PaymentSchedules` | Modals → `Modal / Payment Schedules` (Modal / Header + Payment Rows, on Overlay) | Components/PaymentSchedules |
| `VersionBadge` | Modals → `Modal / Version Badge` | Components/VersionBadge |
| `BulletItem` | Modals → `Modal / Bullet Item` | Components/BulletItem |
| `ReleaseNotes` | Modals → `Modal / Release Notes` | Components/ReleaseNotes |
| `ChangelogHeader` | Modals → `Modal / Changelog Header` (with `Modal / Changelog Icon`) | Components/ChangelogHeader |
| `ChangelogEntry` | Cards → `Card / Changelog Entry` | Components/ChangelogEntry |
| `ChangelogModal` | Modals → `Modal / Changelog` | Components/ChangelogModal |

```tsx
// src/components — not in the published package yet (see below)
<Button>Save</Button>                                   // Style=Default, Normal
<Button variant="outlined" size="small">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="tonal" leftIcon={<Plus />}>View Changes</Button>  // Phosphor icon

<label><Checkbox defaultChecked /> Restricted user</label>          // Selected, 16px
<Checkbox aria-label="Select all rows" indeterminate />           // Mixed-State

<Pagination page={page} pageCount={25} onPageChange={setPage} />  // Page 1 of 25  ‹ 1 2 3 4 5 … 25 ›
<Icon name="calendar-blank" size={20} />                          // takes the text colour around it
<IconButton icon="dots-three" label="Row actions" />              // Size=32, Tone=Ghost
<IconButton icon="trash" label="Remove" tone="destructive" size={40} />

<tr>                                                               // TableHeaderCell is a <th scope="col">
  <TableHeaderCell>Payment Method</TableHeaderCell>                 // Sortable=false
  <TableHeaderCell sortable sort="ascending" onSort={sortByAmount}>Amount</TableHeaderCell>
</tr>

<TableRow selected>                                                // TableRow is a <tr>; Selected
  <TableCell type="checkbox"><Checkbox aria-label="Select row" checked onChange={toggle} /></TableCell>
  <TableCell>123456</TableCell>                                    // TableCell is a <td>; Type=Text
  <TableCell type="two-line" primary="Admin Account" secondary="admin1@geekee.com" />
  <TableCell type="list" items={['Reporting', 'Exports']} />       // +1 more
  <TableCell type="tag"><StatusPill>Pending</StatusPill></TableCell>
</TableRow>

<StatusPill status="active">Active</StatusPill>                 // Status=Active
<Tag status="completed">Completed</Tag>                          // tonal, with its icon
<Tag status="error" showIcon={false}>Deleted</Tag>

<MenuDropdown trigger={<Button rightIcon={<Icon name="caret-down" />}>Export</Button>}>
  <MenuItem onClick={downloadCsv}>Download</MenuItem>              // Type=Default; Hover is :hover
  <MenuItem destructive onClick={confirmDelete}>Delete</MenuItem>  // Type=Destructive, last
</MenuDropdown>

<TableCell type="actions">
  <RowActionsMenu label="Actions for cost 123456">                 // ••• → menu below, flush right
    <MenuItem onClick={approve}>Approve</MenuItem>
    <MenuItem onClick={viewInvoices}>View invoices</MenuItem>
    <MenuItem destructive onClick={remove}>Delete</MenuItem>
  </RowActionsMenu>
</TableCell>

<Popover trigger={<Button variant="outlined">Details</Button>} align="right">…</Popover>

<TextInput aria-label="Account name" placeholder="Placeholder" />   // State=Default
<TextInput id="cost-reference" defaultValue="ACME-0042" aria-invalid />  // Error (name it with <label htmlFor>)
<SelectTrigger aria-label="Frequency" />                            // Default: "Select option"
<SelectTrigger aria-label="Frequency" value="Monthly" />            // Filled
<SelectTrigger aria-label="Frequency" open aria-controls="frequency-list" />  // Open

<TableRow>                                                         // an expandable cost row
  <TableCell type="actions">
    <TableExpandButton label="Show details for cost 32430" expanded={open} aria-controls="cost-32430" onClick={toggle} />
  </TableCell>
  <TableCell type="tag">
    <TableAccountDetails categoryTag={<StatusPill>Recurring</StatusPill>}>
      <TableDetailLabel>ID: 32430</TableDetailLabel>                // "Label: Value"
      <TableDetailLabel>Applicant: QA Test Bryan</TableDetailLabel>
    </TableAccountDetails>
  </TableCell>
</TableRow>
<tr id="cost-32430" hidden={!open}>…</tr>                          // the breakdown the caret opens

<Tabs aria-label="Cost type" selected={type} onSelectedChange={setType}>  // Tabs / Cost Type
  <TabItem value="all">All</TabItem>
  <TabItem value="recurring">Recurring</TabItem>
  <TabItem value="single">Single</TabItem>
</Tabs>
<FormTabNavigation aria-label="Cost type" active={kind} onActiveChange={setKind}>  // Form / Tab Navigation
  <TabItem value="single">Single Cost</TabItem>
  <TabItem value="recurring">Recurring Cost</TabItem>
</FormTabNavigation>

<Calendar value={dueDate} onChange={setDueDate} />                // one month, weeks from Monday
<RangeCalendar value={period} onChange={setPeriod} />             // two months; onChange({ start, end })

<FilterField label="Search costs" placeholder="Search costs..." />   // Type=Search; Filled (with ×) once typed
<Popover panelRole="listbox" trigger={<FilterField type="dropdown" label="Status" value="All Status" />}>
  …                                                                // Select's options (List page pattern)
</Popover>
<FilterField type="dropdown" label="Period" placeholder="Select Period" icon="calendar-blank" />

<MenuTriggerButton label="Change Status (3)">                      // Button / Menu Trigger
  <MenuItem>Approve</MenuItem>
  <MenuItem>Mark as Paid</MenuItem>
</MenuTriggerButton>

<Select aria-label="Country" options={['Philippines', 'United States', 'United Kingdom']}
        value={country} onValueChange={setCountry} />               // _Dropdown Input + Select / Menu
<label htmlFor="frequency">Frequency</label>
<Select id="frequency" placeholder="Select option"
        options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} />

<ModalDialog open={open} onClose={close} title="Add New Cost Center" size="medium"   // Size=Medium; renders in a portal
  footer={<><Button variant="text" onClick={close}>Cancel</Button><Button onClick={save}>Save</Button></>}>
  {fields}                                                                     // Content
</ModalDialog>
<ModalConfirm open={open} onClose={close} onConfirm={remove} type="destructive"  // Delete, critical icon
  title="Delete cost center?" message="“Employee Expenses” will be permanently deleted." />
<SideSheet open={open} onClose={close} title="Edit Recurring Cost #1882" footer={actions}>{form}</SideSheet>
<Overlay open={open} onClose={close} aria-labelledby="schedules-title" className="max-w-lg rounded-12 bg-surface-base">
  <ModalHeader title="Payment Schedules" description="Upcoming and processed payments" titleId="schedules-title" onClose={close} />
</Overlay>

<Alert title="Temporary password" message="A temporary password is emailed to the user." />  // Type=Info, Size=Default
<Alert type="error" size="compact" message="This cost was deleted" />                        // one line
<Alert type="warning" title="Unsaved changes" message="Save before you leave." showDismiss onDismiss={onClose} />

<ToastProvider>{app}</ToastProvider>                                                          // once, near the root
const { toast } = useToast();
toast({ type: 'success', message: 'Cost saved.' });                                          // closes after 5 seconds
toast({ type: 'error', message: 'Upload failed.', showAction: true, action: 'Retry', onAction: retry });  // stays

<Tooltip text="Downloads the filtered rows as CSV">           // Placement=Top
  <Button variant="outlined">Export</Button>
</Tooltip>
<Tooltip text="Updated nightly at 02:00" placement="bottom">   // Placement=Bottom
  <IconButton icon="info" label="About sync status" />
</Tooltip>

<Skeleton className="w-32" />                                    // Shape=Line, sized by className
<Skeleton shape="circle" />                                      // 32×32
<table aria-busy="true">                                         // loading: skeleton rows under the real header
  <thead>…</thead>
  <tbody><SkeletonTableRow columns={3} /><SkeletonTableRow columns={3} /></tbody>
</table>
<Spinner size={24} label="Loading export details" />            // role="status"; the label is visually hidden

<EmptyState                                                      // Size=Default
  title="No announcements yet"
  description="Create an announcement to tell users what’s new."
  action={<Button leftIcon={<Plus />}>Add New</Button>}          // Show Action
/>
<td colSpan={4}><EmptyState size="compact" title="No items found" /></td>

<TextField label="Applicant name" name="applicantName" required />   // Form / Field – Text; Required
<TextField label="Location" name="location" placeholder="e.g. Philippines"
           error="Location is required." />                          // State=Error, the message in the Helper
<TextField label="Invoice number" name="invoiceNumber" helper="Optional." />  // Show Helper
<SelectField label="Payment method" name="paymentMethod" options={['Wiretransfer', 'Card', 'Cash']}
             value={method} onValueChange={setMethod} />             // Form / Field – Dropdown
<SelectField label="Currency" name="currency" options={currencies} defaultValue="EUR"
             action={<FormEditLink onClick={editCurrencies} />} />   // Dropdown with Edit: "[Edit] Currency"
<FormField label="Amount" required error={amountError}>              // a control that calls useFormFieldControl
  <AmountInput name="amount" />
</FormField>
<FormField label="Release date">{(control) => <input type="date" {...control} />}</FormField>
<FormSectionHeader title="Beneficiary Information"
  description="Use a permanent address where you can receive mail" />   // Show Description
<FormSectionHeader title="Breakdowns"
  action={<Button size="small" variant="text" leftIcon={<Plus />}>Add new</Button>} />  // – Action

<Textarea aria-label="Notes" placeholder="Add notes…" />            // _Textarea; rows={4} is Figma's 96px
<TextareaField label="Notes" name="notes" defaultValue="Monthly team salary, split by cost center." />
<TextareaField label="Reason" name="reason" required error="Add a reason for the rejection." />
<DateInput aria-label="Starts At" />                                // Default: "Select date"; opens the Calendar
<DateField label="Starts At" name="startsAt" required defaultValue="2026-09-01" />  // submits "2026-09-01"
<DateField label="Ends At" name="endsAt" value={endsAt} onValueChange={setEndsAt} />  // yyyy-mm-dd, or null for none

<Combobox aria-label="Location" placeholder="Select or type a location"
          options={['Philippines', 'United States', 'United Kingdom']}
          value={location} onValueChange={setLocation} />           // _Combobox Input + Select / Menu
<ComboboxField label="Location" name="location" required           // Form / Field – Combobox
               placeholder="Select or type a location"
               options={[{ value: 'PH', label: 'Philippines' }, { value: 'RO', label: 'Romania' }]} />

<ToggleField label="Active" description="Only active announcements are shown to users."
             name="active" defaultChecked />                        // Form / Toggle Field, Checked
<Toggle aria-label="Active" checked={active}
        onChange={(event) => setActive(event.target.checked)} />  // Toggle on its own

<CheckboxField bordered name="restrictedUser" label="Restricted User"
               description="Users with this role can only see their own costs." />  // Bordered

<RadioGroup label="Target Audience" name="audience" required
            options={[{ value: 'all', label: 'All' }, { value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' }]}
            value={audience} onValueChange={setAudience}
            helper="Who should see this announcement." />           // Form / Radio Group
<RadioOption name="audience" value="all" label="All" defaultChecked />  // Radio Option, Selected

<FileUploadField                                                // Form / Field – File Upload
  label="Attach invoice"
  required
  name="invoices"                                                // the files submit with the form
  multiple
  accept=".doc,.docx,.pdf,.png,.jpg,.jpeg"
  hint="DOC, DOCX, PDF, PNG, JPG, JPEG accepted (Max 10.0MB)"
  validate={(file) => (fileMatchesAccept(file, ACCEPT) ? undefined : 'File type not supported. Use DOC, DOCX, PDF, PNG, JPG or JPEG.')}
/>
<FileUploadZone title="Click or drag CSV file to upload" hint="Only CSV files are accepted" accept=".csv" onFilesChange={setFiles} />
<FileChip fileName="invoice-september.pdf" meta="245 KB" onRemove={remove} />               // State=Default, Action=Remove
<FileChip fileName="contract.zip" meta="File type not supported." state="error" onRemove={dismiss} />
<FileChip fileName="receipt-0927.png" meta={formatFileSize(file.size)} action="download" onDownload={download} />

<RepeatableField label="Features" required name="features" addLabel="Add Feature"
  defaultValues={['one', 'two', 'three']} />                     // uncontrolled; submits features=one&features=two&features=three
<RepeatableField label="Features" addLabel="Add Feature" values={features}
  onValuesChange={setFeatures} max={5} />                       // controlled, at most 5 rows

<StatRow>                                                                  // Card / Stat Row – Exports
  <StatCard label="Total Exports" value="5981" icon="file-text" />          // tone="info" (default)
  <StatCard label="Completed" value="5648" icon="check-circle" tone="success" />
  <StatCard label="Processing" value="0" icon="clock" tone="pending" />
  <StatCard label="Failed" value="333" icon="x-circle" tone="critical" />
</StatRow>

<DescriptionList>                                                          // Export Details
  <DescriptionListItem label="Name" value="invoices-12-2026-10-08-053332.zip" />
  <DescriptionListItem label="File Size" value="253 B" />
  <DescriptionListItem label="Status" value={<Tag status="completed">Completed</Tag>} />
</DescriptionList>
<FilterSummary filters={[{ key: 'Search', value: 'All' }, { key: 'Status', value: 'Completed' }]} />  // "Current Filters"

<ul>
  <li>
    <BreakdownItem title="Breakdown 1" meta="Employee Expenses · Salary · Philippines"
                   period="2026-09-01 - 2026-09-30" amount="USD 900"
                   actions={<><MenuItem onClick={edit}>Edit</MenuItem><MenuItem destructive onClick={remove}>Delete</MenuItem></>} />  // Show Actions; ••• named "Actions for Breakdown 1"
  </li>
</ul>

<ChangeDiff aria-label="Changes to cost #32430">                   // Table / Change Diff: Field / Before / After
  <ChangeDiffRow field="Status" before="Unknown" after="Pending" /> // <del> tinted red, <ins> tinted green
</ChangeDiff>

<PaymentRow status="upcoming" date="September 22, 2026" subtitle="Scheduled" />  // Status=Upcoming
<PaymentSchedules open={open} onClose={close}>                      // Modal / Header + rows, in a portal
  <PaymentRow date="September 1, 2026" subtitle="Processed on Sep 1, 2026" />   // Status=Done
  <PaymentRow status="upcoming" date="September 22, 2026" subtitle="Scheduled" />
</PaymentSchedules>

<ChangelogModal open={open} onClose={markSeen} onViewChangeLog={openChangelog}   // Modal / Changelog; Got It, Escape, backdrop → onClose
  title="WELCOME TO THE NEW UPDATE FOR THIS MONTH" date="August 10, 2026" version="v2.5.6">
  <BulletItem>new update for CAF</BulletItem>                                    // What's new in this release:
</ChangelogModal>

<ChangelogEntry title="WELCOME TO THE NEW UPDATE FOR CAF" meta="Version 2.5.6 • August 10, 2026">  // Show New
  <BulletItem>new update for CAF</BulletItem>
  <BulletItem>Improved export performance</BulletItem>
</ChangelogEntry>
<ChangelogEntry title="IMPROVED BULK UPLOAD" meta="Version 2.5.0 • July 2, 2026" showNew={false}>…</ChangelogEntry>

<VersionBadge>v2.5.6</VersionBadge>                                               // Modal / Version Badge
```

- `variant` is Figma's Style: `default`, `outlined`, `text`, `destructive`,
  `tonal`, `success`. `size` is `big`, `normal` or `small`.
- `leftIcon` / `rightIcon` are Show Icons. The icon takes the button's
  colour and Figma's icon size (24 / 20 / 16).
- Hover, Pressed and Disabled are the element's own states.
- `Pagination` takes the current `page` and `pageCount` and calls
  `onPageChange` with the page to show. Its items are `PaginationItem`s
  (Figma's Pagination / Item: `selected`, `disabled`).
- `Icon` draws a Phosphor glyph by name (`caret-down`) at 16, 20, 24, 32 or
  48px. To add one, add its name to `scripts/icons.mjs` and run
  `npm run icons`.
- `IconButton` is Figma's Button / Icon: `size` 32 or 40, `tone` ghost,
  tonal or destructive, and a required `label` (its accessible name).
- `Checkbox` is a native checkbox: `size` is `16` or `20`, and Figma's
  Selected and Mixed-State are `checked` and `indeterminate`. Label it with
  a `<label>` or `aria-label`.
- `TableHeaderCell` is Figma's Header Cell: `sortable` makes the label a
  button that calls `onSort` (the table owns the order), and `sort` is
  `none`, `ascending` or `descending`. A sorted column sets `aria-sort`.
- `Tag` is Figma's tonal Tag: `status` sets the colours and icon
  (`pending`, `active`, `completed`, `error`, `warning`, `info`,
  `neutral`), `showIcon` is Show Icon, and the label is `children`.
- `TableRow` is Figma's generic Row: Hover is `:hover` and Selected is
  `selected`. Put a checked `Checkbox` in a selected row too; that's what
  screen readers announce. On a selected row, cells darken their secondary
  text and links so they pass AA on its tint.
- `StatusPill` is Figma's Status Pill: `status` is `pending` (default) or
  `active`, and the label is `children`. It has no states.
- `MenuDropdown` is Figma's Menu / Dropdown: `trigger` is the control that
  opens it (a `Button` or `IconButton`), and the `MenuItem`s are `children`.
  It is a `role="menu"` named by its trigger. Enter, Space or ↓ opens it on
  the first item and ↑ on the last; ↓ / ↑ move and wrap; Home / End; Enter
  or Space chooses; Escape and Tab close. Focus goes back to the trigger.
- `MenuItem` is Figma's Menu / Item: `destructive` is Type=Destructive and
  Hover is `:hover`. It has no `disabled`: leave out an action the user
  can't take.
- `RowActionsMenu` is the table row's •••: an `IconButton` (`dots-three`)
  that opens a MenuDropdown below it, flush right. `label` names the button
  and the menu ("Row actions" by default; name the record when a table has
  many rows).
- `Popover` is the floating panel the menus, `Select`, `Combobox` and
  `DateInput` are built on. It has Menu / Dropdown's surface
  (`popoverSurface`), opens below or above its trigger (`placement`), flush
  left or right (`align`), and flips when the viewport has no room. A click
  outside, Escape or focus leaving closes it. It has no portal, so a parent
  that clips overflow clips it too.
- `TextInput` is Figma's _Text Input, a native `<input>` that fills its
  container. Default is empty with a `placeholder`, Filled has a value,
  Focus is `:focus`, Error is `aria-invalid` and Disabled is `disabled`.
  Name it with a `<label htmlFor>` or `aria-label`.
- `SelectTrigger` is Figma's _Dropdown Input, the closed select: `value`
  is the chosen option's label (empty shows `placeholder`, default
  "Select option"), and `open` is State=Open (it sets `aria-expanded`;
  pass `aria-controls` with the list's id too). It is a
  `<button role="combobox">`, named by its label, not its text. Select
  opens its list from it.
- `TableExpandButton` is Figma's Expand Button: `expanded` swaps
  CaretDown for CaretUp and sets `aria-expanded`. Point `aria-controls` at
  what it opens. The row owns the state. `label` is required: it's the
  accessible name.
- `TableAccountDetails` is Figma's Account Details: its lines are
  `TableDetailLabel`s (one "Label: Value" line each, the text is
  `children`), and `categoryTag` is the Category Tag below them: a
  `StatusPill`, as in Figma, or a `Tag`. Put it in a `TableCell`.
- `Tabs` is Figma's segmented tabs (Tabs / Cost Type, made generic). Put
  `TabItem`s in it: each has a `value`, and its label is `children`.
  `selected` is Figma's Selected, the selected tab's value
  (`defaultSelected` when uncontrolled). `onSelectedChange` receives the
  tab the user picks. It is a `role="tablist"`, so give it an
  `aria-label`. ← / → / Home / End move between tabs and select them, and
  only the selected tab is in the tab order.
- `FormTabNavigation` is the New Cost form's full-width switch (Form / Tab
  Navigation). It takes the same `TabItem`s and keyboard, with `active` /
  `defaultActive` / `onActiveChange`. The active tab is a raised neutral
  pill, not the blue.
- `Calendar` is Figma's Date Picker / Calendar: one month, with weeks from
  Monday and always six rows. `value` / `onChange` (or `defaultValue`) is
  the chosen day, `month` / `onMonthChange` (or `defaultMonth`) is the
  visible month, and `today` is the day with the ring. The days are one tab
  stop. Arrows, Home / End and Page Up / Page Down (Shift: by year) move
  the focus, and the view follows it.
- `RangeCalendar` is Figma's Date Picker / Range: two months that page
  together. Two picks, in either order, call `onChange({ start, end })`,
  and Escape drops a half-picked range.
- Both are panels only: `DateInput` and the filter bar put them in a
  Popover. Their days are `DatePickerDay`s, Figma's Date Picker / Day:
  `today`, `selected`, `inRange` and `outsideMonth` (inactive).
- `FilterField` is Figma's Filter / Field, one control in a list page's
  filter bar. `type="search"` (the default) is a search box with a clear
  (×) button once it is filled (State=Filled). The button and Escape both
  empty it. `type="dropdown"` is a trigger button: a leading icon, the
  chosen `value` (or a `placeholder`) and a caret. Put it in a Popover with
  a Select or a RangeCalendar. `icon` swaps the leading icon, and `label`
  (required) is the accessible name.
- `MenuTriggerButton` is Figma's Button / Menu Trigger: the primary Button
  with a trailing caret that opens a MenuDropdown, for Export and the bulk
  Change Status (n). `label` is the button's text, the MenuItems are
  `children`, and `disabled` is State=Disabled.
- `Select` is Figma's `_Dropdown Input` opening a `Select / Menu`.
  `options` are strings or `{ value, label }`. `value` / `defaultValue`
  and `onValueChange` hold the choice. `placeholder`, `disabled`,
  `aria-invalid` and the name (`<label htmlFor>` with `id`, `aria-label`
  or `aria-labelledby`) go to the trigger.
- It is the WAI-ARIA select-only combobox. Focus stays on the trigger.
  The arrow keys, Home / End and Page Up / Down move, typing jumps to a
  match, Enter, Space or Alt + ↑ choose, Tab chooses and moves on, and
  Escape closes. Past 256px the list scrolls.
- `SelectMenu` (Select / Menu, a `role="listbox"`) and `SelectOption`
  (Select / Option: `selected` is State=Selected, Hover is `:hover`) are
  its list and rows, for a control that drives its own list.
- `ModalDialog` is Figma's Modal / Dialog. `size` is `small`, `medium` or
  `large`. `title` names the dialog, and `description` / `showDescription`
  are Description and Show Description. `children` is the Content slot,
  `footer` holds the actions, and `showFooter` is Show Footer. The close
  button, Escape and a backdrop click call `onClose`; you set `open`.
- `ModalConfirm` is Modal / Confirm, an `alertdialog`. `type` is `default`
  or `destructive` (critical icon and Destructive button). `title` and
  `message` are Title and Message; `confirmLabel` and `cancelLabel` are the
  button labels. Focus opens on Cancel. Cancel and Escape call `onClose`,
  and the other button calls `onConfirm`.
- `SideSheet` is Panel / Side Sheet: 672 wide and full height on the right.
  It takes `title`, `children`, `footer` and `showFooter`, and closes the
  same way ModalDialog does.
- `Overlay` is the modal layer under all three: the `surface.overlay` scrim,
  the portal, the focus trap, Escape, the inert page, the scroll lock and
  focus return. Use it with `ModalHeader` (icon, title, description, close)
  for modals Figma composes by hand (`PaymentSchedules` is built this
  way). Point `aria-labelledby` at the header's `titleId`.
- `Alert` is Figma's Alert, the inline banner: `type` (`info`, `success`,
  `warning`, `error`) sets the tonal colours and icon, `size` is `default`
  (title over message) or `compact` (one line, the message only), and
  `title`, `message` and `showDismiss` are Title, Message and Show
  Dismiss. The X hides the alert and calls `onDismiss`. Error and Warning
  are `role="alert"`; Info and Success are `role="status"`.
- `Toast` is Figma's Toast: `type`, `message`, `action` (default "Undo")
  with `showAction` and `onAction`, and an X that calls `onDismiss`. Raise
  toasts with `useToast().toast({ … })` under one `ToastProvider`. They
  stack at the bottom right in an `aria-live="polite"` region. Info and
  Success close after 5 seconds; Warning, Error and toasts with an action
  stay until dismissed; hover and focus pause the timer.
- `Tooltip` is Figma's Tooltip. `text` is the hint and `placement` is
  `top` (default) or `bottom`. Wrap one focusable target (`children`): it
  gets `aria-describedby`, and the tooltip has `role="tooltip"`. It opens on
  hover and on keyboard focus, closes on Escape, blur and pointer leave, and
  flips or nudges itself to stay on screen. Keep it to plain text: nothing
  interactive, and nothing the page doesn't also say.
- `Skeleton` is Figma's loading placeholder: `shape` is `line` (default),
  `circle` or `block`. Size it with `className` (`w-32`, `size-10`). Line
  and Block fill their container by default. It pulses, except under
  reduced motion, and is hidden from screen readers. Mark the loading
  region `aria-busy`.
- `SkeletonTableRow` is Figma's Skeleton / Table Row: a TableRow with one
  Skeleton line per column (`columns`, default 5). Stack several in the
  real table's `<tbody>` while it loads. It is as tall as a loaded row.
- `Spinner` is Figma's Spinner: `size` is `16`, `24` or `32`. It is a
  `role="status"` region. `label` (visually hidden, default "Loading")
  says what is loading. It stands still under reduced motion.
- `EmptyState` is Figma's Empty State: `size` is `default` (page level:
  icon tile, `title`, `description` and an optional `action` Button) or
  `compact` (a small icon and the `title`, inside a table body). It
  centres itself in the page or in a `<td colSpan>`.
- `TextField` and `SelectField` are Figma's Form / Field – Text and
  – Dropdown: a `_Form Label` (`label`, `required`) over a TextInput or a
  Select, with the Helper (`helper`) under it. `error` is the control's
  State=Error, with its message in the helper's place. Every other prop,
  and the ref, go to the control, and `name` submits with the form. A
  required TextField is natively `required`; a required SelectField is
  `aria-required`, so check it on submit. `action` puts Dropdown with
  Edit's `FormEditLink` ("[Edit]") beside the label.
- `FormField` is what every field shares, for the fields still to come: the
  label, the control (`children`) and the message. The control picks up the
  label's `id`, the message in `aria-describedby`, `aria-invalid` and
  `required` by calling `useFormFieldControl(props)` (TextInput,
  SelectTrigger and Select do), or from a function child.
- `FormLabel` is `_Form Label`: `required` shows the "*" marker (the control
  announces it). `as="legend"` labels a fieldset.
- `FormSectionHeader` is Form / Section Header (`title`, `description`) and
  – Action (`action`, a small Text Button). The title is an `<h2>`;
  `headingLevel` moves it without changing the look.
- `Select` takes a `name`: the chosen option's `value` is submitted with
  the form.
- `Textarea` is Figma's _Textarea, a native `<textarea>` with TextInput's
  look and states: Default, Filled, Focus (`:focus`), Error
  (`aria-invalid`) and Disabled (`disabled`, at Figma's 50% opacity).
  `rows` sets the height. The default of 4 gives Figma's 96px, and the user
  can drag it taller.
- `DateInput` is Figma's _Date Input: a `<button role="combobox">` with a
  calendar icon. It opens a `Calendar` under it in a Popover. Dates are
  `yyyy-mm-dd` strings: `value` / `defaultValue` / `onValueChange`, the
  text it shows, and what `name` submits (through a hidden input). The date
  is picked, not typed. A click, Enter, Space, ↓ or ↑ open the calendar on
  the chosen day. Enter or a click chooses a day, Escape closes, and focus
  comes back to the field. `placeholder` defaults to "Select date".
  `required` sets `aria-required`; check it on submit.
- `TextareaField` and `DateField` are Figma's Form / Field – Textarea and
  Form / Field – Date: FormField around a Textarea or a DateInput, like
  TextField and SelectField. `label`, `required`, `helper` and `error`
  belong to the field. Every other prop, and the ref, go to the control.
- `Combobox` is the searchable select. Typing filters `options` (strings or
  `{ value, label }`), and Enter or a click chooses. `value` /
  `defaultValue` / `onValueChange` hold the choice (`null` for none), and
  the value is always one of the options. With a `name`, the chosen value is
  submitted with the form. `ComboboxField` puts it under a label, with
  `helper` or `error` under it.
- Every form field's Disabled is Figma's: the whole field at 50% opacity,
  with the value in `text.subtle`.
- `Toggle` is Figma's Toggle, a native `<input type="checkbox" role="switch">`.
  Checked is `checked` / `defaultChecked` and Disabled is `disabled`. Space
  flips it, and while it's on it submits `name` = `value` ("on"). Name it
  with a `<label>`, `aria-labelledby` or `aria-label`.
- `Radio` is Figma's Radio, a native radio. Selected is `checked`, Hover is
  `:hover` and Disabled is `disabled`. Radios that share a `name` form one
  group. `RadioOption` is Radio Option: a `<label>` that puts `label` beside
  the radio. Its other props and the ref go to the radio.
- `RadioGroup` is Form / Radio Group. It takes `label`, `options` (strings or
  `{ value, label, disabled }`), `value` / `onValueChange` (or
  `defaultValue`) and `helper`. Code adds `required` (_Form Label's marker
  plus native `required`), `error` (the message where the Helper goes) and
  `disabled`. It is a `<fieldset role="radiogroup">` of native radios that
  share `name`. The group is one tab stop, the arrow keys move and choose,
  and the chosen `value` is submitted under `name`.
- `CheckboxField` and `ToggleField` are Form / Checkbox Field and Form /
  Toggle Field. Each has a `label` and an optional `description`, placed
  beside a 16px Checkbox (`bordered` adds Figma's card) or before a Toggle
  at the end of the row. The whole field is a `<label>`. The label names the
  control and the description describes it. Every other prop and the ref go
  to the native input, `id` included. `required` also shows _Form Label's
  marker.
- `FileUploadField` is Figma's Form / Field – File Upload, with a File
  Chip for each file under it, as pattern 10 shows. It takes `label`,
  `required`, `helper`, `error`, and `title` and `hint` (the zone's text).
  `files` / `defaultFiles` / `onFilesChange` hold the accepted files. With
  `multiple`, new files are added; without it, a new file replaces the old
  one. `validate(file)` returns why a file is rejected, and the file shows
  as an Error chip and isn't added. × removes a file. The native input
  always holds the files shown, so `name` submits exactly those files.
- `FileUploadZone` is Figma's `_File Upload Zone` on its own. It is a
  native `<input type="file">`, visually hidden but real: Tab, then Enter
  or Space, opens the dialog, and so does a click on the zone. Dropped
  files go into the input. `onFilesChange` gets the files, and every
  other prop goes to the input. Dropped files skip `accept`, so check them
  with `fileMatchesAccept(file, accept)`.
- `FileChip` is Figma's File Chip: `fileName`, `meta` (the size, or the
  rejection reason), `state` (`default` or `error`) and `action`. `remove`
  shows a × named "Remove <file name>" when you pass `onRemove`;
  `download` shows a Tonal Download button that calls `onDownload`.
  `formatFileSize(bytes)` writes "245 KB" or "1.2 MB".
- `RepeatableField` is Figma's Repeatable Field, a `<fieldset>` named by
  `label`. It holds one row per entry of `values` (with `onValuesChange`)
  or `defaultValues`, and an outlined "Add …" button labelled `addLabel`.
  Every row submits `name`, so `formData.getAll(name)` returns the list in
  order. `required` shows the marker, requires every row and keeps one row.
  `min` hides the remove buttons and `max` disables the add button. Adding
  a row focuses it. Removing one focuses the row that takes its place, the
  one before it, or the add button. The ref is the fieldset; `disabled`
  disables everything in it.
- `RepeatableFieldRow` is Figma's Repeatable Field Row: a TextInput (props
  and ref go to the `<input>`) and a destructive trash IconButton
  (`showRemove`, `removeLabel`, `onRemove`).
- `StatCard` is Figma's Card / Stat: a `label`, a `value` and the Status
  Indicator tile, which is `icon` (a Phosphor name) and `tone` (`info`,
  `success`, `pending` or `critical`). Each of Figma's seven `_Stat Icon`
  Types is one icon and one tone (Completed is `check-circle`, `success`).
  The card is an `article` named by its label; the value is not a heading.
- `StatRow` lays out StatCards the way Figma's stat rows do: they share the
  row equally, 16px apart, and wrap when a card would be narrower than
  256px, stacking on a phone. Fragments and components that return several
  cards work. Pass `role="group"` and an `aria-label` to name the row.
- `DescriptionList` and `DescriptionListItem` are Figma's Description List:
  a `dl` in two columns, each item a `label` (`dt`) over a `value` (`dd`,
  any content). Long values wrap.
- `FilterSummary` is Figma's Filter / Summary: a `title` (default "Current
  Filters") over a box of `filters`, one `{ key, value }` line each
  ("Status: Completed"). Pass the filter's name as `key`; the colon is
  added. It is read-only, a group named by its title.
- `BreakdownItem` is one breakdown line of a cost: title, meta, period and
  amount. Give it `actions` (MenuItems) for the ••• menu.
- `ChangeDiff` is a real `<table>` (Field / Before / After) of
  `ChangeDiffRow`s. Old values are `<del>` and new ones `<ins>`, each with
  hidden "Removed:" / "Added:" text, so colour is never the only cue.
- `PaymentRow` is one payment: Done or Upcoming, date and subtitle. Its
  status icon and badge are part of it.
- `PaymentSchedules` is the View Schedules modal: a ModalHeader over a list
  of PaymentRows, on Overlay (focus trap, Escape, focus return).
- `ChangelogModal` is Figma's Modal / Changelog, the what's-new dialog shown
  once after sign-in. It takes `title`, `date` and `version` for its
  ChangelogHeader, `sectionTitle` for its ReleaseNotes, and the notes as
  `BulletItem` children. View Change Log calls `onViewChangeLog`. Got It,
  Escape and a backdrop click call `onClose`: set `open` to false there and
  record that the release was seen. It traps and returns focus the same way
  ModalDialog does. On a phone its two buttons stack.
- `ChangelogEntry` is Card / Changelog Entry, one release on the Changelog
  page. It takes `title` (an `<h2>`; `headingLevel` changes the level
  without changing the look), `meta` ("Version 2.5.6 • August 10, 2026"),
  `showNew` (the Info Tag "New", default true as in Figma; set it on the
  latest release only) and `BulletItem` children. It's an `<article>` named
  by its title.
- `ChangelogHeader` (rocket, title, date, VersionBadge) and `ReleaseNotes`
  (a section title naming a `<ul>` of BulletItems) are the dialog's two
  parts, for building a variant of it on `Overlay`.
- `BulletItem` is Modal / Bullet Item, an `<li>` with a green dot that stays
  on the first line when the text wraps. `VersionBadge` is Modal / Version
  Badge, the `surface.base` pill for "v2.5.6". The tinted version Tag in the
  Announcements table is a `Tag status="info"`.

Each component's stories show every variant × state in Light and Dark,
with Hover and Pressed forced by `storybook-addon-pseudo-states`. Every story
is a Vitest test: it must render, its play function must pass, and axe must
find nothing. One exception: Tonal's label/fill pairs are below AA in Figma.
Their own story reports them in the a11y panel without failing, until the
Figma fix lands. Vitest renders stories differently from the static build
Chromatic snapshots, so `npm run test:static` runs every story again against
`storybook-static/`, as Chromatic does, and fails on the same errors. CI runs
it in 8 parallel jobs, each on one slice (`-- --shard=i/8`); run the whole
of it before opening a component PR.
Components use only token utilities:
`bg-action-primary-surface-default`, `text-label-md-semibold`, `rounded-8`,
`shadow-elevation-2`, and spacing on GDL's scale. `npm run lint:components`
fails on hex, px or arbitrary values. Where code departs from Figma, the
reason is in [`docs/figma-sync.md`](docs/figma-sync.md#components).

Components aren't in the published package yet: there's no JS build
(`tsup`) until an app needs to install them. For now they live in Storybook.
Visual review runs through Chromatic once the CAF project's token is set
(`CHROMATIC_PROJECT_TOKEN`). Until then the Chromatic check passes without
snapshotting.

## Upgrading GDL

A GDL release is CAF's "Library updates available". Bump it in its own PR:

```bash
npm install --save-dev "github:VDM-Design-Team/GDL-design-system#semver:^0.2.0"
npm run import:figma && npm test
```

Read GDL's `CHANGELOG.md` for the versions in between. A `major` GDL release
lists what CAF must change under `Migration:`.

## Releasing

```bash
npm run changelog      # fold changes/ into CHANGELOG.md and bump the version
```

Merge that as the release PR, then create a GitHub release tagged
`v<version>`. The release workflow publishes `@vdm-design-team/caf`.

## Status (v0.1)

- Tokens, plus the first components (`Button`, `Checkbox`, `TableCell`) in Storybook. More
  components follow, built straight from the CAF Figma library onto these
  tokens (shared ones move up into GDL once a second brand needs them).
- Every semantic pair meets WCAG AA in Light and Dark: text and labels
  4.5:1, the focus ring and component borders 3:1. `npm test` runs
  `check:contrast --strict`, so a new failure fails CI. Fix it in Figma.
- No `stroke.field` or `surface.track` yet. GDL recommends both.

## Figma

- CAF Design Library: `WhVkTrQRI9bDTfOeAJXTrR` (components only).
- CAF Design file (screens): `z7L8r4nq6nL6Yfa8vvxJhO`.
- Parent: GDL `1rBM831Vs5ZS4OsRwIPH52`.
