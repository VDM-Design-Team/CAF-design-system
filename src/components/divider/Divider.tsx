import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Divider — built from the CAF Figma library, page "Layout": `Divider`
 * (Orientation), a plain 1px rule in stroke.subtle.
 *
 * Figma → code:
 * - Orientation → `orientation`: horizontal (default; full width, between
 *   page regions) or vertical (1 × 32, e.g. between a page's title and its
 *   tabs).
 *
 * It is a `role="separator"`. A purely visual rule, such as the one inside
 * PageHeader, takes `aria-hidden`. Where code departs from Figma, the reason is
 * in docs/figma-sync.md ("Divider").
 */
const rule = cva('shrink-0 border-0 border-stroke-subtle', {
  variants: {
    orientation: {
      /* Orientation=Horizontal: a 1px top stroke, the width of its container. */
      horizontal: 'h-0 w-full border-t',
      /* Orientation=Vertical: 1 × 32, a 1px left stroke. */
      vertical: 'h-8 w-0 self-center border-l',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Figma Orientation: Horizontal (default) or Vertical. */
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = 'horizontal', className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cn(rule({ orientation }), className)}
      {...props}
    />
  ),
);
Divider.displayName = 'Divider';
