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
          'State is Default, Hover (`:hover`) or Selected (`selected`: a surface/base fill, a check and ' +
          '`aria-selected`); the Label is `children`. It is a `<div role="option">` inside a SelectMenu, and never takes ' +
          'focus: Select keeps focus on its trigger and marks the option the arrow keys are on with `data-active`, plus ' +
          '`data-focus-visible` for the focus ring when the keyboard put it there.',
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
   Figma's Default, Hover and Selected, plus Selected on hover (which Figma
   doesn't draw) and the option the arrow keys are on (code's addition), each
   on Select / Menu's surface. Hover is forced with storybook-addon-pseudo-states
   and checked against Figma's bindings. */

const STATES = [
  { id: 'default', label: 'Default', selected: false, hover: false, keys: false },
  { id: 'hover', label: 'Hover', selected: false, hover: true, keys: false },
  { id: 'selected', label: 'Selected', selected: true, hover: false, keys: false },
  { id: 'selected-hover', label: 'Selected, hover', selected: true, hover: true, keys: false },
  { id: 'keys', label: 'Arrow keys on it', selected: false, hover: false, keys: true },
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
              data-active={s.keys ? '' : undefined}
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
      filled: tokenColour('surface-base'),
      label: tokenColour('text-primary'),
      check: tokenColour('action-primary-surface-default'),
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
          // Default: no fill. Hover, Selected and the arrow keys' option: surface.base.
          const filled = s.hover || s.selected || s.keys;
          expect(style.backgroundColor).toBe(filled ? want.filled : 'rgba(0, 0, 0, 0)');
          // Label: text.primary, Body/sm-regular, in every state.
          expect(style.color).toBe(want.label);
          expect({ fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight }).toEqual(want.type);
          // Auto layout: 8 / 12 padding, radius 6, 36 high.
          expect(style.padding).toBe('8px 12px');
          expect(style.borderRadius).toBe('6px');
          expect(option.getBoundingClientRect().height).toBeCloseTo(36, 1);
          // Selected: aria-selected and a 16px check in action.primary.surface.default.
          expect(option).toHaveAttribute('aria-selected', String(s.selected));
          const check = option.querySelector('svg');
          if (s.selected) {
            expect(check).not.toBeNull();
            expect(getComputedStyle(check!).color).toBe(want.check);
            expect(check!.getBoundingClientRect().width).toBeCloseTo(16, 1);
          } else {
            expect(check).toBeNull();
          }
          // The arrow keys' option: Button's 2px stroke.focused ring, 2px out.
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
