import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { RadioGroup, type RadioGroupProps } from './RadioGroup';

/* Create Announcement's Target Audience (Patterns – Admin 05 and 14). */
const AUDIENCES = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Selection Controls** (`Form / Radio Group`): a label over a row ' +
          'of Radio Options, with the Helper under them. `label` is Figma’s Label, `options` the Radio Options and ' +
          '`helper` Show Helper + Helper. The chosen option (each option’s Selected) is `value` + `onValueChange`, or ' +
          '`defaultValue`. Code adds `required` (_Form Label’s marker), `error` (the message in the Helper’s place) ' +
          'and `disabled`. It is a `<fieldset role="radiogroup">` of native radios that share `name`: the arrow keys ' +
          'move and choose, the group is one tab stop, and the chosen `value` is submitted under `name`.',
      },
    },
  },
  args: {
    label: 'Target Audience',
    options: AUDIENCES,
    helper: 'Who should see this announcement.',
    name: 'audience',
    onValueChange: fn(),
  },
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    helper: { control: 'text' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof RadioGroup>;

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

/** Uncontrolled, starting on All (Figma’s placement). The label names the group and the Helper describes it; a click chooses. */
export const Playground: Story = {
  args: { defaultValue: 'all' },
  play: async ({ args, canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Target Audience' });
    await expect(group).toHaveAccessibleDescription('Who should see this announcement.');
    await expect(canvas.getByRole('radio', { name: 'All' })).toBeChecked();
    await userEvent.click(canvas.getByText('Admin'));
    await expect(canvas.getByRole('radio', { name: 'Admin' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'All' })).not.toBeChecked();
    await expect(args.onValueChange).toHaveBeenCalledWith('admin');
  },
};

/** The keyboard is the browser’s: the group is one tab stop (the chosen radio), and ← → ↑ ↓ move, choose and wrap. */
export const Keyboard: Story = {
  args: { defaultValue: 'all' },
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <Button variant="outlined">Before</Button>
      <RadioGroup {...args} />
      <Button variant="outlined">After</Button>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const radio = (name: string) => canvas.getByRole('radio', { name });
    const focused = tokenColour('stroke-focused');
    await userEvent.click(canvas.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    await expect(radio('All')).toHaveFocus();
    await waitFor(() => {
      const style = getComputedStyle(radio('All'));
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineColor).toBe(focused);
    });
    await userEvent.keyboard('{ArrowRight}');
    await expect(radio('Admin')).toHaveFocus();
    await expect(radio('Admin')).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('admin');
    await userEvent.keyboard('{ArrowDown}');
    await expect(radio('User')).toBeChecked();
    await userEvent.keyboard('{ArrowRight}');
    await expect(radio('All')).toBeChecked();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(radio('User')).toBeChecked();
    await userEvent.keyboard('{ArrowUp}');
    await expect(radio('Admin')).toBeChecked();
    // One tab stop: Tab leaves the group, Shift+Tab comes back to the chosen radio.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(radio('Admin')).toHaveFocus();
  },
};

function ControlledAudience(props: Partial<RadioGroupProps>) {
  const [audience, setAudience] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <RadioGroup
        label="Target Audience"
        options={AUDIENCES}
        value={audience}
        onValueChange={(value) => {
          props.onValueChange?.(value);
          setAudience(value);
        }}
      />
      <p className="text-body-sm-regular text-text-secondary" data-testid="audience">
        {audience ?? 'No audience chosen'}
      </p>
    </div>
  );
}

/** Controlled (`value` + `onValueChange`), starting with nothing chosen (`null`). */
export const Controlled: Story = {
  render: (args) => <ControlledAudience onValueChange={args.onValueChange} />,
  parameters: { controls: { disable: true } },
  play: async ({ args, canvas }) => {
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).not.toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'User' }));
    await expect(canvas.getByRole('radio', { name: 'User' })).toBeChecked();
    await expect(canvas.getByTestId('audience')).toHaveTextContent('user');
    await expect(args.onValueChange).toHaveBeenCalledWith('user');
  },
};

/** Error: the message in the Helper’s place; the group and its radios are `aria-invalid`. Required shows the marker. */
export const ErrorState: Story = {
  name: 'Error',
  args: { required: true, error: 'Choose who should see this announcement.' },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Target Audience' });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(group).toHaveAttribute('aria-required', 'true');
    await expect(group).toHaveAccessibleDescription('Choose who should see this announcement.');
    await expect(canvas.queryByText('Who should see this announcement.')).not.toBeInTheDocument();
    for (const radio of canvas.getAllByRole('radio')) {
      await expect(radio).toBeRequired();
      await expect(radio).toHaveAttribute('aria-invalid', 'true');
    }
  },
};

/** Disabled: the fieldset disables every radio. One option can be disabled on its own too. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'all' },
  play: async ({ args, canvas }) => {
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).toBeDisabled();
    await userEvent.click(canvas.getByText('User'));
    await expect(canvas.getByRole('radio', { name: 'All' })).toBeChecked();
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const DisabledOption: Story = {
  args: {
    defaultValue: 'all',
    options: [...AUDIENCES.slice(0, 2), { value: 'user', label: 'User', disabled: true }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'User' })).toBeDisabled();
    // The arrow keys skip a disabled radio.
    await userEvent.click(canvas.getByRole('radio', { name: 'Admin' }));
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'All' })).toBeChecked();
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
      <RadioGroup
        label="Target Audience"
        name="audience"
        options={AUDIENCES}
        required
        helper="Who should see this announcement."
      />
      <RadioGroup label="Priority" name="priority" options={['Normal', 'High']} defaultValue="Normal" disabled />
      <Button type="submit">Submit</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/**
 * The chosen `value` is submitted under `name`. A `required` group with nothing chosen stops the submit (the
 * browser’s own check, on the first radio), and a disabled group isn’t sent.
 */
export const SubmitsWithForm: Story = {
  render: () => <AnnouncementForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole('button', { name: 'Submit' });
    const output = canvas.getByTestId('submitted');
    await userEvent.click(submit);
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(canvas.getByRole('radio', { name: 'All' })).toBeInvalid();
    await expect(canvas.getByRole('radio', { name: 'All' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({ audience: 'admin' });
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   The group as Figma places it (Selected on All), then with code's Required,
   Error and Disabled. Hover is forced on Admin with storybook-addon-pseudo-states. */

const STATES = [
  { state: 'Default', props: {}, message: 'helper' },
  { state: 'No helper', props: { helper: undefined }, message: null },
  { state: 'Required', props: { required: true }, message: 'helper' },
  { state: 'Error', props: { required: true, error: 'Choose who should see this announcement.' }, message: 'error' },
  { state: 'Disabled', props: { disabled: true }, message: 'helper' },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      {STATES.map(({ state, props }) => (
        <RadioGroup
          key={state}
          label={`${state} group`}
          name={state}
          options={AUDIENCES}
          defaultValue="all"
          helper="Who should see this announcement."
          {...props}
          data-state={state}
        />
      ))}
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-state="Default"] input[value="admin"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play.
  afterEach: async ({ canvasElement }) => {
    const label = tokenColour('text-secondary');
    const marker = tokenColour('accent-critical-tonal-content-default');
    const option = tokenColour('text-primary');
    const helper = tokenColour('text-subtle');
    const selected = insetStroke(tokenColour('action-primary-surface-default'), 2);
    const resting = insetStroke(tokenColour('stroke-strong'), 1);
    const hover = insetStroke(tokenColour('stroke-focused'), 1);
    await waitFor(
      () => {
        for (const { state, props, message } of STATES) {
          const group = canvasElement.querySelector<HTMLFieldSetElement>(`fieldset[data-state="${state}"]`)!;
          const legend = group.querySelector('legend')!;
          const row = legend.nextElementSibling!;
          const options = [...row.querySelectorAll('label')];
          const radios = [...row.querySelectorAll('input')];
          const note = group.querySelector('p');
          // Label: Body/sm-regular, text.secondary (the _Form Label look); the marker when Required.
          expect(getComputedStyle(legend).color).toBe(label);
          expect(getComputedStyle(legend).fontSize).toBe('14px');
          const star = legend.querySelector('[aria-hidden]');
          if ('required' in props) expect(getComputedStyle(star!).color).toBe(marker);
          else expect(star).toBeNull();
          // Label → options → Helper: 8px apart. Options: a row, 24px apart.
          expect(row.getBoundingClientRect().top - legend.getBoundingClientRect().bottom).toBe(8);
          for (let i = 1; i < options.length; i++)
            expect(options[i].getBoundingClientRect().left - options[i - 1].getBoundingClientRect().right).toBe(24);
          expect(options.map((o) => getComputedStyle(o).color)).toEqual(options.map(() => option));
          // The radios: All is Selected; Admin is Hover in the first group; Disabled is 50%.
          expect(getComputedStyle(radios[0]).boxShadow).toContain(selected);
          expect(getComputedStyle(radios[1]).boxShadow).toContain(state === 'Default' ? hover : resting);
          expect(getComputedStyle(radios[2]).boxShadow).toContain(resting);
          for (const radio of radios)
            expect(getComputedStyle(radio.parentElement!).opacity).toBe(state === 'Disabled' ? '0.5' : '1');
          // The Helper (or the error in its place): Caption/md-regular, text.subtle, 8px under the options.
          if (!message) {
            expect(note).toBeNull();
            continue;
          }
          expect(getComputedStyle(note!).color).toBe(helper);
          expect(getComputedStyle(note!).fontSize).toBe('12px');
          expect(note!.getBoundingClientRect().top - row.getBoundingClientRect().bottom).toBe(8);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
