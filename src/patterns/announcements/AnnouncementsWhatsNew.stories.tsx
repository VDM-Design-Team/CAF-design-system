import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { AppHeader, APP_HEADER_USER_PAGES, type AppHeaderLink } from '../../components/app-header';
import { BulletItem } from '../../components/bullet-item';
import { Button } from '../../components/button';
import { ChangelogEntry } from '../../components/changelog-entry';
import { ChangelogModal } from '../../components/changelog-modal';
import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { MenuItem } from '../../components/menu-item';
import { ModalConfirm } from '../../components/modal-confirm';
import { NavLink } from '../../components/nav-link';
import { TabItem } from '../../components/tab-item';
import { Tabs } from '../../components/tabs';
import type { ThemeToggleTheme } from '../../components/theme-toggle';
import { ToastProvider, useToast } from '../../components/toast';
import { CostsTable } from '../costs/CostsTable';
import {
  announcements,
  changelog,
  changelogPage,
  costs,
  emptyStateCopy,
  formatDate,
  type Announcement,
} from '../fixtures';
import { AnnouncementsStatRow, summariseAnnouncements } from '../overview/StatRows';
import { PageHeader } from '../../components/page-header';
import { AnnouncementsTable } from './AnnouncementsTable';
import { CreateAnnouncementDialog } from './CreateAnnouncementDialog';

/* The day the Release Date calendar calls today, pinned so snapshots hold still. */
const TODAY = new Date(2026, 10, 2);

/* ── Admin: Announcements (Step 1, 529:6983) ────────────────────────────── */

/* The release, as Modal / Changelog shows it: headline, long date, version badge and the features. */
function WhatsNew({
  announcement,
  open,
  onClose,
  onViewChangeLog,
}: {
  announcement: Announcement | null;
  open: boolean;
  onClose: () => void;
  onViewChangeLog: () => void;
}) {
  return (
    <ChangelogModal
      open={open && !!announcement}
      onClose={onClose}
      onViewChangeLog={onViewChangeLog}
      title={announcement?.title}
      date={announcement ? formatDate(announcement.releasedAt) : undefined}
      version={announcement ? `v${announcement.version}` : undefined}
    >
      {announcement?.features.map((feature) => <BulletItem key={feature}>{feature}</BulletItem>)}
    </ChangelogModal>
  );
}

function AnnouncementsAdminPage({ creating: startCreating = false }: { creating?: boolean }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Announcement[]>(announcements);
  const [creating, setCreating] = useState(startCreating);
  const [preview, setPreview] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const addNewRef = useRef<HTMLButtonElement>(null);
  const focusAfterDelete = useRef<string | null>(null);

  /* After a delete, focus the next row's ••• (or the previous one's, or Add New): its own is gone. */
  useEffect(() => {
    if (deleting || !focusAfterDelete.current) return;
    const id = focusAfterDelete.current;
    focusAfterDelete.current = null;
    const next = tableRef.current?.querySelector<HTMLElement>(`tr[data-id="${id}"] [aria-haspopup]`);
    (next ?? addNewRef.current)?.focus();
  }, [deleting]);

  const addNew = (
    <Button ref={addNewRef} leftIcon={<Icon name="plus" />} onClick={() => setCreating(true)}>
      Add New
    </Button>
  );

  return (
    <main className="flex flex-col gap-6 p-6 pb-64">
      <PageHeader title="Announcements" description="Manage application announcements and updates" actions={addNew} />
      <AnnouncementsStatRow stats={summariseAnnouncements(rows)} />
      <AnnouncementsTable
        ref={tableRef}
        rows={rows}
        empty={
          <EmptyState title={emptyStateCopy.announcements.title} description={emptyStateCopy.announcements.description} />
        }
        rowActions={(announcement) => (
          <>
            <MenuItem onClick={() => setPreview(announcement)}>Preview</MenuItem>
            <MenuItem destructive onClick={() => setDeleting(announcement)}>
              Delete
            </MenuItem>
          </>
        )}
      />
      <CreateAnnouncementDialog
        open={creating}
        onClose={() => setCreating(false)}
        today={TODAY}
        onCreate={(announcement) => {
          const id = String(Math.max(0, ...rows.map((r) => Number(r.id))) + 1);
          setRows((all) => [{ ...announcement, id }, ...all]);
          setCreating(false);
          toast({ type: 'success', message: 'Announcement created.' });
        }}
      />
      {/* ••• → Preview: the dialog users will see. Both buttons just close it here. */}
      <WhatsNew announcement={preview} open={!!preview} onClose={() => setPreview(null)} onViewChangeLog={() => setPreview(null)} />
      <ModalConfirm
        open={!!deleting}
        type="destructive"
        title="Delete announcement?"
        message={deleting ? `“${deleting.title}” will be permanently deleted. This can’t be undone.` : ''}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          const index = rows.findIndex((r) => r.id === deleting.id);
          focusAfterDelete.current = rows[index + 1]?.id ?? rows[index - 1]?.id ?? 'add-new';
          setRows((all) => all.filter((r) => r.id !== deleting.id));
          setDeleting(null);
          toast({ type: 'success', message: 'Announcement deleted.' });
        }}
      />
    </main>
  );
}

/* ── User: what's new, once (U07 545:25222; Steps 2 and 3, 529:7193 and 529:7535) ── */

const USER_LINKS: AppHeaderLink[] = APP_HEADER_USER_PAGES.map((label) => ({
  label,
  href: `#${label.toLowerCase().replace(/ /g, '-')}`,
}));

/* The user's own costs (Hi, QA Test). */
const MY_COSTS = costs.filter((c) => c.applicant.name === 'QA Test');

/* "The newest active announcement for the user's audience" (All or User). */
const LATEST_FOR_USERS = [...announcements]
  .filter((a) => a.active && a.audience !== 'Admin')
  .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))[0];

function ChangelogContent() {
  const releases = [...changelog].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
  return (
    <>
      <PageHeader title={changelogPage.title} description={changelogPage.description} />
      <div className="flex max-w-3xl flex-col gap-4">
        {releases.map((release, i) => (
          /* Newest first; only the latest is marked New. */
          <ChangelogEntry
            key={release.version}
            title={release.title}
            meta={`Version ${release.version} • ${formatDate(release.releasedAt)}`}
            showNew={i === 0}
          >
            {release.notes.map((note) => (
              <BulletItem key={note}>{note}</BulletItem>
            ))}
          </ChangelogEntry>
        ))}
      </div>
    </>
  );
}

function CostsContent() {
  const [type, setType] = useState('all');
  return (
    <>
      <PageHeader
        title="Costs"
        tabs={
          <Tabs aria-label="Cost type" selected={type} onSelectedChange={setType}>
            <TabItem value="all">All</TabItem>
            <TabItem value="recurring">Recurring</TabItem>
            <TabItem value="single">Single</TabItem>
          </Tabs>
        }
      />
      <CostsTable rows={MY_COSTS.filter((c) => type === 'all' || c.type === type)} />
    </>
  );
}

interface UserAppProps {
  /** The page shown first. */
  page?: string;
  /** Versions this user has already seen ("Got It" stores them). */
  seen?: string[];
}

/* The user's side: header, page, and the what's-new dialog for a version they haven't seen. The story
   holds what the app would store per user. Links go nowhere: a click changes the page. */
function UserApp({ page: startPage = 'Costs', seen: startSeen = [] }: UserAppProps) {
  const [page, setPage] = useState(startPage);
  const [seen, setSeen] = useState(startSeen);
  const [theme, setTheme] = useState<ThemeToggleTheme>('light');
  const mainRef = useRef<HTMLElement>(null);
  const firstPage = useRef(true);
  const latest = LATEST_FOR_USERS;
  const markSeen = () => setSeen((s) => (s.includes(latest.version) ? s : [...s, latest.version]));

  /* A page change moves focus to the new page, as a router would. */
  useEffect(() => {
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [page]);

  return (
    <>
      <AppHeader
        links={USER_LINKS}
        page={page}
        username="QA Test"
        theme={theme}
        onThemeChange={setTheme}
        renderLink={(props) => (
          <NavLink
            {...props}
            onClick={(event) => {
              event.preventDefault();
              setPage(props.children);
            }}
          />
        )}
      />
      <main ref={mainRef} tabIndex={-1} className="container mx-auto flex flex-col gap-6 px-6 py-8">
        {page === 'Changelog' ? <ChangelogContent /> : page === 'Costs' ? <CostsContent /> : <PageHeader title={page} />}
      </main>
      <WhatsNew
        announcement={latest}
        open={!seen.includes(latest.version)}
        onClose={markSeen}
        onViewChangeLog={() => {
          markSeen();
          setPage('Changelog');
        }}
      />
    </>
  );
}

/* ── Stories ────────────────────────────────────────────────────────────── */

const meta = {
  title: 'Patterns/Announcements & what’s new',
  component: AnnouncementsAdminPage,
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
          'Pattern 14 (Figma 529:7639) and U07 (545:25222): admins publish release notes as announcements; users ' +
          'see the newest one once in a “what’s new” dialog, and every past release on the Changelog page. The admin ' +
          'page puts **Card / Stat Row – Announcements** (389:163, `AnnouncementsStatRow`) under its PageHeader, ' +
          'above an `AnnouncementsTable`; Add New opens `CreateAnnouncementDialog` (Modal / Dialog Large: TextField, ' +
          'DateField, RadioGroup, RepeatableField, ToggleField), which checks its fields and submits; ••• → Preview ' +
          'shows **Modal / Changelog** (the DS’s ChangelogModal). On the user’s side, ChangelogModal opens over the ' +
          'page after sign-in for a version the user hasn’t seen; Got It stores it, View Change Log opens the ' +
          'Changelog page, a list of **ChangelogEntry** cards, newest first, only the latest marked New.',
      },
    },
  },
} satisfies Meta<typeof AnnouncementsAdminPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Helpers for the plays ──────────────────────────────────────────────── */

const stat = (canvasElement: HTMLElement, label: string) =>
  within(canvasElement).getByRole('article', { name: label }).querySelector('p:last-child')!.textContent;
const announcementsTable = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole('table', { name: 'Announcements' }) as HTMLTableElement;
const firstRow = (table: HTMLTableElement) => table.tBodies[0].rows[0];

/* Go to a page with the header's navigation: the Nav Bar from 768px, the Mobile Menu below. */
async function goTo(canvasElement: HTMLElement, label: string) {
  const banner = within(canvasElement).getByRole('banner');
  if (window.matchMedia('(min-width: 48rem)').matches) {
    await userEvent.click(within(within(banner).getByRole('navigation', { name: 'Main' })).getByRole('link', { name: label }));
    return;
  }
  await userEvent.click(within(banner).getByRole('button', { name: 'Open menu' }));
  const menu = await screen.findByRole('dialog', { name: 'Menu' });
  await userEvent.click(within(menu).getByRole('link', { name: label }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
}

/**
 * Step 1 · Admin publishes. Add New opens Create Announcement. Create checks every field and puts
 * the errors under them (focus on the first); filled in, it submits: the dialog closes, focus goes
 * back to Add New, the announcement tops the list, the stats follow, and a Success toast says so.
 */
export const AdminPublishes: Story = {
  name: 'Admin publishes',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const totals = canvas.getByRole('group', { name: 'Announcement totals' });
    await expect(within(totals).getAllByRole('article').map((a) => a.textContent)).toEqual([
      'Total Announcements7',
      'Latest Version2.5.6',
      'Last UpdatedAug 10, 2026',
    ]);

    const addNew = canvas.getByRole('button', { name: 'Add New' });
    await userEvent.click(addNew);
    const dialog = await screen.findByRole('dialog', { name: 'Create Announcement' });
    const create = within(dialog).getByRole('button', { name: 'Create' });

    // Nothing filled in: each required field says what it needs; focus on the first.
    await userEvent.click(create);
    const title = within(dialog).getByRole('textbox', { name: 'Title' });
    await waitFor(() => expect(title).toHaveFocus());
    await expect(title).toHaveAccessibleDescription('Enter a title.');
    await expect(within(dialog).getByRole('textbox', { name: 'Version' })).toHaveAccessibleDescription('Enter a version, like 2.5.6.');
    await expect(within(dialog).getByRole('combobox', { name: 'Release Date' })).toHaveAccessibleDescription('Choose a release date.');
    // Features: RepeatableField's error state, the empty row marked and the message under it.
    const feature = within(dialog).getByRole('textbox', { name: 'Features 1' });
    await expect(feature).toHaveAttribute('aria-invalid', 'true');
    await expect(feature).toHaveAccessibleDescription('Add at least one feature.');

    // Fill it in; each error clears as its value becomes valid.
    await userEvent.type(title, 'Bulk upload for recurring costs');
    await expect(title).not.toHaveAttribute('aria-invalid', 'true');
    const version = within(dialog).getByRole('textbox', { name: 'Version' });
    await userEvent.type(version, '2.6');
    await expect(version).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(version, '.0');
    await expect(version).not.toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Release Date' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Monday 2 November 2026' }));
    await expect(within(dialog).getByRole('combobox', { name: 'Release Date' })).toHaveTextContent('2026-11-02');
    await userEvent.click(within(dialog).getByRole('radio', { name: 'User' }));
    await userEvent.type(feature, 'Upload a sheet of recurring costs');
    await expect(feature).not.toHaveAttribute('aria-invalid');
    await expect(within(dialog).queryByText('Add at least one feature.')).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Feature' }));
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Features 2' }), 'Faster exports');
    // Active is on by default (Figma's Toggle Field, Checked=true).
    await expect(within(dialog).getByRole('switch', { name: 'Active' })).toBeChecked();

    create.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(addNew).toHaveFocus();

    // On top of the list, with what the form submitted; the stats follow.
    const row = firstRow(announcementsTable(canvasElement));
    await expect(Array.from(row.cells).slice(0, 4).map((c) => c.textContent)).toEqual([
      'Bulk upload for recurring costs',
      'v2.6.0',
      'User',
      'Active',
    ]);
    await expect(stat(canvasElement, 'Total Announcements')).toBe('8');
    await expect(stat(canvasElement, 'Latest Version')).toBe('2.6.0');
    await expect(stat(canvasElement, 'Last Updated')).toBe('Nov 2, 2026');
    const notifications = screen.getByRole('region', { name: 'Notifications' });
    await expect(within(notifications).getByText('Announcement created.')).toBeVisible();
  },
};

/**
 * ••• → Preview shows the release as users will see it (Modal / Changelog); Got It closes it and focus
 * goes back to the •••. ••• → Delete asks first, then the row goes, a toast says so, and focus moves
 * to the next row's •••.
 */
export const PreviewAndDelete: Story = {
  name: 'Preview and delete',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = announcements[0];
    const trigger = canvas.getByRole('button', { name: `Actions for ${first.title} v${first.version}` });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Preview' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');

    const preview = await screen.findByRole('dialog', { name: first.title });
    await expect(within(preview).getByText('August 10, 2026')).toBeVisible();
    await expect(within(preview).getByText('v2.5.6')).toBeVisible();
    await expect(within(preview).getAllByRole('listitem').map((li) => li.textContent)).toEqual(first.features);
    await userEvent.click(within(preview).getByRole('button', { name: 'Got It' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();

    // Delete the second one.
    const second = announcements[1];
    await userEvent.click(canvas.getByRole('button', { name: `Actions for ${second.title} v${second.version}` }));
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete announcement?' });
    await expect(confirm).toHaveAccessibleDescription(`“${second.title}” will be permanently deleted. This can’t be undone.`);
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    const table = announcementsTable(canvasElement);
    await expect(Array.from(table.tBodies[0].rows).map((r) => r.dataset.id)).toEqual(['1', '3', '4', '5', '6', '7']);
    await expect(stat(canvasElement, 'Total Announcements')).toBe('6');
    await expect(within(screen.getByRole('region', { name: 'Notifications' })).getByText('Announcement deleted.')).toBeVisible();
    const third = announcements[2];
    await waitFor(() => expect(canvas.getByRole('button', { name: `Actions for ${third.title} v${third.version}` })).toHaveFocus());
  },
};

/** Create Announcement, open and filled in as Figma shows it (529:7050). */
export const CreateAnnouncementOpen: Story = {
  name: 'Create announcement, open',
  args: { creating: true },
  // An open dialog makes the rest of the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Create Announcement' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Welcome to the new update for CAF');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Version' }), '2.5.6');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Features 1' }), 'one');
    await expect(within(dialog).getByRole('radio', { name: 'All' })).toBeChecked();
    await expect(within(dialog).getByText('Who should see this announcement.')).toBeVisible();
    await expect(within(dialog).getByText('Only active announcements are shown to users.')).toBeVisible();
  },
};

/**
 * Step 2 · The user sees it once. After sign-in the newest active release for their audience opens
 * over the page; the page behind is inert. Got It closes it for good: moving between pages doesn't
 * bring it back.
 */
export const SeeItOnce: Story = {
  name: 'User sees it once',
  render: () => <UserApp />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = await screen.findByRole('dialog', { name: LATEST_FOR_USERS.title });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(dialog).toHaveFocus());
    await expect(within(dialog).getByText('August 10, 2026')).toBeVisible();
    await expect(within(dialog).getByText(`v${LATEST_FOR_USERS.version}`)).toBeVisible();
    await expect(within(dialog).getByText("What's new in this release:")).toBeVisible();
    // The page behind can't be reached.
    await expect(canvasElement.closest('[inert]')).not.toBeNull();

    // Got It, from the keyboard: Tab to it (View Change Log comes first).
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'View Change Log' })).toHaveFocus();
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Got It' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();

    // Away and back: it stays closed.
    await goTo(canvasElement, 'Recurring Costs');
    await expect(canvas.getByRole('heading', { level: 1, name: 'Recurring Costs' })).toBeVisible();
    await goTo(canvasElement, 'Costs');
    await expect(canvas.getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();
    await expect(screen.queryByRole('dialog')).toBeNull();
  },
};

/**
 * Step 3 · Full history on the Changelog. View Change Log closes the dialog for good and opens the
 * Changelog: every release, newest first, only the latest marked New.
 */
export const ViewChangeLog: Story = {
  name: 'View the changelog',
  render: () => <UserApp />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = await screen.findByRole('dialog', { name: LATEST_FOR_USERS.title });
    await userEvent.click(within(dialog).getByRole('button', { name: 'View Change Log' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await expect(canvas.getByRole('heading', { level: 1, name: changelogPage.title })).toBeVisible();
    await expect(canvas.getByText(changelogPage.description)).toBeVisible();
    await expect(canvas.getByRole('main')).toHaveFocus();
    const entries = within(canvas.getByRole('main')).getAllByRole('article');
    await expect(entries.map((e) => within(e).getByRole('heading', { level: 2 }).textContent)).toEqual(
      changelog.map((r) => r.title),
    );
    await expect(within(entries[0]).getByText('Version 2.5.6 • August 10, 2026')).toBeVisible();
    // Only the latest is New.
    await expect(entries.map((e) => within(e).queryByText('New') !== null)).toEqual([true, false, false]);
    await expect(within(entries[1]).getAllByRole('listitem').map((li) => li.textContent)).toEqual(changelog[1].notes);

    // Back to Costs: the dialog doesn't come back.
    await goTo(canvasElement, 'Costs');
    await expect(canvas.getByRole('heading', { level: 1, name: 'Costs' })).toBeVisible();
    await expect(screen.queryByRole('dialog')).toBeNull();
  },
};

/** The what's-new dialog over the user's Costs page (Step 2's screen). */
export const WhatsNewOpen: Story = {
  name: 'What’s new, open',
  render: () => <UserApp />,
  // An open dialog makes the rest of the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: LATEST_FOR_USERS.title });
    await expect(within(dialog).getAllByRole('listitem').map((li) => li.textContent)).toEqual(LATEST_FOR_USERS.features);
  },
};

/** A user who has seen the latest release: no dialog. */
export const AlreadySeen: Story = {
  name: 'Already seen',
  render: () => <UserApp page="Changelog" seen={[LATEST_FOR_USERS.version]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: changelogPage.title })).toBeVisible();
    await expect(screen.queryByRole('dialog')).toBeNull();
  },
};

/** Dark: the what's-new dialog over the user's Costs page. */
export const Dark: Story = {
  render: () => <UserApp />,
  globals: { theme: 'dark' },
  // The theme is set on <html>, and an open dialog makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    await expect(await screen.findByRole('dialog', { name: LATEST_FOR_USERS.title })).toBeVisible();
  },
};
