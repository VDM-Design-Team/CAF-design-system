import * as React from 'react';
import { Button } from '../../components/button';
import { EmptyState } from '../../components/empty-state';
import { FilterField } from '../../components/filter-field';
import { MenuItem } from '../../components/menu-item';
import { ModalConfirm } from '../../components/modal-confirm';
import { Pagination } from '../../components/pagination';
import { RowActionsMenu } from '../../components/row-actions-menu';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableHeaderRow } from '../../components/table-header-row';
import { TableList } from '../../components/table-list';
import { TableRow } from '../../components/table-row';
import { formatDate, type Draft } from '../fixtures';
import { PageHeader } from '../../components/page-header';

/**
 * DraftsList — a story-level organism, not a DS component: the Drafts page
 * of pattern U03 (545:18578, 545:18649), composed from DS components.
 *
 * - Page Header "Drafts"; a filter bar with Search (Filter / Field) and
 *   "Clear Filters"; the table: ID, Created By (name over email), Frequency
 *   ("Single" or the interval), Applicant Name, Email, Date Created, newest
 *   first, in a TableList (Table / List); Pagination under it. Rows carry
 *   `data-id`.
 * - ••• → Edit calls `onEdit` (the page reopens New Cost with the draft).
 *   ••• → Delete asks first (pattern 04): a destructive Modal / Confirm; Delete
 *   calls `onDelete`, and focus moves to the next row's •••.
 * - With no drafts, the Empty State with a Create Cost action (pattern 11),
 *   not just "No items."; a search that matches nothing says so in the table.
 *
 * Search matches the ID, the creator, the applicant and the email.
 */
export interface DraftsListProps<T extends Draft> {
  drafts: readonly T[];
  onEdit: (draft: T) => void;
  onDelete: (draft: T) => void;
  /** The Empty State's Create Cost. */
  onCreate: () => void;
  /** Rows per page. Default 10. */
  pageSize?: number;
  /** Start with the delete confirmation open for a draft id. */
  defaultConfirm?: string;
}

const COLUMNS = ['ID', 'Created By', 'Frequency', 'Applicant Name', 'Email', 'Date Created'];

const matches = (draft: Draft, query: string) => {
  const q = query.trim().toLowerCase();
  return (
    !q ||
    [draft.id, draft.createdBy.name, draft.createdBy.email, draft.applicant.name, draft.applicant.email].some((field) =>
      field.toLowerCase().includes(q),
    )
  );
};

export function DraftsList<T extends Draft>({
  drafts,
  onEdit,
  onDelete,
  onCreate,
  pageSize = 10,
  defaultConfirm,
}: DraftsListProps<T>) {
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [confirmId, setConfirmId] = React.useState<string | null>(defaultConfirm ?? null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const createRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const focusAfterDelete = React.useRef<number | null>(null);

  const filtered = drafts.filter((d) => matches(d, query));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const shown = filtered.slice((current - 1) * pageSize, current * pageSize);
  const confirming = drafts.find((d) => d.id === confirmId);

  React.useEffect(() => {
    const index = focusAfterDelete.current;
    if (index === null) return;
    focusAfterDelete.current = null;
    const triggers = tableRef.current?.querySelectorAll<HTMLButtonElement>('tbody [aria-haspopup="menu"]') ?? [];
    if (triggers.length) triggers[Math.min(index, triggers.length - 1)].focus();
    else (createRef.current ?? searchRef.current)?.focus();
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Drafts" />
      {drafts.length === 0 ? (
        <EmptyState
          title="No drafts yet"
          description="Save a cost to Drafts to finish it later. It will be listed here."
          action={
            <Button ref={createRef} onClick={onCreate}>
              Create Cost
            </Button>
          }
        />
      ) : (
        <>
          {/* The filter bar: Search, then Clear Filters. */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-sm">
              <FilterField
                ref={searchRef}
                label="Search drafts"
                placeholder="Search"
                value={query}
                onChange={(event) => {
                  setQuery((event.target as HTMLInputElement).value);
                  setPage(1);
                }}
              />
            </div>
            <Button variant="text" disabled={!query} onClick={() => setQuery('')}>
              Clear Filters
            </Button>
          </div>
          <TableList
            ref={tableRef}
            aria-label="Drafts"
            header={
              <TableHeaderRow showActions>
                {COLUMNS.map((label) => (
                  <TableHeaderCell key={label}>{label}</TableHeaderCell>
                ))}
              </TableHeaderRow>
            }
          >
            {shown.length === 0 && (
              <TableRow>
                <TableCell type="custom" colSpan={COLUMNS.length + 1}>
                  <EmptyState size="compact" title="No drafts match your search." />
                </TableCell>
              </TableRow>
            )}
            {shown.map((d) => (
              <TableRow key={d.id} data-id={d.id}>
                <TableCell>{d.id}</TableCell>
                <TableCell type="two-line" primary={d.createdBy.name} secondary={d.createdBy.email} />
                <TableCell>{d.frequency}</TableCell>
                <TableCell>{d.applicant.name}</TableCell>
                <TableCell>{d.applicant.email}</TableCell>
                <TableCell>{formatDate(d.createdAt)}</TableCell>
                <TableCell type="actions" className="w-1">
                  <RowActionsMenu label={`Actions for draft ${d.id}`}>
                    <MenuItem onClick={() => onEdit(d)}>Edit</MenuItem>
                    <MenuItem destructive onClick={() => setConfirmId(d.id)}>
                      Delete
                    </MenuItem>
                  </RowActionsMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableList>
          <Pagination className="self-end" page={current} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}
      <ModalConfirm
        open={Boolean(confirming)}
        type="destructive"
        title="Delete draft?"
        message={confirming ? `Draft #${confirming.id} will be permanently deleted. This can’t be undone.` : ''}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (!confirming) return;
          focusAfterDelete.current = shown.indexOf(confirming);
          setConfirmId(null);
          onDelete(confirming);
        }}
      />
    </div>
  );
}
