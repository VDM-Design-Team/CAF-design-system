import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { MenuItem } from '../../components/menu-item';
import { costs, type Cost, type CostStatus } from '../fixtures';
import { CostsTable, sortCosts, type CostSort } from './CostsTable';

/* The Admin Costs screen's eight rows (CAF Design file, 2102:5749), in its order. */
const SCREEN_IDS = ['37023', '37022', '37021', '37019', '37012', '37011', '37010', '37001'];
const SCREEN_ROWS = SCREEN_IDS.map((id) => costs.find((c) => c.id === id)!);

interface DemoProps {
  selected?: string[];
  expanded?: string[];
  sort?: CostSort | null;
}

/* The story owns what the table shows: its rows (a row action can change a
   status), their order, the selection and the expanded rows. */
function CostsTableDemo({ selected: initialSelected = [], expanded: initialExpanded = [], sort: initialSort = null }: DemoProps) {
  const [rows, setRows] = useState<Cost[]>(SCREEN_ROWS);
  const [selected, setSelected] = useState(initialSelected);
  const [expanded, setExpanded] = useState(initialExpanded);
  const [sort, setSort] = useState<CostSort | null>(initialSort);
  const [message, setMessage] = useState('');

  const setStatus = (id: string, status: CostStatus, label: string) => {
    setRows((all) => all.map((c) => (c.id === id ? { ...c, status } : c)));
    setMessage(`${label}: cost ${id}`);
  };

  return (
    <div className="flex flex-col gap-4 pb-64">
      <p role="status" className="text-body-sm-regular text-text-secondary">
        {message || `${selected.length} selected`}
      </p>
      <CostsTable
        rows={sortCosts(rows, sort)}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        expandable
        expandedIds={expanded}
        onExpandedChange={setExpanded}
        sort={sort}
        onSortChange={setSort}
        rowActions={(cost) => (
          /* Figma's Costs row menu (pattern 03, 520:2387): most used first, Delete last in red. */
          <>
            <MenuItem onClick={() => setStatus(cost.id, 'approved', 'Approved')}>Approve</MenuItem>
            <MenuItem onClick={() => setStatus(cost.id, 'rejected', 'Rejected')}>Reject</MenuItem>
            <MenuItem onClick={() => setMessage(`View invoices: cost ${cost.id}`)}>View invoices</MenuItem>
            <MenuItem onClick={() => setMessage(`Request adjustment: cost ${cost.id}`)}>Request adjustment</MenuItem>
            <MenuItem destructive onClick={() => setMessage(`Delete: cost ${cost.id}`)}>
              Delete
            </MenuItem>
          </>
        )}
      />
    </div>
  );
}

const meta = {
  title: 'Patterns/Costs table',
  component: CostsTableDemo,
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'The Costs list’s table: a story-level organism (`src/patterns/costs/CostsTable.tsx`), not a DS component. ' +
          'It composes TableList, TableHeaderRow, TableHeaderCell, TableRow, TableCell, Checkbox, TableExpandButton, TableAccountDetails, ' +
          'StatusPill and RowActionsMenu the way the CAF Figma library draws **Table / Header – Costs** (121:4938, ' +
          'Selected false / true / Mixed) and **Table / Row – Cost** (121:2782, Expanded; Selectable 121:5197). ' +
          'Headers sort (a new column ascending, the same one flips); the header checkbox selects every row shown, ' +
          'and shows Mixed when some are; the caret opens the cost’s breakdown under its row; ••• opens the row’s menu. ' +
          'On a narrow screen the table scrolls sideways in its own region (TableList), and the row menus open outside it. ' +
          'Rows are the Admin Costs screen’s (2102:5749).',
      },
    },
  },
} satisfies Meta<typeof CostsTableDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Helpers for the plays. */
const costsTable = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Costs' }) as HTMLTableElement;
/* The ids of the body rows, in order (not the expanded rows' details). */
const rowIds = (table: HTMLTableElement) =>
  Array.from(table.tBodies[0].rows)
    .map((r) => r.dataset.id)
    .filter(Boolean);
const rowOf = (table: HTMLTableElement, id: string) => table.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`)!;

/** The Costs screen as it opens: nothing selected, sorted or expanded. */
export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const table = costsTable(canvasElement);
    await expect(rowIds(table)).toEqual(SCREEN_IDS);
    // Figma's header: Account, Invoice #, Amount, Payment Method, Status, Date Submitted.
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent);
    // Before them, the (visually hidden) Details header and the select-all checkbox; after them, Actions.
    await expect(headers).toEqual(['Details', '', 'Account', 'Invoice #', 'Amount', 'Payment Method', 'Status', 'Date Submitted', 'Actions']);
    await expect(within(table).getByRole('checkbox', { name: 'Select all costs' })).toBeVisible();
    // Table / Header Row: each label sits 16 in, at the x of the cell content under it (Account Details, the amount).
    const first = rowOf(table, SCREEN_IDS[0]);
    for (const [name, column] of [['Account', 3], ['Amount', 5]] as const) {
      const label = within(table).getByRole('button', { name }).getBoundingClientRect().left;
      const content = first.querySelector(`td:nth-child(${column}) > div > *`)!.getBoundingClientRect().left;
      await expect(label).toBe(content);
    }
    // A recurring cost carries the "Recurring" pill under its account lines; a single one doesn't.
    await expect(within(rowOf(table, '37022')).getByText('Recurring')).toBeVisible();
    await expect(within(rowOf(table, '37023')).queryByText('Recurring')).not.toBeInTheDocument();
    await expect(within(rowOf(table, '37023')).getByText('Credit Card details: **** **** **** 1234')).toBeVisible();
  },
};

/** Select rows: one row makes the header Mixed; the header selects all, then none (keyboard too). */
export const SelectAll: Story = {
  name: 'Select all and mixed',
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = costsTable(canvasElement);
    const all = canvas.getByRole('checkbox', { name: 'Select all costs' });
    await expect(all).not.toBeChecked();

    // One row: it is selected (TableRow's tint), and the header shows Mixed.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select cost 37021' }));
    await expect(rowOf(table, '37021')).toHaveAttribute('data-selected');
    await waitFor(() => expect(all).toBePartiallyChecked());
    await expect(canvas.getByRole('status')).toHaveTextContent('1 selected');

    // The header selects every row…
    await userEvent.click(all);
    await waitFor(() => expect(all).toBeChecked());
    await expect(all).not.toBePartiallyChecked();
    for (const id of SCREEN_IDS) await expect(rowOf(table, id)).toHaveAttribute('data-selected');
    await expect(canvas.getByRole('status')).toHaveTextContent('8 selected');

    // …and, from the keyboard (Space), none.
    all.focus();
    await userEvent.keyboard(' ');
    await waitFor(() => expect(all).not.toBeChecked());
    for (const id of SCREEN_IDS) await expect(rowOf(table, id)).not.toHaveAttribute('data-selected');
    await expect(canvas.getByRole('status')).toHaveTextContent('0 selected');

    // Space on a row's checkbox selects it too.
    canvas.getByRole('checkbox', { name: 'Select cost 37010' }).focus();
    await userEvent.keyboard(' ');
    await waitFor(() => expect(all).toBePartiallyChecked());
  },
};

/** Sort: a new column sorts ascending, the same column flips, another column takes over. */
export const Sort: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const table = costsTable(canvasElement);
    const header = (name: string) => within(table).getByRole('columnheader', { name });
    const sortButton = (name: string) => within(header(name)).getByRole('button', { name });

    await userEvent.click(sortButton('Amount'));
    await expect(header('Amount')).toHaveAttribute('aria-sort', 'ascending');
    // USD 100, USD 123, USD 300, EUR 4603.2, USD 5500, … (amounts, whatever the currency).
    await expect(rowIds(table).slice(0, 3)).toEqual(['37023', '37001', '37011']);

    await userEvent.click(sortButton('Amount'));
    await expect(header('Amount')).toHaveAttribute('aria-sort', 'descending');
    await expect(rowIds(table)[0]).toBe('37019');

    // Another column: it sorts ascending, and Amount is no longer sorted.
    await userEvent.click(sortButton('Date Submitted'));
    await expect(header('Date Submitted')).toHaveAttribute('aria-sort', 'ascending');
    await expect(header('Amount')).not.toHaveAttribute('aria-sort');
    await expect(rowIds(table).slice(0, 5)).toEqual(['37012', '37011', '37010', '37001', '37023']);

    // From the keyboard: Enter on Account sorts by cost ID.
    sortButton('Account').focus();
    await userEvent.keyboard('{Enter}');
    await expect(header('Account')).toHaveAttribute('aria-sort', 'ascending');
    await expect(rowIds(table)).toEqual([...SCREEN_IDS].sort());
    await expect(sortButton('Account')).toHaveFocus();
  },
};

/** Expand: the caret opens the cost’s breakdown under its row, and closes it again from the keyboard. */
export const Expand: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Show details for cost 37021' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('table', { name: 'Breakdown of cost 37021' })).not.toBeInTheDocument();

    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const breakdown = canvas.getByRole('table', { name: 'Breakdown of cost 37021' });
    await expect(breakdown).toBeVisible();
    // It is the row right under the cost's row, and the button points at it.
    const details = breakdown.closest('tr')!;
    await expect(button).toHaveAttribute('aria-controls', details.id);
    await expect(details.previousElementSibling).toBe(rowOf(costsTable(canvasElement), '37021'));
    // Figma's Breakdown Table columns, and one row per breakdown line.
    const columns = within(breakdown).getAllByRole('columnheader').map((th) => th.textContent);
    await expect(columns).toEqual(['Title', 'Amount', 'Nature of Service', 'Cost Center', 'Location', 'Period']);
    await expect(within(breakdown).getAllByRole('row')).toHaveLength(3);
    await expect(within(breakdown).getAllByText('September 1, 2026 - September 30, 2026')).toHaveLength(2);

    // A second row opens independently.
    await userEvent.click(canvas.getByRole('button', { name: 'Show details for cost 37023' }));
    await expect(canvas.getByRole('table', { name: 'Breakdown of cost 37023' })).toBeVisible();
    await expect(canvas.getByRole('table', { name: 'Breakdown of cost 37021' })).toBeVisible();

    // Enter closes it again; focus stays on the button.
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('table', { name: 'Breakdown of cost 37021' })).not.toBeInTheDocument();
    await expect(button).toHaveFocus();
  },
};

/** Row menu: ••• opens the row’s actions; Approve changes the status; the keyboard reaches Reject. */
export const RowMenu: Story = {
  name: 'Row menu',
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = costsTable(canvasElement);
    const button = canvas.getByRole('button', { name: 'Actions for cost 37022' });

    await userEvent.click(button);
    const menu = screen.getByRole('menu', { name: 'Actions for cost 37022' });
    const items = within(menu).getAllByRole('menuitem').map((i) => i.textContent);
    await expect(items).toEqual(['Approve', 'Reject', 'View invoices', 'Request adjustment', 'Delete']);
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Approve' })).toHaveFocus());

    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Approve' }));
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await expect(button).toHaveFocus();
    await expect(within(rowOf(table, '37022')).getByText('Approved')).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent('Approved: cost 37022');

    // From the keyboard: ↓ opens on Approve, ↓ moves to Reject, Enter chooses it. Rejected is a Tag.
    const next = canvas.getByRole('button', { name: 'Actions for cost 37021' });
    next.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Approve' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await expect(next).toHaveFocus();
    await expect(within(rowOf(table, '37021')).getByText('Rejected')).toBeVisible();

    // Escape closes the menu without choosing.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('menu')).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await expect(next).toHaveFocus();
  },
};

/** Dark (Figma pins Table / Row – Cost and Header – Costs to Dark): two rows selected, one expanded, sorted by date. */
export const Dark: Story = {
  args: { selected: ['37022', '37021'], expanded: ['37021'], sort: { column: 'submittedAt', direction: 'descending' } },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('checkbox', { name: 'Select all costs' })).toBePartiallyChecked());
    await expect(canvas.getByRole('table', { name: 'Breakdown of cost 37021' })).toBeVisible();
    await expect(canvas.getByRole('columnheader', { name: 'Date Submitted' })).toHaveAttribute('aria-sort', 'descending');
  },
};

/* ── At a phone's width ─────────────────────────────────────────────────────
   Storybook's "Small mobile" viewport (320 × 568); Chromatic ignores the global,
   so the story also sets chromatic.viewports. The frame is a phone's 320 with
   AppShell's 16px gutters at any viewport, as Vitest and test:static's channel
   pass render wider. */
const MOBILE = { value: 'mobile1', isRotated: false } as const;

/**
 * At 320 the Costs table (about 980 wide) scrolls sideways in its own region,
 * named Costs, and the page doesn't (decision add-phone-table-layout). The last
 * row's ••• menu opens outside the region: over its bottom edge, all on screen.
 */
export const Phone: Story = {
  name: 'At a phone’s width',
  args: {},
  render: () => (
    <div className="max-w-80 px-4 py-6">
      <CostsTableDemo />
    </div>
  ),
  globals: { viewport: MOBILE },
  parameters: { layout: 'fullscreen', chromatic: { viewports: [320] } },
  // The menu stays open for the snapshot.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const table = costsTable(canvasElement);
    const region = await within(canvasElement).findByRole('region', { name: 'Costs' });
    await expect(region).toBe(table.parentElement);
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect(region.clientWidth).toBe(288);
    await expect(region.scrollWidth).toBeGreaterThan(900);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

    // The last row's •••, brought into view: the region scrolls to its last column (again if a
    // late font widens the table: a scroll is no DOM mutation, so it is safe in waitFor), and the
    // page scrolls the row near the top, so the menu has room under it even in a short viewport.
    const id = SCREEN_IDS[SCREEN_IDS.length - 1];
    const button = within(table).getByRole('button', { name: `Actions for cost ${id}` });
    await waitFor(() => {
      region.scrollLeft = region.scrollWidth;
      expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(region.getBoundingClientRect().right + 0.5);
    });
    window.scrollTo(0, window.scrollY + button.getBoundingClientRect().top - 16);
    const r = region.getBoundingClientRect();

    await userEvent.click(button);
    const menu = screen.getByRole('menu', { name: `Actions for cost ${id}` });
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Approve' })).toHaveFocus());
    await expect(region.contains(menu)).toBe(false);
    const m = menu.getBoundingClientRect();
    // Below the •••, over the region's bottom edge, where an inline menu would be cut off (above it
    // where the viewport is too short, as test:static's channel pass is)…
    if (menu.getAttribute('data-placement') === 'bottom') await expect(m.bottom).toBeGreaterThan(r.bottom);
    // …and all of it in the viewport, its last item the menu's own pixels.
    await expect(m.left).toBeGreaterThanOrEqual(0);
    await expect(m.top).toBeGreaterThanOrEqual(0);
    await expect(m.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await expect(m.bottom).toBeLessThanOrEqual(document.documentElement.clientHeight);
    const last = within(menu).getByRole('menuitem', { name: 'Delete' }).getBoundingClientRect();
    await expect(menu.contains(document.elementFromPoint(last.left + 8, last.top + last.height / 2))).toBe(true);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};
