import * as React from 'react';
import { Checkbox } from '../../components/checkbox';
import { RowActionsMenu } from '../../components/row-actions-menu';
import { StatusPill } from '../../components/status-pill';
import { TableAccountDetails } from '../../components/table-account-details';
import { TableCell } from '../../components/table-cell';
import { TableDetailLabel } from '../../components/table-detail-label';
import { TableExpandButton } from '../../components/table-expand-button';
import { TableHeaderCell, type TableSort } from '../../components/table-header-cell';
import { TableHeaderRow } from '../../components/table-header-row';
import { TableList } from '../../components/table-list';
import { TableRow } from '../../components/table-row';
import { Tag } from '../../components/tag';
import {
  accountLine,
  costStatusLabel,
  costStatusPill,
  formatAmount,
  formatDate,
  formatPeriod,
  type Cost,
  type CostStatus,
} from '../fixtures';

/**
 * CostsTable — a story-level organism, not a DS component (COMPONENT-PLAN
 * decision 4): the Costs list's table, composed from DS components the way
 * the CAF Figma library draws `Table / Header – Costs` (121:4938, Selected
 * false / true / Mixed) and `Table / Row – Cost` (121:2782, Expanded; with
 * `Table / Row – Cost (Selectable)` 121:5197), page "Table".
 *
 * - The table is a TableList: a TableHeaderRow over TableRows.
 * - Header: a TableHeaderRow (Table / Header Row, which replaces Header –
 *   Costs' one 68px cell with a column per control) with Show Expand, Show
 *   Checkbox (selects every row shown; Mixed when some are) and Show Actions
 *   as the table has them, and TableHeaderCells (Account, Invoice #, Amount,
 *   Payment Method, Status, Date Submitted), sortable when `onSortChange` is
 *   given.
 * - Row: TableExpandButton (in a Custom cell, as Figma's Header Row example
 *   places it), Checkbox, TableAccountDetails in a Custom cell (ID,
 *   applicant, beneficiary, account, each a Detail Label's Label and Value;
 *   a "Recurring" Tag Info, without its icon, on a recurring cost), text
 *   cells, the status's StatusPill, and the RowActionsMenu.
 * - Expanded: a row under it with the cost's breakdown (Figma's Breakdown
 *   Table, 121:2957), or whatever `renderDetails` returns.
 *
 * It is controlled: the story owns the rows, their order, the selection and
 * the expanded rows. `sortCosts` and `nextCostSort` do the sorting the way
 * the Costs screens do (a new column sorts ascending, the same one flips).
 */

export type CostSortColumn = 'account' | 'invoiceNumber' | 'amount' | 'paymentMethod' | 'status' | 'submittedAt';

export interface CostSort {
  column: CostSortColumn;
  direction: Exclude<TableSort, 'none'>;
}

/** Table / Header – Costs, left to right. */
export const COSTS_COLUMNS: { key: CostSortColumn; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'amount', label: 'Amount' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'status', label: 'Status' },
  { key: 'submittedAt', label: 'Date Submitted' },
];

const sortValue: Record<CostSortColumn, (cost: Cost) => string | number> = {
  account: (c) => Number(c.id),
  invoiceNumber: (c) => c.invoiceNumber,
  amount: (c) => c.amount,
  paymentMethod: (c) => c.paymentMethod,
  status: (c) => costStatusLabel[c.status],
  submittedAt: (c) => c.submittedAt,
};

/** The rows in `sort`'s order (a new array; ties keep their order). No sort: as given. */
export function sortCosts(rows: readonly Cost[], sort: CostSort | null | undefined): Cost[] {
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
export function nextCostSort(sort: CostSort | null | undefined, column: CostSortColumn): CostSort {
  return { column, direction: sort?.column === column && sort.direction === 'ascending' ? 'descending' : 'ascending' };
}

/** The Status column: the status's Status Pill (Pending, Approved, Paid, Rejected). */
export function CostStatusBadge({ status }: { status: CostStatus }) {
  return <StatusPill status={costStatusPill[status]}>{costStatusLabel[status]}</StatusPill>;
}

/**
 * The expanded row's breakdown: Figma's Breakdown Table (121:2957) — Title,
 * Amount, Nature of Service, Cost Center, Location, Period. Figma draws it
 * as a frame, not a library component; the decision (Table / Breakdown) is
 * to build it from the generic parts, so here it is a TableList.
 */
export function CostBreakdownTable({ cost }: { cost: Cost }) {
  return (
    <TableList
      aria-label={`Breakdown of cost ${cost.id}`}
      header={
        <TableHeaderRow>
          {['Title', 'Amount', 'Nature of Service', 'Cost Center', 'Location', 'Period'].map((h) => (
            <TableHeaderCell key={h}>{h}</TableHeaderCell>
          ))}
        </TableHeaderRow>
      }
    >
      {cost.breakdowns.map((line, i) => (
        <TableRow key={i}>
          <TableCell>{line.title}</TableCell>
          <TableCell>{formatAmount(cost.currency, line.amount)}</TableCell>
          <TableCell>{line.natureOfService}</TableCell>
          <TableCell>{line.costCentre}</TableCell>
          <TableCell>{line.location}</TableCell>
          <TableCell>{formatPeriod(line.periodFrom, line.periodTo)}</TableCell>
        </TableRow>
      ))}
    </TableList>
  );
}

export interface CostsTableProps extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  /** The costs to show, in the order to show them (see `sortCosts`). */
  rows: readonly Cost[];
  /** A checkbox per row and a select-all checkbox in the header (Table / Row – Cost (Selectable)). */
  selectable?: boolean;
  /** The selected costs' ids. Ids not in `rows` (another page's) are kept. */
  selectedIds?: readonly string[];
  /** Called with the new selection. */
  onSelectionChange?: (ids: string[]) => void;
  /** An expand button per row (Expanded=true shows the breakdown under it). */
  expandable?: boolean;
  /** The expanded costs' ids. */
  expandedIds?: readonly string[];
  /** Called with the new expanded ids. */
  onExpandedChange?: (ids: string[]) => void;
  /** What an expanded row shows. Default: the cost's breakdown table. */
  renderDetails?: (cost: Cost) => React.ReactNode;
  /** The current sort; the header shows it. */
  sort?: CostSort | null;
  /** Makes the headers sortable; called with the next sort (`nextCostSort`). */
  onSortChange?: (sort: CostSort) => void;
  /** The row's MenuItems, for its ••• menu. Leave it out for no actions column. */
  rowActions?: (cost: Cost) => React.ReactNode;
  /** Shown across the table when there are no rows (an EmptyState). */
  empty?: React.ReactNode;
}

export const CostsTable = React.forwardRef<HTMLTableElement, CostsTableProps>(function CostsTable(
  {
    rows,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    expandable = false,
    expandedIds = [],
    onExpandedChange,
    renderDetails,
    sort,
    onSortChange,
    rowActions,
    empty,
    className,
    'aria-label': ariaLabel = 'Costs',
    ...table
  },
  ref,
) {
  const baseId = React.useId();
  const selected = new Set(selectedIds);
  const expanded = new Set(expandedIds);
  const shown = rows.map((r) => r.id);
  const shownSelected = shown.filter((id) => selected.has(id)).length;
  const all = shown.length > 0 && shownSelected === shown.length;
  const some = shownSelected > 0 && !all;
  const columnCount = COSTS_COLUMNS.length + (expandable ? 1 : 0) + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  /* Header checkbox: all shown rows → none of them; otherwise → all of them. */
  const toggleAll = () => {
    const shownSet = new Set(shown);
    onSelectionChange?.(
      all ? selectedIds.filter((id) => !shownSet.has(id)) : [...selectedIds, ...shown.filter((id) => !selected.has(id))],
    );
  };
  const toggle = (ids: readonly string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  return (
    <TableList
      ref={ref}
      aria-label={ariaLabel}
      className={className}
      {...table}
      header={
        /* Table / Header Row: a column per control, then the labels; no fill, a stroke.subtle line under it. */
        <TableHeaderRow
          showExpand={expandable}
          showCheckbox={selectable}
          checkboxProps={{
            'aria-label': 'Select all costs',
            checked: all,
            indeterminate: some,
            disabled: shown.length === 0,
            onChange: toggleAll,
          }}
          showActions={!!rowActions}
        >
          {COSTS_COLUMNS.map(({ key, label }) => (
            <TableHeaderCell
              key={key}
              sortable={!!onSortChange}
              sort={sort?.column === key ? sort.direction : 'none'}
              onSort={() => onSortChange?.(nextCostSort(sort, key))}
            >
              {label}
            </TableHeaderCell>
          ))}
        </TableHeaderRow>
      }
    >
      {rows.length === 0 && empty && (
        <TableRow>
          <TableCell type="custom" colSpan={columnCount}>
            {empty}
          </TableCell>
        </TableRow>
      )}
      {rows.map((cost) => {
        const isSelected = selected.has(cost.id);
        const isExpanded = expandable && expanded.has(cost.id);
        const detailsId = `${baseId}-details-${cost.id}`;
        return (
          <React.Fragment key={cost.id}>
            <TableRow selected={isSelected} data-id={cost.id}>
              {expandable && (
                <TableCell type="custom" className="w-1">
                  <TableExpandButton
                    label={`Show details for cost ${cost.id}`}
                    expanded={isExpanded}
                    aria-controls={isExpanded ? detailsId : undefined}
                    onClick={() => onExpandedChange?.(toggle(expandedIds, cost.id))}
                  />
                </TableCell>
              )}
              {selectable && (
                <TableCell type="checkbox" className="w-1">
                  <Checkbox
                    aria-label={`Select cost ${cost.id}`}
                    checked={isSelected}
                    onChange={() => onSelectionChange?.(toggle(selectedIds, cost.id))}
                  />
                </TableCell>
              )}
              {/* Table / Account Details, in Table / Cell Type=Custom. */}
              <TableCell type="custom">
                <TableAccountDetails
                  categoryTag={
                    cost.type === 'recurring' ? (
                      <Tag status="info" showIcon={false}>
                        Recurring
                      </Tag>
                    ) : undefined
                  }
                >
                  <TableDetailLabel label="ID:" value={cost.id} />
                  <TableDetailLabel label="Applicant:" value={cost.applicant.name} />
                  <TableDetailLabel label="Beneficiary name:" value={cost.partner} />
                  <TableDetailLabel {...accountLine(cost)} />
                </TableAccountDetails>
              </TableCell>
              <TableCell>{cost.invoiceNumber}</TableCell>
              <TableCell>{formatAmount(cost.currency, cost.amount)}</TableCell>
              <TableCell>{cost.paymentMethod}</TableCell>
              <TableCell type="tag">
                <CostStatusBadge status={cost.status} />
              </TableCell>
              <TableCell>{formatDate(cost.submittedAt)}</TableCell>
              {rowActions && (
                <TableCell type="actions" className="w-1">
                  <RowActionsMenu label={`Actions for cost ${cost.id}`}>{rowActions(cost)}</RowActionsMenu>
                </TableCell>
              )}
            </TableRow>
            {isExpanded && (
              <TableRow id={detailsId} selected={isSelected} data-details-for={cost.id}>
                <TableCell type="custom" colSpan={columnCount}>
                  {renderDetails ? renderDetails(cost) : <CostBreakdownTable cost={cost} />}
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        );
      })}
    </TableList>
  );
});
CostsTable.displayName = 'CostsTable';
