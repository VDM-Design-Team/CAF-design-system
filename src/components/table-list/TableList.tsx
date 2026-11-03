import * as React from 'react';
import { cn } from '../../lib/cn';
import { useScrollableTabStop } from '../../lib/useScrollableTabStop';

/**
 * TableList — built from the CAF Figma library, page "Table": `Table / List`,
 * the plain list table (Cost Centers, Recurring Costs, Drafts, Users …): a
 * Table / Header Row over a slot of Table / Rows, with no fill and no outer
 * border. It is a real `<table>`: name it (`aria-label`), so screen readers
 * can list it and move by row and column.
 *
 * Figma → code:
 * - The nested Header Row → `header`: a `<TableHeaderRow>`, in the `<thead>`.
 *   Set its columns and controls there, as in Figma.
 * - Rows (a slot of Table / Rows) → `children`: `<TableRow>`s, in the
 *   `<tbody>`. A row's cells match the header's columns. An empty list puts
 *   one row in the slot whose TableCell `type="custom"` spans every column
 *   and holds an EmptyState.
 *
 * It takes its container's width (Figma's 1112 is the sample's), and the
 * columns share it by their content unless the header sets their widths.
 *
 * Narrow screens (decision add-phone-table-layout; Figma draws no phone
 * layout): the table sits in its own scroll region, a `<div>` that scrolls
 * sideways (`overflow-x: auto`) when the columns need more than its width, so
 * the page itself never scrolls sideways. While it can scroll, the region is
 * a tab stop (`tabIndex` 0), the arrow keys scroll it, it shows the focus
 * ring, and it is a `role="region"` named like the table (its `aria-label`
 * or `aria-labelledby`). While everything fits, it is a plain `<div>`: no tab
 * stop, no landmark. Row menus (RowActionsMenu) open outside it, on
 * `document.body`, so the region never cuts them off.
 *
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("TableList").
 */
export interface TableListProps extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'> {
  /** Figma's nested Table / Header Row: a `<TableHeaderRow>`. */
  header: React.ReactNode;
  /** Figma's Rows slot: the `<TableRow>`s. */
  children?: React.ReactNode;
  /** Merged onto the scroll region (the `<div>` round the table) with `cn()`. `className` and `ref` go to the `<table>`. */
  regionClassName?: string;
}

export const TableList = React.forwardRef<HTMLTableElement, TableListProps>(
  ({ header, children, className, regionClassName, ...props }, ref) => {
    const regionRef = React.useRef<HTMLDivElement | null>(null);
    const tabIndex = useScrollableTabStop(regionRef, true, 'x');
    /* A region only while there is something to scroll, and only with a name: an unnamed region is no landmark. */
    const named = !!(props['aria-label'] || props['aria-labelledby']);
    const region = tabIndex === 0 && named;
    return (
      <div
        ref={regionRef}
        data-part="scroll-region"
        data-scrolls={tabIndex === 0 ? '' : undefined}
        role={region ? 'region' : undefined}
        aria-label={region ? props['aria-label'] : undefined}
        aria-labelledby={region && !props['aria-label'] ? props['aria-labelledby'] : undefined}
        tabIndex={tabIndex}
        className={cn(
          /* Its container's width, whatever the container's layout; the columns scroll inside it.
             Relative, so it also holds what is absolutely placed in the cells (a visually hidden
             header label): placed against the page instead, that would still widen the page. */
          'relative w-full overflow-x-auto',
          /* Code adds the focus ring Figma lacks, inside the edge (as on a modal's scrolling body). */
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focused',
          regionClassName,
        )}
      >
        {/* Vertical, no gap, no fill, no outer border: the Header Row's and the rows' own lines are the only strokes. */}
        <table ref={ref} className={cn('w-full border-collapse', className)} {...props}>
          <thead>{header}</thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    );
  },
);
TableList.displayName = 'TableList';
