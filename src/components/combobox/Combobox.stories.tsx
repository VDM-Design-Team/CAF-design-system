import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Combobox, type ComboboxProps } from './Combobox';

/* Figma's Select / Menu example, the list _Combobox Input opens (Location). */
const COUNTRIES = ['Philippines', 'United States', 'United Kingdom', 'Romania', 'Hungary'];
/* Options with a value apart from the label, as a form stores them. */
const LOCATIONS = [
  { value: 'PH', label: 'Philippines' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'RO', label: 'Romania' },
  { value: 'HU', label: 'Hungary' },
];
/* More options than fit: the list scrolls past 256px. */
const CURRENCIES = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HUF', 'INR',
  'JPY', 'MXN', 'NOK', 'PHP', 'PLN', 'RON', 'SEK', 'USD',
];
const PLACEHOLDER = 'Select or type a location';

/* A combobox with its chosen value read back underneath, and a field after it for Tab. */
function Example(props: Partial<ComboboxProps>) {
  const [chosen, setChosen] = useState<string | null>(props.defaultValue ?? null);
  return (
    <div className="flex w-96 flex-col items-start gap-4 pb-64">
      <Combobox
        aria-label="Location"
        options={COUNTRIES}
        {...props}
        onValueChange={(v) => {
          props.onValueChange?.(v);
          setChosen(v);
        }}
      />
      <p data-testid="chosen" className="text-body-sm-regular text-text-secondary">
        {chosen ? `Chosen: ${chosen}` : 'Nothing chosen'}
      </p>
      <button type="button" className="text-body-sm-regular text-text-primary">
        Next field
      </button>
    </div>
  );
}

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`_Combobox Input`): the searchable select. Type to ' +
          'filter, then pick from the `Select / Menu` it opens (SelectOptions in a Popover, as Select uses). ' +
          '`options` are strings or `{ value, label }`; `value` / `defaultValue` and `onValueChange` hold the choice ' +
          '(`null` for none); with a `name`, the chosen value is submitted. Default shows the `placeholder`, Filled ' +
          'the chosen label, Focus is `:focus`, Open is the list showing (`aria-expanded`), Error is `aria-invalid` ' +
          'and Disabled is `disabled`. It is the WAI-ARIA editable combobox with list autocomplete: focus stays in ' +
          'the input, which points at the option the keys are on with `aria-activedescendant`. Typing filters and ' +
          'puts the keys on the first match; a click, ↓ or ↑ open the full list; ↓ / ↑ move; Enter chooses; Escape ' +
          'closes (and puts the chosen label back), then clears; Tab or a click outside closes, choosing an exact ' +
          'match. No match shows “No results” (`emptyText`).',
      },
    },
  },
  args: { options: COUNTRIES, 'aria-label': 'Location', placeholder: PLACEHOLDER, onValueChange: fn() },
  argTypes: {
    options: { control: false },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
  render: (args) => <Example {...args} />,
} satisfies Meta<typeof Combobox>;

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

/* The stroke drawn inside the edge (Tailwind's inset-ring), as computed box-shadow text. */
const insetStroke = (colour: string, width: 1 | 2) => `${colour} 0px 0px 0px ${width}px inset`;

const labels = (list: HTMLElement) => within(list).queryAllByRole('option').map((o) => o.textContent);

/** Click to open the full list, click an option to choose it: the list closes and focus stays in the input. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('placeholder', PLACEHOLDER);

    await userEvent.click(input);
    const list = canvas.getByRole('listbox', { name: 'Location' });
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(input).toHaveAttribute('aria-controls', list.id);
    await expect(labels(list)).toEqual(COUNTRIES);
    // Nothing chosen: the keys start on the first option. Focus stays in the input.
    await expect(input).toHaveAttribute('aria-activedescendant', canvas.getByRole('option', { name: 'Philippines' }).id);
    await expect(input).toHaveFocus();
    // A second click in the input keeps the list open.
    await userEvent.click(input);
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('option', { name: 'Romania' }));
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(input).toHaveValue('Romania');
    await expect(input).not.toHaveAttribute('aria-activedescendant');
    await expect(input).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('Romania');
    await expect(canvas.getByTestId('chosen')).toHaveTextContent('Chosen: Romania');

    // It opens on the full list (the chosen label isn't a filter), on the chosen option.
    await userEvent.click(input);
    await expect(labels(canvas.getByRole('listbox'))).toEqual(COUNTRIES);
    const romania = canvas.getByRole('option', { name: 'Romania' });
    await expect(romania).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute('aria-activedescendant', romania.id);

    // A click outside closes it and leaves focus where the click put it.
    await userEvent.click(document.body);
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(input).not.toHaveFocus();
    await expect(input).toHaveValue('Romania');
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
  },
};

/** Typing filters the list (the label contains the text, in any case) and puts the keys on the first match. */
export const Filtering: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await userEvent.type(input, 'UNI');
    const list = canvas.getByRole('listbox', { name: 'Location' });
    await expect(labels(list)).toEqual(['United States', 'United Kingdom']);
    await expect(input).toHaveAttribute('aria-activedescendant', canvas.getByRole('option', { name: 'United States' }).id);
    // More text, fewer options; "king" matches inside the label.
    await userEvent.clear(input);
    await userEvent.type(input, 'king');
    await expect(labels(canvas.getByRole('listbox'))).toEqual(['United Kingdom']);
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('United Kingdom');
    await expect(args.onValueChange).toHaveBeenCalledWith('United Kingdom');
    // Typing over a choice filters again; the chosen option keeps its check while it matches.
    await userEvent.type(input, '{Backspace>3/}');
    await expect(input).toHaveValue('United King');
    await expect(canvas.getByRole('option', { name: 'United Kingdom' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Escape}');
    await expect(input).toHaveValue('United Kingdom');
  },
};

/* ── The keyboard ──────────────────────────────────────────────────────── */

/** The editable combobox with list autocomplete, end to end. Focus never leaves the input. */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    const option = (name: string) => canvas.getByRole('option', { name });
    /* The option the keys are on: aria-activedescendant, with the focus ring. */
    const onOption = async (name: string) => {
      await expect(input).toHaveAttribute('aria-expanded', 'true');
      await expect(input).toHaveAttribute('aria-activedescendant', option(name).id);
      await expect(option(name)).toHaveAttribute('data-focus-visible');
      await expect(canvasElement.querySelectorAll('[data-active]')).toHaveLength(1);
      await expect(input).toHaveFocus();
    };
    const closedOn = async (value: string) => {
      await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
      await expect(input).toHaveAttribute('aria-expanded', 'false');
      await expect(input).not.toHaveAttribute('aria-activedescendant');
      await expect(input).toHaveValue(value);
    };
    input.focus();

    // ↓ opens on the first option, as nothing is chosen.
    await userEvent.keyboard('{ArrowDown}');
    await onOption('Philippines');
    // ↓ / ↑ move and stop at the ends.
    await userEvent.keyboard('{ArrowDown}');
    await onOption('United States');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await onOption('Philippines');
    await userEvent.keyboard('{ArrowDown>6/}');
    await onOption('Hungary');
    // Enter chooses and closes.
    await userEvent.keyboard('{ArrowUp}{Enter}');
    await closedOn('Romania');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('Romania');
    // Closed, Enter doesn't open the list (it is the form's).
    await userEvent.keyboard('{Enter}');
    await closedOn('Romania');

    // ↑ opens on the chosen option, which is selected.
    await userEvent.keyboard('{ArrowUp}');
    await onOption('Romania');
    await expect(option('Romania')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Escape}');
    await closedOn('Romania');

    // Typing opens the list, filtered, on the first match; ↓ moves within the matches.
    await userEvent.clear(input);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    // Emptied, no option is active, so Enter wouldn't take the first one.
    await expect(input).not.toHaveAttribute('aria-activedescendant');
    await userEvent.keyboard('uni');
    await onOption('United States');
    await expect(labels(canvas.getByRole('listbox'))).toEqual(['United States', 'United Kingdom']);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await onOption('United Kingdom');
    await userEvent.keyboard('{Enter}');
    await closedOn('United Kingdom');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('United Kingdom');

    // Escape closes and puts the chosen label back; pressed again, it clears the choice.
    await userEvent.clear(input);
    await userEvent.keyboard('rom');
    await onOption('Romania');
    await userEvent.keyboard('{Escape}');
    await closedOn('United Kingdom');
    await userEvent.keyboard('{Escape}');
    await closedOn('');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await expect(canvas.getByTestId('chosen')).toHaveTextContent('Nothing chosen');

    // Tab closes and moves on. The text is exactly an option's label (any case), so it is chosen.
    await userEvent.keyboard('hungary');
    await onOption('Hungary');
    await userEvent.keyboard('{Tab}');
    await closedOn('Hungary');
    await expect(canvas.getByRole('button', { name: 'Next field' })).toHaveFocus();
    await expect(canvas.getByTestId('chosen')).toHaveTextContent('Chosen: Hungary');

    // Tab away from text that isn't an option: the chosen label comes back.
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.keyboard('hun');
    await userEvent.keyboard('{Tab}');
    await closedOn('Hungary');
    await expect(args.onValueChange).toHaveBeenCalledTimes(4);
  },
};

/** Nothing matches: the list says “No results” (`emptyText`), and the status announces it. Enter chooses nothing. */
export const NoResults: Story = {
  args: { defaultValue: 'Romania' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await userEvent.clear(input);
    await userEvent.type(input, 'zz');
    const list = canvas.getByRole('listbox', { name: 'Location' });
    await expect(within(list).queryAllByRole('option')).toHaveLength(0);
    await expect(list).toHaveTextContent('No results');
    await expect(input).not.toHaveAttribute('aria-activedescendant');
    await expect(canvas.getByRole('status')).toHaveTextContent('No results');
    // ↓ has nowhere to go; Enter closes, and the chosen label comes back.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(input).toHaveValue('Romania');
    await expect(canvas.getByRole('status')).toBeEmptyDOMElement();
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

/** Values apart from labels: `onValueChange` gets the value, the input shows the label. */
export const Values: Story = {
  args: { options: LOCATIONS, defaultValue: 'RO' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await expect(input).toHaveValue('Romania');
    await userEvent.click(input);
    await userEvent.click(canvas.getByRole('option', { name: 'Hungary' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('HU');
    await expect(input).toHaveValue('Hungary');
  },
};

function ControlledLocation() {
  const [location, setLocation] = useState<string | null>('PH');
  return (
    <div className="flex w-96 flex-col items-start gap-3 pb-64">
      <Combobox aria-label="Location" options={LOCATIONS} value={location} onValueChange={setLocation} placeholder={PLACEHOLDER} />
      <p data-testid="stored" className="text-body-sm-regular text-text-secondary">
        Stored: {location ?? 'none'}
      </p>
      <button type="button" className="text-body-sm-regular text-text-primary" onClick={() => setLocation('US')}>
        Use the office address
      </button>
    </div>
  );
}

/** Controlled (`value` + `onValueChange`): the input follows the value, whoever sets it. */
export const Controlled: Story = {
  render: () => <ControlledLocation />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await expect(input).toHaveValue('Philippines');
    await userEvent.click(canvas.getByRole('button', { name: 'Use the office address' }));
    await expect(input).toHaveValue('United States');
    await expect(canvas.getByTestId('stored')).toHaveTextContent('Stored: US');
    await userEvent.type(input, '{Escape}{Escape}');
    await expect(input).toHaveValue('');
    await expect(canvas.getByTestId('stored')).toHaveTextContent('Stored: none');
  },
};

/** Disabled (State=Disabled): it can't be focused, and doesn't open. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Hungary' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue('Hungary');
    await userEvent.click(input, { pointerEventsCheck: 0 });
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await userEvent.tab();
    await expect(input).not.toHaveFocus();
  },
};

/** A long list scrolls past 256px; the keys keep the option they're on in view. */
export const LongList: Story = {
  args: { options: CURRENCIES, 'aria-label': 'Currency', placeholder: 'Select or type a currency' },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Currency' });
    const inView = (name: string) => {
      const box = canvas.getByRole('option', { name }).getBoundingClientRect();
      const frame = canvas.getByRole('listbox').getBoundingClientRect();
      return box.top >= frame.top && box.bottom <= frame.bottom;
    };
    input.focus();
    // ↑ opens on the last option, as nothing is chosen.
    await userEvent.keyboard('{ArrowUp}');
    const list = canvas.getByRole('listbox', { name: 'Currency' });
    await expect(list.getBoundingClientRect().height).toBeCloseTo(256, 1);
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    await waitFor(() => expect(inView('USD')).toBe(true));
    await userEvent.keyboard('{ArrowUp>10/}');
    await waitFor(() => expect(inView('GBP')).toBe(true));
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('GBP');
  },
};

/** Error while open: the critical stroke stays, at Open's 2px width. */
export const ErrorOpen: Story = {
  name: 'Error, open',
  args: { 'aria-invalid': true, defaultOpen: true },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Location' });
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(getComputedStyle(input).boxShadow).toContain(
      insetStroke(tokenColour('accent-critical-outline-border-default'), 2),
    );
  },
};

/* ── Every State, in Light and Dark ────────────────────────────────────────
   The six states of the Figma component set. Focus is forced with
   storybook-addon-pseudo-states, and each cell is checked against the
   variables Figma binds in that state: fill, stroke colour and width, the
   value or placeholder colour, both icons (text.subtle, 20px, 12px from the
   edge), the 40px text inset and the height. */

const STATES = [
  { state: 'Default', props: {}, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Filled', props: { defaultValue: 'Philippines' }, text: 'text-primary', stroke: ['stroke-subtle', 1] },
  { state: 'Focus', props: { defaultValue: 'Philippines' }, text: 'text-primary', stroke: ['stroke-focused', 2] },
  {
    state: 'Error',
    props: { defaultValue: 'Philippines', 'aria-invalid': true },
    text: 'text-primary',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  { state: 'Disabled', props: { disabled: true }, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  // Last, so its list opens over nothing.
  { state: 'Open', props: { defaultOpen: true }, text: 'text-subtle', stroke: ['stroke-focused', 2] },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex w-96 flex-col gap-4 pb-64">
      {STATES.map(({ state, props }) => (
        <div key={state} className="flex flex-col gap-2" data-cell={state}>
          <span className="text-caption-md-medium text-text-secondary">{state}</span>
          <Combobox
            {...props}
            options={COUNTRIES}
            aria-label={`${state} location`}
            placeholder={PLACEHOLDER}
            data-pseudo={state === 'Focus' ? 'focus' : undefined}
          />
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', focus: ['[data-pseudo="focus"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Focus on
  // STORY_RENDERED, which comes after play.
  afterEach: async ({ canvasElement }) => {
    const fill = tokenColour('surface-elevated-secondary');
    const icon = tokenColour('text-subtle');
    const want = STATES.map(({ state, props, text, stroke: [token, width] }) => ({
      state,
      filled: 'defaultValue' in props,
      text: tokenColour(text),
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, filled, text, stroke } of want) {
          const cell = canvasElement.querySelector<HTMLElement>(`[data-cell="${state}"]`)!;
          const input = cell.querySelector<HTMLInputElement>('[role="combobox"]')!;
          const style = getComputedStyle(input);
          expect(style.backgroundColor).toBe(fill);
          expect(style.boxShadow).toContain(stroke);
          // The text a cell shows: its value, or else its placeholder.
          expect(filled ? style.color : getComputedStyle(input, '::placeholder').color).toBe(text);
          const box = input.getBoundingClientRect();
          expect(box.height).toBe(40);
          // 12px side + 20px icon + 8px gap before the text, on both sides.
          expect(style.paddingLeft).toBe('40px');
          expect(style.paddingRight).toBe('40px');
          // Icon / Search and Icon / Caret: text.subtle, 20px, 12px in from each edge, centred.
          const [search, caret] = cell.querySelectorAll('svg');
          for (const svg of [search, caret]) {
            const b = svg.getBoundingClientRect();
            expect(getComputedStyle(svg).color).toBe(icon);
            expect(b.width).toBe(20);
            expect(b.top - box.top).toBe(10);
          }
          expect(search.getBoundingClientRect().left - box.left).toBe(12);
          expect(box.right - caret.getBoundingClientRect().right).toBe(12);
          expect(input.getAttribute('aria-expanded')).toBe(String(state === 'Open'));
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');

/* ── The open list, in Light and Dark ─────────────────────────────────────
   Figma's Select / Menu under the input: the full list with Philippines
   chosen, then filtered by typing, then with no match. Checked against the
   bindings and the list's place under the input. */

const open = (theme: 'light' | 'dark'): Story => ({
  name: `Open — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { defaultOpen: true, defaultValue: 'Philippines' },
  globals: { theme },
  parameters: { controls: { disable: true } },
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
    const input = canvas.getByRole('combobox', { name: 'Location' });
    const list = canvas.getByRole('listbox', { name: 'Location' });
    const options = within(list).getAllByRole('option');
    await expect(labels(list)).toEqual(COUNTRIES);
    // State=Open on the input: Focus's 2px stroke.focused stroke, without focus.
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(input).not.toHaveFocus();
    await expect(getComputedStyle(input).boxShadow).toContain(insetStroke(want.focused, 2));
    await expect(getComputedStyle(input).color).toBe(want.label);
    // defaultOpen isn't the keyboard: no focus ring on the active option.
    await expect(canvasElement.querySelector('[data-focus-visible]')).toBeNull();

    // Select / Menu: surface.neutral.faint, a 1px stroke.subtle stroke inside, radius 8, 6 padding.
    const style = getComputedStyle(list);
    await expect(style.backgroundColor).toBe(want.fill);
    await expect(style.boxShadow).toContain(insetStroke(want.stroke, 1));
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
    }
    for (const o of options) await expect(getComputedStyle(o).color).toBe(want.label);

    // Under the input, space.4 away, flush left, as wide as the input.
    const t = input.getBoundingClientRect();
    const box = list.getBoundingClientRect();
    await expect(box.top - t.bottom).toBeCloseTo(4, 1);
    await expect(box.left).toBeCloseTo(t.left, 1);
    await expect(box.width).toBeCloseTo(t.width, 1);
  },
});

export const OpenLight = open('light');
export const OpenDark = open('dark');

const filtered = (theme: 'light' | 'dark'): Story => ({
  name: `Filtered — ${theme === 'light' ? 'Light' : 'Dark'}`,
  globals: { theme },
  parameters: { controls: { disable: true } },
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      active: tokenColour('surface-base'),
      focused: tokenColour('stroke-focused'),
      typed: tokenColour('text-primary'),
    };
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await userEvent.type(input, 'uni');
    const [first, second] = within(canvas.getByRole('listbox', { name: 'Location' })).getAllByRole('option');
    await expect(labels(canvas.getByRole('listbox'))).toEqual(['United States', 'United Kingdom']);
    // Focus (typing): the typed text in text.primary, Focus's 2px stroke.
    await expect(input).toHaveFocus();
    await expect(getComputedStyle(input).color).toBe(want.typed);
    await expect(getComputedStyle(input).boxShadow).toContain(insetStroke(want.focused, 2));
    // The first match is active: Hover's surface.base fill (it fades in) and the 2px stroke.focused ring.
    await expect(input).toHaveAttribute('aria-activedescendant', first.id);
    await waitFor(() => expect(getComputedStyle(first).backgroundColor).toBe(want.active));
    await expect(getComputedStyle(first).outlineColor).toBe(want.focused);
    await expect(getComputedStyle(first).outlineWidth).toBe('2px');
    await expect(getComputedStyle(second).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  },
});

export const FilteredLight = filtered('light');
export const FilteredDark = filtered('dark');

const empty = (theme: 'light' | 'dark'): Story => ({
  name: `No results — ${theme === 'light' ? 'Light' : 'Dark'}`,
  globals: { theme },
  parameters: { controls: { disable: true } },
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const subtle = tokenColour('text-subtle');
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await userEvent.type(input, 'Paris');
    const list = canvas.getByRole('listbox', { name: 'Location' });
    const row = within(list).getByText('No results');
    // In an option's place: 8 / 12 padding, Body/sm-regular, text.subtle (as the placeholder).
    const style = getComputedStyle(row);
    await expect(style.color).toBe(subtle);
    await expect(style.fontSize).toBe('14px');
    await expect(style.padding).toBe('8px 12px');
    await expect(canvas.getByRole('status')).toHaveTextContent('No results');
  },
});

export const NoResultsLight = empty('light');
export const NoResultsDark = empty('dark');
