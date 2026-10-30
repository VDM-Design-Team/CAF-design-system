import * as React from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../icon';
import { VersionBadge } from '../version-badge';

/**
 * ChangelogHeader — built from the CAF Figma library, page "Modals":
 * `Modal / Changelog Header` (Title, Date), the top of the what's-new dialog
 * (ChangelogModal): a rocket, the release's title, and its date beside the
 * version.
 *
 * Figma → code:
 * - Auto layout, vertical, 16px gap (Figma: raw 16) → `gap-4`. Figma hugs a
 *   186px column; code fills its container, as the dialog's instance does.
 * - The `Modal / Changelog Icon` instance (48×48, Phosphor RocketLaunch 48px,
 *   filled with `accent.red.medium`) → an Icon `rocket-launch` at 48px in
 *   `text-accent-red-medium`. It is used only here, so it isn't a component of
 *   its own. It is decorative (`aria-hidden`): the title says what the dialog
 *   is.
 * - Title → `title`: Title/md-bold, `text.primary`, an `<h2>`. Pass `titleId`
 *   and point the dialog's `aria-labelledby` at it.
 * - Metadata Row, horizontal, centred, 12px gap (Figma: raw 12) → `gap-3`:
 *   - Date → `date`: Body/sm-regular, `text.subtle`.
 *   - The `Modal / Version Badge` instance's Version → `version`: a
 *     VersionBadge. Left out, no badge renders.
 *
 * It is a `<div>`, not a `<header>`, which could map to a second banner
 * landmark. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("ChangelogHeader").
 */
export interface ChangelogHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Figma Title: the release's headline. */
  title: React.ReactNode;
  /** Figma Date: when it was released, e.g. "August 10, 2026". */
  date?: React.ReactNode;
  /** The nested Version Badge's Version, e.g. "v2.5.6". */
  version?: React.ReactNode;
  /** The title's id, for the dialog's `aria-labelledby`. */
  titleId?: string;
}

const present = (node: React.ReactNode) => node !== undefined && node !== null && node !== false && node !== '';

export const ChangelogHeader = React.forwardRef<HTMLDivElement, ChangelogHeaderProps>(
  ({ title, date, version, titleId, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props}>
      <Icon name="rocket-launch" size={48} data-part="icon" className="text-accent-red-medium" />
      <h2 id={titleId} className="text-title-md-bold text-text-primary">
        {title}
      </h2>
      {(present(date) || present(version)) && (
        <div data-part="metadata" className="flex flex-wrap items-center gap-3">
          {present(date) && <p className="text-body-sm-regular text-text-subtle">{date}</p>}
          {present(version) && <VersionBadge>{version}</VersionBadge>}
        </div>
      )}
    </div>
  ),
);
ChangelogHeader.displayName = 'ChangelogHeader';
