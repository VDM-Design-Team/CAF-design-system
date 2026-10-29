import * as React from 'react';
import { cn } from '../../lib/cn';
import { Radio, type RadioProps } from '../radio';

/**
 * RadioOption — built from the CAF Figma library, page "Selection Controls":
 * `Radio Option` (Selected, with a Label), a Radio with its label beside it.
 * RadioGroup (Form / Radio Group) renders one per option.
 *
 * Figma → code:
 * - Label    → `label`: Body/sm-regular in text/primary, 8px after the radio
 *   (Figma: raw 8 → space/8), centred on it.
 * - Selected → the radio's `checked` (or `defaultChecked`).
 * - The Radio's other states (Hover, Disabled) are the radio's own: see Radio.
 *
 * It is a `<label>` around a native radio, so a click on the text checks it
 * and the text is the radio's accessible name. `className` styles the label;
 * every other prop, and the ref, go to the `<input>`: `name`, `value`,
 * `checked` / `defaultChecked`, `onChange`, `disabled`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("RadioOption").
 */
export interface RadioOptionProps extends Omit<RadioProps, 'className' | 'style'> {
  /** Figma Label: the option's text, which names the radio. */
  label: React.ReactNode;
  /** Styles the `<label>` around the radio and its text. */
  className?: string;
  style?: React.CSSProperties;
}

export const RadioOption = React.forwardRef<HTMLInputElement, RadioOptionProps>(
  ({ label, className, style, ...radio }, ref) => (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 text-body-sm-regular text-text-primary',
        'has-disabled:cursor-not-allowed',
        className,
      )}
      style={style}
    >
      <Radio ref={ref} {...radio} />
      {label}
    </label>
  ),
);
RadioOption.displayName = 'RadioOption';
