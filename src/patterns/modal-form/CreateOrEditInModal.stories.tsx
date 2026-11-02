import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ToastProvider } from '../../components/toast';
import { CostCentresPage, type CostCentresPageProps } from './CostCentresPage';

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
  title: 'Patterns/Create or edit in a modal',
  component: CostCentresPage,
  render: (args) => <Screen {...args} />,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern 05 (Figma 523:3452): short records are created and edited in a **Modal / Dialog** (Medium) over the ' +
          'list, so the user keeps their place. **Add New** opens “Add New Cost Center” with the form in its Content ' +
          'slot; a row’s **Edit** opens the same dialog, pre-filled. Required fields are marked with *, and focus starts ' +
          'on the first one. **Save** shows each missing field in red with a message, focuses the first and keeps what ' +
          'was typed; when the form passes, the dialog closes, the record appears at the top of the list (or the row ' +
          'updates) and a success **Toast** confirms it. Cancel, × and Escape close without saving. Built from ' +
          'ModalDialog, SelectField, TextField, Button and ToastProvider (`src/patterns/modal-form/`).',
      },
    },
  },
  args: { onSave: fn(), onDelete: fn() },
} satisfies Meta<typeof CostCentresPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const notifications = (canvasElement: HTMLElement) =>
  within(within(canvasElement).getByRole('region', { name: 'Notifications' }));

const dialogClosed = () => waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

/**
 * Steps 1–4: Add New opens the dialog with focus on Cost Center. Save with
 * Location empty shows “Location is required.” on it, focuses it and keeps the
 * other values. Filled in, Save (from the keyboard) saves: the dialog closes, the new cost centre
 * is the first row, a success toast confirms it, and focus is back on Add New.
 * Cancel and Escape close without saving.
 */
export const AddNew: Story = {
  name: 'Add new',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add New' });
    const table = canvas.getByRole('table', { name: 'Cost centers' });
    const rowCount = within(table).getAllByRole('row').length;

    // Step 1–2: the dialog opens, focus on the first field.
    await userEvent.click(add);
    const dialog = await screen.findByRole('dialog', { name: 'Add New Cost Center' });
    const costCentre = within(dialog).getByRole('combobox', { name: /^Cost Center/ });
    await waitFor(() => expect(costCentre).toHaveFocus());
    await expect(costCentre).toHaveAttribute('aria-required', 'true');
    // Cancel and Save, the primary action on the right.
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
    const save = within(dialog).getByRole('button', { name: 'Save' });
    await expect(save.getBoundingClientRect().left).toBeGreaterThan(cancel.getBoundingClientRect().right);

    // Choose with the keyboard, type the nature, leave Location empty.
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(costCentre).toHaveTextContent('IT Expenses');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /^Nature of Service/ }), 'Software');

    // Step 3: Save shows the error in place and keeps the dialog open.
    await userEvent.click(save);
    const location = within(dialog).getByRole('textbox', { name: /^Location/ });
    await expect(location).toHaveAttribute('aria-invalid', 'true');
    await expect(location).toHaveAccessibleDescription('Location is required.');
    await expect(location).toHaveFocus();
    await expect(screen.getByRole('dialog', { name: 'Add New Cost Center' })).toBeInTheDocument();
    await expect(costCentre).toHaveTextContent('IT Expenses');
    await expect(within(dialog).getByRole('textbox', { name: /^Nature of Service/ })).toHaveValue('Software');
    await expect(args.onSave).not.toHaveBeenCalled();

    // Typing clears the message; Tab past Cancel to Save, and Enter saves.
    await userEvent.type(location, 'Philippines');
    await expect(location).not.toHaveAttribute('aria-invalid');
    await userEvent.tab();
    await expect(cancel).toHaveFocus();
    await userEvent.tab();
    await expect(save).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    // Step 4: closed, the new record on top, a toast, focus back on Add New.
    await dialogClosed();
    await expect(add).toHaveFocus();
    const values = { name: 'IT Expenses', natureOfService: 'Software', location: 'Philippines' };
    await expect(args.onSave).toHaveBeenCalledWith(values, expect.any(FormData), 'add');
    const data = (args.onSave as ReturnType<typeof fn>).mock.calls[0][1] as FormData;
    await expect(Object.fromEntries(data)).toEqual(values);
    const rows = within(table).getAllByRole('row');
    await expect(rows).toHaveLength(rowCount + 1);
    await expect(within(rows[1]).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      'IT Expenses',
      'Software',
      'Philippines',
      '',
    ]);
    await expect(await notifications(canvasElement).findByText('Cost center added.')).toBeVisible();

    // Cancel and Escape save nothing.
    await userEvent.click(add);
    let again = await screen.findByRole('dialog', { name: 'Add New Cost Center' });
    await userEvent.type(within(again).getByRole('textbox', { name: /^Location/ }), 'Romania');
    await userEvent.click(within(again).getByRole('button', { name: 'Cancel' }));
    await dialogClosed();
    await expect(add).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    again = await screen.findByRole('dialog', { name: 'Add New Cost Center' });
    // A fresh form each time: nothing kept from the cancelled one.
    await expect(within(again).getByRole('textbox', { name: /^Location/ })).toHaveValue('');
    await userEvent.keyboard('{Escape}');
    await dialogClosed();
    await expect(within(table).getAllByRole('row')).toHaveLength(rowCount + 1);
    await expect(args.onSave).toHaveBeenCalledTimes(1);
  },
};

/** Edit from the row menu: the same dialog, pre-filled. Save updates the row; focus returns to its •••. */
export const EditFromRowMenu: Story = {
  name: 'Edit from the row menu',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Actions for Travel Expenses, Philippines' });
    await userEvent.click(trigger);
    const menu = canvas.getByRole('menu', { name: 'Actions for Travel Expenses, Philippines' });
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }));

    const dialog = await screen.findByRole('dialog', { name: 'Edit Cost Center' });
    await expect(within(dialog).getByRole('combobox', { name: /^Cost Center/ })).toHaveTextContent('Travel Expenses');
    const nature = within(dialog).getByRole('textbox', { name: /^Nature of Service/ });
    await expect(nature).toHaveValue('Testing');
    await expect(within(dialog).getByRole('textbox', { name: /^Location/ })).toHaveValue('Philippines');

    // Emptied, it fails; filled, it saves.
    await userEvent.clear(nature);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await expect(nature).toHaveAccessibleDescription('Nature of Service is required.');
    await expect(nature).toHaveFocus();
    await userEvent.type(nature, 'Accommodation');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await dialogClosed();
    await expect(trigger).toHaveFocus();
    const row = trigger.closest('tr')!;
    await expect(within(row).getAllByRole('cell')[1]).toHaveTextContent('Accommodation');
    await expect(args.onSave).toHaveBeenCalledWith(
      { name: 'Travel Expenses', natureOfService: 'Accommodation', location: 'Philippines' },
      expect.any(FormData),
      'edit',
    );
    await expect(await notifications(canvasElement).findByText('Cost center updated.')).toBeVisible();
  },
};

/** Step 3, open: Save with every field empty marks all three and focuses the first. */
export const ValidationErrors: Story = {
  name: 'Validation errors',
  args: { defaultDialog: 'add' },
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Add New Cost Center' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    const costCentre = within(dialog).getByRole('combobox', { name: /^Cost Center/ });
    await expect(costCentre).toHaveAccessibleDescription('Cost Center is required.');
    await expect(within(dialog).getByRole('textbox', { name: /^Nature of Service/ })).toHaveAccessibleDescription(
      'Nature of Service is required.',
    );
    await expect(within(dialog).getByRole('textbox', { name: /^Location/ })).toHaveAccessibleDescription(
      'Location is required.',
    );
    await expect(costCentre).toHaveFocus();
  },
};

/** Dark: the Add New dialog over the list. */
export const Dark: Story = {
  args: { defaultDialog: 'add' },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page; an open dialog makes it inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Add New Cost Center' });
    await waitFor(() => expect(within(dialog).getByRole('combobox', { name: /^Cost Center/ })).toHaveFocus());
  },
};
