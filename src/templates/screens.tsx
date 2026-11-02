import * as React from 'react';
import { BulletItem } from '../components/bullet-item';
import { Button } from '../components/button';
import { ChangelogModal } from '../components/changelog-modal';
import { EmptyState } from '../components/empty-state';
import { FilterDateRange } from '../components/filter-date-range';
import { FilterField } from '../components/filter-field';
import { FilterSelect } from '../components/filter-select';
import { Icon } from '../components/icon';
import { MenuItem } from '../components/menu-item';
import { Pagination } from '../components/pagination';
import { useToast } from '../components/toast';
import { SettingsPage } from '../patterns/account-settings/SettingsPage';
import { AnnouncementsTable } from '../patterns/announcements/AnnouncementsTable';
import { CreateAnnouncementDialog } from '../patterns/announcements/CreateAnnouncementDialog';
import type { ShellApp } from '../patterns/app-shell/AppShell';
import { DraftsList } from '../patterns/drafts/DraftsList';
import { AuditLogsDialog } from '../patterns/expand-details/AuditLogs';
import { FILTER_SLOT, FilterBar, toDateRange, toDayRange, type DayRange } from '../patterns/filters/CostsFilterBar';
import {
  announcements,
  auditLog,
  costs,
  drafts,
  emptyStateCopy,
  exportDownloads,
  exportRecords,
  exportStats,
  exportStatusTag,
  exportTypeLabel,
  formatDate,
  LIST_TODAY,
  myCosts,
  NEW_DRAFT_ID,
  signedInAccounts,
  TEMPLATE_TODAY,
  userRecurringCosts,
  type Announcement,
  type CostType,
  type Draft,
  type ExportRecord,
  type ExportStatus,
  type ExportType,
} from '../patterns/fixtures';
import { BulkUploadForm } from '../patterns/forms/BulkUploadForm';
import { NewCostForm } from '../patterns/forms/NewCostForm';
import { CostsListPage } from '../patterns/list-page/CostsListPage';
import { CostCentresPage } from '../patterns/modal-form/CostCentresPage';
import { ExportDetailsDialog } from '../patterns/overview/ExportDetailsDialog';
import { ExportsTable } from '../patterns/overview/ExportsTable';
import { AnnouncementsStatRow, ExportsStatRow, summariseAnnouncements } from '../patterns/overview/StatRows';
import { PageHeader } from '../components/page-header';
import { RecurringCostsPage } from '../patterns/side-sheet/RecurringCostsPage';
import { UsersPage } from '../patterns/states/UsersPage';

/**
 * The screens the templates lay out: story-level compositions, not DS
 * components. Each is one page of the CAF Design file's Admin screens
 * (page 2102:4) or User Screens (2102:3), built from the pattern organisms in
 * `src/patterns/`. Each renders a column (`<div>` or a fragment), not a
 * `<main>`: TemplateFrame puts it in AppShell's `<main>` and page container,
 * under a ToastProvider.
 *
 * What each page does is the patterns' behaviour, kept to what the page shows:
 * the filters filter the sample rows, pagination pages, the primary action
 * opens its overlay, and a row's ••• opens the overlays the page draws. The
 * flows themselves (delete, retry, bulk status) are the patterns' stories.
 */

/* ── List pages (Templates/List page) ──────────────────────────────────── */

export interface AdminCostsScreenProps {
  /** Start with the Audit Logs dialog open (Admin / Costs — Audit Logs modal, 2102:5857). */
  auditLogsOpen?: boolean;
}

/** Admin / Costs — List (2102:5749): title, Tabs / Cost Type, View Audit Logs and Export; filter bar; table; pagination. */
export function AdminCostsScreen({ auditLogsOpen = false }: AdminCostsScreenProps) {
  const [audit, setAudit] = React.useState(auditLogsOpen);
  return (
    <>
      <CostsListPage as="div" rows={costs} audience="admin" today={LIST_TODAY} onViewAuditLogs={() => setAudit(true)} />
      <AuditLogsDialog open={audit} onClose={() => setAudit(false)} entries={auditLog} />
    </>
  );
}

/** User / Costs — List (2102:1069): the user's own costs; title, tabs and Export; no audit logs, no selection. */
export function UserCostsScreen() {
  return <CostsListPage as="div" rows={myCosts} audience="user" today={LIST_TODAY} />;
}

export interface DraftsScreenProps {
  /** ••• → Edit: the app reopens Create Cost with the draft (pattern U03). */
  onEdit?: (draft: Draft) => void;
  /** The empty state's Create Cost. */
  onCreate?: () => void;
  /** Start with the delete confirmation open for a draft id. */
  defaultConfirm?: string;
}

/** Admin / Drafts (2102:7086), User / Drafts — List (2102:1342): title, Search and Clear Filters, table, pagination. */
export function DraftsScreen({ onEdit = () => {}, onCreate = () => {}, defaultConfirm }: DraftsScreenProps) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<Draft[]>(drafts);
  return (
    <DraftsList
      drafts={rows}
      onEdit={onEdit}
      onCreate={onCreate}
      defaultConfirm={defaultConfirm}
      onDelete={(draft) => {
        setRows((all) => all.filter((d) => d.id !== draft.id));
        toast({ type: 'success', message: 'Draft deleted.' });
      }}
    />
  );
}

/* ── Overview lists (Templates/Overview list) ──────────────────────────── */

/* Pattern 13 pages exports four at a time, so eight make two pages. */
const EXPORTS_PAGE_SIZE = 4;
const EXPORT_STATUSES = Object.keys(exportStatusTag) as ExportStatus[];
const EXPORT_TYPES = Object.keys(exportTypeLabel) as ExportType[];
const EXPORT_STATUS_OPTIONS = EXPORT_STATUSES.map((value) => ({ value, label: exportStatusTag[value].label }));
const EXPORT_TYPE_OPTIONS = EXPORT_TYPES.map((value) => ({ value, label: exportTypeLabel[value] }));

export interface ExportsScreenProps {
  /** Start with Export Details open for an export id. */
  detailsFor?: string;
}

/**
 * Admin / Exports (2102:6902): "Export Management", Card / Stat Row – Exports,
 * the filter bar (Search exports, status, type, Clear Filters), the Exports
 * table and pagination. ••• offers Download (a completed export) and View
 * Details (pattern 13's dialog); Retry and Delete are pattern 13's flows.
 */
export function ExportsScreen({ detailsFor }: ExportsScreenProps) {
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<ExportStatus | null>(null);
  const [type, setType] = React.useState<ExportType | null>(null);
  const [page, setPage] = React.useState(1);
  const [downloads, setDownloads] = React.useState<Record<string, number>>(exportDownloads);
  const [details, setDetails] = React.useState<string | null>(detailsFor ?? null);
  const searchRef = React.useRef<HTMLInputElement | HTMLButtonElement | null>(null);

  const q = query.trim().toLowerCase();
  const matching = exportRecords.filter(
    (r) => (!q || r.name.toLowerCase().includes(q) || r.id.includes(q)) && (!status || r.status === status) && (!type || r.type === type),
  );
  const pageCount = Math.ceil(matching.length / EXPORTS_PAGE_SIZE);
  const current = Math.min(page, Math.max(pageCount, 1));
  const shown = matching.slice((current - 1) * EXPORTS_PAGE_SIZE, current * EXPORTS_PAGE_SIZE);
  const active = q !== '' || status !== null || type !== null;
  /* A filter returns to page 1 (pattern 02). */
  const filterBy =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };
  const download = (record: ExportRecord) => setDownloads((d) => ({ ...d, [record.id]: (d[record.id] ?? 0) + 1 }));
  const open = exportRecords.find((r) => r.id === details) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Export Management" />
      <ExportsStatRow stats={exportStats} />
      <FilterBar
        aria-label="Filter exports"
        clear={
          active && (
            <Button
              variant="outlined"
              onClick={() => {
                setQuery('');
                setStatus(null);
                setType(null);
                setPage(1);
                searchRef.current?.focus();
              }}
            >
              Clear Filters
            </Button>
          )
        }
      >
        <div className={FILTER_SLOT}>
          <FilterField
            ref={searchRef}
            label="Search exports"
            placeholder="Search exports..."
            value={query}
            onChange={(event) => filterBy(setQuery)(event.target.value)}
          />
        </div>
        {/* The screen's "Filter by status" / "Filter by type" read as values, All Status / All Types (decision filter-wording). */}
        <FilterSelect
          className={FILTER_SLOT}
          label="Status"
          allLabel="All Status"
          options={EXPORT_STATUS_OPTIONS}
          value={status}
          onValueChange={(next) => filterBy(setStatus)(next as ExportStatus | null)}
        />
        <FilterSelect
          className={FILTER_SLOT}
          label="Type"
          allLabel="All Types"
          options={EXPORT_TYPE_OPTIONS}
          value={type}
          onValueChange={(next) => filterBy(setType)(next as ExportType | null)}
        />
      </FilterBar>
      <p role="status" className="sr-only">
        {`Showing ${matching.length} of ${exportRecords.length} exports`}
      </p>
      <ExportsTable
        rows={shown}
        downloads={downloads}
        empty={<EmptyState size="compact" title={emptyStateCopy.noResults.title} />}
        rowActions={(record) => (
          <>
            {record.status === 'completed' && <MenuItem onClick={() => download(record)}>Download</MenuItem>}
            <MenuItem onClick={() => setDetails(record.id)}>View Details</MenuItem>
          </>
        )}
      />
      {pageCount > 0 && (
        <Pagination className="self-end" page={current} pageCount={pageCount} onPageChange={setPage} showPageInfo={false} />
      )}
      <ExportDetailsDialog
        open={open !== null}
        onClose={() => setDetails(null)}
        record={open}
        downloads={open ? (downloads[open.id] ?? 0) : 0}
        onDownload={download}
      />
    </div>
  );
}

export interface AnnouncementsScreenProps {
  /** Start with Create Announcement open (Admin / Announcements — Create Announcement modal, 2102:6752). */
  creating?: boolean;
  /** View Changelog: the app opens the Changelog page (pattern U07). */
  onViewChangelog?: () => void;
}

/**
 * Admin / Announcements — List (2102:6628): title and description, Card /
 * Stat Row – Announcements, then New Announcement and View Changelog (Small),
 * the filter bar (Search, Filter Date, Clear Filters) and the table. New
 * Announcement opens Create Announcement (pattern 14); ••• → Preview shows
 * the release as users will see it (Modal / Changelog). Delete is pattern 14's.
 */
export function AnnouncementsScreen({ creating: startCreating = false, onViewChangelog }: AnnouncementsScreenProps) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<Announcement[]>(announcements);
  const [query, setQuery] = React.useState('');
  const [range, setRange] = React.useState<DayRange | null>(null);
  const [creating, setCreating] = React.useState(startCreating);
  const [preview, setPreview] = React.useState<Announcement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | HTMLButtonElement | null>(null);

  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    (a) =>
      (!q || [a.title, a.version, ...a.features].some((text) => text.toLowerCase().includes(q))) &&
      /* ISO days compare as strings. */
      (!range || (a.releasedAt >= range.from && a.releasedAt <= range.to)),
  );
  const active = q !== '' || range !== null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Announcements" description="Manage application announcements and updates" />
      <AnnouncementsStatRow stats={summariseAnnouncements(rows)} />
      {/* The screen's Actions row: under the stats, not in the page header. */}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="small" leftIcon={<Icon name="plus" />} onClick={() => setCreating(true)}>
          New Announcement
        </Button>
        <Button size="small" variant="outlined" onClick={onViewChangelog}>
          View Changelog
        </Button>
      </div>
      <FilterBar
        aria-label="Filter announcements"
        clear={
          active && (
            <Button
              variant="outlined"
              onClick={() => {
                setQuery('');
                setRange(null);
                searchRef.current?.focus();
              }}
            >
              Clear Filters
            </Button>
          )
        }
      >
        <div className={FILTER_SLOT}>
          <FilterField
            ref={searchRef}
            label="Search announcements"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <FilterDateRange
          className={FILTER_SLOT}
          label="Release date"
          placeholder="Filter Date"
          value={toDateRange(range)}
          onValueChange={(next) => setRange(toDayRange(next))}
          today={TEMPLATE_TODAY}
        />
      </FilterBar>
      <p role="status" className="sr-only">
        {`Showing ${shown.length} of ${rows.length} announcements`}
      </p>
      <AnnouncementsTable
        rows={shown}
        empty={<EmptyState size="compact" title={emptyStateCopy.noResults.title} />}
        rowActions={(announcement) => <MenuItem onClick={() => setPreview(announcement)}>Preview</MenuItem>}
      />
      <CreateAnnouncementDialog
        open={creating}
        onClose={() => setCreating(false)}
        today={TEMPLATE_TODAY}
        onCreate={(announcement) => {
          const id = String(Math.max(0, ...rows.map((r) => Number(r.id))) + 1);
          setRows((all) => [{ ...announcement, id }, ...all]);
          setCreating(false);
          toast({ type: 'success', message: 'Announcement created.' });
        }}
      />
      <ChangelogModal
        open={preview !== null}
        onClose={() => setPreview(null)}
        onViewChangeLog={() => setPreview(null)}
        title={preview?.title}
        date={preview ? formatDate(preview.releasedAt) : undefined}
        version={preview ? `v${preview.version}` : undefined}
      >
        {preview?.features.map((feature) => <BulletItem key={feature}>{feature}</BulletItem>)}
      </ChangelogModal>
    </div>
  );
}

/* ── Form pages (Templates/Form page) ──────────────────────────────────── */

export interface CreateCostScreenProps {
  /** The tab the form opens on: User / Create Cost — Single Cost (2102:1154) or — Recurring Cost (2102:1159). */
  type?: CostType;
  /** Start with the Cost Breakdown dialog open (User / Create Cost — Cost Breakdown modal, 2102:1201). */
  breakdownDialogOpen?: boolean;
  onSubmit?: (data: FormData) => void;
  onSaveDraft?: (data: FormData) => void;
  /** Currency's [Edit]: the app opens Manage Currencies (pattern U06). */
  onEditCurrency?: () => void;
}

/** User / Create Cost: Form / New Cost, centred in the page container. Save and Save to Drafts confirm with a toast. */
export function CreateCostScreen({ type = 'single', breakdownDialogOpen, onSubmit, onSaveDraft, onEditCurrency }: CreateCostScreenProps) {
  const { toast } = useToast();
  return (
    <NewCostForm
      className="mx-auto"
      defaultType={type}
      today={TEMPLATE_TODAY}
      defaultBreakdownDialogOpen={breakdownDialogOpen}
      onEditCurrency={onEditCurrency}
      onSubmit={(data) => {
        onSubmit?.(data);
        toast({ type: 'success', message: 'Cost submitted for review.' });
      }}
      onSaveDraft={(data) => {
        onSaveDraft?.(data);
        toast({ type: 'success', message: `Draft #${NEW_DRAFT_ID} saved.` });
      }}
    />
  );
}

export interface BulkUploadScreenProps {
  onUpload?: (data: FormData) => void;
  onDownloadTemplate?: (paymentMethod: string) => void;
}

/** Admin / Bulk Upload (2102:6027), User / Bulk Upload (2102:1223): Form / Bulk Upload, centred. Upload confirms with a toast. */
export function BulkUploadScreen({ onUpload, onDownloadTemplate }: BulkUploadScreenProps) {
  const { toast } = useToast();
  return (
    <BulkUploadForm
      className="mx-auto"
      onDownloadTemplate={onDownloadTemplate}
      onUpload={(data) => {
        onUpload?.(data);
        toast({ type: 'success', message: 'Costs uploaded.' });
      }}
    />
  );
}

/** Settings (U06, 545:25204), from the account menu: My Account Details. */
export function SettingsScreen({ app }: { app: ShellApp }) {
  const { toast } = useToast();
  const account = signedInAccounts[app];
  return (
    <SettingsPage
      account={{ email: account.email, name: account.name }}
      onSave={() => toast({ type: 'success', message: 'Account details saved.' })}
    />
  );
}

/* ── Routing (TemplateFrame) ───────────────────────────────────────────── */

/**
 * Each app's pages, by the navigation's labels (and Settings, from the account
 * menu): where a link goes in the templates. Partners and Contacts have no
 * page composition yet, so the frame shows just their title.
 */
export const APP_SCREENS: Record<ShellApp, Partial<Record<string, () => React.ReactNode>>> = {
  admin: {
    Costs: () => <AdminCostsScreen />,
    'Bulk Upload': () => <BulkUploadScreen />,
    'Cost Centers': () => <CostCentresPage />,
    Users: () => <UsersPage as="div" />,
    'Recurring Costs': () => <RecurringCostsPage today={TEMPLATE_TODAY} />,
    Announcements: () => <AnnouncementsScreen />,
    Exports: () => <ExportsScreen />,
    Drafts: () => <DraftsScreen />,
    Settings: () => <SettingsScreen app="admin" />,
  },
  user: {
    Costs: () => <UserCostsScreen />,
    'Create Cost': () => <CreateCostScreen />,
    'Bulk Upload': () => <BulkUploadScreen />,
    'Recurring Costs': () => <RecurringCostsPage today={TEMPLATE_TODAY} defaultRows={userRecurringCosts} />,
    Drafts: () => <DraftsScreen />,
    Settings: () => <SettingsScreen app="user" />,
  },
};
