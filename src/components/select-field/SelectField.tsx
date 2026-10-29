import * as React from 'react';
import { FormField, type FormFieldProps } from '../form-field';
import { Select, type SelectProps } from '../select';

/**
 * SelectField — built from the CAF Figma library, page "Form":
 * `Form / Field – Dropdown` (13 placements: Select Partner, Payment method,
 * Country, Cost Center, Frequency, Role…) and `Form / Field – Dropdown with
 * Edit` (Currency, with `_Edit Link`). It is FormField around a Select.
 *
 * Figma → code:
 * - _Form Label's Label and Required → `label`, `required`.
 * - _Dropdown Input's Value and State → the Select: `options`, `value` /
 *   `defaultValue` / `onValueChange` (Filled), `placeholder` (Default),
 *   keyboard focus (Focus), the list showing (Open), `disabled`. Error is
 *   `error` (below).
 * - Show Helper + Helper → `helper`; the error message in the Helper → `error`,
 *   which also makes the trigger `aria-invalid`.
 * - Dropdown with Edit's `_Edit Link` → `action={<FormEditLink onClick={…} />}`,
 *   beside the label. It is named "[Edit] <label>".
 *
 * Every other prop goes to the Select, and so does the ref (the trigger
 * button). `name` submits the chosen value with the form. `id` is the
 * trigger's (the label points at it); `className` styles the field.
 * `required` shows the marker and sets `aria-required`; check it on submit.
 *
 * The bindings are FormField's and SelectTrigger's. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("SelectField").
 */
export interface SelectFieldProps
  extends Omit<SelectProps, 'className'>, Pick<FormFieldProps, 'label' | 'helper' | 'error' | 'action' | 'className'> {}

export const SelectField = React.forwardRef<HTMLButtonElement, SelectFieldProps>(function SelectField(
  { label, required, helper, error, action, id, className, ...select },
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
      <Select ref={ref} {...select} />
    </FormField>
  );
});
SelectField.displayName = 'SelectField';
