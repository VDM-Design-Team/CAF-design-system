import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
          'the trigger if it was inside. It is non-modal and has no portal, so a parent that clips overflow clips it too.',
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
   Menu / Dropdown's bindings: surface.neutral.faint fill, 1px inside
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

const surface = (theme: 'light' | 'dark'): Story => ({
  name: `Surface — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { defaultOpen: true },
  render: (args) => (
    <div className="pb-24">
      <Popover {...args} />
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-neutral-faint'),
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
    // Below the trigger, 4px away, flush with its left edge.
    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    await expect(p.top - t.bottom).toBeCloseTo(4, 1);
    await expect(p.left).toBeCloseTo(t.left, 1);
    await expect(panel).toHaveAttribute('data-placement', 'bottom');
    await expect(panel).toHaveAttribute('data-align', 'left');
  },
});

export const SurfaceLight = surface('light');
export const SurfaceDark = surface('dark');

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
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    for (const { name, placement, align } of CORNERS) {
      const wrapper = canvasElement.querySelector<HTMLElement>(`[data-corner="${name}"]`)!;
      const panel = wrapper.querySelector<HTMLElement>('[data-placement]')!;
      await expect(panel).toHaveAttribute('data-placement', placement);
      await expect(panel).toHaveAttribute('data-align', align);
      const box = panel.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(0);
      await expect(box.top).toBeGreaterThanOrEqual(0);
      await expect(box.right).toBeLessThanOrEqual(width);
      await expect(box.bottom).toBeLessThanOrEqual(height);
    }
  },
};
