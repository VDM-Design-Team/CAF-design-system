import * as React from 'react';
import { Combobox, type ComboboxProps } from '../combobox';
import { FormField, type FormFieldProps } from '../form-field';

/**
 * ComboboxField — built from the CAF Figma library, page "Form":
 * `Form / Field – Combobox`, a labelled searchable select (Location, in the
 * Cost Breakdown and Multi-section form patterns). It is FormField around a
 * Combobox.
 *
 * Figma → code:
 * - _Form Label's Label and Required → `label`, `required`.
 * - _Combobox Input's Value and State → the Combobox: `options`, `value` /
 *   `defaultValue` / `onValueChange` (Filled), `placeholder` (Default),
 *   `:focus` (Focus), the list showing (Open), `disabled`. Error is `error`
 *   (below).
 * - Show Helper + Helper → `helper`; the error message in the Helper →
 *   `error`, which also makes the input `aria-invalid`.
 * - Figma's "Pair with Select / Menu for the open state" → the Combobox's
 *   own list (SelectMenu's layout, SelectOptions).
 *
 * Every other prop goes to the Combobox, and so does the ref (the
 * `<input role="combobox">`). `name` submits the chosen option's value with
 * the form. `id` is the input's (the label points at it); `className` styles
 * the field. `required` shows the marker and sets the input's native
 * `required`, which the browser checks: the input holds the chosen label
 * whenever the list is closed.
 *
 * The bindings are FormField's and Combobox's. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("ComboboxField").
 */
export interface ComboboxFieldProps
  extends Omit<ComboboxProps, 'className'>, Pick<FormFieldProps, 'label' | 'helper' | 'error' | 'action' | 'className'> {}

export const ComboboxField = React.forwardRef<HTMLInputElement, ComboboxFieldProps>(function ComboboxField(
  { label, required, helper, error, action, id, className, ...combobox },
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
      <Combobox ref={ref} {...combobox} />
    </FormField>
  );
});
ComboboxField.displayName = 'ComboboxField';
