import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { StatCard } from '../stat-card';
import { StatRow } from './StatRow';

/* Figma's two rows are content: `Card / Stat Row – Exports` and `– Announcements`. */
function ExportsStats() {
  return (
    <>
      <StatCard label="Total Exports" value="5981" icon="file-text" tone="info" />
      <StatCard label="Completed" value="5648" icon="check-circle" tone="success" />
      <StatCard label="Processing" value="0" icon="clock" tone="pending" />
      <StatCard label="Failed" value="333" icon="x-circle" tone="critical" />
    </>
  );
}

function AnnouncementsStats() {
  return (
    <>
      <StatCard label="Total Announcements" value="7" icon="bell" tone="info" />
      <StatCard label="Latest Version" value="2.5.6" icon="tag" tone="success" />
      <StatCard label="Last Updated" value="Aug 10, 2026" icon="calendar-blank" tone="info" />
    </>
  );
}

const meta = {
  title: 'Components/StatRow',
  component: StatRow,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Cards**: the layout behind `Card / Stat Row – Exports` (four cards) ' +
          'and `Card / Stat Row – Announcements` (three). Pass the `StatCard`s as `children`. The cards share the row ' +
          'equally, 16px apart, which at Figma’s 1536px page is 372px for four and 501px for three. Each card is at ' +
          'least 256px wide, so on a narrower screen they wrap, and on a phone they stack. Fragments and components ' +
          'that return several cards work: the row lays out the elements directly inside it. To name the row, pass ' +
          '`role="group"` and an `aria-label`.',
      },
    },
  },
  args: { children: <ExportsStats /> },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof StatRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Exports row at the canvas' width. */
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

/** Each card's box in a row, rounded to whole pixels. */
function boxes(row: HTMLElement) {
  return [...row.querySelectorAll('article')].map((card) => {
    const { left, top, width } = card.getBoundingClientRect();
    return { left: Math.round(left), top: Math.round(top), width: Math.round(width) };
  });
}

/* ── Figma's rows at Figma's width, in Light and Dark ──────────────────────
   Both rows on Figma's 1536px page: four cards 372px wide, three 501px,
   16px apart, on one line. The cards keep their Figma bindings in both
   themes (StatCard's stories check every part). */

const wide = (theme: 'light' | 'dark'): Story => ({
  name: `Wide — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex w-384 flex-col gap-8">
      <section aria-label="Exports" className="flex flex-col gap-2">
        <p className="text-caption-md-medium text-text-secondary">Card / Stat Row – Exports</p>
        <StatRow data-row="exports" role="group" aria-label="Export totals">
          <ExportsStats />
        </StatRow>
      </section>
      <section aria-label="Announcements" className="flex flex-col gap-2">
        <p className="text-caption-md-medium text-text-secondary">Card / Stat Row – Announcements</p>
        <StatRow data-row="announcements">
          <AnnouncementsStats />
        </StatRow>
      </section>
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { base: tokenColour('surface-base'), subtle: tokenColour('text-subtle'), primary: tokenColour('text-primary') };
    const row = (name: string) => canvasElement.querySelector<HTMLElement>(`[data-row="${name}"]`)!;
    await waitFor(() => {
      for (const [name, count, width] of [
        ['exports', 4, 372],
        ['announcements', 3, 501],
      ] as const) {
        const cards = boxes(row(name));
        expect(cards).toHaveLength(count);
        // One line, Figma's card width, 16px apart.
        expect(new Set(cards.map((c) => c.top)).size).toBe(1);
        cards.forEach((c, i) => {
          expect(Math.abs(c.width - width)).toBeLessThanOrEqual(1);
          if (i > 0) expect(Math.abs(c.left - (cards[i - 1].left + cards[i - 1].width) - 16)).toBeLessThanOrEqual(1);
        });
        for (const card of row(name).querySelectorAll('article')) {
          expect(getComputedStyle(card).backgroundColor).toBe(want.base);
          const [label, value] = card.querySelectorAll('p');
          expect(getComputedStyle(label).color).toBe(want.subtle);
          expect(getComputedStyle(value).color).toBe(want.primary);
        }
      }
    });
    // Named with role="group" and aria-label; each card is named by its label.
    const exportsRow = within(canvasElement).getByRole('group', { name: 'Export totals' });
    await expect(within(exportsRow).getAllByRole('article')).toHaveLength(4);
    await expect(within(exportsRow).getByRole('article', { name: 'Failed' })).toBeVisible();
  },
});

export const WideLight = wide('light');
export const WideDark = wide('dark');

/* ── Narrow widths ─────────────────────────────────────────────────────────
   A phone (375px, less a 16px gutter each side: 343px): the cards stack,
   full width. A tablet column (600px): two cards a line, and the third of
   three takes the last line on its own. */

export const Narrow: Story = {
  name: 'Narrow',
  render: () => (
    <div className="flex flex-col gap-8">
      <section aria-label="Phone, Exports" className="flex w-86 flex-col gap-2">
        <p className="text-caption-md-medium text-text-secondary">344px · Exports</p>
        <StatRow data-row="phone">
          <ExportsStats />
        </StatRow>
      </section>
      <section aria-label="Tablet, Exports" className="flex w-150 flex-col gap-2">
        <p className="text-caption-md-medium text-text-secondary">600px · Exports</p>
        <StatRow data-row="tablet">
          <ExportsStats />
        </StatRow>
      </section>
      <section aria-label="Tablet, Announcements" className="flex w-150 flex-col gap-2">
        <p className="text-caption-md-medium text-text-secondary">600px · Announcements</p>
        <StatRow data-row="tablet-3">
          <AnnouncementsStats />
        </StatRow>
      </section>
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const row = (name: string) => canvasElement.querySelector<HTMLElement>(`[data-row="${name}"]`)!;
    await waitFor(() => {
      // Phone: one card a line, each the row's full width, 16px apart.
      const phone = boxes(row('phone'));
      expect(phone).toHaveLength(4);
      phone.forEach((c, i) => {
        expect(c.width).toBe(344);
        if (i > 0) expect(c.top).toBeGreaterThan(phone[i - 1].top);
      });
      // Tablet: two a line, (600 − 16) / 2 = 292 each.
      const tablet = boxes(row('tablet'));
      expect(tablet.map((c) => c.width)).toEqual([292, 292, 292, 292]);
      expect([tablet[0].top === tablet[1].top, tablet[2].top === tablet[3].top, tablet[1].top < tablet[2].top]).toEqual([
        true,
        true,
        true,
      ]);
      // Three cards: two on the first line, the third alone on the last, filling it.
      const three = boxes(row('tablet-3'));
      expect(three.map((c) => c.width)).toEqual([292, 292, 600]);
    });
  },
};
