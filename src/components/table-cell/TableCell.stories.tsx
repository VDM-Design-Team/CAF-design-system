import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Checkbox } from '../checkbox';
import { EmptyState } from '../empty-state';
import { StatusPill } from '../status-pill';
import { TableAccountDetails } from '../table-account-details';
import { TableDetailLabel } from '../table-detail-label';
import { TableExpandButton } from '../table-expand-button';
import { Tag } from '../tag';
import { Toggle } from '../toggle';
import { TableCell } from './TableCell';

/* A stand-in for a component that isn't built yet (Row Actions). Dashed and
   labelled, so nobody mistakes it for the real thing. */
function Pending({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span
      role="img"
      aria-label={`${label} (not built yet)`}
      className="inline-flex items-center rounded-full border border-dashed border-stroke-strong px-2 py-0.5 text-caption-md-medium text-text-secondary"
    >
      {children}
    </span>
  );
}

/* A real table around the cells: TableCell is a <td>. */
/* A header is a string, or { label, hidden } for a column whose header is
   only for screen readers (the checkbox and actions columns). */
type Head = string | { label: string; hidden: true };

function Table({ head, children }: { head: Head[]; children: ReactNode }) {
  return (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-stroke-subtle">
          {head.map((h) => {
            const label = typeof h === 'string' ? h : h.label;
            return (
              <th key={label} scope="col" className="px-4 py-2 text-left text-body-sm-regular text-text-secondary">
                {typeof h === 'string' ? h : <span className="sr-only">{label}</span>}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

const meta = {
  title: 'Components/TableCell',
  component: TableCell,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / Cell`, the generic body cell). It is a `<td>`. ' +
          '`type` is Figma’s Type: `text` (default), `two-line`, `tag`, `checkbox`, `actions`, `list`, `status-date` and ' +
          '`custom`. Value is `children`; Primary, Secondary and Date are `primary`, `secondary` and `date`. ' +
          'Tag, Checkbox, Actions and Status + Date take their component as `children`: Tag takes `StatusPill`, Status + Date ' +
          'takes `Tag`. Custom’s Content slot is `children`: any content or control at its own size (Account Details, a ' +
          'Toggle, the Expand Button, a Checkbox, an Empty State across the row). The grids show a labelled stand-in for ' +
          'the row actions button.',
      },
    },
  },
  args: { children: 'Cell value' },
} satisfies Meta<typeof TableCell>;

export default meta;
// Typed from the component, not the meta: its props are a union per Type.
type Story = StoryObj<typeof TableCell>;

/* A single cell still needs a table around it. Only for the one-cell stories:
   a story's decorators add to the meta's, they don't replace them. */
const inRow: Story['decorators'] = [
  (Story) => (
    <table>
      <tbody>
        <tr>
          <Story />
        </tr>
      </tbody>
    </table>
  ),
];

export const Text: Story = { decorators: inRow };

/** List (Collapsed) → List (Expanded) and back, with the toggle. */
export const List: Story = {
  decorators: inRow,
  args: { type: 'list', items: ['TESTING FEATURE', 'Reporting', 'Exports'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: '+2 more' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('list')).toBeNull();
    await userEvent.click(toggle);
    await expect(canvas.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await userEvent.click(canvas.getByRole('button', { name: 'Show less' }));
    await expect(canvas.getByRole('button', { name: '+2 more' })).toBeInTheDocument();
  },
};

/** A single item has nothing to expand, so there is no toggle. */
export const ListOfOne: Story = {
  decorators: inRow,
  args: { type: 'list', items: ['TESTING FEATURE'] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

/** Type=Checkbox with the real Checkbox: selecting a row. */
export const CheckboxCell: Story = {
  name: 'Checkbox',
  decorators: inRow,
  args: { type: 'checkbox', children: <Checkbox aria-label="Select row 123456" /> },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Select row 123456' });
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};

/* ── Every Type, in Light and Dark ─────────────────────────────────────────
   One row per Figma Type, with Figma's sample values and widths. */

const TYPES: { label: string; cell: ReactNode }[] = [
  { label: 'Text', cell: <TableCell className="w-50">Cell value</TableCell> },
  { label: 'Two Line', cell: <TableCell className="w-50" type="two-line" primary="Admin Account" secondary="admin1@geekee.com" /> },
  { label: 'Tag', cell: <TableCell className="w-50" type="tag"><StatusPill>Pending</StatusPill></TableCell> },
  { label: 'Checkbox', cell: <TableCell className="w-14" type="checkbox"><Checkbox aria-label="Select row" /></TableCell> },
  { label: 'Actions', cell: <TableCell className="w-14" type="actions"><Pending label="Row actions">•••</Pending></TableCell> },
  { label: 'List (Collapsed)', cell: <TableCell className="w-55" type="list" items={['TESTING FEATURE', 'Reporting']} /> },
  { label: 'List (Expanded)', cell: <TableCell className="w-55" type="list" items={['One', 'Two', 'Three']} defaultExpanded /> },
  {
    label: 'Status + Date',
    cell: <TableCell className="w-45" type="status-date" date="2026-10-08"><Tag status="completed">Completed</Tag></TableCell>,
  },
  {
    label: 'Custom',
    cell: <TableCell className="w-50" type="custom"><Toggle aria-label="Enable Albanian Lek" defaultChecked /></TableCell>,
  },
];

const types = (theme: 'light' | 'dark'): Story => ({
  name: `Types — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <Table head={['Type', 'Cell']}>
      {TYPES.map(({ label, cell }) => (
        <tr key={label} className="border-b border-stroke-subtle">
          <th scope="row" className="px-4 text-left text-caption-md-medium text-text-secondary">
            {label}
          </th>
          {cell}
        </tr>
      ))}
    </Table>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
});

export const TypesLight = types('light');
export const TypesDark = types('dark');

/** Figma's generic Table / Row: the cells in context. The row itself (fill, border, states) isn't built yet. */
export const InARow: Story = {
  name: 'In a row',
  render: () => (
    <Table head={[{ label: 'Select', hidden: true }, 'Cost ID', 'Account', 'Amount', 'Status', 'Method', { label: 'Actions', hidden: true }]}>
      <tr className="border-b border-stroke-subtle">
        <TableCell className="w-14" type="checkbox">
          <Checkbox aria-label="Select cost 123456" />
        </TableCell>
        <TableCell className="w-50">123456</TableCell>
        <TableCell className="w-50" type="two-line" primary="Admin Account" secondary="admin1@geekee.com" />
        <TableCell className="w-50">USD 5130553.37</TableCell>
        <TableCell className="w-50" type="tag">
          <StatusPill>Pending</StatusPill>
        </TableCell>
        <TableCell className="w-50">Wiretransfer</TableCell>
        <TableCell className="w-14" type="actions">
          <Pending label="Row actions">•••</Pending>
        </TableCell>
      </tr>
    </Table>
  ),
  parameters: { controls: { disable: true } },
};

/* ── Type=Custom, in Light and Dark ────────────────────────────────────────
   Figma's Content slot holds any content or control at its own size, with
   the other types' padding: 16 at the sides, 12 above and below, the
   content vertically centred and at the start. Figma's examples (772:1406):
   Account Details, a Toggle (Manage Currencies' Enabled), and the Expand
   Button and Checkbox; plus an Empty State across a row. */

const CUSTOM: { label: string; cell: ReactNode; content: string }[] = [
  {
    label: 'Account Details',
    content: '[data-content="account"]',
    cell: (
      <TableCell type="custom">
        <TableAccountDetails
          data-content="account"
          categoryTag={
            <Tag status="pending" showIcon={false}>
              Recurring
            </Tag>
          }
        >
          <TableDetailLabel label="ID:" value="32430" />
          <TableDetailLabel label="Applicant:" value="QA Test Bryan" />
          <TableDetailLabel label="Beneficiary name:" value="Geekee Ltd" />
        </TableAccountDetails>
      </TableCell>
    ),
  },
  {
    label: 'Toggle',
    content: 'input[role="switch"]',
    cell: (
      <TableCell className="w-50" type="custom">
        <Toggle aria-label="Enable Afghan Afghani" defaultChecked />
      </TableCell>
    ),
  },
  {
    label: 'Expand Button',
    content: 'button',
    cell: (
      <TableCell type="custom">
        <TableExpandButton label="Show details for cost 32430" />
      </TableCell>
    ),
  },
  {
    label: 'Checkbox',
    content: 'input[type="checkbox"]',
    cell: (
      <TableCell type="custom">
        <Checkbox aria-label="Select cost 32430" />
      </TableCell>
    ),
  },
  {
    label: 'Empty State',
    content: '[data-content="empty"]',
    cell: (
      <TableCell className="w-100" type="custom">
        <EmptyState data-content="empty" size="compact" title="No items." />
      </TableCell>
    ),
  },
];

const custom = (theme: 'light' | 'dark'): Story => ({
  name: `Custom — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <Table head={['Content', 'Cell']}>
      {CUSTOM.map(({ label, cell }) => (
        <tr key={label} className="border-b border-stroke-subtle" data-content-row={label}>
          <th scope="row" className="px-4 text-left text-caption-md-medium text-text-secondary">
            {label}
          </th>
          {cell}
        </tr>
      ))}
    </Table>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      for (const { label, content } of CUSTOM) {
        const td = canvasElement.querySelector<HTMLElement>(`[data-content-row="${label}"] td`)!;
        const style = getComputedStyle(td);
        // The other types' padding: space/16 at the sides, space/12 above and below.
        expect([style.paddingLeft, style.paddingRight, style.paddingTop, style.paddingBottom]).toEqual(['16px', '16px', '12px', '12px']);
        expect(style.verticalAlign).toBe('middle');
        expect(style.textAlign).toBe('left');
        // No fill of its own; the row draws that.
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        // The content sits at the start, 16 in, and keeps its own size: it isn't stretched to the cell.
        const slot = td.firstElementChild as HTMLElement;
        expect(getComputedStyle(slot).alignItems).toBe('flex-start');
        const el = (td.querySelector(content) as HTMLElement).closest('td > div > *') as HTMLElement;
        const box = el.getBoundingClientRect();
        const cell = td.getBoundingClientRect();
        expect(box.left - cell.left).toBe(16);
        expect(box.width).toBeLessThanOrEqual(cell.width - 32);
        // Vertically centred (the cell hugs its content, 12 above and below it).
        expect(Math.abs(box.top + box.height / 2 - (cell.top + cell.height / 2))).toBeLessThan(1);
      }
      // A Toggle keeps Figma's 36 × 20, and its cell is 44 tall, as Figma's Type=Custom.
      const toggleCell = canvasElement.querySelector<HTMLElement>('[data-content-row="Toggle"] td')!;
      const toggle = toggleCell.querySelector('input[role="switch"]')!.getBoundingClientRect();
      expect([toggle.width, toggle.height]).toEqual([36, 20]);
      expect(toggleCell.clientHeight).toBe(44);
    });
  },
});

export const CustomLight = custom('light');
export const CustomDark = custom('dark');
