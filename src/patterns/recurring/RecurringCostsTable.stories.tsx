import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { EmptyState } from '../../components/empty-state';
import { MenuItem } from '../../components/menu-item';
import { recurringCosts, rowActionLabels } from '../fixtures';
import { RecurringCostsTable, sortRecurringCosts, type RecurringSort } from './RecurringCostsTable';

/* The User Recurring Costs screen's six (U04, 545:18695), in its order. */
const USER_ROWS = recurringCosts.slice(0, 6);

interface DemoProps {
  sort?: RecurringSort | null;
  menuOpenFor?: string;
  empty?: boolean;
}

function RecurringCostsTableDemo({ sort: initialSort = null, menuOpenFor, empty = false }: DemoProps) {
  const [sort, setSort] = useState<RecurringSort | null>(initialSort);
  return (
    <div className="pb-64">
      <RecurringCostsTable
        rows={empty ? [] : sortRecurringCosts(USER_ROWS, sort)}
        sort={sort}
        onSortChange={setSort}
        defaultMenuOpenFor={menuOpenFor}
        rowActions={() => (
          /* Figma's Recurring Costs row menu (pattern 03, 520:2090): Edit first, Delete last in red. */
          <>
            {rowActionLabels.recurringCosts.map((label) => (
              <MenuItem key={label} destructive={label === 'Delete'}>
                {label}
              </MenuItem>
            ))}
          </>
        )}
        empty={<EmptyState size="compact" title="No recurring costs yet" />}
      />
    </div>
  );
}

const meta = {
  title: 'Patterns/Recurring costs table',
  component: RecurringCostsTableDemo,
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'The Recurring Costs list’s table: a story-level organism (`src/patterns/recurring/RecurringCostsTable.tsx`), ' +
          'not a DS component. It composes TableHeaderCell, TableRow, TableCell, StatusPill (Tag for Stopped) and ' +
          'RowActionsMenu the way the CAF Figma library draws **Table / Header – Recurring Costs** (260:1021), ' +
          '**Table / Row – Recurring Cost** (260:1000) and **Table / Recurring Costs** (260:1065). Headers sort (a new ' +
          'column ascending, the same one flips; Frequency by its length in days). Rows are the User Recurring Costs ' +
          'screen’s (U04, 545:18695).',
      },
    },
  },
} satisfies Meta<typeof RecurringCostsTableDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

const table = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Recurring costs' }) as HTMLTableElement;
const rowIds = (t: HTMLTableElement) => Array.from(t.tBodies[0].rows).map((r) => r.dataset.id);
const rowOf = (t: HTMLTableElement, id: string) => t.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`)!;

/** The screen as it opens: Figma's columns, Created By as name over email, the Status Pill. */
export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const t = table(canvasElement);
    await expect(rowIds(t)).toEqual(['1882', '1240', '1239', '1207', '9', '6']);
    const headers = within(t).getAllByRole('columnheader').map((th) => th.textContent);
    await expect(headers).toEqual(['ID', 'Created By', 'Frequency', 'Status', 'Applicant Name', 'Email', 'Date created', 'Actions']);
    const first = within(rowOf(t, '1882'));
    // #1882 was created by its own applicant: the name and email show in Created By and in their own columns.
    await expect(first.getAllByText('QA Test')).toHaveLength(2);
    await expect(first.getAllByText('qa.test@example.com')).toHaveLength(2);
    await expect(first.getByText('3 weeks')).toBeVisible();
    await expect(first.getByText('Active')).toBeVisible();
    await expect(first.getByText('July 29, 2026')).toBeVisible();
    // A stopped schedule: Figma has no Stopped pill, so a neutral Tag stands in.
    await expect(within(rowOf(t, '1207')).getByText('Stopped')).toBeVisible();
    await expect(first.getByRole('button', { name: 'Actions for recurring cost 1882' })).toBeVisible();
  },
};

/** Sort: Frequency sorts by length (1 week, 3 weeks, 1 month); the keyboard flips it. */
export const Sort: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const t = table(canvasElement);
    const header = (name: string) => within(t).getByRole('columnheader', { name });
    const sortButton = (name: string) => within(header(name)).getByRole('button', { name });

    await userEvent.click(sortButton('Frequency'));
    await expect(header('Frequency')).toHaveAttribute('aria-sort', 'ascending');
    await expect(rowIds(t)).toEqual(['1240', '1239', '1207', '1882', '9', '6']);

    sortButton('Frequency').focus();
    await userEvent.keyboard('{Enter}');
    await expect(header('Frequency')).toHaveAttribute('aria-sort', 'descending');
    await expect(rowIds(t)).toEqual(['9', '6', '1882', '1240', '1239', '1207']);

    await userEvent.click(sortButton('Date created'));
    await expect(header('Frequency')).not.toHaveAttribute('aria-sort');
    await expect(rowIds(t)).toEqual(['6', '9', '1207', '1240', '1239', '1882']);
  },
};

/** No rows: a compact EmptyState across the table. */
export const Empty: Story = {
  args: { empty: true },
  play: async ({ canvasElement }) => {
    const t = table(canvasElement);
    await expect(within(t).getByText('No recurring costs yet')).toBeVisible();
    await expect(within(t).getAllByRole('row')).toHaveLength(2);
  },
};

/** Dark: sorted by ID, the first row's menu open (Figma pins Header – Recurring Costs to Dark). */
export const Dark: Story = {
  args: { sort: { column: 'id', direction: 'descending' }, menuOpenFor: '1882' },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('columnheader', { name: 'ID' })).toHaveAttribute('aria-sort', 'descending');
    const menu = await canvas.findByRole('menu', { name: 'Actions for recurring cost 1882' });
    await waitFor(() => expect(menu).toBeVisible());
    await expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual([...rowActionLabels.recurringCosts]);
  },
};
