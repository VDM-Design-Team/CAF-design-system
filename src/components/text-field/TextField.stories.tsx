import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { TextField, type TextFieldProps } from './TextField';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Form / Field – Text`): a `_Form Label` over a ' +
          '`_Text Input`, with the Helper under it. It is FormField around a TextInput. `label` and `required` are ' +
          'the label’s; `helper` is Show Helper + Helper; `error` is the input’s State=Error with its message in the ' +
          'Helper. Every other prop, and the ref, go to the native `<input>`: `name`, `type`, `value` / ' +
          '`defaultValue` / `onChange`. `className` styles the field.',
      },
    },
  },
  args: { label: 'Applicant name', placeholder: 'Placeholder', name: 'applicantName', onChange: fn() },
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    helper: { control: 'text' },
    error: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

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

/** Uncontrolled: typing fills it (Default → Filled). The label names it; clicking the label focuses it. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Applicant name' });
    await userEvent.click(canvas.getByText('Applicant name'));
    await expect(input).toHaveFocus();
    await userEvent.type(input, 'QA Test');
    await expect(input).toHaveValue('QA Test');
    await expect(args.onChange).toHaveBeenCalled();
  },
};

function ControlledEmail(props: Partial<TextFieldProps>) {
  const [email, setEmail] = useState('maria.santos@');
  const invalid = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return (
    <TextField
      label="Email"
      type="email"
      required
      value={email}
      onChange={(event) => {
        props.onChange?.(event);
        setEmail(event.target.value);
      }}
      error={invalid ? 'Enter a valid email address, like name@company.com.' : undefined}
    />
  );
}

/** Controlled (`value` + `onChange`), with the error message from Figma’s Feedback messages pattern while the address is incomplete. */
export const Controlled: Story = {
  render: (args) => <ControlledEmail onChange={args.onChange} />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Email' });
    await expect(input).toBeRequired();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Enter a valid email address, like name@company.com.');
    await userEvent.type(input, 'geekee.com');
    await expect(input).toHaveValue('maria.santos@geekee.com');
    await expect(input).not.toHaveAttribute('aria-invalid');
    await expect(input).not.toHaveAccessibleDescription();
  },
};

/** Error with its message (Figma: “Add Cost Center – Errors”). Focused, the input keeps the error stroke at 2px. */
export const ErrorState: Story = {
  name: 'Error',
  args: { label: 'Location', required: true, placeholder: 'e.g. Philippines', error: 'Location is required.' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Location' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Location is required.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await userEvent.click(input);
    await waitFor(() => expect(getComputedStyle(input).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/** Disabled: it can’t be focused or typed into, and a disabled input isn’t submitted. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'QA Test' },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Applicant name' });
    await expect(input).toBeDisabled();
    await userEvent.type(input, 'more');
    await expect(input).toHaveValue('QA Test');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/* ── A real form ───────────────────────────────────────────────────────────
   The fields of Form / New Cost's first section, submitted with FormData. */

function NewCostForm() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <TextField label="Applicant name" name="applicantName" required autoComplete="name" />
      <TextField label="Email" name="email" type="email" required autoComplete="email" />
      <TextField label="Invoice number" name="invoiceNumber" helper="Optional." />
      <TextField label="Swift code" name="swiftCode" defaultValue="BTRLRO22" disabled />
      <Button type="submit">Submit</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/**
 * The fields submit with the form: each `name` reaches its native input, so FormData picks the values up.
 * A `required` field left empty stops the submit (the browser’s own check), and a disabled one isn’t sent.
 */
export const SubmitsWithForm: Story = {
  render: () => <NewCostForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByRole('textbox', { name: 'Applicant name' });
    const email = canvas.getByRole('textbox', { name: 'Email' });
    const submit = canvas.getByRole('button', { name: 'Submit' });
    const output = canvas.getByTestId('submitted');

    // Empty required fields: the browser stops the submit and focuses the first one.
    await userEvent.click(submit);
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(name).toBeInvalid();
    await expect(name).toHaveFocus();

    await userEvent.type(name, 'QA Test');
    await userEvent.type(email, 'kynatest6@gmail.com');
    await userEvent.type(canvas.getByRole('textbox', { name: 'Invoice number' }), 'INV-2026-0918');
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({
      applicantName: 'QA Test',
      email: 'kynatest6@gmail.com',
      invoiceNumber: 'INV-2026-0918',
    });
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   The field as Figma places it: the label row, the _Text Input in each of its
   States, and the Helper. Focus is forced with storybook-addon-pseudo-states. */

const STATES = [
  { state: 'Default', props: {}, value: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Filled', props: { defaultValue: 'QA Test' }, value: 'text-primary', stroke: ['stroke-subtle', 1] },
  { state: 'Focus', props: { defaultValue: 'QA Test' }, value: 'text-primary', stroke: ['stroke-focused', 2] },
  {
    state: 'Error',
    props: { required: true, error: 'Location is required.' },
    value: 'text-subtle',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  {
    state: 'Disabled',
    props: { disabled: true, defaultValue: 'QA Test' },
    value: 'text-subtle',
    stroke: ['stroke-subtle', 1],
  },
  { state: 'Required', props: { required: true }, value: 'text-subtle', stroke: ['stroke-subtle', 1] },
  {
    state: 'Helper',
    props: { helper: 'As it appears on the invoice.' },
    value: 'text-subtle',
    stroke: ['stroke-subtle', 1],
  },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-3">
      {STATES.map(({ state, props }) => (
        <TextField
          key={state}
          {...props}
          label={`${state} field`}
          placeholder="Placeholder"
          data-state={state}
          data-pseudo={state === 'Focus' ? 'focus' : undefined}
        />
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
    const want = STATES.map(({ state, props, value, stroke: [token, width] }) => ({
      state,
      filled: 'defaultValue' in props,
      required: 'required' in props,
      message: 'error' in props || 'helper' in props,
      value: tokenColour(value),
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, filled, required, message, value, stroke } of want) {
          const input = canvasElement.querySelector<HTMLInputElement>(`input[data-state="${state}"]`)!;
          const field = input.parentElement!;
          const labelNode = field.querySelector('label')!;
          // The label: Body/sm-regular, text.secondary; the marker when Required.
          expect(getComputedStyle(labelNode).color).toBe(label);
          expect(getComputedStyle(labelNode).fontSize).toBe('14px');
          const star = labelNode.querySelector('[aria-hidden]');
          if (required) expect(getComputedStyle(star!).color).toBe(marker);
          else expect(star).toBeNull();
          // The label row's 20px under the label, then the input.
          expect(input.getBoundingClientRect().top - labelNode.getBoundingClientRect().bottom).toBe(20);
          // The input: the _Text Input bindings for this state.
          const style = getComputedStyle(input);
          expect(style.backgroundColor).toBe(fill);
          expect(style.boxShadow).toContain(stroke);
          expect(filled ? style.color : getComputedStyle(input, '::placeholder').color).toBe(value);
          expect(input.getBoundingClientRect().height).toBe(40);
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
