import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';

/**
 * Tag — built from the CAF Figma library, page "Tags": `Tag` (Status ×
 * Show Icon), the tonal status tag with an optional icon (Exports' Completed
 * / Failed, Costs' Deleted / Updated, Announcements' versions). For the
 * filled pill in the Costs tables, use StatusPill.
 *
 * Figma → code:
 * - Status    → `status`: pending (default), active, completed, error,
 *   warning, info or neutral. It sets the colours and the icon.
 * - Show Icon → `showIcon` (default true, as in Figma).
 * - The label → `children`. Figma's text isn't a property, but the screens
 *   override it ("Deleted", "Excel", "v2.5.6"), so the label is yours.
 *
 * It is plain text, not a control: it has no states, and its icon is
 * decorative (the label says the status). Every colour is the semantic
 * variable the Figma layer is bound to. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("Tag").
 */
const tag = cva('inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-label-sm-medium', {
  variants: {
    status: {
      /* Each Status: accent.<x>.tonal surface, and its content for the label and icon. */
      pending: 'bg-accent-pending-tonal-surface-default text-accent-pending-tonal-content-default',
      active: 'bg-accent-info-tonal-surface-default text-accent-info-tonal-content-default',
      completed: 'bg-accent-success-tonal-surface-default text-accent-success-tonal-content-default',
      error: 'bg-accent-critical-tonal-surface-default text-accent-critical-tonal-content-default',
      warning: 'bg-accent-warning-tonal-surface-default text-accent-warning-tonal-content-default',
      info: 'bg-accent-info-tonal-surface-default text-accent-info-tonal-content-default',
      neutral: 'bg-neutral-tonal-surface-default text-neutral-tonal-content-default',
    },
  },
  defaultVariants: { status: 'pending' },
});

export type TagStatus = 'pending' | 'active' | 'completed' | 'error' | 'warning' | 'info' | 'neutral';

/* Figma's icon per Status. Active's is Phosphor `lightning`; Figma's is a Heroicons bolt (docs/figma-sync.md). */
const ICON: Record<TagStatus, IconName> = {
  pending: 'clock',
  active: 'lightning',
  completed: 'check-circle',
  error: 'x-circle',
  warning: 'warning',
  info: 'info',
  neutral: 'minus-circle',
};

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Figma Status. Default pending. */
  status?: TagStatus;
  /** Figma Show Icon. Default true. */
  showIcon?: boolean;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, status = 'pending', showIcon = true, children, ...props }, ref) => (
    <span ref={ref} className={cn(tag({ status }), className)} {...props}>
      {showIcon && <Icon name={ICON[status]} size={16} />}
      {children}
    </span>
  ),
);
Tag.displayName = 'Tag';

export const TAG_STATUSES = ['pending', 'active', 'completed', 'error', 'warning', 'info', 'neutral'] as const;
