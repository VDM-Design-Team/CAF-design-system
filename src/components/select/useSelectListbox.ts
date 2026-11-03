import * as React from 'react';

/**
 * useSelectListbox — the select-only combobox behind Select and FilterSelect:
 * the chosen value, the open state, the option the keys are on, typeahead and
 * every key. It is shared, so the two triggers (Select's `_Dropdown Input`,
 * FilterSelect's `Filter / Field` Dropdown) drive one listbox the same way.
 * Internal: it isn't exported from the package.
 *
 * The component renders a Popover (`panelRole="listbox"`) with its trigger,
 * and spreads what this returns:
 * - `triggerProps` onto the trigger, a `<button role="combobox">`: its keys,
 *   and `aria-activedescendant` while the list is open. Focus stays on it.
 * - `isOpen` and `onOpenChange` onto the Popover (`open`, `onOpenChange`).
 * - `panelProps` onto the Popover's panel: a press on the list keeps focus on
 *   the trigger.
 * - `optionProps(i)` onto each SelectOption, in `items` order.
 *
 * Keys, as WAI-ARIA's select-only combobox:
 * - Closed: Enter, Space, ↓ or ↑ open the list on the chosen option (the
 *   first if none); Home / End open it on the first / last; typing opens it
 *   on the first option that starts with what was typed.
 * - Open: ↓ / ↑ move one option (they stop at the ends); Home / End go to the
 *   first / last; Page Down / Page Up move ten; typing jumps to the next match
 *   (type quickly for a longer match; repeat a letter to cycle). Enter, Space
 *   and Alt + ↑ choose the option and close; Tab chooses it and moves on;
 *   Escape closes without choosing (Popover's). A click chooses; a click
 *   outside closes.
 */

/** One choice. */
export interface SelectOptionData {
  value: string;
  /** What the option and the trigger show, and what typing matches. */
  label: string;
}

export interface SelectListboxOptions {
  /** The choices, in order. */
  items: ReadonlyArray<SelectOptionData>;
  /** Controlled: the chosen option's `value`, `null` for none. `undefined` leaves it uncontrolled. */
  value: string | null | undefined;
  /** Uncontrolled: the option chosen at first. */
  defaultValue: string | null;
  /** Called with the option's `value` when the user chooses a different one. */
  onValueChange?: (value: string) => void;
  /** Controlled open state. `undefined` leaves it uncontrolled. */
  open: boolean | undefined;
  /** Uncontrolled: start with the list showing. */
  defaultOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The trigger's own handlers: they run first, and `preventDefault()` in `onKeyDown` skips the listbox's keys. */
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLButtonElement>;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
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

export function useSelectListbox({
  items,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  onKeyDown,
  onKeyUp,
  onPointerDown,
}: SelectListboxOptions) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const current = value !== undefined ? value : uncontrolledValue;
  const selectedIndex = items.findIndex((o) => o.value === current);

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolledOpen;

  const uid = React.useId();
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

  return {
    /** The chosen option's `value`, or `null`. */
    current,
    /** The chosen option's index in `items`, or -1. */
    selectedIndex,
    isOpen,
    /** For Popover's `onOpenChange`: stable across renders. */
    onOpenChange: onPopoverOpenChange,
    /** For the trigger. */
    triggerProps: {
      'aria-activedescendant': isOpen && items.length > 0 ? optionId(activeIndex) : undefined,
      onKeyDown: handleKeyDown,
      onKeyUp: handleKeyUp,
      onPointerDown: handlePointerDown,
    },
    /** For Popover's `panelProps`: keep focus on the trigger when an option (or the list's scrollbar) is pressed. */
    panelProps: {
      onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => event.preventDefault(),
    },
    /** For the SelectOption at `i`. */
    optionProps: (i: number) => ({
      id: optionId(i),
      selected: i === selectedIndex,
      'data-active': i === activeIndex ? '' : undefined,
      'data-focus-visible': i === activeIndex && keyboard ? '' : undefined,
      onPointerMove: () => {
        setActive(i);
        setKeyboard(false);
      },
      onClick: () => choose(i),
    }),
  };
}
