import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { ChangeDiff, ChangeDiffRow } from './ChangeDiff';

const meta = {
  title: 'Components/ChangeDiff',
  component: ChangeDiff,
  subcomponents: { ChangeDiffRow },
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Table** (`Table / Change Diff` and `Table / Change Diff Row`): the ' +
          '“View Changes” panel under an Audit Logs entry (pattern 08). A `<table>` with a Field / Before / After header ' +
          'and one `ChangeDiffRow` per changed field: `field` (the row header), `before` (a `<del>`, tinted ' +
          '`accent.critical`) and `after` (an `<ins>`, tinted `accent.success`). The column headers and a visually ' +
          'hidden “Removed:” / “Added:” say which is which, so colour is never the only cue. For a deleted record ' +
          'there is nothing to compare: show a compact Alert instead (“This cost was deleted”).',
      },
    },
  },
  args: { children: <ChangeDiffRow field="Status" before="Unknown" after="Pending" /> },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof ChangeDiff>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Pattern 08's entry: the Status of cost #32430 went from Unknown to Pending.
 * Each value is read with its column and its field, and says it was removed or added.
 */
export const Playground: Story = {
  args: { 'aria-label': 'Changes to cost #32430' },
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole('table', { name: 'Changes to cost #32430' });
    const headers = within(table).getAllByRole('columnheader');
    await expect(headers.map((h) => h.textContent)).toEqual(['Field', 'Before', 'After']);
    await expect(within(table).getByRole('rowheader', { name: 'Status' })).toBeInTheDocument();
    const [, before, after] = within(table).getAllByRole('row')[1].children;
    await expect(before).toHaveTextContent('Removed: Unknown');
    await expect(after).toHaveTextContent('Added: Pending');
    await expect(before.querySelector('del')).not.toBeNull();
    await expect(after.querySelector('ins')).not.toBeNull();
  },
};

/** An update to several fields, as it opens under the Audit Logs row. */
export const SeveralFields: Story = {
  args: {
    'aria-label': 'Changes to cost #32402',
    children: (
      <>
        <ChangeDiffRow field="Status" before="Pending" after="Approved" />
        <ChangeDiffRow field="Amount" before="USD 900" after="USD 950" />
        <ChangeDiffRow field="Payment Method" before="Card" after="Wiretransfer" />
        <ChangeDiffRow field="Notes" before="Monthly team salary." after="Monthly team salary, split by cost center." />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole('table');
    await expect(within(table).getAllByRole('rowheader').map((h) => h.textContent)).toEqual([
      'Status',
      'Amount',
      'Payment Method',
      'Notes',
    ]);
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

/* ── The bindings, in Light and Dark ───────────────────────────────────────
   Figma's Change Diff with its Row, at Figma's 960 width. Every layer is
   checked against the variable it is bound to. */
const bindings = (theme: 'light' | 'dark'): Story => ({
  name: `Bindings — ${theme === 'light' ? 'Light' : 'Dark'}`,
  args: { 'aria-label': 'Changes to cost #32430', className: 'w-240' },
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-neutral-faint'),
      stroke: tokenColour('stroke-subtle'),
      subtle: tokenColour('text-subtle'),
      primary: tokenColour('text-primary'),
      critical: [
        tokenColour('accent-critical-tonal-surface-default'),
        tokenColour('accent-critical-tonal-content-default'),
        tokenColour('accent-critical-outline-border-default'),
      ],
      success: [
        tokenColour('accent-success-tonal-surface-default'),
        tokenColour('accent-success-tonal-content-default'),
        tokenColour('accent-success-outline-border-default'),
      ],
    };
    const table = within(canvasElement).getByRole('table');
    await waitFor(() => {
      // Frame: surface.neutral.faint, 1px stroke.subtle inside, radius 8.
      const frame = getComputedStyle(table);
      expect(frame.backgroundColor).toBe(want.fill);
      expect(frame.boxShadow).toContain(insetStroke(want.stroke));
      expect(frame.borderTopLeftRadius).toBe('8px');
      // Header: Body/sm-regular in text.subtle, a 1px stroke.subtle line under it, 16px at the start.
      for (const th of within(table).getAllByRole('columnheader')) {
        const style = getComputedStyle(th);
        expect(style.color).toBe(want.subtle);
        expect(style.fontWeight).toBe('400');
        expect(style.borderBottomColor).toBe(want.stroke);
        expect(style.borderBottomWidth).toBe('1px');
        expect(style.paddingLeft).toBe('16px');
      }
      // Field: Body/sm-semibold, text.primary.
      const field = getComputedStyle(within(table).getByRole('rowheader'));
      expect(field.color).toBe(want.primary);
      expect(field.fontWeight).toBe('600');
      // Before and After: tonal fill and content, a 1px outline border inside, radius 6, no strike-through or underline.
      for (const [selector, [fill, content, border]] of [
        ['del', want.critical],
        ['ins', want.success],
      ] as const) {
        const style = getComputedStyle(table.querySelector(selector)!);
        expect(style.backgroundColor).toBe(fill);
        expect(style.color).toBe(content);
        expect(style.boxShadow).toContain(insetStroke(border));
        expect(style.borderTopLeftRadius).toBe('6px');
        expect(style.textDecorationLine).toBe('none');
        expect(style.fontWeight).toBe('400');
      }
    });
    // Field is a quarter of the table; Before and After share the rest.
    const [field, before, after] = within(table).getAllByRole('columnheader').map((th) => th.getBoundingClientRect().width);
    await expect(field).toBeCloseTo(table.getBoundingClientRect().width / 4, 0);
    await expect(before).toBeCloseTo(after, 0);
  },
});

export const BindingsLight = bindings('light');
export const BindingsDark = bindings('dark');
