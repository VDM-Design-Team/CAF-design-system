import * as React from 'react';
import { cn } from '../../lib/cn';
import { useFormFieldControl } from '../form-field';

/**
 * TextInput — built from the CAF Figma library, page "Form": `_Text Input`
 * (State, with a Value), the single-line field that forms and filters share.
 * Form / Field – Text puts it under a label; Filter / Field puts it in the
 * filter bar.
 *
 * Figma → code (it is a native `<input>`, so every state is the element's own):
 * - State=Default  → empty: the `placeholder` shows, in text/subtle.
 * - State=Filled   → a value (`value` or `defaultValue`), in text/primary.
 * - State=Focus    → `:focus`: a 2px stroke/focused stroke inside the edge.
 * - State=Error    → `aria-invalid`: the accent/critical/outline border.
 * - State=Disabled → the native `disabled` attribute.
 * - Value          → `placeholder` while empty, the value once filled.
 *
 * It fills its container's width, as the fields place it. Give it a name: a
 * `<label htmlFor>` (Form / Field does this) or `aria-label`. Inside a
 * FormField (TextField is one) it takes the field's id, message, error and
 * required from the field (`useFormFieldControl`); its own props win.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("TextInput").
 */
const textInputClasses = [
  /* Every state: surface.elevated-secondary fill, radius 8, Body/sm-regular,
     12px sides. Figma hugs 10px padding around Inter's auto line height (39px);
     code is 40px on GDL's 20px line height, with the text centred. */
  'h-10 w-full min-w-0 rounded-8 bg-surface-elevated-secondary px-3 text-body-sm-regular',
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
     whole field at 50% opacity (Figma's layer opacity, raw 0.5). */
  'disabled:cursor-not-allowed disabled:text-text-subtle disabled:opacity-50',
];

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>((ownProps, ref) => {
  const { className, type = 'text', ...props } = useFormFieldControl(ownProps);
  return <input ref={ref} type={type} className={cn(textInputClasses, className)} {...props} />;
});
TextInput.displayName = 'TextInput';
