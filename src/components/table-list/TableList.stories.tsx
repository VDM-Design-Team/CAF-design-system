import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Checkbox } from '../checkbox';
import { EmptyState } from '../empty-state';
import { MenuItem } from '../menu-item';
import { RowActionsMenu } from '../row-actions-menu';
import { TableCell } from '../table-cell';
import { TableHeaderCell } from '../table-header-cell';
import { TableHeaderRow } from '../table-header-row';
import { TableRow } from '../table-row';
import { TableList } from './TableList';

/* Figma's example (773:1468): the Cost Centers list. */
const COST_CENTERS = [
  { id: 'cc-1', name: 'Employee Expenses', service: 'Salary', location: 'Philippines' },
  { id: 'cc-2', name: 'Travel Expenses', service: 'Testing', location: 'Philippines' },
  { id: 'cc-3', name: 'IT Expenses', service: 'Software', location: 'United States' },
  { id: 'cc-4', name: 'Legal Expenses', service: 'Consulting', location: 'United Kingdom' },
];
const COLUMNS = ['Cost center', 'Nature of Service', 'Location'];

function CostCentersHeader({ showCheckbox = false }: { showCheckbox?: boolean }) {
  return (
    <TableHeaderRow showCheckbox={showCheckbox} checkboxProps={{ 'aria-label': 'Select all cost centers' }} showActions>
      {COLUMNS.map((label) => (
        <TableHeaderCell key={label}>{label}</TableHeaderCell>
      ))}
    </TableHeaderRow>
  );
}

function CostCenterRow({
  row,
  showCheckbox = false,
  selected = false,
}: {
  row: (typeof COST_CENTERS)[number];
  showCheckbox?: boolean;
  selected?: boolean;
}) {
  return (
    <TableRow data-id={row.id} selected={selected}>
      {showCheckbox && (
        <TableCell type="checkbox">
          <Checkbox aria-label={`Select ${row.name}, ${row.location}`} checked={selected} onChange={() => {}} />
        </TableCell>
      )}
      <TableCell>{row.name}</TableCell>
      <TableCell>{row.service}</TableCell>
      <TableCell>{row.location}</TableCell>
      <TableCell type="actions" className="w-1">
        <RowActionsMenu label={`Actions for ${row.name}, ${row.location}`}>
          <MenuItem>Edit</MenuItem>
          <MenuItem destructive>Delete</MenuItem>
        </RowActionsMenu>
      </TableCell>
    </TableRow>
  );
}

const meta = {
  title: 'Components/TableList',
  component: TableList,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / List`): the plain list table, a `TableHeaderRow` ' +
          '(`header`) over `TableRow`s (`children`, Figma’s Rows slot), with no fill and no outer border. It is a real ' +
          '`<table>` that takes its container’s width; name it with `aria-label`. An empty list puts one row in the slot ' +
          'with a TableCell `type="custom"` across every column, holding an EmptyState.',
      },
    },
  },
  args: { 'aria-label': 'Cost centers', header: <CostCentersHeader /> },
  render: (args) => (
    <TableList {...args}>
      {COST_CENTERS.map((row) => (
        <CostCenterRow key={row.id} row={row} />
      ))}
    </TableList>
  ),
} satisfies Meta<typeof TableList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cost Centers: three columns and a ••• menu per row, as Figma's example. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Cost centers' });
    await expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual([...COLUMNS, 'Actions']);
    await userEvent.click(within(table).getByRole('button', { name: 'Actions for IT Expenses, United States' }));
    await expect(await canvas.findByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
  },
};

/* ── Look, in Light and Dark ───────────────────────────────────────────────
   No fill and no outer border; the header row's and the rows' 1px
   stroke.subtle lines; rows with no fill at rest and Table / Row's 16%
   action.primary tint when selected; the container's full width. */

/* A token's computed colour in the current theme. Measure before waitFor, never inside it:
   the probe is a DOM mutation, and waitFor reruns its callback on every mutation. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/* The computed background of a utility class, for the 16% Selected tint. */
function utilityBackground(className: string) {
  const probe = document.createElement('div');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
}

const look = (theme: 'light' | 'dark'): Story => ({
  name: `Look — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-8 bg-surface-canvas p-6" data-testid="page">
      <TableList aria-label="Cost centers" header={<CostCentersHeader />}>
        {COST_CENTERS.map((row) => (
          <CostCenterRow key={row.id} row={row} />
        ))}
      </TableList>
      <TableList aria-label="Cost centers, selectable" header={<CostCentersHeader showCheckbox />}>
        {COST_CENTERS.map((row, i) => (
          <CostCenterRow key={row.id} row={row} showCheckbox selected={i === 1} />
        ))}
      </TableList>
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvas, canvasElement }) => {
    const want = {
      line: tokenColour('stroke-subtle'),
      selected: utilityBackground('bg-action-primary-surface-default/16'),
    };
    const page = canvas.getByTestId('page');
    await waitFor(() => {
      for (const name of ['Cost centers', 'Cost centers, selectable']) {
        const table = within(canvasElement).getByRole('table', { name }) as HTMLTableElement;
        const style = getComputedStyle(table);
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        // No outer border.
        expect([style.borderTopWidth, style.borderRightWidth, style.borderLeftWidth]).toEqual(['0px', '0px', '0px']);
        // The container's width (the page's content box).
        const inner = page.getBoundingClientRect().width - 2 * parseFloat(getComputedStyle(page).paddingLeft);
        expect(Math.abs(table.getBoundingClientRect().width - inner)).toBeLessThan(1);
        // One header row in the <thead>, the rows in the <tbody>, each with its 1px stroke.subtle line.
        expect(table.tHead!.rows).toHaveLength(1);
        expect(table.tBodies[0].rows).toHaveLength(COST_CENTERS.length);
        for (const tr of [...table.rows]) {
          expect(getComputedStyle(tr).borderBottomWidth).toBe('1px');
          expect(getComputedStyle(tr).borderBottomColor).toBe(want.line);
        }
        // No fill at rest; the selected row keeps Table / Row's 16% tint.
        [...table.tBodies[0].rows].forEach((tr) => {
          expect(getComputedStyle(tr).backgroundColor).toBe(
            tr.hasAttribute('data-selected') ? want.selected : 'rgba(0, 0, 0, 0)',
          );
        });
      }
      const selectable = within(canvasElement).getByRole('table', { name: 'Cost centers, selectable' });
      expect(selectable.querySelectorAll('tbody tr[data-selected]')).toHaveLength(1);
    });
  },
});

export const LookLight = look('light');
export const LookDark = look('dark');

/** No rows: one row with a Custom cell across every column, holding the compact Empty State. */
export const Empty: Story = {
  render: (args) => (
    <TableList {...args}>
      <TableRow>
        <TableCell type="custom" colSpan={COLUMNS.length + 1}>
          <EmptyState size="compact" title="No items." />
        </TableCell>
      </TableRow>
    </TableList>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Cost centers' });
    await expect(within(table).getByText('No items.')).toBeVisible();
    const cell = table.querySelector('tbody td')!;
    await expect(cell).toHaveAttribute('colspan', String(COLUMNS.length + 1));
    await expect(Math.abs(cell.getBoundingClientRect().width - table.getBoundingClientRect().width)).toBeLessThan(1);
  },
};
