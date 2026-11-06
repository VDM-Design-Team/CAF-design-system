import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useId, useRef, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { AppHeader, APP_HEADER_USER_PAGES } from '../../components/app-header';
import { Button } from '../../components/button';
import { EmptyState } from '../../components/empty-state';
import { FilterField } from '../../components/filter-field';
import { FilterSelect } from '../../components/filter-select';
import { Icon } from '../../components/icon';
import { MenuItem } from '../../components/menu-item';
import { ModalConfirm } from '../../components/modal-confirm';
import { PaymentRow } from '../../components/payment-row';
import { PaymentSchedules } from '../../components/payment-schedules';
import { SideSheet } from '../../components/side-sheet';
import type { ThemeToggleTheme } from '../../components/theme-toggle';
import { ToastProvider, useToast } from '../../components/toast';
import {
  formatDate,
  formatPaymentAmount,
  formatShortDate,
  recurringCosts,
  rowActionLabels,
  type RecurringCost,
} from '../fixtures';
import { PageHeader } from '../../components/page-header';
import { FILTER_SLOT, FilterBar } from '../filters/CostsFilterBar';
import { EditRecurringCostForm, type RecurringCostUpdate } from './EditRecurringCostForm';
import { RecurringCostsTable, sortRecurringCosts, type RecurringSort } from './RecurringCostsTable';

/* The User Recurring Costs screen (U04, 545:18695): the signed-in user's six schedules. */
const USER_ROWS = recurringCosts.slice(0, 6);
const USER_LINKS = APP_HEADER_USER_PAGES.map((label) => ({ label, href: `#${label.toLowerCase().replace(/ /g, '-')}` }));
/* Starts At's calendar: Today pinned, so snapshots don't move. */
const TODAY = new Date(2026, 10, 2);

type StatusFilter = 'all' | RecurringCost['status'];
const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'stopped'];
const STATUS_FILTER_LABEL: Record<StatusFilter, string> = { all: 'All Status', active: 'Active', stopped: 'Stopped' };

type Confirm = { kind: 'stop' | 'delete'; id: string };

/* Pattern 04's rules: the title asks, the message names the record and the consequence, the button repeats the verb. */
const CONFIRM_COPY = {
  stop: (id: string) => ({
    title: 'Stop recurring cost?',
    message: `Recurring cost #${id} will stop. Upcoming payments are cancelled; processed ones stay.`,
    confirmLabel: 'Stop',
    toast: `Recurring cost #${id} stopped.`,
  }),
  delete: (id: string) => ({
    title: 'Delete recurring cost?',
    message: `Recurring cost #${id} and its schedule will be permanently deleted. This can’t be undone.`,
    confirmLabel: 'Delete',
    toast: `Recurring cost #${id} deleted.`,
  }),
};

/** Work to do once the next render is on screen: after an overlay has closed and given the page back. */
function useAfterRender() {
  const queue = useRef<(() => void)[]>([]);
  useEffect(() => {
    for (const job of queue.current.splice(0)) job();
  });
  return (job: () => void) => queue.current.push(job);
}

interface PageProps {
  /** The theme the header's toggle shows. */
  theme?: ThemeToggleTheme;
  /** Open Payment Schedules for this recurring cost at first. */
  schedulesFor?: string;
  /** Open the edit side sheet for this recurring cost at first. */
  editing?: string;
  /** Called with the edit form's values when Update saves them. */
  onUpdate?: (id: string, values: RecurringCostUpdate) => void;
}

function ManageRecurringCostsPage({ theme: initialTheme = 'light', schedulesFor: initialSchedules, editing: initialEditing, onUpdate }: PageProps) {
  const { toast } = useToast();
  const later = useAfterRender();
  const [theme, setTheme] = useState<ThemeToggleTheme>(initialTheme);
  const [rows, setRows] = useState<RecurringCost[]>(USER_ROWS);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<RecurringSort | null>(null);
  const [schedulesFor, setSchedulesFor] = useState<string | null>(initialSchedules ?? null);
  const [editing, setEditing] = useState<string | null>(initialEditing ?? null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const searchRef = useRef<HTMLInputElement | HTMLButtonElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const formId = useId();

  const q = query.trim().toLowerCase();
  const shown = sortRecurringCosts(
    rows.filter(
      (c) =>
        (status === 'all' || c.status === status) &&
        (!q || [c.id, c.createdBy.name, c.createdBy.email, c.applicant.name, c.applicant.email].some((v) => v.toLowerCase().includes(q))),
    ),
    sort,
  );
  const filtered = q !== '' || status !== 'all';
  const find = (id: string | null) => rows.find((c) => c.id === id);
  const scheduleCost = find(schedulesFor);
  const editCost = find(editing);
  const update = (id: string, change: (c: RecurringCost) => RecurringCost) =>
    setRows((all) => all.map((c) => (c.id === id ? change(c) : c)));

  /* The ••• of a row, for focus after a row goes. */
  const actionsOf = (id: string) => tableRef.current?.querySelector<HTMLElement>(`tr[data-id="${id}"] [aria-haspopup="menu"]`);

  const save = (id: string, values: RecurringCostUpdate) => {
    onUpdate?.(id, values);
    update(id, (c) => ({
      ...c,
      startsAt: values.startsAt,
      frequency: { value: values.frequencyValue, unit: values.frequencyUnit },
      applicant: { name: values.applicantName, email: values.email },
      currency: values.currency,
      partner: values.partner,
      paymentMethod: values.paymentMethod,
      account: values.iban,
    }));
    setEditing(null);
    later(() => toast({ type: 'success', message: `Recurring cost #${id} updated.` }));
  };

  const applyConfirm = () => {
    if (!confirm) return;
    const { kind, id } = confirm;
    const at = shown.findIndex((c) => c.id === id);
    const neighbour = shown[at + 1] ?? shown[at - 1];
    setConfirm(null);
    if (kind === 'stop') {
      update(id, (c) => ({ ...c, status: 'stopped', schedule: c.schedule.filter((p) => p.status === 'done') }));
    } else {
      setRows((all) => all.filter((c) => c.id !== id));
    }
    later(() => {
      /* The dialog hands focus back to the row's •••. If the row has gone (deleted, or stopped under the
         Active filter), the next row's ••• takes it (or the previous one's, or the search box). */
      if (!actionsOf(id)) (neighbour ? actionsOf(neighbour.id) : searchRef.current)?.focus();
      toast({ type: 'success', message: CONFIRM_COPY[kind](id).toast });
    });
  };
  const copy = confirm ? CONFIRM_COPY[confirm.kind](confirm.id) : null;

  return (
    <>
      <AppHeader links={USER_LINKS} page="Recurring Costs" username="QA Test" theme={theme} onThemeChange={setTheme} />
      <main className="px-6 py-8">
        <div className="container mx-auto flex flex-col gap-6 pb-64">
          <PageHeader
            title="Recurring Costs"
            /* Add New starts a new recurring cost on the Create Cost form (U02), not in this pattern. */
            actions={<Button leftIcon={<Icon name="plus" />}>Add New</Button>}
          />
          {/* Filter / Bar (Page=Recurring): Search, All Status, then Filter / Clear while a filter is in use (Show Clear). */}
          <FilterBar
            aria-label="Filter recurring costs"
            showClear={filtered}
            onClear={() => {
              setQuery('');
              setStatus('all');
              searchRef.current?.focus();
            }}
          >
            <div className={FILTER_SLOT}>
              <FilterField
                ref={searchRef}
                label="Search recurring costs"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <FilterSelect
              className={FILTER_SLOT}
              label="Status"
              allLabel={STATUS_FILTER_LABEL.all}
              options={STATUS_FILTERS.filter((s) => s !== 'all').map((s) => ({ value: s, label: STATUS_FILTER_LABEL[s] }))}
              value={status === 'all' ? null : status}
              onValueChange={(next) => setStatus((next ?? 'all') as StatusFilter)}
            />
          </FilterBar>
          <RecurringCostsTable
            ref={tableRef}
            rows={shown}
            sort={sort}
            onSortChange={setSort}
            rowActions={(c) => (
              /* Pattern 03's Recurring Costs menu. Stop only while the schedule runs: an action the user can't take is left out. */
              <>
                <MenuItem onClick={() => setEditing(c.id)}>Edit</MenuItem>
                <MenuItem onClick={() => setSchedulesFor(c.id)}>View Schedules</MenuItem>
                {c.status === 'active' && <MenuItem onClick={() => setConfirm({ kind: 'stop', id: c.id })}>Stop</MenuItem>}
                <MenuItem destructive onClick={() => setConfirm({ kind: 'delete', id: c.id })}>
                  Delete
                </MenuItem>
              </>
            )}
            empty={<EmptyState size="compact" title={filtered ? 'No recurring costs match your filters' : 'No recurring costs yet'} />}
          />
        </div>
      </main>

      <PaymentSchedules open={!!scheduleCost} onClose={() => setSchedulesFor(null)}>
        {scheduleCost?.schedule.map((p) => (
          <PaymentRow
            key={p.date}
            status={p.status}
            date={formatDate(p.date)}
            subtitle={p.status === 'done' ? `Processed on ${formatShortDate(p.date)}` : 'Scheduled'}
            amount={formatPaymentAmount(scheduleCost)}
          />
        ))}
      </PaymentSchedules>

      <SideSheet
        open={!!editCost}
        onClose={() => setEditing(null)}
        title={editCost ? `Edit Recurring Cost #${editCost.id}` : ''}
        footer={
          <>
            <Button variant="text" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              Update
            </Button>
          </>
        }
      >
        {editCost && (
          <EditRecurringCostForm key={editCost.id} id={formId} cost={editCost} today={TODAY} onSave={(values) => save(editCost.id, values)} />
        )}
      </SideSheet>

      <ModalConfirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={applyConfirm}
        type="destructive"
        title={copy?.title ?? ''}
        message={copy?.message ?? ''}
        confirmLabel={copy?.confirmLabel}
      />
    </>
  );
}

function ManageRecurringCosts(props: PageProps) {
  return (
    <ToastProvider>
      <ManageRecurringCostsPage {...props} />
    </ToastProvider>
  );
}

const meta = {
  title: 'Patterns/Manage recurring costs',
  component: ManageRecurringCosts,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      story: { inline: false, height: '56rem' },
      description: {
        component:
          '**U04 · Manage recurring costs** (Patterns – User, 545:18695): where a user reviews, changes or ends a cost ' +
          'that repeats on a schedule. The list (RecurringCostsTable) has a search and a Status filter; ••• lists Edit, ' +
          'View Schedules, Stop and Delete. View Schedules opens PaymentSchedules (Done with the processed date, or ' +
          'Upcoming); Edit opens a SideSheet with the edit form (Update validates, saves and confirms with a toast); Stop ' +
          'and Delete ask first in a ModalConfirm, then confirm with a toast.',
      },
    },
  },
  args: { onUpdate: fn() },
} satisfies Meta<typeof ManageRecurringCosts>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A record's reference as the screens print it ("#1882"), built so no literal reads as a hex colour to the lint. */
const ref = (id: string) => `#${id}`;

/* ── Helpers for the plays ─────────────────────────────────────────────────── */
const tableOf = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Recurring costs' }) as HTMLTableElement;
const rowIds = (t: HTMLTableElement) => Array.from(t.tBodies[0].rows).map((r) => r.dataset.id).filter(Boolean);
const rowOf = (t: HTMLTableElement, id: string) => t.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`)!;
const actions = (canvasElement: HTMLElement, id: string) =>
  within(canvasElement).getByRole('button', { name: `Actions for recurring cost ${id}` });
const menuItems = (menu: HTMLElement) => within(menu).getAllByRole('menuitem').map((i) => i.textContent);
/* The toast stack is the page's live region; a toast's X dismisses it, so the snapshot ends without one. */
async function expectToast(canvasElement: HTMLElement, message: string) {
  const stack = screen.getByRole('region', { name: 'Notifications' });
  await within(stack).findByText(message);
  await userEvent.click(within(stack).getAllByRole('button', { name: 'Dismiss' })[0]);
  await waitFor(() => expect(within(stack).queryByText(message)).toBeNull());
}

/** Steps 1–3: filter the list, open a row's menu, view a payment schedule (keyboard). */
export const ViewSchedules: Story = {
  name: 'Filter and view schedules',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = canvas.getByRole('main');
    await expect(within(main).getByRole('heading', { level: 1, name: 'Recurring Costs' })).toBeVisible();
    const t = tableOf(canvasElement);
    await expect(rowIds(t)).toEqual(['1882', '1240', '1239', '1207', '9', '6']);

    // Search filters by ID, name or email; Clear Filters (shown only while filtering) brings every row back
    // and focus to the search box.
    const search = canvas.getByRole('searchbox', { name: 'Search recurring costs' });
    await expect(canvas.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();
    await userEvent.type(search, 'bryan');
    await expect(rowIds(t)).toEqual(['1240', '1239']);
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Filters' }));
    await expect(rowIds(t)).toHaveLength(6);
    await expect(search).toHaveValue('');
    await expect(search).toHaveFocus();
    await expect(canvas.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();

    // The Status filter (FilterSelect): All Status (checked), Active, Stopped.
    const statusField = canvas.getByRole('combobox', { name: 'Status' });
    await userEvent.click(statusField);
    const statusList = canvas.getByRole('listbox', { name: 'Status' });
    await expect(within(statusList).getAllByRole('option').map((o) => o.textContent)).toEqual(['All Status', 'Active', 'Stopped']);
    await expect(within(statusList).getByRole('option', { name: 'All Status' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(within(statusList).getByRole('option', { name: 'Stopped' }));
    await expect(rowIds(t)).toEqual(['1207']);
    await expect(statusField).toHaveFocus();
    await expect(statusField).toHaveTextContent('Stopped');

    // A stopped schedule's menu has no Stop.
    await userEvent.click(actions(canvasElement, '1207'));
    await expect(menuItems(screen.getByRole('menu', { name: 'Actions for recurring cost 1207' }))).toEqual(['Edit', 'View Schedules', 'Delete']);
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Filters' }));
    await expect(rowIds(t)).toHaveLength(6);

    // Step 2: ••• lists Edit, View Schedules, Stop and Delete; Delete is last, in red.
    const button = actions(canvasElement, '1882');
    button.focus();
    await userEvent.keyboard('{ArrowDown}');
    const menu = screen.getByRole('menu', { name: 'Actions for recurring cost 1882' });
    await expect(menuItems(menu)).toEqual([...rowActionLabels.recurringCosts]);
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Edit' })).toHaveFocus());

    // Step 3: View Schedules opens Payment Schedules: Done with the processed date, or Upcoming.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await expect(dialog).toHaveAccessibleDescription('Upcoming and processed payments');
    await expect(within(dialog).getAllByText('Done')).toHaveLength(3);
    await expect(within(dialog).getAllByText('Upcoming')).toHaveLength(2);
    await expect(within(dialog).getByText('July 30, 2026')).toBeVisible();
    await expect(within(dialog).getByText('Processed on Jul 30, 2026')).toBeVisible();
    await expect(within(dialog).getAllByText('Scheduled')).toHaveLength(2);

    // Escape closes it; focus goes back to the row's •••.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(button).toHaveFocus();
  },
};

/** Step 4: Edit opens the side sheet; Update validates, saves (FormData), updates the row and confirms. */
export const EditInSideSheet: Story = {
  name: 'Edit in the side sheet',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const t = tableOf(canvasElement);
    const button = actions(canvasElement, '1882');
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    const sheet = await screen.findByRole('dialog', { name: `Edit Recurring Cost ${ref('1882')}` });
    const form = within(sheet);

    // Figma's sections, under the sheet's title.
    const sections = form.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    await expect(sections).toEqual(['Recurring Details', 'Cost Details', 'Beneficiary Information', 'Breakdowns']);
    await expect(form.getByRole('combobox', { name: 'Payment method' })).toHaveTextContent('YourSafe');
    await expect(form.getByText('Recurring 1')).toBeVisible();
    await expect(form.getByText('USD 900')).toBeVisible();

    // The line under the frequency follows the value and the unit.
    const value = form.getByRole('spinbutton', { name: /^Frequency Value/ });
    await expect(value).toHaveValue(3);
    await expect(form.getByRole('status')).toHaveTextContent('This will recur every 3 weeks');
    await userEvent.clear(value);
    await userEvent.type(value, '2');
    await userEvent.click(form.getByRole('combobox', { name: 'Frequency Unit' }));
    await userEvent.click(await form.findByRole('option', { name: 'Month' }));
    await expect(form.getByRole('status')).toHaveTextContent('This will recur every 2 months');

    // Update with an empty name and a broken email: errors under the fields, focus on the first.
    const name = form.getByRole('textbox', { name: /^Applicant name/ });
    const email = form.getByRole('textbox', { name: /^Email/ });
    await userEvent.clear(name);
    await userEvent.clear(email);
    await userEvent.type(email, 'qa.bryan@');
    const update = within(sheet).getByRole('button', { name: 'Update' });
    await userEvent.click(update);
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription('Enter the applicant’s name.');
    await expect(email).toHaveAccessibleDescription('Enter a valid email address, like name@company.com.');
    await expect(name).toHaveFocus();
    await expect(args.onUpdate).not.toHaveBeenCalled();

    // Each error clears as soon as its value is valid.
    await userEvent.type(name, 'QA Test Bryan');
    await expect(name).not.toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(email, 'example.com');
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');

    // Update: the FormData values, the sheet closes, focus goes back to •••, the row and a toast confirm it.
    await userEvent.click(update);
    await expect(args.onUpdate).toHaveBeenCalledWith('1882', {
      startsAt: '2026-07-30',
      frequencyValue: 2,
      frequencyUnit: 'Month',
      applicantName: 'QA Test Bryan',
      email: 'qa.bryan@example.com',
      currency: 'USD',
      partner: 'Test Admin',
      paymentMethod: 'YourSafe',
      beneficiaryName: 'Test Admin',
      iban: 'BE71096123456769',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(button).toHaveFocus();
    const row = within(rowOf(t, '1882'));
    await expect(row.getByText('2 months')).toBeVisible();
    await expect(row.getByText('QA Test Bryan')).toBeVisible();
    await expectToast(canvasElement, `Recurring cost ${ref('1882')} updated.`);

    // Cancel closes without saving.
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    const again = await screen.findByRole('dialog', { name: `Edit Recurring Cost ${ref('1882')}` });
    await userEvent.click(within(again).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onUpdate).toHaveBeenCalledTimes(1);
    await expect(button).toHaveFocus();
  },
};

/** Step 5: Stop and Delete ask first (Pattern 04), then update the list and confirm with a toast. */
export const StopAndDelete: Story = {
  name: 'Stop and delete',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = tableOf(canvasElement);
    const button = actions(canvasElement, '1240');

    // Stop: the dialog names the record; focus opens on Cancel; Stop stops it.
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Stop' }));
    const stop = await screen.findByRole('alertdialog', { name: 'Stop recurring cost?' });
    await expect(stop).toHaveAccessibleDescription(`Recurring cost ${ref('1240')} will stop. Upcoming payments are cancelled; processed ones stay.`);
    await waitFor(() => expect(within(stop).getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await userEvent.click(within(stop).getByRole('button', { name: 'Stop' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(button).toHaveFocus();
    await expect(within(rowOf(t, '1240')).getByText('Stopped')).toBeVisible();
    await expectToast(canvasElement, `Recurring cost ${ref('1240')} stopped.`);

    // Its schedule keeps the processed payments only, and its menu no longer offers Stop.
    await userEvent.click(button);
    await expect(menuItems(screen.getByRole('menu', { name: 'Actions for recurring cost 1240' }))).toEqual(['Edit', 'View Schedules', 'Delete']);
    await userEvent.click(screen.getByRole('menuitem', { name: 'View Schedules' }));
    const schedules = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await expect(within(schedules).getAllByText('Done')).toHaveLength(3);
    await expect(within(schedules).queryByText('Upcoming')).toBeNull();
    await userEvent.click(within(schedules).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(button).toHaveFocus();

    // Delete from the keyboard: ↑ opens the menu on its last item. Escape cancels, and nothing changes.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    const del = await screen.findByRole('alertdialog', { name: 'Delete recurring cost?' });
    await expect(del).toHaveAccessibleDescription(`Recurring cost ${ref('1240')} and its schedule will be permanently deleted. This can’t be undone.`);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(button).toHaveFocus();
    await expect(rowIds(t)).toContain('1240');

    // Again, and confirm: the row goes, focus moves to the next row's •••, a toast confirms it.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete recurring cost?' });
    await waitFor(() => expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await userEvent.tab();
    await expect(within(confirm).getByRole('button', { name: 'Delete' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(rowIds(t)).toEqual(['1882', '1239', '1207', '9', '6']);
    await expect(actions(canvasElement, '1239')).toHaveFocus();
    await expectToast(canvasElement, `Recurring cost ${ref('1240')} deleted.`);
  },
};

/** Step 3 as Figma draws it: Payment Schedules open over the list. */
export const SchedulesOpen: Story = {
  name: 'Payment schedules open',
  args: { schedulesFor: '1882' },
  // An open dialog makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await expect(within(dialog).getAllByText('Done')).toHaveLength(3);
    await expect(within(dialog).getByText('October 22, 2026')).toBeVisible();
  },
};

/** Step 4 as Figma draws it: the side sheet open over the list. */
export const EditSheetOpen: Story = {
  name: 'Edit side sheet open',
  args: { editing: '1882' },
  tags: ['!autodocs'],
  play: async () => {
    const sheet = await screen.findByRole('dialog', { name: `Edit Recurring Cost ${ref('1882')}` });
    await expect(within(sheet).getByRole('status')).toHaveTextContent('This will recur every 3 weeks');
    await expect(within(sheet).getByRole('button', { name: 'Update' })).toBeVisible();
  },
};

/** Dark: the list, as step 1 shows it. */
export const Dark: Story = {
  args: { theme: 'dark' },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(rowIds(tableOf(canvasElement))).toHaveLength(6);
  },
};

/** Dark: the edit side sheet. */
export const EditSheetDark: Story = {
  name: 'Edit side sheet — Dark',
  args: { theme: 'dark', editing: '1882' },
  globals: { theme: 'dark' },
  tags: ['!autodocs'],
  play: async () => {
    await expect(await screen.findByRole('dialog', { name: `Edit Recurring Cost ${ref('1882')}` })).toBeVisible();
  },
};
