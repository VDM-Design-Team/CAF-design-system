import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * StatusPill — the tonal pill for a row's status in the Costs, Recurring
 * Costs and Announcements tables. For a tonal tag with an icon, use Tag.
 *
 * - `status`: pending (default), active, approved, paid, rejected, stopped,
 *   inactive, payment-rejected or waiting. Approved is the cost status the
 *   new design calls "To be paid". Payment rejected and Waiting ("Waiting on
 *   you", "New") are new with the CAF design refresh.
 * - The label → `children`.
 *
 * It is plain text, not a control: it has no states. Each status is a
 * semantic pair, per the colour decisions of 23 Nov 2026: the DS tonal pairs
 * (Pending orange, Approved info blue, Paid and Active green, Rejected red,
 * Stopped and Inactive neutral), an outlined red for Payment rejected and
 * the inverted neutral for Waiting. Until 1.2.0 the pills were filled.
 */
const pill = cva('inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-caption-md-semibold', {
  variants: {
    status: {
      pending: 'bg-accent-pending-tonal-surface-default text-accent-pending-tonal-content-default',
      /* A running recurring cost: success, as Paid. */
      active: 'bg-accent-success-tonal-surface-default text-accent-success-tonal-content-default',
      approved: 'bg-accent-info-tonal-surface-default text-accent-info-tonal-content-default',
      paid: 'bg-accent-success-tonal-surface-default text-accent-success-tonal-content-default',
      rejected: 'bg-accent-critical-tonal-surface-default text-accent-critical-tonal-content-default',
      stopped: 'bg-neutral-tonal-surface-default text-neutral-tonal-content-default',
      inactive: 'bg-neutral-tonal-surface-default text-neutral-tonal-content-default',
      /* The payment bounced after approval: an outline, so it reads apart from Rejected. The 1px border sits
         inside the pill's padding (py-1 less 1px each side would change its height, so it is an inset ring). */
      'payment-rejected': [
        'bg-accent-critical-soft-outline-surface-default text-accent-critical-soft-outline-content-default',
        'ring-1 ring-inset ring-accent-critical-soft-outline-border-default',
      ],
      /* Needs the viewer's action: the one solid pill. */
      waiting: 'bg-neutral-inverted-surface-default text-neutral-inverted-content-default',
    },
  },
  defaultVariants: { status: 'pending' },
});

export type StatusPillStatus =
  | 'pending'
  | 'active'
  | 'approved'
  | 'paid'
  | 'rejected'
  | 'stopped'
  | 'inactive'
  | 'payment-rejected'
  | 'waiting';

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Pending (default), Active, Approved ("To be paid"), Paid, Rejected, Stopped, Inactive, Payment rejected or Waiting. */
  status?: StatusPillStatus;
}

export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, status, ...props }, ref) => (
    <span ref={ref} className={cn(pill({ status }), className)} {...props} />
  ),
);
StatusPill.displayName = 'StatusPill';

export const STATUS_PILL_STATUSES: readonly StatusPillStatus[] = [
  'pending',
  'active',
  'approved',
  'paid',
  'rejected',
  'stopped',
  'inactive',
  'payment-rejected',
  'waiting',
];
