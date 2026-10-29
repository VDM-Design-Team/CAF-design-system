import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { ICON_PATHS } from '../icon/icons';
import { TableExpandButton } from './TableExpandButton';

const meta = {
  title: 'Components/TableExpandButton',
  component: TableExpandButton,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / Expand Button`): the caret button that opens a cost ' +
          'row to show its breakdown. `expanded` is the cost row’s Expanded: it swaps CaretDown for CaretUp and sets ' +
          '`aria-expanded`. Point `aria-controls` at what it shows. `label` is required: it is the accessible name, and ' +
          'it stays the same in both states.',
      },
    },
  },
  args: { label: 'Show details for cost 123456', onClick: fn() },
} satisfies Meta<typeof TableExpandButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Named by `label`, and clickable like any button. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show details for cost 123456' }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/* ── Both states, in Light and Dark ────────────────────────────────────────
   Collapsed is the component as Figma draws it; Expanded is the glyph the
   Expanded cost row swaps in. Figma has no Hover or Disabled. Each button is
   checked against the variables its Figma layers are bound to. */

const STATES = [
  { state: 'Collapsed', expanded: false, glyph: 'caret-down' },
  { state: 'Expanded', expanded: true, glyph: 'caret-up' },
] as const;

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

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex items-end gap-8">
      {STATES.map(({ state, expanded }) => (
        <div key={state} className="flex flex-col items-center gap-2">
          <span className="text-caption-md-medium text-text-secondary">{state}</span>
          <TableExpandButton label={`Show details, ${state.toLowerCase()}`} expanded={expanded} data-state={state} />
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { fill: tokenColour('neutral-tonal-surface-default'), glyph: tokenColour('text-primary') };
    await waitFor(() => {
      for (const { state, expanded, glyph } of STATES) {
        const button = canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
        const svg = button.querySelector('svg')!;
        // Figma: neutral.tonal.surface.default fill, text.primary glyph, radius 4, 28×28.
        expect(getComputedStyle(button).backgroundColor).toBe(want.fill);
        expect(getComputedStyle(svg).color).toBe(want.glyph);
        expect(getComputedStyle(button).borderTopLeftRadius).toBe('4px');
        const box = button.getBoundingClientRect();
        expect([box.width, box.height]).toEqual([28, 28]);
        // The 20px glyph, centred: 4px from each edge, as Figma renders it.
        const g = svg.getBoundingClientRect();
        expect([g.width, g.left - box.left, g.top - box.top]).toEqual([20, 4, 4]);
        // CaretDown when collapsed, CaretUp when expanded; aria-expanded says which.
        expect(svg.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS[glyph]);
        expect(button).toHaveAttribute('aria-expanded', String(expanded));
      }
    });
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');

/* ── Behaviour ─────────────────────────────────────────────────────────────
   The button doesn't own the state: the row (or whatever it opens) does, and
   passes `expanded` back. Here it opens a panel. */

function Disclosure() {
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <div className="flex flex-col items-start gap-3">
      <TableExpandButton
        label="Show details for cost 123456"
        expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((o) => !o)}
      />
      <p id={panel} hidden={!open} className="text-body-sm-regular text-text-primary">
        The cost’s breakdown goes here.
      </p>
    </div>
  );
}

/** Click, Enter or Space opens and closes what it controls; the caret and `aria-expanded` follow. */
export const Toggles: Story = {
  render: () => <Disclosure />,
  parameters: { controls: { disable: true } },
  play: async ({ canvas, canvasElement }) => {
    const button = canvas.getByRole('button', { name: 'Show details for cost 123456' });
    const panel = canvasElement.querySelector<HTMLElement>(`#${CSS.escape(button.getAttribute('aria-controls')!)}`)!;
    const glyph = () => button.querySelector('path')!.getAttribute('d');

    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).not.toBeVisible();
    await expect(glyph()).toBe(ICON_PATHS['caret-down']);

    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(glyph()).toBe(ICON_PATHS['caret-up']);

    // Keyboard: the button is in the tab order, shows the focus ring, and Enter / Space toggle it.
    button.blur();
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(getComputedStyle(button).outlineStyle).toBe('solid');
    await userEvent.keyboard('{Enter}');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).not.toBeVisible();
    await userEvent.keyboard(' ');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
  },
};
