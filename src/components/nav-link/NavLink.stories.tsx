import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { NavLink, NAV_LINK_ORIENTATIONS } from './NavLink';

const meta = {
  title: 'Components/NavLink',
  component: NavLink,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation**: `Navigation / Nav Link` (the header’s Nav Bar) and ' +
          '`Navigation / Nav Link – Vertical` (the Mobile Menu), as `orientation` `horizontal` (default) and ' +
          '`vertical`. Figma’s State: Active is `active`, the current page (`aria-current="page"`); Hover is `:hover`. ' +
          'The Label is `children`. It is an `<a href>`; pass a router’s link component as `as`. Figma has no Focus ' +
          'state: the ring is `stroke/focused`, as on Button.',
      },
    },
  },
  args: { href: '#costs', children: 'Costs' },
  argTypes: { orientation: { control: 'radio', options: NAV_LINK_ORIENTATIONS } },
} satisfies Meta<typeof NavLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A link named by its label. Not the current page: no `aria-current`. Tab reaches it. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Costs' });
    await expect(link).toHaveAttribute('href', '#costs');
    await expect(link).not.toHaveAttribute('aria-current');
    await userEvent.tab();
    await expect(link).toHaveFocus();
  },
};

/** Figma State=Active: the current page. `aria-current="page"` tells assistive tech. */
export const Active: Story = {
  args: { active: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');
  },
};

/** Navigation / Nav Link – Vertical: a full-width row of the Mobile Menu. */
export const Vertical: Story = {
  args: { orientation: 'vertical', active: true, children: 'Users', href: '#users' },
  render: (args) => (
    <div className="flex w-96 flex-col bg-surface-neutral-base px-4 py-2">
      <NavLink {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Users' });
    await expect(link).toHaveAttribute('aria-current', 'page');
    // The menu's full width, less its 16px sides.
    await expect(link.getBoundingClientRect().width).toBe(link.parentElement!.clientWidth - 32);
  },
};

/* A router's link component: it takes `to`, not `href`. */
const RouterLink = React.forwardRef<
  HTMLAnchorElement,
  { to: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
>(function RouterLink({ to, ...props }, ref) {
  return <a ref={ref} href={to} data-router-link="" {...props} />;
});

/** With `as`, NavLink renders a router's link component and gives it its classes and `aria-current`. */
export const WithRouterLink: Story = {
  render: () => (
    <NavLink as={RouterLink} to="#drafts" active>
      Drafts
    </NavLink>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Drafts' });
    await expect(link).toHaveAttribute('data-router-link');
    await expect(link).toHaveAttribute('href', '#drafts');
    await expect(link).toHaveAttribute('aria-current', 'page');
    await expect(link).toHaveClass('bg-neutral-tonal-surface-default');
  },
};

/* ── Every State × orientation, in Light and Dark ──────────────────────────
   Figma's three states of each set, plus the focus ring code adds. Hover and
   Focus are forced with storybook-addon-pseudo-states and checked against
   the variables Figma binds. */

const STATES = ['Default', 'Hover', 'Active', 'Focus'] as const;
type State = (typeof STATES)[number];

/* Figma's bindings per orientation and state: [fill, label]. `null` is no fill. */
const BOUND: Record<'horizontal' | 'vertical', Record<State, readonly [string | null, string]>> = {
  horizontal: {
    Default: [null, 'text-primary'],
    Hover: ['neutral-tonal-surface-default', 'text-primary'],
    Active: ['neutral-tonal-surface-default', 'text-primary'],
    Focus: [null, 'text-primary'],
  },
  vertical: {
    Default: [null, 'text-secondary'],
    Hover: ['surface-neutral-faint', 'text-primary'],
    Active: ['surface-base', 'text-primary'],
    Focus: [null, 'text-secondary'],
  },
};

/* Type style and box per orientation: Body/sm-regular, 36 high / Body/md-medium, 40 high; 8 / 12 padding, radius 6. */
const TYPE = { horizontal: 'text-body-sm-regular', vertical: 'text-body-md-medium' } as const;
const HEIGHT = { horizontal: 36, vertical: 40 } as const;

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

/* The type a utility class sets: size, line height, weight. */
function utilityType(className: string) {
  const probe = document.createElement('span');
  probe.className = className;
  document.body.append(probe);
  const { fontSize, lineHeight, fontWeight } = getComputedStyle(probe);
  probe.remove();
  return { fontSize, lineHeight, fontWeight };
}

const pseudo = (state: State) =>
  state === 'Hover' ? 'hover' : state === 'Focus' ? 'focus-visible' : undefined;

function StateLinks({ orientation }: { orientation: 'horizontal' | 'vertical' }) {
  return STATES.map((state) => (
    <NavLink
      key={state}
      href={`#${state.toLowerCase()}`}
      orientation={orientation}
      active={state === 'Active'}
      data-state={state}
      data-pseudo={pseudo(state)}
      // No colour transition in the grid, so the check reads the end colour, not a frame of the fade.
      className="transition-none"
    >
      {state}
    </NavLink>
  ));
}

const grid = (orientation: 'horizontal' | 'vertical', theme: 'light' | 'dark'): Story => ({
  name: `${orientation === 'horizontal' ? 'Nav Link' : 'Nav Link – Vertical'} — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () =>
    orientation === 'horizontal' ? (
      // As in the Nav Bar: side by side, no gap.
      <div className="flex items-start py-2">
        <StateLinks orientation="horizontal" />
      </div>
    ) : (
      // As in the Mobile Menu: surface.neutral.base, 8 / 16 padding, 2px gap.
      <div className="flex w-96 flex-col gap-0.5 bg-surface-neutral-base px-4 py-2">
        <StateLinks orientation="vertical" />
      </div>
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
    const none = 'rgba(0, 0, 0, 0)';
    const want = STATES.map((state) => {
      const [fill, text] = BOUND[orientation][state];
      return { state, fill: fill ? tokenColour(fill) : none, text: tokenColour(text) };
    });
    const focused = tokenColour('stroke-focused');
    const type = utilityType(TYPE[orientation]);
    await waitFor(
      () => {
        const widths = new Set<number>();
        for (const { state, fill, text } of want) {
          const link = canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
          const style = getComputedStyle(link);
          expect(style.backgroundColor).toBe(fill);
          expect(style.color).toBe(text);
          expect(link.getAttribute('aria-current')).toBe(state === 'Active' ? 'page' : null);
          expect({ fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight }).toEqual(type);
          expect(link.getBoundingClientRect().height).toBe(HEIGHT[orientation]);
          expect(style.padding).toBe('8px 12px');
          expect(style.borderRadius).toBe('6px');
          if (state === 'Focus') {
            expect(style.outlineStyle).toBe('solid');
            expect(style.outlineWidth).toBe('2px');
            expect(style.outlineOffset).toBe('2px');
            expect(style.outlineColor).toBe(focused);
          } else {
            expect(style.outlineStyle).toBe('none');
          }
          widths.add(link.getBoundingClientRect().width);
        }
        // Vertical rows all fill the menu's width.
        if (orientation === 'vertical') expect(widths.size).toBe(1);
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('horizontal', 'light');
export const StatesDark = grid('horizontal', 'dark');
export const VerticalStatesLight = grid('vertical', 'light');
export const VerticalStatesDark = grid('vertical', 'dark');
