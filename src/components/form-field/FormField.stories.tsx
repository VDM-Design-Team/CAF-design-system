import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Select } from '../select';
import { TextInput } from '../text-input';
import { FormField } from './FormField';
import { useFormFieldControl, type FormFieldControlProps } from './useFormField';

const meta = {
  title: 'Components/FormField',
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          'The part every **Form / Field – \\*** in the CAF Figma library shares: the `_Form Label` (with Required), ' +
          'the control, and the Helper under it, where an `error` message takes the helper’s place. ' +
          'TextField and SelectField are FormField around a TextInput or a Select. ' +
          'FormField wires the control through a context: a control that calls `useFormFieldControl(props)` ' +
          '(TextInput, SelectTrigger, Select) gets the label’s `htmlFor` as its `id`, the message in ' +
          '`aria-describedby`, `aria-invalid` while there is an `error`, and `required`. Any other control takes ' +
          'the same props from a function child.',
      },
    },
  },
  args: {
    label: 'IBAN account number',
    helper: 'As it appears on the bank statement.',
    children: <TextInput placeholder="Placeholder" />,
  },
  argTypes: { children: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The label names the control and the helper describes it; clicking the label focuses it. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'IBAN account number' });
    await expect(input).toHaveAccessibleDescription('As it appears on the bank statement.');
    await expect(input).not.toBeInvalid();
    await expect(input).not.toBeRequired();
    await userEvent.click(canvas.getByText('IBAN account number'));
    await expect(input).toHaveFocus();
  },
};

/** `error`: the message takes the helper’s place, and the control is `aria-invalid` and described by it. */
export const ErrorMessage: Story = {
  args: { error: 'Enter an IBAN of 15 to 34 letters and digits.', children: <TextInput defaultValue="RO49 AAAA" /> },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'IBAN account number' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Enter an IBAN of 15 to 34 letters and digits.');
    await expect(canvas.queryByText('As it appears on the bank statement.')).not.toBeInTheDocument();
  },
};

/** `required`: the marker, and the control is `required`. A Select, which has no native `required`, gets `aria-required`. */
export const Required: Story = {
  args: { required: true, helper: undefined },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <FormField {...args} />
      <FormField label="Payment method" required>
        <Select options={['Wiretransfer', 'Card', 'Cash']} />
      </FormField>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'IBAN account number' })).toBeRequired();
    const select = canvas.getByRole('combobox', { name: 'Payment method' });
    await expect(select).toHaveAttribute('aria-required', 'true');
    await expect(select).not.toHaveAttribute('required');
  },
};

/** The control’s own props win; `aria-describedby` keeps both its own ids and the field’s. */
export const OwnPropsWin: Story = {
  args: {
    helper: 'Shown on the invoice.',
    children: <TextInput aria-describedby="iban-note" aria-invalid={false} id="iban" />,
  },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <FormField {...args} htmlFor="iban" error="Not a valid IBAN." />
      <p id="iban-note" className="text-caption-md-regular text-text-subtle">
        We never share it.
      </p>
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'IBAN account number' });
    await expect(input).toHaveAttribute('id', 'iban');
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).toHaveAccessibleDescription('Not a valid IBAN. We never share it.');
  },
};

/* A control built later picks the wiring up the same way TextInput does. */
const AmountInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function AmountInput(props, ref) {
    const wired = useFormFieldControl(props);
    return (
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        className="h-10 w-full rounded-8 bg-surface-elevated-secondary px-3 text-body-sm-regular text-text-primary inset-ring inset-ring-stroke-subtle"
        {...wired}
      />
    );
  },
);

/**
 * Two ways a new control joins a field: call `useFormFieldControl(props)` in the control, or take the
 * props from a function child (here, a native `<input type="date">`).
 */
export const OtherControls: Story = {
  args: { label: 'Amount', helper: undefined, required: true, children: <AmountInput /> },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <FormField {...args} error="Enter an amount above 0." />
      <FormField label="Release date" helper="The day users see it.">
        {(control: FormFieldControlProps) => (
          <input
            type="date"
            className="h-10 w-full rounded-8 bg-surface-elevated-secondary px-3 text-body-sm-regular text-text-primary inset-ring inset-ring-stroke-subtle"
            {...control}
          />
        )}
      </FormField>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByRole('spinbutton', { name: 'Amount' });
    await expect(amount).toBeRequired();
    await expect(amount).toHaveAttribute('aria-invalid', 'true');
    await expect(amount).toHaveAccessibleDescription('Enter an amount above 0.');
    const date = canvas.getByLabelText('Release date');
    await expect(date).toHaveAccessibleDescription('The day users see it.');
    await expect(date).not.toHaveAttribute('aria-invalid');
  },
};
