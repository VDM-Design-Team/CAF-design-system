import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { DateInput } from './DateInput';

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
          'Built from the CAF Figma library, page **Form** (`_Date Input`): the field that picks one date. It opens ' +
          '`Date Picker / Calendar` (Calendar) under it in a Popover. Dates are `yyyy-mm-dd` strings, the format ' +
          'Figma’s placements show and what the form submits (`name`). Figma’s States: Default shows `placeholder` ' +
          '(“Select date”), Filled shows the date, Focus is `:focus-visible`, Error is `aria-invalid`, Disabled is ' +
          '`disabled`, Open is the calendar showing. The date is picked, not typed: click, Enter, Space, ↓ or ↑ open ' +
          'the calendar on the chosen day; its arrows, Home / End and Page Up / Page Down move; Enter chooses; Escape ' +
          'closes. Focus comes back to the field. It is a `<button role="combobox">`: name it with a ' +
          '`<label htmlFor>`, `aria-label` or `aria-labelledby`.',
      },
    },
  },
  args: {
    'aria-label': 'Starts At',
    today: SEP_24,
    onValueChange: fn(),
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
 * A click opens the calendar on today (nothing is chosen yet), with focus on it.
 * Choosing a day shows it as `yyyy-mm-dd` (Default → Filled), closes the
 * calendar and puts focus back on the field.
 */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    await expect(field).toHaveTextContent('Select date');
    await expect(field).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(field).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(field);
    const dialog = canvas.getByRole('dialog', { name: 'Starts At' });
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toHaveAttribute('aria-controls', dialog.id);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await waitFor(() => expect(day(canvas, 'Thursday 24 September 2026')).toHaveFocus());

    await userEvent.click(day(canvas, 'Tuesday 1 September 2026'));
    await expect(args.onValueChange).toHaveBeenCalledWith('2026-09-01');
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(field).toHaveTextContent('2026-09-01');
    await waitFor(() => expect(field).toHaveFocus());

    // Opening again shows the chosen day's month, on the chosen day.
    await userEvent.click(field);
    await waitFor(() => expect(day(canvas, 'Tuesday 1 September 2026')).toHaveFocus());
    await expect(day(canvas, 'Tuesday 1 September 2026').closest('[role="gridcell"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.keyboard('{Escape}');
  },
};

/**
 * Keyboard only. Enter, Space, ↓ and ↑ open the calendar on the chosen day.
 * The calendar's keys move (here: → a day, Page Down a month, Shift + Page Down
 * a year); Enter chooses and closes. Escape closes without choosing. Either way
 * focus comes back to the field. Tab past the calendar closes it and moves on.
 */
export const Keyboard: Story = {
  args: { defaultValue: '2026-09-19' },
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

    // Enter opens on the chosen day; → and Enter choose the next one.
    await userEvent.keyboard('{Enter}');
    await focusIs('Saturday 19 September 2026');
    await userEvent.keyboard('{ArrowRight}');
    await focusIs('Sunday 20 September 2026');
    await userEvent.keyboard('{Enter}');
    await closed();
    await expect(field).toHaveTextContent('2026-09-20');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-09-20');
    await waitFor(() => expect(field).toHaveFocus());

    // ↓ opens; Page Down moves a month; Escape closes without choosing.
    await userEvent.keyboard('{ArrowDown}');
    await focusIs('Sunday 20 September 2026');
    await userEvent.keyboard('{PageDown}');
    await focusIs('Tuesday 20 October 2026');
    await userEvent.keyboard('{Escape}');
    await closed();
    await expect(field).toHaveTextContent('2026-09-20');
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(field).toHaveFocus());

    // Space opens too; Shift + Page Down moves a year, and Space chooses.
    await userEvent.keyboard(' ');
    await focusIs('Sunday 20 September 2026');
    await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
    await focusIs('Monday 20 September 2027');
    await userEvent.keyboard(' ');
    await closed();
    await expect(field).toHaveTextContent('2027-09-20');
    await waitFor(() => expect(field).toHaveFocus());

    // ↑ opens; Tab from the days leaves the calendar: it closes, and focus moves on.
    await userEvent.keyboard('{ArrowUp}');
    await focusIs('Monday 20 September 2027');
    await userEvent.tab();
    await closed();
    await expect(canvas.getByRole('button', { name: 'Next' })).toHaveFocus();
    await expect(field).toHaveTextContent('2027-09-20');
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
    await userEvent.click(field);
    await waitFor(() => expect(day(canvas, 'Sunday 1 November 2026')).toHaveFocus());
    const elsewhere = canvas.getByRole('button', { name: 'Elsewhere' });
    await userEvent.click(elsewhere);
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(elsewhere).toHaveFocus();
    await expect(field).not.toHaveFocus();
    await expect(field).toHaveTextContent('2026-11-01');
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

function ControlledPeriod() {
  const [from, setFrom] = useState<string | null>('2026-11-01');
  return (
    <div className="flex flex-col items-start gap-3">
      <DateInput aria-label="Period From" value={from} onValueChange={setFrom} today={SEP_24} />
      <Button variant="outlined" onClick={() => setFrom(null)}>
        Reset
      </Button>
      <p role="status" className="text-body-sm-regular text-text-secondary">
        Stored: {from ?? 'none'}
      </p>
    </div>
  );
}

/** Controlled (`value` + `onValueChange`): the stored value is the `yyyy-mm-dd` string. `null` shows the placeholder again. */
export const Controlled: Story = {
  render: () => <ControlledPeriod />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Period From' });
    await expect(field).toHaveTextContent('2026-11-01');
    await userEvent.click(field);
    await waitFor(() => expect(day(canvas, 'Sunday 1 November 2026')).toHaveFocus());
    // 1 November 2026 is a Sunday, so End stays on it: choosing the chosen day again changes nothing.
    await userEvent.keyboard('{End}{Enter}');
    await expect(field).toHaveTextContent('2026-11-01');
    await expect(canvas.getByRole('status')).toHaveTextContent('Stored: 2026-11-01');
    await userEvent.click(field);
    await userEvent.click(day(canvas, 'Monday 30 November 2026'));
    await expect(canvas.getByRole('status')).toHaveTextContent('Stored: 2026-11-30');
    await expect(field).toHaveTextContent('2026-11-30');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
    await expect(field).toHaveTextContent('Select date');
    await expect(field).toHaveAttribute('data-placeholder');
  },
};

/** A value that isn't a real `yyyy-mm-dd` date counts as none: the placeholder shows, and nothing is submitted. */
export const InvalidValue: Story = {
  args: { defaultValue: '2026-02-30', name: 'startsAt' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox', { name: 'Starts At' })).toHaveTextContent('Select date');
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
    await expect(field).toHaveAccessibleDescription('Choose a start date.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await expect(getComputedStyle(field).boxShadow).toContain(insetStroke(critical, 1));
    await userEvent.tab();
    await waitFor(() => expect(getComputedStyle(field).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/** State=Disabled: it can't be focused or opened. The date shows in text.subtle, and the field is at Figma's 50% opacity. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: '2026-09-01' },
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Starts At' });
    await expect(field).toBeDisabled();
    await userEvent.click(field);
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await expect(getComputedStyle(field).color).toBe(tokenColour('text-subtle'));
    await expect(getComputedStyle(field).opacity).toBe('0.5');
  },
};

/* ── A real form ───────────────────────────────────────────────────────────
   The chosen date is submitted as yyyy-mm-dd under the field's name. */

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

/** With a `name`, the date reaches FormData as `yyyy-mm-dd`; none chosen is "". A disabled date input sends nothing. */
export const SubmitsWithForm: Story = {
  render: () => <ReleaseForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const release = canvas.getByRole('combobox', { name: 'Release Date' });
    await userEvent.click(release);
    await userEvent.click(day(canvas, 'Thursday 10 September 2026'));
    await expect(release).toHaveTextContent('2026-09-10');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const output = canvas.getByTestId('submitted');
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({
      releaseDate: '2026-09-10',
      archiveDate: '',
    });
  },
};

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
      panel: tokenColour('surface-neutral-faint'),
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
    await expect(getComputedStyle(field.querySelector('svg')!).color).toBe(want.icon);
    await expect(field).not.toHaveFocus();

    // The dialog only places the calendar: no surface of its own.
    const panel = getComputedStyle(dialog);
    await expect(panel.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    // No elevation and no stroke: Tailwind keeps its shadow layers, each at 0px.
    const layers = panel.boxShadow.split(/,(?![^(]*\))/);
    await expect(layers.every((layer) => layer.includes('0px 0px 0px 0px'))).toBe(true);
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

/* ── Every State, in Light and Dark ────────────────────────────────────────
   The six states of the Figma component set. Focus is forced with
   storybook-addon-pseudo-states (keyboard focus, :focus-visible). Open is
   the calendar showing: first, with room kept under it, so the calendar
   opens downwards over empty space in any viewport. Each cell is checked
   against the variables Figma binds in that state. */

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
    stroke: ['stroke-subtle', 1],
  },
  {
    state: 'Filled',
    props: { defaultValue: '2026-09-01' },
    text: 'text-primary',
    stroke: ['stroke-subtle', 1],
  },
  {
    state: 'Focus',
    props: { defaultValue: '2026-09-01' },
    text: 'text-primary',
    stroke: ['stroke-focused', 2],
  },
  {
    state: 'Error',
    props: { defaultValue: '2026-09-01', 'aria-invalid': true },
    text: 'text-primary',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  {
    state: 'Disabled',
    props: { disabled: true },
    text: 'text-subtle',
    stroke: ['stroke-subtle', 1],
  },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {STATES.map(({ state, props }) => (
        <div
          key={state}
          className={state === 'Open' ? 'flex flex-col gap-2 pb-96' : 'flex flex-col gap-2'}
          data-cell={state}
        >
          <span className="text-caption-md-medium text-text-secondary">{state}</span>
          <DateInput
            {...props}
            aria-label={`${state} field`}
            today={SEP_24}
            data-pseudo={state === 'Focus' ? 'focus-visible' : undefined}
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
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Focus on
  // STORY_RENDERED, which comes after play.
  afterEach: async ({ canvasElement }) => {
    const fill = tokenColour('surface-elevated-secondary');
    const icon = tokenColour('text-subtle');
    const want = STATES.map(({ state, props, text, stroke: [token, width] }) => ({
      state,
      open: 'defaultOpen' in props,
      text: tokenColour(text),
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, open, text, stroke } of want) {
          const cell = canvasElement.querySelector<HTMLElement>(`[data-cell="${state}"]`)!;
          const field = cell.querySelector<HTMLButtonElement>('[role="combobox"]')!;
          const style = getComputedStyle(field);
          expect(style.backgroundColor).toBe(fill);
          // Disabled: the whole field at Figma's 50% layer opacity.
          expect(style.opacity).toBe(state === 'Disabled' ? '0.5' : '1');
          expect(style.boxShadow).toContain(stroke);
          expect(style.borderRadius).toBe('8px');
          expect(getComputedStyle(field.querySelector('span')!).color).toBe(text);
          // Icon / Calendar: CalendarBlank, 20px, text.subtle, space.8 after the value.
          const svg = field.querySelector('svg')!;
          expect(getComputedStyle(svg).color).toBe(icon);
          expect(svg.getBoundingClientRect().width).toBe(20);
          expect(svg.getBoundingClientRect().left - field.querySelector('span')!.getBoundingClientRect().right).toBe(8);
          expect(field.getBoundingClientRect().height).toBe(40);
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
