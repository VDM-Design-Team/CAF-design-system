import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { TabItem } from '../tab-item';
import { Tabs } from './Tabs';

/* Figma's Tabs / Cost Type: All, Recurring, Single. */
const COST_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'single', label: 'Single' },
] as const;

const costTypeTabs = COST_TYPES.map(({ value, label }) => (
  <TabItem key={value} value={value}>
    {label}
  </TabItem>
));

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Tabs** (`Tabs / Cost Type`): segmented tabs, here the Costs ' +
          'list’s All / Recurring / Single. Put TabItems in it. Figma’s Selected is `selected`, the selected tab’s ' +
          '`value` (uncontrolled: `defaultSelected`, default the first tab); `onSelectedChange` gets the tab the user ' +
          'picks. It is a `role="tablist"`: give it an `aria-label`. ← / → move between tabs and select them, Home / ' +
          'End go to the ends, and only the selected tab is in the tab order.',
      },
    },
  },
  args: { 'aria-label': 'Cost type', defaultSelected: 'all', onSelectedChange: fn(), children: costTypeTabs },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's Cost Type tabs, above the Costs list, with the keyboard: ← / → wrap, Home / End, Tab in and out. */
export const CostType: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Tabs {...args} />
      <Button variant="outlined" size="small">
        Export
      </Button>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name });
    const tabs = canvas.getAllByRole('tab');
    const exportButton = canvas.getByRole('button', { name: 'Export' });
    await expect(canvas.getByRole('tablist', { name: 'Cost type' })).toBeInTheDocument();
    await expect(tabs.map((t) => t.textContent)).toEqual(['All', 'Recurring', 'Single']);
    await expect(tab('All')).toHaveAttribute('aria-selected', 'true');
    // Only the selected tab is in the tab order.
    await expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);

    // Shift+Tab from the next control lands on the selected tab.
    exportButton.focus();
    await userEvent.tab({ shift: true });
    await expect(tab('All')).toHaveFocus();

    // → moves to the next tab and selects it.
    await userEvent.keyboard('{ArrowRight}');
    await expect(tab('Recurring')).toHaveFocus();
    await expect(tab('Recurring')).toHaveAttribute('aria-selected', 'true');
    await expect(tab('All')).toHaveAttribute('aria-selected', 'false');
    await expect(args.onSelectedChange).toHaveBeenLastCalledWith('recurring');
    await expect(tabs.map((t) => t.tabIndex)).toEqual([-1, 0, -1]);

    // → wraps from the last tab to the first; ← wraps back.
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(tab('All')).toHaveFocus();
    await expect(tab('All')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(tab('Single')).toHaveFocus();
    await expect(args.onSelectedChange).toHaveBeenLastCalledWith('single');

    // Home / End go to the first / last tab.
    await userEvent.keyboard('{Home}');
    await expect(tab('All')).toHaveFocus();
    await expect(tab('All')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    await expect(tab('Single')).toHaveFocus();
    await expect(tab('Single')).toHaveAttribute('aria-selected', 'true');

    // Tab leaves the list.
    await userEvent.tab();
    await expect(exportButton).toHaveFocus();

    // A click selects too.
    await userEvent.click(tab('Recurring'));
    await expect(tab('Recurring')).toHaveAttribute('aria-selected', 'true');
    await expect(args.onSelectedChange).toHaveBeenLastCalledWith('recurring');
  },
};

/* The Costs list the tabs filter: one tabpanel, labelled by the selected tab. */
const COSTS = [
  { id: '123456', name: 'Office rent', type: 'recurring' },
  { id: '123457', name: 'Team offsite', type: 'single' },
  { id: '123458', name: 'Software licences', type: 'recurring' },
] as const;

function CostsList() {
  const [type, setType] = useState('all');
  const rows = COSTS.filter((cost) => type === 'all' || cost.type === type);
  return (
    <div className="flex w-128 flex-col gap-4">
      <Tabs aria-label="Cost type" selected={type} onSelectedChange={setType}>
        {COST_TYPES.map(({ value, label }) => (
          <TabItem key={value} value={value} id={`cost-type-${value}`} aria-controls="cost-list">
            {label}
          </TabItem>
        ))}
      </Tabs>
      <div
        id="cost-list"
        role="tabpanel"
        aria-labelledby={`cost-type-${type}`}
        tabIndex={0}
        className="rounded-8 bg-surface-base p-4 focus-visible:outline-2 focus-visible:outline-stroke-focused"
      >
        <ul className="flex flex-col gap-2 text-body-sm-regular text-text-primary">
          {rows.map((cost) => (
            <li key={cost.id}>
              {cost.id} · {cost.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Controlled, with the panel it switches: the tabs point at it (`aria-controls`), and it is labelled by the selected tab. */
export const WithPanel: Story = {
  render: () => <CostsList />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByRole('tabpanel');
    await expect(panel).toHaveAccessibleName('All');
    await expect(within(panel).getAllByRole('listitem')).toHaveLength(3);

    canvas.getByRole('tab', { name: 'All' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Recurring' })).toHaveAttribute('aria-selected', 'true');
    await expect(panel).toHaveAccessibleName('Recurring');
    await expect(within(panel).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '123456 · Office rent',
      '123458 · Software licences',
    ]);

    await userEvent.click(canvas.getByRole('tab', { name: 'Single' }));
    await expect(panel).toHaveAccessibleName('Single');
    await expect(within(panel).getAllByRole('listitem')).toHaveLength(1);
  },
};

/* ── Figma's three variants, in Light and Dark ─────────────────────────────
   Selected=All, Recurring and Single, each checked against the variables
   the layers are bound to: the bar's fill, and each tab's fill and label. */

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

const variants = (theme: 'light' | 'dark'): Story => ({
  name: `Variants — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {COST_TYPES.map(({ value, label }) => (
        <div key={value} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">Selected={label}</span>
          <Tabs aria-label={`Cost type, ${label} selected`} selected={value} data-selected={value}>
            {costTypeTabs}
          </Tabs>
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
      selectedFill: tokenColour('action-primary-surface-default'),
      selectedText: tokenColour('action-primary-content-default'),
      defaultText: tokenColour('text-subtle'),
    };
    await waitFor(() => {
      const bars = canvasElement.querySelectorAll<HTMLElement>('[role="tablist"]');
      expect(bars).toHaveLength(3);
      for (const bar of bars) {
        const style = getComputedStyle(bar);
        // surface.elevated-secondary; 8 / 4 padding, gap 4, radius 8; 48 high.
        expect(style.backgroundColor).toBe(want.bar);
        expect(style.padding).toBe('8px 4px');
        expect(style.columnGap).toBe('4px');
        expect(style.borderRadius).toBe('8px');
        expect(bar.getBoundingClientRect().height).toBe(48);
        for (const tab of bar.querySelectorAll<HTMLElement>('[role="tab"]')) {
          const selected = tab.dataset.value === bar.dataset.selected;
          expect(tab.getAttribute('aria-selected')).toBe(String(selected));
          expect(getComputedStyle(tab).backgroundColor).toBe(selected ? want.selectedFill : 'rgba(0, 0, 0, 0)');
          expect(getComputedStyle(tab).color).toBe(selected ? want.selectedText : want.defaultText);
        }
      }
    });
  },
});

export const VariantsLight = variants('light');
export const VariantsDark = variants('dark');
