import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { FormLabel } from '../form-label';
import { Select, type SelectProps } from './Select';

/* Figma's Select / Menu example. */
const COUNTRIES = ['Philippines', 'United States', 'United Kingdom', 'Romania', 'Hungary'];
/* Options with a value apart from the label, as a form stores them. */
const FREQUENCIES = [
  { value: 'once', label: 'One-off' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];
/* More options than fit: the list scrolls past 256px. */
const CURRENCIES = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HUF', 'INR',
  'JPY', 'MXN', 'NOK', 'PHP', 'PLN', 'RON', 'SEK', 'USD',
];

/* A select with its chosen value read back underneath, and a field after it for Tab. */
function Example(props: Partial<SelectProps>) {
  const [chosen, setChosen] = useState<string | null>(props.defaultValue ?? null);
  return (
    <div className="flex w-96 flex-col items-start gap-4 pb-64">
      <Select
        aria-label="Country"
        options={COUNTRIES}
        {...props}
        onValueChange={(v) => {
          props.onValueChange?.(v);
          setChosen(v);
        }}
      />
      <p role="status" className="text-body-sm-regular text-text-secondary">
        {chosen ? `Chosen: ${chosen}` : 'Nothing chosen yet'}
      </p>
      <button type="button" className="text-body-sm-regular text-text-primary">
        Next field
      </button>
    </div>
  );
}

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    docs: {
      description: {
        component:
          'The select from the CAF Figma library, page **Form**: `_Dropdown Input` (SelectTrigger) opening a ' +
          '`Select / Menu` (SelectMenu) of `Select / Option`s (SelectOption) in a Popover, below the trigger and at ' +
          'least as wide. `options` are strings or `{ value, label }`; `value` / `defaultValue` and `onValueChange` ' +
          'hold the choice; every other prop (`placeholder`, `disabled`, `aria-invalid`, the name) goes to the ' +
          'trigger. It is the WAI-ARIA select-only combobox: focus stays on the trigger, which points at the option ' +
          'the keys are on with `aria-activedescendant`. Enter, Space, ↓ or ↑ open the list on the chosen option, ' +
          'Home / End on the first / last; ↓ / ↑ move, Home / End and Page Up / Down jump; typing jumps to a match; ' +
          'Enter, Space or Alt + ↑ choose and close; Tab chooses and moves on; Escape closes.',
      },
    },
  },
  args: { options: COUNTRIES, 'aria-label': 'Country', placeholder: 'Select option', onValueChange: fn() },
  argTypes: {
    options: { control: false },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
  render: (args) => <Example {...args} />,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click to open, click an option to choose it: the list closes and focus stays on the trigger. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Country' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveTextContent('Select option');

    await userEvent.click(trigger);
    const list = canvas.getByRole('listbox', { name: 'Country' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', list.id);
    await expect(within(list).getAllByRole('option').map((o) => o.textContent)).toEqual(COUNTRIES);
    // Nothing chosen: the arrow keys start on the first option. Focus stays on the trigger.
    await expect(trigger).toHaveAttribute('aria-activedescendant', canvas.getByRole('option', { name: 'Philippines' }).id);
    await expect(trigger).toHaveFocus();

    await userEvent.click(canvas.getByRole('option', { name: 'Romania' }));
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(trigger).toHaveTextContent('Romania');
    await expect(trigger).not.toHaveAttribute('aria-activedescendant');
    await expect(trigger).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('Romania');
    await expect(canvas.getByRole('status')).toHaveTextContent('Chosen: Romania');

    // It opens on the chosen option, which is selected.
    await userEvent.click(trigger);
    const romania = canvas.getByRole('option', { name: 'Romania' });
    await expect(romania).toHaveAttribute('aria-selected', 'true');
    await expect(trigger).toHaveAttribute('aria-activedescendant', romania.id);
    // Choosing it again changes nothing.
    await userEvent.click(romania);
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);

    // A click outside closes it and leaves focus where the click put it.
    await userEvent.click(trigger);
    await userEvent.click(document.body);
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(trigger).not.toHaveFocus();
  },
};

/** Values apart from labels: `onValueChange` gets the value, the trigger shows the label. */
export const Values: Story = {
  args: { options: FREQUENCIES, 'aria-label': 'Frequency', defaultValue: 'monthly' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await expect(trigger).toHaveTextContent('Monthly');
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('option', { name: 'Yearly' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('yearly');
    await expect(trigger).toHaveTextContent('Yearly');
  },
};

/**
 * Named by a label above it, as Form / Field – Dropdown will do. The list
 * takes the same name: through the trigger for `<label htmlFor>`, and
 * directly for `aria-labelledby`.
 */
export const WithLabel: Story = {
  args: { 'aria-label': undefined },
  render: (args) => (
    <div className="flex w-96 flex-col gap-6 pb-64">
      <div className="flex flex-col gap-2">
        <FormLabel htmlFor="cost-country">Country of the cost</FormLabel>
        <Select {...args} id="cost-country" />
      </div>
      <div className="flex flex-col gap-2">
        <FormLabel as="span" id="billing-country">
          Billing country
        </FormLabel>
        <Select {...args} aria-labelledby="billing-country" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Country of the cost', 'Billing country']) {
      const trigger = canvas.getByRole('combobox', { name });
      await userEvent.click(trigger);
      await expect(canvas.getByRole('listbox', { name })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    }
  },
};

/** Disabled (the trigger's State=Disabled): it doesn't open. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Hungary' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Country' });
    await expect(trigger).toBeDisabled();
    await expect(trigger).toHaveTextContent('Hungary');
    await userEvent.click(trigger, { pointerEventsCheck: 0 });
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

/* ── The keyboard ──────────────────────────────────────────────────────── */

/** The select-only combobox pattern, end to end. Focus never leaves the trigger. */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Country' });
    const option = (name: string) => canvas.getByRole('option', { name });
    /* The option the keys are on: aria-activedescendant, with the focus ring. */
    const onOption = async (name: string) => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('aria-activedescendant', option(name).id);
      await expect(option(name)).toHaveAttribute('data-focus-visible');
      await expect(canvasElement.querySelectorAll('[data-active]')).toHaveLength(1);
      await expect(trigger).toHaveFocus();
    };
    const closedOn = async (value: string) => {
      await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).not.toHaveAttribute('aria-activedescendant');
      await expect(trigger).toHaveTextContent(value);
    };
    trigger.focus();

    // ↓ opens on the first option, as nothing is chosen.
    await userEvent.keyboard('{ArrowDown}');
    await onOption('Philippines');
    // ↓ / ↑ move and stop at the ends.
    await userEvent.keyboard('{ArrowDown}');
    await onOption('United States');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await onOption('Philippines');
    await userEvent.keyboard('{End}{ArrowDown}');
    await onOption('Hungary');
    // Home / End, Page Up / Page Down.
    await userEvent.keyboard('{Home}');
    await onOption('Philippines');
    await userEvent.keyboard('{PageDown}');
    await onOption('Hungary');
    await userEvent.keyboard('{PageUp}');
    await onOption('Philippines');
    // Enter chooses and closes.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await closedOn('United States');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('United States');
    await expect(trigger).toHaveFocus();

    // Enter opens on the chosen option; Escape closes without choosing.
    await userEvent.keyboard('{Enter}');
    await onOption('United States');
    await expect(option('United States')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowDown}{Escape}');
    await closedOn('United States');

    // Space opens; Space chooses, and its keyup doesn't open the list again.
    await userEvent.keyboard(' ');
    await onOption('United States');
    await userEvent.keyboard('{ArrowDown} ');
    await closedOn('United Kingdom');

    // ↑ opens on the chosen option; Alt + ↑ chooses and closes.
    await userEvent.keyboard('{ArrowUp}');
    await onOption('United Kingdom');
    await userEvent.keyboard('{ArrowUp}{Alt>}{ArrowUp}{/Alt}');
    await closedOn('United States');

    // Home / End open on the first / last option.
    await userEvent.keyboard('{End}');
    await onOption('Hungary');
    await userEvent.keyboard('{Escape}{Home}');
    await onOption('Philippines');
    // Tab chooses and moves focus on.
    await userEvent.keyboard('{Tab}');
    await closedOn('Philippines');
    await expect(canvas.getByRole('button', { name: 'Next field' })).toHaveFocus();
    await expect(canvas.getByRole('status')).toHaveTextContent('Chosen: Philippines');
    await expect(args.onValueChange).toHaveBeenCalledTimes(4);
  },
};

const pause = () => new Promise((resolve) => setTimeout(resolve, 600));

/** Typing jumps to the first option that starts with the letters typed, open or closed. */
export const Typeahead: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Country' });
    const isOn = (name: string) =>
      expect(trigger).toHaveAttribute('aria-activedescendant', canvas.getByRole('option', { name }).id);
    trigger.focus();

    // A letter opens the list on the first match.
    await userEvent.keyboard('r');
    await isOn('Romania');
    await pause();
    // The same letter again moves to the next match, wrapping round.
    await userEvent.keyboard('u');
    await isOn('United States');
    await pause();
    await userEvent.keyboard('u');
    await isOn('United Kingdom');
    // Typed quickly, a repeated letter cycles too.
    await userEvent.keyboard('uu');
    await isOn('United Kingdom');
    await pause();
    // Typed quickly, letters (and spaces) make one search: "united k" passes United States.
    await userEvent.keyboard('united ');
    await isOn('United States');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('k');
    await isOn('United Kingdom');
    // No match: the option stays.
    await userEvent.keyboard('z');
    await isOn('United Kingdom');
    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveTextContent('United Kingdom');
    await pause();

    // Closed, a letter opens on its match after the chosen option.
    await userEvent.keyboard('h');
    await isOn('Hungary');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveTextContent('United Kingdom');
  },
};

/** A long list scrolls past 256px; the keys keep the option they're on in view. */
export const LongList: Story = {
  args: { options: CURRENCIES, 'aria-label': 'Currency', defaultValue: 'EUR' },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Currency' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const list = canvas.getByRole('listbox', { name: 'Currency' });
    await expect(list.getBoundingClientRect().height).toBeCloseTo(256, 1);
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);

    const inView = (name: string) => {
      const box = canvas.getByRole('option', { name }).getBoundingClientRect();
      // The list is rendered afresh each time it opens.
      const frame = canvas.getByRole('listbox').getBoundingClientRect();
      return box.top >= frame.top && box.bottom <= frame.bottom;
    };
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(inView('USD')).toBe(true));
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(inView('AUD')).toBe(true));
    await userEvent.keyboard('{PageDown}{PageDown}');
    await waitFor(() => expect(inView('USD')).toBe(true));
    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveTextContent('USD');

    // Reopened after the keys moved away and Escape: back on the chosen option, scrolled to it.
    await userEvent.keyboard('{ArrowDown}{Home}{Escape}{ArrowDown}');
    await expect(trigger).toHaveAttribute('aria-activedescendant', canvas.getByRole('option', { name: 'USD' }).id);
    await waitFor(() => expect(inView('USD')).toBe(true));
  },
};

/* ── The open select, in Light and Dark ───────────────────────────────────
   Figma's Select / Menu under the trigger, with Philippines chosen. Checked
   against the bindings, the menu's auto layout and its place under the trigger. */

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
  args: { defaultOpen: true, defaultValue: 'Philippines' },
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-neutral-faint'),
      stroke: tokenColour('stroke-subtle'),
      selected: tokenColour('surface-base'),
      label: tokenColour('text-primary'),
      check: tokenColour('action-primary-surface-default'),
      focused: tokenColour('stroke-focused'),
    };
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Country' });
    const list = canvas.getByRole('listbox', { name: 'Country' });
    const options = within(list).getAllByRole('option');
    await expect(options.map((o) => o.textContent)).toEqual(COUNTRIES);
    // State=Open on the trigger: Focus's 2px stroke.focused stroke inside the edge.
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(getComputedStyle(trigger).boxShadow).toContain(`${want.focused} 0px 0px 0px 2px inset`);
    // defaultOpen doesn't move focus, and the pointer's option shows no focus ring.
    await expect(trigger).not.toHaveFocus();
    await expect(canvasElement.querySelector('[data-focus-visible]')).toBeNull();

    // Select / Menu: surface.neutral.faint, a 1px stroke.subtle stroke inside, radius 8, 6 padding.
    const style = getComputedStyle(list);
    await expect(style.backgroundColor).toBe(want.fill);
    await expect(style.boxShadow).toContain(`${want.stroke} 0px 0px 0px 1px inset`);
    await expect(style.borderRadius).toBe('8px');
    await expect(style.padding).toBe('6px');
    // Select / Option: Selected is surface.base with the check; the rest have no fill.
    const [chosen, ...rest] = options;
    await expect(chosen).toHaveAttribute('aria-selected', 'true');
    await expect(getComputedStyle(chosen).backgroundColor).toBe(want.selected);
    await expect(getComputedStyle(chosen.querySelector('svg')!).color).toBe(want.check);
    for (const o of rest) {
      await expect(o).toHaveAttribute('aria-selected', 'false');
      await expect(getComputedStyle(o).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      await expect(o.querySelector('svg')).toBeNull();
    }
    for (const o of options) await expect(getComputedStyle(o).color).toBe(want.label);

    // Under the trigger, space.4 away, flush left, as wide as the trigger; 2 between options.
    const t = trigger.getBoundingClientRect();
    const box = list.getBoundingClientRect();
    await expect(box.top - t.bottom).toBeCloseTo(4, 1);
    await expect(box.left).toBeCloseTo(t.left, 1);
    await expect(box.width).toBeCloseTo(t.width, 1);
    await expect(options[1].getBoundingClientRect().top - options[0].getBoundingClientRect().bottom).toBeCloseTo(2, 1);
  },
});

export const OpenLight = open('light');
export const OpenDark = open('dark');
