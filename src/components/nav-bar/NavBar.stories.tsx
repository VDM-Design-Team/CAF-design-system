import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NavLink } from '../nav-link';
import { NavBar, type NavBarProps } from './NavBar';

/* The links Figma's headers draw, in order. */
const USER_LINKS = ['Costs', 'Create Cost', 'Bulk Upload', 'Recurring Costs', 'Drafts'] as const;
const ADMIN_LINKS = [
  'Costs',
  'Bulk Upload',
  'Cost Centers',
  'Partners',
  'Contacts',
  'Users',
  'Recurring Costs',
  'Announcements',
  'Exports',
  'Drafts',
] as const;

const href = (label: string) => `#${label.toLowerCase().replace(/ /g, '-')}`;

/* A Nav Bar whose links go nowhere: a click makes that link the current page, as the headers' Page property does. */
function NavBarDemo({ links, page, ...props }: NavBarProps & { links: readonly string[]; page: string }) {
  const [current, setCurrent] = React.useState(page);
  return (
    <NavBar {...props}>
      {links.map((label) => (
        <NavLink
          key={label}
          href={href(label)}
          active={label === current}
          onClick={(event) => {
            event.preventDefault();
            setCurrent(label);
          }}
        >
          {label}
        </NavLink>
      ))}
    </NavBar>
  );
}

const meta = {
  title: 'Components/NavBar',
  component: NavBar,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation** (`Navigation / Nav Bar`): the row of Nav Links under ' +
          'the Top Bar. A `<nav>` landmark holding a list of NavLinks, horizontal, 8 / 0 padding, no gap. The headers’ ' +
          'Page property is the `active` NavLink: the current page. `aria-label` is required, so each `<nav>` on a page ' +
          'has its own name. Header – User has five links, Header – Admin ten.',
      },
    },
  },
  args: { 'aria-label': 'Main' },
} satisfies Meta<typeof NavBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Navigation / Header – User's five links, Page=Costs. Tab moves through them in order; Enter follows one. */
export const User: Story = {
  render: (args) => <NavBarDemo {...args} links={USER_LINKS} page="Costs" />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main' });
    await expect(within(nav).getAllByRole('listitem')).toHaveLength(USER_LINKS.length);
    const links = within(nav).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([...USER_LINKS]);
    await expect(within(nav).getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');

    // Tab: every link, in order.
    for (const link of links) {
      await userEvent.tab();
      await expect(link).toHaveFocus();
    }
    // Shift+Tab back to Bulk Upload, then Enter: it becomes the current page, and the only one.
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    const bulk = within(nav).getByRole('link', { name: 'Bulk Upload' });
    await expect(bulk).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(bulk).toHaveAttribute('aria-current', 'page');
    await expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
  },
};

/** Navigation / Header – Admin's ten links, Page=Recurring Costs (as in Pattern 15). A click moves the current page. */
export const Admin: Story = {
  render: (args) => <NavBarDemo {...args} links={ADMIN_LINKS} page="Recurring Costs" />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main' });
    await expect(within(nav).getAllByRole('link')).toHaveLength(ADMIN_LINKS.length);
    await expect(within(nav).getByRole('link', { name: 'Recurring Costs' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(nav).getByRole('link', { name: 'Exports' }));
    await expect(within(nav).getByRole('link', { name: 'Exports' })).toHaveAttribute('aria-current', 'page');
    await expect(within(nav).getByRole('link', { name: 'Recurring Costs' })).not.toHaveAttribute('aria-current');
  },
};

/** Links in a fragment are list items too, one each. */
export const FromAFragment: Story = {
  render: (args) => (
    <NavBar {...args}>
      <NavLink href="#costs" active>
        Costs
      </NavLink>
      <>
        <NavLink href="#create-cost">Create Cost</NavLink>
        <NavLink href="#drafts">Drafts</NavLink>
      </>
    </NavBar>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole('listitem');
    await expect(items.map((item) => item.textContent)).toEqual(['Costs', 'Create Cost', 'Drafts']);
  },
};

/* ── Every Page, in Light and Dark ─────────────────────────────────────────
   Header – User's five Page variants and Header – Admin's ten, one Nav Bar
   each. In each, only the Page's link is Active (neutral.tonal.surface fill,
   aria-current); the bar is 8 / 0 padding with the links side by side, no gap. */

const PAGES = [
  ...USER_LINKS.map((page) => ({ group: 'User', links: USER_LINKS as readonly string[], page })),
  ...ADMIN_LINKS.map((page) => ({ group: 'Admin', links: ADMIN_LINKS as readonly string[], page })),
];

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

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Pages — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-2">
      {PAGES.map(({ group, links, page }) => (
        // Fifteen landmarks on one page: each has its own name.
        <NavBar key={`${group} ${page}`} aria-label={`${group} navigation, Page=${page}`}>
          {links.map((label) => (
            <NavLink key={label} href={href(label)} active={label === page}>
              {label}
            </NavLink>
          ))}
        </NavBar>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvas }) => {
    const active = tokenColour('neutral-tonal-surface-default');
    const none = 'rgba(0, 0, 0, 0)';
    await waitFor(() => {
      for (const { group, links, page } of PAGES) {
        const nav = canvas.getByRole('navigation', { name: `${group} navigation, Page=${page}` });
        expect(getComputedStyle(nav).padding).toBe('8px 0px');
        const anchors = [...nav.querySelectorAll<HTMLAnchorElement>('a')];
        expect(anchors.map((a) => a.textContent)).toEqual([...links]);
        anchors.forEach((a, i) => {
          const current = a.textContent === page;
          expect(a.getAttribute('aria-current')).toBe(current ? 'page' : null);
          expect(getComputedStyle(a).backgroundColor).toBe(current ? active : none);
          // Side by side, no gap, tops aligned.
          if (i > 0) {
            const prev = anchors[i - 1].getBoundingClientRect();
            const box = a.getBoundingClientRect();
            expect(box.left).toBe(prev.right);
            expect(box.top).toBe(prev.top);
          }
        });
      }
    });
  },
});

export const PagesLight = grid('light');
export const PagesDark = grid('dark');
