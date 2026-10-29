import * as React from 'react';
import { cn } from '../../lib/cn';
import { DatePickerDay } from '../date-picker-day';
import { Icon, type IconName } from '../icon';
import {
  addDays,
  addMonths,
  compareDays,
  dayKey,
  dayLabel,
  monthLabel,
  monthWeeks,
  parseDayKey,
  sameDay,
  sameMonth,
  startOfMonth,
  weekday,
  WEEKDAYS,
} from './dates';

/**
 * What Calendar and RangeCalendar share: the panel's surface, one month (the
 * inside of `Date Picker / Calendar`) and the grid's keyboard. Not exported
 * from the package.
 */

/**
 * `Date Picker / Calendar`'s and `/ Range`'s panel:
 * - Fill   → `surface.neutral.faint`
 * - Stroke → 1px inside `stroke.subtle` (an inset ring)
 * - Radius → `radius.12` (Figma: raw 12)
 * - Effect → `shadow-elevation-3` (Figma: the Elevation Dark/3 style), as on Popover
 */
export const calendarSurface =
  'rounded-12 bg-surface-neutral-faint text-text-primary shadow-elevation-3 inset-ring inset-ring-stroke-subtle';

/* ── Keyboard: one tab stop per calendar, arrows move the focus ─────────────── */

export interface CalendarGrid {
  /** The `dayKey` of the one day in the tab order. */
  tabStop: string;
  /** Arrows, Home / End and Page Up / Page Down, on each month's grid. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  /** A day's ref, so focus can move to it once it has rendered. */
  register: (key: string) => (el: HTMLButtonElement | null) => void;
  /** Keeps the tab stop on the day the user last focused or clicked. */
  onDayFocus: (day: Date) => void;
}

/**
 * Roving focus over the days of the visible months (WAI-ARIA grid and date
 * picker patterns). Only one day is in the tab order:
 * the focused day if it's visible, else the first visible of `preferred`
 * (the selection, then today), else the 1st of the first month.
 *
 * - ← / → a day, ↑ / ↓ a week, Home / End the week's Monday / Sunday.
 * - Page Up / Page Down the same day a month back / on (Shift: a year),
 *   clamped to the month's length.
 * - When the day is outside the visible months, the view follows it: the
 *   new day is in the first month when moving back, the last when moving on.
 * - Enter and Space are the day button's own click.
 */
export function useCalendarGrid({
  months,
  setFirstMonth,
  preferred,
}: {
  /** The 1st of each visible month, in order. */
  months: Date[];
  /** Move the view so it starts on this month. */
  setFirstMonth: (month: Date) => void;
  /** Where the tab stop goes before the user has moved it. */
  preferred: (Date | null | undefined)[];
}): CalendarGrid {
  const [focused, setFocused] = React.useState<Date | null>(null);
  const cells = React.useRef(new Map<string, HTMLButtonElement>());
  /* The day to focus once it has rendered: after a month change, it's a new button. */
  const pending = React.useRef<string | null>(null);

  React.useLayoutEffect(() => {
    const key = pending.current;
    if (!key) return;
    pending.current = null;
    cells.current.get(key)?.focus();
  });

  const visible = (d: Date) => months.some((m) => sameMonth(m, d));
  const stop = [focused, ...preferred].find((d): d is Date => Boolean(d) && visible(d as Date)) ?? months[0];

  const moveTo = (target: Date) => {
    if (!visible(target)) {
      setFirstMonth(
        compareDays(target, months[0]) < 0 ? startOfMonth(target) : startOfMonth(addMonths(target, 1 - months.length)),
      );
    }
    pending.current = dayKey(target);
    setFocused(target);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = (event.target as HTMLElement).closest<HTMLElement>('[data-date]')?.dataset.date;
    const from = key ? parseDayKey(key) : stop;
    let to: Date;
    switch (event.key) {
      case 'ArrowLeft':
        to = addDays(from, -1);
        break;
      case 'ArrowRight':
        to = addDays(from, 1);
        break;
      case 'ArrowUp':
        to = addDays(from, -7);
        break;
      case 'ArrowDown':
        to = addDays(from, 7);
        break;
      case 'Home':
        to = addDays(from, -weekday(from));
        break;
      case 'End':
        to = addDays(from, 6 - weekday(from));
        break;
      case 'PageUp':
        to = addMonths(from, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        to = addMonths(from, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    moveTo(to);
  };

  const register = (key: string) => (el: HTMLButtonElement | null) => {
    if (el) cells.current.set(key, el);
    else cells.current.delete(key);
  };

  return { tabStop: dayKey(stop), onKeyDown, register, onDayFocus: setFocused };
}

/* ── One month: header, weekdays, six weeks of days ─────────────────────────── */

/* Figma's Icon / Previous Month and Icon / Next Month: a 20px caret in
   text.secondary, no frame. In code it's a button the size of the glyph. */
function MonthButton({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-4 text-text-secondary',
        // Figma has no Focus state; the ring is stroke.focused, as on Button.
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
      )}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}

export interface DayState {
  selected?: boolean;
  inRange?: boolean;
}

export interface CalendarMonthProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The 1st of the month to show. */
  month: Date;
  today: Date;
  grid: CalendarGrid;
  /** Selected and In Range, for a day of this month. */
  dayState: (day: Date) => DayState;
  onPick: (day: Date) => void;
  /** Shows the ‹ button. */
  onPrevious?: () => void;
  /** Shows the › button. */
  onNext?: () => void;
}

/**
 * The inside of `Date Picker / Calendar`: vertical auto layout, padding 16,
 * gap 12 (raw) → `p-4 gap-3`.
 * - Month Header: ‹, Month (Body/sm-semibold, `text.primary`) and ›, space
 *   between. The month is a polite live region, so paging is announced.
 * - Weekdays: Mo … Su, 36×24 each, 4 apart, Caption/md-medium in `text.subtle`.
 * - Days: six weeks of DatePickerDays, 4 apart both ways.
 *
 * It's an ARIA grid, labelled by the month: the weekdays are its column
 * headers (read as "Monday"…), each day a gridcell holding its button.
 * `aria-selected` marks the selection; neighbouring months' days are
 * disabled.
 */
export const CalendarMonth = React.forwardRef<HTMLDivElement, CalendarMonthProps>(function CalendarMonth(
  { month, today, grid, dayState, onPick, onPrevious, onNext, className, ...props },
  ref,
) {
  const headingId = React.useId();
  return (
    <div ref={ref} className={cn('flex w-fit flex-col gap-3 p-4', className)} {...props}>
      <div className="flex items-center justify-between">
        {onPrevious && <MonthButton icon="caret-left" label="Previous month" onClick={onPrevious} />}
        <span id={headingId} aria-live="polite" className="text-body-sm-semibold text-text-primary">
          {monthLabel(month)}
        </span>
        {onNext && <MonthButton icon="caret-right" label="Next month" onClick={onNext} />}
      </div>
      <div role="grid" aria-labelledby={headingId} className="flex flex-col gap-3" onKeyDown={grid.onKeyDown}>
        <div role="row" className="flex gap-1">
          {WEEKDAYS.map(({ short, long }) => (
            <div
              key={short}
              role="columnheader"
              className="flex h-6 w-9 items-center justify-center text-caption-md-medium text-text-subtle"
            >
              <span aria-hidden="true">{short}</span>
              <span className="sr-only">{long}</span>
            </div>
          ))}
        </div>
        <div role="rowgroup" className="flex flex-col gap-1">
          {monthWeeks(month).map((week) => (
            <div key={dayKey(week[0])} role="row" className="flex gap-1">
              {week.map((day) => {
                const key = dayKey(day);
                const inMonth = sameMonth(day, month);
                const { selected = false, inRange = false } = inMonth ? dayState(day) : {};
                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-selected={inMonth ? selected || inRange : undefined}
                    aria-disabled={inMonth ? undefined : true}
                  >
                    <DatePickerDay
                      ref={inMonth ? grid.register(key) : undefined}
                      data-date={inMonth ? key : undefined}
                      tabIndex={inMonth && key === grid.tabStop ? 0 : -1}
                      outsideMonth={!inMonth}
                      today={sameDay(day, today)}
                      selected={selected}
                      inRange={inRange}
                      aria-label={dayLabel(day)}
                      onClick={() => onPick(day)}
                      onFocus={() => grid.onDayFocus(day)}
                    >
                      {day.getDate()}
                    </DatePickerDay>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
