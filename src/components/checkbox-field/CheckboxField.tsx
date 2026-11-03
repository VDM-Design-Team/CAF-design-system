import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Checkbox, type CheckboxProps } from '../checkbox';
import { joinIds } from '../form-field/useFormField';

/**
 * CheckboxField — built from the CAF Figma library, page "Selection
 * Controls": `Form / Checkbox Field` (Checked × Bordered × State, with
 * Required), a Checkbox with a label and an optional description beside it
 * (Add New User's "Restricted User").
 *
 * Figma → code:
 * - Checkbox → a 16px Checkbox, top-aligned with the text, 12px before it
 *   (space/12).
 * - Label → `label`: Body/sm-semibold in text/primary.
 * - Required → `required`: the native `required`, and the "*" marker after
 *   the label (accent/critical/tonal/content, 2px after it).
 * - Show Description + Description → `description`: Caption/md-regular in
 *   text/secondary, 2px under the label (space/2).
 * - Checked → the checkbox's `checked` (or `defaultChecked`).
 * - Bordered=true → `bordered`: a card with 16px padding, radius 8 and a 1px
 *   stroke/default stroke inside the edge, stroke/focused while checked.
 * - State=Error → `error`: the message under the description (2px), the
 *   checkbox `aria-invalid` and, while unchecked, its border critical; a
 *   Bordered card's stroke is accent/critical/outline/border in both.
 * - State=Disabled → `disabled` (the native attribute, or a disabled
 *   fieldset): the Checkbox's Disabled look; label, marker and description in
 *   text/disabled; a Bordered card in neutral/outline/border/disabled.
 *
 * The whole field is a `<label>`, so a click anywhere on it (the card, when
 * bordered) toggles the box. The label text is the checkbox's accessible
 * name (`aria-labelledby`); the description and the error describe it
 * (`aria-describedby`).
 *
 * Every other prop, and the ref, go to the `<input>`: `name`, `value`,
 * `checked` / `defaultChecked` / `onChange`, `disabled`, `required`. `id` is
 * the input's; `className` styles the field. In a form it submits `name` =
 * `value` ("on" by default) while checked.
 *
 * Every colour is the semantic variable the Figma layer is bound to. The
 * error message has the shared field message's style (FormHelperText's).
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("CheckboxField").
 */
const field = cva(
  'group/checkbox-field flex w-full cursor-pointer items-start gap-3 has-disabled:cursor-not-allowed',
  {
    variants: {
      bordered: {
        false: '',
        /* Bordered=true: a card, stroke.default; disabled, neutral.outline.border.disabled. */
        true: 'rounded-8 p-4 inset-ring inset-ring-stroke-default has-disabled:inset-ring-neutral-outline-border-disabled',
      },
      invalid: { false: '', true: '' },
    },
    compoundVariants: [
      /* Checked=true turns the card's stroke stroke.focused. */
      { bordered: true, invalid: false, className: 'has-checked:inset-ring-stroke-focused' },
      /* State=Error: the card's stroke is accent.critical.outline, checked or not. */
      { bordered: true, invalid: true, className: 'inset-ring-accent-critical-outline-border-default' },
    ],
    defaultVariants: { bordered: false, invalid: false },
  },
);

/* State=Disabled: the text turns text.disabled (the field's own disabled input, or a disabled fieldset's). */
const disabledText = 'group-has-disabled/checkbox-field:text-text-disabled';

export interface CheckboxFieldProps extends Omit<CheckboxProps, 'size' | 'indeterminate' | 'className' | 'style'> {
  /** Figma Label: the text beside the box, which names it. */
  label: React.ReactNode;
  /** Figma Show Description + Description: the line under the label. */
  description?: React.ReactNode;
  /** Figma Bordered: wrap the field in a card. */
  bordered?: boolean;
  /** Figma State=Error and its Error text: the message under the description. Makes the checkbox `aria-invalid`. */
  error?: React.ReactNode;
  /** Styles the field (the `<label>`). */
  className?: string;
  style?: React.CSSProperties;
}

const shows = (node: React.ReactNode) => node !== undefined && node !== null && node !== false && node !== '';

export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(function CheckboxField(
  { label, description, bordered = false, error, required, className, style, 'aria-describedby': describedBy, ...input },
  ref,
) {
  const uid = React.useId();
  const labelId = `${uid}-label`;
  const descriptionId = shows(description) ? `${uid}-description` : undefined;
  const invalid = shows(error);
  const errorId = invalid ? `${uid}-error` : undefined;
  return (
    <label className={cn(field({ bordered, invalid }), className)} style={style}>
      {/* 2px down: the 16px box centred on the label's first 20px line (Figma: top-aligned on Inter's 17px line). */}
      <Checkbox
        ref={ref}
        className="mt-0.5"
        required={required}
        aria-labelledby={labelId}
        aria-describedby={joinIds(descriptionId, errorId, describedBy)}
        aria-invalid={invalid || undefined}
        {...input}
      />
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
    </label>
  );
});
CheckboxField.displayName = 'CheckboxField';
