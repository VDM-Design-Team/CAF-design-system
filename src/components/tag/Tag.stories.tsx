import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Tag, TAG_STATUSES } from './Tag';

const meta = {
  title: 'Components/Tag',
  component: Tag,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Tags** (`Tag`): the tonal status tag with an optional icon. ' +
          '`status` is Figma’s Status: `pending` (default), `active`, `completed`, `error`, `warning`, `info` or `neutral`; ' +
          'it sets the colours and the icon. `showIcon` is Show Icon (default true). The label is `children`. ' +
          'For the filled pill in the Costs tables, use StatusPill.',
      },
    },
  },
  args: { children: 'Pending' },
  argTypes: { status: { control: 'select', options: TAG_STATUSES } },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** How the CAF screens use it: their own labels, mostly without the icon. */
export const OnTheScreens: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Tag status="completed">Completed</Tag>
      <Tag status="error">Failed</Tag>
      <Tag status="error" showIcon={false}>
        Deleted
      </Tag>
      <Tag status="completed" showIcon={false}>
        Updated
      </Tag>
      <Tag status="info" showIcon={false}>
        Excel
      </Tag>
      <Tag status="info" showIcon={false}>
        v2.5.6
      </Tag>
    </div>
  ),
  parameters: { controls: { disable: true } },
};

/* ── Every Status × Show Icon, in Light and Dark ───────────────────────────
   The Figma component set, with and without the icon. Each tag is checked
   against the variables its Figma layers are bound to. */

/* Figma's bindings per Status: the tonal [fill, content] pair. Label and icon share the content colour. */
const BOUND = {
  pending: ['accent-pending-tonal-surface-default', 'accent-pending-tonal-content-default'],
  active: ['accent-info-tonal-surface-default', 'accent-info-tonal-content-default'],
  completed: ['accent-success-tonal-surface-default', 'accent-success-tonal-content-default'],
  error: ['accent-critical-tonal-surface-default', 'accent-critical-tonal-content-default'],
  warning: ['accent-warning-tonal-surface-default', 'accent-warning-tonal-content-default'],
  info: ['accent-info-tonal-surface-default', 'accent-info-tonal-content-default'],
  neutral: ['neutral-tonal-surface-default', 'neutral-tonal-content-default'],
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

const label = (status: string) => status[0].toUpperCase() + status.slice(1);

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Statuses — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <table className="border-separate border-spacing-x-4 border-spacing-y-2 text-left">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Status
          </th>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Show Icon
          </th>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            No icon
          </th>
        </tr>
      </thead>
      <tbody>
        {TAG_STATUSES.map((status) => (
          <tr key={status}>
            <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
              {label(status)}
            </th>
            <td>
              <Tag status={status} data-status={status}>
                {label(status)}
              </Tag>
            </td>
            <td>
              <Tag status={status} showIcon={false} data-status={status}>
                {label(status)}
              </Tag>
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
      Object.entries(BOUND).map(([status, [fill, content]]) => [status, [tokenColour(fill), tokenColour(content)]]),
    );
    await waitFor(() => {
      for (const el of canvasElement.querySelectorAll<HTMLElement>('[data-status]')) {
        const [fill, content] = want[el.dataset.status!];
        expect(getComputedStyle(el).backgroundColor).toBe(fill);
        expect(getComputedStyle(el).color).toBe(content);
        const icon = el.querySelector('svg');
        if (icon) expect(getComputedStyle(icon).color).toBe(content);
      }
    });
  },
});

export const StatusesLight = grid('light');
export const StatusesDark = grid('dark');
