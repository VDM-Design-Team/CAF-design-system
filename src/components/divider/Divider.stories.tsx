import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Divider } from './Divider';

const meta = {
  title: 'Components/Divider',
  component: Divider,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Layout** (`Divider`): a plain 1px rule in `stroke/subtle`. ' +
          '`orientation` is Figma’s Orientation: `horizontal` (default, the width of its container) or `vertical` ' +
          '(1 × 32, e.g. between a page’s title and its tabs). It is a `role="separator"`; give a purely visual one ' +
          '`aria-hidden`.',
      },
    },
  },
  argTypes: { orientation: { control: 'radio', options: ['horizontal', 'vertical'] } },
  render: (args) => (
    <div className="flex h-12 w-80 items-center justify-center">
      <Divider {...args} />
    </div>
  ),
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

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

/* ── Both orientations, in Light and Dark ──────────────────────────────── */

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Orientations — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex w-80 flex-col gap-3">
        <p className="text-caption-md-medium text-text-secondary">Horizontal</p>
        <Divider data-orientation="horizontal" />
      </div>
      <div className="flex items-center gap-5">
        <p className="text-heading-xl-bold text-text-primary">Costs</p>
        <Divider orientation="vertical" data-orientation="vertical" />
        <p className="text-caption-md-medium text-text-secondary">Vertical, between a title and its tabs</p>
      </div>
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const stroke = tokenColour('stroke-subtle');
    const horizontal = canvasElement.querySelector<HTMLElement>('[data-orientation="horizontal"]')!;
    const vertical = canvasElement.querySelector<HTMLElement>('[data-orientation="vertical"]')!;
    await expect(horizontal).toHaveAttribute('role', 'separator');
    await expect(horizontal).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
    await waitFor(() => {
      // Horizontal: a 1px top stroke, as wide as its container (320).
      const h = getComputedStyle(horizontal);
      expect(h.borderTopColor).toBe(stroke);
      expect([h.borderTopWidth, h.borderLeftWidth, h.borderBottomWidth]).toEqual(['1px', '0px', '0px']);
      expect(horizontal.getBoundingClientRect().height).toBe(1);
      expect(horizontal.getBoundingClientRect().width).toBe(320);
      // Vertical: 1 × 32, a 1px left stroke.
      const v = getComputedStyle(vertical);
      expect(v.borderLeftColor).toBe(stroke);
      expect([v.borderLeftWidth, v.borderTopWidth]).toEqual(['1px', '0px']);
      const box = vertical.getBoundingClientRect();
      expect([box.width, box.height]).toEqual([1, 32]);
    });
  },
});

export const OrientationsLight = grid('light');
export const OrientationsDark = grid('dark');
