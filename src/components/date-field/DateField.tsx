import * as React from 'react';
import { DateInput, type DateInputProps } from '../date-input';
import { FormField, type FormFieldProps } from '../form-field';

/**
 * DateField — built from the CAF Figma library, page "Form":
 * `Form / Field – Date`, a labelled date picker (Starts At and Ends At in
 * Edit Recurring Cost, Period From and Period To in Cost Breakdown, Release
 * Date in Create Announcement). It is FormField around a DateInput, which
 * opens the Calendar, as Figma's description pairs them.
 *
 * Figma → code:
 * - _Form Label's Label and Required → `label`, `required`.
 * - _Date Input's Value and State → the DateInput: `value` / `defaultValue` /
 *   `onValueChange` as `yyyy-mm-dd` (Filled), `placeholder` (Default),
 *   keyboard focus (Focus), the calendar showing (Open), `disabled`. Error is
 *   `error` (below).
 * - Show Helper + Helper → `helper`; the error message in the Helper → `error`,
 *   which also makes the field `aria-invalid`.
 *
 * Every other prop goes to the DateInput, and so does the ref (its button).
 * `name` submits the chosen date as `yyyy-mm-dd`. `id` is the button's (the
 * label points at it); `className` styles the field. `required` shows the
 * marker and sets `aria-required`; check it on submit.
 *
 * The bindings are FormField's and DateInput's. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("DateField").
 */
export interface DateFieldProps
  extends
    Omit<DateInputProps, 'className'>,
    Pick<FormFieldProps, 'label' | 'helper' | 'error' | 'action' | 'className'> {}

export const DateField = React.forwardRef<HTMLButtonElement, DateFieldProps>(function DateField(
  { label, required, helper, error, action, id, className, ...dateInput },
  ref,
) {
  return (
    <FormField
      label={label}
      required={required}
      helper={helper}
      error={error}
      action={action}
      htmlFor={id}
      className={className}
    >
      <DateInput ref={ref} {...dateInput} />
    </FormField>
  );
});
DateField.displayName = 'DateField';
