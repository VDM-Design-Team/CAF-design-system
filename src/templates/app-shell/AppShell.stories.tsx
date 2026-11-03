import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { APP_HEADER_ADMIN_PAGES, APP_HEADER_USER_PAGES } from '../../components/app-header';
import { expectFrame, expectNoSidewaysScroll, isDesktop, MOBILE_SNAPSHOT, MOBILE_VIEWPORT, navigateTo } from '../checks';
import { APP_SCREENS } from '../screens';
import { TemplateFrame, type TemplateFrameProps } from '../TemplateFrame';

type ShellTemplateProps = Omit<TemplateFrameProps, 'children'>;

/* The frame around the page the story opens on; the links move to the others. */
function ShellTemplate(props: ShellTemplateProps) {
  return <TemplateFrame {...props}>{APP_SCREENS[props.app][props.page]?.()}</TemplateFrame>;
}

const meta = {
  title: 'Templates/App shell',
  component: ShellTemplate,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'The frame every signed-in screen in the CAF Design file shares (Admin screens 2102:4, User Screens 2102:3): ' +
          '**Navigation / Header – Admin** or **– User** over the page container (each screen’s Content frame: 1536 wide ' +
          'at 1920, 32 above the page, 24 between its parts). Below 768px the header is the Mobile Header, and ☰ opens ' +
          'the Mobile Menu. Built from AppShell (pattern 15) and `TemplateFrame` (`src/templates/`), which routes the ' +
          'links to the other templates’ screens: choose a link to move there. Partners and Contacts have no page ' +
          'composition yet, so they show their title only.',
      },
    },
  },
  args: { app: 'admin', page: 'Costs', theme: 'light', onNavigate: fn(), onAccountSelect: fn() },
  /* The theme starts where the toolbar is. */
  render: (args, { globals }) => <ShellTemplate {...args} theme={globals.theme === 'dark' ? 'dark' : 'light'} />,
} satisfies Meta<typeof ShellTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Admin: Header – Admin over the admin’s home page, Costs. The page lines up
 * with the header’s container. A link moves to its page (here Cost Centers),
 * and the Active link moves with it.
 */
export const Admin: Story = {
  play: async ({ args, canvasElement }) => {
    const { banner, main, heading } = await expectFrame(canvasElement, 'Costs');
    // The page sits in the container: its table is in main; the toasts' region is beside it.
    await expect(main).toContainElement(within(main).getByRole('table', { name: 'Costs' }));
    await expect(main).not.toContainElement(screen.getByRole('region', { name: 'Notifications' }));
    await expect(within(banner).getByText('Hi, Admin Account')).toBeInTheDocument();

    if (isDesktop()) {
      const nav = within(banner).getByRole('navigation', { name: 'Main' });
      await expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([...APP_HEADER_ADMIN_PAGES]);
      await expect(within(nav).getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');
      // The page title starts under the logo, below the header.
      const logo = within(banner).getByRole('img', { name: 'CAF' }).getBoundingClientRect();
      await expect(heading.getBoundingClientRect().left).toBeCloseTo(logo.left, 0);
      await expect(heading.getBoundingClientRect().top).toBeGreaterThan(banner.getBoundingClientRect().bottom);
    }

    // A link moves to its page, in the same frame.
    await navigateTo(canvasElement, 'Cost Centers');
    await expect(args.onNavigate).toHaveBeenLastCalledWith('Cost Centers');
    await expectFrame(canvasElement, 'Cost Centers');
    await expect(within(main).getByRole('table', { name: 'Cost centers' })).toBeVisible();
    if (isDesktop()) {
      const nav = within(banner).getByRole('navigation', { name: 'Main' });
      await expect(within(nav).getByRole('link', { name: 'Cost Centers' })).toHaveAttribute('aria-current', 'page');
      await expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
    }
  },
};

/**
 * User: Header – User (five links) over the user’s Costs. Settings, from the
 * account menu (keyboard), is a page of its own: no link is Active there.
 */
export const User: Story = {
  args: { app: 'user' },
  play: async ({ args, canvasElement }) => {
    const { banner, main } = await expectFrame(canvasElement, 'Costs');
    await expect(within(main).getByRole('table', { name: 'Costs' })).toBeInTheDocument();
    // No admin actions on the user's Costs.
    await expect(within(main).queryByRole('button', { name: 'View Audit Logs' })).toBeNull();

    if (isDesktop()) {
      const nav = within(banner).getByRole('navigation', { name: 'Main' });
      await expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([...APP_HEADER_USER_PAGES]);
      await expect(within(banner).getByText('Hi, QA Test')).toBeVisible();
    }

    // Account → Settings from the keyboard: Enter opens the menu on its first item, ↓ moves, Enter chooses.
    const account = within(banner).getByRole('button', { name: 'Account' });
    account.focus();
    await userEvent.keyboard('{Enter}');
    const menu = await within(banner).findByRole('menu');
    await waitFor(() => expect(within(menu).getAllByRole('menuitem')[0]).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(args.onAccountSelect).toHaveBeenLastCalledWith('settings');
    await expect(args.onNavigate).toHaveBeenLastCalledWith('Settings');
    await expectFrame(canvasElement, 'Settings');
    await expect(within(main).getByRole('form', { name: 'My Account Details' })).toBeVisible();
    await expect(banner.querySelectorAll('[aria-current]')).toHaveLength(0);
    // The snapshot shows the page, not a focus ring.
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/* The mobile stories open on form pages. The list pages' tables are wider than 320 and scroll in their own region (the List page template's mobile stories). */

/**
 * Admin below 768px: the Mobile Header over Bulk Upload. The page keeps 16 at
 * the sides and nothing scrolls sideways. ☰ (keyboard) opens the Mobile Menu
 * with Bulk Upload Active; Escape closes it and focus returns to ☰.
 */
export const AdminMobile: Story = {
  name: 'Admin, mobile',
  args: { page: 'Bulk Upload' },
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: async ({ canvasElement }) => {
    const { banner, main, heading } = await expectFrame(canvasElement, 'Bulk Upload');
    await expect(within(main).getByRole('button', { name: 'Upload' })).toBeVisible();
    // The page container's padding: the title starts at it.
    const padding = parseFloat(getComputedStyle(main).paddingLeft);
    await expect(heading.getBoundingClientRect().left).toBeGreaterThanOrEqual(main.getBoundingClientRect().left + padding - 1);
    if (isDesktop()) return;

    await expectNoSidewaysScroll();
    const opener = within(banner).getByRole('button', { name: 'Open menu' });
    opener.focus();
    await userEvent.keyboard('{Enter}');
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    const nav = within(menu).getByRole('navigation', { name: 'Main' });
    await expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([...APP_HEADER_ADMIN_PAGES]);
    await expect(within(nav).getByRole('link', { name: 'Bulk Upload' })).toHaveAttribute('aria-current', 'page');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
    await expect(opener).toHaveFocus();
    opener.blur();
  },
};

/** User below 768px: the Mobile Header over Create Cost, the longest form; it fits the phone. */
export const UserMobile: Story = {
  name: 'User, mobile',
  args: { app: 'user', page: 'Create Cost' },
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { chromatic: MOBILE_SNAPSHOT },
  play: async ({ canvasElement }) => {
    const { main } = await expectFrame(canvasElement, 'New Cost');
    await expect(within(main).getByRole('button', { name: 'Save' })).toBeVisible();
    if (!isDesktop()) await expectNoSidewaysScroll();
  },
};

/** Admin in Dark: the frame and the page follow the theme; the toggle offers Light. */
export const Dark: Story = {
  globals: { theme: 'dark' },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    await expectFrame(canvasElement, 'Costs');
    await expect(document.documentElement).toHaveClass('dark');
    const toggles = within(within(canvasElement).getByRole('banner')).getAllByRole('button', { name: 'Switch to light theme' });
    await expect(toggles.filter((toggle) => toggle.getClientRects().length > 0)).toHaveLength(1);
  },
};
