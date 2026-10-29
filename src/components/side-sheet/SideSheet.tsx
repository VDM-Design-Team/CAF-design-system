import * as React from 'react';
import { cn } from '../../lib/cn';
import { Overlay } from '../overlay';
import { OverlayBody, OverlayFooter, OverlayHeader } from '../overlay/parts';

/**
 * SideSheet — built from the CAF Figma library, page "Modals":
 * `Panel / Side Sheet` (Title, Content, Show Footer), the right-hand sheet
 * for edit flows such as Edit Recurring Cost.
 *
 * Figma → code:
 * - 672 wide, against the right edge of the page Overlay, full height (Figma
 *   draws it 900 tall) → `max-w-2xl` (672) and the viewport's height. On a
 *   narrower screen it takes the full width.
 * - Title → `title`: Body/lg-semibold, `text.primary`, the sheet's
 *   accessible name (`aria-labelledby`).
 * - Content (the `_Slot` instance swap) → `children`, in a Body that fills
 *   the height and scrolls.
 * - Show Footer → `showFooter` (default true). The footer's Button instances
 *   (Text "Cancel", Default "Update") → `footer`: pass the Buttons.
 * - The Close Button → IconButton `icon="x"` named "Close"; it calls `onClose`.
 *
 * The panel: `surface.base` fill, a 1px `stroke.subtle` line on its left
 * edge, no radius, `shadow-elevation-4` (Figma: Elevation Dark/4). Header,
 * Body and Footer are Modal / Dialog's bands. It is a modal dialog on an
 * Overlay: portal, focus trap, Escape, backdrop click, focus return, scroll
 * lock. It never closes itself: `onClose` asks, the owner sets `open`. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("SideSheet").
 */
export interface SideSheetProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'role' | 'aria-modal' | 'aria-label' | 'aria-labelledby'> {
  /** Whether it is open. */
  open: boolean;
  /** Asked to close: the close button, Escape, a click on the backdrop. Set `open` to false. */
  onClose: () => void;
  /** Figma Title: the heading, and the sheet's accessible name. */
  title: React.ReactNode;
  /** Figma Show Footer. Default true; the footer shows when there is a `footer`. */
  showFooter?: boolean;
  /** The footer's actions, at its right end: usually a Text "Cancel" and a Default Button. */
  footer?: React.ReactNode;
  /** Where focus goes on open. Default: the sheet itself. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Figma Content: what the sheet holds. */
  children?: React.ReactNode;
}

export const SideSheet = React.forwardRef<HTMLDivElement, SideSheetProps>(function SideSheet(
  { open, onClose, title, showFooter = true, footer, initialFocusRef, className, children, ...props },
  ref,
) {
  const titleId = `${React.useId()}-title`;
  const hasFooter = showFooter && footer !== undefined && footer !== null && footer !== false;

  return (
    <Overlay
      {...props}
      ref={ref}
      open={open}
      onClose={onClose}
      placement="right"
      initialFocusRef={initialFocusRef}
      aria-labelledby={titleId}
      className={cn(
        'flex h-full w-full max-w-2xl flex-col',
        'border-l border-stroke-subtle bg-surface-base text-text-primary shadow-elevation-4',
        className,
      )}
    >
      <OverlayHeader title={title} titleId={titleId} onClose={onClose} />
      <OverlayBody fill>{children}</OverlayBody>
      {hasFooter && <OverlayFooter>{footer}</OverlayFooter>}
    </Overlay>
  );
});
SideSheet.displayName = 'SideSheet';
