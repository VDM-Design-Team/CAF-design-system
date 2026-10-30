import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * NavBar — built from the CAF Figma library, page "Navigation":
 * `Navigation / Nav Bar` (4:248), the row of Nav Links under the Top Bar.
 * Figma has no properties: the user app's five links are drawn into it, and
 * Header – Admin draws its ten links in a frame laid out the same way.
 *
 * Figma → code:
 * - The frame → `<nav>`, a navigation landmark, with a list of links:
 *   horizontal, 8 / 0 padding (raw), no gap, hugging its links.
 * - The nested `Navigation / Nav Link` instances → NavLink `children`. Each
 *   one goes into its own `<li>`.
 * - The headers' Page property (which link is highlighted) → the `active`
 *   NavLink. Exactly one link should be active: the current page.
 *
 * Give it an `aria-label` ("Main"). It is required: a page with more than one
 * `<nav>` needs a distinct name for each.
 *
 * Tab moves through the links in order. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("NavBar").
 */
export interface NavBarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'aria-label'> {
  /** Names the landmark, e.g. "Main". Each `<nav>` on a page needs a distinct name. */
  'aria-label': string;
}

/* The links among `children`, in order, looking into fragments, each with a stable key. */
function navItems(children: React.ReactNode, prefix = ''): { key: string; node: React.ReactNode }[] {
  return React.Children.toArray(children).flatMap((child, index) => {
    const key = React.isValidElement(child) && child.key != null ? String(child.key) : String(index);
    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment) {
      return navItems(child.props.children, `${prefix}${key}/`);
    }
    return [{ key: `${prefix}${key}`, node: child }];
  });
}

export const NavBar = React.forwardRef<HTMLElement, NavBarProps>(function NavBar(
  { className, children, ...props },
  ref,
) {
  return (
    /* Nav Bar: 8 / 0 padding (raw). */
    <nav ref={ref} className={cn('py-2', className)} {...props}>
      {/* Horizontal, gap 0 (raw). */}
      <ul className="flex items-start">
        {navItems(children).map(({ key, node }) => (
          <li key={key} className="flex">
            {node}
          </li>
        ))}
      </ul>
    </nav>
  );
});
NavBar.displayName = 'NavBar';
