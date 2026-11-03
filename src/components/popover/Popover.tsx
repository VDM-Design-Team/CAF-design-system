import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Popover — a floating panel anchored to a trigger. Code only: the CAF Figma
 * library has no Popover. It is the overlay Menu / Dropdown, Select and the
 * Date picker are built on, hand-built like VCP's Popover (no positioning
 * library, no new dependency).
 *
 * Its surface is `Menu / Dropdown`'s (page "Menus"), so every CAF overlay
 * looks the same:
 * - Fill    → `surface.elevated` ("Cards, Widgets, Popovers"; since 3 Nov
 *   2026, decision menu-surface: it was `surface.neutral.faint`, the canvas)
 * - Stroke  → 1px inside `stroke.subtle` (an inset ring)
 * - Radius  → `radius.8`
 * - Effect  → `shadow-elevation-3` (Figma: the Elevation Light/3 style, GDL's
 *   Elevation 3). Tailwind compiles the utility to GDL's Light Elevation 3 in
 *   both themes (docs/figma-sync.md, "Popover").
 * - Padding → `space.6` on every side
 *
 * Behaviour:
 * - The trigger is cloned, so the real control keeps its own semantics. It
 *   gets `aria-expanded`, `aria-haspopup` (from `panelRole`) and, while the
 *   panel is open, `aria-controls`. A click toggles the panel.
 * - The panel opens below the trigger, `space.4` away, flush with its left or
 *   right edge: where the row actions pattern puts Menu / Dropdown.
 * - It flips: above the trigger when there's no room below and more above,
 *   and to the other edge when it would leave the viewport at the side.
 * - A pointer down outside closes it. So do Escape and focus leaving it. If
 *   focus was inside, it goes back to the trigger; a click elsewhere keeps
 *   its focus where the user put it.
 * - It doesn't trap focus: it is non-modal. Content the user must finish
 *   first belongs in a Modal.
 * - By default no portal: the panel is absolutely positioned in a relative
 *   wrapper, so a parent with `overflow: hidden` or `auto` clips it.
 * - `portal` (opt-in) renders the panel outside instead: in a portal on
 *   `document.body`, `position: fixed` at the trigger's box, re-placed on
 *   every scroll, resize and size change and every frame while open (so a
 *   layout shift that moves the trigger moves it too), above the page (`z-50`,
 *   after it in the DOM). For a trigger in a container that scrolls or clips, such as a
 *   table's scroll region: RowActionsMenu turns it on. Everything above still
 *   holds: the ARIA wiring, outside click, Escape, focus return. Tab keeps the
 *   inline order: from the open trigger into the panel, out of its last
 *   control to whatever follows the trigger, and Shift+Tab from its first
 *   control back to the trigger.
 *
 * Every class is a token utility. Where code departs from Figma, the reason is
 * in docs/figma-sync.md ("Popover").
 */

/** Menu / Dropdown's surface, for anything that floats: fill, 1px inside stroke, radius, elevation, padding. */
export const popoverSurface =
  'rounded-8 bg-surface-elevated p-1.5 text-text-primary shadow-elevation-3 inset-ring inset-ring-stroke-subtle';

const panel = cva(
  [
    'z-50 w-max text-left',
    /* Focusable only so a click on the panel's padding doesn't drop focus to the body. Never in the tab order. */
    'focus:outline-none',
  ],
  {
    variants: {
      /* In the trigger's wrapper (default), or on <body>, fixed at the trigger's box (the inline style sets the edges). */
      portal: { false: 'absolute', true: 'fixed' },
      /* space.4 between trigger and panel, as Figma's row actions pattern places it. */
      placement: { bottom: 'mt-1', top: 'mb-1' },
      /* Which edge of the panel lines up with the same edge of the trigger. */
      align: { left: '', right: '' },
      /* Off when the content draws its own surface (Date Picker / Calendar, / Range): the panel only positions it. */
      surface: { true: popoverSurface, false: '' },
    },
    compoundVariants: [
      { portal: false, placement: 'bottom', class: 'top-full' },
      { portal: false, placement: 'top', class: 'bottom-full' },
      { portal: false, align: 'left', class: 'left-0' },
      { portal: false, align: 'right', class: 'right-0' },
    ],
    defaultVariants: { portal: false, placement: 'bottom', align: 'left', surface: true },
  },
);

/** Roles a panel may take, and the `aria-haspopup` each one gives the trigger. */
const HASPOPUP = { dialog: 'dialog', menu: 'menu', listbox: 'listbox', grid: 'grid', tree: 'tree' } as const;

export type PopoverPanelRole = keyof typeof HASPOPUP;
export type PopoverPlacement = 'bottom' | 'top';
export type PopoverAlign = 'left' | 'right';

/* Everything that can hold focus inside a panel, for `autoFocus`. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/* What Tab can reach under `root`, in document order: not inert, not hidden, with a box. */
function tabbable(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && !el.closest('[inert]') && el.getClientRects().length > 0,
  );
}

/* Portals need `document`. True in the browser from the first render; false on a server and while hydrating. */
const noSubscribe = () => () => {};
const useCanPortal = () =>
  React.useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

/** The edges of a portalled panel, in viewport px (React adds the unit). */
type PanelEdges = Pick<React.CSSProperties, 'top' | 'bottom' | 'left' | 'right'>;

export interface PopoverProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'content'> {
  /**
   * The control that opens the panel: one element, such as a `Button` or an
   * `IconButton`. It is cloned to carry the ARIA wiring, a ref and the toggle;
   * its own `onClick` runs first, and `preventDefault()` there stops the toggle.
   */
  trigger: React.ReactElement<any>;
  /** What the panel holds. */
  children?: React.ReactNode;
  /** Controlled open state. Pair with `onOpenChange`. */
  open?: boolean;
  /** Uncontrolled starting state. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Below (default) or above the trigger. Flips when the viewport has no room. */
  placement?: PopoverPlacement;
  /** The trigger's edge the panel is flush with: left (default) or right. Flips at the viewport's side. */
  align?: PopoverAlign;
  /**
   * Move focus into the panel when it opens: the first focusable child, or the
   * panel. Off by default. Turn it on when the panel is a control the user is
   * meant to operate now (a date picker's calendar).
   */
  autoFocus?: boolean;
  /**
   * The panel's accessible name, with `panelRole`. Leave it off and the trigger
   * names the panel, unless `panelProps` carries an `aria-labelledby`.
   */
  label?: string;
  /** The panel's role, which also sets the trigger's `aria-haspopup`. MenuDropdown passes `"menu"`. */
  panelRole?: PopoverPanelRole;
  /**
   * Menu / Dropdown's surface on the panel (fill, stroke, radius, elevation,
   * padding). Default true. Turn it off when the content draws its own, as
   * Calendar and RangeCalendar do: the panel then only positions it.
   */
  surface?: boolean;
  /**
   * Render the panel outside the trigger's wrapper: in a portal on
   * `document.body`, fixed at the trigger's box. Default false. Turn it on when
   * the trigger sits in a container that scrolls or clips (a TableList's scroll
   * region, a modal's scrolling body), where the default panel is cut off at
   * the container's edge. RowActionsMenu turns it on. In tests, find the panel
   * with `screen`, not `within(canvasElement)`.
   */
  portal?: boolean;
  /** Merged onto the panel with `cn()`. `className` styles the wrapper. */
  panelClassName?: string;
  /** For a component built on Popover: props for the panel, such as its keyboard handler. */
  panelProps?: React.HTMLAttributes<HTMLDivElement>;
  /** A ref to the panel element, while it is open. */
  panelRef?: React.Ref<HTMLDivElement>;
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

export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    trigger,
    children,
    open,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom',
    align = 'left',
    autoFocus = false,
    label,
    panelRole,
    surface = true,
    portal = false,
    panelClassName,
    panelProps,
    panelRef: panelRefProp,
    className,
    ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolled;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  const generatedId = React.useId();
  const panelId = `${generatedId}-panel`;
  const triggerId: string = trigger.props?.id ?? `${generatedId}-trigger`;

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  /* Was focus inside the popover when it closed? Only then does closing move
     focus back to the trigger. A click or Tab somewhere else must not pull
     focus back: the user is already where they meant to be. */
  const focusWasInside = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen) return;
    /* The wrapper holds the trigger, and the panel unless it is portalled. */
    const inside = (node: EventTarget | null) =>
      node instanceof Node && (!!wrapperRef.current?.contains(node) || !!panelRef.current?.contains(node));

    const onPointerDown = (event: PointerEvent) => {
      if (inside(event.target)) return;
      focusWasInside.current = false;
      setOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      focusWasInside.current = inside(event.target);
      if (!focusWasInside.current) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, setOpen]);

  /* Focus on the way in (opt-in) and on the way out (when it was inside). */
  const wasOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen && !wasOpen.current) {
      focusWasInside.current = true;
      if (autoFocus) {
        const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? panelRef.current)?.focus();
      }
    } else if (!isOpen && wasOpen.current && focusWasInside.current) {
      triggerRef.current?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen, autoFocus]);

  /* Flip. Measured before paint from the trigger's box and the panel's size,
     so the panel never shows on the wrong side first. Re-measured on resize, on
     any scroll and on a size change (below) while open. The gap is read from the panel's own margin. */
  const [side, setSide] = React.useState({ placement, align });
  /* With `portal`: the panel's fixed edges, from the trigger's box. */
  const [edges, setEdges] = React.useState<PanelEdges | null>(null);
  React.useLayoutEffect(() => {
    if (!isOpen) return;
    const place = () => {
      const anchor = triggerRef.current;
      const floating = panelRef.current;
      if (!anchor || !floating) return;
      const box = anchor.getBoundingClientRect();
      const style = getComputedStyle(floating);
      const gap = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
      const height = floating.offsetHeight + gap;
      const width = floating.offsetWidth;
      const viewWidth = document.documentElement.clientWidth;
      const viewHeight = document.documentElement.clientHeight;

      const below = viewHeight - box.bottom;
      const above = box.top;
      let p = placement;
      if (placement === 'bottom' && height > below && above > below) p = 'top';
      if (placement === 'top' && height > above && below > above) p = 'bottom';

      let a = align;
      const roomRight = viewWidth - box.left; // flush left: the panel runs right from the trigger's left edge
      const roomLeft = box.right; // flush right: the panel runs left from the trigger's right edge
      if (align === 'left' && width > roomRight && roomLeft > roomRight) a = 'right';
      if (align === 'right' && width > roomLeft && roomRight > roomLeft) a = 'left';

      setSide((prev) => (prev.placement === p && prev.align === a ? prev : { placement: p, align: a }));

      /* Portalled: pin the panel's near edges to the trigger's. The panel's own
         margin still gives the space.4 gap, as it does inline. */
      if (portal) {
        const next: PanelEdges = {
          top: p === 'bottom' ? box.bottom : undefined,
          bottom: p === 'top' ? viewHeight - box.top : undefined,
          left: a === 'left' ? box.left : undefined,
          right: a === 'right' ? viewWidth - box.right : undefined,
        };
        setEdges((prev) =>
          prev &&
          prev.top === next.top &&
          prev.bottom === next.bottom &&
          prev.left === next.left &&
          prev.right === next.right
            ? prev
            : next,
        );
      }
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    /* Also when the trigger, the panel or the page's layout changes size (content
       loading into the panel, a font loading): resize and scroll don't fire then.
       A frame later, so a change that place() makes can't loop the observer. */
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    });
    for (const el of [triggerRef.current, panelRef.current, document.body]) if (el) observer.observe(el);
    /* Portalled, the panel is fixed to where the trigger was: a layout shift that
       moves the trigger without a scroll or a size change (content above it
       appearing, a transform) would leave it behind. So it also follows the
       trigger every frame while open. place() only sets state when an edge moved. */
    let follow = 0;
    const track = () => {
      place();
      follow = requestAnimationFrame(track);
    };
    if (portal) follow = requestAnimationFrame(track);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      observer.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(follow);
    };
  }, [isOpen, placement, align, portal]);

  /* Portalled, the panel isn't next to the trigger in the DOM, so Tab would skip
     it. These keep the inline order: the open trigger's Tab goes into the panel;
     Tab past its last control goes on to whatever follows the trigger (which
     closes it); Shift+Tab before its first control goes back to the trigger. A
     handler that already moved focus (MenuDropdown's Tab) calls preventDefault. */
  const onTriggerTab = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!portal || !isOpen || event.key !== 'Tab' || event.shiftKey || event.defaultPrevented) return;
    const first = panelRef.current ? tabbable(panelRef.current)[0] : undefined;
    if (!first) return;
    event.preventDefault();
    first.focus();
  };
  const onPanelTab = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const floating = panelRef.current;
    const anchor = triggerRef.current;
    if (!portal || event.key !== 'Tab' || event.defaultPrevented || !floating || !anchor) return;
    const items = tabbable(floating);
    const active = document.activeElement;
    if (event.shiftKey) {
      if (items.length > 0 && active !== items[0] && active !== floating) return;
      event.preventDefault();
      anchor.focus();
      return;
    }
    if (items.length > 0 && active !== items[items.length - 1]) return;
    event.preventDefault();
    const after = tabbable(document).find(
      (el) =>
        !floating.contains(el) &&
        !anchor.contains(el) &&
        !!(anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING),
    );
    (after ?? anchor).focus();
  };

  const triggerNode = React.cloneElement(trigger, {
    id: triggerId,
    ref: mergeRefs<HTMLElement>(triggerRef, trigger.props?.ref),
    'aria-expanded': isOpen,
    'aria-haspopup': panelRole ? HASPOPUP[panelRole] : undefined,
    /* Only while the panel exists: a reference to a missing id is worse than none. */
    'aria-controls': isOpen ? panelId : undefined,
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      trigger.props?.onClick?.(event);
      if (!event.defaultPrevented) setOpen(!isOpen);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      trigger.props?.onKeyDown?.(event);
      onTriggerTab(event);
    },
  });

  /* A portalled panel waits for the browser: nothing touches `document` on a server. */
  const canPortal = useCanPortal();

  const panelNode = (
    <div
      {...panelProps}
      ref={mergeRefs<HTMLDivElement>(panelRef, panelRefProp)}
      id={panelId}
      role={panelRole}
      /* A panel with a role needs a name: its own (`label`, or an `aria-labelledby`
         in panelProps, which Select passes on from its own), or the trigger's. */
      aria-label={panelRole && label ? label : undefined}
      aria-labelledby={panelRole && !label ? (panelProps?.['aria-labelledby'] ?? triggerId) : undefined}
      tabIndex={panelProps?.tabIndex ?? -1}
      data-placement={side.placement}
      data-align={side.align}
      /* Overlay leaves Tab in a portalled popup to the popup (its trigger is in the dialog). */
      data-popover-portal={portal ? '' : undefined}
      style={portal ? { ...panelProps?.style, ...edges } : panelProps?.style}
      onKeyDown={(event) => {
        panelProps?.onKeyDown?.(event);
        onPanelTab(event);
      }}
      className={cn(
        panel({ portal, placement: side.placement, align: side.align, surface }),
        panelClassName,
        panelProps?.className,
      )}
    >
      {children}
    </div>
  );

  return (
    <div ref={mergeRefs<HTMLDivElement>(wrapperRef, ref)} className={cn('relative inline-flex', className)} {...props}>
      {triggerNode}
      {isOpen && !portal && panelNode}
      {isOpen && portal && canPortal && createPortal(panelNode, document.body)}
    </div>
  );
});
Popover.displayName = 'Popover';

export const POPOVER_PLACEMENTS = ['bottom', 'top'] as const;
export const POPOVER_ALIGNS = ['left', 'right'] as const;
