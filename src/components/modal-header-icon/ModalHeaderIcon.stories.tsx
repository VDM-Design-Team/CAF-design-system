import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ICON_NAMES } from '../icon';
import { ModalHeaderIcon } from './ModalHeaderIcon';

const meta = {
  title: 'Components/ModalHeaderIcon',
  component: ModalHeaderIcon,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Header Icon`): the 40×40 icon tile at the left of ' +
          '`Modal / Header`, radius 8, `accent.info.tonal` fill. `icon` is an Icon name (default `calendar-blank`), drawn ' +
          'at 24px. Figma fills the glyph with a raw blue that fails 3:1 on the tile; code uses ' +
          '`accent.info.tonal.content.default`, as Modal / Confirm’s icon tile does. It is decorative.',
      },
    },
  },
  args: { icon: 'calendar-blank' },
  argTypes: { icon: { control: 'select', options: ICON_NAMES } },
} satisfies Meta<typeof ModalHeaderIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/* A token's computed value in the current theme. Measure before waitFor, never inside it:
   the probe is a DOM mutation, and waitFor reruns its callback on every mutation. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/* ── The bindings, in Light and Dark ───────────────────────────────────────
   Fill accent.info.tonal.surface.default, glyph accent.info.tonal.content.default,
   40×40, radius 8, a 24px glyph. */
const bindings = (theme: 'light' | 'dark'): Story => ({
  name: `Bindings — ${theme === 'light' ? 'Light' : 'Dark'}`,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('accent-info-tonal-surface-default'),
      glyph: tokenColour('accent-info-tonal-content-default'),
    };
    const tile = canvasElement.querySelector<HTMLElement>('span[aria-hidden="true"]')!;
    const style = getComputedStyle(tile);
    await expect(style.backgroundColor).toBe(want.fill);
    await expect(style.borderRadius).toBe('8px');
    const box = tile.getBoundingClientRect();
    await expect([box.width, box.height]).toEqual([40, 40]);
    const svg = tile.querySelector('svg')!;
    await expect(getComputedStyle(svg).color).toBe(want.glyph);
    await expect(svg.getBoundingClientRect().width).toBe(24);
  },
});

export const BindingsLight = bindings('light');
export const BindingsDark = bindings('dark');
