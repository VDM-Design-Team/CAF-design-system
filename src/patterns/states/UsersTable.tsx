import * as React from 'react';
import { SkeletonTableRow } from '../../components/skeleton-table-row';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableRow } from '../../components/table-row';
import { cn } from '../../lib/cn';
import { formatDate, type User } from '../fixtures';

/**
 * UsersTable — a story-level organism, not a DS component: the Users list as
 * pattern 11 draws it (Step 1, Screen · Loading table, 528:5814): a header
 * row of Table / Header Cells (Name, Role, Date Created) over the rows.
 *
 * - `loading`: five Skeleton / Table Rows, one placeholder per column, under
 *   the real header ("Skeleton rows hold the table's shape while data
 *   loads"). The table is `aria-busy` meanwhile.
 * - `empty`: shown across the body when there are no rows (an EmptyState:
 *   Compact "No items." for a search with no results).
 * - A row: Name (Two Line: the name over the email), Role, Date Created.
 *   Rows carry `data-id`.
 */
export const USERS_COLUMNS = ['Name', 'Role', 'Date Created'] as const;

export interface UsersTableProps extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  rows: readonly User[];
  /** Skeleton rows in place of the body while the list loads. */
  loading?: boolean;
  /** Shown across the table when there are no rows. */
  empty?: React.ReactNode;
}

export const UsersTable = React.forwardRef<HTMLTableElement, UsersTableProps>(function UsersTable(
  { rows, loading = false, empty, className, 'aria-label': ariaLabel = 'Users', ...table },
  ref,
) {
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
          {USERS_COLUMNS.map((label) => (
            <TableHeaderCell key={label} className="px-4">
              {label}
            </TableHeaderCell>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading && Array.from({ length: 5 }, (_, i) => <SkeletonTableRow key={i} columns={USERS_COLUMNS.length} />)}
        {!loading && rows.length === 0 && empty && (
          <TableRow>
            <TableCell type="tag" colSpan={USERS_COLUMNS.length}>
              {empty}
            </TableCell>
          </TableRow>
        )}
        {!loading &&
          rows.map((user) => (
            <TableRow key={user.id} data-id={user.id}>
              <TableCell type="two-line" primary={user.name} secondary={user.email} />
              <TableCell>{user.role}</TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
            </TableRow>
          ))}
      </tbody>
    </table>
  );
});
UsersTable.displayName = 'UsersTable';
