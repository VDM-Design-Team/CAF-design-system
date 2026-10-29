import * as React from 'react';
import { cn } from '../../lib/cn';
import { popoverSurface } from '../popover';

/**
 * SelectMenu — built from the CAF Figma library, page "Form": `Select / Menu`,
 * the open list of a select or combobox. It is a `<div role="listbox">` of
 * SelectOptions, on the same surface as every CAF overlay (Popover's, which is
 * Menu / Dropdown's). Select renders it in a Popover, under its trigger; on
 * its own it is the list for a control that positions it and drives the keys
 * itself (a combobox).
 *
 * Figma → code:
 * - Fill    → surface.neutral.faint
 * - Stroke  → 1px inside stroke.subtle (an inset ring)
 * - Radius  → radius.8 (Figma: raw 8)
 * - Effect  → Elevation Dark/3 → `shadow-elevation-3`, as on Menu / Dropdown
 * - Padding → space.6 on every side; 2px between options (Figma: raw 6 and 2)
 * - Option instances → SelectOption `children`. Figma's "hide extra rows" is
 *   leaving them out.
 *
 * Code adds a height limit Figma doesn't have: past space.256 (about six
 * options) the list scrolls, so a long list (currencies, countries) stays on
 * the screen. Name it: `aria-label`, or `aria-labelledby` pointing at the
 * field's label. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("SelectMenu").
 */

/** Select / Menu's layout: a column of options, 2px apart, scrolling past space.256. */
export const selectMenuLayout = 'flex max-h-64 flex-col gap-0.5 overflow-y-auto';

export type SelectMenuProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'role'>;

export const SelectMenu = React.forwardRef<HTMLDivElement, SelectMenuProps>(({ className, ...props }, ref) => (
  <div ref={ref} role="listbox" {...props} className={cn(popoverSurface, selectMenuLayout, className)} />
));
SelectMenu.displayName = 'SelectMenu';
