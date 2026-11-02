import * as React from 'react';
import { RowActionsMenu } from '../../components/row-actions-menu';
import { SkeletonTableRow } from '../../components/skeleton-table-row';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableRow } from '../../components/table-row';
import { Tag } from '../../components/tag';
import { cn } from '../../lib/cn';
import { emailOf, exportStatusTag, exportTypeLabel, type ExportRecord } from '../fixtures';

/**
 * ExportsTable — a story-level organism, not a DS component: the Exports
 * list as pattern 13 draws it (Screen · Exports overview, 529:6211). Figma
 * draws it as a frame of Table / Header Cells and Table / Rows, not a
 * library component.
 *
 * - Name: Table / Cell Two Line, the file name over "Zip · 253 B".
 * - Created By: Two Line, the person over their email.
 * - Status: Table / Cell Status + Date, the status Tag (Completed, Processing,
 *   Failed) over the date.
 * - Downloads: Text.
 * - Actions: the row's ••• menu (`rowActions`), when given, named
 *   "Actions for <file name>".
 *
 * `loading` shows Skeleton / Table Rows under the real header (pattern 11);
 * `empty` fills the body when there are no rows. Rows carry `data-id`.
 */
export const EXPORTS_COLUMNS = ['Name', 'Created By', 'Status', 'Downloads'] as const;

export interface ExportsTableProps extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  rows: readonly ExportRecord[];
  /** Downloads per export id. */
  downloads: Readonly<Record<string, number>>;
  /** The row's MenuItems, for its ••• menu. */
  rowActions?: (record: ExportRecord) => React.ReactNode;
  /** Skeleton rows in place of the body while the list loads. */
  loading?: boolean;
  /** Shown across the table when there are no rows (an EmptyState). */
  empty?: React.ReactNode;
}

export const ExportsTable = React.forwardRef<HTMLTableElement, ExportsTableProps>(function ExportsTable(
  { rows, downloads, rowActions, loading = false, empty, className, 'aria-label': ariaLabel = 'Exports', ...table },
  ref,
) {
  const columnCount = EXPORTS_COLUMNS.length + (rowActions ? 1 : 0);
  return (
    <table
      ref={ref}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={cn('w-full border-collapse', className)}
      {...table}
    >
      <thead>
        <tr className="border-b border-stroke-subtle">
          {EXPORTS_COLUMNS.map((label) => (
            <TableHeaderCell key={label} className="px-4">
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
        {loading && Array.from({ length: 4 }, (_, i) => <SkeletonTableRow key={i} columns={columnCount} />)}
        {!loading && rows.length === 0 && empty && (
          <TableRow>
            <TableCell type="tag" colSpan={columnCount}>
              {empty}
            </TableCell>
          </TableRow>
        )}
        {!loading &&
          rows.map((record) => {
            const status = exportStatusTag[record.status];
            return (
              <TableRow key={record.id} data-id={record.id}>
                <TableCell
                  type="two-line"
                  primary={record.name}
                  secondary={`${exportTypeLabel[record.type]} · ${record.size}`}
                />
                <TableCell type="two-line" primary={record.createdBy} secondary={emailOf(record.createdBy)} />
                <TableCell type="status-date" date={record.createdAt}>
                  <Tag status={status.status}>{status.label}</Tag>
                </TableCell>
                <TableCell>{downloads[record.id] ?? 0}</TableCell>
                {rowActions && (
                  <TableCell type="actions" className="w-1">
                    {/* Named by the file name: the pattern's table shows no ID. */}
                    <RowActionsMenu label={`Actions for ${record.name}`}>{rowActions(record)}</RowActionsMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
      </tbody>
    </table>
  );
});
ExportsTable.displayName = 'ExportsTable';
