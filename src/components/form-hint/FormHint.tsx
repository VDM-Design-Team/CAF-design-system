import * as React from 'react';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';

/**
 * FormHint — built from the CAF Figma library, page "Form": `_Form Hint`
 * (766:864), an inline note under a field (decision add-form-hint): "This
 * will recur every 3 weeks" under Frequency, or why a button is disabled. It
 * is lighter than an Alert: an icon and one line of text, no box.
 *
 * Figma → code:
 * - Icon (instance swap, Info 16) → `icon`, an Icon name (default `info`),
 *   16px, in text/subtle. Decorative: the text carries the meaning.
 * - Hint (text) → `children`: Caption/md-regular, text/subtle. It fills the
 *   row and wraps.
 * - Auto layout: a row, space.8 between the icon and the text, centred.
 *
 * Place it space.8 under the field it explains, as Figma's description says
 * (the forms put the field and the hint in a `gap-2` column). Point the
 * field's `aria-describedby` at its `id` when it describes one control. A
 * hint that follows what the user types (the recurrence summary) can be a
 * polite live region: pass `role="status"`. Every other prop goes to the `<p>`.
 *
 * Every colour and type style is the one the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("FormHint").
 */
export interface FormHintProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Figma Icon: the leading glyph, an Icon name. Default `info`. */
  icon?: IconName;
  /** Figma Hint: the note ("This will recur every 3 weeks"). */
  children: React.ReactNode;
}

export const FormHint = React.forwardRef<HTMLParagraphElement, FormHintProps>(function FormHint(
  { icon = 'info', children, className, ...props },
  ref,
) {
  return (
    <p
      ref={ref}
      className={cn('flex w-full min-w-0 items-center gap-2 text-caption-md-regular text-text-subtle', className)}
      {...props}
    >
      {/* Icon: Phosphor, 16px, its vector bound to text/subtle (the text colour). */}
      <Icon name={icon} size={16} />
      {/* Hint: fills the row (Figma: Fill) and wraps (auto height). */}
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
});
FormHint.displayName = 'FormHint';
