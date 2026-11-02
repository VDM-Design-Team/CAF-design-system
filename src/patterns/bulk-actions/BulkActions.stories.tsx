import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useId, useRef, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../components/button';
import { MenuItem } from '../../components/menu-item';
import { MenuTriggerButton } from '../../components/menu-trigger-button';
import { Pagination } from '../../components/pagination';
import { TabItem } from '../../components/tab-item';
import { Tabs } from '../../components/tabs';
import { ToastProvider, useToast } from '../../components/toast';
import { auditLog, bulkStatusActions, costs, exportMenuItems, type Cost, type CostStatus } from '../fixtures';
import { CostsTable, sortCosts, type CostSort } from '../costs/CostsTable';
import { AuditLogsDialog } from '../expand-details/AuditLogs';
import { PageHeader } from '../page/PageHeader';

/* Costs a page, as the Admin Costs screen (2102:5749) shows them. */
const PAGE_SIZE = 8;
type CostTab = 'all' | 'recurring' | 'single';
const TABS: { value: CostTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'single', label: 'Single' },
];

/** Work to do once the next render is on screen (after the menu that ran it has gone). */
function useAfterRender() {
  const queue = useRef<(() => void)[]>([]);
  useEffect(() => {
    for (const job of queue.current.splice(0)) job();
  });
  return (job: () => void) => queue.current.push(job);
}

interface PageProps {
  /** Costs selected at first. */
  selected?: string[];
  /** The Change Status menu open at first (with `selected`). */
  menuOpen?: boolean;
}

function BulkCostsPage({ selected: initialSelected = [], menuOpen = false }: PageProps) {
  const { toast } = useToast();
  const later = useAfterRender();
  const ids = useId();
  const [rows, setRows] = useState<Cost[]>(costs);
  const [tab, setTab] = useState<CostTab>('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<CostSort | null>(null);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [audit, setAudit] = useState(false);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const filtered = rows.filter((c) => tab === 'all' || c.type === tab);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = sortCosts(filtered, sort).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* Pattern 07: changing the page or a filter clears the selection. */
  const showTab = (next: string) => {
    setTab(next as CostTab);
    setPage(1);
    setSelected([]);
  };
  const showPage = (next: number) => {
    setPage(next);
    setSelected([]);
  };

  /* Every selected row takes the status; the selection clears; a toast says how many changed. */
  const changeStatus = (status: CostStatus) => {
    const chosen = new Set(selected);
    const n = chosen.size;
    setRows((all) => all.map((c) => (chosen.has(c.id) ? { ...c, status } : c)));
    setSelected([]);
    later(() => {
      /* The Change Status button has gone with the selection: focus goes to the selection's own control. */
      tableRef.current?.querySelector<HTMLElement>('thead input[type="checkbox"]')?.focus();
      toast({ type: 'success', message: `Status updated for ${n} ${n === 1 ? 'cost' : 'costs'}.` });
    });
  };

  return (
    <main className="flex flex-col gap-6 pb-64">
      <PageHeader
        title="Costs"
        tabs={
          <Tabs aria-label="Cost type" selected={tab} onSelectedChange={showTab}>
            {TABS.map(({ value, label }) => (
              <TabItem key={value} value={value} id={`${ids}-tab-${value}`} aria-controls={`${ids}-panel`}>
                {label}
              </TabItem>
            ))}
          </Tabs>
        }
        actions={
          <>
            <Button variant="outlined" onClick={() => setAudit(true)}>
              View Audit Logs
            </Button>
            {/* Only while something is selected, with the count. */}
            {selected.length > 0 && (
              <MenuTriggerButton label={`Change Status (${selected.length})`} defaultOpen={menuOpen}>
                {bulkStatusActions.map(({ label, status }) => (
                  <MenuItem key={label} onClick={() => changeStatus(status)}>
                    {label}
                  </MenuItem>
                ))}
              </MenuTriggerButton>
            )}
            <MenuTriggerButton label="Export" align="right">
              {exportMenuItems.map((label) => (
                <MenuItem key={label} onClick={() => toast({ type: 'info', message: 'Export started. It will appear in Exports when it’s ready.' })}>
                  {label}
                </MenuItem>
              ))}
            </MenuTriggerButton>
          </>
        }
      />
      <div role="tabpanel" id={`${ids}-panel`} aria-labelledby={`${ids}-tab-${tab}`} className="flex flex-col gap-4">
        <CostsTable
          ref={tableRef}
          rows={shown}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          sort={sort}
          onSortChange={setSort}
        />
        <Pagination aria-label="Costs pages" page={page} pageCount={pageCount} onPageChange={showPage} />
      </div>
      <AuditLogsDialog open={audit} onClose={() => setAudit(false)} entries={auditLog} />
    </main>
  );
}

function BulkActions(props: PageProps) {
  return (
    <ToastProvider>
      <BulkCostsPage {...props} />
    </ToastProvider>
  );
}

const meta = {
  title: 'Patterns/Bulk selection & actions',
  component: BulkActions,
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          '**07 · Bulk selection & actions** (Patterns – Admin, 524:4713): admins select several costs and change their ' +
          'status in one go. Selection lives in the table (CostsTable: a Checkbox per row, the header’s selects or clears ' +
          'the page and shows Mixed); “Change Status (n)”, a MenuTriggerButton, appears in the page header only while ' +
          'something is selected. Choosing Reject, Approve or Mark as Paid updates every selected row, clears the ' +
          'selection and confirms the count in a Toast. Changing the page or the Cost type tab clears the selection too.',
      },
    },
  },
} satisfies Meta<typeof BulkActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Helpers for the plays ─────────────────────────────────────────────────── */
const costsTable = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Costs' }) as HTMLTableElement;
const rowIds = (table: HTMLTableElement) =>
  Array.from(table.tBodies[0].rows)
    .map((r) => r.dataset.id)
    .filter(Boolean) as string[];
const rowOf = (table: HTMLTableElement, id: string) => table.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`)!;
const changeStatus = (canvasElement: HTMLElement) => within(canvasElement).queryByRole('button', { name: /^Change Status/ });
async function expectToast(canvasElement: HTMLElement, message: string) {
  const stack = screen.getByRole('region', { name: 'Notifications' });
  await within(stack).findByText(message);
  // Dismissed, so the snapshot ends without a timed toast in it.
  await userEvent.click(within(stack).getAllByRole('button', { name: 'Dismiss' })[0]);
  await waitFor(() => expect(within(stack).queryByText(message)).toBeNull());
}

/** Steps 1–3: tick rows, choose the new status from Change Status (n), and the rows update. */
export const SelectAndChangeStatus: Story = {
  name: 'Select and change status',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = costsTable(canvasElement);
    const all = canvas.getByRole('checkbox', { name: 'Select all costs' });
    await expect(changeStatus(canvasElement)).toBeNull();

    // Step 1: two rows ticked → highlighted, the header Mixed, "Change Status (2)" in the page header.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select cost 32430' }));
    await expect(canvas.getByRole('button', { name: 'Change Status (1)' })).toBeVisible();
    canvas.getByRole('checkbox', { name: 'Select cost 32431' }).focus();
    await userEvent.keyboard(' ');
    await expect(rowOf(table, '32430')).toHaveAttribute('data-selected');
    await expect(rowOf(table, '32431')).toHaveAttribute('data-selected');
    await waitFor(() => expect(all).toBePartiallyChecked());
    const button = canvas.getByRole('button', { name: 'Change Status (2)' });
    // It sits between View Audit Logs and Export.
    const following = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    await expect(following(canvas.getByRole('button', { name: 'View Audit Logs' }), button)).toBe(true);
    await expect(following(button, canvas.getByRole('button', { name: 'Export' }))).toBe(true);

    // Step 2: the menu under the button lists the statuses (keyboard: ↓ opens it on the first).
    button.focus();
    await userEvent.keyboard('{ArrowDown}');
    const menu = canvas.getByRole('menu', { name: 'Change Status (2)' });
    await expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(bulkStatusActions.map((a) => a.label));
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Reject' })).toHaveFocus());
    await expect(menu.getBoundingClientRect().top).toBeGreaterThanOrEqual(button.getBoundingClientRect().bottom);

    // Step 3: Approve → both rows Approved, the selection cleared, the button gone, a toast with the count.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(within(rowOf(table, '32430')).getByText('Approved')).toBeVisible();
    await expect(within(rowOf(table, '32431')).getByText('Approved')).toBeVisible();
    await expect(within(rowOf(table, '32436')).getByText('Pending')).toBeVisible();
    await expect(rowOf(table, '32430')).not.toHaveAttribute('data-selected');
    await waitFor(() => expect(all).not.toBePartiallyChecked());
    await expect(all).not.toBeChecked();
    await expect(changeStatus(canvasElement)).toBeNull();
    // The button went with the selection: focus lands on the header checkbox, not the page's top.
    await waitFor(() => expect(all).toHaveFocus());
    await expectToast(canvasElement, 'Status updated for 2 costs.');

    // One row, Mark as Paid: the count is singular. Paid takes the Active pill (Figma has no Paid pill).
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select cost 32436' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Change Status (1)' }));
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Mark as Paid' }));
    await expect(within(rowOf(table, '32436')).getByText('Paid')).toBeVisible();
    await expectToast(canvasElement, 'Status updated for 1 cost.');
  },
};

/** The header checkbox selects every row on the page; changing the page or the tab clears the selection. */
export const SelectAllAndClear: Story = {
  name: 'Select all, then change page or tab',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = costsTable(canvasElement);
    const all = canvas.getByRole('checkbox', { name: 'Select all costs' });

    await userEvent.click(all);
    await waitFor(() => expect(all).toBeChecked());
    await expect(canvas.getByRole('button', { name: `Change Status (${PAGE_SIZE})` })).toBeVisible();
    for (const id of rowIds(table)) await expect(rowOf(table, id)).toHaveAttribute('data-selected');

    // The next page: other rows, nothing selected, no Change Status.
    const first = rowIds(table);
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(rowIds(table)).not.toEqual(first);
    await waitFor(() => expect(all).not.toBeChecked());
    await expect(changeStatus(canvasElement)).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Page 1' }));
    for (const id of rowIds(table)) await expect(rowOf(table, id)).not.toHaveAttribute('data-selected');

    // A tab is a filter: Recurring shows recurring costs only, and clears the selection.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select cost 32430' }));
    await expect(canvas.getByRole('button', { name: 'Change Status (1)' })).toBeVisible();
    await userEvent.click(canvas.getByRole('tab', { name: 'Recurring' }));
    await expect(canvas.getByRole('tabpanel', { name: 'Recurring' })).toContainElement(table);
    await expect(changeStatus(canvasElement)).toBeNull();
    for (const id of rowIds(table)) await expect(within(rowOf(table, id)).getByText('Recurring')).toBeVisible();
    await expect(rowIds(table)).toContain('32430');
    await expect(rowOf(table, '32430')).not.toHaveAttribute('data-selected');
  },
};

/** Step 2 as Figma draws it: two rows selected, the Change Status menu open. */
export const ChangeStatusOpen: Story = {
  name: 'Change status menu open',
  args: { selected: ['32430', '32411'], menuOpen: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('menu', { name: 'Change Status (2)' })).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('checkbox', { name: 'Select all costs' })).toBePartiallyChecked());
  },
};

/** The page's other actions still work while rows are selected: Export confirms with an Info toast. */
export const ExportWhileSelected: Story = {
  name: 'Export while selected',
  args: { selected: ['32430'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
    await expect(canvas.getByRole('menu', { name: 'Export' }).textContent).toBe(exportMenuItems.join(''));
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Export Costs' }));
    await expect(canvas.getByRole('button', { name: 'Export' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Change Status (1)' })).toBeVisible();
    await expectToast(canvasElement, 'Export started. It will appear in Exports when it’s ready.');

    // View Audit Logs opens pattern 08's dialog; Escape brings focus back.
    const audit = canvas.getByRole('button', { name: 'View Audit Logs' });
    await userEvent.click(audit);
    await screen.findByRole('dialog', { name: 'Audit Logs' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(audit).toHaveFocus();
  },
};

/** Dark: two rows selected, the Change Status menu open. */
export const Dark: Story = {
  args: { selected: ['32430', '32411'], menuOpen: true },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('menu', { name: 'Change Status (2)' })).toBeVisible();
  },
};
