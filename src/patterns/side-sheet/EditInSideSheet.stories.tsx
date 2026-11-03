import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ToastProvider } from '../../components/toast';
import { RecurringCostsPage, type RecurringCostsPageProps } from './RecurringCostsPage';

/* The calendars open on 1 November 2026, the period pattern 09 draws. */
const TODAY = new Date(2026, 10, 1);

/** The page: one main landmark, the toasts' live region beside it. Room under the table for its menus. */
function Screen(props: RecurringCostsPageProps) {
  return (
    <ToastProvider>
      <main className="p-8 pb-64">
        <RecurringCostsPage today={TODAY} {...props} />
      </main>
    </ToastProvider>
  );
}

const meta = {
  title: 'Patterns/Edit in a side sheet',
  component: RecurringCostsPage,
  render: (args) => <Screen {...args} />,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern 06 (Figma 524:3609): long or multi-section records, like a recurring cost with its schedule and ' +
          'breakdowns, are edited in a **Panel / Side Sheet** that slides in from the right, with the list dimmed ' +
          'behind it. **Edit** (first in the row menu) opens “Edit Recurring Cost #1882”: Recurring Details, ' +
          'Breakdowns (**Card / Breakdown Item**s; “Add new” opens the Cost Breakdown dialog over the sheet) and Notes. ' +
          'The body scrolls; the header and the footer (Cancel, Update) stay put. **Update** checks the fields, saves, ' +
          'closes the sheet, refreshes the row and shows a success **Toast**. ×, Cancel and Escape close without ' +
          'saving, and ask first when something changed. Built from SideSheet, FormSectionHeader, TextField, ' +
          'SelectField, DateField, TextareaField, BreakdownItem, ModalDialog, ModalConfirm and ToastProvider ' +
          '(`src/patterns/side-sheet/`, `src/patterns/forms/BreakdownsSection.tsx`).',
      },
    },
  },
  args: { onUpdate: fn() },
} satisfies Meta<typeof RecurringCostsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const notifications = (canvasElement: HTMLElement) =>
  within(screen.getByRole('region', { name: 'Notifications' }));

const SHEET = 'Edit Recurring Cost #1882';

/** Opens #1882's menu and chooses Edit. */
async function openEdit(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const trigger = canvas.getByRole('button', { name: 'Actions for recurring cost #1882' });
  await userEvent.click(trigger);
  const menu = screen.getByRole('menu', { name: 'Actions for recurring cost #1882' });
  await userEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
  const sheet = await screen.findByRole('dialog', { name: SHEET });
  await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));
  return { trigger, sheet };
}

/** Chooses `option` in a select (a combobox button) by clicking. */
async function choose(scope: HTMLElement, label: RegExp, option: string) {
  await userEvent.click(within(scope).getByRole('combobox', { name: label }));
  await userEvent.click(within(scope).getByRole('option', { name: option }));
}

/**
 * Steps 1–3: Edit is first in the row menu and opens the sheet with the
 * record. An emptied Frequency Value is caught on Update. The frequency
 * changes to every 1 month, and "Add new" adds Breakdown 2 through the Cost
 * Breakdown dialog (checked on its own: Add with nothing filled marks the
 * fields). Update closes the sheet, the row shows the new frequency, a toast
 * confirms it, and focus is back on the row’s •••.
 */
export const EditAndUpdate: Story = {
  name: 'Edit and update',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole('button', { name: 'Actions for recurring cost #1882' }).closest('tr')!;
    await expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('3 weeks');

    // Step 1: the menu, in Figma's order.
    await userEvent.click(within(row).getByRole('button', { name: 'Actions for recurring cost #1882' }));
    const menu = screen.getByRole('menu', { name: 'Actions for recurring cost #1882' });
    await expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Edit',
      'View Schedules',
      'Stop',
      'Delete',
    ]);
    await userEvent.keyboard('{Escape}');

    // Step 2: the sheet, with the record's values.
    const { trigger, sheet } = await openEdit(canvasElement);
    const value = within(sheet).getByRole('spinbutton', { name: /^Frequency Value/ });
    await expect(value).toHaveValue(3);
    await expect(within(sheet).getByRole('combobox', { name: /^Frequency Unit/ })).toHaveTextContent('Week');
    await expect(within(sheet).getByRole('combobox', { name: /^Starts At/ })).toHaveTextContent('2026-07-30');
    await expect(within(sheet).getByRole('combobox', { name: /^Payment Method/ })).toHaveTextContent('YourSafe');
    await expect(within(sheet).getByRole('heading', { level: 3, name: 'Recurring Details' })).toBeVisible();
    await expect(within(sheet).getByRole('heading', { level: 3, name: 'Breakdowns' })).toBeVisible();
    const list = within(sheet).getByRole('list', { name: 'Breakdowns' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    await expect(within(list).getByText('USD 900')).toBeVisible();
    // The footer stays in view under the scrolling body.
    const update = within(sheet).getByRole('button', { name: 'Update' });
    await expect(update.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);

    // An emptied required field is caught, in place.
    await userEvent.clear(value);
    await userEvent.click(update);
    await expect(value).toHaveAccessibleDescription('Enter a whole number of 1 or more.');
    await expect(value).toHaveFocus();
    await userEvent.type(value, '1');
    await choose(sheet, /^Frequency Unit/, 'Month');

    // Add new → the Cost Breakdown dialog over the sheet, focus on Title.
    const add = within(sheet).getByRole('button', { name: 'Add new' });
    await userEvent.click(add);
    const dialog = await screen.findByRole('dialog', { name: 'Cost Breakdown' });
    const title = within(dialog).getByRole('textbox', { name: /^Title/ });
    await waitFor(() => expect(title).toHaveFocus());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    await expect(title).toHaveAccessibleDescription('Title is required.');
    await expect(within(dialog).getByRole('textbox', { name: /^Amount/ })).toHaveAccessibleDescription(
      'Amount is required.',
    );
    await expect(title).toHaveFocus();

    await userEvent.type(title, 'Breakdown 2');
    await choose(dialog, /^Cost Center/, 'Travel Expenses');
    await choose(dialog, /^Nature of Service/, 'Testing');
    await userEvent.type(within(dialog).getByRole('combobox', { name: /^Location/ }), 'phil');
    await userEvent.click(within(dialog).getByRole('option', { name: 'Philippines' }));
    // The period from the keyboard: ↓ opens on today (1 November), Enter takes it.
    within(dialog).getByRole('combobox', { name: /^Period From/ }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    within(dialog).getByRole('combobox', { name: /^Period To/ }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}{Enter}');
    await expect(within(dialog).getByRole('combobox', { name: /^Period To/ })).toHaveTextContent('2026-11-30');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /^Amount/ }), '350');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

    // Back in the sheet: the new card, focus on Add new.
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Cost Breakdown' })).toBeNull());
    await expect(add).toHaveFocus();
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    await expect(within(list).getByText('Travel Expenses · Testing · Philippines')).toBeVisible();
    await expect(within(list).getByText('2026-11-01 - 2026-11-30')).toBeVisible();
    await expect(within(list).getByText('USD 350')).toBeVisible();

    // Step 3: Update saves, closes, refreshes the row and confirms.
    await userEvent.click(update);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('1 month');
    await expect(await notifications(canvasElement).findByText('Recurring cost #1882 updated.')).toBeVisible();
    const [id, update1, data] = (args.onUpdate as ReturnType<typeof fn>).mock.calls[0];
    await expect(id).toBe('1882');
    await expect(update1).toMatchObject({ frequency: { value: 1, unit: 'Month' }, startsAt: '2026-07-30', paymentMethod: 'YourSafe' });
    await expect((data as FormData).getAll('breakdown').map((b) => JSON.parse(String(b)).title)).toEqual([
      'Recurring 1',
      'Breakdown 2',
    ]);
  },
};

/**
 * Step 5: ×, Cancel and Escape close without saving. With nothing changed the
 * sheet just closes; after a change they ask first. “Keep editing” goes back
 * to the sheet, Discard closes it and the row is unchanged.
 */
export const DiscardChanges: Story = {
  name: 'Discard changes',
  play: async ({ args, canvasElement }) => {
    // Nothing changed: × closes at once.
    let { trigger, sheet } = await openEdit(canvasElement);
    await userEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();

    // A change, then Escape: asked first.
    ({ trigger, sheet } = await openEdit(canvasElement));
    const notes = within(sheet).getByRole('textbox', { name: 'Notes' });
    await userEvent.type(notes, 'Monthly team salary, split by cost center.');
    await userEvent.keyboard('{Escape}');
    let confirm = await screen.findByRole('alertdialog', { name: 'Discard changes?' });
    await expect(confirm).toHaveAccessibleDescription('Your changes to recurring cost #1882 won’t be saved.');
    await waitFor(() => expect(within(confirm).getByRole('button', { name: 'Keep editing' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(screen.getByRole('dialog', { name: SHEET })).toBeInTheDocument();
    await expect(notes).toHaveValue('Monthly team salary, split by cost center.');
    await expect(notes).toHaveFocus();

    // Cancel asks too; Discard closes, nothing saved.
    await userEvent.click(within(sheet).getByRole('button', { name: 'Cancel' }));
    confirm = await screen.findByRole('alertdialog', { name: 'Discard changes?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(args.onUpdate).not.toHaveBeenCalled();
    await expect(within(canvasElement).queryByRole('status')).toBeNull();
  },
};

/** Step 2, open: the side sheet over the dimmed list. */
export const SheetOpen: Story = {
  name: 'Sheet open',
  args: { defaultEditing: '1882' },
  // An open sheet makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const sheet = await screen.findByRole('dialog', { name: SHEET });
    // Against the right edge, full height.
    const box = sheet.getBoundingClientRect();
    await expect(Math.abs(box.right - document.documentElement.clientWidth)).toBeLessThan(1);
    await expect(Math.abs(box.height - window.innerHeight)).toBeLessThan(1);
  },
};

/** Dark: the side sheet over the list. */
export const Dark: Story = {
  args: { defaultEditing: '1882' },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async () => {
    await expect(await screen.findByRole('dialog', { name: SHEET })).toBeVisible();
  },
};
