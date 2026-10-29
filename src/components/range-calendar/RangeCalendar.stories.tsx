import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { RangeCalendar } from './RangeCalendar';

/* Figma's frame: October and November 2026, 12–24 October picked. Today is off-screen, as in Figma. */
const OCT_12 = new Date(2026, 9, 12);
const OCT_24 = new Date(2026, 9, 24);
const SEP_24 = new Date(2026, 8, 24);

const meta = {
  title: 'Components/RangeCalendar',
  component: RangeCalendar,
  parameters: {
    // Dates aren't editable as controls: Storybook's date control sends a number.
    controls: { exclude: ['value', 'defaultValue', 'month', 'defaultMonth', 'today'] },
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Date Picker / Range`): two months for picking a period, ' +
          'as in the Select Period and Creation Date filters. The start and end are Selected, the days between In Range. ' +
          'Picking takes two days, in either order; `onChange` gets `{ start, end }`, and Escape drops a half-picked ' +
          'range. ‹ / › page both months together. The days of both months are one tab stop, with the Calendar’s keys. ' +
          'The panel only; a filter will put it in a Popover.',
      },
    },
  },
  args: { defaultValue: { start: OCT_12, end: OCT_24 }, today: SEP_24, onChange: fn(), onMonthChange: fn() },
} satisfies Meta<typeof RangeCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;
/* A day of one month's grid: the neighbouring month's copy of it is a different, disabled button. */
const month = (canvas: Canvas, name: string) => within(canvas.getByRole('grid', { name }));
const day = (canvas: Canvas, name: string) => {
  const [, , monthName, year] = name.split(' ');
  return month(canvas, `${monthName} ${year}`).getByRole('button', { name });
};
const selected = (canvas: Canvas, name: string) =>
  day(canvas, name).closest('[role="gridcell"]')!.getAttribute('aria-selected');

/**
 * Two days make a range, in either order. The first is shown Selected on its
 * own until the second; Escape drops it, and the last range comes back.
 */
export const Playground: Story = {
  args: { defaultValue: null, defaultMonth: OCT_12 },
  play: async ({ args, canvas }) => {
    await userEvent.click(day(canvas, 'Monday 12 October 2026'));
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(selected(canvas, 'Monday 12 October 2026')).toBe('true');

    /* An earlier second day becomes the start. */
    await userEvent.click(day(canvas, 'Friday 9 October 2026'));
    await expect(args.onChange).toHaveBeenLastCalledWith({ start: new Date(2026, 9, 9), end: new Date(2026, 9, 12) });
    for (const d of ['Friday 9', 'Saturday 10', 'Sunday 11', 'Monday 12']) {
      await expect(selected(canvas, `${d} October 2026`)).toBe('true');
    }
    await expect(selected(canvas, 'Tuesday 13 October 2026')).toBe('false');

    /* Across the two months. */
    await userEvent.click(day(canvas, 'Wednesday 28 October 2026'));
    await expect(selected(canvas, 'Friday 9 October 2026')).toBe('false');
    await userEvent.click(day(canvas, 'Tuesday 3 November 2026'));
    await expect(args.onChange).toHaveBeenLastCalledWith({ start: new Date(2026, 9, 28), end: new Date(2026, 10, 3) });
    await expect(selected(canvas, 'Sunday 1 November 2026')).toBe('true');

    /* Escape drops a half-picked range. */
    await userEvent.click(day(canvas, 'Friday 20 November 2026'));
    await userEvent.keyboard('{Escape}');
    await expect(selected(canvas, 'Friday 20 November 2026')).toBe('false');
    await expect(selected(canvas, 'Wednesday 28 October 2026')).toBe('true');
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

/* ── Figma's frame, in Light and Dark ──────────────────────────────────────
   The panel, both months' headers and each Day state checked against their
   bound variables, plus Figma's sizes. */

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
/* The box-shadow that utility classes compose to (see Calendar's stories). */
function utilityShadow(className: string) {
  const probe = document.createElement('div');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).boxShadow;
  probe.remove();
  return value;
}

const frame = (theme: 'light' | 'dark'): Story => ({
  name: `October–November 2026 — ${theme === 'light' ? 'Light' : 'Dark'}`,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvas }) => {
    const want = {
      panel: tokenColour('surface-neutral-faint'),
      shadow: utilityShadow('shadow-elevation-3 inset-ring inset-ring-stroke-subtle'),
      primary: tokenColour('text-primary'),
      secondary: tokenColour('text-secondary'),
      disabled: tokenColour('text-disabled'),
      selectedFill: tokenColour('action-primary-surface-default'),
      selectedText: tokenColour('action-primary-content-default'),
      rangeFill: tokenColour('surface-base'),
    };
    const panel = canvas.getByRole('group');
    const [start, end] = [canvas.getByText('October 2026'), canvas.getByText('November 2026')];
    const previous = canvas.getByRole('button', { name: 'Previous month' });
    const next = canvas.getByRole('button', { name: 'Next month' });
    const ends = [day(canvas, 'Monday 12 October 2026'), day(canvas, 'Saturday 24 October 2026')];
    const between = [day(canvas, 'Tuesday 13 October 2026'), day(canvas, 'Friday 23 October 2026')];
    const after = day(canvas, 'Sunday 25 October 2026');
    const outside = month(canvas, 'October 2026').getByRole('button', { name: 'Sunday 1 November 2026' });
    await waitFor(() => {
      const p = getComputedStyle(panel);
      expect(p.backgroundColor).toBe(want.panel);
      expect(p.boxShadow).toBe(want.shadow);
      expect(p.borderRadius).toBe('12px');
      expect(p.padding).toBe('8px');
      for (const heading of [start, end]) expect(getComputedStyle(heading).color).toBe(want.primary);
      for (const caret of [previous, next]) expect(getComputedStyle(caret).color).toBe(want.secondary);
      for (const d of ends) {
        expect(getComputedStyle(d).backgroundColor).toBe(want.selectedFill);
        expect(getComputedStyle(d).color).toBe(want.selectedText);
      }
      for (const d of between) {
        expect(getComputedStyle(d).backgroundColor).toBe(want.rangeFill);
        expect(getComputedStyle(d).color).toBe(want.primary);
      }
      expect(getComputedStyle(after).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(outside).color).toBe(want.disabled);
    });

    /* Figma's layout: 8 padding and gap around two 308×336 months; ‹ on the first, › on the second. */
    const box = panel.getBoundingClientRect();
    await expect([box.width, box.height]).toEqual([640, 352]);
    await expect(canvas.getAllByRole('button', { name: /month$/ })).toHaveLength(2);
    await expect(previous.getBoundingClientRect().right).toBeLessThan(start.getBoundingClientRect().left);
    await expect(next.getBoundingClientRect().left).toBeGreaterThan(end.getBoundingClientRect().right);
    await expect(end.getBoundingClientRect().left - start.getBoundingClientRect().right).toBeLessThan(64);

    /* The range is the selection: both ends and the days between. Neighbouring days are inactive. */
    await expect(selected(canvas, 'Monday 12 October 2026')).toBe('true');
    await expect(selected(canvas, 'Thursday 15 October 2026')).toBe('true');
    await expect(selected(canvas, 'Sunday 25 October 2026')).toBe('false');
    await expect(outside).toBeDisabled();
    await expect(canvas.queryByRole('button', { current: 'date' })).toBeNull();
  },
});

export const OctoberNovemberLight = frame('light');
export const OctoberNovemberDark = frame('dark');

/* ── Keyboard ──────────────────────────────────────────────────────────── */

/**
 * Both months are one tab stop, on the range's start. The arrows cross from
 * one month into the other without paging; Page Up / Page Down page the view
 * when the focus leaves both. Enter picks, twice.
 */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ args, canvas, canvasElement }) => {
    const focusIs = (name: string) => waitFor(() => expect(day(canvas, name)).toHaveFocus());

    await expect(canvasElement.querySelectorAll('[role="gridcell"] button[tabindex="0"]')).toHaveLength(1);
    await expect(day(canvas, 'Monday 12 October 2026')).toHaveAttribute('tabindex', '0');
    /* Tab: ‹, then the one stop in the days. */
    await userEvent.tab();
    await userEvent.tab();
    await focusIs('Monday 12 October 2026');

    /* Into November's grid: no paging. */
    await userEvent.keyboard('{End}');
    await focusIs('Sunday 18 October 2026');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await focusIs('Sunday 1 November 2026');
    await expect(canvas.getByText('October 2026')).toBeInTheDocument();
    await expect(args.onMonthChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowLeft}');
    await focusIs('Saturday 31 October 2026');
    await userEvent.keyboard('{ArrowRight}');
    await focusIs('Sunday 1 November 2026');

    /* Past November: the view pages by one, so December is the second month. */
    await userEvent.keyboard('{PageDown}');
    await focusIs('Tuesday 1 December 2026');
    await expect(canvas.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 10, 1));
    /* Back into November, still in view; then October, which pages back. */
    await userEvent.keyboard('{PageUp}');
    await focusIs('Sunday 1 November 2026');
    await userEvent.keyboard('{PageUp}');
    await focusIs('Thursday 1 October 2026');
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 9, 1));

    /* Enter picks the start, the arrows move, Space picks the end. */
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await focusIs('Saturday 3 October 2026');
    await userEvent.keyboard('[Space]');
    await expect(args.onChange).toHaveBeenCalledWith({ start: new Date(2026, 9, 1), end: new Date(2026, 9, 3) });
    await expect(selected(canvas, 'Friday 2 October 2026')).toBe('true');
  },
};

/** ‹ and › page both months together, by one. */
export const PagingWithTheButtons: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
    await expect(canvas.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 10, 1));
    await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }));
    await expect(canvas.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument();
    await expect(canvas.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
    /* Today (24 September) is in view now. */
    await expect(day(canvas, 'Thursday 24 September 2026')).toHaveAttribute('aria-current', 'date');
  },
};
