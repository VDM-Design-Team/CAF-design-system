import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { RadioOption } from './RadioOption';

const meta = {
  title: 'Components/RadioOption',
  component: RadioOption,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Selection Controls** (`Radio Option`): a Radio with its Label ' +
          'beside it. `label` is Figma’s Label and Selected is `checked` (or `defaultChecked`). It is a `<label>` ' +
          'around a native radio: a click on the text checks it. Every other prop, and the ref, go to the radio. ' +
          'RadioGroup (Form / Radio Group) renders one per option.',
      },
    },
  },
  args: { label: 'Admin', name: 'audience', value: 'admin', onChange: fn() },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof RadioOption>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/** The label names the radio, and a click on it checks the radio. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const radio = canvas.getByRole('radio', { name: 'Admin' });
    await userEvent.click(canvas.getByText('Admin'));
    await expect(radio).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

export const Selected: Story = { args: { defaultChecked: true } };

/** Disabled: the radio is at 50% and a click on the label does nothing. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByText('Admin'));
    await expect(canvas.getByRole('radio', { name: 'Admin' })).not.toBeChecked();
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/* ── Selected false / true, in Light and Dark ────────────────────────────── */

const VARIANTS = [
  { selected: false, label: 'User' },
  { selected: true, label: 'All' },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {VARIANTS.map(({ selected, label }) => (
        <RadioOption key={label} name={label} label={label} defaultChecked={selected} data-selected={selected} />
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  afterEach: async ({ canvasElement }) => {
    const text = tokenColour('text-primary');
    await waitFor(
      () => {
        for (const { selected } of VARIANTS) {
          const input = canvasElement.querySelector<HTMLInputElement>(`[data-selected="${selected}"]`)!;
          const label = input.closest('label')!;
          const radio = input.getBoundingClientRect();
          const words = document.createRange();
          words.selectNodeContents(label.lastChild!);
          const textBox = words.getBoundingClientRect();
          expect(input.checked).toBe(selected);
          // Label: Body/sm-regular, text.primary, 8px after the radio, centred on it.
          expect(getComputedStyle(label).color).toBe(text);
          expect(getComputedStyle(label).fontSize).toBe('14px');
          expect(getComputedStyle(label).fontWeight).toBe('400');
          expect(textBox.left - radio.right).toBe(8);
          // One 20px row: GDL's Body/sm line and the 20px radio share it.
          expect(label.getBoundingClientRect().height).toBe(20);
          expect(radio.top).toBe(label.getBoundingClientRect().top);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
