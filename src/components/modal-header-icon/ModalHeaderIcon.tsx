import * as React from 'react';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';

/**
 * ModalHeaderIcon — built from the CAF Figma library, page "Modals":
 * `Modal / Header Icon`, the icon tile at the left of `Modal / Header`
 * (Payment Schedules' calendar).
 *
 * Figma → code:
 * - The 40×40 frame → `size-10`, radius 8 (Figma: raw 8) → `rounded-8`.
 * - Fill → `accent.info.tonal.surface.default`.
 * - The nested icon instance (`CalendarBlank`, 24px) → `icon`, an Icon name
 *   (default `calendar-blank`), drawn at 24px.
 * - The glyph's colour → `accent.info.tonal.content.default`. Figma fills it
 *   with a raw blue (#7EB3F7, 1.78:1 on the tile in Light); code uses the
 *   pairing Modal / Confirm's icon tile binds on the same fill (5.60 / 5.72).
 *
 * It is decorative: the header's title says what the dialog is, so the tile
 * is hidden from assistive tech. Where code departs from Figma, the reason is
 * in docs/figma-sync.md ("ModalHeaderIcon").
 */
export interface ModalHeaderIconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The glyph: an Icon name. Default `calendar-blank`, as in Figma. */
  icon?: IconName;
}

export const ModalHeaderIcon = React.forwardRef<HTMLSpanElement, ModalHeaderIconProps>(
  ({ icon = 'calendar-blank', className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-8',
        'bg-accent-info-tonal-surface-default text-accent-info-tonal-content-default',
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={24} />
    </span>
  ),
);
ModalHeaderIcon.displayName = 'ModalHeaderIcon';
