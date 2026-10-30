import * as React from 'react';
import { cn } from '../../lib/cn';
import { AccountMenu, type AccountMenuItem } from '../account-menu';
import { IconButton } from '../icon-button';
import { Logo } from '../logo';
import { ThemeToggle, THEME_TOGGLE_LABELS, type ThemeToggleTheme } from '../theme-toggle';
import { Tooltip } from '../tooltip';

/**
 * MobileHeader — built from the CAF Figma library, page "Navigation":
 * `Navigation / Mobile Header` (462:850, Menu Open false / true), the header
 * below 768px: "logo, theme, account and a hamburger".
 *
 * Figma → code:
 * - The variant (64 high: 12 / 16 padding, Space Between, centred; fill
 *   `surface.neutral.base`) → a flex row, `px-4 py-3`, `justify-between`.
 * - Logo (Navigation / Logo at 92 × 36) → Logo at `h-9`.
 * - Actions (horizontal, 8 between) → `gap-2`, holding three 40 × 40 frames,
 *   each with a glyph bound to `text.primary`:
 *   - Theme (Moon, 20) → ThemeToggle (`theme`, `onThemeChange`), in a Tooltip
 *     with its name, as pattern 15 asks for the icon-only toggle.
 *   - Account (User, 20) → AccountMenu, whose trigger is the same 40 × 40
 *     User icon. It opens Navigation / Account Menu (`onAccountSelect`).
 *   - Open Menu (List, 24) / Close Menu (X, 24) → IconButton size 40, `list`
 *     or `x`, named "Open menu" or "Close menu".
 * - Menu Open → `menuOpen`: false shows ☰, true shows ✕ ("Menu Open=true
 *   swaps the hamburger for a close icon"). The button reports the state it
 *   asks for in `onMenuOpenChange`.
 *
 * The menu button is a disclosure: `aria-expanded` is `menuOpen`, and
 * `aria-controls` is `menuId`, the id of the menu it opens (MobileMenu).
 * AppHeader wires the two together and shows this header below 768px.
 *
 * It is a plain group, not a landmark: AppHeader's `<header>` is the banner,
 * and the open MobileMenu (a dialog) holds a second one with Menu Open=true.
 * Nothing here changes the document: the theme and the menu are controlled.
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("MobileHeader").
 */
export interface MobileHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'> {
  /** Figma Menu Open: false shows ☰ (opens the menu), true shows ✕ (closes it). Default false. */
  menuOpen?: boolean;
  /** Called with the state the menu button asks for: `true` from ☰, `false` from ✕. */
  onMenuOpenChange?: (open: boolean) => void;
  /** The id of the menu the button opens, for `aria-controls`. */
  menuId?: string;
  /** A ref to the menu button, e.g. to focus ✕ when the menu opens. */
  menuButtonRef?: React.Ref<HTMLButtonElement>;
  /** The theme in use: ThemeToggle's Theme. */
  theme: ThemeToggleTheme;
  /** Called with the theme the user asked for. Switch it here. */
  onThemeChange?: (theme: ThemeToggleTheme) => void;
  /** Called with the account menu item the user chose. */
  onAccountSelect?: (item: AccountMenuItem) => void;
}

export const MobileHeader = React.forwardRef<HTMLDivElement, MobileHeaderProps>(function MobileHeader(
  {
    menuOpen = false,
    onMenuOpenChange,
    menuId,
    menuButtonRef,
    theme,
    onThemeChange,
    onAccountSelect,
    className,
    ...props
  },
  ref,
) {
  return (
    /* Menu Open=false / true: 12 / 16 padding, Space Between, centred, surface.neutral.base. */
    <div
      ref={ref}
      data-menu-open={menuOpen}
      className={cn('flex items-center justify-between bg-surface-neutral-base px-4 py-3', className)}
      {...props}
    >
      {/* Logo: Navigation / Logo scaled to 92 × 36. */}
      <Logo className="h-9" />
      {/* Actions: horizontal, 8 between. */}
      <div className="flex items-center gap-2">
        {/* Theme. Below it: the header is at the top of the screen. */}
        <Tooltip text={THEME_TOGGLE_LABELS[theme]} placement="bottom">
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
        </Tooltip>
        {/* Account: the User icon opens Navigation / Account Menu. */}
        <AccountMenu onSelect={onAccountSelect} />
        {/* Open Menu / Close Menu: the glyph is text.primary, as Figma binds it. */}
        <IconButton
          ref={menuButtonRef}
          icon={menuOpen ? 'x' : 'list'}
          label={menuOpen ? 'Close menu' : 'Open menu'}
          size={40}
          className="text-text-primary"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => onMenuOpenChange?.(!menuOpen)}
        />
      </div>
    </div>
  );
});
MobileHeader.displayName = 'MobileHeader';
