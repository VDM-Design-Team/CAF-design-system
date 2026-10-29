---
bump: minor
---
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
