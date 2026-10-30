import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Radio } from './Radio';

const meta = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Selection Controls** (`Radio`). Figma’s States are the native ' +
          'radio’s own: Deselected is unchecked, Hover is hovering an unchecked radio, Selected is `checked` and ' +
          'Disabled is `disabled`. Radios that share a `name` are one group (arrow keys move between them). Name it ' +
          'with a `<label>` or `aria-label`; RadioOption adds Figma’s label and RadioGroup the whole group.',
      },
    },
  },
  args: { 'aria-label': 'All', name: 'audience', value: 'all', onChange: fn() },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Radio>;

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

/* The stroke drawn inside the edge (Tailwind's inset-ring), as computed box-shadow text. */
const insetStroke = (colour: string, width: 1 | 2) => `${colour} 0px 0px 0px ${width}px inset`;

/** A click checks it; a second click doesn’t uncheck it (a radio is unchecked by choosing another). */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const radio = canvas.getByRole('radio', { name: 'All' });
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

export const Selected: Story = { args: { defaultChecked: true } };

/** Disabled: it can’t be checked or focused. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    const radio = canvas.getByRole('radio', { name: 'All' });
    await expect(radio).toBeDisabled();
    await userEvent.click(radio);
    await expect(radio).not.toBeChecked();
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** Tab reaches it and shows the stroke/focused ring (code’s; Figma has no Focus); Space checks it. */
export const Keyboard: Story = {
  play: async ({ args, canvas }) => {
    const radio = canvas.getByRole('radio', { name: 'All' });
    const focused = tokenColour('stroke-focused');
    await userEvent.tab();
    await expect(radio).toHaveFocus();
    await waitFor(() => {
      const style = getComputedStyle(radio);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineOffset).toBe('2px');
      expect(style.outlineColor).toBe(focused);
    });
    await userEvent.keyboard(' ');
    await expect(radio).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

/* ── Every State, in Light and Dark ────────────────────────────────────────
   Figma's four States, plus Disabled while checked, which Figma doesn't draw.
   Hover is forced with storybook-addon-pseudo-states. */

const STATES = [
  { state: 'Deselected', props: {}, stroke: ['stroke-strong', 1], dot: false, opacity: '1' },
  { state: 'Hover', props: {}, stroke: ['stroke-focused', 1], dot: false, opacity: '1' },
  { state: 'Selected', props: { defaultChecked: true }, stroke: ['action-primary-surface-default', 2], dot: true, opacity: '1' },
  { state: 'Disabled', props: { disabled: true }, stroke: ['stroke-strong', 1], dot: false, opacity: '0.5' },
  {
    state: 'Disabled, selected',
    props: { disabled: true, defaultChecked: true },
    stroke: ['action-primary-surface-default', 2],
    dot: true,
    opacity: '0.5',
  },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {STATES.map(({ state, props }) => (
        <div key={state} className="flex items-center gap-4">
          {/* Each radio is its own group, so the Selected ones stay checked. */}
          <Radio
            {...props}
            name={state}
            aria-label={state}
            data-state={state}
            data-pseudo={state === 'Hover' ? 'hover' : undefined}
          />
          <span className="text-caption-md-regular text-text-secondary">{state}</span>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play.
  afterEach: async ({ canvasElement }) => {
    const fill = tokenColour('surface-elevated-secondary');
    const dotFill = tokenColour('action-primary-surface-default');
    const want = STATES.map(({ state, stroke: [token, width], dot, opacity }) => ({
      state,
      stroke: insetStroke(tokenColour(token), width),
      dot,
      opacity,
    }));
    await waitFor(
      () => {
        for (const { state, stroke, dot, opacity } of want) {
          const input = canvasElement.querySelector<HTMLInputElement>(`[data-state="${state}"]`)!;
          const marker = input.nextElementSibling!;
          const style = getComputedStyle(input);
          const box = input.getBoundingClientRect();
          // 20 × 20, a circle, surface.elevated-secondary, with the state's stroke inside the edge.
          expect([box.width, box.height]).toEqual([20, 20]);
          expect(style.borderRadius).toBe('1000px');
          expect(style.backgroundColor).toBe(fill);
          expect(style.boxShadow).toContain(stroke);
          // Selected's dot: 8px, centred, action.primary.surface.
          expect(getComputedStyle(marker).display).toBe(dot ? 'block' : 'none');
          if (dot) {
            const d = marker.getBoundingClientRect();
            expect([d.width, d.height]).toEqual([8, 8]);
            expect([d.left - box.left, d.top - box.top]).toEqual([6, 6]);
            expect(getComputedStyle(marker).backgroundColor).toBe(dotFill);
          }
          // Disabled: the whole radio at 50%.
          expect(getComputedStyle(input.parentElement!).opacity).toBe(opacity);
          // Forced colours keep the stroke and the dot, so the radio doesn't vanish in High Contrast.
          expect(getComputedStyle(input.parentElement!).forcedColorAdjust).toBe('none');
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
