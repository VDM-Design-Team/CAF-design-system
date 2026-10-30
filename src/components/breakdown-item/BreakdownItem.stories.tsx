import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MenuItem } from '../menu-item';
import { BreakdownItem } from './BreakdownItem';

const meta = {
  title: 'Components/BreakdownItem',
  component: BreakdownItem,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Cards** (`Card / Breakdown Item`): one breakdown line of a cost, as ' +
          'in the Edit Recurring Cost side sheet and the review step of a new cost. `title` (Body/sm-semibold), `meta` ' +
          '(cost center · nature · location, `text.secondary`), `period` (`text.subtle`) and `amount` are Figma’s text ' +
          'properties. Show Actions is `actions`: the MenuItems of a RowActionsMenu, named “Actions for <title>” unless ' +
          '`actionsLabel` says otherwise. 16px padding and gap, radius 8, `surface.neutral.faint` with a 1px ' +
          '`stroke.subtle` edge. List several in a `<ul>`.',
      },
    },
  },
  args: {
    title: 'Breakdown 1',
    meta: 'Employee Expenses · Salary · Philippines',
    period: '2026-09-01 - 2026-09-30',
    amount: 'USD 900',
  },
  argTypes: { actions: { control: false } },
  // Figma's item is 624 wide.
  decorators: [
    (Story) => (
      <div className="w-156 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BreakdownItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's default: Show Actions off. */
export const Playground: Story = {};

/** The Breakdowns of the Edit Recurring Cost side sheet (pattern 06): two items, each with its ••• menu. */
export const OnTheScreens: Story = {
  render: function Render() {
    const [chosen, setChosen] = useState<string | null>(null);
    const items = [
      { title: 'Breakdown 1', meta: 'Employee Expenses · Salary · Philippines', amount: 'USD 900' },
      { title: 'Breakdown 2', meta: 'Travel Expenses · Testing · Philippines', amount: 'USD 350' },
    ];
    return (
      <div className="flex flex-col gap-4 pb-48">
        <p role="status" className="text-body-sm-regular text-text-secondary">
          {chosen ?? 'Nothing chosen yet'}
        </p>
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.title}>
              <BreakdownItem
                {...item}
                period="2026-09-01 - 2026-09-30"
                actions={
                  <>
                    <MenuItem onClick={() => setChosen(`Edit: ${item.title}`)}>Edit</MenuItem>
                    <MenuItem destructive onClick={() => setChosen(`Delete: ${item.title}`)}>
                      Delete
                    </MenuItem>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      </div>
    );
  },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Each ••• is named after its item, so the two never share a name.
    const second = canvas.getByRole('button', { name: 'Actions for Breakdown 2' });
    await expect(canvas.getByRole('button', { name: 'Actions for Breakdown 1' })).toBeInTheDocument();

    // Pointer: open, pick Delete.
    await userEvent.click(second);
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Delete' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Delete: Breakdown 2');
    await expect(canvas.queryByRole('menu')).toBeNull();

    await expect(second).toHaveFocus();

    // Keyboard: ↓ opens it on the first item; Escape closes it and gives focus back.
    second.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Edit' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
    await expect(second).toHaveFocus();
  },
};

/** Show Actions: an `actions` menu adds the •••; `actionsLabel` overrides its name. */
export const WithActions: Story = {
  args: {
    actions: <MenuItem onClick={fn()}>Edit</MenuItem>,
    actionsLabel: 'Actions for the salary breakdown',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Actions for the salary breakdown' })).toBeInTheDocument();
  },
};

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

/* The stroke drawn inside the edge (Tailwind's inset-ring), as computed box-shadow text. */
const insetStroke = (colour: string) => `${colour} 0px 0px 0px 1px inset`;

/* ── Show Actions × the ••• button's Hover, in Light and Dark ───────────────
   Figma's two variants of Show Actions, and the ••• forced to Hover with
   storybook-addon-pseudo-states. Each item is checked against the variables its
   Figma layers are bound to. */
const VARIANTS = [
  { name: 'Show Actions off', actions: false, pseudo: undefined },
  { name: 'Show Actions on', actions: true, pseudo: undefined },
  { name: 'Show Actions on, ••• Hover', actions: true, pseudo: 'hover' },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Variants — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <ul className="flex flex-col gap-6">
      {VARIANTS.map(({ name, actions, pseudo }, index) => (
        <li key={name} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">{name}</span>
          <BreakdownItem
            data-variant={name}
            data-pseudo={pseudo}
            title={`Breakdown ${index + 1}`}
            meta="Employee Expenses · Salary · Philippines"
            period="2026-09-01 - 2026-09-30"
            amount="USD 900"
            actions={actions ? <MenuItem>Edit</MenuItem> : undefined}
          />
        </li>
      ))}
    </ul>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"] button'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-neutral-faint'),
      stroke: insetStroke(tokenColour('stroke-subtle')),
      primary: tokenColour('text-primary'),
      secondary: tokenColour('text-secondary'),
      subtle: tokenColour('text-subtle'),
      hover: tokenColour('neutral-tonal-surface-default'),
    };
    const items = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-variant]'));
    await expect(items).toHaveLength(3);
    const colourOf = (item: HTMLElement, text: string) => getComputedStyle(within(item).getByText(text)).color;
    await waitFor(
      () => {
        for (const [index, item] of items.entries()) {
          const style = getComputedStyle(item);
          // Frame: surface.neutral.faint, 1px stroke.subtle inside, radius 8, 16px padding and gap.
          expect(style.backgroundColor).toBe(want.fill);
          expect(style.boxShadow).toContain(want.stroke);
          expect(style.borderTopLeftRadius).toBe('8px');
          expect([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]).toEqual(['16px', '16px', '16px', '16px']);
          expect(style.columnGap).toBe('16px');
          // Text: Title and Amount text.primary, Meta text.secondary, Period text.subtle.
          expect(colourOf(item, `Breakdown ${index + 1}`)).toBe(want.primary);
          expect(colourOf(item, 'USD 900')).toBe(want.primary);
          expect(colourOf(item, 'Employee Expenses · Salary · Philippines')).toBe(want.secondary);
          expect(colourOf(item, '2026-09-01 - 2026-09-30')).toBe(want.subtle);
          // The ••• button: only with Show Actions; text.secondary glyph; neutral.tonal fill on Hover.
          const button = item.querySelector('button');
          if (item.dataset.variant === 'Show Actions off') {
            expect(button).toBeNull();
            continue;
          }
          expect(getComputedStyle(button!.querySelector('svg')!).color).toBe(want.secondary);
          expect(getComputedStyle(button!).backgroundColor).toBe(item.dataset.pseudo === 'hover' ? want.hover : 'rgba(0, 0, 0, 0)');
        }
      },
      { timeout: 3000 },
    );
  },
});

export const VariantsLight = grid('light');
export const VariantsDark = grid('dark');
