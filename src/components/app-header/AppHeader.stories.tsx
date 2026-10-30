import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ICON_PATHS } from '../icon/icons';
import { NavLink } from '../nav-link';
import type { ThemeToggleTheme } from '../theme-toggle';
import { AppHeader, type AppHeaderProps } from './AppHeader';
import { APP_HEADER_ADMIN_PAGES, APP_HEADER_USER_PAGES, type AppHeaderLink } from './links';

const href = (label: string) => `#${label.toLowerCase().replace(/ /g, '-')}`;
const ADMIN_LINKS: AppHeaderLink[] = APP_HEADER_ADMIN_PAGES.map((label) => ({ label, href: href(label) }));
const USER_LINKS: AppHeaderLink[] = APP_HEADER_USER_PAGES.map((label) => ({ label, href: href(label) }));

/* Storybook's own "Small mobile" viewport (320 × 568), from its default list. */
const MOBILE = { value: 'mobile1', isRotated: false } as const;

/* Tailwind's md: at this width and wider the desktop header shows. */
const isDesktop = () => window.matchMedia('(min-width: 48rem)').matches;

/* The app's side: it holds the page and the theme. Links go nowhere here: a click makes that
   link the current page, as the headers' Page property does. The document's theme is left alone. */
function WithAppState({
  page: initialPage,
  theme: initialTheme = 'dark',
  ...props
}: Omit<AppHeaderProps, 'theme'> & { theme?: ThemeToggleTheme }) {
  const [page, setPage] = React.useState(initialPage);
  const [theme, setTheme] = React.useState<ThemeToggleTheme>(initialTheme);
  return (
    // Room below for the account menu.
    <div className="pb-40">
      <AppHeader
        {...props}
        page={page}
        theme={theme}
        onThemeChange={(next) => {
          setTheme(next);
          props.onThemeChange?.(next);
        }}
        renderLink={(linkProps) => (
          <NavLink
            {...linkProps}
            onClick={(event) => {
              event.preventDefault();
              setPage(linkProps.children);
            }}
          />
        )}
      />
    </div>
  );
}

const meta = {
  title: 'Components/AppHeader',
  component: AppHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation**: `Navigation / Header`, `Header – Admin` (Page ×10) and ' +
          '`Header – User` (Page ×5), with `Mobile Header` and `Mobile Menu – Admin` below 768px. A `<header>` banner: ' +
          'the Top Bar Area (TopBar, `surface/neutral/base`) over the Navigation Area (NavBar, `surface/base`), both in ' +
          'a centred container (1536 at 1920, as Figma’s 192px sides). The links are data (`links`: label and `href`; ' +
          '`APP_HEADER_ADMIN_PAGES` and `APP_HEADER_USER_PAGES` are Figma’s labels), and Page is `page`, the current ' +
          'link. `renderLink` swaps in a router’s link. Below 768px (`md:`) the MobileHeader shows instead; its ☰ ' +
          'opens the MobileMenu with the same links. The theme is controlled (`theme`, `onThemeChange`).',
      },
    },
  },
  args: {
    links: ADMIN_LINKS,
    page: 'Recurring Costs',
    username: 'Admin Account',
    theme: 'dark',
    onThemeChange: fn(),
    onAccountSelect: fn(),
    onMenuOpenChange: fn(),
  },
  argTypes: {
    links: { control: false },
    renderLink: { control: false },
    page: { control: 'select', options: [...new Set([...APP_HEADER_ADMIN_PAGES, ...APP_HEADER_USER_PAGES])] },
  },
  render: (args) => <WithAppState {...args} />,
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Navigation / Header – Admin, Page=Recurring Costs (pattern 15). The banner
 * holds the Top Bar and the admin's ten links; a click moves the current page.
 */
export const Admin: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const banner = canvas.getByRole('banner');
    const nav = within(banner).getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([...APP_HEADER_ADMIN_PAGES]);
    await expect(within(nav).getByRole('link', { name: 'Recurring Costs' })).toHaveAttribute('aria-current', 'page');
    await expect(within(nav).getByRole('link', { name: 'Recurring Costs' })).toHaveAttribute('href', '#recurring-costs');

    await userEvent.click(within(nav).getByRole('link', { name: 'Exports' }));
    await expect(within(nav).getByRole('link', { name: 'Exports' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);

    // The Top Bar: greeting, theme toggle (controlled), account menu.
    const themeBefore = document.documentElement.className;
    await expect(within(banner).getByText('Hi, Admin Account')).toBeVisible();
    await userEvent.click(within(banner).getByRole('button', { name: 'Switch to light theme' }));
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('light');
    await expect(document.documentElement.className).toBe(themeBefore);
    await userEvent.click(within(banner).getByRole('button', { name: 'Account' }));
    await userEvent.click(within(banner).getByRole('menuitem', { name: 'Manage Currencies' }));
    await expect(args.onAccountSelect).toHaveBeenLastCalledWith('manage-currencies');

    // At this width the Mobile Header is hidden, so its buttons are out of the accessibility tree.
    await expect(canvas.queryByRole('button', { name: 'Open menu' })).toBeNull();
  },
};

/** Navigation / Header – User, Page=Create Cost (pattern U08): the user's five links. */
export const User: Story = {
  args: { links: USER_LINKS, page: 'Create Cost', username: 'QA Test' },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([...APP_HEADER_USER_PAGES]);
    await expect(within(nav).getByRole('link', { name: 'Create Cost' })).toHaveAttribute('aria-current', 'page');
    await expect(within(canvasElement).getByText('Hi, QA Test')).toBeVisible();
  },
};

/* A router's link component: it takes `to`, not `href`. */
const RouterLink = React.forwardRef<
  HTMLAnchorElement,
  { to: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
>(function RouterLink({ to, ...props }, ref) {
  return <a ref={ref} href={to} data-router-link="" {...props} />;
});

/** `renderLink` renders each link with a router's link component, through NavLink's `as`. */
export const WithRouterLinks: Story = {
  args: { links: USER_LINKS, page: 'Drafts' },
  render: (args) => (
    <AppHeader {...args} renderLink={({ href: to, ...props }) => <NavLink {...props} as={RouterLink} to={to} />} />
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Main' });
    for (const link of within(nav).getAllByRole('link')) {
      await expect(link).toHaveAttribute('data-router-link');
      await expect(link).toHaveAttribute('href', href(link.textContent!));
    }
    await expect(within(nav).getByRole('link', { name: 'Drafts' })).toHaveAttribute('aria-current', 'page');
  },
};

/* ── Several Page values, in Light and Dark ────────────────────────────────
   Header – Admin and Header – User at a desktop width. Each header sits in its
   own named region (so it isn't one of several banners) with its own nav name.
   Checked against Navigation / Header's bindings: the frame and Top Bar Area
   surface.neutral.base, 72 high; the Navigation Area surface.base, 52 high;
   only the Page's link Active; both rows in the same centred container. */

/* A token's computed colour in the current theme. Measure before waitFor, never inside it:
   the probe is a DOM mutation, and waitFor reruns its callback on every mutation. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

const SETS = {
  Admin: { links: ADMIN_LINKS, pages: ['Costs', 'Recurring Costs', 'Drafts'], username: 'Admin Account' },
  User: { links: USER_LINKS, pages: ['Costs', 'Create Cost', 'Drafts'], username: 'QA Test' },
} as const;

const pages = (set: keyof typeof SETS, theme: 'light' | 'dark'): Story => ({
  name: `Header – ${set} — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6 py-6">
      {SETS[set].pages.map((page) => (
        <section key={page} aria-label={`Header – ${set}, Page=${page}`} className="flex flex-col gap-2">
          <span className="px-6 text-caption-md-medium text-text-secondary">Page={page}</span>
          <AppHeader
            links={SETS[set].links}
            page={page}
            navLabel={`${set} navigation, Page=${page}`}
            username={SETS[set].username}
            theme={theme}
          />
        </section>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      frame: tokenColour('surface-neutral-base'),
      nav: tokenColour('surface-base'),
      active: tokenColour('neutral-tonal-surface-default'),
      none: 'rgba(0, 0, 0, 0)',
    };
    await waitFor(() => {
      for (const page of SETS[set].pages) {
        const region = within(canvasElement).getByRole('region', { name: `Header – ${set}, Page=${page}` });
        const header = region.querySelector('header')!;
        expect(getComputedStyle(header).backgroundColor).toBe(want.frame);
        // Desktop only: the Mobile Header is hidden.
        expect(getComputedStyle(header.querySelector('[data-part="mobile"]')!).display).toBe('none');

        const topArea = header.querySelector<HTMLElement>('[data-part="top-bar-area"]')!;
        const navArea = header.querySelector<HTMLElement>('[data-part="navigation-area"]')!;
        expect(getComputedStyle(topArea).backgroundColor).toBe(want.frame);
        expect(topArea.getBoundingClientRect().height).toBe(72);
        expect(getComputedStyle(navArea).backgroundColor).toBe(want.nav);
        expect(navArea.getBoundingClientRect().height).toBe(52);
        expect(header.getBoundingClientRect().height).toBe(124);

        // The links, only the Page's Active.
        const nav = within(header).getByRole('navigation', { name: `${set} navigation, Page=${page}` });
        const links = [...nav.querySelectorAll<HTMLAnchorElement>('a')];
        expect(links.map((a) => a.textContent)).toEqual(SETS[set].links.map((l) => l.label));
        for (const a of links) {
          const current = a.textContent === page;
          expect(a.getAttribute('aria-current')).toBe(current ? 'page' : null);
          expect(getComputedStyle(a).backgroundColor).toBe(current ? want.active : want.none);
        }

        // Top Bar and Nav Bar share one centred container: the logo and the first link line up.
        const bar = topArea.firstElementChild!.getBoundingClientRect();
        const row = nav.getBoundingClientRect();
        expect(bar.left).toBeCloseTo(row.left, 0);
        expect(bar.right).toBeCloseTo(row.right, 0);
        expect((bar.left + bar.right) / 2).toBeCloseTo(header.getBoundingClientRect().width / 2, 0);
        expect(bar.height).toBe(48);
        expect(links[0].getBoundingClientRect().left).toBeCloseTo(bar.left, 0);
        expect(within(header).getByRole('img', { name: 'CAF' }).getBoundingClientRect().left).toBeCloseTo(bar.left, 0);
      }
    });
  },
});

export const AdminPagesLight = pages('Admin', 'light');
export const AdminPagesDark = pages('Admin', 'dark');
export const UserPagesLight = pages('User', 'light');
export const UserPagesDark = pages('User', 'dark');

/* ── Below 768px, in Light and Dark ────────────────────────────────────────
   At a mobile viewport the Mobile Header replaces the two rows. These stories
   set Storybook's "Small mobile" viewport, which Storybook and Vitest apply.
   test:static opens each story page at the browser's own 1280 width, where the
   desktop header is the right one, so each check follows the width it gets. */

const mobile = (theme: 'light' | 'dark'): Story => ({
  name: `Below 768px — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: (args) => <AppHeader {...args} theme={theme} />,
  globals: { theme, viewport: MOBILE },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { frame: tokenColour('surface-neutral-base'), glyph: tokenColour('text-primary') };
    const banner = within(canvasElement).getByRole('banner');
    const desktop = banner.querySelector<HTMLElement>('[data-part="desktop"]')!;
    const header = banner.querySelector<HTMLElement>('[data-part="mobile"]')!;
    if (isDesktop()) {
      await expect(getComputedStyle(header).display).toBe('none');
      await expect(getComputedStyle(desktop).display).toBe('block');
      return;
    }
    // Only the Mobile Header: no Top Bar, no Nav Bar.
    await expect(getComputedStyle(desktop).display).toBe('none');
    await expect(within(banner).queryByRole('navigation')).toBeNull();
    await expect(getComputedStyle(header).backgroundColor).toBe(want.frame);
    await expect(header.getBoundingClientRect().height).toBe(64);
    await expect(banner.getBoundingClientRect().height).toBe(64);
    const opener = within(banner).getByRole('button', { name: 'Open menu' });
    await expect(opener).toHaveAttribute('aria-expanded', 'false');
    await expect(opener.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.list);
    await expect(getComputedStyle(opener.querySelector('svg')!).color).toBe(want.glyph);
    await expect(opener.getBoundingClientRect().right).toBeCloseTo(window.innerWidth - 16, 0);
  },
});

export const MobileLight = mobile('light');
export const MobileDark = mobile('dark');

/**
 * Below 768px, ☰ opens the Mobile Menu with the header's links (`aria-controls`
 * names it), focus on ✕ and trapped. Escape closes it and focus returns to ☰;
 * choosing a link closes it and makes that link the current page.
 */
export const MobileMenuOpen: Story = {
  globals: { viewport: MOBILE },
  parameters: { controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const banner = within(canvasElement).getByRole('banner');
    if (isDesktop()) {
      // test:static's 1280 width: no menu button, the desktop links instead.
      await expect(within(banner).getByRole('navigation', { name: 'Main' })).toBeVisible();
      return;
    }
    const opener = within(banner).getByRole('button', { name: 'Open menu' });
    await userEvent.click(opener);
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    await expect(args.onMenuOpenChange).toHaveBeenLastCalledWith(true);
    await expect(opener).toHaveAttribute('aria-expanded', 'true');
    await expect(opener).toHaveAttribute('aria-controls', menu.id);
    const close = within(menu).getByRole('button', { name: 'Close menu' });
    await waitFor(() => expect(close).toHaveFocus());

    const nav = within(menu).getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([...APP_HEADER_ADMIN_PAGES]);
    await expect(within(nav).getByRole('link', { name: 'Recurring Costs' })).toHaveAttribute('aria-current', 'page');
    await expect(menu.querySelector('[data-part="account"]')).toHaveTextContent('Admin Account');

    // Trapped: Shift+Tab from the first control wraps to the last link, Tab back again.
    await userEvent.tab();
    await expect(links[0]).toHaveFocus();
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await expect(links[links.length - 1]).toHaveFocus();
    await userEvent.tab();
    await expect(within(menu).getByRole('button', { name: 'Switch to light theme' })).toHaveFocus();
    await userEvent.tab({ shift: true });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onMenuOpenChange).toHaveBeenLastCalledWith(false);
    await expect(opener).toHaveFocus();
    await expect(opener).toHaveAttribute('aria-expanded', 'false');

    // Choosing a link closes it; that link is the current page.
    await userEvent.click(opener);
    const again = await screen.findByRole('dialog', { name: 'Menu' });
    await userEvent.click(within(again).getByRole('link', { name: 'Contacts' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();
    await userEvent.click(opener);
    const third = await screen.findByRole('dialog', { name: 'Menu' });
    await expect(within(third).getByRole('link', { name: 'Contacts' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(third).getByRole('button', { name: 'Close menu' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
