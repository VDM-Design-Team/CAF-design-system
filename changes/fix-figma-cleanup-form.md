---
bump: minor
---
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
