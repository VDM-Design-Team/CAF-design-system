import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { APP_HEADER_ADMIN_PAGES, APP_HEADER_USER_PAGES, type AppHeaderLink } from '../app-header';
import { ICON_PATHS } from '../icon/icons';
import { MobileHeader } from '../mobile-header';
import { NavLink } from '../nav-link';
import type { ThemeToggleTheme } from '../theme-toggle';
import { MobileMenu } from './MobileMenu';

/* Storybook's own "Small mobile" viewport (320 × 568), from its default list. The menu is
   fixed to the viewport's top and full width, with no breakpoint of its own, so it renders
   the same at any width, including the static build's. */
const MOBILE = { value: 'mobile1', isRotated: false } as const;

/* Each story in its own frame on the docs page: an open menu covers the whole
   document and makes everything else inert. */
const OVERLAY_DOCS_STORY = { inline: false, height: '640px' } as const;

const href = (label: string) => `#${label.toLowerCase().replace(/ /g, '-')}`;
const ADMIN_LINKS: AppHeaderLink[] = APP_HEADER_ADMIN_PAGES.map((label) => ({ label, href: href(label) }));
const USER_LINKS: AppHeaderLink[] = APP_HEADER_USER_PAGES.map((label) => ({ label, href: href(label) }));

/** Page furniture behind the menu, so the scrim shows over something. */
function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      {children}
      <div className="flex flex-col gap-2 p-4">
        <h1 className="text-title-md-semibold text-text-primary">Users</h1>
        <p className="text-body-sm-regular text-text-secondary">While the menu is open, this page is inert.</p>
      </div>
    </div>
  );
}

const meta = {
  title: 'Components/MobileMenu',
  component: MobileMenu,
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: OVERLAY_DOCS_STORY,
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation** (`Navigation / Mobile Menu – Admin`): the open mobile ' +
          'navigation, full width against the top of the screen. The Mobile Header with ✕ (Menu Open=true), the links ' +
          'as vertical NavLinks (`links`, with `page` Active) and the Account Row with the signed-in `username`. It is ' +
          'a modal dialog on Overlay, named “Menu”: focus moves to ✕ and is trapped; Escape, ✕, a tap on the scrim or ' +
          'a chosen link call `onClose`; you set `open`, and focus goes back to ☰. The links are data, so the user ' +
          'app’s five links work the same.',
      },
    },
  },
  args: {
    open: true,
    onClose: fn(),
    links: ADMIN_LINKS,
    page: 'Users',
    username: 'Admin Account',
    theme: 'dark',
    onThemeChange: fn(),
    onAccountSelect: fn(),
  },
  argTypes: {
    open: { control: 'boolean' },
    links: { control: false },
    renderLink: { control: false },
  },
  globals: { viewport: MOBILE },
} satisfies Meta<typeof MobileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Page>
      <MobileMenu {...args} />
    </Page>
  ),
};

/* A token's computed value in the current theme. Measure before waitFor, never inside it:
   the probe is a DOM mutation, and waitFor reruns its callback on every mutation. */
function tokenStyle(property: 'color' | 'fontSize' | 'fontWeight', value: string, className?: string) {
  const probe = document.createElement('span');
  if (className) probe.className = className;
  else probe.style[property] = value;
  document.body.append(probe);
  const computed = getComputedStyle(probe)[property];
  probe.remove();
  return computed;
}
const tokenColour = (token: string) => tokenStyle('color', `var(--color-${token})`);

/** The `<body>` child the story renders in: the node the overlay makes inert. */
function bodyChildOf(el: HTMLElement): HTMLElement {
  let node = el;
  while (node.parentElement && node.parentElement !== document.body) node = node.parentElement;
  return node;
}

/* ── Open, in Light and Dark ───────────────────────────────────────────────
   Mobile Menu – Admin as Figma draws it: Page=Users. Full width against the top
   of the screen, surface.neutral.base with Elevation 3; the Mobile Header with
   ✕; the ten links, 8 / 16 padding, 2 apart; the Account Row under a
   stroke.subtle line. */
const opened = (theme: 'light' | 'dark'): Story => ({
  name: `Mobile Menu – Admin — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: (args) => (
    <Page>
      <MobileMenu {...args} theme={theme} />
    </Page>
  ),
  globals: { theme, viewport: MOBILE },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      scrim: tokenColour('surface-overlay'),
      fill: tokenColour('surface-neutral-base'),
      active: tokenColour('surface-base'),
      primary: tokenColour('text-primary'),
      secondary: tokenColour('text-secondary'),
      stroke: tokenColour('stroke-subtle'),
      accountSize: tokenStyle('fontSize', '', 'text-body-sm-medium'),
      accountWeight: tokenStyle('fontWeight', '', 'text-body-sm-medium'),
      none: 'rgba(0, 0, 0, 0)',
    };
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    await expect(menu).toHaveAttribute('aria-modal', 'true');
    const backdrop = menu.parentElement!;
    await expect(getComputedStyle(backdrop).backgroundColor).toBe(want.scrim);

    // Against the top, the screen's full width; surface.neutral.base, Elevation 3.
    const box = menu.getBoundingClientRect();
    await expect([box.top, box.left]).toEqual([0, 0]);
    await expect(box.width).toBe(window.innerWidth);
    const panel = getComputedStyle(menu);
    await expect(panel.backgroundColor).toBe(want.fill);
    await expect(panel.boxShadow).not.toBe('none');

    // Mobile Header, Menu Open=true: ✕, which has focus.
    const header = menu.querySelector<HTMLElement>('[data-menu-open="true"]')!;
    await expect(header.getBoundingClientRect().height).toBe(64);
    const close = within(header).getByRole('button', { name: 'Close menu' });
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    await expect(close.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.x);
    await waitFor(() => expect(close).toHaveFocus());

    // Links: vertical, 8 / 16 padding, 2 apart, the menu's width; Users is Active.
    const nav = within(menu).getByRole('navigation', { name: 'Main' });
    const list = nav.querySelector('ul')!;
    await expect(getComputedStyle(list).padding).toBe('8px 16px');
    await expect(getComputedStyle(list).rowGap).toBe('2px');
    const links = within(nav).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([...APP_HEADER_ADMIN_PAGES]);
    for (const [i, link] of links.entries()) {
      const active = link.textContent === 'Users';
      const style = getComputedStyle(link);
      await expect(link.getAttribute('aria-current')).toBe(active ? 'page' : null);
      await expect(style.backgroundColor).toBe(active ? want.active : want.none);
      await expect(style.color).toBe(active ? want.primary : want.secondary);
      const r = link.getBoundingClientRect();
      await expect(r.left).toBeCloseTo(box.left + 16, 0);
      await expect(r.right).toBeCloseTo(box.right - 16, 0);
      if (i > 0) await expect(r.top - links[i - 1].getBoundingClientRect().bottom).toBeCloseTo(2, 0);
    }

    // Account Row: a 1px stroke.subtle line on top, 12 / 16 padding, 12 between; Body/sm-medium, text.secondary.
    const account = menu.querySelector<HTMLElement>('[data-part="account"]')!;
    const row = getComputedStyle(account);
    await expect(account).toHaveTextContent('Admin Account');
    await expect(row.borderTopWidth).toBe('1px');
    await expect(row.borderTopColor).toBe(want.stroke);
    await expect(row.padding).toBe('12px 16px');
    await expect(row.columnGap).toBe('12px');
    await expect(row.color).toBe(want.secondary);
    await expect([row.fontSize, row.fontWeight]).toEqual([want.accountSize, want.accountWeight]);
    const glyph = account.querySelector('svg')!;
    await expect(glyph.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.user);
    await expect(glyph.getBoundingClientRect().width).toBe(20);
    // Last, at the end of the menu's content. On a screen shorter than the menu, the menu scrolls.
    await expect(menu.lastElementChild).toBe(account);
    await expect(account.getBoundingClientRect().bottom - box.top + menu.scrollTop).toBeCloseTo(menu.scrollHeight, 0);
    await expect(box.height).toBeLessThanOrEqual(window.innerHeight);
    await expect(getComputedStyle(menu).overflowY).toBe('auto');

    // The page behind is inert and doesn't scroll.
    await expect(bodyChildOf(canvasElement)).toHaveAttribute('inert');
    await expect(document.body.style.overflow).toBe('hidden');
  },
});

export const AdminLight = opened('light');
export const AdminDark = opened('dark');

/** The user app's five links (U08: Mobile Menu – User is still to add in Figma), Page=Create Cost. */
export const User: Story = {
  args: { links: USER_LINKS, page: 'Create Cost', username: 'QA Test' },
  render: (args) => (
    <Page>
      <MobileMenu {...args} />
    </Page>
  ),
  parameters: { controls: { disable: true } },
  play: async () => {
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    const nav = within(menu).getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([...APP_HEADER_USER_PAGES]);
    await expect(within(nav).getByRole('link', { name: 'Create Cost' })).toHaveAttribute('aria-current', 'page');
    await expect(menu.querySelector('[data-part="account"]')).toHaveTextContent('QA Test');
  },
};

/* ── Behaviour ─────────────────────────────────────────────────────────────── */

/* The page's Mobile Header and the menu it opens, wired as AppHeader wires them:
   ☰ opens, the menu asks to close, a chosen link becomes the current page. */
function MobileShell({ initialPage = 'Users' }: { initialPage?: string }) {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState(initialPage);
  const [theme, setTheme] = React.useState<ThemeToggleTheme>('light');
  const id = `${React.useId()}-menu`;
  return (
    <Page>
      <MobileHeader theme={theme} onThemeChange={setTheme} menuOpen={open} onMenuOpenChange={setOpen} menuId={id} />
      <MobileMenu
        id={id}
        open={open}
        onClose={() => setOpen(false)}
        links={ADMIN_LINKS}
        page={page}
        // Links that go nowhere: a click makes that link the current page.
        renderLink={(props) => (
          <NavLink
            {...props}
            onClick={(event) => {
              event.preventDefault();
              setPage(props.children);
            }}
          />
        )}
        username="Admin Account"
        theme={theme}
        onThemeChange={setTheme}
      />
    </Page>
  );
}

/**
 * ☰ opens the menu with focus on ✕. Tab and Shift+Tab wrap inside it; the page
 * behind is inert and doesn't scroll. Escape closes it, and focus, the page and
 * its scroll come back to ☰. Enter on ☰ opens it again; Enter on ✕ closes it.
 */
export const OpensTrapsAndCloses: Story = {
  render: () => <MobileShell />,
  globals: { viewport: MOBILE },
  parameters: { controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole('button', { name: 'Open menu' });
    await expect(opener).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(opener);
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    await expect(opener).toHaveAttribute('aria-expanded', 'true');
    await expect(opener).toHaveAttribute('aria-controls', menu.id);
    const close = within(menu).getByRole('button', { name: 'Close menu' });
    await waitFor(() => expect(close).toHaveFocus());
    await expect(bodyChildOf(canvasElement)).toHaveAttribute('inert');
    await expect(document.body.style.overflow).toBe('hidden');

    // Tab order inside: the toggle, the account icon, ✕, then the ten links. It wraps both ways.
    const links = within(menu).getAllByRole('link');
    const toggle = within(menu).getByRole('button', { name: 'Switch to dark theme' });
    const account = within(menu).getByRole('button', { name: 'Account' });
    await userEvent.tab();
    await expect(links[0]).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(account).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(toggle).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(links[links.length - 1]).toHaveFocus();
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(links[links.length - 1]).toHaveFocus();

    // Escape closes it; focus, the page and its scroll come back.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();
    await expect(opener).toHaveAttribute('aria-expanded', 'false');
    await expect(bodyChildOf(canvasElement)).not.toHaveAttribute('inert');
    await expect(document.body.style.overflow).toBe('');

    // By keyboard: Enter on ☰ opens it on ✕; Enter on ✕ closes it.
    await userEvent.keyboard('{Enter}');
    const again = await screen.findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(within(again).getByRole('button', { name: 'Close menu' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();
  },
};

/** Choosing a link closes the menu (pattern 15), and that link is the current page next time. A tap on the scrim closes it too. */
export const ChoosingALinkCloses: Story = {
  render: () => <MobileShell />,
  globals: { viewport: MOBILE },
  parameters: { controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole('button', { name: 'Open menu' });

    await userEvent.click(opener);
    let menu = await screen.findByRole('dialog', { name: 'Menu' });
    await userEvent.click(within(menu).getByRole('link', { name: 'Partners' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();

    await userEvent.click(opener);
    menu = await screen.findByRole('dialog', { name: 'Menu' });
    await expect(within(menu).getByRole('link', { name: 'Partners' })).toHaveAttribute('aria-current', 'page');
    await expect(within(menu).getByRole('link', { name: 'Users' })).not.toHaveAttribute('aria-current');

    // The theme toggle in the menu asks for the other theme and leaves the menu open.
    const themeBefore = document.documentElement.className;
    await userEvent.click(within(menu).getByRole('button', { name: 'Switch to dark theme' }));
    await expect(within(menu).getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
    await expect(document.documentElement.className).toBe(themeBefore);

    // A tap on the scrim, below the menu.
    await userEvent.click(menu.parentElement!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();
  },
};

/** Escape with the account menu open closes the account menu first, then the mobile menu. */
export const EscapeClosesTheAccountMenuFirst: Story = {
  render: () => <MobileShell />,
  globals: { viewport: MOBILE },
  parameters: { controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole('button', { name: 'Open menu' });
    await userEvent.click(opener);
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    const account = within(menu).getByRole('button', { name: 'Account' });
    await userEvent.click(account);
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Manage Currencies' })).toHaveFocus());

    await userEvent.keyboard('{Escape}');
    await expect(within(menu).queryByRole('menu')).toBeNull();
    await expect(account).toHaveFocus();
    await expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();
  },
};
