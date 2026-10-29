/**
 * Plain Date maths for Calendar and RangeCalendar, with no date library.
 *
 * Every date is a local calendar day: the time of day is dropped
 * (`startOfDay`), and nothing goes through `toISOString()`, which shifts a
 * date across midnight for anyone east of UTC. Weeks start on Monday, as in
 * the CAF Figma library and the app. Names are English, as on the screens.
 */
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Monday first: Figma's weekday row reads Mo Tu We Th Fr Sa Su. */
export const WEEKDAYS = [
  { short: 'Mo', long: 'Monday' },
  { short: 'Tu', long: 'Tuesday' },
  { short: 'We', long: 'Wednesday' },
  { short: 'Th', long: 'Thursday' },
  { short: 'Fr', long: 'Friday' },
  { short: 'Sa', long: 'Saturday' },
  { short: 'Su', long: 'Sunday' },
] as const;

/** The day at local midnight. */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The 1st of the day's month. */
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** `n` days on (or back). `new Date(y, m, d + n)` rolls over months and years. */
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** How many days the month has: day 0 of the next month is this month's last. */
export const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/** The same day `n` months on, clamped to the month's length: 31 January + 1 is 28 (or 29) February. */
export function addMonths(d: Date, n: number) {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const y = first.getFullYear();
  const m = first.getMonth();
  return new Date(y, m, Math.min(d.getDate(), daysInMonth(y, m)));
}

/** The weekday's column: Monday 0 … Sunday 6. */
export const weekday = (d: Date) => (d.getDay() + 6) % 7;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** `yyyy-mm-dd` in local time: a stable key, and it sorts as dates do. */
export const dayKey = (d: Date) => `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The day a `dayKey` names. */
export function parseDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Negative, zero or positive as `a` is before, on or after `b` (days only). */
export const compareDays = (a: Date, b: Date) => startOfDay(a).getTime() - startOfDay(b).getTime();

export const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  Boolean(a && b && dayKey(a) === dayKey(b));

export const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/** Figma's Month label: "September 2026". */
export const monthLabel = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** A day's accessible name: "Saturday 19 September 2026". It contains the visible number. */
export const dayLabel = (d: Date) =>
  `${WEEKDAYS[weekday(d)].long} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/**
 * Six weeks of seven days, from the Monday on or before the 1st. Figma always
 * draws six rows, filling the rest with the neighbouring months' days, so a
 * calendar keeps its height as it pages.
 */
export function monthWeeks(month: Date): Date[][] {
  const first = startOfMonth(month);
  const start = addDays(first, -weekday(first));
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
}
