import * as React from 'react';
import { DateInput, type DateInputProps } from '../date-input';
import { FormField, type FormFieldProps } from '../form-field';

/**
 * DateField — built from the CAF Figma library, page "Form":
 * `Form / Field – Date`, a labelled date field (Starts At and Ends At in
 * Edit Recurring Cost, Period From and Period To in Cost Breakdown, Release
 * Date in Create Announcement). It is FormField around a DateInput, which
 * takes a typed or pasted `yyyy-mm-dd` and opens the Calendar, as Figma's
 * description pairs them.
 *
 * Figma → code:
 * - _Form Label's Label and Required → `label`, `required`.
 * - _Date Input's Value and State → the DateInput: `value` / `defaultValue` /
 *   `onValueChange` as `yyyy-mm-dd` (Filled), `placeholder` (Default),
 *   focus (Focus), the calendar showing (Open), `disabled`. Error is `error`
 *   (below).
 * - Show Helper + Helper → `helper`; the error message in the Helper → `error`,
 *   which also makes the field `aria-invalid`.
 * - Typed text that isn't a date (checked on blur, Enter or opening the
 *   calendar) shows the field's own error, "Enter a date as yyyy-mm-dd.",
 *   in the Helper's place, until the text is fixed, cleared or replaced by a
 *   pick. While it shows, it takes the place of `error`: it says what is
 *   wrong with the text in the field now.
 *
 * Every other prop goes to the DateInput, and so does the ref (its input).
 * `name` submits the date as `yyyy-mm-dd`. `id` is the input's (the label
 * points at it); `className` styles the field. `required` shows the marker
 * and sets `aria-required`; check it on submit.
 *
 * The bindings are FormField's and DateInput's. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("DateField").
 */
export interface DateFieldProps
  extends
    Omit<DateInputProps, 'className'>,
    Pick<FormFieldProps, 'label' | 'helper' | 'error' | 'action' | 'className'> {}

/** The field's own message for typed text that isn't a date. */
const FORMAT_ERROR = 'Enter a date as yyyy-mm-dd.';

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { label, required, helper, error, action, id, className, onInvalidChange, ...dateInput },
  ref,
) {
  const [typedInvalid, setTypedInvalid] = React.useState(false);
  return (
    <FormField
      label={label}
      required={required}
      helper={helper}
      error={typedInvalid ? FORMAT_ERROR : error}
      action={action}
      htmlFor={id}
      className={className}
    >
      <DateInput
        ref={ref}
        {...dateInput}
        onInvalidChange={(invalid) => {
          setTypedInvalid(invalid);
          onInvalidChange?.(invalid);
        }}
      />
    </FormField>
  );
});
DateField.displayName = 'DateField';
