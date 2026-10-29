import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { CheckboxField } from './CheckboxField';

const meta = {
  title: 'Components/CheckboxField',
  component: CheckboxField,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Selection Controls** (`Form / Checkbox Field`): a Checkbox with ' +
          'a label and an optional description beside it. `label` is Figma’s Label, `description` Show Description ' +
          '+ Description, `bordered` Bordered, and Checked is the box’s `checked` (or `defaultChecked`). The whole ' +
          'field is a `<label>`: a click anywhere toggles the box. The label names it and the description describes ' +
          'it. Every other prop, and the ref, go to the native checkbox: `name`, `value`, `onChange`, `disabled`, ' +
          '`required` (which also shows _Form Label’s marker). `className` styles the field.',
      },
    },
  },
  args: {
    label: 'Restricted User',
    description: 'Users with this role can only see their own costs.',
    name: 'restrictedUser',
    onChange: fn(),
  },
  argTypes: {
    bordered: { control: 'boolean' },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    description: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="w-128">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CheckboxField>;

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

/** The label names the box and the description describes it. A click on either toggles it. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Restricted User' });
    await expect(box).toHaveAccessibleDescription('Users with this role can only see their own costs.');
    await userEvent.click(canvas.getByText('Restricted User'));
    await expect(box).toBeChecked();
    await userEvent.click(canvas.getByText('Users with this role can only see their own costs.'));
    await expect(box).not.toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

/** Bordered (Add New User’s placement): a card, and a click anywhere on it, padding included, toggles the box. */
export const Bordered: Story = {
  args: { bordered: true },
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Restricted User' });
    const card = box.closest('label')!;
    const rect = card.getBoundingClientRect();
    // The card's bottom-right corner, inside its 16px padding.
    await userEvent.pointer({ keys: '[MouseLeft]', target: card, coords: { clientX: rect.right - 4, clientY: rect.bottom - 4 } });
    await expect(box).toBeChecked();
  },
};

export const WithoutDescription: Story = { args: { description: undefined, label: 'Active' } };

/** Tab reaches the box and shows its stroke/focused ring; Space toggles it. */
export const Keyboard: Story = {
  args: { bordered: true },
  play: async ({ args, canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Restricted User' });
    const focused = tokenColour('stroke-focused');
    await userEvent.tab();
    await expect(box).toHaveFocus();
    await waitFor(() => {
      const style = getComputedStyle(box);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineColor).toBe(focused);
    });
    await userEvent.keyboard(' ');
    await expect(box).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

/** Disabled: it can’t be toggled, and a disabled checkbox isn’t submitted. */
export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
  play: async ({ args, canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Restricted User' });
    await expect(box).toBeDisabled();
    await userEvent.click(canvas.getByText('Restricted User'));
    await expect(box).toBeChecked();
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

function ControlledRestricted() {
  const [restricted, setRestricted] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <CheckboxField
        bordered
        label="Restricted User"
        description="Users with this role can only see their own costs."
        checked={restricted}
        onChange={(event) => setRestricted(event.target.checked)}
      />
      <p className="text-body-sm-regular text-text-secondary" data-testid="state">
        {restricted ? 'Restricted' : 'Full access'}
      </p>
    </div>
  );
}

/** Controlled: `checked` + `onChange`. The Bordered card’s stroke follows Checked. */
export const Controlled: Story = {
  render: () => <ControlledRestricted />,
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Restricted User'));
    await expect(canvas.getByRole('checkbox', { name: 'Restricted User' })).toBeChecked();
    await expect(canvas.getByTestId('state')).toHaveTextContent('Restricted');
  },
};

/* ── A real form ─────────────────────────────────────────────────────────── */

function AddUserForm() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);
  return (
    <form
      className="flex flex-col items-start gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <CheckboxField
        bordered
        name="restrictedUser"
        value="true"
        label="Restricted User"
        description="Users with this role can only see their own costs."
      />
      <CheckboxField
        name="confirmed"
        required
        label="I’ve checked the user’s details"
      />
      <Button type="submit">Submit</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/**
 * A checked field submits `name` = `value` (“on” by default); an unchecked one sends nothing. A `required` one
 * left unchecked stops the submit (the browser’s own check).
 */
export const SubmitsWithForm: Story = {
  render: () => <AddUserForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole('button', { name: 'Submit' });
    const output = canvas.getByTestId('submitted');
    const confirmed = canvas.getByRole('checkbox', { name: 'I’ve checked the user’s details' });
    await expect(confirmed).toBeRequired();
    await userEvent.click(submit);
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(confirmed).toBeInvalid();
    await expect(confirmed).toHaveFocus();
    await userEvent.keyboard(' ');
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({ confirmed: 'on' });
    await userEvent.click(canvas.getByText('Restricted User'));
    await userEvent.click(submit);
    await waitFor(() => expect(JSON.parse(output.textContent!)).toEqual({ restrictedUser: 'true', confirmed: 'on' }));
  },
};

/* ── Every Checked × Bordered, in Light and Dark ───────────────────────────
   Figma's four variants, then code's Required, Disabled and no description. */

const STATES = [
  { state: 'Checked=false, Bordered=false', props: {} },
  { state: 'Checked=true, Bordered=false', props: { defaultChecked: true } },
  { state: 'Checked=false, Bordered=true', props: { bordered: true } },
  { state: 'Checked=true, Bordered=true', props: { bordered: true, defaultChecked: true } },
  { state: 'Required', props: { required: true } },
  { state: 'Disabled', props: { disabled: true, defaultChecked: true } },
  { state: 'No description', props: { description: undefined } },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      {STATES.map(({ state, props }) => (
        <CheckboxField
          key={state}
          label={state}
          description="Users with this role can only see their own costs."
          {...props}
          data-state={state}
        />
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  afterEach: async ({ canvasElement }) => {
    const label = tokenColour('text-primary');
    const description = tokenColour('text-secondary');
    const marker = tokenColour('accent-critical-tonal-content-default');
    const fill = tokenColour('action-primary-surface-default');
    const card = insetStroke(tokenColour('stroke-default'), 1);
    const cardChecked = insetStroke(tokenColour('stroke-focused'), 1);
    await waitFor(
      () => {
        for (const { state, props } of STATES) {
          const box = canvasElement.querySelector<HTMLInputElement>(`input[data-state="${state}"]`)!;
          const field = box.closest('label')!;
          const [title, note] = [...field.lastElementChild!.children] as HTMLElement[];
          const boxRect = box.getBoundingClientRect();
          const fieldRect = field.getBoundingClientRect();
          const bordered = 'bordered' in props;
          const checked = 'defaultChecked' in props;
          // The box: the 16px Checkbox, its fill following Checked.
          expect([boxRect.width, boxRect.height]).toEqual([16, 16]);
          if (checked) expect(getComputedStyle(box).backgroundColor).toBe(fill);
          // Label: Body/sm-semibold, text.primary, 12px after the box, whose top is 2px below the label's.
          expect(getComputedStyle(title).color).toBe(label);
          expect(getComputedStyle(title).fontSize).toBe('14px');
          expect(getComputedStyle(title).fontWeight).toBe('600');
          expect(title.getBoundingClientRect().left - boxRect.right).toBe(12);
          expect(boxRect.top - title.getBoundingClientRect().top).toBe(2);
          const star = title.querySelector('[aria-hidden]');
          if ('required' in props) expect(getComputedStyle(star!).color).toBe(marker);
          else expect(star).toBeNull();
          // Description: Caption/md-regular, text.secondary, 2px under the label.
          if ('description' in props) expect(note).toBeUndefined();
          else {
            expect(getComputedStyle(note).color).toBe(description);
            expect(getComputedStyle(note).fontSize).toBe('12px');
            expect(note.getBoundingClientRect().top - title.getBoundingClientRect().bottom).toBe(2);
          }
          // Bordered: a card with 16px padding, radius 8, stroke.default, stroke.focused while checked.
          const style = getComputedStyle(field);
          if (bordered) {
            expect(style.boxShadow).toContain(checked ? cardChecked : card);
            expect(style.borderRadius).toBe('8px');
            expect([boxRect.left - fieldRect.left, boxRect.top - fieldRect.top]).toEqual([16, 18]);
          } else {
            expect(style.boxShadow).toBe('none');
            expect(boxRect.left).toBe(fieldRect.left);
          }
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
