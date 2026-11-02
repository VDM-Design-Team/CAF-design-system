import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * PageHeader — a story-level page scaffold, not a library component: the
 * CAF Figma library has no Page Header component. Every list and form page
 * draws one as a frame (pattern 01's "Page Header", 518:273 and 518:557; the
 * Admin screens, e.g. Costs 2102:5749 and Announcements 2102:6628), and the
 * Patterns pages' own header (518:232) is the same title-and-description
 * shape. Patterns and templates use this so their pages agree.
 *
 * Figma → code:
 * - Title → `title`, Heading/xl-bold in text.primary, as an `<h1>` (the
 *   page's heading; `headingLevel` changes it, not the look).
 * - Description (Announcements: "Manage application announcements and
 *   updates") → `description`, Body/sm-regular in text.secondary, 4px under
 *   the title.
 * - Title + Tabs (Costs: the Tabs / Cost Type next to the title, 20px apart)
 *   → `tabs`. Figma puts a 1px divider between them; there is no Divider
 *   component, so it is left out.
 * - Actions (right; the primary action last, secondary ones to its left,
 *   12px apart) → `actions`: Buttons, a MenuTriggerButton.
 *
 * Horizontal, space-between, centred; it wraps on a narrow screen.
 */
export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The page's title ("Costs", "Cost Centers"). */
  title: React.ReactNode;
  /** A line under the title. */
  description?: React.ReactNode;
  /** Shown next to the title: the Costs pages' Tabs / Cost Type. */
  tabs?: React.ReactNode;
  /** The page actions, primary last. */
  actions?: React.ReactNode;
  /** The title's heading level. Default 1. It doesn't change the look. */
  headingLevel?: 1 | 2;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader(
  { title, description, tabs, actions, headingLevel = 1, className, ...props },
  ref,
) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div ref={ref} className={cn('flex flex-wrap items-center justify-between gap-4', className)} {...props}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-5">
          <Heading className="text-heading-xl-bold text-text-primary">{title}</Heading>
          {tabs}
        </div>
        {description && <p className="text-body-sm-regular text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
});
PageHeader.displayName = 'PageHeader';
