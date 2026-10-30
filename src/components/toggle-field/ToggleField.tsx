import * as React from 'react';
import { cn } from '../../lib/cn';
import { joinIds } from '../form-field/useFormField';
import { Toggle, type ToggleProps } from '../toggle';

/**
 * ToggleField — built from the CAF Figma library, page "Selection
 * Controls": `Form / Toggle Field` (Checked), a label and an optional
 * description with a Toggle after them (Create Announcement's "Active").
 *
 * Figma → code:
 * - Label → `label`: Body/sm-semibold in text/primary.
 * - Show Description + Description → `description`: Caption/md-regular in
 *   text/secondary, 2px under the label (Figma: raw 2 → space/2).
 * - Toggle → a Toggle at the row's end, 16px after the text (Figma: raw 16
 *   → space/16), centred on it. The text fills the row.
 * - Checked → the toggle's `checked` (or `defaultChecked`).
 *
 * The whole field is a `<label>`, so a click on the text flips the switch.
 * The label text is the switch's accessible name (`aria-labelledby`) and the
 * description its `aria-describedby`. `required` sets the native `required`
 * (the switch must be on) and adds _Form Label's marker after the label
 * (Figma's field has no Required).
 *
 * Every other prop, and the ref, go to the `<input>`: `name`, `value`,
 * `checked` / `defaultChecked` / `onChange`, `disabled`. `id` is the
 * input's; `className` styles the field. In a form it submits `name` =
 * `value` ("on" by default) while on.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("ToggleField").
 */
export interface ToggleFieldProps extends Omit<ToggleProps, 'className' | 'style'> {
  /** Figma Label: the text before the switch, which names it. */
  label: React.ReactNode;
  /** Figma Show Description + Description: the line under the label. */
  description?: React.ReactNode;
  /** Styles the field (the `<label>`). */
  className?: string;
  style?: React.CSSProperties;
}

const shows = (node: React.ReactNode) => node !== undefined && node !== null && node !== false && node !== '';

export const ToggleField = React.forwardRef<HTMLInputElement, ToggleFieldProps>(function ToggleField(
  { label, description, required, className, style, 'aria-describedby': describedBy, ...input },
  ref,
) {
  const uid = React.useId();
  const labelId = `${uid}-label`;
  const descriptionId = shows(description) ? `${uid}-description` : undefined;
  return (
    <label
      className={cn('flex w-full cursor-pointer items-center gap-4 has-disabled:cursor-not-allowed', className)}
      style={style}
    >
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
      <Toggle
        ref={ref}
        required={required}
        aria-labelledby={labelId}
        aria-describedby={joinIds(descriptionId, describedBy)}
        {...input}
      />
    </label>
  );
});
ToggleField.displayName = 'ToggleField';
