import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { fileMatchesAccept } from '../file-upload-zone';
import { FileUploadField, type FileUploadFieldProps } from './FileUploadField';

/* Pattern 10's invoice rules: the types and size limit the Hint lists. */
const INVOICE_ACCEPT = '.doc,.docx,.pdf,.png,.jpg,.jpeg';
const INVOICE_HINT = 'DOC, DOCX, PDF, PNG, JPG, JPEG accepted (Max 10.0MB)';
const TYPE_REASON = 'File type not supported. Use DOC, DOCX, PDF, PNG, JPG or JPEG.';
const SIZE_REASON = 'File is larger than 10.0MB.';
const validateInvoice = (file: File): string | undefined =>
  !fileMatchesAccept(file, INVOICE_ACCEPT)
    ? TYPE_REASON
    : file.size > 10 * 1024 * 1024
      ? SIZE_REASON
      : undefined;

const meta = {
  title: 'Components/FileUploadField',
  component: FileUploadField,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Form / Field – File Upload`): a `_Form Label` over a ' +
          '`_File Upload Zone`, with the Helper under it, then a **File Chip** for each file, as pattern 10 (“File ' +
          'upload & attachments”) shows. `label` and `required` are the label’s; `title` and `hint` the zone’s; ' +
          '`helper` is Show Helper + Helper; `error` puts the message in the Helper and the zone in its error look. ' +
          '`files` / `defaultFiles` / `onFilesChange` hold the accepted files; `validate` returns why a file is ' +
          'rejected, which shows as a State=Error chip. × removes a file. The native input always holds the files ' +
          'shown, so `name` submits them with the form. Every other prop, and the ref, go to the `<input type="file">`.',
      },
    },
  },
  args: {
    label: 'Attach invoice',
    hint: INVOICE_HINT,
    name: 'invoices',
    multiple: true,
    accept: INVOICE_ACCEPT,
    validate: validateInvoice,
    onFilesChange: fn(),
  },
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    multiple: { control: 'boolean' },
    helper: { control: 'text' },
    error: { control: 'text' },
    title: { control: 'text' },
    hint: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="w-128">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUploadField>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Test helpers ──────────────────────────────────────────────────────── */

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

/* A file of `bytes` bytes. Pattern 10's files: */
const makeFile = (name: string, bytes: number, type: string) => new File([new Uint8Array(bytes)], name, { type });
const invoicePdf = () => makeFile('invoice-september.pdf', 250_880, 'application/pdf');
const receiptPng = () => makeFile('receipt-0927.png', 1_258_291, 'image/png');
const contractZip = () => makeFile('contract.zip', 40_960, 'application/zip');

const transfer = (files: File[]) => {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  return data;
};

/* What the browser does when the dialog closes with files chosen. */
function choose(input: HTMLInputElement, files: File[]) {
  input.files = transfer(files).files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/* Files dropped on the zone. */
function drop(input: HTMLInputElement, files: File[]) {
  const zone = input.parentElement!;
  for (const type of ['dragenter', 'dragover', 'drop'])
    zone.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer(files) }));
}

const names = (input: HTMLInputElement) => [...input.files!].map((file) => file.name);

/* ── Behaviour ─────────────────────────────────────────────────────────── */

/**
 * Pattern 10, steps 1 and 2: choose files and each becomes a chip with its size, in the native input too.
 * × removes one (from the input as well) and moves focus to the next file’s ×, then back to the input.
 */
export const Playground: Story = {
  args: { required: true },
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText<HTMLInputElement>(/^Attach invoice/);
    await expect(input).toHaveAttribute('type', 'file');
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription(INVOICE_HINT);

    const [invoice, receipt] = [invoicePdf(), receiptPng()];
    choose(input, [invoice]);
    await expect(await canvas.findByText('invoice-september.pdf')).toBeVisible();
    await expect(canvas.getByText('245 KB')).toBeVisible();
    // With `multiple`, a second choice adds to the list.
    choose(input, [receipt]);
    await expect(await canvas.findByText('1.2 MB')).toBeVisible();
    await expect(args.onFilesChange).toHaveBeenLastCalledWith([invoice, receipt]);
    await waitFor(() => expect(names(input)).toEqual(['invoice-september.pdf', 'receipt-0927.png']));
    // The same file again is kept once.
    choose(input, [invoice]);
    await waitFor(() => expect(names(input)).toEqual(['invoice-september.pdf', 'receipt-0927.png']));
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);

    // × removes the file, from the list and the input, and focus moves to the next ×.
    await userEvent.click(canvas.getByRole('button', { name: 'Remove invoice-september.pdf' }));
    await expect(canvas.queryByText('invoice-september.pdf')).not.toBeInTheDocument();
    await expect(args.onFilesChange).toHaveBeenLastCalledWith([receipt]);
    await waitFor(() => expect(names(input)).toEqual(['receipt-0927.png']));
    await expect(canvas.getByRole('button', { name: 'Remove receipt-0927.png' })).toHaveFocus();
    // From the keyboard: Enter on the last × empties the list and focus goes back to the input.
    await userEvent.keyboard('{Enter}');
    await expect(canvas.queryAllByRole('listitem')).toHaveLength(0);
    await expect(input).toHaveFocus();
    await expect(input.files).toHaveLength(0);
    await expect(args.onFilesChange).toHaveBeenLastCalledWith([]);
  },
};

/**
 * Pattern 10, step 3: a file `validate` rejects shows as an Error chip that says why, and isn’t added: not to the
 * list, not to the input. The list is a polite live region, so the reason is announced. × dismisses it.
 */
export const RejectedFile: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText<HTMLInputElement>(/^Attach invoice/);
    const invoice = invoicePdf();
    drop(input, [contractZip(), invoice, makeFile('scan-0927.pdf', 11 * 1024 * 1024, 'application/pdf')]);
    const reason = await canvas.findByText(TYPE_REASON);
    await expect(canvas.getByText(SIZE_REASON)).toBeVisible();
    await expect(reason.closest('ul')).toHaveAttribute('aria-live', 'polite');
    await expect(getComputedStyle(reason).color).toBe(tokenColour('accent-critical-tonal-content-default'));
    await expect(args.onFilesChange).toHaveBeenCalledTimes(1);
    await expect(args.onFilesChange).toHaveBeenLastCalledWith([invoice]);
    await waitFor(() => expect(names(input)).toEqual(['invoice-september.pdf']));

    await userEvent.click(canvas.getByRole('button', { name: 'Remove contract.zip' }));
    await expect(canvas.queryByText(TYPE_REASON)).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Remove scan-0927.pdf' })).toHaveFocus();
    await expect(args.onFilesChange).toHaveBeenCalledTimes(1);
    await expect(names(input)).toEqual(['invoice-september.pdf']);

    // Only rejected files: nothing changes in the input.
    choose(input, [contractZip()]);
    await waitFor(() => expect(canvas.getAllByText(TYPE_REASON)).toHaveLength(1));
    await expect(names(input)).toEqual(['invoice-september.pdf']);
  },
};

/** Without `multiple` (Form / Bulk Upload’s CSV): a new file replaces the one chosen before. */
export const SingleFile: Story = {
  args: {
    label: 'Upload CSV File',
    title: 'Click or drag CSV file to upload',
    hint: 'Only CSV files are accepted',
    name: 'costs',
    accept: '.csv',
    multiple: false,
    validate: (file) => (fileMatchesAccept(file, '.csv') ? undefined : 'File type not supported. Use CSV.'),
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText<HTMLInputElement>('Upload CSV File');
    await expect(input).not.toHaveAttribute('multiple');
    await expect(input).toHaveAccessibleDescription('Only CSV files are accepted');
    const october = makeFile('costs-october.csv', 2_048, 'text/csv');
    const november = makeFile('costs-november.csv', 3_072, 'text/csv');
    choose(input, [october]);
    await expect(await canvas.findByText('costs-october.csv')).toBeVisible();
    drop(input, [november]);
    await expect(await canvas.findByText('costs-november.csv')).toBeVisible();
    await expect(canvas.queryByText('costs-october.csv')).not.toBeInTheDocument();
    await expect(args.onFilesChange).toHaveBeenLastCalledWith([november]);
    await waitFor(() => expect(names(input)).toEqual(['costs-november.csv']));
    // A rejected file leaves the chosen one in place.
    drop(input, [invoicePdf()]);
    await expect(await canvas.findByText('File type not supported. Use CSV.')).toBeVisible();
    await expect(names(input)).toEqual(['costs-november.csv']);
  },
};

function ControlledInvoices(props: Partial<FileUploadFieldProps>) {
  const [files, setFiles] = useState<File[]>(() => [invoicePdf()]);
  return (
    <div className="flex flex-col gap-3">
      <FileUploadField
        label="Attach invoice"
        hint={INVOICE_HINT}
        name="invoices"
        multiple
        validate={validateInvoice}
        files={files}
        onFilesChange={(next) => {
          props.onFilesChange?.(next);
          // At most two invoices: the parent decides.
          setFiles(next.slice(0, 2));
        }}
      />
      <p className="text-caption-md-regular text-text-secondary" data-testid="count">
        {files.length} of 2 invoices
      </p>
    </div>
  );
}

/** Controlled (`files` + `onFilesChange`): the parent keeps at most two files, and the input follows the parent. */
export const Controlled: Story = {
  render: (args) => <ControlledInvoices onFilesChange={args.onFilesChange} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText<HTMLInputElement>(/^Attach invoice/);
    await waitFor(() => expect(names(input)).toEqual(['invoice-september.pdf']));
    const scan = makeFile('scan-0927.pdf', 4_096, 'application/pdf');
    choose(input, [receiptPng(), scan]);
    await expect(args.onFilesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: 'invoice-september.pdf' }),
      expect.objectContaining({ name: 'receipt-0927.png' }),
      scan,
    ]);
    await expect(canvas.getByTestId('count')).toHaveTextContent('2 of 2 invoices');
    await expect(canvas.queryByText('scan-0927.pdf')).not.toBeInTheDocument();
    await waitFor(() => expect(names(input)).toEqual(['invoice-september.pdf', 'receipt-0927.png']));
  },
};

/** `error`: the message takes the helper’s place, the input is `aria-invalid` and the zone’s stroke turns critical. */
export const ErrorState: Story = {
  name: 'Error',
  args: { required: true, helper: 'Attach the invoice you were sent.', error: 'Attach at least one invoice.' },
  play: async ({ canvas }) => {
    const critical = tokenColour('accent-critical-outline-border-default');
    const input = canvas.getByLabelText<HTMLInputElement>(/^Attach invoice/);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(`${INVOICE_HINT} Attach at least one invoice.`);
    await expect(canvas.queryByText('Attach the invoice you were sent.')).not.toBeInTheDocument();
    await expect(getComputedStyle(input.parentElement!).borderTopColor).toBe(critical);
  },
};

/** Disabled: no dialog, no drop, and the chips have no ×. A disabled input isn’t submitted. */
export const Disabled: Story = {
  args: { disabled: true, defaultFiles: [invoicePdf()] },
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText<HTMLInputElement>(/^Attach invoice/);
    await expect(input).toBeDisabled();
    await expect(canvas.getByText('invoice-september.pdf')).toBeVisible();
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
    drop(input, [receiptPng()]);
    await expect(args.onFilesChange).not.toHaveBeenCalled();
    await expect(canvas.queryByText('receipt-0927.png')).not.toBeInTheDocument();
  },
};

function RefTarget() {
  const ref = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState('');
  useEffect(() => setTarget(`${ref.current?.tagName.toLowerCase()} type=${ref.current?.type}`), []);
  return (
    <div className="flex flex-col gap-3">
      <FileUploadField ref={ref} label="Receipt" name="receipt" />
      <output className="text-caption-md-regular text-text-secondary" data-testid="target">
        {target}
      </output>
    </div>
  );
}

/** The ref reaches the native `<input type="file">`, so a form library can register it. */
export const ForwardsRef: Story = {
  render: () => <RefTarget />,
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByTestId('target')).toHaveTextContent('input type=file'));
  },
};

/* ── A real form ───────────────────────────────────────────────────────────
   Pattern 10's “Attach invoice” in a form, submitted with FormData. */

function AttachInvoiceForm() {
  const [submitted, setSubmitted] = useState<string[] | null>(null);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(data.getAll('invoices').map((file) => (file as File).name));
      }}
    >
      <FileUploadField
        label="Attach invoice"
        name="invoices"
        required
        multiple
        accept={INVOICE_ACCEPT}
        hint={INVOICE_HINT}
        validate={validateInvoice}
      />
      <Button type="submit">Save</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/**
 * The files submit with the form, through the native input: exactly the chips shown, after adds, a rejection and a
 * remove. With no file the required field stops the submit (the browser’s own check).
 */
export const SubmitsWithForm: Story = {
  render: () => <AttachInvoiceForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText<HTMLInputElement>(/^Attach invoice/);
    const submit = canvas.getByRole('button', { name: 'Save' });
    const output = canvas.getByTestId('submitted');

    // No file: the browser stops the submit.
    await userEvent.click(submit);
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(input).toBeInvalid();

    choose(input, [invoicePdf(), contractZip()]);
    drop(input, [receiptPng(), makeFile('scan-0927.pdf', 4_096, 'application/pdf')]);
    await expect(await canvas.findByText(TYPE_REASON)).toBeVisible();
    await userEvent.click(await canvas.findByRole('button', { name: 'Remove receipt-0927.png' }));
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual(['invoice-september.pdf', 'scan-0927.pdf']);
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   The field as Figma and pattern 10 place it: the label row, the zone, the
   Helper, and the chips. Focus is forced with storybook-addon-pseudo-states. */

const STATES = [
  { state: 'Default', props: {} },
  { state: 'Required', props: { required: true } },
  { state: 'Helper', props: { helper: 'Attach the invoice you were sent.' } },
  { state: 'Focus', props: {} },
  { state: 'Error', props: { required: true, error: 'Attach at least one invoice.' } },
  { state: 'With files', props: { defaultFiles: [invoicePdf(), receiptPng()] } },
  { state: 'Disabled', props: { disabled: true, defaultFiles: [invoicePdf()] } },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      {STATES.map(({ state, props }) => (
        <FileUploadField
          key={state}
          {...props}
          label={`${state} field`}
          hint={INVOICE_HINT}
          multiple
          data-state={state}
          data-pseudo={state === 'Focus' ? 'focus-visible' : undefined}
          // No colour transition in the grid, so the check reads the end colour.
          className="[&_*]:transition-none"
        />
      ))}
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', focusVisible: ['[data-pseudo="focus-visible"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Focus on
  // STORY_RENDERED, which comes after play.
  afterEach: async ({ canvasElement }) => {
    const label = tokenColour('text-secondary');
    const marker = tokenColour('accent-critical-tonal-content-default');
    const subtle = tokenColour('text-subtle');
    const ring = tokenColour('stroke-focused');
    const stroke = { rest: tokenColour('stroke-subtle'), error: tokenColour('accent-critical-outline-border-default') };
    const want = STATES.map(({ state, props }) => ({
      state,
      required: 'required' in props,
      message: 'error' in props || 'helper' in props,
      error: 'error' in props,
      files: 'defaultFiles' in props ? props.defaultFiles.length : 0,
      removable: !('disabled' in props),
    }));
    await waitFor(
      () => {
        for (const { state, required, message, error, files, removable } of want) {
          const input = canvasElement.querySelector<HTMLInputElement>(`input[data-state="${state}"]`)!;
          const zone = input.parentElement!;
          const field = zone.parentElement!;
          const root = field.parentElement!;
          // The label: Body/sm-regular, text.secondary, the marker when Required; 20px above the zone.
          const labelNode = field.querySelector('label')!;
          expect(labelNode).toHaveAttribute('for', input.id);
          expect(getComputedStyle(labelNode).color).toBe(label);
          expect(getComputedStyle(labelNode).fontSize).toBe('14px');
          const star = labelNode.querySelector('[aria-hidden]');
          if (required) expect(getComputedStyle(star!).color).toBe(marker);
          else expect(star).toBeNull();
          expect(zone.getBoundingClientRect().top - labelNode.getBoundingClientRect().bottom).toBe(20);
          // The zone fills the field: the dashed stroke (critical with an error), the ring when focused.
          expect(zone.getBoundingClientRect().width).toBe(root.getBoundingClientRect().width);
          expect(getComputedStyle(zone).borderTopColor).toBe(error ? stroke.error : stroke.rest);
          expect(getComputedStyle(zone).outlineStyle).toBe(state === 'Focus' ? 'solid' : 'none');
          if (state === 'Focus') expect(getComputedStyle(zone).outlineColor).toBe(ring);
          // The Helper (or the error in its place): Caption/md-regular, text.subtle, right under the zone.
          const note = [...field.children].find((node) => node.tagName === 'P') as HTMLElement | undefined;
          if (message) {
            expect(getComputedStyle(note!).color).toBe(subtle);
            expect(getComputedStyle(note!).fontSize).toBe('12px');
            expect(note!.getBoundingClientRect().top).toBe(zone.getBoundingClientRect().bottom);
          } else expect(note).toBeUndefined();
          // The chips: 12px under the field, 12px apart, as wide as the field.
          const chips = [...root.querySelectorAll<HTMLElement>('li > [data-state]')];
          expect(chips).toHaveLength(files);
          let above = field.getBoundingClientRect().bottom;
          for (const chip of chips) {
            const box = chip.getBoundingClientRect();
            expect(box.top - above).toBe(12);
            expect(box.width).toBe(root.getBoundingClientRect().width);
            expect(box.height).toBe(44);
            expect(chip.querySelector('button') !== null).toBe(removable);
            above = box.bottom;
          }
          if (!files) expect(root.getBoundingClientRect().bottom).toBe(field.getBoundingClientRect().bottom);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
