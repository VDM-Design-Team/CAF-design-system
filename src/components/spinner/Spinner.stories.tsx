import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Spinner, SPINNER_SIZES } from './Spinner';

/* Stories stay still: a turning ring would make every snapshot differ. In the product it
   turns, except under prefers-reduced-motion. */
const still: Decorator = (Story) => <div className="[&_*]:animate-none!">{Story()}</div>;

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  decorators: [still],
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Feedback** (`Spinner`): the loading indicator. `size` is Figma’s ' +
          'Size: `16` (default), `24` or `32`. The track is `neutral/tonal/surface/default` and the indicator ' +
          '`action/primary/surface/default`. It turns in the product (not under reduced motion, and not in these ' +
          'stories). It is a `role="status"` region with a visually hidden `label` (default "Loading"): say what is loading.',
      },
    },
  },
  args: { size: 16, label: 'Loading' },
  argTypes: { size: { control: 'radio', options: SPINNER_SIZES } },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await expect(status).toHaveTextContent('Loading');
  },
};

/* ── Every Size, in Light and Dark ─────────────────────────────────────────
   Figma's three sizes, each checked for its box, its ring's colours (the
   variables Figma binds) and its thickness, an eighth of the size. */

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

const sizes = (theme: 'light' | 'dark'): Story => ({
  name: `Sizes — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex items-center gap-6">
      {SPINNER_SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Spinner size={size} label={`Loading, size ${size}`} data-size={size} />
          <span className="text-caption-md-medium text-text-secondary">{size}</span>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      track: tokenColour('neutral-tonal-surface-default'),
      indicator: tokenColour('action-primary-surface-default'),
    };
    await waitFor(() => {
      for (const size of SPINNER_SIZES) {
        const status = canvasElement.querySelector<HTMLElement>(`[data-size="${size}"]`)!;
        const svg = status.querySelector('svg')!;
        const [track, indicator] = [status.querySelector('circle')!, status.querySelector('path')!];
        // A status region named by its hidden label.
        expect(status).toHaveAttribute('role', 'status');
        expect(status).toHaveTextContent(`Loading, size ${size}`);
        // Figma's box: 16, 24 or 32.
        expect(status.getBoundingClientRect().width).toBe(size);
        expect(status.getBoundingClientRect().height).toBe(size);
        // Track and indicator colours.
        expect(getComputedStyle(track).stroke).toBe(want.track);
        expect(getComputedStyle(indicator).stroke).toBe(want.indicator);
        // The ring is an eighth of the size thick (Figma's 75% inner radius): 2 units of 16.
        expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
        expect(track.getAttribute('stroke-width')).toBe('2');
        // Still in stories.
        expect(getComputedStyle(svg).animationName).toBe('none');
      }
    });
  },
});

export const SizesLight = sizes('light');
export const SizesDark = sizes('dark');

/* ── On the screens ────────────────────────────────────────────────────────
   Figma's pattern 11, "Loading a dialog": the body of a dialog shows a 24px
   Spinner and "Loading…" (Body/sm-regular, text/tertiary) until its content
   arrives. The Spinner's label says what is loading. */

export const InADialogBody: Story = {
  name: 'In a dialog body',
  render: () => (
    <div className="w-128 rounded-12 bg-surface-base shadow-elevation-3">
      <p className="px-6 pt-5 text-body-lg-semibold text-text-primary">Export Details</p>
      <div className="flex flex-col items-center gap-3 px-6 py-14">
        <Spinner size={24} label="Loading export details" />
        <p aria-hidden="true" className="text-body-sm-regular text-text-tertiary">
          Loading…
        </p>
      </div>
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await expect(status).toHaveTextContent('Loading export details');
  },
};
