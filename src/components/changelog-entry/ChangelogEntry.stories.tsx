import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { BulletItem } from '../bullet-item';
import { ChangelogEntry } from './ChangelogEntry';

/* Pattern 14's notes, on every release. */
const notes = (
  <>
    <BulletItem>new update for CAF</BulletItem>
    <BulletItem>Improved export performance</BulletItem>
  </>
);

const meta = {
  title: 'Components/ChangelogEntry',
  component: ChangelogEntry,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Cards** (`Card / Changelog Entry`): one release on the Changelog ' +
          'page (patterns 14 and U07). `title` is Title (a heading, `<h2>` unless `headingLevel` says otherwise), `meta` ' +
          'is Meta (“Version 2.5.6 • August 10, 2026”), `showNew` is Show New (the Info Tag “New”, default true as in ' +
          'Figma; the Changelog shows it on the latest release only), and the notes are `children`: BulletItems. It is ' +
          'an `<article>` named by its title.',
      },
    },
  },
  args: {
    title: 'WELCOME TO THE NEW UPDATE FOR CAF',
    meta: 'Version 2.5.6 • August 10, 2026',
    children: notes,
  },
  argTypes: { children: { control: false }, headingLevel: { control: 'radio', options: [2, 3, 4] } },
  // Figma's card is 640 wide.
  decorators: [
    (Story) => (
      <div className="w-160 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChangelogEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/* ── Show New on and off, in Light and Dark ────────────────────────────────
   The two releases pattern 14 shows: the latest, with New, and an older one.
   Each part is checked against the variable and text style its Figma layer is
   bound to. */
const variants = (theme: 'light' | 'dark'): Story => ({
  name: `Show New — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      <ChangelogEntry title="WELCOME TO THE NEW UPDATE FOR CAF" meta="Version 2.5.6 • August 10, 2026">
        {notes}
      </ChangelogEntry>
      <ChangelogEntry title="IMPROVED BULK UPLOAD" meta="Version 2.5.0 • July 2, 2026" showNew={false}>
        {notes}
      </ChangelogEntry>
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-neutral-faint'),
      stroke: tokenColour('stroke-subtle'),
      title: tokenColour('text-primary'),
      meta: tokenColour('text-subtle'),
      tagFill: tokenColour('accent-info-tonal-surface-default'),
      tagText: tokenColour('accent-info-tonal-content-default'),
      dot: tokenColour('accent-success-tonal-content-default'),
    };
    const canvas = within(canvasElement);
    // Each card is an article named by its title, with the title as a level-2 heading.
    const latest = canvas.getByRole('article', { name: 'WELCOME TO THE NEW UPDATE FOR CAF' });
    const older = canvas.getByRole('article', { name: 'IMPROVED BULK UPLOAD' });
    for (const card of [latest, older]) {
      await expect(within(card).getByRole('heading', { level: 2 })).toBeVisible();
      await expect(within(card).getAllByRole('listitem')).toHaveLength(2);
    }
    // Show New: the Tag "New" on the latest only.
    const tag = within(latest).getByText('New');
    await expect(within(older).queryByText('New')).toBeNull();

    await waitFor(() => {
      for (const card of [latest, older]) {
        // The card: surface.neutral.faint, 1px stroke.subtle, radius 8.
        const style = getComputedStyle(card);
        expect(style.backgroundColor).toBe(want.fill);
        expect([style.borderTopWidth, style.borderTopColor]).toEqual(['1px', want.stroke]);
        expect(style.borderTopLeftRadius).toBe('8px');
        // Header: 16 / 20 padding, a 1px stroke.subtle line under it.
        const header = getComputedStyle(card.querySelector('[data-part="header"]')!);
        expect([header.paddingTop, header.paddingRight, header.paddingBottom, header.paddingLeft]).toEqual([
          '16px',
          '20px',
          '16px',
          '20px',
        ]);
        expect([header.borderBottomWidth, header.borderBottomColor]).toEqual(['1px', want.stroke]);
        // Title: Body/md-semibold, text.primary. Meta: Caption/md-regular, text.subtle, 2px under it.
        const title = within(card).getByRole('heading', { level: 2 });
        expect(getComputedStyle(title).color).toBe(want.title);
        expect([getComputedStyle(title).fontSize, getComputedStyle(title).fontWeight]).toEqual(['16px', '600']);
        const meta = title.nextElementSibling as HTMLElement;
        expect(getComputedStyle(meta).color).toBe(want.meta);
        expect([getComputedStyle(meta).fontSize, getComputedStyle(meta).fontWeight]).toEqual(['12px', '400']);
        expect(meta.getBoundingClientRect().top - title.getBoundingClientRect().bottom).toBe(2);
        // Notes: 16 / 20 padding, 6px between bullets, each dot accent.success.tonal.content.
        const notesList = card.querySelector<HTMLElement>('[data-part="notes"]')!;
        const list = getComputedStyle(notesList);
        expect([list.paddingTop, list.paddingRight, list.paddingBottom, list.paddingLeft]).toEqual([
          '16px',
          '20px',
          '16px',
          '20px',
        ]);
        expect(list.rowGap).toBe('6px');
        for (const dot of notesList.querySelectorAll<HTMLElement>('[data-part="dot"] > span'))
          expect(getComputedStyle(dot).backgroundColor).toBe(want.dot);
      }
      // New: Tag Status=Info, no icon.
      expect(getComputedStyle(tag).backgroundColor).toBe(want.tagFill);
      expect(getComputedStyle(tag).color).toBe(want.tagText);
      expect(tag.querySelector('svg')).toBeNull();
    });
  },
});

export const ShowNewLight = variants('light');
export const ShowNewDark = variants('dark');

/* ── On the Changelog page ─────────────────────────────────────────────────
   Pattern 14 / U07, step 3: every release, newest first; only the latest is
   marked New. */
export const OnTheChangelog: Story = {
  name: 'On the Changelog page',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-heading-lg-bold text-text-primary">Changelog</h1>
        <p className="text-body-sm-regular text-text-subtle">Everything that’s new in the Cost Application Form.</p>
      </div>
      <ChangelogEntry title="WELCOME TO THE NEW UPDATE FOR CAF" meta="Version 2.5.6 • August 10, 2026">
        {notes}
      </ChangelogEntry>
      <ChangelogEntry title="IMPROVED BULK UPLOAD" meta="Version 2.5.0 • July 2, 2026" showNew={false}>
        {notes}
      </ChangelogEntry>
      <ChangelogEntry title="RECURRING COSTS" meta="Version 2.4.0 • May 18, 2026" showNew={false}>
        {notes}
      </ChangelogEntry>
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const releases = canvas.getAllByRole('article');
    await expect(releases.map((release) => within(release).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'WELCOME TO THE NEW UPDATE FOR CAF',
      'IMPROVED BULK UPLOAD',
      'RECURRING COSTS',
    ]);
    await expect(canvas.getAllByText('New')).toHaveLength(1);
    await expect(within(releases[0]).getByText('New')).toBeVisible();
  },
};
