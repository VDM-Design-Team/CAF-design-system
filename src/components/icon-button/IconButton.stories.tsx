import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { ICON_NAMES } from '../icon';
import { IconButton, ICON_BUTTON_SIZES, ICON_BUTTON_TONES } from './IconButton';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    docs: {
      description: {
        component:
          'The new CAF design’s icon-only button, for refresh, close, download, delete and the table row’s •••. ' +
          '`size` is 36 (default), 32 (inside a field, an alert or a toast) or 40 (the header); `tone` is `ghost` (default), ' +
          '`tonal` or `destructive`; Hover is `:hover` and Disabled is `disabled` (the glyph in text/disabled, no hover). ' +
          '`icon` is an Icon name. `label` is required: it is the accessible name, and a tooltip with the same words shows ' +
          'on hover and keyboard focus (`tooltipPlacement` puts it below; `tooltip={false}` turns it off).',
      },
    },
  },
  args: { icon: 'more', label: 'Row actions', onClick: fn() },
  argTypes: {
    icon: { control: 'select', options: ICON_NAMES },
    size: { control: 'radio', options: ICON_BUTTON_SIZES },
    tone: { control: 'radio', options: ICON_BUTTON_TONES },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Named by `label`, and clickable like any button. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Row actions' }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** In use: refresh, close, download, delete, the row's •••. */
export const InUse: Story = {
  render: () => (
    <div className="flex items-center gap-2 pt-10">
      <IconButton icon="retry" label="Refresh" />
      <IconButton icon="close" label="Close" />
      <IconButton icon="download" label="Download invoice" />
      <IconButton icon="delete" label="Remove line" tone="destructive" />
      <IconButton icon="more" label="More actions" />
    </div>
  ),
  parameters: { controls: { disable: true } },
};

/**
 * The tooltip repeats the label, on hover and on keyboard focus, and Escape hides it. It only
 * repeats the name, so screen readers don't hear it twice: the button isn't described by it.
 */
export const Tooltip: Story = {
  args: { label: 'Download invoice', icon: 'download' },
  render: (args) => (
    <div className="pt-10">
      <IconButton {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const button = canvas.getByRole('button', { name: 'Download invoice' });
    await expect(button).not.toHaveAttribute('aria-describedby');
    const tip = () => canvasElement.querySelector<HTMLElement>('[data-tooltip-body]')!.parentElement!;
    await userEvent.hover(button);
    await waitFor(() => expect(tip()).toBeVisible());
    await expect(tip()).toHaveTextContent('Download invoice');
    await expect(tip()).toHaveAttribute('aria-hidden', 'true');
    await userEvent.unhover(button);
    await waitFor(() => expect(tip()).not.toBeVisible());
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(tip()).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tip()).not.toBeVisible());
  },
};

/** `tooltip={false}`: no tooltip, where something else names the button (a caret inside a field). */
export const NoTooltip: Story = {
  name: 'Without a tooltip',
  args: { tooltip: false },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Row actions' }));
    await expect(canvasElement.querySelector('[data-tooltip-body]')).toBeNull();
  },
};

/** Disabled: the glyph in text/disabled, and a click does nothing. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Row actions' });
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/* ── Every Size × Tone × State, in Light and Dark ──────────────────────────
   Hover is forced with storybook-addon-pseudo-states and checked against the
   tokens. The Disabled cells are hovered too: a disabled button shows no hover. */

const STATES = ['default', 'hover', 'disabled'] as const;
const STATE_LABEL = { default: 'Default', hover: 'Hover', disabled: 'Disabled' } as const;

/* The tokens per tone: [fill at rest, fill on hover, glyph at rest, glyph on hover]. `null` is
   no fill. Disabled keeps the fill at rest and draws the glyph in text/disabled. */
const BOUND = {
  ghost: [null, 'action-secondary-surface-hover', 'text-secondary', 'text-primary'],
  tonal: ['surface-base', 'action-secondary-surface-hover', 'text-primary', 'text-primary'],
  destructive: [
    null,
    'accent-critical-tonal-surface-default',
    'accent-critical-tonal-content-default',
    'accent-critical-tonal-content-hover',
  ],
} as const;

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

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Tones — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <table className="border-separate border-spacing-4 text-left">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Size
          </th>
          {ICON_BUTTON_TONES.flatMap((tone) =>
            STATES.map((state) => (
              <th key={`${tone}-${state}`} scope="col" className="text-caption-md-medium text-text-secondary">
                {tone[0].toUpperCase() + tone.slice(1)}, {STATE_LABEL[state]}
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody>
        {ICON_BUTTON_SIZES.map((size) => (
          <tr key={size}>
            <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
              {size}
            </th>
            {ICON_BUTTON_TONES.flatMap((tone) =>
              STATES.map((state) => (
                <td key={`${tone}-${state}`}>
                  <IconButton
                    icon="more"
                    label={`${tone} ${state}, ${size}`}
                    size={size}
                    tone={tone}
                    data-tone={tone}
                    data-pseudo={state}
                    disabled={state === 'disabled'}
                    // The grid needs no tooltips, and className then lands on the button.
                    tooltip={false}
                    // No colour transition in the grid, so the check reads the end colour, not a frame of the fade.
                    className="transition-none"
                  />
                </td>
              )),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]', '[data-pseudo="disabled"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const none = 'rgba(0, 0, 0, 0)';
    const disabledGlyph = tokenColour('text-disabled');
    const want = Object.fromEntries(
      Object.entries(BOUND).map(([tone, [rest, hover, glyph, hoverGlyph]]) => [
        tone,
        [rest ? tokenColour(rest) : none, tokenColour(hover), tokenColour(glyph), tokenColour(hoverGlyph)],
      ]),
    );
    await waitFor(
      () => {
        for (const button of canvasElement.querySelectorAll<HTMLElement>('button[data-tone]')) {
          const [rest, hover, glyph, hoverGlyph] = want[button.dataset.tone!];
          const style = getComputedStyle(button);
          const state = button.dataset.pseudo;
          expect(style.backgroundColor).toBe(state === 'hover' ? hover : rest);
          expect(getComputedStyle(button.querySelector('svg')!).color).toBe(
            state === 'disabled' ? disabledGlyph : state === 'hover' ? hoverGlyph : glyph,
          );
          // Size 32 → 16px glyph, 36 and 40 → 20px.
          const box = button.getBoundingClientRect().width;
          expect(button.querySelector('svg')!.getBoundingClientRect().width).toBe(box === 32 ? 16 : 20);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const TonesLight = grid('light');
export const TonesDark = grid('dark');
