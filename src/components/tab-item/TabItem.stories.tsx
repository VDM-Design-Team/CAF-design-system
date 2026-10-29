import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Tabs } from '../tabs';
import { TabItem } from './TabItem';

const meta = {
  title: 'Components/TabItem',
  component: TabItem,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Tabs** (`Tabs / Tab Item`): one tab. Figma’s State is Selected ' +
          '(the list’s `selected` is this tab’s `value`, `aria-selected`) or Default; the Label is `children`. It is ' +
          'a `<button role="tab">`: use it inside Tabs or FormTabNavigation, which select it and move focus ' +
          'between tabs. Figma has no Hover, Focus or Disabled tab.',
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

/* ── Every State, in Light and Dark ────────────────────────────────────────
   Figma's two states, each checked against the variables its layers are
   bound to: the fill and the label. Selected's label is the corrected
   binding, action.primary.content (Figma: text.primary). */

const STATES = [
  { state: 'Selected', fill: 'action-primary-surface-default', text: 'action-primary-content-default' },
  { state: 'Default', fill: null, text: 'text-subtle' },
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

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <Tabs aria-label="Tab Item states" defaultSelected="Selected">
      {STATES.map(({ state }) => (
        <TabItem key={state} value={state} data-state={state}>
          {state}
        </TabItem>
      ))}
    </Tabs>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = STATES.map(({ state, fill, text }) => ({
      state,
      fill: fill ? tokenColour(fill) : 'rgba(0, 0, 0, 0)',
      text: tokenColour(text),
    }));
    const type = utilityType('text-body-sm-semibold');
    await waitFor(() => {
      for (const { state, fill, text } of want) {
        const tab = canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
        const style = getComputedStyle(tab);
        expect(tab.getAttribute('aria-selected')).toBe(String(state === 'Selected'));
        expect(style.backgroundColor).toBe(fill);
        expect(style.color).toBe(text);
        // Body/sm-semibold; 32 high, 0 / 16 padding, radius 8.
        expect({ fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight }).toEqual(type);
        expect(tab.getBoundingClientRect().height).toBe(32);
        expect(style.padding).toBe('0px 16px');
        expect(style.borderRadius).toBe('8px');
      }
    });
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
