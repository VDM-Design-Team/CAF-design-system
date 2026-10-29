import * as React from 'react';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';

/**
 * FilterField — built from the CAF Figma library, page "Filters":
 * `Filter / Field` (Type × State), one control in a list page's filter bar
 * (`Filter / Bar – Costs`: search, status, payment method, currency, period,
 * creation date).
 *
 * Figma → code:
 * - Type=Search   → `type="search"` (the default): a search box. A leading
 *   magnifying glass and the query, in an `<input role="searchbox">`.
 * - Type=Dropdown → `type="dropdown"`: a trigger `<button>`. A leading icon,
 *   the chosen value and a caret. It is a trigger only: put it in a Popover as
 *   the `trigger`, with a Select (a listbox of options) or a RangeCalendar (a
 *   period or a creation date) as the panel. The List page pattern wires that
 *   up. Popover gives the button `aria-expanded`, `aria-haspopup` and
 *   `aria-controls`.
 * - State=Default → Search: empty, the `placeholder` in text/subtle.
 * - State=Filled  → Search: a query, in text/primary, and the clear (×)
 *   button. It shows whenever the input has a value; it empties the input
 *   (firing `onChange` with "") and calls `onClear`. Escape does the same.
 * - Dropdown, State=Default → a `value` (the chosen option's label: "All
 *   Status"), in text/primary. With no `value`, the `placeholder` shows in
 *   text/subtle, as the bar's Select Period and Creation Date fields do.
 * - The leading icon instance → `icon`, an Icon name. Search defaults to
 *   `magnifying-glass`, Dropdown to `funnel`. The bar swaps in `credit-card`
 *   (payment method), `currency-circle-dollar` (currency) and
 *   `calendar-blank` (period, creation date).
 *
 * `label` names the control: the search box's `aria-label`, and on the
 * dropdown a visually hidden prefix, so the button reads "Status: All Status"
 * and its name still contains the visible text.
 *
 * It fills its container's width, as the bar places it. `className` styles
 * the field's box. On Search every other prop goes to the `<input>`; on
 * Dropdown, to the `<button>`.
 *
 * Every colour is the semantic variable the Figma layer is bound to, except
 * the leading icon and the caret, whose fill Figma leaves raw. Where code
 * departs from Figma, the reason is in docs/figma-sync.md ("FilterField").
 */

/* Both types: surface.elevated-secondary fill, a 1px stroke.strong stroke
   inside the edge, radius 8 (Figma: the remote radius-4 variable, whose value
   is 8), 24px sides (bound to space/24), Body/sm-regular. Figma hugs 42px;
   code is 40px, as TextInput and SelectTrigger. */
const box = [
  'flex h-10 w-full min-w-0 items-center rounded-8 bg-surface-elevated-secondary px-6',
  'text-body-sm-regular inset-ring inset-ring-stroke-strong',
];

/* Figma has no Focus state; the ring is stroke.focused, as on Button. */
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused';

/* Figma's icon fill is raw #A3A3A3 (it renders the set pinned to Dark, where
   text.subtle is close to it). text.subtle is what the clear icon binds. */
const iconTone = 'text-text-subtle';

interface FilterFieldBase {
  /** The control's accessible name, e.g. "Search costs" or "Status". Required: the field has no visible label. */
  label: string;
  /** The leading icon: an Icon name. Default `magnifying-glass` (Search) or `funnel` (Dropdown). */
  icon?: IconName;
  /** Merged onto the field's box with `cn()`. */
  className?: string;
}

export interface FilterFieldSearchProps
  extends FilterFieldBase,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'className'> {
  /** Figma Type=Search (the default). */
  type?: 'search';
  /** The clear button's accessible name. Default "Clear search". */
  clearLabel?: string;
  /** Called after the clear button or Escape empties the input. `onChange` has already fired with "". */
  onClear?: () => void;
}

export interface FilterFieldDropdownProps
  extends FilterFieldBase,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'value' | 'children' | 'className'> {
  /** Figma Type=Dropdown. */
  type: 'dropdown';
  /** The chosen option's label ("All Status", "2026-10-12 – 2026-10-24"). */
  value?: React.ReactNode;
  /** Shown in text/subtle while there is no `value` ("Select Period"). Default: `label`. */
  placeholder?: string;
}

export type FilterFieldProps = FilterFieldSearchProps | FilterFieldDropdownProps;

/** Point several refs at one node. */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}

const FilterSearch = React.forwardRef<HTMLInputElement, FilterFieldSearchProps>(function FilterSearch(
  {
    label,
    icon = 'magnifying-glass',
    className,
    clearLabel = 'Clear search',
    onClear,
    value,
    defaultValue,
    onChange,
    onKeyDown,
    type: _type,
    ...props
  },
  ref,
) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const controlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState(() => String(defaultValue ?? ''));
  /* State=Filled: the input has a value. */
  const filled = String(controlled ? (value ?? '') : uncontrolled) !== '';

  /* Empty the input the way typing would, so `onChange` fires with "" whether
     or not the value is controlled, then keep focus in the box: the clear
     button is about to disappear. */
  const clear = () => {
    const input = inputRef.current;
    if (!input) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    onClear?.();
  };

  return (
    <div
      className={cn(
        box,
        'cursor-text gap-4',
        /* The box shows the input's focus ring; the clear button has its own. */
        'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-stroke-focused',
        'has-[input:disabled]:cursor-not-allowed',
        className,
      )}
      /* A press on the icon or the padding puts the caret in the input, as a click on a native field would. */
      onMouseDown={(event) => {
        if ((event.target as Element).closest('input, button')) return;
        event.preventDefault();
        inputRef.current?.focus();
      }}
    >
      <Icon name={icon} size={20} className={iconTone} />
      <input
        {...props}
        ref={mergeRefs(inputRef, ref)}
        type="text"
        role="searchbox"
        enterKeyHint="search"
        aria-label={label}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          if (!controlled) setUncontrolled(event.target.value);
          onChange?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== 'Escape' || !filled) return;
          /* Escape empties a filled box, as a native search field does. */
          event.preventDefault();
          clear();
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-body-sm-regular text-text-primary outline-hidden placeholder:text-text-subtle disabled:cursor-not-allowed"
      />
      {filled && !props.disabled && !props.readOnly && (
        /* Icon / Clear: Phosphor X at 16px in text.subtle. The button is 24px,
           so it is a big enough target, and pulls 4px into the gap and the
           padding, so the glyph sits where Figma places it. */
        <button
          type="button"
          aria-label={clearLabel}
          onClick={clear}
          className={cn(
            '-mx-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-4',
            iconTone,
            focusRing,
          )}
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
});

const FilterDropdown = React.forwardRef<HTMLButtonElement, FilterFieldDropdownProps>(function FilterDropdown(
  { label, icon = 'funnel', className, value, placeholder, type: _type, ...props },
  ref,
) {
  const empty = value === undefined || value === null || value === false || value === '';
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={cn(
        box,
        /* The bar's instances space the content and the caret apart (16px at least, bound to space/16). */
        'cursor-pointer justify-between gap-4 text-left',
        focusRing,
        'disabled:cursor-not-allowed',
        className,
      )}
    >
      {/* Content: the icon and the value, 12px apart (bound to space/12). */}
      <span className="flex min-w-0 items-center gap-3">
        <Icon name={icon} size={20} className={iconTone} />
        <span className={cn('min-w-0 truncate', empty ? 'text-text-subtle' : 'text-text-primary')}>
          <span className="sr-only">{label}: </span>
          {empty ? (placeholder ?? label) : value}
        </span>
      </span>
      <Icon name="caret-down" size={20} className={iconTone} />
    </button>
  );
});

export const FilterField = React.forwardRef<HTMLInputElement | HTMLButtonElement, FilterFieldProps>(
  function FilterField(props, ref) {
    return props.type === 'dropdown' ? (
      <FilterDropdown {...props} ref={ref as React.ForwardedRef<HTMLButtonElement>} />
    ) : (
      <FilterSearch {...props} ref={ref as React.ForwardedRef<HTMLInputElement>} />
    );
  },
);
FilterField.displayName = 'FilterField';

/** Figma's Type values. */
export const FILTER_FIELD_TYPES = ['search', 'dropdown'] as const;
