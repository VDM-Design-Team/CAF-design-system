import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { TabItem } from '../tab-item';
import { FormTabNavigation } from './FormTabNavigation';

/* Figma's Form / Tab Navigation: Tab 1 “Single Cost”, Tab 2 “Recurring Cost”. */
const TABS = [
  { value: 'single', label: 'Single Cost', active: 'Tab 1' },
  { value: 'recurring', label: 'Recurring Cost', active: 'Tab 2' },
] as const;

const costTabs = TABS.map(({ value, label }) => (
  <TabItem key={value} value={value}>
    {label}
  </TabItem>
));

const meta = {
  title: 'Components/FormTabNavigation',
  component: FormTabNavigation,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Form / Tab Navigation`): the full-width Single Cost / ' +
          'Recurring Cost switch at the top of the New Cost form. Put TabItems in it: Tab 1 Label and Tab 2 Label are ' +
          'their `children`. Figma’s Active is `active`, the active tab’s `value` (uncontrolled: `defaultActive`, ' +
          'default the first tab); `onActiveChange` gets the tab the user picks. Keyboard and roles are Tabs’. It ' +
          'is not Tabs’ look: the active tab is a raised surface.base pill, not the blue, and the tabs share the width.',
      },
    },
  },
  args: { 'aria-label': 'Cost type', defaultActive: 'single', onActiveChange: fn(), children: costTabs },
  render: (args) => (
    <div className="w-128">
      <FormTabNavigation {...args} />
    </div>
  ),
} satisfies Meta<typeof FormTabNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's example, Active=Tab 1, with the keyboard: ← / → wrap, Home / End; a click switches too. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name });
    await expect(canvas.getByRole('tablist', { name: 'Cost type' })).toBeInTheDocument();
    await expect(tab('Single Cost')).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([0, -1]);

    await userEvent.click(tab('Recurring Cost'));
    await expect(tab('Recurring Cost')).toHaveAttribute('aria-selected', 'true');
    await expect(args.onActiveChange).toHaveBeenLastCalledWith('recurring');

    // ← moves to Single Cost and makes it active; → wraps back round.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(tab('Single Cost')).toHaveFocus();
    await expect(tab('Single Cost')).toHaveAttribute('aria-selected', 'true');
    await expect(args.onActiveChange).toHaveBeenLastCalledWith('single');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(tab('Recurring Cost')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(tab('Single Cost')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(tab('Recurring Cost')).toHaveFocus();
    await expect(tab('Recurring Cost')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Home}');
    await expect(tab('Single Cost')).toHaveFocus();
    await expect(canvas.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([0, -1]);
  },
};

/* ── Every Active, in Light and Dark ───────────────────────────────────────
   Active=Tab 1 and Tab 2, each checked against the variables the layers
   are bound to: the bar's fill, the active tab's raised fill and label, and
   the other tab's label. */

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

const actives = (theme: 'light' | 'dark'): Story => ({
  name: `Active — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex w-128 flex-col gap-4">
      {TABS.map(({ value, active }) => (
        <div key={value} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">Active={active}</span>
          <FormTabNavigation aria-label={`Cost type, ${active} active`} active={value} data-active={value}>
            {costTabs}
          </FormTabNavigation>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      bar: tokenColour('surface-elevated-secondary'),
      activeFill: tokenColour('surface-base'),
      activeText: tokenColour('text-primary'),
      otherText: tokenColour('text-subtle'),
      activeType: utilityType('text-body-sm-medium'),
      otherType: utilityType('text-body-sm-regular'),
    };
    await waitFor(() => {
      const bars = canvasElement.querySelectorAll<HTMLElement>('[role="tablist"]');
      expect(bars).toHaveLength(2);
      for (const bar of bars) {
        const style = getComputedStyle(bar);
        // surface.elevated-secondary; 4px padding, radius 8; full width.
        expect(style.backgroundColor).toBe(want.bar);
        expect(style.padding).toBe('4px');
        expect(style.borderRadius).toBe('8px');
        const tabs = [...bar.querySelectorAll<HTMLElement>('[role="tab"]')];
        // The tabs share the bar's width equally.
        const [a, b] = tabs.map((t) => t.getBoundingClientRect().width);
        expect(a).toBeCloseTo(b, 0);
        expect(a + b + 8).toBeCloseTo(bar.getBoundingClientRect().width, 0);
        for (const tab of tabs) {
          const active = tab.dataset.value === bar.dataset.active;
          const t = getComputedStyle(tab);
          expect(tab.getAttribute('aria-selected')).toBe(String(active));
          expect(t.backgroundColor).toBe(active ? want.activeFill : 'rgba(0, 0, 0, 0)');
          expect(t.color).toBe(active ? want.activeText : want.otherText);
          expect({ fontSize: t.fontSize, lineHeight: t.lineHeight, fontWeight: t.fontWeight }).toEqual(
            active ? want.activeType : want.otherType,
          );
          // 8 / 16 padding, radius 6.
          expect(t.padding).toBe('8px 16px');
          expect(t.borderRadius).toBe('6px');
        }
      }
    });
  },
});

export const ActiveLight = actives('light');
export const ActiveDark = actives('dark');
