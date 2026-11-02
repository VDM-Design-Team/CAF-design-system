import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { THEME_TOGGLE_LABELS, type ThemeToggleTheme } from '../../components/theme-toggle';
import { TOAST_DURATION, ToastProvider, useToast } from '../../components/toast';
import { UserActions } from '../../components/user-actions';
import { toastMessages, users } from '../fixtures';
import { PageHeader } from '../page/PageHeader';
import { UsersPage } from '../states/UsersPage';

/* Step 1 · Toast: the result of an action (528:6052): Figma's four, newest last. They stay up here
   (`duration: null`) so the reference holds still; in the app Success and Info close after 5 seconds. */
function ToastsScreen() {
  const { toast, dismiss } = useToast();
  useEffect(() => {
    const ids = [
      toast({ type: 'success', message: toastMessages.costSaved, duration: null }),
      toast({ type: 'info', message: toastMessages.exportStarted, duration: null }),
      toast({ type: 'warning', message: toastMessages.rowsSkipped }),
    ];
    const failed = toast({
      type: 'error',
      message: toastMessages.uploadFailed,
      showAction: true,
      action: 'Retry',
      /* Retry runs the upload again; this time it works. */
      onAction: () => {
        dismiss(failed);
        toast({ type: 'success', message: 'Costs uploaded.' });
      },
    });
    return () => [...ids, failed].forEach(dismiss);
  }, [toast, dismiss]);
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title="Costs" />
    </main>
  );
}

/* Step 4 · Tooltip: name an icon (528:6316): the header's icon buttons, the theme toggle named by its tooltip. */
function TooltipScreen() {
  const [theme, setTheme] = useState<ThemeToggleTheme>('dark');
  return (
    <main className="flex flex-col gap-6 p-6 pb-32">
      <h1 className="sr-only">Header icons</h1>
      <UserActions username="Admin Account" theme={theme} onThemeChange={setTheme} className="self-end" />
    </main>
  );
}

const meta = {
  title: 'Patterns/Feedback messages',
  component: UsersPage,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pattern 12 (Figma 528:6347): four ways to tell the user something, from quick to persistent; pick the ' +
          'lightest that does the job. A **Toast** is the result of an action just taken (bottom right; Success and ' +
          'Info close after about 5 seconds, Warning and Error stay; one short action such as Retry). An inline ' +
          '**Alert** is context that stays on screen while the user works (Add New User’s “Temporary password”). A ' +
          'field error sits under its field, says how to fix it, and clears as soon as the value is valid. A ' +
          '**Tooltip** names an icon-only button. The Users page is `UsersPage` (pattern 11) with `AddUserDialog` ' +
          '(`src/patterns/feedback/`).',
      },
    },
  },
} satisfies Meta<typeof UsersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const field = (dialog: HTMLElement, name: string) => within(dialog).getByRole('textbox', { name });

/**
 * The whole flow on Add New User: the Info Alert stays while the form is filled in; Save checks the
 * fields and puts each error under its field, with focus on the first; an error clears as soon as the
 * value is valid; Save submits; the dialog closes, focus goes back to Add New, the user is in the list,
 * and a Success toast reports it, then closes on its own.
 */
export const AddAUser: Story = {
  name: 'Alert, field errors and a toast',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const addNew = canvas.getByRole('button', { name: 'Add New' });
    await userEvent.click(addNew);
    const dialog = await screen.findByRole('dialog', { name: 'Add New User' });

    // The Info Alert: inside the dialog, under the fields, above the footer.
    const alert = within(dialog).getByRole('status');
    await expect(alert).toHaveTextContent('Temporary password');
    const save = within(dialog).getByRole('button', { name: 'Save' });
    // Document order, not geometry: in a short viewport the body scrolls under the fixed footer.
    await expect(within(dialog).getByRole('textbox', { name: 'Email' }).compareDocumentPosition(alert)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    await expect(alert.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Save with nothing filled in: an error under each required field, focus on the first.
    await userEvent.click(save);
    const name = field(dialog, 'Name');
    const email = field(dialog, 'Email');
    await waitFor(() => expect(name).toHaveFocus());
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription('Enter a name.');
    await expect(email).toHaveAccessibleDescription('Enter a valid email address, like name@company.com.');
    await expect(screen.queryByRole('dialog', { name: 'Add New User' })).toBeVisible();

    // The name's error clears as soon as there is one.
    await userEvent.type(name, 'Maria Santos');
    await expect(name).not.toHaveAttribute('aria-invalid', 'true');
    await expect(within(dialog).queryByText('Enter a name.')).toBeNull();

    // Figma's Step 3: "maria.santos@" is still wrong; finishing the address clears it.
    await userEvent.type(email, 'maria.santos@');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(email, 'geekee.com');
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    // The Alert is still there: it stays while the user works.
    await expect(alert).toBeVisible();

    // Restricted User (Space), then Save from the keyboard. (Save is in the footer, tied to the form by its
    // `form` attribute; user-event's Enter-in-a-field only looks inside the form, so the play presses Save.)
    within(dialog).getByRole('checkbox', { name: 'Restricted User' }).focus();
    await userEvent.keyboard(' ');
    save.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(addNew).toHaveFocus();

    // The new user is in the list, with what the form submitted.
    const table = canvas.getByRole('table', { name: 'Users' }) as HTMLTableElement;
    const rows = table.tBodies[0].rows;
    await expect(rows).toHaveLength(users.length + 1);
    await expect(rows[rows.length - 1]).toHaveTextContent('Maria Santosmaria.santos@geekee.comRestricted User');

    // A Success toast: the result of the action. It closes on its own.
    const notifications = canvas.getByRole('region', { name: 'Notifications' });
    const toast = within(notifications).getByText('User added.').closest<HTMLElement>('[data-toast-id]')!;
    await expect(toast).toHaveAttribute('data-duration', String(TOAST_DURATION));
  },
};

/** Step 2 · Alert: context that stays (528:6194): Add New User, open, filled in as Figma shows it. */
export const AlertThatStays: Story = {
  name: 'Alert that stays',
  args: { dialogOpen: true },
  // An open dialog makes the rest of the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Add New User' });
    await userEvent.type(field(dialog, 'Name'), 'Maria Santos');
    await userEvent.type(field(dialog, 'Email'), 'maria.santos@geekee.com');
    await expect(within(dialog).getByRole('combobox', { name: 'Role' })).toHaveTextContent('User');
    await expect(within(dialog).getByRole('status')).toHaveTextContent(
      'Temporary passwordA temporary password is emailed to the user. They’ll be asked to change it the first time they sign in.',
    );
  },
};

/**
 * Step 1 · Toasts: short, past tense, specific; an error says what to do next. Bottom right, newest
 * last. Warning and Error stay until dismissed; the Error carries Retry, which runs the upload again.
 */
export const Toasts: Story = {
  render: () => <ToastsScreen />,
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Notifications' });
    const toasts = () => Array.from(region.querySelectorAll<HTMLElement>('[data-toast-id]'));
    await waitFor(() => expect(toasts()).toHaveLength(4));
    await expect(toasts().map((t) => t.textContent)).toEqual([
      toastMessages.costSaved,
      toastMessages.exportStarted,
      toastMessages.rowsSkipped,
      `${toastMessages.uploadFailed}Retry`,
    ]);
    // Bottom right: the stack hugs the viewport's right and bottom edges, 16px in.
    const last = toasts()[3].getBoundingClientRect();
    await expect(Math.round(window.innerWidth - last.right)).toBe(16);
    await expect(Math.round(window.innerHeight - last.bottom)).toBe(16);
    // Warning and Error have no timer.
    await expect(toasts()[2]).not.toHaveAttribute('data-duration');
    await expect(toasts()[3]).not.toHaveAttribute('data-duration');

    // Retry (from the keyboard): the error goes, the upload works this time.
    within(toasts()[3]).getByRole('button', { name: 'Retry' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(within(region).queryByText(toastMessages.uploadFailed)).toBeNull());
    await expect(within(region).getByText('Costs uploaded.')).toBeVisible();
  },
};

/**
 * Step 4 · Tooltip: name an icon. The theme toggle is icon-only, so its tooltip names it; it shows on
 * hover and on keyboard focus, and Escape hides it. Its text follows the theme.
 */
export const Tooltip: Story = {
  render: () => <TooltipScreen />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: THEME_TOGGLE_LABELS.dark });
    await userEvent.hover(toggle);
    const tip = await canvas.findByRole('tooltip');
    await expect(tip).toHaveTextContent(THEME_TOGGLE_LABELS.dark);
    await userEvent.unhover(toggle);
    await waitFor(() => expect(canvas.queryByRole('tooltip')).toBeNull());

    // Keyboard focus shows it too; Escape hides it without moving focus.
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await expect(await canvas.findByRole('tooltip')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('tooltip')).toBeNull());
    await expect(toggle).toHaveFocus();

    // Pressing it switches the theme, and the name follows.
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('button', { name: THEME_TOGGLE_LABELS.light })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await expect(await canvas.findByRole('tooltip')).toHaveTextContent(THEME_TOGGLE_LABELS.light);
  },
};

/** Dark: Add New User with a field error and the Alert. */
export const Dark: Story = {
  args: { dialogOpen: true },
  globals: { theme: 'dark' },
  // The theme is set on <html>, and an open dialog makes the docs page inert.
  tags: ['!autodocs'],
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Add New User' });
    await userEvent.type(field(dialog, 'Name'), 'Maria Santos');
    await userEvent.type(field(dialog, 'Email'), 'maria.santos@');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(field(dialog, 'Email')).toHaveFocus());
    await expect(field(dialog, 'Email')).toHaveAccessibleDescription('Enter a valid email address, like name@company.com.');
  },
};
