---
bump: minor
---
### Buttons and icon buttons from the new CAF design (November 2026)

**Button** is a pill and 40px high (was 36). Small stays 32px and Big 48px.
Small's label is now 14px, like Normal's. Hover no longer lifts a button with
a shadow. In Light and Dark:

- **Outlined** (Secondary) is white with a grey border and a dark label, not
  a blue outline. Hover darkens the border.
- **Text** (Ghost) has a dark label instead of a blue one. Hover fills it with
  a light brand tint in Light and a lighter grey in Dark.
- **Disabled** looks the same for every style: a pale grey fill, a faint
  border and a muted label.
- Default (Primary), Destructive (Danger), Tonal and Success keep their
  colours.

New on Button:

- `variant="text-destructive"`: a red Ghost button, for a remove action
  that isn't the main one.
- `busy` and `busyLabel`: a spinner and "Saving…" replace the icon and label,
  `aria-busy` is set, and a second click is ignored.
- `aria-disabled`: the disabled look, but the button stays focusable and its
  clicks are ignored.
- `block`: the button fills its container's width.

**IconButton** is 36×36 by default (was 32), with a 20px glyph. `size` is
now 32, 36 or 40. On hover the glyph darkens and the button fills with the
same tint as the Ghost button. It now shows its `label` as a tooltip on hover
and keyboard focus. Screen readers hear the label once, not twice.
`tooltipPlacement="bottom"` puts the tooltip below; `tooltip={false}` turns
it off. With the tooltip on, `className` goes on the tooltip's wrapper, so
use it to place the button, not to restyle it.

These look different: every screen's buttons; dialog and drawer close
buttons; table row ••• menus; the Refresh button in Audit Logs; and the
header's account and menu buttons, which now have tooltips. Alert and Toast
dismiss buttons, the clear button in Date Input, the File Chip × and the
Combobox caret stay 32px. **Tooltip** has a new `describes` prop: set it to
`false` when the tooltip only repeats its target's name. A tooltip like that
doesn't stop Escape, so one press still closes the dialog or menu behind it.
