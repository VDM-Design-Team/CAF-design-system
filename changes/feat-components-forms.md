---
bump: minor
---
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
