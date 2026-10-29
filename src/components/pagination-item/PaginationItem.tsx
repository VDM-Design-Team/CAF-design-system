import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * PaginationItem — built from the CAF Figma library, page "Pagination":
 * `Pagination / Item` (State, with a Page label), one control in a
 * pagination bar: a page number or the ‹ / › arrows. Use it through
 * Pagination, which also draws the … gap.
 *
 * Figma → code:
 * - State=Default  → the button as it is.
 * - State=Selected → `selected`: the current page (`aria-current="page"`).
 * - State=Disabled → the native `disabled` attribute (‹ on the first page).
 * - Page           → `children`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md
 * ("PaginationItem").
 */
export const paginationItemVariants = cva(
  'inline-flex size-8 shrink-0 items-center justify-center rounded-6 text-body-sm-semibold',
  {
    variants: {
      selected: {
        /* State=Default: 1px inside stroke.subtle, text.primary. Disabled: text.disabled. */
        false: 'inset-ring inset-ring-stroke-subtle text-text-primary disabled:text-text-disabled',
        /* State=Selected: action.primary fill and its content colour, no stroke. */
        true: 'bg-action-primary-surface-default text-action-primary-content-default',
      },
    },
    defaultVariants: { selected: false },
  },
);

const interactive = [
  'cursor-pointer disabled:cursor-not-allowed',
  // Figma has no Hover or Focus state; the ring is stroke.focused, as on Button.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
];

export interface PaginationItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Figma State=Selected: this is the current page. */
  selected?: boolean;
}

export const PaginationItem = React.forwardRef<HTMLButtonElement, PaginationItemProps>(
  ({ className, selected = false, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-current={selected ? 'page' : undefined}
      className={cn(paginationItemVariants({ selected }), interactive, className)}
      {...props}
    />
  ),
);
PaginationItem.displayName = 'PaginationItem';
