import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { EmptyState } from '../../components/empty-state';
import { FilterField } from '../../components/filter-field';
import { FilterSelect } from '../../components/filter-select';
import { MenuItem } from '../../components/menu-item';
import { ModalConfirm } from '../../components/modal-confirm';
import { Pagination } from '../../components/pagination';
import { ToastProvider, useToast } from '../../components/toast';
import {
  emptyStateCopy,
  exportDownloads,
  exportRecords,
  exportStats,
  exportStatusTag,
  exportTypeLabel,
  toastMessages,
  type ExportRecord,
} from '../fixtures';
import { PageHeader } from '../../components/page-header';
import { ExportDetailsDialog } from './ExportDetailsDialog';
import { ExportsTable } from './ExportsTable';
import { ExportsStatRow, type ExportStats } from './StatRows';

/* Pattern 13 draws four rows a page. */
const PAGE_SIZE = 4;
const STATUS_OPTIONS = Object.values(exportStatusTag).map((s) => s.label);
const TYPE_OPTIONS = Object.values(exportTypeLabel);

interface ExportsPageProps {
  /** Open Export Details for this export on first render (the overlay story). */
  openId?: string;
  /** How long the details take to arrive, in ms. */
  detailsLatency?: number;
}

/* The Exports page as pattern 13 draws it: header, stats, filter bar, table, pagination. The story
   owns the data, so the row actions really change it. */
function ExportsPage({ openId, detailsLatency = 600 }: ExportsPageProps) {
  const { toast } = useToast();
  const [records, setRecords] = useState<ExportRecord[]>(exportRecords);
  const [stats, setStats] = useState<ExportStats>(exportStats);
  const [downloads, setDownloads] = useState<Record<string, number>>(exportDownloads);
  const [query, setQuery] = useState('');
  /* null: All Status / All Types, each filter's reset item. */
  const [status, setStatus] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [details, setDetails] = useState<{ id: string; loading: boolean } | null>(
    openId ? { id: openId, loading: false } : null,
  );
  const [deleting, setDeleting] = useState<ExportRecord | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const focusAfterDelete = useRef<string | null>(null);

  const filtered = records.filter(
    (r) =>
      r.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (status === null || exportStatusTag[r.status].label === status) &&
      (type === null || exportTypeLabel[r.type] === type),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filterBy = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };

  /* The details "arrive" after a moment: the dialog opens straight away with a Spinner (pattern 11). */
  const loading = details?.loading ?? false;
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setDetails((d) => d && { ...d, loading: false }), detailsLatency);
    return () => window.clearTimeout(timer);
  }, [loading, detailsLatency]);

  /* After a delete, focus the next row's ••• (or the previous one's, or the search box): its own is gone. */
  useEffect(() => {
    if (deleting || !focusAfterDelete.current) return;
    const id = focusAfterDelete.current;
    focusAfterDelete.current = null;
    const next = tableRef.current?.querySelector<HTMLElement>(`tr[data-id="${id}"] [aria-haspopup]`);
    (next ?? searchRef.current)?.focus();
  }, [deleting]);

  const download = (record: ExportRecord) => setDownloads((d) => ({ ...d, [record.id]: (d[record.id] ?? 0) + 1 }));
  const retry = (record: ExportRecord) => {
    setRecords((all) => all.map((r) => (r.id === record.id ? { ...r, status: 'processing' } : r)));
    setStats((s) => ({ ...s, failed: s.failed - 1, processing: s.processing + 1 }));
    toast({ type: 'info', message: toastMessages.exportStarted });
  };
  const remove = (record: ExportRecord) => {
    const index = shown.findIndex((r) => r.id === record.id);
    focusAfterDelete.current = shown[index + 1]?.id ?? shown[index - 1]?.id ?? 'search';
    setRecords((all) => all.filter((r) => r.id !== record.id));
    setStats((s) => ({ ...s, total: s.total - 1, [record.status]: s[record.status] - 1 }));
    setDeleting(null);
    toast({ type: 'success', message: 'Export deleted.' });
  };
  const open = records.find((r) => r.id === details?.id) ?? null;

  return (
    <main className="flex flex-col gap-6 p-6 pb-64">
      <PageHeader title="Exports" />
      <ExportsStatRow stats={stats} />
      <div className="flex flex-wrap gap-4">
        <FilterField
          ref={searchRef}
          label="Search exports"
          placeholder="Search exports"
          className="w-64"
          value={query}
          onChange={(e) => filterBy(setQuery)(e.target.value)}
        />
        <FilterSelect
          className="w-64"
          label="Status"
          allLabel="All Status"
          options={STATUS_OPTIONS}
          value={status}
          onValueChange={filterBy(setStatus)}
        />
        <FilterSelect
          className="w-64"
          label="Type"
          allLabel="All Types"
          options={TYPE_OPTIONS}
          value={type}
          onValueChange={filterBy(setType)}
        />
      </div>
      <ExportsTable
        ref={tableRef}
        rows={shown}
        downloads={downloads}
        empty={<EmptyState size="compact" title={emptyStateCopy.noResults.title} />}
        rowActions={(record) => (
          /* Figma's menu (529:6397): Download, Retry, View Details, Delete. A row offers only what it can do. */
          <>
            {record.status === 'completed' && <MenuItem onClick={() => download(record)}>Download</MenuItem>}
            {record.status === 'failed' && <MenuItem onClick={() => retry(record)}>Retry</MenuItem>}
            <MenuItem onClick={() => setDetails({ id: record.id, loading: true })}>View Details</MenuItem>
            <MenuItem destructive onClick={() => setDeleting(record)}>
              Delete
            </MenuItem>
          </>
        )}
      />
      <Pagination page={current} pageCount={pageCount} onPageChange={setPage} />
      <ExportDetailsDialog
        open={!!details}
        onClose={() => setDetails(null)}
        record={open}
        loading={loading}
        downloads={open ? (downloads[open.id] ?? 0) : 0}
        onDownload={download}
      />
      <ModalConfirm
        open={!!deleting}
        type="destructive"
        title="Delete export?"
        message={deleting ? `“${deleting.name}” will be permanently deleted. This can’t be undone.` : ''}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />
    </main>
  );
}

const meta = {
  title: 'Patterns/Overview & record details',
  component: ExportsPage,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern 13 (Figma 529:6821): pages that track jobs put a row of totals above the list, and each record’s ' +
          'full details open read-only in a dialog. **Card / Stat Row – Exports** (387:3601, `ExportsStatRow`) sits between ' +
          'the PageHeader and the filter bar and counts the whole collection, not the page. The list is an `ExportsTable` ' +
          '(Two Line, Status + Date and Text cells). ••• → View Details opens **Export Details** (`ExportDetailsDialog`): ' +
          'Modal / Dialog Medium, a Spinner until the details arrive (pattern 11), then a DescriptionList and a ' +
          'FilterSummary, with Download in the footer. Retry re-runs a failed export (an Info toast); Delete asks first ' +
          '(Modal / Confirm, pattern 04), then a Success toast. All story-level organisms in `src/patterns/overview/`.',
      },
    },
  },
} satisfies Meta<typeof ExportsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Helpers for the plays ──────────────────────────────────────────────── */

const exportsTable = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole('table', { name: 'Exports' }) as HTMLTableElement;
const rowIds = (table: HTMLTableElement) =>
  Array.from(table.tBodies[0].rows)
    .map((r) => r.dataset.id)
    .filter(Boolean);
const rowOf = (table: HTMLTableElement, id: string) => table.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`)!;
const stat = (canvasElement: HTMLElement, label: string) =>
  within(within(canvasElement).getByRole('article', { name: label })).getByText(/^\d+$/).textContent;
const nameOf = (id: string) => exportRecords.find((r) => r.id === id)!.name;

/* Choose an option in a FilterSelect from the keyboard: Enter opens the list on the checked option, the
   arrows walk to `option`, Enter picks it. Focus stays on the field. */
async function chooseFilter(canvasElement: HTMLElement, filter: string, option: string) {
  const canvas = within(canvasElement);
  const field = canvas.getByRole('combobox', { name: filter });
  field.focus();
  await userEvent.keyboard('{Enter}');
  const list = canvas.getByRole('listbox', { name: filter });
  const options = within(list).getAllByRole('option');
  const from = options.findIndex((o) => o.getAttribute('aria-selected') === 'true');
  await expect(field).toHaveAttribute('aria-activedescendant', options[from].id);
  const to = options.findIndex((o) => o.textContent === option);
  const key = to > from ? '{ArrowDown}' : '{ArrowUp}';
  if (to !== from) await userEvent.keyboard(key.repeat(Math.abs(to - from)));
  await userEvent.keyboard('{Enter}');
  await expect(canvas.queryByRole('listbox')).toBeNull();
  await expect(field).toHaveTextContent(option);
}

/**
 * Stats above the list (Step 1). The totals count every export, so they don't move when a filter or
 * the page changes. Filters narrow the rows and go back to page 1; nothing found shows the compact
 * Empty State with the filters still in place.
 */
export const StatsFiltersAndPages: Story = {
  name: 'Stats, filters and pages',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = exportsTable(canvasElement);
    const totals = canvas.getByRole('group', { name: 'Export totals' });
    await expect(within(totals).getAllByRole('article').map((a) => a.textContent)).toEqual([
      'Total Exports6003',
      'Completed5665',
      'Processing0',
      'Failed338',
    ]);
    // Between the page header and the filter bar.
    const heading = canvas.getByRole('heading', { level: 1, name: 'Exports' });
    const search = canvas.getByRole('searchbox', { name: 'Search exports' });
    await expect(totals.getBoundingClientRect().top).toBeGreaterThan(heading.getBoundingClientRect().bottom);
    await expect(search.getBoundingClientRect().top).toBeGreaterThan(totals.getBoundingClientRect().bottom);

    // Page 1 of 2: four rows, newest first. Pattern 13's columns.
    await expect(rowIds(table)).toEqual(['6846', '6845', '6844', '6843']);
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent);
    await expect(headers).toEqual(['Name', 'Created By', 'Status', 'Downloads', 'Actions']);
    const first = rowOf(table, '6846');
    await expect(within(first).getByText('Zip · 253 B')).toBeVisible();
    await expect(within(first).getByText('admin1@geekee.com')).toBeVisible();
    await expect(within(first).getByText('Completed')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Page 2' }));
    await expect(rowIds(table)).toEqual(['6842', '6841', '6840', '6839']);
    await expect(stat(canvasElement, 'Total Exports')).toBe('6003');

    // A filter goes back to page 1, and the stats stay whole.
    await chooseFilter(canvasElement, 'Type', 'Excel');
    await expect(canvas.getByRole('combobox', { name: 'Type' })).toHaveFocus();
    await expect(rowIds(table)).toEqual(['6845', '6843', '6841', '6839']);
    await expect(canvas.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await chooseFilter(canvasElement, 'Status', 'Failed');
    // No failed Excel export: the compact Empty State, inside the table; the filters stay.
    await expect(rowIds(table)).toEqual([]);
    await expect(within(table).getByText('No items.')).toBeVisible();
    await expect(canvas.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Failed');
    await expect(stat(canvasElement, 'Failed')).toBe('338');

    await chooseFilter(canvasElement, 'Type', 'All Types');
    await expect(rowIds(table)).toEqual(['6840']);

    // Search narrows by name.
    await chooseFilter(canvasElement, 'Status', 'All Status');
    await userEvent.type(search, '09-24');
    await expect(rowIds(table)).toEqual(['6846', '6845']);
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeDisabled();
  },
};

/**
 * Details in a read-only dialog (Step 2): ••• → View Details opens Export Details straight away with
 * a Spinner, then the record as label / value pairs and the filters it was made with. Download, the
 * main action, counts in the dialog and the table. Escape closes it, and focus goes back to the •••.
 */
export const ViewDetails: Story = {
  name: 'View details',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = exportsTable(canvasElement);
    const trigger = canvas.getByRole('button', { name: `Actions for ${nameOf('6846')}` });

    await userEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: `Actions for ${nameOf('6846')}` });
    // A completed export: Download, View Details, Delete (no Retry).
    await expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Download', 'View Details', 'Delete']);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'View Details' }));

    // Straight away: the dialog, with a Spinner and no footer.
    const dialog = await screen.findByRole('dialog', { name: 'Export Details' });
    await expect(within(dialog).getByRole('status')).toHaveTextContent('Loading export details');
    await expect(within(dialog).queryByRole('button', { name: 'Download' })).toBeNull();

    // Then the details.
    await waitFor(() => expect(dialog.querySelector('dl')).not.toBeNull(), { timeout: 3000 });
    const list = dialog.querySelector('dl')!;
    const pairs = Array.from(list.querySelectorAll(':scope > div')).map(
      (d) => `${d.querySelector('dt')!.textContent}: ${d.querySelector('dd')!.textContent}`,
    );
    await expect(pairs).toEqual([
      `Name: ${nameOf('6846')}`,
      'Type: Zip',
      'Created By: Admin Account',
      'File Size: 253 B',
      'Created: 2026-09-24',
      'Completed: 2026-09-24',
      'Valid until: 2026-10-01',
      'Downloads: 0',
    ]);
    const filters = within(dialog).getByRole('group', { name: 'Current Filters' });
    await expect(within(filters).getAllByRole('term').map((t) => t.textContent)).toEqual(['Status:', 'Payment Method:', 'Currency:']);

    // Download: the count goes up, in the dialog and in the table.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Download' }));
    await expect(within(dialog).getByText('Downloads').nextElementSibling).toHaveTextContent('1');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(within(rowOf(table, '6846')).getAllByRole('cell')[3]).toHaveTextContent('1');

    // From the keyboard: ↓ opens the menu, ↓ to View Details, Enter; Close in the footer closes it.
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Download' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    const again = await screen.findByRole('dialog', { name: 'Export Details' });
    // Figma's footer Close joins the header's X once the details are in; the footer's is the last.
    await waitFor(() => expect(within(again).getAllByRole('button', { name: 'Close' })).toHaveLength(2), { timeout: 3000 });
    await userEvent.click(within(again).getAllByRole('button', { name: 'Close' })[1]);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

/**
 * ••• → Retry runs a failed export again: it shows Processing, the stats move, and an Info toast says
 * where it will appear. ••• → Delete asks first (Modal / Confirm, Destructive), then removes the row,
 * says so in a Success toast and puts focus on the next row's •••.
 */
export const RetryAndDelete: Story = {
  name: 'Retry and delete',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = exportsTable(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Page 2' }));
    const failed = canvas.getByRole('button', { name: `Actions for ${nameOf('6840')}` });

    // A failed export: Retry, View Details, Delete (no Download).
    failed.focus();
    await userEvent.keyboard('{Enter}');
    const menu = screen.getByRole('menu', { name: `Actions for ${nameOf('6840')}` });
    await expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Retry', 'View Details', 'Delete']);
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Retry' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await expect(within(rowOf(table, '6840')).getByText('Processing')).toBeVisible();
    await expect(stat(canvasElement, 'Failed')).toBe('337');
    await expect(stat(canvasElement, 'Processing')).toBe('1');
    const notifications = within(screen.getByRole('region', { name: 'Notifications' }));
    await expect(notifications.getByText(toastMessages.exportStarted)).toBeVisible();
    await userEvent.click(notifications.getByRole('button', { name: 'Dismiss' }));

    // Delete 6841: confirm, the row goes, a toast, focus on the next row's •••.
    await userEvent.click(canvas.getByRole('button', { name: `Actions for ${nameOf('6841')}` }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete export?' });
    await expect(confirm).toHaveAccessibleDescription(`“${nameOf('6841')}” will be permanently deleted. This can’t be undone.`);
    // Cancel is the safe default: it has focus.
    await waitFor(() => expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(rowIds(table)).toEqual(['6842', '6840', '6839']);
    await expect(stat(canvasElement, 'Total Exports')).toBe('6002');
    await expect(stat(canvasElement, 'Completed')).toBe('5664');
    await expect(notifications.getByText('Export deleted.')).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('button', { name: `Actions for ${nameOf('6840')}` })).toHaveFocus());
  },
};

/** Export Details, open (Step 2's screen). */
export const DetailsOpen: Story = {
  name: 'Details open',
  args: { openId: '6846' },
  // An open dialog makes the rest of the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Export Details' });
    await expect(within(dialog).getByRole('group', { name: 'Current Filters' })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Download' })).toBeVisible();
  },
};

/** Dark: the Exports overview. */
export const Dark: Story = {
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('group', { name: 'Export totals' })).toBeVisible();
    await expect(rowIds(exportsTable(canvasElement))).toHaveLength(PAGE_SIZE);
  },
};
