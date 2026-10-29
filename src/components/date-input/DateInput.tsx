import * as React from 'react';
import { cn } from '../../lib/cn';
import { Calendar } from '../calendar';
import { dayKey, parseDayKey } from '../calendar/dates';
import { useFormField, useFormFieldControl } from '../form-field';
import { Icon } from '../icon';
import { Popover } from '../popover';

/**
 * DateInput — built from the CAF Figma library, page "Form": `_Date Input`
 * (State, with a Value), the field that picks one date. It opens
 * `Date Picker / Calendar` (Calendar) under it, in a Popover, as Figma's
 * description says ("opens Date Picker / Calendar"). Form / Field – Date
 * puts it under a label (Starts At, Ends At, Period From, Release Date…).
 *
 * Figma → code:
 * - State=Default  → no `value`: the `placeholder` shows ("Select date",
 *   Figma's default Value), in text/subtle.
 * - State=Filled   → a `value`, in text/primary.
 * - State=Focus    → `:focus-visible`: a 2px stroke/focused stroke inside the edge.
 * - State=Error    → `aria-invalid`: the accent/critical/outline border.
 * - State=Disabled → the native `disabled` attribute: Default's look at
 *   Figma's 50% layer opacity.
 * - State=Open     → the calendar showing (`open`, `aria-expanded`): Focus's 2px stroke.
 * - Value          → the chosen date as `yyyy-mm-dd`, the format every Figma
 *   placement shows (2026-09-01, 2026-11-30, 2026-08-10).
 * - Icon / Calendar → Icon `calendar-blank`, 20px, text/subtle.
 *
 * Dates are ISO `yyyy-mm-dd` strings, as `<input type="date">` takes them:
 * `value` / `defaultValue`, `onValueChange`, and what the form submits. They
 * are local calendar days; nothing goes through `toISOString()`. A string
 * that isn't a real date counts as no date.
 *
 * The date is picked in the calendar, not typed: Figma draws a picker
 * ("Select date", like the dropdown), and every CAF date is near today.
 * The calendar's keys reach a far date quickly (Page Up / Page Down a
 * month, with Shift a year).
 *
 * It is a `<button role="combobox" aria-haspopup="dialog">`, like
 * SelectTrigger, whose look it shares. The calendar is a non-modal dialog.
 * - Closed: a click, Enter, Space, ↓ or ↑ open the calendar, with focus on
 *   the chosen day (else today, else the 1st).
 * - Open: the calendar's own keys (arrows, Home / End, Page Up / Page Down).
 *   Enter, Space or a click chooses the day, closes the calendar and puts
 *   focus back on the field. Escape closes it without choosing, and focus
 *   comes back too. A click outside, or Tab past the calendar, closes it and
 *   leaves focus where the user put it.
 *
 * Name it: a `<label htmlFor>` (Form / Field – Date does this, with `id`),
 * `aria-label` or `aria-labelledby`. A combobox isn't named by its text (that
 * is its value). The calendar dialog takes the same name. Inside a FormField
 * (DateField is one) the field names it, and passes its message, error and
 * required on (`useFormFieldControl`). A button can't be `required`, so
 * `required` becomes `aria-required`.
 *
 * It fills its container's width, as the field places it; `className` styles
 * the wrapper that holds the field and its calendar (a width, say). Every
 * other prop goes to the button, and so does the ref.
 *
 * In a form: with a `name`, the chosen date is submitted under it as
 * `yyyy-mm-dd` (a hidden input; "" while none is chosen), so FormData picks it
 * up. A disabled date input submits nothing, like a native one. The browser
 * doesn't check a custom control's `required`: check it in the submit
 * handler and show the field's `error`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("DateInput").
 */
const dateInputClasses = [
  /* Every state: surface.elevated-secondary fill, radius 8, Body/sm-regular,
     12px sides, the value left and the icon right, space.8 apart. Figma is a
     fixed 40 high, so code is too. */
  'flex h-10 w-full min-w-0 cursor-pointer items-center gap-2 rounded-8 bg-surface-elevated-secondary px-3',
  'text-left text-body-sm-regular',
  /* State=Filled: the value in text.primary, a 1px stroke.subtle stroke inside
     the edge. State=Default: the placeholder in text.subtle. */
  'text-text-primary data-placeholder:text-text-subtle inset-ring inset-ring-stroke-subtle',
  /* State=Focus: a 2px stroke.focused stroke inside the edge, for keyboard
     focus. It replaces the browser's outline, which stays transparent so
     forced-colours mode still shows one. */
  'outline-hidden focus-visible:inset-ring-2 focus-visible:inset-ring-stroke-focused',
  /* State=Open: the same 2px stroke.focused stroke. */
  'aria-expanded:inset-ring-2 aria-expanded:inset-ring-stroke-focused',
  /* State=Error: the accent.critical.outline border. It keeps that colour when
     focused or open (at their 2px width), so the error stays visible. */
  'aria-invalid:inset-ring-accent-critical-outline-border-default',
  /* State=Disabled: the value, like the placeholder, in text.subtle, and the
     whole field at 50% opacity (Figma's layer opacity, raw 0.5). */
  'disabled:cursor-not-allowed disabled:text-text-subtle disabled:opacity-50',
];

/* The calendar draws its own surface (Date Picker / Calendar: radius 12,
   padding 16, Elevation 3), so the Popover's panel only positions it. */
const panelClasses = 'rounded-12 bg-transparent p-0 shadow-none inset-ring-0';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The local day a `yyyy-mm-dd` string names, or null when it isn't a real date ("2026-02-30"). */
function parseIsoDate(value: string | null | undefined) {
  if (!value || !ISO_DAY.test(value)) return null;
  const day = parseDayKey(value);
  return dayKey(day) === value ? day : null;
}

export interface DateInputProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'children'
> {
  /** Controlled: the chosen date as `yyyy-mm-dd`, or `null` for none (the placeholder shows). Pair with `onValueChange`. */
  value?: string | null;
  /** Uncontrolled: the date chosen at first, as `yyyy-mm-dd`. */
  defaultValue?: string | null;
  /** Called with the day the user chose, as `yyyy-mm-dd`, when it differs from the current one. */
  onValueChange?: (value: string) => void;
  /** The text shown while there is no date. Default "Select date", as in Figma. */
  placeholder?: string;
  /** Controlled: the calendar is showing (Figma State=Open). Pair with `onOpenChange`. */
  open?: boolean;
  /** Uncontrolled: start with the calendar showing. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The form field name. The chosen date is submitted under it as `yyyy-mm-dd` ("" for none). */
  name?: string;
  /** A date must be chosen: sets `aria-required` (a button has no `required`). FormField's `required` sets it too. */
  required?: boolean;
  /** The day the calendar draws as Today. Default: the real today; stories pin it. */
  today?: Date;
}

export const DateInput = React.forwardRef<HTMLButtonElement, DateInputProps>(function DateInput(ownProps, ref) {
  const field = useFormField();
  const {
    value,
    defaultValue = null,
    onValueChange,
    placeholder = 'Select date',
    open,
    defaultOpen = false,
    onOpenChange,
    name,
    form,
    disabled,
    required,
    today,
    className,
    id,
    type = 'button',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    onKeyDown,
    ...props
  } = useFormFieldControl(ownProps);

  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const date = parseIsoDate(value !== undefined ? value : uncontrolledValue);
  const iso = date ? dayKey(date) : '';

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolledOpen;

  const uid = React.useId();
  const triggerId = id ?? `${uid}-trigger`;
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

  /* The calendar's one tab stop: the chosen day, else today, else the 1st. */
  const focusCalendar = () => panelRef.current?.querySelector<HTMLElement>('[data-date][tabindex="0"]')?.focus();

  /* Opening moves focus into the calendar. Not on the first render: a field
     that starts open (`defaultOpen`) doesn't take focus from the page. */
  const wasOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen && !wasOpen.current) focusCalendar();
    wasOpen.current = isOpen;
  }, [isOpen]);

  /* Choosing closes the calendar; Popover puts focus back on the field. */
  const choose = (day: Date) => {
    const next = dayKey(day);
    if (next !== iso) {
      if (value === undefined) setUncontrolledValue(next);
      onValueChange?.(next);
    }
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    /* ↓ / ↑ (Alt too) open the calendar, or go into it when it is already open. */
    event.preventDefault();
    if (isOpen) focusCalendar();
    else setOpen(true);
  };

  const popover = (
    <Popover
      className={cn('flex w-full', className)}
      trigger={
        <button
          {...props}
          ref={ref}
          type={type}
          id={triggerId}
          role="combobox"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-required={required || undefined}
          data-placeholder={iso ? undefined : ''}
          onKeyDown={handleKeyDown}
          className={cn(dateInputClasses)}
        >
          <span className="min-w-0 flex-1 truncate">{iso || placeholder}</span>
          <Icon name="calendar-blank" size={20} className="text-text-subtle" />
        </button>
      }
      open={isOpen}
      onOpenChange={onPopoverOpenChange}
      panelRole="dialog"
      panelRef={panelRef}
      /* The calendar's name is the field's: its aria-label, its aria-labelledby, or the FormField's label. */
      label={ariaLabel}
      panelProps={{ 'aria-labelledby': ariaLabelledby ?? field?.labelId }}
      panelClassName={panelClasses}
    >
      <Calendar value={date} onChange={choose} today={today} />
    </Popover>
  );

  if (name === undefined) return popover;
  return (
    <>
      {popover}
      {/* What a form submits: the chosen date, under `name`. Disabled, like the field, so a disabled date input submits nothing. */}
      <input type="hidden" name={name} form={form} value={iso} disabled={disabled} />
    </>
  );
});
DateInput.displayName = 'DateInput';
