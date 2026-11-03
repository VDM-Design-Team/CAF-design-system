import * as React from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../icon';

/**
 * TableExpandButton — built from the CAF Figma library, page "Table":
 * `Table / Expand Button`, the caret button that opens a cost row to show
 * its breakdown.
 *
 * Figma → code (Expanded × State):
 * - Expanded → `expanded`: CaretDown when false, CaretUp when true
 *   (`Style=Regular, Size=20px`, drawn at 20px), and `aria-expanded`. Point
 *   `aria-controls` at the content it shows.
 * - State → the button's own state: Default; Hover (`:hover`, the fill moves
 *   to `neutral.tonal.surface.hover`); Focus (`:focus-visible`, a 2px
 *   `stroke.focused` ring 2px outside the button, as Figma's Focus Ring).
 *
 * It has no visible text, so `label` is required: it is the button's
 * accessible name ("Show details for cost 123456"). It stays the same when
 * the row opens; `aria-expanded` says the state. Every colour is the
 * semantic variable the Figma layer is bound to. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("TableExpandButton").
 */
const expandButton = [
  /* 28×28, radius 4 (Figma's remote `radius-2` is 4px; GDL radius.4); space/4 padding around the 20px glyph. */
  'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-4 p-1 transition-colors',
  /* neutral.tonal.surface.default fill, .hover on Hover; text.primary glyph. */
  'bg-neutral-tonal-surface-default text-text-primary enabled:hover:bg-neutral-tonal-surface-hover',
  /* Focus: Figma's Focus Ring is a 2px stroke.focused ring 2px outside the button, radius 8 at its outer edge. */
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  'disabled:cursor-not-allowed',
];

export interface TableExpandButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The button's accessible name, e.g. "Show details for cost 123456". Required: the button has no visible text. */
  label: string;
  /** Figma's Expanded: CaretUp and `aria-expanded="true"`. Default false. */
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
