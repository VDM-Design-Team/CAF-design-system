import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Checkbox } from '../checkbox';
import { ICON_PATHS } from '../icon/icons';
import { IconButton } from '../icon-button';
import { StatusPill } from '../status-pill';
import { TableCell } from '../table-cell';
import { TableDetailLabel } from '../table-detail-label';
import { TableExpandButton } from '../table-expand-button';
import { TableHeaderCell } from '../table-header-cell';
import { TableRow } from '../table-row';
import { Tag } from '../tag';
import { TableAccountDetails } from './TableAccountDetails';

/* Figma's sample lines. */
function Lines({ id = '32430' }: { id?: string }) {
  return (
    <>
      <TableDetailLabel>ID: {id}</TableDetailLabel>
      <TableDetailLabel>Applicant: QA Test Bryan</TableDetailLabel>
      <TableDetailLabel>Beneficiary name: Jane Doe</TableDetailLabel>
      <TableDetailLabel>IBAN Account: 982389428934</TableDetailLabel>
    </>
  );
}

const meta = {
  title: 'Components/TableAccountDetails',
  component: TableAccountDetails,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / Account Details`): the cost row’s Account column. ' +
          'The lines are `children`, one `TableDetailLabel` each. Figma’s Category Tag is `categoryTag`, 12px below them: ' +
          'Figma’s default is a `StatusPill` (“Recurring”), and a `Tag` fits too. Leave it out for no tag. ' +
          'In a table, put it in a `TableCell`, next to a `TableExpandButton`.',
      },
    },
  },
  args: { children: <Lines />, categoryTag: <StatusPill>Recurring</StatusPill> },
  argTypes: { children: { control: false }, categoryTag: { control: false } },
} satisfies Meta<typeof TableAccountDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's default: four lines and a “Recurring” Status Pill. */
export const Playground: Story = {};

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

/* The computed background of a utility class, for TableRow's 16% Selected tint. */
function utilityBackground(className: string) {
  const probe = document.createElement('div');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
}

/* ── Category Tag, in Light and Dark ───────────────────────────────────────
   Figma's default Status Pill, a Tag swapped in, and no tag. Checked against
   Figma's layout and bindings: lines stacked with no gap in text/primary,
   the tag 12px below them. */

const TAGS = [
  { name: 'Status Pill (Figma’s default)', tag: <StatusPill>Recurring</StatusPill> },
  { name: 'Tag', tag: <Tag status="info" showIcon={false}>Recurring</Tag> },
  { name: 'No tag', tag: undefined },
] as const;

const tags = (theme: 'light' | 'dark'): Story => ({
  name: `Category Tag — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-wrap items-start gap-10">
      {TAGS.map(({ name, tag }) => (
        <div key={name} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">{name}</span>
          <TableAccountDetails data-details categoryTag={tag}>
            <Lines />
          </TableAccountDetails>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const text = tokenColour('text-primary');
    await waitFor(() => {
      for (const details of canvasElement.querySelectorAll<HTMLElement>('[data-details]')) {
        const [lines, tag] = details.children as unknown as HTMLElement[];
        const rows = [...lines.querySelectorAll('p')];
        expect(rows).toHaveLength(4);
        rows.forEach((p, i) => {
          expect(getComputedStyle(p).color).toBe(text);
          // Figma's Details frame: gap 0.
          if (i > 0) expect(p.getBoundingClientRect().top).toBe(rows[i - 1].getBoundingClientRect().bottom);
        });
        // Figma: 12px between the lines and the Category Tag.
        if (tag) expect(tag.getBoundingClientRect().top - lines.getBoundingClientRect().bottom).toBe(12);
      }
    });
  },
});

export const CategoryTagLight = tags('light');
export const CategoryTagDark = tags('dark');

/* ── In a cost row ─────────────────────────────────────────────────────────
   The Account column of Figma's `Table / Row – Cost`, built from the generic
   parts: a TableRow whose first cells are the Expand Button and the
   Checkbox, then Account Details in a TableCell. Figma's breakdown panel
   comes with the cost row, which isn't built yet: a labelled stand-in shows
   where it goes. */

const HEAD = ['Account', 'Invoice #', 'Amount', 'Payment Method', 'Status', 'Date Submitted'];

function CostTable({ stateColumn = false, children }: { stateColumn?: boolean; children: ReactNode }) {
  return (
    <table className="w-max border-collapse">
      <thead>
        <tr className="border-b border-stroke-subtle">
          {stateColumn && <TableHeaderCell className="px-4">State</TableHeaderCell>}
          <TableHeaderCell className="px-4">
            <span className="sr-only">Details</span>
          </TableHeaderCell>
          <TableHeaderCell className="px-4">
            <span className="sr-only">Select</span>
          </TableHeaderCell>
          {HEAD.map((h) => (
            <TableHeaderCell key={h} className="px-4">
              {h}
            </TableHeaderCell>
          ))}
          <TableHeaderCell className="px-4">
            <span className="sr-only">Actions</span>
          </TableHeaderCell>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

/* One cost: the row, and the breakdown row its Expand Button controls. */
function CostRow({
  id,
  state,
  expanded,
  onExpand,
  selected = false,
  onSelect,
  pseudo,
}: {
  id: string;
  state?: string;
  expanded: boolean;
  onExpand?: () => void;
  selected?: boolean;
  onSelect?: () => void;
  pseudo?: 'hover';
}) {
  const breakdown = useId();
  const columns = HEAD.length + 3 + (state ? 1 : 0);
  return (
    <>
      <TableRow selected={selected} data-state={state} data-pseudo={pseudo}>
        {state && (
          <th scope="row" className="px-4 text-left text-caption-md-medium text-text-secondary">
            {state}
          </th>
        )}
        {/* Expand Button and Checkbox: centred both ways, as in Figma. */}
        <TableCell type="actions">
          <TableExpandButton
            label={`Show details for cost ${id}`}
            expanded={expanded}
            aria-controls={breakdown}
            onClick={onExpand}
          />
        </TableCell>
        <TableCell type="checkbox">
          <Checkbox aria-label={`Select cost ${id}`} checked={selected} onChange={onSelect ?? (() => {})} />
        </TableCell>
        {/* Account Details is a nested component, so it goes in a cell type that takes children. */}
        <TableCell type="tag" className="w-75">
          <TableAccountDetails categoryTag={<StatusPill>Recurring</StatusPill>}>
            <Lines id={id} />
          </TableAccountDetails>
        </TableCell>
        <TableCell className="w-47">{id}</TableCell>
        <TableCell className="w-47">USD 5130553.37</TableCell>
        <TableCell className="w-47">Wiretransfer</TableCell>
        <TableCell type="tag" className="w-47">
          <StatusPill>Pending</StatusPill>
        </TableCell>
        <TableCell className="w-47">July 16, 2026</TableCell>
        <TableCell type="actions">
          <IconButton icon="dots-three" label={`Row actions for cost ${id}`} />
        </TableCell>
      </TableRow>
      <tr id={breakdown} hidden={!expanded} data-breakdown={state}>
        <td colSpan={columns} className="px-4 pb-4">
          <div className="rounded-8 border border-dashed border-stroke-strong px-4 py-3 text-caption-md-medium text-text-secondary">
            Breakdown of cost {id} (comes with Table / Row – Cost, not built yet)
          </div>
        </td>
      </tr>
    </>
  );
}

const ROWS = [
  { state: 'Default', id: '32430', expanded: false, selected: false, pseudo: undefined },
  { state: 'Hover', id: '32431', expanded: false, selected: false, pseudo: 'hover' },
  { state: 'Selected', id: '32432', expanded: false, selected: true, pseudo: undefined },
  { state: 'Expanded', id: '32433', expanded: true, selected: false, pseudo: undefined },
] as const;

const inRow = (theme: 'light' | 'dark'): Story => ({
  name: `In a cost row — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <CostTable stateColumn>
      {ROWS.map(({ state, id, expanded, selected, pseudo }) => (
        <CostRow key={state} id={id} state={state} expanded={expanded} selected={selected} pseudo={pseudo} />
      ))}
    </CostTable>
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
    const want = {
      hover: tokenColour('surface-base'),
      selected: utilityBackground('bg-action-primary-surface-default/16'),
      text: tokenColour('text-primary'),
      fill: tokenColour('neutral-tonal-surface-default'),
    };
    await waitFor(
      () => {
        for (const { state, expanded } of ROWS) {
          const row = canvasElement.querySelector<HTMLElement>(`tr[data-state="${state}"]`)!;
          // TableRow's fills: none, surface.base on Hover, action.primary at 16% when Selected.
          const bg = getComputedStyle(row).backgroundColor;
          expect(bg).toBe(state === 'Hover' ? want.hover : state === 'Selected' ? want.selected : 'rgba(0, 0, 0, 0)');
          // Account Details' lines stay text/primary on every row.
          for (const p of row.querySelectorAll('p')) expect(getComputedStyle(p).color).toBe(want.text);
          // Expand Button: its fill and glyph, the caret for the state, and the breakdown it controls.
          const button = within(row).getByRole('button', { name: /^Show details/ });
          expect(getComputedStyle(button).backgroundColor).toBe(want.fill);
          expect(getComputedStyle(button.querySelector('svg')!).color).toBe(want.text);
          expect(button.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS[expanded ? 'caret-up' : 'caret-down']);
          expect(button).toHaveAttribute('aria-expanded', String(expanded));
          const breakdown = canvasElement.querySelector<HTMLElement>(`#${CSS.escape(button.getAttribute('aria-controls')!)}`)!;
          expect(breakdown.hidden).toBe(!expanded);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const InACostRowLight = inRow('light');
export const InACostRowDark = inRow('dark');

/* ── Expanding a row ───────────────────────────────────────────────────────
   The row owns the state: its Expand Button opens and closes the breakdown. */

function ExpandableTable() {
  const ids = ['32430', '32431'];
  const [open, setOpen] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return (
    <CostTable>
      {ids.map((id) => (
        <CostRow
          key={id}
          id={id}
          expanded={open.includes(id)}
          onExpand={() => setOpen((o) => toggle(o, id))}
          selected={selected.includes(id)}
          onSelect={() => setSelected((s) => toggle(s, id))}
        />
      ))}
    </CostTable>
  );
}

/** Click a row's caret, or press Enter or Space on it, to show its breakdown; the other rows stay closed. */
export const ExpandARow: Story = {
  render: () => <ExpandableTable />,
  parameters: { controls: { disable: true } },
  play: async ({ canvas, canvasElement }) => {
    const first = canvas.getByRole('button', { name: 'Show details for cost 32430' });
    const second = canvas.getByRole('button', { name: 'Show details for cost 32431' });
    const panel = (button: HTMLElement) =>
      canvasElement.querySelector<HTMLElement>(`#${CSS.escape(button.getAttribute('aria-controls')!)}`)!;

    await expect(panel(first)).not.toBeVisible();
    await userEvent.click(first);
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(panel(first)).toBeVisible();
    await expect(second).toHaveAttribute('aria-expanded', 'false');
    await expect(panel(second)).not.toBeVisible();

    // Keyboard: focus the second row's caret and open it with Enter, then close the first with Space.
    second.focus();
    await userEvent.keyboard('{Enter}');
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await expect(panel(second)).toBeVisible();
    first.focus();
    await userEvent.keyboard(' ');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(panel(first)).not.toBeVisible();
    await expect(panel(second)).toBeVisible();
  },
};
