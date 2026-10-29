import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Radio — built from the CAF Figma library, page "Selection Controls":
 * `Radio` (State), the single-choice control. Radio Option puts a label
 * beside it (RadioOption); Form / Radio Group lays the options out under a
 * label (RadioGroup).
 *
 * Figma → code (it is a native `<input type="radio">`, so every state is the
 * element's own):
 * - State=Deselected → unchecked: surface/elevated secondary fill, a 1px
 *   stroke/strong stroke inside the edge.
 * - State=Hover      → `:hover` on an unchecked, enabled radio: the stroke in
 *   stroke/focused. Figma defines Hover only for Deselected.
 * - State=Selected   → `checked`: a 2px action/primary/surface/default stroke
 *   and an 8px dot in the same colour.
 * - State=Disabled   → the native `disabled` attribute: the radio at Figma's
 *   50% layer opacity. Figma draws it unchecked; checked, it is Selected at 50%.
 *
 * Figma has no Focus. Code adds the 2px stroke/focused ring that Button and
 * Checkbox use, on `:focus-visible`. Radios that share a `name` are one
 * group: the browser moves between them with the arrow keys, and only the
 * checked one (or the first) is in the tab order.
 *
 * Give it a name: a `<label>` (RadioOption wraps it in one) or `aria-label`.
 * `className` styles the radio's wrapper; every other prop, and the ref, go
 * to the `<input>`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("Radio").
 */
const circle = [
  /* 20 × 20, a circle (Figma: raw radius 10 → radius/full). */
  'peer size-full cursor-pointer appearance-none rounded-full',
  /* State=Deselected */
  'bg-surface-elevated-secondary inset-ring inset-ring-stroke-strong',
  /* State=Hover — defined for an unchecked radio only */
  'not-checked:enabled:hover:inset-ring-stroke-focused',
  /* State=Selected: a 2px stroke; the dot is drawn over it (below) */
  'checked:inset-ring-2 checked:inset-ring-action-primary-surface-default',
  // Figma has no Focus state; the ring uses stroke.focused, as Button's and Checkbox's do.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  'disabled:cursor-not-allowed',
];

/* State=Selected's Dot: 8px, centred, action.primary.surface.default. */
const dot =
  'pointer-events-none absolute inset-0 m-auto hidden size-2 rounded-full bg-action-primary-surface-default peer-checked:block';

export type RadioProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>;

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(({ className, style, ...props }, ref) => (
  /* State=Disabled: Figma sets the whole radio to 50% opacity. Forced colours (Windows High Contrast) would
     drop the inside stroke (a box-shadow) and the dot's fill, so the radio keeps its own colours there. */
  <span
    className={cn('relative inline-flex size-5 shrink-0 forced-color-adjust-none has-disabled:opacity-50', className)}
    style={style}
  >
    <input ref={ref} type="radio" className={cn(circle)} {...props} />
    <span aria-hidden="true" className={dot} />
  </span>
));
Radio.displayName = 'Radio';
