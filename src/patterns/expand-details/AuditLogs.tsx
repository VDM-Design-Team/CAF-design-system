import * as React from 'react';
import { Alert } from '../../components/alert';
import { Button } from '../../components/button';
import { ChangeDiff, ChangeDiffRow } from '../../components/change-diff';
import { ModalDialog } from '../../components/modal-dialog';
import { Pagination } from '../../components/pagination';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableHeaderRow } from '../../components/table-header-row';
import { TableList } from '../../components/table-list';
import { TableRow } from '../../components/table-row';
import { Tag } from '../../components/tag';
import { auditActivityTag, formatTimestamp, type AuditLogEntry } from '../fixtures';

/**
 * AuditLogTable and AuditLogsDialog — story-level compositions, not DS
 * components: the Audit Logs of pattern 08 (Patterns – Admin 526:5189, step 3),
 * which Figma draws as `_Pattern Content / Audit Logs` in the Content slot of
 * a `Modal / Dialog` (Size=Large, 526:4980).
 *
 * AuditLogTable, Figma → code:
 * - Header Row: a TableHeaderRow (Table / Header Row, Show Actions) of Table /
 *   Header Cells, not sortable: Cost ID, User, Timestamp, Activity, and the
 *   empty Actions column; the table is a TableList.
 * - Row: Table / Cell Text ("#32430"), Table / Cell Two Line (name over
 *   email), Text (the timestamp), a Tag (Activity: Created, Updated, Deleted;
 *   `auditActivityTag`), and a Button / Small (Text): "View Changes", which
 *   reads "Hide Changes" while the entry is open.
 * - Detail: a row under the entry with Table / Change Diff (one Change Diff
 *   Row per changed field), or, for a deleted record, nothing to compare: a
 *   compact Error Alert, "This cost was deleted".
 *
 * The button is a disclosure: `aria-expanded`, and `aria-controls` pointing
 * at the detail row. Its name starts with its visible text and adds the entry
 * ("View Changes for #32430, Updated, 2026-10-08 09:42"), so the buttons in
 * the table don't share a name.
 *
 * Controlled: the owner keeps which entries are open (`openIds`).
 */
export interface AuditLogTableProps extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  /** The entries to show, in order. */
  entries: readonly AuditLogEntry[];
  /** The ids of the entries whose changes are showing. */
  openIds?: readonly string[];
  /** Called with the new open ids. */
  onOpenChange?: (ids: string[]) => void;
}

export const AuditLogTable = React.forwardRef<HTMLTableElement, AuditLogTableProps>(function AuditLogTable(
  { entries, openIds = [], onOpenChange, className, 'aria-label': ariaLabel = 'Audit log', ...table },
  ref,
) {
  const baseId = React.useId();
  const open = new Set(openIds);
  const toggle = (id: string) => onOpenChange?.(open.has(id) ? openIds.filter((x) => x !== id) : [...openIds, id]);

  return (
    <TableList
      ref={ref}
      aria-label={ariaLabel}
      className={className}
      {...table}
      header={
        <TableHeaderRow showActions>
          {['Cost ID', 'User', 'Timestamp', 'Activity'].map((label) => (
            <TableHeaderCell key={label}>{label}</TableHeaderCell>
          ))}
        </TableHeaderRow>
      }
    >
      {entries.map((entry) => {
        const isOpen = open.has(entry.id);
        const detailsId = `${baseId}-changes-${entry.id}`;
        const activity = auditActivityTag[entry.activity];
        const when = formatTimestamp(entry.at);
        const label = isOpen ? 'Hide Changes' : 'View Changes';
        return (
          <React.Fragment key={entry.id}>
            <TableRow data-id={entry.id}>
              <TableCell>#{entry.costId}</TableCell>
              <TableCell type="two-line" primary={entry.user.name} secondary={entry.user.email} />
              <TableCell>{when}</TableCell>
              <TableCell type="tag">
                <Tag status={activity.status}>{activity.label}</Tag>
              </TableCell>
              <TableCell type="actions" className="w-1 whitespace-nowrap">
                <Button
                  variant="text"
                  size="small"
                  aria-label={`${label} for #${entry.costId}, ${activity.label}, ${when}`}
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? detailsId : undefined}
                  onClick={() => toggle(entry.id)}
                >
                  {label}
                </Button>
              </TableCell>
            </TableRow>
            {isOpen && (
              <TableRow id={detailsId} data-details-for={entry.id}>
                <TableCell type="custom" colSpan={5}>
                  {entry.activity === 'deleted' ? (
                    <Alert type="error" size="compact" message="This cost was deleted" />
                  ) : (
                    <ChangeDiff aria-label={`Changes to cost #${entry.costId}`}>
                      {entry.changes.map((change) => (
                        <ChangeDiffRow key={change.field} field={change.field} before={change.before} after={change.after} />
                      ))}
                    </ChangeDiff>
                  )}
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        );
      })}
    </TableList>
  );
});
AuditLogTable.displayName = 'AuditLogTable';

/** Entries per page in the dialog: Figma shows four. */
export const AUDIT_PAGE_SIZE = 4;

export interface AuditLogsDialogProps {
  open: boolean;
  onClose: () => void;
  /** Every entry, newest first; the dialog pages through them. */
  entries: readonly AuditLogEntry[];
  /** Entries open at first (Figma's step 3 shows the first two). */
  defaultOpenIds?: readonly string[];
}

/**
 * The wide dialog View Audit Logs opens: Modal / Dialog, Size=Large, titled
 * "Audit Logs", the table, and Pagination under it (Figma's Pagination Row).
 * Changing the page keeps the open entries open when you come back.
 */
export function AuditLogsDialog({ open, onClose, entries, defaultOpenIds = [] }: AuditLogsDialogProps) {
  const [page, setPage] = React.useState(1);
  const [openIds, setOpenIds] = React.useState<string[]>([...defaultOpenIds]);
  const pageCount = Math.max(1, Math.ceil(entries.length / AUDIT_PAGE_SIZE));
  const shown = entries.slice((page - 1) * AUDIT_PAGE_SIZE, page * AUDIT_PAGE_SIZE);

  return (
    <ModalDialog open={open} onClose={onClose} title="Audit Logs" size="large">
      <div className="flex flex-col gap-4">
        <AuditLogTable entries={shown} openIds={openIds} onOpenChange={setOpenIds} />
        <Pagination aria-label="Audit log pages" page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </ModalDialog>
  );
}
