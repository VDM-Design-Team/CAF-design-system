import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { StatusPill } from '../status-pill';
import { TableCell } from '../table-cell';
import { TableHeaderCell, TABLE_SORTS, type TableHeaderCellProps, type TableSort } from './TableHeaderCell';

/* TableHeaderCell is a <th>, so every story puts it in a table's header row. */
function HeaderRow({ children }: { children: ReactNode }) {
  return (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-stroke-subtle">{children}</tr>
      </thead>
    </table>
  );
}

const meta = {
  title: 'Components/TableHeaderCell',
  component: TableHeaderCell,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / Header Cell`). It is a `<th scope="col">`. ' +
          'Label is `children`. `sortable` is Figma’s Sortable: the label becomes a button that calls `onSort`, and the ' +
          'table owns the order. `sort` is Figma’s Sort, `none` (default), `ascending` or `descending`; a sorted column ' +
          'also sets `aria-sort`.',
      },
    },
  },
  args: { children: 'Column', sortable: true, sort: 'none', onSort: fn() },
  argTypes: { sort: { control: 'radio', options: TABLE_SORTS } },
  render: (args) => (
    <HeaderRow>
      <TableHeaderCell {...args} />
    </HeaderRow>
  ),
} satisfies Meta<typeof TableHeaderCell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Clicking a sortable header calls `onSort`. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Column' }));
    await expect(args.onSort).toHaveBeenCalledTimes(1);
  },
};

export const NotSortable: Story = { args: { sortable: false } };

/* ── Every Figma variant, in Light and Dark ───────────────────────────────
   The four variants of the component set, each in its own header row, and
   checked against the variables Figma binds: [label, arrows]. */

const VARIANTS: { name: string; props: Partial<TableHeaderCellProps>; bound: [string, string | null] }[] = [
  { name: 'Sortable=false', props: { sortable: false }, bound: ['text-secondary', null] },
  { name: 'Sortable=true, Sort=None', props: { sortable: true, sort: 'none' }, bound: ['text-secondary', 'text-tertiary'] },
  { name: 'Sortable=true, Sort=Ascending', props: { sortable: true, sort: 'ascending' }, bound: ['text-primary', 'text-primary'] },
  { name: 'Sortable=true, Sort=Descending', props: { sortable: true, sort: 'descending' }, bound: ['text-primary', 'text-primary'] },
];

/* A token's computed colour in the current theme. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

const variants = (theme: 'light' | 'dark'): Story => ({
  name: `Variants — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map(({ name, props }) => (
        <div key={name} className="flex items-center gap-4" data-variant={name}>
          <span className="w-64 text-caption-md-medium text-text-secondary">{name}</span>
          <HeaderRow>
            <TableHeaderCell {...props} onSort={() => {}}>
              Column
            </TableHeaderCell>
          </HeaderRow>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      for (const { name, props, bound } of VARIANTS) {
        const row = canvasElement.querySelector<HTMLElement>(`[data-variant="${name}"]`)!;
        const th = row.querySelector('th')!;
        const [label, arrows] = bound;
        expect(getComputedStyle(th.querySelector('th > span, button > span')!).color).toBe(tokenColour(label));
        const svg = th.querySelector('svg');
        if (arrows) expect(getComputedStyle(svg!).color).toBe(tokenColour(arrows));
        else expect(svg).toBeNull();
        expect(th.querySelector('button') !== null).toBe(props.sortable);
        expect(th.getAttribute('aria-sort')).toBe(props.sort && props.sort !== 'none' ? props.sort : null);
      }
    });
  },
});

export const VariantsLight = variants('light');
export const VariantsDark = variants('dark');

/* ── A sortable table ──────────────────────────────────────────────────────
   Figma's Costs header with TableCell rows. The story owns the order, as a
   CAF screen would: a new column sorts ascending, the same column flips. */

const COSTS = [
  { invoice: 'INV-1042', amount: 5130.37, method: 'Wiretransfer', status: 'pending', date: '2026-10-08' },
  { invoice: 'INV-1043', amount: 240.0, method: 'Card', status: 'active', date: '2026-10-02' },
  { invoice: 'INV-1044', amount: 1875.5, method: 'Wiretransfer', status: 'pending', date: '2026-10-15' },
] as const;

type Column = 'invoice' | 'amount' | 'date';

function CostsTable() {
  const [order, setOrder] = useState<{ column: Column; sort: Exclude<TableSort, 'none'> } | null>(null);
  const sortBy = (column: Column) =>
    setOrder((o) => ({ column, sort: o?.column === column && o.sort === 'ascending' ? 'descending' : 'ascending' }));
  const sortOf = (column: Column): TableSort => (order?.column === column ? order.sort : 'none');
  const rows = [...COSTS].sort((a, b) => {
    if (!order) return 0;
    const [x, y] = [a[order.column], b[order.column]];
    const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
    return order.sort === 'ascending' ? d : -d;
  });
  const header = (column: Column, label: string) => (
    <TableHeaderCell className="w-48 px-4" sortable sort={sortOf(column)} onSort={() => sortBy(column)}>
      {label}
    </TableHeaderCell>
  );
  // w-max: keep every column at its content width, so a narrow canvas scrolls instead of wrapping cells.
  return (
    <table className="w-max border-collapse">
      <thead>
        <tr className="border-b border-stroke-subtle">
          {header('invoice', 'Invoice #')}
          {header('amount', 'Amount')}
          <TableHeaderCell className="w-48 px-4">Payment Method</TableHeaderCell>
          <TableHeaderCell className="w-48 px-4">Status</TableHeaderCell>
          {header('date', 'Date Submitted')}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.invoice} className="border-b border-stroke-subtle">
            <TableCell>{r.invoice}</TableCell>
            <TableCell>USD {r.amount.toFixed(2)}</TableCell>
            <TableCell>{r.method}</TableCell>
            <TableCell type="tag">
              <StatusPill status={r.status}>{r.status === 'pending' ? 'Pending' : 'Active'}</StatusPill>
            </TableCell>
            <TableCell>{r.date}</TableCell>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Click a header to sort by it; click it again to reverse. */
export const SortableTable: Story = {
  name: 'In a sortable table',
  render: () => <CostsTable />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByRole('columnheader', { name: 'Amount' });
    const firstAmount = () => canvasElement.querySelectorAll('tbody tr')[0].querySelectorAll('td')[1].textContent;

    await expect(amount).not.toHaveAttribute('aria-sort');
    await userEvent.click(canvas.getByRole('button', { name: 'Amount' }));
    await expect(amount).toHaveAttribute('aria-sort', 'ascending');
    await expect(firstAmount()).toBe('USD 240.00');

    await userEvent.click(canvas.getByRole('button', { name: 'Amount' }));
    await expect(amount).toHaveAttribute('aria-sort', 'descending');
    await expect(firstAmount()).toBe('USD 5130.37');

    // Sorting another column clears this one.
    await userEvent.click(canvas.getByRole('button', { name: 'Date Submitted' }));
    await expect(amount).not.toHaveAttribute('aria-sort');
    await expect(canvas.getByRole('columnheader', { name: 'Date Submitted' })).toHaveAttribute('aria-sort', 'ascending');
  },
};
