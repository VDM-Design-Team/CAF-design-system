import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { TextInput } from '../text-input';
import { SideSheet } from './SideSheet';

/* Each story in its own frame on the docs page: an open sheet covers the
   whole document and makes everything else inert. */
const OVERLAY_DOCS_STORY = { inline: false, height: '720px' } as const;

const meta = {
  title: 'Components/SideSheet',
  component: SideSheet,
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: OVERLAY_DOCS_STORY,
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Panel / Side Sheet`): the right-hand sheet for edit flows ' +
          'such as Edit Recurring Cost. 672 wide, full height, against the right edge over the page Overlay. `title` names ' +
          'it; `children` is the Content slot, in a body that scrolls; `footer` holds the actions and `showFooter` is Show ' +
          'Footer. The close button, Escape and a backdrop click call `onClose`; you set `open`. Focus moves into the ' +
          'sheet, is trapped there, and goes back to the opener on close.',
      },
    },
  },
  args: {
    open: true,
    onClose: fn(),
    title: 'Edit Recurring Cost #1882',
  },
  argTypes: {
    open: { control: 'boolean' },
    children: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof SideSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pattern 06's content: the recurring details of a cost. */
function RecurringDetails() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h3 className="text-body-md-semibold text-text-primary">Recurring Details</h3>
        <p className="text-body-sm-regular text-text-subtle">How often this cost repeats and when it starts.</p>
      </div>
      <label className="flex flex-col gap-2 text-body-sm-semibold text-text-primary">
        Frequency
        <TextInput defaultValue="Weekly" />
      </label>
      <label className="flex flex-col gap-2 text-body-sm-semibold text-text-primary">
        Starts At
        <TextInput defaultValue="2026-09-01" />
      </label>
      <label className="flex flex-col gap-2 text-body-sm-semibold text-text-primary">
        Payment Method
        <TextInput defaultValue="Wiretransfer" />
      </label>
    </>
  );
}

/** Figma's footer: a Text Cancel and a Default Update. */
function Actions({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Button variant="text" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={onClose}>Update</Button>
    </>
  );
}

/** Page furniture behind the sheet, so the scrim shows over something. */
function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      {children}
      <p className="max-w-96 text-body-sm-regular text-text-secondary">Recurring costs · 32 results</p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Page>
      <SideSheet {...args} footer={<Actions onClose={args.onClose} />}>
        <RecurringDetails />
      </SideSheet>
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

/* ── Open, in Light and Dark ───────────────────────────────────────────────
   Against the right edge, full height, capped at 672; surface.base with a 1px
   stroke.subtle line on its left; Dialog's header, body and footer bands. */
const opened = (theme: 'light' | 'dark'): Story => ({
  name: `Side sheet — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: (args) => (
    <Page>
      <SideSheet {...args} footer={<Actions onClose={args.onClose} />}>
        <RecurringDetails />
      </SideSheet>
    </Page>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async () => {
    const want = {
      surface: tokenColour('surface-base'),
      stroke: tokenColour('stroke-subtle'),
      scrim: tokenColour('surface-overlay'),
      title: tokenColour('text-primary'),
      titleSize: tokenStyle('fontSize', 'var(--text-body-lg-semibold)'),
    };
    const sheet = await screen.findByRole('dialog', { name: 'Edit Recurring Cost #1882' });
    await expect(sheet).toHaveAttribute('aria-modal', 'true');
    const backdrop = sheet.parentElement!;
    await expect(getComputedStyle(backdrop).backgroundColor).toBe(want.scrim);

    // Placement: flush right, top to bottom.
    const viewport = backdrop.getBoundingClientRect();
    const box = sheet.getBoundingClientRect();
    await expect(box.right).toBeCloseTo(viewport.right, 0);
    await expect(box.top).toBe(viewport.top);
    await expect(box.height).toBe(viewport.height);

    const panel = getComputedStyle(sheet);
    await expect(panel.maxWidth).toBe('672px');
    await expect(panel.backgroundColor).toBe(want.surface);
    await expect(panel.borderLeftWidth).toBe('1px');
    await expect(panel.borderLeftColor).toBe(want.stroke);
    await expect(panel.borderTopWidth).toBe('0px');
    await expect(panel.borderRadius).toBe('0px');

    const header = getComputedStyle(sheet.querySelector('[data-part="header"]')!);
    await expect([header.paddingTop, header.paddingRight, header.paddingBottom, header.paddingLeft]).toEqual([
      '20px',
      '24px',
      '20px',
      '24px',
    ]);
    await expect(header.borderBottomColor).toBe(want.stroke);
    const title = within(sheet).getByRole('heading', { level: 2, name: 'Edit Recurring Cost #1882' });
    await expect(getComputedStyle(title).color).toBe(want.title);
    await expect(getComputedStyle(title).fontSize).toBe(want.titleSize);

    // The body fills the height between header and footer.
    const body = sheet.querySelector<HTMLElement>('[data-part="body"]')!;
    await expect(getComputedStyle(body).padding).toBe('24px');
    await expect(getComputedStyle(body).flexGrow).toBe('1');
    const footer = sheet.querySelector<HTMLElement>('[data-part="footer"]')!;
    await expect(footer.getBoundingClientRect().bottom).toBeCloseTo(box.bottom, 0);
    await expect(getComputedStyle(footer).borderTopColor).toBe(want.stroke);
    await waitFor(() => expect(sheet).toHaveFocus());
  },
});

export const SideSheetLight = opened('light');
export const SideSheetDark = opened('dark');

/** Show Footer off: no footer, and the body runs to the bottom. */
export const WithoutFooter: Story = {
  args: { showFooter: false },
  render: (args) => (
    <Page>
      <SideSheet {...args} footer={<Actions onClose={args.onClose} />}>
        <RecurringDetails />
      </SideSheet>
    </Page>
  ),
  parameters: { controls: { disable: true } },
  play: async () => {
    const sheet = await screen.findByRole('dialog', { name: 'Edit Recurring Cost #1882' });
    await expect(sheet.querySelector('[data-part="footer"]')).toBeNull();
    const body = sheet.querySelector<HTMLElement>('[data-part="body"]')!;
    await expect(body.getBoundingClientRect().bottom).toBeCloseTo(sheet.getBoundingClientRect().bottom, 0);
  },
};

/* ── Behaviour ─────────────────────────────────────────────────────────────── */

/** Opens from a row's Edit, as on Recurring Costs. */
function WithTrigger({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  return (
    <Page>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Edit recurring cost
      </Button>
      <SideSheet open={open} onClose={close} title="Edit Recurring Cost #1882" footer={<Actions onClose={close} />}>
        <RecurringDetails />
      </SideSheet>
    </Page>
  );
}

/**
 * Focus moves to the sheet on open and Tab wraps inside it; the page behind is
 * inert and still. The close button, Escape and a backdrop click each close it,
 * and focus goes back to "Edit recurring cost".
 */
export const OpensTrapsAndCloses: Story = {
  render: (args) => <WithTrigger onClose={args.onClose} />,
  parameters: { controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Edit recurring cost' });
    const open = async () => {
      await userEvent.click(trigger);
      const sheet = await screen.findByRole('dialog', { name: 'Edit Recurring Cost #1882' });
      await waitFor(() => expect(sheet).toHaveFocus());
      return sheet;
    };
    const closed = async () => {
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await expect(trigger).toHaveFocus();
    };

    let sheet = await open();
    const close = within(sheet).getByRole('button', { name: 'Close' });
    const update = within(sheet).getByRole('button', { name: 'Update' });
    await userEvent.tab();
    await expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(update).toHaveFocus();
    await userEvent.tab();
    await expect(close).toHaveFocus();
    await expect(document.body.style.overflow).toBe('hidden');

    await userEvent.click(close);
    await closed();
    await expect(document.body.style.overflow).toBe('');

    await open();
    await userEvent.keyboard('{Escape}');
    await closed();

    sheet = await open();
    await userEvent.click(sheet.parentElement!);
    await closed();
    await expect(args.onClose).toHaveBeenCalledTimes(3);
  },
};
