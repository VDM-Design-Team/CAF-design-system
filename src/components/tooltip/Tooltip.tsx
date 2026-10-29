import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Tooltip — built from the CAF Figma library, page "Feedback": `Tooltip`
 * (459:388), a short hint on hover, with an arrow pointing at its target.
 *
 * Figma → code:
 * - Text      → `text`, the hint. Plain text, never anything interactive: a
 *   tooltip can't be reached on touch and it disappears.
 * - Placement → `placement`: `top` (default; the tooltip above its target,
 *   the arrow below the label) or `bottom` (the reverse).
 * - Body      → fill `surface.neutral.stronger`, label `text.inverted.primary`
 *   in Caption/md-medium, radius `radius.6` (Figma: raw 6), padding
 *   `space.6` top and bottom and `space.8` at the sides (Figma: raw 6 / 10).
 * - Arrow     → Figma's 10×6 triangle (the same geometry, as an SVG viewBox),
 *   filled `surface.neutral.stronger`, centred on the body and touching it.
 * - The target is `children`: one focusable element, such as a Button or an
 *   IconButton. It is cloned to carry `aria-describedby`.
 *
 * Behaviour (hand-built like VCP's Tooltip and CAF's Popover: no positioning
 * library, no portal, no new dependency):
 * - It opens on hover, after a short pause, and at once on keyboard focus
 *   (`:focus-visible`), so a mouse click doesn't leave it stuck open.
 * - It closes on Escape (focus stays on the target), when the pointer leaves
 *   and when the target loses focus. The pointer can move onto the tooltip
 *   without closing it: the `space.4` gap to the target is the tooltip's own
 *   padding, so there is no dead zone (WCAG 1.4.13).
 * - `role="tooltip"`, and the target is described by it. Closed, it is
 *   `hidden`: still the target's description, never in the way.
 * - Centred on the target, `space.4` away. It flips to the other side when
 *   there's no room and more on the other side, and it is nudged back inside
 *   the viewport at the sides, with the arrow still on the target.
 * - No portal: a parent with `overflow: hidden` or `auto` clips it.
 *
 * Every class is a token utility. Where code departs from Figma, the reason is
 * in docs/figma-sync.md ("Tooltip").
 */

/** The positioner: centred on the target, `space.4` away (as padding, so the pointer can cross it). */
const tooltip = cva('absolute left-1/2 z-50 flex w-max max-w-64 -translate-x-1/2 flex-col items-center text-left', {
  variants: {
    placement: { top: 'bottom-full pb-1', bottom: 'top-full pt-1' },
  },
  defaultVariants: { placement: 'top' },
});

/* Body: surface.neutral.stronger fill, text.inverted.primary label in Caption/md-medium, radius 6, padding 6 / 8. */
const body =
  'rounded-6 bg-surface-neutral-stronger px-2 py-1.5 text-caption-md-medium text-text-inverted-primary wrap-break-word';

/* Arrow: Figma's 10×6 triangle. The height is space.6; the width follows the viewBox. */
const ARROW = { top: 'M0 0H10L5 6Z', bottom: 'M5 0L10 6H0Z' } as const;

/* A pause before hover opens it, so a sweep across a toolbar doesn't flash every tooltip. Focus never waits. */
const HOVER_DELAY = 300;

export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'content'> {
  /** Figma's Text: the hint. Plain text; nothing interactive. */
  text: React.ReactNode;
  /** Figma's Placement: above (default) or below the target. Flips when the viewport has no room. */
  placement?: TooltipPlacement;
  /** The target: one focusable element (a Button, an IconButton, a link). It gets `aria-describedby`. */
  children: React.ReactElement<any>;
  /** Controlled open state. Pair with `onOpenChange`. */
  open?: boolean;
  /** Uncontrolled starting state: open on first render (screenshots, Storybook). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Point several refs at one node. */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}

export const Tooltip = React.forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  {
    text,
    placement = 'top',
    children,
    open,
    defaultOpen = false,
    onOpenChange,
    className,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolled;

  /* The rendered open state, for timers and listeners: a change to the state it's already in is not reported. */
  const current = React.useRef(isOpen);
  current.current = isOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (current.current === next) return;
      if (open === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  const tooltipId = `${React.useId()}-tooltip`;
  const wrapperRef = React.useRef<HTMLSpanElement | null>(null);
  const tipRef = React.useRef<HTMLSpanElement | null>(null);

  /* Why it's open: the pointer is over it, or the target has keyboard focus. Either keeps it open. */
  const hovered = React.useRef(false);
  const focused = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = React.useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  React.useEffect(() => clearTimer, [clearTimer]);

  /* Escape dismisses it, wherever focus is (a hovered tooltip has none near it). When the key
     comes from its own target, Escape belongs to the tooltip: it doesn't also close the dialog
     or menu behind it. */
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (event.target instanceof Node && wrapperRef.current?.contains(event.target)) event.stopPropagation();
      clearTimer();
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, setOpen, clearTimer]);

  /* Flip and nudge. Measured before paint from the target's box and the tooltip's size, so it
     never shows on the wrong side first; re-measured on resize and on any scroll while open.
     The gap is read from the tooltip's own padding, and it is also the margin kept from the
     viewport's sides. The arrow moves back by the nudge, as far as the body's straight edge. */
  const [layout, setLayout] = React.useState({ side: placement, shift: 0, arrow: 0 });
  React.useLayoutEffect(() => {
    if (!isOpen) return;
    const place = () => {
      const anchor = wrapperRef.current;
      const tip = tipRef.current;
      if (!anchor || !tip) return;
      const box = anchor.getBoundingClientRect();
      const style = getComputedStyle(tip);
      const gap = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const { width, height } = tip.getBoundingClientRect();
      const viewWidth = document.documentElement.clientWidth;
      const viewHeight = document.documentElement.clientHeight;

      const above = box.top;
      const below = viewHeight - box.bottom;
      let side = placement;
      if (placement === 'top' && height > above && below > above) side = 'bottom';
      if (placement === 'bottom' && height > below && above > below) side = 'top';

      const centre = box.left + box.width / 2;
      const overLeft = gap - (centre - width / 2);
      const overRight = centre + width / 2 - (viewWidth - gap);
      const shift = overLeft > 0 ? overLeft : overRight > 0 ? -overRight : 0;

      const bubble = tip.querySelector<HTMLElement>('[data-tooltip-body]');
      const arrowWidth = tip.querySelector('svg')?.getBoundingClientRect().width ?? 0;
      const radius = bubble ? parseFloat(getComputedStyle(bubble).borderTopLeftRadius) : 0;
      const limit = Math.max(0, (bubble?.getBoundingClientRect().width ?? width) / 2 - radius - arrowWidth / 2);
      const arrow = Math.max(-limit, Math.min(limit, -shift));

      setLayout((prev) =>
        prev.side === side && prev.shift === shift && prev.arrow === arrow ? prev : { side, shift, arrow },
      );
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, placement]);

  const handleMouseEnter = (event: React.MouseEvent<HTMLSpanElement>) => {
    onMouseEnter?.(event);
    hovered.current = true;
    clearTimer();
    timer.current = setTimeout(() => setOpen(true), HOVER_DELAY);
  };
  const handleMouseLeave = (event: React.MouseEvent<HTMLSpanElement>) => {
    onMouseLeave?.(event);
    hovered.current = false;
    clearTimer();
    if (!focused.current) setOpen(false);
  };
  /* React's onFocus / onBlur bubble from the target, so they live on the wrapper. Only keyboard
     focus opens it; if the browser can't tell, it opens (the safe direction). */
  const handleFocus = (event: React.FocusEvent<HTMLSpanElement>) => {
    onFocus?.(event);
    let keyboard = true;
    try {
      keyboard = (event.target as Element).matches(':focus-visible');
    } catch {
      keyboard = true;
    }
    if (!keyboard) return;
    focused.current = true;
    clearTimer();
    setOpen(true);
  };
  const handleBlur = (event: React.FocusEvent<HTMLSpanElement>) => {
    onBlur?.(event);
    focused.current = false;
    if (hovered.current) return;
    clearTimer();
    setOpen(false);
  };

  const target = React.Children.only(children);
  const describedBy = [target.props?.['aria-describedby'], tooltipId].filter(Boolean).join(' ');

  const arrow = (
    <svg
      viewBox="0 0 10 6"
      aria-hidden="true"
      focusable="false"
      className="relative h-1.5 w-auto shrink-0 fill-surface-neutral-stronger"
      style={layout.arrow ? { left: layout.arrow } : undefined}
    >
      <path d={ARROW[layout.side]} />
    </svg>
  );

  return (
    <span
      {...props}
      ref={mergeRefs<HTMLSpanElement>(wrapperRef, ref)}
      className={cn('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {React.cloneElement(target, { 'aria-describedby': describedBy })}
      <span
        ref={tipRef}
        id={tooltipId}
        role="tooltip"
        hidden={!isOpen}
        data-placement={layout.side}
        className={tooltip({ placement: layout.side })}
        style={layout.shift ? { marginLeft: layout.shift } : undefined}
      >
        {layout.side === 'bottom' && arrow}
        <span data-tooltip-body="" className={body}>
          {text}
        </span>
        {layout.side === 'top' && arrow}
      </span>
    </span>
  );
});
Tooltip.displayName = 'Tooltip';

export const TOOLTIP_PLACEMENTS = ['top', 'bottom'] as const;
