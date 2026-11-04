import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { DateInput, type DateInputProps } from './DateInput';

/* Today pinned, as in the Calendar stories: Thursday 24 September 2026. */
const SEP_24 = new Date(2026, 8, 24);

const meta = {
  title: 'Components/DateInput',
  component: DateInput,
  parameters: {
    // Storybook's date control sends a number; `today` is pinned for stable snapshots.
    controls: { exclude: ['today'] },
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`_Date Input`): the field for one date. Type or paste ' +
          'it as `yyyy-mm-dd`, or pick it in `Date Picker / Calendar` (Calendar), which opens under it in a ' +
          'Popover. Dates are `yyyy-mm-dd` strings, the format Figma’s placements show and what the form submits ' +
          '(`name`). Figma’s States: Default shows `placeholder` (“yyyy-mm-dd”, the format to type), Filled shows the date, Focus is ' +
          '`:focus`, Error is `aria-invalid`, Disabled is `disabled`, Open is the calendar showing. Typed text is ' +
          'checked on blur, on Enter and when the calendar opens: a real date becomes the value; anything else stays ' +
          'as typed, the field turns Error (`onInvalidChange(true)`) and holds no date. Figma’s Icon / Calendar is ' +
          'the calendar’s button (“Choose date”); ↓ or ↑, or Enter with nothing new typed, open the calendar from ' +
          'the field, on the date. Its arrows, Home / End and Page Up / Page Down move; Enter chooses; Escape closes ' +
          'and keeps the text. Focus comes back to the field. It is an `<input role="combobox">`: name it with a ' +
          '`<label htmlFor>`, `aria-label` or `aria-labelledby`.',
      },
    },
  },
  args: {
    'aria-label': 'Starts At',
    today: SEP_24,
    onValueChange: fn(),
    onInvalidChange: fn(),
    onOpenChange: fn(),
  },
  argTypes: {
    value: { control: 'text' },
    defaultValue: { control: 'text' },
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      // Room under the field for the calendar.
      <div className="w-96 pb-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;
const day = (canvas: Canvas, name: string) => canvas.getByRole('button', { name });
/* Figma's Icon / Calendar, which is the calendar's button. */
const calendarButton = (canvas: Canvas) => canvas.getByRole('button', { name: 'Choose date' });

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

/* Where the field's text stops: its right edge less its right padding. */
const textRight = (field: HTMLElement) =>
  field.getBoundingClientRect().right - parseFloat(getComputedStyle(field).paddingRight);

/* A date input with what it holds read back under it, and a button after it for Tab. */
function Example(props: Partial<DateInputProps>) {
  const [stored, setStored] = useState<string | null>(props.defaultValue ?? null);
  const [invalid, setInvalid] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <DateInput
        aria-label="Starts At"
        today={SEP_24}
        {...props}
        onValueChange={(value) => {
          props.onValueChange?.(value);
          setStored(value);
        }}
        onInvalidChange={(next) => {
          props.onInvalidChange?.(next);
          setInvalid(next);
        }}
      />
      <p role="status" className="text-body-sm-regular text-text-secondary">
        Stored: {stored === null ? 'none' : JSON.stringify(stored)}
        {invalid ? ', not a date' : ''}
      </p>
      <Button variant="outlined">Next</Button>
    </div>
  );
}

/**
 * The calendar button (Figma's Icon / Calendar) opens the calendar on today
 * (nothing is chosen yet), with focus on it. Choosing a day shows it as
 * `yyyy-mm-dd` (Default → Filled), closes the calendar and puts focus back on
 * the field. The button closes an open calendar too.
 */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    const button = calendarButton(canvas);
    await expect(field).toHaveValue('');
    await expect(field).toHaveAttribute('placeholder', 'yyyy-mm-dd');
    await expect(field).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    // Like Combobox's caret, not a tab stop: ↓ / ↑ open the calendar from the field.
    await expect(button).toHaveAttribute('tabindex', '-1');
    await expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(button);
    const dialog = canvas.getByRole('dialog', { name: 'Starts At' });
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toHaveAttribute('aria-controls', dialog.id);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await waitFor(() => expect(day(canvas, 'Thursday 24 September 2026')).toHaveFocus());

    await userEvent.click(day(canvas, 'Tuesday 1 September 2026'));
    await expect(args.onValueChange).toHaveBeenCalledWith('2026-09-01');
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(field).toHaveValue('2026-09-01');
    await waitFor(() => expect(field).toHaveFocus());

    // Opening again shows the chosen day's month, on the chosen day; the button closes it again.
    await userEvent.click(button);
    await waitFor(() => expect(day(canvas, 'Tuesday 1 September 2026')).toHaveFocus());
    await expect(day(canvas, 'Tuesday 1 September 2026').closest('[role="gridcell"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(button);
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(field).toHaveFocus());
    await expect(field).toHaveValue('2026-09-01');
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
  },
};

/**
 * Typing (Figma: “A typed or pasted yyyy-mm-dd works as well as picking”). A
 * click in the field is for typing; the calendar stays closed. Nothing changes
 * while the user types. Leaving the field (Tab) checks the text, and a real
 * date becomes the value. Enter checks it in place, without submitting or
 * opening anything. Spaces around the date are ignored. The same date again
 * changes nothing, and emptying the field clears the date.
 */
export const Typing: Story = {
  render: (args) => <Example {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    const status = canvas.getByRole('status');

    await userEvent.click(field);
    await expect(field).toHaveFocus();
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.keyboard('2026-10-05');
    await expect(field).toHaveValue('2026-10-05');
    await expect(args.onValueChange).not.toHaveBeenCalled();

    // Tab: the text is checked; the date is the value.
    await userEvent.tab();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-10-05');
    await expect(status).toHaveTextContent('Stored: "2026-10-05"');
    await expect(field).toHaveValue('2026-10-05');
    await expect(field).not.toHaveAttribute('aria-invalid');

    // Enter checks a new date where it is: focus stays, nothing opens.
    await userEvent.clear(field);
    await userEvent.type(field, ' 2026-12-31 ');
    await userEvent.keyboard('{Enter}');
    await expect(field).toHaveValue('2026-12-31');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-12-31');
    await expect(field).toHaveFocus();
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();

    // The same date again: no change. An empty field: no date.
    await userEvent.clear(field);
    await userEvent.type(field, '2026-12-31');
    await userEvent.tab();
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
    await userEvent.clear(field);
    await userEvent.tab();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('');
    await expect(status).toHaveTextContent('Stored: ""');
    await expect(field).toHaveValue('');
    await expect(args.onInvalidChange).not.toHaveBeenCalled();
  },
};

/**
 * Pasting works as typing does: the pasted text is checked on blur or Enter,
 * by the same rule. A date copied with spaces around it is read; anything
 * else stays as pasted, marked as not a date.
 */
export const Pasting: Story = {
  args: { defaultValue: '2026-09-01' },
  render: (args) => <Example {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    const status = canvas.getByRole('status');

    await userEvent.clear(field);
    await userEvent.paste(' 2026-11-30 ');
    await expect(field).toHaveValue(' 2026-11-30 ');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await userEvent.tab();
    await expect(field).toHaveValue('2026-11-30');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-11-30');
    await expect(status).toHaveTextContent('Stored: "2026-11-30"');

    // Another format is pasted as it is, and Enter marks it.
    await userEvent.clear(field);
    await userEvent.paste('30/11/2026');
    await userEvent.keyboard('{Enter}');
    await expect(field).toHaveValue('30/11/2026');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(args.onInvalidChange).toHaveBeenLastCalledWith(true);
    await expect(status).toHaveTextContent('Stored: "", not a date');

    // Pasting a date over it ends that.
    await userEvent.clear(field);
    await userEvent.paste('2026-12-01');
    await userEvent.keyboard('{Enter}');
    await expect(field).toHaveValue('2026-12-01');
    await expect(field).not.toHaveAttribute('aria-invalid');
    await expect(args.onInvalidChange).toHaveBeenLastCalledWith(false);
    await expect(status).toHaveTextContent('Stored: "2026-12-01"');
  },
};

/**
 * Text that isn't a `yyyy-mm-dd` date (a 30 February, then a date without its
 * zeros) stays as typed, so it can be fixed. On blur the field turns
 * State=Error: `aria-invalid`, `onInvalidChange(true)`, the critical stroke.
 * It holds no date (`onValueChange('')`), so a form can't submit the date the
 * field no longer shows. Back in the field it is Error + Focus. A real date
 * ends the error.
 */
export const InvalidDate: Story = {
  name: 'Invalid date',
  args: { defaultValue: '2026-09-01', required: true },
  render: (args) => <Example {...args} />,
  play: async ({ args, canvasElement }) => {
    const critical = tokenColour('accent-critical-outline-border-default');
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    const status = canvas.getByRole('status');

    await userEvent.clear(field);
    await userEvent.type(field, '2026-02-30');
    // Not checked while typing.
    await expect(field).not.toHaveAttribute('aria-invalid');
    await userEvent.tab();
    await expect(field).toHaveValue('2026-02-30');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(args.onInvalidChange).toHaveBeenLastCalledWith(true);
    await expect(args.onValueChange).toHaveBeenLastCalledWith('');
    await expect(status).toHaveTextContent('Stored: "", not a date');
    await expect(getComputedStyle(field).boxShadow).toContain(insetStroke(critical, 1));

    // Back in the field: Error + Focus, the critical stroke at 2px.
    await userEvent.click(field);
    await waitFor(() => expect(getComputedStyle(field).boxShadow).toContain(insetStroke(critical, 2)));

    // Still not a date: the error stays, with no new call.
    await userEvent.clear(field);
    await userEvent.type(field, '2026-9-1');
    await userEvent.keyboard('{Enter}');
    await expect(field).toHaveValue('2026-9-1');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(args.onInvalidChange).toHaveBeenCalledTimes(1);

    // A real date ends it, and is the value.
    await userEvent.clear(field);
    await userEvent.type(field, '2026-09-01');
    await userEvent.keyboard('{Enter}');
    await expect(field).not.toHaveAttribute('aria-invalid');
    await expect(args.onInvalidChange).toHaveBeenLastCalledWith(false);
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-09-01');
    await expect(status).toHaveTextContent('Stored: "2026-09-01"');
  },
};

/**
 * Keyboard only. ↓ or ↑, or Enter while nothing new is typed, open the
 * calendar on the date. The calendar's keys move (here: → a day, Page Down a
 * month, Shift + Page Down a year); Enter or Space chooses and closes. Escape
 * closes without choosing and keeps the text. Either way focus comes back to
 * the field. A typed date is checked first, so the calendar opens on its
 * month; text that isn't a date is marked, and the calendar opens on today.
 * Tab past the calendar closes it and moves on.
 */
export const Keyboard: Story = {
  args: { defaultValue: '2026-09-19', required: true },
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <DateInput {...args} />
      <Button variant="outlined">Next</Button>
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    const focusIs = (name: string) => waitFor(() => expect(day(canvas, name)).toHaveFocus());
    const closed = () => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.tab();
    await expect(field).toHaveFocus();

    // Enter (nothing typed) opens on the chosen day; → and Enter choose the next one.
    await userEvent.keyboard('{Enter}');
    await focusIs('Saturday 19 September 2026');
    await userEvent.keyboard('{ArrowRight}');
    await focusIs('Sunday 20 September 2026');
    await userEvent.keyboard('{Enter}');
    await closed();
    await expect(field).toHaveValue('2026-09-20');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-09-20');
    await waitFor(() => expect(field).toHaveFocus());

    // ↓ opens; Page Down moves a month; Escape closes without choosing.
    await userEvent.keyboard('{ArrowDown}');
    await focusIs('Sunday 20 September 2026');
    await userEvent.keyboard('{PageDown}');
    await focusIs('Tuesday 20 October 2026');
    await userEvent.keyboard('{Escape}');
    await closed();
    await expect(field).toHaveValue('2026-09-20');
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(field).toHaveFocus());

    // ↑ opens too; Shift + Page Down moves a year, and Space chooses.
    await userEvent.keyboard('{ArrowUp}');
    await focusIs('Sunday 20 September 2026');
    await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
    await focusIs('Monday 20 September 2027');
    await userEvent.keyboard(' ');
    await closed();
    await expect(field).toHaveValue('2027-09-20');
    await waitFor(() => expect(field).toHaveFocus());

    // A typed date: ↓ takes it, and the calendar opens on its month, on it. Escape keeps it.
    await userEvent.clear(field);
    await userEvent.keyboard('2026-12-05');
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-12-05');
    await expect(canvas.getByText('December 2026')).toBeInTheDocument();
    await focusIs('Saturday 5 December 2026');
    await userEvent.keyboard('{Escape}');
    await closed();
    await expect(field).toHaveValue('2026-12-05');
    await waitFor(() => expect(field).toHaveFocus());

    // Typed text that isn't a date: ↓ marks it and opens on today. Escape brings the text back as typed.
    await userEvent.clear(field);
    await userEvent.keyboard('2026-12-5');
    await userEvent.keyboard('{ArrowDown}');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await focusIs('Thursday 24 September 2026');
    await userEvent.keyboard('{Escape}');
    await closed();
    await expect(field).toHaveValue('2026-12-5');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(field).toHaveFocus());

    // ↓ again; Tab from the days leaves the calendar: it closes, and focus moves on.
    await userEvent.keyboard('{ArrowDown}');
    await focusIs('Thursday 24 September 2026');
    await userEvent.tab();
    await closed();
    await expect(canvas.getByRole('button', { name: 'Next' })).toHaveFocus();
    await expect(field).toHaveValue('2026-12-5');
  },
};

/** A click outside closes the calendar without choosing, and leaves focus where the user clicked. */
export const ClickOutside: Story = {
  args: { defaultValue: '2026-11-01' },
  render: (args) => (
    // The button sits above the field, so the calendar (which opens below) doesn't cover it.
    <div className="flex flex-col items-start gap-4">
      <Button variant="outlined">Elsewhere</Button>
      <DateInput {...args} />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    await userEvent.click(calendarButton(canvas));
    await waitFor(() => expect(day(canvas, 'Sunday 1 November 2026')).toHaveFocus());
    const elsewhere = canvas.getByRole('button', { name: 'Elsewhere' });
    await userEvent.click(elsewhere);
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(elsewhere).toHaveFocus();
    await expect(field).not.toHaveFocus();
    await expect(field).toHaveValue('2026-11-01');
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

function ControlledPeriod() {
  const [from, setFrom] = useState<string | null>('2026-11-01');
  return (
    <div className="flex flex-col items-start gap-3">
      <DateInput aria-label="Period From" value={from} onValueChange={setFrom} today={SEP_24} required />
      <Button variant="outlined" onClick={() => setFrom(null)}>
        Reset
      </Button>
      <p role="status" className="text-body-sm-regular text-text-secondary">
        Stored: {from === null ? 'none' : JSON.stringify(from)}
      </p>
    </div>
  );
}

/**
 * Controlled (`value` + `onValueChange`): the stored value is the `yyyy-mm-dd`
 * string, picked or typed. Text that isn't a date stores `''`, and stays in
 * the field. A new `value` from outside (Reset, `null`) replaces any typed
 * text: the placeholder shows again.
 */
export const Controlled: Story = {
  render: () => <ControlledPeriod />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Period From' });
    const status = canvas.getByRole('status');
    await expect(field).toHaveValue('2026-11-01');
    await userEvent.click(calendarButton(canvas));
    await waitFor(() => expect(day(canvas, 'Sunday 1 November 2026')).toHaveFocus());
    // 1 November 2026 is a Sunday, so End stays on it: choosing the chosen day again changes nothing.
    await userEvent.keyboard('{End}{Enter}');
    await expect(field).toHaveValue('2026-11-01');
    await expect(status).toHaveTextContent('Stored: "2026-11-01"');
    await userEvent.click(calendarButton(canvas));
    await userEvent.click(day(canvas, 'Monday 30 November 2026'));
    await expect(status).toHaveTextContent('Stored: "2026-11-30"');
    await expect(field).toHaveValue('2026-11-30');

    // Typed.
    await userEvent.clear(field);
    await userEvent.type(field, '2026-11-15');
    await userEvent.tab();
    await expect(status).toHaveTextContent('Stored: "2026-11-15"');
    await expect(field).toHaveValue('2026-11-15');
    // Not a date: '' is stored, and the text stays while the parent stores it.
    await userEvent.clear(field);
    await userEvent.type(field, 'mid-November');
    await userEvent.tab();
    await expect(status).toHaveTextContent('Stored: ""');
    await expect(field).toHaveValue('mid-November');
    await expect(field).toHaveAttribute('aria-invalid', 'true');

    // Reset from outside: the typed text and its error go.
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
    await expect(status).toHaveTextContent('Stored: none');
    await expect(field).toHaveValue('');
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

/** A value that isn't a real `yyyy-mm-dd` date counts as none: the placeholder shows, and nothing is submitted. */
export const InvalidValue: Story = {
  args: { defaultValue: '2026-02-30', name: 'startsAt' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    await expect(field).toHaveValue('');
    await expect(field).toHaveAttribute('placeholder', 'yyyy-mm-dd');
    await expect(field).not.toHaveAttribute('aria-invalid');
    await expect(canvasElement.querySelector('input[name="startsAt"]')).toHaveValue('');
  },
};

/** State=Error: `aria-invalid`, described by its message. Focused, it keeps the error colour at Focus's 2px. */
export const ErrorState: Story = {
  name: 'Error',
  args: {
    'aria-invalid': true,
    'aria-describedby': 'starts-error',
    required: true,
  },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <DateInput {...args} />
      <p id="starts-error" className="text-body-sm-regular text-accent-critical-outline-content-default">
        Choose a start date.
      </p>
    </div>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAttribute('aria-required', 'true');
    // Not the native `required`: the form's submit handler checks it.
    await expect(field).not.toHaveAttribute('required');
    await expect(field).toHaveAccessibleDescription('Choose a start date.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await expect(getComputedStyle(field).boxShadow).toContain(insetStroke(critical, 1));
    await userEvent.tab();
    await waitFor(() => expect(getComputedStyle(field).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/** State=Disabled: it can't be focused, typed in, opened or cleared. The disabled fill and stroke, the date and the icon in text.disabled, no opacity. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: '2026-09-01' },
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    const button = calendarButton(canvas);
    await expect(field).toBeDisabled();
    await expect(button).toBeDisabled();
    await userEvent.click(field);
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await expect(canvas.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument();
    const style = getComputedStyle(field);
    await expect(style.color).toBe(tokenColour('text-disabled'));
    await expect(style.backgroundColor).toBe(tokenColour('neutral-tonal-surface-disabled'));
    await expect(style.boxShadow).toContain(insetStroke(tokenColour('neutral-outline-border-disabled'), 1));
    await expect(style.opacity).toBe('1');
    await expect(getComputedStyle(button.querySelector('svg')!).color).toBe(tokenColour('text-disabled'));
  },
};

function ClearablePeriod() {
  const [to, setTo] = useState<string | null>('2026-11-30');
  return (
    <div className="flex flex-col items-start gap-3">
      <DateInput aria-label="Period To" value={to} onValueChange={setTo} today={SEP_24} />
      <DateInput aria-label="Starts At" defaultValue="2026-09-01" required today={SEP_24} />
      <p role="status" className="text-body-sm-regular text-text-secondary">
        Stored: {to === null ? 'none' : JSON.stringify(to)}
      </p>
    </div>
  );
}

/**
 * Figma's Show Clear: an optional field with text has a clear button (×,
 * "Clear date") before the calendar icon. It clears the date
 * (`onValueChange('')`), the placeholder comes back and focus returns to the
 * field. A required field, an empty one, a disabled one and an open one have
 * none. It shows as soon as the user types (Focus), and clears typed text
 * too, whether or not it is a date yet.
 */
export const Clear: Story = {
  render: () => <ClearablePeriod />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Period To' });
    const required = canvas.getByRole('combobox', { name: 'Starts At' });
    const status = canvas.getByRole('status');
    const clearButton = () => canvas.queryByRole('button', { name: 'Clear date' });
    // Only the optional field can be cleared.
    await expect(canvas.getAllByRole('button', { name: 'Clear date' })).toHaveLength(1);
    const clear = clearButton()!;

    // Button / Icon, Size=32, Tone=Ghost: before the icon, space.8 from it and from the text, centred.
    const f = field.getBoundingClientRect();
    const c = clear.getBoundingClientRect();
    const icon = canvas.getAllByRole('button', { name: 'Choose date' })[0].querySelector('svg')!.getBoundingClientRect();
    await expect([c.width, c.height]).toEqual([32, 32]);
    await expect(icon.left - c.right).toBe(8);
    await expect(c.left - textRight(field)).toBe(8);
    await expect(f.right - icon.right).toBe(12);
    await expect(c.top - f.top).toBe(4);
    await expect(getComputedStyle(clear).color).toBe(tokenColour('text-secondary'));
    await expect(clear.querySelector('svg')!.getBoundingClientRect().width).toBe(16);

    // It is a tab stop after the field (the calendar button isn't one).
    field.focus();
    await userEvent.tab();
    await expect(clear).toHaveFocus();

    // Open, the field has no clear button (Figma's Open draws none).
    await userEvent.click(canvas.getAllByRole('button', { name: 'Choose date' })[0]);
    await waitFor(() => expect(canvas.getByRole('dialog', { name: 'Period To' })).toBeInTheDocument());
    await expect(canvas.queryAllByRole('button', { name: 'Clear date' })).toHaveLength(0);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(field).toHaveFocus());

    // Clearing: the placeholder comes back, the stored value is '', and focus is on the field.
    await userEvent.click(clearButton()!);
    await expect(field).toHaveValue('');
    await expect(status).toHaveTextContent('Stored: ""');
    await expect(field).toHaveFocus();
    await expect(clearButton()).not.toBeInTheDocument();
    await expect(required).toHaveValue('2026-09-01');

    // Choosing a date brings it back. With none, the calendar opens on today's month.
    await userEvent.click(canvas.getAllByRole('button', { name: 'Choose date' })[0]);
    await userEvent.click(day(canvas, 'Wednesday 30 September 2026'));
    await expect(status).toHaveTextContent('Stored: "2026-09-30"');
    await expect(clearButton()).toBeInTheDocument();

    // After typing: the button shows with the first character (Focus, Show Clear), and clears
    // the unfinished text and the date. Pressing it doesn't check the text on the way.
    await userEvent.clear(field);
    await expect(clearButton()).not.toBeInTheDocument();
    await userEvent.type(field, '2026-1');
    await expect(clearButton()).toBeInTheDocument();
    await expect(textRight(field)).toBe(clearButton()!.getBoundingClientRect().left - 8);
    await userEvent.click(clearButton()!);
    await expect(field).toHaveValue('');
    await expect(field).toHaveFocus();
    await expect(field).not.toHaveAttribute('aria-invalid');
    await expect(status).toHaveTextContent('Stored: ""');

    // Text that isn't a date (Error, Show Clear): the button clears it and its error.
    await userEvent.type(field, 'tomorrow');
    await userEvent.keyboard('{Enter}');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(clearButton()!);
    await expect(field).toHaveValue('');
    await expect(field).not.toHaveAttribute('aria-invalid');
    await expect(clearButton()).not.toBeInTheDocument();
  },
};

/* ── A real form ───────────────────────────────────────────────────────────
   The date is submitted as yyyy-mm-dd under the field's name, picked or typed. */

function ReleaseForm() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);
  return (
    <form
      className="flex flex-col items-start gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <DateInput aria-label="Release Date" name="releaseDate" today={SEP_24} />
      <DateInput aria-label="Archive Date" name="archiveDate" today={SEP_24} />
      <DateInput aria-label="Created" name="created" defaultValue="2026-08-10" disabled today={SEP_24} />
      <Button type="submit">Save</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/**
 * With a `name`, the date reaches FormData as `yyyy-mm-dd`; none is "". A
 * disabled date input sends nothing. Enter on new text checks it and doesn't
 * submit. Text that isn't a date sends "", never the date it replaced.
 */
export const SubmitsWithForm: Story = {
  render: () => <ReleaseForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const release = canvas.getByRole('combobox', { name: 'Release Date' });
    const archive = canvas.getByRole('combobox', { name: 'Archive Date' });
    const output = canvas.getByTestId('submitted');
    await userEvent.click(canvas.getAllByRole('button', { name: 'Choose date' })[0]);
    await userEvent.click(day(canvas, 'Thursday 10 September 2026'));
    await expect(release).toHaveValue('2026-09-10');

    // Typed, then Enter: checked, not submitted.
    await userEvent.type(archive, '2026-10-01');
    await userEvent.keyboard('{Enter}');
    await expect(archive).toHaveValue('2026-10-01');
    await expect(output).toHaveTextContent('Nothing submitted yet');

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({
      releaseDate: '2026-09-10',
      archiveDate: '2026-10-01',
    });

    // Typed over with text that isn't a date: the old date isn't sent.
    await userEvent.clear(archive);
    await userEvent.type(archive, 'next year');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(JSON.parse(output.textContent!)).toEqual({ releaseDate: '2026-09-10', archiveDate: '' }));
    await expect(archive).toHaveValue('next year');
    await expect(archive).toHaveAttribute('aria-invalid', 'true');
  },
};

/* ── Typed text that isn't a date, in Light and Dark ───────────────────────
   State=Error from the field itself: the text as typed (text.primary), the
   critical stroke, the icon, and Show Clear's button to empty it. Back in the
   field, Error + Focus: the critical stroke at 2px. */

const typedError = (theme: 'light' | 'dark'): Story => ({
  name: `Typed, not a date — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { defaultValue: '2026-09-01' },
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  render: (args) => <Example {...args} />,
  play: async ({ canvasElement }) => {
    const want = {
      critical: tokenColour('accent-critical-outline-border-default'),
      fill: tokenColour('surface-elevated-secondary'),
      text: tokenColour('text-primary'),
      icon: tokenColour('text-subtle'),
      glyph: tokenColour('text-secondary'),
    };
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    await userEvent.clear(field);
    await userEvent.type(field, '2026-09-31');
    await userEvent.tab();

    await expect(field).toHaveAttribute('aria-invalid', 'true');
    const style = getComputedStyle(field);
    await expect(style.color).toBe(want.text);
    await expect(style.backgroundColor).toBe(want.fill);
    await expect(style.boxShadow).toContain(insetStroke(want.critical, 1));
    await expect(field.getBoundingClientRect().height).toBe(40);
    await expect(getComputedStyle(calendarButton(canvas).querySelector('svg')!).color).toBe(want.icon);
    const clear = canvas.getByRole('button', { name: 'Clear date' });
    await expect(getComputedStyle(clear).color).toBe(want.glyph);
    await expect(clear.getBoundingClientRect().left - textRight(field)).toBe(8);

    await userEvent.click(field);
    await waitFor(() => expect(getComputedStyle(field).boxShadow).toContain(insetStroke(want.critical, 2)));
    await expect(field).toHaveValue('2026-09-31');
  },
});

export const TypedErrorLight = typedError('light');
export const TypedErrorDark = typedError('dark');

/* ── The open calendar, in Light and Dark ─────────────────────────────────
   State=Open with Figma's Date Picker / Calendar under it. The field keeps
   Focus's stroke; the calendar draws its own surface, under the field. */

const open = (theme: 'light' | 'dark'): Story => ({
  name: `Open — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { defaultOpen: true, defaultValue: '2026-09-19' },
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      focused: tokenColour('stroke-focused'),
      panel: tokenColour('surface-elevated'),
      stroke: tokenColour('stroke-subtle'),
      selectedFill: tokenColour('action-primary-surface-default'),
      icon: tokenColour('text-subtle'),
    };
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    const dialog = canvas.getByRole('dialog', { name: 'Starts At' });
    const calendar = within(dialog).getByRole('group');

    // State=Open: aria-expanded and Focus's 2px stroke.focused stroke. defaultOpen doesn't move focus.
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(getComputedStyle(field).boxShadow).toContain(insetStroke(want.focused, 2));
    await expect(getComputedStyle(calendarButton(canvas).querySelector('svg')!).color).toBe(want.icon);
    await expect(field).not.toHaveFocus();

    // The dialog only places the calendar: no surface of its own.
    const panel = getComputedStyle(dialog);
    await expect(panel.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    // No elevation and no stroke (Popover's surface={false}).
    await expect(panel.boxShadow).toBe('none');
    await expect(panel.padding).toBe('0px');
    // Date Picker / Calendar: surface.neutral.faint, 1px stroke.subtle inside, radius 12, padding 16.
    const surface = getComputedStyle(calendar);
    await expect(surface.backgroundColor).toBe(want.panel);
    await expect(surface.boxShadow).toContain(insetStroke(want.stroke, 1));
    await expect(surface.borderRadius).toBe('12px');
    await expect(surface.padding).toBe('16px');
    await expect(canvas.getByText('September 2026')).toBeInTheDocument();
    await expect(getComputedStyle(day(canvas, 'Saturday 19 September 2026')).backgroundColor).toBe(want.selectedFill);

    // Under the field, space.4 away, flush left; Figma's 308 × 336 calendar.
    const f = field.getBoundingClientRect();
    const box = calendar.getBoundingClientRect();
    await expect(box.top - f.bottom).toBeCloseTo(4, 1);
    await expect(box.left).toBeCloseTo(f.left, 1);
    await expect([box.width, box.height]).toEqual([308, 336]);
  },
});

export const OpenLight = open('light');
export const OpenDark = open('dark');

/* State=Error + Open: Open's look with the critical stroke at 2px, the calendar under the field.
   An optional field with a date, but no Clear Button while open (Figma draws none). */
const errorOpen = (theme: 'light' | 'dark'): Story => ({
  name: `Error + Open — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { defaultOpen: true, defaultValue: '2026-09-19', 'aria-invalid': true },
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      critical: tokenColour('accent-critical-outline-border-default'),
      fill: tokenColour('surface-elevated-secondary'),
      text: tokenColour('text-primary'),
      icon: tokenColour('text-subtle'),
    };
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    const dialog = canvas.getByRole('dialog', { name: 'Starts At' });
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    const style = getComputedStyle(field);
    await expect(style.boxShadow).toContain(insetStroke(want.critical, 2));
    await expect(style.backgroundColor).toBe(want.fill);
    await expect(getComputedStyle(field).color).toBe(want.text);
    await expect(getComputedStyle(calendarButton(canvas).querySelector('svg')!).color).toBe(want.icon);
    await expect(canvas.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument();
    await expect(dialog).toHaveAttribute('data-placement', 'bottom');
  },
});

export const ErrorOpenLight = errorOpen('light');
export const ErrorOpenDark = errorOpen('dark');

/* ── Every State, in Light and Dark ────────────────────────────────────────
   The states of the Figma component set, with and without Show Clear;
   Error + Open has its own stories above (a second open calendar here would
   flip over the cells). Focus is forced with storybook-addon-pseudo-states
   (`:focus`, as typing in the field). Open is the calendar showing: first,
   with room kept under it, so the calendar opens downwards over empty space
   in any viewport. Each cell is checked against the variables Figma binds
   in that state. */

const FIELD = 'surface-elevated-secondary';
const DISABLED = 'neutral-tonal-surface-disabled';
/* `clear`: Figma's Show Clear, on by itself for an optional field with a date
   (closed and enabled). The Filled, Focus and Error cells are drawn both ways. */
const STATES = [
  {
    state: 'Open',
    props: { defaultOpen: true },
    text: 'text-subtle',
    fill: FIELD,
    icon: 'text-subtle',
    stroke: ['stroke-focused', 2],
    clear: false,
  },
  {
    state: 'Default',
    props: {},
    text: 'text-subtle',
    fill: FIELD,
    icon: 'text-subtle',
    stroke: ['stroke-field', 1],
    clear: false,
  },
  {
    state: 'Filled',
    props: { defaultValue: '2026-09-01', required: true },
    text: 'text-primary',
    fill: FIELD,
    icon: 'text-subtle',
    stroke: ['stroke-field', 1],
    clear: false,
  },
  {
    state: 'Filled, Show Clear',
    props: { defaultValue: '2026-09-01' },
    text: 'text-primary',
    fill: FIELD,
    icon: 'text-subtle',
    stroke: ['stroke-field', 1],
    clear: true,
  },
  {
    state: 'Focus',
    props: { defaultValue: '2026-09-01', required: true },
    text: 'text-primary',
    fill: FIELD,
    icon: 'text-subtle',
    stroke: ['stroke-focused', 2],
    clear: false,
  },
  {
    state: 'Focus, Show Clear',
    props: { defaultValue: '2026-09-01' },
    text: 'text-primary',
    fill: FIELD,
    icon: 'text-subtle',
    stroke: ['stroke-focused', 2],
    clear: true,
  },
  {
    state: 'Error',
    props: { defaultValue: '2026-09-01', 'aria-invalid': true, required: true },
    text: 'text-primary',
    fill: FIELD,
    icon: 'text-subtle',
    stroke: ['accent-critical-outline-border-default', 1],
    clear: false,
  },
  {
    state: 'Error, Show Clear',
    props: { defaultValue: '2026-09-01', 'aria-invalid': true },
    text: 'text-primary',
    fill: FIELD,
    icon: 'text-subtle',
    stroke: ['accent-critical-outline-border-default', 1],
    clear: true,
  },
  {
    state: 'Error + Focus',
    props: { defaultValue: '2026-09-01', 'aria-invalid': true },
    text: 'text-primary',
    fill: FIELD,
    icon: 'text-subtle',
    stroke: ['accent-critical-outline-border-default', 2],
    clear: true,
  },
  {
    state: 'Disabled',
    props: { disabled: true },
    text: 'text-disabled',
    fill: DISABLED,
    icon: 'text-disabled',
    stroke: ['neutral-outline-border-disabled', 1],
    clear: false,
  },
  {
    state: 'Disabled, filled',
    props: { disabled: true, defaultValue: '2026-09-01' },
    text: 'text-disabled',
    fill: DISABLED,
    icon: 'text-disabled',
    stroke: ['neutral-outline-border-disabled', 1],
    clear: false,
  },
] as const;

const forcedFocus = (state: string) => state === 'Focus' || state.startsWith('Focus,') || state === 'Error + Focus';

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {STATES.map(({ state, props }) => (
        <div
          key={state}
          className={'defaultOpen' in props ? 'flex flex-col gap-2 pb-96' : 'flex flex-col gap-2'}
          data-cell={state}
        >
          <span className="text-caption-md-medium text-text-secondary">{state}</span>
          <DateInput
            {...props}
            aria-label={`${state} field`}
            today={SEP_24}
            data-pseudo={forcedFocus(state) ? 'focus' : undefined}
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
    const glyph = tokenColour('text-secondary');
    const want = STATES.map(({ state, props, text, fill, icon, clear, stroke: [token, width] }) => ({
      state,
      open: 'defaultOpen' in props,
      filled: 'defaultValue' in props,
      text: tokenColour(text),
      fill: tokenColour(fill),
      icon: tokenColour(icon),
      clear,
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, open, filled, text, fill, icon, clear, stroke } of want) {
          const cell = canvasElement.querySelector<HTMLElement>(`[data-cell="${state}"]`)!;
          const field = cell.querySelector<HTMLInputElement>('input[role="combobox"]')!;
          const style = getComputedStyle(field);
          expect(style.backgroundColor).toBe(fill);
          // Disabled is its own tokens now, not Default at 50% opacity.
          expect(style.opacity).toBe('1');
          expect(style.boxShadow).toContain(stroke);
          expect(style.borderRadius).toBe('8px');
          // The text the cell shows: its date, or else the placeholder.
          expect(filled ? style.color : getComputedStyle(field, '::placeholder').color).toBe(text);
          const valueRight = textRight(field);
          // Icon / Calendar: CalendarBlank, 20px, text.subtle (text.disabled when disabled), 12px from the
          // right, centred in its 32 × 32 button ("Choose date", not a tab stop), which draws nothing.
          const f = field.getBoundingClientRect();
          const calendar = cell.querySelector<HTMLButtonElement>('button[aria-label="Choose date"]')!;
          const c = calendar.getBoundingClientRect();
          const svg = calendar.querySelector('svg')!;
          const box = svg.getBoundingClientRect();
          expect(getComputedStyle(svg).color).toBe(icon);
          expect(box.width).toBe(20);
          expect(f.right - box.right).toBe(12);
          expect(box.top - f.top).toBe(10);
          expect([c.width, c.height]).toEqual([32, 32]);
          expect(calendar.tabIndex).toBe(-1);
          expect(getComputedStyle(calendar).backgroundColor).toBe('rgba(0, 0, 0, 0)');
          expect(calendar.getAttribute('aria-expanded')).toBe(String(open));
          // Show Clear: the Clear Button (ghost 32, X in text.secondary) space.8 before the icon and
          // after the value. Without it, the icon is space.8 after the value.
          const button = cell.querySelector<HTMLButtonElement>('button[aria-label="Clear date"]');
          expect(button !== null).toBe(clear);
          if (button) {
            const b = button.getBoundingClientRect();
            expect([b.width, b.height]).toEqual([32, 32]);
            expect(box.left - b.right).toBe(8);
            expect(b.left - valueRight).toBe(8);
            expect(getComputedStyle(button).color).toBe(glyph);
          } else {
            expect(box.left - valueRight).toBe(8);
          }
          expect(f.height).toBe(40);
          expect(field.getAttribute('aria-expanded')).toBe(String(open));
          expect(cell.querySelector('[role="dialog"]') !== null).toBe(open);
          // Open: the calendar under the field, where the room was kept for it.
          if (open) expect(cell.querySelector('[role="dialog"]')!.getAttribute('data-placement')).toBe('bottom');
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
