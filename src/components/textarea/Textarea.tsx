import * as React from 'react';
import { cn } from '../../lib/cn';
import { useFormFieldControl } from '../form-field';

/**
 * Textarea — built from the CAF Figma library, page "Form": `_Textarea`
 * (State, with a Value), the multi-line field for notes and reasons. Form /
 * Field – Textarea puts it under a label (Notes in Edit Recurring Cost,
 * Reason (optional) in Change Status). It looks like TextInput, taller.
 *
 * Figma → code (it is a native `<textarea>`, so every state is the element's own):
 * - State=Default  → empty: the `placeholder` shows, in text/subtle.
 * - State=Filled   → a value (`value` or `defaultValue`), in text/primary.
 * - State=Focus    → `:focus`: a 2px stroke/focused stroke inside the edge.
 * - State=Error    → `aria-invalid`: the accent/critical/outline border.
 * - State=Disabled → the native `disabled` attribute: Default's look at
 *   Figma's 50% layer opacity.
 * - Value          → `placeholder` while empty, the value once filled.
 * - The 96px height → `rows`, 4 by default: four 20px lines and 8px above and
 *   below make Figma's 96. Figma's note "Resize height as needed" → more
 *   `rows`, and the user can drag it taller (`resize-y`).
 *
 * It fills its container's width, as the field places it. Give it a name: a
 * `<label htmlFor>` (TextareaField does this) or `aria-label`. Inside a
 * FormField it takes the field's id, message, error and required from the
 * field (`useFormFieldControl`); its own props win.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("Textarea").
 */
const textareaClasses = [
  /* Every state: surface.elevated-secondary fill, radius 8, Body/sm-regular,
     12px sides. Figma pads raw 10 around Inter's auto line height (17px);
     code pads 8 around GDL's 20px line, which puts the first line's glyphs
     where Figma draws them. */
  'block w-full min-w-0 resize-y rounded-8 bg-surface-elevated-secondary px-3 py-2 text-body-sm-regular',
  /* State=Default and Filled: the value in text.primary, the placeholder in
     text.subtle, a 1px stroke.subtle stroke inside the edge. */
  'text-text-primary placeholder:text-text-subtle inset-ring inset-ring-stroke-subtle',
  /* State=Focus: a 2px stroke.focused stroke inside the edge. It replaces the
     browser's outline, which stays transparent so forced-colours mode still shows one. */
  'outline-hidden focus:inset-ring-2 focus:inset-ring-stroke-focused',
  /* State=Error: the accent.critical.outline border. It keeps that colour while
     focused (Focus's 2px width), so the error stays visible as you type. */
  'aria-invalid:inset-ring-accent-critical-outline-border-default',
  /* State=Disabled: the value, like the placeholder, in text.subtle, and the
     whole field at 50% opacity (Figma's layer opacity, raw 0.5). It can't be resized. */
  'disabled:cursor-not-allowed disabled:resize-none disabled:text-text-subtle disabled:opacity-50',
];

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((ownProps, ref) => {
  const { className, rows = 4, ...props } = useFormFieldControl(ownProps);
  return <textarea ref={ref} rows={rows} className={cn(textareaClasses, className)} {...props} />;
});
Textarea.displayName = 'Textarea';
