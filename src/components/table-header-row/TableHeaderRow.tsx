import * as React from 'react';
import { cn } from '../../lib/cn';
import { Checkbox, type CheckboxProps } from '../checkbox';
import { TableHeaderRowContext } from '../table-header-cell/TableHeaderCell';

/**
 * TableHeaderRow — built from the CAF Figma library, page "Table":
 * `Table / Header Row` (Columns × Show Expand, Show Checkbox, Show Actions),
 * the header over a table of TableRows. It is a `<tr>`: put it in the
 * `<thead>` of a real `<table>` (TableList does).
 *
 * Figma → code:
 * - Columns (2–8) → the TableHeaderCells passed as `children`, one per data
 *   column, as TableRow takes its TableCells. Any number works.
 * - Show Expand → `showExpand`: a first column over the rows' expand buttons,
 *   named "Details" for screen readers.
 * - Show Checkbox → `showCheckbox`: a select-all Checkbox column after it.
 *   `checkboxProps` go to that Checkbox (`aria-label`, `checked`,
 *   `indeterminate` for Mixed, `disabled`, `onChange`); the table owns the
 *   selection.
 * - Show Actions → `showActions`: a last column over the rows' ••• menus,
 *   named "Actions" for screen readers.
 *
 * Each control has its own column, as the rows do. Inside the row, the
 * TableHeaderCells take the rows' cell padding (space.16 at the sides,
 * space.12 above and below), so the labels line up with the cells under
 * them. No fill; a 1px stroke.subtle line underneath (stroke/1).
 *
 * Widths belong to the columns (`className` on a TableHeaderCell). The
 * control columns are as narrow as their content. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("TableHeaderRow").
 */

/* Expand, Checkbox and Actions: the rows' cell padding (space.16, space.12); as narrow as their content. */
const control = 'w-1 px-4 py-3 align-middle';

export interface TableHeaderRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Figma Show Expand: a column over the rows' expand buttons. */
  showExpand?: boolean;
  /** Figma Show Checkbox: a select-all Checkbox column. */
  showCheckbox?: boolean;
  /** The select-all Checkbox's props: name it ("Select all costs"), and pass `checked`, `indeterminate` and `onChange`. */
  checkboxProps?: CheckboxProps;
  /** Figma Show Actions: a column over the rows' ••• menus. */
  showActions?: boolean;
}

export const TableHeaderRow = React.forwardRef<HTMLTableRowElement, TableHeaderRowProps>(
  ({ className, showExpand = false, showCheckbox = false, checkboxProps, showActions = false, children, ...props }, ref) => (
    /* No fill; the bottom line is stroke/1 in colors/stroke/subtle, as Table / Row's. */
    <tr ref={ref} className={cn('border-b border-stroke-subtle', className)} {...props}>
      {showExpand && (
        <th scope="col" className={cn(control, 'text-left')}>
          <span className="sr-only">Details</span>
        </th>
      )}
      {showCheckbox && (
        <th scope="col" className={cn(control, 'text-center')}>
          {/* flex: an inline box would sit on the cell's line box and add height. */}
          <div className="flex justify-center">
            <Checkbox aria-label="Select all rows" {...checkboxProps} />
          </div>
        </th>
      )}
      <TableHeaderRowContext.Provider value={true}>{children}</TableHeaderRowContext.Provider>
      {showActions && (
        <th scope="col" className={cn(control, 'text-left')}>
          <span className="sr-only">Actions</span>
        </th>
      )}
    </tr>
  ),
);
TableHeaderRow.displayName = 'TableHeaderRow';
