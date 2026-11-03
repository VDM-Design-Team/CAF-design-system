import * as React from 'react';
import { cn } from '../../lib/cn';
import { joinIds, useFormField } from '../form-field/useFormField';

/**
 * FormEditLink — built from the CAF Figma library, page "Form": `_Edit Link`
 * (Label), the "[Edit]" beside a field's label in `Form / Field – Dropdown
 * with Edit` (Currency, in Form / New Cost). Pass it as a field's `action`.
 *
 * Figma → code:
 * - Label → `children`, default "[Edit]": Caption/sm-regular.
 * - State=Default  → text/link/default.
 * - State=Hover    → `:hover`: text/link/hover.
 * - State=Pressed  → `:active`: text/link/pressed.
 * - State=Disabled → `disabled`: text/disabled.
 * - Hit Area (24×24 target) → a `::before` 24 high and at least 24 wide,
 *   centred on the label and outside the layout: the button hugs its label,
 *   so the field's label row stays 17 high, and the target still meets
 *   WCAG 2.5.8's 24×24.
 *
 * It is a `<button type="button">` (it opens an editor; it doesn't go to a
 * page). Inside a FormField it is named by its own text and the field's label
 * ("[Edit] Currency"), so each one says what it edits. `aria-label` or
 * `aria-labelledby` replace that.
 *
 * Figma has no Focus state. Code adds the focus ring every CAF control has
 * (stroke.focused, as on Button). Where code departs from Figma, the reason
 * is in docs/figma-sync.md ("FormEditLink").
 */
const formEditLinkClasses = [
  /* Label: Caption/sm-regular. State=Default text.link.default, Hover text.link.hover,
     Pressed text.link.pressed, Disabled text.disabled. */
  'relative inline-flex shrink-0 cursor-pointer text-caption-sm-regular text-text-link-default',
  'enabled:hover:text-text-link-hover enabled:active:text-text-link-pressed',
  'disabled:cursor-not-allowed disabled:text-text-disabled',
  /* Hit Area (24×24 target): 24 high, the label's width but at least 24, centred on the
     label. Absolute, so it takes no layout space. */
  'before:absolute before:top-1/2 before:left-1/2 before:h-6 before:w-full before:min-w-6 before:-translate-x-1/2 before:-translate-y-1/2',
  /* Figma has no Focus state; the ring is stroke.focused, as on Button. */
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
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
