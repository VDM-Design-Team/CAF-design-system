---
bump: minor
---
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
