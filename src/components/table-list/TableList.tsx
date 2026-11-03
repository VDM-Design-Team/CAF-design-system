import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * TableList — built from the CAF Figma library, page "Table": `Table / List`,
 * the plain list table (Cost Centers, Recurring Costs, Drafts, Users …): a
 * Table / Header Row over a slot of Table / Rows, with no fill and no outer
 * border. It is a real `<table>`: name it (`aria-label`), so screen readers
 * can list it and move by row and column.
 *
 * Figma → code:
 * - The nested Header Row → `header`: a `<TableHeaderRow>`, in the `<thead>`.
 *   Set its columns and controls there, as in Figma.
 * - Rows (a slot of Table / Rows) → `children`: `<TableRow>`s, in the
 *   `<tbody>`. A row's cells match the header's columns. An empty list puts
 *   one row in the slot whose TableCell `type="custom"` spans every column
 *   and holds an EmptyState.
 *
 * It takes its container's width (Figma's 1112 is the sample's), and the
 * columns share it by their content unless the header sets their widths.
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("TableList").
 */
export interface TableListProps extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  /** Figma's nested Table / Header Row: a `<TableHeaderRow>`. */
  header: React.ReactNode;
  /** Figma's Rows slot: the `<TableRow>`s. */
  children?: React.ReactNode;
}

export const TableList = React.forwardRef<HTMLTableElement, TableListProps>(
  ({ header, children, className, ...props }, ref) => (
    /* Vertical, no gap, no fill, no outer border: the Header Row's and the rows' own lines are the only strokes. */
    <table ref={ref} className={cn('w-full border-collapse', className)} {...props}>
      <thead>{header}</thead>
      <tbody>{children}</tbody>
    </table>
  ),
);
TableList.displayName = 'TableList';
