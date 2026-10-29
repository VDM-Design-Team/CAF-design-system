import * as React from 'react';
import { cn } from '../../lib/cn';
import { useFormFieldControl } from '../form-field';
import { Popover } from '../popover';
import { selectMenuLayout } from '../select-menu';
import { SelectOption } from '../select-option';
import { SelectTrigger, type SelectTriggerProps } from '../select-trigger';

/**
 * Select — the select from the CAF Figma library, page "Form": a
 * `_Dropdown Input` (SelectTrigger) that opens a `Select / Menu` (SelectMenu)
 * of `Select / Option`s (SelectOption) under it, in a Popover. Figma draws the
 * parts, not the whole; Form / Field – Dropdown and Filter / Field put a label
 * or a filter around it.
 *
 * Figma → code:
 * - _Dropdown Input → the trigger. Its Value is the chosen option's label, or
 *   `placeholder`; State=Open is the list showing; Error is `aria-invalid`;
 *   Disabled is `disabled`. Every other prop goes to the trigger too.
 * - Select / Menu   → the list, Popover's panel with SelectMenu's layout. It
 *   opens below the trigger, space.4 away, at least as wide as the trigger,
 *   and flips above when there's no room below.
 * - Select / Option → one per `options` entry; State=Selected is `value`.
 *
 * It is the WAI-ARIA select-only combobox. Focus stays on the trigger, which
 * points at the option the keys are on with `aria-activedescendant`.
 * - Closed: Enter, Space, ↓ or ↑ open the list on the chosen option (the
 *   first if none); Home / End open it on the first / last; typing opens it
 *   on the first option that starts with what was typed.
 * - Open: ↓ / ↑ move one option (they stop at the ends); Home / End go to the
 *   first / last; Page Down / Page Up move ten; typing jumps to the next match
 *   (type quickly for a longer match; repeat a letter to cycle). Enter, Space
 *   and Alt + ↑ choose the option and close; Tab chooses it and moves on;
 *   Escape closes without choosing. A click chooses; a click outside closes.
 *
 * Name it like SelectTrigger: a `<label htmlFor>` (with `id`), `aria-label`
 * or `aria-labelledby`. The list takes the same name. Inside a FormField
 * (SelectField is one) the field names it, and passes its message, error and
 * required on (`useFormFieldControl`).
 *
 * In a form: with a `name`, the chosen option's `value` is submitted under it
 * (a hidden input; "" while nothing is chosen), so FormData picks it up. A
 * disabled select submits nothing, like a native one. `required` sets
 * `aria-required`; the browser doesn't check a custom select, so check it in
 * the form's submit handler and show the field's `error`.
 *
 * Where code departs from Figma, the reason is in docs/figma-sync.md ("Select").
 */

/** One choice. A plain string is shorthand for `{ value: s, label: s }`. */
export interface SelectOptionData {
  value: string;
  /** What the option and the trigger show, and what typing matches. */
  label: string;
}

export interface SelectProps extends Omit<SelectTriggerProps, 'value' | 'defaultValue' | 'onChange' | 'open'> {
  /** The choices, in order. */
  options: ReadonlyArray<string | SelectOptionData>;
  /** Controlled: the chosen option's `value`, or `null` for none (the placeholder shows). Pair with `onValueChange`. */
  value?: string | null;
  /** Uncontrolled: the option chosen at first. */
  defaultValue?: string | null;
  /** Called with the option's `value` when the user chooses a different one. */
  onValueChange?: (value: string) => void;
  /** Controlled open state. Pair with `onOpenChange`. */
  open?: boolean;
  /** Uncontrolled: start with the list showing. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The form field name. The chosen option's `value` is submitted under it ("" for none). */
  name?: string;
}

/** How long typed characters add up to one search. */
const TYPEAHEAD_MS = 500;
/** How far Page Up / Page Down move. */
const PAGE = 10;

/**
 * The option typing `query` lands on, searching from `from` and wrapping. One
 * character starts after `from`, so pressing it again moves on; a longer query
 * starts at `from`, so the option already found stays while it still matches.
 * A repeated letter ("uu") cycles through the options that start with it.
 */
function findMatch(items: ReadonlyArray<SelectOptionData>, query: string, from: number) {
  const scan = (q: string, start: number) => {
    for (let k = 0; k < items.length; k++) {
      const i = (start + k) % items.length;
      if (items[i].label.toLowerCase().startsWith(q)) return i;
    }
    return -1;
  };
  const hit = scan(query, query.length === 1 ? from + 1 : Math.max(from, 0));
  if (hit >= 0 || ![...query].every((c) => c === query[0])) return hit;
  return scan(query[0], from + 1);
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(ownProps, ref) {
  const {
    options,
    value,
    defaultValue = null,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    className,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    onKeyDown,
    onKeyUp,
    onPointerDown,
    name,
    form,
    disabled,
    ...props
  } = useFormFieldControl(ownProps);
  const items = React.useMemo(
    () => options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    [options],
  );

  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const current = value !== undefined ? value : uncontrolledValue;
  const selectedIndex = items.findIndex((o) => o.value === current);

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolledOpen;

  const uid = React.useId();
  const triggerId = id ?? `${uid}-trigger`;
  /* Ids by index: an option's value can hold spaces, which an id can't. */
  const optionId = (i: number) => `${uid}-option-${i}`;

  /* The option the keys are on (aria-activedescendant), and whether the
     keyboard put it there: only then does it show the focus ring. */
  const [active, setActive] = React.useState(() => Math.max(selectedIndex, 0));
  const activeIndex = Math.min(active, items.length - 1);
  const [keyboard, setKeyboard] = React.useState(false);
  const lastInput = React.useRef<'keyboard' | 'pointer'>('pointer');
  /* Scroll the active option into view after the next render. */
  const reveal = React.useRef(isOpen);

  /* Every open and close goes through here, Popover's included (click, Escape,
     a click outside, focus leaving). Opening puts the keys on `at` (Home, End
     or a typed match), else on the chosen option, else on the first. */
  const setOpen = (next: boolean, at?: number) => {
    if (next === isOpen) return;
    if (next && items.length === 0) return; // nothing to choose from
    if (next) {
      setActive(at ?? Math.max(selectedIndex, 0));
      setKeyboard(lastInput.current === 'keyboard');
      reveal.current = true;
    }
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  /* Popover gets a stable callback, so it doesn't re-add its listeners on every render. */
  const latestSetOpen = React.useRef(setOpen);
  React.useLayoutEffect(() => {
    latestSetOpen.current = setOpen;
  });
  const onPopoverOpenChange = React.useCallback((next: boolean) => latestSetOpen.current(next), []);

  React.useEffect(() => {
    if (!isOpen || !reveal.current) return;
    reveal.current = false;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
  });

  const show = (at?: number) => setOpen(true, at);
  const move = (i: number) => {
    reveal.current = true;
    setActive(i);
    setKeyboard(true);
  };
  const choose = (i: number) => {
    const item = items[i];
    if (item && item.value !== current) {
      if (value === undefined) setUncontrolledValue(item.value);
      onValueChange?.(item.value);
    }
    setOpen(false);
  };

  /* Typeahead: characters typed within TYPEAHEAD_MS of each other are one search. */
  const search = React.useRef('');
  const searchTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(searchTimer.current), []);
  const typeahead = (char: string) => {
    clearTimeout(searchTimer.current);
    search.current += char.toLowerCase();
    searchTimer.current = setTimeout(() => {
      search.current = '';
    }, TYPEAHEAD_MS);
    const match = findMatch(items, search.current, isOpen ? activeIndex : selectedIndex);
    if (!isOpen) show(match >= 0 ? match : undefined);
    else if (match >= 0) move(match);
  };

  /* A Space the select used (to choose, or as part of a search) mustn't also
     press the button, which would open the list again. A button is pressed on
     Space's keyup; preventing the keydown stops that in Chromium, and
     preventing the keyup too covers a browser that presses it anyway. */
  const spaceUsed = React.useRef(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    lastInput.current = 'keyboard';
    spaceUsed.current = false;
    if (event.defaultPrevented || items.length === 0) return;
    const { key, altKey, ctrlKey, metaKey } = event;
    const last = items.length - 1;

    if (key.length === 1 && !altKey && !ctrlKey && !metaKey && (key !== ' ' || search.current !== '')) {
      event.preventDefault();
      spaceUsed.current = key === ' ';
      typeahead(key);
      return;
    }

    if (!isOpen) {
      if (key === 'ArrowDown' || key === 'ArrowUp') show();
      else if (key === 'Home') show(0);
      else if (key === 'End') show(last);
      else return; // Enter and Space: the button's own click opens the list.
      event.preventDefault();
      return;
    }

    switch (key) {
      case 'ArrowDown':
        move(Math.min(activeIndex + 1, last));
        break;
      case 'ArrowUp':
        if (altKey) choose(activeIndex);
        else move(Math.max(activeIndex - 1, 0));
        break;
      case 'Home':
        move(0);
        break;
      case 'End':
        move(last);
        break;
      case 'PageDown':
        move(Math.min(activeIndex + PAGE, last));
        break;
      case 'PageUp':
        move(Math.max(activeIndex - PAGE, 0));
        break;
      case 'Enter':
      case ' ':
        spaceUsed.current = key === ' ';
        choose(activeIndex);
        break;
      case 'Tab':
        choose(activeIndex);
        return; // Tab still moves focus on.
      default:
        return; // Escape is Popover's.
    }
    event.preventDefault();
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyUp?.(event);
    if (event.key === ' ' && spaceUsed.current) event.preventDefault();
    spaceUsed.current = false;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event);
    lastInput.current = 'pointer';
  };

  const popover = (
    <Popover
      className={cn('flex w-full', className)}
      trigger={
        <SelectTrigger
          {...props}
          ref={ref}
          id={triggerId}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          value={items[selectedIndex]?.label}
          open={isOpen}
          aria-activedescendant={isOpen && items.length > 0 ? optionId(activeIndex) : undefined}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onPointerDown={handlePointerDown}
        />
      }
      open={isOpen}
      onOpenChange={onPopoverOpenChange}
      panelRole="listbox"
      /* The list's name is the select's: its aria-label, its aria-labelledby, or (through the trigger) its <label>. */
      label={ariaLabel}
      panelProps={{
        'aria-labelledby': ariaLabelledby,
        /* Keep focus on the trigger when an option (or the list's scrollbar) is pressed. */
        onMouseDown: (event) => event.preventDefault(),
      }}
      /* SelectMenu's layout, at least as wide as the trigger. Popover draws the surface. */
      panelClassName={cn(selectMenuLayout, 'min-w-full')}
    >
      {items.map((item, i) => (
        <SelectOption
          key={item.value}
          id={optionId(i)}
          selected={i === selectedIndex}
          data-active={i === activeIndex ? '' : undefined}
          data-focus-visible={i === activeIndex && keyboard ? '' : undefined}
          onPointerMove={() => {
            setActive(i);
            setKeyboard(false);
          }}
          onClick={() => choose(i)}
        >
          {item.label}
        </SelectOption>
      ))}
    </Popover>
  );

  if (name === undefined) return popover;
  return (
    <>
      {popover}
      {/* What a form submits: the chosen value, under `name`. Disabled, like the trigger, so a disabled select submits nothing. */}
      <input type="hidden" name={name} form={form} value={current ?? ''} disabled={disabled} />
    </>
  );
});
Select.displayName = 'Select';
