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
          'Body/sm-regular in `text/primary`. Figma’s Label is `label`, with its colon (“ID:”), and Value is `value` ' +
          '(“32430”), `space/4` apart. The value stays on one line and ends in … when the line is narrower than it. ' +
          'TableAccountDetails stacks them.',
      },
    },
  },
  args: { label: 'Label:', value: 'Value' },
} satisfies Meta<typeof TableDetailLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/* ── In Light and Dark ─────────────────────────────────────────────────────
   The lines Figma's Account Details sets, each checked against the layout,
   text style and variable the Figma layers are bound to. */

const LINES = [
  { label: 'ID:', value: '32430' },
  { label: 'Applicant:', value: 'QA Test Bryan' },
  { label: 'Beneficiary name:', value: 'Jane Doe' },
  { label: 'IBAN Account:', value: '982389428934' },
];

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
    <div className="flex flex-col items-start">
      {LINES.map((line) => (
        <TableDetailLabel key={line.label} data-line {...line} />
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { colour: tokenColour('text-primary'), type: typeStyle('text-body-sm-regular') };
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('[data-line]')];
    await waitFor(() => {
      rows.forEach((el, i) => {
        const label = el.querySelector<HTMLElement>('[data-part="label"]')!;
        const value = el.querySelector<HTMLElement>('[data-part="value"]')!;
        // Label and Value, space/4 apart; the line reads "ID: 32430".
        expect(el.textContent).toBe(`${LINES[i].label} ${LINES[i].value}`);
        expect([label.textContent, value.textContent]).toEqual([LINES[i].label, LINES[i].value]);
        expect(getComputedStyle(el).columnGap).toBe('4px');
        expect(value.getBoundingClientRect().left - label.getBoundingClientRect().right).toBe(4);
        // Figma: both Body/sm-regular in text/primary.
        for (const text of [label, value]) {
          const { color, fontSize, lineHeight, fontWeight, letterSpacing } = getComputedStyle(text);
          expect(color).toBe(want.colour);
          expect({ fontSize, lineHeight, fontWeight, letterSpacing }).toEqual(want.type);
        }
        // Room enough: nothing is cut.
        expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth);
      });
    });
  },
});

export const LinesLight = lines('light');
export const LinesDark = lines('dark');

/* ── A value too long for its column ───────────────────────────────────────
   Figma's Value truncates on one line when the line has a fixed width: the
   value ends in …, and the label keeps its width. */
export const Truncated: Story = {
  render: () => (
    <div className="flex w-48 flex-col items-start" data-column>
      <TableDetailLabel label="Beneficiary name:" value="Geekee International Holdings Ltd" data-line="long" />
      <TableDetailLabel label="ID:" value="32430" data-line="short" />
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector<HTMLElement>('[data-column]')!;
    const long = canvasElement.querySelector<HTMLElement>('[data-line="long"]')!;
    const label = long.querySelector<HTMLElement>('[data-part="label"]')!;
    const value = long.querySelector<HTMLElement>('[data-part="value"]')!;
    // The line keeps to its column, on one 20px line.
    await expect(long.getBoundingClientRect().width).toBeLessThanOrEqual(column.getBoundingClientRect().width);
    await expect(long.getBoundingClientRect().height).toBe(20);
    // The value is cut with an ellipsis; its whole text is still there for a screen reader.
    await expect(getComputedStyle(value).textOverflow).toBe('ellipsis');
    await expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    await expect(value).toHaveTextContent('Geekee International Holdings Ltd');
    // The label isn't cut.
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
  },
};
