import * as React from 'react';
import { cn } from '../../lib/cn';
import { TabListContext, type TabListContextValue } from '../tab-item/TabItem';

/**
 * Tabs — built from the CAF Figma library, page "Tabs": `Tabs / Cost Type`,
 * the segmented tabs above the Costs list (All / Recurring / Single), as a
 * generic tab list. Put TabItems in it.
 *
 * Figma → code:
 * - Selected (All, Recurring, Single) → `selected`: the `value` of the
 *   selected TabItem. Uncontrolled, `defaultSelected` (default: the first
 *   tab). `onSelectedChange` gets the value of the tab the user picks.
 * - The nested `Tabs / Tab Item` instances → TabItem `children`. Cost Type's
 *   three are one use of it: `<TabItem value="all">All</TabItem>` and so on.
 * - The bar: surface.elevated-secondary fill, 8 / 4 padding, 4px gap,
 *   radius 8 (all raw in Figma). It hugs its tabs.
 *
 * Keyboard (WAI-ARIA tabs, selection follows focus): Tab moves into the list
 * on the selected tab and out again; ← / → move to the previous / next tab
 * and wrap; Home / End go to the first / last. A tab is selected when it
 * takes focus, so the content below should be quick to show.
 *
 * It is a `role="tablist"`: give it an `aria-label` ("Cost type"). If the
 * content it switches is one element, make it a `role="tabpanel"` labelled
 * by the selected tab, and give each TabItem `aria-controls`.
 *
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("Tabs").
 */

/* The `value` of each TabItem among `children`, in order, looking into fragments. */
function tabValues(children: React.ReactNode): string[] {
  return React.Children.toArray(children).flatMap((child): string[] => {
    if (!React.isValidElement<{ value?: unknown; children?: React.ReactNode }>(child)) return [];
    if (child.type === React.Fragment) return tabValues(child.props.children);
    return typeof child.props.value === 'string' ? [child.props.value] : [];
  });
}

const STEP = new Map<string, 1 | -1 | 'first' | 'last'>([
  ['ArrowRight', 1],
  ['ArrowLeft', -1],
  ['Home', 'first'],
  ['End', 'last'],
]);

export interface UseTabListOptions {
  /** The selected tab's value (controlled). */
  selected?: string;
  /** The tab selected at first (uncontrolled). Default: the first tab. */
  defaultSelected?: string;
  /** Called with the value of the tab the user picks. */
  onSelectedChange?: (value: string) => void;
  /** The TabItems. */
  children: React.ReactNode;
  appearance: TabListContextValue['appearance'];
}

/**
 * A tab list's selection and keyboard, shared by Tabs and FormTabNavigation.
 * Returns the context for its TabItems and the list's `onKeyDown`.
 */
export function useTabList({ selected, defaultSelected, onSelectedChange, children, appearance }: UseTabListOptions) {
  const values = tabValues(children);
  const [uncontrolled, setUncontrolled] = React.useState(defaultSelected ?? values[0]);
  const current = selected !== undefined ? selected : uncontrolled;

  const select = React.useCallback(
    (next: string) => {
      if (next === current) return;
      if (selected === undefined) setUncontrolled(next);
      onSelectedChange?.(next);
    },
    [current, selected, onSelectedChange],
  );

  /* One tab is in the tab order: the selected one, or the first if none is. */
  const focusable = current !== undefined && values.includes(current) ? current : values[0];

  const context = React.useMemo<TabListContextValue>(
    () => ({ selected: current, focusable, select, appearance }),
    [current, focusable, select, appearance],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const step = STEP.get(event.key);
    if (step === undefined || event.altKey || event.ctrlKey || event.metaKey) return;
    const list = event.currentTarget;
    // This list's own tabs, not those of a tab list nested in a panel.
    const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).filter(
      (tab) => tab.closest('[role="tablist"]') === list,
    );
    const from = tabs.findIndex((tab) => tab.contains(event.target as Node));
    if (from < 0 || tabs.length === 0) return;
    event.preventDefault();
    const n = tabs.length;
    const to = step === 'first' ? 0 : step === 'last' ? n - 1 : (from + step + n) % n;
    tabs[to].focus();
    const value = tabs[to].dataset.value;
    if (value !== undefined) select(value);
  };

  return { context, onKeyDown };
}

export interface TabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'defaultValue' | 'onChange'> {
  /** Figma Selected: the selected TabItem's `value` (controlled). */
  selected?: string;
  /** The tab selected at first (uncontrolled). Default: the first tab. */
  defaultSelected?: string;
  /** Called with the value of the tab the user picks. */
  onSelectedChange?: (value: string) => void;
  /** The TabItems. */
  children: React.ReactNode;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, selected, defaultSelected, onSelectedChange, children, onKeyDown, ...props }, ref) => {
    const list = useTabList({ selected, defaultSelected, onSelectedChange, children, appearance: 'segmented' });
    return (
      <TabListContext.Provider value={list.context}>
        <div
          ref={ref}
          role="tablist"
          aria-orientation="horizontal"
          {...props}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (!event.defaultPrevented) list.onKeyDown(event);
          }}
          /* Auto layout: horizontal, 8 / 4 padding, gap 4, radius 8, surface.elevated-secondary. */
          className={cn('flex w-fit items-center gap-1 rounded-8 bg-surface-elevated-secondary px-1 py-2', className)}
        >
          {children}
        </div>
      </TabListContext.Provider>
    );
  },
);
Tabs.displayName = 'Tabs';
