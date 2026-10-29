import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Spinner — built from the CAF Figma library, page "Feedback": `Spinner`
 * (Size), the loading indicator (e.g. a dialog's body while its data loads).
 *
 * Figma → code:
 * - Size → `size`: 16 (default), 24 or 32.
 * - Track: an ellipse with a 75% inner radius (a ring an eighth of the size
 *   thick) in neutral.tonal.surface.default.
 * - Indicator: the same ring from 12 to 6 o'clock (the right half), in
 *   action.primary.surface.default.
 * - "Animate with a 360° rotation in prototypes" → it turns once a second
 *   (Tailwind's `animate-spin`), and stands still under
 *   `prefers-reduced-motion`.
 *
 * It is a `role="status"` live region with a visually hidden `label`
 * (default "Loading"): screen readers hear what is loading, sighted users
 * see the ring. Figma has no label; the ring is drawn as SVG strokes so it
 * scales with `size`. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("Spinner").
 */
const spinner = cva('inline-flex shrink-0', {
  variants: {
    size: { 16: 'size-4', 24: 'size-6', 32: 'size-8' },
  },
  defaultVariants: { size: 16 },
});

export interface SpinnerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Figma Size: 16 (default), 24 or 32. */
  size?: 16 | 24 | 32;
  /** What is loading, for screen readers only, e.g. "Loading export details". Default "Loading". */
  label?: string;
}

export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size = 16, label = 'Loading', className, ...props }, ref) => (
    <span ref={ref} role="status" className={cn(spinner({ size }), className)} {...props}>
      {/* A 16-unit box at every size: the ring is 2 units (an eighth) thick, centred on radius 7. */}
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" className="size-full motion-safe:animate-spin">
        {/* Track — the whole ring, neutral.tonal.surface.default. */}
        <circle cx="8" cy="8" r="7" strokeWidth="2" className="stroke-neutral-tonal-surface-default" />
        {/* Indicator — the right half, from 12 to 6 o'clock, action.primary.surface.default. */}
        <path d="M8 1a7 7 0 0 1 0 14" strokeWidth="2" className="stroke-action-primary-surface-default" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  ),
);
Spinner.displayName = 'Spinner';

export const SPINNER_SIZES = [16, 24, 32] as const;
