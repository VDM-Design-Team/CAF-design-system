import * as React from 'react';
import { MenuItem } from '../../components/menu-item';
import { ModalConfirm } from '../../components/modal-confirm';
import { PaymentRow } from '../../components/payment-row';
import { PaymentSchedules } from '../../components/payment-schedules';
import { RowActionsMenu } from '../../components/row-actions-menu';
import { StatusPill } from '../../components/status-pill';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableHeaderRow } from '../../components/table-header-row';
import { TableList } from '../../components/table-list';
import { TableRow } from '../../components/table-row';
import { useToast } from '../../components/toast';
import { formatDate, formatFrequency, formatPaymentAmount, formatShortDate, recurringCosts } from '../fixtures';
import { PageHeader } from '../../components/page-header';
import { RecurringCostSheet, type EditableRecurringCost, type RecurringCostUpdate } from './RecurringCostSheet';

/**
 * RecurringCostsPage — a story-level organism, not a DS component: the
 * Recurring Costs list as pattern 06 draws it (524:2956), with its row menu
 * wired up. It needs a ToastProvider above it.
 *
 * - The table, a TableList (Table / List): ID, Created By and Applicant (name
 *   over email), Frequency, Status, and a ••• menu per row: Edit, View
 *   Schedules, Stop, Delete (the Recurring Costs menu, in Figma's order; Stop
 *   only while the cost runs). Rows carry `data-id`.
 * - Edit (pattern 06) → RecurringCostSheet. Update saves the row, closes the
 *   sheet and confirms with "Recurring cost #1882 updated."; focus goes back to
 *   the row's •••.
 * - View Schedules → Payment Schedules (U04's modal): a Payment Row per date.
 * - Stop and Delete (pattern 04) → a destructive Modal / Confirm, then the row
 *   changes or goes, and a success Toast.
 */
export interface RecurringCostsPageProps {
  defaultRows?: readonly EditableRecurringCost[];
  /** Called after an Update passes. */
  onUpdate?: (id: string, update: RecurringCostUpdate, data: FormData) => void;
  /** Start with the side sheet open on a record id. */
  defaultEditing?: string;
  /** Start with Payment Schedules open on a record id. */
  defaultSchedules?: string;
  /** The calendars' today. */
  today?: Date;
}

const COLUMNS = ['ID', 'Created By', 'Applicant', 'Frequency', 'Status'];

type Confirming = { action: 'stop' | 'delete'; id: string } | null;

export function RecurringCostsPage({
  defaultRows = recurringCosts,
  onUpdate,
  defaultEditing,
  defaultSchedules,
  today,
}: RecurringCostsPageProps) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<EditableRecurringCost[]>([...defaultRows]);
  const [editingId, setEditingId] = React.useState<string | null>(defaultEditing ?? null);
  const [scheduleId, setScheduleId] = React.useState<string | null>(defaultSchedules ?? null);
  const [confirming, setConfirming] = React.useState<Confirming>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const focusAfterDelete = React.useRef<number | null>(null);

  React.useEffect(() => {
    const index = focusAfterDelete.current;
    if (index === null) return;
    focusAfterDelete.current = null;
    const triggers = tableRef.current?.querySelectorAll<HTMLButtonElement>('tbody [aria-haspopup="menu"]') ?? [];
    triggers[Math.min(index, triggers.length - 1)]?.focus();
  });

  const editing = rows.find((r) => r.id === editingId);
  const scheduled = rows.find((r) => r.id === scheduleId);
  const target = confirming && rows.find((r) => r.id === confirming.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Recurring Costs" />
      <TableList
        ref={tableRef}
        aria-label="Recurring costs"
        header={
          <TableHeaderRow showActions>
            {COLUMNS.map((label) => (
              <TableHeaderCell key={label}>{label}</TableHeaderCell>
            ))}
          </TableHeaderRow>
        }
      >
        {rows.map((row) => (
          <TableRow key={row.id} data-id={row.id}>
            <TableCell>#{row.id}</TableCell>
            <TableCell type="two-line" primary={row.createdBy.name} secondary={row.createdBy.email} />
            <TableCell type="two-line" primary={row.applicant.name} secondary={row.applicant.email} />
            <TableCell>{formatFrequency(row.frequency)}</TableCell>
            <TableCell type="tag">
              <StatusPill status={row.status}>{row.status === 'active' ? 'Active' : 'Stopped'}</StatusPill>
            </TableCell>
            <TableCell type="actions" className="w-1">
              <RowActionsMenu label={`Actions for recurring cost #${row.id}`}>
                <MenuItem onClick={() => setEditingId(row.id)}>Edit</MenuItem>
                <MenuItem onClick={() => setScheduleId(row.id)}>View Schedules</MenuItem>
                {row.status === 'active' && (
                  <MenuItem destructive onClick={() => setConfirming({ action: 'stop', id: row.id })}>
                    Stop
                  </MenuItem>
                )}
                <MenuItem destructive onClick={() => setConfirming({ action: 'delete', id: row.id })}>
                  Delete
                </MenuItem>
              </RowActionsMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableList>

      {editing && (
        <RecurringCostSheet
          key={editing.id}
          open
          cost={editing}
          today={today}
          onClose={() => setEditingId(null)}
          onUpdate={(update, data) => {
            setRows((all) => all.map((r) => (r.id === editing.id ? { ...r, ...update } : r)));
            onUpdate?.(editing.id, update, data);
            toast({ type: 'success', message: `Recurring cost #${editing.id} updated.` });
            setEditingId(null);
          }}
        />
      )}

      <PaymentSchedules open={Boolean(scheduled)} onClose={() => setScheduleId(null)}>
        {scheduled?.schedule.map((payment) => (
          <PaymentRow
            key={payment.date}
            status={payment.status}
            date={formatDate(payment.date)}
            subtitle={payment.status === 'done' ? `Processed on ${formatShortDate(payment.date)}` : 'Scheduled'}
            amount={formatPaymentAmount(scheduled)}
          />
        ))}
      </PaymentSchedules>

      <ModalConfirm
        open={Boolean(target)}
        type="destructive"
        title={confirming?.action === 'stop' ? 'Stop recurring cost?' : 'Delete recurring cost?'}
        message={
          !target
            ? ''
            : confirming?.action === 'stop'
              ? `Recurring cost #${target.id} will stop, and no more payments will be scheduled.`
              : `Recurring cost #${target.id} will be permanently deleted. This can’t be undone.`
        }
        confirmLabel={confirming?.action === 'stop' ? 'Stop' : 'Delete'}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (!target || !confirming) return;
          if (confirming.action === 'stop') {
            setRows((all) => all.map((r) => (r.id === target.id ? { ...r, status: 'stopped' } : r)));
            toast({ type: 'success', message: `Recurring cost #${target.id} stopped.` });
          } else {
            focusAfterDelete.current = rows.indexOf(target);
            setRows((all) => all.filter((r) => r.id !== target.id));
            toast({ type: 'success', message: `Recurring cost #${target.id} deleted.` });
          }
          setConfirming(null);
        }}
      />
    </div>
  );
}
