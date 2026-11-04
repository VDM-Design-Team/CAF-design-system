import * as React from 'react';
import { cn } from '../../lib/cn';
import { Calendar } from '../calendar';
import { dayKey, parseDayKey } from '../calendar/dates';
import { useFormField, useFormFieldControl } from '../form-field';
import { Icon } from '../icon';
import { IconButton } from '../icon-button';
import { Popover } from '../popover';
import { TextInput, type TextInputProps } from '../text-input';

/**
 * DateInput — built from the CAF Figma library, page "Form": `_Date Input`
 * (State, with a Value), the field for one date. The date is typed or pasted
 * as `yyyy-mm-dd`, or picked in `Date Picker / Calendar` (Calendar), which
 * opens under it in a Popover. Figma's description: "opens Date Picker /
 * Calendar … A typed or pasted yyyy-mm-dd works as well as picking." Form /
 * Field – Date puts it under a label (Starts At, Ends At, Period From,
 * Release Date…).
 *
 * Figma → code (it is a native `<input>`, a TextInput, so most states are
 * the element's own):
 * - State=Default  → no date and no text: the `placeholder` shows, in
 *   text/subtle. It defaults to "yyyy-mm-dd", Figma's default Value since
 *   4 Nov 2026 (it was "Select date"), so the format shows before anything
 *   is typed.
 * - State=Filled   → a date (or typed text), in text/primary.
 * - State=Focus    → `:focus` (typing): a 2px stroke/focused stroke inside the edge.
 * - State=Error    → `aria-invalid`: the accent/critical/outline border. The
 *   field sets it itself while its typed text isn't a date (below).
 * - State=Disabled → the native `disabled` attribute: the disabled fill and
 *   stroke; the text and the icon in text/disabled.
 * - State=Open     → the calendar showing (`open`, `aria-expanded`): Focus's 2px stroke.
 * - Value          → the date as `yyyy-mm-dd`, the format every Figma
 *   placement shows (2026-09-01, 2026-11-30, 2026-08-10), or what the user
 *   is typing.
 * - Icon / Calendar → Icon `calendar-blank`, 20px, text/subtle, 12px from
 *   the right, as Figma draws it. Code makes it a button ("Choose date",
 *   32 × 32 around the glyph, no look of its own) that opens and closes the
 *   calendar. Like Combobox's caret it isn't a tab stop: ↓ / ↑ open the
 *   calendar from the field.
 * - Show Clear + Clear Button → on by itself for an optional field (not
 *   `required`) with text, while the calendar is closed and the field is
 *   enabled, as Figma draws it (Filled, Focus, Error). An IconButton (ghost,
 *   32, `x`, "Clear date") before the icon, space.8 from it and from the
 *   text. It clears the text and the date (`onValueChange('')`), the
 *   placeholder comes back, and focus goes back to the field.
 *
 * Typing. What the user types or pastes is checked on blur, on Enter and
 * when the calendar opens, strictly: `yyyy-mm-dd`, a real calendar day
 * ("2026-02-30" isn't), spaces around it ignored.
 * - A date becomes the value (`onValueChange`, when it differs) and shows as
 *   `yyyy-mm-dd`.
 * - Empty text clears the date, like the clear button.
 * - Anything else stays as typed, so it can be fixed. The field is
 *   `aria-invalid`, `onInvalidChange(true)` tells its owner (DateField shows
 *   "Enter a date as yyyy-mm-dd." under it), and the field holds no date
 *   (`onValueChange('')`), as a native date input reports none for text it
 *   can't read: a form never submits a date the field no longer shows.
 *   Fixing or clearing the text, or picking a day, ends it
 *   (`onInvalidChange(false)`).
 * There is no `min` / `max`: Figma has none, so any real day is accepted.
 *
 * It is the WAI-ARIA date picker combobox: an editable `<input
 * role="combobox" aria-haspopup="dialog">`, and the calendar is a non-modal
 * dialog.
 * - Closed: ↓ or ↑ (Alt too), Enter while there is no new text, or the
 *   calendar button open the calendar, with focus on the date (else today,
 *   else the 1st). A typed date is checked first, so the calendar opens on
 *   its month. A click in the field is for typing: it doesn't open the
 *   calendar (and closes an open one), and nor does typing.
 * - Open: the calendar's own keys (arrows, Home / End, Page Up / Page Down).
 *   Enter, Space or a click chooses the day, closes the calendar and puts
 *   focus back on the field. Escape closes it without choosing, and focus
 *   comes back with the text as it was. A click outside, or Tab past the
 *   calendar, closes it and leaves focus where the user put it.
 * - Enter with new text checks it instead, and doesn't submit the form.
 *
 * Name it: a `<label htmlFor>` (Form / Field – Date does this, with `id`),
 * `aria-label` or `aria-labelledby`. The calendar dialog takes the same
 * name. Inside a FormField (DateField is one) the field names it, and passes
 * its message, error and required on (`useFormFieldControl`). `required` is
 * `aria-required`, not the native attribute: the form's submit handler
 * checks it, as before.
 *
 * It fills its container's width, as the field places it; `className` styles
 * the wrapper that holds the field, its buttons and its calendar (a width,
 * say). Every other prop goes to the input, and so does the ref.
 *
 * In a form: with a `name`, the date is submitted under it as `yyyy-mm-dd`
 * (a hidden input; "" while there is none). The visible input has no name,
 * so typed text is never submitted. A disabled date input submits nothing,
 * like a native one.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("DateInput").
 */
const dateInputClasses = [
  /* TextInput is _Text Input: the same fill, stroke, radius, type, height and
     Default / Filled / Focus / Error / Disabled bindings as _Date Input.
     State=Open: Focus's 2px stroke.focused stroke. Error keeps its colour at
     that width (Error + Open). */
  'aria-expanded:inset-ring-2 aria-expanded:inset-ring-stroke-focused',
];

/* The text stops space.8 before what sits over the right padding: the icon
   (12px side + 20px icon + 8 = space.40), and the Clear Button when it shows
   (+ 32px button + 8 = space.80). */
const PADDING = { icon: 'pr-10', clear: 'pr-20' } as const;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The local day a `yyyy-mm-dd` string names, or null when it isn't a real date ("2026-02-30"). */
function parseIsoDate(value: string | null | undefined) {
  if (!value || !ISO_DAY.test(value)) return null;
  const day = parseDayKey(value);
  return dayKey(day) === value ? day : null;
}

/** `yyyy-mm-dd` for a real date, else '' (none). */
const isoOf = (value: string | null | undefined) => {
  const day = parseIsoDate(value);
  return day ? dayKey(day) : '';
};

interface DateInputBoxProps extends TextInputProps {
  /** The calendar button was pressed: open or close the calendar. */
  onCalendarClick: () => void;
}

/* The box: the input, with Figma's Icon / Calendar over its right padding as
   the calendar's button. Popover clones it as the trigger: the input takes
   the ARIA wiring, the ref and the handlers. */
const DateInputBox = React.forwardRef<HTMLInputElement, DateInputBoxProps>(function DateInputBox(
  { onCalendarClick, ...props },
  ref,
) {
  const { disabled } = props;
  return (
    <span className="relative flex w-full min-w-0">
      <TextInput ref={ref} {...props} />
      {/* Icon / Calendar: CalendarBlank 20 in text.subtle (text.disabled in State=Disabled), 12px from
          the right, centred, in a 32 × 32 button with no fill or hover look of its own (Figma draws
          an icon, not a Button / Icon). Not a tab stop: the field's ↓ / ↑ open the calendar. Pressing
          it doesn't take focus; opening moves focus into the calendar. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Choose date"
        aria-expanded={props['aria-expanded'] === true || props['aria-expanded'] === 'true'}
        disabled={disabled}
        className={cn(
          'absolute inset-y-0 right-1.5 my-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-8',
          'text-text-subtle disabled:cursor-not-allowed disabled:text-text-disabled',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
        )}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onCalendarClick}
      >
        <Icon name="calendar-blank" size={20} />
      </button>
    </span>
  );
});

export interface DateInputProps extends Omit<
  TextInputProps,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'role' | 'children' | 'min' | 'max' | 'readOnly'
> {
  /** Controlled: the date as `yyyy-mm-dd`, or `null` for none (the placeholder shows). Pair with `onValueChange`. */
  value?: string | null;
  /** Uncontrolled: the date at first, as `yyyy-mm-dd`. */
  defaultValue?: string | null;
  /**
   * Called with the date as `yyyy-mm-dd` when it changes: a day chosen in the
   * calendar, or a typed date (on blur, Enter, or opening the calendar). Called
   * with `''` when the user clears it, empties the text, or leaves text that
   * isn't a date.
   */
  onValueChange?: (value: string) => void;
  /**
   * Called with `true` when the typed text, checked on blur, Enter or opening
   * the calendar, isn't a `yyyy-mm-dd` date (the field is then `aria-invalid`),
   * and with `false` once it is fixed, cleared or replaced by a pick. DateField
   * shows its message.
   */
  onInvalidChange?: (invalid: boolean) => void;
  /** The text shown while there is no date. Default "yyyy-mm-dd" (the format to type), as in Figma. */
  placeholder?: string;
  /** Controlled: the calendar is showing (Figma State=Open). Pair with `onOpenChange`. */
  open?: boolean;
  /** Uncontrolled: start with the calendar showing. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The form field name. The date is submitted under it as `yyyy-mm-dd` ("" for none). */
  name?: string;
  /** A date must be given: sets `aria-required` (the submit handler checks it). FormField's `required` sets it too. */
  required?: boolean;
  /** The day the calendar draws as Today. Default: the real today; stories pin it. */
  today?: Date;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(function DateInput(ownProps, ref) {
  const field = useFormField();
  const {
    value,
    defaultValue = null,
    onValueChange,
    onInvalidChange,
    placeholder = 'yyyy-mm-dd',
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
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-invalid': ariaInvalid,
    onKeyDown,
    onClick,
    onBlur,
    ...props
  } = useFormFieldControl(ownProps);

  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const date = parseIsoDate(value !== undefined ? value : uncontrolledValue);
  const iso = date ? dayKey(date) : '';

  /* What the user typed or pasted since the field last showed its date, or
     null while it shows it. Kept when it isn't a date, so it can be fixed. */
  const [draft, setDraft] = React.useState<string | null>(null);
  const text = draft ?? iso;
  /* The typed text was checked and isn't a date. */
  const [typedInvalid, setTypedInvalid] = React.useState(false);

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolledOpen;

  const uid = React.useId();
  const inputId = id ?? `${uid}-input`;
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const markInvalid = (next: boolean) => {
    if (next === typedInvalid) return;
    setTypedInvalid(next);
    onInvalidChange?.(next);
  };

  /* The user's own change, until a controlled `value` brings it back. */
  const ownChange = React.useRef<string | null>(null);

  /* The date becomes `next` (`yyyy-mm-dd`, or '' for none), when it differs. */
  const change = (next: string) => {
    if (next === iso) return;
    if (value === undefined) setUncontrolledValue(next || null);
    else ownChange.current = next;
    onValueChange?.(next);
  };

  /* A new controlled `value` from outside (not the user's own change coming
     back) shows as it is: it replaces typed text and its error. */
  const seenValue = React.useRef(value);
  React.useLayoutEffect(() => {
    if (value === undefined || Object.is(value, seenValue.current)) return;
    seenValue.current = value;
    const own = ownChange.current;
    ownChange.current = null;
    if (own !== null && isoOf(value) === own) return;
    setDraft(null);
    markInvalid(false);
  });

  /* Check the typed text: a date becomes the value and shows as `yyyy-mm-dd`;
     empty text clears it; anything else stays as typed, marked invalid, and
     the field holds no date. */
  const commit = () => {
    if (draft === null) return;
    const typed = draft.trim();
    const day = parseIsoDate(typed);
    if (day || typed === '') {
      setDraft(null);
      markInvalid(false);
      change(day ? dayKey(day) : '');
    } else {
      markInvalid(true);
      change('');
    }
  };

  /* Every open and close goes through here, Popover's included (Escape, a
     click outside, focus leaving). */
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

  /* Opening checks the typed text first, so a typed date is the calendar's. */
  const openCalendar = () => {
    if (disabled) return;
    commit();
    setOpen(true);
  };

  /* The calendar's one tab stop: the date, else today, else the 1st. */
  const focusCalendar = () => panelRef.current?.querySelector<HTMLElement>('[data-date][tabindex="0"]')?.focus();

  /* Opening moves focus into the calendar. Not on the first render: a field
     that starts open (`defaultOpen`) doesn't take focus from the page. */
  const wasOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen && !wasOpen.current) focusCalendar();
    wasOpen.current = isOpen;
  }, [isOpen]);

  /* Choosing a day replaces any typed text and closes the calendar; Popover puts focus back on the field. */
  const choose = (day: Date) => {
    setDraft(null);
    markInvalid(false);
    change(dayKey(day));
    setOpen(false);
  };

  /* Figma's Show Clear: an optional field with text (a date or typed), closed and enabled. */
  const clearable = !required && !disabled && !isOpen && text !== '';
  const clear = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDraft(null);
    markInvalid(false);
    change('');
    /* The button goes with the text: focus goes back to the field. */
    event.currentTarget.parentElement?.querySelector<HTMLElement>('input[role="combobox"]')?.focus();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
    /* Typing is the field's: an open calendar closes. */
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        /* ↓ / ↑ (Alt too) open the calendar, or go into it when it is already open. */
        if (isOpen) focusCalendar();
        else openCalendar();
        break;
      case 'Enter':
        /* New text: check it (and don't submit the form). Otherwise open the calendar, as before typing. */
        if (draft !== null) commit();
        else if (isOpen) focusCalendar();
        else openCalendar();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(event);
    /* A click in the field is for typing: Popover doesn't toggle, and an open calendar closes. */
    event.preventDefault();
    setOpen(false);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    commit();
  };

  /* The calendar button: open (checking the typed text first), or close again. */
  const handleCalendarClick = () => {
    if (isOpen) setOpen(false);
    else openCalendar();
  };

  const popover = (
    <Popover
      className="flex w-full"
      trigger={
        <DateInputBox
          {...props}
          ref={ref}
          id={inputId}
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-invalid={typedInvalid || ariaInvalid || undefined}
          aria-required={required || undefined}
          /* Not the native `required`: the browser doesn't block the form; its submit handler checks it. */
          required={false}
          form={form}
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onBlur={handleBlur}
          onCalendarClick={handleCalendarClick}
          className={cn(dateInputClasses, clearable ? PADDING.clear : PADDING.icon)}
        />
      }
      open={isOpen}
      onOpenChange={onPopoverOpenChange}
      panelRole="dialog"
      panelRef={panelRef}
      /* The calendar's name is the field's: its aria-label, its aria-labelledby, or the FormField's label. */
      label={ariaLabel}
      panelProps={{ 'aria-labelledby': ariaLabelledby ?? field?.labelId }}
      /* The calendar draws its own surface (Date Picker / Calendar: radius 12, padding 16, Elevation 3). */
      surface={false}
    >
      <Calendar value={date} onChange={choose} today={today} />
    </Popover>
  );

  return (
    <div className={cn('relative flex w-full', className)}>
      {popover}
      {/* Clear Button: Button / Icon, Size=32, Tone=Ghost, glyph X 16, 12 + 20 + 8 from the right edge, centred.
          Pressing it doesn't take focus, so typed text isn't checked on the way. */}
      {clearable && (
        <IconButton
          icon="x"
          label="Clear date"
          className="absolute inset-y-0 right-10 my-auto"
          onMouseDown={(event) => event.preventDefault()}
          onClick={clear}
        />
      )}
      {/* What a form submits: the date, under `name`. Disabled, like the field, so a disabled date input submits nothing. */}
      {name !== undefined && <input type="hidden" name={name} form={form} value={iso} disabled={disabled} />}
    </div>
  );
});
DateInput.displayName = 'DateInput';
