import * as React from 'react';
import { cn } from '../../lib/cn';
import { FormHelperText } from '../form-field';
import { joinIds } from '../form-field/useFormField';
import { FormLabel } from '../form-label';
import { RadioOption } from '../radio-option';

/**
 * RadioGroup — built from the CAF Figma library, page "Selection Controls":
 * `Form / Radio Group`, a label over a row of Radio Options with the Helper
 * under them (Create Announcement's "Target Audience": All, Admin, User).
 *
 * Figma → code:
 * - Label → `label`: Body/sm-regular in text/secondary, the `_Form Label`
 *   look (code renders FormLabel as the fieldset's `<legend>`). `required`
 *   adds _Form Label's marker; see below.
 * - Options → `options`, one RadioOption each, in a row 24px apart
 *   (Figma: raw 24 → space/24). A plain string is `{ value: s, label: s }`.
 * - Each Radio Option's Selected → `value` (controlled, with
 *   `onValueChange`) or `defaultValue` (uncontrolled).
 * - Show Helper + Helper → `helper`: Caption/md-regular in text/subtle.
 * - Label, options and Helper are 8px apart (Figma: raw 8 → space/8).
 *
 * Code adds what a form needs, which Figma doesn't draw:
 * - `required`: _Form Label's marker after the label, `required` on every
 *   radio (the browser won't submit the form until one is chosen) and
 *   `aria-required` on the group.
 * - `error`: the message, in the Helper's place and style (as FormField
 *   does), with `aria-invalid` on the group and its radios. Radio has no
 *   Error state, so the radios look the same.
 * - `disabled`: the fieldset's own, which disables every radio.
 *
 * It is a `<fieldset role="radiogroup">` named by its legend, with the
 * Helper in `aria-describedby`. The radios are native and share a `name`
 * (generated when omitted), so the browser gives the arrow keys (they move
 * and choose), one tab stop and the form value: pass `name` and the chosen
 * `value` is submitted under it. `onValueChange` gets the value the user
 * chooses. The ref is the fieldset's.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("RadioGroup").
 */

/** One choice. A plain string is shorthand for `{ value: s, label: s }`. */
export interface RadioGroupOptionData {
  value: string;
  /** Figma Radio Option's Label: the text that names the radio. */
  label: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'defaultValue' | 'children'> {
  /** Figma Label: names the group. */
  label: React.ReactNode;
  /** Figma Radio Options: one per entry, in order. */
  options: ReadonlyArray<string | RadioGroupOptionData>;
  /** Controlled: the chosen option's `value`, or `null` for none. Pair with `onValueChange`. */
  value?: string | null;
  /** Uncontrolled: the option chosen at first. */
  defaultValue?: string;
  /** Called with the option's `value` when the user chooses it. */
  onValueChange?: (value: string) => void;
  /** The radios' shared `name`: the chosen `value` is submitted under it. Generated when omitted. */
  name?: string;
  /** Figma Show Helper + Helper: guidance under the options. `error` takes its place. */
  helper?: React.ReactNode;
  /** The error message, in the Helper's place. Makes the group and its radios `aria-invalid`. */
  error?: React.ReactNode;
  /** _Form Label's Required marker; the radios are `required` and the group `aria-required`. */
  required?: boolean;
}

const shows = (node: React.ReactNode) => node !== undefined && node !== null && node !== false && node !== '';
const toOption = (option: string | RadioGroupOptionData) =>
  typeof option === 'string' ? { value: option, label: option } : option;

export const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
  {
    label,
    options,
    value,
    defaultValue,
    onValueChange,
    name,
    helper,
    error,
    required = false,
    className,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const uid = React.useId();
  const groupName = name ?? `${uid}-radio`;
  const labelId = `${uid}-label`;
  const invalid = shows(error);
  const message = invalid ? error : helper;
  const messageId = shows(message) ? `${uid}-message` : undefined;
  const controlled = value !== undefined;

  return (
    <fieldset
      ref={ref}
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={joinIds(messageId, describedBy)}
      aria-required={required || undefined}
      aria-invalid={invalid || undefined}
      /* Label, Options and Helper: a column 8px apart. */
      className={cn('flex min-w-0 flex-col gap-2', className)}
      {...props}
    >
      {/* The rendered legend isn't a flex item, so it keeps the 8px with a margin. */}
      <FormLabel as="legend" id={labelId} required={required} className="mb-2">
        {label}
      </FormLabel>
      {/* Options: a row, 24px apart. It wraps on a narrow screen, with the group's 8px between rows. */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map(toOption).map((option) => (
          <RadioOption
            key={option.value}
            name={groupName}
            value={option.value}
            label={option.label}
            disabled={option.disabled}
            required={required || undefined}
            aria-invalid={invalid || undefined}
            {...(controlled ? { checked: value === option.value } : { defaultChecked: defaultValue === option.value })}
            onChange={(event) => {
              if (event.currentTarget.checked) onValueChange?.(option.value);
            }}
          />
        ))}
      </div>
      {messageId && <FormHelperText id={messageId}>{message}</FormHelperText>}
    </fieldset>
  );
});
RadioGroup.displayName = 'RadioGroup';
