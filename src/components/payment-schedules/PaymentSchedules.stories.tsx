import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { PaymentRow, type PaymentRowStatus } from '../payment-row';
import { PaymentSchedules } from './PaymentSchedules';

/* Each story in its own frame on the docs page: an open modal covers the
   whole document and makes everything else inert. */
const OVERLAY_DOCS_STORY = { inline: false, height: '640px' } as const;

type Payment = { status: PaymentRowStatus; date: string; subtitle: string };

/* Figma's five payments: three processed, two scheduled. */
const PAYMENTS: Payment[] = [
  { status: 'done', date: 'September 1, 2026', subtitle: 'Processed on Sep 1, 2026' },
  { status: 'done', date: 'September 8, 2026', subtitle: 'Processed on Sep 8, 2026' },
  { status: 'done', date: 'September 15, 2026', subtitle: 'Processed on Sep 15, 2026' },
  { status: 'upcoming', date: 'September 22, 2026', subtitle: 'Scheduled' },
  { status: 'upcoming', date: 'September 29, 2026', subtitle: 'Scheduled' },
];

const rows = (payments: Payment[] = PAYMENTS) =>
  payments.map((p) => <PaymentRow key={p.date} status={p.status} date={p.date} subtitle={p.subtitle} />);

const meta = {
  title: 'Components/PaymentSchedules',
  component: PaymentSchedules,
  parameters: {
    docs: {
      story: OVERLAY_DOCS_STORY,
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Payment Schedules`): the modal Recurring Costs’ ' +
          'View Schedules opens. A ModalHeader (`title` “Payment Schedules”, `description` “Upcoming and processed ' +
          'payments”, the calendar tile, Close) over a list of PaymentRows (`children`), 8px apart, on `surface.base` ' +
          'with radius 12, 512 wide. It is an Overlay: a dialog named by its title, focus moved in and trapped, Escape ' +
          'or Close (or a backdrop click) asking `onClose`, and focus back on the opener when it closes.',
      },
    },
  },
} satisfies Meta<typeof PaymentSchedules>;

export default meta;
/* Every story renders its own modal, so none takes args. */
type Story = StoryObj<typeof PaymentSchedules>;

/** Page furniture behind the modal, so the scrim shows over something. */
function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4">
      {children}
      <p className="max-w-96 text-body-sm-regular text-text-secondary">
        Recurring cost #1882 · Employee Expenses · Weekly. While the schedule is open, this page is inert.
      </p>
    </div>
  );
}

/** The opener: View Schedules, a real Button outside the portal, which focus must come back to. */
function WithTrigger({ payments }: { payments?: Payment[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Page>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        View Schedules
      </Button>
      <PaymentSchedules open={open} onClose={() => setOpen(false)}>
        {rows(payments)}
      </PaymentSchedules>
    </Page>
  );
}

/* A token's computed colour in the current theme. Measure before waitFor, never inside it:
   the probe is a DOM mutation, and waitFor reruns its callback on every mutation. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/* ── Open, in Light and Dark ───────────────────────────────────────────────
   Figma's modal with its five payments. The panel is surface.base, radius 12,
   512 wide; the header is Modal / Header; the rows are a list, 8px apart, 24px
   from the panel's sides and bottom. */
const open = (theme: 'light' | 'dark'): Story => ({
  name: `Open — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <Page>
      <PaymentSchedules open onClose={() => {}}>
        {rows()}
      </PaymentSchedules>
    </Page>
  ),
  globals: { theme },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async () => {
    const want = {
      panel: tokenColour('surface-base'),
      scrim: tokenColour('surface-overlay'),
      title: tokenColour('text-primary'),
      description: tokenColour('text-subtle'),
    };
    const dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleDescription('Upcoming and processed payments');
    await waitFor(() => expect(dialog).toHaveFocus());

    const style = getComputedStyle(dialog);
    await expect(style.backgroundColor).toBe(want.panel);
    await expect(style.borderTopLeftRadius).toBe('12px');
    await expect(style.boxShadow).toBe('none');
    await expect(dialog.getBoundingClientRect().width).toBeLessThanOrEqual(512);
    await expect(getComputedStyle(dialog.parentElement!).backgroundColor).toBe(want.scrim);

    const d = within(dialog);
    const title = d.getByRole('heading', { level: 2, name: 'Payment Schedules' });
    await expect(getComputedStyle(title).color).toBe(want.title);
    await expect(getComputedStyle(d.getByText('Upcoming and processed payments')).color).toBe(want.description);
    await expect(d.getByRole('button', { name: 'Close' })).toBeInTheDocument();

    // The rows: one list item per payment, 8px apart, 24px from the sides and the bottom.
    const items = d.getAllByRole('listitem');
    await expect(items).toHaveLength(5);
    await expect(items.map((li) => li.querySelector('[data-part="status-badge"]')!.textContent)).toEqual([
      'Done',
      'Done',
      'Done',
      'Upcoming',
      'Upcoming',
    ]);
    await expect(items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().bottom).toBe(8);
    const list = dialog.querySelector<HTMLElement>('[data-part="rows"]')!;
    const pad = getComputedStyle(list);
    await expect([pad.paddingTop, pad.paddingRight, pad.paddingBottom, pad.paddingLeft]).toEqual(['0px', '24px', '24px', '24px']);
    await expect(items[0].getBoundingClientRect().left - dialog.getBoundingClientRect().left).toBe(24);
    // Never taller than the viewport. In a short one the list scrolls, and is then a tab stop.
    await expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    const scrolls = list.scrollHeight > list.clientHeight + 1;
    await waitFor(() =>
      scrolls ? expect(list).toHaveAttribute('tabindex', '0') : expect(list).not.toHaveAttribute('tabindex'),
    );
  },
});

export const OpenLight = open('light');
export const OpenDark = open('dark');

/* ── Behaviour ─────────────────────────────────────────────────────────────── */

/**
 * View Schedules opens it, with focus in the dialog. Close shuts it and puts
 * focus back on View Schedules; so does Escape, the second time.
 */
export const CloseAndFocusReturn: Story = {
  render: () => <WithTrigger />,
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'View Schedules' });

    // Close button.
    await userEvent.click(trigger);
    let dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await waitFor(() => expect(dialog).toHaveFocus());
    // Tab goes to Close, then wraps inside the dialog. In a short viewport the
    // list scrolls and is a second stop; either way focus comes back to Close.
    const close = within(dialog).getByRole('button', { name: 'Close' });
    await userEvent.tab();
    await expect(close).toHaveFocus();
    const stops = dialog.querySelector('[data-part="rows"]')!.hasAttribute('tabindex') ? 2 : 1;
    for (let i = 0; i < stops; i++) await userEvent.tab();
    await expect(close).toHaveFocus();
    await userEvent.click(close);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();

    // Escape.
    await userEvent.click(trigger);
    dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

/* A year of weekly payments: far taller than the viewport. */
const YEAR = Array.from({ length: 30 }, (_, i): Payment => {
  const day = new Date(Date.UTC(2026, 8, 1 + i * 7));
  const date = day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const short = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return i < 8 ? { status: 'done', date, subtitle: `Processed on ${short}` } : { status: 'upcoming', date, subtitle: 'Scheduled' };
});

/**
 * Many payments: the panel stays inside the viewport, the header stays put,
 * and the list scrolls. It is then a tab stop, so the keyboard can scroll it.
 */
export const ManyPayments: Story = {
  render: () => <WithTrigger payments={YEAR} />,
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'View Schedules' }));
    const dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await expect(within(dialog).getAllByRole('listitem')).toHaveLength(30);
    await expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    const list = dialog.querySelector<HTMLElement>('[data-part="rows"]')!;
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    await waitFor(() => expect(list).toHaveAttribute('tabindex', '0'));
    // Tab from the dialog: Close, then the list.
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    await expect(list).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
