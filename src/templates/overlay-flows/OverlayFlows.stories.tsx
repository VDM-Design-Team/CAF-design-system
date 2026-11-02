import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import type { ThemeToggleTheme } from '../../components/theme-toggle';
import type { ShellApp } from '../../patterns/app-shell/AppShell';
import { costCentres, TEMPLATE_TODAY, userRecurringCosts } from '../../patterns/fixtures';
import { CostCentresPage } from '../../patterns/modal-form/CostCentresPage';
import { RecurringCostsPage } from '../../patterns/side-sheet/RecurringCostsPage';
import { bodyChildOf, expectFrame, isDesktop, MOBILE_SNAPSHOT, MOBILE_VIEWPORT } from '../checks';
import { AdminCostsScreen, CreateCostScreen } from '../screens';
import { TemplateFrame } from '../TemplateFrame';

/** The overlays this template opens over their pages (CAF Design file). */
type Flow = 'add-cost-center' | 'delete-cost-center' | 'audit-logs' | 'cost-breakdown' | 'payment-schedules' | 'edit-recurring-cost';

/* Pattern 04's example: a cost center no cost uses, so Delete goes through. */
const DELETED_CENTRE = costCentres[1];

/** Each flow: the app, the page behind, and that page with its overlay open. */
const FLOWS: Record<Flow, { app: ShellApp; page: string; render: () => ReactNode }> = {
  'add-cost-center': { app: 'admin', page: 'Cost Centers', render: () => <CostCentresPage defaultDialog="add" /> },
  'delete-cost-center': { app: 'admin', page: 'Cost Centers', render: () => <CostCentresPage defaultConfirm={DELETED_CENTRE.id} /> },
  'audit-logs': { app: 'admin', page: 'Costs', render: () => <AdminCostsScreen auditLogsOpen /> },
  'cost-breakdown': { app: 'user', page: 'Create Cost', render: () => <CreateCostScreen breakdownDialogOpen /> },
  'payment-schedules': {
    app: 'user',
    page: 'Recurring Costs',
    render: () => <RecurringCostsPage today={TEMPLATE_TODAY} defaultRows={userRecurringCosts} defaultSchedules="1882" />,
  },
  'edit-recurring-cost': {
    app: 'user',
    page: 'Recurring Costs',
    render: () => <RecurringCostsPage today={TEMPLATE_TODAY} defaultRows={userRecurringCosts} defaultEditing="1882" />,
  },
};

interface OverlayTemplateProps {
  flow: Flow;
  theme: ThemeToggleTheme;
  onNavigate?: (page: string) => void;
}

function OverlayTemplate({ flow, theme, onNavigate }: OverlayTemplateProps) {
  const { app, page, render } = FLOWS[flow];
  return (
    <TemplateFrame app={app} page={page} theme={theme} onNavigate={onNavigate}>
      {render()}
    </TemplateFrame>
  );
}

const meta = {
  title: 'Templates/Overlay flows',
  component: OverlayTemplate,
  // An open overlay makes the docs page inert.
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'A page with its overlay open, as the CAF Design file draws them: the page stays in place, dimmed and inert, ' +
          'under a **Modal / Dialog** (Add New Cost Center 2102:6074, Audit Logs 2102:5857, Cost Breakdown 2102:1201), ' +
          'a **Modal / Confirm** (pattern 04’s delete), **Payment Schedules** (2102:1266) or a **Panel / Side Sheet** ' +
          '(Edit Recurring Cost 2102:1284). Built from CostCentresPage, RecurringCostsPage, CostsListPage with ' +
          'AuditLogsDialog, and NewCostForm (patterns 04, 05, 06, 08, 09, U04). Each story opens with the overlay ' +
          'shown; the flows that open, fill and close them are the patterns’ stories.',
      },
    },
  },
  args: { flow: 'add-cost-center', theme: 'light', onNavigate: fn() },
  render: (args, { globals }) => <OverlayTemplate {...args} theme={globals.theme === 'dark' ? 'dark' : 'light'} />,
} satisfies Meta<typeof OverlayTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Checks ─────────────────────────────────────────────────────────────── */

/**
 * The page is in its frame behind the overlay, and inert; the overlay is a
 * modal named by its title, inside the screen, with focus inside it. (Its
 * keyboard, the focus trap and Escape, is Overlay's and the patterns' to test;
 * the snapshot shows the overlay as it opens.)
 */
async function expectOverlay(
  canvasElement: HTMLElement,
  { title, overlay, role = 'dialog' }: { title: string; overlay: string; role?: 'dialog' | 'alertdialog' },
) {
  const { main } = await expectFrame(canvasElement, title);
  const dialog = await screen.findByRole(role, { name: overlay });
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(main).not.toContainElement(dialog);
  // The overlay's effects (inert page, focus moved in) can land after the first render: wait for them.
  await waitFor(() => expect(bodyChildOf(canvasElement)).toHaveAttribute('inert'));
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

  const box = dialog.getBoundingClientRect();
  await expect(box.left).toBeGreaterThanOrEqual(0);
  await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
  return { main, dialog };
}

/* ── Admin ──────────────────────────────────────────────────────────────── */

/** Admin / Cost Centers — Add New modal (2102:6074): Modal / Dialog over the list, its form (pattern 05). */
export const AddNewCostCenter: Story = {
  name: 'Add New Cost Center',
  play: async ({ canvasElement }) => {
    const { main, dialog } = await expectOverlay(canvasElement, { title: 'Cost Centers', overlay: 'Add New Cost Center' });
    await expect(within(main).getByRole('table', { name: 'Cost centers', hidden: true })).toBeInTheDocument();
    await expect(within(dialog).getByRole('combobox', { name: /^Cost Center/ })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Save' })).toBeVisible();
  },
};

/** Pattern 04 on Cost Centers: Modal / Confirm, destructive, naming the record; focus on Cancel. */
export const DeleteCostCenter: Story = {
  name: 'Delete cost center',
  args: { flow: 'delete-cost-center' },
  play: async ({ canvasElement }) => {
    const { dialog } = await expectOverlay(canvasElement, {
      title: 'Cost Centers',
      overlay: 'Delete cost center?',
      role: 'alertdialog',
    });
    await expect(dialog).toHaveTextContent(`“${DELETED_CENTRE.name}” will be permanently deleted.`);
    await expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeVisible();
  },
};

/** Admin / Costs — Audit Logs modal (2102:5857): the wide Modal / Dialog over the Costs list (pattern 08). */
export const AuditLogs: Story = {
  name: 'Audit Logs',
  args: { flow: 'audit-logs' },
  play: async ({ canvasElement }) => {
    const { main, dialog } = await expectOverlay(canvasElement, { title: 'Costs', overlay: 'Audit Logs' });
    await expect(within(main).getByRole('button', { name: 'View Audit Logs', hidden: true })).toBeInTheDocument();
    await expect(within(dialog).getByRole('table', { name: 'Audit log' })).toBeVisible();
    await expect(within(dialog).getByRole('navigation', { name: 'Audit log pages' })).toBeVisible();
  },
};

/* ── User ───────────────────────────────────────────────────────────────── */

/** User / Create Cost — Cost Breakdown modal (2102:1201): Breakdowns → Add new, over the form (pattern 09). */
export const CostBreakdown: Story = {
  name: 'Cost Breakdown',
  args: { flow: 'cost-breakdown' },
  play: async ({ canvasElement }) => {
    const { dialog } = await expectOverlay(canvasElement, { title: 'New Cost', overlay: 'Cost Breakdown' });
    await expect(within(dialog).getByRole('textbox', { name: /^Title/ })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Add' })).toBeVisible();
  },
};

/** User / Recurring Costs — Payment Schedules modal (2102:1266): #1882's payments, done and upcoming (U04). */
export const PaymentSchedules: Story = {
  name: 'Payment Schedules',
  args: { flow: 'payment-schedules' },
  play: async ({ canvasElement }) => {
    const { main, dialog } = await expectOverlay(canvasElement, { title: 'Recurring Costs', overlay: 'Payment Schedules' });
    await expect(within(main).getByRole('table', { name: 'Recurring costs', hidden: true })).toBeInTheDocument();
    const schedule = userRecurringCosts[0].schedule;
    await expect(within(dialog).getAllByText(/^Processed on |^Scheduled$/)).toHaveLength(schedule.length);
  },
};

/** User / Recurring Costs — Edit Recurring Cost panel (2102:1284): the side sheet against the right edge (pattern 06). */
export const EditRecurringCost: Story = {
  name: 'Edit Recurring Cost',
  args: { flow: 'edit-recurring-cost' },
  play: async ({ canvasElement }) => {
    const { dialog } = await expectOverlay(canvasElement, { title: 'Recurring Costs', overlay: 'Edit Recurring Cost #1882' });
    const box = dialog.getBoundingClientRect();
    await expect(Math.abs(box.right - document.documentElement.clientWidth)).toBeLessThan(1);
    await expect(Math.abs(box.height - window.innerHeight)).toBeLessThan(1);
    await expect(within(dialog).getByRole('button', { name: 'Update' })).toBeVisible();
  },
};

/* ── Dark and mobile ────────────────────────────────────────────────────── */

/** The side sheet in Dark: the scrim and the sheet follow the theme. */
export const Dark: Story = {
  args: { flow: 'edit-recurring-cost' },
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    await expectOverlay(canvasElement, { title: 'Recurring Costs', overlay: 'Edit Recurring Cost #1882' });
    await expect(document.documentElement).toHaveClass('dark');
  },
};

/** Add New Cost Center below 768px: the dialog keeps 16 from the screen's edges. */
export const Mobile: Story = {
  args: { flow: 'add-cost-center' },
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: async ({ canvasElement }) => {
    const { dialog } = await expectOverlay(canvasElement, { title: 'Cost Centers', overlay: 'Add New Cost Center' });
    if (isDesktop()) return;
    const box = dialog.getBoundingClientRect();
    await expect(box.left).toBeGreaterThan(0);
    await expect(box.right).toBeLessThan(document.documentElement.clientWidth);
  },
};
