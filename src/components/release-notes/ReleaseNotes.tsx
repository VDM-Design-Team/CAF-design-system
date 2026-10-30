import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * ReleaseNotes — built from the CAF Figma library, page "Modals":
 * `Modal / Release Notes` (Section Title), the "What's new in this release:"
 * list in the what's-new dialog (ChangelogModal).
 *
 * Figma → code:
 * - Section Title → `sectionTitle` (default "What's new in this release:", as
 *   in Figma): Body/sm-semibold, `text.primary`. It names the list
 *   (`aria-labelledby`), so a screen reader announces "What's new in this
 *   release:, list, 3 items". It isn't a heading: its text style is Body, and
 *   the dialog's title is the heading.
 * - The `Modal / Bullet Item` instances → `children`: BulletItems, in a `<ul>`.
 * - Auto layout, vertical, 12px between the title and each item (Figma: raw
 *   12) → `gap-3` on the group and on the list.
 *
 * Every colour and text style is the one the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md
 * ("ReleaseNotes").
 */
export interface ReleaseNotesProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Figma Section Title. Default "What's new in this release:". */
  sectionTitle?: React.ReactNode;
  /** The notes: BulletItems. */
  children?: React.ReactNode;
}

export const ReleaseNotes = React.forwardRef<HTMLDivElement, ReleaseNotesProps>(
  ({ sectionTitle = "What's new in this release:", className, children, ...props }, ref) => {
    const titleId = `${React.useId()}-title`;
    return (
      <div ref={ref} className={cn('flex flex-col gap-3', className)} {...props}>
        <p id={titleId} className="text-body-sm-semibold text-text-primary">
          {sectionTitle}
        </p>
        <ul aria-labelledby={titleId} className="flex flex-col gap-3">
          {children}
        </ul>
      </div>
    );
  },
);
ReleaseNotes.displayName = 'ReleaseNotes';
