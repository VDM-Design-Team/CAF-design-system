import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * @deprecated Since 3 Nov 2026 (decision version-badge): show a release
 * version as `<Tag status="info" showIcon={false}>`, as ChangelogHeader and
 * the Announcements table do. Figma's `Modal / Version Badge` is marked
 * deprecated and has no placements left; it stays in the library, and this
 * component stays exported, until a major release removes it.
 *
 * VersionBadge — built from the CAF Figma library, page "Modals":
 * `Modal / Version Badge` (Version), the release number beside the date in
 * the what's-new dialog's header (ChangelogHeader): "v2.5.6".
 *
 * Figma → code:
 * - Version → `children`, the text ("v2.5.6").
 * - Auto layout, horizontal, centred: 4px top and bottom, 12px sides (Figma:
 *   raw values on GDL's scale) → `py-1 px-3`.
 * - Radius 9999 (Figma: raw) → `rounded-full`.
 * - Fill → `surface.base`. It sits on the dialog's `surface.canvas`, so it
 *   reads as a light pill in Light and a lifted one in Dark.
 * - Version text → Body/sm-semibold, `accent.info.tonal.content.default`.
 *
 * It isn't a Tag: Tag Status=Info (the Announcements table's version column)
 * fills with `accent.info.tonal.surface` and sets Label/sm-medium, so the two
 * look different; the version-badge decision chose Tag. It is plain text, not
 * a control: it has no states. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("VersionBadge").
 */
/** @deprecated Use `TagProps` with `<Tag status="info" showIcon={false}>` (decision version-badge, 3 Nov 2026). */
export type VersionBadgeProps = React.HTMLAttributes<HTMLSpanElement>;

/** @deprecated Use `<Tag status="info" showIcon={false}>` (decision version-badge, 3 Nov 2026). */
export const VersionBadge = React.forwardRef<HTMLSpanElement, VersionBadgeProps>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1',
      'bg-surface-base text-body-sm-semibold text-accent-info-tonal-content-default',
      className,
    )}
    {...props}
  />
));
VersionBadge.displayName = 'VersionBadge';
