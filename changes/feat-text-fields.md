---
bump: minor
---
### Text fields: error and valid states from the new CAF design (November 2026)

Fields now show an error with colour, an icon and words together, as the new
CAF design does, in Light and Dark.

- **Error border:** Text Input, Textarea and Select's trigger draw a 2px
  critical border while invalid, focused or not (was 1px). Combobox, Date
  Input and every field built on them follow.
- **Error message:** every FormField's error is semibold and leads with a 16px
  alert icon. The helper is unchanged.
- **Status icon:** Text Field and Textarea Field put an alert icon at the end
  of an invalid input. It is decoration; the message says the same in words.
- **Text Field `valid`:** new prop for a value that passed a real check, like
  an email or an IBAN. It draws a green border while not focused and a check
  at the input's end. An error wins over it.
- **Textarea Field counter:** with `maxLength`, a counter ("0/500") shows at
  the end of the label row and follows what you type.
