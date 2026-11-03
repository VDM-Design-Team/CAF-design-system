import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ACCOUNT_MENU_ITEMS } from '../../components/account-menu';
import type { ThemeToggleTheme } from '../../components/theme-toggle';
import { ToastProvider, useToast } from '../../components/toast';
import { AppShell, useDocumentTheme } from '../app-shell/AppShell';
import { managedCurrencies, signedInAccounts } from '../fixtures';
import { PageHeader } from '../../components/page-header';
import { ManageCurrenciesDialog } from './ManageCurrenciesDialog';
import { SettingsPage, type AccountDetails } from './SettingsPage';

interface AccountDemoProps {
  /** The page the story starts on: Costs (the home page) or Settings. */
  page: string;
  /** Whether Manage Currencies starts open. */
  currenciesOpen?: boolean;
  theme: ThemeToggleTheme;
  onSave?: (details: AccountDetails) => void;
  onEnabledChange?: (code: string, enabled: boolean) => void;
  onLogout?: () => void;
}

/* The user app around the account menu: it opens Manage Currencies, goes to
   Settings, or signs out. Changes are confirmed with a Toast (U06). */
function AccountApp({ page: startPage, currenciesOpen = false, theme: startTheme, onSave, onEnabledChange, onLogout }: AccountDemoProps) {
  const { toast } = useToast();
  const [page, setPage] = useState(startPage);
  const [theme, setTheme] = useDocumentTheme(startTheme);
  const [account, setAccount] = useState<AccountDetails>({
    email: signedInAccounts.user.email,
    name: signedInAccounts.user.name,
  });
  const [currencies, setCurrencies] = useState(managedCurrencies);
  const [dialogOpen, setDialogOpen] = useState(currenciesOpen);

  return (
    <>
      <AppShell
        app="user"
        page={page}
        username={account.name}
        theme={theme}
        onThemeChange={setTheme}
        onNavigate={setPage}
        onAccountSelect={(item) => {
          if (item === 'manage-currencies') setDialogOpen(true);
          else if (item === 'settings') setPage('Settings');
          else onLogout?.();
        }}
      >
        {page === 'Settings' ? (
          <SettingsPage
            account={account}
            onSave={(details) => {
              setAccount(details);
              onSave?.(details);
              toast({ type: 'success', message: 'Account details saved.' });
            }}
          />
        ) : (
          <PageHeader title={page} />
        )}
      </AppShell>
      <ManageCurrenciesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        currencies={currencies}
        onEnabledChange={(currency, enabled) => {
          setCurrencies((all) => all.map((c) => (c.code === currency.code ? { ...c, enabled } : c)));
          onEnabledChange?.(currency.code, enabled);
          toast({ type: 'success', message: `${currency.name} ${enabled ? 'enabled' : 'disabled'}.` });
        }}
      />
    </>
  );
}

function AccountDemo(props: AccountDemoProps) {
  return (
    <ToastProvider>
      <AccountApp {...props} />
    </ToastProvider>
  );
}

const meta = {
  title: 'Patterns/Account, settings & currencies',
  component: AccountDemo,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern U06 (Figma 545:23189): what sits behind the account icon in the user header. The Account Menu lists ' +
          'Manage Currencies, Settings and Logout. Manage Currencies is a dialog (`ManageCurrenciesDialog`): a table of ' +
          'currencies with an Enabled Toggle each and pagination; a toggle applies at once and a Toast confirms it. ' +
          'Settings is its own page (`SettingsPage`): My Account Details, Email and Name, and Save, which checks the ' +
          'form and confirms with a Toast. Logout ends the session (the app’s job; here it calls `onLogout`).',
      },
    },
  },
  args: {
    page: 'Costs',
    theme: 'light',
    onSave: fn(),
    onEnabledChange: fn(),
    onLogout: fn(),
  },
  render: (args, { globals }) => <AccountDemo {...args} theme={globals.theme === 'dark' ? 'dark' : 'light'} />,
} satisfies Meta<typeof AccountDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

const rowNames = (table: HTMLElement) =>
  within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent);

/* Toasts close on their own after 5 seconds; a flow dismisses them so its last frame is stable. */
async function dismissToasts() {
  const region = screen.getByRole('region', { name: 'Notifications' });
  for (const button of within(region).queryAllByRole('button', { name: 'Dismiss' })) await userEvent.click(button);
  await waitFor(() => expect(within(region).queryAllByRole('button', { name: 'Dismiss' })).toHaveLength(0));
}

/**
 * U06, steps 1 to 3 and Logout, from the keyboard where it matters: the account
 * icon opens the menu; Manage Currencies opens the dialog, where a Toggle turns a
 * currency on and a Toast confirms it; Escape closes it and focus goes back to
 * the icon; Settings opens its page; Logout ends the session.
 */
export const Flow: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const banner = canvas.getByRole('banner');
    const main = canvas.getByRole('main');
    const account = within(banner).getByRole('button', { name: 'Account' });

    // Step 1: Enter on the account icon opens the menu on its first item.
    account.focus();
    await userEvent.keyboard('{Enter}');
    const menu = await within(banner).findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    await expect(items.map((item) => item.textContent)).toEqual(ACCOUNT_MENU_ITEMS.map((item) => item.label));
    await waitFor(() => expect(items[0]).toHaveFocus());

    // Step 2: Manage Currencies opens the dialog.
    await userEvent.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Manage Currencies' });
    // It takes focus as it opens; wait for that before moving focus inside it.
    await waitFor(() => expect(dialog).toHaveFocus());
    const table = within(dialog).getByRole('table', { name: 'Currencies' });
    await expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Currency Name',
      'Code',
      'Enabled',
    ]);
    await expect(rowNames(table)).toEqual(managedCurrencies.slice(0, 7).map((c) => c.name));

    // Space on Albanian Lek's switch turns it on at once; a Toast confirms it.
    const lek = within(dialog).getByRole('switch', { name: 'Enable Albanian Lek' });
    await expect(lek).not.toBeChecked();
    lek.focus();
    await userEvent.keyboard(' ');
    await expect(lek).toBeChecked();
    await expect(args.onEnabledChange).toHaveBeenLastCalledWith('ALL', true);
    await expect(await screen.findByText('Albanian Lek enabled.')).toBeInTheDocument();

    // The next page of currencies.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Page 2' }));
    await expect(rowNames(table)).toEqual(managedCurrencies.slice(7, 14).map((c) => c.name));

    // Escape closes it; focus goes back to the account icon.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(account).toHaveFocus();

    // Opened again, it starts on page 1, and the change has stuck.
    await userEvent.click(account);
    await userEvent.click(await within(banner).findByRole('menuitem', { name: 'Manage Currencies' }));
    const again = await screen.findByRole('dialog', { name: 'Manage Currencies' });
    await expect(within(again).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await expect(within(again).getByRole('switch', { name: 'Enable Albanian Lek' })).toBeChecked();
    await userEvent.click(within(again).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    // Step 3: Settings opens its own page. It isn't in the navigation, so no link is current.
    await userEvent.click(account);
    await userEvent.click(await within(banner).findByRole('menuitem', { name: 'Settings' }));
    await expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Settings');
    await expect(within(main).getByRole('form', { name: 'My Account Details' })).toBeVisible();
    await expect(within(banner).getByRole('navigation', { name: 'Main' }).querySelectorAll('[aria-current]')).toHaveLength(0);

    // Logout ends the session.
    await userEvent.click(account);
    await userEvent.click(await within(banner).findByRole('menuitem', { name: 'Logout' }));
    await expect(args.onLogout).toHaveBeenCalledTimes(1);

    await dismissToasts();
  },
};

/** U06, step 1: the account icon, top right, lists Manage Currencies, Settings and Logout. */
export const AccountMenuOpen: Story = {
  name: 'Account menu',
  play: async ({ canvasElement }) => {
    const banner = within(canvasElement).getByRole('banner');
    await userEvent.click(within(banner).getByRole('button', { name: 'Account' }));
    const menu = await within(banner).findByRole('menu');
    await expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Manage Currencies',
      'Settings',
      'Changelog',
      'Logout',
    ]);
    // Figma's divider sits between Changelog and Logout.
    const separator = within(menu).getByRole('separator');
    await expect(separator.previousElementSibling).toHaveTextContent('Changelog');
    await expect(separator.nextElementSibling).toHaveTextContent('Logout');
  },
};

/**
 * U06, step 2: Manage Currencies, open. Currency Name, Code and an Enabled
 * Toggle, seven to a page; no footer (× or Escape closes it). Paged from the
 * keyboard, inside the dialog's focus trap.
 */
export const ManageCurrencies: Story = {
  name: 'Manage Currencies',
  args: { currenciesOpen: true },
  // An open dialog makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Manage Currencies' });
    // It takes focus as it opens (in the static build, after it appears); wait before moving focus.
    await waitFor(() => expect(dialog).toHaveFocus());
    const table = within(dialog).getByRole('table', { name: 'Currencies' });
    await expect(rowNames(table)).toEqual(managedCurrencies.slice(0, 7).map((c) => c.name));
    const switches = within(table).getAllByRole('switch');
    await expect(switches.map((s) => (s as HTMLInputElement).checked)).toEqual([true, true, true, true, true, true, false]);
    // Rebuilt from the table parts: a Table / Header Row (its 1px line under it, labels 16 in) over Table / Rows,
    // each Toggle in a Table / Cell Type=Custom, 16 in, at the Enabled label's x.
    const head = table.querySelector('thead tr')!;
    await expect(getComputedStyle(head).borderBottomWidth).toBe('1px');
    const enabled = within(table).getByRole('columnheader', { name: 'Enabled' });
    const label = enabled.querySelector('span')!.getBoundingClientRect().left;
    await expect(label - enabled.getBoundingClientRect().left).toBe(16);
    for (const toggle of switches) {
      const cell = toggle.closest('td')!;
      const box = toggle.parentElement!.getBoundingClientRect();
      await expect(box.left - cell.getBoundingClientRect().left).toBe(16);
      await expect(box.left).toBe(label);
    }
    // Figma's dialog has no footer: × is its only button outside the table and the pages.
    await expect(within(dialog).queryByRole('button', { name: 'Cancel' })).toBeNull();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toBeVisible();

    // Pages: ‹ is off on the first; page 3 holds the last seven.
    const pages = within(dialog).getByRole('navigation', { name: 'Pagination' });
    await expect(within(pages).getByRole('button', { name: 'Previous page' })).toBeDisabled();
    within(pages).getByRole('button', { name: 'Page 3' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(rowNames(table)).toEqual(managedCurrencies.slice(14).map((c) => c.name));
    await expect(within(pages).getByRole('button', { name: 'Next page' })).toBeDisabled();

    // Tab stays in the dialog: past › it wraps to ×.
    within(pages).getByRole('button', { name: 'Previous page' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(rowNames(table)).toEqual(managedCurrencies.slice(7, 14).map((c) => c.name));
    within(pages).getByRole('button', { name: 'Page 1' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(rowNames(table)).toEqual(managedCurrencies.slice(0, 7).map((c) => c.name));
    within(pages).getByRole('button', { name: 'Next page' }).focus();
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
  },
};

/**
 * U06, step 3: Settings, its own page. Save checks the form: an empty or
 * malformed field shows its error and takes focus; a valid one saves (the form's
 * FormData), a Toast confirms it and the header greets the new name.
 */
export const Settings: Story = {
  args: { page: 'Settings' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const main = canvas.getByRole('main');
    const form = within(main).getByRole('form', { name: 'My Account Details' });
    const email = within(form).getByRole('textbox', { name: /Email/ });
    const name = within(form).getByRole('textbox', { name: /Name/ });
    const save = within(form).getByRole('button', { name: 'Save' });
    await expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Settings');
    await expect(within(main).getByRole('heading', { level: 2 })).toHaveTextContent('My Account Details');
    await expect(email).toHaveValue('qa.test@example.com');
    await expect(name).toHaveValue('QA Test');

    // An empty Name and a malformed Email: both errors, focus on the first.
    await userEvent.clear(name);
    await userEvent.clear(email);
    await userEvent.type(email, 'qa.test');
    await userEvent.click(save);
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription('Enter a valid email address.');
    await expect(name).toHaveAccessibleDescription('Name is required.');
    await expect(email).toHaveFocus();
    await expect(args.onSave).not.toHaveBeenCalled();

    // Fixed, and saved from the keyboard (Enter submits).
    await userEvent.type(email, '@example.com');
    await userEvent.type(name, 'QA Tester');
    await userEvent.keyboard('{Enter}');
    await expect(args.onSave).toHaveBeenLastCalledWith({ email: 'qa.test@example.com', name: 'QA Tester' });
    await expect(email).not.toHaveAttribute('aria-invalid');
    await expect(name).not.toHaveAttribute('aria-invalid');
    await expect(await screen.findByText('Account details saved.')).toBeVisible();
    await expect(within(canvas.getByRole('banner')).getByText('Hi, QA Tester')).toBeVisible();

    // The form sits in a centred column: as wide as Figma's card (max-w-xl), in the middle of the page.
    const box = form.getBoundingClientRect();
    const page = main.firstElementChild!.getBoundingClientRect();
    await expect((box.left + box.right) / 2).toBeCloseTo((page.left + page.right) / 2, 0);

    await dismissToasts();
  },
};

/** U06, step 2, in Dark. */
export const Dark: Story = {
  args: { currenciesOpen: true },
  globals: { theme: 'dark' },
  tags: ['!autodocs'],
  play: async () => {
    await expect(document.documentElement).toHaveClass('dark');
    const dialog = await screen.findByRole('dialog', { name: 'Manage Currencies' });
    await expect(within(dialog).getAllByRole('switch')).toHaveLength(7);
  },
};
