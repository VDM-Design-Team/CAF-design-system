import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Toggle — built from the CAF Figma library, page "Selection Controls":
 * `Toggle` (Checked × Disabled), the on/off switch, resized for the new CAF
 * design (Nov 2026): a 44 × 24 track and a 20px knob with a soft shadow. The
 * design draws 44 × 26; 26 isn't on GDL's scale, so it snaps to 24. Form / Toggle Field puts
 * it beside a label (ToggleField).
 *
 * Figma → code (it is a native `<input type="checkbox" role="switch">`, so
 * every state is the element's own):
 * - Checked=false → unchecked: the track in surface/track, the knob at the
 *   start.
 * - Checked=true  → `checked` (or `defaultChecked`): the track in
 *   action/primary/surface/default, the knob at the end.
 * - Disabled=true → the native `disabled` attribute: the track in
 *   surface/neutral/medium (off) or surface/brand/medium (on), the knob in
 *   action/primary/content/disabled.
 * - Knob → a 20px circle in action/primary/content/default with elevation 1,
 *   2px inside the 44 × 24 track.
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
  /* The track: 44 × 24, a pill (Figma: raw radius 10 → radius/full). The
     input itself, so the click target and the focus ring are the track. */
  'peer size-full cursor-pointer appearance-none rounded-full',
  /* Checked=false and Checked=true */
  'bg-surface-track checked:bg-action-primary-surface-default',
  /* Disabled=true: surface.neutral.medium off, surface.brand.medium on */
  'disabled:not-checked:bg-surface-neutral-medium disabled:checked:bg-surface-brand-medium',
  // Figma has no Focus state; the ring uses stroke.focused, as Button's and Checkbox's do.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  'disabled:cursor-not-allowed transition-colors',
];

/* The knob: 20px, 2px in from the track's edge (space/2), and 20px further
   along when checked (44 − 2 − 20 − 2). Disabled: action.primary.content.disabled. */
const knob = [
  'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-action-primary-content-default shadow-elevation-1',
  'transition-transform peer-checked:translate-x-5 peer-disabled:bg-action-primary-content-disabled',
];

export type ToggleProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'role' | 'size'>;

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(({ className, style, ...props }, ref) => (
  /* Forced colours (Windows High Contrast) would drop the track's and knob's fills and leave nothing
     visible, so the switch keeps its own colours there. */
  <span className={cn('relative inline-flex h-6 w-11 shrink-0 forced-color-adjust-none', className)} style={style}>
    <input ref={ref} type="checkbox" role="switch" className={cn(track)} {...props} />
    <span aria-hidden="true" className={cn(knob)} />
  </span>
));
Toggle.displayName = 'Toggle';
