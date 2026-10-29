import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Skeleton — built from the CAF Figma library, page "Feedback": `Skeleton`
 * (Shape), the loading placeholder that holds the shape of content until it
 * arrives.
 *
 * Figma → code:
 * - Shape → `shape`: line (default), circle or block.
 * - "Resize instances to match the content they replace" → `className`
 *   (`w-32`, `h-4`, `size-10` …). Line and Block fill their container's
 *   width by default; Circle is 32×32 and stays round at any size.
 *
 * The fill is the semantic variable the Figma layer is bound to,
 * neutral.tonal.surface.default. Figma's skeletons are static; code adds a
 * pulse, which is off under `prefers-reduced-motion`. A skeleton says
 * nothing to assistive tech (`aria-hidden`): mark the region that is loading
 * with `aria-busy` and say what is loading (a Spinner, or text). Where code
 * departs from Figma, the reason is in docs/figma-sync.md ("Skeleton").
 */
const skeleton = cva(
  [
    'block bg-neutral-tonal-surface-default',
    // Code adds the pulse (Figma's skeletons are static); none under prefers-reduced-motion.
    'motion-safe:animate-pulse',
  ],
  {
    variants: {
      shape: {
        /* Shape=Line — 12px high, radius 6. Figma's 240px width → the container's width. */
        line: 'h-3 w-full rounded-6',
        /* Shape=Circle — 32×32, radius 16 (half its size) → radius full, so it stays round when resized. */
        circle: 'size-8 shrink-0 rounded-full',
        /* Shape=Block — 80px high, radius 8. Figma's 240px width → the container's width. */
        block: 'h-20 w-full rounded-8',
      },
    },
    defaultVariants: { shape: 'line' },
  },
);

export interface SkeletonProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Figma Shape: line (default), circle or block. Size it with `className`. */
  shape?: 'line' | 'circle' | 'block';
}

/* A <span> (display: block), so it can stand in for text inside a paragraph, a button or a table cell. */
export const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(({ shape, className, ...props }, ref) => (
  <span ref={ref} aria-hidden="true" className={cn(skeleton({ shape }), className)} {...props} />
));
Skeleton.displayName = 'Skeleton';

export const SKELETON_SHAPES = ['line', 'circle', 'block'] as const;
