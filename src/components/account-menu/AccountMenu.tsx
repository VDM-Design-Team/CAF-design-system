import * as React from 'react';
import { IconButton } from '../icon-button';
import { MenuDropdown, type MenuDropdownProps } from '../menu-dropdown';
import { MenuItem } from '../menu-item';

/**
 * AccountMenu — built from the CAF Figma library, page "Navigation":
 * `Navigation / Account Menu` (462:793), the menu behind the account icon at
 * the right of the header: Manage Currencies, Settings, a divider, Logout
 * (patterns 15 and U06).
 *
 * Figma → code:
 * - The panel (fill `surface.neutral.faint`, 1px inside `stroke.subtle`,
 *   radius 8, Elevation 3, padding 6, 2px between rows) → MenuDropdown, whose
 *   surface is Menu / Dropdown's: the same bindings.
 * - Fixed width 220 (raw) → MenuDropdown's minimum, 256 (`space.256`).
 * - Item / Manage Currencies, Item / Settings, Item / Logout (Menu / Item,
 *   Type=Default) → three MenuItems, in Figma's order and words. Logout is
 *   Type=Default in Figma, so it isn't `destructive`.
 * - Divider (a 1px rectangle filled `stroke.subtle`) → a `role="separator"`
 *   with a 1px top border in `stroke.subtle`.
 * - The trigger → `trigger`. Default: the header's account icon, Navigation /
 *   Icon Button (40×40, User glyph) as IconButton size 40, named "Account".
 *   Its glyph is `text.primary`, the colour Figma binds the icon to.
 *
 * Figma's component has no properties, so the items are fixed. `onSelect`
 * gets the one the user chose ('manage-currencies', 'settings' or 'logout');
 * the app opens the dialog, goes to the page or signs out (pattern U06).
 *
 * Keyboard and focus are MenuDropdown's (the WAI-ARIA menu button): Enter,
 * Space or ↓ opens on the first item, ↑ on the last; ↓ / ↑ / Home / End move;
 * Enter or Space chooses; Escape and Tab close; focus goes back to the
 * trigger. It opens below the trigger, flush with its right edge (`align`),
 * as pattern 15 places it in the top-right corner.
 *
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("AccountMenu").
 */
export type AccountMenuItem = 'manage-currencies' | 'settings' | 'logout';

/** Figma's rows, in order. The divider sits before Logout. */
export const ACCOUNT_MENU_ITEMS = [
  { item: 'manage-currencies', label: 'Manage Currencies' },
  { item: 'settings', label: 'Settings' },
  { item: 'logout', label: 'Logout' },
] as const satisfies ReadonlyArray<{ item: AccountMenuItem; label: string }>;

export interface AccountMenuProps extends Omit<MenuDropdownProps, 'trigger' | 'children' | 'onSelect'> {
  /**
   * The control that opens the menu. Default: the header's account icon, an
   * IconButton (size 40, User glyph) named "Account", which also names the menu.
   */
  trigger?: React.ReactElement<any>;
  /** Called with the item the user chose. The menu then closes and focus goes back to the trigger. */
  onSelect?: (item: AccountMenuItem) => void;
}

export const AccountMenu = React.forwardRef<HTMLDivElement, AccountMenuProps>(function AccountMenu(
  { trigger, onSelect, align = 'right', ...props },
  ref,
) {
  return (
    <MenuDropdown
      ref={ref}
      trigger={
        trigger ?? (
          /* Navigation / Icon Button: 40×40, User glyph. Figma binds the icon to text.primary. */
          <IconButton icon="user" label="Account" size={40} className="text-text-primary" />
        )
      }
      align={align}
      {...props}
    >
      {ACCOUNT_MENU_ITEMS.map(({ item, label }) => (
        <React.Fragment key={item}>
          {/* Figma's Divider: a 1px rectangle filled stroke.subtle, between Settings and Logout. */}
          {item === 'logout' && <div role="separator" className="shrink-0 border-t border-stroke-subtle" />}
          <MenuItem data-item={item} onClick={() => onSelect?.(item)}>
            {label}
          </MenuItem>
        </React.Fragment>
      ))}
    </MenuDropdown>
  );
});
AccountMenu.displayName = 'AccountMenu';
