import * as React from 'react';
import { cn } from '../../lib/cn';
import { IconButton } from '../icon-button';
import { useScrollableTabStop } from './Overlay';

/*
 * The three bands Modal / Dialog and Panel / Side Sheet share in Figma: a
 * Header (title, close), a Body that holds the Content slot, and a Footer of
 * actions. Private to ModalDialog and SideSheet; not exported from the
 * package. Each band's bindings are in docs/figma-sync.md ("ModalDialog").
 *
 * Header and Footer are plain <div>s, not <header> / <footer>: those can map
 * to banner and contentinfo landmarks, and a page already has its own.
 */

export interface OverlayHeaderProps {
  title: React.ReactNode;
  titleId: string;
  description?: React.ReactNode;
  descriptionId?: string;
  onClose: () => void;
}

/* Header: 20px top and bottom, 24px sides, 16px between the title group and
   the close button, a 1px stroke.subtle line under it. The title group stacks
   the title (Body/lg-semibold, text.primary) over the description
   (Body/sm-regular, text.subtle), 4px apart. Close is Modal / Close Button:
   an IconButton named "Close". */
export function OverlayHeader({ title, titleId, description, descriptionId, onClose }: OverlayHeaderProps) {
  return (
    <div data-part="header" className="flex shrink-0 items-center justify-between gap-4 border-b border-stroke-subtle px-6 py-5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id={titleId} className="text-body-lg-semibold text-text-primary">
          {title}
        </h2>
        {description !== undefined && (
          <p id={descriptionId} className="text-body-sm-regular text-text-subtle">
            {description}
          </p>
        )}
      </div>
      <IconButton icon="x" label="Close" onClick={onClose} />
    </div>
  );
}

export interface OverlayBodyProps {
  children?: React.ReactNode;
  /** Fill the panel's height (the side sheet's Body is Fill in Figma). */
  fill?: boolean;
  className?: string;
}

/* Body: 24px on every side, 16px between children. It scrolls when the
   content is taller than the panel, and is then a tab stop, so the keyboard
   can scroll it. */
export function OverlayBody({ children, fill = false, className }: OverlayBodyProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const tabIndex = useScrollableTabStop(ref, true);
  return (
    <div
      ref={ref}
      tabIndex={tabIndex}
      data-part="body"
      className={cn(
        'flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain p-6',
        fill && 'flex-1',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focused',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* Footer: 16px top and bottom, 24px sides, actions at the right end 12px
   apart, a 1px stroke.subtle line over it. */
export function OverlayFooter({ children }: { children?: React.ReactNode }) {
  return (
    <div data-part="footer" className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-stroke-subtle px-6 py-4">
      {children}
    </div>
  );
}
