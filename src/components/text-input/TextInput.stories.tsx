import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FormLabel } from '../form-label';
import { TextInput } from './TextInput';

const meta = {
  title: 'Components/TextInput',
  component: TextInput,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`_Text Input`): the single-line field that forms and filters share. ' +
          'It is a native `<input>`, so Figma’s States are its own: Default is empty with a `placeholder`, Filled has a value, ' +
          'Focus is `:focus`, Error is `aria-invalid`, Disabled is `disabled`. It fills its container’s width. ' +
          'Name it with a `<label htmlFor>` or `aria-label`.',
      },
    },
  },
  args: { 'aria-label': 'Account name', placeholder: 'Placeholder', onChange: fn() },
  argTypes: {
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Typing fills it: Default → Filled. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Account name' });
    await userEvent.type(input, 'Acme Ltd');
    await expect(input).toHaveValue('Acme Ltd');
    await expect(input).toHaveFocus();
    await expect(args.onChange).toHaveBeenCalled();
  },
};

/** A label above it (FormLabel, Figma's `_Form Label`), as Form / Field – Text does; TextField does the wiring for you. Clicking the label focuses the field. */
export const WithLabel: Story = {
  args: { 'aria-label': undefined, id: 'cost-reference' },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <FormLabel htmlFor="cost-reference">Cost reference</FormLabel>
      <TextInput {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Cost reference'));
    await expect(canvas.getByRole('textbox', { name: 'Cost reference' })).toHaveFocus();
  },
};

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

/** State=Error: `aria-invalid`, described by its message. Focused, it keeps the error colour at Focus's 2px. */
export const ErrorState: Story = {
  name: 'Error',
  args: { defaultValue: 'ACME-0042', 'aria-invalid': true, 'aria-describedby': 'reference-error' },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <TextInput {...args} />
      <p id="reference-error" className="text-body-sm-regular text-accent-critical-outline-content-default">
        This reference is already in use.
      </p>
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Account name' });
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription('This reference is already in use.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await expect(getComputedStyle(input).boxShadow).toContain(insetStroke(critical, 1));
    await userEvent.click(input);
    await waitFor(() => expect(getComputedStyle(input).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/** State=Disabled: it can't be focused or typed into, and a value shows in text.subtle, like the placeholder. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Acme Ltd' },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Account name' });
    await expect(input).toBeDisabled();
    await userEvent.type(input, 'more');
    await expect(input).toHaveValue('Acme Ltd');
    await expect(input).not.toHaveFocus();
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(getComputedStyle(input).color).toBe(tokenColour('text-subtle'));
  },
};

/* ── Every State, in Light and Dark ────────────────────────────────────────
   The same five states as the Figma component set. Focus is forced with
   storybook-addon-pseudo-states, and each cell is checked against the
   variables Figma binds in that state. */

const STATES = [
  { state: 'Default', props: {}, value: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Filled', props: { defaultValue: 'Acme Ltd' }, value: 'text-primary', stroke: ['stroke-subtle', 1] },
  { state: 'Focus', props: { defaultValue: 'Acme Ltd' }, value: 'text-primary', stroke: ['stroke-focused', 2] },
  {
    state: 'Error',
    props: { defaultValue: 'Acme Ltd', 'aria-invalid': true },
    value: 'text-primary',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  { state: 'Disabled', props: { disabled: true }, value: 'text-subtle', stroke: ['stroke-subtle', 1] },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {STATES.map(({ state, props }) => (
        <div key={state} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">{state}</span>
          <TextInput
            {...props}
            aria-label={`${state} field`}
            placeholder="Placeholder"
            data-state={state}
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
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const fill = tokenColour('surface-elevated-secondary');
    const want = STATES.map(({ state, props, value, stroke: [token, width] }) => ({
      state,
      filled: 'defaultValue' in props,
      value: tokenColour(value),
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, filled, value, stroke } of want) {
          const input = canvasElement.querySelector<HTMLInputElement>(`[data-state="${state}"]`)!;
          const style = getComputedStyle(input);
          expect(style.backgroundColor).toBe(fill);
          expect(style.boxShadow).toContain(stroke);
          // The text a cell shows: its value, or else its placeholder.
          expect(filled ? style.color : getComputedStyle(input, '::placeholder').color).toBe(value);
          expect(input.getBoundingClientRect().height).toBe(40);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
