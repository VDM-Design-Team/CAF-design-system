import * as React from 'react';
import { cn } from '../../lib/cn';
import { CalendarMonth, calendarSurface, useCalendarGrid } from '../calendar/CalendarMonth';
import { addMonths, compareDays, sameDay, startOfDay, startOfMonth } from '../calendar/dates';

/**
 * RangeCalendar — built from the CAF Figma library, page "Form":
 * `Date Picker / Range`, two months side by side for picking a period (the
 * Select Period and Creation Date filters). Weeks start on Monday. It's the
 * panel only: a later filter puts it in a Popover.
 *
 * Figma → code:
 * - The panel → the Calendar's surface (`surface.neutral.faint`, 1px inside
 *   `stroke.subtle`, radius 12, Elevation 3), with padding 8 and 8 between
 *   the months.
 * - Month / Start, Month / End → two Calendar months without their own
 *   surface: `month` (default: the range start's month, else today's) and
 *   the one after it. ‹ sits on the first and › on the second, and they
 *   page both months together, calling `onMonthChange` with the first's 1st.
 * - The Day states → the range's start and end are Selected, the days
 *   between are In Range, `today` is Today, the neighbouring months' days
 *   are Outside Month.
 *
 * Picking takes two days: the first is the start (shown Selected on its
 * own), the second the end. They can come in either order; `onChange` gets
 * `{ start, end }` with start on or before end, at local midnight. Escape
 * drops a half-picked range. `value` controls the range; without it the
 * calendar keeps its own, starting at `defaultValue`.
 *
 * Keyboard: the days of both months are one tab stop. ← → ↑ ↓, Home / End
 * and Page Up / Page Down (Shift: by year) move the focus, across the two
 * months; the view pages when the focus leaves them.
 *
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("RangeCalendar").
 */
export interface DateRange {
  /** The first day, on or before `end`. */
  start: Date;
  /** The last day. The same as `start` for a one-day range. */
  end: Date;
}

export interface RangeCalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The selected range (controlled). `null` for none. */
  value?: DateRange | null;
  /** The range to start with, when `value` isn't set. */
  defaultValue?: DateRange | null;
  /** Called once both ends are picked, with start on or before end. */
  onChange?: (range: DateRange) => void;
  /** The first visible month (controlled): any day in it. The second is the month after. */
  month?: Date;
  /** The first month to show, when `month` isn't set. */
  defaultMonth?: Date;
  /** Called with the 1st of the first month when the view pages. */
  onMonthChange?: (month: Date) => void;
  /** The day drawn as Today. Default: the real today; stories pin it. */
  today?: Date;
}

export const RangeCalendar = React.forwardRef<HTMLDivElement, RangeCalendarProps>(function RangeCalendar(
  {
    value: valueProp,
    defaultValue = null,
    onChange,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    today: todayProp,
    className,
    onKeyDown,
    ...props
  },
  ref,
) {
  const today = startOfDay(todayProp ?? new Date());

  const [ownValue, setOwnValue] = React.useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : ownValue;
  /* The first day of a range being picked, until the second. */
  const [anchor, setAnchor] = React.useState<Date | null>(null);

  const [ownMonth, setOwnMonth] = React.useState(() => startOfMonth(defaultMonth ?? value?.start ?? today));
  const first = startOfMonth(monthProp ?? ownMonth);
  const second = addMonths(first, 1);
  const setMonth = (next: Date) => {
    if (monthProp === undefined) setOwnMonth(next);
    onMonthChange?.(next);
  };

  const grid = useCalendarGrid({
    months: [first, second],
    setFirstMonth: setMonth,
    preferred: [anchor, value?.start, value?.end, today],
  });

  /* What's drawn: the anchor alone while picking, else the range. */
  const shown = anchor ? { start: anchor, end: anchor } : value;
  const dayState = (day: Date) =>
    shown
      ? {
          selected: sameDay(day, shown.start) || sameDay(day, shown.end),
          inRange: compareDays(day, shown.start) > 0 && compareDays(day, shown.end) < 0,
        }
      : {};

  const pick = (day: Date) => {
    if (!anchor) {
      setAnchor(day);
      return;
    }
    const range = compareDays(day, anchor) < 0 ? { start: day, end: anchor } : { start: anchor, end: day };
    setAnchor(null);
    if (valueProp === undefined) setOwnValue(range);
    onChange?.(range);
  };

  return (
    <div
      ref={ref}
      role="group"
      className={cn(calendarSurface, 'flex w-fit gap-2 p-2', className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === 'Escape' && anchor) setAnchor(null);
      }}
      {...props}
    >
      <CalendarMonth
        month={first}
        today={today}
        grid={grid}
        dayState={dayState}
        onPick={pick}
        onPrevious={() => setMonth(addMonths(first, -1))}
      />
      <CalendarMonth
        month={second}
        today={today}
        grid={grid}
        dayState={dayState}
        onPick={pick}
        onNext={() => setMonth(addMonths(first, 1))}
      />
    </div>
  );
});
RangeCalendar.displayName = 'RangeCalendar';
