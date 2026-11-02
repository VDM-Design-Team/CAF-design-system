import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { AppHeader, APP_HEADER_USER_PAGES, type AppHeaderLink } from '../../components/app-header';
import type { ThemeToggleTheme } from '../../components/theme-toggle';
import { ToastProvider } from '../../components/toast';
import { exportMenuItems, LIST_TODAY, myCosts } from '../fixtures';
import { CostsListPage, EXPORT_STARTED, type CostsListPageProps } from '../list-page/CostsListPage';

const USER_LINKS: AppHeaderLink[] = APP_HEADER_USER_PAGES.map((label) => ({
  label,
  href: `#${label.toLowerCase().replace(/ /g, '-')}`,
}));

/* The user's Costs page (U01): Navigation / Header – User on Costs, then the list. The
   header's theme toggle is the header's own state; the document's theme is the toolbar's. */
function MyCostsPage({ theme: initialTheme = 'light', ...props }: Partial<CostsListPageProps> & { theme?: ThemeToggleTheme }) {
  const [theme, setTheme] = useState<ThemeToggleTheme>(initialTheme);
  return (
    <ToastProvider>
      <AppHeader links={USER_LINKS} page="Costs" username="QA Test" theme={theme} onThemeChange={setTheme} />
      <CostsListPage rows={myCosts} audience="user" today={LIST_TODAY} {...props} />
    </ToastProvider>
  );
}

const meta = {
  title: 'Patterns/My costs list',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'User pattern U01 (Patterns – User, 545:13220): the user’s Costs page, every cost they submitted and where ' +
          'it is in review. It is the List page (pattern 01) for a user: Navigation / Header – User; the title, Tabs / ' +
          'Cost Type and Export (Button / Menu Trigger) — no Add New, Change Status or View Audit Logs; the Costs ' +
          'filter bar, as in pattern 02; the Costs table without the checkbox column (users have no bulk actions), ' +
          'newest first, whose caret opens the breakdown; pagination. Export lists Export Costs and Export Invoices and ' +
          'raises pattern 12’s toast. ••• → View invoices (the invoices dialog) is pattern 03’s.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* Helpers for the plays. */
const costsTable = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Costs' }) as HTMLTableElement;
const rowIds = (table: HTMLTableElement) =>
  Array.from(table.tBodies[0].rows)
    .map((r) => r.dataset.id)
    .filter(Boolean);

/* U01 step 1 (545:13511): the User Costs screen's rows, in its order. */
const SCREEN_IDS = ['37022', '37021', '37003', '36723', '36664', '36663', '36612', '36078'];

/**
 * Step 1 · Your costs, newest first: each row shows the account, invoice, amount, payment method,
 * status and date submitted. The user's header and page actions; no checkboxes, no row menu.
 */
export const YourCosts: Story = {
  name: 'Your costs, newest first',
  render: () => <MyCostsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // One banner, one main; every nav has its own name.
    await expect(canvas.getAllByRole('banner')).toHaveLength(1);
    await expect(canvas.getAllByRole('main')).toHaveLength(1);
    const navs = canvas.getAllByRole('navigation').map((nav) => nav.getAttribute('aria-label'));
    await expect(new Set(navs).size).toBe(navs.length);
    const mainNav = canvas.getByRole('navigation', { name: 'Main' });
    await expect(within(mainNav).getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByText('Hi, QA Test')).toBeVisible();

    // The page header: title, type tabs and Export — nothing that changes a cost.
    await expect(canvas.getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();
    await expect(canvas.getByRole('tablist', { name: 'Cost type' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Export' })).toBeVisible();
    for (const name of ['Add New', 'View Audit Logs', /Change Status/]) {
      await expect(canvas.queryByRole('button', { name })).not.toBeInTheDocument();
    }

    // The table: Figma's columns, no checkbox column, no ••• column; the screen's rows, newest first.
    const table = costsTable(canvasElement);
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent);
    await expect(headers).toEqual(['Details', 'Account', 'Invoice #', 'Amount', 'Payment Method', 'Status', 'Date Submitted']);
    await expect(within(table).queryAllByRole('checkbox')).toHaveLength(0);
    await expect(within(table).queryByRole('button', { name: /^Actions for cost/ })).not.toBeInTheDocument();
    await expect(rowIds(table)).toEqual(SCREEN_IDS);
    const first = table.querySelector<HTMLTableRowElement>('tr[data-id="37022"]')!;
    await expect(within(first).getByText('Recurring')).toBeVisible();
    await expect(within(first).getByText('Pending')).toBeVisible();
    await expect(within(first).getByText('September 24, 2026')).toBeVisible();

    // The filter bar is the Costs bar, every field (pattern 02).
    const bar = within(canvas.getByRole('search', { name: 'Filter costs' }));
    await expect(bar.getByRole('searchbox', { name: 'Search costs' })).toBeVisible();
    for (const name of ['Status: All Status', 'Payment method: All Payment Method', 'Currency: All Currency', 'Period: Select Period', 'Creation date: Creation Date']) {
      await expect(bar.getByRole('button', { name })).toBeVisible();
    }

    // 15 costs: two pages; the second holds the older ones.
    const pages = within(canvas.getByRole('navigation', { name: 'Pagination' }));
    await expect(pages.queryByRole('button', { name: 'Page 3' })).not.toBeInTheDocument();
    await userEvent.click(pages.getByRole('button', { name: 'Page 2' }));
    await expect(rowIds(table)).toEqual(myCosts.slice(8).map((c) => c.id));
  },
};

/** Step 2 · Expand for the breakdown: the caret opens the breakdown lines under the row; several rows can be open at once. */
export const ExpandBreakdown: Story = {
  name: 'Expand for the breakdown',
  render: () => <MyCostsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole('button', { name: 'Show details for cost 37022' });
    await userEvent.click(first);
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    const breakdown = canvas.getByRole('table', { name: 'Breakdown of cost 37022' });
    await expect(within(breakdown).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Title',
      'Amount',
      'Nature of Service',
      'Cost Center',
      'Location',
      'Period',
    ]);
    await expect(within(breakdown).getByText('July 1, 2026 - July 31, 2026')).toBeVisible();

    // A second row opens too; the first stays open.
    await userEvent.click(canvas.getByRole('button', { name: 'Show details for cost 37021' }));
    await expect(canvas.getByRole('table', { name: 'Breakdown of cost 37021' })).toBeVisible();
    await expect(canvas.getByRole('table', { name: 'Breakdown of cost 37022' })).toBeVisible();

    // From the keyboard: Enter on the first caret closes its breakdown; focus stays on it.
    first.focus();
    await userEvent.keyboard('{Enter}');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('table', { name: 'Breakdown of cost 37022' })).not.toBeInTheDocument();
    await expect(first).toHaveFocus();
  },
};

/** Step 3 · Export costs or invoices, as Figma draws it: the Export menu open under the button. */
export const ExportMenu: Story = {
  name: 'Export menu',
  render: () => <MyCostsPage openExport />,
  // An open menu: Chromatic snapshots it open. Not on the docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Export' });
    const menu = canvas.getByRole('menu', { name: 'Export' });
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual([...exportMenuItems]);
    // Under the button, flush with its right edge (it ends the page header).
    const b = button.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    await expect(m.top).toBeGreaterThan(b.bottom);
    await expect(Math.abs(m.right - b.right)).toBeLessThan(1);
  },
};

/** Step 3 from the keyboard: ↓ opens Export on Export Costs, ↓ Enter chooses Export Invoices, and the toast says it started. */
export const ExportInvoices: Story = {
  name: 'Export invoices',
  render: () => <MyCostsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Export' });
    button.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Export Costs' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(button).toHaveFocus();
    const notifications = within(screen.getByRole('region', { name: 'Notifications' }));
    await waitFor(() => expect(notifications.getByText(EXPORT_STARTED)).toBeVisible());
  },
};

/** Dark: step 2, the first cost's breakdown open. */
export const Dark: Story = {
  render: () => <MyCostsPage theme="dark" initialExpanded={['37022']} />,
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();
    await expect(canvas.getByRole('table', { name: 'Breakdown of cost 37022' })).toBeVisible();
  },
};
