import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * DescriptionList — built from the CAF Figma library, page "Cards":
 * `Description List` and its `Description List / Item`, the label and value
 * pairs of a record's details (Export Details; any read-only record).
 *
 * Figma → code:
 * - `Description List` → `<DescriptionList>`, a `<dl>`: two columns, 24px
 *   apart, rows 16px apart. Figma wraps fixed 220px items in a 464px frame;
 *   code keeps two equal columns, which are 220px at Figma's 464.
 * - `Description List / Item` → `<DescriptionListItem>`: its Label →
 *   `label` (a `<dt>`), its Value → `value` (a `<dd>`), the label above the
 *   value, 2px apart. The pair is wrapped in a `<div>`, as HTML allows in a
 *   `<dl>`.
 *
 * Values wrap, and a long one with no spaces (a file name) breaks, as in
 * Figma. Every colour and type style is the one the Figma layer is bound
 * to. Neither has a fill, border or states. Where code departs from Figma,
 * the reason is in docs/figma-sync.md ("DescriptionList").
 */
export type DescriptionListProps = React.HTMLAttributes<HTMLDListElement>;

export const DescriptionList = React.forwardRef<HTMLDListElement, DescriptionListProps>(
  ({ className, ...props }, ref) => (
    /* Two columns, gap 24 between them and 16 between rows. */
    <dl ref={ref} className={cn('grid grid-cols-2 gap-x-6 gap-y-4', className)} {...props} />
  ),
);
DescriptionList.displayName = 'DescriptionList';

export interface DescriptionListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma Label: what the value is, e.g. "File Size". */
  label: React.ReactNode;
  /** Figma Value, e.g. "253 B". */
  value: React.ReactNode;
}

export const DescriptionListItem = React.forwardRef<HTMLDivElement, DescriptionListItemProps>(
  ({ label, value, className, ...props }, ref) => (
    /* Vertical, gap 2. */
    <div ref={ref} className={cn('flex min-w-0 flex-col gap-0.5', className)} {...props}>
      {/* Label — Caption/md-regular, text.subtle. */}
      <dt className="text-caption-md-regular text-text-subtle">{label}</dt>
      {/* Value — Body/sm-medium, text.primary; fills the column and wraps. */}
      <dd className="text-body-sm-medium break-words text-text-primary">{value}</dd>
    </div>
  ),
);
DescriptionListItem.displayName = 'DescriptionListItem';
