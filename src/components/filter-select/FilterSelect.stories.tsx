import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { FilterSelect, type FilterSelectProps } from './FilterSelect';

/* Figma's example (765:15875): the Costs bar's status filter. */
const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

const meta = {
  title: 'Components/FilterSelect',
  component: FilterSelect,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Filters** (`Filter / Field – Select`, State Closed / Open): a ' +
          '`Filter / Field` Type=Dropdown that opens a `Select / Menu` under it, as wide as the field, with the chosen ' +
          'option checked. `allLabel` (“All Status”) is the reset item: first in the list, the field’s value while no ' +
          'filter is in use, and `onValueChange(null)` when chosen. It is Select’s listbox (`useSelectListbox`): the ' +
          'same select-only combobox, keys and typeahead. `label` names the field and the list; `icon` swaps the ' +
          'leading icon; `className` sets the wrapper’s width (256 in the bar).',
      },
    },
  },
  args: { label: 'Status', allLabel: 'All Status', options: STATUSES, onValueChange: fn(), onOpenChange: fn() },
  argTypes: {
    value: { control: false },
    options: { control: false },
  },
  render: (args) => (
    // Figma's field is 256 wide (the bar's slot); room below for the open list.
    <div className="w-64 pb-64">
      <FilterSelect {...args} />
    </div>
  ),
} satisfies Meta<typeof FilterSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/**
 * The field shows the filter’s value, “All Status”. A click opens the list with All Status checked; a click on
 * Pending filters, closes the list and keeps focus on the field; All Status resets it (`onValueChange(null)`).
 */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Status' });
    // A combobox's text is its value: no hidden "Status: " prefix (FilterField's, for a plain button).
    await expect(field.textContent).toBe('All Status');
    await expect(field).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(field).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(field);
    const list = canvas.getByRole('listbox', { name: 'Status' });
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toHaveAttribute('aria-controls', list.id);
    const options = within(list).getAllByRole('option');
    await expect(options.map((o) => o.textContent)).toEqual(['All Status', 'Pending', 'Approved', 'Paid', 'Rejected']);
    await expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(within(list).getByRole('option', { name: 'Pending' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith('pending');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(field).toHaveTextContent('Pending');
    await expect(field).toHaveFocus();

    await userEvent.click(field);
    await expect(canvas.getByRole('option', { name: 'Pending' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(canvas.getByRole('option', { name: 'All Status' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await expect(field).toHaveTextContent('All Status');
  },
};

/**
 * Select’s keys, from the shared listbox: Enter opens on the checked option, ↓ / ↑ move (focus stays on the field,
 * which points at the option with `aria-activedescendant`), typing jumps, Enter chooses, Escape closes without
 * choosing, Tab chooses and moves on.
 */
export const Keyboard: Story = {
  render: (args) => (
    <div className="flex w-64 flex-col gap-4 pb-64">
      <FilterSelect {...args} />
      <button type="button" className="self-start text-body-sm-regular text-text-primary">
        Next field
      </button>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Status' });
    const onOption = async (name: string) => {
      const option = canvas.getByRole('option', { name });
      await expect(field).toHaveAttribute('aria-activedescendant', option.id);
      await expect(option).toHaveAttribute('data-focus-visible');
      await expect(field).toHaveFocus();
    };
    field.focus();

    await userEvent.keyboard('{Enter}');
    await onOption('All Status');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await onOption('Approved');
    await userEvent.keyboard('{ArrowUp}');
    await onOption('Pending');
    await userEvent.keyboard('{Enter}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('pending');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(field).not.toHaveAttribute('aria-activedescendant');
    await expect(field).toHaveTextContent('Pending');

    // ↓ opens on the chosen option; typing “r” jumps to Rejected; Escape closes without choosing.
    await userEvent.keyboard('{ArrowDown}');
    await onOption('Pending');
    await userEvent.keyboard('r');
    await onOption('Rejected');
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(field).toHaveTextContent('Pending');

    // Home opens on the first, All Status; Tab chooses it and moves on.
    await userEvent.keyboard('{Home}');
    await onOption('All Status');
    await userEvent.tab();
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await expect(field).toHaveTextContent('All Status');
    await expect(canvas.getByRole('button', { name: 'Next field' })).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
  },
};

function ControlledFilter(props: Pick<FilterSelectProps, 'onValueChange'>) {
  const [status, setStatus] = useState<string | null>('paid');
  return (
    <div className="flex w-64 flex-col gap-3 pb-64">
      <FilterSelect
        label="Status"
        allLabel="All Status"
        options={STATUSES}
        value={status}
        onValueChange={(next) => {
          props.onValueChange?.(next);
          setStatus(next);
        }}
      />
      <output className="text-caption-md-regular text-text-secondary" data-testid="status">
        {status ?? 'all'}
      </output>
    </div>
  );
}

/** Controlled (`value` + `onValueChange`): the page holds the filter; `null` is the All item. */
export const Controlled: Story = {
  render: (args) => <ControlledFilter onValueChange={args.onValueChange} />,
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Status' });
    await expect(field).toHaveTextContent('Paid');
    await userEvent.click(field);
    await expect(canvas.getByRole('option', { name: 'Paid' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(canvas.getByRole('option', { name: 'All Status' }));
    await expect(canvas.getByTestId('status')).toHaveTextContent('all');
    await expect(field).toHaveTextContent('All Status');
  },
};

/**
 * Without `allLabel` the list holds only `options`, and the field shows `label` in text/subtle until one is
 * chosen. With `icon`, the leading icon swaps (the bar’s Payment Method uses `credit-card`).
 */
export const NoResetItem: Story = {
  name: 'No reset item, another icon',
  args: { label: 'Payment method', allLabel: undefined, icon: 'credit-card', options: ['Bank Transfer', 'Card', 'Cash'] },
  play: async ({ args, canvas }) => {
    const subtle = tokenColour('text-subtle');
    const primary = tokenColour('text-primary');
    const field = canvas.getByRole('combobox', { name: 'Payment method' });
    const value = field.querySelector('span > span')!;
    await expect(value).toHaveTextContent('Payment method');
    await expect(getComputedStyle(value).color).toBe(subtle);
    await userEvent.click(field);
    await expect(within(canvas.getByRole('listbox')).getAllByRole('option')).toHaveLength(3);
    await expect(canvas.queryByRole('option', { selected: true })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('option', { name: 'Card' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith('Card');
    await expect(field.querySelector('span > span')).toHaveTextContent('Card');
    await expect(getComputedStyle(field.querySelector('span > span')!).color).toBe(primary);
  },
};

/** Disabled: the field can’t be pressed or focused, and the list never opens. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Status' });
    await expect(field).toBeDisabled();
    await userEvent.click(field, { pointerEventsCheck: 0 });
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

/* ── State=Closed and State=Open, in Light and Dark ────────────────────────
   Figma’s example (765:15875): Closed on All Status, and Open with Pending chosen.
   Checked against the bindings: the field (Filter / Field), the list (Select / Menu)
   and its options (Select / Option), and where the list sits. */

const states = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: (args) => (
    <div className="flex flex-wrap items-start gap-6 pb-64">
      <div className="w-64" data-state="closed">
        <FilterSelect {...args} />
      </div>
      <div className="w-64" data-state="open">
        <FilterSelect {...args} defaultValue="pending" defaultOpen />
      </div>
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-elevated-secondary'),
      stroke: tokenColour('stroke-field'),
      primary: tokenColour('text-primary'),
      subtle: tokenColour('text-subtle'),
      menu: tokenColour('surface-neutral-faint'),
      menuStroke: tokenColour('stroke-subtle'),
      selected: tokenColour('neutral-tonal-surface-default'),
      check: tokenColour('text-primary'),
    };
    const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.6);

    for (const state of ['closed', 'open']) {
      const cell = canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
      const field = within(cell).getByRole('combobox', { name: 'Status' });
      const f = field.getBoundingClientRect();
      // Field: Filter / Field Type=Dropdown — surface.elevated-secondary, a 1px stroke.field inside, radius 8, 40 high, 256 wide.
      const style = getComputedStyle(field);
      await expect(style.backgroundColor).toBe(want.fill);
      await expect(style.boxShadow).toContain(`${want.stroke} 0px 0px 0px 1px inset`);
      await expect(style.borderRadius).toBe('8px');
      await expect(f.height).toBe(40);
      await expect(f.width).toBe(256);
      // Funnel 24 from the left, the value 12 after it in text.primary, the caret 24 from the right; icons text.subtle.
      const [funnel, caret] = field.querySelectorAll('svg');
      const value = field.querySelector('span > span')!;
      near(funnel.getBoundingClientRect().left - f.left, 24);
      near(value.getBoundingClientRect().left - funnel.getBoundingClientRect().right, 12);
      near(f.right - caret.getBoundingClientRect().right, 24);
      await expect(getComputedStyle(funnel).color).toBe(want.subtle);
      await expect(getComputedStyle(caret).color).toBe(want.subtle);
      await expect(getComputedStyle(value).color).toBe(want.primary);
      await expect(value).toHaveTextContent(state === 'open' ? 'Pending' : 'All Status');
      await expect(field).toHaveAttribute('aria-expanded', String(state === 'open'));
      if (state === 'closed') {
        await expect(within(cell).queryByRole('listbox')).not.toBeInTheDocument();
        continue;
      }

      // Menu: Select / Menu — surface.neutral.faint, 1px stroke.subtle inside, radius 8, 6 padding, 2 between options;
      // space.4 under the field, flush left, as wide as the field (Fill).
      const list = within(cell).getByRole('listbox', { name: 'Status' });
      const l = list.getBoundingClientRect();
      const menu = getComputedStyle(list);
      await expect(menu.backgroundColor).toBe(want.menu);
      await expect(menu.boxShadow).toContain(`${want.menuStroke} 0px 0px 0px 1px inset`);
      await expect(menu.borderRadius).toBe('8px');
      await expect(menu.padding).toBe('6px');
      near(l.top - f.bottom, 4);
      near(l.left, f.left);
      near(l.width, f.width);
      // defaultOpen doesn't take focus, and no option shows the keyboard's ring.
      await expect(field).not.toHaveFocus();
      await expect(list.querySelector('[data-focus-visible]')).toBeNull();

      // Options: Select / Option — 36 high, Body/sm-regular in text.primary; Pending is Selected (neutral.tonal.surface.default + the text.primary check).
      const options = within(list).getAllByRole('option');
      await expect(options.map((o) => o.textContent)).toEqual(['All Status', 'Pending', 'Approved', 'Paid', 'Rejected']);
      near(options[1].getBoundingClientRect().top - options[0].getBoundingClientRect().bottom, 2);
      for (const option of options) {
        const chosen = option.textContent === 'Pending';
        await expect(option).toHaveAttribute('aria-selected', String(chosen));
        await expect(option.getBoundingClientRect().height).toBe(36);
        await expect(getComputedStyle(option).color).toBe(want.primary);
        if (chosen) {
          await expect(getComputedStyle(option).backgroundColor).toBe(want.selected);
          await expect(getComputedStyle(option.querySelector('svg')!).color).toBe(want.check);
        } else {
          // The first option is where the keys start (data-active): Hover's fill. The rest have none.
          const fill = option.hasAttribute('data-active') ? want.selected : 'rgba(0, 0, 0, 0)';
          await expect(getComputedStyle(option).backgroundColor).toBe(fill);
          await expect(option.querySelector('svg')).toBeNull();
        }
      }
    }
  },
});

export const StatesLight = states('light');
export const StatesDark = states('dark');
