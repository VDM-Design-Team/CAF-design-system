import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Icon } from '../icon';
import { TableHeaderCell } from '../table-header-cell';
import { EmptyState } from './EmptyState';

/* Figma's action: a Normal, Style=Default Button with the Plus icon. */
const createCost = <Button leftIcon={<Icon name="plus" />}>Create Cost</Button>;

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Feedback** (`Empty State`): what a list or a page shows when it has ' +
          'nothing to show. `size` is Figma’s Size: `default` (page level: icon tile, `title`, `description` and an ' +
          'optional `action`) or `compact` (inside a table body: a small icon and the `title`). `action` is Show Action: ' +
          'pass the `Button` to show, or leave it out. It centres itself in the space it is given.',
      },
    },
  },
  args: {
    title: 'No items found',
    description: 'Try changing your filters or create a new item.',
    action: createCost,
  },
  argTypes: { action: { control: false } },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/* ── Every Size × Show Action, in Light and Dark ───────────────────────────
   Figma's variants with its default text. Each part is checked against the
   variable and text style its Figma layer is bound to. */

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

const VARIANTS = [
  { name: 'Default', id: 'default' },
  { name: 'Default, no action', id: 'default-no-action' },
  { name: 'Compact', id: 'compact' },
] as const;

const sizes = (theme: 'light' | 'dark'): Story => ({
  name: `Sizes — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map(({ name, id }) => (
        <section key={id} aria-label={name} className="flex flex-col gap-2">
          <p className="text-caption-md-medium text-text-secondary">{name}</p>
          <div className="w-128 rounded-8 border border-dashed border-stroke-subtle">
            {id === 'compact' ? (
              <EmptyState size="compact" title="No items found" data-variant={id} />
            ) : (
              <EmptyState
                title="No items found"
                description="Try changing your filters or create a new item."
                action={id === 'default' ? createCost : undefined}
                data-variant={id}
              />
            )}
          </div>
        </section>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      primary: tokenColour('text-primary'),
      subtle: tokenColour('text-subtle'),
      base: tokenColour('surface-base'),
    };
    const part = (id: string) => {
      const root = canvasElement.querySelector<HTMLElement>(`[data-variant="${id}"]`)!;
      const [tile, title, description] = [...root.children] as HTMLElement[];
      return { root, tile, icon: tile.querySelector('svg')!, title, description };
    };
    await waitFor(() => {
      // Size=Default: 48 / 24 padding, 12px gap; a 64px surface.base tile with a 32px Tray in text.subtle;
      // the title in Body/md-semibold, text.primary; the description in Body/sm-regular, text.subtle.
      for (const id of ['default', 'default-no-action'] as const) {
        const { root, tile, icon, title, description } = part(id);
        const style = getComputedStyle(root);
        expect([style.paddingTop, style.paddingRight, style.rowGap]).toEqual(['48px', '24px', '12px']);
        expect(tile.getBoundingClientRect().width).toBe(64);
        expect(getComputedStyle(tile).backgroundColor).toBe(want.base);
        expect(icon.getBoundingClientRect().width).toBe(32);
        expect(getComputedStyle(icon).color).toBe(want.subtle);
        expect(getComputedStyle(title).color).toBe(want.primary);
        expect([getComputedStyle(title).fontSize, getComputedStyle(title).fontWeight]).toEqual(['16px', '600']);
        expect(getComputedStyle(description).color).toBe(want.subtle);
        expect([getComputedStyle(description).fontSize, getComputedStyle(description).fontWeight]).toEqual(['14px', '400']);
      }
      // Show Action: the Button, or nothing.
      expect(within(part('default').root).getByRole('button', { name: 'Create Cost' })).toBeVisible();
      expect(part('default-no-action').root.querySelector('button')).toBeNull();
      // Size=Compact: 24px padding, 6px gap; a 20px Tray and the title in Body/sm-regular, text.subtle; nothing else.
      const compact = part('compact');
      const style = getComputedStyle(compact.root);
      expect([style.paddingTop, style.paddingRight, style.rowGap]).toEqual(['24px', '24px', '6px']);
      expect(compact.tile.getBoundingClientRect().width).toBe(24);
      expect(getComputedStyle(compact.tile).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(compact.icon.getBoundingClientRect().width).toBe(20);
      expect(getComputedStyle(compact.icon).color).toBe(want.subtle);
      expect(getComputedStyle(compact.title).color).toBe(want.subtle);
      expect([getComputedStyle(compact.title).fontSize, getComputedStyle(compact.title).fontWeight]).toEqual(['14px', '400']);
      expect(compact.root.children).toHaveLength(2);
    });
  },
});

export const SizesLight = sizes('light');
export const SizesDark = sizes('dark');

/* ── On the screens ────────────────────────────────────────────────────────
   Figma's pattern 11. "Nothing here yet": the Announcements table has no
   records, so its body is one cell across every column holding the Default
   Empty State and the primary action. Compact sits in a smaller table body.
   "Page not found": a 404 with a way back. */

function EmptyTable({ caption, head, children }: { caption: string; head: string[]; children: ReactNode }) {
  return (
    <table className="w-full border-collapse">
      <caption className="pb-2 text-left text-caption-md-medium text-text-secondary">{caption}</caption>
      <thead>
        <tr className="border-b border-stroke-subtle">
          {head.map((h) => (
            <TableHeaderCell key={h} className="px-4">
              {h}
            </TableHeaderCell>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={head.length}>{children}</td>
        </tr>
      </tbody>
    </table>
  );
}

/* The Announcements table's Add New: a spy, so the play test can check the click. */
const onAddNew = fn();

export const InATable: Story = {
  name: 'In a table',
  render: () => (
    <div className="flex w-240 flex-col gap-10">
      <EmptyTable caption="Announcements" head={['Title', 'Version', 'Target Audience', 'Status']}>
        <div className="py-12">
          <EmptyState
            title="No announcements yet"
            description="Create an announcement to tell users what’s new."
            action={
              <Button leftIcon={<Icon name="plus" />} onClick={onAddNew}>
                Add New
              </Button>
            }
          />
        </div>
      </EmptyTable>
      <EmptyTable caption="Payment schedules" head={['Due Date', 'Amount', 'Status']}>
        <EmptyState size="compact" title="No items found" />
      </EmptyTable>
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [announcements, schedules] = canvas.getAllByRole('table');
    // The empty state spans the table and centres itself in it.
    const empty = within(announcements).getByText('No announcements yet').parentElement!;
    const table = announcements.getBoundingClientRect();
    const box = empty.getBoundingClientRect();
    await expect(Math.abs(box.left - table.left - (table.right - box.right))).toBeLessThan(1);
    await expect(within(schedules).getByText('No items found')).toBeVisible();
    // The action is a real Button.
    onAddNew.mockClear();
    await userEvent.click(within(announcements).getByRole('button', { name: 'Add New' }));
    await expect(onAddNew).toHaveBeenCalledOnce();
  },
};

export const PageNotFound: Story = {
  name: 'Page not found',
  render: () => (
    <div className="flex w-200 flex-col items-center gap-4 py-16">
      <p className="text-display-xl-bold text-text-brand-medium">404</p>
      <EmptyState
        title="The page you were looking for cannot be found."
        description="It’s likely an incorrect or outdated link."
        action={<Button>Go back home</Button>}
      />
    </div>
  ),
  parameters: { controls: { disable: true } },
};
