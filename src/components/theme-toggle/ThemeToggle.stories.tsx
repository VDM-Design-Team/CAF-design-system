import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { ICON_PATHS } from '../icon/icons';
import { ThemeToggle, THEME_TOGGLE_THEMES, type ThemeToggleTheme } from './ThemeToggle';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation** (`Navigation / Theme Toggle`): the header’s switch ' +
          'between Light and Dark. `theme` is Figma’s Theme, the theme in use: `dark` shows the moon, `light` the sun. ' +
          'It is controlled: a click calls `onThemeChange` with the other theme, and the app switches it (the `.dark` ' +
          'class on `<html>`, as the toolbar does here) and remembers it. The toggle never changes the document itself. ' +
          'Its name says what a click does: “Switch to light theme” or “Switch to dark theme”. It is IconButton size 40 ' +
          'with a `text.primary` glyph, the colour Figma binds. Pattern 15 gives it a tooltip; UserActions does.',
      },
    },
  },
  args: { theme: 'dark', onThemeChange: fn() },
  argTypes: { theme: { control: 'radio', options: THEME_TOGGLE_THEMES } },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A click asks for the other theme. The toggle itself changes nothing: `theme` is the app's. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const themeBefore = document.documentElement.className;
    const toggle = canvas.getByRole('button', { name: 'Switch to light theme' });
    await userEvent.click(toggle);
    await expect(args.onThemeChange).toHaveBeenCalledTimes(1);
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('light');
    // Controlled: no `theme` change came back, so it still shows Dark, and the document is untouched.
    await expect(toggle).toHaveAccessibleName('Switch to light theme');
    await expect(document.documentElement.className).toBe(themeBefore);
  },
};

function WithAppState({ onThemeChange }: { onThemeChange?: (theme: ThemeToggleTheme) => void }) {
  const [theme, setTheme] = useState<ThemeToggleTheme>('light');
  return (
    <div className="flex items-center gap-4">
      <ThemeToggle
        theme={theme}
        onThemeChange={(next) => {
          setTheme(next);
          onThemeChange?.(next);
        }}
      />
      <p role="status" className="text-body-sm-regular text-text-secondary">
        App theme: {theme}
      </p>
    </div>
  );
}

/** Wired to app state, by pointer and keyboard: the glyph and the name follow `theme`; Enter and Space toggle it. */
export const Controlled: Story = {
  render: (args) => <WithAppState onThemeChange={args.onThemeChange} />,
  parameters: { controls: { disable: true } },
  play: async ({ args, canvas }) => {
    const themeBefore = document.documentElement.className;
    const toggle = canvas.getByRole('button', { name: 'Switch to dark theme' });
    const glyph = () => toggle.querySelector('path')!.getAttribute('d');
    await expect(glyph()).toBe(ICON_PATHS.sun);

    await userEvent.click(toggle);
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('dark');
    await expect(toggle).toHaveAccessibleName('Switch to light theme');
    await expect(glyph()).toBe(ICON_PATHS.moon);
    await expect(canvas.getByRole('status')).toHaveTextContent('App theme: dark');
    // Focus stays on the toggle, so it can be pressed again.
    await expect(toggle).toHaveFocus();

    // The keyboard: Enter and Space, like any button.
    await userEvent.keyboard('{Enter}');
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('light');
    await expect(toggle).toHaveAccessibleName('Switch to dark theme');
    await userEvent.keyboard(' ');
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('dark');
    await expect(args.onThemeChange).toHaveBeenCalledTimes(3);

    // The story's state changed; the document's theme didn't.
    await expect(document.documentElement.className).toBe(themeBefore);
  },
};

/* ── Every Theme × state, in Light and Dark ────────────────────────────────
   Figma's two variants at rest, plus Hover (Button / Icon Ghost's, which code
   adds) and keyboard focus. Hover is forced with storybook-addon-pseudo-states
   and checked against Figma's bindings. */

const STATES = [
  { state: 'default', label: 'Default' },
  { state: 'hover', label: 'Hover' },
] as const;

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

const grid = (pageTheme: 'light' | 'dark'): Story => ({
  name: `Themes — ${pageTheme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <table className="border-separate border-spacing-4 text-left">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Theme
          </th>
          {STATES.map(({ state, label }) => (
            <th key={state} scope="col" className="text-caption-md-medium text-text-secondary">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {THEME_TOGGLE_THEMES.map((theme) => (
          <tr key={theme}>
            <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </th>
            {STATES.map(({ state }) => (
              <td key={state}>
                <ThemeToggle
                  theme={theme}
                  data-theme-variant={theme}
                  data-pseudo={state}
                  // No colour transition in the grid, so the check reads the end colour, not a frame of the fade.
                  className="transition-none"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  globals: { theme: pageTheme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: pageTheme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = {
      glyph: tokenColour('text-primary'),
      hover: tokenColour('neutral-tonal-surface-default'),
      none: 'rgba(0, 0, 0, 0)',
    };
    await waitFor(
      () => {
        const toggles = canvasElement.querySelectorAll<HTMLButtonElement>('button[data-theme-variant]');
        expect(toggles).toHaveLength(4);
        for (const toggle of toggles) {
          const theme = toggle.dataset.themeVariant as ThemeToggleTheme;
          const style = getComputedStyle(toggle);
          const svg = toggle.querySelector('svg')!;
          // Theme=Dark: the moon, "Switch to light theme". Theme=Light: the sun, "Switch to dark theme".
          expect(svg.querySelector('path')!.getAttribute('d')).toBe(theme === 'dark' ? ICON_PATHS.moon : ICON_PATHS.sun);
          expect(toggle).toHaveAccessibleName(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
          // Glyph: text.primary (Figma's binding). No fill at rest; Ghost's neutral.tonal fill on hover.
          expect(getComputedStyle(svg).color).toBe(want.glyph);
          expect(style.backgroundColor).toBe(toggle.dataset.pseudo === 'hover' ? want.hover : want.none);
          // 40×40, radius 8, 20px glyph.
          const box = toggle.getBoundingClientRect();
          expect([box.width, box.height]).toEqual([40, 40]);
          expect(style.borderRadius).toBe('8px');
          expect(svg.getBoundingClientRect().width).toBe(20);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const ThemesLight = grid('light');
export const ThemesDark = grid('dark');

/** Keyboard focus: the `stroke.focused` ring Button and IconButton use (Figma has no Focus state). */
export const Focus: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    const ring = tokenColour('stroke-focused');
    await userEvent.tab();
    const toggle = canvas.getByRole('button', { name: 'Switch to light theme' });
    await expect(toggle).toHaveFocus();
    // waitFor: transition-colors fades the outline colour in.
    await waitFor(() => {
      const style = getComputedStyle(toggle);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineOffset).toBe('2px');
      expect(style.outlineColor).toBe(ring);
    });
  },
};
