import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { FilterSummary, type FilterSummaryFilter } from './FilterSummary';

/* Figma's default: the Export Details filters, none set. */
const NONE_SET: FilterSummaryFilter[] = [
  { key: 'Search', value: 'All' },
  { key: 'Status', value: 'All' },
  { key: 'Type', value: 'All' },
];

/* An export made with filters on. */
const SOME_SET: FilterSummaryFilter[] = [
  { key: 'Search', value: 'invoices-12' },
  { key: 'Status', value: 'Completed' },
  { key: 'Type', value: 'Zip' },
  { key: 'Date', value: '2026-10-01 – 2026-10-08' },
];

const meta = {
  title: 'Components/FilterSummary',
  component: FilterSummary,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Filters** (`Filter / Summary` and its `Filter / Summary Line`s): a ' +
          'read-only record of the filters something was made with, as in Export Details. `title` is Figma’s Title ' +
          '(default “Current Filters”) and names the summary. `filters` is the lines, one `{ key, value }` each: pass ' +
          'the filter’s name as `key` (“Status”), and the colon is added. The lines are a `dl`. It has no action: ' +
          'filters are changed in the Filter Bar.',
      },
    },
  },
  args: { filters: NONE_SET },
} satisfies Meta<typeof FilterSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's default: Search, Status and Type, all "All". */
export const Playground: Story = {};

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

/* ── Filters, in Light and Dark ────────────────────────────────────────────
   Figma's default and an export made with filters on, on the page canvas
   and on a dialog's surface.base (where Export Details shows it). Checked
   against Figma's layout and bindings. */

const SURFACES = [
  { id: 'canvas', name: 'On surface.canvas', className: 'bg-surface-canvas' },
  { id: 'base', name: 'On surface.base (a dialog)', className: 'bg-surface-base' },
] as const;

const EXAMPLES = [
  { id: 'none', title: 'Current Filters', filters: NONE_SET },
  { id: 'some', title: 'Filters used', filters: SOME_SET },
] as const;

const filtersStory = (theme: 'light' | 'dark'): Story => ({
  name: `Filters — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      {SURFACES.map((surface) => (
        <section key={surface.id} aria-label={surface.name} className="flex flex-col gap-2">
          <p className="text-caption-md-medium text-text-secondary">{surface.name}</p>
          <div className={`flex flex-wrap items-start gap-12 rounded-12 p-6 ${surface.className}`}>
            {EXAMPLES.map((example) => (
              <FilterSummary
                key={example.id}
                title={example.title}
                filters={example.filters}
                className="w-116"
                data-summary={`${surface.id}-${example.id}`}
              />
            ))}
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
      box: tokenColour('surface-elevated-secondary'),
      primary: tokenColour('text-primary'),
      secondary: tokenColour('text-secondary'),
    };
    const canvas = within(canvasElement);
    await waitFor(() => {
      for (const summary of canvasElement.querySelectorAll<HTMLElement>('[data-summary]')) {
        const [title, box] = [...summary.children] as HTMLElement[];
        // Vertical, 8px gap. Title — Body/sm-medium, text.secondary.
        expect(getComputedStyle(summary).rowGap).toBe('8px');
        expect(getComputedStyle(title).color).toBe(want.secondary);
        expect([getComputedStyle(title).fontSize, getComputedStyle(title).fontWeight]).toEqual(['14px', '500']);
        // Filters — a dl; surface.elevated-secondary, radius 8, 12/16 padding, 6px gap; it hugs its lines.
        const style = getComputedStyle(box);
        expect(box.tagName).toBe('DL');
        expect(style.backgroundColor).toBe(want.box);
        expect(style.borderTopLeftRadius).toBe('8px');
        expect([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]).toEqual(['12px', '16px', '12px', '16px']);
        expect(style.rowGap).toBe('6px');
        expect(box.getBoundingClientRect().width).toBeLessThan(summary.getBoundingClientRect().width);
        for (const line of box.children) {
          const [key, value] = [...line.children] as HTMLElement[];
          // Summary Line — 4px gap. Key — Body/sm-semibold, text.primary, with its colon; Value — Body/sm-regular, text.secondary.
          expect(getComputedStyle(line).columnGap).toBe('4px');
          expect([key.tagName, value.tagName]).toEqual(['DT', 'DD']);
          expect(key.textContent).toMatch(/^\w+:$/);
          expect(getComputedStyle(key).color).toBe(want.primary);
          expect([getComputedStyle(key).fontSize, getComputedStyle(key).fontWeight]).toEqual(['14px', '600']);
          expect(getComputedStyle(value).color).toBe(want.secondary);
          expect([getComputedStyle(value).fontSize, getComputedStyle(value).fontWeight]).toEqual(['14px', '400']);
        }
      }
    });
    // A group named by its title; the lines in order.
    const [summary] = canvas.getAllByRole('group', { name: 'Current Filters' });
    await expect(within(summary).getAllByRole('term').map((t) => t.textContent)).toEqual(['Search:', 'Status:', 'Type:']);
    await expect(within(summary).getAllByRole('definition').map((d) => d.textContent)).toEqual(['All', 'All', 'All']);
    await expect(canvas.getAllByRole('group', { name: 'Filters used' })).toHaveLength(2);
  },
});

export const FiltersLight = filtersStory('light');
export const FiltersDark = filtersStory('dark');
