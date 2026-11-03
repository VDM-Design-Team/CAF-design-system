import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { EmptyState } from '../empty-state';
import { MenuItem } from '../menu-item';
import { RowActionsMenu } from '../row-actions-menu';
import { TableCell } from '../table-cell';
import { TableHeaderCell } from '../table-header-cell';
import { TableHeaderRow } from '../table-header-row';
import { TableRow } from '../table-row';
import { TableList } from './TableList';

/* Figma's example (773:1468): the Cost Centers list. */
const COST_CENTERS = [
  { id: 'cc-1', name: 'Employee Expenses', service: 'Salary', location: 'Philippines' },
  { id: 'cc-2', name: 'Travel Expenses', service: 'Testing', location: 'Philippines' },
  { id: 'cc-3', name: 'IT Expenses', service: 'Software', location: 'United States' },
  { id: 'cc-4', name: 'Legal Expenses', service: 'Consulting', location: 'United Kingdom' },
];
const COLUMNS = ['Cost center', 'Nature of Service', 'Location'];

function CostCentersHeader({ showCheckbox = false }: { showCheckbox?: boolean }) {
  return (
    <TableHeaderRow showCheckbox={showCheckbox} checkboxProps={{ 'aria-label': 'Select all cost centers' }} showActions>
      {COLUMNS.map((label) => (
        <TableHeaderCell key={label}>{label}</TableHeaderCell>
      ))}
    </TableHeaderRow>
  );
}

function CostCenterRow({
  row,
  showCheckbox = false,
  selected = false,
}: {
  row: (typeof COST_CENTERS)[number];
  showCheckbox?: boolean;
  selected?: boolean;
}) {
  return (
    <TableRow data-id={row.id} selected={selected}>
      {showCheckbox && (
        <TableCell type="checkbox">
          <Checkbox aria-label={`Select ${row.name}, ${row.location}`} checked={selected} onChange={() => {}} />
        </TableCell>
      )}
      <TableCell>{row.name}</TableCell>
      <TableCell>{row.service}</TableCell>
      <TableCell>{row.location}</TableCell>
      <TableCell type="actions" className="w-1">
        <RowActionsMenu label={`Actions for ${row.name}, ${row.location}`}>
          <MenuItem>Edit</MenuItem>
          <MenuItem destructive>Delete</MenuItem>
        </RowActionsMenu>
      </TableCell>
    </TableRow>
  );
}

const meta = {
  title: 'Components/TableList',
  component: TableList,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / List`): the plain list table, a `TableHeaderRow` ' +
          '(`header`) over `TableRow`s (`children`, Figma’s Rows slot), with no fill and no outer border. It is a real ' +
          '`<table>` that takes its container’s width; name it with `aria-label`. An empty list puts one row in the slot ' +
          'with a TableCell `type="custom"` across every column, holding an EmptyState. On a narrow screen the table ' +
          'scrolls sideways in its own region, so the page doesn’t: while it can scroll, the region is a tab stop (the ' +
          'arrow keys scroll it) named like the table, with the focus ring. Row menus open outside it. Figma draws no ' +
          'phone layout; this follows the decision add-phone-table-layout.',
      },
    },
  },
  args: { 'aria-label': 'Cost centers', header: <CostCentersHeader /> },
  render: (args) => (
    <TableList {...args}>
      {COST_CENTERS.map((row) => (
        <CostCenterRow key={row.id} row={row} />
      ))}
    </TableList>
  ),
} satisfies Meta<typeof TableList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cost Centers: three columns and a ••• menu per row, as Figma's example. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Cost centers' });
    await expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual([...COLUMNS, 'Actions']);
    // It fits: the region round it is a plain <div>, no tab stop and no landmark.
    const region = table.parentElement!;
    await expect(region).toHaveAttribute('data-part', 'scroll-region');
    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
    await expect(region).not.toHaveAttribute('tabindex');
    await expect(region).not.toHaveAttribute('role');
    await expect(canvas.queryByRole('region')).toBeNull();
    // The row menu opens on <body> (RowActionsMenu's portal): find it with `screen`.
    await userEvent.click(within(table).getByRole('button', { name: 'Actions for IT Expenses, United States' }));
    await expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
  },
};

/* ── Look, in Light and Dark ───────────────────────────────────────────────
   No fill and no outer border; the header row's and the rows' 1px
   stroke.subtle lines; rows with no fill at rest and Table / Row's 16%
   action.primary tint when selected; the container's full width. */

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

/* The computed background of a utility class, for the 16% Selected tint. */
function utilityBackground(className: string) {
  const probe = document.createElement('div');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
}

const look = (theme: 'light' | 'dark'): Story => ({
  name: `Look — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-8 bg-surface-canvas p-6" data-testid="page">
      <TableList aria-label="Cost centers" header={<CostCentersHeader />}>
        {COST_CENTERS.map((row) => (
          <CostCenterRow key={row.id} row={row} />
        ))}
      </TableList>
      <TableList aria-label="Cost centers, selectable" header={<CostCentersHeader showCheckbox />}>
        {COST_CENTERS.map((row, i) => (
          <CostCenterRow key={row.id} row={row} showCheckbox selected={i === 1} />
        ))}
      </TableList>
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvas, canvasElement }) => {
    const want = {
      line: tokenColour('stroke-subtle'),
      selected: utilityBackground('bg-action-primary-surface-default/16'),
    };
    const page = canvas.getByTestId('page');
    await waitFor(() => {
      for (const name of ['Cost centers', 'Cost centers, selectable']) {
        const table = within(canvasElement).getByRole('table', { name }) as HTMLTableElement;
        const style = getComputedStyle(table);
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        // No outer border.
        expect([style.borderTopWidth, style.borderRightWidth, style.borderLeftWidth]).toEqual(['0px', '0px', '0px']);
        // The container's width (the page's content box).
        const inner = page.getBoundingClientRect().width - 2 * parseFloat(getComputedStyle(page).paddingLeft);
        expect(Math.abs(table.getBoundingClientRect().width - inner)).toBeLessThan(1);
        // One header row in the <thead>, the rows in the <tbody>, each with its 1px stroke.subtle line.
        expect(table.tHead!.rows).toHaveLength(1);
        expect(table.tBodies[0].rows).toHaveLength(COST_CENTERS.length);
        for (const tr of [...table.rows]) {
          expect(getComputedStyle(tr).borderBottomWidth).toBe('1px');
          expect(getComputedStyle(tr).borderBottomColor).toBe(want.line);
        }
        // No fill at rest; the selected row keeps Table / Row's 16% tint.
        [...table.tBodies[0].rows].forEach((tr) => {
          expect(getComputedStyle(tr).backgroundColor).toBe(
            tr.hasAttribute('data-selected') ? want.selected : 'rgba(0, 0, 0, 0)',
          );
        });
      }
      const selectable = within(canvasElement).getByRole('table', { name: 'Cost centers, selectable' });
      expect(selectable.querySelectorAll('tbody tr[data-selected]')).toHaveLength(1);
    });
  },
});

export const LookLight = look('light');
export const LookDark = look('dark');

/** No rows: one row with a Custom cell across every column, holding the compact Empty State. */
export const Empty: Story = {
  render: (args) => (
    <TableList {...args}>
      <TableRow>
        <TableCell type="custom" colSpan={COLUMNS.length + 1}>
          <EmptyState size="compact" title="No items." />
        </TableCell>
      </TableRow>
    </TableList>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Cost centers' });
    await expect(within(table).getByText('No items.')).toBeVisible();
    const cell = table.querySelector('tbody td')!;
    await expect(cell).toHaveAttribute('colspan', String(COLUMNS.length + 1));
    await expect(Math.abs(cell.getBoundingClientRect().width - table.getBoundingClientRect().width)).toBeLessThan(1);
  },
};

/* ── At a phone's width ─────────────────────────────────────────────────────
   Figma draws no phone layout. By the decision add-phone-table-layout the
   table scrolls sideways in its own region, and its row menus open outside
   it. The story frames a phone: 320 wide with AppShell's 16px gutters, so the
   table gets 288, at any viewport (Vitest and test:static's channel pass
   render wider than the mobile viewport asks for). */

/* Storybook's own "Small mobile" viewport (320 × 568). Chromatic ignores the
   global, so these stories also set chromatic.viewports (CLAUDE.md). */
const MOBILE = { value: 'mobile1', isRotated: false } as const;
const MOBILE_SNAPSHOT = { viewports: [320] };

/* The Cost Centers list with the columns the screens add: wider than 288. */
const WIDE_COLUMNS = [...COLUMNS, 'Created By', 'Date Created'];
const WIDE_ROWS = COST_CENTERS.slice(0, 3).map((row, i) => ({
  ...row,
  createdBy: ['Admin Account', 'QA Test', 'Admin Account'][i],
  created: ['8 Oct 2026', '12 Oct 2026', '20 Oct 2026'][i],
}));
const LAST = WIDE_ROWS[WIDE_ROWS.length - 1];
const lastLabel = `Actions for ${LAST.name}, ${LAST.location}`;

function PhoneTable() {
  return (
    <div className="flex max-w-80 flex-col items-start gap-4 px-4 py-6">
      <Button size="small" variant="outlined">
        Add Cost Center
      </Button>
      <TableList
        aria-label="Cost centers"
        header={
          <TableHeaderRow showActions>
            {WIDE_COLUMNS.map((label) => (
              <TableHeaderCell key={label}>{label}</TableHeaderCell>
            ))}
          </TableHeaderRow>
        }
      >
        {WIDE_ROWS.map((row) => (
          <TableRow key={row.id} data-id={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.service}</TableCell>
            <TableCell>{row.location}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell>{row.created}</TableCell>
            <TableCell type="actions" className="w-1">
              <RowActionsMenu label={`Actions for ${row.name}, ${row.location}`}>
                <MenuItem>Edit</MenuItem>
                <MenuItem>Duplicate</MenuItem>
                <MenuItem destructive>Delete</MenuItem>
              </RowActionsMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableList>
    </div>
  );
}

/** Nothing on the page reaches past the viewport's right edge: no sideways page scroll. */
async function expectNoSidewaysScroll() {
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
}

const phone = (theme: 'light' | 'dark'): Story => ({
  name: `At a phone’s width — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => <PhoneTable />,
  globals: { theme, viewport: MOBILE },
  parameters: { layout: 'fullscreen', controls: { disable: true }, chromatic: MOBILE_SNAPSHOT },
  // The theme is set on <html>, so a Dark story would flip the whole docs page; the menu stays open for the snapshot.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Cost centers' });

    // The columns need more than the frame's 288: the table scrolls in its own region, the page doesn't.
    const region = await canvas.findByRole('region', { name: 'Cost centers' });
    await expect(region).toBe(table.parentElement);
    await expect(region.clientWidth).toBe(288);
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    await expect(getComputedStyle(region).overflowX).toBe('auto');
    await expectNoSidewaysScroll();

    // Keyboard: Tab stops on the region (the arrow keys then scroll it: the
    // browser's own scrolling of a focused scroll container), then goes on
    // into the rows' ••• buttons; Shift+Tab comes back.
    const before = canvas.getByRole('button', { name: 'Add Cost Center' });
    before.focus();
    await userEvent.tab();
    await expect(region).toHaveFocus();
    await expect(region).toHaveAttribute('tabindex', '0');
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: `Actions for ${WIDE_ROWS[0].name}, ${WIDE_ROWS[0].location}` })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(region).toHaveFocus();

    // Scrolled to the end, the last column (the •••) comes into the region.
    region.scrollLeft = region.scrollWidth;
    await waitFor(() => expect(region.scrollLeft).toBe(region.scrollWidth - region.clientWidth));
    const button = canvas.getByRole('button', { name: lastLabel });
    const r = region.getBoundingClientRect();
    await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(r.right + 0.5);
    await expectNoSidewaysScroll();

    // The last row's menu opens outside the region: on <body>, over the region's bottom edge, all of it on screen.
    await userEvent.click(button);
    const menu = screen.getByRole('menu', { name: lastLabel });
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Edit' })).toHaveFocus());
    await expect(region.contains(menu)).toBe(false);
    await expect(menu.parentElement).toBe(document.body);
    await expect(getComputedStyle(menu).position).toBe('fixed');
    const m = menu.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    // Where the inline menu would be: 4px from the •••, flush with its right edge. Below it at a
    // phone's 568; above it where the viewport is too short (test:static's channel pass), as inline.
    const below = menu.getAttribute('data-placement') === 'bottom';
    await expect(below ? m.top - b.bottom : b.top - m.bottom).toBeCloseTo(4, 1);
    await expect(m.right).toBeCloseTo(b.right, 1);
    // Below: past the region's bottom edge, where the region would clip an inline menu…
    if (below) await expect(m.bottom).toBeGreaterThan(r.bottom);
    // …inside the viewport…
    await expect(m.left).toBeGreaterThanOrEqual(0);
    await expect(m.top).toBeGreaterThanOrEqual(0);
    await expect(m.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await expect(m.bottom).toBeLessThanOrEqual(document.documentElement.clientHeight);
    // …and not clipped: the last item (below the region, when the menu opens below) is the menu's own pixels.
    const last = within(menu).getByRole('menuitem', { name: 'Delete' }).getBoundingClientRect();
    if (below) await expect(last.top).toBeGreaterThan(r.bottom);
    await expect(menu.contains(document.elementFromPoint(last.left + 8, last.top + last.height / 2))).toBe(true);
    await expectNoSidewaysScroll();

    // Escape closes it and hands focus back to the •••.
    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('menu')).toBeNull();
    await expect(button).toHaveFocus();

    // Open again for the snapshot.
    await userEvent.click(button);
    await screen.findByRole('menu', { name: lastLabel });
  },
});

export const PhoneLight = phone('light');
export const PhoneDark = phone('dark');

/* ── The region's focus ring, in Light and Dark ─────────────────────────────
   Code adds it (Figma has no phone layout): 2px stroke.focused, inside the
   region's edge, as on a modal's scrolling body. Forced with pseudo-states and
   checked in afterEach (the addon applies it on STORY_RENDERED, after play). */

/* The outline the region shows when focused from the keyboard. */
const focusRing = (theme: 'light' | 'dark'): Story => ({
  name: `Focus ring — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => <PhoneTable />,
  globals: { theme },
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', focusVisible: ['[data-part="scroll-region"]'] },
  },
  tags: theme === 'dark' ? ['!autodocs'] : [],
  afterEach: async ({ canvasElement }) => {
    const ring = tokenColour('stroke-focused');
    const region = within(canvasElement).getByRole('region', { name: 'Cost centers' });
    await waitFor(
      () => {
        const style = getComputedStyle(region);
        expect(style.outlineStyle).toBe('solid');
        expect(style.outlineWidth).toBe('2px');
        expect(style.outlineOffset).toBe('-2px');
        expect(style.outlineColor).toBe(ring);
      },
      { timeout: 3000 },
    );
  },
});

export const FocusRingLight = focusRing('light');
export const FocusRingDark = focusRing('dark');
