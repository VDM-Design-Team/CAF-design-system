---
bump: minor
---
### Checkbox, Radio and Toggle restyled for the new CAF design (November 2026)

The selection controls follow the new CAF design, in Light and Dark. Every
form, table and dialog with a checkbox, radio or switch looks different.

- **Checkbox:** one size, 20px (the design's 18px, snapped to GDL's scale), is
  now the default, so table rows and Checkbox Field draw a 20px box. `size={16}`
  still works. Hovering an unchecked box draws its border in the brand colour.
  Checkbox Field's box now sits level with the label instead of 2px below it.
- **Radio:** Selected is a thick 6px ring around a hollow centre, in place of
  the thin ring and dot.
- **Radio Option and Radio Group:** new `description` prop, a line under the
  label for options that need a sentence. The label turns semibold, and the
  line describes the radio for screen readers. A Radio Group whose options
  have descriptions stacks them in a column.
- **Toggle:** 44 × 24 with a 20px knob and a soft shadow (was 36 × 20 and
  16px). Toggle Field and a Toggle in a table cell grow with it.
