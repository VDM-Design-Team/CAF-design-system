import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Checkbox, CHECKBOX_SIZES } from './Checkbox';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Selection Controls** (`Checkbox`). ' +
          '`size` is Figma’s Size: `16` (default) or `20`. Figma’s States are the native checkbox’s own: ' +
          'Deselected is unchecked, Selected is `checked`, Mixed-State is `indeterminate`, and Hover is hovering an unchecked box. ' +
          'It is a real `<input type="checkbox">`: give it a `<label>` or `aria-label`.',
      },
    },
  },
  args: { 'aria-label': 'Select row', onChange: fn() },
  argTypes: {
    size: { control: 'radio', options: CHECKBOX_SIZES },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Clicking toggles it, like any checkbox. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Select row' });
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await userEvent.click(box);
    await expect(box).not.toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

export const Selected: Story = { args: { defaultChecked: true } };

/** Mixed-State: e.g. a table header when only some rows are selected. Assistive tech reads it as "mixed". */
export const MixedState: Story = {
  args: { indeterminate: true },
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Select row' }) as HTMLInputElement;
    await expect(box.indeterminate).toBe(true);
    await expect(box).toBePartiallyChecked();
  },
};

/** The usual way to name it: a wrapping label. Clicking the text toggles the box. */
export const WithLabel: Story = {
  args: { 'aria-label': undefined },
  render: (args) => (
    <label className="inline-flex cursor-pointer items-center gap-2 text-body-md-regular text-text-primary">
      <Checkbox {...args} />
      Restricted user
    </label>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Restricted user'));
    await expect(canvas.getByRole('checkbox', { name: 'Restricted user' })).toBeChecked();
  },
};

/* ── Every State × Size, in Light and Dark ────────────────────────────────
   The same grid as the Figma component set: a row per Size, a column per
   State. Hover is forced with storybook-addon-pseudo-states. */

const STATES = ['deselected', 'hover', 'selected', 'mixed'] as const;
const STATE_LABEL = { deselected: 'Deselected', hover: 'Hover', selected: 'Selected', mixed: 'Mixed-State' } as const;

function Matrix() {
  return (
    <table className="border-separate border-spacing-4 text-left">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Size
          </th>
          {STATES.map((s) => (
            <th key={s} scope="col" className="text-caption-md-medium text-text-secondary">
              {STATE_LABEL[s]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CHECKBOX_SIZES.map((size) => (
          <tr key={size}>
            <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
              {size}px
            </th>
            {STATES.map((state) => (
              <td key={state}>
                <Checkbox
                  size={size}
                  aria-label={`${STATE_LABEL[state]}, ${size}px`}
                  defaultChecked={state === 'selected'}
                  indeterminate={state === 'mixed'}
                  data-pseudo={state}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => <Matrix />,
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover
  // on STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const shown = (box: HTMLInputElement) =>
      [...box.parentElement!.querySelectorAll('svg')].map((svg) => getComputedStyle(svg).display);
    await waitFor(
      () => {
        for (const row of canvasElement.querySelectorAll('tbody tr')) {
          const [rest, hover, selected, mixed] = row.querySelectorAll('input');
          // Hover has its own border; the glyphs follow the state: [check, bar].
          expect(getComputedStyle(hover).borderColor).not.toBe(getComputedStyle(rest).borderColor);
          expect(shown(rest)).toEqual(['none', 'none']);
          expect(shown(selected)).toEqual(['block', 'none']);
          expect(shown(mixed)).toEqual(['none', 'block']);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
