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
| `Icon` | Phosphor icons (Regular) the library places | Components/Icon |
| `IconButton` | Buttons → `Button / Icon` | Components/IconButton |
| `PaginationItem` | Pagination → `Pagination / Item` | Components/PaginationItem |
| `Pagination` | Pagination → `Pagination` | Components/Pagination |
| `TableCell` | Table → `Table / Cell` (replaces `Table / Cell Text`) | Components/TableCell |
| `StatusPill` | Tags → `Status Pill` | Components/StatusPill |
| `Tag` | Tags → `Tag` | Components/Tag |
| `TableHeaderCell` | Table → `Table / Header Cell` | Components/TableHeaderCell |
| `TableRow` | Table → `Table / Row` | Components/TableRow |
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

```tsx
// src/components — not in the published package yet (see below)
<Button>Save</Button>                                   // Style=Default, Normal
<Button variant="outlined" size="small">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="tonal" leftIcon={<Plus />}>View Changes</Button>  // Phosphor icon

<label><Checkbox defaultChecked /> Restricted user</label>          // Selected, 16px
<Checkbox aria-label="Select all rows" indeterminate />           // Mixed-State

<Icon name="calendar-blank" size={20} />                          // takes the text colour around it
<IconButton icon="dots-three" label="Row actions" />              // Size=32, Tone=Ghost
<IconButton icon="trash" label="Remove" tone="destructive" size={40} />
<Pagination page={page} pageCount={25} onPageChange={setPage} />  // Page 1 of 25  ‹ 1 2 3 4 5 … 25 ›

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
```

- `variant` is Figma's Style: `default`, `outlined`, `text`, `destructive`,
  `tonal`, `success`. `size` is `big`, `normal` or `small`.
- `leftIcon` / `rightIcon` are Show Icons. The icon takes the button's
  colour and Figma's icon size (24 / 20 / 16).
- Hover, Pressed and Disabled are the element's own states.
- `Icon` draws a Phosphor glyph by name (`caret-down`) at 16, 20, 24, 32 or
  48px. To add one, add its name to `scripts/icons.mjs` and run
  `npm run icons`.
- `IconButton` is Figma's Button / Icon: `size` 32 or 40, `tone` ghost,
  tonal or destructive, and a required `label` (its accessible name).
- `Pagination` takes the current `page` and `pageCount` and calls
  `onPageChange` with the page to show. Its items are `PaginationItem`s
  (Figma's Pagination / Item: `selected`, `disabled`).
- `Checkbox` is a native checkbox: `size` is `16` or `20`, and Figma's
  Selected and Mixed-State are `checked` and `indeterminate`. Label it with
  a `<label>` or `aria-label`.
- `TableHeaderCell` is Figma's Header Cell: `sortable` makes the label a
  button that calls `onSort` (the table owns the order), and `sort` is
  `none`, `ascending` or `descending`. A sorted column sets `aria-sort`.
- `TableRow` is Figma's generic Row: Hover is `:hover` and Selected is
  `selected`. Put a checked `Checkbox` in a selected row too; that's what
  screen readers announce. On a selected row, cells darken their secondary
  text and links so they pass AA on its tint.
- `Tag` is Figma's tonal Tag: `status` sets the colours and icon
  (`pending`, `active`, `completed`, `error`, `warning`, `info`,
  `neutral`), `showIcon` is Show Icon, and the label is `children`.
- `StatusPill` is Figma's Status Pill: `status` is `pending` (default) or
  `active`, and the label is `children`. It has no states.
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
  for modals Figma composes by hand, like Payment Schedules. Point
  `aria-labelledby` at the header's `titleId`.
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
