import * as React from 'react';
import { cn } from '../../lib/cn';
import { Toast, type ToastProps } from './Toast';

/**
 * ToastProvider and useToast — the toast host. Code only: Figma draws the
 * Toast, and pattern 12 ("Feedback messages", Patterns – Admin) says how the
 * stack behaves. Hand-built like VCP's (no library, no portal, no new
 * dependency):
 *
 * - Toasts stack at the bottom right, newest last, space.12 apart.
 * - Info and Success close on their own after 5 seconds (`TOAST_DURATION`).
 *   Warning and Error stay until dismissed, and so does any toast with an
 *   action: an action the user has to catch before it goes isn't usable
 *   (WCAG 2.2.1). `duration` overrides the timer, except with an action.
 * - The timer pauses while the pointer is over the toast or focus is inside
 *   it, and resumes with the time that was left.
 * - The X dismisses it. If focus was on it, focus moves to the next toast's
 *   X (or the previous one's), so a keyboard user isn't dropped on the page.
 * - The stack is an `aria-live="polite"` region, named "Notifications", that
 *   is in the page from the first render, empty. A region that arrives with
 *   its first message is often not announced, so toasts go into this one.
 *   Focus never moves to a toast on its own.
 *
 * Mount one `ToastProvider` near the root of the app; `useToast()` throws
 * outside it, because a toast raised without the region is silent to screen
 * readers.
 */

/** How long an Info or Success toast stays up: about 5 seconds, as pattern 12 says. */
export const TOAST_DURATION = 5000;

/** What `toast()` takes: the Toast's Figma props, plus the timer. */
export interface ToastOptions
  extends Pick<ToastProps, 'type' | 'message' | 'action' | 'showAction' | 'onAction' | 'dismissLabel'> {
  /**
   * Milliseconds before it closes itself, or `null` to stay until dismissed.
   * Default: `TOAST_DURATION` for Info and Success, `null` for Warning and
   * Error. A toast with `showAction` never closes itself.
   */
  duration?: number | null;
}

interface ToastRecord extends ToastOptions {
  id: string;
}

export interface ToastContextValue {
  /** Show a toast. Returns its id, for `dismiss`. */
  toast: (options: ToastOptions) => string;
  /** Close one toast. Safe to call with an id that has already gone. */
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/** Raise toasts from anywhere under a `ToastProvider`. */
export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error(
      'useToast() needs a <ToastProvider> above it. The provider renders the live region that announces toasts; ' +
        'without it a toast is silent to screen readers.',
    );
  }
  return context;
}

/* The pattern's rule: Info and Success time out; Warning, Error and anything with an action stay. */
function durationOf({ type = 'info', showAction, duration }: ToastOptions): number | null {
  if (showAction) return null;
  if (duration !== undefined) return duration;
  return type === 'info' || type === 'success' ? TOAST_DURATION : null;
}

/** One toast in the stack, with its timer. */
function TimedToast({ record, onDismiss }: { record: ToastRecord; onDismiss: (id: string) => void }) {
  const { id, duration: _duration, ...toastProps } = record;
  const duration = durationOf(record);

  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const paused = hovered || focused;

  /* Read through a ref, so a new callback doesn't restart the countdown. */
  const dismissRef = React.useRef(() => onDismiss(id));
  React.useEffect(() => {
    dismissRef.current = () => onDismiss(id);
  });

  /* What's left of the countdown: pausing banks it, resuming spends the rest. */
  const remaining = React.useRef(duration ?? 0);
  React.useEffect(() => {
    if (duration === null || paused) return;
    const started = Date.now();
    const timer = window.setTimeout(() => dismissRef.current(), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [duration, paused]);

  return (
    <Toast
      {...toastProps}
      data-toast-id={id}
      /* Observable timer state, for the stories. */
      data-duration={duration ?? undefined}
      data-paused={duration === null ? undefined : String(paused)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onDismiss={() => dismissRef.current()}
    />
  );
}

let sequence = 0;

export interface ToastProviderProps {
  children?: React.ReactNode;
  /** The stack's accessible name. Default "Notifications". */
  label?: string;
  /** Merged onto the stack with `cn()`. */
  className?: string;
}

export function ToastProvider({ children, label = 'Notifications', className }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<readonly ToastRecord[]>([]);
  const stackRef = React.useRef<HTMLElement | null>(null);

  const dismiss = React.useCallback((id: string) => {
    /* If focus is in the toast that's going, hand it to a neighbour's X before it goes. */
    const stack = stackRef.current;
    const items = stack ? [...stack.querySelectorAll<HTMLElement>('[data-toast-id]')] : [];
    const index = items.findIndex((item) => item.dataset.toastId === id);
    if (index >= 0 && items[index].contains(document.activeElement)) {
      const neighbour = items[index + 1] ?? items[index - 1];
      neighbour?.querySelector<HTMLElement>('[data-toast-dismiss]')?.focus();
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((options: ToastOptions) => {
    sequence += 1;
    const id = `caf-toast-${sequence}`;
    setToasts((current) => [...current, { ...options, id }]);
    return id;
  }, []);

  const value = React.useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        ref={stackRef}
        aria-label={label}
        aria-live="polite"
        /* Announce each toast as it arrives, not the whole stack again; removals aren't news. */
        aria-atomic="false"
        aria-relevant="additions"
        /* Click-through, so the stack never eats a click meant for the page; each toast turns pointer events back on. */
        className={cn(
          'pointer-events-none fixed right-0 bottom-0 z-50 flex max-w-full flex-col items-end gap-3 p-4',
          className,
        )}
      >
        {toasts.map((record) => (
          <TimedToast key={record.id} record={record} onDismiss={dismiss} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}
