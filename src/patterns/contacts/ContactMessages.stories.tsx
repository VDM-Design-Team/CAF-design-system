import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ToastProvider } from '../../components/toast';
import { contacts } from '../fixtures';
import { ContactsListPage, type ContactsListPageProps } from './ContactsListPage';

/* The date picker's Today: the fixture's messages are from 2025. */
const TODAY = new Date(2025, 8, 30);

/* Storybook's "Small mobile" viewport (320 × 568). Chromatic ignores the
   global, so the phone stories also set chromatic.viewports (CLAUDE.md). The
   frame is a phone's 320 with AppShell's 16px gutters at any viewport, as
   Vitest and test:static's channel pass render wider. */
const MOBILE = { value: 'mobile1', isRotated: false } as const;

type Mode = 'light' | 'dark' | 'mobile';

/** The page: one main landmark, the toasts' live region beside it. */
function Screen({ mode = 'light', ...props }: Partial<ContactsListPageProps> & { mode?: Mode }) {
  return (
    <ToastProvider>
      <main className={mode === 'mobile' ? 'max-w-80 px-4 py-6' : 'p-8'}>
        <ContactsListPage defaultContacts={contacts} today={TODAY} {...props} />
      </main>
    </ToastProvider>
  );
}

const meta = {
  title: 'Patterns/Contact messages',
  component: ContactsListPage,
  render: (args) => <Screen {...args} />,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern 16 (Figma 951:7846): **Admin → Contacts**, the messages people send through the CAF contact form. ' +
          'An admin searches, filters and removes them; a message can’t be opened, added or edited, so rows aren’t ' +
          'clickable and the page has no Add New. The **List page** (01) with the title only; **Filter / Bar** ' +
          'Page=Contacts (Search contacts: name, email, subject or message; Select Period: date received; Clear ' +
          'Filters while one is in use); the table (**Table / Header – Contacts** over **Table / Row – Contact**: ' +
          'Email with the sender’s name, Date Received sortable and newest first, Subject, the whole Message, ' +
          'wrapped onto as many lines as it needs, and Remove). **Remove** is the only row action, so it is a red Destructive **Button / Small** on ' +
          'every row, not a ••• menu. It asks first (**Modal / Confirm**, Destructive, pattern 04); on Remove the row ' +
          'goes and a Success **Toast** says so. No messages, or none that match: **Empty State** (11). Built from ' +
          'ContactsListPage and ContactsFilterBar (`src/patterns/contacts/`, `src/patterns/filters/`).',
      },
    },
  },
  args: { defaultContacts: contacts, onRemove: fn() },
} satisfies Meta<typeof ContactsListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const table = (canvasElement: HTMLElement) => within(canvasElement).getByRole('table', { name: 'Contacts' });
/** The body rows' emails, top to bottom. */
const emails = (canvasElement: HTMLElement) =>
  within(table(canvasElement))
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.querySelector('td span')?.textContent);
const notifications = () => within(screen.getByRole('region', { name: 'Notifications' }));
const removeButton = (canvasElement: HTMLElement, name: string, date: string) =>
  within(canvasElement).getByRole('button', { name: `Remove message from ${name}, received ${date}` });

/** No page-level sideways scroll; at 320 the table scrolls in its own region instead. */
async function expectFits(canvasElement: HTMLElement, mode: Mode) {
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  if (mode !== 'mobile') return;
  const region = await within(canvasElement).findByRole('region', { name: 'Contacts' });
  await expect(region.clientWidth).toBe(288);
  // The table is at least 1024, so the columns keep their widths and the region scrolls: Email 320,
  // Date Received its sortable label, Subject 128, Actions its button plus 16 each side (Figma's Cell / Remove
  // is a fixed 112 around an 80-wide button; 112 isn't on GDL's scale, so the column hugs the button instead,
  // and the button's width follows how the browser renders Open Sans), Message the rest.
  await expect(region.scrollWidth).toBe(1024);
  const [email, date, subject, message, actions] = [...region.querySelectorAll('th')].map((th) => th.getBoundingClientRect().width);
  await expect([email, subject]).toEqual([320, 128]);
  await expect(date).toBeGreaterThanOrEqual(128);
  const button = region.querySelector<HTMLElement>('tbody [data-action="remove"]')!;
  await expect(actions).toBeCloseTo(button.getBoundingClientRect().width + 32, 1);
  await expect(actions).toBeLessThanOrEqual(112);
  await expect(message).toBeGreaterThanOrEqual(240);
}

/* Each step in Light, Dark and at a phone's width, named by its export (Step1BrowseLight →
   "Step 1 Browse Light"): Storybook's indexer can't read a name set in here. A Dark story sets the theme
   on <html>, which would flip the whole docs page, so only Light is in the docs. */
const modeStory = (mode: Mode, story: Story): Story => ({
  ...story,
  args: { ...story.args, mode } as Story['args'],
  globals: { theme: mode === 'dark' ? 'dark' : 'light', ...(mode === 'mobile' && { viewport: MOBILE }) },
  parameters: { ...story.parameters, ...(mode === 'mobile' && { chromatic: { viewports: [320] } }) },
  tags: mode === 'light' ? story.tags : ['!autodocs'],
});

/* ── Step 1 · Browse and filter messages ─────────────────────────────────── */

const browse = (mode: Mode): Story =>
  modeStory(mode, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('heading', { level: 1, name: 'Contacts' })).toBeVisible();
      // The title only: no page actions.
      await expect(canvas.queryByRole('button', { name: /Add New/ })).toBeNull();

      // Figma's columns; Date Received sorted newest first.
      const t = table(canvasElement);
      await expect(within(t).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
        'Email',
        'Date Received',
        'Subject',
        'Message',
        'Actions',
      ]);
      await expect(within(t).getByRole('columnheader', { name: 'Date Received' })).toHaveAttribute('aria-sort', 'descending');
      await expect(emails(canvasElement)).toEqual([
        'sample@example.com',
        'rhea.valdez@example.com',
        'testthis@example.com',
        'sam.holt@example.com',
        'itpm@example.com',
        'paolo.mendez@example.com',
        'lena.ortiz@example.com',
        'lena.ortiz@example.com',
      ]);
      // Rows don't open: nothing in a row is a link, and the only control is Remove.
      const row = within(t).getAllByRole('row')[4];
      await expect(within(row).queryByRole('link')).toBeNull();
      await expect(within(row).getAllByRole('button').map((b) => b.textContent)).toEqual(['Remove']);
      // A long message is shown in full: it wraps onto more lines in its row, with nothing cut off.
      const message = within(row).getAllByRole('cell')[3].querySelector('span')!;
      await expect(message).toHaveTextContent(
        'I am not offering SEO or Pay Per Click Advertising services. This is something entirely different. Let me demonstrate how it works and you will be pleasantly surprised by the results.',
      );
      await expect(getComputedStyle(message).textOverflow).not.toBe('ellipsis');
      await expect(getComputedStyle(message).whiteSpace).toBe('normal');
      await waitFor(() => expect(message.getBoundingClientRect().height).toBeGreaterThan(20));
      // Nothing spills out of the cell.
      const cell = message.closest('td')!;
      await expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth);
      // A short one stays on one line (body/sm's 20px).
      const short = within(within(t).getAllByRole('row')[5]).getAllByRole('cell')[3].querySelector('span')!;
      await expect(short.getBoundingClientRect().height).toBe(20);
      await expectFits(canvasElement, mode);

      // No filter in use: no Clear Filters.
      const bar = canvas.getByRole('search', { name: 'Filter contacts' });
      await expect(within(bar).queryByRole('button', { name: 'Clear Filters' })).toBeNull();
      // Search looks in the name, email, subject and message.
      const search = within(bar).getByRole('searchbox', { name: 'Search contacts' });
      await userEvent.type(search, 'free demo');
      await expect(emails(canvasElement)).toEqual(['rhea.valdez@example.com']);
      await expect(canvas.getByRole('status')).toHaveTextContent('Showing 1 of 8 messages');
      await userEvent.clear(search);
      await userEvent.type(search, 'Lena');
      await expect(emails(canvasElement)).toEqual(['lena.ortiz@example.com', 'lena.ortiz@example.com']);

      // Clear Filters empties the search, brings every message back and puts focus in the search field.
      await userEvent.click(within(bar).getByRole('button', { name: 'Clear Filters' }));
      await expect(search).toHaveValue('');
      await expect(search).toHaveFocus();
      await expect(emails(canvasElement)).toHaveLength(8);
      await expect(within(bar).queryByRole('button', { name: 'Clear Filters' })).toBeNull();

      // Date Received toggles to oldest first, and back.
      const sortButton = within(within(t).getByRole('columnheader', { name: 'Date Received' })).getByRole('button');
      await userEvent.click(sortButton);
      await expect(within(t).getByRole('columnheader', { name: 'Date Received' })).toHaveAttribute('aria-sort', 'ascending');
      await expect(emails(canvasElement)[0]).toBe('lena.ortiz@example.com');
      await userEvent.click(sortButton);
      await expect(emails(canvasElement)[0]).toBe('sample@example.com');

      // Leave the page as it opens, for the snapshot: nothing focused, the table scrolled to its start.
      sortButton.blur();
      t.parentElement!.scrollLeft = 0;
    },
  });

export const Step1BrowseLight = browse('light');
export const Step1BrowseDark = browse('dark');
export const Step1BrowseMobile = browse('mobile');

/* ── Step 2 · Confirm before removing ────────────────────────────────────── */

const confirm = (mode: Mode): Story =>
  modeStory(mode, {
    args: { defaultConfirm: 'c-5' },
    play: async ({ args, canvasElement }) => {
      const dialog = await screen.findByRole('alertdialog', { name: 'Remove this message?' });
      await expect(dialog).toHaveAccessibleDescription(
        'The message from Sam Holt (sam.holt@example.com), received 2025-07-16, will be removed from Contacts. This can’t be undone.',
      );
      await expect(within(dialog).getAllByRole('button').map((b) => b.textContent)).toEqual(['Cancel', 'Remove']);
      // Nothing goes until Remove is pressed.
      await expect(args.onRemove).not.toHaveBeenCalled();
      await expect(emails(canvasElement)).toContain('sam.holt@example.com');
      await expectFits(canvasElement, mode);
    },
  });

export const Step2ConfirmLight = confirm('light');
export const Step2ConfirmDark = confirm('dark');
export const Step2ConfirmMobile = confirm('mobile');

/** Cancel and Escape close the confirmation and keep the message; focus goes back to its Remove. */
export const CancelKeepsTheMessage: Story = {
  name: 'Step 2 Cancel keeps the message',
  play: async ({ args, canvasElement }) => {
    const remove = removeButton(canvasElement, 'Sam Holt', '2025-07-16');
    await userEvent.click(remove);
    let dialog = await screen.findByRole('alertdialog', { name: 'Remove this message?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await waitFor(() => expect(remove).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    dialog = await screen.findByRole('alertdialog', { name: 'Remove this message?' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(emails(canvasElement)).toHaveLength(8);
    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};

/** A confirmation for a message that isn't on screen (filtered out): Remove still works and focus lands on the first row. */
export const RemoveOffScreen: Story = {
  name: 'Step 2 Remove a message that is filtered out',
  tags: ['!autodocs'],
  args: { defaultConfirm: 'c-5', defaultFilters: { search: 'Lena', period: null } },
  play: async ({ args, canvasElement }) => {
    const dialog = await screen.findByRole('alertdialog', { name: 'Remove this message?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(args.onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'c-5' }));
    await waitFor(() => expect(removeButton(canvasElement, 'Lena Ortiz', '2025-03-13')).toHaveFocus());
  },
};

/* ── Step 3 · Message removed ────────────────────────────────────────────── */

const removed = (mode: Mode): Story =>
  modeStory(mode, {
    play: async ({ args, canvasElement }) => {
      await userEvent.click(removeButton(canvasElement, 'Sam Holt', '2025-07-16'));
      const dialog = await screen.findByRole('alertdialog', { name: 'Remove this message?' });
      await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());

      // The row goes, a Success toast says so, and focus moves to the Remove that took its place.
      await expect(emails(canvasElement)).not.toContain('sam.holt@example.com');
      await expect(emails(canvasElement)).toHaveLength(7);
      await expect(args.onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'c-5' }));
      await expect(await notifications().findByText('Message removed.')).toBeVisible();
      await waitFor(() => expect(removeButton(canvasElement, 'ITPM', '2025-03-14')).toHaveFocus());
      await expectFits(canvasElement, mode);
    },
  });

export const Step3RemovedLight = removed('light');
export const Step3RemovedDark = removed('dark');
export const Step3RemovedMobile = removed('mobile');

/* ── Step 4 · No matching messages ───────────────────────────────────────── */

const noResults = (mode: Mode): Story =>
  modeStory(mode, {
    args: { defaultFilters: { search: 'refund', period: null } },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const bar = canvas.getByRole('search', { name: 'Filter contacts' });
      await expect(within(bar).getByRole('searchbox', { name: 'Search contacts' })).toHaveValue('refund');
      // The header stays, with the compact Empty State under it; no pagination.
      const t = table(canvasElement);
      await expect(within(t).getAllByRole('columnheader')).toHaveLength(5);
      await expect(within(t).getByText('No items.')).toBeVisible();
      await expect(canvas.queryByRole('navigation', { name: /pagination/i })).toBeNull();
      await expect(canvas.getByRole('status')).toHaveTextContent('Showing 0 of 8 messages');
      await expect(within(bar).getByRole('button', { name: 'Clear Filters' })).toBeVisible();
    },
  });

export const Step4NoResultsLight = noResults('light');
export const Step4NoResultsDark = noResults('dark');
export const Step4NoResultsMobile = noResults('mobile');

/** Select Period narrows by the date received; Clear Filters undoes it. */
export const FilterByPeriod: Story = {
  name: 'Step 4 Filter by period',
  tags: ['!autodocs'],
  args: { defaultFilters: { search: '', period: { from: '2025-03-01', to: '2025-03-31' } } },
  play: async ({ canvasElement }) => {
    await expect(emails(canvasElement)).toEqual([
      'itpm@example.com',
      'paolo.mendez@example.com',
      'lena.ortiz@example.com',
      'lena.ortiz@example.com',
    ]);
    const bar = within(canvasElement).getByRole('search', { name: 'Filter contacts' });
    await userEvent.click(within(bar).getByRole('button', { name: 'Clear Filters' }));
    await expect(emails(canvasElement)).toHaveLength(8);
  },
};

/* ── Step 5 · No messages yet ────────────────────────────────────────────── */

const empty = (mode: Mode): Story =>
  modeStory(mode, {
    args: { defaultContacts: [] },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      // The Default Empty State in place of the table; the filter bar stays, with nothing to clear.
      await expect(canvas.queryByRole('table')).toBeNull();
      await expect(canvas.getByText('No messages yet')).toBeVisible();
      await expect(canvas.getByText('Messages sent through the contact form will appear here.')).toBeVisible();
      await expect(canvas.getByRole('search', { name: 'Filter contacts' })).toBeVisible();
      await expect(canvas.queryByRole('button', { name: 'Clear Filters' })).toBeNull();
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    },
  });

export const Step5EmptyLight = empty('light');
export const Step5EmptyDark = empty('dark');
export const Step5EmptyMobile = empty('mobile');

/** Removing the last message leaves the page empty, with focus in the search field. */
export const RemoveTheLastMessage: Story = {
  name: 'Step 5 Remove the last message',
  tags: ['!autodocs'],
  args: { defaultContacts: contacts.slice(0, 1) },
  play: async ({ canvasElement }) => {
    await userEvent.click(removeButton(canvasElement, 'Lena Ortiz', '2025-03-11'));
    const dialog = await screen.findByRole('alertdialog', { name: 'Remove this message?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('No messages yet')).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('searchbox', { name: 'Search contacts' })).toHaveFocus());
  },
};
