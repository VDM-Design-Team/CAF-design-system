import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Button } from '../button';
import { Icon } from '../icon';
import { Overlay } from '../overlay';

/**
 * ModalConfirm — built from the CAF Figma library, page "Modals":
 * `Modal / Confirm` (Type × Title, Message), the confirmation for Approve,
 * Reject, Stop and Delete.
 *
 * Figma → code:
 * - Type → `type`: default or destructive. Default shows the info tile
 *   (`accent.info.tonal`, Info glyph) and a Default Button; Destructive the
 *   critical tile (`accent.critical.tonal`, Warning glyph) and a Destructive
 *   Button.
 * - Title → `title`: Body/lg-semibold, `text.primary`, the dialog's name.
 * - Message → `message`: Body/sm-regular, `text.secondary`; it describes the
 *   dialog, so screen readers read it on open.
 * - The two Button instances, whose labels Figma says to edit →
 *   `cancelLabel` (Text, default "Cancel") and `confirmLabel` (default
 *   "Confirm", or "Delete" when destructive). Cancel calls `onClose`; the
 *   other calls `onConfirm`.
 *
 * The panel: 24px padding, 20px between the message row and the actions,
 * `surface.base` fill, 1px `stroke.subtle` border, radius 12 and
 * `shadow-elevation-4`. Figma's 420 width has no scale value: code caps it at
 * 448 (`max-w-md`). The icon tile is 40×40, radius 20, 16px from the text.
 *
 * It is an `alertdialog`: the user has to answer. Focus opens on Cancel, the
 * safe answer. Escape and Cancel close it; a click on the backdrop doesn't
 * (Figma has no close button, and a stray click shouldn't count as an answer).
 * It never closes itself: the owner sets `open`, after acting on `onConfirm`.
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("ModalConfirm").
 */
const tile = cva('inline-flex size-10 shrink-0 items-center justify-center rounded-20', {
  variants: {
    type: {
      /* Type=Default — Info, accent.info.tonal. */
      default: 'bg-accent-info-tonal-surface-default text-accent-info-tonal-content-default',
      /* Type=Destructive — Warning, accent.critical.tonal. */
      destructive: 'bg-accent-critical-tonal-surface-default text-accent-critical-tonal-content-default',
    },
  },
  defaultVariants: { type: 'default' },
});

export type ModalConfirmType = 'default' | 'destructive';

export interface ModalConfirmProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'title' | 'role' | 'aria-modal' | 'aria-label' | 'aria-labelledby' | 'children'
  > {
  /** Whether it is open. */
  open: boolean;
  /** Asked to close: Cancel and Escape. Set `open` to false. */
  onClose: () => void;
  /** The confirming button calls it. Close the dialog there when the action is done. */
  onConfirm: () => void;
  /** Figma Title, e.g. "Delete cost center?". */
  title: React.ReactNode;
  /** Figma Message: what happens if the user confirms. */
  message: React.ReactNode;
  /** Figma Type: default or destructive. */
  type?: ModalConfirmType;
  /** The confirming button's label. Default "Confirm", or "Delete" when destructive. */
  confirmLabel?: React.ReactNode;
  /** The cancelling button's label. Default "Cancel". */
  cancelLabel?: React.ReactNode;
}

export const ModalConfirm = React.forwardRef<HTMLDivElement, ModalConfirmProps>(function ModalConfirm(
  {
    open,
    onClose,
    onConfirm,
    title,
    message,
    type = 'default',
    confirmLabel,
    cancelLabel = 'Cancel',
    className,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const id = React.useId();
  const titleId = `${id}-title`;
  const messageId = `${id}-message`;
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const destructive = type === 'destructive';

  return (
    <Overlay
      {...props}
      ref={ref}
      open={open}
      onClose={onClose}
      role="alertdialog"
      dismissible={false}
      placement="center"
      initialFocusRef={cancelRef}
      aria-labelledby={titleId}
      aria-describedby={[messageId, describedBy].filter(Boolean).join(' ')}
      data-type={type}
      className={cn(
        'flex max-h-full w-full max-w-md flex-col gap-5 overflow-y-auto rounded-12 p-6',
        'border border-stroke-subtle bg-surface-base text-text-primary shadow-elevation-4',
        className,
      )}
    >
      <div className="flex gap-4">
        <span className={tile({ type })} aria-hidden="true" data-part="icon">
          <Icon name={destructive ? 'warning' : 'info'} size={24} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 id={titleId} className="text-body-lg-semibold text-text-primary">
            {title}
          </h2>
          <p id={messageId} className="text-body-sm-regular text-text-secondary">
            {message}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button ref={cancelRef} variant="text" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>
          {confirmLabel ?? (destructive ? 'Delete' : 'Confirm')}
        </Button>
      </div>
    </Overlay>
  );
});
ModalConfirm.displayName = 'ModalConfirm';

export const MODAL_CONFIRM_TYPES = ['default', 'destructive'] as const;
