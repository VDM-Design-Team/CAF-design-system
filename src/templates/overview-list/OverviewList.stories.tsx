import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import type { ThemeToggleTheme } from '../../components/theme-toggle';
import { announcements, exportStats } from '../../patterns/fixtures';
import { expectFrame, expectInOrder, expectTableInItsRegion, MOBILE_SNAPSHOT, MOBILE_VIEWPORT } from '../checks';
import { AnnouncementsScreen, ExportsScreen } from '../screens';
import { TemplateFrame } from '../TemplateFrame';

/** The real screens this template lays out (CAF Design file, Admin screens). */
type OverviewScreen = 'exports' | 'announcements';

interface OverviewTemplateProps {
  screen: OverviewScreen;
  theme: ThemeToggleTheme;
  onNavigate?: (page: string) => void;
  /** Announcements' View Changelog (the app opens the Changelog page, pattern U07). */
  onViewChangelog?: () => void;
}

function OverviewTemplate({ screen, theme, onNavigate, onViewChangelog }: OverviewTemplateProps) {
  return screen === 'exports' ? (
    <TemplateFrame app="admin" page="Exports" theme={theme} onNavigate={onNavigate}>
      <ExportsScreen />
    </TemplateFrame>
  ) : (
    <TemplateFrame app="admin" page="Announcements" theme={theme} onNavigate={onNavigate}>
      <AnnouncementsScreen onViewChangelog={onViewChangelog} />
    </TemplateFrame>
  );
}

const meta = {
  title: 'Templates/Overview list',
  component: OverviewTemplate,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'A list with its totals on top: the page title, a **Card / Stat Row** that counts the whole collection (not ' +
          'the page), then the list page’s filter bar, table and pagination. The screens it covers: **Admin / Exports** ' +
          '(2102:6902: Card / Stat Row – Exports; ••• → View Details opens pattern 13’s Export Details) and **Admin / ' +
          'Announcements** (2102:6628: a description under the title, Card / Stat Row – Announcements, then New ' +
          'Announcement and View Changelog above the filter bar; New Announcement opens pattern 14’s Create ' +
          'Announcement). Built from ExportsStatRow, AnnouncementsStatRow, ExportsTable, AnnouncementsTable and the ' +
          'filter bar parts of pattern 02 (`src/templates/screens.tsx`).',
      },
    },
  },
  args: { screen: 'exports', theme: 'light', onNavigate: fn(), onViewChangelog: fn() },
  render: (args, { globals }) => <OverviewTemplate {...args} theme={globals.theme === 'dark' ? 'dark' : 'light'} />,
} satisfies Meta<typeof OverviewTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Checks ─────────────────────────────────────────────────────────────── */

/** The stat card named `label` shows `value`. */
const expectStat = async (scope: HTMLElement, label: string, value: string) =>
  expect(within(within(scope).getByRole('article', { name: label })).getByText(value)).toBeVisible();

/** Exports: title, Stat Row (four totals), filter bar, table, pagination. */
async function expectExports(canvasElement: HTMLElement) {
  const { main, heading } = await expectFrame(canvasElement, 'Export Management');
  const page = within(main);
  const stats = page.getByRole('group', { name: 'Export totals' });
  await expect(within(stats).getAllByRole('article')).toHaveLength(4);
  // The totals count every export, not the four rows on the page.
  await expectStat(stats, 'Total Exports', String(exportStats.total));
  const bar = page.getByRole('search', { name: 'Filter exports' });
  await expect(within(bar).getByRole('searchbox', { name: 'Search exports' })).toBeVisible();
  await expect(within(bar).getByRole('combobox', { name: 'Status' })).toHaveTextContent('All Status');
  await expect(within(bar).getByRole('combobox', { name: 'Type' })).toHaveTextContent('All Types');
  const table = page.getByRole('table', { name: 'Exports' }) as HTMLTableElement;
  await expect(table.tBodies[0].rows).toHaveLength(4);
  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await expectInOrder([heading, stats, bar, table, pagination]);
  await expectTableInItsRegion(table);
}

/** Announcements: title and description, Stat Row (three totals), actions, filter bar, table. */
async function expectAnnouncements(canvasElement: HTMLElement) {
  const { main, heading } = await expectFrame(canvasElement, 'Announcements');
  const page = within(main);
  await expect(page.getByText('Manage application announcements and updates')).toBeVisible();
  const stats = page.getByRole('group', { name: 'Announcement totals' });
  await expect(within(stats).getAllByRole('article')).toHaveLength(3);
  await expectStat(stats, 'Total Announcements', String(announcements.length));
  const create = page.getByRole('button', { name: 'New Announcement' });
  await expect(page.getByRole('button', { name: 'View Changelog' })).toBeVisible();
  const bar = page.getByRole('search', { name: 'Filter announcements' });
  await expect(within(bar).getByRole('combobox', { name: 'Release date' })).toHaveTextContent('Filter Date');
  const table = page.getByRole('table', { name: 'Announcements' }) as HTMLTableElement;
  await expect(table.tBodies[0].rows).toHaveLength(announcements.length);
  // The screen's order: the actions sit between the totals and the filter bar.
  await expectInOrder([heading, stats, create, bar, table]);
  await expectTableInItsRegion(table);
}

/* ── Exports ────────────────────────────────────────────────────────────── */

/** Admin / Exports (2102:6902): four totals over the list; four exports a page. */
export const Exports: Story = {
  play: ({ canvasElement }) => expectExports(canvasElement),
};

export const ExportsDark: Story = {
  name: 'Exports, dark',
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: ({ canvasElement }) => expectExports(canvasElement),
};

/** Below 768px the stat cards and filters stack; the table is wider than a phone and scrolls in its own region, not the page. */
export const ExportsMobile: Story = {
  name: 'Exports, mobile',
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: ({ canvasElement }) => expectExports(canvasElement),
};

/* ── Announcements ──────────────────────────────────────────────────────── */

/** Admin / Announcements — List (2102:6628). */
export const Announcements: Story = {
  args: { screen: 'announcements' },
  play: ({ canvasElement }) => expectAnnouncements(canvasElement),
};

export const AnnouncementsDark: Story = {
  name: 'Announcements, dark',
  args: { screen: 'announcements' },
  globals: { theme: 'dark' },
  tags: ['!autodocs'],
  play: ({ canvasElement }) => expectAnnouncements(canvasElement),
};

export const AnnouncementsMobile: Story = {
  name: 'Announcements, mobile',
  args: { screen: 'announcements' },
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: ({ canvasElement }) => expectAnnouncements(canvasElement),
};
