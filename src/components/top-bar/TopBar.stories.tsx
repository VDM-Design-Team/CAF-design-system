import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ICON_PATHS } from '../icon/icons';
import type { ThemeToggleTheme } from '../theme-toggle';
import { TopBar, type TopBarProps } from './TopBar';

/* The app's side of the contract: it holds the theme and switches it when the toggle asks.
   Here the theme only lives in the story's state; the document (the toolbar's theme) is left alone. */
function WithAppState({ theme: initial = 'dark', ...props }: Partial<TopBarProps>) {
  const [theme, setTheme] = React.useState<ThemeToggleTheme>(initial);
  return (
    // Room below for the account menu.
    <div className="pb-40">
      <TopBar
        username="Admin Account"
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
  title: 'Components/TopBar',
  component: TopBar,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation** (`Navigation / Top Bar`): the top row of the desktop ' +
          'header. The Logo on the left and UserActions (“Hi, {username}”, the theme toggle and the account icon) on ' +
          'the right, centred on one 48px line; Figma’s Fill spacer between them is `justify-between`. The theme is ' +
          'controlled: `theme` is the one in use, `onThemeChange` gets the one asked for. AppHeader places it.',
      },
    },
  },
  args: { username: 'Admin Account', theme: 'dark', onThemeChange: fn(), onAccountSelect: fn() },
  render: (args) => (
    <WithAppState
      username={args.username}
      theme={args.theme}
      onThemeChange={args.onThemeChange}
      onAccountSelect={args.onAccountSelect}
    />
  ),
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The logo, the greeting, the toggle (it asks for the other theme) and the account menu. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const themeBefore = document.documentElement.className;
    await expect(canvas.getByRole('img', { name: 'CAF' })).toBeInTheDocument();
    await expect(canvas.getByText('Hi, Admin Account')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Switch to light theme' }));
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('light');
    await expect(canvas.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
    await expect(document.documentElement.className).toBe(themeBefore);

    const account = canvas.getByRole('button', { name: 'Account' });
    await userEvent.click(account);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Settings' }));
    await expect(args.onAccountSelect).toHaveBeenLastCalledWith('settings');
    await expect(account).toHaveFocus();
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   At rest and with the buttons on hover (forced with storybook-addon-pseudo-
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
    // No colour transition in the grid, so the check reads the end colour, not a frame of the fade.
    <div className="flex flex-col gap-6 [&_*]:transition-none">
      {STATES.map(({ state, label }) => (
        <div key={state} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">{label}</span>
          <TopBar username="Admin Account" theme={theme} data-pseudo={state} />
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
      wordmark: tokenColour('text-primary'),
      greeting: tokenColour('text-secondary'),
      glyph: tokenColour('text-primary'),
      hover: tokenColour('neutral-tonal-surface-default'),
      none: 'rgba(0, 0, 0, 0)',
    };
    const name = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    await waitFor(
      () => {
        const bars = canvasElement.querySelectorAll<HTMLElement>('[data-pseudo]');
        expect(bars).toHaveLength(2);
        for (const bar of bars) {
          const hovered = bar.dataset.pseudo === 'hover';
          const box = bar.getBoundingClientRect();
          // Hugs the Logo's 48; fills the width.
          expect(box.height).toBe(48);
          expect(box.width).toBeCloseTo(bar.parentElement!.getBoundingClientRect().width, 0);
          const logo = within(bar).getByRole('img', { name: 'CAF' });
          const l = logo.getBoundingClientRect();
          expect(l.left).toBeCloseTo(box.left, 0);
          expect([l.width, l.height]).toEqual([123, 48]);
          expect(getComputedStyle(logo.querySelector('[data-part="wordmark"]')!).fill).toBe(want.wordmark);
          // The spacer: User Actions against the right edge, centred on the same line.
          const actions = bar.lastElementChild!.getBoundingClientRect();
          expect(actions.right).toBeCloseTo(box.right, 0);
          expect(actions.top + actions.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
          expect(getComputedStyle(within(bar).getByText('Hi, Admin Account')).color).toBe(want.greeting);
          const toggle = within(bar).getByRole('button', { name });
          const account = within(bar).getByRole('button', { name: 'Account' });
          expect(toggle.querySelector('path')!.getAttribute('d')).toBe(theme === 'dark' ? ICON_PATHS.moon : ICON_PATHS.sun);
          for (const button of [toggle, account]) {
            expect(getComputedStyle(button.querySelector('svg')!).color).toBe(want.glyph);
            expect(getComputedStyle(button).backgroundColor).toBe(hovered ? want.hover : want.none);
          }
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = states('light');
export const StatesDark = states('dark');
