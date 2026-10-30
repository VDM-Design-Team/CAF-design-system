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
          '`accent.red.medium`), the `title` as an `<h2>` in Title/md-bold, and a row with the `date` (Body/sm-regular, ' +
          '`text.subtle`) and the `version` in a VersionBadge. 16px between the rows, 12px between the date and badge. ' +
          'Pass `titleId` and point the dialog’s `aria-labelledby` at it.',
      },
    },
  },
  args: {
    title: 'WELCOME TO THE NEW UPDATE FOR THIS MONTH',
    date: 'August 10, 2026',
    version: 'v2.5.6',
  },
  // Figma's dialog content is 436 wide, on surface.canvas.
  decorators: [
    (Story) => (
      <div className="w-108 max-w-full bg-surface-canvas">
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

/* ── The bindings, in Light and Dark ───────────────────────────────────────
   The rocket in accent.red.medium (48px, decorative); Title/md-bold in
   text.primary; the date in Body/sm-regular, text.subtle; the VersionBadge;
   16px and 12px gaps. */
const bindings = (theme: 'light' | 'dark'): Story => ({
  name: `Bindings — ${theme === 'light' ? 'Light' : 'Dark'}`,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      icon: tokenColour('accent-red-medium'),
      title: tokenColour('text-primary'),
      date: tokenColour('text-subtle'),
      badge: tokenColour('accent-info-tonal-content-default'),
    };
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-part="icon"]')!.parentElement!;
    const icon = root.querySelector<SVGElement>('[data-part="icon"]')!;
    const title = canvas.getByRole('heading', { level: 2, name: 'WELCOME TO THE NEW UPDATE FOR THIS MONTH' });
    const date = canvas.getByText('August 10, 2026');
    const badge = canvas.getByText('v2.5.6');
    const metadata = root.querySelector<HTMLElement>('[data-part="metadata"]')!;
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await waitFor(() => {
      expect(getComputedStyle(root).rowGap).toBe('16px');
      expect(getComputedStyle(metadata).columnGap).toBe('12px');
      // Changelog Icon: RocketLaunch, 48px, accent.red.medium.
      expect(icon.getBoundingClientRect().width).toBe(48);
      expect(getComputedStyle(icon).color).toBe(want.icon);
      // Title: Title/md-bold, text.primary.
      expect(getComputedStyle(title).color).toBe(want.title);
      expect([getComputedStyle(title).fontSize, getComputedStyle(title).fontWeight]).toEqual(['20px', '700']);
      // Date: Body/sm-regular, text.subtle.
      expect(getComputedStyle(date).color).toBe(want.date);
      expect([getComputedStyle(date).fontSize, getComputedStyle(date).fontWeight]).toEqual(['14px', '400']);
      // The Version Badge.
      expect(getComputedStyle(badge).color).toBe(want.badge);
    });
  },
});

export const BindingsLight = bindings('light');
export const BindingsDark = bindings('dark');
