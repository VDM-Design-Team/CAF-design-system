import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FormTabNavigation } from '../form-tab-navigation';
import { Tabs } from '../tabs';
import { TabItem } from './TabItem';

const meta = {
  title: 'Components/TabItem',
  component: TabItem,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Tabs** (`Tabs / Tab Item`): one tab. Figma’s Style is set by the ' +
          'list: Segmented in Tabs, Form in FormTabNavigation. Its State is Selected (the list’s `selected` is this ' +
          'tab’s `value`, `aria-selected`), Default, or Hover (`:hover` on a tab that isn’t selected); the Label is ' +
          '`children`. It is a `<button role="tab">`: use it inside Tabs or FormTabNavigation, which select it and ' +
          'move focus between tabs. Figma has no Focus or Disabled tab.',
      },
    },
  },
  args: { value: 'recurring', children: 'Recurring', onClick: fn() },
  // A tab lives in a tab list: the stories put it in Tabs, after an “All” tab.
  render: (args) => (
    <Tabs aria-label="Cost type" defaultSelected="all">
      <TabItem value="all">All</TabItem>
      <TabItem {...args} />
    </Tabs>
  ),
} satisfies Meta<typeof TabItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click it: it becomes the selected tab. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const tab = canvas.getByRole('tab', { name: 'Recurring' });
    await expect(tab).toHaveAttribute('aria-selected', 'false');
    await userEvent.click(tab);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'false');
  },
};

/* ── Every Style × State, in Light and Dark ───────────────────────────────
   Figma's six variants, each checked against the variables its layers are
   bound to: the fill, the label and its type style. Hover is forced with
   storybook-addon-pseudo-states on a tab that isn't selected. */

const STATES = ['Selected', 'Default', 'Hover'] as const;

/* Figma's bindings per Style and State: [fill, label, type style]. `null` is no fill. */
const BOUND = {
  segmented: {
    Selected: ['action-primary-surface-default', 'action-primary-content-default', 'text-body-sm-semibold'],
    Default: [null, 'text-subtle', 'text-body-sm-semibold'],
    Hover: ['neutral-outline-surface-hover', 'text-primary', 'text-body-sm-semibold'],
  },
  form: {
    Selected: ['neutral-tonal-surface-default', 'text-primary', 'text-body-sm-medium'],
    Default: [null, 'text-subtle', 'text-body-sm-regular'],
    Hover: ['neutral-outline-surface-hover', 'text-primary', 'text-body-sm-regular'],
  },
} as const;

/* Each Style's box: height, padding, radius. Form's height is its 8px padding around GDL's 20px Body/sm line. */
const BOX = {
  segmented: { height: 32, padding: '0px 16px', radius: '8px' },
  form: { height: 36, padding: '8px 16px', radius: '6px' },
} as const;

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

const tabs = (style: 'segmented' | 'form') =>
  STATES.map((state) => (
    <TabItem key={state} value={state} data-style={style} data-state={state}>
      {state}
    </TabItem>
  ));

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex w-128 flex-col items-start gap-4">
      <span className="text-caption-md-medium text-text-secondary">Style=Segmented</span>
      <Tabs aria-label="Segmented Tab Item states" defaultSelected="Selected">
        {tabs('segmented')}
      </Tabs>
      <span className="text-caption-md-medium text-text-secondary">Style=Form</span>
      <FormTabNavigation aria-label="Form Tab Item states" defaultActive="Selected">
        {tabs('form')}
      </FormTabNavigation>
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-state="Hover"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = Object.fromEntries(
      Object.entries(BOUND).map(([style, states]) => [
        style,
        Object.fromEntries(
          Object.entries(states).map(([state, [fill, text, type]]) => [
            state,
            { fill: fill ? tokenColour(fill) : 'rgba(0, 0, 0, 0)', text: tokenColour(text), type: utilityType(type) },
          ]),
        ),
      ]),
    );
    await waitFor(
      () => {
        const all = canvasElement.querySelectorAll<HTMLElement>('[role="tab"]');
        expect(all).toHaveLength(6);
        for (const tab of all) {
          const style = tab.dataset.style as keyof typeof BOUND;
          const state = tab.dataset.state as (typeof STATES)[number];
          const { fill, text, type } = want[style][state];
          const css = getComputedStyle(tab);
          expect(tab.getAttribute('aria-selected')).toBe(String(state === 'Selected'));
          expect(css.backgroundColor).toBe(fill);
          expect(css.color).toBe(text);
          expect({ fontSize: css.fontSize, lineHeight: css.lineHeight, fontWeight: css.fontWeight }).toEqual(type);
          expect(tab.getBoundingClientRect().height).toBe(BOX[style].height);
          expect(css.padding).toBe(BOX[style].padding);
          expect(css.borderRadius).toBe(BOX[style].radius);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
