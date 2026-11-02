import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../components/button';
import { EmptyState } from '../../components/empty-state';
import { FilterField } from '../../components/filter-field';
import { Icon } from '../../components/icon';
import { Pagination } from '../../components/pagination';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableHeaderRow } from '../../components/table-header-row';
import { TableList } from '../../components/table-list';
import { TableRow } from '../../components/table-row';
import { ToastProvider } from '../../components/toast';
import { sortCosts } from '../costs/CostsTable';
import { FILTER_SLOT, FilterBar, FilterMenu } from '../filters/CostsFilterBar';
import { costCentres, costs, exportMenuItems, LIST_TODAY } from '../fixtures';
import { PageHeader } from '../../components/page-header';
import { CostsListPage, EXPORT_STARTED } from './CostsListPage';

/* ── 01 A · Basic list (Cost Centers, 518:252) ─────────────────────────────── */

/* Figma's basic list shows five rows a page. */
const CENTRES_PAGE_SIZE = 5;
const CENTRE_NAMES = [...new Set(costCentres.map((c) => c.name))].map((name) => ({ value: name, label: name }));

/* The Cost Centers page: Add New on the right; search and a cost center filter; a short
   reference table (not sortable, pattern 01 step 3); pagination at the bottom right. */
function CostCentersPage() {
  const [search, setSearch] = useState('');
  const [centre, setCentre] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement | HTMLButtonElement | null>(null);

  const query = search.trim().toLowerCase();
  const matching = costCentres.filter(
    (c) =>
      (!query || [c.name, c.natureOfService, c.location].some((text) => text.toLowerCase().includes(query))) &&
      (!centre || c.name === centre),
  );
  const pageCount = Math.ceil(matching.length / CENTRES_PAGE_SIZE);
  const shown = matching.slice((page - 1) * CENTRES_PAGE_SIZE, page * CENTRES_PAGE_SIZE);
  const active = query !== '' || centre !== null;

  return (
    <main className="container mx-auto flex flex-col gap-6 px-6 py-10">
      {/* Opens Add New Cost Center: pattern 05's modal, not this pattern's flow. */}
      <PageHeader title="Cost Centers" actions={<Button leftIcon={<Icon name="plus" />}>Add New</Button>} />
      <FilterBar
        aria-label="Filter cost centers"
        clear={
          active && (
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('');
                setCentre(null);
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
            label="Search cost centers"
            placeholder="Search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <FilterMenu
          label="Cost center"
          allLabel="All Cost Centers"
          placeholder="Filter by Cost Center"
          options={CENTRE_NAMES}
          value={centre}
          onChange={(next) => {
            setCentre(next);
            setPage(1);
          }}
        />
      </FilterBar>
      <TableList
        aria-label="Cost centers"
        header={
          <TableHeaderRow>
            {['Cost center', 'Nature of Service', 'Location'].map((h) => (
              <TableHeaderCell key={h}>{h}</TableHeaderCell>
            ))}
          </TableHeaderRow>
        }
      >
        {shown.length === 0 && (
          <TableRow>
            <TableCell type="custom" colSpan={3}>
              <EmptyState size="compact" title="No items." />
            </TableCell>
          </TableRow>
        )}
        {shown.map((c) => (
          <TableRow key={c.id} data-id={c.id}>
            <TableCell>{c.name}</TableCell>
            <TableCell>{c.natureOfService}</TableCell>
            <TableCell>{c.location}</TableCell>
          </TableRow>
        ))}
      </TableList>
      {pageCount > 0 && (
        <Pagination className="self-end" page={page} pageCount={pageCount} onPageChange={setPage} showPageInfo={false} />
      )}
    </main>
  );
}

const meta = {
  title: 'Patterns/List page',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern 01 (Patterns – Admin, 518:900): the layout of every admin and user list — a page header, a filter ' +
          'bar, a data table and pagination, always in that order. **Costs** is Figma’s example B (518:514): ' +
          'PageHeader with Tabs / Cost Type, View Audit Logs and Export; the Costs filter bar ' +
          '(`src/patterns/filters/CostsFilterBar.tsx`); the Costs table (`src/patterns/costs/CostsTable.tsx`), sortable ' +
          'and expandable; Pagination at the bottom right. The tabs and filters return to page 1. **Cost Centers** is ' +
          'example A (518:252): Add New, search and one dropdown filter, a short reference table that isn’t sortable. ' +
          'Row actions (pattern 03), bulk selection (07) and the Audit Logs sheet (08) are their own patterns.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* Helpers for the plays. */
const costsTable = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Costs' }) as HTMLTableElement;
const rowIds = (table: HTMLTableElement) =>
  Array.from(table.tBodies[0].rows)
    .map((r) => r.dataset.id)
    .filter(Boolean);
const ids = (rows: { id: string }[]) => rows.map((r) => r.id);
const pagination = (canvasElement: HTMLElement) => within(within(canvasElement).getByRole('navigation', { name: 'Pagination' }));

/**
 * 01 B, the Costs list: page header, filter bar, table and pagination, top to bottom. Pages move
 * eight costs at a time; a type tab (from the keyboard) filters and returns to page 1; a header sorts.
 */
export const Costs: Story = {
  render: () => <CostsListPage rows={costs} audience="admin" today={LIST_TODAY} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('main')).toHaveLength(1);
    const heading = canvas.getByRole('heading', { level: 1, name: 'Costs' });
    const bar = canvas.getByRole('search', { name: 'Filter costs' });
    const table = costsTable(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Pagination' });

    // Always in that order, top to bottom; pagination at the bottom right.
    const tops = [heading, bar, table, nav].map((el) => el.getBoundingClientRect().top);
    await expect(tops).toEqual([...tops].sort((a, b) => a - b));
    // The page's content box: the right edge pagination sits on.
    const main = canvas.getByRole('main');
    const contentRight = main.getBoundingClientRect().right - parseFloat(getComputedStyle(main).paddingRight);
    await expect(Math.abs(nav.getBoundingClientRect().right - contentRight)).toBeLessThan(1);

    // The admin's page actions: View Audit Logs left of Export (the primary action last).
    const audit = canvas.getByRole('button', { name: 'View Audit Logs' }).getBoundingClientRect();
    await expect(canvas.getByRole('button', { name: 'Export' }).getBoundingClientRect().left).toBeGreaterThan(audit.right);

    // Page 1: the eight newest. No filter in use, so no Clear Filters. 32 costs make 4 pages.
    await expect(rowIds(table)).toEqual(ids(costs.slice(0, 8)));
    await expect(canvas.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();
    await expect(pagination(canvasElement).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await expect(pagination(canvasElement).getByRole('button', { name: 'Page 4' })).toBeVisible();
    await expect(pagination(canvasElement).queryByRole('button', { name: 'Page 5' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('Showing 32 of 32 costs');

    // › moves to page 2: the next eight.
    await userEvent.click(pagination(canvasElement).getByRole('button', { name: 'Next page' }));
    await expect(rowIds(table)).toEqual(ids(costs.slice(8, 16)));
    await expect(pagination(canvasElement).getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    // The Recurring tab, from the keyboard: only recurring costs, back on page 1, two pages.
    const recurring = costs.filter((c) => c.type === 'recurring');
    canvas.getByRole('tab', { name: 'All' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Recurring' })).toHaveAttribute('aria-selected', 'true');
    await expect(rowIds(table)).toEqual(ids(recurring.slice(0, 8)));
    await expect(pagination(canvasElement).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await expect(pagination(canvasElement).queryByRole('button', { name: 'Page 3' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent(`Showing ${recurring.length} of 32 costs`);

    // Amount sorts the whole list, not just the page shown.
    const amount = within(table).getByRole('columnheader', { name: 'Amount' });
    await userEvent.click(within(amount).getByRole('button', { name: 'Amount' }));
    await expect(amount).toHaveAttribute('aria-sort', 'ascending');
    await expect(rowIds(table)).toEqual(ids(sortCosts(recurring, { column: 'amount', direction: 'ascending' }).slice(0, 8)));
  },
};

/** 01 B's page actions: Export opens its menu; Export Costs starts an export and pattern 12's toast says so. */
export const PageActions: Story = {
  name: 'Page actions',
  render: () => <CostsListPage rows={costs} audience="admin" today={LIST_TODAY} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Export' });
    await userEvent.click(button);
    const menu = canvas.getByRole('menu', { name: 'Export' });
    await expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual([...exportMenuItems]);
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Export Costs' })).toHaveFocus());

    await userEvent.keyboard('{Enter}');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(button).toHaveFocus();
    const notifications = within(screen.getByRole('region', { name: 'Notifications' }));
    await waitFor(() => expect(notifications.getByText(EXPORT_STARTED)).toBeVisible());
  },
};

/**
 * 01 A, the basic list (Cost Centers): Add New on the right; the headers don't sort (a short
 * reference list); search narrows the rows and returns to page 1; Clear Filters resets them.
 */
export const CostCenters: Story = {
  name: 'Cost Centers',
  render: () => <CostCentersPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Cost centers' }) as HTMLTableElement;
    const heading = canvas.getByRole('heading', { level: 1, name: 'Cost Centers' }).getBoundingClientRect();
    await expect(canvas.getByRole('button', { name: 'Add New' }).getBoundingClientRect().left).toBeGreaterThan(heading.right);
    await expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Cost center',
      'Nature of Service',
      'Location',
    ]);
    // Not sortable: no sort buttons, no aria-sort.
    await expect(within(table).queryAllByRole('button')).toHaveLength(0);
    // Figma's first rows; 12 cost centers make 3 pages of 5.
    await expect(rowIds(table)).toEqual(['cc-1', 'cc-2', 'cc-3', 'cc-4', 'cc-5']);
    await expect(within(table.tBodies[0].rows[0]).getAllByRole('cell').map((td) => td.textContent)).toEqual([
      'Employee Expenses',
      'Salary',
      'Philippines',
    ]);
    await userEvent.click(pagination(canvasElement).getByRole('button', { name: 'Page 3' }));
    await expect(rowIds(table)).toEqual(['cc-11', 'cc-12']);

    // Search: back to page 1, Clear Filters appears.
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search cost centers' }), 'legal');
    await expect(rowIds(table)).toEqual(['cc-4', 'cc-11']);
    await expect(pagination(canvasElement).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');

    // The cost center filter, from the keyboard: ↓ opens its menu, Enter picks. Nothing is both.
    const filter = canvas.getByRole('button', { name: 'Cost center: Filter by Cost Center' });
    filter.focus();
    await userEvent.keyboard('{ArrowDown}');
    const menu = canvas.getByRole('menu');
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'All Cost Centers' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');
    await expect(filter).toHaveFocus();
    await expect(filter).toHaveAccessibleName('Cost center: IT Expenses');
    await expect(within(table).getByText('No items.')).toBeVisible();
    await expect(canvas.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();

    // Clear Filters: every row back, focus in the search box.
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Filters' }));
    await expect(rowIds(table)).toEqual(['cc-1', 'cc-2', 'cc-3', 'cc-4', 'cc-5']);
    await expect(canvas.getByRole('searchbox', { name: 'Search cost centers' })).toHaveFocus();
    await expect(canvas.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Cost center: Filter by Cost Center' })).toBeVisible();
  },
};

/** Dark: the Costs list on page 2, one row expanded. */
export const Dark: Story = {
  render: () => <CostsListPage rows={costs} audience="admin" today={LIST_TODAY} initialPage={2} initialExpanded={['37010']} />,
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();
    await expect(rowIds(costsTable(canvasElement))).toEqual(ids(costs.slice(8, 16)));
    await expect(canvas.getByRole('table', { name: 'Breakdown of cost 37010' })).toBeVisible();
  },
};
