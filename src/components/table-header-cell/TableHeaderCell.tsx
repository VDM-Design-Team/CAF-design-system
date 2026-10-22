import * as React from 'react';
import { cn } from '../../lib/cn';

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
 * arrows are the Phosphor icons (MIT) the Figma component uses, Regular at
 * 20px: ArrowsDownUp, ArrowUp and ArrowDown. The cell has no fill or
 * border: the header row draws those. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("TableHeaderCell").
 */

/* Phosphor Regular, 256-unit grid. */
const ARROWS = {
  none: 'M117.66,170.34a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L72,188.69V48a8,8,0,0,1,16,0V188.69l18.34-18.35A8,8,0,0,1,117.66,170.34Zm96-96-32-32a8,8,0,0,0-11.32,0l-32,32a8,8,0,0,0,11.32,11.32L168,67.31V208a8,8,0,0,0,16,0V67.31l18.34,18.35a8,8,0,0,0,11.32-11.32Z',
  ascending: 'M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z',
  descending: 'M205.66,149.66l-72,72a8,8,0,0,1-11.32,0l-72-72a8,8,0,0,1,11.32-11.32L120,196.69V40a8,8,0,0,1,16,0V196.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z',
} as const;

export type TableSort = keyof typeof ARROWS;

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
            <svg
              aria-hidden="true"
              viewBox="0 0 256 256"
              className={cn('size-5 shrink-0', sorted ? 'text-text-primary' : 'text-text-tertiary')}
            >
              <path d={ARROWS[sort]} fill="currentColor" />
            </svg>
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
