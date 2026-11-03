import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ACCOUNT_MENU_ITEMS, type AccountMenuItem } from '../../components/account-menu';
import { APP_HEADER_ADMIN_PAGES, APP_HEADER_USER_PAGES } from '../../components/app-header';
import type { ThemeToggleTheme } from '../../components/theme-toggle';
import { signedInAccounts } from '../fixtures';
import { PageHeader } from '../../components/page-header';
import { AppShell, useDocumentTheme, type ShellApp } from './AppShell';

/* Storybook's own "Small mobile" viewport (320 × 568). Chromatic ignores the
   global, so these stories also set chromatic.viewports (CLAUDE.md). */
const MOBILE = { value: 'mobile1', isRotated: false } as const;
const MOBILE_SNAPSHOT = { viewports: [320] };

/* Tailwind's md: at this width and wider the desktop header shows. test:static's
   channel pass renders every story at 1280, so the mobile plays follow the width. */
const isDesktop = () => window.matchMedia('(min-width: 48rem)').matches;

/* The admin-only links, which the user app never shows (U08, step 4). */
const ADMIN_ONLY = APP_HEADER_ADMIN_PAGES.filter((label) => !(APP_HEADER_USER_PAGES as readonly string[]).includes(label));

interface ShellDemoProps {
  app: ShellApp;
  /** The page the story starts on. */
  page: string;
  username: string;
  theme: ThemeToggleTheme;
  defaultMenuOpen?: boolean;
  onNavigate?: (page: string) => void;
  onThemeChange?: (theme: ThemeToggleTheme) => void;
  onAccountSelect?: (item: AccountMenuItem) => void;
}

/* The app's side: it holds the current page and the theme. A link makes its page
   current; the page is its PageHeader (Figma's step 1 draws Recurring Costs as
   just that). The theme follows the toggle on <html>, as the Theme toolbar does. */
function ShellDemo({ app, page: startPage, username, theme: startTheme, defaultMenuOpen, onNavigate, onThemeChange, onAccountSelect }: ShellDemoProps) {
  const [page, setPage] = useState(startPage);
  const [theme, setTheme] = useDocumentTheme(startTheme);
  return (
    <AppShell
      app={app}
      page={page}
      username={username}
      theme={theme}
      defaultMenuOpen={defaultMenuOpen}
      onNavigate={(next) => {
        setPage(next);
        onNavigate?.(next);
      }}
      onThemeChange={(next) => {
        setTheme(next);
        onThemeChange?.(next);
      }}
      onAccountSelect={onAccountSelect}
    >
      <PageHeader title={page} />
    </AppShell>
  );
}

const meta = {
  title: 'Patterns/App shell & navigation',
  component: ShellDemo,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Patterns 15 and U08 (Figma 530:7799, 545:26643): the frame around every signed-in page. `AppShell` ' +
          '(`src/patterns/app-shell/AppShell.tsx`, a story-level scaffold) is the AppHeader (Header – Admin or Header – ' +
          'User) over one `<main>`, which lines up with the header’s container. The current page’s link is Active; the ' +
          'theme toggle switches CAF’s theme on `<html>`, as the Theme toolbar does; the account icon opens the Account ' +
          'Menu; below 768px the links move into the Mobile Menu behind ☰.',
      },
    },
  },
  args: {
    app: 'admin',
    page: 'Recurring Costs',
    username: signedInAccounts.admin.name,
    theme: 'light',
    onNavigate: fn(),
    onThemeChange: fn(),
    onAccountSelect: fn(),
  },
  /* The theme starts where the toolbar is. */
  render: (args, { globals }) => <ShellDemo {...args} theme={globals.theme === 'dark' ? 'dark' : 'light'} />,
} satisfies Meta<typeof ShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Pattern 15, step 1: the admin header over a page. Recurring Costs is current;
 * choosing another link, by pointer or keyboard, makes that page current and
 * moves the Active link with it.
 */
export const Admin: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const banner = canvas.getByRole('banner');
    const nav = within(banner).getByRole('navigation', { name: 'Main' });
    const main = canvas.getByRole('main');
    await expect(canvas.getAllByRole('main')).toHaveLength(1);

    // The admin's ten links, in Figma's order; the Page's link is the current one.
    const links = within(nav).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([...APP_HEADER_ADMIN_PAGES]);
    await expect(within(nav).getByRole('link', { name: 'Recurring Costs' })).toHaveAttribute('aria-current', 'page');
    await expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Recurring Costs');
    await expect(within(banner).getByText('Hi, Admin Account')).toBeVisible();

    // A click moves the current page.
    await userEvent.click(within(nav).getByRole('link', { name: 'Exports' }));
    await expect(args.onNavigate).toHaveBeenLastCalledWith('Exports');
    await expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Exports');
    await expect(within(nav).getByRole('link', { name: 'Exports' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);

    // So does the keyboard: Tab along the links, Enter follows one.
    within(nav).getByRole('link', { name: 'Costs' }).focus();
    await userEvent.tab();
    await expect(within(nav).getByRole('link', { name: 'Bulk Upload' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Bulk Upload');
    await expect(within(nav).getByRole('link', { name: 'Bulk Upload' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);

    // The page lines up with the header: its title under the logo, below both rows.
    const logo = within(banner).getByRole('img', { name: 'CAF' }).getBoundingClientRect();
    const title = within(main).getByRole('heading', { level: 1 }).getBoundingClientRect();
    await expect(title.left).toBeCloseTo(logo.left, 0);
    await expect(title.top).toBeGreaterThan(banner.getBoundingClientRect().bottom);
  },
};

/**
 * U08: the user header over Costs, the home page after sign-in. Five links;
 * none of the admin's pages (Cost Centers, Partners, Contacts, Users,
 * Announcements, Exports).
 */
export const User: Story = {
  args: { app: 'user', page: 'Costs', username: signedInAccounts.user.name },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = within(canvas.getByRole('banner')).getByRole('navigation', { name: 'Main' });
    const main = canvas.getByRole('main');
    const links = within(nav).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([...APP_HEADER_USER_PAGES]);
    for (const label of ADMIN_ONLY) await expect(within(nav).queryByRole('link', { name: label })).toBeNull();
    await expect(within(nav).getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByText('Hi, QA Test')).toBeVisible();

    // Keyboard: from Costs, Tab to Create Cost and follow it.
    within(nav).getByRole('link', { name: 'Costs' }).focus();
    await userEvent.tab();
    await expect(within(nav).getByRole('link', { name: 'Create Cost' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onNavigate).toHaveBeenLastCalledWith('Create Cost');
    await expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Create Cost');
    await expect(within(nav).getByRole('link', { name: 'Create Cost' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
  },
};

/**
 * Pattern 15, "How it works" 3: the theme toggle switches between Light and
 * Dark at once. It is icon-only, so it has a tooltip, which keyboard focus
 * shows. The story switches `.dark` on `<html>`, where the Theme toolbar does.
 */
export const ThemeToggle: Story = {
  name: 'Theme toggle',
  // It changes the whole document, docs page included.
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const banner = within(canvasElement).getByRole('banner');
    const toggle = within(banner).getByRole('button', { name: 'Switch to dark theme' });
    await expect(document.documentElement).not.toHaveClass('dark');

    await userEvent.click(toggle);
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('dark');
    await expect(document.documentElement).toHaveClass('dark');
    // The same button now offers the way back.
    await expect(toggle).toHaveAccessibleName('Switch to light theme');

    // From the keyboard: Tab onto it shows the tooltip with its name; Enter switches back.
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await waitFor(() => expect(within(banner).getByRole('tooltip')).toHaveTextContent('Switch to light theme'));
    await userEvent.keyboard('{Enter}');
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('light');
    await expect(document.documentElement).not.toHaveClass('dark');
    await expect(toggle).toHaveAccessibleName('Switch to dark theme');
    await waitFor(() => expect(within(banner).getByRole('tooltip')).toHaveTextContent('Switch to dark theme'));
  },
};

/**
 * Pattern 15, step 1: the account icon opens the Account Menu in the top-right
 * corner: Manage Currencies, Settings, Logout. Keyboard first (Enter opens it on
 * the first item, arrows move, Escape closes and returns focus), then left open.
 */
export const AccountMenu: Story = {
  name: 'Account menu',
  play: async ({ args, canvasElement }) => {
    const banner = within(canvasElement).getByRole('banner');
    const account = within(banner).getByRole('button', { name: 'Account' });

    account.focus();
    await userEvent.keyboard('{Enter}');
    const menu = await within(banner).findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    await expect(items.map((item) => item.textContent)).toEqual(ACCOUNT_MENU_ITEMS.map((item) => item.label));
    await waitFor(() => expect(items[0]).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await expect(items[1]).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(banner).queryByRole('menu')).toBeNull());
    await expect(account).toHaveFocus();

    // Enter on Settings chooses it; the menu closes.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(within(within(banner).getByRole('menu')).getAllByRole('menuitem')[0]).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(args.onAccountSelect).toHaveBeenLastCalledWith('settings');
    await waitFor(() => expect(within(banner).queryByRole('menu')).toBeNull());
    await expect(account).toHaveFocus();

    // Open again for the snapshot: under the icon, flush with its right edge, over the page.
    await userEvent.click(account);
    const open = await within(banner).findByRole('menu');
    const trigger = account.getBoundingClientRect();
    const panel = open.getBoundingClientRect();
    await expect(panel.right).toBeCloseTo(trigger.right, 0);
    await expect(panel.top).toBeGreaterThanOrEqual(trigger.bottom);
  },
};

/* What the mobile stories check at a desktop width: the desktop header, no menu. */
async function desktopInstead(canvasElement: HTMLElement, count: number) {
  const nav = within(within(canvasElement).getByRole('banner')).getByRole('navigation', { name: 'Main' });
  await expect(nav).toBeVisible();
  await expect(within(nav).getAllByRole('link')).toHaveLength(count);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
}

/**
 * Pattern 15, steps 2 and 3, below 768px: the links collapse into ☰, which opens
 * the Mobile Menu under the header: every link, the current one Active, the
 * account at the bottom. Choosing a link closes it and opens that page. It
 * starts open, so the snapshot shows it.
 */
export const Mobile: Story = {
  name: 'Mobile, menu open',
  args: { page: 'Costs', defaultMenuOpen: true },
  globals: { viewport: MOBILE },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  // An open modal menu makes the docs page inert.
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    if (isDesktop()) return desktopInstead(canvasElement, APP_HEADER_ADMIN_PAGES.length);
    const canvas = within(canvasElement);
    const banner = canvas.getByRole('banner');
    const main = canvas.getByRole('main');

    // Open: the full list, Costs Active, the account row last; ✕ has focus.
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(within(menu).getByRole('button', { name: 'Close menu' })).toHaveFocus());
    const nav = within(menu).getByRole('navigation', { name: 'Main' });
    await expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([...APP_HEADER_ADMIN_PAGES]);
    await expect(within(nav).getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');
    await expect(menu.querySelector('[data-part="account"]')).toHaveTextContent('Admin Account');
    // The desktop rows are hidden: one navigation in the accessibility tree.
    await expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1);

    // Choosing a link closes the menu and opens that page.
    await userEvent.click(within(nav).getByRole('link', { name: 'Recurring Costs' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onNavigate).toHaveBeenLastCalledWith('Recurring Costs');
    await expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Recurring Costs');
    // The page fits the phone: nothing scrolls sideways.
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);

    // ☰ from the keyboard: the menu opens on ✕ with the new page Active; Escape returns to ☰.
    const opener = within(banner).getByRole('button', { name: 'Open menu' });
    await expect(opener).toHaveAttribute('aria-expanded', 'false');
    opener.focus();
    await userEvent.keyboard('{Enter}');
    const again = await screen.findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(within(again).getByRole('button', { name: 'Close menu' })).toHaveFocus());
    await expect(within(again).getByRole('link', { name: 'Recurring Costs' })).toHaveAttribute('aria-current', 'page');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();

    // Open again for the snapshot.
    await userEvent.click(opener);
    await screen.findByRole('dialog', { name: 'Menu' });
  },
};

/**
 * Pattern 15, step 3, below 768px: "The account row opens the Account Menu".
 * The menu opens over the scrim, under the row (or above it on a short screen);
 * choosing Settings passes it on and leaves the mobile menu open. Left open for
 * the snapshot.
 */
export const MobileAccountMenu: Story = {
  name: 'Mobile, account menu open',
  args: { page: 'Costs', defaultMenuOpen: true },
  globals: { viewport: MOBILE },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  // An open modal menu makes the docs page inert.
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    if (isDesktop()) return desktopInstead(canvasElement, APP_HEADER_ADMIN_PAGES.length);
    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Close menu' })).toHaveFocus());
    const row = within(dialog).getByRole('button', { name: signedInAccounts.admin.name });
    await expect(row).toHaveAttribute('data-part', 'account');

    await userEvent.click(row);
    const menu = await screen.findByRole('menu', { name: 'Account' });
    const items = within(menu).getAllByRole('menuitem');
    await expect(items.map((item) => item.textContent)).toEqual(ACCOUNT_MENU_ITEMS.map((item) => item.label));
    await waitFor(() => expect(items[0]).toHaveFocus());
    await userEvent.click(items[1]);
    await expect(args.onAccountSelect).toHaveBeenLastCalledWith('settings');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await expect(row).toHaveFocus();
    await expect(screen.getByRole('dialog', { name: 'Menu' })).toBe(dialog);

    // Open again for the snapshot: 16 in, under the row's glyph, over the scrim.
    await userEvent.click(row);
    const open = await screen.findByRole('menu', { name: 'Account' });
    await expect(open.getBoundingClientRect().left).toBeCloseTo(row.querySelector('svg')!.getBoundingClientRect().left, 0);
  },
};

/**
 * U08, step 5, below 768px: the user's Mobile Menu, with the same five links.
 * Figma has no Mobile Menu – User yet; MobileMenu takes the user's links.
 */
export const MobileUser: Story = {
  name: 'Mobile, user menu open',
  args: { app: 'user', page: 'Costs', username: signedInAccounts.user.name, defaultMenuOpen: true },
  globals: { viewport: MOBILE },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    if (isDesktop()) return desktopInstead(canvasElement, APP_HEADER_USER_PAGES.length);
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    const nav = within(menu).getByRole('navigation', { name: 'Main' });
    await expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([...APP_HEADER_USER_PAGES]);
    for (const label of ADMIN_ONLY) await expect(within(nav).queryByRole('link', { name: label })).toBeNull();
    await expect(within(nav).getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');
    await expect(menu.querySelector('[data-part="account"]')).toHaveTextContent('QA Test');
  },
};

/** Pattern 15, step 1, in Dark: the toggle shows the moon and offers Light. */
export const Dark: Story = {
  globals: { theme: 'dark' },
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const banner = within(canvasElement).getByRole('banner');
    await expect(document.documentElement).toHaveClass('dark');
    await expect(within(banner).getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
    const nav = within(banner).getByRole('navigation', { name: 'Main' });
    await expect(within(nav).getByRole('link', { name: 'Recurring Costs' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
  },
};
