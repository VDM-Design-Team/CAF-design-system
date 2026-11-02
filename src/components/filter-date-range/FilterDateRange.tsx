import * as React from 'react';
import { cn } from '../../lib/cn';
import { sameDay } from '../calendar/dates';
import { FilterField, type FilterFieldDropdownProps } from '../filter-field';
import { Popover } from '../popover';
import { RangeCalendar, type DateRange } from '../range-calendar';

/**
 * FilterDateRange — built from the CAF Figma library, page "Filters":
 * `Filter / Field – Date range` (State Closed / Open), a period filter in a
 * list page's filter bar (Select Period, Creation Date, Announcements'
 * Filter Date). It is a `Filter / Field` Type=Dropdown with the calendar icon
 * that opens `Date Picker / Range` (RangeCalendar) under it (decision
 * add-filter-date-range).
 *
 * Figma → code:
 * - Field (Filter / Field, Type=Dropdown, CalendarBlank) → FilterField
 *   `type="dropdown"` with `icon` `calendar-blank` (the default). While no
 *   range is picked it shows `placeholder` ("Select Period") in text/subtle.
 * - Value ("12 Oct – 24 Oct 2026") → the range in the short format
 *   (decision period-field-width), from `formatDateRange`: "12–24 Oct 2026"
 *   in one month, "12 Oct – 24 Nov 2026" across months, "28 Dec 2026 – 3 Jan
 *   2027" across years, "12 Oct 2026" for one day.
 * - State=Closed / Open → `open` (or `defaultOpen`): the range picker showing.
 * - Date Picker / Range → RangeCalendar, space.4 under the field, flush left,
 *   on its own surface (a Popover with `surface={false}`). It flips above, or
 *   to the right edge, when there's no room.
 *
 * Picking: opening moves focus to the calendar (the range's start, else
 * today). The first day picked is the start and the second the end, in
 * either order; then the picker closes, focus comes back to the field, and
 * `onValueChange` gets `{ start, end }` (local midnight, start first).
 * Escape, a click outside or Tab past the calendar close it without changing
 * the range (a half-picked one is dropped).
 *
 * It is a `<button role="combobox" aria-haspopup="dialog">`, like DateInput:
 * named by `label` ("Period"), with the range (or the placeholder) as its
 * value. ↓ or ↑ open the picker, or go into it when it is open. The picker is
 * a non-modal dialog with the same name.
 *
 * It fills its container's width. `className` styles the wrapper that holds
 * the field and its picker (a width in the bar). Every other prop, and the
 * ref, go to the field's button.
 *
 * Every colour is the semantic variable the Figma layer is bound to, through
 * FilterField and RangeCalendar. Where code departs from Figma, the reason is
 * in docs/figma-sync.md ("FilterDateRange").
 */
export interface FilterDateRangeProps
  extends Omit<FilterFieldDropdownProps, 'type' | 'value' | 'defaultValue' | 'onChange' | 'role'> {
  /** The filter's name: the field's accessible name and the picker's ("Period"). */
  label: string;
  /** Shown in text/subtle while no range is picked ("Select Period"). Default: `label`. */
  placeholder?: string;
  /** Controlled: the picked range, or `null` for none. Pair with `onValueChange`. */
  value?: DateRange | null;
  /** Uncontrolled: the range picked at first. */
  defaultValue?: DateRange | null;
  /** Called once both ends are picked, with start on or before end, when the range differs from the current one. */
  onValueChange?: (range: DateRange) => void;
  /** Controlled: the picker is showing (Figma State=Open). Pair with `onOpenChange`. */
  open?: boolean;
  /** Uncontrolled: start with the picker showing. Focus stays where it is. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The day the calendar draws as Today. Default: the real today; stories pin it. */
  today?: Date;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A range in the filter field's short format (decision period-field-width): the
 * year once when both ends share it, the month once when they share that too.
 * "12–24 Oct 2026", "12 Oct – 24 Nov 2026", "28 Dec 2026 – 3 Jan 2027",
 * "12 Oct 2026".
 */
export function formatDateRange({ start, end }: DateRange) {
  const day = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  const year = end.getFullYear();
  if (start.getFullYear() !== year) return `${day(start)} ${start.getFullYear()} – ${day(end)} ${year}`;
  if (start.getMonth() !== end.getMonth()) return `${day(start)} – ${day(end)} ${year}`;
  if (start.getDate() !== end.getDate()) return `${start.getDate()}–${day(end)} ${year}`;
  return `${day(end)} ${year}`;
}

export const FilterDateRange = React.forwardRef<HTMLButtonElement, FilterDateRangeProps>(function FilterDateRange(
  {
    label,
    placeholder,
    icon = 'calendar-blank',
    value,
    defaultValue = null,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    today,
    className,
    disabled,
    onKeyDown,
    ...props
  },
  ref,
) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const range = value !== undefined ? value : uncontrolledValue;

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolledOpen;
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  /* Every open and close goes through here, Popover's included (click, Escape,
     a click outside, focus leaving). */
  const setOpen = (next: boolean) => {
    if (next === isOpen || (next && disabled)) return;
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  /* Popover gets a stable callback, so it doesn't re-add its listeners on every render. */
  const latestSetOpen = React.useRef(setOpen);
  React.useLayoutEffect(() => {
    latestSetOpen.current = setOpen;
  });
  const onPopoverOpenChange = React.useCallback((next: boolean) => latestSetOpen.current(next), []);

  /* The calendar's one tab stop: the range's start, else today, else the 1st. */
  const focusCalendar = () => panelRef.current?.querySelector<HTMLElement>('[data-date][tabindex="0"]')?.focus();

  /* Opening moves focus into the calendar. Not on the first render: a picker
     that starts open (`defaultOpen`) doesn't take focus from the page. */
  const wasOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen && !wasOpen.current) focusCalendar();
    wasOpen.current = isOpen;
  }, [isOpen]);

  /* Both ends picked: close. Popover puts focus back on the field. */
  const choose = (next: DateRange) => {
    if (!range || !sameDay(range.start, next.start) || !sameDay(range.end, next.end)) {
      if (value === undefined) setUncontrolledValue(next);
      onValueChange?.(next);
    }
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    /* ↓ / ↑ open the picker, or go into it when it is already open. */
    event.preventDefault();
    if (isOpen) focusCalendar();
    else setOpen(true);
  };

  return (
    <Popover
      className={cn('flex w-full', className)}
      trigger={
        <FilterField
          {...props}
          ref={ref}
          type="dropdown"
          role="combobox"
          label={label}
          icon={icon}
          placeholder={placeholder}
          disabled={disabled}
          value={range ? formatDateRange(range) : undefined}
          onKeyDown={handleKeyDown}
          /* The content-to-caret gap is space.12, not Filter / Field's 16, so a range fits the 256 field (docs/figma-sync.md). */
          className="gap-3"
        />
      }
      open={isOpen}
      onOpenChange={onPopoverOpenChange}
      panelRole="dialog"
      panelRef={panelRef}
      label={label}
      /* RangeCalendar draws its own surface (Date Picker / Range: radius 12, padding 8, Elevation 3). */
      surface={false}
    >
      <RangeCalendar value={range} today={today} onChange={choose} />
    </Popover>
  );
});
FilterDateRange.displayName = 'FilterDateRange';

/** Figma's State values: `open` false / true. */
export const FILTER_DATE_RANGE_STATES = ['closed', 'open'] as const;
