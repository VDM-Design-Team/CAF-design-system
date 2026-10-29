import * as React from 'react';
import { cn } from '../../lib/cn';
import { TabListContext } from '../tab-item/TabItem';
import { useTabList } from '../tabs/Tabs';

/**
 * FormTabNavigation — built from the CAF Figma library, page "Form":
 * `Form / Tab Navigation` (Active, with Tab 1 Label and Tab 2 Label), the
 * full-width switch at the top of the New Cost form (Single Cost /
 * Recurring Cost). Put TabItems in it.
 *
 * It works like Tabs but doesn't look like it, so it is its own component:
 * - The bar is full width (Figma: fixed 510) with 4px padding and no gap,
 *   and its tabs share the width equally. Tabs hugs its tabs.
 * - The Active tab is a raised surface.base pill (radius 6) with a
 *   text.primary Body/sm-medium label. Tabs' selected tab is the
 *   action.primary blue with a Body/sm-semibold label.
 * - The other tab is text.subtle in Body/sm-regular (Tabs: semibold).
 *
 * Figma → code:
 * - Active (Tab 1, Tab 2) → `active`: the `value` of the active TabItem.
 *   Uncontrolled, `defaultActive` (default: the first tab).
 *   `onActiveChange` gets the value of the tab the user picks.
 * - Tab 1 Label, Tab 2 Label → the TabItems' `children`, in order. Figma
 *   draws two tabs; code takes any number.
 * - The bar: surface.elevated-secondary fill, 4px padding, radius 8 (raw).
 *
 * Keyboard and roles are Tabs': a `role="tablist"` (give it an
 * `aria-label`), ← / → / Home / End move between tabs and select them.
 *
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("FormTabNavigation").
 */
export interface FormTabNavigationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'defaultValue' | 'onChange'> {
  /** Figma Active: the active TabItem's `value` (controlled). */
  active?: string;
  /** The tab active at first (uncontrolled). Default: the first tab. */
  defaultActive?: string;
  /** Called with the value of the tab the user picks. */
  onActiveChange?: (value: string) => void;
  /** The TabItems: Tab 1, Tab 2. */
  children: React.ReactNode;
}

export const FormTabNavigation = React.forwardRef<HTMLDivElement, FormTabNavigationProps>(
  ({ className, active, defaultActive, onActiveChange, children, onKeyDown, ...props }, ref) => {
    const list = useTabList({
      selected: active,
      defaultSelected: defaultActive,
      onSelectedChange: onActiveChange,
      children,
      appearance: 'form',
    });
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
          /* Auto layout: horizontal, 4px padding, gap 0, radius 8, surface.elevated-secondary. */
          className={cn('flex w-full items-start rounded-8 bg-surface-elevated-secondary p-1', className)}
        >
          {children}
        </div>
      </TabListContext.Provider>
    );
  },
);
FormTabNavigation.displayName = 'FormTabNavigation';
