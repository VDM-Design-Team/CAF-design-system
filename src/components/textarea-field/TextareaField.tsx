import * as React from 'react';
import { cn } from '../../lib/cn';
import { FormField, FormFieldStatusIcon, type FormFieldProps } from '../form-field';
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
 * New CAF design (Nov 2026):
 * - `maxLength` shows a counter ("0/500") at the end of the label row, in
 *   Caption/md-regular, text/secondary, with tabular figures. It is announced
 *   politely as it changes.
 * - `error` also puts an alert icon in the textarea's top end corner.
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

const shows = (node: React.ReactNode) => node !== undefined && node !== null && node !== false && node !== '';
const length = (value: TextareaProps['value']) => (value == null ? 0 : String(value).length);

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  { label, required, helper, error, action, id, className, ...textarea },
  ref,
) {
  const { maxLength, value, defaultValue, onChange } = textarea;
  // The counter follows `value` when controlled, and the typed text otherwise.
  const [typed, setTyped] = React.useState(() => length(defaultValue));
  const count = value !== undefined ? length(value) : typed;
  const counter = maxLength !== undefined && (
    <span aria-live="polite" className="ms-auto text-caption-md-regular whitespace-nowrap text-text-secondary tabular-nums">
      {count}/{maxLength}
    </span>
  );
  const invalid = shows(error);
  return (
    <FormField
      label={label}
      required={required}
      helper={helper}
      error={error}
      action={
        counter ? (
          <>
            {action}
            {counter}
          </>
        ) : (
          action
        )
      }
      htmlFor={id}
      className={className}
    >
      <div className="relative">
        <Textarea
          ref={ref}
          className={cn(invalid && 'pr-10')}
          {...textarea}
          onChange={(event) => {
            setTyped(event.currentTarget.value.length);
            onChange?.(event);
          }}
        />
        {invalid && <FormFieldStatusIcon state="invalid" multiline />}
      </div>
    </FormField>
  );
});
TextareaField.displayName = 'TextareaField';
