import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ToastProvider, useToast } from '../../components/toast';
import { sampleBreakdowns } from '../fixtures';
import { NewCostForm, type NewCostFormProps } from './NewCostForm';

/* The calendars open on 1 November 2026, the dates patterns 09 and U02 draw. */
const TODAY = new Date(2026, 10, 1);

/** Save confirms with a toast, as U02 says ("Save submits the cost for review"). */
function Form({ onSubmit, ...props }: NewCostFormProps) {
  const { toast } = useToast();
  return (
    <NewCostForm
      className="mx-auto"
      today={TODAY}
      onSubmit={(data) => {
        onSubmit?.(data);
        toast({ type: 'success', message: 'Cost submitted for review.' });
      }}
      {...props}
    />
  );
}

/** The page: one main landmark, the toasts' live region beside it. */
function Screen(props: NewCostFormProps) {
  return (
    <ToastProvider>
      <main className="p-8">
        <Form {...props} />
      </main>
    </ToastProvider>
  );
}

const meta = {
  title: 'Patterns/Multi-section form',
  component: NewCostForm,
  render: (args) => <Screen {...args} />,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Patterns 09 and U02 (Figma 527:5661, 545:17897): creating a cost is the longest form in the product, a full ' +
          'page in titled sections built on **Form / New Cost** (`src/patterns/forms/NewCostForm.tsx`). **Form / Tab ' +
          'Navigation** switches Single Cost and Recurring Cost: Recurring adds “Recurring Details” at the top (Starts ' +
          'At, Frequency Value and Unit, and a live summary) and drops Invoice number; what was typed is kept. Applicant ' +
          'name and Email are pre-filled from the account. Breakdowns → “Add new” opens the **Cost Breakdown** dialog, ' +
          'checked on its own; each saved breakdown is a **Card / Breakdown Item** with Edit and Remove. **Save** checks ' +
          'every section, shows each message in place and focuses the first; when it passes, the FormData goes to ' +
          '`onSubmit` and a Toast confirms it. **Save to Drafts** keeps the cost as it is (pattern U03).',
      },
    },
  },
  args: { onSubmit: fn(), onSaveDraft: fn(), onEditCurrency: fn() },
} satisfies Meta<typeof NewCostForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const makeFile = (name: string, bytes: number, type: string) => new File([new Uint8Array(bytes)], name, { type });

/** What the browser does when the file dialog closes with files chosen. */
function chooseFiles(input: HTMLInputElement, files: File[]) {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  input.files = data.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Chooses `option` in a select (a combobox button) by clicking. */
async function choose(scope: HTMLElement, label: RegExp, option: string) {
  await userEvent.click(within(scope).getByRole('combobox', { name: label }));
  await userEvent.click(within(scope).getByRole('option', { name: option }));
}

/** Adds a breakdown through the Cost Breakdown dialog. */
async function addBreakdown(form: HTMLElement, title: string, amount: string) {
  await userEvent.click(within(form).getByRole('button', { name: 'Add new' }));
  const dialog = await screen.findByRole('dialog', { name: 'Cost Breakdown' });
  const titleField = within(dialog).getByRole('textbox', { name: /^Title/ });
  await waitFor(() => expect(titleField).toHaveFocus());
  await userEvent.type(titleField, title);
  await choose(dialog, /^Cost Center/, 'Employee Expenses');
  await choose(dialog, /^Nature of Service/, 'Salary');
  await userEvent.type(within(dialog).getByRole('combobox', { name: /^Location/ }), 'phil');
  await userEvent.click(within(dialog).getByRole('option', { name: 'Philippines' }));
  within(dialog).getByRole('combobox', { name: /^Period From/ }).focus();
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Enter}');
  within(dialog).getByRole('combobox', { name: /^Period To/ }).focus();
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}{Enter}');
  await userEvent.type(within(dialog).getByRole('textbox', { name: /^Amount/ }), amount);
  await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
}

/* ── Stories ─────────────────────────────────────────────────────────────── */

/**
 * Steps 1, 3 and 4 (Single Cost): Save with the cost half done marks every
 * section that needs something and focuses the first (Currency). Filled in,
 * with an invoice and a breakdown, Save sends the FormData and a toast
 * confirms it.
 */
export const SingleCost: Story = {
  name: 'Single cost',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvasElement.querySelector('form')!;
    await expect(canvas.getByRole('heading', { level: 1, name: 'New Cost' })).toBeVisible();
    await expect(canvas.getByRole('tab', { name: 'Single Cost' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel', { name: 'Single Cost' })).toBeVisible();
    // Step 2 (U02): pre-filled from the account.
    await expect(canvas.getByRole('textbox', { name: /^Applicant name/ })).toHaveValue('QA Test');
    await expect(canvas.getByRole('textbox', { name: /^Email/ })).toHaveValue('qa.test@example.com');
    // The sections, in order, under the page's heading.
    await expect(canvas.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Beneficiary Information',
      'Breakdowns',
    ]);
    // [Edit] beside Currency opens Manage Currencies.
    await userEvent.click(canvas.getByRole('button', { name: '[Edit] Currency' }));
    await expect(args.onEditCurrency).toHaveBeenCalledTimes(1);

    // Save checks every section and focuses the first error.
    await userEvent.type(canvas.getByRole('textbox', { name: /^Invoice number/ }), 'INV-2026-0501');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const currency = canvas.getByRole('combobox', { name: /^Currency/ });
    await expect(currency).toHaveAccessibleDescription('Currency is required.');
    await expect(currency).toHaveFocus();
    await expect(canvas.getByRole('combobox', { name: /^Select Partner/ })).toHaveAccessibleDescription('Partner is required.');
    await expect(canvas.getByRole('combobox', { name: /^Payment method/ })).toHaveAccessibleDescription(
      'Payment method is required.',
    );
    const invoices = canvas.getByLabelText<HTMLInputElement>(/^Attach invoice/);
    await expect(invoices).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Add at least one breakdown.');
    await expect(args.onSubmit).not.toHaveBeenCalled();

    // Fix them: Currency from the keyboard (typing jumps to “US Dollar”), then the rest.
    await userEvent.keyboard('u');
    await userEvent.keyboard('{Enter}');
    await expect(currency).toHaveTextContent('US Dollar');
    await expect(currency).not.toHaveAttribute('aria-invalid');
    await choose(form, /^Select Partner/, 'Jane Doe');
    await choose(form, /^Payment method/, 'Wiretransfer');
    chooseFiles(invoices, [makeFile('invoice-september.pdf', 250_880, 'application/pdf')]);
    await expect(await canvas.findByText('invoice-september.pdf')).toBeVisible();
    await expect(invoices).not.toHaveAttribute('aria-invalid');
    await addBreakdown(form, 'Breakdown 1', '900');
    await expect(canvas.queryByRole('alert')).toBeNull();
    const list = canvas.getByRole('list', { name: 'Breakdowns' });
    await expect(within(list).getByText('USD 900')).toBeVisible();

    // Save sends the FormData, and a toast confirms it.
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    const data = (args.onSubmit as ReturnType<typeof fn>).mock.calls[0][0] as FormData;
    await expect(data.get('type')).toBe('single');
    await expect(data.get('applicantName')).toBe('QA Test');
    await expect(data.get('invoiceNumber')).toBe('INV-2026-0501');
    await expect(data.get('currency')).toBe('USD');
    await expect(data.get('partner')).toBe('Jane Doe');
    await expect(data.get('paymentMethod')).toBe('Wiretransfer');
    await expect(data.getAll('invoices').map((f) => (f as File).name)).toEqual(['invoice-september.pdf']);
    await expect(data.getAll('breakdown').map((b) => JSON.parse(String(b)))).toEqual([
      {
        title: 'Breakdown 1',
        costCentre: 'Employee Expenses',
        natureOfService: 'Salary',
        location: 'Philippines',
        periodFrom: '2026-11-01',
        periodTo: '2026-11-30',
        amount: 900,
      },
    ]);
    await expect(await canvas.findByText('Cost submitted for review.')).toBeVisible();
  },
};

/**
 * Step 2: ← / → switch the tabs. Recurring inserts “Recurring Details” at the
 * top and drops Invoice number; what was typed below is kept. The summary
 * follows Frequency Value and Unit. Save starts its checks at Starts At.
 */
export const RecurringCost: Story = {
  name: 'Recurring cost',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvasElement.querySelector('form')!;
    const applicant = canvas.getByRole('textbox', { name: /^Applicant name/ });
    await userEvent.clear(applicant);
    await userEvent.type(applicant, 'QA Test Bryan');
    await choose(form, /^Payment method/, 'SEPA');

    canvas.getByRole('tab', { name: 'Single Cost' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    const recurringTab = canvas.getByRole('tab', { name: 'Recurring Cost' });
    await expect(recurringTab).toHaveAttribute('aria-selected', 'true');
    await expect(recurringTab).toHaveFocus();
    await expect(canvas.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Recurring Details',
      'Cost Details',
      'Beneficiary Information',
      'Breakdowns',
    ]);
    await expect(canvas.queryByRole('textbox', { name: /^Invoice number/ })).toBeNull();
    // Kept across the switch.
    await expect(canvas.getByRole('textbox', { name: /^Applicant name/ })).toHaveValue('QA Test Bryan');
    await expect(canvas.getByRole('combobox', { name: /^Payment method/ })).toHaveTextContent('SEPA');

    // The live summary.
    const summary = canvas.getByRole('status');
    await expect(summary).toHaveTextContent('This will recur every 1 month');
    const every = canvas.getByRole('spinbutton', { name: /^Frequency Value/ });
    await userEvent.clear(every);
    await userEvent.type(every, '3');
    await choose(form, /^Frequency Unit/, 'Week');
    await expect(canvas.getByRole('status')).toHaveTextContent('This will recur every 3 weeks');

    // Save checks Recurring Details first. A recurring cost needs no invoice up front.
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const startsAt = canvas.getByRole('combobox', { name: /^Starts At/ });
    await expect(startsAt).toHaveAccessibleDescription('Starts At is required.');
    await expect(startsAt).toHaveFocus();
    await expect(canvas.getByLabelText(/^Attach invoice/)).not.toHaveAttribute('aria-invalid');
    await expect(args.onSubmit).not.toHaveBeenCalled();
    // ↓ opens the calendar on today; Enter takes it.
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await expect(startsAt).toHaveTextContent('2026-11-01');
    await expect(startsAt).not.toHaveAttribute('aria-invalid');

    // ← goes back to Single Cost: Invoice number returns, the rest is kept.
    recurringTab.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('textbox', { name: /^Invoice number/ })).toBeVisible();
    await expect(canvas.queryByRole('heading', { name: 'Recurring Details' })).toBeNull();
    await expect(canvas.getByRole('textbox', { name: /^Applicant name/ })).toHaveValue('QA Test Bryan');
  },
};

/**
 * Step 4: saved breakdowns as cards with a ••• menu. Edit opens the dialog
 * pre-filled (its button says Update) and focus comes back to the •••. Remove
 * takes a card out and moves focus to the next •••, then to Add new.
 */
export const EditAndRemoveBreakdowns: Story = {
  name: 'Edit and remove breakdowns',
  args: { defaultValues: { currency: 'USD' }, defaultBreakdowns: sampleBreakdowns },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Breakdowns' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    await expect(within(list).getByText('Employee Expenses · Salary · Philippines')).toBeVisible();

    // Edit Breakdown 2.
    const second = canvas.getByRole('button', { name: 'Actions for Breakdown 2' });
    await userEvent.click(second);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cost Breakdown' });
    await expect(within(dialog).getByRole('textbox', { name: /^Title/ })).toHaveValue('Breakdown 2');
    await expect(within(dialog).getByRole('combobox', { name: /^Cost Center/ })).toHaveTextContent('Travel Expenses');
    const amount = within(dialog).getByRole('textbox', { name: /^Amount/ });
    await expect(amount).toHaveValue('350');
    await userEvent.clear(amount);
    await userEvent.type(amount, '0');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Update' }));
    await expect(amount).toHaveAccessibleDescription('Enter an amount greater than 0.');
    await userEvent.clear(amount);
    await userEvent.type(amount, '400');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(second).toHaveFocus();
    await expect(within(list).getByText('USD 400')).toBeVisible();

    // Remove Breakdown 1: focus moves to Breakdown 2's •••.
    await userEvent.click(canvas.getByRole('button', { name: 'Actions for Breakdown 1' }));
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Remove' }));
    await expect(canvas.queryByText('Breakdown 1')).toBeNull();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Actions for Breakdown 2' })).toHaveFocus());

    // Remove the last: focus moves to Add new.
    await userEvent.keyboard('{Enter}');
    const menu = await canvas.findByRole('menu', { name: 'Actions for Breakdown 2' });
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Edit' })).toHaveFocus());
    await userEvent.keyboard('{End}{Enter}');
    await expect(canvas.queryByRole('list', { name: 'Breakdowns' })).toBeNull();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Add new' })).toHaveFocus());
  },
};

/** Step 3, open: the Cost Breakdown dialog over the form. */
export const CostBreakdownDialog: Story = {
  name: 'Cost Breakdown dialog',
  args: { defaultBreakdownDialogOpen: true },
  // An open dialog makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Cost Breakdown' });
    await waitFor(() => expect(within(dialog).getByRole('textbox', { name: /^Title/ })).toHaveFocus());
    // Period From and Period To side by side, as Figma draws them (from the sm breakpoint).
    const from = within(dialog).getByRole('combobox', { name: /^Period From/ }).getBoundingClientRect();
    const to = within(dialog).getByRole('combobox', { name: /^Period To/ }).getBoundingClientRect();
    await expect(window.innerWidth < 640 ? to.top > from.bottom : Math.abs(to.top - from.top) < 1).toBe(true);
  },
};

/** Dark: the Recurring Cost form with two breakdowns. */
export const Dark: Story = {
  args: {
    defaultType: 'recurring',
    defaultValues: { currency: 'USD', paymentMethod: 'Wiretransfer', startsAt: '2026-11-01' },
    defaultBreakdowns: sampleBreakdowns,
  },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Recurring Cost' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent('This will recur every 1 month');
  },
};
