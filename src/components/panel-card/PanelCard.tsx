import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * PanelCard — built from the CAF Figma library, page "Layout": `Card / Panel`,
 * the surface around a form page's form and the Settings page's content
 * (the Settings Card, 545:25208).
 *
 * Figma → code:
 * - Content (a slot) → `children`, stacked 20px apart (space.20).
 * - surface.base fill, a 1px stroke.subtle stroke inside, radius 12 and 32px
 *   padding (space.32), as bound in Figma.
 *
 * It takes its container's width; Figma's 578 is the form cards' width, so
 * set a max width where a page needs one. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("PanelCard").
 */
export type PanelCardProps = React.HTMLAttributes<HTMLDivElement>;

export const PanelCard = React.forwardRef<HTMLDivElement, PanelCardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-5 rounded-12 bg-surface-base p-8 inset-ring inset-ring-stroke-subtle',
      className,
    )}
    {...props}
  />
));
PanelCard.displayName = 'PanelCard';
