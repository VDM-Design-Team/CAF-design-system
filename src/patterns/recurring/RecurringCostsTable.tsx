import * as React from 'react';
import { cn } from '../../lib/cn';
import { RowActionsMenu } from '../../components/row-actions-menu';
import { StatusPill } from '../../components/status-pill';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell, type TableSort } from '../../components/table-header-cell';
import { TableRow } from '../../components/table-row';
import { formatDate, formatFrequency, type FrequencyUnit, type RecurringCost } from '../fixtures';

/**
 * RecurringCostsTable — a story-level organism, not a DS component
 * (COMPONENT-PLAN decision 4): the Recurring Costs list's table, composed
 * from DS components the way the CAF Figma library draws it, page "Table":
 * - `Table / Header – Recurring Costs` (260:1021): ID, Created By, Frequency,
 *   Status, Applicant Name, Email, Date created, every one Sortable, then an
 *   empty Actions slot.
 * - `Table / Row – Recurring Cost` (260:1000): the ID; Created By as name over
 *   email; the frequency ("3 weeks"); the Status Pill; applicant, email and
 *   date as text; the ••• row actions button.
 * - `Table / Recurring Costs` (260:1065): the header over the rows.
 *
 * Figma → code:
 * - The header row → TableHeaderCells in a row with a stroke.subtle line
 *   under it, as CostsTable draws Header – Costs. Sortable when
 *   `onSortChange` is given (`sortRecurringCosts`, `nextRecurringSort`).
 * - The rows → TableRows. Created By → TableCell `two-line`; Status →
 *   `RecurringStatusBadge`; the ••• → RowActionsMenu with `rowActions`.
 * - Figma's fixed column widths (80, 308, 140 …) are left to the table's
 *   automatic layout, as on CostsTable: GDL has no width scale.
 *
 * It is controlled: the story owns the rows, their order and what the row
 * actions do.
 */

export type RecurringSortColumn = 'id' | 'createdBy' | 'frequency' | 'status' | 'applicant' | 'email' | 'createdAt';

export interface RecurringSort {
  column: RecurringSortColumn;
  direction: Exclude<TableSort, 'none'>;
}

/** Table / Header – Recurring Costs, left to right. */
export const RECURRING_COLUMNS: { key: RecurringSortColumn; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'status', label: 'Status' },
  { key: 'applicant', label: 'Applicant Name' },
  { key: 'email', label: 'Email' },
  { key: 'createdAt', label: 'Date created' },
];

/** The Status column's label. */
export const recurringStatusLabel: Record<RecurringCost['status'], string> = { active: 'Active', stopped: 'Stopped' };

/* A frequency in days, so "1 month" sorts after "3 weeks". */
const DAYS: Record<FrequencyUnit, number> = { Day: 1, Week: 7, Month: 30 };

const sortValue: Record<RecurringSortColumn, (cost: RecurringCost) => string | number> = {
  id: (c) => Number(c.id),
  createdBy: (c) => c.createdBy.name,
  frequency: (c) => c.frequency.value * DAYS[c.frequency.unit],
  status: (c) => recurringStatusLabel[c.status],
  applicant: (c) => c.applicant.name,
  email: (c) => c.applicant.email,
  createdAt: (c) => c.createdAt,
};

/** The rows in `sort`'s order (a new array; ties keep their order). No sort: as given. */
export function sortRecurringCosts(rows: readonly RecurringCost[], sort: RecurringSort | null | undefined): RecurringCost[] {
  if (!sort) return [...rows];
  const value = sortValue[sort.column];
  const sign = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
    return d * sign;
  });
}

/** A click on a column's header: a new column sorts ascending, the sorted one flips. */
export function nextRecurringSort(sort: RecurringSort | null | undefined, column: RecurringSortColumn): RecurringSort {
  return { column, direction: sort?.column === column && sort.direction === 'ascending' ? 'descending' : 'ascending' };
}

/** The Status column: Status Pill Active or Stopped. */
export function RecurringStatusBadge({ status }: { status: RecurringCost['status'] }) {
  return <StatusPill status={status}>{recurringStatusLabel[status]}</StatusPill>;
}

export interface RecurringCostsTableProps extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  /** The recurring costs to show, in the order to show them (see `sortRecurringCosts`). */
  rows: readonly RecurringCost[];
  /** The current sort; the header shows it. */
  sort?: RecurringSort | null;
  /** Makes the headers sortable; called with the next sort (`nextRecurringSort`). */
  onSortChange?: (sort: RecurringSort) => void;
  /** The row's MenuItems, for its ••• menu. Leave it out for no actions column. */
  rowActions?: (cost: RecurringCost) => React.ReactNode;
  /** Opens one row's menu at first (a story's snapshot of the open menu). */
  defaultMenuOpenFor?: string;
  /** Shown across the table when there are no rows (an EmptyState). */
  empty?: React.ReactNode;
}

export const RecurringCostsTable = React.forwardRef<HTMLTableElement, RecurringCostsTableProps>(function RecurringCostsTable(
  { rows, sort, onSortChange, rowActions, defaultMenuOpenFor, empty, className, 'aria-label': ariaLabel = 'Recurring costs', ...table },
  ref,
) {
  const columnCount = RECURRING_COLUMNS.length + (rowActions ? 1 : 0);
  return (
    <table ref={ref} aria-label={ariaLabel} className={cn('w-full border-collapse', className)} {...table}>
      <thead>
        {/* Table / Header – Recurring Costs: no fill, a stroke.subtle line under it. */}
        <tr className="border-b border-stroke-subtle">
          {RECURRING_COLUMNS.map(({ key, label }) => (
            <TableHeaderCell
              key={key}
              className="px-4"
              sortable={!!onSortChange}
              sort={sort?.column === key ? sort.direction : 'none'}
              onSort={() => onSortChange?.(nextRecurringSort(sort, key))}
            >
              {label}
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
        {rows.map((cost) => (
          <TableRow key={cost.id} data-id={cost.id}>
            <TableCell>{cost.id}</TableCell>
            <TableCell type="two-line" primary={cost.createdBy.name} secondary={cost.createdBy.email} />
            <TableCell>{formatFrequency(cost.frequency)}</TableCell>
            <TableCell type="tag">
              <RecurringStatusBadge status={cost.status} />
            </TableCell>
            <TableCell>{cost.applicant.name}</TableCell>
            <TableCell>{cost.applicant.email}</TableCell>
            <TableCell>{formatDate(cost.createdAt)}</TableCell>
            {rowActions && (
              <TableCell type="actions" className="w-1">
                <RowActionsMenu label={`Actions for recurring cost ${cost.id}`} defaultOpen={cost.id === defaultMenuOpenFor}>
                  {rowActions(cost)}
                </RowActionsMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </tbody>
    </table>
  );
});
RecurringCostsTable.displayName = 'RecurringCostsTable';
