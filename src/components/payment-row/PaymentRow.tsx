import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';
import { Tag, type TagStatus } from '../tag';

/**
 * PaymentRow — built from the CAF Figma library, page "Modals":
 * `Modal / Payment Row` (Status, Date, Subtitle, Amount), one payment in the
 * Payment Schedules modal (Recurring Costs → View Schedules): a round status
 * icon, the date over a subtitle, the amount, and the status as a Tag.
 *
 * Figma → code:
 * - Status   → `status`: done (default) or upcoming.
 * - Date     → `date`: Body/sm-regular, `text.primary`.
 * - Subtitle → `subtitle`: Caption/md-regular; `text.subtle` when Done,
 *   `accent.warning.tonal.content.default` when Upcoming, as Figma binds them.
 * - Amount   → `amount` (since 3 Nov 2026; Figma's default "USD 900"):
 *   Body/sm-semibold, `text.primary`, on one line, between the text and the
 *   status. Left out, nothing renders for it.
 * - The frame: horizontal, centred, `space/12` gap and padding; `radius/8` →
 *   `rounded-8`; fill `surface.canvas`; a 1px inside stroke,
 *   `accent.success.outline.border.default` (Done) or
 *   `accent.warning.outline.border.default` (Upcoming) → `inset-ring`.
 *   Figma's 460 wide, hugging 60 tall → fills its container and hugs its
 *   content (60 tall).
 * - `Modal / Status Icon` (Status) → a 36px circle, `rounded-full`, on the
 *   status's tonal surface, with a 24px CheckCircle (Done) or Clock (Upcoming).
 *   Figma fills the glyphs with raw colours (#31C48D, #FBBF24: 2.03 and 1.55
 *   on their circles in Light); code uses the tonal content colour the same
 *   fill pairs with in Tag. The icon is decorative: the Tag says the status.
 * - Status (a Tag instance, Show Icon off, since 3 Nov 2026) → `<Tag>`:
 *   Status=Completed "Done" (Done) or Status=Warning "Upcoming" (Upcoming).
 *
 * Status Icon is only ever placed in this row, so it lives here rather than
 * as a component of its own. Every colour is the semantic variable the Figma
 * layer is bound to. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("PaymentRow").
 */
const row = cva('flex w-full items-center gap-3 rounded-8 bg-surface-canvas p-3 inset-ring', {
  variants: {
    status: {
      done: 'inset-ring-accent-success-outline-border-default',
      upcoming: 'inset-ring-accent-warning-outline-border-default',
    },
  },
  defaultVariants: { status: 'done' },
});

/* Modal / Status Icon: the status's tonal surface, and its content for the glyph. */
const statusIcon = cva('inline-flex size-9 shrink-0 items-center justify-center rounded-full', {
  variants: {
    status: {
      done: 'bg-accent-success-tonal-surface-default text-accent-success-tonal-content-default',
      upcoming: 'bg-accent-warning-tonal-surface-default text-accent-warning-tonal-content-default',
    },
  },
  defaultVariants: { status: 'done' },
});

/* Subtitle: text.subtle when Done, the warning content colour when Upcoming. */
const subtitleText = cva('text-caption-md-regular', {
  variants: {
    status: {
      done: 'text-text-subtle',
      upcoming: 'text-accent-warning-tonal-content-default',
    },
  },
  defaultVariants: { status: 'done' },
});

export type PaymentRowStatus = 'done' | 'upcoming';

const ICON: Record<PaymentRowStatus, IconName> = { done: 'check-circle', upcoming: 'clock' };
/* The Status Tag in each Figma variant: its Status and its label. */
const STATUS: Record<PaymentRowStatus, { tag: TagStatus; label: string }> = {
  done: { tag: 'completed', label: 'Done' },
  upcoming: { tag: 'warning', label: 'Upcoming' },
};

export interface PaymentRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma Status: done (default) or upcoming. */
  status?: PaymentRowStatus;
  /** Figma Date ("September 1, 2026"). */
  date: React.ReactNode;
  /** Figma Subtitle ("Processed on Sep 1, 2026", "Scheduled"). */
  subtitle: React.ReactNode;
  /** Figma Amount ("USD 900"). Left out, nothing renders for it. */
  amount?: React.ReactNode;
}

export const PaymentRow = React.forwardRef<HTMLDivElement, PaymentRowProps>(function PaymentRow(
  { status = 'done', date, subtitle, amount, className, ...props },
  ref,
) {
  return (
    <div ref={ref} data-status={status} className={cn(row({ status }), className)} {...props}>
      <span data-part="status-icon" aria-hidden="true" className={statusIcon({ status })}>
        <Icon name={ICON[status]} size={24} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-sm-regular text-text-primary">{date}</span>
        <span className={subtitleText({ status })}>{subtitle}</span>
      </div>
      {amount !== undefined && amount !== null && amount !== false && amount !== '' && (
        /* Amount: Body/sm-semibold, text.primary, on one line. */
        <span data-part="amount" className="shrink-0 whitespace-nowrap text-body-sm-semibold text-text-primary">
          {amount}
        </span>
      )}
      {/* Status: a Tag, Show Icon off. */}
      <Tag data-part="status" status={STATUS[status].tag} showIcon={false}>
        {STATUS[status].label}
      </Tag>
    </div>
  );
});
PaymentRow.displayName = 'PaymentRow';

export const PAYMENT_ROW_STATUSES = ['done', 'upcoming'] as const;
