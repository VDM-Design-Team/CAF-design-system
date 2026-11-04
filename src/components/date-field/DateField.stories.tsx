import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { DateField } from './DateField';

/* Today pinned, as in the Calendar stories: Thursday 24 September 2026. */
const SEP_24 = new Date(2026, 8, 24);

const meta = {
  title: 'Components/DateField',
  component: DateField,
  parameters: {
    controls: { exclude: ['today'] },
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Form / Field – Date`): a `_Form Label` over a ' +
          '`_Date Input`, with the Helper under it. It is FormField around a DateInput, which takes a typed or ' +
          'pasted `yyyy-mm-dd` and opens the Calendar. `label` and `required` are the label’s; `helper` is Show ' +
          'Helper + Helper; `error` is the field’s State=Error with its message in the Helper. Typed text that ' +
          'isn’t a date shows the field’s own error, “Enter a date as yyyy-mm-dd.”, in that place until it is ' +
          'fixed. Every other prop, and the ref (the input), go to the DateInput: `value` / `defaultValue` / ' +
          '`onValueChange` as `yyyy-mm-dd`, `name` (the date is submitted under it). `className` styles the field.',
      },
    },
  },
  args: { label: 'Starts At', today: SEP_24, onValueChange: fn(), onInvalidChange: fn() },
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    helper: { control: 'text' },
    error: { control: 'text' },
    defaultValue: { control: 'text' },
  },
  decorators: [
    (Story) => (
      // Room under the field for the calendar.
      <div className="w-96 pb-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;
const day = (canvas: Canvas, name: string) => canvas.getByRole('button', { name });

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

/**
 * The label names the field and its calendar. Clicking the label puts focus in
 * the field, to type a date; leaving the field takes it (Default → Filled). The
 * calendar button picks one instead, and puts focus back on the field.
 */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    await expect(field).toHaveValue('');
    await expect(field).toHaveAttribute('placeholder', 'yyyy-mm-dd');
    await userEvent.click(canvas.getByText('Starts At'));
    await expect(field).toHaveFocus();
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.keyboard('2026-10-14');
    await userEvent.tab();
    await expect(field).toHaveValue('2026-10-14');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-10-14');

    await userEvent.click(canvas.getByRole('button', { name: 'Choose date' }));
    await expect(canvas.getByRole('dialog', { name: 'Starts At' })).toBeInTheDocument();
    await waitFor(() => expect(day(canvas, 'Wednesday 14 October 2026')).toHaveFocus());
    await userEvent.click(day(canvas, 'Thursday 1 October 2026'));
    await expect(field).toHaveValue('2026-10-01');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-10-01');
    await waitFor(() => expect(field).toHaveFocus());
  },
};

function ControlledPeriod() {
  const [from, setFrom] = useState<string | null>('2026-11-01');
  const [to, setTo] = useState<string | null>('2026-11-30');
  /* yyyy-mm-dd strings sort as the dates do. */
  const backwards = from !== null && to !== null && to < from;
  return (
    <div className="flex gap-4">
      <DateField label="Period From" required value={from} onValueChange={setFrom} today={SEP_24} />
      <DateField
        label="Period To"
        required
        value={to}
        onValueChange={setTo}
        today={SEP_24}
        error={backwards ? 'Choose a date on or after Period From.' : undefined}
      />
    </div>
  );
}

/**
 * Figma's Cost Breakdown dialog: Period From and Period To, controlled (`value` +
 * `onValueChange`). Period To shows an error while it is before Period From. Keyboard only.
 */
export const Controlled: Story = {
  render: () => <ControlledPeriod />,
  decorators: [
    (Story) => (
      <div className="w-xl pb-96">
        <Story />
      </div>
    ),
  ],
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const from = canvas.getByRole('combobox', { name: 'Period From' });
    const to = canvas.getByRole('combobox', { name: 'Period To' });
    await expect(from).toHaveAttribute('aria-required', 'true');
    await expect(to).not.toHaveAttribute('aria-invalid');

    // Move Period From a month on: 1 December, after Period To.
    await userEvent.tab();
    await expect(from).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(day(canvas, 'Sunday 1 November 2026')).toHaveFocus());
    await userEvent.keyboard('{PageDown}{Enter}');
    await expect(from).toHaveValue('2026-12-01');
    await expect(to).toHaveAttribute('aria-invalid', 'true');
    await expect(to).toHaveAccessibleDescription('Choose a date on or after Period From.');

    // Move Period To to 31 December: the error goes. Enter, with nothing typed, opens the calendar.
    await userEvent.tab();
    await expect(to).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(day(canvas, 'Monday 30 November 2026')).toHaveFocus());
    await userEvent.keyboard('{PageDown}{ArrowRight}{Enter}');
    await expect(to).toHaveValue('2026-12-31');
    await expect(to).not.toHaveAttribute('aria-invalid');
    await expect(to).not.toHaveAccessibleDescription();

    // Typed: Period From back to 1 November, the way a user copies it from elsewhere.
    await userEvent.clear(from);
    await userEvent.paste('2026-11-01');
    await userEvent.keyboard('{Enter}');
    await expect(from).toHaveValue('2026-11-01');
    await expect(to).not.toHaveAttribute('aria-invalid');
  },
};

/** Error with its message. Focused, the field keeps the error stroke at 2px. */
export const ErrorState: Story = {
  name: 'Error',
  args: {
    label: 'Release Date',
    required: true,
    error: 'Choose a release date.',
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Release Date' });
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAttribute('aria-required', 'true');
    await expect(field).toHaveAccessibleDescription('Choose a release date.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await userEvent.tab();
    await waitFor(() => expect(getComputedStyle(field).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/** Disabled: it can’t be focused, typed in or opened, and a disabled date isn’t submitted. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: '2026-09-01' },
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    await expect(field).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Choose date' })).toBeDisabled();
    await userEvent.click(canvas.getByText('Starts At'));
    await expect(field).not.toHaveFocus();
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

/**
 * Typed text that isn't a date: on blur the field shows its own error,
 * “Enter a date as yyyy-mm-dd.”, in the Helper’s place, and is described by
 * it. While it shows, it takes the place of `error` too: it says what is wrong
 * with the text in the field now. Picking a day (or a real typed date, or
 * clearing the text) ends it, and the Helper comes back.
 */
export const TypedError: Story = {
  args: { label: 'Release Date', helper: 'The day the release goes out.' },
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Release Date' });
    await expect(field).toHaveAccessibleDescription('The day the release goes out.');
    await userEvent.type(field, '2026-11-31');
    await userEvent.tab();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription('Enter a date as yyyy-mm-dd.');
    await expect(canvas.queryByText('The day the release goes out.')).not.toBeInTheDocument();
    await expect(args.onInvalidChange).toHaveBeenLastCalledWith(true);

    // Picked instead: the error ends, the Helper comes back.
    await userEvent.click(canvas.getByRole('button', { name: 'Choose date' }));
    await waitFor(() => expect(day(canvas, 'Thursday 24 September 2026')).toHaveFocus());
    await userEvent.click(day(canvas, 'Friday 25 September 2026'));
    await expect(field).toHaveValue('2026-09-25');
    await expect(field).not.toHaveAttribute('aria-invalid');
    await expect(field).toHaveAccessibleDescription('The day the release goes out.');
    await expect(args.onInvalidChange).toHaveBeenLastCalledWith(false);
  },
};

/** The field's own error over `error`: the typed text's message shows while it applies; then `error` is back. */
export const TypedErrorOverError: Story = {
  name: 'Typed error over error',
  args: { label: 'Release Date', required: true, error: 'Choose a release date.' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Release Date' });
    await expect(field).toHaveAccessibleDescription('Choose a release date.');
    await userEvent.type(field, 'soon');
    await userEvent.keyboard('{Enter}');
    await expect(field).toHaveAccessibleDescription('Enter a date as yyyy-mm-dd.');
    // Emptied: no typed text, so the field's `error` shows again.
    await userEvent.clear(field);
    await userEvent.keyboard('{Enter}');
    await expect(field).toHaveAccessibleDescription('Choose a release date.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

/* ── A real form ───────────────────────────────────────────────────────────
   Figma's Edit Recurring Cost: Starts At (required), Ends At (optional). The
   dates are submitted as yyyy-mm-dd under each field's name. A required date
   is checked in the submit handler (the browser doesn't check a custom
   control), and the error shows in the field. */

function RecurringCostForm() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);
  const [error, setError] = useState<string>();
  const startsAt = useRef<HTMLInputElement>(null);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        if (!data.startsAt) {
          setError('Choose a start date.');
          startsAt.current?.focus();
          return;
        }
        setError(undefined);
        setSubmitted(data);
      }}
    >
      <DateField ref={startsAt} label="Starts At" name="startsAt" required error={error} today={SEP_24} />
      <DateField label="Ends At" name="endsAt" today={SEP_24} />
      <DateField label="Created" name="created" defaultValue="2026-08-10" disabled today={SEP_24} />
      <Button type="submit">Update</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/** The dates submit with the form (FormData) as `yyyy-mm-dd`; an empty one is "", a disabled one isn't sent. A required one is checked on submit. */
export const SubmitsWithForm: Story = {
  render: () => <RecurringCostForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startsAt = canvas.getByRole('combobox', { name: 'Starts At' });
    const submit = canvas.getByRole('button', { name: 'Update' });
    const output = canvas.getByTestId('submitted');

    // Nothing chosen: the handler shows the error and puts focus on the field.
    await userEvent.click(submit);
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(startsAt).toHaveAttribute('aria-invalid', 'true');
    await expect(startsAt).toHaveAccessibleDescription('Choose a start date.');
    await expect(startsAt).toHaveFocus();

    // Choose with the keyboard: ↓ opens on today; Enter chooses it. Then submit.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(day(canvas, 'Thursday 24 September 2026')).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}{Enter}');
    await expect(startsAt).toHaveValue('2026-09-25');
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({
      startsAt: '2026-09-25',
      endsAt: '',
    });
    await expect(startsAt).not.toHaveAttribute('aria-invalid');

    // Ends At, typed, but not a date: its own error shows, and it isn't sent as a date.
    const endsAt = canvas.getByRole('combobox', { name: 'Ends At' });
    await userEvent.type(endsAt, '2026-12-32');
    await userEvent.click(submit);
    await expect(endsAt).toHaveAccessibleDescription('Enter a date as yyyy-mm-dd.');
    await waitFor(() => expect(JSON.parse(output.textContent!)).toEqual({ startsAt: '2026-09-25', endsAt: '' }));
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   The field as Figma places it: the label row, the _Date Input in each of its
   States, and the Helper. Focus is forced with storybook-addon-pseudo-states;
   Open is the calendar showing: first, with room kept under it, so the
   calendar opens downwards over empty space in any viewport. */

const STATES = [
  {
    state: 'Open',
    props: { defaultOpen: true },
    text: 'text-subtle',
    stroke: ['stroke-focused', 2],
  },
  {
    state: 'Default',
    props: {},
    text: 'text-subtle',
    stroke: ['stroke-field', 1],
  },
  {
    state: 'Filled',
    props: { defaultValue: '2026-09-01' },
    text: 'text-primary',
    stroke: ['stroke-field', 1],
  },
  {
    state: 'Focus',
    props: { defaultValue: '2026-09-01' },
    text: 'text-primary',
    stroke: ['stroke-focused', 2],
  },
  {
    state: 'Error',
    props: { required: true, error: 'Choose a start date.' },
    text: 'text-subtle',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  {
    state: 'Disabled',
    props: { disabled: true, defaultValue: '2026-09-01' },
    text: 'text-disabled',
    stroke: ['neutral-outline-border-disabled', 1],
  },
  {
    state: 'Required',
    props: { required: true },
    text: 'text-subtle',
    stroke: ['stroke-field', 1],
  },
  {
    state: 'Helper',
    props: { helper: 'The first payment goes out on this date.' },
    text: 'text-subtle',
    stroke: ['stroke-field', 1],
  },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-3">
      {STATES.map(({ state, props }) => (
        <div key={state} className={state === 'Open' ? 'pb-96' : undefined} data-cell={state}>
          <DateField
            {...props}
            label={`${state} field`}
            today={SEP_24}
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
    pseudo: {
      rootSelector: 'body',
      focus: ['[data-pseudo="focus"]'],
    },
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
    const disabledFill = tokenColour('neutral-tonal-surface-disabled');
    const critical = tokenColour('accent-critical-tonal-content-default');
    const icon = tokenColour('text-subtle');
    const disabledIcon = tokenColour('text-disabled');
    const want = STATES.map(({ state, props, text, stroke: [token, width] }) => ({
      state,
      required: 'required' in props,
      message: 'error' in props || 'helper' in props,
      error: 'error' in props,
      open: 'defaultOpen' in props,
      text: tokenColour(text),
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, required, message, error, open, text, stroke } of want) {
          const cell = canvasElement.querySelector<HTMLElement>(`[data-cell="${state}"]`)!;
          const field = cell.querySelector<HTMLInputElement>('input[role="combobox"]')!;
          const labelNode = cell.querySelector('label')!;
          // The label: Body/sm-regular, text.secondary; the marker when Required.
          expect(getComputedStyle(labelNode).color).toBe(label);
          expect(getComputedStyle(labelNode).fontSize).toBe('14px');
          const star = labelNode.querySelector('[aria-hidden]');
          if (required) expect(getComputedStyle(star!).color).toBe(marker);
          else expect(star).toBeNull();
          // The label row's 20px under the label, then the field.
          expect(field.getBoundingClientRect().top - labelNode.getBoundingClientRect().bottom).toBe(20);
          // The field: the _Date Input bindings for this state.
          const style = getComputedStyle(field);
          expect(style.backgroundColor).toBe(state === 'Disabled' ? disabledFill : fill);
          // Disabled is its own tokens now, not Default at 50% opacity.
          expect(style.opacity).toBe('1');
          expect(style.boxShadow).toContain(stroke);
          // The text the cell shows: its date, or else the placeholder.
          expect(field.value ? style.color : getComputedStyle(field, '::placeholder').color).toBe(text);
          const calendar = cell.querySelector('button[aria-label="Choose date"]')!;
          expect(getComputedStyle(calendar.querySelector('svg')!).color).toBe(state === 'Disabled' ? disabledIcon : icon);
          // Show Clear: the optional Filled and Focus cells have a date, so they have the clear button.
          expect(cell.querySelector('button[aria-label="Clear date"]') !== null).toBe(state === 'Filled' || state === 'Focus');
          expect(field.getBoundingClientRect().height).toBe(40);
          expect(cell.querySelector('[role="dialog"]') !== null).toBe(open);
          // Open: the calendar under the field, where the room was kept for it.
          if (open) expect(cell.querySelector('[role="dialog"]')!.getAttribute('data-placement')).toBe('bottom');
          // The Helper (text.subtle) or the Error Text in its place (accent.critical.tonal.content.default):
          // Caption/md-regular, space.8 under the field.
          const note = cell.querySelector('p');
          if (!message) {
            expect(note).toBeNull();
            continue;
          }
          expect(getComputedStyle(note!).color).toBe(error ? critical : helper);
          expect(getComputedStyle(note!).fontSize).toBe('12px');
          expect(note!.getBoundingClientRect().top).toBe(field.getBoundingClientRect().bottom + 8);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');

/* ── Typed text that isn't a date, in Light and Dark ───────────────────────
   Form / Field – Date State=Error from the field itself: the critical stroke on
   the _Date Input, and the Error Text "Enter a date as yyyy-mm-dd." in the
   Helper's place (Caption/md-regular, accent.critical.tonal.content.default,
   space.8 under the field). */

const typedError = (theme: 'light' | 'dark'): Story => ({
  name: `Typed, not a date — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { label: 'Ends At', defaultValue: '2026-11-30', helper: 'Leave empty for no end.' },
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      stroke: insetStroke(tokenColour('accent-critical-outline-border-default'), 1),
      message: tokenColour('accent-critical-tonal-content-default'),
      text: tokenColour('text-primary'),
    };
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Ends At' });
    await userEvent.clear(field);
    await userEvent.type(field, '30 Nov');
    await userEvent.tab();

    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription('Enter a date as yyyy-mm-dd.');
    await expect(getComputedStyle(field).boxShadow).toContain(want.stroke);
    await expect(getComputedStyle(field).color).toBe(want.text);
    const note = canvas.getByText('Enter a date as yyyy-mm-dd.');
    await expect(getComputedStyle(note).color).toBe(want.message);
    await expect(getComputedStyle(note).fontSize).toBe('12px');
    await expect(note.getBoundingClientRect().top).toBe(field.getBoundingClientRect().bottom + 8);
    // Optional, with text: Show Clear's button is there to empty it.
    await expect(canvas.getByRole('button', { name: 'Clear date' })).toBeInTheDocument();
  },
});

export const TypedErrorLight = typedError('light');
export const TypedErrorDark = typedError('dark');
