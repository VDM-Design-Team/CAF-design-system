import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MenuItem } from '../menu-item';
import { MenuTriggerButton, MENU_TRIGGER_BUTTON_STATES, type MenuTriggerButtonProps } from './MenuTriggerButton';

/* The bulk "Change Status" menu, as Figma's Patterns – Admin shows it (Change Status dialog). */
const STATUSES = ['Reject', 'Approve', 'Mark as Paid'] as const;
/* Sample Export items: the exports the CAF screens list are Excel and Zip files. */
const EXPORTS = ['Export as Excel', 'Export as Zip'] as const;

function Example({ items = EXPORTS, ...props }: Partial<MenuTriggerButtonProps> & { items?: readonly string[] }) {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-4 pb-48">
      <p role="status" className="text-body-sm-regular text-text-secondary">
        {chosen ? `Chosen: ${chosen}` : 'Nothing chosen yet'}
      </p>
      <MenuTriggerButton label="Export" {...props}>
        {items.map((label) => (
          <MenuItem key={label} onClick={() => setChosen(label)}>
            {label}
          </MenuItem>
        ))}
      </MenuTriggerButton>
    </div>
  );
}

const meta = {
  title: 'Components/MenuTriggerButton',
  component: MenuTriggerButton,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Buttons** (`Button / Menu Trigger`): the primary button with a ' +
          'trailing caret that opens a MenuDropdown. The list pages use it for **Export** and for the bulk **Change ' +
          'Status (n)** once rows are selected. `label` is the button’s text; the MenuItems are `children`. It is ' +
          '`Button` (Default, Normal), so Hover and Pressed are its own `:hover` and `:active`, and Disabled is ' +
          '`disabled`. The caret takes the label’s colour. Keyboard and focus are MenuDropdown’s: Enter, Space or ↓ open ' +
          'on the first item and ↑ on the last; Escape, Tab or choosing an item close the menu and focus goes back to ' +
          'the button.',
      },
    },
  },
  args: { label: 'Export', children: <MenuItem>Export as Excel</MenuItem> },
  argTypes: { children: { control: false }, label: { control: 'text' } },
  render: (args) => <Example label={args.label} disabled={args.disabled} placement={args.placement} align={args.align} />,
} satisfies Meta<typeof MenuTriggerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Export: click to open, then an item. The menu closes and focus goes back to the button. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Export' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    const menu = canvas.getByRole('menu', { name: 'Export' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(within(menu).getAllByRole('menuitem')).toHaveLength(EXPORTS.length);
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Export as Excel' })).toHaveFocus());

    await userEvent.click(canvas.getByRole('menuitem', { name: 'Export as Zip' }));
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('Chosen: Export as Zip');
    await expect(trigger).toHaveFocus();
  },
};

/** The bulk action: "Change Status (n)", worked from the keyboard. */
export const ChangeStatus: Story = {
  args: { label: 'Change Status (3)' },
  parameters: { controls: { disable: true } },
  render: (args) => <Example label={args.label} items={STATUSES} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Change Status (3)' });
    const item = (name: string) => canvas.getByRole('menuitem', { name });
    trigger.focus();

    // ↓ opens on the first item, ↑ on the last; the arrows wrap.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Reject')).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}');
    await expect(item('Mark as Paid')).toHaveFocus();
    // Escape closes and hands focus back.
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(item('Mark as Paid')).toHaveFocus());
    await userEvent.keyboard('{Home}{ArrowDown}{Enter}');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('Chosen: Approve');
    await expect(trigger).toHaveFocus();

    // Space opens too; Tab closes.
    await userEvent.keyboard(' ');
    await waitFor(() => expect(item('Reject')).toHaveFocus());
    await userEvent.keyboard('{Tab}');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};

/** State=Disabled: the button ignores clicks and the menu never opens. */
export const Disabled: Story = {
  args: { label: 'Change Status (0)', disabled: true },
  parameters: { controls: { disable: true } },
  render: (args) => <Example label={args.label} items={STATUSES} disabled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Change Status (0)' });
    await expect(trigger).toBeDisabled();
    await userEvent.click(trigger, { pointerEventsCheck: 0 });
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/* ── Every State, in Light and Dark ────────────────────────────────────────
   The Figma component set: Default, Hover, Pressed, Disabled. Hover and
   Pressed are forced with storybook-addon-pseudo-states and checked against
   the bindings: the fill, the label and the caret, which takes the label's
   colour. */

type State = (typeof MENU_TRIGGER_BUTTON_STATES)[number];
const STATE_LABEL: Record<State, string> = { default: 'Default', hover: 'Hover', pressed: 'Pressed', disabled: 'Disabled' };

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

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    // No colour transition here: the forced states must be settled before the checks and axe look at them.
    <table className="border-separate border-spacing-4 text-left [&_button]:transition-none">
      <thead>
        <tr>
          {MENU_TRIGGER_BUTTON_STATES.map((state) => (
            <th key={state} scope="col" className="text-caption-md-medium text-text-secondary">
              {STATE_LABEL[state]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {MENU_TRIGGER_BUTTON_STATES.map((state) => (
            <td key={state}>
              <MenuTriggerButton label="Change Status (1)" disabled={state === 'disabled'} data-pseudo={state}>
                <MenuItem>Approve</MenuItem>
              </MenuTriggerButton>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default. The button is inside the wrapper.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"] button'], active: ['[data-pseudo="pressed"] button'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover and
  // Pressed on STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = Object.fromEntries(
      MENU_TRIGGER_BUTTON_STATES.map((s) => [
        s,
        [tokenColour(`action-primary-surface-${s}`), tokenColour(`action-primary-content-${s}`)],
      ]),
    ) as Record<State, [string, string]>;
    /* A box-shadow that shows: not `none`, and not only Tailwind's transparent placeholder layers. */
    const lifted = (shadow: string) =>
      shadow !== 'none' && shadow.split(/,(?![^(]*\))/).some((layer) => !layer.trim().startsWith('rgba(0, 0, 0, 0)'));
    await waitFor(
      () => {
        for (const wrapper of canvasElement.querySelectorAll<HTMLElement>('[data-pseudo]')) {
          const state = wrapper.dataset.pseudo as State;
          const button = wrapper.querySelector('button')!;
          const style = getComputedStyle(button);
          const [fill, label] = want[state];
          expect(style.backgroundColor).toBe(fill);
          expect(style.color).toBe(label);
          // Hover lifts the button (Elevation 2); the other states are flat.
          expect(lifted(style.boxShadow)).toBe(state === 'hover');
          // The caret: Phosphor CaretDown at 20px, in the label's colour.
          const caret = button.querySelector('svg')!;
          expect(getComputedStyle(caret).color).toBe(label);
          expect(caret.getBoundingClientRect().width).toBe(20);
          // Button / Normal: 36px high, 16px sides, Label/md-semibold.
          expect(button.getBoundingClientRect().height).toBe(36);
          expect(style.paddingLeft).toBe('16px');
          expect(style.fontWeight).toBe('600');
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');

/* ── The open menu, in Light and Dark ──────────────────────────────────── */

const open = (theme: 'light' | 'dark'): Story => ({
  name: `Open — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { label: 'Change Status (3)' },
  render: (args) => <Example label={args.label} items={STATUSES} defaultOpen />,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const fill = tokenColour('surface-neutral-faint');
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Change Status (3)' });
    const menu = canvas.getByRole('menu', { name: 'Change Status (3)' });
    await expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual([...STATUSES]);
    await expect(getComputedStyle(menu).backgroundColor).toBe(fill);
    // Below the button, 4px away, flush with its left edge.
    const t = trigger.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    await expect(m.top - t.bottom).toBeCloseTo(4, 1);
    await expect(m.left).toBeCloseTo(t.left, 1);
  },
});

export const OpenLight = open('light');
export const OpenDark = open('dark');
