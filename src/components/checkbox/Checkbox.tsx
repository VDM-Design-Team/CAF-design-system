import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Checkbox — built from the CAF Figma library, page "Selection Controls":
 * `Checkbox` (State × Size).
 *
 * Figma → code:
 * - Size  → `size`: 16 or 20 (Figma's 16px / 20px).
 * - State → the native checkbox's own state:
 *   Deselected = unchecked, Selected = `checked`, Mixed-State =
 *   `indeterminate` (a DOM property, set from the prop), Hover = `:hover`
 *   on an unchecked box (Figma defines Hover only for Deselected), Focus =
 *   `:focus-visible`, Disabled and Disabled Selected = `disabled`.
 * - Every state has one radius, radius/4. A checked box has no border.
 * - `aria-invalid` on an unchecked box draws the critical border that
 *   Form / Checkbox Field's State=Error gives its box (CheckboxField's
 *   `error` sets it).
 *
 * It is a real `<input type="checkbox">`, so it works with forms, labels,
 * the keyboard and screen readers ("mixed" included). Give it a label: a
 * wrapping or `htmlFor` `<label>`, or `aria-label`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. The
 * check and the mixed bar are Figma's vectors, drawn in the box's own
 * coordinates and coloured with currentColor. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("Checkbox").
 */

/* Figma's glyph geometry per size, in that size's 16 / 20 unit box. */
const GLYPH = {
  16: { check: 'M3.5 8L6.3125 11.5L12.5 4.5', checkWidth: 1.5, bar: { x: 4, y: 7, width: 8, height: 2 } },
  20: { check: 'M4.5 10L8.075 14L15.5 6', checkWidth: 2, bar: { x: 5, y: 9, width: 10, height: 2 } },
} as const;

const box = [
  'peer size-full shrink-0 cursor-pointer appearance-none',
  /* State=Deselected: surface.base fill, a 1px stroke.field border; radius/4 in every state. */
  'rounded-4 border border-stroke-field bg-surface-base',
  /* State=Hover — defined for an unchecked box only: stroke.stronger. */
  'not-checked:not-indeterminate:enabled:hover:border-stroke-stronger',
  /* State=Selected and Mixed-State: the action.primary fill, no border. */
  'checked:border-transparent checked:bg-action-primary-surface-default',
  'indeterminate:border-transparent indeterminate:bg-action-primary-surface-default',
  /* Invalid (Checkbox Field's State=Error): an unchecked, enabled box takes the inputs' critical border. */
  'not-checked:not-indeterminate:enabled:aria-invalid:border-accent-critical-outline-border-default',
  /* State=Focus: a 2px stroke.focused ring 2px outside the box (radius 8 at its outer edge). */
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  /* State=Disabled: the neutral disabled pair (Figma's Text Input Disabled). Disabled Selected (and a disabled
     Mixed-State, which Figma doesn't draw): surface.brand.medium, no border. */
  'disabled:cursor-not-allowed disabled:border-neutral-outline-border-disabled disabled:bg-neutral-tonal-surface-disabled',
  'disabled:checked:border-transparent disabled:checked:bg-surface-brand-medium',
  'disabled:indeterminate:border-transparent disabled:indeterminate:bg-surface-brand-medium',
];

/* The check and the bar: action.primary.content, and its disabled colour on a disabled box. */
const glyph =
  'pointer-events-none absolute inset-0 hidden size-full text-action-primary-content-default peer-disabled:text-action-primary-content-disabled';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Figma Size: 16px (default) or 20px. */
  size?: 16 | 20;
  /** Figma State=Mixed-State. Shown instead of the check while true. */
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, style, size = 16, indeterminate = false, ...props }, ref) => {
    const inner = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inner.current as HTMLInputElement);
    // `indeterminate` has no HTML attribute; it is only a DOM property. Set it
    // in a layout effect, before paint, so Mixed-State never flashes as unchecked.
    React.useLayoutEffect(() => {
      if (inner.current) inner.current.indeterminate = indeterminate;
    }, [indeterminate]);

    const g = GLYPH[size];
    return (
      <span className={cn('relative inline-flex shrink-0', size === 20 ? 'size-5' : 'size-4', className)} style={style}>
        <input ref={inner} type="checkbox" className={cn(box)} {...props} />
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          className={cn(glyph, 'peer-checked:block peer-indeterminate:hidden')}
        >
          <path d={g.check} stroke="currentColor" strokeWidth={g.checkWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg aria-hidden="true" viewBox={`0 0 ${size} ${size}`} className={cn(glyph, 'peer-indeterminate:block')}>
          <rect {...g.bar} rx={g.bar.height / 2} fill="currentColor" />
        </svg>
      </span>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export const CHECKBOX_SIZES = [16, 20] as const;
