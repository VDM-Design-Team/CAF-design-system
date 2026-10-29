import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * TableRow — built from the CAF Figma library, page "Table": `Table / Row`
 * (State), the generic body row of TableCells. It is a `<tr>`: put it in the
 * `<tbody>` of a real `<table>`, with one TableCell per column.
 *
 * Figma → code:
 * - State=Default  → the row as it is.
 * - State=Hover    → `:hover` (not on a selected row; Figma has no Selected + Hover).
 * - State=Selected → `selected`. Put a `<Checkbox checked>` in the row's
 *   checkbox cell too: the checkbox is what tells assistive tech, because a
 *   plain table row can't carry `aria-selected`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. The
 * Selected fill is action.primary at 16%; on it, TableCell darkens its
 * secondary text and links (see docs/figma-sync.md, "TableRow"). Widths
 * belong to the cells, as in Figma.
 */
const row = [
  /* group/row: TableCell reads `data-selected` through it. */
  'group/row border-b border-stroke-subtle',
  /* State=Hover — surface.base, for a row that isn't selected. */
  'not-data-selected:hover:bg-surface-base',
  /* State=Selected — action.primary.surface.default at 16% opacity. */
  'data-selected:bg-action-primary-surface-default/16',
];

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Figma State=Selected. */
  selected?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected = false, ...props }, ref) => (
    <tr ref={ref} data-selected={selected || undefined} className={cn(row, className)} {...props} />
  ),
);
TableRow.displayName = 'TableRow';
