import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Checkbox } from '../checkbox';
import { StatusPill } from '../status-pill';
import { TableCell } from '../table-cell';
import { TableHeaderCell } from '../table-header-cell';
import { TableRow } from './TableRow';

/* The row actions button isn't built yet: a dashed, labelled stand-in, as in TableCell's stories. */
function ActionsStandIn() {
  return (
    <span
      role="img"
      aria-label="Row actions (not built yet)"
      className="inline-flex items-center rounded-full border border-dashed border-stroke-strong px-2 py-0.5 text-caption-md-medium text-text-secondary"
    >
      •••
    </span>
  );
}

/* Figma's header, over TableRows. An extra first column names the state in the grids. */
function Table({ stateColumn = false, children }: { stateColumn?: boolean; children: ReactNode }) {
  const head = ['Cost ID', 'Account', 'Amount', 'Status', 'Method'];
  return (
    <table className="w-max border-collapse">
      <thead>
        <tr className="border-b border-stroke-subtle">
          {stateColumn && <TableHeaderCell className="px-4">State</TableHeaderCell>}
          <TableHeaderCell className="px-4">
            <span className="sr-only">Select</span>
          </TableHeaderCell>
          {head.map((h) => (
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

/* Figma's sample row: Checkbox, Text, Two Line, Text, Tag, Text, Actions, at Figma's widths. */
function SampleCells({ id, selected = false, onSelect }: { id: string; selected?: boolean; onSelect?: () => void }) {
  return (
    <>
      <TableCell className="w-14" type="checkbox">
        <Checkbox aria-label={`Select cost ${id}`} checked={selected} onChange={onSelect ?? (() => {})} />
      </TableCell>
      <TableCell className="w-50">{id}</TableCell>
      <TableCell className="w-50" type="two-line" primary="Admin Account" secondary="admin1@geekee.com" />
      <TableCell className="w-50">USD 5130.37</TableCell>
      <TableCell className="w-50" type="tag">
        <StatusPill>Pending</StatusPill>
      </TableCell>
      <TableCell className="w-50">Wiretransfer</TableCell>
      <TableCell className="w-14" type="actions">
        <ActionsStandIn />
      </TableCell>
    </>
  );
}

const meta = {
  title: 'Components/TableRow',
  component: TableRow,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / Row`, the generic body row). It is a `<tr>` of TableCells. ' +
          'Figma’s State: Default; Hover is `:hover`; Selected is `selected`. Put a checked `Checkbox` in the row too: ' +
          'it is what tells assistive tech the row is selected. On a selected row, cells darken their secondary text ' +
          '(`text/secondary`) and links (`text/link/selected`), so they pass AA on its tint.',
      },
    },
  },
} satisfies Meta<typeof TableRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Every State, in Light and Dark ────────────────────────────────────────
   Figma's three states on its sample row, plus a selected row with every
   secondary text and link a cell can show. Hover is forced with
   storybook-addon-pseudo-states. Axe checks every text pair on the tint. */

const STATES = [
  { state: 'Default', selected: false, pseudo: undefined },
  { state: 'Hover', selected: false, pseudo: 'hover' },
  { state: 'Selected', selected: true, pseudo: undefined },
] as const;

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

const states = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <Table stateColumn>
      {STATES.map(({ state, selected, pseudo }) => (
        <TableRow key={state} selected={selected} data-pseudo={pseudo} data-state={state}>
          <th scope="row" className="px-4 text-left text-caption-md-medium text-text-secondary">
            {state}
          </th>
          <SampleCells id={state === 'Default' ? '123456' : state === 'Hover' ? '123457' : '123458'} selected={selected} />
        </TableRow>
      ))}
      <TableRow selected data-state="Selected, every text">
        <th scope="row" className="px-4 text-left text-caption-md-medium text-text-secondary">
          Selected
        </th>
        <TableCell className="w-14" type="checkbox">
          <Checkbox aria-label="Select cost 123459" checked onChange={() => {}} />
        </TableCell>
        <TableCell className="w-50">123459</TableCell>
        <TableCell className="w-50" type="two-line" primary="QA Test Bryan" secondary="kynatest6@gmail.com" />
        <TableCell className="w-50" type="list" items={['TESTING FEATURE', 'Reporting']} />
        <TableCell className="w-50" type="status-date" date="2026-10-08">
          <StatusPill status="active">Active</StatusPill>
        </TableCell>
        <TableCell className="w-50">Card</TableCell>
        <TableCell className="w-14" type="actions">
          <ActionsStandIn />
        </TableCell>
      </TableRow>
    </Table>
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
    const row = (state: string) => canvasElement.querySelector<HTMLElement>(`tr[data-state="${state}"]`)!;
    const bg = (state: string) => getComputedStyle(row(state)).backgroundColor;
    const colour = (el: Element | null) => getComputedStyle(el!).color;
    const want = {
      hover: tokenColour('surface-base'),
      selected: utilityBackground('bg-action-primary-surface-default/16'),
      subtle: tokenColour('text-subtle'),
      secondary: tokenColour('text-secondary'),
      linkSelected: tokenColour('text-link-selected'),
    };
    await waitFor(
      () => {
        // Fills: none, surface.base, action.primary at 16%.
        expect(bg('Default')).toBe('rgba(0, 0, 0, 0)');
        expect(bg('Hover')).toBe(want.hover);
        expect(bg('Selected')).toBe(want.selected);
        // Secondary text: text.subtle, or text.secondary on a selected row.
        const secondary = (state: string) => row(state).querySelector('td:nth-of-type(3) span:last-child');
        expect(colour(secondary('Default'))).toBe(want.subtle);
        expect(colour(secondary('Selected'))).toBe(want.secondary);
        // On the selected row with every text: the date and the "+N more" link.
        const every = row('Selected, every text');
        expect(colour(every.querySelector('td:nth-of-type(5) span:last-child'))).toBe(want.secondary);
        expect(colour(every.querySelector('button'))).toBe(want.linkSelected);
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = states('light');
export const StatesDark = states('dark');

/* ── Selectable rows ───────────────────────────────────────────────────────
   The row's checkbox selects it, as on the CAF screens. */

function SelectableTable() {
  const ids = ['123456', '123457', '123458'];
  const [selected, setSelected] = useState<string[]>(['123457']);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <Table>
      {ids.map((id) => (
        <TableRow key={id} selected={selected.includes(id)}>
          <SampleCells id={id} selected={selected.includes(id)} onSelect={() => toggle(id)} />
        </TableRow>
      ))}
    </Table>
  );
}

/** Tick a row's checkbox to select it; the row and its secondary text change with it. */
export const Selectable: Story = {
  render: () => <SelectableTable />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('checkbox', { name: 'Select cost 123456' });
    const row = box.closest('tr')!;
    await expect(row).not.toHaveAttribute('data-selected');
    await userEvent.click(box);
    await expect(row).toHaveAttribute('data-selected');
    await expect(box).toBeChecked();
    await userEvent.click(box);
    await expect(row).not.toHaveAttribute('data-selected');
  },
};
