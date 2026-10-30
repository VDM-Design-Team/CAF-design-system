import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ICON_PATHS } from '../icon/icons';
import type { ThemeToggleTheme } from '../theme-toggle';
import { MobileHeader, type MobileHeaderProps } from './MobileHeader';

/* Storybook's own "Small mobile" viewport (320 × 568), from its default list:
   the narrowest screen the Mobile Header has to fit. MobileHeader has no
   breakpoint of its own, so it renders the same at any width, including the
   static build's. */
const MOBILE = { value: 'mobile1', isRotated: false } as const;

/* The app's side: it holds the theme and the menu state, and switches them when asked.
   The document (the toolbar's theme) is left alone. */
function WithAppState({
  theme: initial = 'dark',
  menuOpen: initialOpen = false,
  ...props
}: Partial<MobileHeaderProps>) {
  const [theme, setTheme] = React.useState<ThemeToggleTheme>(initial);
  const [menuOpen, setMenuOpen] = React.useState(initialOpen);
  return (
    // Room below for the account menu.
    <div className="pb-40">
      <MobileHeader
        {...props}
        theme={theme}
        onThemeChange={(next) => {
          setTheme(next);
          props.onThemeChange?.(next);
        }}
        menuOpen={menuOpen}
        onMenuOpenChange={(next) => {
          setMenuOpen(next);
          props.onMenuOpenChange?.(next);
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Components/MobileHeader',
  component: MobileHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation** (`Navigation / Mobile Header`): the header below 768px. ' +
          'The Logo at 36 high on the left; on the right, 8 apart, the theme toggle (with its tooltip), the account ' +
          'icon (it opens the Account Menu) and the menu button. Figma’s Menu Open is `menuOpen`: ☰ “Open menu” when ' +
          'false, ✕ “Close menu” when true. The button is a disclosure (`aria-expanded`, and `aria-controls` from ' +
          '`menuId`) and reports the state it asks for in `onMenuOpenChange`. AppHeader shows it below 768px and opens ' +
          'MobileMenu from it.',
      },
    },
  },
  args: {
    theme: 'dark',
    menuOpen: false,
    onThemeChange: fn(),
    onMenuOpenChange: fn(),
    onAccountSelect: fn(),
  },
  globals: { viewport: MOBILE },
  render: (args) => (
    <WithAppState
      theme={args.theme}
      menuOpen={args.menuOpen}
      menuId={args.menuId}
      onThemeChange={args.onThemeChange}
      onMenuOpenChange={args.onMenuOpenChange}
      onAccountSelect={args.onAccountSelect}
    />
  ),
} satisfies Meta<typeof MobileHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ☰ asks to open the menu and turns into ✕ (Menu Open=true); ✕ asks to close it. The toggle and the account menu work as in the Top Bar. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const themeBefore = document.documentElement.className;
    const menu = canvas.getByRole('button', { name: 'Open menu' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(menu);
    await expect(args.onMenuOpenChange).toHaveBeenLastCalledWith(true);
    // The same button, now ✕.
    await expect(menu).toHaveAccessibleName('Close menu');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.x);
    await userEvent.click(menu);
    await expect(args.onMenuOpenChange).toHaveBeenLastCalledWith(false);
    await expect(menu).toHaveAccessibleName('Open menu');

    await userEvent.click(canvas.getByRole('button', { name: 'Switch to light theme' }));
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('light');
    await expect(document.documentElement.className).toBe(themeBefore);

    const account = canvas.getByRole('button', { name: 'Account' });
    await userEvent.click(account);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Logout' }));
    await expect(args.onAccountSelect).toHaveBeenLastCalledWith('logout');
    await expect(account).toHaveFocus();
  },
};

/** With `menuId`, the menu button names the menu it controls. By keyboard: Tab order, then Enter and Space on ☰. */
export const Keyboard: Story = {
  args: { menuId: 'mobile-menu' },
  parameters: { controls: { disable: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByRole('button', { name: 'Open menu' });
    await expect(menu).toHaveAttribute('aria-controls', 'mobile-menu');

    // Tab: the toggle, the account icon, the menu button.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Switch to light theme' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Account' })).toHaveFocus();
    await userEvent.tab();
    await expect(menu).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(args.onMenuOpenChange).toHaveBeenLastCalledWith(true);
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard(' ');
    await expect(args.onMenuOpenChange).toHaveBeenLastCalledWith(false);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toHaveFocus();
  },
};

/* ── Every Menu Open × state, in Light and Dark ────────────────────────────
   Figma's two variants, at rest and with the buttons on hover (forced with
   storybook-addon-pseudo-states), at a mobile viewport. Checked against the
   variables Figma binds and its auto layout. */

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

const CELLS = [
  { menuOpen: false, state: 'default' },
  { menuOpen: false, state: 'hover' },
  { menuOpen: true, state: 'default' },
  { menuOpen: true, state: 'hover' },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Menu Open × state — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    // No colour transition in the grid, so the check reads the end colour, not a frame of the fade.
    <div className="flex flex-col gap-4 py-4 [&_*]:transition-none">
      {CELLS.map(({ menuOpen, state }) => (
        <div key={`${menuOpen}-${state}`} className="flex flex-col gap-2">
          <span className="px-4 text-caption-md-medium text-text-secondary">
            Menu Open={String(menuOpen)}, {state === 'hover' ? 'Hover' : 'Default'}
          </span>
          <MobileHeader theme={theme} menuOpen={menuOpen} data-pseudo={state} />
        </div>
      ))}
    </div>
  ),
  globals: { theme, viewport: MOBILE },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"] button'] },
  },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-neutral-base'),
      wordmark: tokenColour('text-primary'),
      glyph: tokenColour('text-primary'),
      hover: tokenColour('neutral-tonal-surface-default'),
      none: 'rgba(0, 0, 0, 0)',
    };
    const name = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    await waitFor(
      () => {
        const headers = canvasElement.querySelectorAll<HTMLElement>('[data-pseudo]');
        expect(headers).toHaveLength(CELLS.length);
        headers.forEach((header, i) => {
          const { menuOpen, state } = CELLS[i];
          const style = getComputedStyle(header);
          const box = header.getBoundingClientRect();
          // 64 high: 12 / 16 padding around the 40px buttons; surface.neutral.base.
          expect(style.backgroundColor).toBe(want.fill);
          expect(style.padding).toBe('12px 16px');
          expect(box.height).toBe(64);
          // Logo: 36 high, at the left padding, centred.
          const logo = within(header).getByRole('img', { name: 'CAF' });
          const l = logo.getBoundingClientRect();
          expect(l.height).toBe(36);
          expect(l.left).toBeCloseTo(box.left + 16, 0);
          expect(l.top + l.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
          expect(getComputedStyle(logo.querySelector('[data-part="wordmark"]')!).fill).toBe(want.wordmark);
          // Actions: Theme, Account, Open / Close Menu, 40 × 40 each, 8 apart, against the right padding.
          const toggle = within(header).getByRole('button', { name });
          const account = within(header).getByRole('button', { name: 'Account' });
          const menu = within(header).getByRole('button', { name: menuOpen ? 'Close menu' : 'Open menu' });
          const [t, a, m] = [toggle, account, menu].map((b) => b.getBoundingClientRect());
          expect([t.width, t.height, a.width, a.height, m.width, m.height]).toEqual([40, 40, 40, 40, 40, 40]);
          expect(a.left - t.right).toBeCloseTo(8, 0);
          expect(m.left - a.right).toBeCloseTo(8, 0);
          expect(m.right).toBeCloseTo(box.right - 16, 0);
          expect(toggle.querySelector('path')!.getAttribute('d')).toBe(theme === 'dark' ? ICON_PATHS.moon : ICON_PATHS.sun);
          expect(account.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.user);
          expect(menu.querySelector('path')!.getAttribute('d')).toBe(menuOpen ? ICON_PATHS.x : ICON_PATHS.list);
          expect(menu.getAttribute('aria-expanded')).toBe(String(menuOpen));
          // Every glyph text.primary; neutral.tonal fill on hover.
          for (const button of [toggle, account, menu]) {
            expect(getComputedStyle(button.querySelector('svg')!).color).toBe(want.glyph);
            expect(getComputedStyle(button).backgroundColor).toBe(state === 'hover' ? want.hover : want.none);
          }
        });
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
