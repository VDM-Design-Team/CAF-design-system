import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { ICON_NAMES } from '../icon';
import { StatCard, STAT_CARD_TONES, type StatCardProps } from './StatCard';

const meta = {
  title: 'Components/StatCard',
  component: StatCard,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Cards** (`Card / Stat`, with its private `_Stat Icon` tile): one ' +
          'total in the row of stats above a list. `label` and `value` are Figma’s Label and Value. Figma’s Status ' +
          'Indicator is `icon` (a Phosphor name) and `tone` (`info`, `success`, `pending` or `critical`), the glyph and ' +
          'the accent colour of the tile. The card is an `article` named by its label. Put several in a `StatRow`.',
      },
    },
  },
  args: { label: 'Total Exports', value: '5981', icon: 'file-text', tone: 'info' },
  argTypes: {
    tone: { control: 'radio', options: STAT_CARD_TONES },
    icon: { control: 'select', options: ICON_NAMES },
  },
  render: (args) => <StatCard {...args} className="w-96" />,
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's default: Total Exports. */
export const Playground: Story = {};

/* ── Every `_Stat Icon` Type, in Light and Dark ────────────────────────────
   Figma's seven Types, with the labels and values the two stat rows give
   them. Each part is checked against the variable, size and text style its
   Figma layer is bound to. */

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

const TYPES: (Pick<StatCardProps, 'icon'> & {
  type: string;
  label: string;
  value: string;
  tone: NonNullable<StatCardProps['tone']>;
})[] = [
  { type: 'Total Exports', label: 'Total Exports', value: '5981', icon: 'file-text', tone: 'info' },
  { type: 'Completed', label: 'Completed', value: '5648', icon: 'check-circle', tone: 'success' },
  { type: 'Processing', label: 'Processing', value: '0', icon: 'clock', tone: 'pending' },
  { type: 'Failed', label: 'Failed', value: '333', icon: 'x-circle', tone: 'critical' },
  { type: 'Total Announcements', label: 'Total Announcements', value: '7', icon: 'bell', tone: 'info' },
  { type: 'Latest Version', label: 'Latest Version', value: '2.5.6', icon: 'tag', tone: 'success' },
  { type: 'Last Updated', label: 'Last Updated', value: 'Aug 10, 2026', icon: 'calendar-blank', tone: 'info' },
];

const types = (theme: 'light' | 'dark'): Story => ({
  name: `Types — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="grid w-max grid-cols-2 gap-x-4 gap-y-6">
      {TYPES.map(({ type, ...card }) => (
        <div key={type} className="flex flex-col gap-2">
          <p className="text-caption-md-medium text-text-secondary">
            Type={type} · {card.icon}, {card.tone}
          </p>
          {/* Figma's card: 372 wide → w-93. */}
          <StatCard {...card} className="w-93" data-type={type} />
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      base: tokenColour('surface-base'),
      subtle: tokenColour('text-subtle'),
      primary: tokenColour('text-primary'),
      ...Object.fromEntries(
        STAT_CARD_TONES.flatMap((tone) => [
          [`${tone}-surface`, tokenColour(`accent-${tone}-tonal-surface-default`)],
          [`${tone}-content`, tokenColour(`accent-${tone}-tonal-content-default`)],
        ]),
      ),
    } as Record<string, string>;
    const canvas = within(canvasElement);
    await waitFor(() => {
      for (const { type, label, tone } of TYPES) {
        const card = canvasElement.querySelector<HTMLElement>(`[data-type="${type}"]`)!;
        const [tile, text] = [...card.children] as HTMLElement[];
        const [labelText, valueText] = [...text.children] as HTMLElement[];
        const icon = tile.querySelector('svg')!;
        // The card: an article named by its label.
        expect(canvas.getByRole('article', { name: label })).toBe(card);
        // Card / Stat — surface.base, radius 12, 24px padding, 12px gap, items centred.
        const style = getComputedStyle(card);
        expect(style.backgroundColor).toBe(want.base);
        expect(style.borderTopLeftRadius).toBe('12px');
        expect([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]).toEqual(['24px', '24px', '24px', '24px']);
        expect(style.columnGap).toBe('12px');
        expect(style.alignItems).toBe('center');
        // _Stat Icon — 40×40, radius 8, accent.<tone>.tonal surface; a decorative 24px glyph in its content.
        expect([tile.getBoundingClientRect().width, tile.getBoundingClientRect().height]).toEqual([40, 40]);
        expect(getComputedStyle(tile).borderTopLeftRadius).toBe('8px');
        expect(getComputedStyle(tile).backgroundColor).toBe(want[`${tone}-surface`]);
        expect(tile).toHaveAttribute('aria-hidden', 'true');
        expect(icon.getBoundingClientRect().width).toBe(24);
        expect(getComputedStyle(icon).color).toBe(want[`${tone}-content`]);
        // Text Group — 4px gap; Label in Body/sm-regular, text.subtle; Value in Heading/lg-semibold, text.primary.
        expect(getComputedStyle(text).rowGap).toBe('4px');
        expect(getComputedStyle(labelText).color).toBe(want.subtle);
        expect([getComputedStyle(labelText).fontSize, getComputedStyle(labelText).fontWeight]).toEqual(['14px', '400']);
        expect(getComputedStyle(valueText).color).toBe(want.primary);
        expect([getComputedStyle(valueText).fontSize, getComputedStyle(valueText).fontWeight]).toEqual(['24px', '600']);
        // The value is a paragraph, not a heading.
        expect(valueText.tagName).toBe('P');
      }
    });
    await expect(canvas.queryAllByRole('heading')).toHaveLength(0);
  },
});

export const TypesLight = types('light');
export const TypesDark = types('dark');

/* ── Long content ──────────────────────────────────────────────────────────
   A label or value longer than the card wraps inside it; the tile stays
   40px and centred. */

export const LongContent: Story = {
  name: 'Long content',
  render: () => (
    <div className="flex w-64 flex-col gap-4">
      <StatCard label="Exports waiting for approval" value="12,480" icon="clock" tone="pending" data-card="long" />
      <StatCard label="Last Updated" value="September 30, 2026" icon="calendar-blank" data-card="date" />
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    for (const card of canvasElement.querySelectorAll<HTMLElement>('[data-card]')) {
      const tile = card.firstElementChild as HTMLElement;
      await expect(tile.getBoundingClientRect().width).toBe(40);
      // Nothing spills out of the card.
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }
  },
};
