---
bump: patch
---
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
