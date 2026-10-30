import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * FilterSummary — built from the CAF Figma library, page "Filters":
 * `Filter / Summary` with its `Filter / Summary Line`s. A read-only record
 * of the filters something was made with (Export Details: "Search: All,
 * Status: All, Type: All"). It has no action: Figma's is read-only, and
 * the filters are changed in the Filter Bar, not here.
 *
 * Figma → code:
 * - Title → `title`, default "Current Filters" (Figma's default). It names
 *   the summary.
 * - The Filters frame and its Summary Lines → `filters`: one
 *   `{ key, value }` per line. Key → `key`, the filter's name ("Search");
 *   code adds the colon Figma types into the text. Value → `value`, what it
 *   is set to ("All").
 *
 * `Filter / Summary Line` is used only here, so it stays inside
 * FilterSummary rather than being its own component. The lines are a
 * `<dl>`: each key a `<dt>`, each value a `<dd>`. The whole is a group
 * named by its title. Every colour and type style is the one the Figma
 * layer is bound to. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("FilterSummary").
 */
export interface FilterSummaryFilter {
  /** Figma Key: the filter's name, e.g. "Status". The colon is added. */
  key: string;
  /** Figma Value: what it is set to, e.g. "All" or "Completed". */
  value: React.ReactNode;
}

export interface FilterSummaryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Figma Title. Default "Current Filters". */
  title?: React.ReactNode;
  /** One Summary Line per filter, in order. */
  filters: FilterSummaryFilter[];
}

export const FilterSummary = React.forwardRef<HTMLDivElement, FilterSummaryProps>(
  ({ title = 'Current Filters', filters, className, ...props }, ref) => {
    const titleId = React.useId();
    return (
      /* Vertical, gap 8; the box hugs its lines. */
      <div
        ref={ref}
        role="group"
        aria-labelledby={titleId}
        className={cn('flex flex-col items-start gap-2', className)}
        {...props}
      >
        {/* Title — Body/sm-medium, text.secondary. */}
        <p id={titleId} className="text-body-sm-medium text-text-secondary">
          {title}
        </p>
        {/* Filters — 12px top and bottom, 16px sides, 6px gap, radius 8; surface.elevated-secondary. */}
        <dl className="flex flex-col gap-1.5 rounded-8 bg-surface-elevated-secondary px-4 py-3">
          {filters.map(({ key, value }) => (
            /* Summary Line — horizontal, gap 4. */
            <div key={key} className="flex gap-1">
              {/* Key — Body/sm-semibold, text.primary. */}
              <dt className="text-body-sm-semibold text-text-primary">{key}:</dt>
              {/* Value — Body/sm-regular, text.secondary. */}
              <dd className="min-w-0 text-body-sm-regular break-words text-text-secondary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  },
);
FilterSummary.displayName = 'FilterSummary';
