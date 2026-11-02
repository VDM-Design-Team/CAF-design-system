import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useId, useRef, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { MenuItem } from '../../components/menu-item';
import { ModalConfirm } from '../../components/modal-confirm';
import { ModalDialog } from '../../components/modal-dialog';
import { PaymentRow } from '../../components/payment-row';
import { PaymentSchedules } from '../../components/payment-schedules';
import { RowActionsMenu } from '../../components/row-actions-menu';
import { SelectField } from '../../components/select-field';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableRow } from '../../components/table-row';
import { TextField } from '../../components/text-field';
import { ToastProvider, useToast } from '../../components/toast';
import { costCentres, formatDate, formatShortDate, recurringCosts, rowActionLabels, type CostCentre } from '../fixtures';
import { PageHeader } from '../page/PageHeader';
import { RecurringCostsTable } from '../recurring/RecurringCostsTable';

/* Pattern 03, step 1 (520:1874): the Cost Centers list's four rows. */
const ROWS = costCentres.slice(0, 4);
/* Pattern 05's Cost Center dropdown: the cost centres there are. */
const COST_CENTRE_NAMES = [...new Set(costCentres.map((c) => c.name))];

/** Work to do once the next render is on screen: after an overlay has closed and given the page back. */
function useAfterRender() {
  const queue = useRef<(() => void)[]>([]);
  useEffect(() => {
    for (const job of queue.current.splice(0)) job();
  });
  return (job: () => void) => queue.current.push(job);
}

interface CostCentreValues {
  name: string;
  natureOfService: string;
  location: string;
}

interface PageProps {
  /** Open this cost centre's ••• menu at first. */
  menuOpenFor?: string;
  /** Open the Delete confirmation for this cost centre at first. */
  confirmFor?: string;
  /** Called with the edit dialog's FormData values when Save saves them. */
  onSave?: (id: string, values: CostCentreValues) => void;
}

/* Pattern 05's edit dialog, opened from the row's Edit: the same form, pre-filled. */
function EditCostCentreDialog({ costCentre, onClose, onSave }: { costCentre: CostCentre | undefined; onClose: () => void; onSave: (values: CostCentreValues) => void }) {
  const formId = useId();
  const firstRef = useRef<HTMLButtonElement | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CostCentreValues, string>>>({});
  useEffect(() => setErrors({}), [costCentre]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get('name') ?? ''),
      natureOfService: String(data.get('natureOfService') ?? '').trim(),
      location: String(data.get('location') ?? '').trim(),
    };
    /* Pattern 05: invalid fields turn red with a message, and the dialog keeps what the user typed. */
    const found = {
      natureOfService: values.natureOfService ? undefined : 'Nature of Service is required.',
      location: values.location ? undefined : 'Location is required.',
    };
    setErrors(found);
    const first = (['natureOfService', 'location'] as const).find((k) => found[k]);
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    onSave(values);
  };

  return (
    <ModalDialog
      open={!!costCentre}
      onClose={onClose}
      title="Edit Cost Center"
      size="medium"
      initialFocusRef={firstRef}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            Save
          </Button>
        </>
      }
    >
      {costCentre && (
        <form key={costCentre.id} id={formId} noValidate onSubmit={submit} className="flex flex-col gap-4">
          <SelectField ref={firstRef} label="Cost Center" required name="name" options={COST_CENTRE_NAMES} defaultValue={costCentre.name} />
          <TextField
            label="Nature of Service"
            required
            name="natureOfService"
            placeholder="e.g. Salary"
            defaultValue={costCentre.natureOfService}
            error={errors.natureOfService}
            onChange={(e) => e.target.value.trim() && setErrors((x) => ({ ...x, natureOfService: undefined }))}
          />
          <TextField
            label="Location"
            required
            name="location"
            placeholder="e.g. Philippines"
            defaultValue={costCentre.location}
            error={errors.location}
            onChange={(e) => e.target.value.trim() && setErrors((x) => ({ ...x, location: undefined }))}
          />
        </form>
      )}
    </ModalDialog>
  );
}

function CostCentresPage({ menuOpenFor, confirmFor: initialConfirm, onSave }: PageProps) {
  const { toast } = useToast();
  const later = useAfterRender();
  const [rows, setRows] = useState<CostCentre[]>(ROWS);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmFor, setConfirmFor] = useState<string | null>(initialConfirm ?? null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const confirming = rows.find((c) => c.id === confirmFor);
  const editCostCentre = rows.find((c) => c.id === editing);

  const remove = () => {
    if (!confirming) return;
    /* The row goes, so its ••• can't take focus back: the next row's does (or the previous one's). */
    const at = rows.indexOf(confirming);
    const neighbour = rows[at + 1] ?? rows[at - 1];
    setConfirmFor(null);
    setRows((all) => all.filter((c) => c.id !== confirming.id));
    later(() => {
      tableRef.current?.querySelector<HTMLElement>(`tr[data-id="${neighbour?.id}"] [aria-haspopup="menu"]`)?.focus();
      toast({ type: 'success', message: 'Cost center deleted.' });
    });
  };

  const save = (values: CostCentreValues) => {
    if (!editCostCentre) return;
    onSave?.(editCostCentre.id, values);
    setRows((all) => all.map((c) => (c.id === editCostCentre.id ? { ...c, ...values, location: values.location as CostCentre['location'] } : c)));
    setEditing(null);
    later(() => toast({ type: 'success', message: 'Cost center updated.' }));
  };

  return (
    <>
      <main className="flex flex-col gap-6 pb-64">
        {/* Add New is pattern 05's (Create or edit in a modal). */}
        <PageHeader title="Cost Centers" actions={<Button leftIcon={<Icon name="plus" />}>Add New</Button>} />
        <table ref={tableRef} aria-label="Cost centers" className="w-full border-collapse">
          <thead>
            <tr className="border-b border-stroke-subtle">
              {['Cost center', 'Nature of Service', 'Location'].map((label) => (
                <TableHeaderCell key={label} className="px-4">
                  {label}
                </TableHeaderCell>
              ))}
              <TableHeaderCell className="w-1 px-4">
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((cc) => (
              <TableRow key={cc.id} data-id={cc.id}>
                <TableCell>{cc.name}</TableCell>
                <TableCell>{cc.natureOfService}</TableCell>
                <TableCell>{cc.location}</TableCell>
                <TableCell type="actions" className="w-1">
                  {/* "Most lists": Edit, then Delete, last and red. */}
                  <RowActionsMenu label={`Actions for ${cc.name}`} defaultOpen={cc.id === menuOpenFor}>
                    <MenuItem onClick={() => setEditing(cc.id)}>Edit</MenuItem>
                    <MenuItem destructive onClick={() => setConfirmFor(cc.id)}>
                      Delete
                    </MenuItem>
                  </RowActionsMenu>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </main>

      {/* Pattern 04's confirmation: the title asks, the message names the record, the red button repeats the verb. */}
      <ModalConfirm
        open={!!confirming}
        onClose={() => setConfirmFor(null)}
        onConfirm={remove}
        type="destructive"
        title="Delete cost center?"
        message={confirming ? `“${confirming.name}” will be permanently deleted. This can’t be undone.` : ''}
        confirmLabel="Delete"
      />
      <EditCostCentreDialog costCentre={editCostCentre} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}

function RowActionsDemo(props: PageProps) {
  return (
    <ToastProvider>
      <CostCentresPage {...props} />
    </ToastProvider>
  );
}

const meta = {
  title: 'Patterns/Row actions menu',
  component: RowActionsDemo,
  parameters: {
    controls: { disable: true },
    docs: {
      story: { inline: false, height: '35rem' },
      description: {
        component:
          '**03 · Row actions menu** (Patterns – Admin, 520:2387): every table row ends with a ••• button (RowActionsMenu) ' +
          'that opens a short menu of actions for that one record. Items are ordered by use, the destructive one last in ' +
          'red. "View" opens a read-only modal, "Edit" opens a form, "Delete" asks first (pattern 04) and confirms with a ' +
          'toast. The menu closes on a choice, an outside click or Escape, and focus goes back to the •••.',
      },
    },
  },
  args: { onSave: fn() },
} satisfies Meta<typeof RowActionsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Helpers for the plays ─────────────────────────────────────────────────── */
const tableOf = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Cost centers' }) as HTMLTableElement;
const names = (t: HTMLTableElement) => Array.from(t.tBodies[0].rows).map((r) => r.cells[0].textContent);
const menuItems = (menu: HTMLElement) => within(menu).getAllByRole('menuitem').map((i) => i.textContent);
async function expectToast(canvasElement: HTMLElement, message: string) {
  const stack = screen.getByRole('region', { name: 'Notifications' });
  await within(stack).findByText(message);
  // Dismissed, so the snapshot ends without a timed toast in it.
  await userEvent.click(within(stack).getAllByRole('button', { name: 'Dismiss' })[0]);
  await waitFor(() => expect(within(stack).queryByText(message)).toBeNull());
}

/** Steps 1, 2 and pattern 04: ••• opens the menu under the button; Delete asks, then removes the row and confirms. */
export const DeleteFromRowMenu: Story = {
  name: 'Delete from the row menu',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = tableOf(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Cost Centers' })).toBeVisible();
    await expect(names(t)).toEqual(['Employee Expenses', 'Travel Expenses', 'IT Expenses', 'Legal Expenses']);

    // ••• sits in the last column; the menu opens under it, right-aligned to it, with focus on its first item.
    const button = canvas.getByRole('button', { name: 'Actions for Employee Expenses' });
    await expect(button.closest('td')).toBe(button.closest('tr')!.lastElementChild);
    await userEvent.click(button);
    const menu = canvas.getByRole('menu', { name: 'Actions for Employee Expenses' });
    await expect(menuItems(menu)).toEqual([...rowActionLabels.default]);
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Edit' })).toHaveFocus());
    await expect(menu.getBoundingClientRect().top).toBeGreaterThanOrEqual(button.getBoundingClientRect().bottom);
    await expect(menu.getBoundingClientRect().right).toBeCloseTo(button.getBoundingClientRect().right, 0);

    // A click outside closes it without choosing.
    await userEvent.click(canvas.getByRole('heading', { level: 1 }));
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();

    // Delete asks first: the title asks, the message names the record, focus opens on Cancel.
    await userEvent.click(button);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete cost center?' });
    await expect(dialog).toHaveAccessibleDescription('“Employee Expenses” will be permanently deleted. This can’t be undone.');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus());

    // Escape cancels: nothing changes, and focus goes back to the •••.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(button).toHaveFocus();
    await expect(names(t)).toHaveLength(4);

    // From the keyboard: ↑ opens the menu on its last item, Delete; Enter, Tab to the red Delete, Enter.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Delete' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    const again = await screen.findByRole('alertdialog', { name: 'Delete cost center?' });
    await waitFor(() => expect(within(again).getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await userEvent.tab();
    await expect(within(again).getByRole('button', { name: 'Delete' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    // The row is removed, focus moves to the next row's •••, and a success toast confirms it.
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(names(t)).toEqual(['Travel Expenses', 'IT Expenses', 'Legal Expenses']);
    await expect(canvas.getByRole('button', { name: 'Actions for Travel Expenses' })).toHaveFocus();
    await expectToast(canvasElement, 'Cost center deleted.');
  },
};

/** Edit opens the form (pattern 05's dialog, pre-filled); Save validates, saves and confirms. */
export const EditFromRowMenu: Story = {
  name: 'Edit from the row menu',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const t = tableOf(canvasElement);
    const button = canvas.getByRole('button', { name: 'Actions for IT Expenses' });
    await userEvent.click(button);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Cost Center' });
    const form = within(dialog);
    // Focus starts on the first field, pre-filled.
    await waitFor(() => expect(form.getByRole('combobox', { name: /^Cost Center/ })).toHaveFocus());
    await expect(form.getByRole('combobox', { name: /^Cost Center/ })).toHaveTextContent('IT Expenses');

    // An empty required field turns red with a message; the dialog stays open.
    const location = form.getByRole('textbox', { name: /^Location/ });
    await userEvent.clear(location);
    await userEvent.click(form.getByRole('button', { name: 'Save' }));
    await expect(location).toHaveAccessibleDescription('Location is required.');
    await expect(location).toHaveFocus();
    await expect(args.onSave).not.toHaveBeenCalled();
    await userEvent.type(location, 'Romania');
    await expect(location).not.toHaveAttribute('aria-invalid', 'true');

    const nature = form.getByRole('textbox', { name: /^Nature of Service/ });
    await userEvent.clear(nature);
    await userEvent.type(nature, 'Hardware');
    await userEvent.click(form.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith('cc-3', { name: 'IT Expenses', natureOfService: 'Hardware', location: 'Romania' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(button).toHaveFocus();
    await expect(Array.from(t.tBodies[0].rows[2].cells).map((c) => c.textContent).slice(0, 3)).toEqual(['IT Expenses', 'Hardware', 'Romania']);
    await expectToast(canvasElement, 'Cost center updated.');
  },
};

/* Step 2, "Show only what applies": each page's menu, in Figma's order. */
const MENUS = [
  { page: 'Costs', items: rowActionLabels.costs },
  { page: 'Recurring Costs', items: rowActionLabels.recurringCosts },
  { page: 'Exports', items: rowActionLabels.exports },
  { page: 'Most lists', items: rowActionLabels.default },
] as const;

function MenusByPage() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-64 pb-64 md:grid-cols-4">
      {MENUS.map(({ page, items }) => (
        <div key={page} className="flex flex-col items-end gap-2">
          <p className="self-start text-body-sm-semibold text-text-primary">{page}</p>
          <RowActionsMenu label={`${page} row actions`} defaultOpen>
            {items.map((label) => (
              <MenuItem key={label} destructive={label === 'Delete'}>
                {label}
              </MenuItem>
            ))}
          </RowActionsMenu>
        </div>
      ))}
    </div>
  );
}

/** Step 2: the items differ by page; the order rule doesn't (most used first, Delete last in red). */
export const MenusForEachPage: Story = {
  name: 'Menus for each page',
  render: () => <MenusByPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const { page, items } of MENUS) {
      const menu = canvas.getByRole('menu', { name: `${page} row actions` });
      await expect(menu).toBeVisible();
      await expect(menuItems(menu)).toEqual([...items]);
      const last = within(menu).getAllByRole('menuitem').at(-1)!;
      await expect(last).toHaveTextContent('Delete');
      // Delete is red: Type=Destructive's accent.critical label, unlike the others.
      await expect(getComputedStyle(last).color).not.toBe(getComputedStyle(within(menu).getAllByRole('menuitem')[0]).color);
    }
  },
};

/* Step 3: Recurring Costs → View Schedules opens the read-only Payment Schedules modal. */
function ViewSchedulesDemo() {
  const [viewing, setViewing] = useState<string | null>(null);
  const cost = recurringCosts.find((c) => c.id === viewing);
  return (
    <div className="pb-64">
      <RecurringCostsTable
        rows={recurringCosts.slice(0, 3)}
        rowActions={(c) => (
          <>
            <MenuItem>Edit</MenuItem>
            <MenuItem onClick={() => setViewing(c.id)}>View Schedules</MenuItem>
            <MenuItem>Stop</MenuItem>
            <MenuItem destructive>Delete</MenuItem>
          </>
        )}
      />
      <PaymentSchedules open={!!cost} onClose={() => setViewing(null)}>
        {cost?.schedule.map((p) => (
          <PaymentRow
            key={p.date}
            status={p.status}
            date={formatDate(p.date)}
            subtitle={p.status === 'done' ? `Processed on ${formatShortDate(p.date)}` : 'Scheduled'}
          />
        ))}
      </PaymentSchedules>
    </div>
  );
}

/** Step 3: a "View" action opens a read-only modal; × or Escape closes it, and focus goes back to the •••. */
export const ViewOpensAModal: Story = {
  name: 'View opens a modal',
  render: () => <ViewSchedulesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Actions for recurring cost 1240' });
    await userEvent.click(button);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'View Schedules' }));
    const dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await expect(within(dialog).getByText('September 1, 2026')).toBeVisible();
    await expect(within(dialog).getByText('Processed on Sep 1, 2026')).toBeVisible();
    // Read-only: no field, no Save; × closes it.
    await expect(within(dialog).queryByRole('textbox')).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(button).toHaveFocus();

    // Escape closes it too.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Edit' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(button).toHaveFocus();
  },
};

/** Step 1 as Figma draws it: the first row's menu open. */
export const MenuOpen: Story = {
  name: 'Menu open',
  args: { menuOpenFor: 'cc-1' },
  play: async ({ canvasElement }) => {
    const menu = within(canvasElement).getByRole('menu', { name: 'Actions for Employee Expenses' });
    await expect(menu).toBeVisible();
  },
};

/** Pattern 04's step 2 here: the confirmation open over the list. */
export const ConfirmOpen: Story = {
  name: 'Delete confirmation open',
  args: { confirmFor: 'cc-1' },
  // An open dialog makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete cost center?' });
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus());
  },
};

/** Dark: the first row's menu open. */
export const Dark: Story = {
  args: { menuOpenFor: 'cc-1' },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('menu', { name: 'Actions for Employee Expenses' })).toBeVisible();
  },
};
