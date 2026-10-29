import * as React from 'react';
import { cn } from '../../lib/cn';
import { joinIds, useFormField } from '../form-field/useFormField';

/**
 * FormEditLink — built from the CAF Figma library, page "Form": `_Edit Link`
 * (Label), the "[Edit]" beside a field's label in `Form / Field – Dropdown
 * with Edit` (Currency, in Form / New Cost). Pass it as a field's `action`.
 *
 * Figma → code:
 * - Label → `children`, default "[Edit]": Caption/sm-regular, text/link/default.
 *
 * It is a `<button type="button">` (it opens an editor; it doesn't go to a
 * page). Inside a FormField it is named by its own text and the field's label
 * ("[Edit] Currency"), so each one says what it edits. `aria-label` or
 * `aria-labelledby` replace that.
 *
 * Figma has no Hover, Focus or Disabled state. Code adds the focus ring every
 * CAF control has (stroke.focused, as on Button). Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("FormEditLink").
 */
const formEditLinkClasses = [
  /* Label: Caption/sm-regular, text.link.default. */
  'inline-flex shrink-0 cursor-pointer text-caption-sm-regular text-text-link-default',
  /* Figma has no Focus state; the ring is stroke.focused, as on Button. */
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  'disabled:cursor-not-allowed',
];

export type FormEditLinkProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const FormEditLink = React.forwardRef<HTMLButtonElement, FormEditLinkProps>(function FormEditLink(
  {
    className,
    children = '[Edit]',
    type = 'button',
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    ...props
  },
  ref,
) {
  const field = useFormField();
  const uid = React.useId();
  const ownId = id ?? `${uid}-edit`;
  /* In a field: its own text, then the field's label. */
  const labelledBy = ariaLabelledby ?? (field && !ariaLabel ? joinIds(ownId, field.labelId) : undefined);
  return (
    <button
      ref={ref}
      type={type}
      id={ownId}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      className={cn(formEditLinkClasses, className)}
      {...props}
    >
      {children}
    </button>
  );
});
FormEditLink.displayName = 'FormEditLink';
