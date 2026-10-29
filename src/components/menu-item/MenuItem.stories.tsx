import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { cn } from '../../lib/cn';
import { popoverSurface } from '../popover';
import { MenuItem } from './MenuItem';

/* A menuitem lives in a menu: the stories put items on Menu / Dropdown's surface, in a role="menu". */
function Menu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="menu" aria-label={label} className={cn(popoverSurface, 'flex w-64 flex-col gap-0.5')}>
      {children}
    </div>
  );
}

const meta = {
  title: 'Components/MenuItem',
  component: MenuItem,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Menus** (`Menu / Item`): one action in a menu. Figma’s Type is ' +
          'Default, Hover (`:hover`) or Destructive (`destructive`); the Label is `children`. It is a ' +
          '`<button role="menuitem">` outside the tab order: use it inside MenuDropdown or RowActionsMenu, which move ' +
          'focus between items and close when one is chosen. Figma has no Disabled item.',
      },
    },
  },
  args: { children: 'Request adjustment', onClick: fn() },
  render: (args) => (
    <Menu label="Example">
      <MenuItem {...args} />
    </Menu>
  ),
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Clickable like any button. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Request adjustment' }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/* ── Every Type × state, in Light and Dark ─────────────────────────────────
   Figma's Default, Hover and Destructive, plus Destructive on hover (which
   Figma doesn't draw), on the menu's surface. Hover is forced with
   storybook-addon-pseudo-states and checked against Figma's bindings. */

const STATES = [
  { state: 'default', label: 'At rest' },
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

/* The type a utility class sets: size, line height, weight. */
function utilityType(className: string) {
  const probe = document.createElement('span');
  probe.className = className;
  document.body.append(probe);
  const { fontSize, lineHeight, fontWeight } = getComputedStyle(probe);
  probe.remove();
  return { fontSize, lineHeight, fontWeight };
}

const types = (theme: 'light' | 'dark'): Story => ({
  name: `Types — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {STATES.map(({ state, label }) => (
        <div key={state} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">{label}</span>
          <Menu label={`Menu items, ${label.toLowerCase()}`}>
            <MenuItem data-pseudo={state} data-type="default" className="transition-none">
              Approve
            </MenuItem>
            <MenuItem destructive data-pseudo={state} data-type="destructive" className="transition-none">
              Delete
            </MenuItem>
          </Menu>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = {
      panel: tokenColour('surface-neutral-faint'),
      hover: tokenColour('surface-base'),
      default: tokenColour('text-primary'),
      destructive: tokenColour('accent-critical-tonal-content-default'),
      type: utilityType('text-body-sm-regular'),
    };
    await waitFor(
      () => {
        for (const menu of canvasElement.querySelectorAll<HTMLElement>('[role="menu"]')) {
          expect(getComputedStyle(menu).backgroundColor).toBe(want.panel);
        }
        const items = canvasElement.querySelectorAll<HTMLElement>('[role="menuitem"]');
        expect(items).toHaveLength(4);
        for (const item of items) {
          const style = getComputedStyle(item);
          // Type=Hover: surface.base. At rest: no fill.
          expect(style.backgroundColor).toBe(item.dataset.pseudo === 'hover' ? want.hover : 'rgba(0, 0, 0, 0)');
          // Type=Default: text.primary. Type=Destructive: accent.critical.tonal.content.default.
          expect(style.color).toBe(want[item.dataset.type as 'default' | 'destructive']);
          // Body/sm-regular; 8 / 12 padding; radius 6.
          expect({ fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight }).toEqual(want.type);
          expect(style.padding).toBe('8px 12px');
          expect(style.borderRadius).toBe('6px');
        }
      },
      { timeout: 3000 },
    );
  },
});

export const TypesLight = types('light');
export const TypesDark = types('dark');
