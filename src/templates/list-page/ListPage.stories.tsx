import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import type { ThemeToggleTheme } from '../../components/theme-toggle';
import { contacts, COSTS_PAGE_SIZE, drafts, myCosts, type Draft } from '../../patterns/fixtures';
import { expectFrame, expectInOrder, expectTableInItsRegion, isDesktop, MOBILE_SNAPSHOT, MOBILE_VIEWPORT } from '../checks';
import { AdminCostsScreen, APP_SCREENS, DraftsScreen, UserCostsScreen } from '../screens';
import { TemplateFrame } from '../TemplateFrame';

/** The real screens this template lays out (CAF Design file). */
type ListScreen = 'costs' | 'my-costs' | 'drafts' | 'contacts';

interface ListTemplateProps {
  screen: ListScreen;
  theme: ThemeToggleTheme;
  onNavigate?: (page: string) => void;
  /** Drafts' ••• → Edit (the app reopens Create Cost, pattern U03). */
  onEditDraft?: (draft: Draft) => void;
}

function ListTemplate({ screen, theme, onNavigate, onEditDraft }: ListTemplateProps) {
  if (screen === 'costs') {
    return (
      <TemplateFrame app="admin" page="Costs" theme={theme} onNavigate={onNavigate}>
        <AdminCostsScreen />
      </TemplateFrame>
    );
  }
  if (screen === 'my-costs') {
    return (
      <TemplateFrame app="user" page="Costs" theme={theme} onNavigate={onNavigate}>
        <UserCostsScreen />
      </TemplateFrame>
    );
  }
  if (screen === 'contacts') {
    return (
      <TemplateFrame app="admin" page="Contacts" theme={theme} onNavigate={onNavigate}>
        {APP_SCREENS.admin.Contacts?.()}
      </TemplateFrame>
    );
  }
  return (
    <TemplateFrame app="user" page="Drafts" theme={theme} onNavigate={onNavigate}>
      <DraftsScreen onEdit={onEditDraft} />
    </TemplateFrame>
  );
}

const meta = {
  title: 'Templates/List page',
  component: ListTemplate,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'The layout of every list in the CAF Design file: the page title with its actions on the right (and Tabs ' +
          'beside the title where the list has types), the filter bar, the table, and pagination at the bottom right, ' +
          '24 apart in the app’s frame. Three of the screens it covers: **Admin / Costs** (2102:5749), the user’s ' +
          '**Costs** (2102:1069), **Drafts** (User 2102:1342; Admin 2102:7086 is the same page) and **Admin / Contacts** ' +
          '(2102:6234, pattern 16). Cost Centers, Partners, Users and Recurring Costs follow it too (Overlay flows shows Cost Centers and Recurring ' +
          'Costs). Built from CostsListPage, DraftsList, ContactsListPage and the patterns they use (01, 02, U01, U03, 16); the rows’ menus, ' +
          'selection and expanded details are the patterns’ stories.',
      },
    },
  },
  args: { screen: 'costs', theme: 'light', onNavigate: fn(), onEditDraft: fn() },
  render: (args, { globals }) => <ListTemplate {...args} theme={globals.theme === 'dark' ? 'dark' : 'light'} />,
} satisfies Meta<typeof ListTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Checks ─────────────────────────────────────────────────────────────── */

const rowIds = (table: HTMLTableElement) =>
  Array.from(table.tBodies[0].rows)
    .map((row) => row.dataset.id)
    .filter(Boolean);

/** Pagination sits at the bottom right: its right edge on the filter bar's, which spans the page. */
async function expectPaginationRight(pagination: HTMLElement, fullWidth: HTMLElement) {
  await expect(Math.abs(pagination.getBoundingClientRect().right - fullWidth.getBoundingClientRect().right)).toBeLessThan(1);
}

/** A Costs list: title + Tabs / Cost Type + actions, Filter / Bar – Costs, the Costs table, pagination. */
async function expectCostsList(canvasElement: HTMLElement, audience: 'admin' | 'user') {
  const { main, heading } = await expectFrame(canvasElement, 'Costs');
  const page = within(main);
  const tabs = page.getByRole('tablist', { name: 'Cost type' });
  await expect(within(tabs).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['All', 'Recurring', 'Single']);
  const exportButton = page.getByRole('button', { name: 'Export' });
  if (audience === 'admin') await expect(page.getByRole('button', { name: 'View Audit Logs' })).toBeVisible();
  else await expect(page.queryByRole('button', { name: 'View Audit Logs' })).toBeNull();

  const bar = page.getByRole('search', { name: 'Filter costs' });
  const table = page.getByRole('table', { name: 'Costs' }) as HTMLTableElement;
  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await expectInOrder([heading, bar, table, pagination]);
  await expectPaginationRight(pagination, bar);
  // On a phone (and for Admin Costs at 1024) the table scrolls in its own region; the page never does.
  await expectTableInItsRegion(table);

  // A page of eight; no selection column (bulk selection is pattern 07's).
  await expect(rowIds(table)).toHaveLength(COSTS_PAGE_SIZE);
  await expect(within(table).queryAllByRole('checkbox')).toHaveLength(0);
  if (audience === 'user') await expect(rowIds(table)).toEqual(myCosts.slice(0, COSTS_PAGE_SIZE).map((c) => c.id));
  // The title row: the actions on the right of the title and tabs (they wrap under them on a phone).
  if (isDesktop()) await expect(exportButton.getBoundingClientRect().left).toBeGreaterThan(tabs.getBoundingClientRect().right);
}

/** Drafts: the title alone, the filter bar with Search (Clear Filters only while searching), the Drafts table, pagination. */
async function expectDraftsList(canvasElement: HTMLElement) {
  const { main, heading } = await expectFrame(canvasElement, 'Drafts');
  const page = within(main);
  const search = page.getByRole('searchbox', { name: 'Search drafts' });
  // Nothing to clear yet: Clear Filters is hidden, not disabled (decision filter-clear-disabled).
  await expect(page.getByRole('search', { name: 'Filter drafts' })).toContainElement(search);
  await expect(page.queryByRole('button', { name: 'Clear Filters' })).toBeNull();
  const table = page.getByRole('table', { name: 'Drafts' }) as HTMLTableElement;
  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await expectInOrder([heading, search, table, pagination]);
  await expectTableInItsRegion(table);
  await expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
    'ID',
    'Created By',
    'Frequency',
    'Applicant Name',
    'Email',
    'Date Created',
    'Actions',
  ]);
  await expect(rowIds(table)).toEqual(drafts.map((d) => d.id));
  await expect(within(table).getByRole('button', { name: `Actions for draft ${drafts[0].id}` })).toBeVisible();
}

/* ── Admin / Costs ──────────────────────────────────────────────────────── */

/** Admin / Costs — List (2102:5749): View Audit Logs and Export on the right; eight costs a page. */
export const Costs: Story = {
  play: ({ canvasElement }) => expectCostsList(canvasElement, 'admin'),
};

export const CostsDark: Story = {
  name: 'Costs, dark',
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: ({ canvasElement }) => expectCostsList(canvasElement, 'admin'),
};

/**
 * Below 768px the title row wraps; the table is wider than a phone, so it
 * scrolls sideways in its own region (a tab stop, named Costs) and the page
 * doesn't. Row menus open outside the region.
 */
export const CostsMobile: Story = {
  name: 'Costs, mobile',
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: ({ canvasElement }) => expectCostsList(canvasElement, 'admin'),
};

/* A 1024 × 768 screen: AppShell's content box is 976 (24 at each side). Not one of Storybook's presets. */
const LAPTOP_VIEWPORTS = { laptop1024: { name: 'Laptop (1024)', styles: { width: '1024px', height: '768px' }, type: 'desktop' } };

/**
 * At 1024 the Costs table needs a few pixels more than the 976 it gets (about
 * 977–982, depending on the font's metrics): it scrolls by those pixels inside
 * its region, and the page doesn't scroll sideways. Where it fits, the region
 * is a plain box.
 */
export const CostsAt1024: Story = {
  name: 'Costs, 1024',
  globals: { viewport: { value: 'laptop1024', isRotated: false } },
  parameters: { viewport: { options: LAPTOP_VIEWPORTS }, chromatic: { viewports: [1024] } },
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expectCostsList(canvasElement, 'admin');
    const table = within(canvasElement).getByRole('table', { name: 'Costs' }) as HTMLTableElement;
    const region = table.parentElement!;
    // The region takes the page's content box (976 at 1024): the table never pushes it wider.
    const main = within(canvasElement).getByRole('main');
    const container = region.parentElement!;
    await expect(region.getBoundingClientRect().width).toBeCloseTo(container.getBoundingClientRect().width, 0);
    await expect(main.getBoundingClientRect().right).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};

/* ── User / Costs ───────────────────────────────────────────────────────── */

/** User / Costs — List (2102:1069): the user’s own costs; Export only, no View Audit Logs. */
export const MyCosts: Story = {
  name: 'My costs',
  args: { screen: 'my-costs' },
  play: ({ canvasElement }) => expectCostsList(canvasElement, 'user'),
};

export const MyCostsDark: Story = {
  name: 'My costs, dark',
  args: { screen: 'my-costs' },
  globals: { theme: 'dark' },
  tags: ['!autodocs'],
  play: ({ canvasElement }) => expectCostsList(canvasElement, 'user'),
};

export const MyCostsMobile: Story = {
  name: 'My costs, mobile',
  args: { screen: 'my-costs' },
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: ({ canvasElement }) => expectCostsList(canvasElement, 'user'),
};

/* ── Drafts ─────────────────────────────────────────────────────────────── */

/** User / Drafts — List (2102:1342): no actions and no tabs; Search and Clear Filters over the table. */
export const Drafts: Story = {
  args: { screen: 'drafts' },
  play: ({ canvasElement }) => expectDraftsList(canvasElement),
};

export const DraftsDark: Story = {
  name: 'Drafts, dark',
  args: { screen: 'drafts' },
  globals: { theme: 'dark' },
  tags: ['!autodocs'],
  play: ({ canvasElement }) => expectDraftsList(canvasElement),
};

export const DraftsMobile: Story = {
  name: 'Drafts, mobile',
  args: { screen: 'drafts' },
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: ({ canvasElement }) => expectDraftsList(canvasElement),
};

/* ── Admin / Contacts ───────────────────────────────────────────────────── */

/** Contacts: the title alone, Search contacts and Select Period, the Contacts table with Remove on every row, pagination. */
async function expectContactsList(canvasElement: HTMLElement) {
  const { main, heading } = await expectFrame(canvasElement, 'Contacts');
  const page = within(main);
  const bar = page.getByRole('search', { name: 'Filter contacts' });
  await expect(within(bar).getByRole('searchbox', { name: 'Search contacts' })).toBeVisible();
  await expect(page.queryByRole('button', { name: 'Clear Filters' })).toBeNull();
  const table = page.getByRole('table', { name: 'Contacts' }) as HTMLTableElement;
  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await expectInOrder([heading, bar, table, pagination]);
  await expectPaginationRight(pagination, bar);
  await expectTableInItsRegion(table);
  await expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
    'Email',
    'Date Received',
    'Subject',
    'Message',
    'Actions',
  ]);
  // Every message, newest first, each with its own Remove.
  await expect(rowIds(table)).toHaveLength(contacts.length);
  await expect(within(table).getAllByRole('button', { name: /^Remove message from / })).toHaveLength(contacts.length);
}

/** Admin / Contacts (2102:6234), as pattern 16 draws it: no page actions; rows don't open. */
export const Contacts: Story = {
  args: { screen: 'contacts' },
  play: ({ canvasElement }) => expectContactsList(canvasElement),
};

export const ContactsDark: Story = {
  name: 'Contacts, dark',
  args: { screen: 'contacts' },
  globals: { theme: 'dark' },
  tags: ['!autodocs'],
  play: ({ canvasElement }) => expectContactsList(canvasElement),
};

export const ContactsMobile: Story = {
  name: 'Contacts, mobile',
  args: { screen: 'contacts' },
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: ({ canvasElement }) => expectContactsList(canvasElement),
};
