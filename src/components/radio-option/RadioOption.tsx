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
 * - `description` (new design, Nov 2026): a line under the label, for an
 *   option that needs a sentence. The label turns semibold, the line is
 *   Caption/md-regular in text/secondary 2px under it, and the radio sits
 *   level with the label's first line. The label alone names the radio
 *   (`aria-labelledby`) and the line describes it (`aria-describedby`).
 * - Error=true → `aria-invalid` on the radio (RadioGroup's `error` sets it):
 *   Radio's Error stroke.
 * - The Radio's other states (Hover, Disabled) are the radio's own: see Radio.
 *
 * It is a `<label>` around a native radio, so a click on the text checks it
 * and the text is the radio's accessible name. `className` styles the label;
 * every other prop, and the ref, go to the `<input>`: `name`, `value`,
 * `checked` / `defaultChecked`, `onChange`, `disabled`, `aria-invalid`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("RadioOption").
 */
export interface RadioOptionProps extends Omit<RadioProps, 'className' | 'style'> {
  /** Figma Label: the option's text, which names the radio. */
  label: React.ReactNode;
  /** A line under the label that explains the option. */
  description?: React.ReactNode;
  /** Styles the `<label>` around the radio and its text. */
  className?: string;
  style?: React.CSSProperties;
}

export const RadioOption = React.forwardRef<HTMLInputElement, RadioOptionProps>(
  ({ label, description, className, style, 'aria-describedby': describedBy, ...radio }, ref) => {
    const uid = React.useId();
    const [labelId, descriptionId] = [`${uid}-label`, `${uid}-description`];
    const hasDescription = description != null && description !== false && description !== '';
    return (
      <label
        className={cn(
          'inline-flex cursor-pointer gap-2 text-body-sm-regular text-text-primary',
          hasDescription ? 'items-start' : 'items-center',
          'has-disabled:cursor-not-allowed',
          className,
        )}
        style={style}
      >
        <Radio
          ref={ref}
          aria-labelledby={hasDescription ? labelId : undefined}
          aria-describedby={[hasDescription && descriptionId, describedBy].filter(Boolean).join(' ') || undefined}
          {...radio}
        />
        {hasDescription ? (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span id={labelId} className="text-body-sm-semibold">
              {label}
            </span>
            <span id={descriptionId} className="text-caption-md-regular text-text-secondary">
              {description}
            </span>
          </span>
        ) : (
          label
        )}
      </label>
    );
  },
);
RadioOption.displayName = 'RadioOption';
