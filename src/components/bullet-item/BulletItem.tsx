import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * BulletItem — built from the CAF Figma library, page "Modals":
 * `Modal / Bullet Item` (Text), one line of release notes. The what's-new
 * dialog's ReleaseNotes and the Changelog page's ChangelogEntry both list
 * them, so it is its own component.
 *
 * Figma → code:
 * - Text → `children`: Body/sm-regular, `text.primary`.
 * - Bullet Dot, a 6×6 ellipse → `size-1.5 rounded-full`, filled with
 *   `accent.success.tonal.content.default`.
 * - Auto layout, horizontal, 8px gap (Figma: raw 8) → `gap-2`.
 *
 * It is an `<li>`: put it in a `<ul>` (ReleaseNotes and ChangelogEntry are
 * one). The dot is the list marker, drawn rather than the browser's, so it is
 * hidden from assistive tech: the list already says "bullet". Figma centres
 * the dot on the line; code centres it on the first line (a 20px box, Body/sm's
 * line height), so a note that wraps keeps its dot at the top. Where code
 * departs from Figma, the reason is in docs/figma-sync.md ("BulletItem").
 */
export type BulletItemProps = React.LiHTMLAttributes<HTMLLIElement>;

export const BulletItem = React.forwardRef<HTMLLIElement, BulletItemProps>(({ className, children, ...props }, ref) => (
  <li ref={ref} className={cn('flex gap-2 text-body-sm-regular text-text-primary', className)} {...props}>
    <span aria-hidden="true" data-part="dot" className="flex h-5 shrink-0 items-center">
      <span className="size-1.5 rounded-full bg-accent-success-tonal-content-default" />
    </span>
    <span className="min-w-0">{children}</span>
  </li>
));
BulletItem.displayName = 'BulletItem';
