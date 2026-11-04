import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * TableDetailLabel — built from the CAF Figma library, page "Table":
 * `Table / Detail Label`, one "Label: Value" line ("ID: 32430",
 * "Applicant: QA Test Bryan"). TableAccountDetails stacks them.
 *
 * Figma → code:
 * - Label → `label`: the field's name with its colon, as Figma's text has it
 *   ("ID:").
 * - Value → `value`: what it is ("32430"). On one line; it ends in … when the
 *   line is narrower than it (Figma: truncate, 1 line). The label never
 *   shrinks.
 * - The two texts sit `space/4` apart (`gap-1`). A space between them, which
 *   the flex layout doesn't draw, keeps the line's text "ID: 32430" for
 *   copying and for screen readers.
 *
 * Both are Body/sm-regular in text.primary, the style and variable the
 * Figma layers are bound to. It has no states. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("TableDetailLabel").
 */
const detailLabel = 'text-body-sm-regular text-text-primary';

type BaseProps = Omit<React.HTMLAttributes<HTMLParagraphElement>, 'children'>;

export interface TableDetailLabelLineProps extends BaseProps {
  /** Figma Label: the field's name with its colon, e.g. "ID:". */
  label: React.ReactNode;
  /** Figma Value: e.g. "32430". It ends in … when the line is narrower than it. */
  value: React.ReactNode;
  children?: never;
}

/**
 * @deprecated Pass `label` and `value` (Figma's Label and Value, since 3 Nov
 * 2026). The whole line as `children` was Figma's old Text property: it still
 * renders, as one wrapping line, until the next major release.
 */
export interface TableDetailLabelTextProps extends BaseProps {
  children: React.ReactNode;
  label?: never;
  value?: never;
}

export type TableDetailLabelProps = TableDetailLabelLineProps | TableDetailLabelTextProps;

export const TableDetailLabel = React.forwardRef<HTMLParagraphElement, TableDetailLabelProps>(
  ({ label, value, children, className, ...props }, ref) => {
    if (children !== undefined && label === undefined && value === undefined)
      return (
        <p ref={ref} className={cn(detailLabel, className)} {...props}>
          {children}
        </p>
      );
    return (
      /* Horizontal, gap 4 (space.4); never wider than its container, so the value can truncate. */
      <p ref={ref} className={cn('flex max-w-full gap-1', detailLabel, className)} {...props}>
        <span data-part="label" className="shrink-0">
          {label}
        </span>{' '}
        <span data-part="value" className="min-w-0 truncate">
          {value}
        </span>
      </p>
    );
  },
);
TableDetailLabel.displayName = 'TableDetailLabel';
