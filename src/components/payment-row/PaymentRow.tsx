import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';

/**
 * PaymentRow — built from the CAF Figma library, page "Modals":
 * `Modal / Payment Row` (Status, Date, Subtitle), one payment in the Payment
 * Schedules modal (Recurring Costs → View Schedules): a round status icon, the
 * date over a subtitle, and a status badge.
 *
 * Figma → code:
 * - Status   → `status`: done (default) or upcoming.
 * - Date     → `date`: Body/sm-regular, `text.primary`.
 * - Subtitle → `subtitle`: Caption/md-regular; `text.subtle` when Done,
 *   `accent.warning.tonal.content.default` when Upcoming, as Figma binds them.
 * - The frame: horizontal, centred, 12px gap; padding raw 13 → 12
 *   (`space/12`); radius 8 (raw) → `rounded-8`; fill `surface.canvas`; a 1px
 *   inside stroke, `accent.success.outline.border.default` (Done) or
 *   `accent.warning.outline.border.default` (Upcoming) → `inset-ring`.
 *   Fixed 460×62 → fills its container and hugs its content (60 tall).
 * - `Modal / Status Icon` (Status) → a 36px circle, `rounded-full`, on the
 *   status's tonal surface, with a 24px CheckCircle (Done) or Clock (Upcoming).
 *   Figma fills the glyphs with raw colours (#31C48D, #FBBF24: 2.03 and 1.55
 *   on their circles in Light); code uses the tonal content colour the same
 *   fill pairs with in Tag. The icon is decorative: the badge says the status.
 * - `Modal / Status Badge` (Status) → "Done" or "Upcoming": Caption/md-regular
 *   on the status's tonal surface and content, `rounded-full`, padding 2 / 8.
 *
 * Status Icon and Status Badge are only ever placed in this row, so they live
 * here rather than as components of their own. Tag has the same tonal pairs
 * but a larger look (Label/sm-medium, 4 / 12 padding, an icon), so it isn't
 * reused. Every colour is the semantic variable the Figma layer is bound to.
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("PaymentRow").
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

/* Modal / Status Badge: the same tonal pair as the icon, Caption/md-regular. */
const badge = cva('shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-caption-md-regular', {
  variants: {
    status: {
      done: 'bg-accent-success-tonal-surface-default text-accent-success-tonal-content-default',
      upcoming: 'bg-accent-warning-tonal-surface-default text-accent-warning-tonal-content-default',
    },
  },
  defaultVariants: { status: 'done' },
});

export type PaymentRowStatus = 'done' | 'upcoming';

const ICON: Record<PaymentRowStatus, IconName> = { done: 'check-circle', upcoming: 'clock' };
/* The badge's text in each Figma variant. */
const LABEL: Record<PaymentRowStatus, string> = { done: 'Done', upcoming: 'Upcoming' };

export interface PaymentRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma Status: done (default) or upcoming. */
  status?: PaymentRowStatus;
  /** Figma Date ("September 1, 2026"). */
  date: React.ReactNode;
  /** Figma Subtitle ("Processed on Sep 1, 2026", "Scheduled"). */
  subtitle: React.ReactNode;
}

export const PaymentRow = React.forwardRef<HTMLDivElement, PaymentRowProps>(function PaymentRow(
  { status = 'done', date, subtitle, className, ...props },
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
      <span data-part="status-badge" className={badge({ status })}>
        {LABEL[status]}
      </span>
    </div>
  );
});
PaymentRow.displayName = 'PaymentRow';

export const PAYMENT_ROW_STATUSES = ['done', 'upcoming'] as const;
