# Changelog

## 1.1.0 — 2026-11-13

### CAF installs GDL 1.1.0 (November 2026)

`@vdm-design-team/gdl` goes from ^1.0.0 to ^1.1.0. It only adds tokens:

- **The type ramp's metrics:** `--font-line-height-<tier>` and
  `--font-letter-spacing-<tier>` for all 15 tiers (in `tokens.css`,
  `tokens.json` and `tokens.ts`), which CAF's components don't use
  directly. They are the values the `text-*` utilities already use, now
  also as Figma variables, so CAF's text styles bind them.
- **Open Sans:** `font.family.open-sans` (`--font-open-sans`, the
  `font-open-sans` utility), which CAF's UI face now uses (see below).

The bump itself changes no `text-*` utility, colour or component.

### CAF's UI face is Open Sans (November 2026)

Every CAF component and text style is now set in Open Sans instead of Inter.
`font.family.sans` points at GDL 1.1.0's new `font.family.open-sans`
(`Open Sans`, `system-ui`, `sans-serif`), so `--font-sans` and the
`font-sans` utility change with it. The type ramp is GDL's and unchanged:
sizes, weights (400, 500, 600, 700), line heights and letter spacing are the
same, so heights in code don't move. Widths do: Open Sans is wider than
Inter, so labels, table columns and truncation points shift.

Apps now load Open Sans instead of Inter, for example:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap" />
```

Uses GDL 1.1.0, which CAF already installs. In the CAF Figma library the
45 text styles are Open Sans, bound to GDL's `font/family/open sans`; Figma's
Open Sans has no Medium,
so the 8 `-medium` styles show SemiBold there while code keeps 500
(`docs/figma-sync.md` → Open Sans).

In Storybook, Light and Dark: every story's text is Open Sans.

## 1.0.1 — 2026-11-10

### The "Recurring" tag on a cost is orange again (November 2026)

The CAF Figma library's `Table / Account Details` now defaults its Category
Tag to Tag Pending, without its icon, still labelled "Recurring" (it was Tag
Info, blue). The Costs table's recurring costs follow:
`<Tag status="pending" showIcon={false}>Recurring</Tag>`. It is the tonal
Tag, not the filled Status Pill, so it stays lighter than the row's status.
`TableAccountDetails` itself is unchanged: `categoryTag` still takes any
Tag, and Figma now offers only Tag Pending and Tag Neutral for it (Tag Info
is no longer a preferred value).

In Storybook, Light and Dark: the Costs table's and TableAccountDetails'
"Recurring" tag is orange (Tag Pending's tonal fill) instead of blue. Its
label passes AA: 4.52 (Light), 5.56 (Dark).

### Apps ship only the components they import (November 2026)

The package's JS is now one file per module instead of one bundle, and
`package.json` says `"sideEffects": ["*.css"]`, so an app's bundler drops
every component the app doesn't import. In a Vite + React 19 app,
importing only `Button` adds 35.2 kB of CAF's JS (10.4 kB gzip), down
from 160.9 kB (45.6 kB gzip) in 1.0.0. An app that imports everything
gets the same JS as before.

- **Imports don't change.** `import { Button } from '@vdm-design-team/caf'`
  works as before, with the same types; no export is added or removed.
- **Next.js App Router.** Every component module starts with
  `"use client"`, so Server Components can still import and render
  components directly. With Turbopack (Next's default since 16) and in
  Client Components, an app gets only what it imports. A webpack build
  (`next build --webpack`) brings in every component for a Server
  Component's import unless the app lists `@vdm-design-team/caf` in
  `experimental.optimizePackageImports`.
- **CSS.** `theme.css` now has `@source "./components"` and
  `@source "./lib"` in place of `@source "./index.js"`. Tailwind scans
  files, not imports, so an app's CSS still has every component's classes
  (about 49 kB minified, 7 kB gzip, on top of the theme). Apps keep
  importing `theme.css` in place of `@import "tailwindcss"`; nothing in
  the app changes.

No component looks different, in Light or Dark.

## 1.0.0 — 2026-11-06

### Deprecated APIs removed: TableDetailLabel `children` and VersionBadge (November 2026)

The two APIs deprecated in 0.10.0 (3 November 2026) are gone, as decided
for the next major release:

- **`TableDetailLabel`** takes only `label` and `value`, Figma's Label and
  Value. The whole line as `children` (Figma's old Text property) no longer
  renders, and the `TableDetailLabelLineProps` / `TableDetailLabelTextProps`
  types are now one `TableDetailLabelProps`.
- **`VersionBadge`** (Figma's deprecated `Modal / Version Badge`) is removed,
  with `VersionBadgeProps`. A release version is a
  `<Tag status="info" showIcon={false}>`, as the Announcements table and
  ChangelogHeader show it.

Nothing in CAF used either, so no screen looks different in Light or Dark.

Migration:
- `<TableDetailLabel>ID: 32430</TableDetailLabel>` becomes
  `<TableDetailLabel label="ID:" value="32430" />`.
- `<VersionBadge>v2.5.6</VersionBadge>` becomes
  `<Tag status="info" showIcon={false}>v2.5.6</Tag>`.
- Replace `TableDetailLabelLineProps` and `TableDetailLabelTextProps` with
  `TableDetailLabelProps`, and `VersionBadgeProps` with `TagProps`.

### CAF installs GDL 1.0.0 (November 2026)

CAF now installs GDL 1.0.0 (it was 0.1.0). GDL 1.0.0 stops shipping its
placeholder brand ramps, the pink `color.primary` and the teal
`color.secondary`, to brands, and its contract check fails a brand token
that points at either. CAF never used them, and every CAF token, semantic
colour, type style and elevation is unchanged in Light and Dark. Nothing
looks different on any CAF screen.

Migration: `theme.css`, `tokens.css` and the JSON no longer carry the 22
`--color-primary-*` and `--color-secondary-*` variables (50–950), so the
`bg-primary-*` / `text-secondary-*` style utilities they made are gone. An
app that used them switches to CAF's own ramp (`caf-blue-*`) or, better, a
semantic colour such as `bg-action-primary-surface-default`.

## 0.12.0 — 2026-11-06

### Clear Filters, modal header actions and Button links (November 2026)

Code follows the CAF Figma library's 5 Nov 2026 additions (published 6 Nov).

- **New `FilterClear`** (Figma `Filter / Clear`): Clear Filters, an Outlined Button (Normal) with ArrowsClockwise in a box as tall as a filter field, for the filter bar's right end. Default, Hover, Pressed, Focus and Disabled are the button's own states, with Button's Outlined colours in Light and Dark. Show it only while a filter is in use: when nothing is filtered it is hidden, never disabled.
- **`ModalDialog` takes `actions`** (Figma's Show Actions on `Modal / Dialog`): icon buttons before the close button, 4px apart, such as Audit Logs' Refresh (ArrowsClockwise). A dialog without `actions` looks as before.
- **`Button` takes `href`**: a Button that navigates renders an `<a href>` with the same look and states, such as "Go back home" on the 404 page. With `disabled` it stays a disabled `<button>`. Hover and Pressed now use `not-disabled:` instead of `enabled:`, so the same classes style the link; a `<button>` looks the same as before. Its ref type is `HTMLButtonElement | HTMLAnchorElement`.
- **`AppHeader` and `MobileMenu`, docs only:** Figma's new Header Page=None is `page` left out (no link is current), and `Navigation / Mobile Menu`'s Links=Admin / Links=User is `links`. No API change.

Screens that look different, in Light and Dark: every filter bar's Clear Filters gains the ArrowsClockwise icon (Costs, Cost Centers, Users, Exports, Announcements). Recurring Costs (U04) and Drafts (U03) now sit in the filter bar's frame, with Clear Filters on its far right only while filtering; Drafts no longer shows a disabled Clear Filters. The Audit Logs dialog shows Refresh beside ×. The Users page's failed load shows Retry inside the Error Alert instead of under it.

### Apps can install and import the components (November 2026)

`@vdm-design-team/caf` now ships CAF's React components, not only the
tokens and CSS. `import { Button, DateField, SelectField, … } from
'@vdm-design-team/caf'` works in a React 18 or 19 app, with types, and
everything in `src/index.ts` is exported. Set up as VCP's package is.

- **`.`** → `dist/index.js` (ESM, starts with `"use client"`) and
  `dist/types/src/index.d.ts`. React, React DOM, `class-variance-authority`,
  `clsx` and `tailwind-merge` stay external, so the app keeps one React.
- **`./tokens`** → `dist/tokens.js`: the token values as a JS object
  (Light, and Dark under `tokens.dark`). Not a client module, so server
  code can read it.
- **`theme.css`** adds one line, `@source "./index.js"`, under its
  `@import "tailwindcss"`: an app's Tailwind generates the components'
  classes from the bundle, with no `@source` of its own. An app still
  imports `@vdm-design-team/caf/theme.css` in place of `@import "tailwindcss"`;
  the tokens, Light and Dark (`.dark` on `<html>`) are unchanged. An app
  that doesn't use the components gets their classes in its CSS too
  (about 47 kB minified).
- **Peers:** `tailwindcss >=4` joins `react` and `react-dom` as an
  optional peer dependency. Optional, because an app that only reads
  `tokens.css` or the JSON needs none of them.
- The other exports (`tokens.css`, `tokens.dark.css`,
  `typography.desktop.css`, `tokens.json`, `tokens.flat.json`, `tokens/*`)
  are unchanged.

No component looks different, in Light or Dark. How an app sets it up
(the CSS line, Dark, Inter): "Using CAF in an app" in the README.

## 0.11.0 — 2026-11-05

### Popovers stay open while focus moves inside them; Starts At shows the date format (November 2026)

- **`Popover`** (and everything built on it: `FilterDateRange`, `DateInput`,
  `Select`, `SelectMenu`, `FilterSelect`, `Combobox`, `MenuDropdown`) no longer closes when focus moves inside
  the panel while the Popover re-renders. Its refs were set again in every
  commit, so for a moment the panel looked empty, and a focus move in that
  moment read as focus leaving. In Select Period, an arrow key could close
  the range picker and drop focus to the page. Nothing looks different.
- **New Cost** (recurring): Starts At shows the date field's own placeholder,
  "yyyy-mm-dd", instead of "Select start date". In the CAF Figma library,
  U02's and U04's Starts At are Form / Field – Date since 4 November.

### Date fields take a typed or pasted date (November 2026)

`DateInput`, and so `DateField`, now take a date typed or pasted as
`yyyy-mm-dd` as well as one picked in the calendar, as the CAF Figma
library's `_Date Input` description says (decision `date-input`).

- **The field is a text input** (`<input role="combobox">`, with
  `TextInput`'s look, which is `_Text Input`'s), no longer a button. Its
  calendar icon is the button that opens the calendar ("Choose date"); the
  icon looks and sits as before. ↓ or ↑, or Enter with nothing new typed,
  still open the calendar from the keyboard. A click in the field (or on a
  DateField's label) puts the cursor there to type instead of opening the
  calendar, and Space types a space.
- **Typed text is checked** on blur, on Enter and when the calendar opens,
  strictly: a real `yyyy-mm-dd` day, with spaces around it ignored. A date
  becomes the value (`onValueChange`) and the calendar opens on its month.
  Empty text clears the date. Anything else stays as typed so it can be
  fixed: the field is `aria-invalid` (State=Error), the new
  **`onInvalidChange`** prop is called with `true`, and the field holds no
  date (`onValueChange('')`), so a form doesn't submit a date the field no
  longer shows. Enter on new text checks it and doesn't submit the form.
- **`DateField`** shows "Enter a date as yyyy-mm-dd." under the field while
  its typed text isn't a date, in the place of the helper or `error`.
- **The placeholder** defaults to "yyyy-mm-dd" instead of "Select date",
  so an empty field shows the format to type, as Figma's `_Date Input`
  does since 4 Nov 2026. Cost Breakdown's Period From / To and the
  recurring side sheet's Starts At / Ends At take the new default.
- **The clear button** (×) shows as soon as an optional field has text,
  and clears typed text too.
- **The ref** of `DateInput` and `DateField` is now the `<input>`
  (`HTMLInputElement`), and their other props are an input's.

In Storybook, Light and Dark: date fields look the same at rest (the same
fill, stroke, 40px height, text and icon), except that an empty one reads
"yyyy-mm-dd" (in the same `text.subtle`) instead of "Select date". Focused, a field shows the
2px focus stroke for a click as well as for the keyboard, with a text
cursor. Typed text that isn't a date shows the red field stroke and, in a
DateField, the red message under it. Affects Starts At / Ends At (Edit
Recurring Cost, New Cost), Period From / Period To (Cost Breakdown) and
Release Date (Create Announcement).

### Red field errors on Checkbox, Toggle and Radio Group; date pickers on the elevated surface (November 2026)

Follow-ups to the 3 November Figma clean-up:

- **`CheckboxField`, `ToggleField` and `RadioGroup`** show their `error`
  message in `accent.critical.tonal.content.default`, as `FormField` does
  since 0.10.0 (7.99 / 9.30:1 on the canvas). It was `text.subtle`.
- **`Calendar`, `RangeCalendar`** (and the pickers in `DateInput` and
  `FilterDateRange`) sit on `surface.elevated`, like every other popover,
  as the CAF Figma library has them since 4 November (decision
  menu-surface). It was `surface.neutral.faint`, the canvas colour. Every
  day state still passes.
- **`FileChip`**: its Download button no longer needs a contrast exception,
  since Button's Tonal label passes AA (0.10.0). Its stories check every
  cell again.

## 0.10.0 — 2026-11-04

### Table, filter and card parts follow the 3 November Figma clean-up (November 2026)

The CAF Figma library's Table, Filters and Cards pages were cleaned up on
3 November 2026 from the CAF design decisions and published. Code follows:

- **`StatCard`** has a 1px `stroke.subtle` edge inside (as `PanelCard`), so
  a card shows on the canvas in Light. Its size doesn't change. The edge is
  decorative. Figma's `_Stat Icon` is now Tone × Icon, which `tone` and
  `icon` already were.
- **`FilterSummary`**'s box has the same 1px `stroke.subtle` edge, so it
  shows on a dialog in Light and on the canvas in Dark.
- **`TableExpandButton`** has a Hover fill, `neutral.tonal.surface.hover`
  (Figma's Expanded × State set: Default, Hover, Focus).
- **`ChangeDiffRow`**: Before is struck through, as Figma draws it.
  `before` is optional (Figma's Show Before): leave it out for a Created
  entry, and the Before cell stays empty while After keeps its column.
- **`TableDetailLabel`** takes `label` ("ID:") and `value` ("32430"), Figma's
  Label and Value, 4px apart. The value stays on one line and ends in …
  when the line is narrower than it. The whole line as `children` still
  renders, and is deprecated.
- **`ChangelogEntry`**'s `showNew` defaults to false, as Figma's Show New
  now does: pass `showNew` on the latest release. An entry that relied on
  the old default loses its New tag.
- **`TableAccountDetails`**: Figma's default Category Tag is a Tag Info
  without its icon, "Recurring" (it was an orange Status Pill), so it
  doesn't read as a second status. Pass `<Tag status="info"
  showIcon={false}>Recurring</Tag>` as `categoryTag`.

In Storybook, Light and Dark: stat cards and filter summaries gain their
edge; the Costs table's recurring costs show a blue "Recurring" tag
instead of the orange pill; the Audit Logs' Created entry shows only its
After values; an expand button's fill changes on hover (darker in Light,
lighter in Dark).

### Form controls follow the 3 Nov Figma clean-up (November 2026)

The CAF Figma library's Form page was cleaned up and published on 3 Nov
2026. The form components follow it:

- **Disabled inputs** (TextInput, SelectTrigger and Select, Textarea,
  DateInput, Combobox) use the disabled tokens instead of 50% opacity:
  the fill `neutral.tonal.surface.disabled`, a 1px
  `neutral.outline.border.disabled` stroke, and the value, placeholder and
  icons in `text.disabled`. In Light the field is a pale slate-100 box with
  slate-300 text; in Dark a slate-800 box with slate-500 text. Both read as
  quieter than every enabled state.
- **Field messages** (FormField, so TextField, SelectField, TextareaField,
  DateField, ComboboxField and FileUploadField) sit 8px under the control
  instead of flush against it, and an `error` message is
  `accent.critical.tonal.content.default` (the Required marker's red)
  instead of grey. The helper stays `text.subtle`.
- **Select options** (Select, Combobox, FilterSelect): Hover, the option
  the arrow keys are on and Selected fill with
  `neutral.tonal.surface.default` (slate-200 / slate-600) instead of the
  near-invisible `surface.base`, and the check is `text.primary`, the
  label's colour (it was 1.97:1 on the new fill in Dark).
- **Date picker days** (Calendar, DateInput, RangeCalendar and
  FilterDateRange): In Range days fill with `neutral.tonal.surface.default`,
  so a range shows in Light. Today, when it is also selected, has its own
  mark: a 1px ring 2px inside the day, in the selected label colour,
  where Today's blue ring used to vanish on the fill.
- **DateInput (and DateField)**: an optional field with a date has a clear
  button (×, "Clear date") before the calendar icon. It clears the date,
  calls `onValueChange('')` and puts focus back on the field. Required,
  empty, disabled and open fields have none. On CAF's screens this is Ends
  At in Edit Recurring Cost.
- **Combobox (and ComboboxField)**: the caret is its own button ("Show
  options", not a tab stop) that opens the full list without typing and
  closes it again; focus stays in the input. The text's right inset grows
  from 40 to 44px.
- **FormEditLink** ("[Edit]"): Hover, Pressed and Disabled colours
  (`text.link.hover`, `text.link.pressed`, `text.disabled`) and a 24×24
  target that takes no layout space, so the label row keeps its height.
- **FileUploadZone (and FileUploadField)**: the resting dashed border is
  `stroke.field` (3:1, like the inputs) instead of the faint
  `stroke.subtle`; drag-over is a 2px `stroke.focused` dash; disabled dims
  the title, hint and icon to `text.disabled`.

No prop changes. Two DOM changes: DateInput's button now sits in a
wrapper `<div>` with the clear button (its `className` still styles the
outer wrapper), and Combobox has a second button after the input.

### Buttons, selection controls, Status Pill and tabs follow the 3 Nov Figma clean-up (November 2026)

The CAF Figma library's buttons, controls, tags and tabs were cleaned up and
published on 3 Nov 2026 (the user took every recommendation, decisions
fc-buttons-*). Code follows Figma's new bindings.

- **`Button`**: Tonal's label is `text.brand.strong` (`text.brand.stronger`
  while pressed) and passes AA in every state (it was 1.77–3.98:1 in places).
  Destructive and Success labels use their own `accent.*.filled.content`
  tokens, which are #020617 in Dark (from #13141B). Disabled: Default and
  Tonal use the neutral tonal disabled pair, Outlined and Text the neutral
  outline one, so in Dark a disabled button is no longer louder than an
  enabled one (and Tonal Disabled no longer looks enabled). Figma's new Focus
  state matches code's ring. **`MenuTriggerButton`** (Export, Change Status)
  takes the new Default Disabled look through Button.
- **`IconButton`**: Disabled draws the glyph in `text.disabled`, with no hover.
- **`StatusPill`**: Pending's label is `accent.pending.filled.content` (the
  same colours today).
- **`TabItem`**: a hover on tabs that aren't selected
  (`neutral.outline.surface.hover`, `text.primary` label), in Tabs and
  FormTabNavigation. **`FormTabNavigation`**'s active tab is
  `neutral.tonal.surface.default` (was `surface.base`), so it shows against
  the track in Light.
- **`Checkbox`**: radius 4 in every state (unchecked was 2); Hover's border is
  `stroke.stronger`; a checked box has no border; Disabled and Disabled
  Selected have their own colours (they only changed the cursor). An
  `aria-invalid` unchecked box has the critical border.
- **`Radio`** and **`Toggle`**: Disabled has its own colours instead of 50%
  opacity. Radio's new Error state is `aria-invalid` (the critical stroke),
  so **`RadioGroup`**'s `error` now marks its radios too, and **`RadioOption`**
  shows Error=true.
- **`CheckboxField`** and **`ToggleField`**: new prop `error` (Figma's
  State=Error): the message under the description and the control
  `aria-invalid`; CheckboxField's box, or its card, turns critical. Disabled
  turns the label, marker and description `text.disabled` (and the card's
  stroke `neutral.outline.border.disabled`).

Screens: every disabled button, checkbox, radio and toggle looks different
in Light and Dark; Tonal buttons (View Changes, Download) have darker labels
in Light and lighter ones in Dark; Destructive and Success labels are
slightly darker in Dark; the New Cost form's active tab shows as a grey pill.

### Modals, menus and feedback follow the 3 Nov Figma clean-up (November 2026)

Code follows the CAF Figma library's 3 Nov 2026 clean-up of the Modals, Menus
and Feedback pages, published by the user.

- **Menus and popovers** are on `surface.elevated` instead of
  `surface.neutral.faint` (decision menu-surface): Popover's shared surface
  (`popoverSurface`), so MenuDropdown, AccountMenu's panel, RowActionsMenu,
  MenuTriggerButton's menu and the lists of Select, FilterSelect and Combobox.
  In Light the panel is white on the slate-50 canvas; in Dark it is slate-800.
- **MenuItem** Hover is `neutral.tonal.surface.default` (was `surface.base`,
  invisible on the new panel), and the item the keyboard is on takes the same
  fill. A destructive item on hover or keyboard focus has the new
  Destructive Hover label, `accent.critical.tonal.content.hover`, which passes
  on that fill in Dark.
- **PaymentSchedules** has Modal / Dialog's 1px `stroke.subtle` edge and
  Elevation 4. **ChangelogModal** has Modal / Dialog's surface: `surface.base`,
  radius 12 (was 16), a 1px inside `stroke.subtle` and Elevation 4 (was 2).
- **ChangelogHeader**: the rocket is `accent.critical.tonal.content.default`
  (was `accent.red.medium`, 2.76:1 in Light), the date `text.secondary`, and the
  version a Tag Status=Info without its icon.
- **VersionBadge** is deprecated: show a version as
  `<Tag status="info" showIcon={false}>`. It stays exported for now.
- **PaymentRow** has a new `amount` prop (Body/sm-semibold, `text.primary`)
  between the date block and the status, and its status is a Tag (Completed
  "Done", Warning "Upcoming", no icon) instead of its own smaller badge. It is
  still 60 tall. The Recurring Costs patterns show each payment's amount.
- **Toast**: the action has a Hover, `text.link.hover`.
- **Spinner**: the indicator is `action.tertiary.content.default`. Light looks
  the same; in Dark it is near-white, 6.33:1 on the track (was 1.97).
- **EmptyState**: the Default tile is the neutral tonal pair
  (`neutral.tonal.surface.default` with the glyph in
  `neutral.tonal.content.default`), and a new `icon` prop (an Icon name,
  default `tray`) swaps the glyph. Compact is unchanged and has no `icon`.

Screens that look different, in Light and Dark: every open menu and select
list, the View Schedules and what's-new dialogs, toasts with an action on
hover, spinners in Dark, and the empty states on the Announcements and 404
pages.

### The header follows the 3 Nov Figma clean-up: Active link indicator, a lighter nav band, Ghost glyphs, and the mobile Account Row opens the Account Menu (November 2026)

From the CAF Figma library's clean-up of 3 Nov 2026 (decisions nav-active,
user-actions, mobile-menu and the fc-nav recommendations), published in
Figma first.

- **`NavLink`**: the Active link's label is semibold (Body/sm-semibold
  horizontal, Body/md-semibold vertical), and a 2px
  `action.primary.surface.selected` Indicator marks it: under the label on a
  header link, at the left edge of a Mobile Menu row. The Active fill is
  kept. The current page now shows in Light too, where the fill alone barely
  did (3.07:1 at the closest, the underline on the Active fill in Dark).
- **`AppHeader`**: the Navigation Area under the top bar is
  `surface.neutral.faint` (was `surface.base`). In Light the two bands now
  separate (#F8FAFC under white); in Dark the step is smaller than before.
- **`UserActions`**: 8px (`space.8`) between the greeting, the theme toggle
  and the account icon (was no gap), so the group is 16px wider.
- **`ThemeToggle`**, **`AccountMenu`**'s account icon and **`MobileHeader`**'s
  ☰ / ✕: the glyphs are `text.secondary`, IconButton Ghost's colour (were
  `text.primary`), in the desktop header and below 768px, Light and Dark.
- **`MobileMenu`**: the Account Row is now a button, AccountMenu's trigger.
  It opens the Account Menu below it, 16px in, on `document.body` (so the
  menu's scroll can't cut it off). It looks as before, with a focus ring on
  keyboard focus, and it is the last Tab stop in the menu. Choosing an
  account item, from the row or from the header's account icon in the open
  menu, closes the Account Menu and the Mobile Menu, returns focus to ☰ and
  then calls `onAccountSelect`, so the app can move focus into the dialog it
  opens. Escape and a tap outside close only the Account Menu. No prop
  changes; the row's element changes from `<p>` to `<button>`.

### Darker scrim in Dark (November 2026)

`surface.overlay` in Dark changes from slate 800 at 75% (`#1e293bbf`) to
slate 950 at 75% (`#020617bf`), as the CAF Figma library now has it. The
scrim behind every modal and side sheet is darker in Dark, so a dialog's
edge stands out from the page under it (1.06:1 → 1.34:1 over the canvas).
Light is unchanged.

The snapshot also picks up the text-style bindings fixed in Figma (GDL's
`font/size/*` and `font/family/*` variables on 11 styles). No text style
changes value.

### Tables scroll in their own region on narrow screens; row menus open outside it (November 2026)

From the CAF design decision add-phone-table-layout ("a table that scrolls in
its own region; row menus open outside it"). Figma has no phone layout, so
this is code only.

- **`TableList`** wraps its `<table>` in a scroll region that takes its
  container's width and scrolls sideways when the columns need more, so the
  page itself no longer scrolls sideways on a phone. While it can scroll, the
  region is a tab stop (the arrow keys scroll it), a `role="region"` named
  like the table (its `aria-label` or `aria-labelledby`), and shows the 2px
  `stroke.focused` ring inside its edge. While the table fits, the region is
  a plain `<div>` with no tab stop. New prop `regionClassName` styles the
  region; `className` and `ref` still go to the `<table>`.
- **`Popover`** has a new opt-in prop, `portal`: the panel renders on
  `document.body`, fixed at the trigger, and follows it on scroll and resize,
  so a container that scrolls or clips can't cut it off. The ARIA wiring,
  outside click, Escape, focus return and the Tab order (trigger → panel →
  what follows the trigger) are kept. The default is unchanged. `MenuDropdown`
  passes it through: use it for a menu in a table.
- **`RowActionsMenu`** opens its menu with `portal` by default, so a row's •••
  menu opens over the table's scroll region and the page, never clipped.
  `portal={false}` keeps it inline. Tests that look for the menu need
  `screen` instead of `within(canvasElement)`.
- **`Overlay`** leaves Tab alone in a popup it opened in a portal, so a
  RowActionsMenu inside a dialog or side sheet still closes on Tab and hands
  focus back to its •••.

Nothing looks different at desktop widths, in Light or Dark: menus open where
they did. On a phone every list page (Costs, Drafts, Cost Centers, Recurring
Costs, Exports, Announcements, Users) now fits the screen, with the table
scrolling in its region. At 1024 the Admin Costs table needs a few pixels
more than the 976 it gets, so it scrolls by those pixels inside its region.

### Storybook's form pages and Settings sit in a PanelCard (November 2026)

Story-level only: nothing in the published package changes. In Storybook's
patterns and templates, the form pages and Settings now use the Layout
components added in 0.8.0, as the CAF design decisions add-card-panel,
add-form-heading and add-divider say:

- **New Cost**, **Bulk Upload**, the file-upload pattern's **Attach invoice**
  and **Settings**: the page's `PageHeader`, then, 24px under it, a
  `PanelCard` (surface.base, a 1px stroke.subtle edge, radius 12, 32px
  padding) that holds only the form. The heading and the card share a
  centred column as wide as Figma's form cards (`max-w-xl`, 576px; Figma
  578).
- **Dividers** where Figma draws a rule: New Cost's before Beneficiary
  Information and before Breakdowns (on both tabs), Bulk Upload's between
  the CSV upload and the template row. The labelled "Cost Details" rule stays
  a section header.
- New Cost's Save to Drafts and Save stack below 640px: on a 320 phone the
  card's padding leaves too little width for both side by side.

The pattern and template pages (Multi-section form, File upload &
attachments, Save and resume drafts, Account, settings & currencies, Form
page, App shell's Settings and Create Cost) look different in Light and Dark:
a white card on the slate-50 page in Light, a slate-800 card on slate-900 in
Dark, and the fields 64px narrower than before (512 instead of 576). Every
form's fields, checks and FormData are unchanged.

## 0.9.0 — 2026-11-03

### TableHeaderRow, TableList and TableCell type="custom" (November 2026)

Three table parts from the CAF Figma library's **Table** page, added there
first from the CAF design decisions:

- **`TableHeaderRow`** (Table / Header Row): the header over a table of
  TableRows. Its `TableHeaderCell`s are `children`, one per column, and
  `showExpand`, `showCheckbox` (a select-all box; `checkboxProps` go to it)
  and `showActions` add a column per control. Inside it, header cells take the
  rows' padding (16 at the sides, 12 above and below), so the labels line up
  with the cells under them, and a 1px `stroke.subtle` line runs under the row.
- **`TableList`** (Table / List): the plain list table, a `TableHeaderRow`
  (`header`) over `TableRow`s (`children`), with no fill or outer border, at
  its container's width.
- **`TableCell` `type="custom"`** (Table / Cell Type=Custom): any content or
  control at its own size (Account Details, a Toggle, the expand button, an
  Empty State across the row), with the other types' padding.

`TableHeaderCell` keeps its 6px padding on its own and takes the rows'
padding inside a `TableHeaderRow`. `SkeletonTableRow`'s cells are now
`type="custom"`; nothing looks different.

In Storybook, every table's header is now a `TableHeaderRow`: header rows are
45px tall (44 and the line) instead of 33, in Light and Dark, and Manage
Currencies' header gains its bottom line. The patterns' `RecordsTable` is
replaced by `TableList`.

### FilterSelect, FilterDateRange, FormHint, and RepeatableField's helper and error (November 2026)

Three components and a RepeatableField extension from the CAF Figma
library's Filters and Form pages, added there first from the CAF design
decisions:

- **`FilterSelect`** (Filter / Field – Select): a dropdown filter. The
  Filter / Field opens a Select / Menu as wide as itself, with the chosen
  option checked. `allLabel` ("All Status") is the reset item and the
  field's value while no filter is in use (`onValueChange(null)`). It shares
  Select's listbox, keys and typeahead (`useSelectListbox`, internal).
- **`FilterDateRange`** (Filter / Field – Date range): a period filter with
  the calendar icon that opens Date Picker / Range under it. The field shows
  `placeholder` ("Select Period") until two picks, then the range in a short
  format (`formatDateRange`): no year when both ends are in the current year
  ("12–24 Oct", "28 Sep – 31 Oct"), the year otherwise ("12–24 Oct 2025",
  "28 Dec 2025 – 3 Jan 2026"). Every current-year range fits the 256 field.
  A screen reader hears the full dates, with the year. Its content-to-caret
  gap is 12, not 16.
- **`FormHint`** (_Form Hint): an inline note under a field, "This will
  recur every 3 weeks": an Info glyph (`icon`) and a Caption line in
  `text.subtle`.
- **`RepeatableField`**: `helper` (Show Helper) and `error` (State=Error),
  under the rows and above Add. `error` shows in the critical colour and
  marks the empty rows (`invalidRows` names others) as invalid, with the
  critical border. The label now sits 20px above the first row, as on
  every form field (was 8), so a placed field is 12px taller.

`FilterField` Type=Dropdown given `role="combobox"` takes `label` as its
`aria-label` and drops its hidden "Status: " prefix (FilterSelect and
FilterDateRange use this). Select's behaviour is unchanged.

In Storybook, every filter bar's dropdowns are FilterSelect and
FilterDateRange (the list opens with a check on the chosen option), the
Exports screen's and Cost Centers' filters read "All Status", "All Types"
and "All Cost Centers" instead of a "Filter by …" placeholder, the recurrence
summary in the cost forms is a FormHint, and Create Announcement's Features
shows its own error.

## 0.8.0 — 2026-11-02

### Alert action, ModalHeader actions and a Changelog item in the Account Menu (November 2026)

Three additions from the CAF design decisions, made in the CAF Figma library
first:

- **`Alert`** takes `showAction`, `action` (the label, e.g. "Retry") and
  `onAction`: a small Text button after the text and before the dismiss
  button, as Toast places its action. For a list that failed to load.
- **`ModalHeader`** takes `actions`: icon buttons beside the close button,
  4px apart, such as Audit Logs' refresh.
- **`AccountMenu`** has a **Changelog** row after Settings
  (`onSelect('changelog')`), so people can reopen what's new. It shows in
  the header's account menu and in the mobile menu's account rows.

### PageHeader, Divider and PanelCard (November 2026)

Three components from the CAF Figma library's new **Layout** page, added
there first from the CAF design decisions:

- **`PageHeader`** (Page Header): the top of every list and form page.
  `title` is an `<h1>` in Heading/xl-bold, `description` a line under it,
  `tabs` sit after the title and a vertical divider, and `actions` are the
  page's buttons, primary last, named for their item ("New Announcement").
  Form pages use it too. It wraps on a narrow screen. The patterns and
  templates in Storybook now use it instead of their own page header.
- **`Divider`** (Divider): a 1px `stroke.subtle` rule, `orientation`
  horizontal (default) or vertical (1 × 32). A `role="separator"`.
- **`PanelCard`** (Card / Panel): the surface around a form page's form and
  the Settings page: `surface.base`, a 1px `stroke.subtle` border, radius 12,
  32px padding, content 20px apart.

In Storybook's Costs pages, a 1px rule now separates the title from the Cost
Type tabs, as Figma draws it.

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

### Field borders and switch tracks reach 3:1 (November 2026)

Two new semantic tokens from the CAF Figma library, GDL's recommended names:

- **`stroke.field`**: the resting border of fields and controls. Slate 500 in
  Light, slate 400 in Dark (GDL's reference values): 4.55:1 or more on every
  surface a field sits on, in both themes.
- **`surface.track`**: the unfilled track of a toggle (and later sliders and
  progress bars). The same steps, so it reaches 3:1 too.

The library now binds them, and so does code:

- **TextInput, SelectTrigger, Select, Combobox, DateInput, Textarea** and their
  fields: the Default and Filled border moves from `stroke.subtle` (1.23:1 in
  Light, 1.72:1 in Dark) to `stroke.field`.
- **FilterField** and **Radio** (Deselected): from `stroke.strong` (2.45–2.56:1
  in Light) to `stroke.field`.
- **Checkbox** (unchecked): from `stroke.default` (1.48:1 / 1.93:1) to
  `stroke.field`.
- **Toggle** (off): the track moves from `neutral.tonal.surface.default`
  (1.18:1 / 2.36:1) to `surface.track`.

Every field and control border is visibly darker in Light and lighter in Dark.
Disabled states keep their look (the inputs' `stroke.subtle`, Radio's
`stroke.strong`, Toggle's tonal track, all at 50%), as Figma still draws them.

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
