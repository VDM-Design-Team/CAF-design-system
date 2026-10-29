import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MenuItem } from '../menu-item';
import { StatusPill } from '../status-pill';
import { TableCell } from '../table-cell';
import { TableHeaderCell } from '../table-header-cell';
import { TableRow } from '../table-row';
import { RowActionsMenu } from './RowActionsMenu';

/* The Costs list's row actions, from Figma's row actions pattern: most used first, Delete last in red. */
const ACTIONS = ['Approve', 'Reject', 'View invoices', 'Request adjustment'] as const;
const IDS = ['123456', '123457', '123458'] as const;

function CostsTable({ openOn }: { openOn?: string }) {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-4 pb-64">
      <p role="status" className="text-body-sm-regular text-text-secondary">
        {chosen ?? 'Nothing chosen yet'}
      </p>
      <table className="w-max border-collapse">
        <thead>
          <tr className="border-b border-stroke-subtle">
            {['Cost ID', 'Account', 'Amount', 'Status'].map((h) => (
              <TableHeaderCell key={h} className="px-4">
                {h}
              </TableHeaderCell>
            ))}
            <TableHeaderCell className="px-4">
              <span className="sr-only">Actions</span>
            </TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {IDS.map((id) => (
            <TableRow key={id} data-id={id}>
              <TableCell className="w-32">{id}</TableCell>
              <TableCell className="w-50" type="two-line" primary="Admin Account" secondary="admin1@geekee.com" />
              <TableCell className="w-32">USD 5130.37</TableCell>
              <TableCell className="w-32" type="tag">
                <StatusPill>Pending</StatusPill>
              </TableCell>
              <TableCell className="w-14" type="actions">
                <RowActionsMenu label={`Actions for cost ${id}`} defaultOpen={openOn === id}>
                  {ACTIONS.map((action) => (
                    <MenuItem key={action} onClick={() => setChosen(`${action}: cost ${id}`)}>
                      {action}
                    </MenuItem>
                  ))}
                  <MenuItem destructive onClick={() => setChosen(`Delete: cost ${id}`)}>
                    Delete
                  </MenuItem>
                </RowActionsMenu>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: 'Components/RowActionsMenu',
  component: RowActionsMenu,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Menus** (`Menu / Row Actions Button`): the ••• at the end of every ' +
          'table row, with the `Menu / Dropdown` it opens. The button is an IconButton (`dots-three`, Ghost, 32); the ' +
          'menu opens below it, flush with its right edge, as in Figma’s row actions pattern. Put it in a TableCell of ' +
          'type `actions`, with the row’s MenuItems as `children`. `label` names the button and its menu: “Row actions” ' +
          'by default; name the record when there are many rows.',
      },
    },
  },
  args: { children: <MenuItem>Approve</MenuItem> },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof RowActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On its own: “Row actions” and Figma’s Costs menu. */
export const Playground: Story = {
  render: (args) => (
    <div className="flex justify-end pb-64">
      <RowActionsMenu {...args}>
        {ACTIONS.map((action) => (
          <MenuItem key={action}>{action}</MenuItem>
        ))}
        <MenuItem destructive>Delete</MenuItem>
      </RowActionsMenu>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Row actions' }));
    await expect(canvas.getByRole('menu', { name: 'Row actions' })).toBeVisible();
  },
};

/** In a TableRow: click •••, pick an action; or open it from the keyboard. Focus returns to the row’s •••. */
export const InTableRow: Story = {
  render: () => <CostsTable />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Actions for cost 123456' });
    await userEvent.click(button);
    const menu = canvas.getByRole('menu', { name: 'Actions for cost 123456' });
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Approve' })).toHaveFocus());

    // Below the button, 4px away, flush with its right edge.
    const b = button.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    await expect(menu).toHaveAttribute('data-align', 'right');
    await expect(m.right).toBeCloseTo(b.right, 1);
    await expect(m.top - b.bottom).toBeCloseTo(4, 1);
    // It sits over the rows below it.
    const last = within(menu).getByRole('menuitem', { name: 'Delete' }).getBoundingClientRect();
    await expect(menu.contains(document.elementFromPoint(last.left + 8, last.top + last.height / 2))).toBe(true);

    await userEvent.click(within(menu).getByRole('menuitem', { name: 'View invoices' }));
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('View invoices: cost 123456');
    await expect(button).toHaveFocus();

    // The next row, from the keyboard: ↓ opens on the first item, End goes to Delete, Enter chooses it.
    const next = canvas.getByRole('button', { name: 'Actions for cost 123457' });
    next.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Approve' })).toHaveFocus());
    await userEvent.keyboard('{End}{Enter}');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('Delete: cost 123457');
    await expect(next).toHaveFocus();
  },
};

/* ── Open in a table, in Light and Dark ────────────────────────────────────
   The middle row's menu, open over the row below. */

/* A token's computed colour in the current theme. Measure before waitFor, never inside it. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

const open = (theme: 'light' | 'dark'): Story => ({
  name: `Open in a table — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => <CostsTable openOn="123457" />,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { fill: tokenColour('surface-neutral-faint'), glyph: tokenColour('text-secondary') };
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Actions for cost 123457' });
    const menu = canvas.getByRole('menu', { name: 'Actions for cost 123457' });
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(getComputedStyle(menu).backgroundColor).toBe(want.fill);
    // The ••• is Ghost: text.secondary.
    await expect(getComputedStyle(button.querySelector('svg')!).color).toBe(want.glyph);
    const b = button.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    await expect(m.right).toBeCloseTo(b.right, 1);
    await expect(m.top - b.bottom).toBeCloseTo(4, 1);
  },
});

export const OpenInTableLight = open('light');
export const OpenInTableDark = open('dark');
