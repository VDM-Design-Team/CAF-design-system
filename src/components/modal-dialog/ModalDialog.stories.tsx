import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { TextInput } from '../text-input';
import { ModalDialog, MODAL_DIALOG_SIZES, type ModalDialogSize } from './ModalDialog';

/* Each story in its own frame on the docs page: an open dialog covers the
   whole document and makes everything else inert. */
const OVERLAY_DOCS_STORY = { inline: false, height: '720px' } as const;

const meta = {
  title: 'Components/ModalDialog',
  component: ModalDialog,
  parameters: {
    docs: {
      story: OVERLAY_DOCS_STORY,
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Dialog`): the generic modal for Add Cost Center, ' +
          'Add Partner, Add User, Create Announcement, Cost Breakdown and Audit Logs. `size` is `small` (default), ' +
          '`medium` or `large`; `title` names the dialog; `description` and `showDescription` are Description and Show ' +
          'Description; `children` is the Content slot; `footer` holds the actions and `showFooter` is Show Footer. The ' +
          'close button, Escape and a backdrop click call `onClose`; you set `open`. Focus moves into the dialog, is ' +
          'trapped there, and goes back to the opener on close.',
      },
    },
  },
  args: {
    open: true,
    onClose: fn(),
    title: 'Add New Cost Center',
  },
  argTypes: {
    size: { control: 'radio', options: MODAL_DIALOG_SIZES },
    open: { control: 'boolean' },
    children: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof ModalDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pattern 05's content: the Add New Cost Center fields. */
function CostCenterFields() {
  return (
    <>
      <label className="flex flex-col gap-2 text-body-sm-semibold text-text-primary">
        Cost Center
        <TextInput placeholder="Select cost center" />
      </label>
      <label className="flex flex-col gap-2 text-body-sm-semibold text-text-primary">
        Nature of Service
        <TextInput placeholder="e.g. Salary" />
      </label>
      <label className="flex flex-col gap-2 text-body-sm-semibold text-text-primary">
        Location
        <TextInput placeholder="e.g. Philippines" />
      </label>
    </>
  );
}

/** Figma's footer: a Text Cancel and a Default action. */
function Actions({ onClose, action = 'Save' }: { onClose: () => void; action?: string }) {
  return (
    <>
      <Button variant="text" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={onClose}>{action}</Button>
    </>
  );
}

/** Page furniture behind the dialog, so the scrim shows over something. */
function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4">
      {children}
      <p className="max-w-96 text-body-sm-regular text-text-secondary">Cost centers · 24 results</p>
    </div>
  );
}

/** Use the controls: size, Show Description, Show Footer. */
export const Playground: Story = {
  args: { size: 'medium', description: 'Cost centers group costs for reporting.', showDescription: false },
  render: (args) => (
    <Page>
      <ModalDialog {...args} footer={<Actions onClose={args.onClose} />}>
        <CostCenterFields />
      </ModalDialog>
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

/* The utilities' box-shadow (Tailwind inlines a theme shadow, so it's GDL's Light
   Elevation 4 in both themes; see docs/figma-sync.md, "ModalDialog"). */
function utilityShadow(className: string) {
  const probe = document.createElement('div');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).boxShadow;
  probe.remove();
  return value;
}

/* Figma's widths, as code caps them: Small 400 → 384, Medium 560 → 576, Large 800 → 768. */
const MAX_WIDTH: Record<ModalDialogSize, string> = { small: '384px', medium: '576px', large: '768px' };

/** Checks every Modal / Dialog binding on the open dialog, against the current theme's tokens. */
async function checkBindings(size: ModalDialogSize, { description, footer }: { description: boolean; footer: boolean }) {
  const want = {
    surface: tokenColour('surface-base'),
    stroke: tokenColour('stroke-subtle'),
    scrim: tokenColour('surface-overlay'),
    title: tokenColour('text-primary'),
    description: tokenColour('text-subtle'),
    close: tokenColour('text-secondary'),
    titleSize: tokenStyle('fontSize', 'var(--text-body-lg-semibold)'),
    descriptionSize: tokenStyle('fontSize', 'var(--text-body-sm-regular)'),
    shadow: utilityShadow('shadow-elevation-4'),
  };
  const dialog = await screen.findByRole('dialog', { name: 'Add New Cost Center' });
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(getComputedStyle(dialog.parentElement!).backgroundColor).toBe(want.scrim);

  // The panel: surface.base, 1px stroke.subtle, radius 12, Elevation 4, the size's width.
  const panel = getComputedStyle(dialog);
  await expect(panel.backgroundColor).toBe(want.surface);
  await expect(panel.borderTopWidth).toBe('1px');
  await expect(panel.borderTopColor).toBe(want.stroke);
  await expect(panel.borderRadius).toBe('12px');
  await expect(panel.boxShadow).toBe(want.shadow);
  await expect(panel.maxWidth).toBe(MAX_WIDTH[size]);
  await expect(dialog.getBoundingClientRect().width).toBeLessThanOrEqual(parseFloat(MAX_WIDTH[size]));

  // Header: 20 / 24 padding, 16 gap, a stroke.subtle line under it.
  const header = getComputedStyle(dialog.querySelector('[data-part="header"]')!);
  await expect([header.paddingTop, header.paddingRight, header.paddingBottom, header.paddingLeft]).toEqual([
    '20px',
    '24px',
    '20px',
    '24px',
  ]);
  await expect(header.columnGap).toBe('16px');
  await expect(header.borderBottomColor).toBe(want.stroke);
  await expect(header.borderBottomWidth).toBe('1px');
  const title = within(dialog).getByRole('heading', { level: 2, name: 'Add New Cost Center' });
  await expect(getComputedStyle(title).color).toBe(want.title);
  await expect(getComputedStyle(title).fontSize).toBe(want.titleSize);
  await expect(getComputedStyle(title).fontWeight).toBe('600');
  const close = within(dialog).getByRole('button', { name: 'Close' });
  await expect(getComputedStyle(close.querySelector('svg')!).color).toBe(want.close);

  if (description) {
    await expect(dialog).toHaveAccessibleDescription('Cost centers group costs for reporting.');
    const text = within(dialog).getByText('Cost centers group costs for reporting.');
    await expect(getComputedStyle(text).color).toBe(want.description);
    await expect(getComputedStyle(text).fontSize).toBe(want.descriptionSize);
  } else {
    await expect(dialog).not.toHaveAttribute('aria-describedby');
  }

  // Body: 24 padding, 16 gap.
  const body = getComputedStyle(dialog.querySelector('[data-part="body"]')!);
  await expect(body.padding).toBe('24px');
  await expect(body.rowGap).toBe('16px');

  // Footer: 16 / 24 padding, 12 gap, actions at the right end, a stroke.subtle line over it.
  const footerEl = dialog.querySelector<HTMLElement>('[data-part="footer"]');
  if (!footer) {
    await expect(footerEl).toBeNull();
    return;
  }
  const foot = getComputedStyle(footerEl!);
  await expect([foot.paddingTop, foot.paddingRight, foot.paddingBottom, foot.paddingLeft]).toEqual([
    '16px',
    '24px',
    '16px',
    '24px',
  ]);
  await expect(foot.columnGap).toBe('12px');
  await expect(foot.justifyContent).toBe('flex-end');
  await expect(foot.borderTopColor).toBe(want.stroke);
  await expect(foot.borderTopWidth).toBe('1px');
}

/* ── Each Size, in Light and Dark ──────────────────────────────────────────
   Open, with Figma's defaults: no description, a footer of actions. */
const sized = (size: ModalDialogSize, theme: 'light' | 'dark'): Story => ({
  name: `${size[0].toUpperCase() + size.slice(1)} — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { size },
  render: (args) => (
    <Page>
      <ModalDialog {...args} footer={<Actions onClose={args.onClose} />}>
        <CostCenterFields />
      </ModalDialog>
    </Page>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async () => {
    await checkBindings(size, { description: false, footer: true });
  },
});

export const SmallLight = sized('small', 'light');
export const SmallDark = sized('small', 'dark');
export const MediumLight = sized('medium', 'light');
export const MediumDark = sized('medium', 'dark');
export const LargeLight = sized('large', 'light');
export const LargeDark = sized('large', 'dark');

/* ── Show Description on, Show Footer off, in Light and Dark ───────────────── */
const described = (theme: 'light' | 'dark'): Story => ({
  name: `Description, no footer — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: {
    size: 'small',
    description: 'Cost centers group costs for reporting.',
    showDescription: true,
    showFooter: false,
  },
  render: (args) => (
    <Page>
      <ModalDialog {...args} footer={<Actions onClose={args.onClose} />}>
        <p className="text-body-sm-regular text-text-secondary">Employee Expenses · 12 costs this month.</p>
      </ModalDialog>
    </Page>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async () => {
    await checkBindings('small', { description: true, footer: false });
  },
});

export const DescriptionNoFooterLight = described('light');
export const DescriptionNoFooterDark = described('dark');

/* ── Behaviour ─────────────────────────────────────────────────────────────── */

/** Opens from a real trigger, the way the Cost Centers page does. */
function WithTrigger({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  return (
    <Page>
      <Button onClick={() => setOpen(true)}>Add cost center</Button>
      <ModalDialog open={open} onClose={close} title="Add New Cost Center" size="medium" footer={<Actions onClose={close} />}>
        <CostCenterFields />
      </ModalDialog>
    </Page>
  );
}

/**
 * Focus moves to the dialog on open, Tab and Shift+Tab wrap inside it, and the
 * page behind is inert. Escape, the close button and a backdrop click each close
 * it, and focus goes back to "Add cost center".
 */
export const OpensTrapsAndCloses: Story = {
  render: (args) => <WithTrigger onClose={args.onClose} />,
  parameters: { controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Add cost center' });
    const open = async () => {
      await userEvent.click(trigger);
      const dialog = await screen.findByRole('dialog', { name: 'Add New Cost Center' });
      await waitFor(() => expect(dialog).toHaveFocus());
      return dialog;
    };
    const closed = async () => {
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await expect(trigger).toHaveFocus();
    };

    // The trap: Close is first, Save is last; Tab and Shift+Tab wrap.
    let dialog = await open();
    const close = within(dialog).getByRole('button', { name: 'Close' });
    const save = within(dialog).getByRole('button', { name: 'Save' });
    await userEvent.tab();
    await expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(save).toHaveFocus();
    await userEvent.tab();
    await expect(close).toHaveFocus();
    await expect(document.body.style.overflow).toBe('hidden');

    // Escape.
    await userEvent.keyboard('{Escape}');
    await closed();
    await expect(document.body.style.overflow).toBe('');

    // The close button.
    dialog = await open();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await closed();

    // A click on the backdrop.
    dialog = await open();
    await userEvent.click(dialog.parentElement!);
    await closed();
    await expect(args.onClose).toHaveBeenCalledTimes(3);
  },
};
