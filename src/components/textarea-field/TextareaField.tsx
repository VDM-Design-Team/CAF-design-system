import * as React from 'react';
import { FormField, type FormFieldProps } from '../form-field';
import { Textarea, type TextareaProps } from '../textarea';

/**
 * TextareaField — built from the CAF Figma library, page "Form":
 * `Form / Field – Textarea`, a labelled multi-line input (Notes in Edit
 * Recurring Cost, Reason (optional) in Change Status). It is FormField
 * around a Textarea.
 *
 * Figma → code:
 * - _Form Label's Label and Required → `label`, `required`.
 * - _Textarea's Value and State → the textarea's own props: `placeholder`
 *   (Default), `value` / `defaultValue` (Filled), `:focus` (Focus),
 *   `disabled` (Disabled). Error is `error` (below). Its 96px height is
 *   `rows` (4).
 * - Show Helper + Helper → `helper`. The message in the Helper with the
 *   textarea at State=Error is `error`, which also makes it `aria-invalid`.
 *
 * Every other prop goes to the `<textarea>`, and so does the ref: `name`,
 * `rows`, `value` / `defaultValue` / `onChange`, `maxLength`… `id` is the
 * textarea's (the label points at it); `className` styles the field.
 * `required` shows the marker and sets the textarea's native `required`.
 *
 * The bindings are FormField's and Textarea's. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("TextareaField").
 */
export interface TextareaFieldProps
  extends
    Omit<TextareaProps, 'className'>,
    Pick<FormFieldProps, 'label' | 'helper' | 'error' | 'action' | 'className'> {}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  { label, required, helper, error, action, id, className, ...textarea },
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
      <Textarea ref={ref} {...textarea} />
    </FormField>
  );
});
TextareaField.displayName = 'TextareaField';
