import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { MenuDropdown } from '../menu-dropdown';
import { MenuItem } from '../menu-item';
import { ModalHeader } from '../modal-header';
import { Overlay } from './Overlay';

/* Each story in its own frame on the docs page: an open overlay covers the
   whole document and makes everything else inert. */
const OVERLAY_DOCS_STORY = { inline: false, height: '640px' } as const;

const meta: Meta<typeof Overlay> = {
  title: 'Components/Overlay',
  component: Overlay,
  parameters: {
    docs: {
      story: OVERLAY_DOCS_STORY,
      description: {
        component:
          'The modal layer under every CAF dialog: ModalDialog, ModalConfirm and SideSheet are built on it, and so is ' +
          'any modal Figma composes from `Modal / Header` (Payment Schedules, below). Figma draws it as the **Overlay** ' +
          'frame on the Patterns – Admin page: `surface.overlay` over the page, the dialog centred (`placement="center"`) ' +
          'or against the right edge (`"right"`). Code adds the behaviour: a portal, `aria-modal`, focus moved in and ' +
          'trapped, Escape (and a backdrop click, when `dismissible`) asking `onClose`, the page behind inert and its ' +
          'scroll locked, and focus back on the opener on close. Name the panel with `aria-labelledby`.',
      },
    },
  },
};

export default meta;
/* Every story renders its own overlay, so none takes args. */
type Story = StoryObj<typeof Overlay>;

/** Figma's Payment Schedules modal shell: 512 wide, radius 12, Modal / Header over the rows. */
function PaymentSchedules({ open, onClose, dismissible }: { open: boolean; onClose: () => void; dismissible?: boolean }) {
  const id = React.useId();
  return (
    <Overlay
      open={open}
      dismissible={dismissible}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-12 border border-stroke-subtle bg-surface-base shadow-elevation-4"
    >
      <ModalHeader
        title="Payment Schedules"
        description="Upcoming and processed payments"
        titleId={`${id}-title`}
        descriptionId={`${id}-description`}
        onClose={onClose}
      />
      <div className="flex flex-col gap-2 px-6 pb-6 text-body-sm-regular text-text-secondary">
        <p>Payment 1 · 1 Sep 2026 · USD 900 · Done</p>
        <p>Payment 2 · 1 Oct 2026 · USD 900 · Upcoming</p>
      </div>
    </Overlay>
  );
}

/** Page furniture behind the overlay, so the scrim shows over something. */
function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4">
      {children}
      <p className="max-w-96 text-body-sm-regular text-text-secondary">
        Recurring costs for the finance team. While a dialog is open, this page is inert.
      </p>
    </div>
  );
}

/** The opener: a real Button outside the portal, which focus must come back to. */
function WithTrigger({ label, dismissible }: { label: string; dismissible?: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Page>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <PaymentSchedules open={open} onClose={() => setOpen(false)} dismissible={dismissible} />
    </Page>
  );
}

/** The `<body>` child the story renders in: the node the overlay makes inert. */
function bodyChildOf(el: HTMLElement): HTMLElement {
  let node = el;
  while (node.parentElement && node.parentElement !== document.body) node = node.parentElement;
  return node;
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
   The scrim is surface.overlay over the whole viewport; the dialog is in the
   middle, named by its title, and holds focus; the page is inert and still. */
const open = (theme: 'light' | 'dark'): Story => ({
  name: `Payment Schedules — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <Page>
      <PaymentSchedules open onClose={() => {}} />
    </Page>
  ),
  globals: { theme },
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const scrim = tokenColour('surface-overlay');
    const dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleDescription('Upcoming and processed payments');
    const backdrop = dialog.parentElement!;
    await expect(backdrop.parentElement).toBe(document.body);
    await expect(getComputedStyle(backdrop).backgroundColor).toBe(scrim);
    const viewport = backdrop.getBoundingClientRect();
    await expect([viewport.top, viewport.left]).toEqual([0, 0]);
    await expect(viewport.width).toBe(window.innerWidth);
    await expect(viewport.height).toBe(window.innerHeight);
    // Centred.
    const box = dialog.getBoundingClientRect();
    await expect(box.left + box.width / 2).toBeCloseTo(viewport.width / 2, 0);
    await expect(box.top + box.height / 2).toBeCloseTo(viewport.height / 2, 0);
    await waitFor(() => expect(dialog).toHaveFocus());
    await expect(bodyChildOf(canvasElement)).toHaveAttribute('inert');
    await expect(document.body.style.overflow).toBe('hidden');
  },
});

export const PaymentSchedulesLight = open('light');
export const PaymentSchedulesDark = open('dark');

/* ── Behaviour ─────────────────────────────────────────────────────────────── */

/**
 * Opens from a real trigger. Focus moves to the dialog; Tab and Shift+Tab wrap
 * inside it; the page behind is inert and doesn't scroll. Escape closes it, and
 * focus, the page and its scroll come back.
 */
export const OpensTrapsAndCloses: Story = {
  render: () => <WithTrigger label="Payment schedules" />,
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Payment schedules' });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await waitFor(() => expect(dialog).toHaveFocus());
    await expect(bodyChildOf(canvasElement)).toHaveAttribute('inert');
    await expect(document.body.style.overflow).toBe('hidden');

    // The only control is Close: Tab and Shift+Tab both stay on it.
    const close = within(dialog).getByRole('button', { name: 'Close' });
    await userEvent.tab();
    await expect(close).toHaveFocus();
    await userEvent.tab();
    await expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(close).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(bodyChildOf(canvasElement)).not.toHaveAttribute('inert');
    await expect(document.body.style.overflow).toBe('');
  },
};

/** The close button closes it, and so does a click on the backdrop. Focus goes back to the trigger each time. */
export const CloseButtonAndBackdrop: Story = {
  render: () => <WithTrigger label="Payment schedules" />,
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Payment schedules' });

    await userEvent.click(trigger);
    let dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    // A click inside the dialog keeps it open.
    await userEvent.click(within(dialog).getByText(/Payment 1/));
    await expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(dialog.parentElement!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

/** `dismissible={false}`: a backdrop click doesn't close it and puts focus back in the dialog. Escape still does. */
export const NotDismissible: Story = {
  render: () => <WithTrigger label="Payment schedules" dismissible={false} />,
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Payment schedules' });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    await userEvent.click(dialog.parentElement!);
    await expect(screen.getByRole('dialog')).toBeInTheDocument();
    await expect(dialog).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

/** A row menu inside the dialog: Escape closes the open menu first, then the dialog. */
function WithRowMenu() {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const close = () => setOpen(false);
  return (
    <Page>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Payment schedules
      </Button>
      <Overlay
        open={open}
        onClose={close}
        aria-labelledby={`${id}-title`}
        className="flex max-h-full w-full max-w-lg flex-col rounded-12 border border-stroke-subtle bg-surface-base shadow-elevation-4"
      >
        <ModalHeader title="Payment Schedules" titleId={`${id}-title`} onClose={close} />
        <div className="flex items-center justify-between gap-4 px-6 pb-6 text-body-sm-regular text-text-secondary">
          <p>Payment 2 · 1 Oct 2026 · USD 900 · Upcoming</p>
          <MenuDropdown align="right" trigger={<IconButton icon="dots-three" label="Payment 2 actions" />}>
            <MenuItem>Mark as paid</MenuItem>
            <MenuItem destructive>Skip payment</MenuItem>
          </MenuDropdown>
        </div>
      </Overlay>
    </Page>
  );
}

export const EscapeClosesAMenuFirst: Story = {
  render: () => <WithRowMenu />,
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Payment schedules' });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Payment Schedules' });
    const menuButton = within(dialog).getByRole('button', { name: 'Payment 2 actions' });
    await userEvent.click(menuButton);
    await waitFor(() => expect(within(dialog).getByRole('menuitem', { name: 'Mark as paid' })).toHaveFocus());

    // The first Escape closes the menu and hands focus back to its button; the dialog stays.
    await userEvent.keyboard('{Escape}');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(screen.getByRole('dialog', { name: 'Payment Schedules' })).toBeInTheDocument();
    await expect(menuButton).toHaveFocus();

    // The second closes the dialog.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};
