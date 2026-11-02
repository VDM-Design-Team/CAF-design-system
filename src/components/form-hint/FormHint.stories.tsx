import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import { ICON_NAMES } from '../icon';
import { SelectField } from '../select-field';
import { FormHint } from './FormHint';

const meta = {
  title: 'Components/FormHint',
  component: FormHint,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`_Form Hint`): an inline note under a field, such as ' +
          '“This will recur every 3 weeks” under Frequency, or why a button is disabled. An Info 16 glyph (`icon`, the ' +
          'Icon swap) and one line of Caption/md-regular (`children`, the Hint text), both text/subtle, space.8 apart. ' +
          'Place it space.8 under its field. Pass `role="status"` when it follows what the user types.',
      },
    },
  },
  args: { children: 'This will recur every 3 weeks' },
  argTypes: { icon: { control: 'select', options: ICON_NAMES } },
  render: (args) => (
    // Figma's hint is 510 wide, as the form's fields.
    <div className="w-128">
      <FormHint {...args} />
    </div>
  ),
} satisfies Meta<typeof FormHint>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A token's computed colour in the current theme. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** The note as Figma draws it. The icon is decorative: the text is the hint. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const hint = canvas.getByText('This will recur every 3 weeks').closest('p')!;
    await expect(hint.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(hint).not.toHaveAttribute('role');
  },
};

const UNITS = ['Day', 'Week', 'Month'];

function FrequencyWithHint() {
  const [unit, setUnit] = useState('Week');
  return (
    // Figma's example (766:3040): the field, then the hint space.8 under it.
    <div className="flex w-128 flex-col gap-2">
      <SelectField label="Frequency" options={UNITS} value={unit} onValueChange={setUnit} aria-describedby="frequency-hint" />
      <FormHint id="frequency-hint" role="status">{`This will recur every 3 ${unit.toLowerCase()}s`}</FormHint>
    </div>
  );
}

/**
 * Under a field, as Figma places it (766:3040): space.8 below Frequency, which it describes (`aria-describedby`).
 * It follows the field, so it is a polite live region (`role="status"`).
 */
export const UnderAField: Story = {
  name: 'Under a field',
  render: () => <FrequencyWithHint />,
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Frequency' });
    const hint = canvas.getByRole('status');
    await expect(field).toHaveAccessibleDescription('This will recur every 3 weeks');
    await expect(hint.getBoundingClientRect().top - field.getBoundingClientRect().bottom).toBe(8);
    await userEvent.click(field);
    await userEvent.click(canvas.getByRole('option', { name: 'Month' }));
    await expect(hint).toHaveTextContent('This will recur every 3 months');
  },
};

/* ── In Light and Dark ─────────────────────────────────────────────────────
   Figma's _Form Hint: the Info glyph and the text, both text/subtle; the icon swapped;
   and a hint long enough to wrap. Checked against the bindings and the auto layout. */

const HINTS = [
  { name: 'Default', icon: undefined, text: 'This will recur every 3 weeks' },
  { name: 'Icon swapped', icon: 'clock' as const, text: 'Payments run at 09:00 on the due day' },
  {
    name: 'Wraps',
    icon: undefined,
    text: 'Download template stays disabled until a payment method is chosen, because the template lists that method’s columns.',
  },
];

const states = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex w-128 flex-col gap-6">
      {HINTS.map(({ name, icon, text }) => (
        <FormHint key={name} icon={icon} data-hint={name}>
          {text}
        </FormHint>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const subtle = tokenColour('text-subtle');
    for (const { name } of HINTS) {
      const hint = canvasElement.querySelector<HTMLElement>(`[data-hint="${name}"]`)!;
      const icon = hint.querySelector('svg')!;
      const text = hint.querySelector('span')!;
      const style = getComputedStyle(hint);
      // Caption/md-regular (12 / 16) in text.subtle; the 16px glyph takes the same colour.
      await expect(style.color).toBe(subtle);
      await expect(getComputedStyle(icon).color).toBe(subtle);
      await expect([style.fontSize, style.lineHeight, style.fontWeight]).toEqual(['12px', '16px', '400']);
      const i = icon.getBoundingClientRect();
      const t = text.getBoundingClientRect();
      await expect([i.width, i.height]).toEqual([16, 16]);
      // space.8 from the glyph to the text; the text fills the row; the glyph is centred on it.
      await expect(t.left - i.right).toBe(8);
      await expect(t.right).toBe(hint.getBoundingClientRect().right);
      await expect(Math.abs(i.top + i.height / 2 - (t.top + t.height / 2))).toBeLessThan(0.6);
      // One line, except the long one, which wraps.
      await expect(t.height > 16).toBe(name === 'Wraps');
    }
  },
});

export const StatesLight = states('light');
export const StatesDark = states('dark');
