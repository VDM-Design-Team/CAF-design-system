import * as React from 'react';

/**
 * useFocusAfterRemoval — where focus goes after a list page removes a row
 * (pattern 04: confirm, then the row goes). Shared by the story-level list
 * pages (DraftsList, ContactsListPage); not a DS export.
 *
 * Call the function it returns with the rows on screen and the one being
 * removed, in the same event as the removal. After the next render, focus goes
 * to a row's action (`selector`, inside `container`):
 *
 * - the next row's, the one that took the removed row's place (the one above
 *   when it was the page's last row);
 * - the new last page's last row's, when the removed row was the only one on
 *   the last page, so focus stays next to where the row was;
 * - the first row's, when the removed row wasn't on screen (filtered out);
 * - `fallback()` (the search field, say) when no row is left.
 *
 * If the removal is async (it waits on the server), call it when the data
 * changes, not on Confirm: the first render after Confirm still has the row,
 * so focus would go to the row that is about to go, and then be lost.
 */
export interface FocusAfterRemovalOptions {
  /** Holds the rows. */
  container: React.RefObject<HTMLElement | null>;
  /** A row's action, inside `container`: a ••• trigger, a Remove button. */
  selector: string;
  /** Where focus goes when no row is left. */
  fallback: () => HTMLElement | null | undefined;
}

export function useFocusAfterRemoval({ container, selector, fallback }: FocusAfterRemovalOptions) {
  const pending = React.useRef<{ index: number; onlyRow: boolean } | null>(null);

  /* No deps: the removal may come from the page's own state or its parent's, so this checks after every render
     and acts only once one is pending. */
  React.useEffect(() => {
    const target = pending.current;
    if (target === null) return;
    pending.current = null;
    const actions = container.current?.querySelectorAll<HTMLElement>(selector) ?? [];
    if (!actions.length) {
      fallback()?.focus();
      return;
    }
    const last = actions.length - 1;
    actions[target.onlyRow ? last : Math.min(target.index, last)].focus();
  });

  return React.useCallback(<T,>(shown: readonly T[], removed: T) => {
    const index = shown.indexOf(removed);
    pending.current = { index: Math.max(0, index), onlyRow: index === 0 && shown.length === 1 };
  }, []);
}
