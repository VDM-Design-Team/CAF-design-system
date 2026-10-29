import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Icon } from '../icon';
import { MenuItem } from '../menu-item';
import { MenuDropdown, type MenuDropdownProps } from './MenuDropdown';

/* Figma's example: Approve, Reject, View invoices, Request adjustment, and Delete last, in red. */
const ITEMS = ['Approve', 'Reject', 'View invoices', 'Request adjustment'] as const;

function Example(props: Partial<MenuDropdownProps>) {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-4 pb-64">
      <p role="status" className="text-body-sm-regular text-text-secondary">
        {chosen ? `Chosen: ${chosen}` : 'Nothing chosen yet'}
      </p>
      <MenuDropdown trigger={<Button rightIcon={<Icon name="caret-down" />}>Actions</Button>} {...props}>
        {ITEMS.map((label) => (
          <MenuItem key={label} onClick={() => setChosen(label)}>
            {label}
          </MenuItem>
        ))}
        <MenuItem destructive onClick={() => setChosen('Delete')}>
          Delete
        </MenuItem>
      </MenuDropdown>
    </div>
  );
}

const meta = {
  title: 'Components/MenuDropdown',
  component: MenuDropdown,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Menus** (`Menu / Dropdown`): the action menu a trigger opens, for ' +
          'row •••, Export and the bulk Change Status. `trigger` is the control (a `Button` or `IconButton`); the ' +
          'MenuItems are `children`. It is a Popover with `role="menu"`, named by its trigger, with the menu button ' +
          'keyboard pattern: Enter, Space or ↓ opens on the first item and ↑ on the last; ↓ / ↑ move and wrap; Home / ' +
          'End; Enter or Space chooses; Escape and Tab close. Choosing an item, a click outside or Escape closes it, and ' +
          'focus goes back to the trigger.',
      },
    },
  },
  args: {
    trigger: <Button>Actions</Button>,
    children: <MenuItem>Approve</MenuItem>,
  },
  argTypes: { trigger: { control: false }, children: { control: false } },
  render: (args) => <Example placement={args.placement} align={args.align} />,
} satisfies Meta<typeof MenuDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click the trigger, then an item: the menu closes and focus goes back to the trigger. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await userEvent.click(trigger);
    const menu = canvas.getByRole('menu', { name: 'Actions' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', menu.id);
    await expect(within(menu).getAllByRole('menuitem')).toHaveLength(5);
    // A pointer open still puts focus on the first item, so the arrows work straight away.
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Approve' })).toHaveFocus());

    await userEvent.click(canvas.getByRole('menuitem', { name: 'View invoices' }));
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('Chosen: View invoices');
    await expect(trigger).toHaveFocus();

    // A click outside closes it and leaves focus where the click put it.
    await userEvent.click(trigger);
    await userEvent.click(document.body);
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(trigger).not.toHaveFocus();
  },
};

/** The menu button keyboard pattern, end to end. */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    const item = (name: string) => canvas.getByRole('menuitem', { name });
    const closed = async () => {
      await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveFocus();
    };
    trigger.focus();

    // Enter opens on the first item.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(item('Approve')).toHaveFocus());
    // ↓ / ↑ move, and wrap at both ends.
    await userEvent.keyboard('{ArrowDown}');
    await expect(item('Reject')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await expect(item('Delete')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(item('Approve')).toHaveFocus();
    // Home / End.
    await userEvent.keyboard('{End}');
    await expect(item('Delete')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(item('Approve')).toHaveFocus();
    // Escape closes and hands focus back.
    await userEvent.keyboard('{Escape}');
    await closed();

    // ↑ on the trigger opens on the last item; Enter chooses.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(item('Delete')).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}');
    await expect(item('Request adjustment')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await closed();
    await expect(canvas.getByRole('status')).toHaveTextContent('Chosen: Request adjustment');

    // ↓ on the trigger opens on the first item; Space chooses.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Approve')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');
    await closed();
    await expect(canvas.getByRole('status')).toHaveTextContent('Chosen: Reject');

    // Space on the trigger opens; Tab closes and hands focus back.
    await userEvent.keyboard(' ');
    await waitFor(() => expect(item('Approve')).toHaveFocus());
    await userEvent.keyboard('{Tab}');
    await closed();
  },
};

/* ── The open menu, in Light and Dark ──────────────────────────────────────
   Figma's Menu / Dropdown: five items, Delete last. Checked against its
   bindings and its auto layout. */

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
  render: () => <Example defaultOpen />,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-neutral-faint'),
      label: tokenColour('text-primary'),
      destructive: tokenColour('accent-critical-tonal-content-default'),
    };
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    const menu = canvas.getByRole('menu', { name: 'Actions' });
    const items = within(menu).getAllByRole('menuitem');
    await expect(items.map((i) => i.textContent)).toEqual([...ITEMS, 'Delete']);
    // defaultOpen doesn't move focus: a page with an open menu doesn't steal it on load.
    await expect(menu.contains(document.activeElement)).toBe(false);

    await expect(getComputedStyle(menu).backgroundColor).toBe(want.fill);
    for (const item of items.slice(0, 4)) await expect(getComputedStyle(item).color).toBe(want.label);
    await expect(getComputedStyle(items[4]).color).toBe(want.destructive);

    // Auto layout: 6 padding, 2 between items, items fill the width (at least 256).
    const box = menu.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(256);
    const first = items[0].getBoundingClientRect();
    await expect(first.left - box.left).toBeCloseTo(6, 1);
    await expect(first.width).toBeCloseTo(box.width - 12, 1);
    await expect(items[1].getBoundingClientRect().top - first.bottom).toBeCloseTo(2, 1);
    // Below the trigger, 4px away, flush with its left edge.
    const t = trigger.getBoundingClientRect();
    await expect(box.top - t.bottom).toBeCloseTo(4, 1);
    await expect(box.left).toBeCloseTo(t.left, 1);
  },
});

export const OpenLight = open('light');
export const OpenDark = open('dark');
