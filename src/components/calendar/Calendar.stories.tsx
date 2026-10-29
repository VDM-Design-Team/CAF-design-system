import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Calendar } from './Calendar';

/* Figma's frame: September 2026, the 19th Selected, the 24th Today. */
const SEP_19 = new Date(2026, 8, 19);
const SEP_24 = new Date(2026, 8, 24);

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: {
    // Dates aren't editable as controls: Storybook's date control sends a number.
    controls: { exclude: ['value', 'defaultValue', 'month', 'defaultMonth', 'today'] },
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Date Picker / Calendar`): one month for picking a date, ' +
          'weeks from Monday, always six rows. The chosen `value` is Selected, `today` is Today, and the neighbouring ' +
          'months’ days are Outside Month. ‹ / › page the month (`onMonthChange`); choosing a day calls `onChange`. ' +
          'The days are one tab stop: arrows move by day and week, Home / End to the week’s ends, Page Up / Page Down ' +
          'by month (Shift: year). The panel only; a Date field will put it in a Popover.',
      },
    },
  },
  args: { defaultValue: SEP_19, today: SEP_24, onChange: fn(), onMonthChange: fn() },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;
const day = (canvas: Canvas, name: string) => canvas.getByRole('button', { name });
const cell = (canvas: Canvas, name: string) => day(canvas, name).closest('[role="gridcell"]')!;

export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await expect(cell(canvas, 'Saturday 19 September 2026')).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(day(canvas, 'Monday 21 September 2026'));
    await expect(args.onChange).toHaveBeenCalledWith(new Date(2026, 8, 21));
    await expect(cell(canvas, 'Monday 21 September 2026')).toHaveAttribute('aria-selected', 'true');
    await expect(cell(canvas, 'Saturday 19 September 2026')).toHaveAttribute('aria-selected', 'false');
  },
};

/* ── Figma's frame, in Light and Dark ──────────────────────────────────────
   Every layer checked against the variable it's bound to: the panel, the
   month, the carets, the weekdays and each Day state, plus Figma's sizes. */

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
/* The box-shadow that utility classes compose to. Tailwind inlines a theme shadow into its
   utility, so `shadow-elevation-3` is GDL's Light Elevation 3 in both themes (docs/figma-sync.md,
   "Popover"): compare against the utilities, not the `--shadow-*` variable. */
function utilityShadow(className: string) {
  const probe = document.createElement('div');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).boxShadow;
  probe.remove();
  return value;
}

const frame = (theme: 'light' | 'dark'): Story => ({
  name: `September 2026 — ${theme === 'light' ? 'Light' : 'Dark'}`,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvas }) => {
    const want = {
      panel: tokenColour('surface-neutral-faint'),
      stroke: tokenColour('stroke-subtle'),
      shadow: utilityShadow('shadow-elevation-3 inset-ring inset-ring-stroke-subtle'),
      primary: tokenColour('text-primary'),
      secondary: tokenColour('text-secondary'),
      subtle: tokenColour('text-subtle'),
      disabled: tokenColour('text-disabled'),
      selectedFill: tokenColour('action-primary-surface-default'),
      selectedText: tokenColour('action-primary-content-default'),
      today: `${tokenColour('stroke-focused')} 0px 0px 0px 1px inset`,
    };
    const panel = canvas.getByRole('group');
    const month = canvas.getByText('September 2026');
    const previous = canvas.getByRole('button', { name: 'Previous month' });
    const next = canvas.getByRole('button', { name: 'Next month' });
    const monday = canvas.getByRole('columnheader', { name: 'Monday' });
    const outside = day(canvas, 'Monday 31 August 2026');
    const plain = day(canvas, 'Tuesday 1 September 2026');
    const selected = day(canvas, 'Saturday 19 September 2026');
    const today = day(canvas, 'Thursday 24 September 2026');
    await waitFor(() => {
      const p = getComputedStyle(panel);
      expect(p.backgroundColor).toBe(want.panel);
      expect(p.boxShadow).toContain(`${want.stroke} 0px 0px 0px 1px inset`);
      expect(p.boxShadow).toBe(want.shadow);
      expect(p.borderRadius).toBe('12px');
      expect(p.padding).toBe('16px');
      expect(getComputedStyle(month).color).toBe(want.primary);
      expect(getComputedStyle(month).fontWeight).toBe('600');
      expect(getComputedStyle(previous).color).toBe(want.secondary);
      expect(getComputedStyle(next).color).toBe(want.secondary);
      expect(getComputedStyle(monday).color).toBe(want.subtle);
      expect(getComputedStyle(outside).color).toBe(want.disabled);
      expect(getComputedStyle(plain).color).toBe(want.primary);
      expect(getComputedStyle(plain).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(selected).backgroundColor).toBe(want.selectedFill);
      expect(getComputedStyle(selected).color).toBe(want.selectedText);
      expect(getComputedStyle(today).boxShadow).toContain(want.today);
      expect(getComputedStyle(today).color).toBe(want.primary);
    });

    /* Figma's layout: 16 padding, a 20 header, 12 gaps, 36×24 weekdays, six weeks of 36 days 4 apart. */
    const box = panel.getBoundingClientRect();
    await expect([box.width, box.height]).toEqual([308, 336]);
    await expect(monday.getBoundingClientRect().height).toBe(24);
    await expect(next.getBoundingClientRect().width).toBe(20);
    await expect(plain.getBoundingClientRect().left - outside.getBoundingClientRect().left).toBe(40);
    await expect(canvas.getAllByRole('row')).toHaveLength(7);
    await expect(canvas.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(
      ['MoMonday', 'TuTuesday', 'WeWednesday', 'ThThursday', 'FrFriday', 'SaSaturday', 'SuSunday'],
    );

    /* States: Selected is the selected gridcell, Today is the current date, Outside Month is inactive. */
    await expect(cell(canvas, 'Saturday 19 September 2026')).toHaveAttribute('aria-selected', 'true');
    await expect(today).toHaveAttribute('aria-current', 'date');
    await expect(outside).toBeDisabled();
    await expect(day(canvas, 'Sunday 11 October 2026')).toBeDisabled();
    await expect(canvas.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument();
  },
});

export const SeptemberLight = frame('light');
export const SeptemberDark = frame('dark');

/* ── Behaviour ─────────────────────────────────────────────────────────── */

/**
 * ‹ and › page the month and report its 1st. The month is a polite live
 * region, so the change is announced. With neither the selection nor today
 * in view, the tab stop is the 1st.
 */
export const PagingWithTheButtons: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText('September 2026')).toHaveAttribute('aria-live', 'polite');
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByText('October 2026')).toBeInTheDocument();
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 9, 1));
    await expect(day(canvas, 'Thursday 1 October 2026')).toHaveAttribute('tabindex', '0');
    /* October 2026 starts on a Thursday: Monday to Wednesday are September's. */
    await expect(day(canvas, 'Monday 28 September 2026')).toBeDisabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }));
    await expect(canvas.getByText('August 2026')).toBeInTheDocument();
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 7, 1));
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/**
 * The days are one tab stop, on the selected day. Arrows move by day and
 * week, Home / End to the week's Monday / Sunday, Page Up / Page Down by
 * month. Leaving the month pages the view, and the heading follows. Moving
 * never chooses; Enter does.
 */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ args, canvas }) => {
    const focusIs = (name: string) => waitFor(() => expect(day(canvas, name)).toHaveFocus());

    /* Tab: ‹, ›, then the grid's one stop, the selected day. */
    await expect(day(canvas, 'Saturday 19 September 2026')).toHaveAttribute('tabindex', '0');
    await expect(day(canvas, 'Sunday 20 September 2026')).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Previous month' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    await focusIs('Saturday 19 September 2026');

    await userEvent.keyboard('{ArrowRight}');
    await focusIs('Sunday 20 September 2026');
    await userEvent.keyboard('{ArrowDown}');
    await focusIs('Sunday 27 September 2026');
    await userEvent.keyboard('{ArrowLeft}');
    await focusIs('Saturday 26 September 2026');
    await userEvent.keyboard('{ArrowUp}');
    await focusIs('Saturday 19 September 2026');
    await userEvent.keyboard('{Home}');
    await focusIs('Monday 14 September 2026');
    await userEvent.keyboard('{End}');
    await focusIs('Sunday 20 September 2026');
    await expect(day(canvas, 'Sunday 20 September 2026')).toHaveAttribute('tabindex', '0');

    /* Across the month's end: the view follows, and the heading changes. */
    await userEvent.keyboard('{ArrowDown}');
    await focusIs('Sunday 27 September 2026');
    await userEvent.keyboard('{ArrowDown}');
    await focusIs('Sunday 4 October 2026');
    await expect(canvas.getByText('October 2026')).toBeInTheDocument();
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 9, 1));

    /* Page Up / Page Down: the same day a month back / on. Shift: a year. */
    await userEvent.keyboard('{PageUp}');
    await focusIs('Friday 4 September 2026');
    await userEvent.keyboard('{PageDown}{PageDown}');
    await focusIs('Wednesday 4 November 2026');
    await expect(canvas.getByText('November 2026')).toBeInTheDocument();
    await userEvent.keyboard('{Shift>}{PageUp}{/Shift}');
    await focusIs('Tuesday 4 November 2025');

    /* Moving never chooses; Enter does. */
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenCalledWith(new Date(2025, 10, 4));
    await expect(cell(canvas, 'Tuesday 4 November 2025')).toHaveAttribute('aria-selected', 'true');
  },
};

/** Page Up / Page Down keep the day of the month, clamped to the shorter month: 31 January → 28 February. */
export const KeyboardClampsToTheMonth: Story = {
  args: { defaultValue: new Date(2026, 0, 31) },
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('January 2026')).toBeInTheDocument();
    day(canvas, 'Saturday 31 January 2026').focus();
    await userEvent.keyboard('{PageDown}');
    await waitFor(() => expect(day(canvas, 'Saturday 28 February 2026')).toHaveFocus());
    await userEvent.keyboard('{PageUp}');
    await waitFor(() => expect(day(canvas, 'Wednesday 28 January 2026')).toHaveFocus());
    /* Back across the year: ↑ from Monday 5 January is Monday 29 December 2025. */
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(day(canvas, 'Monday 26 January 2026')).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
    await waitFor(() => expect(day(canvas, 'Monday 29 December 2025')).toHaveFocus());
    await expect(canvas.getByText('December 2025')).toBeInTheDocument();
  },
};
