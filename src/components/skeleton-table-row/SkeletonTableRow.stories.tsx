import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';
import { TableCell } from '../table-cell';
import { TableHeaderCell } from '../table-header-cell';
import { TableRow } from '../table-row';
import { SkeletonTableRow } from './SkeletonTableRow';

/* Stories stay still: the skeletons' pulse would make every snapshot differ. */
const still: Decorator = (Story) => <div className="[&_*]:animate-none!">{Story()}</div>;

/* A real table: a caption, Figma's header cells, and rows. `busy` marks it loading. */
function Table({
  caption,
  head,
  busy = false,
  children,
}: {
  caption: string;
  head: string[];
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <table aria-busy={busy || undefined} className="w-max border-collapse">
      <caption className="pb-2 text-left text-caption-md-medium text-text-secondary">{caption}</caption>
      <thead>
        <tr className="border-b border-stroke-subtle">
          {head.map((h) => (
            <TableHeaderCell key={h} className="w-80 px-4">
              {h}
            </TableHeaderCell>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

const USERS = ['Name', 'Role', 'Date Created'];

const meta = {
  title: 'Components/SkeletonTableRow',
  component: SkeletonTableRow,
  decorators: [still],
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Feedback** (`Skeleton / Table Row`): the loading state of a table ' +
          'row. Stack several in the `<tbody>` of the real table while its data loads. It is a TableRow of TableCells, ' +
          'one Skeleton line per column: `columns` is the table’s column count (default 5, as in Figma). The lines ' +
          'keep Figma’s widths as proportions of each column, and the row is as tall as a loaded row, so nothing jumps. ' +
          'The row is hidden from screen readers; mark the table `aria-busy` while it loads.',
      },
    },
  },
  args: { columns: 5 },
  render: (args) => (
    <Table caption="Costs (loading)" head={['Cost ID', 'Account', 'Amount', 'Status', 'Method']} busy>
      <SkeletonTableRow {...args} />
      <SkeletonTableRow {...args} />
      <SkeletonTableRow {...args} />
    </Table>
  ),
} satisfies Meta<typeof SkeletonTableRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's row: five columns, under the Costs table's header. */
export const Playground: Story = {};

/* ── In a real table, in Light and Dark ────────────────────────────────────
   Figma's pattern 11, "Loading a list": the Users table with five skeleton
   rows, next to the same table loaded. One skeleton row and one loaded row
   have Hover forced: the loaded row takes TableRow's hover fill, which proves
   the forced state is on, and the skeleton row stays clear (Figma's skeleton
   row has no Hover). Each part is checked against the variable it is bound
   to, and the rows against a loaded row's height. */

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

/* Figma's line widths (160 / 120 / 140 / 100 / 120) as fractions of the column. */
const FRACTIONS = [1, 3 / 4, 7 / 8, 5 / 8, 3 / 4];

const inATable = (theme: 'light' | 'dark'): Story => ({
  name: `In a table — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-8">
      <Table caption="Users (loading)" head={USERS} busy>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonTableRow key={i} columns={USERS.length} data-pseudo={i === 1 ? 'hover' : undefined} />
        ))}
      </Table>
      <Table caption="Users" head={USERS}>
        <TableRow data-loaded>
          <TableCell>Admin Account</TableCell>
          <TableCell>Admin</TableCell>
          <TableCell>2026-10-08</TableCell>
        </TableRow>
        <TableRow data-pseudo="hover" data-hovered>
          <TableCell>QA Test Bryan</TableCell>
          <TableCell>User</TableCell>
          <TableCell>2026-10-21</TableCell>
        </TableRow>
      </Table>
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLTableRowElement>('table[aria-busy] tbody tr')];
    const loaded = canvasElement.querySelector<HTMLTableRowElement>('tr[data-loaded]')!;
    const hoveredLoaded = canvasElement.querySelector<HTMLTableRowElement>('tr[data-hovered]')!;
    const want = {
      fill: tokenColour('neutral-tonal-surface-default'),
      stroke: tokenColour('stroke-subtle'),
      hover: tokenColour('surface-base'),
    };
    await waitFor(
      () => {
        // The forced Hover is on: the loaded row shows TableRow's hover fill (surface.base).
        expect(getComputedStyle(hoveredLoaded).backgroundColor).toBe(want.hover);
        expect(rows[1]).toHaveClass('pseudo-hover');
        expect(rows).toHaveLength(5);
        for (const row of rows) {
          // Hidden from assistive tech; one cell per column.
          expect(row).toHaveAttribute('aria-hidden', 'true');
          expect(row.cells).toHaveLength(USERS.length);
          // No fill, at rest or hovered (rows[1] has Hover forced); the bottom stroke is stroke.subtle.
          const style = getComputedStyle(row);
          expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
          expect(style.borderBottomColor).toBe(want.stroke);
          // As tall as a loaded row of text.
          expect(row.getBoundingClientRect().height).toBe(loaded.getBoundingClientRect().height);
          // Each line: neutral.tonal.surface.default, 12px high, Figma's width as a share of its column.
          [...row.cells].forEach((cell, i) => {
            const line = cell.querySelector<HTMLElement>('[aria-hidden]')!;
            const content = cell.clientWidth - 32; // the cell's 16px sides
            expect(getComputedStyle(line).backgroundColor).toBe(want.fill);
            expect(getComputedStyle(line).animationName).toBe('none');
            expect(line.getBoundingClientRect().height).toBe(12);
            expect(line.getBoundingClientRect().width).toBeCloseTo(content * FRACTIONS[i], 0);
          });
        }
      },
      { timeout: 3000 },
    );
  },
});

export const InATableLight = inATable('light');
export const InATableDark = inATable('dark');

/** More columns than Figma's five: the widths repeat from the first. */
export const EightColumns: Story = {
  args: { columns: 8 },
  render: (args) => (
    <Table caption="Audit logs (loading)" head={['Date', 'User', 'Action', 'Entity', 'ID', 'Field', 'Old', 'New']} busy>
      <SkeletonTableRow {...args} />
      <SkeletonTableRow {...args} />
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tbody tr') as HTMLTableRowElement;
    await expect(row.cells).toHaveLength(8);
  },
};
