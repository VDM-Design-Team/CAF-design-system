import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * TableDetailLabel — built from the CAF Figma library, page "Table":
 * `Table / Detail Label`, one "Label: Value" line ("ID: 32430",
 * "Applicant: QA Test Bryan"). TableAccountDetails stacks them.
 *
 * Figma → code:
 * - Text → `children`: the whole line, label and value, as in Figma.
 *
 * It is plain text with no states: Body/sm-regular in text.primary, the
 * style and variable the Figma layer is bound to. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("TableDetailLabel").
 */
const detailLabel = 'text-body-sm-regular text-text-primary';

export type TableDetailLabelProps = React.HTMLAttributes<HTMLParagraphElement>;

export const TableDetailLabel = React.forwardRef<HTMLParagraphElement, TableDetailLabelProps>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn(detailLabel, className)} {...props} />,
);
TableDetailLabel.displayName = 'TableDetailLabel';
