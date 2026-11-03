import * as React from 'react';
import { cn } from '../../lib/cn';
import { joinIds } from '../form-field/useFormField';
import { Toggle, type ToggleProps } from '../toggle';

/**
 * ToggleField — built from the CAF Figma library, page "Selection
 * Controls": `Form / Toggle Field` (Checked × State, with Required), a label
 * and an optional description with a Toggle after them (Create
 * Announcement's "Active").
 *
 * Figma → code:
 * - Label → `label`: Body/sm-semibold in text/primary.
 * - Required → `required`: the native `required` (the switch must be on),
 *   and the "*" marker after the label (accent/critical/tonal/content).
 * - Show Description + Description → `description`: Caption/md-regular in
 *   text/secondary, 2px under the label (space/2).
 * - Toggle → a Toggle at the row's end, 16px after the text (space/16),
 *   centred on it. The text fills the row.
 * - Checked → the toggle's `checked` (or `defaultChecked`).
 * - State=Error → `error`: the message under the description (2px) and the
 *   switch `aria-invalid`. The toggle itself has no error look.
 * - State=Disabled → `disabled` (the native attribute, or a disabled
 *   fieldset): the Toggle's Disabled look; label, marker and description in
 *   text/disabled.
 *
 * The whole field is a `<label>`, so a click on the text flips the switch.
 * The label text is the switch's accessible name (`aria-labelledby`); the
 * description and the error describe it (`aria-describedby`).
 *
 * Every other prop, and the ref, go to the `<input>`: `name`, `value`,
 * `checked` / `defaultChecked` / `onChange`, `disabled`. `id` is the
 * input's; `className` styles the field. In a form it submits `name` =
 * `value` ("on" by default) while on.
 *
 * Every colour is the semantic variable the Figma layer is bound to. The
 * error message has the shared field message's style (FormHelperText's).
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("ToggleField").
 */
export interface ToggleFieldProps extends Omit<ToggleProps, 'className' | 'style'> {
  /** Figma Label: the text before the switch, which names it. */
  label: React.ReactNode;
  /** Figma Show Description + Description: the line under the label. */
  description?: React.ReactNode;
  /** Figma State=Error and its Error text: the message under the description. Makes the switch `aria-invalid`. */
  error?: React.ReactNode;
  /** Styles the field (the `<label>`). */
  className?: string;
  style?: React.CSSProperties;
}

/* State=Disabled: the text turns text.disabled (the field's own disabled input, or a disabled fieldset's). */
const disabledText = 'group-has-disabled/toggle-field:text-text-disabled';

const shows = (node: React.ReactNode) => node !== undefined && node !== null && node !== false && node !== '';

export const ToggleField = React.forwardRef<HTMLInputElement, ToggleFieldProps>(function ToggleField(
  { label, description, error, required, className, style, 'aria-describedby': describedBy, ...input },
  ref,
) {
  const uid = React.useId();
  const labelId = `${uid}-label`;
  const descriptionId = shows(description) ? `${uid}-description` : undefined;
  const invalid = shows(error);
  const errorId = invalid ? `${uid}-error` : undefined;
  return (
    <label
      className={cn(
        'group/toggle-field flex w-full cursor-pointer items-center gap-4 has-disabled:cursor-not-allowed',
        className,
      )}
      style={style}
    >
      {/* Text: label over description (and the error), 2px apart, filling the row. */}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id={labelId} className={cn('text-body-sm-semibold text-text-primary', disabledText)}>
          {label}
          {required && (
            <span aria-hidden="true" className={cn('ms-0.5 text-accent-critical-tonal-content-default', disabledText)}>
              *
            </span>
          )}
        </span>
        {descriptionId && (
          <span id={descriptionId} className={cn('text-caption-md-regular text-text-secondary', disabledText)}>
            {description}
          </span>
        )}
        {/* The shared field message's style (FormHelperText), as a span: a <p> can't sit in a <label>. */}
        {errorId && (
          <span id={errorId} className="text-caption-md-regular text-text-subtle">
            {error}
          </span>
        )}
      </span>
      <Toggle
        ref={ref}
        required={required}
        aria-labelledby={labelId}
        aria-describedby={joinIds(descriptionId, errorId, describedBy)}
        aria-invalid={invalid || undefined}
        {...input}
      />
    </label>
  );
});
ToggleField.displayName = 'ToggleField';
