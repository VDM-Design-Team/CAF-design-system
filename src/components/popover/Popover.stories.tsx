import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Popover, POPOVER_ALIGNS, POPOVER_PLACEMENTS } from './Popover';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    docs: {
      description: {
        component:
          'Code only: the CAF Figma library has no Popover. It is the floating panel that MenuDropdown, Select and the ' +
          'Date picker are built on, with **Menu / Dropdown**’s surface (fill, 1px inside stroke, radius 8, Elevation 3, ' +
          'padding 6). It opens below the trigger, 4px away, flush with its left or right edge (`placement`, `align`), and ' +
          'flips when the viewport has no room. A click outside, Escape or focus leaving closes it; focus goes back to ' +
          'the trigger if it was inside. It is non-modal. By default it has no portal, so a parent that clips overflow ' +
          'clips it too; `portal` renders the panel on `<body>` instead, fixed at the trigger (RowActionsMenu does, so ' +
          'row menus open outside a table’s scroll region). A portalled panel is found with `screen`.',
      },
    },
  },
  args: {
    trigger: <Button>Show details</Button>,
    children: <p className="max-w-64 text-body-sm-regular">Submitted on 8 Oct 2026 by the finance team.</p>,
  },
  argTypes: {
    placement: { control: 'radio', options: POPOVER_PLACEMENTS },
    align: { control: 'radio', options: POPOVER_ALIGNS },
    trigger: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click to open; Escape closes and hands focus back; a click outside closes and leaves focus where it lands. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Show details' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    await expect(panel).toHaveTextContent('Submitted on 8 Oct 2026');

    // Escape closes, and focus (inside, on the trigger) stays on the trigger.
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-controls');
    await expect(trigger).toHaveFocus();

    // A click inside the panel keeps it open; a click outside closes it.
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByText(/Submitted on/));
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(document.body);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveFocus();
  },
};

/** Opened with the keyboard: Enter on the trigger, then Tab out of it closes it. */
export const KeyboardAndFocus: Story = {
  render: (args) => (
    <div className="flex items-start gap-4">
      <Popover {...args} autoFocus trigger={<Button>Edit note</Button>}>
        <div className="flex items-center gap-2">
          <Button size="small" variant="outlined">
            Cancel
          </Button>
          <Button size="small">Save</Button>
        </div>
      </Popover>
      <Button variant="outlined">After the popover</Button>
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Edit note' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    // autoFocus: the first control inside takes focus.
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    // Escape from inside hands focus back to the trigger.
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
    // Focus leaving closes it, and isn't pulled back.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await userEvent.tab(); // Save, still inside
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.tab(); // out
    await expect(canvas.getByRole('button', { name: 'After the popover' })).toHaveFocus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/* ── The surface, in Light and Dark ────────────────────────────────────────
   Menu / Dropdown's bindings: surface.elevated fill, 1px inside
   stroke.subtle, radius 8, Elevation 3, padding 6. Checked against the tokens. */

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
/* The box-shadow that utility classes compose to. Tailwind inlines a theme shadow into its
   utility, so `shadow-elevation-3` is GDL's Light Elevation 3 in both themes (docs/figma-sync.md,
   "Popover"): compare against the utilities, not the `--shadow-*` variable. */
function utilityShadow(className: string) {
  const probe = document.createElement('div');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).boxShadow;
  probe.remove();
  return value;
}

const surface = (theme: 'light' | 'dark', portal = false): Story => ({
  name: `Surface${portal ? ', portal' : ''} — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { defaultOpen: true, portal },
  render: (args) => (
    <div className="pb-24">
      <Popover {...args} />
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' || portal ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-elevated'),
      stroke: tokenColour('stroke-subtle'),
      text: tokenColour('text-primary'),
      shadow: utilityShadow('shadow-elevation-3 inset-ring inset-ring-stroke-subtle'),
    };
    const trigger = within(canvasElement).getByRole('button', { name: 'Show details' });
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    const style = getComputedStyle(panel);
    await expect(style.backgroundColor).toBe(want.fill);
    // 1px inside stroke.subtle (an inset ring), with Elevation 3 and nothing else.
    await expect(style.boxShadow).toContain(`${want.stroke} 0px 0px 0px 1px inset`);
    await expect(style.boxShadow).toBe(want.shadow);
    await expect(style.borderRadius).toBe('8px');
    await expect(style.padding).toBe('6px');
    await expect(style.color).toBe(want.text);
    // Below the trigger, 4px away, flush with its left edge (in a waitFor: a portalled panel
    // catches up with a trigger that moved within a frame; no DOM writes inside).
    await waitFor(() => {
      const current = within(canvasElement).getByRole('button', { name: 'Show details' });
      const t = current.getBoundingClientRect();
      const p = document.getElementById(current.getAttribute('aria-controls')!)!.getBoundingClientRect();
      expect(p.top - t.bottom).toBeCloseTo(4, 1);
      expect(p.left).toBeCloseTo(t.left, 1);
    });
    await expect(panel).toHaveAttribute('data-placement', 'bottom');
    await expect(panel).toHaveAttribute('data-align', 'left');
    // Inline in the trigger's wrapper, or (`portal`) on <body>, fixed: the same surface and place either way.
    await expect(panel.parentElement === document.body).toBe(portal);
    await expect(style.position).toBe(portal ? 'fixed' : 'absolute');
  },
});

export const SurfaceLight = surface('light');
export const SurfaceDark = surface('dark');
export const SurfacePortalLight = surface('light', true);
export const SurfacePortalDark = surface('dark', true);

/* ── portal: in a container that scrolls ───────────────────────────────────
   The trigger sits in a box that scrolls sideways, as a ••• does in a
   TableList's scroll region. A box that scrolls clips what is inside it, so
   the default panel would be cut off at the box's bottom edge. With `portal`
   the panel opens on <body>, fixed at the trigger: over the box's edge, still
   wired to the trigger, and it follows the trigger when the box scrolls. */
export const Portal: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-4 pb-48">
      <div data-testid="box" className="w-80 overflow-x-auto rounded-8 inset-ring inset-ring-stroke-subtle">
        <div className="flex w-max items-center gap-4 p-3">
          <Popover {...args} portal trigger={<Button size="small">Show details</Button>}>
            <div className="flex w-64 flex-col items-start gap-2">
              <p className="text-body-sm-regular">Submitted on 8 Oct 2026 by the finance team.</p>
              <Button size="small" variant="outlined">
                Copy link
              </Button>
            </div>
          </Popover>
          <span className="text-body-sm-regular text-text-secondary">Invoice 4521 · USD 5130.37 · Pending · Credit card</span>
        </div>
      </div>
      <Button variant="outlined">After the box</Button>
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId('box');
    const trigger = canvas.getByRole('button', { name: 'Show details' });
    const after = canvas.getByRole('button', { name: 'After the box' });

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    // On <body>, not in the box; fixed, above the page.
    await expect(canvasElement.contains(panel)).toBe(false);
    await expect(panel.parentElement).toBe(document.body);
    await expect(getComputedStyle(panel).position).toBe('fixed');
    await expect(getComputedStyle(panel).zIndex).toBe('50');
    // Where the inline panel would be: 4px under the trigger, flush with its left edge…
    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    await expect(p.top - t.bottom).toBeCloseTo(4, 1);
    await expect(p.left).toBeCloseTo(t.left, 1);
    // …past the box's bottom edge, and all of it shows.
    await expect(p.bottom).toBeGreaterThan(box.getBoundingClientRect().bottom);
    const copy = within(panel).getByRole('button', { name: 'Copy link' }).getBoundingClientRect();
    await expect(panel.contains(document.elementFromPoint(copy.left + 4, copy.top + copy.height / 2))).toBe(true);

    // It follows the trigger when the box scrolls.
    box.scrollLeft = 40;
    await waitFor(() => expect(box.scrollLeft).toBe(40));
    await waitFor(() => expect(panel.getBoundingClientRect().left).toBeCloseTo(trigger.getBoundingClientRect().left, 1));
    box.scrollLeft = 0;
    await waitFor(() => expect(panel.getBoundingClientRect().left).toBeCloseTo(trigger.getBoundingClientRect().left, 1));
    // And through a layout shift with no scroll or size change (a transform moves the trigger).
    box.style.transform = 'translateY(24px)';
    await waitFor(() => expect(panel.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom).toBeCloseTo(4, 1));
    box.style.transform = '';
    await waitFor(() => expect(panel.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom).toBeCloseTo(4, 1));

    // A click inside keeps it open; Tab goes from the trigger into the panel, as inline.
    await userEvent.click(within(panel).getByText(/Submitted on/));
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    trigger.focus();
    await userEvent.tab();
    await expect(within(panel).getByRole('button', { name: 'Copy link' })).toHaveFocus();
    // Shift+Tab from its first control goes back to the trigger, and it stays open.
    await userEvent.tab({ shift: true });
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Tab past its last control goes on to what follows the trigger, and closes it.
    await userEvent.tab();
    await userEvent.tab();
    await expect(after).toHaveFocus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(document.getElementById(panel.id)).toBeNull();

    // Escape from inside closes it and hands focus back to the trigger.
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.tab();
    await expect(screen.getByRole('button', { name: 'Copy link' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();

    // A click outside closes it and leaves focus where it lands.
    await userEvent.click(trigger);
    await userEvent.click(document.body);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(screen.queryByText(/Submitted on/)).toBeNull();
  },
};

/* ── Flipping at the viewport's edges ──────────────────────────────────────
   Four popovers asked for bottom-left, one in each corner of the viewport.
   Each flips to the side with room and stays on screen. */

const CORNERS = [
  { name: 'Top left', at: 'top-4 left-4', placement: 'bottom', align: 'left' },
  { name: 'Top right', at: 'top-4 right-4', placement: 'bottom', align: 'right' },
  { name: 'Bottom left', at: 'bottom-4 left-4', placement: 'top', align: 'left' },
  { name: 'Bottom right', at: 'bottom-4 right-4', placement: 'top', align: 'right' },
] as const;

export const Flip: Story = {
  render: () => (
    <>
      {CORNERS.map(({ name, at }) => (
        <Popover key={name} className={`fixed ${at}`} defaultOpen data-corner={name} trigger={<Button size="small">{name}</Button>}>
          <p className="w-64 text-body-sm-regular">
            Asked for below and flush left. It flips to the side of the trigger with room.
          </p>
        </Popover>
      ))}
    </>
  ),
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  // Fixed to the viewport's corners: on the docs page they'd cover other stories.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    // In a waitFor, looked up afresh: when stories are switched, the frame can still be settling its
    // size as the panels first measure, and they re-place on the resize that follows. No DOM writes inside.
    for (const { name, placement, align } of CORNERS) {
      await waitFor(() => {
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;
        const wrapper = canvasElement.querySelector<HTMLElement>(`[data-corner="${name}"]`)!;
        const panel = wrapper.querySelector<HTMLElement>('[data-placement]')!;
        expect(panel).toHaveAttribute('data-placement', placement);
        expect(panel).toHaveAttribute('data-align', align);
        const box = panel.getBoundingClientRect();
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
        expect(box.bottom).toBeLessThanOrEqual(height);
      });
    }
  },
};
