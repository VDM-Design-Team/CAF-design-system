import * as React from 'react';
import { cn } from '../../lib/cn';
import { RowActionsMenu } from '../row-actions-menu';

/**
 * BreakdownItem — built from the CAF Figma library, page "Cards":
 * `Card / Breakdown Item`, one breakdown line of a cost (the Edit Recurring
 * Cost side sheet, the review step of Form / New Cost): a title, the cost
 * center · nature · location, the period, the amount, and optional ••• actions.
 *
 * Figma → code:
 * - Title  → `title`: Body/sm-semibold, `text.primary`.
 * - Meta   → `meta`: Caption/md-regular, `text.secondary`.
 * - Period → `period`: Caption/md-regular, `text.subtle`.
 * - Amount → `amount`: Body/sm-semibold, `text.primary`, at the end.
 * - Show Actions, and its nested `Menu / Row Actions Button` → `actions`: the
 *   MenuItems of a RowActionsMenu (Ghost 32 •••, the menu below it). Leave it
 *   out to hide the •••. `actionsLabel` names the button; by default
 *   "Actions for <title>", so two items never share a name.
 * - The frame: horizontal, centred, 16px padding and gap (Figma: raw 16) →
 *   `p-4 gap-4`; radius 8 (raw) → `rounded-8`; fill `surface.neutral.faint`;
 *   a 1px `stroke.subtle` inside the edge → `inset-ring`.
 * - Details: vertical, 4px gap (raw) → `gap-1`, filling the width.
 * - Fixed 624 wide → fills its container.
 *
 * It is a plain `<div>`, not a heading or a landmark: the title's text style is
 * Body, not a heading. List several in a `<ul>`. Every colour is the semantic
 * variable the Figma layer is bound to. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("BreakdownItem").
 */
export interface BreakdownItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Figma Title ("Breakdown 1"). */
  title: React.ReactNode;
  /** Figma Meta: cost center · nature · location. */
  meta?: React.ReactNode;
  /** Figma Period ("2026-09-01 - 2026-09-30"). */
  period?: React.ReactNode;
  /** Figma Amount ("USD 900"). */
  amount: React.ReactNode;
  /** Figma Show Actions: the `<MenuItem>`s of the ••• menu. Leave it out to hide the button. */
  actions?: React.ReactNode;
  /** The ••• button's accessible name. Default "Actions for <title>" when the title is text. */
  actionsLabel?: string;
}

export const BreakdownItem = React.forwardRef<HTMLDivElement, BreakdownItemProps>(function BreakdownItem(
  { title, meta, period, amount, actions, actionsLabel, className, ...props },
  ref,
) {
  const label = actionsLabel ?? (typeof title === 'string' ? `Actions for ${title}` : 'Breakdown actions');
  const shown = (node: React.ReactNode) => node !== undefined && node !== null && node !== false && node !== '';
  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full items-center gap-4 rounded-8 bg-surface-neutral-faint p-4 inset-ring inset-ring-stroke-subtle',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-body-sm-semibold text-text-primary">{title}</span>
        {shown(meta) && <span className="text-caption-md-regular text-text-secondary">{meta}</span>}
        {shown(period) && <span className="text-caption-md-regular text-text-subtle">{period}</span>}
      </div>
      <span className="shrink-0 whitespace-nowrap text-body-sm-semibold text-text-primary">{amount}</span>
      {shown(actions) && <RowActionsMenu label={label}>{actions}</RowActionsMenu>}
    </div>
  );
});
BreakdownItem.displayName = 'BreakdownItem';
