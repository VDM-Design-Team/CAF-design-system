import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * FormLabel — built from the CAF Figma library, page "Form": `_Form Label`
 * (Required), the label above every `Form / Field – *`. FormField renders it;
 * use it on its own only to label something FormField doesn't wrap.
 *
 * Figma → code:
 * - Label          → `children`: Body/sm-regular in text/secondary.
 * - Required=true  → `required`: the "*" marker after the label, in
 *   accent/critical/tonal/content/default, space.2 from it.
 * - Required=false → no marker (the default).
 *
 * The marker is `aria-hidden`: it is decoration. "Required" is the control's
 * to announce (`required` or `aria-required`), which FormField sets from the
 * same prop. It is a `<label>` by default; `as="legend"` labels a fieldset
 * (a group of radios or checkboxes) and `as="span"` a control named with
 * `aria-labelledby`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("FormLabel").
 */
export const formLabelClasses = [
  /* Label: Body/sm-regular, text.secondary. Required=true puts the marker
     space.2 after it (Figma: raw 2). */
  'inline-flex gap-0.5 text-body-sm-regular text-text-secondary',
];

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLElement> {
  /** Figma Required: show the "*" marker. The control carries the semantics. */
  required?: boolean;
  /** The element: `label` (default), `legend` for a fieldset, or `span` for an `aria-labelledby` target. */
  as?: 'label' | 'legend' | 'span';
}

export const FormLabel = React.forwardRef<HTMLElement, FormLabelProps>(function FormLabel(
  { as: Element = 'label', required = false, className, children, htmlFor, ...props },
  ref,
) {
  return (
    <Element
      ref={ref as React.Ref<never>}
      /* `for` only means something on a <label>. */
      htmlFor={Element === 'label' ? htmlFor : undefined}
      className={cn(formLabelClasses, className)}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-accent-critical-tonal-content-default">
          *
        </span>
      )}
    </Element>
  );
});
FormLabel.displayName = 'FormLabel';
