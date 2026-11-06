import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { ICON_PATHS } from '../icon/icons';
import { FilterClear } from './FilterClear';

const meta = {
  title: 'Components/FilterClear',
  component: FilterClear,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Filters** (`Filter / Clear`, since 5 Nov 2026): Clear Filters, the ' +
          'filter bar’s reset action. An Outlined Button (Normal) with ArrowsClockwise and the label “Clear Filters”, ' +
          'in a box as tall as Filter / Field, so it lines up with the fields. It sits at the bar’s right end and shows ' +
          'only while a filter is in use: when nothing is filtered, leave it out rather than disable it. Pressing it ' +
          'resets every filter, and the bar moves focus to the search field. Hover, Pressed, Focus and Disabled are the ' +
          'button’s own states; Disabled is for a list that is busy loading. In a pattern, FilterBar’s `showClear` ' +
          '(Filter / Bar’s Show Clear) renders it.',
      },
    },
  },
  args: { onClick: fn() },
  argTypes: { disabled: { control: 'boolean' } },
} satisfies Meta<typeof FilterClear>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A click calls `onClick`; a disabled one ignores it. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Clear Filters' });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/* ── Every State, on the canvas and on the filter bar, in Light and Dark ────
   The Figma set's five variants: Default, Hover, Pressed, Focus, Disabled.
   Hover, Pressed and Focus are forced with storybook-addon-pseudo-states, so
   Chromatic snapshots them too, and every cell is checked against Button /
   Normal Outlined's bindings in that state, and the box against Figma's. The
   second row sits on the bar's surface.neutral.faint, as the review frame's
   "In a filter bar" row (863:3465). */

const STATES = ['default', 'hover', 'pressed', 'focus', 'disabled'] as const;
type State = (typeof STATES)[number];
const STATE_LABEL: Record<State, string> = {
  default: 'Default',
  hover: 'Hover',
  pressed: 'Pressed',
  focus: 'Focus',
  disabled: 'Disabled',
};

/* Figma's bindings per State (the nested Button_Normal): [fill, label and icon, 1px inside stroke].
   Focus is the Default look plus the ring. */
const BOUND: Record<Exclude<State, 'focus'>, readonly [string, string, string]> = {
  default: ['action-secondary-surface-default', 'action-secondary-content-default', 'action-secondary-border-default'],
  hover: ['action-secondary-surface-hover', 'action-secondary-content-hover', 'action-secondary-border-hover'],
  pressed: ['action-secondary-surface-pressed', 'action-secondary-content-pressed', 'action-secondary-border-pressed'],
  disabled: ['action-secondary-surface-disabled', 'neutral-outline-content-disabled', 'neutral-outline-border-disabled'],
};

const SURFACES = [
  { label: 'On the canvas', className: 'bg-surface-canvas' },
  { label: 'On the filter bar', className: 'bg-surface-neutral-faint' },
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
    // transition-none: the forced states must be settled before axe and Chromatic look at them.
    // pointer-events-none: the checks read resting colours, so a stray pointer mustn't hover a cell.
    <table className="pointer-events-none border-separate border-spacing-0 text-left [&_button]:transition-none">
      <thead>
        <tr>
          <th scope="col" className="p-3 text-caption-md-medium text-text-secondary">
            Surface
          </th>
          {STATES.map((state) => (
            <th key={state} scope="col" className="p-3 text-caption-md-medium text-text-secondary">
              {STATE_LABEL[state]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SURFACES.map((surface) => (
          <tr key={surface.label} className={surface.className}>
            <th scope="row" className="p-3 text-caption-md-medium text-text-secondary">
              {surface.label}
            </th>
            {STATES.map((state) => (
              <td key={state} className="p-3">
                <FilterClear data-pseudo={state} disabled={state === 'disabled'} />
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
      active: ['[data-pseudo="pressed"]'],
      focusVisible: ['[data-pseudo="focus"]'],
    },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // The forced states are checked in afterEach, not play: pseudo-states rewrites the :hover /
  // :active / :focus-visible CSS on STORY_RENDERED, which comes after play (see Button).
  afterEach: async ({ canvasElement }) => {
    const want = Object.fromEntries(
      Object.entries(BOUND).map(([state, look]) => [state, look.map(tokenColour)]),
    ) as Record<Exclude<State, 'focus'>, string[]>;
    const ring = tokenColour('stroke-focused');
    await waitFor(
      () => {
        const buttons = canvasElement.querySelectorAll<HTMLButtonElement>('button[data-pseudo]');
        expect(buttons).toHaveLength(STATES.length * SURFACES.length);
        for (const button of buttons) {
          const state = button.dataset.pseudo as State;
          const [fill, label, stroke] = want[state === 'focus' ? 'default' : state];
          const style = getComputedStyle(button);
          expect(button).toHaveAccessibleName('Clear Filters');
          expect(style.backgroundColor).toBe(fill);
          expect(style.color).toBe(label);
          expect(style.boxShadow).toContain(`${stroke} 0px 0px 0px 1px inset`);
          // ArrowsClockwise, 20px, in the label's colour.
          const svg = button.querySelector('svg')!;
          expect(svg.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS['arrows-clockwise']);
          expect(svg.getBoundingClientRect().width).toBe(20);
          expect(getComputedStyle(svg).color).toBe(label);
          // Button / Normal: 36 high, in a box as tall as Filter / Field (40 in code), centred.
          const box = button.parentElement!;
          expect(box.dataset.part).toBe('box');
          expect(button.getBoundingClientRect().height).toBe(36);
          expect(box.getBoundingClientRect().height).toBe(40);
          expect(box.getBoundingClientRect().width).toBe(button.getBoundingClientRect().width);
          expect(button.getBoundingClientRect().top - box.getBoundingClientRect().top).toBe(2);
          // The box has no fill or stroke of its own.
          expect(getComputedStyle(box).backgroundColor).toBe('rgba(0, 0, 0, 0)');
          // Focus: Button's ring, 2px stroke.focused, 2px outside the button.
          if (state === 'focus') {
            expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '2px']);
            expect(style.outlineColor).toBe(ring);
          } else {
            expect(style.outlineStyle).toBe('none');
          }
          expect(button.disabled).toBe(state === 'disabled');
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
