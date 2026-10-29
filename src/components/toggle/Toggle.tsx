import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Toggle — built from the CAF Figma library, page "Selection Controls":
 * `Toggle` (Checked × Disabled), the on/off switch. Form / Toggle Field puts
 * it beside a label (ToggleField).
 *
 * Figma → code (it is a native `<input type="checkbox" role="switch">`, so
 * every state is the element's own):
 * - Checked=false → unchecked: the track in neutral/tonal/surface/default,
 *   the knob at the start.
 * - Checked=true  → `checked` (or `defaultChecked`): the track in
 *   action/primary/surface/default, the knob at the end.
 * - Disabled=true → the native `disabled` attribute: the whole switch at
 *   Figma's 50% layer opacity.
 * - Knob → a 16px circle in action/primary/content/default, 2px inside the
 *   36 × 20 track.
 *
 * Figma has no Hover or Focus. Code adds the 2px stroke/focused ring that
 * Button and Checkbox use, on `:focus-visible`. Space toggles it, as any
 * checkbox; screen readers announce a switch, "on" or "off".
 *
 * In a form it submits like a checkbox: `name` = `value` ("on" by default)
 * while checked, nothing while off. Give it a name: a `<label>` (ToggleField
 * does this), `aria-labelledby` or `aria-label`. `className` styles the
 * switch's wrapper; every other prop, and the ref, go to the `<input>`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("Toggle").
 */
const track = [
  /* The track: 36 × 20, a pill (Figma: raw radius 10 → radius/full). The
     input itself, so the click target and the focus ring are the track. */
  'peer size-full cursor-pointer appearance-none rounded-full',
  /* Checked=false and Checked=true */
  'bg-neutral-tonal-surface-default checked:bg-action-primary-surface-default',
  // Figma has no Focus state; the ring uses stroke.focused, as Button's and Checkbox's do.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  'disabled:cursor-not-allowed',
];

/* The knob: 16px, 2px in from the track's edge (Figma: raw 2 padding), and
   16px further along when checked (36 − 2 − 16 − 2). */
const knob =
  'pointer-events-none absolute top-0.5 left-0.5 size-4 rounded-full bg-action-primary-content-default peer-checked:translate-x-4';

export type ToggleProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'role' | 'size'>;

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(({ className, style, ...props }, ref) => (
  /* Disabled=true: Figma sets the whole switch to 50% opacity. Forced colours (Windows High Contrast) would
     drop the track's and knob's fills and leave nothing visible, so the switch keeps its own colours there. */
  <span
    className={cn('relative inline-flex h-5 w-9 shrink-0 forced-color-adjust-none has-disabled:opacity-50', className)}
    style={style}
  >
    <input ref={ref} type="checkbox" role="switch" className={cn(track)} {...props} />
    <span aria-hidden="true" className={knob} />
  </span>
));
Toggle.displayName = 'Toggle';
