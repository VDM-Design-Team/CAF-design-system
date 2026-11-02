import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../components/button';
import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { ToastProvider, useToast } from '../../components/toast';
import { AnnouncementsTable } from '../announcements/AnnouncementsTable';
import { CreateAnnouncementDialog } from '../announcements/CreateAnnouncementDialog';
import { emptyStateCopy, exportRecords, users, type Announcement } from '../fixtures';
import { ExportDetailsDialog } from '../overview/ExportDetailsDialog';
import { PageHeader } from '../page/PageHeader';
import { UsersPage } from './UsersPage';

/* ── The steps' screens ─────────────────────────────────────────────────── */

/* Step 2 · Loading a dialog (528:5881): the Exports page with Export Details open on its Spinner. */
function LoadingDialogScreen() {
  const [open, setOpen] = useState(true);
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title="Exports" />
      <ExportDetailsDialog open={open} onClose={() => setOpen(false)} record={exportRecords[0]} downloads={0} loading />
    </main>
  );
}

/* Step 3 · Nothing here yet (528:5933): Announcements with no rows. Both Add New buttons open
   Create Announcement (pattern 14); creating one fills the table. */
function EmptyListScreen() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Announcement[]>([]);
  const [creating, setCreating] = useState(false);
  const addNew = (
    <Button leftIcon={<Icon name="plus" />} onClick={() => setCreating(true)}>
      Add New
    </Button>
  );
  return (
    <main className="flex flex-col gap-6 p-6 pb-64">
      <PageHeader title="Announcements" actions={addNew} />
      <AnnouncementsTable
        rows={rows}
        empty={
          <EmptyState
            title={emptyStateCopy.announcements.title}
            description={emptyStateCopy.announcements.description}
            action={addNew}
          />
        }
      />
      <CreateAnnouncementDialog
        open={creating}
        onClose={() => setCreating(false)}
        today={new Date(2026, 10, 2)}
        onCreate={(announcement) => {
          setRows((all) => [{ ...announcement, id: String(all.length + 1) }, ...all]);
          setCreating(false);
          toast({ type: 'success', message: 'Announcement created.' });
        }}
      />
    </main>
  );
}

/* Step 4 · Page not found (528:6010): 404 over the Default Empty State; "Go back home" returns to Costs. */
function NotFoundScreen() {
  const [home, setHome] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  /* A page change moves focus to the new page, as a router would. */
  useEffect(() => {
    if (home) mainRef.current?.focus();
  }, [home]);
  if (home) {
    return (
      <main ref={mainRef} tabIndex={-1} className="flex flex-col gap-6 p-6">
        <PageHeader title="Costs" />
      </main>
    );
  }
  const copy = emptyStateCopy.notFound;
  return (
    <main className="flex flex-col items-center gap-4 px-6 py-16">
      {/* Figma's "404": Display/xl-bold in text.brand.medium. */}
      <h1 className="text-display-xl-bold text-text-brand-medium">
        {copy.code}
        <span className="sr-only"> Page not found</span>
      </h1>
      <EmptyState
        title={copy.title}
        description={copy.description}
        action={<Button onClick={() => setHome(true)}>{copy.action}</Button>}
      />
    </main>
  );
}

const meta = {
  title: 'Patterns/Loading, empty & error states',
  component: UsersPage,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern 11 (Figma 528:6035): every list and dialog handles waiting, having nothing to show and pages that ' +
          'don’t exist, and keeps its layout while it does. A table shows **SkeletonTableRow**s under its real header, ' +
          'with the filters in place, and is `aria-busy`; a dialog opens straight away with a 24px **Spinner**; an ' +
          'empty list shows the Default **EmptyState** with its primary action; a search with no results shows the ' +
          'Compact one (“No items.”) inside the table; an unknown URL shows 404 and “Go back home”. Figma draws no ' +
          'failed load: here it is an Error **Alert** above the table with a Retry Button. The Users screen is ' +
          '`UsersPage` (`src/patterns/states/`), shared with pattern 12.',
      },
    },
  },
} satisfies Meta<typeof UsersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Helpers for the plays ──────────────────────────────────────────────── */

const usersTable = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole('table', { name: 'Users' }) as HTMLTableElement;
const bodyRows = (table: HTMLTableElement) => Array.from(table.tBodies[0].rows);
const rowIds = (table: HTMLTableElement) =>
  bodyRows(table)
    .map((r) => r.dataset.id)
    .filter(Boolean);
const skeletons = (table: HTMLTableElement) => bodyRows(table).filter((r) => r.getAttribute('aria-hidden') === 'true');

/** Step 1 · Loading a list: skeleton rows hold the table’s shape; the header and filters are already in place. */
export const LoadingAList: Story = {
  name: 'Loading a list',
  args: { load: { latency: null } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = usersTable(canvasElement);
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading users');
    // Five Skeleton / Table Rows, one placeholder per column, hidden from assistive tech.
    await expect(skeletons(table)).toHaveLength(5);
    for (const row of skeletons(table)) await expect(row.cells).toHaveLength(3);
    // The real header, the filters and the page action are there already.
    await expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Name', 'Role', 'Date Created']);
    await expect(canvas.getByRole('searchbox', { name: 'Search users' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Role: All Roles' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add New' })).toBeVisible();
  },
};

/**
 * The list loads: skeletons, then the rows, in the same columns (nothing jumps). A search with no
 * results shows the Compact Empty State inside the table, with the filters still there; clearing the
 * search brings the rows back.
 */
export const LoadsThenNoResults: Story = {
  name: 'Loads, then no results',
  args: { load: { latency: 800 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = usersTable(canvasElement);
    await expect(skeletons(table)).toHaveLength(5);
    const skeletonHeight = skeletons(table)[0].getBoundingClientRect().height;

    await waitFor(() => expect(rowIds(table)).toHaveLength(users.length), { timeout: 3000 });
    await expect(table).not.toHaveAttribute('aria-busy');
    await expect(canvas.getByRole('status')).toBeEmptyDOMElement();
    // A loaded row is at least as tall as the skeleton row it replaced.
    await expect(bodyRows(table)[0].getBoundingClientRect().height).toBeGreaterThanOrEqual(skeletonHeight - 1);

    // No results: "No items." in the table; the filters stay visible.
    const search = canvas.getByRole('searchbox', { name: 'Search users' });
    await userEvent.type(search, 'zzz');
    await expect(rowIds(table)).toEqual([]);
    await expect(within(table).getByText(emptyStateCopy.noResults.title)).toBeVisible();
    await expect(search).toBeVisible();

    // Escape clears the search: the rows come back.
    await userEvent.keyboard('{Escape}');
    await expect(rowIds(table)).toHaveLength(users.length);
  },
};

/**
 * The first load fails: an Error Alert above the table says what happened and what to do, with Retry
 * under it. Retry (from the keyboard) loads again, puts focus on the table, and the rows arrive.
 */
export const LoadFailsThenRetry: Story = {
  name: 'Load fails, then retry',
  args: { load: { latency: 600, outcomes: ['error', 'rows'] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = usersTable(canvasElement);
    await expect(skeletons(table)).toHaveLength(5);

    const alert = await canvas.findByRole('alert', {}, { timeout: 3000 });
    await expect(alert).toHaveTextContent('Couldn’t load users.Check your connection and try again.');
    // Above the table; the table keeps its header, with no rows.
    await expect(alert.getBoundingClientRect().bottom).toBeLessThan(table.getBoundingClientRect().top);
    await expect(bodyRows(table)).toHaveLength(0);
    await expect(table).not.toHaveAttribute('aria-busy');

    const retry = canvas.getByRole('button', { name: 'Retry' });
    retry.focus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(table).toHaveFocus();
    await expect(skeletons(table)).toHaveLength(5);
    await waitFor(() => expect(rowIds(table)).toHaveLength(users.length), { timeout: 3000 });
  },
};

/** Step 2 · Loading a dialog: it opens straight away, with a Spinner in its body until the content arrives. */
export const LoadingADialog: Story = {
  name: 'Loading a dialog',
  render: () => <LoadingDialogScreen />,
  // An open dialog makes the rest of the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Export Details' });
    // The Spinner says what is loading; the visible "Loading…" isn't read twice.
    await expect(within(dialog).getByRole('status')).toHaveTextContent('Loading export details');
    const text = within(dialog).getByText('Loading…');
    await expect(text).toBeVisible();
    await expect(text).toHaveAttribute('aria-hidden', 'true');
    // 24px, centred in the body, above the text; no footer yet.
    const spinner = within(dialog).getByRole('status').getBoundingClientRect();
    await expect(spinner.width).toBe(24);
    const body = text.parentElement!.getBoundingClientRect();
    await expect(Math.abs(spinner.left + spinner.width / 2 - (body.left + body.width / 2))).toBeLessThan(1);
    await expect(spinner.bottom).toBeLessThanOrEqual(text.getBoundingClientRect().top);
    await expect(within(dialog).getAllByRole('button').map((b) => b.textContent || b.getAttribute('aria-label'))).toEqual(['Close']);
  },
};

/**
 * Step 3 · Nothing here yet: the Default Empty State says what belongs here and offers the primary
 * action. Its Add New opens Create Announcement; Escape closes it and focus goes back to that button.
 */
export const NothingHereYet: Story = {
  name: 'Nothing here yet',
  render: () => <EmptyListScreen />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Announcements' });
    await expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Title',
      'Version',
      'Target Audience',
      'Status',
    ]);
    await expect(within(table).getByText(emptyStateCopy.announcements.title)).toBeVisible();
    await expect(within(table).getByText(emptyStateCopy.announcements.description)).toBeVisible();

    const add = within(table).getByRole('button', { name: 'Add New' });
    add.focus();
    await userEvent.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Create Announcement' });
    await expect(dialog).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(add).toHaveFocus();
  },
};

/** Step 4 · Page not found: 404 and a friendly message, with a way back to Costs. */
export const PageNotFound: Story = {
  name: 'Page not found',
  render: () => <NotFoundScreen />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('404 Page not found');
    await expect(canvas.getByText(emptyStateCopy.notFound.title)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: emptyStateCopy.notFound.action }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();
    await expect(canvas.getByRole('main')).toHaveFocus();
  },
};

/** Dark: the list loading. */
export const Dark: Story = {
  args: { load: { latency: null } },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(skeletons(usersTable(canvasElement))).toHaveLength(5);
  },
};
