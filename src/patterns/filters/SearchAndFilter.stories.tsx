import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../components/button';
import { EmptyState } from '../../components/empty-state';
import { FilterField } from '../../components/filter-field';
import { FilterSelect } from '../../components/filter-select';
import { Pagination } from '../../components/pagination';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableRow } from '../../components/table-row';
import { ToastProvider } from '../../components/toast';
import { costs, LIST_TODAY, userRoles, users, type CostStatus, type UserRole } from '../fixtures';
import { CostsListPage } from '../list-page/CostsListPage';
import { CostsFilterBar, EMPTY_COST_FILTERS, FILTER_SLOT, FilterBar, type CostFilters } from './CostsFilterBar';

/* ── Steps 1–3 as Figma draws them: the Users list (520:773, 520:950, 520:1074) ── */

/* Figma's Users screens show four rows a page. */
const USERS_PAGE_SIZE = 4;
const ROLE_OPTIONS = userRoles.map((role) => ({ value: role, label: role }));

function UsersList() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement | HTMLButtonElement | null>(null);

  const query = search.trim().toLowerCase();
  const matching = users.filter(
    (u) => (!query || [u.name, u.email].some((text) => text.toLowerCase().includes(query))) && (!role || u.role === role),
  );
  const pageCount = Math.ceil(matching.length / USERS_PAGE_SIZE);
  const shown = matching.slice((page - 1) * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE);
  const active = query !== '' || role !== null;

  return (
    <main className="container mx-auto flex flex-col gap-6 px-6 py-10">
      <h1 className="sr-only">Users</h1>
      <FilterBar
        aria-label="Filter users"
        clear={
          active && (
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('');
                setRole(null);
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
            label="Search users"
            placeholder="Search users"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <FilterSelect
          className={FILTER_SLOT}
          label="Role"
          allLabel="All Roles"
          options={ROLE_OPTIONS}
          value={role}
          onValueChange={(next) => {
            setRole(next as UserRole | null);
            setPage(1);
          }}
        />
      </FilterBar>
      <table aria-label="Users" className="w-full border-collapse">
        <thead>
          <tr className="border-b border-stroke-subtle">
            {['Name', 'Role', 'Date Created'].map((h) => (
              <TableHeaderCell key={h} className="px-4">
                {h}
              </TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.length === 0 && (
            <TableRow>
              {/* Step 3: the compact Empty State inside the table. */}
              <TableCell type="tag" colSpan={3}>
                <EmptyState size="compact" title="No items." />
              </TableCell>
            </TableRow>
          )}
          {shown.map((u) => (
            <TableRow key={u.id} data-id={u.id}>
              <TableCell type="two-line" primary={u.name} secondary={u.email} />
              <TableCell>{u.role}</TableCell>
              <TableCell>{u.createdAt}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
      {pageCount > 0 && (
        <Pagination className="self-end" page={page} pageCount={pageCount} onPageChange={setPage} showPageInfo={false} />
      )}
    </main>
  );
}

/* ── The Costs bar's two presets (Filter / Bar, 256:5338: Page=Costs, Page=Recurring) ── */

function BarPresetsDemo() {
  const [costsFilters, setCostsFilters] = useState<CostFilters>(EMPTY_COST_FILTERS);
  const [recurringFilters, setRecurringFilters] = useState<CostFilters>({ ...EMPTY_COST_FILTERS, status: 'pending' });
  return (
    <div className="flex flex-col gap-6 pb-64">
      <CostsFilterBar value={costsFilters} onChange={setCostsFilters} today={LIST_TODAY} />
      <CostsFilterBar
        page="recurring"
        aria-label="Filter recurring costs"
        value={recurringFilters}
        onChange={setRecurringFilters}
        today={LIST_TODAY}
      />
    </div>
  );
}

/* Step 4's range (520:1213), as `CostFilters`. */
const OCTOBER_12_TO_24 = { from: '2026-10-12', to: '2026-10-24' };
const PENDING: CostStatus = 'pending';

const meta = {
  title: 'Patterns/Search & filter',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern 02 (Patterns – Admin, 520:1873): how users narrow a list. Search and filters sit in one bar above ' +
          'the table and apply as soon as they change — there is no Apply button — and every change returns to page 1. ' +
          'Once a filter is in use, Clear Filters appears on the far right and the search box shows its ×. Nothing ' +
          'matching shows the compact Empty State (“No items.”) inside the table, with the bar still in place. Date ' +
          'filters open Date Picker / Range under the field: the first day picked is the start, the second the end. ' +
          'The bar is `src/patterns/filters/CostsFilterBar.tsx` (Filter / Bar – Costs, 256:4585; Filter / Bar, ' +
          '256:5338): FilterField search, FilterFields that open a Menu / Dropdown of values or a RangeCalendar in a ' +
          'Popover, Clear Filters, and the filters in use as Filter / Summary.',
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
const rowIds = (table: HTMLTableElement) =>
  Array.from(table.tBodies[0].rows)
    .map((r) => r.dataset.id)
    .filter(Boolean);
const costsTable = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Costs' }) as HTMLTableElement;
const pagination = (canvasElement: HTMLElement) => within(within(canvasElement).getByRole('navigation', { name: 'Pagination' }));
/* The Filter / Summary lines, as "Key: value". */
const summaryLines = (canvasElement: HTMLElement) =>
  Array.from(within(canvasElement).getByRole('group', { name: 'Current Filters' }).querySelectorAll('dl > div')).map(
    (line) => line.textContent,
  );

/**
 * Steps 1–3, on Figma's Users list: the full list with no Clear Filters; typing narrows the rows
 * at once and returns to page 1; nothing matching shows "No items." in the table; Clear Filters
 * resets everything. The role filter works from the keyboard.
 */
export const Users: Story = {
  name: 'Search a list (Users)',
  render: () => <UsersList />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Users' }) as HTMLTableElement;
    const search = canvas.getByRole('searchbox', { name: 'Search users' });

    // Step 1 · Start from the full list: no filter in use, so no Clear Filters.
    await expect(rowIds(table)).toEqual(['109', '110', '111', '112']);
    await expect(canvas.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('combobox', { name: 'Role' })).toHaveTextContent('All Roles');
    await userEvent.click(pagination(canvasElement).getByRole('button', { name: 'Page 2' }));
    await expect(rowIds(table)).toEqual(['113', '115', '116', '119']);

    // Step 2 · Type: the rows update as the user types, back on page 1; Clear Filters and × appear.
    await userEvent.type(search, 'maria');
    await expect(rowIds(table)).toEqual(['116']);
    await expect(within(table).getByText('maria.santos@geekee.com')).toBeVisible();
    await expect(pagination(canvasElement).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Clear Filters' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Clear search' })).toBeVisible();

    // Step 3 · Nothing matches: the compact Empty State inside the table; the bar stays.
    await userEvent.clear(search);
    await userEvent.type(search, 'zzz');
    await expect(within(table).getByText('No items.')).toBeVisible();
    await expect(canvas.getByRole('search', { name: 'Filter users' })).toBeVisible();
    await expect(canvas.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();

    // Clear Filters: every row back, the button gone, focus in the search box.
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Filters' }));
    await expect(rowIds(table)).toEqual(['109', '110', '111', '112']);
    await expect(search).toHaveValue('');
    await expect(search).toHaveFocus();
    await expect(canvas.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();

    // The role dropdown (FilterSelect), from the keyboard: Enter opens it on the checked All Roles,
    // ↓ Enter picks Admin. Focus stays on the field throughout.
    const roleField = canvas.getByRole('combobox', { name: 'Role' });
    roleField.focus();
    await userEvent.keyboard('{Enter}');
    const roles = canvas.getByRole('listbox', { name: 'Role' });
    await expect(roleField).toHaveAttribute('aria-activedescendant', within(roles).getByRole('option', { name: 'All Roles' }).id);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(roleField).toHaveFocus();
    await expect(roleField).toHaveTextContent('Admin');
    await expect(rowIds(table)).toEqual(['109', '112', '119']);
  },
};

/**
 * The Costs bar: a status from the keyboard, then a Creation Date range (step 4's, October 12–24),
 * then a search. Each change filters at once, returns to page 1 and adds a line to the filters in use.
 */
export const FilterCosts: Story = {
  name: 'Filter costs',
  render: () => <CostsListPage rows={costs} audience="admin" today={LIST_TODAY} showSummary />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = costsTable(canvasElement);
    await userEvent.click(pagination(canvasElement).getByRole('button', { name: 'Page 3' }));
    await expect(canvas.queryByRole('group', { name: 'Current Filters' })).not.toBeInTheDocument();

    // Status, from the keyboard: Enter opens the list on the checked All Status; ↓ Enter picks Pending.
    const status = canvas.getByRole('combobox', { name: 'Status' });
    status.focus();
    await userEvent.keyboard('{Enter}');
    const statuses = canvas.getByRole('listbox', { name: 'Status' });
    const allStatus = within(statuses).getByRole('option', { name: 'All Status' });
    await expect(allStatus).toHaveAttribute('aria-selected', 'true');
    await expect(status).toHaveAttribute('aria-activedescendant', allStatus.id);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(status).toHaveFocus();
    await expect(status).toHaveTextContent('Pending');
    const pending = costs.filter((c) => c.status === PENDING);
    await expect(rowIds(table)).toEqual(pending.slice(0, 8).map((c) => c.id));
    await expect(pagination(canvasElement).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Clear Filters' })).toBeVisible();
    await expect(summaryLines(canvasElement)).toEqual(['Status:Pending']);
    await expect(canvas.getByRole('status')).toHaveTextContent(`Showing ${pending.length} of 32 costs`);

    // Creation Date (FilterDateRange): the range picker opens under the field, on October and November.
    const created = canvas.getByRole('combobox', { name: 'Creation date' });
    await expect(created).toHaveTextContent('Creation Date');
    await userEvent.click(created);
    const picker = canvas.getByRole('dialog', { name: 'Creation date' });
    await expect(within(picker).getByRole('grid', { name: 'October 2026' })).toBeVisible();
    await expect(within(picker).getByRole('grid', { name: 'November 2026' })).toBeVisible();
    // Focus goes to the calendar: today, October 24.
    await waitFor(() => expect(within(picker).getByRole('button', { name: 'Saturday 24 October 2026' })).toHaveFocus());
    // The first click is the start, the second the end; then it closes and focus returns to the field.
    await userEvent.click(within(picker).getByRole('button', { name: 'Monday 12 October 2026' }));
    await expect(canvas.getByRole('dialog', { name: 'Creation date' })).toBeVisible();
    await userEvent.click(within(picker).getByRole('button', { name: 'Saturday 24 October 2026' }));
    await expect(canvas.queryByRole('dialog', { name: 'Creation date' })).not.toBeInTheDocument();
    await expect(created).toHaveFocus();
    // The field shows the range in its short format; Filter / Summary keeps the ISO days.
    await expect(created).toHaveTextContent('12–24 Oct 2026');
    // Step 4's rows: the pending costs submitted October 12–24.
    await expect(rowIds(table)).toEqual(['32436', '32431', '32430']);
    await expect(summaryLines(canvasElement)).toEqual(['Status:Pending', 'Creation Date:2026-10-12 – 2026-10-24']);

    // Search narrows it further, as the user types.
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search costs' }), 'maria');
    await expect(rowIds(table)).toEqual(['32431']);
    await expect(summaryLines(canvasElement)).toEqual([
      'Search:maria',
      'Status:Pending',
      'Creation Date:2026-10-12 – 2026-10-24',
    ]);
    await expect(canvas.getByRole('status')).toHaveTextContent('Showing 1 of 32 costs');
  },
};

/** Nothing matches, then Clear Filters: "No items." in the table with the bar in place; Clear Filters resets every field. */
export const NoResultsAndClear: Story = {
  name: 'No results, then Clear Filters',
  render: () => (
    <CostsListPage
      rows={costs}
      audience="admin"
      today={LIST_TODAY}
      showSummary
      initialFilters={{ ...EMPTY_COST_FILTERS, search: 'maria', status: PENDING, createdAt: OCTOBER_12_TO_24 }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = costsTable(canvasElement);
    const search = canvas.getByRole('searchbox', { name: 'Search costs' });
    await expect(rowIds(table)).toEqual(['32431']);

    // Type past every match.
    await userEvent.type(search, 'zzz');
    await expect(rowIds(table)).toEqual([]);
    await expect(within(table).getByText('No items.')).toBeVisible();
    await expect(canvas.getByRole('search', { name: 'Filter costs' })).toBeVisible();
    await expect(canvas.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('Showing 0 of 32 costs');

    // Clear Filters: every field back to All, the full list, focus in the search box.
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Filters' }));
    await expect(search).toHaveValue('');
    await expect(search).toHaveFocus();
    await expect(canvas.getByRole('combobox', { name: 'Status' })).toHaveTextContent('All Status');
    await expect(canvas.getByRole('combobox', { name: 'Creation date' })).toHaveTextContent('Creation Date');
    await expect(rowIds(table)).toEqual(costs.slice(0, 8).map((c) => c.id));
    await expect(canvas.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('group', { name: 'Current Filters' })).not.toBeInTheDocument();
  },
};

/**
 * Step 4 · Filter by a date range, from the keyboard: Enter opens Select Period on today; ← moves
 * twelve days back, Enter starts the range; → twelve days on, Enter ends it. Select Period keeps
 * the costs whose period overlaps the range.
 */
export const SelectPeriod: Story = {
  name: 'Filter by a date range',
  render: () => <CostsListPage rows={costs} audience="admin" today={LIST_TODAY} showSummary />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const period = canvas.getByRole('combobox', { name: 'Period' });
    await expect(period).toHaveTextContent('Select Period');
    period.focus();
    await userEvent.keyboard('{Enter}');
    const picker = canvas.getByRole('dialog', { name: 'Period' });
    await waitFor(() => expect(within(picker).getByRole('button', { name: 'Saturday 24 October 2026' })).toHaveFocus());
    await userEvent.keyboard('{ArrowLeft>12/}');
    await expect(within(picker).getByRole('button', { name: 'Monday 12 October 2026' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{ArrowRight>12/}{Enter}');
    await expect(canvas.queryByRole('dialog', { name: 'Period' })).not.toBeInTheDocument();
    await expect(period).toHaveFocus();
    await expect(period).toHaveTextContent('12–24 Oct 2026');
    await expect(rowIds(costsTable(canvasElement))).toEqual(['32436', '32431']);
    await expect(summaryLines(canvasElement)).toEqual(['Period:2026-10-12 – 2026-10-24']);
  },
};

/** Step 4 as Figma draws it: Select Period's two-month range picker open under the field. */
export const SelectPeriodOpen: Story = {
  name: 'Date range picker open',
  render: () => <CostsListPage rows={costs} audience="admin" today={LIST_TODAY} openFilter="period" />,
  // An open picker: Chromatic snapshots it open. Not on the docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Period' });
    const picker = canvas.getByRole('dialog', { name: 'Period' });
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(within(picker).getAllByRole('grid')).toHaveLength(2);
    await expect(within(picker).getByRole('grid', { name: 'October 2026' })).toBeVisible();
    // Under the field, flush with its left edge. Popover flips it above the field when the
    // viewport has no room below (a short preview), so either side counts.
    const f = field.getBoundingClientRect();
    const p = picker.getBoundingClientRect();
    await expect(p.top >= f.bottom || p.bottom <= f.top).toBe(true);
    await expect(Math.abs(p.left - f.left)).toBeLessThan(1);
  },
};

/**
 * Filter / Bar's presets: Page=Costs has every field; Page=Recurring has search and status only.
 * Clear Filters shows on a bar only while one of its filters is in use (Show Clear).
 */
export const BarPresets: Story = {
  render: () => <BarPresetsDemo />,
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const costsBar = within(canvas.getByRole('search', { name: 'Filter costs' }));
    const recurringBar = within(canvas.getByRole('search', { name: 'Filter recurring costs' }));
    // Status, Payment method, Currency, Period, Creation date.
    await expect(costsBar.getAllByRole('combobox').map((c) => c.getAttribute('aria-label'))).toEqual([
      'Status',
      'Payment method',
      'Currency',
      'Period',
      'Creation date',
    ]);
    await expect(costsBar.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();
    await expect(recurringBar.getByRole('searchbox', { name: 'Search costs' })).toBeVisible();
    await expect(recurringBar.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Pending');
    await expect(recurringBar.queryByRole('combobox', { name: 'Payment method' })).not.toBeInTheDocument();
    await expect(recurringBar.queryByRole('combobox', { name: 'Period' })).not.toBeInTheDocument();

    // Clear Filters sits on the far right of its bar.
    const clear = recurringBar.getByRole('button', { name: 'Clear Filters' });
    const bar = canvas.getByRole('search', { name: 'Filter recurring costs' });
    const padding = parseFloat(getComputedStyle(bar).paddingRight);
    await expect(Math.abs(bar.getBoundingClientRect().right - padding - clear.getBoundingClientRect().right)).toBeLessThan(1);
    await userEvent.click(clear);
    await expect(recurringBar.getByRole('combobox', { name: 'Status' })).toHaveTextContent('All Status');
    await expect(recurringBar.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();
  },
};

/** Dark: step 4's result — Pending, created October 12–24 — with the filters in use. */
export const Dark: Story = {
  render: () => (
    <CostsListPage
      rows={costs}
      audience="admin"
      today={LIST_TODAY}
      showSummary
      initialFilters={{ ...EMPTY_COST_FILTERS, status: PENDING, createdAt: OCTOBER_12_TO_24 }}
    />
  ),
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(rowIds(costsTable(canvasElement))).toEqual(['32436', '32431', '32430']);
    await expect(within(canvasElement).getByRole('button', { name: 'Clear Filters' })).toBeVisible();
  },
};
