import * as React from 'react';
import type { AccountMenuItem } from '../components/account-menu';
import type { ThemeToggleTheme } from '../components/theme-toggle';
import { ToastProvider } from '../components/toast';
import { AppShell, useDocumentTheme, type ShellApp } from '../patterns/app-shell/AppShell';
import { signedInAccounts } from '../patterns/fixtures';
import { PageHeader } from '../components/page-header';
import { APP_SCREENS } from './screens';

/**
 * TemplateFrame — what every template story renders: a signed-in CAF page as
 * the CAF Design file's Admin screens and User Screens draw it. A story-level
 * scaffold, not a DS component.
 *
 * - The header for the app (`app`: Navigation / Header – Admin or – User; the
 *   Mobile Header below 768px) over AppShell's `<main>` and page container
 *   (each screen's Content frame: 32 above the page, 24 between its parts).
 *   `page` is the link that is Active; `children` is that page.
 * - A ToastProvider around it, for the page's messages.
 * - A link, or Settings in the account menu, moves to that page: one of
 *   APP_SCREENS, or just its title where there is none (Partners).
 *   Coming back to the first page shows `children` again, fresh. Routing goes
 *   no further: `onNavigate` hears every move.
 * - The theme starts from the story's (`globals.theme`); the header's toggle
 *   switches it on `<html>`, as the Theme toolbar does (useDocumentTheme).
 */
export interface TemplateFrameProps {
  /** Header – Admin or Header – User. */
  app: ShellApp;
  /** The page the story opens on: a navigation label ("Costs"), or "Settings". */
  page: string;
  /** The theme the story starts in. */
  theme: ThemeToggleTheme;
  /** Start with the Mobile Menu open (below 768px). */
  defaultMenuOpen?: boolean;
  /** The page the story opens on. */
  children: React.ReactNode;
  /** Called with the page a link (or Settings) moves to. */
  onNavigate?: (page: string) => void;
  /** Called with the account menu item chosen. */
  onAccountSelect?: (item: AccountMenuItem) => void;
}

export function TemplateFrame({
  app,
  page: startPage,
  theme: startTheme,
  defaultMenuOpen,
  children,
  onNavigate,
  onAccountSelect,
}: TemplateFrameProps) {
  const [page, setPage] = React.useState(startPage);
  const [theme, setTheme] = useDocumentTheme(startTheme);
  const go = (next: string) => {
    setPage(next);
    onNavigate?.(next);
  };
  const content = page === startPage ? children : (APP_SCREENS[app][page]?.() ?? <PageHeader title={page} />);

  return (
    <ToastProvider>
      <AppShell
        app={app}
        page={page}
        username={signedInAccounts[app].name}
        theme={theme}
        onThemeChange={setTheme}
        defaultMenuOpen={defaultMenuOpen}
        onNavigate={go}
        onAccountSelect={(item) => {
          onAccountSelect?.(item);
          if (item === 'settings') go('Settings');
        }}
      >
        {/* Keyed by page: a new page starts fresh, as a route does. */}
        <React.Fragment key={page}>{content}</React.Fragment>
      </AppShell>
    </ToastProvider>
  );
}
