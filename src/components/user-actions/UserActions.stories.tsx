import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ICON_PATHS } from '../icon/icons';
import type { ThemeToggleTheme } from '../theme-toggle';
import { UserActions, type UserActionsProps } from './UserActions';

/* The app's side of the contract: it holds the theme and switches it when the toggle asks.
   Here the theme only lives in the story's state; the document (the toolbar's theme) is left alone. */
function WithAppState({ theme: initial = 'dark', ...props }: Partial<UserActionsProps>) {
  const [theme, setTheme] = useState<ThemeToggleTheme>(initial);
  return (
    /* UserActions sits at the right of the top bar: room on the left for the account menu, room below for it. */
    <div className="flex w-96 flex-col items-end gap-4 pb-48">
      <UserActions
        username="QA Test"
        {...props}
        theme={theme}
        onThemeChange={(next) => {
          setTheme(next);
          props.onThemeChange?.(next);
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Components/UserActions',
  component: UserActions,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation** (`Navigation / User Actions`): the right end of the top ' +
          'bar. “Hi, {username}” (UserGreeting), the theme toggle (ThemeToggle, with the tooltip pattern 15 asks for) ' +
          'and the account icon, which opens the Account Menu. No gap between them, as in Figma: the buttons’ 40×40 ' +
          'boxes space them. The theme is controlled: `theme` is the one in use, `onThemeChange` gets the one asked for, ' +
          'and the app switches it. `onAccountSelect` gets the account menu item chosen.',
      },
    },
  },
  args: { username: 'QA Test', theme: 'dark', onThemeChange: fn(), onAccountSelect: fn() },
  render: (args) => (
    <WithAppState
      username={args.username}
      theme={args.theme}
      onThemeChange={args.onThemeChange}
      onAccountSelect={args.onAccountSelect}
    />
  ),
} satisfies Meta<typeof UserActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** By pointer: the toggle asks for the other theme, and the account icon opens the menu. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const themeBefore = document.documentElement.className;
    await expect(canvas.getByText('Hi, QA Test')).toBeInTheDocument();

    const toggle = canvas.getByRole('button', { name: 'Switch to light theme' });
    await userEvent.click(toggle);
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('light');
    await expect(toggle).toHaveAccessibleName('Switch to dark theme');
    await expect(toggle.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.sun);
    // The toggle asked; the document's theme is the app's to change.
    await expect(document.documentElement.className).toBe(themeBefore);

    const account = canvas.getByRole('button', { name: 'Account' });
    await userEvent.click(account);
    const menu = canvas.getByRole('menu', { name: 'Account' });
    await expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Manage Currencies' }));
    await expect(args.onAccountSelect).toHaveBeenCalledTimes(1);
    await expect(args.onAccountSelect).toHaveBeenLastCalledWith('manage-currencies');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(account).toHaveFocus();
  },
};

/** By keyboard: Tab order, the toggle's tooltip, the account menu's arrows and Escape, focus return. */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Switch to light theme' });
    const account = canvas.getByRole('button', { name: 'Account' });
    const item = (name: string) => canvas.getByRole('menuitem', { name });

    // Tab reaches the toggle first; keyboard focus shows its tooltip, which describes it.
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    const tooltip = await canvas.findByRole('tooltip');
    await expect(tooltip).toHaveTextContent('Switch to light theme');
    await expect(toggle).toHaveAccessibleDescription('Switch to light theme');

    // Enter asks for the other theme; the name and the tooltip follow.
    await userEvent.keyboard('{Enter}');
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('light');
    await expect(toggle).toHaveAccessibleName('Switch to dark theme');
    await expect(tooltip).toHaveTextContent('Switch to dark theme');
    // Escape dismisses the tooltip; focus stays.
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(toggle).toHaveFocus();

    // Tab moves on to the account icon. ↓ opens the menu on its first item.
    await userEvent.tab();
    await expect(account).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Manage Currencies')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await expect(item('Settings')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(item('Logout')).toHaveFocus();
    // Escape closes it and hands focus back to the icon.
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(account).toHaveFocus();
    await expect(args.onAccountSelect).not.toHaveBeenCalled();

    // Enter opens it again; Enter chooses.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(item('Manage Currencies')).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}{Enter}');
    await expect(args.onAccountSelect).toHaveBeenLastCalledWith('logout');
    await expect(account).toHaveFocus();

    // Shift+Tab goes back to the toggle.
    await userEvent.tab({ shift: true });
    await expect(toggle).toHaveFocus();
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   At rest and with both buttons on hover (forced with storybook-addon-pseudo-
   states). The toggle shows the page's theme, as it would in the app. Checked
   against Figma's bindings and its auto layout. */

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

const STATES = [
  { state: 'default', label: 'Default' },
  { state: 'hover', label: 'Hover' },
] as const;

const states = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col items-start gap-6">
      {STATES.map(({ state, label }) => (
        <div key={state} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">{label}</span>
          <UserActions username="QA Test" theme={theme} data-pseudo={state} />
        </div>
      ))}
    </div>
  ),
  globals: { theme },
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
      greeting: tokenColour('text-secondary'),
      glyph: tokenColour('text-primary'),
      hover: tokenColour('neutral-tonal-surface-default'),
      none: 'rgba(0, 0, 0, 0)',
    };
    const name = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    const glyph = theme === 'dark' ? ICON_PATHS.moon : ICON_PATHS.sun;
    await waitFor(
      () => {
        const groups = canvasElement.querySelectorAll<HTMLElement>('[data-pseudo]');
        expect(groups).toHaveLength(2);
        for (const group of groups) {
          const hovered = group.dataset.pseudo === 'hover';
          const greeting = within(group).getByText('Hi, QA Test');
          const toggle = within(group).getByRole('button', { name });
          const account = within(group).getByRole('button', { name: 'Account' });
          expect(getComputedStyle(greeting).color).toBe(want.greeting);
          // Toggle: the page theme's glyph. Both glyphs text.primary; neutral.tonal fill on hover.
          expect(toggle.querySelector('path')!.getAttribute('d')).toBe(glyph);
          expect(account.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.user);
          for (const button of [toggle, account]) {
            expect(getComputedStyle(button.querySelector('svg')!).color).toBe(want.glyph);
            expect(getComputedStyle(button).backgroundColor).toBe(hovered ? want.hover : want.none);
          }
          // Auto layout: greeting, toggle, account, no gap, centred on one line.
          const g = greeting.getBoundingClientRect();
          const t = toggle.getBoundingClientRect();
          const a = account.getBoundingClientRect();
          expect(t.left).toBeCloseTo(g.right, 0);
          expect(a.left).toBeCloseTo(t.right, 0);
          expect(g.top + g.height / 2).toBeCloseTo(t.top + t.height / 2, 0);
          expect([t.width, t.height, a.width, a.height]).toEqual([40, 40, 40, 40]);
          expect(group.getBoundingClientRect().height).toBe(40);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = states('light');
export const StatesDark = states('dark');

/* ── The account menu open, in Light and Dark ───────────────────────────────
   Opened from the account icon, as pattern 15 shows it: below the icon, flush
   with its right edge. */

const open = (theme: 'light' | 'dark'): Story => ({
  name: `Menu open — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: (args) => <WithAppState theme={theme} onAccountSelect={args.onAccountSelect} />,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { fill: tokenColour('surface-neutral-faint'), label: tokenColour('text-primary') };
    const canvas = within(canvasElement);
    const account = canvas.getByRole('button', { name: 'Account' });
    await userEvent.click(account);
    const menu = canvas.getByRole('menu', { name: 'Account' });
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Manage Currencies' })).toHaveFocus());
    await expect(getComputedStyle(menu).backgroundColor).toBe(want.fill);
    for (const item of within(menu).getAllByRole('menuitem')) await expect(getComputedStyle(item).color).toBe(want.label);
    const box = menu.getBoundingClientRect();
    const icon = account.getBoundingClientRect();
    await expect(box.top - icon.bottom).toBeCloseTo(4, 1);
    await expect(box.right).toBeCloseTo(icon.right, 1);
  },
});

export const MenuOpenLight = open('light');
export const MenuOpenDark = open('dark');
