import * as React from 'react';
import { cn } from '../../lib/cn';
import { Skeleton } from '../skeleton';
import { TableCell } from '../table-cell';
import { TableRow, type TableRowProps } from '../table-row';

/**
 * SkeletonTableRow — built from the CAF Figma library, page "Feedback":
 * `Skeleton / Table Row`, the loading state of a table row. "Stack several
 * while data loads": put them in the `<tbody>` of the real table, under its
 * real header, in place of the rows that are loading.
 *
 * Figma → code:
 * - The row → a TableRow (`<tr>`), with its bottom stroke, stroke.subtle.
 * - Its five `Skeleton` Shape=Line instances → one TableCell per column, each
 *   holding a Skeleton line. `columns` is the table's column count (default
 *   5, as in Figma), so the placeholders sit in the columns they stand in for.
 * - Figma's line widths (160, 120, 140, 100, 120 px) → the same proportions
 *   of each column's width (full, ¾, ⅞, ⅝, ¾), repeating after the fifth.
 * - Padding 16 top and bottom → the cells' `py-4`, so the row is 45px high,
 *   as tall as a loaded row of text: nothing jumps when the data arrives.
 *
 * The row is hidden from assistive tech (`aria-hidden`): it has nothing to
 * read. Mark the table `aria-busy` while it loads and say what is loading.
 * Figma's skeleton row has no Hover or Selected, so code removes TableRow's
 * hover fill. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("SkeletonTableRow").
 */

/* Figma's five line widths, 160 / 120 / 140 / 100 / 120 px, as fractions of the widest (160). */
const WIDTHS = ['w-full', 'w-3/4', 'w-7/8', 'w-5/8', 'w-3/4'] as const;

export interface SkeletonTableRowProps extends Omit<TableRowProps, 'children' | 'selected'> {
  /** How many cells: the table's column count. Default 5, as in Figma. */
  columns?: number;
}

export const SkeletonTableRow = React.forwardRef<HTMLTableRowElement, SkeletonTableRowProps>(
  ({ columns = 5, className, ...props }, ref) => (
    <TableRow
      ref={ref}
      aria-hidden="true"
      // Figma's skeleton row has no Hover state: no hover fill (TableRow's is surface.base).
      className={cn('not-data-selected:hover:bg-transparent', className)}
      {...props}
    >
      {Array.from({ length: columns }, (_, i) => (
        /* type="tag": the cell holds a component, as Figma's Type=Tag cell does (centred vertically, left-aligned). */
        <TableCell key={i} type="tag" className="py-4">
          <Skeleton className={WIDTHS[i % WIDTHS.length]} />
        </TableCell>
      ))}
    </TableRow>
  ),
);
SkeletonTableRow.displayName = 'SkeletonTableRow';
