import * as React from 'react';
import { cn } from '../../lib/cn';
import type { AccountMenuItem } from '../account-menu';
import { Logo } from '../logo';
import type { ThemeToggleTheme } from '../theme-toggle';
import { UserActions } from '../user-actions';

/**
 * TopBar — built from the CAF Figma library, page "Navigation":
 * `Navigation / Top Bar` (4:268), the top row of the desktop header: "Logo
 * on the left, user greeting and utility icon buttons on the right."
 *
 * Figma → code:
 * - Auto layout, horizontal, no gap, centred; it hugs its height (48, the
 *   Logo's) and fills the header's width → a full-width flex row,
 *   `items-center`.
 * - Navigation / Logo → Logo (123 × 48).
 * - Spacer (a 1px-high frame set to Fill) → `justify-between`: it pushes the
 *   user actions to the right edge.
 * - Navigation / User Actions → UserActions: "Hi, {username}", the theme
 *   toggle and the account icon (`username`, `theme`, `onThemeChange`,
 *   `onAccountSelect`).
 *
 * Figma's component has no properties. The greeting's name and the theme in
 * use are data here; the theme stays controlled (nothing here changes the
 * document). It is a plain group: AppHeader's `<header>` is the banner.
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("TopBar").
 */
export interface TopBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'> {
  /** The signed-in person's name, for "Hi, {username}". */
  username: string;
  /** The theme in use: ThemeToggle's Theme. */
  theme: ThemeToggleTheme;
  /** Called with the theme the user asked for. Switch it here. */
  onThemeChange?: (theme: ThemeToggleTheme) => void;
  /** Called with the account menu item the user chose. */
  onAccountSelect?: (item: AccountMenuItem) => void;
}

export const TopBar = React.forwardRef<HTMLDivElement, TopBarProps>(function TopBar(
  { username, theme, onThemeChange, onAccountSelect, className, ...props },
  ref,
) {
  return (
    /* Horizontal, no gap, centred. The Spacer between Logo and User Actions is `justify-between`. */
    <div ref={ref} className={cn('flex items-center justify-between', className)} {...props}>
      <Logo />
      <UserActions
        username={username}
        theme={theme}
        onThemeChange={onThemeChange}
        onAccountSelect={onAccountSelect}
      />
    </div>
  );
});
TopBar.displayName = 'TopBar';
