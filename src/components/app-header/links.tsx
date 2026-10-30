import * as React from 'react';
import { NavLink } from '../nav-link';

/**
 * The header's navigation as data: AppHeader and MobileMenu draw the same
 * links, as a horizontal Nav Bar on desktop and as vertical rows in the
 * Mobile Menu.
 *
 * Figma → code: Navigation / Header – Admin and Navigation / Header – User
 * differ only in their links. Their Page property lists them, in order, and
 * marks the current one. In code the links are `links` (label and `href`),
 * and Page is `page`, the current link's label.
 */
export interface AppHeaderLink {
  /** Figma's Label, e.g. "Recurring Costs". `page` matches it. */
  label: string;
  /** Where it goes. */
  href: string;
}

/** What `renderLink` gets for each link: NavLink's props. */
export interface AppHeaderLinkProps {
  href: string;
  /** The label. */
  children: string;
  /** The current page (Figma State=Active): NavLink sets `aria-current="page"`. */
  active: boolean;
  /** `horizontal` in the desktop Nav Bar, `vertical` in the Mobile Menu. */
  orientation: 'horizontal' | 'vertical';
}

/**
 * Renders one link. The default is `<NavLink {...props} />`, an `<a href>`.
 * For a router, return a NavLink that renders its link component:
 * `({ href, ...props }) => <NavLink {...props} as={RouterLink} to={href} />`.
 */
export type AppHeaderRenderLink = (props: AppHeaderLinkProps, link: AppHeaderLink) => React.ReactNode;

export const renderNavLink: AppHeaderRenderLink = (props) => <NavLink {...props} />;

/** Navigation / Header – Admin's Page values: the admin app's ten links, in Figma's order and words. */
export const APP_HEADER_ADMIN_PAGES = [
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

/** Navigation / Header – User's Page values: the user app's five links, in Figma's order and words. */
export const APP_HEADER_USER_PAGES = ['Costs', 'Create Cost', 'Bulk Upload', 'Recurring Costs', 'Drafts'] as const;
