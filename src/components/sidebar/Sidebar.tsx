import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Sidebar — the dark app navigation down the left of the signed-in app, new
 * with the CAF design refresh (canvas "Signed-in app", 23 Nov 2026). It
 * replaces the Top Bar and Nav Bar on desktop. Its colours follow the colour
 * decisions of 23 Nov 2026: slate-900 in Light, slate-950 in Dark
 * (`neutral.sidebar.*`), so it is dark in both themes.
 *
 * - Sidebar → `<aside>`, named by `aria-label` ("App navigation"). `header`
 *   holds the home link (`<Logo inverse>` in a link); `footer`, under a
 *   line, holds the account (who is signed in, the theme toggle, the
 *   account menu). `children` are SidebarGroups.
 * - SidebarGroup → a labelled group of links ("Costs", "Manage", "System"):
 *   the label is a visible heading, and the links are a list named by it.
 *   Put the groups in one `<nav aria-label="Main">`, which Sidebar does.
 * - SidebarLink → one link, with an optional leading icon. `active` marks
 *   the current page (`aria-current="page"`) with the selected pair.
 *
 * Hover uses the selected pair too: the design draws hover as a fainter tint
 * of the current item's, and there is no hover token yet. The focus ring is
 * stroke.inverse (white), as the design's; stroke.focused (caf-blue-500) is
 * too dark on the sidebar. The design's collapsed mobile version and the
 * count badge (Disputes) are not built yet.
 */
export interface SidebarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'aria-label'> {
  /** Names the landmark, e.g. "App navigation". */
  'aria-label': string;
  /** The top: the home link, with `<Logo inverse>`. */
  header?: React.ReactNode;
  /** The bottom, under a line: the account. */
  footer?: React.ReactNode;
  /** Names the `<nav>` that holds the groups. Default "Main". */
  navLabel?: string;
}

export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { className, header, footer, navLabel = 'Main', children, ...props },
  ref,
) {
  return (
    <aside
      ref={ref}
      className={cn(
        /* 256 wide, 20 / 12 padding, 20 between header, groups and footer. */
        'flex w-64 shrink-0 flex-col gap-5 px-3 py-5',
        'bg-neutral-sidebar-surface-default text-neutral-sidebar-content-default',
        className,
      )}
      {...props}
    >
      {header && <div className="flex min-h-10 items-center justify-between gap-3 px-2">{header}</div>}
      <nav aria-label={navLabel} className="flex flex-col gap-5">
        {children}
      </nav>
      {footer && (
        /* mt-auto: the footer sits at the bottom. The line is the selected item's fill, faint on the sidebar. */
        <div className="mt-auto flex items-center gap-2 border-t border-neutral-sidebar-surface-selected px-2 pt-4">
          {footer}
        </div>
      )}
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The group's visible heading, e.g. "Costs". It also names the list. */
  label: string;
}

export const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(function SidebarGroup(
  { className, label, children, ...props },
  ref,
) {
  const id = React.useId();
  return (
    <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
      <h2 id={id} className="px-3 text-caption-sm-bold uppercase">
        {label}
      </h2>
      <ul aria-labelledby={id} className="flex flex-col gap-0.5">
        {React.Children.toArray(children).map((child, index) => (
          <li key={React.isValidElement(child) && child.key != null ? child.key : index} className="flex">
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
});
SidebarGroup.displayName = 'SidebarGroup';

interface SidebarLinkOwnProps {
  /** The current page: `aria-current="page"` and the selected pair. */
  active?: boolean;
  /** A leading icon, e.g. `<Icon name="currency-circle-dollar" />`. It is decorative. */
  icon?: React.ReactNode;
}

/** SidebarLink's props: its own, plus those of the element or component it renders (`<a>` by default). */
export type SidebarLinkProps<E extends React.ElementType = 'a'> = SidebarLinkOwnProps & {
  /** The element or link component to render, e.g. a router's `Link`. Default `a`. */
  as?: E;
} & Omit<React.ComponentPropsWithRef<E>, keyof SidebarLinkOwnProps | 'as'>;

type SidebarLinkComponent = (<E extends React.ElementType = 'a'>(
  props: SidebarLinkProps<E>,
) => React.ReactElement | null) & { displayName?: string };

interface SidebarLinkImplProps extends SidebarLinkOwnProps, React.AnchorHTMLAttributes<HTMLAnchorElement> {
  as?: React.ElementType;
}

const SidebarLinkImpl = React.forwardRef<Element, SidebarLinkImplProps>(function SidebarLink(
  { as: Component = 'a', active = false, icon, className, children, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      aria-current={active ? 'page' : undefined}
      {...props}
      className={cn(
        /* 40 high, 12 at the sides, 12 between icon and label, radius 8. */
        'flex min-h-10 w-full items-center gap-3 rounded-8 px-3 text-label-md-semibold transition-colors',
        active
          ? 'bg-neutral-sidebar-surface-selected text-neutral-sidebar-content-selected'
          : 'text-neutral-sidebar-content-default hover:bg-neutral-sidebar-surface-selected hover:text-neutral-sidebar-content-selected',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-inverse',
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="flex shrink-0">
          {icon}
        </span>
      )}
      {children}
    </Component>
  );
});

export const SidebarLink = SidebarLinkImpl as unknown as SidebarLinkComponent;
SidebarLink.displayName = 'SidebarLink';
