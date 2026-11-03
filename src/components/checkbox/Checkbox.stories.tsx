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
          'Deselected is unchecked, Selected is `checked`, Mixed-State is `indeterminate`, Hover is hovering an unchecked box, ' +
          'Focus is `:focus-visible`, and Disabled / Disabled Selected are `disabled`. ' +
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

/** Disabled: it can’t be toggled. Disabled Selected keeps its check, on surface/brand/medium. */
export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
  play: async ({ args, canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Select row' });
    await expect(box).toBeDisabled();
    await userEvent.click(box, { pointerEventsCheck: 0 });
    await expect(box).toBeChecked();
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/* ── Every State × Size, in Light and Dark ────────────────────────────────
   The same grid as the Figma component set: a row per Size, a column per
   State, then two that code adds: a disabled Mixed-State and an invalid box
   (Checkbox Field's Error). Hover and Focus are forced with
   storybook-addon-pseudo-states. */

type Cell = {
  label: string;
  props: { defaultChecked?: boolean; indeterminate?: boolean; disabled?: boolean; 'aria-invalid'?: boolean };
  pseudo?: 'hover' | 'focus';
  /* Figma's bindings: fill, border (`null`: none), glyph (`null`: none shown) and its colour. */
  fill: string;
  border: string | null;
  glyph: 'check' | 'bar' | null;
  glyphColour?: string;
};

const CELLS: Cell[] = [
  { label: 'Deselected', props: {}, fill: 'surface-base', border: 'stroke-field', glyph: null },
  { label: 'Hover', props: {}, pseudo: 'hover', fill: 'surface-base', border: 'stroke-stronger', glyph: null },
  { label: 'Focus', props: {}, pseudo: 'focus', fill: 'surface-base', border: 'stroke-field', glyph: null },
  {
    label: 'Selected',
    props: { defaultChecked: true },
    fill: 'action-primary-surface-default',
    border: null,
    glyph: 'check',
    glyphColour: 'action-primary-content-default',
  },
  {
    label: 'Mixed-State',
    props: { indeterminate: true },
    fill: 'action-primary-surface-default',
    border: null,
    glyph: 'bar',
    glyphColour: 'action-primary-content-default',
  },
  {
    label: 'Disabled',
    props: { disabled: true },
    fill: 'neutral-tonal-surface-disabled',
    border: 'neutral-outline-border-disabled',
    glyph: null,
  },
  {
    label: 'Disabled Selected',
    props: { disabled: true, defaultChecked: true },
    fill: 'surface-brand-medium',
    border: null,
    glyph: 'check',
    glyphColour: 'action-primary-content-disabled',
  },
  {
    label: 'Disabled Mixed (code)',
    props: { disabled: true, indeterminate: true },
    fill: 'surface-brand-medium',
    border: null,
    glyph: 'bar',
    glyphColour: 'action-primary-content-disabled',
  },
  {
    label: 'Invalid (code)',
    props: { 'aria-invalid': true },
    fill: 'surface-base',
    border: 'accent-critical-outline-border-default',
    glyph: null,
  },
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

function Matrix() {
  return (
    <table className="border-separate border-spacing-4 text-left">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Size
          </th>
          {CELLS.map(({ label }) => (
            <th key={label} scope="col" className="text-caption-md-medium text-text-secondary">
              {label}
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
            {CELLS.map(({ label, props, pseudo }) => (
              <td key={label}>
                <Checkbox size={size} aria-label={`${label}, ${size}px`} {...props} data-cell={label} data-pseudo={pseudo} />
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
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'], focusVisible: ['[data-pseudo="focus"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover
  // and Focus on STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const none = 'rgba(0, 0, 0, 0)';
    const ring = tokenColour('stroke-focused');
    const want = Object.fromEntries(
      CELLS.map((cell) => [
        cell.label,
        {
          ...cell,
          fill: tokenColour(cell.fill),
          border: cell.border ? tokenColour(cell.border) : none,
          glyphColour: cell.glyphColour && tokenColour(cell.glyphColour),
        },
      ]),
    );
    await waitFor(
      () => {
        const boxes = canvasElement.querySelectorAll<HTMLInputElement>('input[data-cell]');
        expect(boxes).toHaveLength(CELLS.length * CHECKBOX_SIZES.length);
        for (const box of boxes) {
          const { fill, border, glyph, glyphColour, pseudo } = want[box.dataset.cell!];
          const style = getComputedStyle(box);
          // One radius in every state; the state's fill and border (none while checked).
          expect(style.borderTopLeftRadius).toBe('4px');
          expect(style.backgroundColor).toBe(fill);
          expect(style.borderTopColor).toBe(border);
          // The glyphs follow the state: [check, bar], in the state's colour.
          const [check, bar] = [...box.parentElement!.querySelectorAll('svg')];
          expect([getComputedStyle(check).display, getComputedStyle(bar).display]).toEqual([
            glyph === 'check' ? 'block' : 'none',
            glyph === 'bar' ? 'block' : 'none',
          ]);
          if (glyph) expect(getComputedStyle(glyph === 'check' ? check : bar).color).toBe(glyphColour);
          // Focus: a 2px stroke.focused ring, 2px outside the box.
          if (pseudo === 'focus') {
            expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '2px']);
            expect(style.outlineColor).toBe(ring);
          } else {
            expect(style.outlineStyle).toBe('none');
          }
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
