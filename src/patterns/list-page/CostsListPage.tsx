import * as React from 'react';
import { Button } from '../../components/button';
import { EmptyState } from '../../components/empty-state';
import { MenuItem } from '../../components/menu-item';
import { MenuTriggerButton } from '../../components/menu-trigger-button';
import { Pagination } from '../../components/pagination';
import { TabItem } from '../../components/tab-item';
import { Tabs } from '../../components/tabs';
import { useToast } from '../../components/toast';
import { CostsTable, sortCosts, type CostSort } from '../costs/CostsTable';
import {
  CostsFilterBar,
  EMPTY_COST_FILTERS,
  filterCosts,
  type CostFilterField,
  type CostFilters,
} from '../filters/CostsFilterBar';
import { COSTS_PAGE_SIZE, exportMenuItems, type Cost, type CostType } from '../fixtures';
import { PageHeader } from '../page/PageHeader';

/**
 * CostsListPage — the Costs list page as patterns 01 and U01 lay it out: a
 * story-level composition, not a DS component. A page header, the filter bar,
 * the table and pagination, "always in that order" (pattern 01, 518:900),
 * 24 apart in a 40-padded page.
 *
 * - Admin (01 B, 518:514): the title, Tabs / Cost Type, View Audit Logs and
 *   Export (Button / Menu Trigger) on the right.
 * - User (U01, 545:13220): the title, the tabs and Export only. "There is no
 *   Add New, Change Status or View Audit Logs", and no checkbox column.
 *
 * The page owns the list's state: the type tab, the filters, the sort, the
 * page and the expanded rows. Changing a tab or a filter returns to page 1
 * (pattern 02); so does a new sort. Nothing matching shows the compact Empty
 * State ("No items.") inside the table, with the filter bar still in place.
 * Export raises pattern 12's toast. A visually hidden status line says how
 * many costs are shown, because the table changing isn't announced.
 *
 * Put it under a ToastProvider. It renders the page's `<main>`.
 */

/** Tabs / Cost Type: All | Recurring | Single. */
export type CostTypeTab = 'all' | CostType;

/** Pattern 12's toast for an export (528:6074). */
export const EXPORT_STARTED = 'Export started. It will appear in Exports when it’s ready.';

export interface CostsListPageProps {
  /** Every cost the page lists, newest first. */
  rows: readonly Cost[];
  /** Whose page: the admin's Costs (01 B) or the user's My costs (U01). */
  audience: 'admin' | 'user';
  /** Rows per page. Default 8, as the Costs screens. */
  pageSize?: number;
  /** Show the filters in use under the bar (Filter / Summary). */
  showSummary?: boolean;
  /** The date pickers' Today; stories pin it. */
  today?: Date;
  /* Where a story starts. */
  initialFilters?: CostFilters;
  initialType?: CostTypeTab;
  initialPage?: number;
  initialExpanded?: string[];
  initialSort?: CostSort | null;
  /** A filter dropdown that starts open (a story's snapshot). */
  openFilter?: CostFilterField;
  /** Start with the Export menu open (a story's snapshot). */
  openExport?: boolean;
}

export function CostsListPage({
  rows,
  audience,
  pageSize = COSTS_PAGE_SIZE,
  showSummary = false,
  today,
  initialFilters = EMPTY_COST_FILTERS,
  initialType = 'all',
  initialPage = 1,
  initialExpanded = [],
  initialSort = null,
  openFilter,
  openExport,
}: CostsListPageProps) {
  const { toast } = useToast();
  const [type, setType] = React.useState<CostTypeTab>(initialType);
  const [filters, setFilters] = React.useState(initialFilters);
  const [sort, setSort] = React.useState<CostSort | null>(initialSort);
  const [page, setPage] = React.useState(initialPage);
  const [expanded, setExpanded] = React.useState(initialExpanded);

  const ofType = type === 'all' ? rows : rows.filter((c) => c.type === type);
  const matching = sortCosts(filterCosts(ofType, filters), sort);
  const pageCount = Math.ceil(matching.length / pageSize);
  const current = Math.min(page, Math.max(pageCount, 1));
  const shown = matching.slice((current - 1) * pageSize, current * pageSize);

  const exportMenu = (
    <MenuTriggerButton label="Export" align="right" defaultOpen={openExport}>
      {exportMenuItems.map((label) => (
        <MenuItem key={label} onClick={() => toast({ type: 'info', message: EXPORT_STARTED })}>
          {label}
        </MenuItem>
      ))}
    </MenuTriggerButton>
  );

  return (
    <main className="container mx-auto flex flex-col gap-6 px-6 py-10">
      <PageHeader
        title="Costs"
        tabs={
          <Tabs
            aria-label="Cost type"
            selected={type}
            onSelectedChange={(next) => {
              setType(next as CostTypeTab);
              setPage(1);
            }}
          >
            <TabItem value="all">All</TabItem>
            <TabItem value="recurring">Recurring</TabItem>
            <TabItem value="single">Single</TabItem>
          </Tabs>
        }
        actions={
          audience === 'admin' ? (
            <>
              {/* Opens the Audit Logs side sheet: pattern 08's flow, not this one's. */}
              <Button variant="outlined">View Audit Logs</Button>
              {exportMenu}
            </>
          ) : (
            exportMenu
          )
        }
      />
      <CostsFilterBar
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        showSummary={showSummary}
        today={today}
        defaultOpen={openFilter}
      />
      <p role="status" className="sr-only">
        {`Showing ${matching.length} of ${rows.length} costs`}
      </p>
      <CostsTable
        rows={shown}
        expandable
        expandedIds={expanded}
        onExpandedChange={setExpanded}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        empty={<EmptyState size="compact" title="No items." />}
      />
      {pageCount > 0 && (
        <Pagination className="self-end" page={current} pageCount={pageCount} onPageChange={setPage} showPageInfo={false} />
      )}
    </main>
  );
}
