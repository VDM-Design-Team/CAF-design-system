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
          'Built from the CAF Figma library, page **Buttons** (`Button / Icon`): the icon-only button for refresh, close, ' +
          'theme, trash and the table row’s •••. `size` is 32 (default) or 40; `tone` is `ghost` (default), `tonal` or ' +
          '`destructive`; Hover is `:hover`. `icon` is an Icon name. `label` is required: it is the accessible name.',
      },
    },
  },
  args: { icon: 'dots-three', label: 'Row actions', onClick: fn() },
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

/** The glyphs Figma's description names: refresh, close, theme, trash. */
export const InUse: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <IconButton icon="arrows-clockwise" label="Refresh" />
      <IconButton icon="x" label="Close" />
      <IconButton icon="moon" label="Switch to dark theme" size={40} />
      <IconButton icon="trash" label="Remove feature" tone="destructive" />
      <IconButton icon="dots-three" label="Row actions" />
    </div>
  ),
  parameters: { controls: { disable: true } },
};

/* ── Every Size × Tone × State, in Light and Dark ──────────────────────────
   The same grid as the Figma component set. Hover is forced with
   storybook-addon-pseudo-states and checked against Figma's bindings. */

const STATES = ['default', 'hover'] as const;

/* Figma's bindings per tone: [fill at rest, fill on hover, glyph]. `null` is no fill. */
const BOUND = {
  ghost: [null, 'neutral-tonal-surface-default', 'text-secondary'],
  tonal: ['surface-base', 'neutral-tonal-surface-default', 'text-primary'],
  destructive: [null, 'accent-critical-tonal-surface-default', 'accent-critical-tonal-content-default'],
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
                {tone[0].toUpperCase() + tone.slice(1)}, {state === 'default' ? 'Default' : 'Hover'}
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
                    icon="dots-three"
                    label={`${tone} ${state}, ${size}`}
                    size={size}
                    tone={tone}
                    data-tone={tone}
                    data-pseudo={state}
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
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const none = 'rgba(0, 0, 0, 0)';
    const want = Object.fromEntries(
      Object.entries(BOUND).map(([tone, [rest, hover, glyph]]) => [
        tone,
        [rest ? tokenColour(rest) : none, tokenColour(hover), tokenColour(glyph)],
      ]),
    );
    await waitFor(
      () => {
        for (const button of canvasElement.querySelectorAll<HTMLElement>('button[data-tone]')) {
          const [rest, hover, glyph] = want[button.dataset.tone!];
          const style = getComputedStyle(button);
          expect(style.backgroundColor).toBe(button.dataset.pseudo === 'hover' ? hover : rest);
          expect(getComputedStyle(button.querySelector('svg')!).color).toBe(glyph);
          // Size 32 → 16px glyph, 40 → 20px.
          const box = button.getBoundingClientRect().width;
          expect(button.querySelector('svg')!.getBoundingClientRect().width).toBe(box === 40 ? 20 : 16);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const TonesLight = grid('light');
export const TonesDark = grid('dark');
