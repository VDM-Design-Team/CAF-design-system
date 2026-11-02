---
bump: minor
---
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
  format, "12–24 Oct 2026" or "12 Oct – 4 Nov 2026" (`formatDateRange`), so
  it fits the 256 field. Its content-to-caret gap is 12, not 16.
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
