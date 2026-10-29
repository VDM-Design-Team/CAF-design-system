import * as React from 'react';
import { FormField, type FormFieldProps } from '../form-field';
import { TextInput, type TextInputProps } from '../text-input';

/**
 * TextField — built from the CAF Figma library, page "Form":
 * `Form / Field – Text`, a labelled single-line input (27 placements in Form
 * / New Cost and the modal patterns: Applicant name, Email, Invoice number,
 * IBAN account number…). It is FormField around a TextInput.
 *
 * Figma → code:
 * - _Form Label's Label and Required → `label`, `required`.
 * - _Text Input's Value and State → the input's own props: `placeholder`
 *   (Default), `value` / `defaultValue` (Filled), `:focus` (Focus),
 *   `disabled` (Disabled). Error is `error` (below).
 * - Show Helper + Helper → `helper`. Figma's error patterns show the message
 *   in the Helper with the input at State=Error: that is `error`, which also
 *   makes the input `aria-invalid`.
 *
 * Every other prop goes to the `<input>`, and so does the ref: `name`,
 * `type`, `value` / `defaultValue` / `onChange`, `autoComplete`… `id` is the
 * input's (the label points at it); `className` styles the field. `required`
 * shows the marker and sets the input's native `required`.
 *
 * The bindings are FormField's and TextInput's. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("TextField").
 */
export interface TextFieldProps
  extends
    Omit<TextInputProps, 'className'>,
    Pick<FormFieldProps, 'label' | 'helper' | 'error' | 'action' | 'className'> {}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, required, helper, error, action, id, className, ...input },
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
      <TextInput ref={ref} {...input} />
    </FormField>
  );
});
TextField.displayName = 'TextField';
