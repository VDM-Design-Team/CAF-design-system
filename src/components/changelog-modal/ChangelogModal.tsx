import * as React from 'react';
import { cn } from '../../lib/cn';
import { Button } from '../button';
import { ChangelogHeader } from '../changelog-header';
import { Overlay } from '../overlay';
import { ReleaseNotes } from '../release-notes';

/**
 * ChangelogModal — built from the CAF Figma library, page "Modals":
 * `Modal / Changelog`, the "what's new" dialog that opens once after sign-in
 * with the newest release for the user's audience (patterns 14 and U07).
 *
 * Figma → code:
 * - The panel: auto layout, vertical, `space/32` padding, `space/24` gap →
 *   `p-8 gap-6`. Since 3 Nov 2026 (decision overlay-surfaces) it has Modal /
 *   Dialog's surface: `surface.base` fill, `radius/12` → `rounded-12`, a 1px
 *   inside `stroke.subtle` stroke (not in the layout, so an `inset-ring`:
 *   the content stays 32px in) and the Elevation Dark/4 style →
 *   `shadow-elevation-4`. Figma's fixed 500 width → capped at 512
 *   (`max-w-lg`, the nearest container width), narrower on a small screen.
 * - The `Modal / Changelog Header` instance → ChangelogHeader, with `title`,
 *   `date` and `version`. The instance has no overrides: the Date is the
 *   header's own `text.secondary`.
 * - The `Modal / Release Notes` instance → ReleaseNotes: `sectionTitle`
 *   (default "What's new in this release:") and the notes as `children`
 *   (BulletItems).
 * - Modal Actions, horizontal, 16px gap, both buttons Fill → two equal
 *   columns, `gap-4`: a Normal Default Button "View Change Log", which calls
 *   `onViewChangeLog`, and a Normal Outlined Button "Got It", which calls
 *   `onClose`. When the panel is narrower than 384 inside (a phone), they
 *   stack, so neither label is cut.
 *
 * Figma has no close button. Got It, Escape and a click on the backdrop call
 * `onClose`; the owner sets `open`, and records that this release was seen.
 * The behaviour is the Overlay's: portal, `aria-modal`, focus moved to the
 * dialog and trapped, the page inert and its scroll locked, focus back on the
 * opener on close. The dialog is named by the header's title. Figma pins the
 * component to Dark; code follows the page's theme. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("ChangelogModal").
 */
export interface ChangelogModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'role' | 'aria-modal' | 'aria-label' | 'aria-labelledby'> {
  /** Whether it is open. */
  open: boolean;
  /** Asked to close: Got It, Escape, a click on the backdrop. Set `open` to false. */
  onClose: () => void;
  /** View Change Log calls it: open the Changelog page. */
  onViewChangeLog: () => void;
  /** The header's Title: the release's headline, and the dialog's accessible name. */
  title: React.ReactNode;
  /** The header's Date, e.g. "August 10, 2026". */
  date?: React.ReactNode;
  /** The header's Version Tag, e.g. "v2.5.6". */
  version?: React.ReactNode;
  /** The Release Notes' Section Title. Default "What's new in this release:". */
  sectionTitle?: React.ReactNode;
  /** Where focus goes on open. Default: the dialog itself. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** The release notes: BulletItems. */
  children?: React.ReactNode;
}

export const ChangelogModal = React.forwardRef<HTMLDivElement, ChangelogModalProps>(function ChangelogModal(
  { open, onClose, onViewChangeLog, title, date, version, sectionTitle, initialFocusRef, className, children, ...props },
  ref,
) {
  const titleId = `${React.useId()}-title`;
  const hasDate = date !== undefined && date !== null && date !== false && date !== '';

  return (
    <Overlay
      {...props}
      ref={ref}
      open={open}
      onClose={onClose}
      placement="center"
      initialFocusRef={initialFocusRef}
      aria-labelledby={titleId}
      className={cn(
        '@container flex max-h-full w-full max-w-lg flex-col gap-6 overflow-y-auto rounded-12 p-8',
        'bg-surface-base text-text-primary shadow-elevation-4 inset-ring inset-ring-stroke-subtle',
        className,
      )}
    >
      <ChangelogHeader title={title} titleId={titleId} date={hasDate ? date : undefined} version={version} />
      <ReleaseNotes sectionTitle={sectionTitle}>{children}</ReleaseNotes>
      <div data-part="actions" className="grid gap-4 @sm:grid-cols-2">
        <Button className="w-full" onClick={onViewChangeLog}>
          View Change Log
        </Button>
        <Button className="w-full" variant="outlined" onClick={onClose}>
          Got It
        </Button>
      </div>
    </Overlay>
  );
});
ChangelogModal.displayName = 'ChangelogModal';
