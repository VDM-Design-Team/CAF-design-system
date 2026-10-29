import * as React from 'react';
import { IconButton } from '../icon-button';
import { MenuDropdown, type MenuDropdownProps } from '../menu-dropdown';

/**
 * RowActionsMenu — built from the CAF Figma library, page "Menus":
 * `Menu / Row Actions Button`, the ••• at the end of every table row, with
 * the `Menu / Dropdown` it opens. Put it in a TableCell of type `actions` and
 * give it the row's MenuItems.
 *
 * Figma → code:
 * - The 32×32 ••• button → `<IconButton icon="dots-three">` (Ghost, 32). The
 *   library's one-off button differs from Button / Icon (radius 6, a 20px
 *   glyph, no hover); docs/figma-sync.md ("IconButton") has the list.
 * - The menu → MenuDropdown, below the button and flush with its right edge,
 *   as Figma's row actions pattern places it. It flips at the viewport's edges.
 *
 * `label` is the button's accessible name, and names the menu too. It is
 * "Row actions" by default; in a table with many rows, name the record
 * ("Actions for cost 123456").
 */
export interface RowActionsMenuProps extends Omit<MenuDropdownProps, 'trigger' | 'label'> {
  /** The ••• button's accessible name. Default "Row actions". */
  label?: string;
}

export const RowActionsMenu = React.forwardRef<HTMLDivElement, RowActionsMenuProps>(
  ({ label = 'Row actions', align = 'right', ...props }, ref) => (
    <MenuDropdown ref={ref} trigger={<IconButton icon="dots-three" label={label} />} align={align} {...props} />
  ),
);
RowActionsMenu.displayName = 'RowActionsMenu';
