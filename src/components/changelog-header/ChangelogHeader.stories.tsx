import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { ChangelogHeader } from './ChangelogHeader';

const meta = {
  title: 'Components/ChangelogHeader',
  component: ChangelogHeader,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Changelog Header`): the top of the what’s-new ' +
          'dialog (ChangelogModal). A decorative rocket (Figma’s `Modal / Changelog Icon`: Phosphor RocketLaunch, 48px, ' +
          '`accent.critical.tonal.content.default`), the `title` as an `<h2>` in Title/md-bold, and a row with the ' +
          '`date` (Body/sm-regular, `text.secondary`) and the `version` in a Tag (Status=Info, no icon). 16px between ' +
          'the rows, 12px between the date and the Tag. ' +
          'Pass `titleId` and point the dialog’s `aria-labelledby` at it.',
      },
    },
  },
  args: {
    title: 'WELCOME TO THE NEW UPDATE FOR THIS MONTH',
    date: 'August 10, 2026',
    version: 'v2.5.6',
  },
  // Figma's dialog content is 436 wide, on the dialog's surface.base.
  decorators: [
    (Story) => (
      <div className="w-108 max-w-full bg-surface-base">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChangelogHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** No date and no version: the title stands alone under the rocket, and no metadata row renders. */
export const TitleOnly: Story = {
  args: { date: undefined, version: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-part="metadata"]')).toBeNull();
    await expect(within(canvasElement).getByRole('heading', { level: 2 })).toHaveTextContent(
      'WELCOME TO THE NEW UPDATE FOR THIS MONTH',
    );
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

/* The type a utility class sets: size, line height, weight. Measure before waitFor, never inside it. */
function utilityType(className: string) {
  const probe = document.createElement('span');
  probe.className = className;
  document.body.append(probe);
  const { fontSize, lineHeight, fontWeight } = getComputedStyle(probe);
  probe.remove();
  return { fontSize, lineHeight, fontWeight };
}

/* ── The bindings, in Light and Dark ───────────────────────────────────────
   The rocket in accent.critical.tonal.content.default (48px, decorative);
   Title/md-bold in text.primary; the date in Body/sm-regular, text.secondary;
   the version as Tag Info without its icon; 16px and 12px gaps. */
const bindings = (theme: 'light' | 'dark'): Story => ({
  name: `Bindings — ${theme === 'light' ? 'Light' : 'Dark'}`,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      icon: tokenColour('accent-critical-tonal-content-default'),
      title: tokenColour('text-primary'),
      date: tokenColour('text-secondary'),
      tagFill: tokenColour('accent-info-tonal-surface-default'),
      tagText: tokenColour('accent-info-tonal-content-default'),
      tagType: utilityType('text-label-sm-medium'),
    };
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-part="icon"]')!.parentElement!;
    const icon = root.querySelector<SVGElement>('[data-part="icon"]')!;
    const title = canvas.getByRole('heading', { level: 2, name: 'WELCOME TO THE NEW UPDATE FOR THIS MONTH' });
    const date = canvas.getByText('August 10, 2026');
    const tag = canvas.getByText('v2.5.6');
    const metadata = root.querySelector<HTMLElement>('[data-part="metadata"]')!;
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await waitFor(() => {
      expect(getComputedStyle(root).rowGap).toBe('16px');
      expect(getComputedStyle(metadata).columnGap).toBe('12px');
      // Changelog Icon: RocketLaunch, 48px, accent.critical.tonal.content.default.
      expect(icon.getBoundingClientRect().width).toBe(48);
      expect(getComputedStyle(icon).color).toBe(want.icon);
      // Title: Title/md-bold, text.primary.
      expect(getComputedStyle(title).color).toBe(want.title);
      expect([getComputedStyle(title).fontSize, getComputedStyle(title).fontWeight]).toEqual(['20px', '700']);
      // Date: Body/sm-regular, text.secondary.
      expect(getComputedStyle(date).color).toBe(want.date);
      expect([getComputedStyle(date).fontSize, getComputedStyle(date).fontWeight]).toEqual(['14px', '400']);
      // Version: Tag Status=Info, Show Icon off — the info tonal pair, Label/sm-medium.
      expect(tag).toHaveAttribute('data-part', 'version');
      expect(tag.querySelector('svg')).toBeNull();
      const t = getComputedStyle(tag);
      expect(t.backgroundColor).toBe(want.tagFill);
      expect(t.color).toBe(want.tagText);
      expect({ fontSize: t.fontSize, lineHeight: t.lineHeight, fontWeight: t.fontWeight }).toEqual(want.tagType);
    });
  },
});

export const BindingsLight = bindings('light');
export const BindingsDark = bindings('dark');
