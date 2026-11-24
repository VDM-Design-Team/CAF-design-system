import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Icon, ICON_ALIASES, ICON_NAMES, ICON_SIZES } from './Icon';

const meta = {
  title: 'Components/Icon',
  component: Icon,
  parameters: {
    docs: {
      description: {
        component:
          'CAF Icons v1.4: a 24-unit grid, 2px round lines, an open ring on outlined circles. `name` is the icon’s name ' +
          '(`chevron-down`, `delete`, `search`); the old Phosphor names still work as deprecated aliases (`caret-down`). ' +
          'A few Phosphor glyphs with no CAF counterpart yet (`funnel`, `tray`, `tag` …) still draw as Phosphor. ' +
          '`size` is 16, 20 (default), 24, 32 or 48. It takes the text colour around it. Decorative by default; pass ' +
          '`label` only when the icon alone carries the meaning. To add or redraw one, edit `icons/caf/<name>.svg` and ' +
          'run `npm run icons`.',
      },
    },
  },
  args: { name: 'chevron-down', size: 20 },
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

/** Every icon, at 24px, with its name: CAF Icons v1.4, then the Phosphor glyphs not redrawn yet. */
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
    const svgs = canvasElement.querySelectorAll('svg');
    await expect(svgs).toHaveLength(ICON_NAMES.length);
    // Every icon draws something, and none carries its own colour.
    for (const svg of svgs) {
      await expect(svg.children.length).toBeGreaterThan(0);
      await expect(svg.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  },
};

/** Old Phosphor names still work: each draws its CAF icon. Deprecated; use the CAF name. */
export const Aliases: Story = {
  render: () => (
    <ul className="grid grid-cols-4 gap-4">
      {Object.entries(ICON_ALIASES).map(([old, to]) => (
        <li key={old} className="flex items-center gap-2 text-text-primary">
          <Icon name={old as keyof typeof ICON_ALIASES} size={24} />
          <span className="text-caption-md-regular text-text-secondary">
            {old} → {to}
          </span>
        </li>
      ))}
    </ul>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const svgs = [...canvasElement.querySelectorAll<SVGElement>('svg')];
    await expect(svgs.map((svg) => svg.dataset.icon)).toEqual(Object.values(ICON_ALIASES));
  },
};

/** The sizes icons are placed at. The line scales with the icon. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4 text-text-primary">
      {ICON_SIZES.map((size) => (
        <Icon key={size} name="calendar" size={size} data-size={size} />
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
