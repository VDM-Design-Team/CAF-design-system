import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * StatusPill — built from the CAF Figma library, page "Tags": `Status Pill`
 * (Status), the filled pill for a row's status in the Costs, Recurring Costs
 * and Announcements tables. For a tonal tag with an icon, use Tag.
 *
 * Figma → code:
 * - Status → `status`: pending (default), active, approved, paid, rejected,
 *   stopped or inactive. Approved, Paid and Rejected are the cost statuses
 *   (U01's blue, green and red, beside Pending's orange); Stopped is a
 *   recurring cost's, Inactive an announcement's (both neutral).
 * - Label  → `children`.
 *
 * It is plain text, not a control: it has no states. Every colour is the
 * semantic variable the Figma layer is bound to. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("StatusPill").
 */
const pill = cva('inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-caption-md-semibold', {
  variants: {
    status: {
      /* Status=Pending — accent.pending's filled pair. */
      pending: 'bg-accent-pending-filled-surface-default text-accent-pending-filled-content-default',
      /* Status=Active — action.primary, as on the Default button. */
      active: 'bg-action-primary-surface-default text-action-primary-content-default',
      /* Status=Approved, Paid, Rejected — the accent's filled pair: info (blue), success (green), critical (red). */
      approved: 'bg-accent-info-filled-surface-default text-accent-info-filled-content-default',
      paid: 'bg-accent-success-filled-surface-default text-accent-success-filled-content-default',
      rejected: 'bg-accent-critical-filled-surface-default text-accent-critical-filled-content-default',
      /* Status=Stopped, Inactive — neutral's filled pair. */
      stopped: 'bg-neutral-filled-surface-default text-neutral-filled-content-default',
      inactive: 'bg-neutral-filled-surface-default text-neutral-filled-content-default',
    },
  },
  defaultVariants: { status: 'pending' },
});

export type StatusPillStatus = 'pending' | 'active' | 'approved' | 'paid' | 'rejected' | 'stopped' | 'inactive';

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Figma Status: Pending (default), Active, Approved, Paid, Rejected, Stopped or Inactive. */
  status?: StatusPillStatus;
}

export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, status, ...props }, ref) => (
    <span ref={ref} className={cn(pill({ status }), className)} {...props} />
  ),
);
StatusPill.displayName = 'StatusPill';

export const STATUS_PILL_STATUSES: readonly StatusPillStatus[] = ['pending', 'active', 'approved', 'paid', 'rejected', 'stopped', 'inactive'];
