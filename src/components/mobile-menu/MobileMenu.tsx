import * as React from 'react';
import { cn } from '../../lib/cn';
import type { AccountMenuItem } from '../account-menu';
import { renderNavLink, type AppHeaderLink, type AppHeaderRenderLink } from '../app-header/links';
import { Icon } from '../icon';
import { MobileHeader } from '../mobile-header';
import { Overlay } from '../overlay';
import type { ThemeToggleTheme } from '../theme-toggle';

/**
 * MobileMenu — built from the CAF Figma library, page "Navigation":
 * `Navigation / Mobile Menu – Admin` (462:851), the open mobile navigation:
 * "header with close, the 10 admin links (one Active), and the account row.
 * Swap link labels for the user app."
 *
 * Figma → code:
 * - The menu (full width, fill `surface.neutral.base`, Effects/Elevation
 *   Dark/3) → the panel: `w-full bg-surface-neutral-base shadow-elevation-3`,
 *   against the top of the screen.
 * - Mobile Header (Menu Open=true) → MobileHeader `menuOpen`: the logo, the
 *   theme toggle, the account menu and ✕, which asks to close.
 * - Links (vertical, 8 / 16 padding, 2 between; Navigation / Nav Link –
 *   Vertical, one State=Active) → a `<nav>` list of NavLink
 *   `orientation="vertical"`, from `links`; `page` is the Active one. The
 *   labels are data, so the same menu serves the user app (U08: "add Mobile
 *   Menu – User next to Mobile Menu – Admin").
 * - Account Row (12 / 16 padding, 12 between, a 1px `stroke.subtle` line on
 *   top; User glyph 20 and the name in Body/sm-medium, both `text.secondary`)
 *   → the signed-in person, `username`. It is text, as Figma draws it; the
 *   account menu is the header's User icon.
 *
 * Behaviour, hand-built on Overlay (as SideSheet is): the panel is a modal
 * dialog named "Menu" (`aria-label`), in a portal over the page's scrim. It
 * opens with focus on ✕, where ☰ was; Tab and Shift+Tab wrap inside it; the
 * page behind is inert and doesn't scroll. Escape, ✕, a tap on the scrim and
 * choosing a link ask `onClose` (pattern 15: "Choosing a link or tapping ✕
 * closes it"); the owner sets `open`, and focus goes back to ☰. The panel
 * scrolls when the screen is shorter than the menu.
 *
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("MobileMenu").
 */
export interface MobileMenuProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'children' | 'role' | 'aria-modal' | 'aria-label' | 'aria-labelledby' | 'onSelect'
  > {
  /** Whether it is open. Nothing is rendered while `false`. */
  open: boolean;
  /** Asked to close: ✕, Escape, a tap on the scrim, or a link chosen. Set `open` to false. */
  onClose: () => void;
  /** The navigation, in order: Figma's link labels, each with its `href`. */
  links: readonly AppHeaderLink[];
  /** Figma's Active link: the current page's label. */
  page?: string;
  /** Renders each link. Default: a NavLink `<a href>`. Return a NavLink with `as` for a router's link. */
  renderLink?: AppHeaderRenderLink;
  /** The signed-in person's name, in the Account Row. */
  username: string;
  /** The theme in use: ThemeToggle's Theme. */
  theme: ThemeToggleTheme;
  /** Called with the theme the user asked for. Switch it here. */
  onThemeChange?: (theme: ThemeToggleTheme) => void;
  /** Called with the account menu item the user chose. */
  onAccountSelect?: (item: AccountMenuItem) => void;
  /** Names the dialog. Default "Menu". */
  'aria-label'?: string;
  /** Names the `<nav>` landmark. Default "Main", as the desktop Nav Bar. */
  navLabel?: string;
  /** Where focus goes on close. Default: what had focus when it opened (☰). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

export const MobileMenu = React.forwardRef<HTMLDivElement, MobileMenuProps>(function MobileMenu(
  {
    open,
    onClose,
    links,
    page,
    renderLink = renderNavLink,
    username,
    theme,
    onThemeChange,
    onAccountSelect,
    'aria-label': ariaLabel = 'Menu',
    navLabel = 'Main',
    returnFocusRef,
    id,
    className,
    ...props
  },
  ref,
) {
  /* ✕ takes focus on open: it sits where ☰ was, and Enter closes again. */
  const closeRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <Overlay
      {...props}
      ref={ref}
      id={id}
      open={open}
      onClose={onClose}
      aria-label={ariaLabel}
      initialFocusRef={closeRef}
      returnFocusRef={returnFocusRef}
      /* Figma draws the menu against the top of the screen, full width. */
      backdropClassName="items-start p-0"
      className={cn(
        'flex max-h-full w-full flex-col overflow-y-auto bg-surface-neutral-base text-text-primary shadow-elevation-3',
        className,
      )}
    >
      <MobileHeader
        menuOpen
        onMenuOpenChange={(next) => {
          if (!next) onClose();
        }}
        menuId={id}
        menuButtonRef={closeRef}
        theme={theme}
        onThemeChange={onThemeChange}
        onAccountSelect={onAccountSelect}
        className="shrink-0"
      />
      <nav
        aria-label={navLabel}
        /* Choosing a link closes the menu, whoever renders the link (a router's link prevents the default). */
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('a[href]')) onClose();
        }}
      >
        {/* Links: vertical, 8 / 16 padding, 2 between. */}
        <ul className="flex flex-col gap-0.5 px-4 py-2">
          {links.map((link) => (
            <li key={link.label} className="flex">
              {renderLink(
                { href: link.href, children: link.label, active: link.label === page, orientation: 'vertical' },
                link,
              )}
            </li>
          ))}
        </ul>
      </nav>
      {/* Account Row: 12 / 16 padding, 12 between, 1px stroke.subtle on top; Body/sm-medium, text.secondary. */}
      <p
        data-part="account"
        className="flex shrink-0 items-center gap-3 border-t border-stroke-subtle px-4 py-3 text-body-sm-medium text-text-secondary"
      >
        <Icon name="user" size={20} />
        {username}
      </p>
    </Overlay>
  );
});
MobileMenu.displayName = 'MobileMenu';
