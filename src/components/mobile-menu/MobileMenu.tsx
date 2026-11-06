import * as React from 'react';
import { cn } from '../../lib/cn';
import { AccountMenu, type AccountMenuItem } from '../account-menu';
import { renderNavLink, type AppHeaderLink, type AppHeaderRenderLink } from '../app-header/links';
import { Icon } from '../icon';
import { MobileHeader } from '../mobile-header';
import { Overlay } from '../overlay';
import type { ThemeToggleTheme } from '../theme-toggle';

/**
 * MobileMenu — built from the CAF Figma library, page "Navigation":
 * `Navigation / Mobile Menu` (864:1343, since 5 Nov 2026; it was `Navigation
 * / Mobile Menu – Admin`), the open mobile navigation: "header with close,
 * the links (one Active) and the account row, which opens Navigation /
 * Account Menu". Its Links property is Admin (462:851, the ten admin links)
 * or User (864:1290, U08's five).
 *
 * Figma → code:
 * - The menu (full width, fill `surface.neutral.base`, Effects/Elevation
 *   Dark/3) → the panel: `w-full bg-surface-neutral-base shadow-elevation-3`,
 *   against the top of the screen.
 * - Mobile Header (Menu Open=true) → MobileHeader `menuOpen`: the logo, the
 *   theme toggle, the account menu and ✕, which asks to close.
 * - Links (vertical, 8 / 16 padding, 2 between; Navigation / Nav Link –
 *   Vertical, one State=Active) → a `<nav>` list of NavLink
 *   `orientation="vertical"`, from `links`; `page` is the Active one.
 *   Links=Admin / Links=User → `links`: the admin's or the user's list
 *   (APP_HEADER_ADMIN_PAGES, APP_HEADER_USER_PAGES), as data. Leave `page`
 *   out (or pass a page outside the links, such as Settings) and no link is
 *   Active, as the headers' Page=None.
 * - Account Row (12 / 16 padding, 12 between, a 1px `stroke.subtle` line on
 *   top; User glyph 20 and the name in Body/sm-medium, both `text.secondary`)
 *   → AccountMenu's trigger: a full-width button with the glyph and
 *   `username`. It opens Navigation / Account Menu below it, its left edge
 *   16 in, under the glyph (pattern 15 step 3: "The account row opens the
 *   Account Menu"). The row looks as Figma draws it, with no caret and no
 *   open look. The menu is portalled on `document.body`, so the panel's
 *   scroll doesn't cut it off.
 *
 * Choosing an account item, from the Account Row or from the header's
 * account icon, closes the Account Menu and asks `onClose`; once both have
 * closed and focus is back on ☰, `onAccountSelect` gets the item. So the
 * app's handler can move focus on, into a dialog it opens. Escape and a tap
 * outside the Account Menu close only the Account Menu.
 *
 * Behaviour, hand-built on Overlay (as SideSheet is): the panel is a modal
 * dialog named "Menu" (`aria-label`), in a portal over the page's scrim. It
 * opens with focus on ✕, where ☰ was; Tab and Shift+Tab wrap inside it; the
 * page behind is inert and doesn't scroll. Escape, ✕, a tap on the scrim,
 * choosing a link (pattern 15: "Choosing a link or tapping ✕ closes it") and
 * choosing an account item ask `onClose`; the owner sets `open`, and focus
 * goes back to ☰. The panel scrolls when the screen is shorter than the menu.
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
  /** Asked to close: ✕, Escape, a tap on the scrim, a link chosen, or an account item chosen. Set `open` to false. */
  onClose: () => void;
  /** Figma Links (Admin or User): the navigation, in order, Figma's link labels, each with its `href`. */
  links: readonly AppHeaderLink[];
  /** Figma's Active link: the current page's label. Left out (or a page outside `links`), no link is Active. */
  page?: string;
  /** Renders each link. Default: a NavLink `<a href>`. Return a NavLink with `as` for a router's link. */
  renderLink?: AppHeaderRenderLink;
  /** The signed-in person's name, in the Account Row. */
  username: string;
  /** The theme in use: ThemeToggle's Theme. */
  theme: ThemeToggleTheme;
  /** Called with the theme the user asked for. Switch it here. */
  onThemeChange?: (theme: ThemeToggleTheme) => void;
  /** Called with the account menu item the user chose, after the Account Menu and this menu have closed. */
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

  /* An account item closes both menus first, then goes to onAccountSelect. The item is passed on in an
     effect: it runs after the commit that closed the menu, whose Overlay cleanup has given focus back to ☰,
     so focus the app's handler moves (into a dialog it opens) stays where it put it. */
  const [chosen, setChosen] = React.useState<{ item: AccountMenuItem } | null>(null);
  const onAccountSelectRef = React.useRef(onAccountSelect);
  React.useEffect(() => {
    onAccountSelectRef.current = onAccountSelect;
  });
  React.useEffect(() => {
    if (chosen) onAccountSelectRef.current?.(chosen.item);
  }, [chosen]);
  const chooseAccount = (item: AccountMenuItem) => {
    setChosen({ item });
    onClose();
  };

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
        onAccountSelect={chooseAccount}
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
      {/* Account Row: AccountMenu's trigger. The menu opens below it, 16 in (under the glyph), on <body>. */}
      <AccountMenu
        onSelect={chooseAccount}
        label="Account"
        align="left"
        portal
        className="flex w-full shrink-0"
        panelClassName="ml-4"
        trigger={
          /* 12 / 16 padding, 12 between, 1px stroke.subtle on top; Body/sm-medium, text.secondary. Figma has
             no Focus state: the ring is stroke.focused, inside the row, as the menu clips at its sides. */
          <button
            type="button"
            data-part="account"
            className={cn(
              'flex w-full cursor-pointer items-center gap-3 border-t border-stroke-subtle px-4 py-3 text-left',
              'text-body-sm-medium text-text-secondary',
              'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focused',
            )}
          >
            <Icon name="user" size={20} />
            {username}
          </button>
        }
      />
    </Overlay>
  );
});
MobileMenu.displayName = 'MobileMenu';
