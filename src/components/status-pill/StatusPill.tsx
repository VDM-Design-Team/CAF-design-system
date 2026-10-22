import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * StatusPill — built from the CAF Figma library, page "Tags": `Status Pill`
 * (Status), the filled pill in the Costs and Recurring Costs tables
 * ("Pending", "Recurring", "Active"). For a tonal tag with an icon, use Tag.
 *
 * Figma → code:
 * - Status → `status`: pending (default) or active.
 * - Label  → `children`.
 *
 * It is plain text, not a control: it has no states. Every colour is the
 * semantic variable the Figma layer is bound to, including Pending's label,
 * which Figma binds to accent.warning (see docs/figma-sync.md). Where code
 * departs from Figma, the reason is in docs/figma-sync.md ("StatusPill").
 */
const pill = cva('inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-caption-md-semibold', {
  variants: {
    status: {
      /* Status=Pending — accent.pending filled surface; the label is bound to accent.warning's content. */
      pending: 'bg-accent-pending-filled-surface-default text-accent-warning-filled-content-default',
      /* Status=Active — action.primary, as on the Default button. */
      active: 'bg-action-primary-surface-default text-action-primary-content-default',
    },
  },
  defaultVariants: { status: 'pending' },
});

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Figma Status: Pending (default) or Active. */
  status?: 'pending' | 'active';
}

export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, status, ...props }, ref) => (
    <span ref={ref} className={cn(pill({ status }), className)} {...props} />
  ),
);
StatusPill.displayName = 'StatusPill';

export const STATUS_PILL_STATUSES = ['pending', 'active'] as const;
