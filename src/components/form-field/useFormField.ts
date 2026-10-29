import * as React from 'react';

/**
 * What a FormField tells the control inside it. TextInput, SelectTrigger and
 * Select read it with `useFormFieldControl`; a control built later does the
 * same, so it is labelled, described and marked invalid with no props passed.
 */
export interface FormFieldContextValue {
  /** The control's id: the label's `htmlFor`. */
  id: string;
  /** The label's id, for a control named with `aria-labelledby` (a group, or an action beside the label). */
  labelId: string;
  /** The id of the message under the control (the helper, or the error in its place), while one shows. */
  messageId?: string;
  /** The field has an `error`: the control is `aria-invalid`. */
  invalid: boolean;
  /** Figma Required: the control is `required` (native) or `aria-required`. */
  required: boolean;
}

export const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

/** The surrounding FormField's wiring, or `null` outside one. */
export function useFormField() {
  return React.useContext(FormFieldContext);
}

/** The props a FormField sets on its control. */
export interface FormFieldControlProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  required?: boolean;
}

/** Space-separated ids, each once, or undefined for none. */
export function joinIds(...lists: Array<string | undefined>) {
  const ids = lists.flatMap((list) => list?.split(/\s+/) ?? []).filter(Boolean);
  return ids.length ? [...new Set(ids)].join(' ') : undefined;
}

/**
 * A control's props with the surrounding FormField's wiring merged in: its
 * `id` (the label's `htmlFor`), the message's id added to `aria-describedby`,
 * `aria-invalid` while the field has an error, and `required`. The control's
 * own props win, except `aria-describedby`, which keeps both. Outside a
 * FormField it returns the props unchanged. Running it twice (Select, then
 * its SelectTrigger) gives the same result.
 */
export function useFormFieldControl<P extends FormFieldControlProps>(props: P): P {
  const field = React.useContext(FormFieldContext);
  if (!field) return props;
  return {
    ...props,
    id: props.id ?? field.id,
    'aria-describedby': joinIds(field.messageId, props['aria-describedby']),
    'aria-invalid': props['aria-invalid'] ?? (field.invalid || undefined),
    required: props.required ?? (field.required || undefined),
  };
}
