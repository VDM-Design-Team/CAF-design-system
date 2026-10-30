import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { BulletItem } from './BulletItem';

const meta = {
  title: 'Components/BulletItem',
  component: BulletItem,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Bullet Item`): one line of release notes, in ' +
          'the what’s-new dialog (ReleaseNotes) and on the Changelog page (ChangelogEntry). Figma’s Text is ' +
          '`children`, in Body/sm-regular, `text.primary`, after a 6px `accent.success.tonal.content` dot. It is an ' +
          '`<li>`: put it in a `<ul>`. The dot is the marker, hidden from assistive tech, and stays on the first line ' +
          'when a note wraps.',
      },
    },
  },
  args: { children: 'new update for CAF' },
  decorators: [
    (Story) => (
      <ul className="flex w-80 flex-col gap-3">
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof BulletItem>;

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

/* ── The bindings, in Light and Dark ───────────────────────────────────────
   Pattern 14's notes, and one long enough to wrap in 320px. */
const bindings = (theme: 'light' | 'dark'): Story => ({
  name: `Bindings — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <>
      <BulletItem>new update for CAF</BulletItem>
      <BulletItem>Improved export performance</BulletItem>
      <BulletItem>Recurring costs now show every upcoming payment, with its due date and status</BulletItem>
    </>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      dot: tokenColour('accent-success-tonal-content-default'),
      text: tokenColour('text-primary'),
    };
    const items = within(canvasElement).getAllByRole('listitem');
    await expect(items).toHaveLength(3);
    await waitFor(() => {
      for (const item of items) {
        const style = getComputedStyle(item);
        // Text: Body/sm-regular, text.primary; 8px from the dot.
        expect(style.color).toBe(want.text);
        expect([style.fontSize, style.fontWeight, style.lineHeight]).toEqual(['14px', '400', '20px']);
        expect(style.columnGap).toBe('8px');
        // The dot: 6×6, round, accent.success.tonal.content.default, hidden from assistive tech,
        // centred on the first line (Body/sm's 20px line: its centre 10px down).
        const marker = item.querySelector<HTMLElement>('[data-part="dot"]')!;
        expect(marker).toHaveAttribute('aria-hidden', 'true');
        const dot = marker.firstElementChild as HTMLElement;
        const box = dot.getBoundingClientRect();
        expect([box.width, box.height]).toEqual([6, 6]);
        expect(getComputedStyle(dot).backgroundColor).toBe(want.dot);
        expect(parseFloat(getComputedStyle(dot).borderTopLeftRadius)).toBeGreaterThanOrEqual(3);
        expect(box.top + box.height / 2 - item.getBoundingClientRect().top).toBe(10);
      }
    });
    // The long note wraps, and its dot stays on the first line.
    await expect(items[2].getBoundingClientRect().height).toBeGreaterThan(20);
  },
});

export const BindingsLight = bindings('light');
export const BindingsDark = bindings('dark');
