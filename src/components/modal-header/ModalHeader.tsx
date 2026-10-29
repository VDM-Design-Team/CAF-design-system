import * as React from 'react';
import { cn } from '../../lib/cn';
import { type IconName } from '../icon';
import { IconButton } from '../icon-button';
import { ModalHeaderIcon } from '../modal-header-icon';

/**
 * ModalHeader — built from the CAF Figma library, page "Modals":
 * `Modal / Header` (Title, Description), the header of the modals Figma
 * composes by hand (Payment Schedules, Changelog): an icon tile, a title over
 * a description, and the close button. Modal / Dialog and Panel / Side Sheet
 * draw their own headers, so ModalDialog and SideSheet don't use this.
 *
 * Figma → code:
 * - Auto layout, horizontal, centred: 16px top and bottom, 24px sides, 12px
 *   gap (Figma: raw values on GDL's scale) → `py-4 px-6 gap-3`.
 * - Fixed 512×80 → fills its container, at least 80 tall (`min-h-20`).
 * - The `Modal / Header Icon` instance → ModalHeaderIcon; its glyph → `icon`.
 * - Title → `title`: Body/lg-semibold, `text.primary`, an `<h2>`.
 * - Description → `description`: Body/sm-regular, `text.subtle`.
 * - The `Modal / Close Button` instance → IconButton `icon="x"` named
 *   "Close" (Size 32, Tone Ghost), which calls `onClose`.
 *
 * To name the dialog it heads, pass `titleId` (and `descriptionId`) and point
 * the Overlay's `aria-labelledby` (and `aria-describedby`) at them. It is a
 * <div>, not a <header>, which could map to a second banner landmark. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("ModalHeader").
 */
export interface ModalHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Figma Title. */
  title: React.ReactNode;
  /** Figma Description, under the title. Left out, nothing renders for it. */
  description?: React.ReactNode;
  /** The icon tile's glyph. Default `calendar-blank`, as in Figma. */
  icon?: IconName;
  /** The close button calls it. */
  onClose: () => void;
  /** The title's id, for the dialog's `aria-labelledby`. */
  titleId?: string;
  /** The description's id, for the dialog's `aria-describedby`. */
  descriptionId?: string;
}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ title, description, icon, onClose, titleId, descriptionId, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex min-h-20 shrink-0 items-center gap-3 px-6 py-4', className)} {...props}>
      <ModalHeaderIcon icon={icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 id={titleId} className="text-body-lg-semibold text-text-primary">
          {title}
        </h2>
        {description !== undefined && description !== null && description !== '' && (
          <p id={descriptionId} className="text-body-sm-regular text-text-subtle">
            {description}
          </p>
        )}
      </div>
      <IconButton icon="x" label="Close" onClick={onClose} />
    </div>
  ),
);
ModalHeader.displayName = 'ModalHeader';
