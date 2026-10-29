import * as React from 'react';
import { cn } from '../../lib/cn';
import { FormLabel } from '../form-label';
import { FormFieldContext, type FormFieldContextValue, type FormFieldControlProps } from './useFormField';

/**
 * FormField — the part every `Form / Field – *` in the CAF Figma library
 * (page "Form") shares: a Label Row with the `_Form Label`, the control
 * under it, and the Helper Text under that. Figma has no FormField of its
 * own; TextField and SelectField (Form / Field – Text, – Dropdown, –
 * Dropdown with Edit) are FormField around a TextInput or a Select, and the
 * phase 3 fields still to come are built the same way.
 *
 * Figma → code:
 * - Label Row → the `label` (a FormLabel, Body/sm-regular, text/secondary),
 *   then `action` beside it (Dropdown with Edit's `_Edit Link`, space.8 away),
 *   20px above the control (Figma: the row's raw 20 bottom padding).
 * - _Form Label's Required → `required`: the marker, and `required` on the control.
 * - Input Wrapper → `children`, the control. It fills the field's width.
 * - Show Helper + Helper → `helper`, under the control with no gap:
 *   Caption/md-regular, text/subtle.
 * - The input's State=Error, with Show Helper on for the message (Figma's
 *   "Add Cost Center – Errors" and "Feedback messages" patterns) → `error`.
 *   The message takes the helper's place, in the helper's style (Figma binds
 *   one Helper layer to text/subtle), and the control is `aria-invalid`.
 *
 * Wiring: FormField puts its ids in a context (`useFormField`). A control
 * calls `useFormFieldControl(props)`, as TextInput, SelectTrigger and Select
 * do, and gets the label's `htmlFor` as its `id`, the message in
 * `aria-describedby`, `aria-invalid` while there is an `error`, and
 * `required`. Any other control (a native `<input>`, say) takes the same
 * props from a function child: `{(control) => <input {...control} />}`.
 * One control per field: a group of radios or checkboxes is a fieldset
 * with `<FormLabel as="legend">`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("FormField").
 */

/** Figma's Helper Text: the message under a field's control. */
export const FormHelperText = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function FormHelperText({ className, ...props }, ref) {
    return <p ref={ref} className={cn('text-caption-md-regular text-text-subtle', className)} {...props} />;
  },
);
FormHelperText.displayName = 'FormHelperText';

/** What a function child gets: spread it onto the control. */
export type FormFieldControlRender = (control: FormFieldControlProps & { id: string }) => React.ReactNode;

export interface FormFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma _Form Label's Label: the visible label, which names the control. */
  label: React.ReactNode;
  /** Figma _Form Label's Required: the marker, and `required` (or `aria-required`) on the control. */
  required?: boolean;
  /** Figma Show Helper + Helper: guidance under the control. `error` takes its place. */
  helper?: React.ReactNode;
  /** The error message (the control's State=Error). Shown in the helper's place; makes the control `aria-invalid`. */
  error?: React.ReactNode;
  /** Beside the label, outside the `<label>`: Dropdown with Edit's FormEditLink. */
  action?: React.ReactNode;
  /** The control's id, which the label points at. Generated when omitted. */
  htmlFor?: string;
  /** The control: a component that calls `useFormFieldControl` (TextInput, Select), or a function given its props. */
  children: React.ReactNode | FormFieldControlRender;
}

const shows = (node: React.ReactNode) => node !== undefined && node !== null && node !== false && node !== '';

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  { label, required = false, helper, error, action, htmlFor, children, className, ...props },
  ref,
) {
  const uid = React.useId();
  const id = htmlFor ?? `${uid}-control`;
  const labelId = `${uid}-label`;
  const invalid = shows(error);
  const message = invalid ? error : helper;
  const messageId = shows(message) ? `${uid}-message` : undefined;

  const context = React.useMemo<FormFieldContextValue>(
    () => ({ id, labelId, messageId, invalid, required }),
    [id, labelId, messageId, invalid, required],
  );

  const control =
    typeof children === 'function'
      ? children({
          id,
          'aria-describedby': messageId,
          'aria-invalid': invalid || undefined,
          required: required || undefined,
        })
      : children;

  return (
    <FormFieldContext.Provider value={context}>
      {/* The field: a column with no gap (Figma: 0). It fills its container, as the forms place it. */}
      <div ref={ref} className={cn('flex w-full min-w-0 flex-col', className)} {...props}>
        {/* Label Row: the label and its action, space.8 apart, 20px above the control. */}
        <div className="flex items-center gap-2 pb-5">
          <FormLabel id={labelId} htmlFor={id} required={required}>
            {label}
          </FormLabel>
          {action}
        </div>
        {control}
        {messageId && <FormHelperText id={messageId}>{message}</FormHelperText>}
      </div>
    </FormFieldContext.Provider>
  );
});
FormField.displayName = 'FormField';
