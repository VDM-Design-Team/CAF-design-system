import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { FilterDateRange, formatDateRange } from './FilterDateRange';

/* Figma's example (765:16278): October and November 2026, 12–24 October picked. Today pinned. */
const OCT_12 = new Date(2026, 9, 12);
const OCT_24 = new Date(2026, 9, 24);
const TODAY = new Date(2026, 9, 24);

const meta = {
  title: 'Components/FilterDateRange',
  component: FilterDateRange,
  parameters: {
    // Dates aren't editable as controls: Storybook's date control sends a number.
    controls: { exclude: ['value', 'defaultValue', 'today'] },
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Filters** (`Filter / Field – Date range`, State Closed / Open): a ' +
          '`Filter / Field` Type=Dropdown with the calendar icon that opens `Date Picker / Range` (RangeCalendar) under ' +
          'it. The field shows `placeholder` (“Select Period”) until a range is picked, then the range in the short ' +
          'format: “12–24 Oct 2026”, “12 Oct – 4 Nov 2026”. Opening moves focus into the calendar; two picks (either ' +
          'order) close it, focus comes back to the field and `onValueChange` gets `{ start, end }`. ↓ / ↑ open it from ' +
          'the field. It is a combobox named by `label`, like DateInput; `className` sets the wrapper’s width (256).',
      },
    },
  },
  args: { label: 'Period', placeholder: 'Select Period', today: TODAY, onValueChange: fn(), onOpenChange: fn() },
  render: (args) => (
    // Figma's field is 256 wide (the bar's slot); room below for the open picker (352).
    <div className="w-64 pb-96">
      <FilterDateRange {...args} />
    </div>
  ),
} satisfies Meta<typeof FilterDateRange>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;
/* A day of one month's grid: the neighbouring month's copy of it is a different, disabled button. */
const day = (canvas: Canvas, name: string) => {
  const [, , monthName, year] = name.split(' ');
  return within(canvas.getByRole('grid', { name: `${monthName} ${year}` })).getByRole('button', { name });
};

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

/**
 * Step 4 of pattern 02 with the pointer: the field opens the picker on October and November with focus on today;
 * the first day is the start, the second the end; then it closes, focus is back on the field, and the field reads
 * “12–24 Oct 2026”.
 */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Period' });
    await expect(field).toHaveTextContent('Select Period');
    await expect(field).toHaveAttribute('aria-haspopup', 'dialog');

    await userEvent.click(field);
    const picker = canvas.getByRole('dialog', { name: 'Period' });
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toHaveAttribute('aria-controls', picker.id);
    await expect(within(picker).getByRole('grid', { name: 'October 2026' })).toBeVisible();
    await expect(within(picker).getByRole('grid', { name: 'November 2026' })).toBeVisible();
    await waitFor(() => expect(day(canvas, 'Saturday 24 October 2026')).toHaveFocus());

    await userEvent.click(day(canvas, 'Saturday 24 October 2026'));
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // An earlier second day becomes the start.
    await userEvent.click(day(canvas, 'Monday 12 October 2026'));
    await expect(args.onValueChange).toHaveBeenLastCalledWith({ start: OCT_12, end: OCT_24 });
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(field).toHaveFocus();
    await expect(field).toHaveTextContent('12–24 Oct 2026');

    // Opening again shows the range, with focus on its start. The same range again calls nothing.
    await userEvent.click(field);
    await waitFor(() => expect(day(canvas, 'Monday 12 October 2026')).toHaveFocus());
    await userEvent.click(day(canvas, 'Monday 12 October 2026'));
    await userEvent.click(day(canvas, 'Saturday 24 October 2026'));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
  },
};

/**
 * From the keyboard: ↓ opens the picker and focus goes to today; ← × 12, Enter starts the range; → × 12, Enter ends
 * it. Escape closes the picker without changing the range, and focus comes back to the field.
 */
export const Keyboard: Story = {
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Period' });
    field.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(day(canvas, 'Saturday 24 October 2026')).toHaveFocus());
    await userEvent.keyboard('{ArrowLeft>12/}');
    await expect(day(canvas, 'Monday 12 October 2026')).toHaveFocus();
    await userEvent.keyboard('{Enter}{ArrowRight>12/}{Enter}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith({ start: OCT_12, end: OCT_24 });
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(field).toHaveFocus();

    // Enter opens it too; a half-picked range and Escape change nothing.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(day(canvas, 'Monday 12 October 2026')).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}{Enter}{Escape}');
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(field).toHaveFocus();
    await expect(field).toHaveTextContent('12–24 Oct 2026');
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
  },
};

/** Disabled: the field can’t be pressed or focused, and the picker never opens. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: { start: OCT_12, end: OCT_24 } },
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Period' });
    await expect(field).toBeDisabled();
    await userEvent.click(field, { pointerEventsCheck: 0 });
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

/* ── The short format, in the 256 field ───────────────────────────────────
   The decision (period-field-width) keeps the field at 256 and shortens the range.
   GDL's Body/sm-regular has 0.4px letter spacing, so code's text is wider than
   Figma's (147px for "12 Oct – 24 Oct 2026", where the field holds 144 with the
   12 gap): one month is written once, and the content-to-caret gap is space.12. */

const RANGES = [
  { start: OCT_12, end: OCT_24, text: '12–24 Oct 2026', fits: true },
  { start: new Date(2026, 9, 1), end: new Date(2026, 9, 31), text: '1–31 Oct 2026', fits: true },
  { start: OCT_12, end: new Date(2026, 10, 4), text: '12 Oct – 4 Nov 2026', fits: true },
  { start: OCT_12, end: OCT_12, text: '12 Oct 2026', fits: true },
  { start: new Date(2026, 8, 28), end: new Date(2026, 9, 31), text: '28 Sep – 31 Oct 2026', fits: false },
  { start: new Date(2026, 11, 28), end: new Date(2027, 0, 3), text: '28 Dec 2026 – 3 Jan 2027', fits: false },
];

/**
 * `formatDateRange` and the field: a range in one month (Figma’s 12–24 October, the decision’s 1–31 October) or a
 * short one across two fits the 256 field. A long cross-month or cross-year range is cut with an ellipsis; the
 * field’s value still holds all of it.
 */
export const Formats: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3">
      {RANGES.map(({ start, end, text }) => (
        <div key={text} className="w-64">
          <FilterDateRange label={`Period ${text}`} defaultValue={{ start, end }} today={TODAY} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    // The widths are Inter's: measure once it has loaded (without it, a fallback face, skip the fit check).
    await document.fonts.ready;
    const inter = [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Inter' && f.status === 'loaded');
    for (const { start, end, text, fits } of RANGES) {
      await expect(formatDateRange({ start, end })).toBe(text);
      const field = canvas.getByRole('combobox', { name: `Period ${text}` });
      await expect(field).toHaveTextContent(text);
      const value = field.querySelector<HTMLElement>('span > span')!;
      // Cut (an ellipsis) when the text is wider than its box.
      if (inter) await expect(value.scrollWidth > value.clientWidth).toBe(!fits);
    }
  },
};

/* ── State=Closed and State=Open, in Light and Dark ────────────────────────
   Figma's example (765:16278): Closed, and Open with 12–24 October picked; plus the
   field before a range is picked (Select Period). Checked against the bindings: the
   field (Filter / Field with CalendarBlank) and where the picker sits. RangeCalendar's
   own stories check the picker's bindings. */

const states = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: (args) => (
    <div className="flex flex-col gap-6 pb-96">
      <div className="flex flex-wrap gap-6">
        <div className="w-64" data-state="placeholder">
          <FilterDateRange {...args} />
        </div>
        <div className="w-64" data-state="closed">
          <FilterDateRange {...args} label="Creation date" placeholder="Creation Date" defaultValue={{ start: OCT_12, end: OCT_24 }} />
        </div>
      </div>
      <div className="w-64" data-state="open">
        <FilterDateRange {...args} label="Release date" placeholder="Filter Date" defaultValue={{ start: OCT_12, end: OCT_24 }} defaultOpen />
      </div>
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-elevated-secondary'),
      stroke: tokenColour('stroke-field'),
      primary: tokenColour('text-primary'),
      subtle: tokenColour('text-subtle'),
      panel: tokenColour('surface-neutral-faint'),
    };
    const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.6);

    for (const [state, text] of [
      ['placeholder', 'Select Period'],
      ['closed', '12–24 Oct 2026'],
      ['open', '12–24 Oct 2026'],
    ]) {
      const cell = canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
      const field = within(cell).getByRole('combobox');
      const f = field.getBoundingClientRect();
      // Field: surface.elevated-secondary, 1px stroke.field inside, radius 8, 40 high, 256 wide.
      const style = getComputedStyle(field);
      await expect(style.backgroundColor).toBe(want.fill);
      await expect(style.boxShadow).toContain(`${want.stroke} 0px 0px 0px 1px inset`);
      await expect(style.borderRadius).toBe('8px');
      await expect([f.width, f.height]).toEqual([256, 40]);
      // CalendarBlank 24 from the left, the value 12 after it, the caret 24 from the right; icons in text.subtle.
      // The value is text.subtle until a range is picked, then text.primary.
      const [calendar, caret] = field.querySelectorAll('svg');
      const value = field.querySelector<HTMLElement>('span > span')!;
      await expect(value).toHaveTextContent(text);
      near(calendar.getBoundingClientRect().left - f.left, 24);
      near(value.getBoundingClientRect().left - calendar.getBoundingClientRect().right, 12);
      near(f.right - caret.getBoundingClientRect().right, 24);
      await expect(getComputedStyle(calendar).color).toBe(want.subtle);
      await expect(getComputedStyle(caret).color).toBe(want.subtle);
      await expect(getComputedStyle(value).color).toBe(state === 'placeholder' ? want.subtle : want.primary);
      // The content-to-caret gap is space.12 (Filter / Field's is 16): code's departure, so a range fits.
      await expect(style.columnGap).toBe('12px');
      await expect(field).toHaveAttribute('aria-expanded', String(state === 'open'));
      if (state !== 'open') continue;

      // Open: Date Picker / Range on its own surface, space.4 from the field, flush left. A short preview flips
      // it above the field, so either side counts. defaultOpen doesn't take focus.
      const picker = within(cell).getByRole('dialog', { name: 'Release date' });
      const panel = within(picker).getByRole('group');
      const p = panel.getBoundingClientRect();
      await expect(getComputedStyle(panel).backgroundColor).toBe(want.panel);
      await expect(getComputedStyle(panel).borderRadius).toBe('12px');
      await expect(getComputedStyle(picker).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      await expect(Math.abs(p.top - f.bottom - 4) < 0.6 || Math.abs(f.top - p.bottom - 4) < 0.6).toBe(true);
      near(p.left, f.left);
      await expect(field).not.toHaveFocus();
      await expect(within(picker).getAllByRole('grid')).toHaveLength(2);
      await expect(within(picker).getByRole('grid', { name: 'October 2026' })).toBeVisible();
    }
  },
});

export const StatesLight = states('light');
export const StatesDark = states('dark');
