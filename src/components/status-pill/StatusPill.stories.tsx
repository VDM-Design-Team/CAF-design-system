import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { StatusPill, STATUS_PILL_STATUSES } from './StatusPill';

const meta = {
  title: 'Components/StatusPill',
  component: StatusPill,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Tags** (`Status Pill`): the filled pill in the Costs and Recurring Costs tables. ' +
          '`status` is Figma’s Status: `pending` (default) or `active`. Label is `children`. ' +
          'It is plain text with no states. For a tonal tag with an icon, use Tag.',
      },
    },
  },
  args: { children: 'Pending' },
  argTypes: { status: { control: 'radio', options: STATUS_PILL_STATUSES } },
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Active: Story = { args: { status: 'active', children: 'Active' } };

/* ── Every Status, in Light and Dark ───────────────────────────────────────
   Figma's Status × the labels the CAF screens use. Each pill is checked
   against the variables its Figma layers are bound to. */

const ROWS = [
  { status: 'pending', label: 'Pending' },
  { status: 'pending', label: 'Recurring' },
  { status: 'active', label: 'Active' },
] as const;

/* Figma's bindings: [fill, label]. Pending's label is bound to accent.warning, not accent.pending. */
const BOUND = {
  pending: ['accent-pending-filled-surface-default', 'accent-warning-filled-content-default'],
  active: ['action-primary-surface-default', 'action-primary-content-default'],
} as const;

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
  name: `Statuses — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <table className="border-separate border-spacing-4 text-left">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Status
          </th>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Pill
          </th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map(({ status, label }) => (
          <tr key={label}>
            <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
              {status === 'pending' ? 'Pending' : 'Active'}
            </th>
            <td>
              <StatusPill status={status} data-status={status}>
                {label}
              </StatusPill>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = Object.fromEntries(
      Object.entries(BOUND).map(([status, [fill, label]]) => [status, [tokenColour(fill), tokenColour(label)]]),
    );
    await waitFor(() => {
      for (const pill of canvasElement.querySelectorAll<HTMLElement>('[data-status]')) {
        const [fill, label] = want[pill.dataset.status!];
        const style = getComputedStyle(pill);
        expect(style.backgroundColor).toBe(fill);
        expect(style.color).toBe(label);
      }
    });
  },
});

export const StatusesLight = grid('light');
export const StatusesDark = grid('dark');
