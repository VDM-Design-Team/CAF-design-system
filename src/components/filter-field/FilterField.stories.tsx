import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ICON_NAMES } from '../icon';
import { Popover } from '../popover';
import { FilterField, FILTER_FIELD_TYPES, type FilterFieldProps } from './FilterField';

const meta = {
  title: 'Components/FilterField',
  component: FilterField,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Filters** (`Filter / Field`): one control in a list page’s filter ' +
          'bar. `type="search"` (the default) is a search box: a magnifying glass, the query, and a clear (×) button once ' +
          'it is filled (Figma’s State=Filled); the clear button and Escape empty it. `type="dropdown"` is a trigger ' +
          'button: a leading icon, the chosen `value` and a caret. It is a trigger only: put it in a Popover with a ' +
          'Select (status, payment method, currency) or a RangeCalendar (period, creation date) as the panel; the List ' +
          'page pattern wires that up. `icon` swaps the leading icon. `label` is required: it is the accessible name.',
      },
    },
  },
  args: { label: 'Search costs', placeholder: 'Search costs...', onChange: fn() },
  argTypes: {
    type: { control: 'radio', options: FILTER_FIELD_TYPES },
    icon: { control: 'select', options: ICON_NAMES },
  },
  render: (args) => (
    <div className="w-60">
      <FilterField {...(args as FilterFieldProps)} />
    </div>
  ),
} satisfies Meta<typeof FilterField>;

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

/** Type to filter: the clear button appears (State=Filled). It, or Escape, empties the box and keeps focus in it. */
export const Playground: Story = {
  /* Search only: on Type=Dropdown, onClear would reach the <button> as an unknown DOM prop. */
  args: { onClear: fn() } as never,
  play: async ({ args, canvasElement }) => {
    const { onChange, onClear } = args as unknown as Record<'onChange' | 'onClear', ReturnType<typeof fn>>;
    const focused = tokenColour('stroke-focused');
    const canvas = within(canvasElement);
    const input = canvas.getByRole('searchbox', { name: 'Search costs' });
    const box = input.parentElement!;
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

    // A click on the icon puts the caret in the input. Focus shows the ring on the whole box.
    await userEvent.click(box.querySelector('svg')!);
    await expect(input).toHaveFocus();
    await waitFor(() => {
      expect(getComputedStyle(box).outlineColor).toBe(focused);
      expect(getComputedStyle(box).outlineWidth).toBe('2px');
    });

    await userEvent.keyboard('zzzqqq');
    await expect(input).toHaveValue('zzzqqq');
    const clear = canvas.getByRole('button', { name: 'Clear search' });

    // The clear button empties the box, fires onChange with "", and hands focus back to the input.
    await userEvent.click(clear);
    await expect(input).toHaveValue('');
    await expect(input).toHaveFocus();
    await expect(onClear).toHaveBeenCalledTimes(1);
    const changes = onChange.mock.calls;
    await expect(changes.at(-1)![0].target.value).toBe('');
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

    // Escape does the same.
    await userEvent.keyboard('maria');
    await userEvent.keyboard('{Escape}');
    await expect(input).toHaveValue('');
    await expect(onClear).toHaveBeenCalledTimes(2);

    // The clear button is in the tab order, with its own focus ring.
    await userEvent.keyboard('zzz');
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Clear search' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('');
    await expect(input).toHaveFocus();
  },
};

/** A controlled search box: the parent holds the query, and the clear button still empties it through `onChange`. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [query, setQuery] = useState('maria');
    return (
      <div className="flex w-60 flex-col gap-2">
        <FilterField label="Search users" placeholder="Search users" value={query} onChange={(e) => setQuery(e.target.value)} />
        <p role="status" className="text-body-sm-regular text-text-secondary">
          {query ? `Query: ${query}` : 'No query'}
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('searchbox', { name: 'Search users' });
    await expect(input).toHaveValue('maria');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(input).toHaveValue('');
    await expect(canvas.getByRole('status')).toHaveTextContent('No query');
    await userEvent.type(input, 'zzz');
    await expect(canvas.getByRole('status')).toHaveTextContent('Query: zzz');
  },
};

/** Type=Dropdown: a button. Its name is the label and the visible value, so it reads "Status: All Status". */
export const Dropdown: Story = {
  args: { type: 'dropdown', label: 'Status', value: 'All Status', onClick: fn() } as never,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Status: All Status' });
    await userEvent.click(button);
    await expect((args as unknown as { onClick: ReturnType<typeof fn> }).onClick).toHaveBeenCalledTimes(1);
  },
};

/**
 * The trigger in a Popover, as the List page pattern uses it. The panel here is a stand-in for the
 * RangeCalendar (or, for status, payment method and currency, the Select) the pattern puts in it.
 */
export const InPopover: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-60 pb-32">
      <Popover
        className="w-full"
        panelRole="dialog"
        label="Choose a period"
        trigger={<FilterField type="dropdown" label="Period" placeholder="Select Period" icon="calendar-blank" />}
      >
        <p className="max-w-64 p-2 text-body-sm-regular">The RangeCalendar goes here. The List page pattern wires it up.</p>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Period: Select Period' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    const panel = canvas.getByRole('dialog', { name: 'Choose a period' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', panel.id);
    // Below the field, 4px away, flush with its left edge.
    await expect(panel.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom).toBeCloseTo(4, 1);
    await expect(panel.getBoundingClientRect().left).toBeCloseTo(trigger.getBoundingClientRect().left, 1);

    // Escape closes it and focus stays on the field.
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};

/* ── Every Type × State, in Light and Dark ─────────────────────────────────
   The Figma component set, then Filter / Bar – Costs, with its real icons and
   labels. Figma has no Hover, so nothing is forced. Checked against the
   bindings: the box's fill and stroke, every text and icon colour, and the
   auto layout's padding and gaps. */

type Row = { name: string; props: FilterFieldProps };

const SET: Row[] = [
  { name: 'Search, Default', props: { label: 'Search', placeholder: 'Text here' } },
  { name: 'Search, Filled', props: { label: 'Search', placeholder: 'Text here', defaultValue: 'zzzqqq' } },
  { name: 'Dropdown, Default', props: { type: 'dropdown', label: 'Filter', value: 'Text here' } },
  {
    name: 'Dropdown, no value',
    props: { type: 'dropdown', label: 'Period', placeholder: 'Select Period', icon: 'calendar-blank' },
  },
];

/* Filter / Bar – Costs (256:4585). Period and Creation Date are Search instances in Figma with a calendar
   icon; they open a RangeCalendar, so in code they are dropdowns (docs/figma-sync.md, "FilterField"). */
const COSTS_BAR: FilterFieldProps[] = [
  { label: 'Search costs', placeholder: 'Search costs...' },
  { type: 'dropdown', label: 'Status', value: 'All Status' },
  { type: 'dropdown', label: 'Payment method', value: 'All Payment Method', icon: 'credit-card' },
  { type: 'dropdown', label: 'Currency', value: 'All Currency', icon: 'currency-circle-dollar' },
  { type: 'dropdown', label: 'Period', placeholder: 'Select Period', icon: 'calendar-blank' },
  { type: 'dropdown', label: 'Creation date', placeholder: 'Creation Date', icon: 'calendar-blank' },
];

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Types — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      <table className="border-separate border-spacing-4 text-left">
        <tbody>
          {SET.map(({ name, props }) => (
            <tr key={name}>
              <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
                {name}
              </th>
              <td className="w-60" data-field>
                <FilterField {...props} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Filter / Bar – Costs: surface.neutral.faint, 16px padding, 12px between the fields. */}
      <div role="search" aria-label="Filter costs" className="flex flex-wrap gap-3 bg-surface-neutral-faint p-4">
        {COSTS_BAR.map((props) => (
          <div key={props.label} className="min-w-60 flex-1" data-field>
            <FilterField {...props} />
          </div>
        ))}
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
      stroke: tokenColour('stroke-strong'),
      primary: tokenColour('text-primary'),
      subtle: tokenColour('text-subtle'),
    };
    const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.6);
    const cells = canvasElement.querySelectorAll<HTMLElement>('[data-field]');
    await expect(cells).toHaveLength(SET.length + COSTS_BAR.length);

    for (const cell of cells) {
      const input = cell.querySelector('input');
      const box = (input ? input.parentElement : cell.querySelector('button'))!;
      const b = box.getBoundingClientRect();
      const style = getComputedStyle(box);
      // Box: surface.elevated-secondary, a 1px stroke.strong inset ring, radius 8, 40px high, 24px sides.
      await expect(style.backgroundColor).toBe(want.fill);
      await expect(style.boxShadow).toContain(`${want.stroke} 0px 0px 0px 1px inset`);
      await expect(style.borderRadius).toBe('8px');
      await expect(b.height).toBe(40);
      const [lead, ...rest] = box.querySelectorAll('svg');
      near(lead.getBoundingClientRect().left - b.left, 24);
      // Every icon — leading, caret, clear — is text.subtle.
      for (const svg of [lead, ...rest]) await expect(getComputedStyle(svg).color).toBe(want.subtle);

      if (input) {
        // Search: 16px from the icon to the query; the query in text.primary, the placeholder in text.subtle.
        near(input.getBoundingClientRect().left - lead.getBoundingClientRect().right, 16);
        await expect(getComputedStyle(input).color).toBe(want.primary);
        await expect(getComputedStyle(input, '::placeholder').color).toBe(want.subtle);
        const clear = box.querySelector('button');
        await expect(!!clear).toBe(input.value !== '');
        if (clear) {
          // Filled: the 16px X sits 16px after the query and 24px from the right edge.
          const x = clear.querySelector('svg')!.getBoundingClientRect();
          await expect(x.width).toBe(16);
          near(x.left - input.getBoundingClientRect().right, 16);
          near(b.right - x.right, 24);
        }
      } else {
        // Dropdown: 12px from the icon to the value; the caret 24px from the right edge.
        const value = box.querySelector<HTMLElement>('span > span:not(.sr-only)')!;
        const empty = cell.textContent!.includes('Select Period') || cell.textContent!.includes('Creation Date');
        await expect(getComputedStyle(value).color).toBe(empty ? want.subtle : want.primary);
        near(value.getBoundingClientRect().left - lead.getBoundingClientRect().right, 12);
        near(b.right - rest[0].getBoundingClientRect().right, 24);
      }
    }
  },
});

export const TypesLight = grid('light');
export const TypesDark = grid('dark');
