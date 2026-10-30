import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ICON_PATHS } from '../icon/icons';
import { AccountMenu, ACCOUNT_MENU_ITEMS, type AccountMenuItem, type AccountMenuProps } from './AccountMenu';

/* The account icon sits at the right of the header, so the stories put it at the right of a row:
   the menu opens below it, flush with its right edge, with room to the left. */
function Example(props: Partial<AccountMenuProps>) {
  const [chosen, setChosen] = useState<AccountMenuItem | null>(null);
  return (
    <div className="flex w-96 flex-col gap-4 pb-48">
      <p role="status" className="text-body-sm-regular text-text-secondary">
        {chosen ? `Chosen: ${chosen}` : 'Nothing chosen yet'}
      </p>
      <div className="flex justify-end">
        <AccountMenu
          {...props}
          onSelect={(item) => {
            setChosen(item);
            props.onSelect?.(item);
          }}
        />
      </div>
    </div>
  );
}

const meta = {
  title: 'Components/AccountMenu',
  component: AccountMenu,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation** (`Navigation / Account Menu`): the menu behind the ' +
          'account icon at the right of the header. Its rows are Figma’s, in order: Manage Currencies, Settings, a ' +
          'divider, Logout. `onSelect` gets the one chosen (`manage-currencies`, `settings` or `logout`); the app opens ' +
          'the dialog, the page or signs out (pattern U06). The default trigger is the header’s account icon (IconButton ' +
          'size 40, User glyph, named “Account”); `trigger` replaces it. It is a MenuDropdown, flush with the trigger’s ' +
          'right edge, with the menu button keyboard pattern: Enter, Space or ↓ opens on the first item and ↑ on the ' +
          'last; ↓ / ↑ move and wrap, skipping the divider; Home / End; Enter or Space chooses; Escape and Tab close; ' +
          'focus goes back to the trigger.',
      },
    },
  },
  args: { onSelect: fn() },
  argTypes: { trigger: { control: false } },
  render: (args) => <Example onSelect={args.onSelect} align={args.align} placement={args.placement} />,
} satisfies Meta<typeof AccountMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click the account icon, then an item: the menu closes, focus goes back to the icon, and `onSelect` has the item. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Account' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    const menu = canvas.getByRole('menu', { name: 'Account' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(
      ACCOUNT_MENU_ITEMS.map(({ label }) => label),
    );
    await expect(within(menu).getAllByRole('separator')).toHaveLength(1);
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Manage Currencies' })).toHaveFocus());

    await userEvent.click(canvas.getByRole('menuitem', { name: 'Settings' }));
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
    await expect(args.onSelect).toHaveBeenLastCalledWith('settings');
    await expect(canvas.getByRole('status')).toHaveTextContent('Chosen: settings');
    await expect(trigger).toHaveFocus();
  },
};

/** The menu button keyboard pattern: open, the arrows (which skip the divider), Escape, focus return. */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Account' });
    const item = (name: string) => canvas.getByRole('menuitem', { name });
    const closed = async () => {
      await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveFocus();
    };

    // Tab reaches the account icon.
    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    // Enter opens on the first item.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(item('Manage Currencies')).toHaveFocus());
    // ↓ moves down, past the divider, and wraps.
    await userEvent.keyboard('{ArrowDown}');
    await expect(item('Settings')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(item('Logout')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(item('Manage Currencies')).toHaveFocus();
    // ↑ wraps the other way; Home / End.
    await userEvent.keyboard('{ArrowUp}');
    await expect(item('Logout')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(item('Manage Currencies')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(item('Logout')).toHaveFocus();
    // Escape closes and hands focus back to the icon.
    await userEvent.keyboard('{Escape}');
    await closed();
    await expect(args.onSelect).not.toHaveBeenCalled();

    // ↑ on the icon opens on the last item; Enter chooses it.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(item('Logout')).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await closed();
    await expect(args.onSelect).toHaveBeenLastCalledWith('logout');

    // ↓ on the icon opens on the first item; Space chooses.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Manage Currencies')).toHaveFocus());
    await userEvent.keyboard(' ');
    await closed();
    await expect(args.onSelect).toHaveBeenLastCalledWith('manage-currencies');

    // Space opens; Tab closes and hands focus back.
    await userEvent.keyboard(' ');
    await waitFor(() => expect(item('Manage Currencies')).toHaveFocus());
    await userEvent.keyboard('{Tab}');
    await closed();
    await expect(args.onSelect).toHaveBeenCalledTimes(2);
  },
};

/* ── The menu open, in Light and Dark ──────────────────────────────────────
   Figma's Navigation / Account Menu: three rows and a divider before Logout.
   Settings is forced to Hover, and so is the account icon in the second row,
   with storybook-addon-pseudo-states. Checked against Figma's bindings and its
   auto layout. */

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

const open = (theme: 'light' | 'dark'): Story => ({
  name: `Open — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      <Example defaultOpen />
      {/* The account icon closed, at rest and on hover. Its fill fades in (transition-colors), so the check waits for it. */}
      <div className="flex items-center gap-4">
        <AccountMenu />
        <span data-pseudo="hover">
          <AccountMenu />
        </span>
      </div>
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-item="settings"]', '[data-pseudo="hover"] button'] },
  },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  afterEach: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-neutral-faint'),
      label: tokenColour('text-primary'),
      hover: tokenColour('surface-base'),
      divider: tokenColour('stroke-subtle'),
      glyph: tokenColour('text-primary'),
      iconHover: tokenColour('neutral-tonal-surface-default'),
      none: 'rgba(0, 0, 0, 0)',
    };
    const canvas = within(canvasElement);
    const menu = canvas.getByRole('menu', { name: 'Account' });
    const items = within(menu).getAllByRole('menuitem');
    const divider = within(menu).getByRole('separator');
    const [trigger, ...closedIcons] = canvas.getAllByRole('button', { name: 'Account' });
    // defaultOpen doesn't move focus: a page with an open menu doesn't steal it on load.
    await expect(menu.contains(document.activeElement)).toBe(false);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(items.map((i) => i.textContent)).toEqual(['Manage Currencies', 'Settings', 'Logout']);

    await waitFor(
      () => {
        // Panel: surface.neutral.faint fill (Menu / Dropdown's surface).
        expect(getComputedStyle(menu).backgroundColor).toBe(want.fill);
        // Items: text.primary labels, all Type=Default (Logout too). Settings on hover: surface.base.
        for (const i of items) {
          const style = getComputedStyle(i);
          expect(style.color).toBe(want.label);
          expect(style.backgroundColor).toBe(i.dataset.item === 'settings' ? want.hover : want.none);
        }
        // Divider: 1px stroke.subtle.
        const line = getComputedStyle(divider);
        expect(line.borderTopColor).toBe(want.divider);
        expect(line.borderTopWidth).toBe('1px');
        expect(divider.getBoundingClientRect().height).toBe(1);
        // The account icon: User glyph in text.primary; no fill at rest, neutral.tonal on hover.
        for (const icon of [trigger, ...closedIcons]) {
          const svg = icon.querySelector('svg')!;
          expect(svg.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.user);
          expect(getComputedStyle(svg).color).toBe(want.glyph);
        }
        expect(getComputedStyle(closedIcons[0]).backgroundColor).toBe(want.none);
        expect(getComputedStyle(closedIcons[1]).backgroundColor).toBe(want.iconHover);
      },
      { timeout: 3000 },
    );

    // Auto layout: padding 6, 2 between rows (the divider is a row), items fill the width (at least 256).
    const box = menu.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(256);
    const rows = [items[0], items[1], divider, items[2]].map((row) => row.getBoundingClientRect());
    await expect(rows[0].left - box.left).toBeCloseTo(6, 1);
    await expect(rows[0].top - box.top).toBeCloseTo(6, 1);
    await expect(rows[0].width).toBeCloseTo(box.width - 12, 1);
    await expect(rows[2].width).toBeCloseTo(box.width - 12, 1);
    for (let r = 1; r < rows.length; r++) await expect(rows[r].top - rows[r - 1].bottom).toBeCloseTo(2, 1);
    // Below the icon, 4px away, flush with its right edge.
    const t = trigger.getBoundingClientRect();
    await expect(box.top - t.bottom).toBeCloseTo(4, 1);
    await expect(box.right).toBeCloseTo(t.right, 1);
  },
});

export const OpenLight = open('light');
export const OpenDark = open('dark');
