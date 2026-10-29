import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { Tooltip, TOOLTIP_PLACEMENTS } from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Feedback** (`Tooltip`): a short hint with an arrow pointing at its ' +
          'target. `text` is Figma’s Text and `placement` its Placement: `top` (default) or `bottom`. The target is ' +
          '`children`, one focusable element; it gets `aria-describedby`, and the tooltip has `role="tooltip"`. It opens ' +
          'on hover (after a short pause) and at once on keyboard focus, and closes on Escape, on blur and when the pointer ' +
          'leaves. The pointer can move onto it. It flips when the viewport has no room and is nudged back inside at the ' +
          'sides. Never put anything interactive in it, or anything the user can’t find elsewhere.',
      },
    },
  },
  args: {
    text: 'Last synced 8 Oct 2026, 09:14',
    placement: 'top',
    children: <Button variant="outlined">Sync status</Button>,
  },
  argTypes: {
    placement: { control: 'radio', options: TOOLTIP_PLACEMENTS },
    text: { control: 'text' },
    children: { control: false },
  },
  // Room above and below, so an open tooltip doesn't flip for want of space.
  decorators: [
    (Story) => (
      <div className="flex justify-center py-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Rendered open. Hover the target, or Tab to it, in the canvas. */
export const Playground: Story = {
  args: { defaultOpen: true },
};

/* ── Both placements, in Light and Dark ────────────────────────────────────
   Figma's bindings: surface.neutral.stronger body and arrow, text.inverted.primary
   label in Caption/md-medium, radius 6, padding 6 / 8 (Figma: 6 / 10), and the
   10×6 arrow centred on the target, 4px from it. Checked against the tokens. */

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

/* The tooltip a target is described by. */
function tooltipOf(target: HTMLElement) {
  const ids = (target.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
  const tip = document.getElementById(ids[ids.length - 1] ?? '');
  if (!tip) throw new Error('The target is not described by a tooltip');
  return tip;
}
const isOpen = (target: HTMLElement) => !tooltipOf(target).hidden && tooltipOf(target).getClientRects().length > 0;

const PLACED = [
  { placement: 'top', text: 'Downloads the filtered rows as CSV', label: 'Export' },
  { placement: 'bottom', text: 'Last synced 8 Oct 2026, 09:14', label: 'Sync status' },
] as const;

const placements = (theme: 'light' | 'dark'): Story => ({
  name: `Placements — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex items-center gap-16">
      {PLACED.map(({ placement, text, label }) => (
        <Tooltip key={placement} placement={placement} text={text} defaultOpen>
          <Button variant="outlined" data-placed={placement}>
            {label}
          </Button>
        </Tooltip>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { fill: tokenColour('surface-neutral-stronger'), text: tokenColour('text-inverted-primary') };
    for (const { placement, text } of PLACED) {
      const target = canvasElement.querySelector<HTMLElement>(`[data-placed="${placement}"]`)!;
      const tip = tooltipOf(target);
      await expect(tip).toHaveAttribute('role', 'tooltip');
      await expect(tip).toHaveAttribute('data-placement', placement);
      await expect(isOpen(target)).toBe(true);
      await expect(target).toHaveAccessibleDescription(text);

      const body = tip.querySelector<HTMLElement>('[data-tooltip-body]')!;
      const style = getComputedStyle(body);
      await expect(style.backgroundColor).toBe(want.fill);
      await expect(style.color).toBe(want.text);
      await expect(style.borderRadius).toBe('6px');
      await expect([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]).toEqual([
        '6px',
        '8px',
        '6px',
        '8px',
      ]);
      // Caption/md-medium: 12 / 16, weight 500.
      await expect([style.fontSize, style.lineHeight, style.fontWeight]).toEqual(['12px', '16px', '500']);

      // The arrow: 10×6, the body's colour, touching the body on the target's side, centred on the target, 4px from it.
      const arrow = tip.querySelector('svg')!;
      await expect(getComputedStyle(arrow).fill).toBe(want.fill);
      const a = arrow.getBoundingClientRect();
      const b = body.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      await expect(a.width).toBeCloseTo(10, 1);
      await expect(a.height).toBeCloseTo(6, 1);
      await expect(a.left + a.width / 2).toBeCloseTo(t.left + t.width / 2, 0);
      if (placement === 'top') {
        await expect(a.top).toBeCloseTo(b.bottom, 1);
        await expect(t.top - a.bottom).toBeCloseTo(4, 1);
      } else {
        await expect(b.top).toBeCloseTo(a.bottom, 1);
        await expect(a.top - t.bottom).toBeCloseTo(4, 1);
      }
    }
  },
});

export const PlacementsLight = placements('light');
export const PlacementsDark = placements('dark');

/** Long text wraps at 256px rather than running off the screen. Two lines is a lot for a tooltip. */
export const LongText: Story = {
  args: {
    defaultOpen: true,
    placement: 'bottom',
    text: 'Costs are converted at the rate on the invoice date. Rows without a rate show the original currency.',
  },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const target = within(canvasElement).getByRole('button', { name: 'Sync status' });
    const body = tooltipOf(target).querySelector<HTMLElement>('[data-tooltip-body]')!;
    const box = body.getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(256);
    await expect(box.height).toBeGreaterThan(28);
  },
};

/* ── Behaviour ──────────────────────────────────────────────────────────── */

/**
 * Keyboard focus opens it at once; Escape closes it and leaves focus on the target; focus
 * leaving closes it. Closed, it is still the target's description.
 */
export const KeyboardFocus: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Tooltip text="Downloads the filtered rows as CSV">
        <Button variant="outlined">Export</Button>
      </Tooltip>
      <Button variant="text">After the tooltip</Button>
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByRole('button', { name: 'Export' });
    const after = canvas.getByRole('button', { name: 'After the tooltip' });
    await expect(isOpen(target)).toBe(false);
    await expect(target).toHaveAccessibleDescription('Downloads the filtered rows as CSV');

    // Tab in: open at once.
    await userEvent.tab();
    await expect(target).toHaveFocus();
    await waitFor(() => expect(isOpen(target)).toBe(true));
    await expect(tooltipOf(target)).toBeVisible();

    // Escape: closed, focus stays on the target.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(isOpen(target)).toBe(false));
    await expect(target).toHaveFocus();

    // Away and back: open again. Away (blur): closed.
    await userEvent.tab();
    await expect(after).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(target).toHaveFocus();
    await waitFor(() => expect(isOpen(target)).toBe(true));
    await userEvent.tab();
    await expect(after).toHaveFocus();
    await waitFor(() => expect(isOpen(target)).toBe(false));
  },
};

/**
 * Hover opens it after a short pause. The pointer can move onto the tooltip and it stays open;
 * Escape closes it while hovered; leaving closes it.
 */
export const Hover: Story = {
  render: () => (
    <Tooltip text="Updated nightly at 02:00" placement="bottom">
      <IconButton icon="info" label="About sync status" />
    </Tooltip>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const target = within(canvasElement).getByRole('button', { name: 'About sync status' });
    await expect(target).toHaveAccessibleDescription('Updated nightly at 02:00');

    await userEvent.hover(target);
    // Not on contact: it waits for a pause.
    await expect(isOpen(target)).toBe(false);
    await waitFor(() => expect(isOpen(target)).toBe(true));

    // Onto the tooltip: still open.
    await userEvent.hover(tooltipOf(target));
    await expect(isOpen(target)).toBe(true);

    // Escape while hovered: closed.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(isOpen(target)).toBe(false));

    // Leave and come back: open again. Leave: closed.
    await userEvent.unhover(target);
    await userEvent.hover(target);
    await waitFor(() => expect(isOpen(target)).toBe(true));
    await userEvent.unhover(target);
    await waitFor(() => expect(isOpen(target)).toBe(false));
  },
};

/* ── At the viewport's edges ───────────────────────────────────────────────
   One target in each corner, each asking for its default side. A tooltip with no
   room flips; one that would leave the viewport at the side is nudged back in,
   4px from the edge, with its arrow still on the target. */

const CORNERS = [
  { name: 'Top left', at: 'top-4 left-4', asked: 'top', placement: 'bottom' },
  { name: 'Top right', at: 'top-4 right-4', asked: 'top', placement: 'bottom' },
  { name: 'Bottom left', at: 'bottom-4 left-4', asked: 'bottom', placement: 'top' },
  { name: 'Bottom right', at: 'bottom-4 right-4', asked: 'bottom', placement: 'top' },
] as const;

export const Edges: Story = {
  render: () => (
    <>
      {CORNERS.map(({ name, at, asked }) => (
        <Tooltip key={name} className={`fixed ${at}`} placement={asked} defaultOpen text="Downloads the filtered rows as CSV">
          <IconButton icon="download-simple" label={`Export, ${name.toLowerCase()}`} data-corner={name} />
        </Tooltip>
      ))}
    </>
  ),
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  // Fixed to the viewport's corners: on the docs page they'd cover other stories.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    for (const { name, placement } of CORNERS) {
      const target = canvasElement.querySelector<HTMLElement>(`[data-corner="${name}"]`)!;
      const tip = tooltipOf(target);
      await expect(tip).toHaveAttribute('data-placement', placement);
      const body = tip.querySelector<HTMLElement>('[data-tooltip-body]')!.getBoundingClientRect();
      await expect(body.left).toBeGreaterThanOrEqual(3.5);
      await expect(body.right).toBeLessThanOrEqual(width - 3.5);
      await expect(body.top).toBeGreaterThanOrEqual(0);
      await expect(body.bottom).toBeLessThanOrEqual(height);
      const a = tip.querySelector('svg')!.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      await expect(a.left + a.width / 2).toBeCloseTo(t.left + t.width / 2, 0);
    }
  },
};
