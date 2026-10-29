import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * TabItem — built from the CAF Figma library, page "Tabs": `Tabs / Tab Item`
 * (State, with a Label), one tab in a tab list. It is a
 * `<button role="tab">`: put it in a Tabs (the segmented tabs) or a
 * FormTabNavigation, which select it and move focus between tabs.
 *
 * Figma → code:
 * - State=Selected → the list's `selected` (Tabs) or `active`
 *   (FormTabNavigation) is this tab's `value`. It sets `aria-selected`.
 * - State=Default  → any other tab.
 * - Label          → `children`.
 * - `value` names the tab. Figma has no such property: it is what the list's
 *   `selected` / `active` refers to.
 *
 * The list draws the tab. In Tabs it is `Tabs / Tab Item`; in
 * FormTabNavigation it is that component's Tab 1 / Tab 2 frames, which look
 * different (see FormTabNavigation). There is no prop for it.
 *
 * Only the selected tab is in the tab order (a roving tabindex): the list
 * moves focus with the arrow keys. Figma has no Hover, Focus or Disabled tab,
 * so there is no hover and no `disabled`; the focus ring is stroke.focused,
 * as on Button.
 *
 * Every colour and type style is the one the Figma layer is bound to, with
 * one correction. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("TabItem").
 */

/** What a tab list tells its tabs. Tabs and FormTabNavigation provide it. */
export interface TabListContextValue {
  /** The selected tab's `value`. */
  selected: string | undefined;
  /** The tab in the tab order: the selected one, or the first if none is. */
  focusable: string | undefined;
  /** Select a tab by its `value`. */
  select: (value: string) => void;
  /** Which Figma component draws the tabs. */
  appearance: 'segmented' | 'form';
}

export const TabListContext = React.createContext<TabListContextValue | null>(null);

export const tabItemVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap',
    // Figma has no Focus state; the ring is stroke.focused, as on Button.
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
  ],
  {
    variants: {
      appearance: {
        /* Tabs / Tab Item: 32 high (fixed), 0 / 16 padding, radius 8 (raw). Label: Body/sm-semibold. */
        segmented: 'h-8 rounded-8 px-4 text-body-sm-semibold',
        /* Form / Tab Navigation, Tab 1 / Tab 2: fill the bar equally, 8 / 16 padding, radius 6 (raw). */
        form: 'min-w-0 flex-1 rounded-6 px-4 py-2',
      },
      selected: { true: '', false: '' },
    },
    compoundVariants: [
      /* State=Selected: action.primary fill. The label is action.primary.content
         (Figma binds text.primary, which fails AA on the blue: see docs). */
      {
        appearance: 'segmented',
        selected: true,
        className: 'bg-action-primary-surface-default text-action-primary-content-default',
      },
      /* State=Default: no fill, text.subtle label. */
      { appearance: 'segmented', selected: false, className: 'text-text-subtle' },
      /* Form, the Active tab: surface.base fill, text.primary label, Body/sm-medium. */
      { appearance: 'form', selected: true, className: 'bg-surface-base text-body-sm-medium text-text-primary' },
      /* Form, the other tab: no fill, text.subtle label, Body/sm-regular. */
      { appearance: 'form', selected: false, className: 'text-body-sm-regular text-text-subtle' },
    ],
    defaultVariants: { appearance: 'segmented', selected: false },
  },
);

export interface TabItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role' | 'value' | 'disabled' | 'tabIndex'> {
  /** Names the tab: the list's `selected` (or `active`) refers to it. */
  value: string;
}

export const TabItem = React.forwardRef<HTMLButtonElement, TabItemProps>(
  ({ className, value, type = 'button', onClick, ...props }, ref) => {
    const list = React.useContext(TabListContext);
    if (!list) throw new Error('TabItem must be inside Tabs or FormTabNavigation.');
    const selected = list.selected === value;
    return (
      <button
        type={type}
        {...props}
        ref={ref}
        role="tab"
        aria-selected={selected}
        tabIndex={value === list.focusable ? 0 : -1}
        data-value={value}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) list.select(value);
        }}
        className={cn(tabItemVariants({ appearance: list.appearance, selected }), className)}
      />
    );
  },
);
TabItem.displayName = 'TabItem';
