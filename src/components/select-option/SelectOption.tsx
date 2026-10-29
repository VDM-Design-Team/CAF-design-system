import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon } from '../icon';

/**
 * SelectOption — built from the CAF Figma library, page "Form":
 * `Select / Option` (State, with a Label), one choice in a Select / Menu. It
 * is a `<div role="option">`: put it in a SelectMenu (or let Select render it
 * from its `options`). Focus stays on the select's trigger, which points at
 * the option the arrow keys are on with `aria-activedescendant`, so options
 * are never focused themselves.
 *
 * Figma → code:
 * - State=Default  → the option as it is: no fill.
 * - State=Hover    → `:hover` (a state, not a prop): surface/base.
 * - State=Selected → `selected`, which sets `aria-selected`: surface/base and
 *   a 16px Check (Phosphor `check`) in action/primary/surface/default.
 * - Label          → `children`.
 *
 * Code adds what Figma lacks: the option the arrow keys are on. Select marks
 * it with `data-active` (Hover's fill, so the pointer and the keys look the
 * same) and, when the keyboard put it there, `data-focus-visible` (Button's
 * 2px stroke/focused ring). Figma has no Disabled option, so there is none.
 *
 * Every colour and type style is the one the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("SelectOption").
 */
const selectOption = cva([
  /* Auto layout: 8 / 12 padding, 8 gap, radius 6 (raw in Figma), fills the menu's width.
     Label: Body/sm-regular in text/primary, in every state. 8 + 20 + 8 = Figma's fixed 36. */
  'flex w-full cursor-pointer items-center gap-2 rounded-6 px-3 py-2 text-left text-body-sm-regular text-text-primary',
  'select-none transition-colors',
  /* State=Hover, and the option the arrow keys are on — surface.base fill. */
  'hover:bg-surface-base data-active:bg-surface-base',
  /* State=Selected — surface.base fill (the check is the child below). */
  'aria-selected:bg-surface-base',
  // Figma has no Focus state; the ring is stroke.focused, as on Button and MenuItem.
  'data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-stroke-focused',
]);

export interface SelectOptionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Figma State=Selected: the chosen option. Sets `aria-selected` and shows the check. */
  selected?: boolean;
}

export const SelectOption = React.forwardRef<HTMLDivElement, SelectOptionProps>(
  ({ className, selected = false, children, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      role="option"
      aria-selected={selected}
      className={cn(selectOption(), className)}
    >
      {/* Label: fills the row, so the check sits at the right edge. */}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {/* Icon / Check: Phosphor Check, 16px, its vector bound to action/primary/surface/default.
          Hidden from assistive tech: aria-selected says the same. */}
      {selected && <Icon name="check" size={16} className="text-action-primary-surface-default" />}
    </div>
  ),
);
SelectOption.displayName = 'SelectOption';

/** Figma's State values. Default and Selected are `selected`; Hover is `:hover`. */
export const SELECT_OPTION_STATES = ['default', 'hover', 'selected'] as const;
