import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FILE_CHIP_ACTIONS, FILE_CHIP_STATES, FileChip, formatFileSize } from './FileChip';

const meta = {
  title: 'Components/FileChip',
  component: FileChip,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`File Chip`): one uploaded or attached file. ' +
          '`fileName` and `meta` are Figma’s File Name and Meta (the size, or why a file was rejected); `state` is ' +
          '`default` or `error`; `action` is `remove` (the ×, shown when `onRemove` is given: Figma’s Show Remove) ' +
          'or `download` (a Tonal Button, `onDownload`). The buttons are named after the file. ' +
          '`formatFileSize(bytes)` writes the size as Figma does ("245 KB", "1.2 MB").',
      },
    },
  },
  args: { fileName: 'invoice-september.pdf', meta: '245 KB', onRemove: fn(), onDownload: fn() },
  argTypes: {
    state: { control: 'radio', options: FILE_CHIP_STATES },
    action: { control: 'radio', options: FILE_CHIP_ACTIONS },
    meta: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="w-128">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileChip>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/* The stroke drawn inside the edge (Tailwind's inset-ring), as computed box-shadow text. */
const insetStroke = (colour: string) => `${colour} 0px 0px 0px 1px inset`;

/** Action=Remove: the × is named after the file and calls `onRemove`. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText('invoice-september.pdf')).toBeVisible();
    await expect(canvas.getByText('245 KB')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove invoice-september.pdf' }));
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

/** Show Remove off: with no `onRemove`, there is no ×. */
export const WithoutRemove: Story = {
  args: { onRemove: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
  },
};

/** Action=Download (the Invoices dialog): the Download button is named after the file, and has no ×. */
export const Download: Story = {
  args: { action: 'download' },
  parameters: {
    // Button's Tonal pair is below AA in Dark (see Button); reported here, not failed.
    a11y: { test: 'todo' },
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Download invoice-september.pdf' }));
    await expect(args.onDownload).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
  },
};

/** State=Error: a rejected file says why in its Meta (pattern 10, “File rejected”). */
export const Rejected: Story = {
  args: {
    state: 'error',
    fileName: 'contract.zip',
    meta: 'File type not supported. Use DOC, DOCX, PDF, PNG, JPG or JPEG.',
  },
  play: async ({ canvas }) => {
    const critical = tokenColour('accent-critical-tonal-content-default');
    const reason = canvas.getByText('File type not supported. Use DOC, DOCX, PDF, PNG, JPG or JPEG.');
    await expect(getComputedStyle(reason).color).toBe(critical);
    await expect(canvas.getByRole('button', { name: 'Remove contract.zip' })).toBeEnabled();
  },
};

/** A long name is cut short with an ellipsis; the full name is its tooltip. The chip keeps its height. */
export const LongName: Story = {
  args: { fileName: 'cost-centre-2026-q3-invoice-for-the-philippines-office-final-version-signed-copy.pdf' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  play: async ({ args, canvas }) => {
    const name = canvas.getByText(args.fileName);
    await expect(name).toHaveAttribute('title', args.fileName);
    await expect(getComputedStyle(name).textOverflow).toBe('ellipsis');
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(name.closest('[data-state]')!.getBoundingClientRect().height).toBe(44);
  },
};

/** `formatFileSize` writes Meta as Figma’s examples do. */
export const FileSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[820, 250_880, 1_258_291, 3_221_225_472].map((bytes) => (
        <FileChip key={bytes} fileName={`file-${bytes}.pdf`} meta={formatFileSize(bytes)} />
      ))}
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    for (const text of ['820 B', '245 KB', '1.2 MB', '3.0 GB']) await expect(canvas.getByText(text)).toBeVisible();
  },
};

/* ── Every State × Action, in Light and Dark ───────────────────────────────
   The Figma component set, then each button hovered (forced with
   storybook-addon-pseudo-states). Button's Tonal pair is below AA in Dark,
   so axe's contrast check skips the Download buttons here (data-a11y-todo);
   the Download contrast stories below report them. */

const CELLS = [
  { label: 'Default, Remove', state: 'default', action: 'remove', hover: false },
  { label: 'Default, Remove · hover ×', state: 'default', action: 'remove', hover: true },
  { label: 'Error, Remove', state: 'error', action: 'remove', hover: false },
  { label: 'Error, Remove · hover ×', state: 'error', action: 'remove', hover: true },
  { label: 'Default, Download', state: 'default', action: 'download', hover: false },
  { label: 'Default, Download · hover', state: 'default', action: 'download', hover: true },
] as const;

const REASON = 'File type not supported. Use DOC, DOCX, PDF, PNG, JPG or JPEG.';

function Cells({ cells }: { cells: ReadonlyArray<(typeof CELLS)[number]> }) {
  return (
    <div className="flex flex-col gap-4">
      {cells.map(({ label, state, action, hover }) => (
        <div key={label} className="flex flex-col gap-2">
          <p className="text-caption-md-medium text-text-secondary">{label}</p>
          <div data-a11y-todo={action === 'download' ? 'contrast' : undefined}>
            <FileChip
              fileName={state === 'error' ? 'contract.zip' : 'invoice-september.pdf'}
              meta={state === 'error' ? REASON : '245 KB'}
              state={state}
              action={action}
              onRemove={() => {}}
              data-cell={label}
              data-pseudo={hover ? 'hover' : undefined}
              // No colour transition in the grid, so the check reads the end colour.
              className="[&_button]:transition-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => <Cells cells={CELLS} />,
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    // The chip carries data-pseudo; its button is the hovered element.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"] button'] },
    a11y: {
      test: 'error',
      config: {
        rules: [
          {
            id: 'color-contrast',
            selector: '*:not([data-a11y-todo~="contrast"]):not([data-a11y-todo~="contrast"] *)',
          },
        ],
      },
    },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play.
  afterEach: async ({ canvasElement }) => {
    const fill = tokenColour('surface-neutral-faint');
    const stroke = { default: tokenColour('stroke-subtle'), error: tokenColour('accent-critical-outline-border-default') };
    const name = tokenColour('text-primary');
    const subtle = tokenColour('text-subtle');
    const meta = { default: subtle, error: tokenColour('accent-critical-tonal-content-default') };
    const secondary = tokenColour('text-secondary');
    const xHover = tokenColour('neutral-tonal-surface-default');
    const tonal = [tokenColour('surface-brand-faint'), tokenColour('surface-brand-subtle')];
    const tonalLabel = tokenColour('action-primary-surface-default');
    await waitFor(
      () => {
        for (const { label, state, action, hover } of CELLS) {
          const chip = canvasElement.querySelector<HTMLElement>(`[data-cell="${label}"]`)!;
          const style = getComputedStyle(chip);
          // The chip: neutral.faint fill, 1px inside stroke, radius 8, 44px tall, 12px sides.
          expect(style.backgroundColor).toBe(fill);
          expect(style.boxShadow).toContain(insetStroke(stroke[state]));
          expect(style.borderTopLeftRadius).toBe('8px');
          expect(style.paddingLeft).toBe('12px');
          expect(chip.getBoundingClientRect().height).toBe(44);
          // Icon / File: FileText 20px, text/subtle, 12px from the edge.
          const [fileIcon] = chip.querySelectorAll('svg');
          expect(getComputedStyle(fileIcon).color).toBe(subtle);
          expect(fileIcon.getBoundingClientRect().width).toBe(20);
          expect(fileIcon.getBoundingClientRect().left - chip.getBoundingClientRect().left).toBe(12);
          // File Name: Body/sm-medium, text/primary. Meta: Caption/md-regular, 2px under it.
          const [fileName, metaNode] = chip.querySelectorAll('p');
          expect(getComputedStyle(fileName).color).toBe(name);
          expect(getComputedStyle(fileName).fontSize).toBe('14px');
          expect(getComputedStyle(fileName).fontWeight).toBe('500');
          expect(getComputedStyle(metaNode).color).toBe(meta[state]);
          expect(getComputedStyle(metaNode).fontSize).toBe('12px');
          expect(metaNode.getBoundingClientRect().top - fileName.getBoundingClientRect().bottom).toBe(2);
          const button = chip.querySelector('button')!;
          const buttonStyle = getComputedStyle(button);
          if (action === 'remove') {
            // The ×: 16px, text/subtle at rest; IconButton ghost's hover (its fill and glyph) when hovered.
            const x = button.querySelector('svg')!;
            expect(x.getBoundingClientRect().width).toBe(16);
            expect(chip.getBoundingClientRect().right - x.getBoundingClientRect().right).toBe(12);
            expect(getComputedStyle(x).color).toBe(hover ? secondary : subtle);
            expect(buttonStyle.backgroundColor).toBe(hover ? xHover : 'rgba(0, 0, 0, 0)');
          } else {
            // Download: Button / Small, Style=Tonal, with the DownloadSimple icon.
            expect(button).toHaveTextContent('Download');
            expect(button.getBoundingClientRect().height).toBe(32);
            expect(buttonStyle.backgroundColor).toBe(hover ? tonal[1] : tonal[0]);
            expect(buttonStyle.color).toBe(tonalLabel);
          }
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');

/* Download's Tonal button in each theme: its contrast is reported in the
   a11y panel, not failed, until Button's Tonal binding passes in Figma. */
const downloadContrast = (theme: 'light' | 'dark'): Story => ({
  name: `Download contrast — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => <Cells cells={CELLS.filter((cell) => cell.action === 'download')} />,
  globals: { theme },
  parameters: {
    controls: { disable: true },
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"] button'] },
    a11y: { test: 'todo' },
  },
  tags: theme === 'dark' ? ['!autodocs'] : [],
});

export const DownloadContrastLight = downloadContrast('light');
export const DownloadContrastDark = downloadContrast('dark');
