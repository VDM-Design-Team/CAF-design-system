import * as React from 'react';
import { cn } from '../../lib/cn';
import { Button } from '../button';
import { Icon } from '../icon';

/**
 * FilterClear — built from the CAF Figma library, page "Filters":
 * `Filter / Clear` (863:3420, since 5 Nov 2026), Clear Filters, the filter
 * bar's reset action. Its place is the bar's right end, and it shows only
 * while a filter is in use: when nothing is filtered, leave it out rather than
 * disable it (decision filter-clear-disabled). Pressing it should reset every
 * filter and move focus to the search field, since the button goes away.
 *
 * Figma → code:
 * - Each variant is a box as tall as Filter / Field, hugging its width, with
 *   no fill or stroke and clipping off → a `flex items-center` box, 40 tall
 *   (`h-10`): Figma's 42 isn't on GDL's scale, and code's FilterField is 40.
 * - Inside it, a `Button / Normal` instance, Style=Outlined, Show Icons on,
 *   the leading icon swapped to ArrowsClockwise 20 and the label "Clear
 *   Filters" → Button `variant="outlined"` with `leftIcon` `arrows-clockwise`.
 *   Every colour is Button's Outlined binding, state by state (see Button).
 * - State → the button's own states: Hover = `:hover`, Pressed = `:active`,
 *   Focus = `:focus-visible` (Button's 2px `stroke/focused` ring, 2px out),
 *   Disabled = `disabled` (only while the list is busy loading).
 *
 * The label is Figma's and has no property, so it isn't a prop. `className`
 * styles the box (its place in the bar, say). Every other prop, and the ref,
 * go to the button. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("FilterClear").
 */
export interface FilterClearProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {}

export const FilterClear = React.forwardRef<HTMLButtonElement, FilterClearProps>(function FilterClear(
  { className, ...props },
  ref,
) {
  return (
    <div data-part="box" className={cn('flex h-10 shrink-0 items-center', className)}>
      <Button
        ref={ref}
        variant="outlined"
        leftIcon={<Icon name="arrows-clockwise" />}
        {...props}
      >
        Clear Filters
      </Button>
    </div>
  );
});
FilterClear.displayName = 'FilterClear';
