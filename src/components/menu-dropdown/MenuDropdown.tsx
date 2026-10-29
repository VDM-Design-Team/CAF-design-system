import * as React from 'react';
import { cn } from '../../lib/cn';
import { Popover, type PopoverProps } from '../popover';

/**
 * MenuDropdown — built from the CAF Figma library, page "Menus":
 * `Menu / Dropdown`, the overflow and action menu (row •••, Export, the bulk
 * Change Status). It is a Popover with `role="menu"` and the menu button
 * keyboard pattern. Put MenuItems in it.
 *
 * Figma → code:
 * - The panel → Popover's surface, which is this component's: fill, 1px
 *   inside stroke, radius, elevation and padding.
 * - Auto layout, vertical, 2px between items → `gap-0.5`.
 * - Fixed width 212 (raw) → at least 256 (`space.256`), wider for a longer label.
 * - Item instances → MenuItem `children`. Figma's "hide unused items" is
 *   leaving them out.
 *
 * Keyboard (WAI-ARIA menu button):
 * - On the trigger: Enter, Space or ↓ opens the menu on the first item; ↑
 *   opens it on the last. A click opens it on the first item too.
 * - In the menu: ↓ / ↑ move to the next / previous item and wrap; Home / End
 *   go to the first / last; Enter or Space chooses the item, which closes the
 *   menu; Escape and Tab close it. Focus then goes back to the trigger.
 *
 * Positioning, outside click and focus return are Popover's. Where code
 * departs from Figma, the reason is in docs/figma-sync.md ("MenuDropdown").
 */
const ITEM = '[role="menuitem"]';

export interface MenuDropdownProps
  extends Omit<PopoverProps, 'panelRole' | 'autoFocus' | 'panelProps' | 'panelRef' | 'children'> {
  /** The MenuItems. */
  children: React.ReactNode;
}

export const MenuDropdown = React.forwardRef<HTMLDivElement, MenuDropdownProps>(function MenuDropdown(
  { trigger, children, open, defaultOpen = false, onOpenChange, panelClassName, ...props },
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

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const items = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(ITEM) ?? []);

  /* Which item takes focus when the menu opens: the first, unless ↑ opened it. */
  const openOn = React.useRef<'first' | 'last'>('first');

  /* Focus moves into the menu when it opens. Not when it starts open
     (`defaultOpen`), so a page with an open menu doesn't steal focus on load. */
  const wasOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const list = items();
      (openOn.current === 'last' ? list[list.length - 1] : list[0])?.focus();
      openOn.current = 'first';
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  /* ↓ / ↑ on the trigger open the menu on the first / last item. Enter and
     Space are the trigger's own click. */
  const wiredTrigger = React.cloneElement(trigger, {
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      trigger.props?.onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const which = event.key === 'ArrowDown' ? 'first' : 'last';
      if (isOpen) {
        const list = items();
        (which === 'last' ? list[list.length - 1] : list[0])?.focus();
      } else {
        openOn.current = which;
        setOpen(true);
      }
    },
  });

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    if (list.length === 0) return;
    const at = list.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    switch (event.key) {
      case 'ArrowDown':
        next = list[(at + 1) % list.length];
        break;
      case 'ArrowUp':
        next = list[at <= 0 ? list.length - 1 : at - 1];
        break;
      case 'Home':
        next = list[0];
        break;
      case 'End':
        next = list[list.length - 1];
        break;
      case 'Tab':
        /* Tab leaves the menu: close it and hand focus back to the trigger. */
        event.preventDefault();
        setOpen(false);
        return;
      default:
        /* Enter and Space: the items are buttons, so the browser clicks them. Escape is Popover's. */
        return;
    }
    event.preventDefault();
    next?.focus();
  };

  /* An item was chosen: its own onClick has run (it bubbles here after), so close.
     The item's handler can call preventDefault() to keep the menu open. */
  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    if ((event.target as Element).closest(ITEM)) setOpen(false);
  };

  return (
    <Popover
      ref={ref}
      trigger={wiredTrigger}
      open={isOpen}
      onOpenChange={setOpen}
      panelRole="menu"
      panelRef={panelRef}
      panelProps={{ onKeyDown, onClick }}
      /* Figma: vertical auto layout, 2px item spacing, fixed 212 → min 256. */
      panelClassName={cn('flex min-w-64 flex-col gap-0.5', panelClassName)}
      {...props}
    >
      {children}
    </Popover>
  );
});
MenuDropdown.displayName = 'MenuDropdown';
