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
          'Default, Hover (`:hover`), Destructive (`destructive`) or Destructive Hover; the Label is `children`. The ' +
          'item the keyboard is on takes the Hover look, plus the focus ring. It is a ' +
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
   Figma's Default, Hover, Destructive and Destructive Hover, plus the item the
   keyboard is on (`:focus-visible`, Hover's look and the ring), on the menu's
   surface. Hover and focus are forced with storybook-addon-pseudo-states and
   checked against Figma's bindings. */

const STATES = [
  { state: 'default', label: 'At rest' },
  { state: 'hover', label: 'Hover' },
  { state: 'focus-visible', label: 'Keyboard focus' },
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
    pseudo: {
      rootSelector: 'body',
      hover: ['[data-pseudo="hover"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = {
      panel: tokenColour('surface-elevated'),
      hover: tokenColour('neutral-tonal-surface-default'),
      default: tokenColour('text-primary'),
      destructive: tokenColour('accent-critical-tonal-content-default'),
      destructiveHover: tokenColour('accent-critical-tonal-content-hover'),
      ring: tokenColour('stroke-focused'),
      type: utilityType('text-body-sm-regular'),
    };
    await waitFor(
      () => {
        for (const menu of canvasElement.querySelectorAll<HTMLElement>('[role="menu"]')) {
          expect(getComputedStyle(menu).backgroundColor).toBe(want.panel);
        }
        const items = canvasElement.querySelectorAll<HTMLElement>('[role="menuitem"]');
        expect(items).toHaveLength(6);
        for (const item of items) {
          const style = getComputedStyle(item);
          const lifted = item.dataset.pseudo !== 'default';
          // Type=Hover, Destructive Hover and the keyboard's item: neutral.tonal.surface.default. At rest: no fill.
          expect(style.backgroundColor).toBe(lifted ? want.hover : 'rgba(0, 0, 0, 0)');
          // Type=Default (and Hover): text.primary. Destructive: accent.critical.tonal.content.default,
          // and .hover on the lifted fill.
          const label = item.dataset.type === 'default' ? want.default : lifted ? want.destructiveHover : want.destructive;
          expect(style.color).toBe(label);
          // The focus ring only on the keyboard's item: 2px stroke.focused, 2px out.
          if (item.dataset.pseudo === 'focus-visible') {
            expect([style.outlineStyle, style.outlineWidth, style.outlineColor, style.outlineOffset]).toEqual([
              'solid',
              '2px',
              want.ring,
              '2px',
            ]);
          } else {
            expect(style.outlineStyle).toBe('none');
          }
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
