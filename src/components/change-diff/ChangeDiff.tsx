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
 * ChangeDiffRow, Figma → code (Field, Before, After are its properties):
 * - Field  → `field`: a `<th scope="row">`, Body/sm-semibold, `text.primary`.
 * - Before → `before`: a `<del>` on `accent.critical.tonal` (surface and
 *   content), with a 1px `accent.critical.outline.border` inside the edge.
 * - After  → `after`: an `<ins>` on `accent.success.tonal`, with
 *   `accent.success.outline.border`.
 * - The value boxes: radius 6 (raw) → `rounded-6`; padding 6 / 10 (raw) →
 *   `py-1.5 px-2` (GDL has no 10).
 *
 * The colour isn't the only cue: the column headers say Before and After,
 * and the values are `<del>` and `<ins>`, each led by a visually hidden
 * "Removed:" or "Added:" for screen readers that don't announce them. Figma
 * draws no strike-through or underline, so neither does code. Rows and the
 * header pad 16px at the sides and 16px between columns; Figma's raw 10 top
 * and bottom is 8 (`space/8`). Where code departs from Figma, the reason is
 * in docs/figma-sync.md ("ChangeDiff").
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
   `no-underline` clears the browser's strike-through on <del> and underline on <ins>: Figma has neither. */
const value = 'inline-block max-w-full rounded-6 px-2 py-1.5 align-middle break-words text-body-sm-regular no-underline inset-ring';
const removed =
  'bg-accent-critical-tonal-surface-default text-accent-critical-tonal-content-default inset-ring-accent-critical-outline-border-default';
const added =
  'bg-accent-success-tonal-surface-default text-accent-success-tonal-content-default inset-ring-accent-success-outline-border-default';

export interface ChangeDiffRowProps extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'children'> {
  /** Figma Field: the changed field's name ("Status"). */
  field: React.ReactNode;
  /** Figma Before: the old value ("Unknown"). */
  before: React.ReactNode;
  /** Figma After: the new value ("Pending"). */
  after: React.ReactNode;
}

export const ChangeDiffRow = React.forwardRef<HTMLTableRowElement, ChangeDiffRowProps>(function ChangeDiffRow(
  { field, before, after, className, ...props },
  ref,
) {
  return (
    <tr ref={ref} className={className} {...props}>
      <th scope="row" className="py-2 pl-4 text-left align-middle text-body-sm-semibold text-text-primary">
        {field}
      </th>
      <td className="py-2 pl-4 align-middle">
        <del className={cn(value, removed)}>
          <span className="sr-only">Removed: </span>
          {before}
        </del>
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
