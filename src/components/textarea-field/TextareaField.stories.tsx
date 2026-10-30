import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { SelectField } from '../select-field';
import { TextareaField, type TextareaFieldProps } from './TextareaField';

const meta = {
  title: 'Components/TextareaField',
  component: TextareaField,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Form / Field – Textarea`): a `_Form Label` over a ' +
          '`_Textarea`, with the Helper under it. It is FormField around a Textarea. `label` and `required` are the ' +
          'label’s; `helper` is Show Helper + Helper; `error` is the textarea’s State=Error with its message in the ' +
          'Helper. Every other prop, and the ref, go to the native `<textarea>`: `name`, `rows`, `value` / ' +
          '`defaultValue` / `onChange`, `maxLength`. `className` styles the field.',
      },
    },
  },
  args: {
    label: 'Notes',
    placeholder: 'Add notes…',
    name: 'notes',
    onChange: fn(),
  },
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    helper: { control: 'text' },
    error: { control: 'text' },
    rows: { control: { type: 'number', min: 2, max: 12 } },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextareaField>;

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
    const textarea = canvas.getByRole('textbox', { name: 'Notes' });
    await userEvent.click(canvas.getByText('Notes'));
    await expect(textarea).toHaveFocus();
    await userEvent.type(textarea, 'Monthly team salary, split by cost center.');
    await expect(textarea).toHaveValue('Monthly team salary, split by cost center.');
    await expect(args.onChange).toHaveBeenCalled();
  },
};

const LIMIT = 120;

function ControlledReason(props: Partial<TextareaFieldProps>) {
  const [reason, setReason] = useState('');
  const left = LIMIT - reason.length;
  return (
    <TextareaField
      label="Reason (optional)"
      placeholder="Add a note for the applicants…"
      maxLength={LIMIT}
      value={reason}
      onChange={(event) => {
        props.onChange?.(event);
        setReason(event.target.value);
      }}
      helper={`${left} characters left.`}
    />
  );
}

/** Controlled (`value` + `onChange`), with the Helper counting what's left of `maxLength`. The count is the textarea's description. */
export const Controlled: Story = {
  render: (args) => <ControlledReason onChange={args.onChange} />,
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Reason (optional)' });
    await expect(textarea).not.toBeRequired();
    await expect(textarea).toHaveAccessibleDescription('120 characters left.');
    await userEvent.type(textarea, 'Missing invoice.');
    await expect(textarea).toHaveValue('Missing invoice.');
    await expect(textarea).toHaveAccessibleDescription('104 characters left.');
    await expect(textarea).toHaveAttribute('maxlength', '120');
  },
};

/** Error with its message. Focused, the textarea keeps the error stroke at 2px. */
export const ErrorState: Story = {
  name: 'Error',
  args: {
    label: 'Reason',
    required: true,
    placeholder: 'Add a note for the applicants…',
    error: 'Add a reason for the rejection.',
  },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Reason' });
    await expect(textarea).toBeRequired();
    await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    await expect(textarea).toHaveAccessibleDescription('Add a reason for the rejection.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await userEvent.click(textarea);
    await waitFor(() => expect(getComputedStyle(textarea).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/** Disabled: it can’t be focused or typed into, and a disabled textarea isn’t submitted. */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Monthly team salary, split by cost center.',
  },
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Notes' });
    await expect(textarea).toBeDisabled();
    await userEvent.type(textarea, 'more');
    await expect(textarea).toHaveValue('Monthly team salary, split by cost center.');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/* ── A real form ───────────────────────────────────────────────────────────
   Figma's Change Status modal (Patterns – Admin): a new status and a reason,
   submitted with FormData. */

function ChangeStatusForm() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <SelectField label="New status" name="status" options={['Approved', 'Rejected']} defaultValue="Rejected" />
      <TextareaField label="Reason" name="reason" required placeholder="Add a note for the applicants…" />
      <TextareaField label="Internal notes" name="internalNotes" defaultValue="Checked by finance." disabled />
      <Button type="submit">Save</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/**
 * The textarea submits with the form: its `name` reaches the native `<textarea>`, so FormData picks the
 * value up, line breaks included. A `required` one left empty stops the submit (the browser’s own check),
 * and a disabled one isn’t sent.
 */
export const SubmitsWithForm: Story = {
  render: () => <ChangeStatusForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reason = canvas.getByRole('textbox', { name: 'Reason' });
    const submit = canvas.getByRole('button', { name: 'Save' });
    const output = canvas.getByTestId('submitted');

    // Empty and required: the browser stops the submit and focuses it.
    await userEvent.click(submit);
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(reason).toBeInvalid();
    await expect(reason).toHaveFocus();

    await userEvent.type(reason, 'The invoice is missing.{Enter}Please upload it again.');
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    const data = JSON.parse(output.textContent!);
    // Line breaks are kept (a form normalises them to CRLF when it encodes the request).
    await expect({
      ...data,
      reason: data.reason.replace(/\r\n/g, '\n'),
    }).toEqual({
      status: 'Rejected',
      reason: 'The invoice is missing.\nPlease upload it again.',
    });
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   The field as Figma places it: the label row, the _Textarea in each of its
   States, and the Helper. Focus is forced with storybook-addon-pseudo-states. */

const NOTE = 'Monthly team salary, split by cost center.';

const STATES = [
  {
    state: 'Default',
    props: {},
    value: 'text-subtle',
    stroke: ['stroke-subtle', 1],
  },
  {
    state: 'Filled',
    props: { defaultValue: NOTE },
    value: 'text-primary',
    stroke: ['stroke-subtle', 1],
  },
  {
    state: 'Focus',
    props: { defaultValue: NOTE },
    value: 'text-primary',
    stroke: ['stroke-focused', 2],
  },
  {
    state: 'Error',
    props: { required: true, error: 'Add a reason for the rejection.' },
    value: 'text-subtle',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  {
    state: 'Disabled',
    props: { disabled: true, defaultValue: NOTE },
    value: 'text-subtle',
    stroke: ['stroke-subtle', 1],
  },
  {
    state: 'Required',
    props: { required: true },
    value: 'text-subtle',
    stroke: ['stroke-subtle', 1],
  },
  {
    state: 'Helper',
    props: { helper: 'Only the finance team sees this.' },
    value: 'text-subtle',
    stroke: ['stroke-subtle', 1],
  },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-3">
      {STATES.map(({ state, props }) => (
        <TextareaField
          key={state}
          {...props}
          label={`${state} field`}
          placeholder="Add notes…"
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
          const textarea = canvasElement.querySelector<HTMLTextAreaElement>(`textarea[data-state="${state}"]`)!;
          const field = textarea.parentElement!;
          const labelNode = field.querySelector('label')!;
          // The label: Body/sm-regular, text.secondary; the marker when Required.
          expect(getComputedStyle(labelNode).color).toBe(label);
          expect(getComputedStyle(labelNode).fontSize).toBe('14px');
          const star = labelNode.querySelector('[aria-hidden]');
          if (required) expect(getComputedStyle(star!).color).toBe(marker);
          else expect(star).toBeNull();
          // The label row's 20px under the label, then the textarea.
          expect(textarea.getBoundingClientRect().top - labelNode.getBoundingClientRect().bottom).toBe(20);
          // The textarea: the _Textarea bindings for this state, 96px high.
          const style = getComputedStyle(textarea);
          expect(style.backgroundColor).toBe(fill);
          // Disabled: the whole field at Figma's 50% layer opacity.
          expect(style.opacity).toBe(state === 'Disabled' ? '0.5' : '1');
          expect(style.boxShadow).toContain(stroke);
          expect(filled ? style.color : getComputedStyle(textarea, '::placeholder').color).toBe(value);
          expect(textarea.getBoundingClientRect().height).toBe(96);
          // The Helper (or the error in its place): Caption/md-regular, text.subtle, right under the textarea.
          const note = field.querySelector('p');
          if (!message) {
            expect(note).toBeNull();
            continue;
          }
          expect(getComputedStyle(note!).color).toBe(helper);
          expect(getComputedStyle(note!).fontSize).toBe('12px');
          expect(note!.getBoundingClientRect().top).toBe(textarea.getBoundingClientRect().bottom);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
