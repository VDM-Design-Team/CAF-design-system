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
          'The tonal pill for a row’s status in the Costs, Recurring Costs and Announcements tables. ' +
          '`status`: `pending` (default), `active`, `approved` (“To be paid”), `paid`, `rejected`, `stopped`, `inactive`, ' +
          '`payment-rejected` (outlined) or `waiting` (solid). Label is `children`. ' +
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
   Every status × the labels the CAF screens use. Each pill is checked
   against its semantic pair. */

const ROWS = [
  { status: 'pending', label: 'Pending' },
  { status: 'pending', label: 'Recurring' },
  { status: 'active', label: 'Active' },
  { status: 'approved', label: 'To be paid' },
  { status: 'paid', label: 'Paid' },
  { status: 'rejected', label: 'Rejected' },
  { status: 'stopped', label: 'Stopped' },
  { status: 'inactive', label: 'Inactive' },
  { status: 'payment-rejected', label: 'Payment rejected' },
  { status: 'waiting', label: 'Waiting on you' },
  { status: 'waiting', label: 'New' },
] as const;

/* Each status's pair: [fill, label, border or null]. */
const BOUND = {
  pending: ['accent-pending-tonal-surface-default', 'accent-pending-tonal-content-default', null],
  active: ['accent-success-tonal-surface-default', 'accent-success-tonal-content-default', null],
  approved: ['accent-info-tonal-surface-default', 'accent-info-tonal-content-default', null],
  paid: ['accent-success-tonal-surface-default', 'accent-success-tonal-content-default', null],
  rejected: ['accent-critical-tonal-surface-default', 'accent-critical-tonal-content-default', null],
  stopped: ['neutral-tonal-surface-default', 'neutral-tonal-content-default', null],
  inactive: ['neutral-tonal-surface-default', 'neutral-tonal-content-default', null],
  'payment-rejected': [
    'accent-critical-soft-outline-surface-default',
    'accent-critical-soft-outline-content-default',
    'accent-critical-soft-outline-border-default',
  ],
  waiting: ['neutral-inverted-surface-default', 'neutral-inverted-content-default', null],
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
              {status[0].toUpperCase() + status.slice(1)}
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
      Object.entries(BOUND).map(([status, [fill, label, border]]) => [
        status,
        [tokenColour(fill), tokenColour(label), border && tokenColour(border)],
      ]),
    );
    await waitFor(() => {
      for (const pill of canvasElement.querySelectorAll<HTMLElement>('[data-status]')) {
        const [fill, label, border] = want[pill.dataset.status!];
        const style = getComputedStyle(pill);
        expect(style.backgroundColor).toBe(fill);
        expect(style.color).toBe(label);
        // The outline is an inset ring: a box-shadow in the border colour.
        if (border) expect(style.boxShadow).toContain(border);
      }
    });
  },
});

export const StatusesLight = grid('light');
export const StatusesDark = grid('dark');
