import * as React from 'react';
import { cn } from '../../lib/cn';
import { CalendarMonth, calendarSurface, useCalendarGrid } from './CalendarMonth';
import { addMonths, sameDay, startOfDay, startOfMonth } from './dates';

/**
 * Calendar — built from the CAF Figma library, page "Form":
 * `Date Picker / Calendar`, one month for picking a single date. Weeks start
 * on Monday, as in Figma and the app. It's the panel only: a later Date
 * field puts it in a Popover under its input.
 *
 * Figma → code:
 * - The panel → `surface.neutral.faint` fill, 1px inside `stroke.subtle`,
 *   radius 12, Elevation 3, padding 16, 12 between header, weekdays and
 *   days.
 * - Month (text property, "September 2026") → the visible month, from
 *   `month` / `defaultMonth` (default: the selected date's month, else
 *   today's). ‹ and › page it and call `onMonthChange` with its 1st.
 * - The Day instances' states → worked out per day: the chosen `value` is
 *   Selected, `today` is Today, the neighbouring months' days are Outside
 *   Month. It always shows six weeks, as Figma does.
 *
 * Choosing a day (click, Enter or Space) calls `onChange` with that day at
 * local midnight. `value` controls the selection; without it the calendar
 * keeps its own, starting at `defaultValue`.
 *
 * Keyboard: the days are one tab stop (the selected day, else today, else
 * the 1st). ← → ↑ ↓ move by day and week, Home / End to the week's Monday /
 * Sunday, Page Up / Page Down by month (Shift: by year). The view follows
 * the focus into another month.
 *
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("Calendar").
 */
export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The selected date (controlled). `null` for none. */
  value?: Date | null;
  /** The selected date to start with, when `value` isn't set. */
  defaultValue?: Date | null;
  /** Called with the day the user chose, at local midnight. */
  onChange?: (date: Date) => void;
  /** The visible month (controlled): any day in it. */
  month?: Date;
  /** The month to show first, when `month` isn't set. */
  defaultMonth?: Date;
  /** Called with the 1st of the month the calendar pages to. */
  onMonthChange?: (month: Date) => void;
  /** The day drawn as Today. Default: the real today; stories pin it. */
  today?: Date;
}

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    value: valueProp,
    defaultValue = null,
    onChange,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    today: todayProp,
    className,
    ...props
  },
  ref,
) {
  const today = startOfDay(todayProp ?? new Date());

  const [ownValue, setOwnValue] = React.useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : ownValue;

  const [ownMonth, setOwnMonth] = React.useState(() => startOfMonth(defaultMonth ?? value ?? today));
  const month = startOfMonth(monthProp ?? ownMonth);
  const setMonth = (next: Date) => {
    if (monthProp === undefined) setOwnMonth(next);
    onMonthChange?.(next);
  };

  const grid = useCalendarGrid({ months: [month], setFirstMonth: setMonth, preferred: [value, today] });

  const pick = (day: Date) => {
    if (valueProp === undefined) setOwnValue(day);
    onChange?.(day);
  };

  return (
    <CalendarMonth
      ref={ref}
      role="group"
      month={month}
      today={today}
      grid={grid}
      dayState={(day) => ({ selected: sameDay(day, value) })}
      onPick={pick}
      onPrevious={() => setMonth(addMonths(month, -1))}
      onNext={() => setMonth(addMonths(month, 1))}
      className={cn(calendarSurface, className)}
      {...props}
    />
  );
});
Calendar.displayName = 'Calendar';
