import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Skeleton, SKELETON_SHAPES } from './Skeleton';

/* Stories stay still: the pulse would make every snapshot differ. In the product it runs,
   except under prefers-reduced-motion. */
const still: Decorator = (Story) => <div className="[&_*]:animate-none!">{Story()}</div>;

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  decorators: [still],
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Feedback** (`Skeleton`): the loading placeholder. ' +
          '`shape` is Figma’s Shape: `line` (default), `circle` or `block`. Size it with `className`, as Figma resizes ' +
          'its instances: Line and Block fill their container’s width by default, Circle is 32×32. ' +
          'The fill is `neutral/tonal/surface/default`. It pulses in the product (not under reduced motion, and not ' +
          'in these stories) and is hidden from screen readers: mark the loading region `aria-busy`.',
      },
    },
  },
  args: { shape: 'line', className: 'w-60' },
  argTypes: { shape: { control: 'radio', options: SKELETON_SHAPES } },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/* ── Every Shape, in Light and Dark ────────────────────────────────────────
   Figma's three shapes at Figma's sizes (Line 240×12, Circle 32×32, Block
   240×80), each checked against the variable its fill is bound to. */

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

/* Figma's size and radius per Shape. */
const FIGMA = {
  line: { className: 'w-60', width: 240, height: 12, radius: 6 },
  circle: { className: '', width: 32, height: 32, radius: 16 },
  block: { className: 'w-60', width: 240, height: 80, radius: 8 },
} as const;

const shapes = (theme: 'light' | 'dark'): Story => ({
  name: `Shapes — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <table className="border-separate border-spacing-x-4 border-spacing-y-3 text-left">
      <tbody>
        {SKELETON_SHAPES.map((shape) => (
          <tr key={shape}>
            <th scope="row" className="pr-4 align-middle text-caption-md-medium text-text-secondary">
              {shape[0].toUpperCase() + shape.slice(1)}
            </th>
            <td>
              <Skeleton shape={shape} className={FIGMA[shape].className} data-shape={shape} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const fill = tokenColour('neutral-tonal-surface-default');
    await waitFor(() => {
      for (const shape of SKELETON_SHAPES) {
        const el = canvasElement.querySelector<HTMLElement>(`[data-shape="${shape}"]`)!;
        const style = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        // Fill: neutral.tonal.surface.default.
        expect(style.backgroundColor).toBe(fill);
        // Figma's size and radius (Circle: at least half its size, so it stays round).
        expect(box.width).toBe(FIGMA[shape].width);
        expect(box.height).toBe(FIGMA[shape].height);
        if (shape === 'circle') expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(16);
        else expect(style.borderTopLeftRadius).toBe(`${FIGMA[shape].radius}px`);
        // Hidden from assistive tech, and still in stories.
        expect(el).toHaveAttribute('aria-hidden', 'true');
        expect(style.animationName).toBe('none');
      }
    });
  },
});

export const ShapesLight = shapes('light');
export const ShapesDark = shapes('dark');

/* ── Sized to the content it replaces ──────────────────────────────────────
   A loading card: an avatar circle, a title line, a shorter line and a
   block. Each skeleton is sized with className, the way Figma resizes
   instances. The card is aria-busy and says what is loading. */

export const SizedByClassName: Story = {
  name: 'Sized by className',
  render: () => (
    <div
      aria-busy="true"
      aria-label="Loading announcement"
      role="group"
      className="flex w-96 flex-col gap-4 rounded-8 bg-surface-base p-6 shadow-elevation-1"
    >
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" className="size-10" data-part="avatar" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/2" data-part="title" />
          <Skeleton className="w-1/3" />
        </div>
      </div>
      <Skeleton shape="block" data-part="block" />
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const part = (name: string) => canvasElement.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
    await waitFor(() => {
      // Resized with className: a 40px circle stays round; Line takes h-4; Block fills the card.
      const avatar = part('avatar').getBoundingClientRect();
      expect(avatar.width).toBe(40);
      expect(avatar.height).toBe(40);
      expect(parseFloat(getComputedStyle(part('avatar')).borderTopLeftRadius)).toBeGreaterThanOrEqual(20);
      expect(part('title').getBoundingClientRect().height).toBe(16);
      expect(part('block').getBoundingClientRect().width).toBe(part('block').parentElement!.clientWidth - 48);
    });
  },
};
