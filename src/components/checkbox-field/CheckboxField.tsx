import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Checkbox, type CheckboxProps } from '../checkbox';
import { joinIds } from '../form-field/useFormField';

/**
 * CheckboxField — built from the CAF Figma library, page "Selection
 * Controls": `Form / Checkbox Field` (Checked × Bordered), a Checkbox with a
 * label and an optional description beside it (Add New User's "Restricted
 * User").
 *
 * Figma → code:
 * - Checkbox → a 16px Checkbox, top-aligned with the text, 12px before it
 *   (Figma: raw 12 → space/12).
 * - Label → `label`: Body/sm-semibold in text/primary.
 * - Show Description + Description → `description`: Caption/md-regular in
 *   text/secondary, 2px under the label (Figma: raw 2 → space/2).
 * - Checked → the checkbox's `checked` (or `defaultChecked`).
 * - Bordered=true → `bordered`: a card with 16px padding, radius 8 and a 1px
 *   stroke/default stroke inside the edge, stroke/focused while checked.
 *
 * The whole field is a `<label>`, so a click anywhere on it (the card, when
 * bordered) toggles the box. The label text is the checkbox's accessible
 * name (`aria-labelledby`) and the description its `aria-describedby`.
 * `required` sets the native `required` and adds _Form Label's marker
 * after the label (Figma's field has no Required).
 *
 * Every other prop, and the ref, go to the `<input>`: `name`, `value`,
 * `checked` / `defaultChecked` / `onChange`, `disabled`, `required`. `id` is
 * the input's; `className` styles the field. In a form it submits `name` =
 * `value` ("on" by default) while checked.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("CheckboxField").
 */
const field = cva('flex w-full cursor-pointer items-start gap-3 has-disabled:cursor-not-allowed', {
  variants: {
    bordered: {
      false: '',
      /* Bordered=true: a card, stroke.default; Checked=true turns the stroke stroke.focused. */
      true: 'rounded-8 p-4 inset-ring inset-ring-stroke-default has-checked:inset-ring-stroke-focused',
    },
  },
  defaultVariants: { bordered: false },
});

export interface CheckboxFieldProps extends Omit<CheckboxProps, 'size' | 'indeterminate' | 'className' | 'style'> {
  /** Figma Label: the text beside the box, which names it. */
  label: React.ReactNode;
  /** Figma Show Description + Description: the line under the label. */
  description?: React.ReactNode;
  /** Figma Bordered: wrap the field in a card. */
  bordered?: boolean;
  /** Styles the field (the `<label>`). */
  className?: string;
  style?: React.CSSProperties;
}

const shows = (node: React.ReactNode) => node !== undefined && node !== null && node !== false && node !== '';

export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(function CheckboxField(
  { label, description, bordered = false, required, className, style, 'aria-describedby': describedBy, ...input },
  ref,
) {
  const uid = React.useId();
  const labelId = `${uid}-label`;
  const descriptionId = shows(description) ? `${uid}-description` : undefined;
  return (
    <label className={cn(field({ bordered }), className)} style={style}>
      {/* 2px down: the 16px box centred on the label's first 20px line (Figma: top-aligned on Inter's 17px line). */}
      <Checkbox
        ref={ref}
        className="mt-0.5"
        required={required}
        aria-labelledby={labelId}
        aria-describedby={joinIds(descriptionId, describedBy)}
        {...input}
      />
      {/* Text: label over description, 2px apart, filling the row. */}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id={labelId} className="text-body-sm-semibold text-text-primary">
          {label}
          {required && (
            <span aria-hidden="true" className="ms-0.5 text-accent-critical-tonal-content-default">
              *
            </span>
          )}
        </span>
        {descriptionId && (
          <span id={descriptionId} className="text-caption-md-regular text-text-secondary">
            {description}
          </span>
        )}
      </span>
    </label>
  );
});
CheckboxField.displayName = 'CheckboxField';
