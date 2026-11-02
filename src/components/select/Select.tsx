import * as React from 'react';
import { cn } from '../../lib/cn';
import { useFormFieldControl } from '../form-field';
import { Popover } from '../popover';
import { selectMenuLayout } from '../select-menu';
import { SelectOption } from '../select-option';
import { SelectTrigger, type SelectTriggerProps } from '../select-trigger';
import { useSelectListbox, type SelectOptionData } from './useSelectListbox';

export type { SelectOptionData };

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
 * points at the option the keys are on with `aria-activedescendant`. The
 * listbox's state and keys live in `useSelectListbox`, which FilterSelect
 * shares, so a filter's list behaves exactly like this one.
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

  const listbox = useSelectListbox({
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
  });

  const uid = React.useId();
  const triggerId = id ?? `${uid}-trigger`;

  const popover = (
    <Popover
      className={cn('flex w-full', className)}
      trigger={
        <SelectTrigger
          {...props}
          {...listbox.triggerProps}
          ref={ref}
          id={triggerId}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          value={items[listbox.selectedIndex]?.label}
          open={listbox.isOpen}
        />
      }
      open={listbox.isOpen}
      onOpenChange={listbox.onOpenChange}
      panelRole="listbox"
      /* The list's name is the select's: its aria-label, its aria-labelledby, or (through the trigger) its <label>. */
      label={ariaLabel}
      panelProps={{ ...listbox.panelProps, 'aria-labelledby': ariaLabelledby }}
      /* SelectMenu's layout, at least as wide as the trigger. Popover draws the surface. */
      panelClassName={cn(selectMenuLayout, 'min-w-full')}
    >
      {items.map((item, i) => (
        <SelectOption key={item.value} {...listbox.optionProps(i)}>
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
      <input type="hidden" name={name} form={form} value={listbox.current ?? ''} disabled={disabled} />
    </>
  );
});
Select.displayName = 'Select';
