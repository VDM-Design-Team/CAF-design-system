import * as React from 'react';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';

/**
 * TableHeaderCell — built from the CAF Figma library, page "Table":
 * `Table / Header Cell` (Sortable × Sort, with a Label). It is a
 * `<th scope="col">`: put it in the header row of a real `<table>`, so
 * screen readers announce each body cell with its column.
 *
 * Figma → code:
 * - Label    → `children`.
 * - Sortable → `sortable`. A sortable header is a `<button>` that calls
 *   `onSort`; the table owns the sort order. Off by default, because a
 *   sortable header needs a handler (Figma's default variant is sortable).
 * - Sort     → `sort`: none (default), ascending or descending. A sorted
 *   column also sets `aria-sort` on the `<th>`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. The
 * arrows are Icons at 20px: ArrowsDownUp, ArrowUp and ArrowDown, as in
 * Figma. The cell has no fill or
 * border: the header row draws those. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("TableHeaderCell").
 */

export type TableSort = 'none' | 'ascending' | 'descending';

/* Figma's sort glyphs: ArrowsDownUp, ArrowUp, ArrowDown. */
const ARROW: Record<TableSort, IconName> = { none: 'arrows-down-up', ascending: 'arrow-up', descending: 'arrow-down' };

const sortButton = [
  // flex, not inline-flex: inline content would sit on the <th>'s line box and add height.
  'flex w-fit cursor-pointer items-center gap-1.5 rounded-2 text-left',
  // Figma has no Hover or Focus state for the sort control; the ring is stroke.focused, as on Button.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
];

export interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Figma Sortable: the label becomes a button that calls `onSort`. */
  sortable?: boolean;
  /** Figma Sort: which way this column is sorted, if it is. Only shown when `sortable`. */
  sort?: TableSort;
  /** Called when a sortable header is clicked. The table decides the next order. */
  onSort?: React.MouseEventHandler<HTMLButtonElement>;
}

export const TableHeaderCell = React.forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ className, children, sortable = false, sort = 'none', onSort, scope = 'col', ...th }, ref) => {
    const sorted = sortable && sort !== 'none';
    /* Sort=None: text/secondary label, text/tertiary arrows. Sorted: text/primary for both. */
    const label = (
      <span className={cn('block text-body-sm-regular', sorted ? 'text-text-primary' : 'text-text-secondary')}>{children}</span>
    );
    return (
      <th
        ref={ref}
        scope={scope}
        aria-sort={sorted ? sort : undefined}
        className={cn('p-1.5 text-left align-middle whitespace-nowrap', className)}
        {...th}
      >
        {sortable ? (
          <button type="button" className={cn(sortButton)} onClick={onSort}>
            {label}
            <Icon name={ARROW[sort]} className={sorted ? 'text-text-primary' : 'text-text-tertiary'} />
          </button>
        ) : (
          label
        )}
      </th>
    );
  },
);
TableHeaderCell.displayName = 'TableHeaderCell';

export const TABLE_SORTS = ['none', 'ascending', 'descending'] as const;
