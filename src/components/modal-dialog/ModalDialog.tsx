import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Overlay } from '../overlay';
import { OverlayBody, OverlayFooter, OverlayHeader } from '../overlay/parts';

/**
 * ModalDialog — built from the CAF Figma library, page "Modals":
 * `Modal / Dialog` (Size × Title, Description, Show Description, Show
 * Footer, Content), the generic modal for Add Cost Center, Add Partner, Add
 * User, Create Announcement, Cost Breakdown and Audit Logs.
 *
 * Figma → code:
 * - Size → `size`: small (default), medium or large. Figma's widths are 400,
 *   560 and 800, which no GDL scale has; code caps the dialog at the nearest
 *   container widths, 384, 576 and 768 (`max-w-sm`, `max-w-xl`,
 *   `max-w-3xl`), and narrows it on a smaller screen.
 * - Title → `title`, the dialog's accessible name (`aria-labelledby`).
 * - Description → `description`; Show Description → `showDescription`. Figma
 *   hides it by default because its default text is a placeholder; code shows
 *   it whenever there is one, unless `showDescription={false}`. It describes
 *   the dialog (`aria-describedby`).
 * - Content (the `_Slot` instance swap) → `children`, in the Body.
 * - Show Footer → `showFooter` (default true, as in Figma). The footer's
 *   Button instances (Text "Cancel", Default "Submit") → `footer`: pass the
 *   Buttons.
 * - The Close Button → IconButton `icon="x"` named "Close"; it calls `onClose`.
 *
 * The panel: `surface.base` fill, 1px `stroke.subtle` stroke (a border: Figma
 * includes strokes in the layout), radius 12 (Figma: raw 12) and
 * `shadow-elevation-4` (Figma: the Elevation Dark/4 style). It sits in the
 * middle of an Overlay, which holds the behaviour: portal, focus trap, Escape,
 * backdrop click, focus return, scroll lock. The dialog never closes itself:
 * `onClose` asks, the owner sets `open`. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("ModalDialog").
 */
const panel = cva(
  [
    'flex max-h-full w-full flex-col overflow-hidden rounded-12',
    'border border-stroke-subtle bg-surface-base text-text-primary shadow-elevation-4',
  ],
  {
    variants: {
      size: {
        /* Size=Small — Figma 400. */
        small: 'max-w-sm',
        /* Size=Medium — Figma 560. */
        medium: 'max-w-xl',
        /* Size=Large — Figma 800. */
        large: 'max-w-3xl',
      },
    },
    defaultVariants: { size: 'small' },
  },
);

export type ModalDialogSize = 'small' | 'medium' | 'large';

export interface ModalDialogProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'role' | 'aria-modal' | 'aria-label' | 'aria-labelledby'> {
  /** Whether it is open. */
  open: boolean;
  /** Asked to close: the close button, Escape, a click on the backdrop. Set `open` to false. */
  onClose: () => void;
  /** Figma Title: the heading, and the dialog's accessible name. */
  title: React.ReactNode;
  /** Figma Description, under the title. */
  description?: React.ReactNode;
  /** Figma Show Description. Default: shown when there is a `description`. */
  showDescription?: boolean;
  /** Figma Show Footer. Default true; the footer shows when there is a `footer`. */
  showFooter?: boolean;
  /** The footer's actions, at its right end: usually a Text "Cancel" and a Default Button. */
  footer?: React.ReactNode;
  /** Figma Size: small (default), medium or large. */
  size?: ModalDialogSize;
  /** Where focus goes on open. Default: the dialog itself. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Figma Content: what the dialog holds. */
  children?: React.ReactNode;
}

export const ModalDialog = React.forwardRef<HTMLDivElement, ModalDialogProps>(function ModalDialog(
  {
    open,
    onClose,
    title,
    description,
    showDescription,
    showFooter = true,
    footer,
    size = 'small',
    initialFocusRef,
    className,
    children,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const id = React.useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const hasDescription = (showDescription ?? true) && description !== undefined && description !== null && description !== '';
  const hasFooter = showFooter && footer !== undefined && footer !== null && footer !== false;

  return (
    <Overlay
      {...props}
      ref={ref}
      open={open}
      onClose={onClose}
      placement="center"
      initialFocusRef={initialFocusRef}
      aria-labelledby={titleId}
      aria-describedby={[hasDescription ? descriptionId : null, describedBy].filter(Boolean).join(' ') || undefined}
      data-size={size}
      className={cn(panel({ size }), className)}
    >
      <OverlayHeader
        title={title}
        titleId={titleId}
        description={hasDescription ? description : undefined}
        descriptionId={descriptionId}
        onClose={onClose}
      />
      <OverlayBody>{children}</OverlayBody>
      {hasFooter && <OverlayFooter>{footer}</OverlayFooter>}
    </Overlay>
  );
});
ModalDialog.displayName = 'ModalDialog';

export const MODAL_DIALOG_SIZES = ['small', 'medium', 'large'] as const;
