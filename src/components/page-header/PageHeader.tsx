import * as React from 'react';
import { cn } from '../../lib/cn';
import { Divider } from '../divider';

/**
 * PageHeader — built from the CAF Figma library, page "Layout": `Page Header`,
 * the top of every list and form page (pattern 01's page header, 518:273 and
 * 518:557; the Admin screens, e.g. Costs 2102:5749 and Announcements
 * 2102:6628). Form pages use it too: there is no separate form heading.
 *
 * Figma → code:
 * - Title → `title`: Heading/xl-bold in text.primary, an `<h1>` (the page's
 *   heading; `headingLevel` changes the element, not the look).
 * - Show Description + Description → `description`: Body/sm-regular in
 *   text.secondary, 4px under the title. Left out when not given.
 * - Show Tabs + Tabs → `tabs`: to the right of the title, after a vertical
 *   Divider, 20px apart on each side (the Costs pages' Tabs / Cost Type).
 * - Show Actions, Secondary Action, Primary Action → `actions`: the page's
 *   Buttons (or a MenuTriggerButton), 12px apart, primary last. Name the
 *   action for its item ("New Announcement").
 *
 * Horizontal and centred, 24px between the title block and the actions;
 * it wraps on a narrow screen. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("PageHeader").
 */
export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Figma Title: the page's name ("Costs", "Cost Centers"). */
  title: React.ReactNode;
  /** Figma Description: a line under the title. */
  description?: React.ReactNode;
  /** Figma Tabs: shown after the title and a vertical divider (the Costs pages' Tabs). */
  tabs?: React.ReactNode;
  /** Figma Secondary Action and Primary Action: the page's actions, primary last. */
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
    <div ref={ref} className={cn('flex flex-wrap items-center gap-6', className)} {...props}>
      {/* Title + Tabs: fills the row. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-5">
        {/* Title + Description: 4px apart. */}
        <div className="flex min-w-0 flex-col gap-1">
          <Heading className="text-heading-xl-bold text-text-primary">{title}</Heading>
          {description && <p className="text-body-sm-regular text-text-secondary">{description}</p>}
        </div>
        {tabs && (
          <div className="flex items-center gap-5">
            <Divider orientation="vertical" aria-hidden="true" />
            {tabs}
          </div>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
});
PageHeader.displayName = 'PageHeader';
