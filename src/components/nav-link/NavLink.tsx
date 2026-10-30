import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * NavLink — built from the CAF Figma library, page "Navigation": two sets
 * with the same State property, drawn by one component.
 * - `Navigation / Nav Link` (446:11508): one link in the header's Nav Bar.
 * - `Navigation / Nav Link – Vertical` (462:807): a full-width row in the
 *   Mobile Menu.
 *
 * Figma → code:
 * - The two sets → `orientation`: `horizontal` (Nav Link, default) or
 *   `vertical` (Nav Link – Vertical). They share the structure (a label in a
 *   padded, rounded box) and differ only in type, padding and colours.
 * - State=Active → `active`: the current page. It sets `aria-current="page"`.
 * - State=Hover  → `:hover` (not on the Active link: Figma has no Active +
 *   Hover).
 * - State=Default → neither.
 * - Label → `children`.
 *
 * It is an `<a>`: pass `href`. For a router's link, pass its component as
 * `as` (`<NavLink as={RouterLink} to="/costs">`); NavLink gives it the classes
 * and `aria-current`, and every other prop.
 *
 * Every colour and type style is the one the Figma layer is bound to. Figma
 * has no Focus state; the ring is stroke.focused, as on Button. Where code
 * departs from Figma, the reason is in docs/figma-sync.md ("NavLink").
 */
export const navLinkVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-6 px-3 py-2 transition-colors',
    // Figma has no Focus state; the ring is stroke.focused, as on Button.
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  ],
  {
    variants: {
      orientation: {
        /* Nav Link: 8 / 12 padding, radius 6 (raw). Label: Body/sm-regular, text.primary in every state. */
        horizontal: 'text-body-sm-regular text-text-primary',
        /* Nav Link – Vertical: the menu's full width, 10 / 12 padding (raw 10 → space.8), radius 6 (raw).
           Label: Body/md-medium. */
        vertical: 'w-full text-body-md-medium',
      },
      active: { true: '', false: '' },
    },
    compoundVariants: [
      /* Nav Link, Default: no fill. Hover: neutral.tonal.surface fill. */
      { orientation: 'horizontal', active: false, className: 'hover:bg-neutral-tonal-surface-default' },
      /* Nav Link, Active: the same neutral.tonal.surface fill as Hover. */
      { orientation: 'horizontal', active: true, className: 'bg-neutral-tonal-surface-default' },
      /* Vertical, Default: no fill, text.secondary. Hover: surface.neutral.faint fill, text.primary. */
      {
        orientation: 'vertical',
        active: false,
        className: 'text-text-secondary hover:bg-surface-neutral-faint hover:text-text-primary',
      },
      /* Vertical, Active: surface.base fill, text.primary. */
      { orientation: 'vertical', active: true, className: 'bg-surface-base text-text-primary' },
    ],
    defaultVariants: { orientation: 'horizontal', active: false },
  },
);

export const NAV_LINK_ORIENTATIONS = ['horizontal', 'vertical'] as const;

interface NavLinkOwnProps {
  /** Figma State=Active: this link is the current page (`aria-current="page"`). */
  active?: boolean;
  /** `horizontal`: Navigation / Nav Link (default). `vertical`: Navigation / Nav Link – Vertical. */
  orientation?: (typeof NAV_LINK_ORIENTATIONS)[number];
}

/** NavLink's props: its own, plus those of the element or component it renders (`<a>` by default). */
export type NavLinkProps<E extends React.ElementType = 'a'> = NavLinkOwnProps & {
  /** The element or link component to render, e.g. a router's `Link`. Default `a`. */
  as?: E;
} & Omit<React.ComponentPropsWithRef<E>, keyof NavLinkOwnProps | 'as'>;

type NavLinkComponent = (<E extends React.ElementType = 'a'>(props: NavLinkProps<E>) => React.ReactElement | null) & {
  displayName?: string;
};

/* The implementation's props. NavLinkProps types them for each `as`; the rest pass through. */
interface NavLinkImplProps extends NavLinkOwnProps, React.AnchorHTMLAttributes<HTMLAnchorElement> {
  as?: React.ElementType;
}

const NavLinkImpl = React.forwardRef<Element, NavLinkImplProps>(function NavLink(
  { as: Component = 'a', active = false, orientation = 'horizontal', className, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      aria-current={active ? 'page' : undefined}
      data-orientation={orientation}
      {...props}
      className={cn(navLinkVariants({ orientation, active }), className)}
    />
  );
});

export const NavLink = NavLinkImpl as unknown as NavLinkComponent;
NavLink.displayName = 'NavLink';
