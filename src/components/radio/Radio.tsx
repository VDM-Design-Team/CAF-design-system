import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Radio — built from the CAF Figma library, page "Selection Controls":
 * `Radio` (State), the single-choice control, restyled for the new CAF
 * design (Nov 2026): Selected is a thick ring around a hollow centre, not a
 * thin ring with a dot. Radio Option puts a label
 * beside it (RadioOption); Form / Radio Group lays the options out under a
 * label (RadioGroup).
 *
 * Figma → code (it is a native `<input type="radio">`, so every state is the
 * element's own):
 * - State=Deselected → unchecked: surface/elevated secondary fill, a 1px
 *   stroke/field stroke inside the edge.
 * - State=Hover      → `:hover` on an unchecked, enabled radio: the stroke in
 *   stroke/focused. Figma defines Hover only for Deselected.
 * - State=Selected   → `checked`: a 6px action/primary/surface/default stroke
 *   inside the edge, leaving an 8px centre in the radio's fill (the design's
 *   5.5px on 18px, scaled to 20).
 * - State=Error      → `aria-invalid` on an unchecked, enabled radio (an
 *   invalid Radio Group): the stroke in accent/critical/outline/border.
 * - State=Disabled   → the native `disabled` attribute: the neutral disabled
 *   pair, neutral/tonal/surface/disabled with a neutral/outline/border/disabled
 *   stroke. Checked, the 6px stroke is surface/brand/medium, as Checkbox's
 *   Disabled Selected.
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
  /* 20 × 20, a circle (radius/full). */
  'peer size-full cursor-pointer appearance-none rounded-full',
  /* State=Deselected */
  'bg-surface-elevated-secondary inset-ring inset-ring-stroke-field',
  /* State=Hover — defined for an unchecked radio only */
  'not-checked:enabled:hover:inset-ring-stroke-focused',
  /* State=Selected: a 6px stroke inside the edge; the 8px centre keeps the fill */
  'checked:inset-ring-6 checked:inset-ring-action-primary-surface-default',
  'transition-shadow',
  /* State=Error: an invalid, unchecked radio takes the inputs' critical stroke (it stays while hovered) */
  'not-checked:enabled:aria-invalid:inset-ring-accent-critical-outline-border-default',
  // Figma has no Focus state; the ring uses stroke.focused, as Button's and Checkbox's do.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  /* State=Disabled: the neutral disabled pair. Checked (not drawn in Figma): the stroke in surface.brand.medium */
  'disabled:cursor-not-allowed disabled:bg-neutral-tonal-surface-disabled disabled:inset-ring-neutral-outline-border-disabled',
  'disabled:checked:inset-ring-surface-brand-medium',
];

export type RadioProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>;

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(({ className, style, ...props }, ref) => (
  /* Forced colours (Windows High Contrast) would drop the inside stroke (a box-shadow), so the radio keeps
     its own colours there. */
  <span className={cn('relative inline-flex size-5 shrink-0 forced-color-adjust-none', className)} style={style}>
    <input ref={ref} type="radio" className={cn(circle)} {...props} />
  </span>
));
Radio.displayName = 'Radio';
