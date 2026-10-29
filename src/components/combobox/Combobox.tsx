import * as React from 'react';
import { cn } from '../../lib/cn';
import { useFormField, useFormFieldControl } from '../form-field';
import { Icon } from '../icon';
import { Popover } from '../popover';
import type { SelectOptionData } from '../select';
import { selectMenuLayout } from '../select-menu';
import { SelectOption } from '../select-option';
import { TextInput, type TextInputProps } from '../text-input';

/**
 * Combobox — built from the CAF Figma library, page "Form": `_Combobox Input`
 * (State, with a Value), the searchable select: type to filter, then pick
 * from the `Select / Menu` it opens. Form / Field – Combobox puts it under a
 * label (Location, in the Cost Breakdown and Multi-section form patterns).
 *
 * Figma → code (it is a native `<input>`, a TextInput, so most states are
 * the element's own):
 * - State=Default  → nothing chosen: the `placeholder` shows, in text/subtle.
 * - State=Filled   → a chosen option (`value` / `defaultValue`): its label, in text/primary.
 * - State=Focus    → `:focus` (Figma: "typing"): a 2px stroke/focused stroke inside the edge.
 * - State=Error    → `aria-invalid`: the accent/critical/outline border.
 * - State=Disabled → the native `disabled` attribute.
 * - State=Open     → the list showing (`open` / `defaultOpen`, or the user
 *   opening it), which sets `aria-expanded`: Focus's 2px stroke.
 * - Value          → `placeholder` while nothing is chosen, the chosen label
 *   once filled, and what the user types while filtering.
 * - Icon / Search  → Icon `magnifying-glass`, 20px, text/subtle, 12px from the left.
 * - Icon / Caret   → Icon `caret-down`, 20px, text/subtle, 12px from the right.
 * - Select / Menu and Select / Option → the list: Popover's panel with
 *   SelectMenu's layout, and one SelectOption per match (Select's, reused).
 *
 * It is the WAI-ARIA editable combobox with a listbox popup and list
 * autocomplete. Focus stays in the input (`role="combobox"`), which points
 * at the option the keys are on with `aria-activedescendant`.
 * - Typing opens the list and filters it: the options whose label contains
 *   the text (any case). The first match is the active one, so Enter takes it.
 *   No match shows "No results" (`emptyText`), which is also announced.
 * - A click, ↓ or ↑ opens the full list on the chosen option (↓: else the
 *   first; ↑: else the last). Open, ↓ / ↑ move one option and stop at the ends.
 * - Enter chooses the active option and closes; a click on an option does too.
 *   Closed, Enter is the form's (it submits).
 * - Escape closes the list and puts back the chosen label. Pressed again,
 *   with the list closed, it clears the input and the choice.
 * - Tab, a click outside or focus leaving closes the list. If the text is
 *   exactly an option's label, that option is chosen; if it is empty, the
 *   choice is cleared; otherwise the chosen label comes back.
 * So the value is always one of the options (or none), never free text.
 *
 * Name it like TextInput: a `<label htmlFor>` (with `id`), `aria-label` or
 * `aria-labelledby`. The list takes the same name. Inside a FormField
 * (ComboboxField is one) the field names it, and passes its message, error
 * and required on (`useFormFieldControl`).
 *
 * In a form: with a `name`, the chosen option's `value` is submitted under it
 * (a hidden input; "" while nothing is chosen). The visible input has no
 * name, so the typed text is never submitted. A disabled combobox submits
 * nothing. `required` is the input's native `required`: the input shows the
 * chosen label whenever the list is closed, so the browser checks that an
 * option is chosen.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("Combobox").
 */
const comboboxInputClasses = [
  /* TextInput is _Text Input: the same fill, stroke, radius, type, height and
     Default / Filled / Focus / Error / Disabled bindings as _Combobox Input.
     Here the text sits between the icons: 12px side + 20px icon + 8px gap = space.40. */
  'px-10',
  /* State=Open: Focus's 2px stroke.focused stroke. Error keeps its colour at that width. */
  'aria-expanded:inset-ring-2 aria-expanded:inset-ring-stroke-focused',
];

/* The box: the input, with Figma's two icons over its padding. They let a
   click through to the input, which opens the list. */
const ComboboxInput = React.forwardRef<HTMLInputElement, TextInputProps>(function ComboboxInput(
  { className, ...props },
  ref,
) {
  return (
    <span className="relative flex w-full min-w-0">
      <Icon
        name="magnifying-glass"
        size={20}
        className="pointer-events-none absolute inset-y-0 left-3 my-auto text-text-subtle"
      />
      <TextInput ref={ref} className={cn(comboboxInputClasses, className)} {...props} />
      <Icon name="caret-down" size={20} className="pointer-events-none absolute inset-y-0 right-3 my-auto text-text-subtle" />
    </span>
  );
});

export interface ComboboxProps
  extends Omit<TextInputProps, 'value' | 'defaultValue' | 'onChange' | 'type' | 'role' | 'children'> {
  /** The choices, in order. A plain string is shorthand for `{ value: s, label: s }`. */
  options: ReadonlyArray<string | SelectOptionData>;
  /** Controlled: the chosen option's `value`, or `null` for none (the placeholder shows). Pair with `onValueChange`. */
  value?: string | null;
  /** Uncontrolled: the option chosen at first. */
  defaultValue?: string | null;
  /** Called with the option's `value` when the user chooses a different one, and with `null` when they clear it. */
  onValueChange?: (value: string | null) => void;
  /** Controlled open state (Figma State=Open). Pair with `onOpenChange`. */
  open?: boolean;
  /** Uncontrolled: start with the list showing. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The form field name. The chosen option's `value` is submitted under it ("" for none). */
  name?: string;
  /** What the list says when nothing matches the text. Default "No results". */
  emptyText?: string;
}

/** How the list closed: a choice was made, the user cancelled (Escape), or anything else. */
type CloseReason = 'chosen' | 'cancel' | 'other';

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(ownProps, ref) {
  const field = useFormField();
  const {
    options,
    value,
    defaultValue = null,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    name,
    form,
    disabled,
    emptyText = 'No results',
    className,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    onKeyDown,
    onClick,
    onPointerDown,
    onBlur,
    ...props
  } = useFormFieldControl(ownProps);

  const items = React.useMemo(
    () => options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    [options],
  );

  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const current = value !== undefined ? value : uncontrolledValue;
  const selectedIndex = items.findIndex((o) => o.value === current);
  const selectedLabel = items[selectedIndex]?.label ?? '';

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolledOpen;
  /* The open state last asked for, ahead of the render that shows it. Tab
     closes the list and then focus leaving closes it again (Popover), in one
     go: this keeps the second close from settling the text twice. */
  const openNow = React.useRef(isOpen);
  React.useLayoutEffect(() => {
    openNow.current = isOpen;
  });

  /* What the user typed since the last choice, or null when the input shows the chosen label. */
  const [query, setQuery] = React.useState<string | null>(null);
  const text = query ?? selectedLabel;

  /* The options that match the text, each with its place in `options` (for a stable id). */
  const results = React.useMemo(() => {
    const all = items.map((item, index) => ({ item, index }));
    const needle = query?.trim().toLowerCase();
    return needle ? all.filter(({ item }) => item.label.toLowerCase().includes(needle)) : all;
  }, [items, query]);

  const uid = React.useId();
  const inputId = id ?? `${uid}-input`;
  /* Ids by index: an option's value can hold spaces, which an id can't. */
  const optionId = (index: number) => `${uid}-option-${index}`;

  /* The option the keys are on (an index into `results`; -1 for none), and
     whether the keyboard put it there: only then does it show the focus ring. */
  const [active, setActive] = React.useState(() => Math.max(selectedIndex, 0));
  const activeIndex = active < 0 || !results.length ? -1 : Math.min(active, results.length - 1);
  const [keyboard, setKeyboard] = React.useState(false);
  const lastInput = React.useRef<'keyboard' | 'pointer'>('pointer');
  /* Scroll the active option into view after the next render. */
  const reveal = React.useRef(isOpen);
  const closeReason = React.useRef<CloseReason>('other');

  const commit = (next: string | null) => {
    if (next === current) return;
    if (value === undefined) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  /* Closing without a choice: an exact label is chosen, empty text clears the
     choice, and anything else puts the chosen label back. Escape always puts it back. */
  const settle = (reason: CloseReason) => {
    if (query === null) return;
    const typed = query.trim().toLowerCase();
    if (reason === 'other') {
      if (typed === '') commit(null);
      else {
        const exact = items.find((o) => o.label.toLowerCase() === typed);
        if (exact) commit(exact.value);
      }
    }
    setQuery(null);
  };

  /* Every open and close goes through here, Popover's included (Escape, a
     click outside, focus leaving). Opening puts the keys on `at`, else on the
     chosen option, else on the first. */
  const setOpen = (next: boolean, at?: number) => {
    const reason = closeReason.current;
    closeReason.current = 'other';
    if (next === openNow.current) return;
    openNow.current = next;
    if (next) {
      setActive(at ?? Math.max(selectedIndex, 0));
      setKeyboard(lastInput.current === 'keyboard');
      reveal.current = true;
    } else if (reason !== 'chosen') {
      settle(reason);
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

  const activeOption = activeIndex >= 0 ? results[activeIndex] : undefined;
  React.useEffect(() => {
    if (!isOpen || !reveal.current || !activeOption) return;
    reveal.current = false;
    document.getElementById(optionId(activeOption.index))?.scrollIntoView({ block: 'nearest' });
  });

  const move = (i: number) => {
    reveal.current = true;
    setActive(i);
    setKeyboard(true);
  };
  const choose = (i: number) => {
    const result = results[i];
    if (!result) return;
    commit(result.item.value);
    setQuery(null);
    closeReason.current = 'chosen';
    setOpen(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    /* The first match is the active one. Emptied, the input has no active
       option, so Enter clears the choice rather than taking the first. */
    const at = event.target.value.trim() ? 0 : -1;
    if (!isOpen) setOpen(true, at);
    else move(at);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    lastInput.current = 'keyboard';
    if (event.defaultPrevented) return;
    const last = results.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        if (!isOpen) setOpen(true);
        else if (results.length) move(Math.min(activeIndex + 1, last));
        break;
      case 'ArrowUp':
        if (!isOpen) setOpen(true, selectedIndex >= 0 ? selectedIndex : items.length - 1);
        else if (results.length) move(activeIndex < 0 ? last : Math.max(activeIndex - 1, 0));
        break;
      case 'Enter':
        if (!isOpen) return; // The form's: Enter submits.
        if (activeIndex >= 0) choose(activeIndex);
        else setOpen(false);
        break;
      case 'Escape':
        if (isOpen) {
          closeReason.current = 'cancel'; // Popover closes the list.
          return;
        }
        if (text === '' && current === null) return; // Nothing to clear: Escape is the page's (a modal's, say).
        setQuery(null);
        commit(null);
        break;
      case 'Tab':
        if (isOpen) setOpen(false);
        return; // Tab still moves focus on.
      default:
        return;
    }
    event.preventDefault();
  };

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(event);
    /* Popover would toggle; a click in the input opens the list and keeps it open. */
    event.preventDefault();
    if (!isOpen) setOpen(true);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    onPointerDown?.(event);
    lastInput.current = 'pointer';
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    /* Text typed while the list was kept closed (a controlled `open`) settles on the way out. */
    if (!isOpen && query !== null) settle('other');
  };

  const noResults = isOpen && results.length === 0;

  return (
    <>
      <Popover
        className={cn('flex w-full', className)}
        trigger={
          <ComboboxInput
            {...props}
            ref={ref}
            id={inputId}
            role="combobox"
            aria-autocomplete="list"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            aria-activedescendant={isOpen && activeOption ? optionId(activeOption.index) : undefined}
            autoComplete="off"
            form={form}
            disabled={disabled}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onBlur={handleBlur}
          />
        }
        open={isOpen}
        onOpenChange={onPopoverOpenChange}
        panelRole="listbox"
        /* The list's name is the combobox's: its aria-label, its aria-labelledby, or its field's label. */
        label={ariaLabel}
        panelProps={{
          'aria-labelledby': ariaLabelledby ?? (field?.id === inputId ? field.labelId : undefined),
          /* Keep focus in the input when an option (or the list's scrollbar) is pressed. */
          onMouseDown: (event) => event.preventDefault(),
        }}
        /* SelectMenu's layout, at least as wide as the input. Popover draws the surface. */
        panelClassName={cn(selectMenuLayout, 'min-w-full')}
      >
        {results.map(({ item, index }, i) => (
          <SelectOption
            key={item.value}
            id={optionId(index)}
            selected={index === selectedIndex}
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
        {/* No match: a row in an option's place (8 / 12 padding), Body/sm-regular in text/subtle,
            like the placeholder. Hidden from assistive tech, which hears the status below instead. */}
        {noResults && (
          <div aria-hidden className="cursor-default px-3 py-2 text-body-sm-regular text-text-subtle">
            {emptyText}
          </div>
        )}
      </Popover>
      {/* Announces an empty result, which the list itself can't (a listbox holds only options). */}
      <span role="status" className="sr-only">
        {noResults && emptyText}
      </span>
      {name !== undefined && (
        /* What a form submits: the chosen value, under `name`. Disabled, like the input, so a disabled combobox submits nothing. */
        <input type="hidden" name={name} form={form} value={current ?? ''} disabled={disabled} />
      )}
    </>
  );
});
Combobox.displayName = 'Combobox';
