import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ToastProvider } from '../../components/toast';
import { CostCentresPage, type CostCentresPageProps } from '../modal-form/CostCentresPage';

/** The page: one main landmark, the toasts' live region beside it. Room under the table for its menus. */
function Screen(props: CostCentresPageProps) {
  return (
    <ToastProvider>
      <main className="p-8 pb-64">
        <CostCentresPage {...props} />
      </main>
    </ToastProvider>
  );
}

const meta = {
  title: 'Patterns/Confirm destructive actions',
  component: CostCentresPage,
  render: (args) => <Screen {...args} />,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern 04 (Figma 523:2612): anything that deletes, rejects or stops a record is confirmed first. **Delete** is ' +
          'red and last in the row menu. It opens **Modal / Confirm** (Destructive): the title asks the question, the ' +
          'message names the record and the consequence, the red button repeats the verb, and focus opens on Cancel, ' +
          'the safe answer. Cancel and Escape change nothing and put focus back on the row’s •••. **Delete** removes ' +
          'the row, a success **Toast** confirms it, and focus moves to the next row’s •••. If the delete fails, the ' +
          'record stays and an error Toast says why; it stays until dismissed. Built from RowActionsMenu, MenuItem, ' +
          'ModalConfirm and ToastProvider, on the Cost Centers list (`src/patterns/modal-form/CostCentresPage.tsx`).',
      },
    },
  },
  args: { onSave: fn(), onDelete: fn() },
} satisfies Meta<typeof CostCentresPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const notifications = (canvasElement: HTMLElement) =>
  within(screen.getByRole('region', { name: 'Notifications' }));

/** Opens a row's menu from the keyboard and chooses its last item, Delete. */
async function chooseDelete(trigger: HTMLElement) {
  trigger.focus();
  await userEvent.keyboard('{Enter}');
  // The row's menu opens on <body>, outside the table's scroll region (RowActionsMenu's portal).
  const menu = await screen.findByRole('menu', { name: trigger.getAttribute('aria-label')! });
  const items = within(menu).getAllByRole('menuitem');
  await waitFor(() => expect(items[0]).toHaveFocus());
  await userEvent.keyboard('{End}');
  await expect(items[items.length - 1]).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  const dialog = await screen.findByRole('alertdialog', { name: 'Delete cost center?' });
  await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus());
  return dialog;
}

/**
 * Steps 1–3, from the keyboard: the row menu lists Edit, then Delete (red,
 * last). The confirmation names “Employee Expenses”; Escape cancels and focus
 * is back on the •••. Confirmed, the row goes, “Cost center deleted.” shows,
 * and focus moves to the next row’s •••.
 */
export const Delete: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Cost centers' });
    const rowCount = within(table).getAllByRole('row').length;
    const trigger = canvas.getByRole('button', { name: 'Actions for Employee Expenses, Philippines' });

    // Step 1: Delete is the last item.
    await userEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: 'Actions for Employee Expenses, Philippines' });
    await expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Edit', 'Delete']);
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();

    // Step 2: the dialog names the record and the consequence. Escape is a safe answer.
    let dialog = await chooseDelete(trigger);
    await expect(dialog).toHaveAccessibleDescription(
      '“Employee Expenses” will be permanently deleted. This can’t be undone.',
    );
    await expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(within(table).getAllByRole('row')).toHaveLength(rowCount);
    await expect(args.onDelete).not.toHaveBeenCalled();

    // Step 3: confirmed, the row goes and a toast confirms it.
    dialog = await chooseDelete(trigger);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(within(table).getAllByRole('row')).toHaveLength(rowCount - 1);
    await expect(canvas.queryByRole('button', { name: 'Actions for Employee Expenses, Philippines' })).toBeNull();
    await expect(args.onDelete).toHaveBeenCalledWith('cc-1', true);
    await expect(await notifications(canvasElement).findByText('Cost center deleted.')).toBeVisible();
    // Its ••• is gone, so focus goes to the next row's.
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Actions for Travel Expenses, Philippines' })).toHaveFocus(),
    );
  },
};

/** Step 4: a cost centre that costs still use isn't deleted. The row stays, and the error toast says why and stays. */
export const DeleteFails: Story = {
  name: 'Delete fails',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Cost centers' });
    const rowCount = within(table).getAllByRole('row').length;
    const trigger = canvas.getByRole('button', { name: 'Actions for IT Expenses, United States' });

    const dialog = await chooseDelete(trigger);
    await expect(dialog).toHaveAccessibleDescription('“IT Expenses” will be permanently deleted. This can’t be undone.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());

    await expect(within(table).getAllByRole('row')).toHaveLength(rowCount);
    await expect(trigger).toHaveFocus();
    await expect(args.onDelete).toHaveBeenCalledWith('cc-3', false);
    const message = await notifications(canvasElement).findByText('Couldn’t delete. This cost center is used by 12 costs.');
    // An error toast has no timer: it stays until dismissed.
    await expect(message.closest('[data-toast-id]')).not.toHaveAttribute('data-duration');
    await userEvent.click(within(message.closest<HTMLElement>('[data-toast-id]')!).getByRole('button'));
    await waitFor(() => expect(notifications(canvasElement).queryByText(/Couldn’t delete/)).toBeNull());
  },
};

/** Step 2, open: the destructive confirmation over the list, focus on Cancel. */
export const ConfirmOpen: Story = {
  name: 'Confirm open',
  args: { defaultConfirm: 'cc-1' },
  // An open dialog makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete cost center?' });
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus());
    // Cancel on the left, the verb on the right.
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' }).getBoundingClientRect();
    await expect(within(dialog).getByRole('button', { name: 'Delete' }).getBoundingClientRect().left).toBeGreaterThan(
      cancel.right,
    );
  },
};

/** Dark: the destructive confirmation over the list. */
export const Dark: Story = {
  args: { defaultConfirm: 'cc-1' },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete cost center?' });
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus());
  },
};
