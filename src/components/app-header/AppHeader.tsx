import * as React from 'react';
import { cn } from '../../lib/cn';
import type { AccountMenuItem } from '../account-menu';
import { MobileHeader } from '../mobile-header';
import { MobileMenu } from '../mobile-menu';
import { NavBar } from '../nav-bar';
import type { ThemeToggleTheme } from '../theme-toggle';
import { TopBar } from '../top-bar';
import { renderNavLink, type AppHeaderLink, type AppHeaderRenderLink } from './links';

/**
 * AppHeader — built from the CAF Figma library, page "Navigation": the
 * header every signed-in CAF page shares (patterns 15 and U08).
 * - `Navigation / Header` (4:286): the frame, "top bar plus the global
 *   navigation bar".
 * - `Navigation / Header – Admin` (403:3950, Page ×10) and `Navigation /
 *   Header – User` (420:1040, Page ×5): the same frame with the admin's and
 *   the user's links.
 * - Below 768px, `Navigation / Mobile Header` with `Navigation / Mobile Menu
 *   – Admin` (patterns 15 and U08: "Mobile Header with Mobile Menu below
 *   768 px wide").
 *
 * Figma → code:
 * - The frame (vertical, no gap, fill `surface.neutral.base`) → `<header>`,
 *   the page's banner, `bg-surface-neutral-base`.
 * - Top Bar Area (72 high, 0 / 192 padding, centred, `surface.neutral.base`)
 *   → TopBar in a row with `py-3` around its 48px (72 in all).
 * - Navigation Area (52 high, 0 / 192 padding, `surface.base`) → NavBar, whose
 *   8 / 0 padding around 36px links makes the 52.
 * - The 192px sides of the 1920 frame → a centred `container` (1536 wide at
 *   1920, as Figma) inside `px-6` gutters, so both rows line up with each other
 *   and with a page that uses the same container.
 * - Header – Admin / – User → `links`: label and `href` for each link, in
 *   order (APP_HEADER_ADMIN_PAGES and APP_HEADER_USER_PAGES are Figma's
 *   labels). Page → `page`, the current link's label: its NavLink is Active
 *   (`aria-current="page"`).
 * - Below 768px (`md:`), the two rows give way to MobileHeader. Its ☰ opens
 *   MobileMenu with the same links (`aria-expanded`, `aria-controls`). The
 *   menu's state is `menuOpen` (Mobile Header's Menu Open), uncontrolled by
 *   default; it closes when a link is chosen, and when the screen widens past
 *   768px.
 *
 * Routing isn't wired in: each link is an `<a href>`, and `renderLink` swaps
 * in a router's link. The theme is controlled (`theme`, `onThemeChange`):
 * nothing here changes the document. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("AppHeader").
 */
export interface AppHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onSelect'> {
  /** The navigation, in order: each link's label and `href`. Header – Admin's or Header – User's. */
  links: readonly AppHeaderLink[];
  /** Figma Page: the current page's label. Its link is Active. */
  page?: string;
  /** Renders each link. Default: a NavLink `<a href>`. Return a NavLink with `as` for a router's link. */
  renderLink?: AppHeaderRenderLink;
  /** Names the `<nav>` landmark. Default "Main". Each `<nav>` on a page needs its own name. */
  navLabel?: string;
  /** The signed-in person's name: "Hi, {username}" on desktop, the Mobile Menu's Account Row below 768px. */
  username: string;
  /** The theme in use: ThemeToggle's Theme. */
  theme: ThemeToggleTheme;
  /** Called with the theme the user asked for. Switch it here. */
  onThemeChange?: (theme: ThemeToggleTheme) => void;
  /** Called with the account menu item the user chose. */
  onAccountSelect?: (item: AccountMenuItem) => void;
  /** Mobile Header's Menu Open: whether the mobile menu is open. Leave it out to let the header keep it. */
  menuOpen?: boolean;
  /** Whether the mobile menu starts open, when `menuOpen` is left out. Default false. */
  defaultMenuOpen?: boolean;
  /** Called with the menu state asked for: ☰, ✕, Escape, a link chosen, or the screen widening past 768px. */
  onMenuOpenChange?: (open: boolean) => void;
}

/* Tailwind's `md`, where Figma swaps the Mobile Header for the desktop header. */
const DESKTOP = '(min-width: 48rem)';

export const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(function AppHeader(
  {
    links,
    page,
    renderLink = renderNavLink,
    navLabel = 'Main',
    username,
    theme,
    onThemeChange,
    onAccountSelect,
    menuOpen,
    defaultMenuOpen = false,
    onMenuOpenChange,
    className,
    ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultMenuOpen);
  const open = menuOpen ?? uncontrolled;
  const setOpen = (next: boolean) => {
    if (menuOpen === undefined) setUncontrolled(next);
    onMenuOpenChange?.(next);
  };
  /* The effect below must not rerun when an owner passes a new callback each render. */
  const setOpenRef = React.useRef(setOpen);
  React.useEffect(() => {
    setOpenRef.current = setOpen;
  });

  /* The mobile menu only exists below 768px: close it when the screen widens (a tablet turned). */
  React.useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia(DESKTOP);
    const onChange = () => {
      if (desktop.matches) setOpenRef.current(false);
    };
    onChange();
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, [open]);

  const menuId = `${React.useId()}-menu`;
  const shared = { theme, onThemeChange, onAccountSelect };

  return (
    /* Navigation / Header: vertical, no gap, surface.neutral.base. */
    <header ref={ref} className={cn('bg-surface-neutral-base', className)} {...props}>
      {/* 768px and wider: Top Bar Area over Navigation Area. */}
      <div data-part="desktop" className="hidden md:block">
        {/* Top Bar Area: 72 high (12 + the bar's 48 + 12), surface.neutral.base. */}
        <div data-part="top-bar-area" className="bg-surface-neutral-base px-6 py-3">
          <TopBar username={username} {...shared} className="container mx-auto" />
        </div>
        {/* Navigation Area: 52 high (the Nav Bar's), surface.base. Scrolls sideways if the links don't fit. */}
        <div data-part="navigation-area" className="overflow-x-auto bg-surface-base px-6">
          <NavBar aria-label={navLabel} className="container mx-auto">
            {links.map((link) => (
              <React.Fragment key={link.label}>
                {renderLink(
                  { href: link.href, children: link.label, active: link.label === page, orientation: 'horizontal' },
                  link,
                )}
              </React.Fragment>
            ))}
          </NavBar>
        </div>
      </div>
      {/* Below 768px: Mobile Header. Its ☰ opens the Mobile Menu. */}
      <MobileHeader
        data-part="mobile"
        className="md:hidden"
        menuOpen={open}
        onMenuOpenChange={setOpen}
        menuId={menuId}
        {...shared}
      />
      <MobileMenu
        id={menuId}
        open={open}
        onClose={() => setOpen(false)}
        links={links}
        page={page}
        renderLink={renderLink}
        navLabel={navLabel}
        username={username}
        {...shared}
      />
    </header>
  );
});
AppHeader.displayName = 'AppHeader';
