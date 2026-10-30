import * as React from 'react';
import { cn } from '../../lib/cn';
import { type IconName } from '../icon';
import { ModalHeader } from '../modal-header';
import { Overlay } from '../overlay';
import { useScrollableTabStop } from '../overlay/Overlay';

/**
 * PaymentSchedules — built from the CAF Figma library, page "Modals":
 * `Modal / Payment Schedules`, the modal Recurring Costs' View Schedules opens
 * (pattern 03's "View" action, pattern U04): a `Modal / Header` over the list
 * of `Modal / Payment Row`s.
 *
 * Figma → code:
 * - The panel: fill `surface.base`, radius 12 (Figma: raw 12) → `rounded-12`,
 *   clips its content; no stroke and no shadow, as in Figma. Fixed 512 wide →
 *   `max-w-lg` (512), narrower on a small screen.
 * - The `Modal / Header` instance → ModalHeader, with its Title ("Payment
 *   Schedules") → `title`, its Description ("Upcoming and processed
 *   payments") → `description`, and its tile's glyph → `icon` (default
 *   `calendar-blank`). Close calls `onClose`.
 * - Rows Container: vertical, 8px gap, padding 0 / 24 / 24 / 24 (raw) →
 *   `gap-2 px-6 pb-6`. The Payment Row instances → `children`: one
 *   `<PaymentRow>` per payment. Code lists them in a `<ul>`, one `<li>` each.
 *
 * Behaviour comes from Overlay: a portal, `role="dialog"` named by the title
 * and described by the description, focus moved in and trapped, Escape (and a
 * backdrop click, unless `dismissible={false}`) asking `onClose`, the page
 * inert behind it, and focus back on the opener on close. When the rows are
 * taller than the viewport, the list scrolls and becomes a tab stop.
 *
 * Figma pins this modal to Dark; code follows the page's theme. Where code
 * departs from Figma, the reason is in docs/figma-sync.md ("PaymentSchedules").
 */
export interface PaymentSchedulesProps {
  /** Whether it is shown. */
  open: boolean;
  /** Asked to close: the close button, Escape, and a backdrop click when `dismissible`. */
  onClose: () => void;
  /** Modal / Header's Title. Default "Payment Schedules", as in Figma. */
  title?: React.ReactNode;
  /** Modal / Header's Description. Default "Upcoming and processed payments", as in Figma. */
  description?: React.ReactNode;
  /** The header tile's glyph. Default `calendar-blank`, as in Figma. */
  icon?: IconName;
  /** The Payment Row instances: one `<PaymentRow>` per payment. */
  children: React.ReactNode;
  /** A backdrop click asks to close. Default true. */
  dismissible?: boolean;
  /** Where focus goes on open. Default: the dialog. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Where focus goes on close. Default: whatever had focus when it opened. */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /** Merged onto the panel with `cn()`. */
  className?: string;
}

export const PaymentSchedules = React.forwardRef<HTMLDivElement, PaymentSchedulesProps>(function PaymentSchedules(
  {
    open,
    onClose,
    title = 'Payment Schedules',
    description = 'Upcoming and processed payments',
    icon,
    children,
    dismissible,
    initialFocusRef,
    returnFocusRef,
    className,
  },
  ref,
) {
  const id = React.useId();
  const titleId = `${id}-title`;
  const hasDescription = description !== undefined && description !== null && description !== '';
  const descriptionId = hasDescription ? `${id}-description` : undefined;
  return (
    <Overlay
      ref={ref}
      open={open}
      onClose={onClose}
      dismissible={dismissible}
      initialFocusRef={initialFocusRef}
      returnFocusRef={returnFocusRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn('flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-12 bg-surface-base', className)}
    >
      <ModalHeader
        title={title}
        description={hasDescription ? description : undefined}
        icon={icon}
        titleId={titleId}
        descriptionId={descriptionId}
        onClose={onClose}
      />
      <PaymentList>{children}</PaymentList>
    </Overlay>
  );
});
PaymentSchedules.displayName = 'PaymentSchedules';

/* Rows Container: the PaymentRows, one <li> each, 8px apart, 24px from the panel's sides and
   bottom. It scrolls when the rows are taller than the panel, and is then a tab stop, so the
   keyboard can scroll it. A component of its own, so it mounts with the open panel and measures
   itself there (the Overlay renders nothing until it has mounted). */
function PaymentList({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const tabIndex = useScrollableTabStop(ref, true);
  return (
    <div
      ref={ref}
      tabIndex={tabIndex}
      data-part="rows"
      className={cn(
        'min-h-0 overflow-y-auto overscroll-contain px-6 pb-6',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focused',
      )}
    >
      <ul className="flex flex-col gap-2">
        {React.Children.toArray(children).map((child, index) => (
          <li key={React.isValidElement(child) && child.key != null ? child.key : index}>{child}</li>
        ))}
      </ul>
    </div>
  );
}
