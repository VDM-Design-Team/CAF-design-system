import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ICON_NAMES } from '../icon';
import { ModalHeader } from './ModalHeader';

const meta = {
  title: 'Components/ModalHeader',
  component: ModalHeader,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Header`): the header of the modals Figma composes ' +
          'by hand, such as Payment Schedules. A ModalHeaderIcon, the `title` (Body/lg-semibold) over the `description` ' +
          '(Body/sm-regular, `text.subtle`), and the close button (`IconButton icon="x"`, named "Close"), which calls ' +
          '`onClose`. 16px top and bottom, 24px sides, 12px gaps, at least 80 tall. Put it in an `Overlay` and point ' +
          '`aria-labelledby` at `titleId` (see Components/Overlay). ModalDialog and SideSheet draw their own headers.',
      },
    },
  },
  args: {
    title: 'Payment Schedules',
    description: 'Upcoming and processed payments',
    onClose: fn(),
  },
  argTypes: { icon: { control: 'select', options: ICON_NAMES } },
  // Figma's header is 512 wide, on the modal's surface.
  decorators: [
    (Story) => (
      <div className="w-128 max-w-full rounded-12 bg-surface-base">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ModalHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The close button calls `onClose`. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Close' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** No description: the title sits alone beside the icon, and nothing renders for the description. */
export const TitleOnly: Story = {
  args: { description: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('p')).toBeNull();
  },
};

/* A token's computed value in the current theme. Measure before waitFor, never inside it:
   the probe is a DOM mutation, and waitFor reruns its callback on every mutation. */
function tokenStyle(property: 'color' | 'fontSize' | 'lineHeight', value: string) {
  const probe = document.createElement('span');
  probe.style[property] = value;
  document.body.append(probe);
  const computed = getComputedStyle(probe)[property];
  probe.remove();
  return computed;
}
const tokenColour = (token: string) => tokenStyle('color', `var(--color-${token})`);

/* ── The bindings, in Light and Dark ───────────────────────────────────────
   Padding 16 / 24, gaps 12, at least 80 tall; Title Body/lg-semibold in
   text.primary, Description Body/sm-regular in text.subtle; the close glyph in
   text.secondary (IconButton Ghost). */
const bindings = (theme: 'light' | 'dark'): Story => ({
  name: `Bindings — ${theme === 'light' ? 'Light' : 'Dark'}`,
  globals: { theme },
  parameters: { controls: { disable: true } },
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      title: tokenColour('text-primary'),
      description: tokenColour('text-subtle'),
      close: tokenColour('text-secondary'),
      titleSize: tokenStyle('fontSize', 'var(--text-body-lg-semibold)'),
      descriptionSize: tokenStyle('fontSize', 'var(--text-body-sm-regular)'),
    };
    const canvas = within(canvasElement);
    const header = canvasElement.querySelector<HTMLElement>('div.min-h-20')!;
    const style = getComputedStyle(header);
    await expect([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]).toEqual([
      '16px',
      '24px',
      '16px',
      '24px',
    ]);
    await expect(style.columnGap).toBe('12px');
    await expect(header.getBoundingClientRect().height).toBeGreaterThanOrEqual(80);

    const title = canvas.getByRole('heading', { level: 2, name: 'Payment Schedules' });
    await expect(getComputedStyle(title).color).toBe(want.title);
    await expect(getComputedStyle(title).fontSize).toBe(want.titleSize);
    await expect(getComputedStyle(title).fontWeight).toBe('600');
    const description = canvas.getByText('Upcoming and processed payments');
    await expect(getComputedStyle(description).color).toBe(want.description);
    await expect(getComputedStyle(description).fontSize).toBe(want.descriptionSize);

    const close = canvas.getByRole('button', { name: 'Close' });
    await expect(getComputedStyle(close.querySelector('svg')!).color).toBe(want.close);
    await expect(close.getBoundingClientRect().width).toBe(32);
  },
});

export const BindingsLight = bindings('light');
export const BindingsDark = bindings('dark');
