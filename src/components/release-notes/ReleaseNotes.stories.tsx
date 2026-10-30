import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { BulletItem } from '../bullet-item';
import { ReleaseNotes } from './ReleaseNotes';

const meta = {
  title: 'Components/ReleaseNotes',
  component: ReleaseNotes,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Release Notes`): the list in the what’s-new ' +
          'dialog (ChangelogModal). `sectionTitle` is Section Title (default “What’s new in this release:”), in ' +
          'Body/sm-semibold, `text.primary`; it names the list. The notes are `children`: BulletItems, in a `<ul>`, ' +
          '12px apart, as Figma stacks them.',
      },
    },
  },
  args: { children: <BulletItem>new update for CAF</BulletItem> },
  argTypes: { children: { control: false } },
  // Figma's dialog content is 436 wide.
  decorators: [
    (Story) => (
      <div className="w-108 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReleaseNotes>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's default: the section title and one note. */
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
   Pattern 14's notes. The title names the list; the title and each note are
   12px apart. */
const bindings = (theme: 'light' | 'dark'): Story => ({
  name: `Bindings — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <ReleaseNotes>
      <BulletItem>new update for CAF</BulletItem>
      <BulletItem>Improved export performance</BulletItem>
    </ReleaseNotes>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { title: tokenColour('text-primary') };
    const canvas = within(canvasElement);
    // The list is named by the section title, and holds the notes.
    const list = canvas.getByRole('list', { name: "What's new in this release:" });
    const items = within(list).getAllByRole('listitem');
    await expect(items.map((item) => item.textContent)).toEqual(['new update for CAF', 'Improved export performance']);
    const title = canvas.getByText("What's new in this release:");
    await expect(title.tagName).toBe('P');
    await waitFor(() => {
      // Section Title: Body/sm-semibold, text.primary.
      expect(getComputedStyle(title).color).toBe(want.title);
      expect([getComputedStyle(title).fontSize, getComputedStyle(title).fontWeight]).toEqual(['14px', '600']);
      // 12px between the title and the list, and between notes.
      expect(list.getBoundingClientRect().top - title.getBoundingClientRect().bottom).toBe(12);
      expect(items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().bottom).toBe(12);
    });
  },
});

export const BindingsLight = bindings('light');
export const BindingsDark = bindings('dark');
