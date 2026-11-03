import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ToastProvider, useToast } from '../../components/toast';
import {
  currentUser,
  drafts as fixtureDrafts,
  formatFrequency,
  type CostBreakdown,
  type CostType,
  type Draft,
  type FrequencyUnit,
} from '../fixtures';
import { expectFormInCard } from '../forms/checks';
import { NewCostForm, type NewCostField, type NewCostValues } from '../forms/NewCostForm';
import { DraftsList } from './DraftsList';

/* "Today" in these stories: the calendars, and a new draft's Date Created. */
const TODAY = new Date(2026, 10, 2);
const TODAY_ISO = '2026-11-02';

/** A draft with what it holds, so Edit can load it back into the form. */
interface StoredDraft extends Draft {
  type: CostType;
  values: NewCostValues;
  breakdowns: CostBreakdown[];
  files: File[];
}

const FIELDS: NewCostField[] = [
  'applicantName', 'email', 'invoiceNumber', 'currency', 'partner', 'paymentMethod', 'beneficiaryName', 'street',
  'city', 'postalCode', 'country', 'iban', 'swift', 'notes', 'startsAt', 'frequencyValue', 'frequencyUnit',
];

/** The fixture's drafts hold only what the list shows: the applicant and, for a recurring one, its interval. */
function fromFixture(draft: Draft): StoredDraft {
  const recurring = draft.frequency !== 'Single';
  const [value, unit = ''] = draft.frequency.split(' ');
  return {
    ...draft,
    type: recurring ? 'recurring' : 'single',
    values: {
      applicantName: draft.applicant.name,
      email: draft.applicant.email,
      ...(recurring && { frequencyValue: value, frequencyUnit: unit[0].toUpperCase() + unit.slice(1, unit.endsWith('s') ? -1 : undefined) }),
    },
    breakdowns: [],
    files: [],
  };
}

/** Save to Drafts: what the form held, as a draft. */
function toDraft(data: FormData, id: string, createdAt: string): StoredDraft {
  const values: NewCostValues = {};
  for (const field of FIELDS) {
    const value = data.get(field);
    if (typeof value === 'string' && value !== '') values[field] = value;
  }
  const type = data.get('type') === 'recurring' ? 'recurring' : 'single';
  return {
    id,
    type,
    values,
    breakdowns: data.getAll('breakdown').map((b) => JSON.parse(String(b)) as CostBreakdown),
    files: data.getAll('invoices').filter((f): f is File => f instanceof File && f.name !== ''),
    createdBy: currentUser,
    frequency:
      type === 'single'
        ? 'Single'
        : formatFrequency({ value: Number(values.frequencyValue ?? 1), unit: (values.frequencyUnit ?? 'Month') as FrequencyUnit }),
    applicant: { name: values.applicantName ?? '', email: values.email ?? '' },
    createdAt,
  };
}

interface FlowProps {
  /** Where the story starts. */
  view?: 'form' | 'drafts';
  /** The drafts at first. Default: the fixture's eight. */
  initialDrafts?: StoredDraft[];
  /** Start with the delete confirmation open for a draft id. */
  defaultConfirm?: string;
  onSaveDraft?: (data: FormData) => void;
  onSubmit?: (data: FormData) => void;
}

/**
 * New Cost and Drafts, as one page that switches between them (the app's
 * routes: /new-cost and /drafts, ?draft_id=… when a draft is open). When it
 * switches, focus goes to the new page's heading.
 */
function DraftsFlow({ view: initialView = 'form', initialDrafts, defaultConfirm, onSaveDraft, onSubmit }: FlowProps) {
  const { toast } = useToast();
  const [view, setView] = React.useState(initialView);
  const [drafts, setDrafts] = React.useState<StoredDraft[]>(() => initialDrafts ?? fixtureDrafts.map(fromFixture));
  const [openDraft, setOpenDraft] = React.useState<StoredDraft | null>(null);
  const [blank, setBlank] = React.useState(0);
  const mainRef = React.useRef<HTMLElement>(null);
  const switched = React.useRef(false);

  React.useEffect(() => {
    if (!switched.current) return;
    switched.current = false;
    const heading = mainRef.current?.querySelector<HTMLElement>('h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }, [view, openDraft, blank]);

  const go = (next: 'form' | 'drafts') => {
    switched.current = true;
    setView(next);
  };
  const nextId = () => String(Math.max(...drafts.map((d) => Number(d.id)), 36741) + 1);

  return (
    <main ref={mainRef} className="p-8 pb-64">
      {view === 'form' ? (
        <NewCostForm
          key={openDraft ? openDraft.id : `new-${blank}`}
          className="mx-auto"
          today={TODAY}
          description={openDraft ? `Draft #${openDraft.id}` : undefined}
          defaultType={openDraft?.type}
          defaultValues={openDraft?.values}
          defaultBreakdowns={openDraft?.breakdowns}
          defaultFiles={openDraft?.files}
          onSaveDraft={(data) => {
            const draft = toDraft(data, openDraft?.id ?? nextId(), openDraft?.createdAt ?? TODAY_ISO);
            setDrafts((all) =>
              openDraft ? all.map((d) => (d.id === draft.id ? draft : d)) : [draft, ...all],
            );
            onSaveDraft?.(data);
            toast({ type: 'success', message: `Draft #${draft.id} saved.` });
            setOpenDraft(null);
            go('drafts');
          }}
          onSubmit={(data) => {
            if (openDraft) setDrafts((all) => all.filter((d) => d.id !== openDraft.id));
            onSubmit?.(data);
            toast({ type: 'success', message: 'Cost submitted for review.' });
            setOpenDraft(null);
            go('drafts');
          }}
        />
      ) : (
        <DraftsList
          drafts={drafts}
          defaultConfirm={defaultConfirm}
          onEdit={(draft) => {
            setOpenDraft(draft);
            go('form');
          }}
          onCreate={() => {
            setOpenDraft(null);
            setBlank((n) => n + 1);
            go('form');
          }}
          onDelete={(draft) => {
            setDrafts((all) => all.filter((d) => d.id !== draft.id));
            toast({ type: 'success', message: 'Draft deleted.' });
          }}
        />
      )}
    </main>
  );
}

const meta = {
  title: 'Patterns/Save and resume drafts',
  component: DraftsFlow,
  render: (args) => (
    <ToastProvider>
      <DraftsFlow {...args} />
    </ToastProvider>
  ),
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern U03 (Figma 545:18365): a user parks an unfinished cost and picks it up later. **Save to Drafts** sits ' +
          'left of Save at the bottom of New Cost and keeps whatever was entered, without checking it. **Drafts** lists ' +
          'every draft, newest first: ID, Created By, Frequency (Single or the interval), Applicant Name, Email, Date ' +
          'Created. ••• → **Edit** reopens New Cost with the draft loaded, on the tab that matches its frequency; ••• → ' +
          '**Delete** asks first (pattern 04). With no drafts, an **Empty State** offers Create Cost. Built from ' +
          'NewCostForm, FilterField, the list table (TableList, TableHeaderRow, TableHeaderCell, TableRow, TableCell, RowActionsMenu), Pagination, ' +
          'ModalConfirm, EmptyState and ToastProvider (`src/patterns/drafts/DraftsList.tsx`).',
      },
    },
  },
  args: { onSaveDraft: fn(), onSubmit: fn() },
} satisfies Meta<typeof DraftsFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

const notifications = (canvasElement: HTMLElement) =>
  within(screen.getByRole('region', { name: 'Notifications' }));

/** A row's cells' text, by draft id. */
const rowCells = (canvasElement: HTMLElement, id: string) =>
  within(canvasElement.querySelector<HTMLElement>(`tr[data-id="${id}"]`)!)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);

/** Chooses `option` in a select (a combobox button) by clicking. */
async function choose(scope: HTMLElement, label: RegExp, option: string) {
  await userEvent.click(within(scope).getByRole('combobox', { name: label }));
  await userEvent.click(within(scope).getByRole('option', { name: option }));
}

/** ••• → Edit on a draft. */
async function editDraft(canvasElement: HTMLElement, id: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: `Actions for draft ${id}` }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
  const heading = await canvas.findByRole('heading', { level: 1, name: 'New Cost' });
  await waitFor(() => expect(heading).toHaveFocus());
}

/**
 * Steps 1–3: a half-done cost goes to Drafts with Save to Drafts (nothing is
 * checked). It is the first row of Drafts, and Edit loads it back, under
 * "Draft #36742". Saved again, it is updated in place, not added twice; Save
 * submits it and it leaves Drafts.
 */
export const SaveAndResume: Story = {
  name: 'Save and resume',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvasElement.querySelector('form')!;

    // Step 1: half done, saved to Drafts without checks.
    await userEvent.type(canvas.getByRole('textbox', { name: /^Invoice number/ }), 'INV-2026-0512');
    await choose(form, /^Select Partner/, 'Jane Doe');
    await userEvent.click(canvas.getByRole('button', { name: 'Save to Drafts' }));
    await expect(args.onSaveDraft).toHaveBeenCalledTimes(1);
    const data = (args.onSaveDraft as ReturnType<typeof fn>).mock.calls[0][0] as FormData;
    await expect(data.get('invoiceNumber')).toBe('INV-2026-0512');
    await expect(data.get('currency')).toBe('');

    // Step 2: Drafts, newest first, focus on its heading.
    const heading = await canvas.findByRole('heading', { level: 1, name: 'Drafts' });
    await waitFor(() => expect(heading).toHaveFocus());
    await expect(await notifications(canvasElement).findByText('Draft #36742 saved.')).toBeVisible();
    const table = canvas.getByRole('table', { name: 'Drafts' });
    const rows = within(table).getAllByRole('row');
    await expect(rows).toHaveLength(10);
    await expect(rows[1]).toHaveAttribute('data-id', '36742');
    await expect(rowCells(canvasElement, '36742')).toEqual([
      '36742',
      'QA Testqa.test@example.com',
      'Single',
      'QA Test',
      'qa.test@example.com',
      'November 2, 2026',
      '',
    ]);

    // Step 3: Edit loads it back, named in the page's header above the form's card.
    await editDraft(canvasElement, '36742');
    const draftName = canvas.getByText('Draft #36742');
    await expect(draftName).toBeVisible();
    const { card } = await expectFormInCard(
      canvasElement.querySelector('form')!,
      canvas.getByRole('heading', { level: 1, name: 'New Cost' }),
    );
    await expect(card).not.toContainElement(draftName);
    await expect(canvas.getByRole('tab', { name: 'Single Cost' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('textbox', { name: /^Invoice number/ })).toHaveValue('INV-2026-0512');
    await expect(canvas.getByRole('combobox', { name: /^Select Partner/ })).toHaveTextContent('Jane Doe');

    // Saved again: the same row, updated.
    await choose(canvasElement.querySelector('form')!, /^Payment method/, 'SEPA');
    await userEvent.click(canvas.getByRole('button', { name: 'Save to Drafts' }));
    await canvas.findByRole('heading', { level: 1, name: 'Drafts' });
    await expect(within(canvas.getByRole('table', { name: 'Drafts' })).getAllByRole('row')).toHaveLength(10);
    await editDraft(canvasElement, '36742');
    await expect(canvas.getByRole('combobox', { name: /^Payment method/ })).toHaveTextContent('SEPA');
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/** Step 3: a recurring draft opens on the Recurring Cost tab, with its interval. */
export const ResumeRecurringDraft: Story = {
  name: 'Resume a recurring draft',
  args: { view: 'drafts' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(rowCells(canvasElement, '36741')[2]).toBe('1 month');
    await editDraft(canvasElement, '36741');
    await expect(canvas.getByText('Draft #36741')).toBeVisible();
    await expect(canvas.getByRole('tab', { name: 'Recurring Cost' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('spinbutton', { name: /^Frequency Value/ })).toHaveValue(1);
    await expect(canvas.getByRole('combobox', { name: /^Frequency Unit/ })).toHaveTextContent('Month');
    await expect(canvas.getByRole('textbox', { name: /^Applicant name/ })).toHaveValue('Automation');
    await expect(canvas.getByRole('status')).toHaveTextContent('This will recur every 1 month');
  },
};

/**
 * Search narrows the list and Clear Filters brings it back. Step 4: ••• →
 * Delete asks first; Delete removes the draft, a toast confirms it, and focus
 * moves to the next row’s •••.
 */
export const SearchAndDelete: Story = {
  name: 'Search and delete',
  args: { view: 'drafts' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Drafts' });
    await expect(within(table).getAllByRole('row')).toHaveLength(9);
    await expect(canvas.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('Page 1 of 1');

    // Search.
    const search = canvas.getByRole('searchbox', { name: 'Search drafts' });
    await userEvent.type(search, '3670');
    await expect(within(table).getAllByRole('row').slice(1).map((r) => r.dataset.id)).toEqual(['36701', '36700']);
    await userEvent.clear(search);
    await userEvent.type(search, 'nobody');
    await expect(within(table).getByText('No drafts match your search.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Filters' }));
    await expect(within(table).getAllByRole('row')).toHaveLength(9);

    // Delete asks first.
    await userEvent.click(canvas.getByRole('button', { name: 'Actions for draft 36701' }));
    const menu = screen.getByRole('menu', { name: 'Actions for draft 36701' });
    await expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Edit', 'Delete']);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete draft?' });
    await expect(dialog).toHaveAccessibleDescription('Draft #36701 will be permanently deleted. This can’t be undone.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(canvasElement.querySelector('tr[data-id="36701"]')).toBeNull();
    await expect(await notifications(canvasElement).findByText('Draft deleted.')).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Actions for draft 36700' })).toHaveFocus());
  },
};

/** Step 5: no drafts. The Empty State offers Create Cost, which opens a blank New Cost. */
export const NoDrafts: Story = {
  name: 'No drafts',
  args: { view: 'drafts', initialDrafts: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No drafts yet')).toBeVisible();
    await expect(canvas.queryByRole('table')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Create Cost' }));
    const heading = await canvas.findByRole('heading', { level: 1, name: 'New Cost' });
    await waitFor(() => expect(heading).toHaveFocus());
    await expect(canvas.getByRole('textbox', { name: /^Applicant name/ })).toHaveValue('QA Test');
  },
};

/** Step 4, open: the delete confirmation over Drafts. */
export const DeleteConfirmOpen: Story = {
  name: 'Delete confirm open',
  args: { view: 'drafts', defaultConfirm: '36741' },
  // An open dialog makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete draft?' });
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus());
  },
};

/** Dark: the Drafts list. */
export const Dark: Story = {
  args: { view: 'drafts' },
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('table', { name: 'Drafts' })).toBeVisible();
  },
};
