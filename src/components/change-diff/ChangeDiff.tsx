import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * ChangeDiff and ChangeDiffRow — built from the CAF Figma library, page
 * "Table": `Table / Change Diff` and `Table / Change Diff Row`, the "View
 * Changes" panel under an Audit Logs entry (pattern 08): a Field / Before /
 * After header, then one row per changed field, the old value tinted red and
 * the new one green.
 *
 * ChangeDiff, Figma → code:
 * - It is a real `<table>`, so a screen reader reads each value with its
 *   column ("Before", "After") and its field (the row header).
 * - Frame: radius 8 (Figma: raw 8) → `rounded-8`; fill `surface.neutral.faint`;
 *   a 1px `stroke.subtle` inside the edge → `inset-ring`. Fixed 960 wide →
 *   fills its container.
 * - Header: Field, Before, After in Body/sm-regular, `text.subtle`, each a
 *   `<th scope="col">`; a 1px `stroke.subtle` line under it. Figma's labels
 *   are fixed text, so they are here too.
 * - Field is a fixed 200 of 960 in Figma; code gives it a quarter of the
 *   table (GDL has no width scale). Before and After share the rest.
 * - The Row instances → `children`: one ChangeDiffRow per changed field.
 *
 * ChangeDiffRow, Figma → code (Field, Before, After and Show Before are its
 * properties):
 * - Field  → `field`: a `<th scope="row">`, Body/sm-semibold, `text.primary`.
 * - Before → `before`: a `<del>` on `accent.critical.tonal` (surface and
 *   content), with a 1px `accent.critical.outline.border` inside the edge,
 *   its value struck through, as Figma draws it.
 * - Show Before → whether `before` is given. Leave it out for a Created
 *   entry, whose fields had no value: the Before cell stays empty, and After
 *   keeps its column.
 * - After  → `after`: an `<ins>` on `accent.success.tonal`, with
 *   `accent.success.outline.border`, not underlined.
 * - The value boxes: radius 6 → `rounded-6`; padding `space/6` / `space/8`
 *   → `py-1.5 px-2`.
 *
 * The colour isn't the only cue: the column headers say Before and After,
 * Before is struck through, and the values are `<del>` and `<ins>`, each led
 * by a visually hidden "Removed:" or "Added:" for screen readers that don't
 * announce them. Rows and the header pad 8px top and bottom (`space/8`) and
 * 16px at the sides, with 16px between columns. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("ChangeDiff").
 */
const head = 'py-2 pl-4 text-left align-middle text-body-sm-regular text-text-subtle border-b border-stroke-subtle';

export interface ChangeDiffProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Figma's Row instances: one `<ChangeDiffRow>` per changed field. */
  children: React.ReactNode;
}

export const ChangeDiff = React.forwardRef<HTMLTableElement, ChangeDiffProps>(function ChangeDiff(
  { className, children, ...props },
  ref,
) {
  return (
    <table
      ref={ref}
      className={cn(
        // Separate borders with no spacing: the header's line runs unbroken, and the radius holds.
        'w-full table-fixed border-separate border-spacing-0 rounded-8 bg-surface-neutral-faint inset-ring inset-ring-stroke-subtle',
        className,
      )}
      {...props}
    >
      <thead>
        <tr>
          <th scope="col" className={cn(head, 'w-1/4')}>
            Field
          </th>
          <th scope="col" className={head}>
            Before
          </th>
          <th scope="col" className={cn(head, 'pr-4')}>
            After
          </th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
});
ChangeDiff.displayName = 'ChangeDiff';

/* The value boxes: a tonal fill, its content colour, a 1px outline border inside the edge.
   Before is struck through (Figma's Value: Strikethrough); `no-underline` clears the browser's underline on <ins>. */
const value = 'inline-block max-w-full rounded-6 px-2 py-1.5 align-middle break-words text-body-sm-regular inset-ring';
const removed =
  'bg-accent-critical-tonal-surface-default text-accent-critical-tonal-content-default inset-ring-accent-critical-outline-border-default line-through';
const added =
  'bg-accent-success-tonal-surface-default text-accent-success-tonal-content-default inset-ring-accent-success-outline-border-default no-underline';

export interface ChangeDiffRowProps extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'children'> {
  /** Figma Field: the changed field's name ("Status"). */
  field: React.ReactNode;
  /**
   * Figma Before: the old value ("Unknown"). Leave it out (Figma's Show Before
   * off) for a Created entry: the Before cell stays empty.
   */
  before?: React.ReactNode;
  /** Figma After: the new value ("Pending"). */
  after: React.ReactNode;
}

export const ChangeDiffRow = React.forwardRef<HTMLTableRowElement, ChangeDiffRowProps>(function ChangeDiffRow(
  { field, before, after, className, ...props },
  ref,
) {
  const showBefore = before !== undefined && before !== null && before !== false;
  return (
    <tr ref={ref} className={className} {...props}>
      <th scope="row" className="py-2 pl-4 text-left align-middle text-body-sm-semibold text-text-primary">
        {field}
      </th>
      <td className="py-2 pl-4 align-middle">
        {showBefore && (
          <del className={cn(value, removed)}>
            <span className="sr-only">Removed: </span>
            {before}
          </del>
        )}
      </td>
      <td className="py-2 pr-4 pl-4 align-middle">
        <ins className={cn(value, added)}>
          <span className="sr-only">Added: </span>
          {after}
        </ins>
      </td>
    </tr>
  );
});
ChangeDiffRow.displayName = 'ChangeDiffRow';
