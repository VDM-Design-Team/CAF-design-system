import type { Meta, StoryObj } from '@storybook/react-vite';
import { useLayoutEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { FileUploadZone, fileMatchesAccept, type FileUploadZoneProps } from './FileUploadZone';

const INVOICE_HINT = 'DOC, DOCX, PDF, PNG, JPG, JPEG accepted (Max 10.0MB)';

const meta = {
  title: 'Components/FileUploadZone',
  component: FileUploadZone,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`_File Upload Zone`): the dashed drop target of ' +
          '`Form / Field – File Upload`. `title` and `hint` are Figma’s Title and Hint. It is a native ' +
          '`<input type="file">`, visually hidden but real: Tab reaches it and Enter or Space opens the dialog, ' +
          'a click anywhere on the zone does the same, and dropped files go into the input. `onFilesChange` gets ' +
          'the files; every other prop, and the ref, go to the input (`name`, `multiple`, `accept`, `disabled`). ' +
          'Figma draws no states: drag-over, focus, error and disabled are code’s (see docs/figma-sync.md). ' +
          'FileUploadField adds the label and the list of files.',
      },
    },
  },
  args: { hint: INVOICE_HINT, name: 'invoice', onFilesChange: fn(), onChange: fn() },
  argTypes: {
    title: { control: 'text' },
    hint: { control: 'text' },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="w-128">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUploadZone>;

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

/* A file of `bytes` bytes. */
const makeFile = (name: string, bytes: number, type: string) => new File([new Uint8Array(bytes)], name, { type });
const invoicePdf = () => makeFile('invoice-september.pdf', 250_880, 'application/pdf');
const receiptPng = () => makeFile('receipt-0927.png', 1_258_291, 'image/png');

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

/* A drag of `files` onto `target`: one event of the sequence. */
const drag = (target: Element, type: 'dragenter' | 'dragover' | 'dragleave' | 'drop', files: File[]) =>
  target.dispatchEvent(
    new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer(files), relatedTarget: null }),
  );

/* Counts the input's clicks (each one opens the dialog) and stops the dialog itself. */
function countClicks(input: HTMLInputElement) {
  const clicks = { count: 0 };
  input.addEventListener('click', (event) => {
    event.preventDefault();
    clicks.count += 1;
  });
  return clicks;
}

const zoneOf = (input: HTMLElement) => input.parentElement!;

/* ── Behaviour ─────────────────────────────────────────────────────────── */

/** Outside a field the Title names the input and the Hint describes it. Choosing files hands them to `onFilesChange`. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText<HTMLInputElement>('Click or drag files to upload');
    await expect(input).toHaveAttribute('type', 'file');
    await expect(input).toHaveAccessibleDescription(INVOICE_HINT);
    const file = invoicePdf();
    choose(input, [file]);
    await expect(args.onFilesChange).toHaveBeenCalledWith([file]);
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(input.files![0]).toBe(file);
  },
};

/**
 * Click anywhere on the zone to browse. From the keyboard, Tab reaches the input (the zone shows the focus
 * ring) and Enter opens the dialog. The test stops the dialog and counts the clicks that would open it.
 */
export const ClickOrKeyboardToBrowse: Story = {
  play: async ({ canvas }) => {
    const focused = tokenColour('stroke-focused');
    const input = canvas.getByLabelText<HTMLInputElement>('Click or drag files to upload');
    const zone = zoneOf(input);
    const clicks = countClicks(input);

    await userEvent.click(canvas.getByText(INVOICE_HINT));
    await expect(clicks.count).toBe(1);
    await userEvent.click(zone);
    await expect(clicks.count).toBe(2);

    await userEvent.tab();
    await expect(input).toHaveFocus();
    await waitFor(() => {
      expect(getComputedStyle(zone).outlineStyle).toBe('solid');
      expect(getComputedStyle(zone).outlineWidth).toBe('2px');
      expect(getComputedStyle(zone).outlineColor).toBe(focused);
    });
    await userEvent.keyboard('{Enter}');
    await expect(clicks.count).toBe(3);
  },
};

/**
 * Drag files over the zone and it shows the drop target (the stroke in stroke/focused). Dropping puts the files in
 * the input and hands them to `onFilesChange`: all of them with `multiple`, the first one without.
 */
export const DropFiles: Story = {
  args: { multiple: true },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <FileUploadZone {...args} title="Click or drag files to upload" />
      <FileUploadZone
        title="Click or drag CSV file to upload"
        hint="Only CSV files are accepted"
        name="csv"
        accept=".csv"
        onFilesChange={args.onFilesChange}
      />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const subtle = tokenColour('stroke-subtle');
    const focused = tokenColour('stroke-focused');
    const many = canvas.getByLabelText<HTMLInputElement>('Click or drag files to upload');
    const zone = zoneOf(many);
    const files = [invoicePdf(), receiptPng()];

    drag(zone, 'dragenter', files);
    await waitFor(() => expect(getComputedStyle(zone).borderTopColor).toBe(focused));
    await expect(zone).toHaveAttribute('data-dragging');
    await expect(getComputedStyle(zone).borderTopStyle).toBe('dashed');
    // Moving off the zone ends the drag-over look.
    drag(zone, 'dragleave', files);
    await waitFor(() => expect(getComputedStyle(zone).borderTopColor).toBe(subtle));

    drag(zone, 'dragenter', files);
    drag(zone, 'dragover', files);
    drag(zone, 'drop', files);
    await waitFor(() => expect(args.onFilesChange).toHaveBeenCalledWith(files));
    await expect(zone).not.toHaveAttribute('data-dragging');
    await expect([...many.files!].map((f) => f.name)).toEqual(['invoice-september.pdf', 'receipt-0927.png']);

    // One file only: the first dropped file is taken.
    const one = canvas.getByLabelText<HTMLInputElement>('Click or drag CSV file to upload');
    const costs = makeFile('costs-october.csv', 2_048, 'text/csv');
    drag(zoneOf(one), 'drop', [costs, makeFile('costs-november.csv', 1_024, 'text/csv')]);
    await waitFor(() => expect(args.onFilesChange).toHaveBeenLastCalledWith([costs]));
    await expect(one.files).toHaveLength(1);

    // Text dragged over the zone isn't a file: no drop target.
    const text = new DataTransfer();
    text.setData('text/plain', 'not a file');
    zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: text }));
    await expect(zone).not.toHaveAttribute('data-dragging');
  },
};

/** Disabled: no dialog, and a drop is ignored. A disabled input isn’t submitted. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    const subtle = tokenColour('text-subtle');
    const input = canvas.getByLabelText<HTMLInputElement>('Click or drag files to upload');
    const zone = zoneOf(input);
    await expect(input).toBeDisabled();
    const clicks = countClicks(input);
    await userEvent.click(zone);
    await expect(clicks.count).toBe(0);
    drag(zone, 'dragenter', [invoicePdf()]);
    drag(zone, 'drop', [invoicePdf()]);
    await expect(zone).not.toHaveAttribute('data-dragging');
    await expect(args.onFilesChange).not.toHaveBeenCalled();
    await expect(getComputedStyle(canvas.getByText('Click or drag files to upload')).color).toBe(subtle);
  },
};

/* ── A real form ─────────────────────────────────────────────────────────── */

function UploadForm() {
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
      <FileUploadZone name="invoices" multiple hint={INVOICE_HINT} aria-label="Invoices" />
      <Button type="submit">Save</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/** The files reach FormData through the native input, whether they were chosen or dropped. */
export const SubmitsWithForm: Story = {
  render: () => <UploadForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText<HTMLInputElement>('Invoices');
    const output = canvas.getByTestId('submitted');
    drag(zoneOf(input), 'drop', [invoicePdf(), receiptPng()]);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual(['invoice-september.pdf', 'receipt-0927.png']);
  },
};

/** `fileMatchesAccept`: dropped files skip `accept`, so a caller checks them with it. */
export const MatchesAccept: Story = {
  parameters: { controls: { disable: true } },
  play: async () => {
    const accept = '.doc,.docx,.pdf,.png,.jpg,.jpeg';
    await expect(fileMatchesAccept(invoicePdf(), accept)).toBe(true);
    await expect(fileMatchesAccept(makeFile('SCAN.JPG', 10, 'image/jpeg'), accept)).toBe(true);
    await expect(fileMatchesAccept(makeFile('contract.zip', 10, 'application/zip'), accept)).toBe(false);
    await expect(fileMatchesAccept(receiptPng(), 'image/*')).toBe(true);
    await expect(fileMatchesAccept(makeFile('costs.csv', 10, 'text/csv'), 'text/csv')).toBe(true);
    await expect(fileMatchesAccept(invoicePdf(), 'image/*')).toBe(false);
    await expect(fileMatchesAccept(invoicePdf(), '')).toBe(true);
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   Figma's _File Upload Zone with its Title and Hint (as in Form / Bulk
   Upload and pattern 10), then the states code adds. Focus is forced with
   storybook-addon-pseudo-states; Drag-over by a file dragged onto the zone
   as it mounts. */

/* The zone with a file held over it. */
function DraggedOver(props: FileUploadZoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    drag(ref.current!.firstElementChild!, 'dragenter', [invoicePdf()]);
  }, []);
  return (
    <div ref={ref}>
      <FileUploadZone {...props} />
    </div>
  );
}

const STATES = [
  { state: 'Default', props: {}, stroke: 'stroke-subtle', title: 'text-secondary' },
  {
    state: 'Bulk Upload',
    props: { title: 'Click or drag CSV file to upload', hint: 'Only CSV files are accepted', accept: '.csv' },
    stroke: 'stroke-subtle',
    title: 'text-secondary',
  },
  { state: 'No hint', props: { hint: undefined }, stroke: 'stroke-subtle', title: 'text-secondary' },
  { state: 'Focus', props: {}, stroke: 'stroke-subtle', title: 'text-secondary' },
  { state: 'Drag-over', props: {}, stroke: 'stroke-focused', title: 'text-secondary' },
  { state: 'Error', props: { 'aria-invalid': true }, stroke: 'accent-critical-outline-border-default', title: 'text-secondary' },
  { state: 'Disabled', props: { disabled: true }, stroke: 'stroke-subtle', title: 'text-subtle' },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {STATES.map(({ state, props }) => {
        const zone: FileUploadZoneProps = {
          hint: INVOICE_HINT,
          ...props,
          'aria-label': `${state} zone`,
          // No colour transition in the grid, so the check reads the end colour.
          className: 'transition-none',
        };
        /* data-* attributes go to the input, like every other prop. */
        const pseudo = state === 'Focus' ? 'focus-visible' : undefined;
        return (
          <div key={state} className="flex flex-col gap-2">
            <p className="text-caption-md-medium text-text-secondary">{state}</p>
            {state === 'Drag-over' ? (
              <DraggedOver {...zone} data-state={state} />
            ) : (
              <FileUploadZone {...zone} data-state={state} data-pseudo={pseudo} />
            )}
          </div>
        );
      })}
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
    const hint = tokenColour('text-subtle');
    const icon = tokenColour('text-subtle');
    const ring = tokenColour('stroke-focused');
    const want = STATES.map(({ state, props, stroke, title }) => ({
      state,
      hinted: !('hint' in props) || props.hint !== undefined,
      stroke: tokenColour(stroke),
      title: tokenColour(title),
    }));
    await waitFor(
      () => {
        for (const { state, hinted, stroke, title } of want) {
          const input = canvasElement.querySelector<HTMLInputElement>(`input[data-state="${state}"]`)!;
          const zone = zoneOf(input);
          const style = getComputedStyle(zone);
          // The zone: 1px dashed stroke, radius 8, 24px padding, no fill.
          expect(style.borderTopStyle).toBe('dashed');
          expect(style.borderTopWidth).toBe('1px');
          expect(style.borderTopColor).toBe(stroke);
          expect(style.borderTopLeftRadius).toBe('8px');
          expect(style.paddingTop).toBe('24px');
          expect(style.paddingLeft).toBe('24px');
          expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
          // Keyboard focus: the 2px stroke.focused ring, 2px out.
          if (state === 'Focus') {
            expect(style.outlineStyle).toBe('solid');
            expect(style.outlineWidth).toBe('2px');
            expect(style.outlineOffset).toBe('2px');
            expect(style.outlineColor).toBe(ring);
          } else expect(style.outlineStyle).toBe('none');
          // Icon / Upload: FileArrowUp 24px, text/subtle; 8px above the Title.
          const svg = zone.querySelector('svg')!;
          expect(getComputedStyle(svg).color).toBe(icon);
          expect(svg.getBoundingClientRect().width).toBe(24);
          const [titleNode, hintNode] = zone.querySelectorAll('p');
          expect(titleNode.getBoundingClientRect().top - svg.getBoundingClientRect().bottom).toBe(8);
          // Title: Body/sm-regular.
          expect(getComputedStyle(titleNode).color).toBe(title);
          expect(getComputedStyle(titleNode).fontSize).toBe('14px');
          expect(getComputedStyle(titleNode).fontWeight).toBe('400');
          // Hint: Caption/md-regular, text/subtle, 8px under the Title.
          if (!hinted) {
            expect(hintNode).toBeUndefined();
            continue;
          }
          expect(getComputedStyle(hintNode).color).toBe(hint);
          expect(getComputedStyle(hintNode).fontSize).toBe('12px');
          expect(hintNode.getBoundingClientRect().top - titleNode.getBoundingClientRect().bottom).toBe(8);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
