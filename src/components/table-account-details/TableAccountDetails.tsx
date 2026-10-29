import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * TableAccountDetails — built from the CAF Figma library, page "Table":
 * `Table / Account Details`, the cost row's Account column: the ID,
 * applicant, beneficiary and account lines, plus an optional category tag.
 * In a table, put it in a TableCell.
 *
 * Figma → code:
 * - The lines (nested `Table / Detail Label` instances) → `children`: one
 *   `<TableDetailLabel>` per line, stacked with no gap, as in Figma.
 * - Category Tag (instance swap) → `categoryTag`: the element to show below
 *   the lines, 12px under them. Figma's default is a Status Pill
 *   ("Recurring"); any tag component fits. Leave it out for no tag.
 *
 * It has no fill, border or states of its own: its colours are its parts'.
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("TableAccountDetails").
 */
export interface TableAccountDetailsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Figma's Category Tag: a `<StatusPill>` (Figma's default) or a `<Tag>`. Optional. */
  categoryTag?: React.ReactNode;
}

export const TableAccountDetails = React.forwardRef<HTMLDivElement, TableAccountDetailsProps>(
  ({ className, categoryTag, children, ...props }, ref) => (
    /* Vertical, gap 12 (space.12), hugging its content. */
    <div ref={ref} className={cn('flex flex-col items-start gap-3', className)} {...props}>
      {/* "Details": the lines, gap 0. */}
      <div className="flex flex-col items-start">{children}</div>
      {categoryTag}
    </div>
  ),
);
TableAccountDetails.displayName = 'TableAccountDetails';
