import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { FormEditLink } from '../form-edit-link';
import { TextField } from '../text-field';
import { SelectField } from './SelectField';

/* Real options from Form / New Cost and the admin modals. */
const PAYMENT_METHODS = ['Wiretransfer', 'Card', 'Cash'];
const CURRENCIES = ['EUR', 'USD', 'PHP', 'RON', 'HUF'];
const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const meta = {
  title: 'Components/SelectField',
  component: SelectField,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Form / Field – Dropdown` and `Form / Field – Dropdown ' +
          'with Edit`): a `_Form Label` over a `_Dropdown Input`, with the Helper under it. It is FormField around a ' +
          'Select. `label` and `required` are the label’s; `helper` is Show Helper + Helper; `error` is the trigger’s ' +
          'State=Error with its message in the Helper; `action` takes Dropdown with Edit’s `_Edit Link` ' +
          '(FormEditLink). Every other prop, and the ref, go to the Select: `options`, `value` / `defaultValue` / ' +
          '`onValueChange`, `name` (the chosen value is submitted under it). `className` styles the field.',
      },
    },
  },
  args: { label: 'Payment method', options: PAYMENT_METHODS, onValueChange: fn() },
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    helper: { control: 'text' },
    error: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="w-96 pb-48">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectField>;

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

/** The label names the select and its list. Choosing fills it (Default → Filled); clicking the label opens it. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Payment method' });
    await expect(trigger).toHaveTextContent('Select option');
    await userEvent.click(trigger);
    await expect(canvas.getByRole('listbox', { name: 'Payment method' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('option', { name: 'Card' }));
    await expect(trigger).toHaveTextContent('Card');
    await expect(args.onValueChange).toHaveBeenCalledWith('Card');
    await expect(trigger).toHaveFocus();
    // Clicking the label focuses the select and opens it, as a click on the select does.
    await userEvent.click(canvas.getByText('Payment method'));
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole('listbox', { name: 'Payment method' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
  },
};

function CurrencyField() {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <SelectField
        label="Currency"
        options={CURRENCIES}
        defaultValue="EUR"
        action={<FormEditLink onClick={() => setEditing(true)} />}
      />
      <p role="status" className="text-body-sm-regular text-text-secondary">
        {editing ? 'Editing currencies' : ''}
      </p>
    </div>
  );
}

/** Figma’s Form / Field – Dropdown with Edit (Currency, in Form / New Cost): the `_Edit Link` beside the label. */
export const DropdownWithEdit: Story = {
  render: () => <CurrencyField />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edit = canvas.getByRole('button', { name: '[Edit] Currency' });
    const trigger = canvas.getByRole('combobox', { name: 'Currency' });
    await expect(trigger).toHaveTextContent('EUR');
    // The link sits beside the label, not inside it: clicking it doesn't open the select.
    await expect(edit.closest('label')).toBeNull();
    await userEvent.click(edit);
    await expect(canvas.getByRole('status')).toHaveTextContent('Editing currencies');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    // space.8 from the label.
    const label = canvas.getByText('Currency');
    await expect(edit.getBoundingClientRect().left - label.getBoundingClientRect().right).toBe(8);
  },
};

function ControlledFrequency() {
  const [frequency, setFrequency] = useState<string | null>('monthly');
  return (
    <div className="flex flex-col gap-3">
      <SelectField
        label="Frequency"
        required
        options={FREQUENCIES}
        value={frequency}
        onValueChange={setFrequency}
        helper="How often this cost repeats."
      />
      <p role="status" className="text-body-sm-regular text-text-secondary">
        Stored: {frequency}
      </p>
    </div>
  );
}

/** Controlled (`value` + `onValueChange`); the stored value is the option’s `value`, not its label. Keyboard only. */
export const Controlled: Story = {
  render: () => <ControlledFrequency />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await expect(trigger).toHaveAttribute('aria-required', 'true');
    await expect(trigger).toHaveAccessibleDescription('How often this cost repeats.');
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(trigger).toHaveTextContent('Quarterly');
    await expect(canvas.getByRole('status')).toHaveTextContent('Stored: quarterly');
  },
};

/** Error with its message. Focused, the trigger keeps the error stroke at 2px. */
export const ErrorState: Story = {
  name: 'Error',
  args: { label: 'Cost Center', required: true, options: ['IT Expenses'], error: 'Choose a cost center.' },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Cost Center' });
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAccessibleDescription('Choose a cost center.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await userEvent.tab();
    await waitFor(() => expect(getComputedStyle(trigger).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/* ── A real form ───────────────────────────────────────────────────────────
   Figma's Add Cost Center modal: the chosen option's value is submitted under
   the field's name. A required select is checked in the submit handler (the
   browser doesn't check a custom select), and the error shows in the field. */

function AddCostCenterForm() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);
  const [error, setError] = useState<string>();
  const costCenter = useRef<HTMLButtonElement>(null);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        if (!data.costCenter) {
          setError('Choose a cost center.');
          costCenter.current?.focus();
          return;
        }
        setError(undefined);
        setSubmitted(data);
      }}
    >
      <SelectField
        ref={costCenter}
        label="Cost Center"
        name="costCenter"
        required
        placeholder="Select cost center"
        options={[
          { value: 'cc-it', label: 'IT Expenses' },
          { value: 'cc-emp', label: 'Employee Expenses' },
        ]}
        error={error}
      />
      <TextField label="Nature of Service" name="natureOfService" required defaultValue="Software" />
      <SelectField label="Currency" name="currency" options={CURRENCIES} defaultValue="EUR" disabled />
      <Button type="submit">Add Cost Center</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/** The chosen value submits with the form (FormData); a disabled select sends nothing. A required one is checked on submit. */
export const SubmitsWithForm: Story = {
  render: () => <AddCostCenterForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Cost Center' });
    const submit = canvas.getByRole('button', { name: 'Add Cost Center' });
    const output = canvas.getByTestId('submitted');

    // Nothing chosen: the handler shows the error and puts focus on the select.
    await userEvent.click(submit);
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAccessibleDescription('Choose a cost center.');
    await expect(trigger).toHaveFocus();

    // Choose with the keyboard, then submit.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(trigger).toHaveTextContent('Employee Expenses');
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({ costCenter: 'cc-emp', natureOfService: 'Software' });
    await expect(trigger).not.toHaveAttribute('aria-invalid');
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   The field as Figma places it: the label row (with the Edit link for
   Dropdown with Edit), the _Dropdown Input in each of its States, and the
   Helper. Focus is forced with storybook-addon-pseudo-states. */

const STATES = [
  { state: 'Default', props: {}, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Filled', props: { defaultValue: 'Card' }, text: 'text-primary', stroke: ['stroke-subtle', 1] },
  { state: 'Focus', props: { defaultValue: 'Card' }, text: 'text-primary', stroke: ['stroke-focused', 2] },
  {
    state: 'Error',
    props: { required: true, error: 'Choose a payment method.' },
    text: 'text-subtle',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  {
    state: 'Disabled',
    props: { disabled: true, defaultValue: 'Card' },
    text: 'text-subtle',
    stroke: ['stroke-subtle', 1],
  },
  { state: 'Required', props: { required: true }, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Helper', props: { helper: 'Used for every payment.' }, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  {
    state: 'With Edit',
    props: { defaultValue: 'Card', edit: true },
    text: 'text-primary',
    stroke: ['stroke-subtle', 1],
  },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-3">
      {STATES.map(({ state, props }) => {
        const { edit, ...rest } = { edit: false, ...props };
        return (
          <div key={state} data-cell={state}>
            <SelectField
              {...rest}
              label={`${state} field`}
              options={PAYMENT_METHODS}
              action={edit ? <FormEditLink /> : undefined}
              data-state={state}
              data-pseudo={state === 'Focus' ? 'focus-visible' : undefined}
            />
          </div>
        );
      })}
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', focusVisible: ['[data-pseudo="focus-visible"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Focus on
  // STORY_RENDERED, which comes after play.
  afterEach: async ({ canvasElement }) => {
    const label = tokenColour('text-secondary');
    const marker = tokenColour('accent-critical-tonal-content-default');
    const helper = tokenColour('text-subtle');
    const link = tokenColour('text-link-default');
    const fill = tokenColour('surface-elevated-secondary');
    const want = STATES.map(({ state, props, text, stroke: [token, width] }) => ({
      state,
      required: 'required' in props,
      message: 'error' in props || 'helper' in props,
      edit: 'edit' in props,
      text: tokenColour(text),
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, required, message, edit, text, stroke } of want) {
          const field = canvasElement.querySelector<HTMLElement>(`[data-cell="${state}"]`)!;
          const trigger = field.querySelector<HTMLButtonElement>('[role="combobox"]')!;
          const labelNode = field.querySelector('label')!;
          // The label: Body/sm-regular, text.secondary; the marker when Required.
          expect(getComputedStyle(labelNode).color).toBe(label);
          const star = labelNode.querySelector('[aria-hidden]');
          if (required) expect(getComputedStyle(star!).color).toBe(marker);
          else expect(star).toBeNull();
          // Dropdown with Edit: the link, text.link.default.
          const editLink = field.querySelector<HTMLButtonElement>('button:not([role])');
          if (edit) expect(getComputedStyle(editLink!).color).toBe(link);
          else expect(editLink).toBeNull();
          // The label row's 20px under the label, then the trigger.
          expect(trigger.getBoundingClientRect().top - labelNode.getBoundingClientRect().bottom).toBe(20);
          // The trigger: the _Dropdown Input bindings for this state.
          const style = getComputedStyle(trigger);
          expect(style.backgroundColor).toBe(fill);
          expect(style.boxShadow).toContain(stroke);
          expect(getComputedStyle(trigger.querySelector('span')!).color).toBe(text);
          expect(trigger.getBoundingClientRect().height).toBe(40);
          // The Helper (or the error in its place): Caption/md-regular, text.subtle, right under the trigger.
          const note = field.querySelector('p');
          if (!message) {
            expect(note).toBeNull();
            continue;
          }
          expect(getComputedStyle(note!).color).toBe(helper);
          expect(getComputedStyle(note!).fontSize).toBe('12px');
          expect(note!.getBoundingClientRect().top).toBe(trigger.getBoundingClientRect().bottom);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
