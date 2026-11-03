import * as React from 'react';
import { RowActionsMenu } from '../../components/row-actions-menu';
import { StatusPill } from '../../components/status-pill';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableHeaderRow } from '../../components/table-header-row';
import { TableList } from '../../components/table-list';
import { TableRow } from '../../components/table-row';
import type { Announcement } from '../fixtures';

/**
 * AnnouncementsTable — a story-level organism, not a DS component: the
 * Admin Announcements list with the header pattern 11 draws for it (Step 3,
 * Screen · Empty list, 528:5948): Title, Version, Target Audience, Status.
 * The Admin screen (CAF Design file, 2102:6628) has other columns (#, Date,
 * Features); docs/patterns.md asks which set is right.
 *
 * - Version: "v2.5.6", as the screen prints it.
 * - Status: Status Pill Active or Inactive. Only active announcements are
 *   shown to users.
 * - Actions: the row's ••• menu (`rowActions`), named "Actions for
 *   <title> v<version>" (titles repeat: "New Update Available").
 *
 * `empty` fills the body when there are no rows (pattern 11's Default Empty
 * State with its Add New action). Rows carry `data-id`.
 */
export const ANNOUNCEMENTS_COLUMNS = ['Title', 'Version', 'Target Audience', 'Status'] as const;

export interface AnnouncementsTableProps extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  rows: readonly Announcement[];
  /** The row's MenuItems, for its ••• menu. */
  rowActions?: (announcement: Announcement) => React.ReactNode;
  /** Shown across the table when there are no rows. */
  empty?: React.ReactNode;
}

export const AnnouncementsTable = React.forwardRef<HTMLTableElement, AnnouncementsTableProps>(function AnnouncementsTable(
  { rows, rowActions, empty, className, 'aria-label': ariaLabel = 'Announcements', ...table },
  ref,
) {
  const columnCount = ANNOUNCEMENTS_COLUMNS.length + (rowActions ? 1 : 0);
  return (
    <TableList
      ref={ref}
      aria-label={ariaLabel}
      className={className}
      {...table}
      header={
        <TableHeaderRow showActions={!!rowActions}>
          {ANNOUNCEMENTS_COLUMNS.map((label) => (
            <TableHeaderCell key={label}>{label}</TableHeaderCell>
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
      {rows.map((announcement) => (
        <TableRow key={announcement.id} data-id={announcement.id}>
          <TableCell>{announcement.title}</TableCell>
          <TableCell>v{announcement.version}</TableCell>
          <TableCell>{announcement.audience}</TableCell>
          <TableCell type="tag">
            {announcement.active ? <StatusPill status="active">Active</StatusPill> : <StatusPill status="inactive">Inactive</StatusPill>}
          </TableCell>
          {rowActions && (
            <TableCell type="actions" className="w-1">
              <RowActionsMenu label={`Actions for ${announcement.title} v${announcement.version}`}>
                {rowActions(announcement)}
              </RowActionsMenu>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableList>
  );
});
AnnouncementsTable.displayName = 'AnnouncementsTable';
