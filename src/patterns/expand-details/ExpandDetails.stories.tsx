import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../components/button';
import { auditLog, costs } from '../fixtures';
import { CostsTable } from '../costs/CostsTable';
import { PageHeader } from '../../components/page-header';
import { AuditLogsDialog } from './AuditLogs';

/* Pattern 08's costs: the library's 32430 (its six-line breakdown) and the rows around it. */
const ROWS = costs.slice(0, 4);

interface PageProps {
  /** Costs expanded at first. */
  expanded?: string[];
  /** The Audit Logs dialog open at first. */
  auditOpen?: boolean;
  /** Audit log entries whose changes show at first. */
  auditOpenIds?: string[];
  /** The Audit Logs header's Refresh. */
  onRefresh?: () => void;
}

function CostsWithHistory({ expanded: initialExpanded = [], auditOpen = false, auditOpenIds, onRefresh }: PageProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [audit, setAudit] = useState(auditOpen);
  return (
    <main className="flex flex-col gap-6 pb-64">
      <PageHeader
        title="Costs"
        actions={
          <Button variant="outlined" onClick={() => setAudit(true)}>
            View Audit Logs
          </Button>
        }
      />
      <CostsTable rows={ROWS} expandable expandedIds={expanded} onExpandedChange={setExpanded} />
      <AuditLogsDialog
        open={audit}
        onClose={() => setAudit(false)}
        entries={auditLog}
        defaultOpenIds={auditOpenIds}
        onRefresh={onRefresh}
      />
    </main>
  );
}

const meta = {
  title: 'Patterns/Expand for details & change history',
  component: CostsWithHistory,
  parameters: {
    controls: { disable: true },
    docs: {
      story: { inline: false, height: '45rem' },
      description: {
        component:
          '**08 · Expand for details & change history** (Patterns – Admin, 526:5189): rows show a summary ' +
          '(TableAccountDetails) and open in place to reveal more, so the user keeps their place. The caret ' +
          '(TableExpandButton) opens a cost’s breakdown under its row; several rows can be open. View Audit Logs opens ' +
          'the log in a large ModalDialog, with Refresh beside × (Show Actions): “View Changes” opens a Field / ' +
          'Before / After ChangeDiff under the entry and reads “Hide Changes”; a deleted record shows a compact Error ' +
          'Alert instead. Built from CostsTable and the ' +
          'AuditLogTable composition (`src/patterns/expand-details/AuditLogs.tsx`).',
      },
    },
  },
} satisfies Meta<typeof CostsWithHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A record's reference as the screens print it ("#1882"), built so no literal reads as a hex colour to the lint. */
const ref = (id: string) => `#${id}`;

const costsTable = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Costs' }) as HTMLTableElement;
const rowOf = (table: HTMLTableElement, id: string) => table.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`)!;

/** Steps 1–2: rows start collapsed; the caret opens the breakdown under the row and pushes the rows below down. */
export const ExpandForDetails: Story = {
  name: 'Expand for details',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = costsTable(canvasElement);

    // Step 1: each cost shows its account summary; nothing is open.
    const summary = rowOf(table, '32430');
    // Each Detail Label is a Label and a Value; the line reads as one.
    const lines = [...summary.querySelectorAll('p')].map((p) => p.textContent);
    for (const line of ['ID: 32430', 'Applicant: QA Test Bryan', 'Beneficiary name: Jane Doe', 'IBAN Account: 982389428934']) {
      await expect(lines).toContain(line);
      await expect(within(summary).getByText(line.slice(line.indexOf(': ') + 2))).toBeVisible();
    }
    await expect(within(summary).getByText('Recurring')).toBeVisible();
    for (const button of canvas.getAllByRole('button', { name: /^Show details for cost/ })) {
      await expect(button).toHaveAttribute('aria-expanded', 'false');
    }

    // Step 2: the caret opens the breakdown under the row; the next row moves down below it.
    const caret = canvas.getByRole('button', { name: 'Show details for cost 32430' });
    const nextTop = rowOf(table, '32411').getBoundingClientRect().top;
    await userEvent.click(caret);
    await expect(caret).toHaveAttribute('aria-expanded', 'true');
    const breakdown = canvas.getByRole('table', { name: 'Breakdown of cost 32430' });
    const details = breakdown.closest('tr')!;
    await expect(details.previousElementSibling).toBe(rowOf(table, '32430'));
    await expect(within(breakdown).getAllByRole('row')).toHaveLength(7);
    await expect(within(breakdown).getByText('Discovery workshop and requirements mapping')).toBeVisible();
    await expect(within(breakdown).getByText('EUR 1200')).toBeVisible();
    await expect(rowOf(table, '32411').getBoundingClientRect().top).toBeGreaterThanOrEqual(details.getBoundingClientRect().bottom);
    await expect(rowOf(table, '32411').getBoundingClientRect().top).toBeGreaterThan(nextTop);

    // Several rows can be open at once.
    await userEvent.click(canvas.getByRole('button', { name: 'Show details for cost 32431' }));
    await expect(canvas.getByRole('table', { name: 'Breakdown of cost 32431' })).toBeVisible();
    await expect(breakdown).toBeVisible();

    // From the keyboard, Enter closes it again; focus stays on the caret.
    caret.focus();
    await userEvent.keyboard('{Enter}');
    await expect(caret).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('table', { name: 'Breakdown of cost 32430' })).not.toBeInTheDocument();
    await expect(caret).toHaveFocus();
    await expect(canvas.getByRole('table', { name: 'Breakdown of cost 32431' })).toBeVisible();
  },
};

/** Step 3: View Audit Logs → View Changes opens a Before/After table, or an Alert for a deleted record. */
export const AuditLogsViewChanges: Story = {
  name: 'Audit logs: view changes',
  args: { onRefresh: fn() },
  // The dialog it opens makes the docs page inert.
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole('button', { name: 'View Audit Logs' });
    await userEvent.click(opener);
    const dialog = await screen.findByRole('dialog', { name: 'Audit Logs' });

    // The header's actions (Show Actions): Refresh, then ×, 4px apart. Refresh asks for the entries again.
    const actions = dialog.querySelector<HTMLElement>('[data-part="header-actions"]')!;
    const [refresh, close] = within(actions).getAllByRole('button');
    await expect(refresh).toHaveAccessibleName('Refresh');
    await expect(close).toHaveAccessibleName('Close');
    await expect(close.getBoundingClientRect().left - refresh.getBoundingClientRect().right).toBe(4);
    await userEvent.click(refresh);
    await expect(args.onRefresh).toHaveBeenCalledOnce();
    const log = within(dialog).getByRole('table', { name: 'Audit log' });
    const headers = within(log).getAllByRole('columnheader').map((th) => th.textContent);
    await expect(headers).toEqual(['Cost ID', 'User', 'Timestamp', 'Activity', 'Actions']);
    await expect(within(log).getByText(ref('32430'))).toBeVisible();
    await expect(within(log).getByText('2026-10-08 09:42')).toBeVisible();

    // View Changes: a Field / Before / After table under the entry, and the button reads Hide Changes.
    const view = within(log).getByRole('button', { name: `View Changes for ${ref('32430')}, Updated, 2026-10-08 09:42` });
    await userEvent.click(view);
    await expect(view).toHaveAttribute('aria-expanded', 'true');
    await expect(view).toHaveTextContent('Hide Changes');
    await expect(view).toHaveAccessibleName(`Hide Changes for ${ref('32430')}, Updated, 2026-10-08 09:42`);
    const diff = within(dialog).getByRole('table', { name: `Changes to cost ${ref('32430')}` });
    await expect(view).toHaveAttribute('aria-controls', diff.closest('tr[data-details-for]')!.id);
    await expect(within(diff).getByRole('rowheader', { name: 'Status' })).toBeVisible();
    await expect(diff.querySelector('del')).toHaveTextContent('Unknown');
    await expect(diff.querySelector('ins')).toHaveTextContent('Pending');

    // A deleted record has nothing to compare: a compact Error Alert.
    await userEvent.click(within(log).getByRole('button', { name: new RegExp(`^View Changes for ${ref('32418')}`) }));
    await expect(within(dialog).getByRole('alert')).toHaveTextContent('This cost was deleted');

    // Hide Changes from the keyboard closes it again.
    view.focus();
    await userEvent.keyboard('{Enter}');
    await expect(view).toHaveAttribute('aria-expanded', 'false');
    await expect(view).toHaveTextContent('View Changes');
    await expect(within(dialog).queryByRole('table', { name: `Changes to cost ${ref('32430')}` })).toBeNull();

    // Pagination pages through the log, four entries a page.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next page' }));
    await expect(within(log).getByText(ref('37027'))).toBeVisible();
    await expect(within(log).queryByText(ref('32430'))).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Page 1' }));
    // The deleted record's entry is still open when you come back.
    await expect(within(dialog).getByRole('alert')).toHaveTextContent('This cost was deleted');

    // Escape closes the dialog; focus goes back to View Audit Logs.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();
  },
};

/** Step 3 as Figma draws it: the dialog open, the first two entries showing their changes. */
export const AuditLogsOpen: Story = {
  name: 'Audit logs open',
  args: { auditOpen: true, auditOpenIds: ['log-12', 'log-11'] },
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Audit Logs' });
    await expect(within(dialog).getByRole('table', { name: `Changes to cost ${ref('32430')}` })).toBeVisible();
    await expect(within(dialog).getByRole('alert')).toHaveTextContent('This cost was deleted');
  },
};

/** Dark: a cost expanded (Figma pins Table / Row – Cost to Dark). */
export const Dark: Story = {
  args: { expanded: ['32430'] },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('table', { name: 'Breakdown of cost 32430' })).toBeVisible();
  },
};

/** Dark: the audit log with its changes showing. */
export const AuditLogsDark: Story = {
  name: 'Audit logs — Dark',
  args: { auditOpen: true, auditOpenIds: ['log-12', 'log-11'] },
  globals: { theme: 'dark' },
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Audit Logs' });
    await expect(within(dialog).getByRole('table', { name: `Changes to cost ${ref('32430')}` })).toBeVisible();
  },
};
