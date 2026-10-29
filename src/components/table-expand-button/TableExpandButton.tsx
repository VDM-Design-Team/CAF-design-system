import * as React from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../icon';

/**
 * TableExpandButton — built from the CAF Figma library, page "Table":
 * `Table / Expand Button`, the caret button that opens a cost row to show
 * its breakdown.
 *
 * Figma → code:
 * - The component has no properties. Its Expanded look comes from
 *   `Table / Row – Cost` Expanded=true, which swaps the nested CaretDown for
 *   CaretUp. In code that is `expanded`: it swaps the caret and sets
 *   `aria-expanded`. Point `aria-controls` at the content it shows.
 * - The nested `CaretDown / Style=Regular, Size=20px` → Icon `caret-down`
 *   (`caret-up` when expanded), drawn at 20px as Figma renders it.
 *
 * It has no visible text, so `label` is required: it is the button's
 * accessible name ("Show details for cost 123456"). It stays the same when
 * the row opens; `aria-expanded` says the state. Every colour is the
 * semantic variable the Figma layer is bound to. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("TableExpandButton").
 */
const expandButton = [
  /* 28×28, radius 4 (Figma's remote `radius-2` is 4px; GDL radius.4). */
  'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-4',
  /* Figma's 6px padding sits around a 16px box the 20px glyph overflows; 4px fits the glyph as Figma renders it. */
  'p-1',
  /* neutral.tonal.surface.default fill; text.primary glyph. */
  'bg-neutral-tonal-surface-default text-text-primary',
  // Figma has no Focus state; the ring uses stroke.focused, as Button's does.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  'disabled:cursor-not-allowed',
];

export interface TableExpandButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The button's accessible name, e.g. "Show details for cost 123456". Required: the button has no visible text. */
  label: string;
  /** Figma's Expanded (on `Table / Row – Cost`): CaretUp and `aria-expanded="true"`. Default false. */
  expanded?: boolean;
}

export const TableExpandButton = React.forwardRef<HTMLButtonElement, TableExpandButtonProps>(
  ({ label, expanded = false, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-expanded={expanded}
      className={cn(expandButton, className)}
      {...props}
    >
      <Icon name={expanded ? 'caret-up' : 'caret-down'} size={20} />
    </button>
  ),
);
TableExpandButton.displayName = 'TableExpandButton';
