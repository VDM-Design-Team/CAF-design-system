import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { BulletItem } from '../bullet-item';
import { ChangelogModal } from './ChangelogModal';

/* Each story in its own frame on the docs page: an open dialog covers the
   whole document and makes everything else inert. */
const OVERLAY_DOCS_STORY = { inline: false, height: '640px' } as const;

const TITLE = 'WELCOME TO THE NEW UPDATE FOR THIS MONTH';

const meta = {
  title: 'Components/ChangelogModal',
  component: ChangelogModal,
  parameters: {
    docs: {
      story: OVERLAY_DOCS_STORY,
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Changelog`): the what’s-new dialog that opens ' +
          'once after sign-in with the newest release (patterns 14 and U07). A ChangelogHeader (`title`, `date`, ' +
          '`version`), ReleaseNotes (`sectionTitle`, the BulletItems as `children`) and two actions: View Change Log ' +
          'calls `onViewChangeLog`, and Got It calls `onClose`, as Escape and a backdrop click do. You set `open`, and ' +
          'record that the release was seen. Focus moves into the dialog, is trapped there, and goes back to the ' +
          'opener on close. On a narrow screen the actions stack.',
      },
    },
  },
  args: {
    open: true,
    onClose: fn(),
    onViewChangeLog: fn(),
    title: TITLE,
    date: 'August 10, 2026',
    version: 'v2.5.6',
    children: <BulletItem>new update for CAF</BulletItem>,
  },
  argTypes: {
    open: { control: 'boolean' },
    children: { control: false },
  },
} satisfies Meta<typeof ChangelogModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Page furniture behind the dialog, so the scrim shows over something. */
function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4">
      {children}
      <p className="max-w-96 text-body-sm-regular text-text-secondary">Costs · 24 results</p>
    </div>
  );
}

/** Figma's Modal / Changelog, open. Use the controls for the header and notes. */
export const Playground: Story = {
  render: (args) => (
    <Page>
      <ChangelogModal {...args} />
    </Page>
  ),
};

/* A token's computed value in the current theme. Measure before waitFor, never inside it:
   the probe is a DOM mutation, and waitFor reruns its callback on every mutation. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/* The utility's box-shadow (Tailwind inlines a theme shadow, so it's GDL's Light
   Elevation 2 in both themes; see docs/figma-sync.md, "ChangelogModal"). */
function utilityShadow(className: string) {
  const probe = document.createElement('div');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).boxShadow;
  probe.remove();
  return value;
}

/* ── Open, in Light and Dark ───────────────────────────────────────────────
   Figma's dialog with pattern 14's release. Every part is checked against the
   variable, text style and spacing its Figma layer is bound to. */
const opened = (theme: 'light' | 'dark'): Story => ({
  name: `Open — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: (args) => (
    <Page>
      <ChangelogModal {...args} />
    </Page>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async () => {
    const want = {
      scrim: tokenColour('surface-overlay'),
      surface: tokenColour('surface-canvas'),
      icon: tokenColour('accent-red-medium'),
      title: tokenColour('text-primary'),
      date: tokenColour('text-secondary'),
      badgeFill: tokenColour('surface-base'),
      badgeText: tokenColour('accent-info-tonal-content-default'),
      sectionTitle: tokenColour('text-primary'),
      note: tokenColour('text-primary'),
      dot: tokenColour('accent-success-tonal-content-default'),
      primary: tokenColour('action-primary-surface-default'),
      primaryText: tokenColour('action-primary-content-default'),
      outlinedText: tokenColour('action-secondary-content-default'),
      shadow: utilityShadow('shadow-elevation-2'),
    };
    // The dialog is named by the header's title, and it's modal.
    const dialog = await screen.findByRole('dialog', { name: TITLE });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    const scope = within(dialog);
    const title = scope.getByRole('heading', { level: 2, name: TITLE });
    const icon = dialog.querySelector<SVGElement>('[data-part="icon"]')!;
    const date = scope.getByText('August 10, 2026');
    const badge = scope.getByText('v2.5.6');
    const notes = scope.getByRole('list', { name: "What's new in this release:" });
    const sectionTitle = scope.getByText("What's new in this release:");
    const note = within(notes).getByRole('listitem');
    const view = scope.getByRole('button', { name: 'View Change Log' });
    const gotIt = scope.getByRole('button', { name: 'Got It' });
    const actions = dialog.querySelector<HTMLElement>('[data-part="actions"]')!;
    await expect(icon).toHaveAttribute('aria-hidden', 'true');

    await waitFor(() => {
      // The scrim: surface.overlay.
      expect(getComputedStyle(dialog.parentElement!).backgroundColor).toBe(want.scrim);
      // The panel: surface.canvas, radius 16, 32px padding, 24px gap, Elevation 2, no border, at most 512 wide.
      const panel = getComputedStyle(dialog);
      expect(panel.backgroundColor).toBe(want.surface);
      expect(panel.borderTopLeftRadius).toBe('16px');
      expect(panel.padding).toBe('32px');
      expect(panel.rowGap).toBe('24px');
      expect(panel.boxShadow).toBe(want.shadow);
      expect(panel.borderTopWidth).toBe('0px');
      expect(panel.maxWidth).toBe('512px');
      // Header: the rocket (48px, accent.red.medium), Title/md-bold in text.primary,
      // the date in text.secondary (the dialog's override), the VersionBadge.
      expect(icon.getBoundingClientRect().width).toBe(48);
      expect(getComputedStyle(icon).color).toBe(want.icon);
      expect(getComputedStyle(title).color).toBe(want.title);
      expect([getComputedStyle(title).fontSize, getComputedStyle(title).fontWeight]).toEqual(['20px', '700']);
      expect(getComputedStyle(date).color).toBe(want.date);
      expect(getComputedStyle(date).fontSize).toBe('14px');
      expect(getComputedStyle(badge).backgroundColor).toBe(want.badgeFill);
      expect(getComputedStyle(badge).color).toBe(want.badgeText);
      // Release Notes: the section title and the note in text.primary, the dot in accent.success.tonal.content.
      expect(getComputedStyle(sectionTitle).color).toBe(want.sectionTitle);
      expect(getComputedStyle(note).color).toBe(want.note);
      expect(getComputedStyle(note.querySelector('[data-part="dot"] > span')!).backgroundColor).toBe(want.dot);
      // Actions: a Default and an Outlined Normal Button, equal widths, filling the row, 16px apart.
      expect(getComputedStyle(view).backgroundColor).toBe(want.primary);
      expect(getComputedStyle(view).color).toBe(want.primaryText);
      expect(getComputedStyle(gotIt).color).toBe(want.outlinedText);
      expect(view.getBoundingClientRect().height).toBe(36);
      expect(view.getBoundingClientRect().width).toBeCloseTo(gotIt.getBoundingClientRect().width, 0);
      expect(getComputedStyle(actions).columnGap).toBe('16px');
      const room = actions.getBoundingClientRect();
      const [a, b] = [view.getBoundingClientRect(), gotIt.getBoundingClientRect()];
      if (room.width >= 384) {
        // Side by side, as in Figma.
        expect(a.top).toBe(b.top);
        expect(b.right - a.left).toBeCloseTo(room.width, 0);
      } else {
        // Stacked on a narrow screen, each the full width.
        expect(b.top - a.bottom).toBeCloseTo(16, 0);
        expect(a.width).toBeCloseTo(room.width, 0);
      }
    });
  },
});

export const OpenLight = opened('light');
export const OpenDark = opened('dark');

/* ── Narrow: the actions stack ─────────────────────────────────────────────
   Figma only draws the dialog at 500. Under 384 inside (a phone), the two
   Fill buttons would cut "View Change Log", so they stack. Shown here by
   capping the dialog at 384, whatever the screen. */
export const Narrow: Story = {
  name: 'Narrow — the actions stack',
  args: { className: 'max-w-sm' },
  render: (args) => (
    <Page>
      <ChangelogModal {...args} />
    </Page>
  ),
  parameters: { controls: { disable: true } },
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: TITLE });
    const view = within(dialog).getByRole('button', { name: 'View Change Log' });
    const gotIt = within(dialog).getByRole('button', { name: 'Got It' });
    await waitFor(() => {
      const [a, b] = [view.getBoundingClientRect(), gotIt.getBoundingClientRect()];
      expect(b.top - a.bottom).toBeCloseTo(16, 0);
      expect(a.width).toBe(b.width);
      // Neither label is cut.
      expect(view.scrollWidth).toBeLessThanOrEqual(view.clientWidth);
    });
  },
};

/* ── Behaviour ─────────────────────────────────────────────────────────────── */

/** Opens from a trigger, the way the app opens it after sign-in. */
function WithTrigger({ onClose, onViewChangeLog }: { onClose: () => void; onViewChangeLog: () => void }) {
  const [open, setOpen] = React.useState(false);
  const close = () => {
    setOpen(false);
    onClose();
  };
  return (
    <Page>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        What’s new
      </Button>
      <ChangelogModal
        open={open}
        onClose={close}
        onViewChangeLog={() => {
          setOpen(false);
          onViewChangeLog();
        }}
        title={TITLE}
        date="August 10, 2026"
        version="v2.5.6"
      >
        <BulletItem>new update for CAF</BulletItem>
        <BulletItem>Improved export performance</BulletItem>
      </ChangelogModal>
    </Page>
  );
}

/**
 * Focus moves to the dialog on open, and Tab and Shift+Tab wrap between its two
 * buttons. Got It, Escape and a backdrop click each call `onClose`; View Change
 * Log calls `onViewChangeLog`. Each time, focus goes back to "What's new".
 */
export const OpensTrapsAndCloses: Story = {
  render: (args) => <WithTrigger onClose={args.onClose} onViewChangeLog={args.onViewChangeLog} />,
  parameters: { controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'What’s new' });
    const open = async () => {
      await userEvent.click(trigger);
      const dialog = await screen.findByRole('dialog', { name: TITLE });
      await waitFor(() => expect(dialog).toHaveFocus());
      return dialog;
    };
    const closed = async () => {
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await expect(trigger).toHaveFocus();
    };

    // The trap: View Change Log is first, Got It is last; Tab and Shift+Tab wrap.
    let dialog = await open();
    const view = within(dialog).getByRole('button', { name: 'View Change Log' });
    const gotIt = within(dialog).getByRole('button', { name: 'Got It' });
    await userEvent.tab();
    await expect(view).toHaveFocus();
    await userEvent.tab();
    await expect(gotIt).toHaveFocus();
    await userEvent.tab();
    await expect(view).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(gotIt).toHaveFocus();
    await expect(document.body.style.overflow).toBe('hidden');

    // Got It.
    await userEvent.click(gotIt);
    await closed();
    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await expect(document.body.style.overflow).toBe('');

    // Escape.
    await open();
    await userEvent.keyboard('{Escape}');
    await closed();
    await expect(args.onClose).toHaveBeenCalledTimes(2);

    // A click on the backdrop.
    dialog = await open();
    await userEvent.click(dialog.parentElement!);
    await closed();
    await expect(args.onClose).toHaveBeenCalledTimes(3);

    // View Change Log.
    dialog = await open();
    await userEvent.click(within(dialog).getByRole('button', { name: 'View Change Log' }));
    await closed();
    await expect(args.onViewChangeLog).toHaveBeenCalledTimes(1);
    await expect(args.onClose).toHaveBeenCalledTimes(3);
  },
};
