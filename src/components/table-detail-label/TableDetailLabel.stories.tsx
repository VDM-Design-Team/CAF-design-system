import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { TableDetailLabel } from './TableDetailLabel';

const meta = {
  title: 'Components/TableDetailLabel',
  component: TableDetailLabel,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / Detail Label`): one “Label: Value” line, ' +
          'Body/sm-regular in `text/primary`. Figma’s Text is `children`. TableAccountDetails stacks them.',
      },
    },
  },
  args: { children: 'Label: Value' },
} satisfies Meta<typeof TableDetailLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/* ── In Light and Dark ─────────────────────────────────────────────────────
   The lines Figma's Account Details sets, each checked against the text
   style and variable the Figma layer is bound to. */

const LINES = ['ID: 32430', 'Applicant: QA Test Bryan', 'Beneficiary name: Jane Doe', 'IBAN Account: 982389428934'];

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

/* A type-ramp utility's computed font, measured the same way. */
function typeStyle(className: string) {
  const probe = document.createElement('p');
  probe.className = className;
  document.body.append(probe);
  const { fontSize, lineHeight, fontWeight, letterSpacing } = getComputedStyle(probe);
  probe.remove();
  return { fontSize, lineHeight, fontWeight, letterSpacing };
}

const lines = (theme: 'light' | 'dark'): Story => ({
  name: `Lines — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div>
      {LINES.map((line) => (
        <TableDetailLabel key={line} data-line>
          {line}
        </TableDetailLabel>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { colour: tokenColour('text-primary'), type: typeStyle('text-body-sm-regular') };
    await waitFor(() => {
      for (const el of canvasElement.querySelectorAll<HTMLElement>('[data-line]')) {
        const { color, fontSize, lineHeight, fontWeight, letterSpacing } = getComputedStyle(el);
        // Figma: Body/sm-regular in text/primary.
        expect(color).toBe(want.colour);
        expect({ fontSize, lineHeight, fontWeight, letterSpacing }).toEqual(want.type);
      }
    });
  },
});

export const LinesLight = lines('light');
export const LinesDark = lines('dark');
