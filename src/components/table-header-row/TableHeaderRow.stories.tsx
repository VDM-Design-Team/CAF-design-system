import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Checkbox } from '../checkbox';
import { MenuItem } from '../menu-item';
import { RowActionsMenu } from '../row-actions-menu';
import { StatusPill } from '../status-pill';
import { TableCell } from '../table-cell';
import { TableExpandButton } from '../table-expand-button';
import { TableHeaderCell, type TableSort } from '../table-header-cell';
import { TableRow } from '../table-row';
import { TableHeaderRow, type TableHeaderRowProps } from './TableHeaderRow';

const meta = {
  title: 'Components/TableHeaderRow',
  component: TableHeaderRow,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / Header Row`). It is a `<tr>` for a table’s ' +
          '`<thead>`: one `TableHeaderCell` per data column as `children` (Figma’s Columns), and a column per control: ' +
          '`showExpand`, `showCheckbox` (select-all; `checkboxProps` go to its Checkbox) and `showActions`. Its header ' +
          'cells take the rows’ padding (16 at the sides, 12 above and below), so the labels line up with the cells ' +
          'under them. No fill; a 1px `stroke/subtle` line underneath.',
      },
    },
  },
  args: { showExpand: false, showCheckbox: true, showActions: true },
  render: (args) => (
    <Table
      header={
        <TableHeaderRow {...args} checkboxProps={{ 'aria-label': 'Select all costs' }}>
          {LABELS.map(header)}
        </TableHeaderRow>
      }
    >
      <SampleRow id="37022" expand={args.showExpand} checkbox={args.showCheckbox} actions={args.showActions} />
    </Table>
  ),
} satisfies Meta<typeof TableHeaderRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Figma's example (771:1342): Invoice #, Applicant, Amount, Status, Submitted. */
const LABELS = ['Invoice #', 'Applicant', 'Amount', 'Status', 'Submitted'];
const header = (label: string) => (
  <TableHeaderCell key={label} className="w-50">
    {label}
  </TableHeaderCell>
);

/* TableHeaderRow is a <tr>, so every story puts it in a table's <thead>, over a TableRow. */
function Table({
  header: head,
  children,
  ...props
}: { header: ReactNode; children?: ReactNode } & HTMLAttributes<HTMLTableElement>) {
  return (
    <table className="w-max border-collapse" {...props}>
      <thead>{head}</thead>
      <tbody>{children}</tbody>
    </table>
  );
}

/* A body row under the header, with the same columns: the labels line up with its cells. */
function SampleRow({
  id,
  columns = LABELS.length,
  expand = false,
  checkbox = false,
  actions = false,
  selected = false,
  onSelect,
}: {
  id: string;
  columns?: number;
  expand?: boolean;
  checkbox?: boolean;
  actions?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const values = [`INV-2026-${id}`, 'QA Test', 'USD 1,250.00', 'Pending', '2026-10-08', 'Card', 'Philippines', 'Salary'];
  return (
    <TableRow data-id={id} selected={selected}>
      {expand && (
        <TableCell type="custom">
          <TableExpandButton label={`Show details for cost ${id}`} />
        </TableCell>
      )}
      {checkbox && (
        <TableCell type="checkbox">
          <Checkbox aria-label={`Select cost ${id}`} checked={selected} onChange={onSelect ?? (() => {})} />
        </TableCell>
      )}
      {values.slice(0, columns).map((value, i) =>
        value === 'Pending' ? (
          <TableCell key={i} type="tag">
            <StatusPill>Pending</StatusPill>
          </TableCell>
        ) : (
          <TableCell key={i}>{value}</TableCell>
        ),
      )}
      {actions && (
        <TableCell type="actions">
          <RowActionsMenu label={`Actions for cost ${id}`}>
            <MenuItem>Edit</MenuItem>
          </RowActionsMenu>
        </TableCell>
      )}
    </TableRow>
  );
}

/** Figma's defaults: Show Checkbox and Show Actions on, over a row of Table / Cells. */
export const Playground: Story = {};

/* ── Every property, in Light and Dark ─────────────────────────────────────
   Figma's Show Expand, Show Checkbox (unchecked, Mixed, Selected) and Show
   Actions, each over a TableRow with the same columns. Checked against the
   bindings: no fill, a 1px stroke.subtle line, the rows' padding on every
   cell (16 at the sides, 12 above and below), 44 tall inside its line, labels
   in text.secondary and 16 in, at the same x as the cells' text. */

const VARIANTS: { name: string; props: Partial<TableHeaderRowProps>; mixed?: boolean; selected?: boolean }[] = [
  { name: 'No controls', props: {} },
  { name: 'Show Expand', props: { showExpand: true } },
  { name: 'Show Checkbox', props: { showCheckbox: true } },
  { name: 'Show Checkbox (Mixed)', props: { showCheckbox: true }, mixed: true },
  { name: 'Show Checkbox (Selected)', props: { showCheckbox: true }, selected: true },
  { name: 'Show Actions', props: { showActions: true } },
  { name: 'Show Expand + Checkbox + Actions', props: { showExpand: true, showCheckbox: true, showActions: true } },
];

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

const properties = (theme: 'light' | 'dark'): Story => ({
  name: `Properties — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map(({ name, props, mixed, selected }, v) => (
        <div key={name} className="flex flex-col gap-2" data-variant={name}>
          <span className="text-caption-md-medium text-text-secondary">{name}</span>
          <Table
            header={
              <TableHeaderRow
                {...props}
                checkboxProps={{
                  'aria-label': `Select all costs (${name})`,
                  checked: selected,
                  indeterminate: mixed,
                  onChange: () => {},
                }}
              >
                {LABELS.map(header)}
              </TableHeaderRow>
            }
          >
            <SampleRow
              id={`01${v}`}
              expand={props.showExpand}
              checkbox={props.showCheckbox}
              actions={props.showActions}
              selected={selected}
            />
          </Table>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { line: tokenColour('stroke-subtle'), label: tokenColour('text-secondary') };
    await waitFor(() => {
      for (const { name, props, mixed, selected } of VARIANTS) {
        const block = canvasElement.querySelector<HTMLElement>(`[data-variant="${name}"]`)!;
        const head = block.querySelector('thead tr')!;
        const style = getComputedStyle(head);
        // No fill; stroke/1 in colors/stroke/subtle under it.
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style.borderBottomWidth).toBe('1px');
        expect(style.borderBottomColor).toBe(want.line);
        // 44 inside its line (12 + the 20px label + 12); with the 1px line, Figma's 45.
        expect(head.querySelector('th')!.clientHeight).toBe(44);
        // Columns: [Details] [select-all] the labels [Actions], each its own <th>.
        const ths = [...head.querySelectorAll('th')];
        const controls = Number(!!props.showExpand) + Number(!!props.showCheckbox) + Number(!!props.showActions);
        expect(ths).toHaveLength(LABELS.length + controls);
        for (const th of ths) {
          const cell = getComputedStyle(th);
          expect([cell.paddingLeft, cell.paddingRight, cell.paddingTop, cell.paddingBottom]).toEqual([
            '16px',
            '16px',
            '12px',
            '12px',
          ]);
          expect(cell.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        }
        expect(ths[0].textContent).toBe(props.showExpand ? 'Details' : props.showCheckbox ? '' : LABELS[0]);
        expect(ths.at(-1)!.textContent).toBe(props.showActions ? 'Actions' : LABELS.at(-1));
        // The select-all Checkbox, centred in its column, in Figma's three states.
        const box = head.querySelector<HTMLInputElement>('input[type="checkbox"]');
        expect(box !== null).toBe(!!props.showCheckbox);
        if (box) {
          expect(box.checked).toBe(!!selected);
          expect(box.indeterminate).toBe(!!mixed);
          const b = box.getBoundingClientRect();
          const th = box.closest('th')!.getBoundingClientRect();
          expect(Math.abs(b.left + b.width / 2 - (th.left + th.width / 2))).toBeLessThan(1);
          expect(Math.abs(b.top + b.height / 2 - (th.top + th.height / 2))).toBeLessThan(1);
        }
        // Labels: text.secondary, 16 in, at the same x as the text in the row's cell below.
        const labels = ths.filter((th) => LABELS.includes(th.textContent ?? ''));
        const cells = [...block.querySelectorAll('tbody tr > td')].slice(
          Number(!!props.showExpand) + Number(!!props.showCheckbox),
        );
        labels.forEach((th, i) => {
          const label = th.querySelector('span')!;
          expect(getComputedStyle(label).color).toBe(want.label);
          expect(label.getBoundingClientRect().left - th.getBoundingClientRect().left).toBe(16);
          const text = cells[i].querySelector('div > *')!;
          expect(label.getBoundingClientRect().left).toBe(text.getBoundingClientRect().left);
        });
      }
    });
  },
});

export const PropertiesLight = properties('light');
export const PropertiesDark = properties('dark');

/* ── Columns 2–8 ───────────────────────────────────────────────────────────
   Figma's Columns variant is the number of TableHeaderCells in code. */

const COLUMN_COUNTS = [2, 3, 4, 5, 6, 7, 8];
const MORE = ['Invoice #', 'Applicant', 'Amount', 'Status', 'Submitted', 'Method', 'Location', 'Nature of Service'];

const columns = (theme: 'light' | 'dark'): Story => ({
  name: `Columns — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      {COLUMN_COUNTS.map((n) => (
        <div key={n} className="flex flex-col gap-2" data-columns={n}>
          <span className="text-caption-md-medium text-text-secondary">Columns={n}</span>
          <Table
            header={
              <TableHeaderRow showCheckbox checkboxProps={{ 'aria-label': `Select all (${n} columns)` }} showActions>
                {MORE.slice(0, n).map((l) => (
                  <TableHeaderCell key={l}>{l}</TableHeaderCell>
                ))}
              </TableHeaderRow>
            }
          >
            <SampleRow id={`02${n}`} columns={n} checkbox actions />
          </Table>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    for (const n of COLUMN_COUNTS) {
      const head = canvasElement.querySelector(`[data-columns="${n}"] thead tr`)!;
      // The checkbox column, n labels, the actions column.
      await expect(head.querySelectorAll('th')).toHaveLength(n + 2);
      await expect([...head.querySelectorAll('th')].slice(1, -1).map((th) => th.textContent)).toEqual(MORE.slice(0, n));
    }
  },
});

export const ColumnsLight = columns('light');
export const ColumnsDark = columns('dark');

/* ── Select all ────────────────────────────────────────────────────────────
   The header checkbox selects every row shown; Mixed while some are. The
   table owns the selection, as on the CAF screens. */

function SelectableTable() {
  const ids = ['101', '102', '103'];
  const [selected, setSelected] = useState<string[]>([]);
  const all = selected.length === ids.length;
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <Table
      aria-label="Costs"
      header={
        <TableHeaderRow
          showCheckbox
          checkboxProps={{
            'aria-label': 'Select all costs',
            checked: all,
            indeterminate: selected.length > 0 && !all,
            onChange: () => setSelected(all ? [] : ids),
          }}
          showActions
        >
          {LABELS.map(header)}
        </TableHeaderRow>
      }
    >
      {ids.map((id) => (
        <SampleRow key={id} id={id} checkbox actions selected={selected.includes(id)} onSelect={() => toggle(id)} />
      ))}
    </Table>
  );
}

/** Select all, then one row off: the header box shows Mixed. */
export const SelectAll: Story = {
  render: () => <SelectableTable />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole('checkbox', { name: 'Select all costs' });
    const rows = () => [...canvasElement.querySelectorAll('tbody tr')];
    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(rows().every((r) => r.hasAttribute('data-selected'))).toBe(true);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select cost 102' }));
    await expect(all).not.toBeChecked();
    await expect((all as HTMLInputElement).indeterminate).toBe(true);
    await userEvent.click(all);
    await expect(all).toBeChecked();
    await userEvent.click(all);
    await expect(rows().some((r) => r.hasAttribute('data-selected'))).toBe(false);
  },
};

/* ── Sortable headers in the row ───────────────────────────────────────────
   Sortable TableHeaderCells keep their sort control inside the row's padding. */

function SortableTable() {
  const [order, setOrder] = useState<{ column: string; sort: Exclude<TableSort, 'none'> } | null>(null);
  const sortBy = (column: string) =>
    setOrder((o) => ({ column, sort: o?.column === column && o.sort === 'ascending' ? 'descending' : 'ascending' }));
  return (
    <Table
      header={
        <TableHeaderRow showActions>
          {LABELS.map((label) => (
            <TableHeaderCell
              key={label}
              className="w-50"
              sortable
              sort={order?.column === label ? order.sort : 'none'}
              onSort={() => sortBy(label)}
            >
              {label}
            </TableHeaderCell>
          ))}
        </TableHeaderRow>
      }
    >
      <SampleRow id="201" actions />
    </Table>
  );
}

/** Sortable=true in the row: as tall as plain labels (44 inside the line), and the sort reaches `aria-sort`. */
export const Sortable: Story = {
  render: () => <SortableTable />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const head = canvasElement.querySelector('thead tr')!;
    await expect(head.querySelector('th')!.clientHeight).toBe(44);
    await userEvent.click(canvas.getByRole('button', { name: 'Amount' }));
    await expect(canvas.getByRole('columnheader', { name: 'Amount' })).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(canvas.getByRole('button', { name: 'Amount' }));
    await expect(canvas.getByRole('columnheader', { name: 'Amount' })).toHaveAttribute('aria-sort', 'descending');
  },
};
