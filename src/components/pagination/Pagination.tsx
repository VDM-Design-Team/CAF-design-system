import * as React from 'react';
import { cn } from '../../lib/cn';
import { PaginationItem, paginationItemVariants } from '../pagination-item';

/**
 * Pagination — built from the CAF Figma library, page "Pagination":
 * `Pagination`, the table pagination bar: an optional "Page X of Y" label,
 * the ‹ / › arrows, the page numbers and a … gap, all PaginationItems.
 *
 * Figma → code:
 * - Page Info      → `pageInfo` (default "Page {page} of {pageCount}").
 * - Show Page Info → `showPageInfo` (default true).
 * - The nested items' labels and states come from `page` and `pageCount`:
 *   the current page is Selected, ‹ is Disabled on the first page and › on
 *   the last.
 *
 * The table owns the page: `onPageChange` is called with the page to show.
 * It is a `<nav>`, so screen readers can jump to it; give it an
 * `aria-label` if a screen has more than one.
 */
export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The current page, from 1. */
  page: number;
  /** How many pages there are. */
  pageCount: number;
  /** Called with the page to show. */
  onPageChange?: (page: number) => void;
  /** Figma Show Page Info. Default true. */
  showPageInfo?: boolean;
  /** Figma Page Info. Default "Page {page} of {pageCount}". */
  pageInfo?: React.ReactNode;
}

/* The pages to show, with 'gap' for a …. Up to 7 pages show them all;
   otherwise the first and last pages, and five around the current one at an
   end (as Figma's 1 2 3 4 5 … 25) or three in the middle. */
export function pageWindow(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 'gap', pageCount];
  if (page >= pageCount - 3) return [1, 'gap', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  return [1, 'gap', page - 1, page, page + 1, 'gap', pageCount];
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ page, pageCount, onPageChange, showPageInfo = true, pageInfo, className, ...props }, ref) => {
    const go = (to: number) => () => onPageChange?.(to);
    return (
      <nav ref={ref} aria-label="Pagination" className={cn('flex w-fit items-center gap-2', className)} {...props}>
        {showPageInfo && (
          <span className="text-body-sm-regular text-text-subtle">{pageInfo ?? `Page ${page} of ${pageCount}`}</span>
        )}
        <PaginationItem aria-label="Previous page" disabled={page <= 1} onClick={go(page - 1)}>
          ‹
        </PaginationItem>
        {pageWindow(page, pageCount).map((p, i) =>
          p === 'gap' ? (
            // A gap, not a control: Figma draws it as an item with the label "…".
            <span key={`gap-${i}`} aria-hidden="true" className={paginationItemVariants()}>
              …
            </span>
          ) : (
            <PaginationItem key={p} aria-label={`Page ${p}`} selected={p === page} onClick={go(p)}>
              {p}
            </PaginationItem>
          ),
        )}
        <PaginationItem aria-label="Next page" disabled={page >= pageCount} onClick={go(page + 1)}>
          ›
        </PaginationItem>
      </nav>
    );
  },
);
Pagination.displayName = 'Pagination';
