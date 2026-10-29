import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { PaginationItem } from './PaginationItem';

const meta = {
  title: 'Components/PaginationItem',
  component: PaginationItem,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Pagination** (`Pagination / Item`): one page number or a ‹ / › arrow. ' +
          'Figma’s State: Selected is `selected` (the current page, `aria-current="page"`); Disabled is `disabled`. ' +
          'Page is `children`. Use it through Pagination, which also draws the … gap.',
      },
    },
  },
  args: { children: '2', 'aria-label': 'Page 2', onClick: fn() },
} satisfies Meta<typeof PaginationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Page 2' }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/* ── Every State, in Light and Dark ────────────────────────────────────────
   Figma's three states, each checked against the variables its layers are
   bound to: the label colour and, for Selected, the fill. */

const STATES = [
  { state: 'Default', label: '2', name: 'Page 2', props: {}, bound: { text: 'text-primary', fill: null } },
  { state: 'Selected', label: '1', name: 'Page 1', props: { selected: true }, bound: { text: 'action-primary-content-default', fill: 'action-primary-surface-default' } },
  { state: 'Disabled', label: '‹', name: 'Previous page', props: { disabled: true }, bound: { text: 'text-disabled', fill: null } },
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
    <div className="flex items-end gap-6">
      {STATES.map(({ state, label, name, props }) => (
        <div key={state} className="flex flex-col items-center gap-2">
          <span className="text-caption-md-medium text-text-secondary">{state}</span>
          {/* The name includes the visible number, as Pagination's do (axe: label-content-name-mismatch). */}
          <PaginationItem {...props} aria-label={name} data-state={state}>
            {label}
          </PaginationItem>
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
    }));
    await waitFor(() => {
      for (const { state, text, fill } of want) {
        const item = canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
        expect(getComputedStyle(item).color).toBe(text);
        expect(getComputedStyle(item).backgroundColor).toBe(fill);
        expect(item.getBoundingClientRect().width).toBe(32);
      }
    });
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
