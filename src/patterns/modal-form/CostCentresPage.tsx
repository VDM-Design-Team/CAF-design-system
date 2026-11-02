import * as React from 'react';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { MenuItem } from '../../components/menu-item';
import { ModalConfirm } from '../../components/modal-confirm';
import { TableCell } from '../../components/table-cell';
import { useToast } from '../../components/toast';
import { costCentres, costCentreUsage } from '../fixtures';
import { RecordsTable, type RecordsTableColumn } from '../forms/RecordsTable';
import { PageHeader } from '../page/PageHeader';
import { CostCentreDialog, type CostCentreValues } from './CostCentreDialog';

/**
 * CostCentresPage — a story-level organism, not a DS component: the Cost
 * Centers list (Admin → Cost Centers) as patterns 04 and 05 draw it, with its
 * create, edit and delete flows wired up. It needs a ToastProvider above it.
 *
 * - Page Header: "Cost Centers" and the Default "Add New" button (plus icon).
 * - The table: Cost center, Nature of Service, Location, and a ••• menu per
 *   row with Edit and Delete (red, last).
 * - Add New / Edit (pattern 05) → CostCentreDialog; Save adds the record at
 *   the top of the list (or updates the row), closes the dialog and confirms
 *   with a success Toast ("Cost center added." / "Cost center updated.").
 *   Focus goes back to what opened the dialog.
 * - Delete (pattern 04) → Modal / Confirm, Destructive: "Delete cost
 *   center?", the message names the record. Delete removes the row and shows
 *   "Cost center deleted."; focus moves to the next row's ••• (the deleted
 *   one's is gone), or the previous one's, or Add New. A cost centre that
 *   costs still use (`inUse`) isn't deleted: an error Toast says why and stays
 *   until dismissed.
 */
export interface CostCentreRecord extends CostCentreValues {
  id: string;
}

export interface CostCentresPageProps {
  /** The records, newest first. Default: the fixture's twelve. */
  defaultRows?: readonly CostCentreRecord[];
  /** How many costs use each cost centre (by id): those can't be deleted. */
  inUse?: Record<string, number>;
  /** Called after a Save passes, with the values and the dialog's FormData. */
  onSave?: (values: CostCentreValues, data: FormData, mode: 'add' | 'edit') => void;
  /** Called after a confirmed delete (also when it fails). */
  onDelete?: (id: string, deleted: boolean) => void;
  /** Start with a dialog open: Add New, or Edit of a record id. */
  defaultDialog?: 'add' | { edit: string };
  /** Start with the delete confirmation open for a record id. */
  defaultConfirm?: string;
}

const actionsLabel = (row: CostCentreValues) => `Actions for ${row.name}, ${row.location}`;

const COLUMNS: RecordsTableColumn<CostCentreRecord>[] = [
  { header: 'Cost center', cell: (row) => <TableCell>{row.name}</TableCell> },
  { header: 'Nature of Service', cell: (row) => <TableCell>{row.natureOfService}</TableCell> },
  { header: 'Location', cell: (row) => <TableCell>{row.location}</TableCell> },
];

let added = 0;

export function CostCentresPage({
  defaultRows = costCentres,
  inUse = costCentreUsage,
  onSave,
  onDelete,
  defaultDialog,
  defaultConfirm,
}: CostCentresPageProps) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<CostCentreRecord[]>([...defaultRows]);
  const [dialog, setDialog] = React.useState<'add' | { edit: string } | null>(defaultDialog ?? null);
  const [confirmId, setConfirmId] = React.useState<string | null>(defaultConfirm ?? null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const addRef = React.useRef<HTMLButtonElement>(null);
  const focusAfterDelete = React.useRef<number | null>(null);

  /* After a delete: the next row's ••• (now at the deleted row's index), else the previous, else Add New. */
  React.useEffect(() => {
    const index = focusAfterDelete.current;
    if (index === null) return;
    focusAfterDelete.current = null;
    const triggers = tableRef.current?.querySelectorAll<HTMLButtonElement>('tbody [aria-haspopup="menu"]') ?? [];
    if (triggers.length) triggers[Math.min(index, triggers.length - 1)].focus();
    else addRef.current?.focus();
  });

  const editing = dialog && typeof dialog === 'object' ? rows.find((r) => r.id === dialog.edit) : undefined;
  const confirming = rows.find((r) => r.id === confirmId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cost Centers"
        actions={
          <Button ref={addRef} leftIcon={<Icon name="plus" />} onClick={() => setDialog('add')}>
            Add New
          </Button>
        }
      />
      <RecordsTable
        ref={tableRef}
        aria-label="Cost centers"
        columns={COLUMNS}
        rows={rows}
        rowId={(row) => row.id}
        actionsLabel={actionsLabel}
        rowActions={(row) => (
          <>
            <MenuItem onClick={() => setDialog({ edit: row.id })}>Edit</MenuItem>
            <MenuItem destructive onClick={() => setConfirmId(row.id)}>
              Delete
            </MenuItem>
          </>
        )}
      />

      <CostCentreDialog
        open={dialog !== null}
        record={editing}
        onClose={() => setDialog(null)}
        onSave={(values, data) => {
          if (editing) {
            setRows((all) => all.map((r) => (r.id === editing.id ? { ...r, ...values } : r)));
            toast({ type: 'success', message: 'Cost center updated.' });
          } else {
            added += 1;
            setRows((all) => [{ id: `cc-new-${added}`, ...values }, ...all]);
            toast({ type: 'success', message: 'Cost center added.' });
          }
          onSave?.(values, data, editing ? 'edit' : 'add');
          setDialog(null);
        }}
      />

      <ModalConfirm
        open={Boolean(confirming)}
        type="destructive"
        title="Delete cost center?"
        message={confirming ? `“${confirming.name}” will be permanently deleted. This can’t be undone.` : ''}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (!confirming) return;
          const uses = inUse[confirming.id];
          if (uses) {
            toast({ type: 'error', message: `Couldn’t delete. This cost center is used by ${uses} costs.` });
            onDelete?.(confirming.id, false);
          } else {
            focusAfterDelete.current = rows.indexOf(confirming);
            setRows((all) => all.filter((r) => r.id !== confirming.id));
            toast({ type: 'success', message: 'Cost center deleted.' });
            onDelete?.(confirming.id, true);
          }
          setConfirmId(null);
        }}
      />
    </div>
  );
}
