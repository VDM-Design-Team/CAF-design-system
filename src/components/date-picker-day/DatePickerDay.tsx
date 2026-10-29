import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * DatePickerDay — built from the CAF Figma library, page "Form":
 * `Date Picker / Day` (State, with a Day label), one 36×36 day in a
 * calendar. Use it through Calendar or RangeCalendar, which lay out the
 * month, work out each day's state and move focus with the keyboard.
 *
 * Figma → code:
 * - State=Default       → the button as it is.
 * - State=Today         → `today`: a 1px inside `stroke.focused` ring, and
 *   `aria-current="date"`. It adds to the other states.
 * - State=Selected      → `selected`: the `action.primary` fill and its
 *   content colour.
 * - State=In Range      → `inRange`: a `surface.base` fill, the days between
 *   a range's Selected ends.
 * - State=Outside Month → `outsideMonth`: a neighbouring month's day, drawn
 *   for context in `text.disabled`. It isn't a target, so the button is
 *   `disabled`. It wins over the other states.
 * - Day                 → `children`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md
 * ("DatePickerDay").
 */
export const datePickerDayVariants = cva(
  // Figma: 36×36, radius 6 (raw), the label centred, Body/sm-regular.
  'inline-flex size-9 shrink-0 items-center justify-center rounded-6 text-body-sm-regular',
  {
    variants: {
      state: {
        /* State=Default: no fill, text.primary. */
        default: 'text-text-primary',
        /* State=Selected: action.primary fill and its content colour. */
        selected: 'bg-action-primary-surface-default text-action-primary-content-default',
        /* State=In Range: surface.base fill, text.primary. */
        'in-range': 'bg-surface-base text-text-primary',
        /* State=Outside Month: no fill, text.disabled. */
        'outside-month': 'text-text-disabled',
      },
      /* State=Today: 1px inside stroke.focused, over whichever fill the day has. */
      today: { false: '', true: 'inset-ring inset-ring-stroke-focused' },
    },
    defaultVariants: { state: 'default', today: false },
  },
);

const interactive = [
  'cursor-pointer disabled:cursor-default',
  // Figma has no Hover or Focus state; the ring is stroke.focused, as on Button.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
];

export interface DatePickerDayProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Figma State=Today: today's date. Adds the ring to any other state. */
  today?: boolean;
  /** Figma State=Selected: the chosen date, or either end of a range. */
  selected?: boolean;
  /** Figma State=In Range: a day between a range's ends. */
  inRange?: boolean;
  /** Figma State=Outside Month: a neighbouring month's day. Inactive (`disabled`). */
  outsideMonth?: boolean;
}

export const DatePickerDay = React.forwardRef<HTMLButtonElement, DatePickerDayProps>(
  (
    { className, today = false, selected = false, inRange = false, outsideMonth = false, disabled, type = 'button', ...props },
    ref,
  ) => {
    const state = outsideMonth ? 'outside-month' : selected ? 'selected' : inRange ? 'in-range' : 'default';
    const isToday = today && !outsideMonth;
    return (
      <button
        ref={ref}
        type={type}
        disabled={outsideMonth || disabled}
        aria-current={isToday ? 'date' : undefined}
        className={cn(datePickerDayVariants({ state, today: isToday }), interactive, className)}
        {...props}
      />
    );
  },
);
DatePickerDay.displayName = 'DatePickerDay';
