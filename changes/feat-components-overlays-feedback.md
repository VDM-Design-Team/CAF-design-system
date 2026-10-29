---
bump: minor
---
### Components: modals, side sheet, alerts, toasts, tooltip, loading and empty states (October 2026)

CAF's overlays and feedback states, built straight from the CAF Figma
library (pages **Modals** and **Feedback**). The modals cover the
Patterns – Admin flows 04 Confirm destructive actions, 05 Create or edit
in a modal and 06 Edit in a side sheet.

**`ModalDialog`** is `Modal / Dialog`, used by Add Cost Center, Add
Partner, Add User, Create Announcement, Cost Breakdown and Audit Logs.
`size` is `small`, `medium` or `large`. It takes a `title`, an optional
`description` (`showDescription`), the content as `children`, and the
footer's buttons as `footer` (`showFooter`).

**`ModalConfirm`** is `Modal / Confirm`, used for Approve, Reject, Stop and
Delete. `type` is `default` (info icon, Default button) or `destructive`
(critical icon, Destructive button). It takes a `title`, a `message`,
`confirmLabel`, `cancelLabel` and `onConfirm`. Focus opens on Cancel, and a
backdrop click doesn't close it.

**`SideSheet`** is `Panel / Side Sheet`, the 672px right-hand sheet for
edit flows such as Edit Recurring Cost. It takes a `title`, `children` and
a `footer`.

**`ModalHeader`** and **`ModalHeaderIcon`** are `Modal / Header` and its
icon tile, for modals Figma composes by hand (Payment Schedules).

**`Overlay`** is the modal layer under all of them: the `surface.overlay`
scrim over the page, centred or against the right edge. Every modal
renders in a portal, moves focus in and traps it, closes on Escape and its
close button (and on a backdrop click, except ModalConfirm), makes the
page behind inert and stops it scrolling, and returns focus to whatever
opened it.

**`Alert`** is the inline banner (`Alert`), for notes that stay on screen,
like Add New User's temporary password and Audit Logs' "This cost was
deleted". `type` is `info` (default), `success`, `warning` or `error`;
`size` is `default` (title over message) or `compact` (one line).
`showDismiss` adds an X that hides it and calls `onDismiss`. Error and
Warning are announced as alerts; Info and Success as status.

**`Toast`** is the notification after Save, Upload or Export (`Toast`):
`type`, `message`, an optional action (`action`, `showAction`, `onAction`)
and an X. **`ToastProvider`** and **`useToast()`** raise them. They stack
at the bottom right in a polite live region. Info and Success close after
5 seconds; Warning, Error and any toast with an action stay until
dismissed. Hover or focus pauses the timer.

**`Tooltip`** is the short hint with an arrow (`Tooltip`). `text` is the
hint and `placement` is `top` (default) or `bottom`. In Light it's a
slate-700 bubble with white text; in Dark a slate-200 bubble with
near-black text. It opens on hover and on keyboard focus, closes on
Escape, blur and pointer leave, describes its target
(`aria-describedby`), and flips or nudges itself to stay on screen.

**`Skeleton`** is the loading placeholder (`Skeleton`): `shape` is `line`,
`circle` or `block`, sized with `className`. It pulses, except under
`prefers-reduced-motion`, and is hidden from screen readers.

**`SkeletonTableRow`** is a table row's loading state
(`Skeleton / Table Row`): one Skeleton line per column (`columns`,
default 5). It is as tall as a loaded row, so nothing jumps when the data
arrives.

**`Spinner`** is the loading indicator (`Spinner`): `size` 16, 24 or 32,
a `neutral/tonal` track and an `action/primary` indicator. It is a
`role="status"` region with a visually hidden `label`, and stands still
under reduced motion.

**`EmptyState`** is what a list or page shows when it has nothing to show
(`Empty State`): `size` `default` (icon tile, `title`, `description` and an
optional `action` Button) or `compact` (a small icon and the title, inside
a table body).

Every colour is the one the Figma layer is bound to, in Light and Dark,
and every text passes AA. There are no new icons, and nothing existing
changes.

Where code differs from Figma (details in `docs/figma-sync.md`):
- **Widths:** the dialogs' 400 / 560 / 800 and 420 aren't on a GDL scale.
  Code caps them at 384 / 576 / 768 and 448. The side sheet is exactly
  672.
- **Close buttons** on the modals, the toast and the alert are an
  `IconButton` (Ghost, 32×32, 16px ×) with a hover fill and focus ring.
- **The modal header icon's glyph** uses `accent.info.tonal.content.default`.
  Figma's raw blue failed 3:1 on the tile.
- **Radii and padding** are on GDL's scales: the toast's raw 10 radius is
  `radius/8`, the compact alert's raw 10 padding is `space/12`, and the
  tooltip's raw 10 side padding is `space/8`.
