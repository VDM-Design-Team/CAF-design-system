import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { ToggleField } from './ToggleField';

const meta = {
  title: 'Components/ToggleField',
  component: ToggleField,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Selection Controls** (`Form / Toggle Field`): a label and an ' +
          'optional description with a Toggle at the end of the row. `label` is Figma’s Label, `description` Show ' +
          'Description + Description, and Checked is the switch’s `checked` (or `defaultChecked`). The whole field ' +
          'is a `<label>`: a click on the text flips the switch. The label names it and the description describes ' +
          'it. Every other prop, and the ref, go to the native switch: `name`, `value`, `onChange`, `disabled`, ' +
          '`required` (which also shows _Form Label’s marker). `className` styles the field.',
      },
    },
  },
  args: {
    label: 'Active',
    description: 'Only active announcements are shown to users.',
    name: 'active',
    onChange: fn(),
  },
  argTypes: {
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
} satisfies Meta<typeof ToggleField>;

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

/** The label names the switch and the description describes it. A click on the text flips it. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const toggle = canvas.getByRole('switch', { name: 'Active' });
    await expect(toggle).toHaveAccessibleDescription('Only active announcements are shown to users.');
    await userEvent.click(canvas.getByText('Active'));
    await expect(toggle).toBeChecked();
    await userEvent.click(canvas.getByText('Only active announcements are shown to users.'));
    await expect(toggle).not.toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

/** Checked (Create Announcement’s placement). */
export const Checked: Story = { args: { defaultChecked: true } };

export const WithoutDescription: Story = { args: { description: undefined } };

/** Tab reaches the switch and shows its stroke/focused ring; Space flips it. */
export const Keyboard: Story = {
  play: async ({ args, canvas }) => {
    const toggle = canvas.getByRole('switch', { name: 'Active' });
    const focused = tokenColour('stroke-focused');
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await waitFor(() => {
      const style = getComputedStyle(toggle);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineColor).toBe(focused);
    });
    await userEvent.keyboard(' ');
    await expect(toggle).toBeChecked();
    await userEvent.keyboard(' ');
    await expect(toggle).not.toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

/** Disabled: the switch is at 50%, and neither it nor the text flips it. */
export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
  play: async ({ args, canvas }) => {
    const toggle = canvas.getByRole('switch', { name: 'Active' });
    await expect(toggle).toBeDisabled();
    await userEvent.click(canvas.getByText('Active'));
    await expect(toggle).toBeChecked();
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

function ControlledActive() {
  const [active, setActive] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      <ToggleField
        label="Active"
        description="Only active announcements are shown to users."
        checked={active}
        onChange={(event) => setActive(event.target.checked)}
      />
      <p className="text-body-sm-regular text-text-secondary" data-testid="state">
        {active ? 'Shown to users' : 'Hidden from users'}
      </p>
    </div>
  );
}

/** Controlled: `checked` + `onChange`. */
export const Controlled: Story = {
  render: () => <ControlledActive />,
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('switch', { name: 'Active' }));
    await expect(canvas.getByRole('switch', { name: 'Active' })).not.toBeChecked();
    await expect(canvas.getByTestId('state')).toHaveTextContent('Hidden from users');
  },
};

/* ── A real form ─────────────────────────────────────────────────────────── */

function AnnouncementForm() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);
  return (
    <form
      className="flex flex-col items-start gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <ToggleField
        name="active"
        defaultChecked
        label="Active"
        description="Only active announcements are shown to users."
      />
      <ToggleField name="pinned" value="yes" label="Pinned" />
      <Button type="submit">Submit</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/** A switch that’s on submits `name` = `value` (“on” by default); one that’s off sends nothing. */
export const SubmitsWithForm: Story = {
  render: () => <AnnouncementForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole('button', { name: 'Submit' });
    const output = canvas.getByTestId('submitted');
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({ active: 'on' });
    await userEvent.click(canvas.getByText('Active'));
    await userEvent.click(canvas.getByText('Pinned'));
    await userEvent.click(submit);
    await waitFor(() => expect(JSON.parse(output.textContent!)).toEqual({ pinned: 'yes' }));
  },
};

/* ── Checked false / true, in Light and Dark ───────────────────────────────
   Figma's two variants, then code's Required, Disabled and no description. */

const STATES = [
  { state: 'Checked=false', props: {} },
  { state: 'Checked=true', props: { defaultChecked: true } },
  { state: 'Required', props: { required: true } },
  { state: 'Disabled', props: { disabled: true, defaultChecked: true } },
  { state: 'No description', props: { description: undefined } },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      {STATES.map(({ state, props }) => (
        <ToggleField
          key={state}
          label={state}
          description="Only active announcements are shown to users."
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
    const off = tokenColour('neutral-tonal-surface-default');
    const on = tokenColour('action-primary-surface-default');
    await waitFor(
      () => {
        for (const { state, props } of STATES) {
          const toggle = canvasElement.querySelector<HTMLInputElement>(`input[data-state="${state}"]`)!;
          const field = toggle.closest('label')!;
          const text = field.firstElementChild!;
          const [title, note] = [...text.children] as HTMLElement[];
          const track = toggle.getBoundingClientRect();
          const textRect = text.getBoundingClientRect();
          const fieldRect = field.getBoundingClientRect();
          // The switch: the Toggle, at the row's end, 16px after the text, centred on it.
          expect([track.width, track.height]).toEqual([36, 20]);
          expect(getComputedStyle(toggle).backgroundColor).toBe('defaultChecked' in props ? on : off);
          expect(track.right).toBe(fieldRect.right);
          expect(track.left - textRect.right).toBe(16);
          expect(track.top + track.height / 2).toBe(textRect.top + textRect.height / 2);
          expect(getComputedStyle(toggle.parentElement!).opacity).toBe('disabled' in props ? '0.5' : '1');
          // Label: Body/sm-semibold, text.primary; the marker when Required.
          expect(getComputedStyle(title).color).toBe(label);
          expect(getComputedStyle(title).fontSize).toBe('14px');
          expect(getComputedStyle(title).fontWeight).toBe('600');
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
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
