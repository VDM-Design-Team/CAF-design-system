import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Icon, type IconName } from '../icon';
import { Logo } from '../logo';
import { Sidebar, SidebarGroup, SidebarLink } from './Sidebar';

/* The admin sidebar's groups, as the new design draws them. */
const GROUPS: { label: string; links: { label: string; icon: IconName }[] }[] = [
  {
    label: 'Costs',
    links: [
      { label: 'Costs', icon: 'currency-circle-dollar' },
      { label: 'Recurring costs', icon: 'arrows-clockwise' },
      { label: 'Drafts', icon: 'note-pencil' },
      { label: 'Bulk upload', icon: 'upload' },
      { label: 'Disputes', icon: 'warning-circle' },
    ],
  },
  {
    label: 'Manage',
    links: [
      { label: 'Cost centers', icon: 'tag' },
      { label: 'Partners', icon: 'files' },
      { label: 'Users', icon: 'user' },
      { label: 'Contacts', icon: 'user' },
    ],
  },
  {
    label: 'System',
    links: [
      { label: 'Announcements', icon: 'bell' },
      { label: 'Exports', icon: 'download-simple' },
    ],
  },
];

function AdminSidebar({ current = 'Costs', hover }: { current?: string; hover?: string }) {
  return (
    <Sidebar
      aria-label="App navigation"
      className="min-h-screen"
      header={
        <a
          href="#home"
          aria-label="CAF home"
          className="inline-flex rounded-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-inverse"
        >
          <Logo inverse aria-hidden className="h-8" />
        </a>
      }
      footer={
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-label-md-semibold text-neutral-sidebar-content-selected">Maria Kyriakou</span>
          <span className="text-caption-md-regular">Admin</span>
        </span>
      }
    >
      {GROUPS.map((group) => (
        <SidebarGroup key={group.label} label={group.label}>
          {group.links.map((link) => (
            <SidebarLink
              key={link.label}
              href={`#${link.label.toLowerCase().replace(/ /g, '-')}`}
              active={link.label === current}
              icon={<Icon name={link.icon} />}
              data-pseudo={link.label === hover ? 'hover' : undefined}
            >
              {link.label}
            </SidebarLink>
          ))}
        </SidebarGroup>
      ))}
    </Sidebar>
  );
}

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The dark app navigation down the left of the signed-in app, new with the CAF design refresh. ' +
          'Dark in both themes: `neutral.sidebar.*` is slate-900 in Light and slate-950 in Dark. ' +
          '`header` holds the home link with `<Logo inverse>`, `footer` the account, and `children` the SidebarGroups ' +
          '(a visible heading and a list of SidebarLinks). `active` marks the current page with the selected pair.',
      },
    },
  },
  args: { 'aria-label': 'App navigation' },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => <AdminSidebar />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('complementary', { name: 'App navigation' })).toBeInTheDocument();
    await expect(canvas.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    // Each group is a list named by its heading.
    for (const { label, links } of GROUPS) {
      await expect(canvas.getByRole('heading', { name: label })).toBeInTheDocument();
      await expect(canvas.getByRole('list', { name: label }).querySelectorAll('li')).toHaveLength(links.length);
    }
    await expect(canvas.getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('link', { name: 'Drafts' })).not.toHaveAttribute('aria-current');
    await expect(canvas.getByRole('link', { name: 'CAF home' })).toBeInTheDocument();
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

/* Default, Hover (forced on Drafts) and Current (Costs), in each theme. */
const states = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => <AdminSidebar hover="Drafts" />,
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvas }) => {
    const want = {
      surface: tokenColour('neutral-sidebar-surface-default'),
      content: tokenColour('neutral-sidebar-content-default'),
      selected: tokenColour('neutral-sidebar-surface-selected'),
      selectedContent: tokenColour('neutral-sidebar-content-selected'),
    };
    await waitFor(() => {
      const aside = getComputedStyle(canvas.getByRole('complementary', { name: 'App navigation' }));
      expect(aside.backgroundColor).toBe(want.surface);
      const link = (name: string) => getComputedStyle(canvas.getByRole('link', { name }));
      // Default: no fill, the sidebar's content colour.
      expect(link('Bulk upload').backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(link('Bulk upload').color).toBe(want.content);
      // Hover and Current: the selected pair.
      for (const name of ['Drafts', 'Costs']) {
        expect(link(name).backgroundColor).toBe(want.selected);
        expect(link(name).color).toBe(want.selectedContent);
      }
    });
  },
});

export const StatesLight = states('light');
export const StatesDark = states('dark');
