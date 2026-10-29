import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Icon, ICON_NAMES, ICON_SIZES } from './Icon';

const meta = {
  title: 'Components/Icon',
  component: Icon,
  parameters: {
    docs: {
      description: {
        component:
          'A Phosphor glyph (MIT) at Regular weight, the icon set the CAF Figma library draws from. `name` is Phosphor’s ' +
          'kebab-case name (`CaretDown` → `caret-down`); `size` is 16, 20 (default), 24, 32 or 48. It takes the text colour ' +
          'around it. Decorative by default; pass `label` only when the icon alone carries the meaning. ' +
          'To add a glyph, add its name to `scripts/icons.mjs` and run `npm run icons`.',
      },
    },
  },
  args: { name: 'caret-down', size: 20 },
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    size: { control: 'radio', options: ICON_SIZES },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Colour comes from the parent: here, text.link.default. */
export const TakesTheTextColour: Story = {
  render: (args) => (
    <span className="inline-flex items-center gap-2 text-body-md-regular text-text-link-default">
      <Icon {...args} name="download-simple" />
      Download template
    </span>
  ),
};

/** Every glyph CAF ships, at 24px, with its name. */
export const Gallery: Story = {
  render: () => (
    <ul className="grid grid-cols-6 gap-4">
      {ICON_NAMES.map((name) => (
        <li key={name} className="flex flex-col items-center gap-2 text-text-primary">
          <Icon name={name} size={24} />
          <span className="text-caption-md-regular text-text-secondary">{name}</span>
        </li>
      ))}
    </ul>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const paths = canvasElement.querySelectorAll('svg path');
    await expect(paths).toHaveLength(ICON_NAMES.length);
    for (const path of paths) await expect(path.getAttribute('d')).toMatch(/^M/);
  },
};

/** The sizes Figma places icons at. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4 text-text-primary">
      {ICON_SIZES.map((size) => (
        <Icon key={size} name="calendar-blank" size={size} data-size={size} />
      ))}
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    for (const svg of canvasElement.querySelectorAll<SVGElement>('svg')) {
      await expect(svg.getBoundingClientRect().width).toBe(Number(svg.dataset.size));
    }
  },
};
