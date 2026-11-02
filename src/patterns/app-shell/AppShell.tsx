import * as React from 'react';
import {
  AppHeader,
  APP_HEADER_ADMIN_PAGES,
  APP_HEADER_USER_PAGES,
  type AppHeaderLink,
  type AppHeaderProps,
} from '../../components/app-header';
import { NavLink } from '../../components/nav-link';
import type { ThemeToggleTheme } from '../../components/theme-toggle';

/**
 * AppShell — a story-level page frame, not a library component: patterns 15
 * and U08 ("App shell & navigation", 530:7799 and 545:26643). Every signed-in
 * CAF page is the header over the page: AppHeader (Header – Admin or Header –
 * User; Mobile Header and Mobile Menu below 768px) and one `<main>` under it.
 *
 * Figma → code:
 * - Header – Admin / Header – User → `app`: the admin's ten links or the
 *   user's five (APP_HEADER_ADMIN_PAGES, APP_HEADER_USER_PAGES).
 * - Page → `page`, the current page. A page outside the navigation (Settings,
 *   U06) matches no link, so none is current.
 * - The screens' Content frame (32 top and 192 at the sides of a 1920 screen;
 *   24 / 16 on a phone) → `<main>`: `pt-8 px-6` around the header's own
 *   centred `container`, so the page lines up with the logo and the first
 *   link; `pt-6 px-4` below 768px.
 *
 * Routing isn't wired in: a click on a link calls `onNavigate` with its label
 * and stays on the story, as a router's link would. Everything else (the
 * theme, the account menu, the mobile menu) is AppHeader's own API.
 */
export type ShellApp = 'admin' | 'user';

const href = (label: string) => `#${label.toLowerCase().replace(/ /g, '-')}`;

/** Each app's navigation, in Figma's order and words. */
export const SHELL_LINKS: Record<ShellApp, AppHeaderLink[]> = {
  admin: APP_HEADER_ADMIN_PAGES.map((label) => ({ label, href: href(label) })),
  user: APP_HEADER_USER_PAGES.map((label) => ({ label, href: href(label) })),
};

export interface AppShellProps extends Omit<AppHeaderProps, 'links' | 'renderLink' | 'children' | 'className'> {
  /** Header – Admin or Header – User. */
  app: ShellApp;
  /** Called with a link's label when it is chosen. Leave it out to let the links go to their `href`. */
  onNavigate?: (page: string) => void;
  /** The page, inside `<main>`. */
  children?: React.ReactNode;
}

export function AppShell({ app, onNavigate, children, ...header }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        {...header}
        links={SHELL_LINKS[app]}
        renderLink={(props) => (
          <NavLink
            {...props}
            onClick={(event) => {
              if (!onNavigate) return;
              event.preventDefault();
              onNavigate(props.children);
            }}
          />
        )}
      />
      <main className="flex-1 px-4 pt-6 pb-16 md:px-6 md:pt-8">
        <div className="container mx-auto flex flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}

/**
 * The app's side of ThemeToggle, for stories: it switches CAF's theme where
 * Storybook's Theme toolbar does, the `.dark` class on `<html>` (so portalled
 * overlays follow), and gives the document back as it found it on unmount.
 * Start it from the story's `globals.theme`. Pattern 15 says the app also
 * remembers the choice; a story doesn't, so one story never changes the next.
 */
export function useDocumentTheme(initial: ThemeToggleTheme): [ThemeToggleTheme, (theme: ThemeToggleTheme) => void] {
  const [theme, setTheme] = React.useState(initial);
  /* First, so it records the theme the toolbar set, before this story changes it. */
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    const was = root.classList.contains('dark');
    return () => {
      root.classList.toggle('dark', was);
    };
  }, []);
  /* Every render: a toolbar re-render resets the class, and this puts the story's back. */
  React.useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  });
  return [theme, setTheme];
}
