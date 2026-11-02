import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { MenuItem } from '../../components/menu-item';
import { MenuTriggerButton } from '../../components/menu-trigger-button';
import { TabItem } from '../../components/tab-item';
import { Tabs } from '../../components/tabs';
import { exportMenuItems } from '../fixtures';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'Patterns/Page header',
  component: PageHeader,
  parameters: {
    docs: {
      description: {
        component:
          'A story-level page scaffold (`src/patterns/page/PageHeader.tsx`), not a library component: Figma draws each ' +
          'page’s header as a frame (pattern 01’s Page Header, 518:273 and 518:557; the Admin screens). The title is the ' +
          'page’s `<h1>` (Heading/xl-bold); an optional description sits under it; the Costs pages put their type Tabs ' +
          'next to it; page actions sit on the right, the primary one last. Patterns and templates use it so their pages agree.',
      },
    },
  },
  args: { title: 'Cost Centers' },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pattern 01 A, the basic list (Cost Centers): the title and the primary action. */
export const Basic: Story = {
  args: {
    title: 'Cost Centers',
    actions: <Button leftIcon={<Icon name="plus" />}>Add New</Button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Cost Centers' })).toBeVisible();
    const heading = canvas.getByRole('heading', { level: 1 }).getBoundingClientRect();
    const add = canvas.getByRole('button', { name: 'Add New' }).getBoundingClientRect();
    // Title on the left, the action on the right, centred on one line.
    await expect(add.left).toBeGreaterThan(heading.right);
    await expect(Math.abs(add.top + add.height / 2 - (heading.top + heading.height / 2))).toBeLessThan(1);
  },
};

function CostsHeader() {
  const [type, setType] = useState('all');
  return (
    <PageHeader
      title="Costs"
      tabs={
        <Tabs aria-label="Cost type" selected={type} onSelectedChange={setType}>
          <TabItem value="all">All</TabItem>
          <TabItem value="recurring">Recurring</TabItem>
          <TabItem value="single">Single</TabItem>
        </Tabs>
      }
      actions={
        <>
          <Button variant="outlined">View Audit Logs</Button>
          <MenuTriggerButton label="Export">
            {exportMenuItems.map((label) => (
              <MenuItem key={label}>{label}</MenuItem>
            ))}
          </MenuTriggerButton>
        </>
      }
    />
  );
}

/** Pattern 01 B, the Costs list: type tabs next to the title, secondary actions left of the primary one. */
export const WithTabsAndActions: Story = {
  name: 'With tabs and actions',
  render: () => (
    <div className="pb-32">
      <CostsHeader />
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();
    const all = canvas.getByRole('tab', { name: 'All' });
    await expect(all).toHaveAttribute('aria-selected', 'true');
    // The tabs follow the title; the arrow keys move between them.
    all.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Recurring' })).toHaveAttribute('aria-selected', 'true');
    // View Audit Logs sits left of Export (the primary action is last).
    const audit = canvas.getByRole('button', { name: 'View Audit Logs' }).getBoundingClientRect();
    const exportButton = canvas.getByRole('button', { name: 'Export' });
    await expect(exportButton.getBoundingClientRect().left).toBeGreaterThan(audit.right);
    await userEvent.click(exportButton);
    const menu = canvas.getByRole('menu', { name: 'Export' });
    await expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual([...exportMenuItems]);
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
  },
};

/** The Announcements page: a description under the title. */
export const WithDescription: Story = {
  name: 'With description',
  args: {
    title: 'Announcements',
    description: 'Manage application announcements and updates',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole('heading', { level: 1, name: 'Announcements' });
    const description = canvas.getByText('Manage application announcements and updates');
    // 4px under the title.
    await expect(Math.abs(description.getBoundingClientRect().top - heading.getBoundingClientRect().bottom - 4)).toBeLessThan(1);
  },
};

/** Dark: the Costs header. */
export const Dark: Story = {
  render: () => (
    <div className="pb-32">
      <CostsHeader />
    </div>
  ),
  globals: { theme: 'dark' },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();
  },
};
