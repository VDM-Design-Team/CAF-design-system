import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';
import { IconButton } from '../icon-button';

/**
 * Toast — built from the CAF Figma library, page "Feedback": `Toast` (Type),
 * the transient notification after Save, Upload or Export ("Cost saved.",
 * "Upload failed. … Retry"). For context that stays on screen, use an Alert.
 *
 * Figma → code:
 * - Type        → `type`: info (default), success, warning or error. It sets
 *   the icon and its colour (`accent.<x>.tonal.content`); the card is neutral.
 * - Message     → `message` (Body/sm-regular, `text.primary`).
 * - Action      → `action` (default "Undo", as in Figma), Body/sm-semibold in
 *   `text.link.default`. A `<button>`; `onAction` runs when it is pressed.
 * - Show Action → `showAction` (default false, as in Figma).
 * - The X       → always shown, as in Figma: an IconButton ("x", Ghost, 32)
 *   that calls `onDismiss`.
 *
 * The card: `surface.base` fill, 1px inside `stroke.subtle`, Elevation 3,
 * padding space.12 / space.16, gap space.12, 384 wide (Figma 380) or the
 * screen's width, whichever is less.
 *
 * A Toast has no role of its own. Raise it with `useToast()` inside a
 * `ToastProvider`: the provider's stack is the `aria-live="polite"` region
 * that announces it, and it handles the timer. Every colour is the semantic
 * variable the Figma layer is bound to. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("Toast").
 */
const toast = cva([
  'pointer-events-auto flex w-sm max-w-full items-center gap-3 px-4 py-3',
  /* Figma: surface.base fill, 1px inside stroke.subtle, raw radius 10 (→ radius.8), Elevation Dark/3. */
  'rounded-8 bg-surface-base shadow-elevation-3 inset-ring inset-ring-stroke-subtle',
]);

export type ToastType = 'info' | 'success' | 'warning' | 'error';

/* Figma's icon per Type (Phosphor, Regular, 20px), and the colour its vector is bound to. */
const ICON: Record<ToastType, [IconName, string]> = {
  info: ['info', 'text-accent-info-tonal-content-default'],
  success: ['check-circle', 'text-accent-success-tonal-content-default'],
  warning: ['warning', 'text-accent-warning-tonal-content-default'],
  error: ['x-circle', 'text-accent-critical-tonal-content-default'],
};

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma Type: info (default), success, warning or error. */
  type?: ToastType;
  /** Figma Message. Short, past tense and specific ("Cost saved."). */
  message: React.ReactNode;
  /** Figma Action: the action's label. Default "Undo". */
  action?: string;
  /** Figma Show Action. Default false. */
  showAction?: boolean;
  /** Called when the action is pressed. */
  onAction?: () => void;
  /** Called when the X is pressed. */
  onDismiss?: () => void;
  /** The X's accessible name. Default "Dismiss". */
  dismissLabel?: string;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      type = 'info',
      message,
      action = 'Undo',
      showAction = false,
      onAction,
      onDismiss,
      dismissLabel = 'Dismiss',
      className,
      ...props
    },
    ref,
  ) => {
    const [icon, colour] = ICON[type];
    return (
      <div ref={ref} className={cn(toast(), className)} {...props}>
        <Icon name={icon} size={20} className={colour} />
        <p className="min-w-0 flex-1 text-body-sm-regular text-text-primary">{message}</p>
        {showAction && (
          <button
            type="button"
            className={cn(
              'shrink-0 cursor-pointer rounded-4 text-body-sm-semibold text-text-link-default',
              // Figma has no Focus state; the ring is Button's.
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
            )}
            onClick={onAction}
          >
            {action}
          </button>
        )}
        <IconButton
          icon="x"
          label={dismissLabel}
          /* -m-2: the 32px button takes the 16px slot Figma's bare X has, so the toast keeps Figma's height. */
          className="-m-2"
          data-toast-dismiss=""
          onClick={onDismiss}
        />
      </div>
    );
  },
);
Toast.displayName = 'Toast';

export const TOAST_TYPES = ['info', 'success', 'warning', 'error'] as const;
