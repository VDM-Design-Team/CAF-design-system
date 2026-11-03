import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import type { ThemeToggleTheme } from '../../components/theme-toggle';
import type { ShellApp } from '../../patterns/app-shell/AppShell';
import { currentUser, type CostType } from '../../patterns/fixtures';
import { expectDividers, expectFormInCard } from '../../patterns/forms/checks';
import { expectFrame, expectInOrder, expectNoSidewaysScroll, isDesktop, MOBILE_SNAPSHOT, MOBILE_VIEWPORT } from '../checks';
import { BulkUploadScreen, CreateCostScreen } from '../screens';
import { TemplateFrame } from '../TemplateFrame';

/** The real screens this template lays out (CAF Design file). */
type FormScreen = 'create-cost' | 'bulk-upload';

interface FormTemplateProps {
  screen: FormScreen;
  /** Bulk Upload is on both apps; Create Cost is the user's. */
  app: ShellApp;
  /** Create Cost's tab: Single Cost or Recurring Cost. */
  type: CostType;
  theme: ThemeToggleTheme;
  onNavigate?: (page: string) => void;
  onSubmit?: (data: FormData) => void;
  onSaveDraft?: (data: FormData) => void;
  onEditCurrency?: () => void;
  onUpload?: (data: FormData) => void;
  onDownloadTemplate?: (paymentMethod: string) => void;
}

function FormTemplate({ screen, app, type, theme, onNavigate, onUpload, onDownloadTemplate, ...form }: FormTemplateProps) {
  return screen === 'create-cost' ? (
    <TemplateFrame app="user" page="Create Cost" theme={theme} onNavigate={onNavigate}>
      <CreateCostScreen type={type} {...form} />
    </TemplateFrame>
  ) : (
    <TemplateFrame app={app} page="Bulk Upload" theme={theme} onNavigate={onNavigate}>
      <BulkUploadScreen onUpload={onUpload} onDownloadTemplate={onDownloadTemplate} />
    </TemplateFrame>
  );
}

const meta = {
  title: 'Templates/Form page',
  component: FormTemplate,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'A page that is one form: the page’s heading (PageHeader), then the form alone in a **PanelCard** (Card / ' +
          'Panel), centred in the page container at the form cards’ width (`max-w-xl`, 576; Figma 578). The form’s ' +
          'sections run in one column, with a **Divider** where Figma draws a rule, and its actions at the end. The ' +
          'screens it covers: **User / Create Cost** — Single Cost ' +
          '(2102:1154) and Recurring Cost (2102:1159), Form / New Cost — and **Bulk Upload** (Admin 2102:6027, User ' +
          '2102:1223), Form / Bulk Upload. Built from NewCostForm and BulkUploadForm (patterns 09, 10, U02, U05), which ' +
          'check their fields and hand over the FormData; the page confirms with a toast.',
      },
    },
  },
  args: {
    screen: 'create-cost',
    app: 'user',
    type: 'single',
    theme: 'light',
    onNavigate: fn(),
    onSubmit: fn(),
    onSaveDraft: fn(),
    onEditCurrency: fn(),
    onUpload: fn(),
    onDownloadTemplate: fn(),
  },
  render: (args, { globals }) => <FormTemplate {...args} theme={globals.theme === 'dark' ? 'dark' : 'light'} />,
} satisfies Meta<typeof FormTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Checks ─────────────────────────────────────────────────────────────── */

/** The heading and the card's column is centred in the page container (from 768px; on a phone it fills it). */
async function expectCentred(column: HTMLElement, main: HTMLElement) {
  const style = getComputedStyle(main);
  const box = main.getBoundingClientRect();
  const left = box.left + parseFloat(style.paddingLeft);
  const right = box.right - parseFloat(style.paddingRight);
  const { left: columnLeft, right: columnRight } = column.getBoundingClientRect();
  await expect(columnLeft).toBeGreaterThanOrEqual(left - 1);
  await expect(columnRight).toBeLessThanOrEqual(right + 1);
  // The form cards' width (max-w-xl, 576), or the container's where that is narrower (a phone).
  await expect(columnRight - columnLeft).toBeCloseTo(Math.min(576, right - left), 0);
  if (isDesktop()) await expect(Math.abs(columnLeft - left - (right - columnRight))).toBeLessThan(1);
  else await expectNoSidewaysScroll();
}

/**
 * Create Cost: the heading above the form's card; in the card, Single | Recurring
 * tabs, the sections in order with Figma's two Dividers, Save to Drafts and Save at the end.
 */
async function expectCreateCost(canvasElement: HTMLElement, type: CostType) {
  const { main, heading } = await expectFrame(canvasElement, 'New Cost');
  const page = within(main);
  const form = main.querySelector('form')!;
  const { column } = await expectFormInCard(form, heading);
  await expectDividers(form, 24, ['Beneficiary Information', 'Breakdowns']);
  const tabs = page.getByRole('tablist', { name: 'Cost type' });
  const selected = type === 'single' ? 'Single Cost' : 'Recurring Cost';
  await expect(within(tabs).getByRole('tab', { name: selected })).toHaveAttribute('aria-selected', 'true');
  const panel = page.getByRole('tabpanel', { name: selected });
  // Pre-filled from the signed-in account.
  await expect(within(panel).getByRole('textbox', { name: /^Applicant name/ })).toHaveValue(currentUser.name);
  await expect(within(panel).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(
    type === 'single'
      ? ['Beneficiary Information', 'Breakdowns']
      : ['Recurring Details', 'Cost Details', 'Beneficiary Information', 'Breakdowns'],
  );
  const saveDraft = page.getByRole('button', { name: 'Save to Drafts' });
  const save = page.getByRole('button', { name: 'Save' });
  await expect(save).toHaveAttribute('type', 'submit');
  await expectInOrder([heading, tabs, panel, saveDraft]);
  // Side by side from sm; stacked on a phone, where the card leaves too little width for both.
  const [draftBox, saveBox] = [saveDraft.getBoundingClientRect(), save.getBoundingClientRect()];
  if (window.matchMedia('(min-width: 40rem)').matches) await expect(saveBox.left).toBeGreaterThan(draftBox.left);
  else await expect(saveBox.top).toBeGreaterThanOrEqual(draftBox.bottom);
  // Each label fits its button.
  for (const button of [saveDraft, save]) await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
  await expectCentred(column, main);
}

/** Bulk Upload: the heading above the form's card; in it Payment Method, the CSV upload, a Divider, Download CSV Template, Upload. */
async function expectBulkUpload(canvasElement: HTMLElement) {
  const { main, heading } = await expectFrame(canvasElement, 'Bulk Upload');
  const page = within(main);
  const form = main.querySelector('form')!;
  const { column } = await expectFormInCard(form, heading);
  await expectDividers(form, 12, ['Download CSV Template']);
  const method = page.getByRole('combobox', { name: /^Payment Method/ });
  const file = page.getByLabelText<HTMLInputElement>(/^Upload CSV File/);
  await expect(file).toHaveAttribute('type', 'file');
  const download = page.getByRole('button', { name: 'Download' });
  const upload = page.getByRole('button', { name: 'Upload' });
  await expect(upload).toHaveAttribute('type', 'submit');
  await expectInOrder([heading, method, download, upload]);
  await expectCentred(column, main);
}

/* ── Create Cost ────────────────────────────────────────────────────────── */

/** User / Create Cost — Single Cost (2102:1154). */
export const CreateCostSingle: Story = {
  name: 'Create cost, single',
  play: ({ canvasElement }) => expectCreateCost(canvasElement, 'single'),
};

/** User / Create Cost — Recurring Cost (2102:1159): Recurring Details at the top. */
export const CreateCostRecurring: Story = {
  name: 'Create cost, recurring',
  args: { type: 'recurring' },
  play: ({ canvasElement }) => expectCreateCost(canvasElement, 'recurring'),
};

export const CreateCostDark: Story = {
  name: 'Create cost, dark',
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: ({ canvasElement }) => expectCreateCost(canvasElement, 'single'),
};

/** Below 768px the heading and the card fill the page container, and nothing scrolls sideways. */
export const CreateCostMobile: Story = {
  name: 'Create cost, mobile',
  args: { type: 'recurring' },
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: ({ canvasElement }) => expectCreateCost(canvasElement, 'recurring'),
};

/* ── Bulk Upload ────────────────────────────────────────────────────────── */

/** User / Bulk Upload (2102:1223). */
export const BulkUpload: Story = {
  name: 'Bulk upload',
  args: { screen: 'bulk-upload' },
  play: ({ canvasElement }) => expectBulkUpload(canvasElement),
};

/** Admin / Bulk Upload (2102:6027): the same form in the admin's frame. */
export const BulkUploadAdmin: Story = {
  name: 'Bulk upload, admin',
  args: { screen: 'bulk-upload', app: 'admin' },
  play: ({ canvasElement }) => expectBulkUpload(canvasElement),
};

export const BulkUploadDark: Story = {
  name: 'Bulk upload, dark',
  args: { screen: 'bulk-upload', app: 'admin' },
  globals: { theme: 'dark' },
  tags: ['!autodocs'],
  play: ({ canvasElement }) => expectBulkUpload(canvasElement),
};

export const BulkUploadMobile: Story = {
  name: 'Bulk upload, mobile',
  args: { screen: 'bulk-upload' },
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: ({ canvasElement }) => expectBulkUpload(canvasElement),
};
