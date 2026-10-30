import * as React from 'react';
import { cn } from '../../lib/cn';
import { Tag } from '../tag';

/**
 * ChangelogEntry — built from the CAF Figma library, page "Cards":
 * `Card / Changelog Entry` (Title, Meta, Show New), one release on the
 * Changelog page (patterns 14 and U07): its title, "Version • date", the New
 * tag on the latest release, and its notes.
 *
 * Figma → code:
 * - The card: `surface.neutral.faint` fill, 1px `stroke.subtle` stroke (a
 *   border: Figma includes strokes in the layout), radius 8 (Figma: raw 8) →
 *   `bg-surface-neutral-faint border border-stroke-subtle rounded-8`. Figma's
 *   fixed 640 width → fills its container.
 * - Header: 16px top and bottom, 20px sides (Figma: raw), Space Between, top
 *   aligned, a 1px `stroke.subtle` line under it → `py-4 px-5
 *   justify-between border-b border-stroke-subtle`.
 *   - Title Group, vertical, 2px gap → `gap-0.5`:
 *     - Title → `title`: Body/md-semibold, `text.primary`. A heading (`<h2>`;
 *       `headingLevel` moves it without changing the look), and the card's
 *       accessible name.
 *     - Meta → `meta`: Caption/md-regular, `text.subtle`, e.g. "Version 2.5.6 •
 *       August 10, 2026".
 *   - New Badge, a `Tag` Status=Info, Show Icon off, "New" → Show New →
 *     `showNew` (default true, as in Figma). The Changelog shows it on the
 *     latest release only.
 * - Notes: vertical, 16px top and bottom, 20px sides, 6px gap (Figma: raw) →
 *   a `<ul>` with `py-4 px-5 gap-1.5`; its `Modal / Bullet Item` instances →
 *   `children`, BulletItems.
 *
 * It is an `<article>` named by its title, so a list of releases reads as one
 * article each. It has no states: nothing in it is interactive. Where code
 * departs from Figma, the reason is in docs/figma-sync.md ("ChangelogEntry").
 */
export interface ChangelogEntryProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Figma Title: the release's headline. */
  title: React.ReactNode;
  /** Figma Meta: the version and date, e.g. "Version 2.5.6 • August 10, 2026". */
  meta?: React.ReactNode;
  /** Figma Show New: the "New" tag. Default true, as in Figma; set it on the latest release only. */
  showNew?: boolean;
  /** The title's heading level. Default 2. It doesn't change the look. */
  headingLevel?: 2 | 3 | 4;
  /** The notes: BulletItems. */
  children?: React.ReactNode;
}

export const ChangelogEntry = React.forwardRef<HTMLElement, ChangelogEntryProps>(
  ({ title, meta, showNew = true, headingLevel = 2, className, children, ...props }, ref) => {
    const titleId = `${React.useId()}-title`;
    const Heading = `h${headingLevel}` as const;
    const hasMeta = meta !== undefined && meta !== null && meta !== false && meta !== '';
    return (
      <article
        ref={ref}
        aria-labelledby={titleId}
        className={cn('flex flex-col overflow-hidden rounded-8 border border-stroke-subtle bg-surface-neutral-faint', className)}
        {...props}
      >
        <div data-part="header" className="flex items-start justify-between gap-4 border-b border-stroke-subtle px-5 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Heading id={titleId} className="text-body-md-semibold text-text-primary">
              {title}
            </Heading>
            {hasMeta && <p className="text-caption-md-regular text-text-subtle">{meta}</p>}
          </div>
          {showNew && (
            <Tag status="info" showIcon={false}>
              New
            </Tag>
          )}
        </div>
        <ul data-part="notes" className="flex flex-col gap-1.5 px-5 py-4">
          {children}
        </ul>
      </article>
    );
  },
);
ChangelogEntry.displayName = 'ChangelogEntry';
