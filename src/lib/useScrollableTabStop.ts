import * as React from 'react';

/**
 * A scrolling region must be reachable from the keyboard (WCAG 2.1.1, axe's
 * scrollable-region-focusable): focused, the arrow keys scroll it. Returns a
 * tab index for the region: 0 while its content overflows along `axis`, none
 * while it doesn't (a stop that does nothing).
 *
 * - `y` (default): a modal's body, a list in a modal.
 * - `x`: TableList's scroll region, which scrolls sideways on a narrow screen.
 *
 * Measured before paint and again whenever the region or its content changes
 * size (a resize, rows loading, a font loading).
 */
export function useScrollableTabStop(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
  axis: 'x' | 'y' = 'y',
) {
  const [scrollable, setScrollable] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    /* 1px of slack: a sub-pixel table rounds up to one more than its box without hiding anything. */
    const measure = () =>
      setScrollable(axis === 'x' ? el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  });
  return scrollable ? 0 : undefined;
}
