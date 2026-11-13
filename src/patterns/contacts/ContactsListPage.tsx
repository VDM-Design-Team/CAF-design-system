import * as React from 'react';
import { Button } from '../../components/button';
import { EmptyState } from '../../components/empty-state';
import { ModalConfirm } from '../../components/modal-confirm';
import { PageHeader } from '../../components/page-header';
import { Pagination } from '../../components/pagination';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell, type TableSort } from '../../components/table-header-cell';
import { TableHeaderRow } from '../../components/table-header-row';
import { TableList } from '../../components/table-list';
import { TableRow } from '../../components/table-row';
import { useToast } from '../../components/toast';
import {
  ContactsFilterBar,
  EMPTY_CONTACT_FILTERS,
  filterContacts,
  hasActiveContactFilters,
  type ContactFilters,
} from '../filters/ContactsFilterBar';
import { emptyStateCopy, type Contact } from '../fixtures';

/**
 * ContactsListPage — a story-level organism, not a DS component: Admin →
 * Contacts as pattern 16 · Contact messages (Figma 951:7846) lays it out,
 * composed from DS components. The messages people send through the CAF
 * contact form. An admin can search, filter and remove them; a message can't
 * be opened, added or edited.
 *
 * - Page Header "Contacts": the title only, no page actions.
 * - ContactsFilterBar (Filter / Bar Page=Contacts): Search contacts and
 *   Select Period, with Clear Filters while a filter is in use. A filter
 *   change returns to page 1.
 * - The table: Figma's Table / Header – Contacts (951:11007) over Table /
 *   Row – Contact (951:11026). Email with the sender's name below (Two Line,
 *   320), Date Received (Text, 160; sortable, newest first), Subject (Text,
 *   160), Message (Text: the rest of the width, the whole message, wrapping
 *   onto as many lines as it needs) and Remove (Button, 112). Rows aren't
 *   clickable: there is no message view, so the row shows all of it.
 *   Decided 13 Nov 2026; Figma's row has drawn Message as Type=Text
 *   since then too.
 * - Remove is the only row action, so every row has a red Destructive Button
 *   / Small instead of a ••• menu. It asks first (pattern 04: Modal /
 *   Confirm, Destructive); on Remove the row goes, a Success toast says
 *   "Message removed.", and focus moves to the next row's Remove (or the
 *   search field when none is left).
 * - Nothing matches: the compact Empty State in the table, no pagination.
 *   No messages at all: the Default Empty State "No messages yet" in place
 *   of the table (pattern 11).
 *
 * Put it under a ToastProvider. It renders a column (`<div>`): a page or a
 * TemplateFrame supplies the `<main>`.
 */
export interface ContactsListPageProps {
  /** The messages at first. The page owns them from then on: Remove takes one out. */
  defaultContacts: readonly Contact[];
  /** Called after a message is removed (the confirm's Remove). */
  onRemove?: (contact: Contact) => void;
  /** Rows per page. Default 10. */
  pageSize?: number;
  /** The filters at first (a story's No results). */
  defaultFilters?: ContactFilters;
  /** Start with the remove confirmation open for a message id. */
  defaultConfirm?: string;
  /** The date picker's Today; stories pin it. */
  today?: Date;
}

/* Figma's column widths: Email 320, Date Received 160, Subject 160, Message fills, Actions 112. On GDL's
   scale (docs/figma-sync.md): Email 320 is container xs; Date Received and Subject take space.128 (Date
   Received grows to its sortable label, about 155); Actions hugs its Remove button, 112 with the padding. */
const W = { email: 'w-xs', date: 'w-32', subject: 'w-32', actions: 'w-1' } as const;
/* Message fills what the others leave. The table is at least 1024 wide (container 5xl), so Message keeps
   272 and the others their widths; on a narrower screen TableList's region scrolls sideways. */
const TABLE_MIN = 'min-w-5xl';

/* Newest first; on the same day, the later message (higher id) first, as Figma lists ITPM over Paolo Mendez. */
const byDate = (sort: TableSort) => (a: Contact, b: Contact) => {
  const order = a.receivedAt.localeCompare(b.receivedAt) || a.id.localeCompare(b.id, undefined, { numeric: true });
  return sort === 'ascending' ? order : -order;
};

export function ContactsListPage({
  defaultContacts,
  onRemove,
  pageSize = 10,
  defaultFilters = EMPTY_CONTACT_FILTERS,
  defaultConfirm,
  today,
}: ContactsListPageProps) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<Contact[]>(() => [...defaultContacts]);
  const [filters, setFilters] = React.useState<ContactFilters>(defaultFilters);
  const [sort, setSort] = React.useState<TableSort>('descending');
  const [page, setPage] = React.useState(1);
  const [confirmId, setConfirmId] = React.useState<string | null>(defaultConfirm ?? null);
  const pageRef = React.useRef<HTMLDivElement>(null);
  const focusAfterRemove = React.useRef<number | null>(null);

  const matching = filterContacts(rows, filters).sort(byDate(sort));
  const pageCount = Math.ceil(matching.length / pageSize);
  const current = Math.min(page, Math.max(pageCount, 1));
  const shown = matching.slice((current - 1) * pageSize, current * pageSize);
  const confirming = rows.find((c) => c.id === confirmId) ?? null;

  /* After a removal: the next row's Remove (the one that took its place), else the last one, else the search field.
     Only a removal changes `rows`, so the effect runs then. */
  React.useEffect(() => {
    const index = focusAfterRemove.current;
    if (index === null) return;
    focusAfterRemove.current = null;
    const buttons = pageRef.current?.querySelectorAll<HTMLButtonElement>('tbody [data-action="remove"]') ?? [];
    if (buttons.length) buttons[Math.min(index, buttons.length - 1)].focus();
    else pageRef.current?.querySelector<HTMLInputElement>('[role="search"] input')?.focus();
  }, [rows]);

  const header = (
    <TableHeaderRow>
      <TableHeaderCell className={W.email}>Email</TableHeaderCell>
      <TableHeaderCell
        className={W.date}
        sortable
        sort={sort}
        onSort={() => setSort((s) => (s === 'descending' ? 'ascending' : 'descending'))}
      >
        Date Received
      </TableHeaderCell>
      <TableHeaderCell className={W.subject}>Subject</TableHeaderCell>
      <TableHeaderCell>Message</TableHeaderCell>
      <TableHeaderCell className={W.actions}>Actions</TableHeaderCell>
    </TableHeaderRow>
  );

  return (
    <div ref={pageRef} className="flex flex-col gap-6">
      <PageHeader title="Contacts" />
      <ContactsFilterBar
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        today={today}
      />
      <p role="status" className="sr-only">
        {hasActiveContactFilters(filters) ? `Showing ${matching.length} of ${rows.length} messages` : ''}
      </p>
      {rows.length === 0 ? (
        <EmptyState title="No messages yet" description="Messages sent through the contact form will appear here." />
      ) : (
        <TableList aria-label="Contacts" className={TABLE_MIN} header={header}>
          {shown.length === 0 && (
            <TableRow>
              <TableCell type="custom" colSpan={5}>
                <EmptyState size="compact" title={emptyStateCopy.noResults.title} />
              </TableCell>
            </TableRow>
          )}
          {shown.map((c) => (
            <TableRow key={c.id} data-id={c.id}>
              <TableCell className={W.email} type="two-line" primary={c.email} secondary={c.name} />
              <TableCell className={W.date}>{c.receivedAt}</TableCell>
              <TableCell className={W.subject}>{c.subject}</TableCell>
              {/* The whole message, wrapped: there is nowhere else to read it (decision, 13 Nov 2026). */}
              <TableCell>{c.message}</TableCell>
              <TableCell className={W.actions} type="button">
                <Button
                  size="small"
                  variant="destructive"
                  data-action="remove"
                  aria-label={`Remove message from ${c.name}, received ${c.receivedAt}`}
                  onClick={() => setConfirmId(c.id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableList>
      )}
      {pageCount > 0 && <Pagination className="self-end" page={current} pageCount={pageCount} onPageChange={setPage} />}
      <ModalConfirm
        open={confirming !== null}
        type="destructive"
        title="Remove this message?"
        message={
          confirming
            ? `The message from ${confirming.name} (${confirming.email}), received ${confirming.receivedAt}, will be removed from Contacts. This can’t be undone.`
            : ''
        }
        confirmLabel="Remove"
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (!confirming) return;
          /* Its place on the page; the first row's when it isn't on this page (a story's defaultConfirm). */
          focusAfterRemove.current = Math.max(0, shown.indexOf(confirming));
          setConfirmId(null);
          setRows((all) => all.filter((c) => c.id !== confirming.id));
          onRemove?.(confirming);
          toast({ type: 'success', message: 'Message removed.' });
        }}
      />
    </div>
  );
}
