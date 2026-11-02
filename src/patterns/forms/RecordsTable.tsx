import * as React from 'react';
import { RowActionsMenu } from '../../components/row-actions-menu';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableRow } from '../../components/table-row';
import { cn } from '../../lib/cn';

/**
 * RecordsTable — a story-level helper, not a DS component: the plain list
 * table the Admin and User list pages draw as a frame (Cost Centers in
 * patterns 04 and 05, Recurring Costs in 06, Drafts in U03). A header row of
 * TableHeaderCells, a TableRow per record with the cells each column returns,
 * and a RowActionsMenu at the end when `rowActions` is given. The Costs list
 * has its own organism (CostsTable); this one is for the simpler lists.
 *
 * It is controlled and renders rows in the order given. Rows carry `data-id`.
 * The menus are not portalled: leave room under the table (`pb-64`) and don't
 * put it in an overflow container.
 */
export interface RecordsTableColumn<T> {
  /** The header cell's label. */
  header: string;
  /** The row's cell for this column: a `<TableCell>`. */
  cell: (row: T) => React.ReactElement;
}

export interface RecordsTableProps<T> extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  /** Names the table ("Cost centers"). */
  'aria-label': string;
  columns: readonly RecordsTableColumn<T>[];
  rows: readonly T[];
  /** The record's id: the row's key and `data-id`. */
  rowId: (row: T) => string;
  /** The row's MenuItems, for its ••• menu. Leave it out for no actions column. */
  rowActions?: (row: T) => React.ReactNode;
  /** The ••• button's accessible name; it names the menu too. Unique per row. */
  actionsLabel?: (row: T) => string;
  /** Shown across the table when there are no rows (an EmptyState). */
  empty?: React.ReactNode;
  /** The `<table>` (React 19 passes refs as props). */
  ref?: React.Ref<HTMLTableElement>;
}

export function RecordsTable<T>({
  columns,
  rows,
  rowId,
  rowActions,
  actionsLabel = (row) => `Actions for ${rowId(row)}`,
  empty,
  className,
  ref,
  ...table
}: RecordsTableProps<T>) {
  const columnCount = columns.length + (rowActions ? 1 : 0);
  return (
    <table ref={ref} className={cn('w-full border-collapse', className)} {...table}>
      <thead>
        {/* The list header: no fill, a stroke.subtle line under it (as CostsTable). */}
        <tr className="border-b border-stroke-subtle">
          {columns.map((column) => (
            <TableHeaderCell key={column.header} className="px-4">
              {column.header}
            </TableHeaderCell>
          ))}
          {rowActions && (
            <TableHeaderCell className="w-1 px-4">
              <span className="sr-only">Actions</span>
            </TableHeaderCell>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && empty && (
          <TableRow>
            <TableCell type="tag" colSpan={columnCount}>
              {empty}
            </TableCell>
          </TableRow>
        )}
        {rows.map((row) => (
          <TableRow key={rowId(row)} data-id={rowId(row)}>
            {columns.map((column) => (
              <React.Fragment key={column.header}>{column.cell(row)}</React.Fragment>
            ))}
            {rowActions && (
              <TableCell type="actions" className="w-1">
                <RowActionsMenu label={actionsLabel(row)}>{rowActions(row)}</RowActionsMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </tbody>
    </table>
  );
}
