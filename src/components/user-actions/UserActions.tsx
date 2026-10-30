import * as React from 'react';
import { cn } from '../../lib/cn';
import { AccountMenu, type AccountMenuItem } from '../account-menu';
import { ThemeToggle, THEME_TOGGLE_LABELS, type ThemeToggleTheme } from '../theme-toggle';
import { Tooltip } from '../tooltip';
import { UserGreeting } from '../user-greeting';

/**
 * UserActions — built from the CAF Figma library, page "Navigation":
 * `Navigation / User Actions` (4:259), the right end of the top bar:
 * "Greeting + theme toggle + account icon buttons" (its description).
 *
 * Figma → code:
 * - Auto layout, horizontal, centred, no gap → `flex items-center`.
 * - Navigation / User Greeting → UserGreeting (`username`).
 * - The first Navigation / Icon Button → ThemeToggle (`theme`,
 *   `onThemeChange`), in a Tooltip with its name. Figma places a second User
 *   icon there, but its description and patterns 15 and U08 put the theme
 *   toggle in this spot ("give it a tooltip").
 * - The second Navigation / Icon Button (User glyph) → AccountMenu's trigger,
 *   which opens Navigation / Account Menu below it, flush right (`onAccountSelect`).
 *
 * The theme is controlled: the toggle reports the theme the user asked for in
 * `onThemeChange`, and the app switches it (and remembers it, pattern 15).
 * Nothing here changes the document.
 *
 * It is a plain group, not a landmark: put it in the header's banner.
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("UserActions").
 */
export interface UserActionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'> {
  /** The signed-in person's name, for "Hi, {username}". */
  username: string;
  /** The theme in use: ThemeToggle's Theme. */
  theme: ThemeToggleTheme;
  /** Called with the theme the user asked for. Switch it here. */
  onThemeChange?: (theme: ThemeToggleTheme) => void;
  /** Called with the account menu item the user chose. */
  onAccountSelect?: (item: AccountMenuItem) => void;
}

export const UserActions = React.forwardRef<HTMLDivElement, UserActionsProps>(
  ({ username, theme, onThemeChange, onAccountSelect, className, ...props }, ref) => (
    /* Figma: horizontal auto layout, centred, 0 gap. The buttons' own 40×40 boxes space them. */
    <div ref={ref} className={cn('flex items-center', className)} {...props}>
      <UserGreeting username={username} />
      {/* Pattern 15: the toggle is icon-only, so it gets a tooltip. Below it: the header is at the top. */}
      <Tooltip text={THEME_TOGGLE_LABELS[theme]} placement="bottom">
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
      </Tooltip>
      <AccountMenu onSelect={onAccountSelect} />
    </div>
  ),
);
UserActions.displayName = 'UserActions';
