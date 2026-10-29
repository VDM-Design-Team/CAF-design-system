import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { ModalConfirm, MODAL_CONFIRM_TYPES, type ModalConfirmType } from './ModalConfirm';

/* Each story in its own frame on the docs page: an open dialog covers the
   whole document and makes everything else inert. */
const OVERLAY_DOCS_STORY = { inline: false, height: '480px' } as const;

const meta = {
  title: 'Components/ModalConfirm',
  component: ModalConfirm,
  parameters: {
    docs: {
      story: OVERLAY_DOCS_STORY,
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Confirm`): the confirmation for Approve, Reject, ' +
          'Stop and Delete. `type` is `default` (info icon, Default button) or `destructive` (critical icon, Destructive ' +
          'button); `title` and `message` are Title and Message; `confirmLabel` and `cancelLabel` are the button labels ' +
          'Figma says to edit. It is an `alertdialog`: focus opens on Cancel, Escape and Cancel call `onClose`, the other ' +
          'button calls `onConfirm`, and a backdrop click does nothing. You set `open`.',
      },
    },
  },
  args: {
    open: true,
    onClose: fn(),
    onConfirm: fn(),
    title: 'Confirm action',
    message: 'Are you sure you want to continue? This action may not be reversible.',
  },
  argTypes: {
    type: { control: 'radio', options: MODAL_CONFIRM_TYPES },
    open: { control: 'boolean' },
  },
} satisfies Meta<typeof ModalConfirm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Page furniture behind the dialog, so the scrim shows over something. */
function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4">
      {children}
      <p className="max-w-96 text-body-sm-regular text-text-secondary">Cost centers · Employee Expenses</p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Page>
      <ModalConfirm {...args} />
    </Page>
  ),
};

/* A token's computed value in the current theme. Measure before waitFor, never inside it:
   the probe is a DOM mutation, and waitFor reruns its callback on every mutation. */
function tokenStyle(property: 'color' | 'fontSize', value: string) {
  const probe = document.createElement('span');
  probe.style[property] = value;
  document.body.append(probe);
  const computed = getComputedStyle(probe)[property];
  probe.remove();
  return computed;
}
const tokenColour = (token: string) => tokenStyle('color', `var(--color-${token})`);

/* Figma's bindings per Type: [tile fill, glyph, confirming button's fill]. */
const BOUND = {
  default: ['accent-info-tonal-surface-default', 'accent-info-tonal-content-default', 'action-primary-surface-default'],
  destructive: [
    'accent-critical-tonal-surface-default',
    'accent-critical-tonal-content-default',
    'accent-critical-filled-surface-default',
  ],
} as const;

/* Pattern 04's copy for Destructive; Figma's defaults for Default. */
const COPY = {
  default: { title: 'Approve this cost?', message: 'The cost moves to Approved and the requester is notified.', confirm: 'Approve' },
  destructive: {
    title: 'Delete cost center?',
    message: '“Employee Expenses” will be permanently deleted. This can’t be undone.',
    confirm: 'Delete',
  },
} as const;

/* ── Each Type, in Light and Dark ──────────────────────────────────────────── */
const typed = (type: ModalConfirmType, theme: 'light' | 'dark'): Story => ({
  name: `${type === 'default' ? 'Default' : 'Destructive'} — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { type, title: COPY[type].title, message: COPY[type].message, confirmLabel: COPY[type].confirm },
  render: (args) => (
    <Page>
      <ModalConfirm {...args} />
    </Page>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async () => {
    const [fill, glyph, confirmFill] = BOUND[type];
    const want = {
      surface: tokenColour('surface-base'),
      stroke: tokenColour('stroke-subtle'),
      scrim: tokenColour('surface-overlay'),
      title: tokenColour('text-primary'),
      message: tokenColour('text-secondary'),
      fill: tokenColour(fill),
      glyph: tokenColour(glyph),
      confirm: tokenColour(confirmFill),
      titleSize: tokenStyle('fontSize', 'var(--text-body-lg-semibold)'),
      messageSize: tokenStyle('fontSize', 'var(--text-body-sm-regular)'),
    };
    const dialog = await screen.findByRole('alertdialog', { name: COPY[type].title });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleDescription(COPY[type].message);
    await expect(getComputedStyle(dialog.parentElement!).backgroundColor).toBe(want.scrim);

    // The panel: surface.base, 1px stroke.subtle, radius 12, 24 padding, 20 between rows, capped at 448.
    const panel = getComputedStyle(dialog);
    await expect(panel.backgroundColor).toBe(want.surface);
    await expect(panel.borderTopColor).toBe(want.stroke);
    await expect(panel.borderTopWidth).toBe('1px');
    await expect(panel.borderRadius).toBe('12px');
    await expect(panel.padding).toBe('24px');
    await expect(panel.rowGap).toBe('20px');
    await expect(panel.maxWidth).toBe('448px');

    // The icon tile: 40×40, radius 20, the Type's tonal fill and glyph (24px).
    const tile = dialog.querySelector<HTMLElement>('[data-part="icon"]')!;
    await expect(getComputedStyle(tile).backgroundColor).toBe(want.fill);
    await expect(getComputedStyle(tile).borderRadius).toBe('20px');
    await expect(tile.getBoundingClientRect().width).toBe(40);
    const svg = tile.querySelector('svg')!;
    await expect(getComputedStyle(svg).color).toBe(want.glyph);
    await expect(svg.getBoundingClientRect().width).toBe(24);

    const title = within(dialog).getByRole('heading', { level: 2, name: COPY[type].title });
    await expect(getComputedStyle(title).color).toBe(want.title);
    await expect(getComputedStyle(title).fontSize).toBe(want.titleSize);
    const message = within(dialog).getByText(COPY[type].message);
    await expect(getComputedStyle(message).color).toBe(want.message);
    await expect(getComputedStyle(message).fontSize).toBe(want.messageSize);

    // Text Cancel, then the Type's button; focus opens on Cancel.
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
    const confirm = within(dialog).getByRole('button', { name: COPY[type].confirm });
    await expect(getComputedStyle(confirm).backgroundColor).toBe(want.confirm);
    await waitFor(() => expect(cancel).toHaveFocus());
  },
});

export const DefaultLight = typed('default', 'light');
export const DefaultDark = typed('default', 'dark');
export const DestructiveLight = typed('destructive', 'light');
export const DestructiveDark = typed('destructive', 'dark');

/* ── Behaviour ─────────────────────────────────────────────────────────────── */

/** Pattern 04: a row's Delete opens the confirmation; Delete deletes, Cancel and Escape don't. */
function DeleteFlow({ onConfirm }: { onConfirm?: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Page>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete cost center
      </Button>
      <ModalConfirm
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onConfirm?.();
          setOpen(false);
        }}
        type="destructive"
        title={COPY.destructive.title}
        message={COPY.destructive.message}
      />
    </Page>
  );
}

/**
 * Focus opens on Cancel and wraps between the two buttons. A backdrop click
 * doesn't close it. Escape and Cancel close it without confirming; Delete
 * confirms. Focus goes back to the trigger each time.
 */
export const OpensTrapsAndCloses: Story = {
  render: (args) => <DeleteFlow onConfirm={args.onConfirm} />,
  parameters: { controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Delete cost center' });
    const open = async () => {
      await userEvent.click(trigger);
      const dialog = await screen.findByRole('alertdialog', { name: COPY.destructive.title });
      const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
      await waitFor(() => expect(cancel).toHaveFocus());
      return { dialog, cancel, confirm: within(dialog).getByRole('button', { name: 'Delete' }) };
    };
    const closed = async () => {
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
      await expect(trigger).toHaveFocus();
    };

    let { dialog, cancel, confirm } = await open();
    await userEvent.tab();
    await expect(confirm).toHaveFocus();
    await userEvent.tab();
    await expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(confirm).toHaveFocus();

    // A backdrop click is not an answer: still open, focus back in the dialog.
    await userEvent.click(dialog.parentElement!);
    await expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await expect(dialog).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await closed();

    ({ cancel } = await open());
    await userEvent.click(cancel);
    await closed();
    await expect(args.onConfirm).not.toHaveBeenCalled();

    ({ confirm } = await open());
    await userEvent.click(confirm);
    await closed();
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};
