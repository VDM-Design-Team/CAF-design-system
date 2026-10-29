import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { DatePickerDay } from './DatePickerDay';

const meta = {
  title: 'Components/DatePickerDay',
  component: DatePickerDay,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Date Picker / Day`): one 36×36 day in a calendar. ' +
          'Figma’s State: Today is `today` (a `stroke.focused` ring, `aria-current="date"`), Selected is `selected`, ' +
          'In Range is `inRange`, Outside Month is `outsideMonth` (inactive, so `disabled`). Day is `children`. ' +
          'Use it through Calendar or RangeCalendar.',
      },
    },
  },
  args: { children: '12', onClick: fn() },
} satisfies Meta<typeof DatePickerDay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '12' }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/* ── Every State, in Light and Dark ────────────────────────────────────────
   Figma's five states on the calendar's surface (surface.neutral.faint), each
   checked against the variables its layers are bound to: the label colour,
   the fill and, for Today, the 1px inside stroke. */

const STATES = [
  { state: 'Default', props: {}, bound: { text: 'text-primary', fill: null, ring: null } },
  { state: 'Today', props: { today: true }, bound: { text: 'text-primary', fill: null, ring: 'stroke-focused' } },
  {
    state: 'Selected',
    props: { selected: true },
    bound: { text: 'action-primary-content-default', fill: 'action-primary-surface-default', ring: null },
  },
  { state: 'In Range', props: { inRange: true }, bound: { text: 'text-primary', fill: 'surface-base', ring: null } },
  { state: 'Outside Month', props: { outsideMonth: true }, bound: { text: 'text-disabled', fill: null, ring: null } },
] as const;

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

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex w-fit items-end gap-6 rounded-12 bg-surface-neutral-faint p-4">
      {STATES.map(({ state, props }) => (
        <div key={state} className="flex flex-col items-center gap-2">
          <span className="text-caption-md-medium text-text-secondary">{state}</span>
          <DatePickerDay {...props} data-state={state}>
            12
          </DatePickerDay>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = STATES.map(({ state, bound }) => ({
      state,
      text: tokenColour(bound.text),
      fill: bound.fill ? tokenColour(bound.fill) : 'rgba(0, 0, 0, 0)',
      ring: bound.ring ? `${tokenColour(bound.ring)} 0px 0px 0px 1px inset` : null,
    }));
    await waitFor(() => {
      for (const { state, text, fill, ring } of want) {
        const day = canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
        const style = getComputedStyle(day);
        expect(style.color).toBe(text);
        expect(style.backgroundColor).toBe(fill);
        if (ring) expect(style.boxShadow).toContain(ring);
        else expect(style.boxShadow).not.toContain('inset');
        expect(style.borderRadius).toBe('6px');
        const box = day.getBoundingClientRect();
        expect([box.width, box.height]).toEqual([36, 36]);
      }
    });
    const at = (state: string) => canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
    await expect(at('Today')).toHaveAttribute('aria-current', 'date');
    await expect(at('Outside Month')).toBeDisabled();
    await expect(at('Default')).toBeEnabled();
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
