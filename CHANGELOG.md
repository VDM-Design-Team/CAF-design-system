# Changelog

## 0.7.0 — 2026-11-02

### Toasts above dialogs, the mobile menu's focus, and Popover's `surface` (November 2026)

**A toast raised while a dialog is open** now shows above the dialog's scrim
and is announced. Before, the stack sat in the page under the scrim, and the
dialog made it inert, so a screen reader heard nothing (saving a draft in a
ModalDialog, deleting from a SideSheet). `ToastProvider` now renders its stack
on `<body>`, in the browser's top layer, and `Overlay` leaves live regions out
when it makes the page inert. Toast buttons stay outside the dialog's focus
trap: a pointer reaches them at once, the keyboard after the dialog closes.
Stories that look the stack up should use `screen`, not the story canvas.

**AppHeader's mobile menu** returns focus to ☰ when it closes, also when it
was open from the first render (`defaultMenuOpen`). Before, focus fell to the
page.

**Popover has a `surface` prop** (default `true`). `surface={false}` drops
Menu / Dropdown's fill, stroke, radius, elevation and padding, for content
that draws its own: DateInput's Calendar uses it, instead of overriding the
panel's classes. Nothing looks different.

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

## 0.6.0 — 2026-11-02

### Tooltip and Popover fixes: Escape in a dialog, and position after layout changes (November 2026)

**Escape on a tooltip inside a dialog** now closes only the tooltip. Before,
it also closed the dialog (ModalDialog, ModalConfirm, SideSheet, MobileMenu or
any Overlay): the dialog's key listener ran first. The next Escape closes the
dialog, as before. Nothing looks different.

**Tooltip and Popover follow layout changes.** They re-measured only on resize
and scroll, so if the page moved under an open tooltip or menu (content loading
above it, a font loading), the tooltip's arrow could point a few pixels off its
target, and a menu could open on the side that no longer has room. They now
also re-measure when the target, the panel or the page changes size. Nothing
looks different when nothing moves.

### Components: app shell and navigation (October 2026)

Eleven components from the CAF Figma library's **Navigation** page: the
header every signed-in CAF screen shares, on desktop and below 768px, and
the parts it is built from. Every colour is the one the Figma layer is
bound to. They follow the page's theme, Light or Dark (Figma pins the
headers and the mobile section to Dark).

**`AppHeader`** is `Navigation / Header`, `Header – Admin` (ten links) and
`Header – User` (five links), from patterns 15 and U08. The Top Bar sits
over the Nav Bar. In Dark the bands are `surface/neutral/base` and
`surface/base`; in Light both are white. The links are data: `links`
(label and `href`) and `page`, the current one. `APP_HEADER_ADMIN_PAGES`
and `APP_HEADER_USER_PAGES` give Figma's labels, and `renderLink` takes a
router's link. Below 768px the Mobile Header replaces it, and ☰ opens the
Mobile Menu.

**`TopBar`** is `Navigation / Top Bar`: the CAF logo on the left; "Hi,
{name}", the theme toggle and the account menu on the right.

**`NavBar`** is `Navigation / Nav Bar`, the row of links under the Top
Bar: a `<nav>` landmark with a list of NavLinks. It takes the user app's
five links or the admin app's ten. `aria-label` is required.

**`NavLink`** is one navigation link. `orientation="horizontal"` (the
default) is `Navigation / Nav Link`, the header's Body/sm links;
`orientation="vertical"` is `Navigation / Nav Link – Vertical`, the Mobile
Menu's full-width Body/md rows. `active` is State=Active, the current page,
and sets `aria-current="page"`. Hover is `:hover`. It is an `<a href>`, and
`as` takes a router's link component.

**`Logo`** is `Navigation / Logo`, an inline `<svg role="img">` named
"CAF", 48px high by default; set `h-9` for the Mobile Header's 36px. The
wordmark is `text/primary`, so it follows the theme. The mark keeps CAF's
brand colours in both themes: Figma's raw logo colours map to the nearest
`caf-blue` steps (600, 300, 400).

**`UserActions`** is `Navigation / User Actions`, the right end of the top
bar: "Hi, {username}", the theme toggle (with a tooltip) and the account
icon, which opens the account menu. It takes `username`, `theme`,
`onThemeChange` and `onAccountSelect`.

**`UserGreeting`** is `Navigation / User Greeting`, the "Hi, {name}" in
the top bar.

**`ThemeToggle`** is `Navigation / Theme Toggle`. `theme` is the theme in
use: Dark shows the moon and Light the sun. It is controlled: a click calls
`onThemeChange` with the other theme, and the app switches CAF's theme
(`.dark` on `<html>`) and remembers it. Its accessible name says what a
click does ("Switch to light theme").

**`AccountMenu`** is `Navigation / Account Menu`, behind the account icon:
Manage Currencies, Settings, a divider, Logout. It opens below the icon,
flush right, with the menu button keyboard pattern. `onSelect` gets the
item chosen.

**`MobileHeader`** is `Navigation / Mobile Header`: the logo, the theme
toggle, the account menu and ☰, which turns into ✕ when the menu is open
(`menuOpen`).

**`MobileMenu`** is `Navigation / Mobile Menu – Admin`, and with the
user's links it is also the user app's menu. It is a full-width panel at
the top of the screen: the header with ✕, the links as vertical rows with
the current page highlighted, and the signed-in account at the bottom. It
opens as a modal: focus moves to ✕ and stays inside, and the page behind
dims and stops scrolling. ✕, Escape, a tap outside or choosing a link
closes it, and focus goes back to ☰.

Every label passes AA in Light and Dark. Where code differs from Figma
(details in `docs/figma-sync.md`):
- **Height:** links are 36px (Figma 33), vertical rows 40px (Figma 39),
  and the bar is 52px (Figma 49), because GDL's line heights are taller.
  The vertical rows' raw 10px padding becomes `space/8`.
- **Focus and hover:** every link and header icon gets Button's
  `stroke/focused` focus ring, and the header icons get IconButton Ghost's
  hover fill. Figma has neither.
- **Header icons:** the theme and account icons are both `text/primary`.
  Figma's User Actions shows a second account icon where its description
  puts the theme toggle; code shows the theme toggle.
- **Theme:** the Admin and User headers, which Figma pins to Dark, follow
  the page's theme.

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

## 0.5.0 — 2026-10-30

### Components: form fields and controls (October 2026)

Twenty-three components from the CAF Figma library's **Form** and
**Selection Controls** pages: every CAF form field, the controls inside
them, and the layer they are all built on. Every colour is the one the
Figma layer is bound to. They follow the page's theme, Light or Dark (Figma
pins some of these library sections to Dark).

**`TextField`** is Figma's `Form / Field – Text`: a label over a
`TextInput`, with a helper under it. `label` and `required` are the
label's, `helper` is Show Helper, and `error` shows the message in the
helper's place and marks the input `aria-invalid`. Every other prop goes to
the native `<input>`, so `name`, `type`, `value` and `onChange` work as
usual and the field submits with its form. `required` shows Figma's red "*"
and makes the input natively `required`.

**`SelectField`** is Figma's `Form / Field – Dropdown`: the same label,
helper and error around a `Select`. With `name`, the chosen option's value
is submitted with the form. `required` sets `aria-required`; a form checks
it in its submit handler. Figma's `Form / Field – Dropdown with Edit`
(Currency) is `action={<FormEditLink onClick={…} />}`.

**`FormEditLink`** is Figma's `_Edit Link`: the "[Edit]" button beside a
field's label. Inside a field it reads "[Edit] Currency".

**`FormLabel`** is Figma's `_Form Label`: Body/sm in `text.secondary`, and
`required` adds the "*" marker.

**`FormField`** is the part every field shares. A control inside it picks
up the label, the message, the error and `required` with
`useFormFieldControl`. Every field below is built on it.

**`FormSectionHeader`** is Figma's `Form / Section Header` (title and an
optional description) and `Form / Section Header – Action` (with an "Add
new" button at the end). The title is a heading.

**`Textarea`** is `_Textarea`: a native `<textarea>` with TextInput's look
and states (Default, Filled, Focus, Error, Disabled). `rows` (4 by default)
gives Figma's 96px height, and the user can drag it taller.
**`TextareaField`** is `Form / Field – Textarea`: a label, the textarea,
and the helper or error message under it. With a `name`, it submits with
the form, line breaks included.

**`DateInput`** is `_Date Input`: a field with a calendar icon that opens
the Calendar under it. The date shows, is stored and is submitted (with a
`name`) as `yyyy-mm-dd`, the format the CAF screens use. You pick it from
the calendar with the mouse or the keyboard: Enter, Space or ↓ open the
calendar; the arrows and Page Up / Page Down move; Enter chooses; Escape
closes. Focus comes back to the field. **`DateField`** is
`Form / Field – Date`: a label, the date input, and the helper or error
message under it.

**`Combobox`** is the searchable select (`_Combobox Input`): a text input
with a search icon and a caret that opens Select's list. Typing filters the
options (any label that contains the text) and puts the keys on the first
match. ↓ / ↑ move, Enter or a click chooses, and Escape closes the list and
then clears the input. "No results" shows, and is announced, when nothing
matches. The value is always one of the `options` (strings or
`{ value, label }`), held in `value` / `defaultValue` / `onValueChange`
(`null` for none). With a `name`, the chosen value is submitted with the
form, and the browser checks `required`. **`ComboboxField`** is
`Form / Field – Combobox` (Location, in the Cost Breakdown and
multi-section forms): FormField around a Combobox.

**`ToggleField`** is `Form / Toggle Field` ("Active" in Create
Announcement): a `label` and an optional `description`, with the switch at
the end of the row. **`Toggle`** is the switch on its own: a native
`<input type="checkbox" role="switch">` with `checked` and `disabled`. It
submits like a checkbox.

**`CheckboxField`** is `Form / Checkbox Field` ("Restricted User" in Add
New User): a `label` and an optional `description` beside a Checkbox.
`bordered` wraps it in a card whose stroke turns `stroke.focused` while it
is checked.

**`RadioGroup`**, **`RadioOption`** and **`Radio`** are `Form / Radio
Group` ("Target Audience" in Create Announcement), `Radio Option` and
`Radio`. RadioGroup takes `options`, `value` / `defaultValue` /
`onValueChange`, `name`, `helper`, `required`, `error` and `disabled`. Its
radios are native, so the arrow keys move between them and the chosen
value is submitted with the form.

**`FileUploadField`** is `Form / Field – File Upload`, used for Attach
invoice and Bulk Upload's Upload CSV File. Choose or drop files and each
one shows as a chip with its size and a remove button. `validate` returns
why a file is rejected, and the file then shows as a red chip that says
why and isn't added. `files` / `defaultFiles` / `onFilesChange` hold the
files. With `name`, the form submits exactly the files shown.

**`FileUploadZone`** is `_File Upload Zone`, the dashed drop target on its
own (`title`, `hint`, `onFilesChange`). It is a native file input you can
reach by click, keyboard or drag. `fileMatchesAccept(file, accept)` checks
dropped files against `accept`.

**`FileChip`** is `File Chip`: one file's name (cut short with an
ellipsis), its `meta` (the size, or why it was rejected), `state`
(`default` or `error`) and `action`. `remove` uses `onRemove`; `download`
shows a Tonal Download button that calls `onDownload`, as in the Invoices
dialog. `formatFileSize(bytes)` writes sizes the way Figma does.

**`RepeatableField`** is `Form / Repeatable Field`, built with its row,
`Form / Repeatable Field Row` (**`RepeatableFieldRow`**). It is the
"Features" list in the Create Announcement modal: a labelled fieldset of
text rows, each with a destructive trash button, followed by an outlined
"Add …" button (`addLabel`). Every row submits `name`, so
`formData.getAll(name)` returns the list in order. `min` hides the remove
buttons, `max` disables the add button, and `required` requires every row
and keeps one.

**Changes to existing components** (no API is removed or renamed):
`TextInput`, `SelectTrigger` and `Select` pick up a `FormField`'s label,
message, error and `required`; outside one they behave as before. `Select`
takes a `name` (before, it landed on the trigger button, which a form never
submits), and `SelectTrigger` takes `required` (as `aria-required`). A
disabled `TextInput` or `SelectTrigger` (and so a disabled `Select`) is now
at 50% opacity, as Figma draws every form field's Disabled; before, it
looked like Default apart from its text colour.

As Figma binds them today, some of these are open design questions: a
field's error message is in `text.subtle` (only the border turns red) and
sits right under the control; the unchecked Toggle's track (1.18:1 on the
page in Light, 2.36:1 in Dark) and the Radio's resting stroke in Light
(2.45:1) are below WCAG's 3:1 for control boundaries.

### Components: menus, inputs, select, tabs, date picker and filters (October 2026)

Twenty components, built straight from the CAF Figma library (pages
**Menus**, **Form**, **Table**, **Tabs**, **Filters** and **Buttons**).
Every colour is the one the Figma layer is bound to, except where Figma's
binding fails contrast (listed below). Several of these are pinned to Dark
in Figma; in code they all follow the page's theme, Light or Dark.

**`Popover`** is the floating panel that the menus and `Select` are built
on, with Menu / Dropdown's surface. It opens below or above its trigger,
flush left or right, and flips when the viewport has no room. A click
outside, Escape or focus leaving closes it. It is code only (Figma has no
Popover) and has no portal, so a parent that clips overflow clips it too.
A panel can be named by its own `aria-labelledby` in `panelProps`.

**`MenuDropdown`** is Figma's `Menu / Dropdown`, a menu that any trigger
opens (Export, the bulk Change Status). `trigger` is the control, and the
`MenuItem`s are `children`. Enter, Space or ↓ opens it on the first item,
and ↑ on the last. ↓ / ↑ move and wrap, Home / End go to the ends, Enter or
Space chooses, and Escape and Tab close it. Focus goes back to the trigger.

**`MenuItem`** is Figma's `Menu / Item`: `destructive` is Type=Destructive
(the red label), and Hover is `:hover`.

**`RowActionsMenu`** is the ••• at the end of every table row and the menu
it opens (`Menu / Row Actions Button`). The button is an `IconButton`
(`dots-three`, Ghost, 32), and the menu opens below it, flush right. `label`
names both: "Row actions" by default; name the record when a table has
many rows.

**`MenuTriggerButton`** is the primary button with a trailing caret that
opens a menu (`Button / Menu Trigger`), for Export and the bulk "Change
Status (n)". It is `Button` (Default, Normal) with a MenuDropdown. The
caret takes the label's colour in every state.

**`TextInput`** is the single-line field (`_Text Input`), a native
`<input>` that fills its container. Default is empty with a `placeholder`,
Filled has a value, Focus is `:focus` (a 2px `stroke.focused` stroke),
Error is `aria-invalid` and Disabled is `disabled`. Name it with a
`<label htmlFor>` or `aria-label`.

**`SelectTrigger`** is the closed select (`_Dropdown Input`): the chosen
option or a placeholder (default "Select option"), and a caret. `open` is
State=Open and sets `aria-expanded`. It is a
`<button role="combobox" aria-haspopup="listbox">`, named by its label.
Its caret is `text.subtle`, as the library's other inputs bind it.

**`Select`** is the form and filter select: SelectTrigger opening a
`Select / Menu` of `Select / Option`s under it. `options` are strings or
`{ value, label }`, and `value` / `defaultValue` and `onValueChange` hold
the choice. `placeholder`, `disabled`, `aria-invalid` and the name go to
the trigger, and the list takes the same name. The list is at least as
wide as the field, flips above near the bottom of the screen and scrolls
past 256px. It is the WAI-ARIA select-only combobox: focus stays on the
field, ↓ / ↑, Home / End and Page Up / Down move, typing jumps to a match,
Enter, Space or Alt + ↑ choose, Tab chooses and moves on, and Escape
closes.

**`SelectMenu`** and **`SelectOption`** are its list (`Select / Menu`, a
listbox) and rows (`Select / Option`: `selected` shows the fill and the
check, Hover is `:hover`), for a control that drives its own list.

**`TextInput`, `SelectTrigger` and `Select`** are 40px high, with the
field's 1px `stroke.subtle` border. That border is below 3:1 in both
themes, as Figma has it; it's with the designer.

**`Tabs`** is the segmented tab list (`Tabs / Cost Type`, made generic):
the Costs list's All / Recurring / Single is one use of it. Its tabs are
`TabItem`s, each with a `value`. `selected` / `defaultSelected` /
`onSelectedChange` hold the choice. It is a `role="tablist"`: ← / → move
between tabs and select them, Home / End go to the ends, and only the
selected tab is in the tab order.

**`TabItem`** is one tab (`Tabs / Tab Item`), a `<button role="tab">`.
The selected tab's label is `action/primary/content/default` on the blue.

**`FormTabNavigation`** is the full-width Single Cost / Recurring Cost
switch at the top of the New Cost form (`Form / Tab Navigation`). It takes
the same TabItems and keyboard, with `active` / `defaultActive` /
`onActiveChange`. The active tab is a raised neutral pill, not the blue.

**`Calendar`** is the date picker's panel for one date
(`Date Picker / Calendar`): one month, weeks from Monday, always six rows.
`value` / `onChange` (or `defaultValue`) is the chosen day, at local
midnight, and `month` / `onMonthChange` (or `defaultMonth`) is the visible
month, paged with ‹ / ›. `today` gets the ring. The days are one tab stop:
the arrows move by day and week, Home / End to the week's ends, and
Page Up / Page Down by month (Shift: by year). It's an ARIA grid labelled
by the month.

**`RangeCalendar`** is the period picker (`Date Picker / Range`), as in
the Select Period and Creation Date filters. Its two months page together.
Two picks, in either order, call `onChange({ start, end })`, and Escape
drops a half-picked range.

**`DatePickerDay`** is one day (`Date Picker / Day`): `today`, `selected`,
`inRange` and `outsideMonth` (inactive). Calendar and RangeCalendar are
panels only, for a Date field or a filter to put in a Popover. Dates use
plain `Date` maths, with no new dependency.

**`FilterField`** is the filter bar's control (`Filter / Field`).
`type="search"` is a search box: once something is typed, a clear (×)
button empties it, and so does Escape. `type="dropdown"` is a trigger
button with a leading icon, the chosen value and a caret, which opens a
Select or a RangeCalendar in a Popover. `label` (required) is its name.
The icons use `text/subtle` instead of Figma's raw grey, so they reach
3:1 in Light.

**`TableExpandButton`** is the 28×28 caret button that opens a cost row
(`Table / Expand Button`). `expanded` swaps CaretDown for CaretUp and sets
`aria-expanded`; point `aria-controls` at what it opens. `label` is
required.

**`TableDetailLabel`** is one "Label: Value" line (`Table / Detail
Label`), and **`TableAccountDetails`** is the cost row's Account column
(`Table / Account Details`): TableDetailLabel lines with `categoryTag`
12px below them, a `StatusPill` as in Figma or a `Tag`. The category pill
keeps Status Pill's own label colour: Figma's override to `text.primary`
failed contrast on the orange (3.90 Light, 2.80 Dark).

Every new control has Button's 2px `stroke.focused` focus ring (Figma
draws no Focus states).

Changed in the CAF Figma library first (needs publishing):
- **SelectTrigger's caret** (`_Dropdown Input`) was a raw light grey,
  1.26:1 on the Light field. It's now `text.subtle`, as the other inputs
  bind it.
- **The selected tab's label** (`Tabs / Tab Item`) now uses
  `action/primary/content/default`. It was `text/primary`, which failed
  contrast on the blue in both themes (2.96 / 3.85; now 6.81 / 4.77).
- **Menu Trigger's caret** now follows the label
  (`action/primary/content/*`). It was a primitive from outside CAF's
  libraries, near-white beside the dark label in Dark.
- **Filter / Field's icons** were a raw grey, 2.52:1 on a Light field.
  They're now `text/subtle`, in the component and in the Costs filter bar.
- **The Category Tag** in Account Details now has Status Pill's own label
  colour, and **the expanded cost row's caret** is `text/primary` instead
  of a brand primitive.
- Raw radius, padding and gap values on Menu / Item, Menu / Dropdown, the
  inputs, the tabs, the date picker, Select / Option and Select / Menu are
  bound to GDL's radius and space variables. Nothing looks different.

### Components: modals, side sheet, alerts, toasts, tooltip, loading and empty states (October 2026)

CAF's overlays and feedback states, built straight from the CAF Figma
library (pages **Modals** and **Feedback**). The modals cover the
Patterns – Admin flows 04 Confirm destructive actions, 05 Create or edit
in a modal and 06 Edit in a side sheet.

**`ModalDialog`** is `Modal / Dialog`, used by Add Cost Center, Add
Partner, Add User, Create Announcement, Cost Breakdown and Audit Logs.
`size` is `small`, `medium` or `large`. It takes a `title`, an optional
`description` (`showDescription`), the content as `children`, and the
footer's buttons as `footer` (`showFooter`).

**`ModalConfirm`** is `Modal / Confirm`, used for Approve, Reject, Stop and
Delete. `type` is `default` (info icon, Default button) or `destructive`
(critical icon, Destructive button). It takes a `title`, a `message`,
`confirmLabel`, `cancelLabel` and `onConfirm`. Focus opens on Cancel, and a
backdrop click doesn't close it.

**`SideSheet`** is `Panel / Side Sheet`, the 672px right-hand sheet for
edit flows such as Edit Recurring Cost. It takes a `title`, `children` and
a `footer`.

**`ModalHeader`** and **`ModalHeaderIcon`** are `Modal / Header` and its
icon tile, for modals Figma composes by hand (Payment Schedules).

**`Overlay`** is the modal layer under all of them: the `surface.overlay`
scrim over the page, centred or against the right edge. Every modal
renders in a portal, moves focus in and traps it, closes on Escape and its
close button (and on a backdrop click, except ModalConfirm), makes the
page behind inert and stops it scrolling, and returns focus to whatever
opened it.

**`Alert`** is the inline banner (`Alert`), for notes that stay on screen,
like Add New User's temporary password and Audit Logs' "This cost was
deleted". `type` is `info` (default), `success`, `warning` or `error`;
`size` is `default` (title over message) or `compact` (one line).
`showDismiss` adds an X that hides it and calls `onDismiss`. Error and
Warning are announced as alerts; Info and Success as status.

**`Toast`** is the notification after Save, Upload or Export (`Toast`):
`type`, `message`, an optional action (`action`, `showAction`, `onAction`)
and an X. **`ToastProvider`** and **`useToast()`** raise them. They stack
at the bottom right in a polite live region. Info and Success close after
5 seconds; Warning, Error and any toast with an action stay until
dismissed. Hover or focus pauses the timer.

**`Tooltip`** is the short hint with an arrow (`Tooltip`). `text` is the
hint and `placement` is `top` (default) or `bottom`. In Light it's a
slate-700 bubble with white text; in Dark a slate-200 bubble with
near-black text. It opens on hover and on keyboard focus, closes on
Escape, blur and pointer leave, describes its target
(`aria-describedby`), and flips or nudges itself to stay on screen.

**`Skeleton`** is the loading placeholder (`Skeleton`): `shape` is `line`,
`circle` or `block`, sized with `className`. It pulses, except under
`prefers-reduced-motion`, and is hidden from screen readers.

**`SkeletonTableRow`** is a table row's loading state
(`Skeleton / Table Row`): one Skeleton line per column (`columns`,
default 5). It is as tall as a loaded row, so nothing jumps when the data
arrives.

**`Spinner`** is the loading indicator (`Spinner`): `size` 16, 24 or 32,
a `neutral/tonal` track and an `action/primary` indicator. It is a
`role="status"` region with a visually hidden `label`, and stands still
under reduced motion.

**`EmptyState`** is what a list or page shows when it has nothing to show
(`Empty State`): `size` `default` (icon tile, `title`, `description` and an
optional `action` Button) or `compact` (a small icon and the title, inside
a table body).

Every colour is the one the Figma layer is bound to, in Light and Dark,
and every text passes AA. There are no new icons, and nothing existing
changes.

Where code differs from Figma (details in `docs/figma-sync.md`):
- **Widths:** the dialogs' 400 / 560 / 800 and 420 aren't on a GDL scale.
  Code caps them at 384 / 576 / 768 and 448. The side sheet is exactly
  672.
- **Close buttons** on the modals, the toast and the alert are an
  `IconButton` (Ghost, 32×32, 16px ×) with a hover fill and focus ring.
- **The modal header icon's glyph** uses `accent.info.tonal.content.default`.
  Figma's raw blue failed 3:1 on the tile.
- **Radii and padding** are on GDL's scales: the toast's raw 10 radius is
  `radius/8`, the compact alert's raw 10 padding is `space/12`, and the
  tooltip's raw 10 side padding is `space/8`.

## 0.4.0 — 2026-10-29

### Components: Pagination and PaginationItem (October 2026)

**`Pagination`** is the table pagination bar, built straight from the CAF
Figma library (page **Pagination**): "Page 1 of 25", the ‹ / › arrows, the
page numbers and a … gap.
- `page` and `pageCount` set the items. `onPageChange` is called with the
  page to show.
- `pageInfo` is Figma's Page Info (default "Page {page} of {pageCount}").
  `showPageInfo` is Show Page Info (default true).
- Up to 7 pages show them all. Longer tables show the first and last
  pages and a window around the current one, as Figma's 1 2 3 4 5 … 25.
- It is a `<nav>`. The current page has `aria-current="page"`, and ‹ / ›
  are disabled at the ends.

**`PaginationItem`** is one page number or arrow (Figma's
`Pagination / Item`): `selected` is State=Selected, and `disabled` is
State=Disabled.

Changed in the CAF Figma library first (needs publishing):
- **The selected page's number** now uses `action/primary/content/default`.
  It was `text/primary`, which failed contrast on the blue in both themes
  (2.96 / 3.85; now 6.81 / 4.77).
- **Disabled** now uses `text/disabled`, so ‹ on the first page reads as
  unavailable.

### Components: Tag (October 2026)

`Tag` is the tonal status tag, built straight from the CAF Figma library
(page **Tags**, `Tag`): Completed and Failed on Exports, Deleted and
Updated in Costs' change history, versions on Announcements.
- `status` is Figma's Status: `pending` (default), `active`, `completed`,
  `error`, `warning`, `info` or `neutral`. It sets the tonal colours and
  the icon.
- `showIcon` is Figma's Show Icon (default true).
- The label is `children`, because the screens use their own words.

Every colour is the one the Figma layer is bound to, and every label
passes AA in Light and Dark. TableCell's Status + Date cell now takes a
`Tag`. The icon set gains `lightning`, for Active.

Where code differs from Figma (details in `docs/figma-sync.md`):
- **Active's icon** is Phosphor's lightning; Figma's Bolt is a Heroicons
  glyph. **Pending's clock** is Phosphor's filled glyph, not Figma's 1px
  outline.
- **Height:** 26px (Figma 25), on GDL's line height.

### Components: Icon and IconButton (October 2026)

**`Icon`** draws the Phosphor icons (MIT) the CAF Figma library uses, at
Regular weight: 39 glyphs, by Phosphor's name (`caret-down`,
`dots-three`, `calendar-blank` …), at 16, 20, 24, 32 or 48px. It takes the
text colour around it, so it follows Light and Dark. To add a glyph, add
its name to `scripts/icons.mjs` and run `npm run icons`.

**`IconButton`** is the icon-only button, built straight from the CAF
Figma library (page **Buttons**, `Button / Icon`), for refresh, close,
theme, trash and the table row's •••.
- `size` is Figma's Size: `32` (16px glyph, default) or `40` (20px).
- `tone` is Figma's Tone: `ghost` (default), `tonal` or `destructive`.
  Hover is `:hover`.
- `label` is required: it's the button's accessible name.

Every colour is the one the Figma layer is bound to, and every glyph
passes contrast in Light and Dark. Code adds a `stroke.focused` focus
ring, as on Button.

**TableHeaderCell's** sort arrows now come from `Icon`. Nothing looks
different.

### Components: TableRow, and darker text in selected rows (October 2026)

`TableRow` is the generic table body row, built straight from the CAF
Figma library (page **Table**, `Table / Row`). It is a `<tr>` of
TableCells.
- Figma's State: Default; Hover is `:hover` (a `surface.base` fill);
  Selected is `selected` (`action.primary.surface.default` at 16%).
- Put a checked `Checkbox` in a selected row, as in Figma: it's what
  screen readers announce, because a table row can't carry
  `aria-selected`.

**TableCell, on a selected row:** secondary text (the second line, the
date) uses `text.secondary` instead of `text.subtle`, and the list's
"+N more" link uses `text.link.selected` instead of `text.link.default`.
On the Selected tint in Light, `text.subtle` was 3.6–3.7 and the link
3.8–3.9, below AA. They're now 7.8–8.1 and 5.1–5.4. Dark already passed
and still does. Nothing changes outside selected rows.

### Components: TableHeaderCell (October 2026)

`TableHeaderCell` is the column header of CAF's tables, built straight
from the CAF Figma library (page **Table**, `Table / Header Cell`). It is
a `<th scope="col">`, so screen readers announce every body cell with its
column.
- The label is `children`.
- `sortable` is Figma's Sortable. The label and arrows become a button
  that calls `onSort`; the table decides the order.
- `sort` is Figma's Sort: `none` (default), `ascending` or `descending`. A
  sorted column shows ArrowUp or ArrowDown, darkens its label and sets
  `aria-sort`.

Every colour is the one the Figma layer is bound to, and every label and
arrow passes contrast in Light and Dark. Where code differs from Figma
(details in `docs/figma-sync.md`):
- **Focus ring:** the sort button gets a `stroke.focused` outline, as on
  Button. Figma has no Hover or Focus state for it.
- **Height:** 32px with or without arrows (Figma: 29 without), on GDL's
  line height. Labels are about 2px wider, from GDL's letter spacing.
- **`sortable` is off by default,** because a sortable header needs an
  `onSort` handler. Figma's default variant is sortable.

### Components: StatusPill (October 2026)

`StatusPill` is the filled status pill of the Costs and Recurring Costs
tables, built straight from the CAF Figma library (page **Tags**,
`Status Pill`).
- `status` is Figma's Status: `pending` (default, orange) or `active`
  (CAF blue, as on the Default button).
- The label is `children`: "Pending", "Recurring", "Active" on the CAF
  screens.

It goes in a `TableCell` of `type="tag"`, which shows it in TableCell's
stories instead of the old stand-in. Every colour is the one the Figma
layer is bound to, and every label passes AA in Light and Dark.

Where code differs from Figma (details in `docs/figma-sync.md`):
- **Padding and radius** use GDL's `space/12` and `radius/full`, as Tag
  does, where Figma has raw 10px and 9999. The pill is 24px tall (Figma 23)
  and a few pixels wider.
- **Dark:** Figma pins Pending to Light, so it never turns Dark. In code
  both statuses follow the theme; in Dark, Pending is orange-500 with a
  near-black label.

## 0.3.0 — 2026-10-22

### Components: TableCell (October 2026)

`TableCell` is the generic table body cell, built straight from the CAF
Figma library (page **Table**, `Table / Cell`). It is a `<td>`, so tables
built from it keep real row and column semantics for screen readers.
- `type` is Figma's Type: `text` (default, the old Cell Text), `two-line`,
  `tag`, `checkbox`, `actions`, `list` and `status-date`.
- Value is `children`. Primary, Secondary and Date are `primary`,
  `secondary` and `date`.
- `list` shows the first item and "+N more", and expands to a bulleted list
  with "Show less". It's a real toggle button, with `aria-expanded`.
- Type=Checkbox takes the CAF `Checkbox`. Tag, Actions and Status + Date
  take Status Pill, the row actions button and Tag as `children`, until
  those are built.

Every text style and colour is the one the Figma layer is bound to, in
Light and Dark. Where code differs from Figma (details in
`docs/figma-sync.md`):
- **Vertical padding** is 12px, not Figma's raw 14px, so a Text cell is
  44px (Figma 45).
- **Line heights** are GDL's, so multi-line cells run a little taller.

## 0.2.0 — 2026-10-22

### Components: Checkbox (October 2026)

`Checkbox` is built straight from the CAF Figma library (page **Selection
Controls**, `Checkbox`). It is a real `<input type="checkbox">`, so forms,
labels, the keyboard and screen readers work as usual, including "mixed".
Its API uses Figma's own names:
- `size` is `16` (default) or `20`.
- The States are the checkbox's own: Deselected is unchecked, Selected is
  `checked`, Mixed-State is `indeterminate`, and Hover is hovering an
  unchecked box.

Every colour is the semantic token the Figma layer is bound to, in Light and
Dark. The check and the mixed bar are Figma's own vectors.

Where the code differs from Figma (details in `docs/figma-sync.md`):
- **Focus ring:** a `stroke.focused` outline, as on Button. Figma has no
  Focus state yet.
- **Disabled:** Figma has no Disabled state, so a disabled checkbox only
  changes its cursor.

The unchecked border is 1.48:1 in Light and 1.93:1 in Dark, below the 3:1
WCAG asks of a control's boundary. That's a Figma binding, and
`docs/figma-sync.md` has the suggested fix.

Checkbox is the first piece of Table selection: the CAF screens use it 65
times, in table headers and selectable rows.

### Component borders meet WCAG 1.4.11, Light and Dark (October 2026)

The contrast report now checks borders as well as text. Every
`….border.<state>` must reach 3:1 against `surface.canvas`, `surface.base`
and its own fill when that fill is opaque. Disabled and deselected states
are exempt. The 15 failing pairs came from 7 Figma variables. Each now
aliases another step of the same ramp in the CAF Figma library: 5 in Light,
2 in Dark. No names change.

- **Light, outline buttons and badges.** Default borders are one step
  darker: neutral is slate-500, success green-600 and pending orange-600.
  Each now matches its hover border, and the hover and pressed fills still
  change. Warning's default and hover borders are yellow-700, the same as
  pressed. That makes them clearly visible on white.
- **Dark, info outline.** The default border is blue-500, the same as hover.
- **Dark, selected secondary buttons.** The border is caf-blue-on-dark-600,
  the same as hover. The old border was dark navy and nearly vanished on
  the fill. This matches Light, where selected and hover share CAF-blue-600.

## 0.1.0 — 2026-10-21

### Components: Button, and the component layer (October 2026)

CAF gets its first component, `Button`, built straight from the CAF Figma
library (page **Buttons**: `Button / Big`, `Button / Normal`,
`Button / Small`). Its API uses Figma's own names:
- `variant` is the Style: `default`, `outlined`, `text`, `destructive`,
  `tonal`, `success`.
- `size` is `big`, `normal` or `small`.
- `leftIcon` and `rightIcon` are Show Icons.
- Hover, Pressed and Disabled are the button's own states.

Every colour is the semantic token the Figma layer is bound to, in Light and
Dark. Spacing, radius, type and elevation come from GDL.

Where the code differs from Figma (details in `docs/figma-sync.md`):
- **Heights** are fixed at 48 / 36 / 32px. Figma's heights follow Inter's
  auto line height, so they come out at 46–48 / 35–36 / 33px.
- **Icon gap** is 8px. Figma's Big and Normal use a raw 10px, which isn't on
  GDL's space scale.
- **Hover shadow** is `shadow.elevation.2`, the closest GDL elevation to
  Figma's raw hover shadow.
- **Focus ring** is a `stroke.focused` outline. Figma has no Focus state yet.

The component layer comes with it:
- React and Tailwind v4 via `cn()`, which knows GDL's type ramp, radius and
  elevation names.
- Storybook 10 on `dist/theme.css`, with a Light/Dark toolbar (`.dark` on
  `<html>`).
- Story tests with axe in Vitest, plus `lint:components` (no hex, px or
  arbitrary values; spacing on GDL's scale) and a typecheck, all in
  `npm test`.

Components aren't in the published package yet. They're Storybook-only until
the JS build is wired up.

### Every semantic pair meets WCAG AA, Light and Dark (October 2026)

The 37 pairs the contrast report flagged now pass. Each fix moves an alias
to another step of the same ramp in the CAF Figma library: 1 variable in
Light, 28 in Dark. No names change. `npm test` now runs `check:contrast
--strict`, so a pair that drops below AA fails CI.

- **Light.** `text.subtle` is slate-500 instead of slate-400, so subtle
  text reads a little darker.
- **Dark, text and focus.** Brand text is lighter: `text.brand.medium` is
  caf-blue-300 and `text.brand.strong` is caf-blue-200. The focus ring
  (`stroke.focused`) is caf-blue-300. The pressed link colour
  (`text.link.pressed`) is GDL blue-400 instead of a raw hex.
- **Dark, primary buttons.** Labels and icons are near-black
  (caf-blue-on-dark-100) on the unchanged periwinkle fill, in every state
  including selected.
- **Dark, selected secondary and tertiary buttons.** Labels are
  caf-blue-on-dark-700 instead of a dark tint that disappeared on the fill.
- **Dark, neutral buttons.** Outline labels stay slate-300 in every state.
  Tonal hover, pressed and selected use a slate-50 label on a slate-500 fill,
  so the three states now look the same. Filled buttons lighten on hover and
  selected (slate-300) and pressed (slate-200) instead of darkening.
- **Dark, accent tonal badges and buttons.** Hover labels on pending and
  critical are one step lighter (/200). Pressed labels are lighter on all
  five accents (/100, or blue-200 for info). Info outline's default label is
  blue-400, the same as its hover.

### First release — CAF's tokens on GDL (October 2026)

- **Built on GDL 0.1** (`@vdm-design-team/gdl`, from its git tag). It
  inherits the palette, spacing, radius, stroke, fonts, elevation 1–7, the
  47-style type ramp, dark elevation, desktop sizes and the build formats.
  The output uses the same file and CSS variable names as GDL's.
- **CAF's own tokens, generated from the CAF Figma library**
  (`figma-export/` → `npm run import:figma`):
  - `color.caf-blue` and `color.caf-blue-on-dark` (11 steps each)
  - `font.family.sans` → Inter, CAF's only override of GDL
  - 312 semantic colours in Light and Dark
- **Checked against GDL.** The GDL contract is satisfied: 247/247 required
  names, plus 7 known CAF extensions. All semantic aliases resolve to GDL
  Primitives or CAF's Brand Primitives. CAF's 45 text styles and 10
  elevations match GDL's exactly.
- **Contrast report** (`npm run check:contrast`): 37 semantic pairs below
  WCAG AA, 3 in Light (`text.subtle`) and 34 in Dark. The report doesn't
  fail the build yet. The fixes belong in Figma.
