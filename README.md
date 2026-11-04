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
| `FilterSelect` | Filters → `Filter / Field – Select` | Components/FilterSelect |
| `FilterDateRange`, `formatDateRange` | Filters → `Filter / Field – Date range` | Components/FilterDateRange |
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
| `FormHint` | Form → `_Form Hint` | Components/FormHint |
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
| `PaymentRow` | Modals → `Modal / Payment Row` (with its `Modal / Status Icon`; the status is a `Tag`) | Components/PaymentRow |
| `PaymentSchedules` | Modals → `Modal / Payment Schedules` (Modal / Header + Payment Rows, on Overlay) | Components/PaymentSchedules |
| `VersionBadge` (deprecated: use `Tag status="info"`) | Modals → `Modal / Version Badge` (deprecated) | Components/VersionBadge |
| `BulletItem` | Modals → `Modal / Bullet Item` | Components/BulletItem |
| `ReleaseNotes` | Modals → `Modal / Release Notes` | Components/ReleaseNotes |
| `ChangelogHeader` | Modals → `Modal / Changelog Header` (with `Modal / Changelog Icon`) | Components/ChangelogHeader |
| `ChangelogEntry` | Cards → `Card / Changelog Entry` | Components/ChangelogEntry |
| `ChangelogModal` | Modals → `Modal / Changelog` | Components/ChangelogModal |
| `Logo` | Navigation → `Navigation / Logo` | Components/Logo |
| `NavLink` | Navigation → `Navigation / Nav Link`, `Navigation / Nav Link – Vertical` (`orientation="vertical"`) | Components/NavLink |
| `NavBar` | Navigation → `Navigation / Nav Bar` (and the ten-link bar Header – Admin draws) | Components/NavBar |
| `UserGreeting` | Navigation → `Navigation / User Greeting` | Components/UserGreeting |
| `ThemeToggle` | Navigation → `Navigation / Theme Toggle` | Components/ThemeToggle |
| `AccountMenu` | Navigation → `Navigation / Account Menu`, with the account icon that opens it | Components/AccountMenu |
| `UserActions` | Navigation → `Navigation / User Actions` | Components/UserActions |
| `TopBar` | Navigation → `Navigation / Top Bar` | Components/TopBar |
| `AppHeader`, `APP_HEADER_ADMIN_PAGES`, `APP_HEADER_USER_PAGES` | Navigation → `Navigation / Header`, `Header – Admin`, `Header – User` (with Mobile Header and Mobile Menu below 768px) | Components/AppHeader |
| `MobileHeader` | Navigation → `Navigation / Mobile Header` | Components/MobileHeader |
| `MobileMenu` | Navigation → `Navigation / Mobile Menu – Admin` (and the user app's links) | Components/MobileMenu |
| `PageHeader` | Layout → `Page Header` | Components/PageHeader |
| `Divider` | Layout → `Divider` | Components/Divider |
| `PanelCard` | Layout → `Card / Panel` | Components/PanelCard |
| `TableHeaderRow` | Table → `Table / Header Row` | Components/TableHeaderRow |
| `TableList` | Table → `Table / List` (its phone scroll region is code only: Figma has no phone layout) | Components/TableList |

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

<TableList aria-label="Cost centers" header={                      // Table / List: a header row over rows
  <TableHeaderRow showActions>                                     // Table / Header Row; also showExpand, showCheckbox
    <TableHeaderCell>Cost center</TableHeaderCell>                 // one per column (Figma's Columns)
    <TableHeaderCell>Location</TableHeaderCell>
  </TableHeaderRow>
}>
  <TableRow>
    <TableCell>Employee Expenses</TableCell>
    <TableCell>Philippines</TableCell>
    <TableCell type="actions"><RowActionsMenu label="Actions for Employee Expenses">…</RowActionsMenu></TableCell>
  </TableRow>
</TableList>                                                       // scrolls in its own region on a phone; menus open outside it
<TableHeaderRow showCheckbox checkboxProps={{ 'aria-label': 'Select all costs', checked: all, indeterminate: some, onChange: toggleAll }}>…</TableHeaderRow>
<TableCell type="custom"><Toggle aria-label="Enable Euro" checked={on} onChange={toggle} /></TableCell>

<StatusPill status="active">Active</StatusPill>                 // Status=Active
<StatusPill status="paid">Paid</StatusPill>                     // Status=Paid (also approved, rejected, stopped, inactive)
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
<MenuDropdown portal trigger={…}>…</MenuDropdown>                  // in a table: the menu opens on <body>, not clipped

<TextInput aria-label="Account name" placeholder="Placeholder" />   // State=Default
<TextInput id="cost-reference" defaultValue="ACME-0042" aria-invalid />  // Error (name it with <label htmlFor>)
<SelectTrigger aria-label="Frequency" />                            // Default: "Select option"
<SelectTrigger aria-label="Frequency" value="Monthly" />            // Filled
<SelectTrigger aria-label="Frequency" open aria-controls="frequency-list" />  // Open

<TableRow>                                                         // an expandable cost row
  <TableCell type="custom">                                        // Type=Custom: any content or control
    <TableExpandButton label="Show details for cost 32430" expanded={open} aria-controls="cost-32430" onClick={toggle} />
  </TableCell>
  <TableCell type="custom">
    <TableAccountDetails categoryTag={<Tag status="info" showIcon={false}>Recurring</Tag>}>  // Figma's default
      <TableDetailLabel label="ID:" value="32430" />               // Label, Value (truncates)
      <TableDetailLabel label="Applicant:" value="QA Test Bryan" />
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
<FilterSelect className="w-64" label="Status" allLabel="All Status"
  options={[{ value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }]}
  value={status} onValueChange={setStatus} />                       // Filter / Field – Select; null is All Status
<FilterDateRange className="w-64" label="Period" placeholder="Select Period"
  value={period} onValueChange={setPeriod} />                       // Filter / Field – Date range; "12–24 Oct" this year

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
  icon="bell"                                                    // Icon swap (default "tray"); Size=Default only
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
<CheckboxField name="terms" required label="I accept the terms"
               error="Select this to continue." />                // State=Error

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
<RepeatableField label="Features" required addLabel="Add Feature" name="features"
  helper="You can add up to 5 features." error={errors.features} />   // Show Helper; State=Error marks the empty rows
<FormHint role="status">This will recur every 3 weeks</FormHint>    // _Form Hint, space.8 under its field

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
  <ChangeDiffRow field="Status" before="Unknown" after="Pending" /> // <del> tinted red and struck, <ins> tinted green
  <ChangeDiffRow field="Amount" after="GBP 2400" />                 // Show Before off (a Created entry): Before stays empty
</ChangeDiff>

<PaymentRow status="upcoming" date="September 22, 2026" subtitle="Scheduled" amount="USD 900" />  // Status=Upcoming; Amount
<PaymentSchedules open={open} onClose={close}>                      // Modal / Header + rows, in a portal
  <PaymentRow date="September 1, 2026" subtitle="Processed on Sep 1, 2026" amount="USD 900" />   // Status=Done
  <PaymentRow status="upcoming" date="September 22, 2026" subtitle="Scheduled" amount="USD 900" />
</PaymentSchedules>

<ChangelogModal open={open} onClose={markSeen} onViewChangeLog={openChangelog}   // Modal / Changelog; Got It, Escape, backdrop → onClose
  title="WELCOME TO THE NEW UPDATE FOR THIS MONTH" date="August 10, 2026" version="v2.5.6">
  <BulletItem>new update for CAF</BulletItem>                                    // What's new in this release:
</ChangelogModal>

<ChangelogEntry title="WELCOME TO THE NEW UPDATE FOR CAF" meta="Version 2.5.6 • August 10, 2026" showNew>  // Show New
  <BulletItem>new update for CAF</BulletItem>
  <BulletItem>Improved export performance</BulletItem>
</ChangelogEntry>
<ChangelogEntry title="IMPROVED BULK UPLOAD" meta="Version 2.5.0 • July 2, 2026">…</ChangelogEntry>  // no New (default)

<Tag status="info" showIcon={false}>v2.5.6</Tag>                                 // a release version (VersionBadge is deprecated)

<Logo />                                                          // 123 × 48, role="img" named "CAF"
<a href="/"><Logo className="h-9" /></a>                          // the Mobile Header's 92 × 36; the link is named "CAF"

<NavBar aria-label="Main">                                       // Navigation / Nav Bar (Header – User, Page=Costs)
  <NavLink href="/costs" active>Costs</NavLink>                  // State=Active: aria-current="page"
  <NavLink href="/costs/new">Create Cost</NavLink>               // State=Default; Hover is :hover
  <NavLink href="/bulk-upload">Bulk Upload</NavLink>
  <NavLink href="/recurring-costs">Recurring Costs</NavLink>
  <NavLink href="/drafts">Drafts</NavLink>
</NavBar>
<NavLink as={RouterLink} to="/drafts" active={page === 'drafts'}>Drafts</NavLink>  // a router's link
<NavLink orientation="vertical" href="/users" active>Users</NavLink>  // Nav Link – Vertical (Mobile Menu)

<UserGreeting username="QA Test" />                               // "Hi, QA Test"
<ThemeToggle theme={theme} onThemeChange={setTheme} />            // Theme=Dark: moon, "Switch to light theme"
<AccountMenu onSelect={openAccountItem} />                        // account icon → Manage Currencies, Settings, —, Logout

<UserActions                                                      // greeting, theme toggle (with tooltip), account menu
  username="QA Test"
  theme={theme}
  onThemeChange={(next) => {                                       // the app switches CAF's theme and remembers it
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }}
  onAccountSelect={openAccountItem}                                // 'manage-currencies' | 'settings' | 'logout'
/>

<AppHeader                                                         // Navigation / Header – Admin, Page=Recurring Costs
  links={APP_HEADER_ADMIN_PAGES.map((label) => ({ label, href: routes[label] }))}
  page="Recurring Costs"
  username="Admin Account"
  theme={theme} onThemeChange={setTheme}                           // controlled: the app switches .dark on <html>
  onAccountSelect={openAccountItem}                                // 'manage-currencies' | 'settings' | 'logout'
  renderLink={({ href, ...props }) => <NavLink {...props} as={RouterLink} to={href} />}  // optional
/>                                                                 // below 768px: Mobile Header, ☰ opens the Mobile Menu
<TopBar username="QA Test" theme={theme} onThemeChange={setTheme} />   // Navigation / Top Bar
<MobileHeader theme={theme} menuOpen={open} onMenuOpenChange={setOpen} menuId="menu" />   // Menu Open=false: ☰
<MobileMenu id="menu" open={open} onClose={() => setOpen(false)} links={links} page="Users"
            username="Admin Account" theme={theme} onThemeChange={setTheme}              // Mobile Menu – Admin
            onAccountSelect={openAccountItem} />                                         // its Account Row opens the Account Menu
```

- `variant` is Figma's Style: `default`, `outlined`, `text`, `destructive`,
  `tonal`, `success`. `size` is `big`, `normal` or `small`.
- `leftIcon` / `rightIcon` are Show Icons. The icon takes the button's
  colour and Figma's icon size (24 / 20 / 16).
- Hover, Pressed, Focus (`:focus-visible`) and Disabled are the element's
  own states.
- `Pagination` takes the current `page` and `pageCount` and calls
  `onPageChange` with the page to show. Its items are `PaginationItem`s
  (Figma's Pagination / Item: `selected`, `disabled`).
- `Icon` draws a Phosphor glyph by name (`caret-down`) at 16, 20, 24, 32 or
  48px. To add one, add its name to `scripts/icons.mjs` and run
  `npm run icons`.
- `IconButton` is Figma's Button / Icon: `size` 32 or 40, `tone` ghost,
  tonal or destructive, and a required `label` (its accessible name).
  Disabled is `disabled`.
- `Checkbox` is a native checkbox: `size` is `16` or `20`, and Figma's
  Selected and Mixed-State are `checked` and `indeterminate`; Disabled and
  Disabled Selected are `disabled`. Label it with a `<label>` or
  `aria-label`.
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
- `TableHeaderRow` is Figma's Header Row, the header over a table of
  TableRows: its TableHeaderCells are `children` (Figma's Columns), and
  `showExpand`, `showCheckbox` (a select-all box; `checkboxProps` go to it)
  and `showActions` add a column per control. Its labels sit 16 in, over the
  cells' text, with a 1px `stroke.subtle` line under the row.
- `TableList` is Figma's Table / List, the plain list table: a
  `TableHeaderRow` (`header`) over `TableRow`s (`children`), with no fill or
  outer border, at its container's width. Name it with `aria-label`. On a
  narrow screen it scrolls sideways in its own region, so the page doesn't:
  while it can scroll, the region is a tab stop (the arrow keys scroll it)
  and a `role="region"` named like the table, with the focus ring; while it
  fits, it is a plain `<div>`. `regionClassName` styles the region;
  `className` and `ref` stay on the `<table>`.
- `TableCell` `type="custom"` is Figma's Table / Cell Type=Custom: any
  content or control (Account Details, a Toggle, the expand button, an
  Empty State across the row) at its own size, with the other types'
  padding.
- `PageHeader` is Figma's Page Header, the top of every list and form page:
  `title` (an `<h1>`), `description`, `tabs` (after a vertical Divider) and
  `actions` (primary last, named for the item: "New Announcement").
- `Divider` is Figma's Divider: a 1px `stroke.subtle` rule, `orientation`
  `horizontal` (default) or `vertical` (1 × 32). Give a purely visual one
  `aria-hidden`.
- `PanelCard` is Figma's Card / Panel: the surface around a form page's form
  and the Settings page's content.
- `StatusPill` is Figma's Status Pill: `status` is `pending` (default),
  `active`, `approved`, `paid`, `rejected`, `stopped` or `inactive`, and the
  label is `children`. It has no states.
- `MenuDropdown` is Figma's Menu / Dropdown: `trigger` is the control that
  opens it (a `Button` or `IconButton`), and the `MenuItem`s are `children`.
  It is a `role="menu"` named by its trigger. Enter, Space or ↓ opens it on
  the first item and ↑ on the last; ↓ / ↑ move and wrap; Home / End; Enter
  or Space chooses; Escape and Tab close. Focus goes back to the trigger.
- `MenuItem` is Figma's Menu / Item: `destructive` is Type=Destructive, and
  Hover and Destructive Hover are `:hover`. The item the keyboard is on
  takes the Hover look too. It has no `disabled`: leave out an action the
  user can't take.
- `RowActionsMenu` is the table row's •••: an `IconButton` (`dots-three`)
  that opens a MenuDropdown below it, flush right. `label` names the button
  and the menu ("Row actions" by default; name the record when a table has
  many rows). The menu opens outside the table (`portal`, on `<body>`), so a
  TableList's scroll region never cuts it off; tests find it with `screen`.
- `Popover` is the floating panel the menus, `Select`, `Combobox` and
  `DateInput` are built on. It has Menu / Dropdown's surface
  (`popoverSurface`), opens below or above its trigger (`placement`), flush
  left or right (`align`), and flips when the viewport has no room. A click
  outside, Escape or focus leaving closes it. By default it has no portal,
  so a parent that clips overflow clips it too. `portal` renders the panel
  on `<body>` instead, fixed at the trigger and following it on scroll, with
  the same ARIA wiring, Escape, outside click and Tab order: use it for a
  trigger in a table or another container that scrolls (pass it to a
  `MenuDropdown` there).
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
- `TableExpandButton` is Figma's Expand Button (Expanded × State):
  `expanded` swaps CaretDown for CaretUp and sets `aria-expanded`; Hover and
  Focus are the button's own. Point `aria-controls` at what it opens. The
  row owns the state. `label` is required: it's the accessible name.
- `TableAccountDetails` is Figma's Account Details: its lines are
  `TableDetailLabel`s (one line each: `label`, with its colon, and `value`,
  which ends in … when the line is too narrow; the whole line as `children`
  still works but is deprecated), and `categoryTag` is the Category Tag
  below them: `<Tag status="info" showIcon={false}>`, as in Figma, or a Tag
  Neutral. Put it in a `TableCell`.
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
  chosen `value` (or a `placeholder`) and a caret: the part FilterSelect and
  FilterDateRange share. `icon` swaps the leading icon, and `label`
  (required) is the accessible name.
- `FilterSelect` is Figma's Filter / Field – Select: a Dropdown filter
  field that opens a Select / Menu as wide as itself, the chosen option
  checked. `allLabel` ("All Status") is the reset item and the value while
  `value` is null; `options`, `value` / `defaultValue` and `onValueChange`
  (null for the reset item) hold the filter. It is Select's listbox (the
  same keys and typeahead), a combobox named by `label`.
- `FilterDateRange` is Figma's Filter / Field – Date range: a Dropdown
  filter field with the calendar icon that opens Date Picker / Range under
  it. `placeholder` shows until a range is picked; then the field shows it
  in the short format (`formatDateRange`): no year when both ends are in
  `today`'s year ("12–24 Oct", "28 Sep – 31 Oct"), the year otherwise
  ("28 Dec 2025 – 3 Jan 2026"). A screen reader hears the full dates. Two
  picks close it, and `onValueChange` gets `{ start, end }`.
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
  focus return. Use it with `ModalHeader` (icon, title, description, optional
  `actions` such as a refresh IconButton, close)
  for modals Figma composes by hand (`PaymentSchedules` is built this
  way). Point `aria-labelledby` at the header's `titleId`.
- `Alert` is Figma's Alert, the inline banner: `type` (`info`, `success`,
  `warning`, `error`) sets the tonal colours and icon, `size` is `default`
  (title over message) or `compact` (one line, the message only), and
  `title`, `message` and `showDismiss` are Title, Message and Show
  Dismiss. The X hides the alert and calls `onDismiss`. `showAction` and
  `action` add a small Text button after the text ("Retry"), which calls
  `onAction`. Error and Warning are `role="alert"`; Info and Success are
  `role="status"`.
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
  icon tile, `title`, `description`, an optional `action` Button and
  `icon`, the tile's glyph, default `tray`) or `compact` (a fixed small
  Tray and the `title`, inside a table body). It centres itself in the page
  or in a `<td colSpan>`.
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
- `FormHint` is `_Form Hint`: an inline note under a field ("This will
  recur every 3 weeks"), an Info glyph (`icon` swaps it) and one line of
  Caption in `text.subtle` (`children`). Put it space.8 under its field;
  pass `role="status"` when it follows what the user types.
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
  Checked is `checked` / `defaultChecked` and Disabled is `disabled` (its
  own disabled colours, not opacity). Space flips it, and while it's on it
  submits `name` = `value` ("on"). Name it with a `<label>`,
  `aria-labelledby` or `aria-label`.
- `Radio` is Figma's Radio, a native radio. Selected is `checked`, Hover is
  `:hover`, Error is `aria-invalid` and Disabled is `disabled`. Radios that
  share a `name` form one group. `RadioOption` is Radio Option: a `<label>`
  that puts `label` beside the radio. Its other props (`aria-invalid` for
  Error=true) and the ref go to the radio.
- `RadioGroup` is Form / Radio Group. It takes `label`, `options` (strings or
  `{ value, label, disabled }`), `value` / `onValueChange` (or
  `defaultValue`), `helper`, `required` (_Form Label's marker plus native
  `required`) and `error` (State=Error: the message where the Helper goes,
  and every radio `aria-invalid`). Code adds `disabled`. It is a `<fieldset role="radiogroup">` of native radios that
  share `name`. The group is one tab stop, the arrow keys move and choose,
  and the chosen `value` is submitted under `name`.
- `CheckboxField` and `ToggleField` are Form / Checkbox Field and Form /
  Toggle Field. Each has a `label` and an optional `description`, placed
  beside a 16px Checkbox (`bordered` adds Figma's card) or before a Toggle
  at the end of the row. The whole field is a `<label>`. The label names the
  control and the description describes it. Every other prop and the ref go
  to the native input, `id` included. `required` also shows the Required
  marker. `error` is State=Error: the message under the description and
  the control `aria-invalid` (CheckboxField's box, or its card, turns
  critical). `disabled` is State=Disabled: the control's disabled look
  and the text in `text.disabled`.
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
  `min` hides the remove buttons and `max` disables the add button.
  `helper` is Show Helper: guidance under the rows. `error` is State=Error:
  the message in the critical colour in the helper's place, and the empty
  rows (or the rows in `invalidRows`) marked `aria-invalid`. Adding
  a row focuses it. Removing one focuses the row that takes its place, the
  one before it, or the add button. The ref is the fieldset; `disabled`
  disables everything in it.
- `RepeatableFieldRow` is Figma's Repeatable Field Row: a TextInput (props
  and ref go to the `<input>`) and a destructive trash IconButton
  (`showRemove`, `removeLabel`, `onRemove`).
- `StatCard` is Figma's Card / Stat: a `label`, a `value` and the Status
  Indicator tile, Figma's `_Stat Icon` Tone × Icon: `tone` (`info`,
  `success`, `pending` or `critical`) and `icon` (a Phosphor name;
  Completed is `check-circle`, `success`). The card is an `article` named
  by its label, with a decorative `stroke.subtle` edge; the value is not a
  heading.
- `StatRow` lays out StatCards the way Figma's stat rows do: they share the
  row equally, 16px apart, and wrap when a card would be narrower than
  256px, stacking on a phone. Fragments and components that return several
  cards work. Pass `role="group"` and an `aria-label` to name the row.
- `DescriptionList` and `DescriptionListItem` are Figma's Description List:
  a `dl` in two columns, each item a `label` (`dt`) over a `value` (`dd`,
  any content). Long values wrap.
- `FilterSummary` is Figma's Filter / Summary: a `title` (default "Current
  Filters") over a box of `filters`, one `{ key, value }` line each
  ("Status: Completed"), with a decorative `stroke.subtle` edge. Pass the
  filter's name as `key`; the colon is added. It is read-only, a group
  named by its title.
- `BreakdownItem` is one breakdown line of a cost: title, meta, period and
  amount. Give it `actions` (MenuItems) for the ••• menu.
- `ChangeDiff` is a real `<table>` (Field / Before / After) of
  `ChangeDiffRow`s. Old values are `<del>`, struck through, and new ones
  `<ins>`, each with hidden "Removed:" / "Added:" text, so colour is never
  the only cue. Leave `before` out for a Created entry (Figma's Show Before
  off): its Before cell stays empty.
- `PaymentRow` is one payment: Done or Upcoming, date, subtitle and
  `amount` ("USD 900"). Its status icon is part of it; the status is a
  `Tag` (Completed "Done" or Warning "Upcoming", no icon).
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
  `showNew` (the Info Tag "New", default false as in Figma; set it on the
  latest release only) and `BulletItem` children. It's an `<article>` named
  by its title.
- `ChangelogHeader` (rocket, title, date, the version as Tag Info) and `ReleaseNotes`
  (a section title naming a `<ul>` of BulletItems) are the dialog's two
  parts, for building a variant of it on `Overlay`.
- `BulletItem` is Modal / Bullet Item, an `<li>` with a green dot that stays
  on the first line when the text wraps. A release version ("v2.5.6") is a
  `Tag status="info" showIcon={false}`, in the dialog and the Announcements
  table. `VersionBadge` (Modal / Version Badge) is deprecated.
- `Logo` is Figma's Navigation / Logo, an `<svg role="img">` named "CAF".
  The mark is CAF's brand ramp (`caf-blue` 600 / 300 / 400) in both
  themes, and the wordmark is `text/primary`. It is 48 high; set another
  height with `className` (`h-9` in the Mobile Header) and the width
  follows. Pass `aria-hidden` when its container is already named.
- `NavLink` is Figma's Nav Link (`orientation="horizontal"`, default) and
  Nav Link – Vertical (`orientation="vertical"`, a full-width Mobile Menu
  row). `active` is State=Active, the current page
  (`aria-current="page"`). Hover is `:hover`. It is an `<a href>`; pass a
  router's link component as `as`.
- `NavBar` is Figma's Nav Bar, the row of NavLinks under the Top Bar: a
  `<nav>` with a list, each child in its own `<li>`. `aria-label` is
  required, so every `<nav>` on a page has its own name. The headers' Page
  property is the one `active` NavLink.
- `UserGreeting` is Figma's Navigation / User Greeting: "Hi, {username}"
  in Body/sm-regular, `text.secondary`, on one line. `username` is the
  name alone.
- `ThemeToggle` is Figma's Navigation / Theme Toggle. `theme` is the theme
  in use: `dark` shows the moon, `light` the sun. It is controlled. A
  click calls `onThemeChange` with the other theme, and the app switches
  it (the `.dark` class on `<html>`) and remembers it. The toggle never
  changes the document. Its name says what a click does ("Switch to light
  theme"); pass `aria-label` to translate it.
- `AccountMenu` is Figma's Navigation / Account Menu. Its trigger is the
  header's account icon, an `IconButton` named "Account", and the menu
  opens below it, flush right: Manage Currencies, Settings, Changelog, a
  divider, Logout. `onSelect` gets `manage-currencies`, `settings`,
  `changelog` (open the what's-new dialog) or `logout`.
  `trigger` replaces the icon. The keyboard works as in `MenuDropdown`.
- `UserActions` is Figma's Navigation / User Actions, the right end of the
  top bar: the greeting, the theme toggle (with a tooltip) and the account
  menu, with no gap. It takes `username`, `theme`, `onThemeChange` and
  `onAccountSelect`. Put it in the header's `<header>`.
- `AppHeader` is the header every signed-in page shares: Figma's
  Navigation / Header, Header – Admin and Header – User. It is a
  `<header>` banner with TopBar over NavBar, in a centred container (1536
  at 1920, as Figma). `links` is the navigation (label and `href`, in
  order). `APP_HEADER_ADMIN_PAGES` and `APP_HEADER_USER_PAGES` are Figma's
  labels. `page` is Figma's Page, the current link. Links are `<a href>`;
  `renderLink` swaps in a router's link through NavLink's `as`. Below
  768px (`md:`) the MobileHeader shows instead, and its ☰ opens the
  MobileMenu with the same links. `menuOpen` / `defaultMenuOpen` /
  `onMenuOpenChange` hold the menu state. The theme is controlled
  (`theme`, `onThemeChange`): the app switches `.dark` on `<html>`.
- `TopBar` is Navigation / Top Bar: the Logo on the left, UserActions
  (greeting, theme toggle, account menu) on the right.
- `MobileHeader` is Navigation / Mobile Header: the Logo, the theme
  toggle, the account menu and the menu button. `menuOpen` is Menu Open
  (☰ "Open menu" or ✕ "Close menu"). The button has `aria-expanded`, and
  `aria-controls` from `menuId`, and reports the state it asks for in
  `onMenuOpenChange`.
- `MobileMenu` is Navigation / Mobile Menu – Admin: a full-width modal
  dialog ("Menu") against the top of the screen. It holds the Mobile
  Header with ✕, the links as vertical NavLinks (`links`, `page`) and the
  Account Row (`username`). Focus opens on ✕ and is trapped. ✕, Escape, a
  tap on the scrim or a chosen link call `onClose`; you set `open`, and
  focus goes back to ☰. The user app passes its five links.

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

## Patterns and templates

The components put together, as Storybook stories with shared sample data
(`src/patterns/fixtures.ts`). Every Figma section, what each story shows,
the design questions and the missing components are in
[`docs/patterns.md`](docs/patterns.md).

- **Patterns** (`src/patterns/`, Storybook `Patterns/…`): Figma's
  Patterns – Admin 01–15 and Patterns – User U01–U08, each solving one task
  and played through with the mouse and the keyboard, with a Dark story.
  - Lists: List page, My costs list, Search & filter, Row actions menu,
    Bulk selection & actions, Expand for details & change history.
  - Overlays and forms: Confirm destructive actions, Create or edit in a
    modal, Edit in a side sheet, Multi-section form (Form / New Cost), File
    upload & attachments (Form / Bulk Upload), Save and resume drafts,
    Manage recurring costs.
  - Feedback and data: Loading, empty & error states, Feedback messages,
    Overview & record details, Announcements & what’s new.
  - The app: App shell & navigation, Account, settings & currencies.
- **Story-level organisms**: the Costs table, the Costs filter bar, the
  page header, the Recurring Costs table, Form / New Cost, Form / Bulk
  Upload, the Stat Rows and the page compositions live under
  `src/patterns/` (COMPONENT-PLAN decision 4). They are not DS components
  and not exported from the package.
- **Templates** (`src/templates/`, Storybook `Templates/…`): the screens'
  page layouts, built from the patterns, in Light, Dark and at 320 wide.
  App shell (Admin and User headers over one page container), List page
  (Admin Costs, My costs, Drafts), Overview list (Export Management,
  Announcements), Form page (Create Cost, Bulk Upload) and Overlay flows (a
  page with a dialog, confirm, Payment Schedules or side sheet open).

The Storybook sidebar reads Components, then Patterns, then Templates.

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
- Field and control borders use `stroke.field`, and toggle tracks `surface.track`
  (GDL's recommended names), so both reach 3:1.

## Figma

- CAF Design Library: `WhVkTrQRI9bDTfOeAJXTrR` (components only).
- CAF Design file (screens): `z7L8r4nq6nL6Yfa8vvxJhO`.
- Parent: GDL `1rBM831Vs5ZS4OsRwIPH52`.
