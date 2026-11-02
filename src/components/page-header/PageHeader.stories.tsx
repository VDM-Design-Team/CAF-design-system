import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Icon } from '../icon';
import { MenuItem } from '../menu-item';
import { MenuTriggerButton } from '../menu-trigger-button';
import { TabItem } from '../tab-item';
import { Tabs } from '../tabs';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'Components/PageHeader',
  component: PageHeader,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Layout** (`Page Header`): the top of every list and form page. ' +
          '`title` is an `<h1>` in Heading/xl-bold (`headingLevel` changes the element, not the look), ' +
          '`description` a line under it, `tabs` sit after the title and a vertical Divider, and `actions` are the ' +
          'page’s buttons, primary last, named for their item (“New Announcement”). It wraps on a narrow screen.',
      },
    },
  },
  args: {
    title: 'Announcements',
    description: 'Manage application announcements and updates',
    actions: (
      <>
        <Button variant="outlined">View Changelog</Button>
        <Button leftIcon={<Icon name="plus" size={20} />}>New Announcement</Button>
      </>
    ),
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Announcements: description and two actions. */
export const Playground: Story = {};

const costTabs = (
  <Tabs aria-label="Cost type" defaultSelected="all">
    <TabItem value="all">All</TabItem>
    <TabItem value="recurring">Recurring</TabItem>
    <TabItem value="single">Single</TabItem>
  </Tabs>
);

/** Costs: the Cost Type tabs after the title, View Audit Logs and the Export menu. */
export const Costs: Story = {
  args: {
    title: 'Costs',
    description: undefined,
    tabs: costTabs,
    actions: (
      <>
        <Button variant="outlined">View Audit Logs</Button>
        <MenuTriggerButton label="Export">
          <MenuItem>Download CSV</MenuItem>
          <MenuItem>Download Excel</MenuItem>
        </MenuTriggerButton>
      </>
    ),
  },
};

/** A form page (New Cost): the title only, no actions. */
export const FormPage: Story = {
  args: { title: 'New Cost', description: 'Submit a single or recurring cost for review.', actions: undefined },
};

/* A token's computed colour in the current theme. Measure before waitFor, never inside it. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/* ── The headers the CAF screens use, in Light and Dark ─────────────────── */

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Pages — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex w-full max-w-6xl flex-col gap-12">
      <PageHeader data-page="costs" title="Costs" tabs={costTabs} actions={<Button variant="outlined">View Audit Logs</Button>} />
      <PageHeader
        data-page="announcements"
        headingLevel={2}
        title="Announcements"
        description="Manage application announcements and updates"
        actions={
          <>
            <Button variant="outlined">View Changelog</Button>
            <Button>New Announcement</Button>
          </>
        }
      />
      <PageHeader data-page="cost-centers" headingLevel={2} title="Cost Centers" actions={<Button>New Cost Center</Button>} />
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { title: tokenColour('text-primary'), description: tokenColour('text-secondary'), rule: tokenColour('stroke-subtle') };
    const page = (name: string) => canvasElement.querySelector<HTMLElement>(`[data-page="${name}"]`)!;
    const costs = page('costs');
    const announcements = page('announcements');
    await expect(within(costs).getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();
    await expect(within(announcements).getByRole('heading', { level: 2, name: 'Announcements' })).toBeVisible();
    await waitFor(() => {
      // Title: Heading/xl-bold in text.primary.
      const title = getComputedStyle(within(announcements).getByRole('heading'));
      expect(title.color).toBe(want.title);
      expect(title.fontWeight).toBe('700');
      // Description: text.secondary, 4px under the title.
      const description = within(announcements).getByText('Manage application announcements and updates');
      expect(getComputedStyle(description).color).toBe(want.description);
      const heading = within(announcements).getByRole('heading').getBoundingClientRect();
      expect(description.getBoundingClientRect().top - heading.bottom).toBe(4);
      // Tabs: after a vertical stroke.subtle rule, 20px either side.
      const rule = costs.querySelector<HTMLElement>('[role="separator"]')!;
      expect(rule).toHaveAttribute('aria-hidden', 'true');
      expect(getComputedStyle(rule).borderLeftColor).toBe(want.rule);
      const tabs = within(costs).getByRole('tablist').getBoundingClientRect();
      const ruleBox = rule.getBoundingClientRect();
      expect(ruleBox.left - within(costs).getByRole('heading').getBoundingClientRect().right).toBe(20);
      expect(tabs.left - ruleBox.right).toBe(20);
      // Actions: at the right edge, 12px apart, centred on the title block.
      const [secondary, primary] = within(announcements).getAllByRole('button');
      expect(primary.getBoundingClientRect().left - secondary.getBoundingClientRect().right).toBe(12);
      expect(Math.round(primary.getBoundingClientRect().right)).toBe(Math.round(announcements.getBoundingClientRect().right));
    });
  },
});

export const PagesLight = grid('light');
export const PagesDark = grid('dark');
