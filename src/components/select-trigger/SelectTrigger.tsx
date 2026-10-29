import * as React from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../icon';

/**
 * SelectTrigger — built from the CAF Figma library, page "Form":
 * `_Dropdown Input` (State, with a Value), the closed select: the chosen
 * option or a placeholder, and a caret. Form / Field – Dropdown puts it under
 * a label; Filter / Field puts it in the filter bar. The list it opens
 * (Select / Menu) is Select's job, not this one's.
 *
 * Figma → code:
 * - State=Default  → no `value`: the `placeholder` shows, in text/subtle.
 * - State=Filled   → a `value`, in text/primary.
 * - State=Focus    → `:focus-visible`: a 2px stroke/focused stroke inside the edge.
 * - State=Error    → `aria-invalid`: the accent/critical/outline border.
 * - State=Disabled → the native `disabled` attribute.
 * - State=Open     → `open`, which sets `aria-expanded`: Focus's 2px stroke.
 * - Value          → `value`, the chosen option's label; `placeholder` while empty.
 * - Icon / Caret   → Icon `caret-down`, 20px.
 *
 * It is a `<button role="combobox" aria-haspopup="listbox">`, the trigger of a
 * select-only combobox, so Select can hand it `aria-controls` and its keys.
 * A combobox isn't named by its text (that is its value), so name it: a
 * `<label htmlFor>` (Form / Field does this), `aria-label` or `aria-labelledby`.
 *
 * Every colour is the semantic variable the Figma layer is bound to, except
 * the caret, whose fill Figma leaves raw. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("SelectTrigger").
 */
const selectTriggerClasses = [
  /* Every state: surface.elevated-secondary fill, radius 8, Body/sm-regular,
     12px sides, the value left and the caret right. Figma hugs 10px padding
     around the 20px caret (42px); code is 40px, as TextInput. */
  'flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-8 bg-surface-elevated-secondary px-3',
  'text-left text-body-sm-regular',
  /* State=Filled: the value in text.primary, a 1px stroke.subtle stroke inside
     the edge. State=Default: the placeholder in text.subtle. */
  'text-text-primary data-placeholder:text-text-subtle inset-ring inset-ring-stroke-subtle',
  /* State=Focus: a 2px stroke.focused stroke inside the edge, for keyboard
     focus. It replaces the browser's outline, which stays transparent so
     forced-colours mode still shows one. */
  'outline-hidden focus-visible:inset-ring-2 focus-visible:inset-ring-stroke-focused',
  /* State=Open: the same 2px stroke.focused stroke. */
  'aria-expanded:inset-ring-2 aria-expanded:inset-ring-stroke-focused',
  /* State=Error: the accent.critical.outline border. It keeps that colour when
     focused or open (at their 2px width), so the error stays visible. */
  'aria-invalid:inset-ring-accent-critical-outline-border-default',
  /* State=Disabled: the value, like the placeholder, in text.subtle. */
  'disabled:cursor-not-allowed disabled:text-text-subtle',
];

export interface SelectTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'children'> {
  /** Figma Value: the chosen option's label. Leave it empty for State=Default, which shows `placeholder`. */
  value?: React.ReactNode;
  /** The text shown while there is no value. Default "Select option", as in Figma. */
  placeholder?: string;
  /**
   * Figma State=Open: the list is showing. Sets `aria-expanded`. While open, also
   * pass `aria-controls` with the list's id (Select does): an expanded combobox
   * names the list it controls.
   */
  open?: boolean;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, value, placeholder = 'Select option', open = false, type = 'button', ...props }, ref) => {
    const empty = value === undefined || value === null || value === false || value === '';
    return (
      <button
        ref={ref}
        type={type}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-placeholder={empty ? '' : undefined}
        className={cn(selectTriggerClasses, className)}
        {...props}
      >
        <span className="min-w-0 truncate">{empty ? placeholder : value}</span>
        {/* Figma's caret fill is raw #E5E5E5; text.subtle is what _Combobox Input and _Date Input bind. */}
        <Icon name="caret-down" size={20} className="text-text-subtle" />
      </button>
    );
  },
);
SelectTrigger.displayName = 'SelectTrigger';
