import * as React from 'react';
import { cn } from '../../lib/cn';
import { FilterField, type FilterFieldDropdownProps } from '../filter-field';
import { Popover } from '../popover';
import { useSelectListbox, type SelectOptionData } from '../select/useSelectListbox';
import { selectMenuLayout } from '../select-menu';
import { SelectOption } from '../select-option';

/**
 * FilterSelect — built from the CAF Figma library, page "Filters":
 * `Filter / Field – Select` (State Closed / Open), a dropdown filter in a list
 * page's filter bar (Status, Payment Method, Currency, Role, Type). It is a
 * `Filter / Field` Type=Dropdown that opens a `Select / Menu` under it, with
 * the chosen option checked (decision add-filter-field-select).
 *
 * Figma → code:
 * - Field (Filter / Field, Type=Dropdown) → FilterField `type="dropdown"`:
 *   the leading `icon` (default `funnel`), the chosen option's label and the
 *   caret. Figma's Value is an override; here it is the chosen option.
 * - State=Closed / Open → `open` (or `defaultOpen`): the list showing.
 *   The field looks the same in both, as Figma draws it.
 * - Menu (Select / Menu) → the list: SelectMenu's surface and layout, space.4
 *   under the field, as wide as the field (Figma: Fill, 256). It flips above
 *   when there's no room below.
 * - Option 1…n (Select / Option) → one per `options` entry; the chosen one is
 *   State=Selected (surface.base and the check).
 * - "All Status", the first option and the field's value while no filter is
 *   in use → `allLabel` (decision filter-wording): the reset item. Choosing it
 *   calls `onValueChange(null)`. A filter without `allLabel` lists only
 *   `options`, and shows `label` in text/subtle until one is chosen.
 *
 * It is Select's listbox: the same select-only combobox, the same keys and
 * typeahead, from `useSelectListbox` (see Select). The field is the
 * `<button role="combobox">`; focus stays on it while the list is open. Its
 * name is `label` ("Status") and its value the chosen option ("All Status");
 * the list takes the same name.
 *
 * It fills its container's width. `className` styles the wrapper that holds
 * the field and its list (a width in the bar, say). Every other prop, and the
 * ref, go to the field's button.
 *
 * Every colour is the semantic variable the Figma layer is bound to, through
 * FilterField, SelectMenu and SelectOption. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("FilterSelect").
 */
export interface FilterSelectProps
  extends Omit<FilterFieldDropdownProps, 'type' | 'value' | 'defaultValue' | 'placeholder' | 'onChange' | 'role'> {
  /** The filter's name: the field's accessible name and the list's ("Status"). */
  label: string;
  /** The choices, in order, after the `allLabel` item. A plain string is shorthand for `{ value: s, label: s }`. */
  options: ReadonlyArray<string | SelectOptionData>;
  /**
   * The reset item ("All Status"): first in the list, and the field's value
   * while no option is chosen (`value` null). Choosing it calls `onValueChange(null)`.
   */
  allLabel?: string;
  /** Controlled: the chosen option's `value`, or `null` for none (`allLabel`). Pair with `onValueChange`. */
  value?: string | null;
  /** Uncontrolled: the option chosen at first. */
  defaultValue?: string | null;
  /** Called with the option's `value` when the user chooses a different one; `null` for the `allLabel` item. */
  onValueChange?: (value: string | null) => void;
  /** Controlled: the list is showing (Figma State=Open). Pair with `onOpenChange`. */
  open?: boolean;
  /** Uncontrolled: start with the list showing. Focus stays where it is. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/* The `allLabel` item's value inside the listbox. No option value can be it. */
const ALL = '\u0000all';

export const FilterSelect = React.forwardRef<HTMLButtonElement, FilterSelectProps>(function FilterSelect(
  {
    label,
    options,
    allLabel,
    value,
    defaultValue = null,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    className,
    onKeyDown,
    onKeyUp,
    onPointerDown,
    ...props
  },
  ref,
) {
  const hasAll = allLabel !== undefined;
  const items = React.useMemo(() => {
    const list = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
    return allLabel !== undefined ? [{ value: ALL, label: allLabel }, ...list] : list;
  }, [options, allLabel]);

  /* `null` is the All item when there is one. */
  const toListbox = (v: string | null) => (v === null && hasAll ? ALL : v);

  const listbox = useSelectListbox({
    items,
    value: value === undefined ? undefined : toListbox(value),
    defaultValue: toListbox(defaultValue),
    onValueChange: (next) => onValueChange?.(next === ALL ? null : next),
    open,
    defaultOpen,
    onOpenChange,
    onKeyDown,
    onKeyUp,
    onPointerDown,
  });

  return (
    <Popover
      className={cn('flex w-full', className)}
      trigger={
        <FilterField
          {...props}
          {...listbox.triggerProps}
          ref={ref}
          type="dropdown"
          role="combobox"
          label={label}
          value={items[listbox.selectedIndex]?.label}
        />
      }
      open={listbox.isOpen}
      onOpenChange={listbox.onOpenChange}
      panelRole="listbox"
      label={label}
      panelProps={listbox.panelProps}
      /* Select / Menu's layout, as wide as the field (Figma: Fill), wider only for a label that needs it. */
      panelClassName={cn(selectMenuLayout, 'min-w-full')}
    >
      {items.map((item, i) => (
        <SelectOption key={item.value} {...listbox.optionProps(i)}>
          {item.label}
        </SelectOption>
      ))}
    </Popover>
  );
});
FilterSelect.displayName = 'FilterSelect';

/** Figma's State values: `open` false / true. */
export const FILTER_SELECT_STATES = ['closed', 'open'] as const;
