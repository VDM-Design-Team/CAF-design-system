import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * FormSectionHeader — built from the CAF Figma library, page "Form":
 * `Form / Section Header` (Show Description) and `Form / Section Header –
 * Action`, which open a section of a long form ("Beneficiary Information",
 * "Recurring Details", "Breakdowns" in Form / New Cost and the side sheet).
 *
 * Figma → code:
 * - `_Section Title`'s Title → `title`: Body/lg-regular, text/primary, a heading.
 * - Show Description + `_Description Text`'s Text → `description`:
 *   Body/sm-regular, text/subtle, space.4 under the title.
 * - Section Header – Action's Action Button → `action`, at the far end and
 *   centred on the title. Figma's is a Button size="small" variant="text"
 *   with a plus icon: "Add new".
 *
 * The title is an `<h2>`, under the page's heading. `headingLevel` moves it
 * (an `<h3>` inside a modal or a side sheet, whose own title is the `<h2>`)
 * without changing the look.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md ("FormSectionHeader").
 */
export interface FormSectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Figma _Section Title's Title. */
  title: React.ReactNode;
  /** Figma Show Description + _Description Text's Text. */
  description?: React.ReactNode;
  /** Figma Section Header – Action's button: a Button, size="small" variant="text". */
  action?: React.ReactNode;
  /** The title's heading level. Default 2. */
  headingLevel?: 2 | 3 | 4;
}

export const FormSectionHeader = React.forwardRef<HTMLDivElement, FormSectionHeaderProps>(function FormSectionHeader(
  { title, description, action, headingLevel = 2, className, ...props },
  ref,
) {
  const Heading = `h${headingLevel}` as const;
  return (
    /* Section Header – Action: title and action at either end, centred. Figma's gap is 0; code keeps space.16 between them. */
    <div ref={ref} className={cn('flex w-full items-center justify-between gap-4', className)} {...props}>
      {/* Section Header: the title, and the description space.4 under it. */}
      <div className="flex min-w-0 flex-col gap-1">
        <Heading className="text-body-lg-regular text-text-primary">{title}</Heading>
        {description != null && description !== false && (
          <p className="text-body-sm-regular text-text-subtle">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
});
FormSectionHeader.displayName = 'FormSectionHeader';
