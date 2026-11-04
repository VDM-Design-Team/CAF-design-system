import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { SelectMenu } from '../select-menu';
import { SelectOption } from './SelectOption';

const meta = {
  title: 'Components/SelectOption',
  component: SelectOption,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Select / Option`): one choice in a Select / Menu. Figma’s ' +
          'State is Default, Hover (`:hover`, a neutral/tonal/surface/default fill), Active (the option the arrow keys ' +
          'are on) or Selected (`selected`: the same fill, a text/primary check and `aria-selected`); the Label is ' +
          '`children`. It is a `<div role="option">` inside a SelectMenu, and never takes focus: Select keeps focus on ' +
          'its trigger and marks the Active option with `data-active`, plus `data-focus-visible` for its Focus Ring ' +
          'when the keyboard put it there.',
      },
    },
  },
  args: { children: 'Option', onClick: fn() },
  render: (args) => (
    <SelectMenu aria-label="Example" className="w-72">
      <SelectOption {...args} />
    </SelectMenu>
  ),
} satisfies Meta<typeof SelectOption>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An option in a list. Select chooses it on click. */
export const Playground: Story = {
  argTypes: { selected: { control: 'boolean' } },
  play: async ({ args, canvas }) => {
    const option = canvas.getByRole('option', { name: 'Option' });
    await expect(option).toHaveAttribute('aria-selected', 'false');
    await expect(option).not.toHaveAttribute('tabindex');
    await userEvent.click(option);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   Figma's Default, Hover, Active (the option the arrow keys are on, with its
   Focus Ring) and Selected, plus Selected on hover and Active from the pointer
   (no ring), which Figma doesn't draw, each on Select / Menu's surface. Hover
   is forced with storybook-addon-pseudo-states and checked against Figma's
   bindings. */

const STATES = [
  { id: 'default', label: 'Default', selected: false, hover: false, active: false, keys: false },
  { id: 'hover', label: 'Hover', selected: false, hover: true, active: false, keys: false },
  { id: 'keys', label: 'Active', selected: false, hover: false, active: true, keys: true },
  { id: 'pointer', label: 'Active, from the pointer', selected: false, hover: false, active: true, keys: false },
  { id: 'selected', label: 'Selected', selected: true, hover: false, active: false, keys: false },
  { id: 'selected-hover', label: 'Selected, hover', selected: true, hover: true, active: false, keys: false },
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

/* The type a utility class sets: size, line height, weight. */
function utilityType(className: string) {
  const probe = document.createElement('span');
  probe.className = className;
  document.body.append(probe);
  const { fontSize, lineHeight, fontWeight } = getComputedStyle(probe);
  probe.remove();
  return { fontSize, lineHeight, fontWeight };
}

const states = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {STATES.map((s) => (
        <div key={s.id} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">{s.label}</span>
          <SelectMenu aria-label={`Options, ${s.label.toLowerCase()}`} className="w-60">
            <SelectOption
              selected={s.selected}
              data-pseudo={s.hover ? 'hover' : undefined}
              data-active={s.active ? '' : undefined}
              data-focus-visible={s.keys ? '' : undefined}
              data-state={s.id}
              className="transition-none"
            >
              Option
            </SelectOption>
          </SelectMenu>
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
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = {
      menu: tokenColour('surface-neutral-faint'),
      filled: tokenColour('neutral-tonal-surface-default'),
      label: tokenColour('text-primary'),
      check: tokenColour('text-primary'),
      ring: tokenColour('stroke-focused'),
      type: utilityType('text-body-sm-regular'),
    };
    await waitFor(
      () => {
        for (const menu of canvasElement.querySelectorAll<HTMLElement>('[role="listbox"]')) {
          expect(getComputedStyle(menu).backgroundColor).toBe(want.menu);
        }
        const options = canvasElement.querySelectorAll<HTMLElement>('[role="option"]');
        expect(options).toHaveLength(STATES.length);
        for (const option of options) {
          const s = STATES.find((x) => x.id === option.dataset.state)!;
          const style = getComputedStyle(option);
          // Default: no fill. Hover, Active and Selected: neutral.tonal.surface.default.
          const filled = s.hover || s.selected || s.active;
          expect(style.backgroundColor).toBe(filled ? want.filled : 'rgba(0, 0, 0, 0)');
          // Label: text.primary, Body/sm-regular, in every state.
          expect(style.color).toBe(want.label);
          expect({ fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight }).toEqual(want.type);
          // Auto layout: 8 / 12 padding, radius 6, 36 high.
          expect(style.padding).toBe('8px 12px');
          expect(style.borderRadius).toBe('6px');
          expect(option.getBoundingClientRect().height).toBeCloseTo(36, 1);
          // Selected: aria-selected and a 16px check in text.primary, the label's colour.
          expect(option).toHaveAttribute('aria-selected', String(s.selected));
          const check = option.querySelector('svg');
          if (s.selected) {
            expect(check).not.toBeNull();
            expect(getComputedStyle(check!).color).toBe(want.check);
            expect(check!.getBoundingClientRect().width).toBeCloseTo(16, 1);
          } else {
            expect(check).toBeNull();
          }
          // Active from the keyboard: Figma's Focus Ring, 2px stroke.focused, 2px out.
          if (s.keys) {
            expect(style.outlineStyle).toBe('solid');
            expect(style.outlineWidth).toBe('2px');
            expect(style.outlineOffset).toBe('2px');
            expect(style.outlineColor).toBe(want.ring);
          } else {
            expect(style.outlineStyle).toBe('none');
          }
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = states('light');
export const StatesDark = states('dark');
