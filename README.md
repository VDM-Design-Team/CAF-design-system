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
- `Popover` is the floating panel the menus and `Select` are built on (a
  Date field will reuse it). It has Menu / Dropdown's surface
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
- Both are panels only: a Date field or a filter will put them in a
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

Each component's stories show every variant × state in Light and Dark,
with Hover and Pressed forced by `storybook-addon-pseudo-states`. Every story
is a Vitest test: it must render, its play function must pass, and axe must
find nothing. One exception: Tonal's label/fill pairs are below AA in Figma.
Their own story reports them in the a11y panel without failing, until the
Figma fix lands. Vitest renders stories differently from the static build
Chromatic snapshots, so `npm run test:static` runs every story again against
`storybook-static/`, as Chromatic does, and fails on the same errors. CI runs
it after building Storybook; run it before opening a component PR.
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
