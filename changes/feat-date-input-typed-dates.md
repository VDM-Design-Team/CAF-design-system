---
bump: minor
---
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
