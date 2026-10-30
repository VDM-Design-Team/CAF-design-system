import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * UserGreeting — built from the CAF Figma library, page "Navigation":
 * `Navigation / User Greeting` (4:245), the "Hi, {name}" at the right of the
 * top bar, before the theme toggle and the account icon.
 *
 * Figma → code:
 * - Username (text property, "Hi, QA Test") → `username`, the name alone
 *   ("QA Test"). The component writes "Hi, {username}", as Figma's
 *   description has it, so every screen greets the same way.
 * - The text layer → Body/sm-regular in `text.secondary`, hugging its text.
 *
 * It is plain text, not a heading or a control: who is signed in is also the
 * account menu's business. Every class is the token the Figma layer is bound
 * to. Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("UserGreeting").
 */
export interface UserGreetingProps extends Omit<React.HTMLAttributes<HTMLParagraphElement>, 'children'> {
  /** The signed-in person's name, e.g. "QA Test". Shown as "Hi, {username}". */
  username: string;
}

export const UserGreeting = React.forwardRef<HTMLParagraphElement, UserGreetingProps>(
  ({ username, className, ...props }, ref) => (
    <p
      ref={ref}
      /* Body/sm-regular, text.secondary; hugs its text and never wraps (Figma: Hug × Hug). */
      className={cn('shrink-0 whitespace-nowrap text-body-sm-regular text-text-secondary', className)}
      {...props}
    >
      Hi, {username}
    </p>
  ),
);
UserGreeting.displayName = 'UserGreeting';
