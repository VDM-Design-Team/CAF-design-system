import * as React from 'react';
import { cn } from '../../lib/cn';
import { Button } from '../button';
import { FormLabel } from '../form-label';
import { Icon } from '../icon';
import { IconButton } from '../icon-button';
import { TextInput, type TextInputProps } from '../text-input';

/**
 * RepeatableField — built from the CAF Figma library, page "Form":
 * `Form / Repeatable Field` (463:780) and its `Form / Repeatable Field Row`
 * (463:594). A labelled list of single-line entries the user can add to and
 * remove from: "Features" in the Create Announcement modal (Patterns –
 * Admin, 14 · Announcements & what's new), with rows "one", "two", "three"
 * and an "Add Feature" button.
 *
 * Figma → code (Repeatable Field):
 * - `_Form Label` (Label, Required) → `label`, `required`: the fieldset's
 *   `<legend>`, a FormLabel. Required shows the marker, makes every row's
 *   input `required`, and keeps at least one row.
 * - The Repeatable Field Rows → one RepeatableFieldRow per entry of `values`
 *   (controlled, with `onValuesChange`) or `defaultValues` (uncontrolled).
 *   "Add or remove rows per instance" (Figma's description) is the user's
 *   to do here: `min` and `max` bound the count.
 * - `Add Button` (Button / Small, Outlined, Show Icons, the Plus glyph) →
 *   a small outlined Button with the `plus` icon; its label is `addLabel`.
 *   It is disabled once the list holds `max` rows.
 * - Layout: a column with space.8 between the label, each row and the add
 *   button (Figma: gap 8), filling its container (the pattern sets it to Fill).
 *
 * Figma → code (Repeatable Field Row): a `_Text Input` (State=Filled: the
 * row's value; Default: the `placeholder`) that fills the row, then the
 * `Remove` Button / Icon (Size=40, Tone=Destructive, the Trash glyph),
 * space.8 apart and centred. Show Remove → `showRemove`: RepeatableField
 * shows it while the list holds more than `min` rows.
 *
 * As a form: every row is a native `<input>` with the same `name`, so the
 * form submits one entry per row (`formData.getAll(name)`). The ref is the
 * `<fieldset>`; its `elements` are the inputs and buttons, and its native
 * `disabled` disables them all (and keeps them out of the submit). Adding a
 * row focuses its input; removing one focuses the input that takes its
 * place, else the one before it, else the add button.
 *
 * Names: the group is named by the legend. Each input is "<label> <n>"
 * ("Features 2") and each remove button "Remove <label> <n>", unless
 * `rowLabel` / `removeLabel` say otherwise (they must, when `label` isn't
 * plain text).
 *
 * Every colour is the semantic variable the Figma layer is bound to, through
 * FormLabel, TextInput, IconButton and Button. Where code departs from Figma,
 * the reason is in docs/figma-sync.md ("RepeatableField").
 */

/* ── Form / Repeatable Field Row ─────────────────────────────────────────── */

export interface RepeatableFieldRowProps extends TextInputProps {
  /** Figma Show Remove: the remove button after the input. Default true, as in Figma. */
  showRemove?: boolean;
  /** The remove button's accessible name (it has no visible text), e.g. "Remove Features 2". */
  removeLabel?: string;
  /** Called when the remove button is pressed. */
  onRemove?: () => void;
  /** Styles the row. Every other prop, and the ref, go to the `<input>`. */
  className?: string;
}

export const RepeatableFieldRow = React.forwardRef<HTMLInputElement, RepeatableFieldRowProps>(
  function RepeatableFieldRow({ showRemove = true, removeLabel = 'Remove', onRemove, className, ...input }, ref) {
    return (
      /* The row: input and Remove, space.8 apart, centred (Figma: gap 8, counter-axis centre). */
      <div className={cn('flex w-full min-w-0 items-center gap-2', className)}>
        {/* _Text Input, set to Fill in the row. */}
        <TextInput ref={ref} className="flex-1" {...input} />
        {/* Remove: Button / Icon, Size=40, Tone=Destructive, the Trash glyph. */}
        {showRemove && (
          <IconButton
            icon="trash"
            label={removeLabel}
            size={40}
            tone="destructive"
            disabled={input.disabled}
            onClick={onRemove}
          />
        )}
      </div>
    );
  },
);
RepeatableFieldRow.displayName = 'RepeatableFieldRow';

/* ── Form / Repeatable Field ─────────────────────────────────────────────── */

export interface RepeatableFieldProps extends Omit<
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'children' | 'name' | 'defaultValue'
> {
  /** Figma _Form Label's Label: the legend that names the group, e.g. "Features". */
  label: React.ReactNode;
  /** Figma _Form Label's Required: the marker; every row's input is `required`, and one row always stays. */
  required?: boolean;
  /** The add button's label, e.g. "Add Feature". */
  addLabel: React.ReactNode;
  /** The rows' values (controlled). Use with `onValuesChange`. */
  values?: readonly string[];
  /** The starting rows (uncontrolled). Default: one empty row. Padded with empty rows up to `min`. */
  defaultValues?: readonly string[];
  /** Called with the new list when a row is typed in, added or removed. */
  onValuesChange?: (values: string[]) => void;
  /** Every row's input `name`: the form submits one entry per row. */
  name?: string;
  /** The fewest rows: their remove buttons hide at this count. Default 0, or 1 when `required`. */
  min?: number;
  /** The most rows: the add button is disabled at this count. Default: no limit. */
  max?: number;
  /** The empty rows' placeholder (Figma _Text Input State=Default). */
  placeholder?: string;
  /** The accessible name of row `index`'s input. Default "<label> <index + 1>". */
  rowLabel?: (index: number) => string;
  /** The accessible name of row `index`'s remove button. Default "Remove <row's name>". */
  removeLabel?: (index: number) => string;
}

/* Focus target for the add button, next to the row keys. */
const ADD = 'add';

export const RepeatableField = React.forwardRef<HTMLFieldSetElement, RepeatableFieldProps>(function RepeatableField(
  {
    label,
    required = false,
    addLabel,
    values: controlledValues,
    defaultValues,
    onValuesChange,
    name,
    min = 0,
    max = Infinity,
    placeholder,
    rowLabel,
    removeLabel,
    className,
    ...props
  },
  ref,
) {
  const floor = Math.max(min, required ? 1 : 0);
  const [ownValues, setOwnValues] = React.useState<string[]>(() => {
    const start = [...(defaultValues ?? [''])];
    while (start.length < floor) start.push('');
    return start;
  });
  const controlled = controlledValues !== undefined;
  const values = controlled ? controlledValues : ownValues;

  /* A stable key per row, so a removed row takes its input (and focus) with it.
     Keys follow the changes made here; a list changed from outside is matched by length. */
  const keyCount = React.useRef(0);
  const keysRef = React.useRef<string[]>([]);
  const newKey = () => `row-${keyCount.current++}`;
  if (keysRef.current.length !== values.length) {
    const keys = keysRef.current.slice(0, values.length);
    while (keys.length < values.length) keys.push(newKey());
    keysRef.current = keys;
  }
  const keys = keysRef.current;

  /* Focus moves after the change renders: to a new row's input, or a removed row's neighbour. */
  const inputs = React.useRef(new Map<string, HTMLInputElement>());
  const addButton = React.useRef<HTMLButtonElement>(null);
  const pendingFocus = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    const element = target === ADD ? addButton.current : inputs.current.get(target);
    if (element) {
      pendingFocus.current = null;
      element.focus();
    }
  });

  const commit = (next: string[], nextKeys: string[], focus: string | null = null) => {
    keysRef.current = nextKeys;
    if (focus !== null) pendingFocus.current = focus;
    if (!controlled) setOwnValues(next);
    onValuesChange?.(next);
  };

  const add = () => {
    if (values.length >= max) return;
    const key = newKey();
    commit([...values, ''], [...keys, key], key);
  };

  const remove = (index: number) => {
    if (values.length <= floor) return;
    const nextKeys = keys.filter((_, i) => i !== index);
    commit(
      values.filter((_, i) => i !== index),
      nextKeys,
      nextKeys[index] ?? nextKeys[index - 1] ?? ADD,
    );
  };

  const change = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    commit(next, keys);
  };

  const text = typeof label === 'string' || typeof label === 'number' ? String(label) : 'Row';
  const nameOf = rowLabel ?? ((index: number) => `${text} ${index + 1}`);
  const removeNameOf = removeLabel ?? ((index: number) => `Remove ${nameOf(index)}`);

  return (
    <fieldset ref={ref} className={cn('m-0 w-full min-w-0 border-0 p-0', className)} {...props}>
      {/* _Form Label, space.8 above the first row (Figma: the field's gap 8). */}
      <FormLabel as="legend" required={required} className="p-0 pb-2">
        {label}
      </FormLabel>
      {/* The rows and the add button: a column, space.8 apart. */}
      <div className="flex flex-col gap-2">
        {values.map((value, index) => {
          const key = keys[index];
          return (
            <RepeatableFieldRow
              key={key}
              ref={(element) => {
                if (element) inputs.current.set(key, element);
                else inputs.current.delete(key);
              }}
              name={name}
              value={value}
              onChange={(event) => change(index, event.target.value)}
              placeholder={placeholder}
              required={required || undefined}
              aria-label={nameOf(index)}
              showRemove={values.length > floor}
              removeLabel={removeNameOf(index)}
              onRemove={() => remove(index)}
            />
          );
        })}
        {/* Add Button: Button / Small, Outlined, the Plus glyph. It hugs its label (Figma: Hug, left-aligned). */}
        <Button
          ref={addButton}
          variant="outlined"
          size="small"
          leftIcon={<Icon name="plus" />}
          disabled={values.length >= max}
          onClick={add}
          className="self-start"
        >
          {addLabel}
        </Button>
      </div>
    </fieldset>
  );
});
RepeatableField.displayName = 'RepeatableField';
