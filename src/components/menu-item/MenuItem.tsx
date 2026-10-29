import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * MenuItem — built from the CAF Figma library, page "Menus": `Menu / Item`
 * (Type, with a Label), one action in a Menu / Dropdown. It is a
 * `<button role="menuitem">`: put it in a MenuDropdown (or a RowActionsMenu),
 * which moves focus between items and closes when one is chosen.
 *
 * Figma → code:
 * - Type=Default     → the item as it is.
 * - Type=Hover       → `:hover` (a state, not a prop).
 * - Type=Destructive → `destructive`: an action that deletes or stops
 *   something. The row actions pattern puts it last.
 * - Label            → `children`.
 *
 * Items aren't in the tab order (`tabIndex={-1}`): the menu moves focus with
 * the arrow keys. Figma has no Disabled item, so there is no `disabled`:
 * leave out an action the user can't take.
 *
 * Every colour and type style is the one the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("MenuItem").
 */
const menuItem = cva(
  [
    /* Auto layout: 8 / 12 padding, radius 6 (raw in Figma), fills the menu's width. Label: Body/sm-regular. */
    'flex w-full cursor-pointer items-center whitespace-nowrap rounded-6 px-3 py-2 text-left text-body-sm-regular',
    'transition-colors',
    /* Type=Hover — surface.base fill. Figma has no Destructive + Hover; a destructive item takes the same fill. */
    'enabled:hover:bg-surface-base',
    // Figma has no Focus state; the ring is stroke.focused, as on Button.
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  ],
  {
    variants: {
      destructive: {
        /* Type=Default (and Hover) — text.primary label. */
        false: 'text-text-primary',
        /* Type=Destructive — accent.critical.tonal.content.default label. */
        true: 'text-accent-critical-tonal-content-default',
      },
    },
    defaultVariants: { destructive: false },
  },
);

export interface MenuItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role' | 'tabIndex' | 'disabled'> {
  /** Figma Type=Destructive. */
  destructive?: boolean;
}

export const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ className, destructive = false, type = 'button', ...props }, ref) => (
    <button
      type={type}
      {...props}
      ref={ref}
      role="menuitem"
      tabIndex={-1}
      className={cn(menuItem({ destructive }), className)}
    />
  ),
);
MenuItem.displayName = 'MenuItem';

/** Figma's Type values that are props. Hover is `:hover`. */
export const MENU_ITEM_TYPES = ['default', 'destructive'] as const;
