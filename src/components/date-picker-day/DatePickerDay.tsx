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
 *   `aria-current="date"`. It adds to Default and In Range.
 * - State=Selected      → `selected`: the `action.primary` fill and its
 *   content colour.
 * - State=Today + Selected → `today` and `selected`: Selected's look plus the
 *   Today Mark, a 1px ring inset 2px (radius 4) in the selected content
 *   colour `action.primary.content.default`, where Today's stroke.focused
 *   ring would vanish on the fill.
 * - State=In Range      → `inRange`: a `neutral.tonal.surface.default` fill,
 *   the days between a range's Selected ends.
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
        /* State=In Range: neutral.tonal.surface.default fill, text.primary. */
        'in-range': 'bg-neutral-tonal-surface-default text-text-primary',
        /* State=Outside Month: no fill, text.disabled. */
        'outside-month': 'text-text-disabled',
      },
      /* State=Today: drawn per state, below. */
      today: { false: '', true: '' },
    },
    compoundVariants: [
      /* State=Today: 1px inside stroke.focused, over the day's fill. */
      { state: ['default', 'in-range'], today: true, class: 'inset-ring inset-ring-stroke-focused' },
      /* State=Today + Selected: the Today Mark instead, a 1px action.primary.content.default
         ring inset 2px, radius 4. A pseudo-element, so the focus ring (the outline) still
         shows around the day. */
      {
        state: 'selected',
        today: true,
        class:
          'relative before:pointer-events-none before:absolute before:inset-0.5 before:rounded-4 before:border before:border-action-primary-content-default',
      },
    ],
    defaultVariants: { state: 'default', today: false },
  },
);

const interactive = [
  'cursor-pointer disabled:cursor-default',
  // Figma has no Hover or Focus state; the ring is stroke.focused, as on Button.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
];

export interface DatePickerDayProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Figma State=Today: today's date. Adds the ring to Default and In Range, the Today Mark to Selected (Today + Selected). */
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
