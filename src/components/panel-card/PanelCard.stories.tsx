import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Button } from '../button';
import { TextField } from '../text-field';
import { PanelCard } from './PanelCard';

const meta = {
  title: 'Components/PanelCard',
  component: PanelCard,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Layout** (`Card / Panel`): the surface around a form page’s form ' +
          'and the Settings page’s content. `surface/base`, a 1px `stroke/subtle` border inside, radius 12, 32px ' +
          'padding; its content (`children`) stacks 20px apart. It takes its container’s width.',
      },
    },
  },
  render: (args) => (
    <PanelCard {...args} className="max-w-xl">
      <TextField label="Name" defaultValue="QA Test" required />
      <TextField label="Email" type="email" defaultValue="qa.test@example.com" required />
      <div className="flex justify-end">
        <Button>Save</Button>
      </div>
    </PanelCard>
  ),
} satisfies Meta<typeof PanelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Settings page's card (Patterns – User U06, 545:25208): the account fields and Save. */
export const Playground: Story = {};

/* A token's computed colour in the current theme. Measure before waitFor, never inside it. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

const insetStroke = (colour: string, width: 1 | 2) => `${colour} 0px 0px 0px ${width}px inset`;

const look = (theme: 'light' | 'dark'): Story => ({
  name: `Look — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="bg-surface-canvas p-6">
      <PanelCard data-testid="card" className="max-w-xl">
        <p className="text-body-md-regular text-text-primary">First block</p>
        <p className="text-body-md-regular text-text-primary">Second block</p>
      </PanelCard>
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvas }) => {
    const want = { fill: tokenColour('surface-base'), stroke: tokenColour('stroke-subtle') };
    const card = canvas.getByTestId('card');
    await waitFor(() => {
      const style = getComputedStyle(card);
      expect(style.backgroundColor).toBe(want.fill);
      expect(style.boxShadow).toContain(insetStroke(want.stroke, 1));
      expect(style.borderRadius).toBe('12px');
      expect(style.padding).toBe('32px');
      expect(style.rowGap).toBe('20px');
      const [first, second] = card.querySelectorAll('p');
      expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBe(20);
    });
  },
});

export const LookLight = look('light');
export const LookDark = look('dark');
