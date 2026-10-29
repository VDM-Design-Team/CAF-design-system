import * as React from 'react';
import { Button } from '../button';
import { Icon } from '../icon';
import { MenuDropdown, type MenuDropdownProps } from '../menu-dropdown';

/**
 * MenuTriggerButton — built from the CAF Figma library, page "Buttons":
 * `Button / Menu Trigger` (State), the primary button with a trailing caret
 * that opens a `Menu / Dropdown`. The list pages use it for Export, in the
 * page header, and for the bulk "Change Status (n)" once table rows are
 * selected. Give it the menu's MenuItems as `children`.
 *
 * Figma → code:
 * - The nested `Button / Normal` (Style=Default, the right icon shown) →
 *   `<Button variant="default" size="normal">`. Its bindings are Button's:
 *   action/primary surface and content, Label/md-semibold, 36px high.
 * - Its label ("Change Status (1)", edited on the exposed Button) → `label`.
 * - `Icon / Caret` → Icon `caret-down`, 20px. It takes the label's colour,
 *   as Button / Normal's own icons do: Figma binds it to a primitive instead
 *   (docs/figma-sync.md, "MenuTriggerButton").
 * - State=Default / Hover / Pressed → the button's own `:hover` and `:active`.
 * - State=Disabled → `disabled`: the button can't open the menu.
 * - The menu → MenuDropdown, below the button and flush with its left edge
 *   (`align="right"` for a button at the end of a page header). It flips at
 *   the viewport's edges.
 *
 * The button's text is its name and names the menu. Keyboard, focus return
 * and outside click are MenuDropdown's: Enter, Space or ↓ open the menu on
 * the first item, ↑ on the last; Escape, Tab or choosing an item close it.
 */
export interface MenuTriggerButtonProps extends Omit<MenuDropdownProps, 'trigger' | 'label'> {
  /** The button's text: "Export", "Change Status (3)". */
  label: React.ReactNode;
  /** Figma State=Disabled. */
  disabled?: boolean;
}

export const MenuTriggerButton = React.forwardRef<HTMLDivElement, MenuTriggerButtonProps>(
  ({ label, disabled, ...props }, ref) => (
    <MenuDropdown
      ref={ref}
      trigger={
        <Button variant="default" size="normal" disabled={disabled} rightIcon={<Icon name="caret-down" />}>
          {label}
        </Button>
      }
      {...props}
    />
  ),
);
MenuTriggerButton.displayName = 'MenuTriggerButton';

/** Figma's State values. Hover and Pressed are `:hover` and `:active`; Disabled is `disabled`. */
export const MENU_TRIGGER_BUTTON_STATES = ['default', 'hover', 'pressed', 'disabled'] as const;
