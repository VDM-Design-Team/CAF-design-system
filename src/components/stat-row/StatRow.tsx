import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * StatRow — built from the CAF Figma library, page "Cards": the generic row
 * behind `Card / Stat Row – Exports` (four cards) and `Card / Stat Row –
 * Announcements` (three). Those two are content; this is their layout.
 *
 * Figma → code:
 * - The row: horizontal, 16px gap, no fill → the cards 16px apart, sharing
 *   the width equally (the Announcements row's Fill). At Figma's 1536px
 *   page that is 372px a card for four (the Exports row's width) and 501px
 *   for three.
 * - The `Card / Stat` instances → `children`: the `<StatCard>`s. Fragments
 *   and components that return several cards work too: the row lays out
 *   whatever elements end up directly inside it.
 *
 * It is responsive, which Figma's fixed rows aren't: a card is at least
 * 256px wide (`space.256`), so on a narrow screen the cards wrap onto new
 * lines and the last line's cards share it. On a phone they stack. Cards on
 * one line are as tall as the tallest. Each card is named by its label; to
 * name the row too, pass `role="group"` and an `aria-label`. Where code
 * departs from Figma, the reason is in docs/figma-sync.md ("StatRow").
 */
export type StatRowProps = React.HTMLAttributes<HTMLDivElement>;

export const StatRow = React.forwardRef<HTMLDivElement, StatRowProps>(({ className, ...props }, ref) => (
  /* Wraps; 16px gap. Each card grows to share its line and is at least 256px. */
  <div ref={ref} className={cn('flex flex-wrap gap-4 *:grow *:basis-64', className)} {...props} />
));
StatRow.displayName = 'StatRow';
