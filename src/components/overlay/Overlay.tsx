import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Overlay — the modal layer every CAF dialog sits on: ModalDialog,
 * ModalConfirm and SideSheet are built on it, and so is any modal Figma
 * composes from `Modal / Header` (Payment Schedules, Changelog).
 *
 * Figma → code: the CAF Figma library has no Overlay component. The
 * Patterns – Admin page (04 Confirm, 05 Create or edit in a modal, 06 Edit in
 * a side sheet) draws it as a frame named "Overlay" over the page:
 * - Fill → `surface.overlay` (the bound variable; its alpha is the 75% the
 *   frame shows). It flips in Dark.
 * - Auto layout, centred → `placement="center"` (Modal / Confirm and Modal /
 *   Dialog sit in the middle).
 * - Auto layout, right, top → `placement="right"` (Panel / Side Sheet sits
 *   against the right edge, full height).
 *
 * Everything else is behaviour, hand-built like VCP's Modal (no Radix, no
 * React Aria, no new dependency):
 * - It renders through a portal to `document.body`, so no ancestor clips it.
 *   Nothing touches `document` during render.
 * - The panel is the dialog: `role="dialog"` (or `alertdialog`) with
 *   `aria-modal="true"`. Name it with `aria-labelledby` (the visible title's
 *   id) or, with no visible title, `aria-label`.
 * - Open: it remembers what had focus, moves focus to `initialFocusRef` or the
 *   panel, makes every other child of `<body>` inert and locks the page scroll
 *   (giving the scrollbar's width back as padding, so nothing shifts).
 * - While open: Tab and Shift+Tab wrap inside the panel. Escape asks to close,
 *   unless a popup inside it is open (a MenuDropdown): that closes first. A
 *   click on the backdrop asks to close when `dismissible` (the default). With
 *   several open, only the innermost answers the keyboard.
 * - Close: the page comes back, and focus returns to what opened it (or
 *   `returnFocusRef`).
 *
 * The overlay never closes itself: `onClose` asks, and the owner sets `open`.
 * Every class is a token utility. Where code departs from Figma, the reason is
 * in docs/figma-sync.md ("Overlay" and the modal components).
 */
const backdrop = cva('fixed inset-0 z-50 flex bg-surface-overlay', {
  variants: {
    placement: {
      /* Figma centres the dialog in the Overlay frame. Code keeps space.16 from
         the viewport's edges, so a dialog never touches them on a small screen. */
      center: 'items-center justify-center p-4',
      /* Figma aligns the side sheet right and top, full height. */
      right: 'items-stretch justify-end',
    },
  },
  defaultVariants: { placement: 'center' },
});

/* ── Scroll lock ───────────────────────────────────────────────────────────
   Module-level and counted, as in VCP: two overlays opening in sequence (or one
   opening while another unmounts) must not leak the lock. The body's own inline
   styles are saved on the first lock and restored on the last unlock. */
let lockCount = 0;
let savedBodyStyle: { overflow: string; paddingRight: string } | null = null;

function lockScroll() {
  lockCount += 1;
  if (lockCount > 1) return;
  const body = document.body;
  savedBodyStyle = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
  /* Hiding the scrollbar gives its width back to the page, which jumps. Pad it back. */
  const gutter = window.innerWidth - document.documentElement.clientWidth;
  const current = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
  body.style.overflow = 'hidden';
  if (gutter > 0) body.style.paddingRight = `${current + gutter}px`;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0 || !savedBodyStyle) return;
  document.body.style.overflow = savedBodyStyle.overflow;
  document.body.style.paddingRight = savedBodyStyle.paddingRight;
  savedBodyStyle = null;
}

/* ── The page behind goes inert ────────────────────────────────────────────
   `inert` takes the background out of the focus order and the accessibility
   tree in one attribute. A mark records which nodes this overlay changed, so an
   inner overlay never un-hides what an outer one hid. */
const INERT_MARK = 'data-caf-overlay-inert';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE', 'NOSCRIPT']);

function hideBackground(portal: HTMLElement): () => void {
  const changed: { el: HTMLElement; hadInert: boolean }[] = [];
  for (const node of Array.from(document.body.children)) {
    if (!(node instanceof HTMLElement) || node === portal) continue;
    if (node.hasAttribute(INERT_MARK) || SKIP_TAGS.has(node.tagName)) continue;
    changed.push({ el: node, hadInert: node.hasAttribute('inert') });
    node.setAttribute(INERT_MARK, '');
    node.setAttribute('inert', '');
  }
  return () => {
    for (const { el, hadInert } of changed) {
      el.removeAttribute(INERT_MARK);
      if (!hadInert) el.removeAttribute('inert');
    }
  };
}

/* Every open panel, innermost last. Only the last one answers the keyboard. */
const openPanels: HTMLElement[] = [];

/* The trigger of an open popup (MenuDropdown, Select, a date picker): Escape is theirs first. */
const OPEN_POPUP = '[aria-haspopup]:not([aria-haspopup="false"])[aria-expanded="true"]';

/* ── Focus trap ────────────────────────────────────────────────────────────── */
const FOCUSABLE = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/* The panel's tabbable elements in document order, fresh on every Tab, so
   content that appears while it is open is trapped too. */
function tabbable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    if (el.closest('[inert]')) return false;
    if ((el as HTMLButtonElement).disabled || el.hidden || el.tabIndex < 0) return false;
    if (el instanceof HTMLInputElement && el.type === 'hidden') return false;
    /* No boxes: display:none or detached. */
    return el.getClientRects().length > 0;
  });
}

/**
 * A scrolling region must be reachable from the keyboard (WCAG 2.1.1, axe's
 * scrollable-region-focusable). Returns a tab index for the region: 0 while
 * its content overflows, none while it doesn't (a stop that does nothing).
 */
export function useScrollableTabStop(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  const [scrollable, setScrollable] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const measure = () => setScrollable(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  });
  return scrollable ? 0 : undefined;
}

type OverlayNameProps =
  /** The id of the visible title. The usual way to name the dialog. */
  | { 'aria-labelledby': string; 'aria-label'?: undefined }
  /** Only for a dialog with no visible title. */
  | { 'aria-label': string; 'aria-labelledby'?: undefined };

export type OverlayPlacement = 'center' | 'right';

interface OverlayBaseProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'aria-modal' | 'aria-label' | 'aria-labelledby'> {
  /** Whether it is shown. Nothing is rendered while `false`. */
  open: boolean;
  /** Asked to close: Escape, and a backdrop click when `dismissible`. The owner sets `open`. */
  onClose: () => void;
  /** Where the panel sits: in the middle (default), or against the right edge at full height. */
  placement?: OverlayPlacement;
  /** `alertdialog` for a confirmation the user must answer. Default `dialog`. */
  role?: 'dialog' | 'alertdialog';
  /** A click on the backdrop asks to close. Default true. Escape always does. */
  dismissible?: boolean;
  /** Where focus goes on open. Default: the panel. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Where focus goes on close. Default: whatever had focus when it opened. */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /** Merged onto the backdrop with `cn()`. `className` styles the panel. */
  backdropClassName?: string;
  /** The panel's content. */
  children?: React.ReactNode;
}

export type OverlayProps = OverlayBaseProps & OverlayNameProps;

export const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>(function Overlay(
  {
    open,
    onClose,
    placement = 'center',
    role = 'dialog',
    dismissible = true,
    initialFocusRef,
    returnFocusRef,
    backdropClassName,
    className,
    children,
    ...props
  },
  ref,
) {
  /* Safe on a server: `document` is read only after mount. */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const portalRef = React.useRef<HTMLDivElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  /* A click closes only if it also started on the backdrop: a text selection
     dragged out of the panel must not close it. */
  const downOnBackdrop = React.useRef(false);

  /* The open effect must not rerun when an owner passes a new arrow function
     each render, so it reads the live values through a ref. */
  const latest = React.useRef({ onClose, initialFocusRef, returnFocusRef });
  React.useEffect(() => {
    latest.current = { onClose, initialFocusRef, returnFocusRef };
  });

  React.useEffect(() => {
    if (!open || !mounted) return;
    const panel = panelRef.current;
    const portal = portalRef.current;
    if (!panel || !portal) return;

    const active = document.activeElement;
    const opener = latest.current.returnFocusRef?.current ?? (active instanceof HTMLElement ? active : null);

    const restoreBackground = hideBackground(portal);
    lockScroll();
    openPanels.push(panel);
    (latest.current.initialFocusRef?.current ?? panel).focus({ preventScroll: true });

    /* On document, capturing, so it still works if focus ends up outside. */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || openPanels[openPanels.length - 1] !== panel) return;
      if (event.key === 'Escape') {
        /* A popup open inside the panel (a menu, a listbox, a calendar) closes
           first: its own Escape handler takes this one. */
        if (panel.querySelector(OPEN_POPUP)) return;
        event.preventDefault();
        event.stopPropagation();
        latest.current.onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = tabbable(panel);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const inside = current instanceof Node && panel.contains(current);
      if (event.shiftKey) {
        if (!inside || current === first || current === panel) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inside || current === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      const index = openPanels.indexOf(panel);
      if (index !== -1) openPanels.splice(index, 1);
      unlockScroll();
      /* The page comes back first, so the opener can take focus again. */
      restoreBackground();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={portalRef}
      data-overlay=""
      className={cn(backdrop({ placement }), backdropClassName)}
      onPointerDown={(event) => {
        downOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || !downOnBackdrop.current) return;
        downOnBackdrop.current = false;
        if (dismissible) {
          onClose();
          return;
        }
        /* Not dismissible: the click took focus to <body>, so put it back inside. */
        panelRef.current?.focus({ preventScroll: true });
      }}
    >
      <div
        {...props}
        ref={(node) => {
          panelRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        role={role}
        aria-modal="true"
        /* Focus lands here by script, never by Tab: no ring on the container. Controls inside keep theirs. */
        tabIndex={-1}
        className={cn('outline-none', className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
});
Overlay.displayName = 'Overlay';

export const OVERLAY_PLACEMENTS = ['center', 'right'] as const;
