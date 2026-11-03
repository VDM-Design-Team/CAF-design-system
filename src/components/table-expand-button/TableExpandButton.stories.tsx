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
          'Built from the CAF Figma library, page **Table** (`Table / Expand Button`, Expanded × State): the caret ' +
          'button that opens a cost row to show its breakdown. `expanded` is Figma’s Expanded: it swaps CaretDown for ' +
          'CaretUp and sets `aria-expanded`. Point `aria-controls` at what it shows. State is the button’s own: Hover ' +
          'moves the fill to `neutral/tonal/surface/hover`, Focus shows a 2px `stroke/focused` ring 2px outside it. ' +
          '`label` is required: it is the accessible name, and it stays the same in both Expanded states.',
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

/* ── Every Expanded × State, in Light and Dark ─────────────────────────────
   The same grid as the Figma component set: Expanded false / true ×
   Default, Hover and Focus. Hover and Focus are forced with
   storybook-addon-pseudo-states. Each button is checked against the
   variables its Figma layers are bound to. */

const EXPANDED = [
  { expanded: false, glyph: 'caret-down' },
  { expanded: true, glyph: 'caret-up' },
] as const;

const STATES = ['Default', 'Hover', 'Focus'] as const;
const PSEUDO = { Default: undefined, Hover: 'hover', Focus: 'focus-visible' } as const;

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
    <table className="border-separate border-spacing-x-8 border-spacing-y-4 text-left">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Expanded
          </th>
          {STATES.map((state) => (
            <th key={state} scope="col" className="text-caption-md-medium text-text-secondary">
              {state}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {EXPANDED.map(({ expanded }) => (
          <tr key={String(expanded)}>
            <th scope="row" className="text-caption-md-medium text-text-secondary">
              {String(expanded)}
            </th>
            {STATES.map((state) => (
              <td key={state}>
                <TableExpandButton
                  label={`Show details, expanded ${expanded}, ${state}`}
                  expanded={expanded}
                  data-state={state}
                  data-pseudo={PSEUDO[state]}
                  // No colour transition in the grid, so the check reads the end colour, not a frame of the fade.
                  className="transition-none"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: {
      rootSelector: 'body',
      hover: ['[data-pseudo="hover"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover and
  // Focus on STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('neutral-tonal-surface-default'),
      hover: tokenColour('neutral-tonal-surface-hover'),
      glyph: tokenColour('text-primary'),
      focused: tokenColour('stroke-focused'),
    };
    await waitFor(
      () => {
        for (const { expanded, glyph } of EXPANDED) {
          for (const state of STATES) {
            const button = canvasElement.querySelector<HTMLElement>(
              `[aria-expanded="${expanded}"][data-state="${state}"]`,
            )!;
            const svg = button.querySelector('svg')!;
            const style = getComputedStyle(button);
            // Figma: neutral.tonal.surface.default fill (.hover on Hover), text.primary glyph, radius 4, 28×28.
            expect(style.backgroundColor).toBe(state === 'Hover' ? want.hover : want.fill);
            expect(getComputedStyle(svg).color).toBe(want.glyph);
            expect(style.borderTopLeftRadius).toBe('4px');
            const box = button.getBoundingClientRect();
            expect([box.width, box.height]).toEqual([28, 28]);
            // The 20px glyph in space/4 padding: 4px from each edge.
            const g = svg.getBoundingClientRect();
            expect([g.width, g.left - box.left, g.top - box.top]).toEqual([20, 4, 4]);
            // CaretDown when collapsed, CaretUp when expanded.
            expect(svg.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS[glyph]);
            // Focus: a 2px stroke.focused ring 2px outside the button, as Figma's Focus Ring (36×36 at −4, −4).
            if (state === 'Focus') {
              expect(style.outlineStyle).toBe('solid');
              expect(style.outlineWidth).toBe('2px');
              expect(style.outlineOffset).toBe('2px');
              expect(style.outlineColor).toBe(want.focused);
            } else {
              expect(style.outlineStyle).toBe('none');
            }
          }
        }
      },
      { timeout: 3000 },
    );
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
