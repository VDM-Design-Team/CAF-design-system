import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';
import { IconButton } from '../icon-button';

/**
 * Alert — built from the CAF Figma library, page "Feedback": `Alert` (Type ×
 * Size), the inline banner that sits inside a page or dialog, above the
 * content it relates to (Add New User's "Temporary password", Audit Logs'
 * "This cost was deleted"). For the result of an action, use a Toast.
 *
 * Figma → code:
 * - Type         → `type`: info (default), success, warning or error. It sets
 *   the tonal fill, the 1px inside border, the text and icon colour, and the
 *   icon (`info`, `check-circle`, `warning`, `x-circle`).
 * - Size         → `size`: default (title over message, top-aligned) or
 *   compact (one line: the message only; Figma hides the title layer).
 * - Title        → `title` (Body/sm-semibold). Default size only.
 * - Message      → `message` (Caption/md-regular).
 * - Show Dismiss → `showDismiss` (default false, as in Figma): an IconButton
 *   ("x", Ghost, 32). Pressing it hides the alert and calls `onDismiss`.
 *
 * Error and Warning are `role="alert"`; Info and Success are `role="status"`.
 * The icon is decorative: the role and the text carry the meaning.
 *
 * It fills its container's width: Figma's set is a fixed 464, but every
 * instance on the patterns is stretched to its column. Every colour is the
 * semantic variable the Figma layer is bound to. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("Alert").
 */
const alert = cva('flex w-full gap-3 rounded-8 inset-ring', {
  variants: {
    type: {
      /* Each Type: accent.<x>.tonal surface; its content for icon, title and message; accent.<x>.outline.border, 1px inside. */
      info: 'bg-accent-info-tonal-surface-default text-accent-info-tonal-content-default inset-ring-accent-info-outline-border-default',
      success:
        'bg-accent-success-tonal-surface-default text-accent-success-tonal-content-default inset-ring-accent-success-outline-border-default',
      warning:
        'bg-accent-warning-tonal-surface-default text-accent-warning-tonal-content-default inset-ring-accent-warning-outline-border-default',
      error:
        'bg-accent-critical-tonal-surface-default text-accent-critical-tonal-content-default inset-ring-accent-critical-outline-border-default',
    },
    size: {
      /* Size=Default: padding space.16, gap space.12, top-aligned. */
      default: 'items-start p-4',
      /* Size=Compact: Figma's raw 10 / 12 padding → space.12 all round; centred. */
      compact: 'items-center p-3',
    },
  },
  defaultVariants: { type: 'info', size: 'default' },
});

export type AlertType = 'info' | 'success' | 'warning' | 'error';
export type AlertSize = 'default' | 'compact';

/* Figma's icon per Type (Phosphor, Regular, 20px). */
const ICON: Record<AlertType, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  error: 'x-circle',
};

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'role'> {
  /** Figma Type: info (default), success, warning or error. */
  type?: AlertType;
  /** Figma Size: default (title + message) or compact (one line, the message only). */
  size?: AlertSize;
  /** Figma Title, in Body/sm-semibold. Shown in the default size only. */
  title?: React.ReactNode;
  /** Figma Message, in Caption/md-regular. */
  message?: React.ReactNode;
  /** Figma Show Dismiss. Default false. */
  showDismiss?: boolean;
  /** Called when the dismiss button is pressed, after the alert hides itself. */
  onDismiss?: () => void;
  /** The dismiss button's accessible name. Default "Dismiss". */
  dismissLabel?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { type = 'info', size = 'default', title, message, showDismiss = false, onDismiss, dismissLabel = 'Dismiss', className, ...props },
    ref,
  ) => {
    const [dismissed, setDismissed] = React.useState(false);
    if (dismissed) return null;

    return (
      <div
        ref={ref}
        role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
        className={cn(alert({ type, size }), className)}
        {...props}
      >
        <Icon name={ICON[type]} size={20} />
        {/* Figma's Text frame: a column, space.2 between title and message. */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {size === 'default' && title != null && <p className="text-body-sm-semibold">{title}</p>}
          {message != null && <p className="text-caption-md-regular">{message}</p>}
        </div>
        {showDismiss && (
          <IconButton
            icon="x"
            label={dismissLabel}
            /* -m-2: the 32px button takes the 16px slot Figma's bare X has, so the alert keeps Figma's height. */
            className="-m-2"
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
          />
        )}
      </div>
    );
  },
);
Alert.displayName = 'Alert';

export const ALERT_TYPES = ['info', 'success', 'warning', 'error'] as const;
export const ALERT_SIZES = ['default', 'compact'] as const;
