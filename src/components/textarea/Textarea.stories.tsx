import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FormLabel } from '../form-label';
import { Textarea } from './Textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`_Textarea`): the multi-line field for notes, with ' +
          'TextInput’s look. It is a native `<textarea>`, so Figma’s States are its own: Default is empty with a ' +
          '`placeholder`, Filled has a value, Focus is `:focus`, Error is `aria-invalid`, Disabled is `disabled`. ' +
          'Figma’s 96px height is `rows={4}` (the default); more `rows`, or dragging the corner, makes it taller. ' +
          'It fills its container’s width. Name it with a `<label htmlFor>` or `aria-label`.',
      },
    },
  },
  args: { 'aria-label': 'Notes', placeholder: 'Add notes…', onChange: fn() },
  argTypes: {
    rows: { control: { type: 'number', min: 2, max: 12 } },
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
} satisfies Meta<typeof Textarea>;

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

/** Typing fills it (Default → Filled). Enter starts a new line; it doesn't submit a form. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Notes' });
    // A native <textarea>: multi-line to assistive tech without any ARIA.
    await expect(textarea.tagName).toBe('TEXTAREA');
    await userEvent.type(textarea, 'Monthly team salary,{Enter}split by cost center.');
    await expect(textarea).toHaveValue('Monthly team salary,\nsplit by cost center.');
    await expect(textarea).toHaveFocus();
    await expect(args.onChange).toHaveBeenCalled();
  },
};

/** A label above it (FormLabel, Figma's `_Form Label`), as Form / Field – Textarea does; TextareaField does the wiring for you. Clicking the label focuses the field. */
export const WithLabel: Story = {
  args: { 'aria-label': undefined, id: 'reason' },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <FormLabel htmlFor="reason">Reason (optional)</FormLabel>
      <Textarea {...args} placeholder="Add a note for the applicants…" />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Reason (optional)'));
    await expect(canvas.getByRole('textbox', { name: 'Reason (optional)' })).toHaveFocus();
  },
};

/** Figma’s “Resize height as needed”: `rows` sets the height, 20px a line (4 rows is Figma’s 96). The user can drag it taller. */
export const Rows: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Textarea {...args} aria-label="Four rows" />
      <Textarea {...args} aria-label="Six rows" rows={6} />
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    const four = canvas.getByRole('textbox', { name: 'Four rows' });
    const six = canvas.getByRole('textbox', { name: 'Six rows' });
    await expect(four).toHaveAttribute('rows', '4');
    await expect(four.getBoundingClientRect().height).toBe(96);
    await expect(six.getBoundingClientRect().height).toBe(136);
    await expect(getComputedStyle(four).resize).toBe('vertical');
  },
};

/** State=Error: `aria-invalid`, described by its message. Focused, it keeps the error colour at Focus's 2px. */
export const ErrorState: Story = {
  name: 'Error',
  args: {
    defaultValue: 'See attached.',
    'aria-invalid': true,
    'aria-describedby': 'notes-error',
  },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Textarea {...args} />
      <p id="notes-error" className="text-body-sm-regular text-accent-critical-outline-content-default">
        Add at least 20 characters.
      </p>
    </div>
  ),
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Notes' });
    await expect(textarea).toBeInvalid();
    await expect(textarea).toHaveAccessibleDescription('Add at least 20 characters.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await expect(getComputedStyle(textarea).boxShadow).toContain(insetStroke(critical, 1));
    await userEvent.click(textarea);
    await waitFor(() => expect(getComputedStyle(textarea).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/** State=Disabled: it can't be focused, typed into or resized. The disabled fill and stroke, the value in text.disabled, no opacity. */
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
    await expect(textarea).not.toHaveFocus();
    await expect(args.onChange).not.toHaveBeenCalled();
    const style = getComputedStyle(textarea);
    await expect(style.color).toBe(tokenColour('text-disabled'));
    await expect(style.backgroundColor).toBe(tokenColour('neutral-tonal-surface-disabled'));
    await expect(style.boxShadow).toContain(insetStroke(tokenColour('neutral-outline-border-disabled'), 1));
    await expect(style.opacity).toBe('1');
    await expect(style.resize).toBe('none');
  },
};

/* ── Every State, in Light and Dark ────────────────────────────────────────
   The same six states as the Figma component set (and Disabled with a value). Focus is forced with
   storybook-addon-pseudo-states, and each cell is checked against the
   variables Figma binds in that state, and against Figma's 96px height. */

const STATES = [
  {
    state: 'Default',
    props: {},
    value: 'text-subtle',
    fill: 'surface-elevated-secondary',
    stroke: ['stroke-field', 1],
  },
  {
    state: 'Filled',
    props: { defaultValue: 'Monthly team salary, split by cost center.' },
    value: 'text-primary',
    fill: 'surface-elevated-secondary',
    stroke: ['stroke-field', 1],
  },
  {
    state: 'Focus',
    props: { defaultValue: 'Monthly team salary, split by cost center.' },
    value: 'text-primary',
    fill: 'surface-elevated-secondary',
    stroke: ['stroke-focused', 2],
  },
  {
    state: 'Error',
    props: {
      defaultValue: 'Monthly team salary, split by cost center.',
      'aria-invalid': true,
    },
    value: 'text-primary',
    fill: 'surface-elevated-secondary',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  {
    state: 'Error + Focus',
    props: {
      defaultValue: 'Monthly team salary, split by cost center.',
      'aria-invalid': true,
    },
    value: 'text-primary',
    fill: 'surface-elevated-secondary',
    stroke: ['accent-critical-outline-border-default', 2],
  },
  {
    state: 'Disabled',
    props: { disabled: true },
    value: 'text-disabled',
    fill: 'neutral-tonal-surface-disabled',
    stroke: ['neutral-outline-border-disabled', 1],
  },
  {
    state: 'Disabled, filled',
    props: { disabled: true, defaultValue: 'Monthly team salary, split by cost center.' },
    value: 'text-disabled',
    fill: 'neutral-tonal-surface-disabled',
    stroke: ['neutral-outline-border-disabled', 1],
  },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {STATES.map(({ state, props }) => (
        <div key={state} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">{state}</span>
          <Textarea
            {...props}
            aria-label={`${state} field`}
            placeholder="Add notes…"
            data-state={state}
            data-pseudo={state === 'Focus' || state === 'Error + Focus' ? 'focus' : undefined}
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
    const want = STATES.map(({ state, props, value, fill, stroke: [token, width] }) => ({
      state,
      filled: 'defaultValue' in props,
      value: tokenColour(value),
      fill: tokenColour(fill),
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, filled, value, fill, stroke } of want) {
          const textarea = canvasElement.querySelector<HTMLTextAreaElement>(`[data-state="${state}"]`)!;
          const style = getComputedStyle(textarea);
          expect(style.backgroundColor).toBe(fill);
          // Disabled is its own tokens now, not Default at 50% opacity.
          expect(style.opacity).toBe('1');
          expect(style.boxShadow).toContain(stroke);
          expect(style.borderRadius).toBe('8px');
          expect(style.padding).toBe('8px 12px');
          expect(style.fontSize).toBe('14px');
          // The text a cell shows: its value, or else its placeholder.
          expect(filled ? style.color : getComputedStyle(textarea, '::placeholder').color).toBe(value);
          expect(textarea.getBoundingClientRect().height).toBe(96);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
