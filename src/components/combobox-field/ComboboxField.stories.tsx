import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { TextField } from '../text-field';
import { ComboboxField } from './ComboboxField';

/* Figma's Select / Menu example, the list Form / Field – Combobox opens. */
const COUNTRIES = ['Philippines', 'United States', 'United Kingdom', 'Romania', 'Hungary'];
/* As a form stores them: a code under the label. */
const LOCATIONS = [
  { value: 'PH', label: 'Philippines' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'RO', label: 'Romania' },
  { value: 'HU', label: 'Hungary' },
];
const PLACEHOLDER = 'Select or type a location';

const meta = {
  title: 'Components/ComboboxField',
  component: ComboboxField,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Form / Field – Combobox`; Location in the Cost Breakdown ' +
          'and Multi-section form patterns): a `_Form Label` over a `_Combobox Input`, with the Helper under it. It is ' +
          'FormField around a Combobox. `label` and `required` are the label’s; `helper` is Show Helper + Helper; ' +
          '`error` is the input’s State=Error with its message in the Helper. Every other prop, and the ref, go to ' +
          'the Combobox: `options`, `value` / `defaultValue` / `onValueChange`, `placeholder`, `name` (the chosen ' +
          'value is submitted under it). `required` is the input’s native `required`. `className` styles the field.',
      },
    },
  },
  args: { label: 'Location', options: COUNTRIES, placeholder: PLACEHOLDER, onValueChange: fn() },
  argTypes: {
    options: { control: false },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    helper: { control: 'text' },
    error: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="w-96 pb-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ComboboxField>;

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

/** The label names the input and its list. Typing filters; choosing fills it. Clicking the label opens it. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await expect(input).toHaveValue('');
    await userEvent.type(input, 'rom');
    await expect(canvas.getByRole('listbox', { name: 'Location' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('option', { name: 'Romania' }));
    await expect(input).toHaveValue('Romania');
    await expect(args.onValueChange).toHaveBeenCalledWith('Romania');
    await expect(input).toHaveFocus();
    // Clicking the label focuses the input and opens the list, as a click in the input does.
    input.blur();
    await userEvent.click(canvas.getByText('Location'));
    await expect(input).toHaveFocus();
    await expect(canvas.getByRole('listbox', { name: 'Location' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

/** Required with a helper: the marker, the input's native `required`, and the helper as its description. */
export const RequiredWithHelper: Story = {
  args: { required: true, helper: 'Where the cost is incurred.' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription('Where the cost is incurred.');
    await expect(input).not.toHaveAttribute('aria-invalid');
  },
};

/** Error with its message. Focused, the input keeps the error stroke at 2px. */
export const ErrorState: Story = {
  name: 'Error',
  args: { required: true, error: 'Choose a location.' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Location' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Choose a location.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(input).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/* ── A real form ───────────────────────────────────────────────────────────
   Figma's Cost Breakdown modal (Patterns – Admin): Title, then Location, both
   required. The chosen option's value is submitted under the field's name;
   the typed text never is. The browser checks `required`, because the input
   holds the chosen label whenever the list is closed. */

function CostBreakdownForm() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <TextField label="Title" name="title" required defaultValue="Breakdown 1" />
      <ComboboxField label="Location" name="location" required options={LOCATIONS} placeholder={PLACEHOLDER} />
      <ComboboxField label="Billing entity" name="entity" options={LOCATIONS} defaultValue="PH" disabled />
      <Button type="submit">Save breakdown</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/** The chosen value submits with the form (FormData); a disabled combobox sends nothing. Enter submits once the list is closed. */
export const SubmitsWithForm: Story = {
  render: () => <CostBreakdownForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Location' });
    const form = input.closest('form')!;
    const output = canvas.getByTestId('submitted');

    // Nothing chosen: the browser stops the submit (valueMissing).
    await userEvent.click(canvas.getByRole('button', { name: 'Save breakdown' }));
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(input).toHaveProperty('validity.valueMissing', true);

    // Text that isn't an option doesn't count: leaving the field puts the empty choice back.
    await userEvent.type(input, 'Manila');
    await userEvent.click(document.body);
    await expect(input).toHaveValue('');
    await expect(form.checkValidity()).toBe(false);

    // Choose with the keyboard: type, Enter takes the first match and closes the list.
    await userEvent.type(input, 'hun{Enter}');
    await expect(input).toHaveValue('Hungary');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(form.checkValidity()).toBe(true);

    // With the list closed, Enter is the form's: it submits.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({ title: 'Breakdown 1', location: 'HU' });
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   The field as Figma places it: the label row, the _Combobox Input in each of
   its States, and the Helper. Focus is forced with storybook-addon-pseudo-states. */

const STATES = [
  { state: 'Default', props: {}, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Filled', props: { defaultValue: 'Philippines' }, text: 'text-primary', stroke: ['stroke-subtle', 1] },
  { state: 'Focus', props: { defaultValue: 'Philippines' }, text: 'text-primary', stroke: ['stroke-focused', 2] },
  {
    state: 'Error',
    props: { required: true, error: 'Choose a location.' },
    text: 'text-subtle',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  { state: 'Disabled', props: { disabled: true }, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Required', props: { required: true }, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Helper', props: { helper: 'Where the cost is incurred.' }, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  // Last, so its list opens over nothing.
  { state: 'Open', props: { defaultOpen: true }, text: 'text-subtle', stroke: ['stroke-focused', 2] },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-3">
      {STATES.map(({ state, props }) => (
        <div key={state} data-cell={state}>
          <ComboboxField
            {...props}
            label={`${state} location`}
            options={COUNTRIES}
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
    const label = tokenColour('text-secondary');
    const marker = tokenColour('accent-critical-tonal-content-default');
    const helper = tokenColour('text-subtle');
    const fill = tokenColour('surface-elevated-secondary');
    const want = STATES.map(({ state, props, text, stroke: [token, width] }) => ({
      state,
      filled: 'defaultValue' in props,
      required: 'required' in props,
      message: 'error' in props || 'helper' in props,
      text: tokenColour(text),
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, filled, required, message, text, stroke } of want) {
          const field = canvasElement.querySelector<HTMLElement>(`[data-cell="${state}"]`)!;
          const input = field.querySelector<HTMLInputElement>('[role="combobox"]')!;
          const labelNode = field.querySelector('label')!;
          // The label: Body/sm-regular, text.secondary; the marker when Required.
          expect(getComputedStyle(labelNode).color).toBe(label);
          const star = labelNode.querySelector('[aria-hidden]');
          if (required) expect(getComputedStyle(star!).color).toBe(marker);
          else expect(star).toBeNull();
          expect(input.required).toBe(required);
          // The label row's 20px under the label, then the input.
          expect(input.getBoundingClientRect().top - labelNode.getBoundingClientRect().bottom).toBe(20);
          // The input: the _Combobox Input bindings for this state.
          const style = getComputedStyle(input);
          expect(style.backgroundColor).toBe(fill);
          expect(style.boxShadow).toContain(stroke);
          expect(filled ? style.color : getComputedStyle(input, '::placeholder').color).toBe(text);
          expect(input.getBoundingClientRect().height).toBe(40);
          expect(input.getAttribute('aria-expanded')).toBe(String(state === 'Open'));
          // The Helper (or the error in its place): Caption/md-regular, text.subtle, right under the input.
          const note = field.querySelector('p');
          if (!message) {
            expect(note).toBeNull();
            continue;
          }
          expect(getComputedStyle(note!).color).toBe(helper);
          expect(getComputedStyle(note!).fontSize).toBe('12px');
          expect(note!.getBoundingClientRect().top).toBe(input.getBoundingClientRect().bottom);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
