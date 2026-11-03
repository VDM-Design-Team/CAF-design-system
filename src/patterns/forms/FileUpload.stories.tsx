import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../components/button';
import { EmptyState } from '../../components/empty-state';
import { FileChip, formatFileSize } from '../../components/file-chip';
import { FileUploadField } from '../../components/file-upload-field';
import { MenuItem } from '../../components/menu-item';
import { ModalDialog } from '../../components/modal-dialog';
import { ToastProvider, useToast } from '../../components/toast';
import { CostsTable } from '../costs/CostsTable';
import { bulkUploadRejections, costInvoices, costs, invoiceRules } from '../fixtures';
import { PageHeader } from '../../components/page-header';
import { BulkUploadForm } from './BulkUploadForm';
import { validateInvoice } from './NewCostForm';

/** The spies each story reports to. */
interface PatternArgs {
  /** Attach invoice's Save: the FormData. */
  onSave: (data: FormData) => void;
  /** A saved invoice's Download. */
  onDownload: (fileName: string) => void;
  /** Bulk Upload's Upload: the FormData. */
  onUpload: (data: FormData) => void;
  /** Bulk Upload's template Download. */
  onDownloadTemplate: (paymentMethod: string) => void;
  /** Start with the Invoices dialog open on a cost. */
  invoicesFor?: string;
  /** Bulk Upload: the rows the upload turns down. */
  rejectedRows?: typeof bulkUploadRejections;
  /** Bulk Upload: start with Wiretransfer and costs-november.csv chosen. */
  withCsv?: boolean;
}

const meta = {
  title: 'Patterns/File upload & attachments',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Patterns 10 and U05 (Figma 527:6028, 545:19071): files are added by dragging them in or browsing. The zone ' +
          'lists the accepted types and the size limit; each accepted file becomes a **File Chip** with its size, and × ' +
          'removes it before saving; a rejected file shows a red chip that says why, and nothing is uploaded. Saved ' +
          'invoices open from the Costs row menu (••• → View invoices) in a small dialog, each with **Download**. ' +
          '**Bulk Upload** (`src/patterns/forms/BulkUploadForm.tsx`, Form / Bulk Upload): pick the payment method, ' +
          'download its CSV template, upload the filled file, then click Upload; a Toast gives the result, and names the ' +
          'rows that failed. Built from FileUploadField, FileChip, ModalDialog, SelectField, Button and ToastProvider.',
      },
    },
  },
  args: { onSave: fn(), onDownload: fn(), onUpload: fn(), onDownloadTemplate: fn() },
} satisfies Meta<PatternArgs>;

export default meta;
type Story = StoryObj<PatternArgs>;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const makeFile = (name: string, bytes: number, type: string) => new File([new Uint8Array(bytes)], name, { type });
const invoicePdf = () => makeFile('invoice-september.pdf', 250_880, 'application/pdf');
const receiptPng = () => makeFile('receipt-0927.png', 1_258_291, 'image/png');
const contractZip = () => makeFile('contract.zip', 40_960, 'application/zip');
const costsCsv = () => makeFile('costs-november.csv', 3_482, 'text/csv');
const costsXlsx = () =>
  makeFile('costs-november.xlsx', 9_216, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

/** What the browser does when the file dialog closes with files chosen. */
function chooseFiles(input: HTMLInputElement, files: File[]) {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  input.files = data.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

const notifications = (canvasElement: HTMLElement) =>
  within(screen.getByRole('region', { name: 'Notifications' }));

/* ── Steps 1–3: attach invoices ──────────────────────────────────────────── */

/** Attach invoice as Form / New Cost places it, with the form's Save. */
function AttachInvoices({ onSave }: Pick<PatternArgs, 'onSave'>) {
  return (
    <main className="p-8">
      <form
        noValidate
        className="mx-auto flex w-full max-w-xl flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(new FormData(event.currentTarget));
        }}
      >
        <PageHeader title="Attach invoice" />
        <FileUploadField
          label="Attach invoice"
          name="invoices"
          required
          multiple
          accept={invoiceRules.accept}
          hint={invoiceRules.hint}
          validate={validateInvoice}
        />
        <Button type="submit">Save</Button>
      </form>
    </main>
  );
}

/**
 * Steps 1–3: the zone lists the accepted types and the limit. Chosen files
 * become chips with their sizes; contract.zip is turned down with the reason,
 * and isn't in the form. × removes a file and focus moves to the next ×. Save
 * sends exactly the files shown.
 */
export const AttachAndRemove: Story = {
  name: 'Attach and remove',
  render: (args) => <AttachInvoices onSave={args.onSave} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText<HTMLInputElement>(/^Attach invoice/);
    // Step 1: the zone says what it takes.
    await expect(input).toHaveAccessibleDescription(invoiceRules.hint);
    await expect(canvas.getByText('Click or drag files to upload')).toBeVisible();

    // Step 2: each file a chip with its size.
    chooseFiles(input, [invoicePdf(), receiptPng()]);
    await expect(await canvas.findByText('invoice-september.pdf')).toBeVisible();
    await expect(canvas.getByText(formatFileSize(250_880))).toHaveTextContent('245 KB');
    await expect(canvas.getByText('1.2 MB')).toBeVisible();

    // Step 3: a rejected file says why, and isn't added.
    chooseFiles(input, [contractZip()]);
    await expect(await canvas.findByText(invoiceRules.typeReason)).toBeVisible();
    await expect([...input.files!].map((f) => f.name)).toEqual(['invoice-september.pdf', 'receipt-0927.png']);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove contract.zip' }));
    await expect(canvas.queryByText('contract.zip')).toBeNull();

    // × removes the receipt before saving; focus moves to the next ×, here the previous one.
    await userEvent.click(canvas.getByRole('button', { name: 'Remove receipt-0927.png' }));
    await expect(canvas.queryByText('receipt-0927.png')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Remove invoice-september.pdf' })).toHaveFocus();

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const data = (args.onSave as ReturnType<typeof fn>).mock.calls[0][0] as FormData;
    await expect(data.getAll('invoices').map((f) => (f as File).name)).toEqual(['invoice-september.pdf']);
  },
};

/* ── Step 4: saved attachments ───────────────────────────────────────────── */

const COST_ROWS = costs.slice(0, 5);

/** The Costs list, whose ••• → View invoices opens the Invoices dialog. */
function ViewInvoicesPage({ onDownload, invoicesFor }: Pick<PatternArgs, 'onDownload' | 'invoicesFor'>) {
  const [costId, setCostId] = React.useState<string | null>(invoicesFor ?? null);
  const files = costId ? (costInvoices[costId] ?? []) : [];
  return (
    <main className="flex flex-col gap-6 p-8 pb-64">
      <PageHeader title="Costs" />
      <CostsTable
        rows={COST_ROWS}
        rowActions={(cost) => <MenuItem onClick={() => setCostId(cost.id)}>View invoices</MenuItem>}
      />
      <ModalDialog
        open={costId !== null}
        onClose={() => setCostId(null)}
        title="Invoices"
        description={`Cost #${costId} · ${files.length} ${files.length === 1 ? 'file' : 'files'}`}
        size="small"
        showFooter={false}
      >
        {files.length ? (
          <ul className="flex flex-col gap-3">
            {files.map((file) => (
              <li key={file.name}>
                <FileChip
                  fileName={file.name}
                  meta={formatFileSize(file.size)}
                  action="download"
                  onDownload={() => onDownload(file.name)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState size="compact" title="No invoices attached to this cost." />
        )}
      </ModalDialog>
    </main>
  );
}

/**
 * Step 4: Costs → ••• → View invoices opens a small dialog with the file count,
 * then a chip per file with Download. Escape closes it and focus is back on
 * the •••. A cost with no invoices says so.
 */
export const ViewInvoices: Story = {
  name: 'View invoices',
  render: (args) => <ViewInvoicesPage onDownload={args.onDownload} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Actions for cost 32430' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('menuitem', { name: 'View invoices' }));
    const dialog = await screen.findByRole('dialog', { name: 'Invoices' });
    await expect(dialog).toHaveAccessibleDescription('Cost #32430 · 2 files');
    await expect(within(dialog).getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Download receipt-0927.png' }));
    await expect(args.onDownload).toHaveBeenCalledWith('receipt-0927.png');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();

    // No invoices: the dialog says so.
    await userEvent.click(canvas.getByRole('button', { name: 'Actions for cost 32431' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'View invoices' }));
    const empty = await screen.findByRole('dialog', { name: 'Invoices' });
    await expect(empty).toHaveAccessibleDescription('Cost #32431 · 0 files');
    await expect(within(empty).getByText('No invoices attached to this cost.')).toBeVisible();
    await userEvent.click(within(empty).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/** Step 4, open: the Invoices dialog for cost #32430. */
export const InvoicesOpen: Story = {
  name: 'Invoices open',
  args: { invoicesFor: '32430' },
  render: (args) => <ViewInvoicesPage onDownload={args.onDownload} invoicesFor={args.invoicesFor} />,
  // An open dialog makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Invoices' });
    await expect(within(dialog).getByRole('button', { name: 'Download invoice-september.pdf' })).toBeVisible();
  },
};

/* ── Step 5 / U05: bulk upload ───────────────────────────────────────────── */

/** Upload's result, as a Toast (U05 step 5). Twelve rows in the file. */
function BulkUploadPage({
  onUpload,
  onDownloadTemplate,
  rejectedRows = [],
  withCsv = false,
}: Pick<PatternArgs, 'onUpload' | 'onDownloadTemplate' | 'rejectedRows' | 'withCsv'>) {
  const { toast } = useToast();
  const [defaultFiles] = React.useState(() => (withCsv ? [costsCsv()] : undefined));
  const total = 12;
  return (
    <main className="p-8">
      <BulkUploadForm
        className="mx-auto"
        defaultPaymentMethod={withCsv ? 'Wiretransfer' : undefined}
        defaultFiles={defaultFiles}
        onDownloadTemplate={onDownloadTemplate}
        onUpload={(data) => {
          onUpload(data);
          if (rejectedRows.length === 0) {
            toast({ type: 'success', message: `${total} costs uploaded.` });
            return;
          }
          const rows = rejectedRows.map(({ row, reason }) => `Row ${row}: ${reason}.`).join(' ');
          toast({
            type: 'error',
            message: `${total - rejectedRows.length} of ${total} costs uploaded. ${rows} Fix the file and upload it again.`,
          });
        }}
      />
    </main>
  );
}

const bulk = (args: PatternArgs) => (
  <ToastProvider>
    <BulkUploadPage {...args} />
  </ToastProvider>
);

/**
 * Step 5 / U05: Download asks for a payment method first, then gets its
 * template. Upload checks both fields. A spreadsheet that isn't CSV is turned
 * down in a red chip; the CSV is accepted, Upload sends the FormData, and a
 * toast gives the result.
 */
export const BulkUpload: Story = {
  name: 'Bulk upload',
  render: bulk,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Bulk Upload' })).toBeVisible();
    const method = canvas.getByRole('combobox', { name: /^Payment Method/ });
    const download = canvas.getByRole('button', { name: 'Download' });
    await expect(download).toHaveAccessibleDescription('Download CSV Template');

    // The template depends on the payment method: Download asks for one first.
    await userEvent.click(download);
    await expect(method).toHaveAccessibleDescription('Choose a payment method to get its template.');
    await expect(method).toHaveFocus();
    await expect(args.onDownloadTemplate).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await expect(method).toHaveTextContent('Wiretransfer');
    await userEvent.click(download);
    await expect(args.onDownloadTemplate).toHaveBeenCalledWith('Wiretransfer');

    // Upload with no file: the field says so and takes focus.
    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }));
    const input = canvas.getByLabelText<HTMLInputElement>(/^Upload CSV File/);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveFocus();
    await expect(args.onUpload).not.toHaveBeenCalled();

    // Only CSV: a spreadsheet shows a red chip and isn't taken.
    chooseFiles(input, [costsXlsx()]);
    await expect(await canvas.findByText('File type not supported. Upload a CSV file.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove costs-november.xlsx' }));
    chooseFiles(input, [costsCsv()]);
    await expect(await canvas.findByText('costs-november.csv')).toBeVisible();
    await expect(input).not.toHaveAttribute('aria-invalid');

    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }));
    const data = (args.onUpload as ReturnType<typeof fn>).mock.calls[0][0] as FormData;
    await expect(data.get('paymentMethod')).toBe('Wiretransfer');
    await expect((data.get('file') as File).name).toBe('costs-november.csv');
    await expect(await notifications(canvasElement).findByText('12 costs uploaded.')).toBeVisible();
  },
};

/** U05 step 5: some rows fail. The error toast names them and why, and stays until dismissed. */
export const BulkUploadRowsFail: Story = {
  name: 'Bulk upload, rows fail',
  args: { rejectedRows: bulkUploadRejections, withCsv: true },
  render: bulk,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox', { name: /^Payment Method/ })).toHaveTextContent('Wiretransfer');
    await expect(canvas.getByText('costs-november.csv')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }));
    await expect(args.onUpload).toHaveBeenCalledTimes(1);
    const message = await notifications(canvasElement).findByText(
      '10 of 12 costs uploaded. Row 4: Amount is missing. Row 9: Unknown cost center. Fix the file and upload it again.',
    );
    await expect(message.closest('[data-toast-id]')).not.toHaveAttribute('data-duration');
  },
};

/** Dark: Bulk Upload with a payment method and a CSV chosen. */
export const Dark: Story = {
  args: { withCsv: true },
  render: bulk,
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('costs-november.csv')).toBeVisible();
  },
};
