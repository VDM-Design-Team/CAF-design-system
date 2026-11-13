import * as React from 'react';
import { FilterDateRange } from '../../components/filter-date-range';
import { FilterField } from '../../components/filter-field';
import type { Contact } from '../fixtures';
import { FILTER_SLOT, FilterBar, toDateRange, toDayRange, type DayRange } from './CostsFilterBar';

/**
 * ContactsFilterBar — a story-level organism, not a DS component: Figma's
 * `Filter / Bar` Page=Contacts (949:11457), page "Filters", as pattern 16
 * (951:7846) uses it. It is FilterBar (the bar's frame, a `search` landmark)
 * with:
 *
 * - Search contacts (Filter / Field Type=Search): name, email, subject or
 *   message.
 * - Select Period (Filter / Field – Date range): the date received.
 * - Filter / Clear (Clear Filters) at the right end, only while a filter is
 *   in use (Figma's Show Clear). It resets both and puts focus back in the
 *   search field, since the button goes away.
 *
 * The list filters as soon as one changes; there is no Apply.
 * `filterContacts` applies a `ContactFilters` to rows.
 */

/** The Contacts bar's filters. `period` null is "any date". */
export interface ContactFilters {
  search: string;
  /** Select Period: messages received in the range. */
  period: DayRange | null;
}

export const EMPTY_CONTACT_FILTERS: ContactFilters = { search: '', period: null };

/** Whether any filter is in use: Clear Filters shows then. */
export const hasActiveContactFilters = (f: ContactFilters) => f.search.trim() !== '' || f.period !== null;

/** The rows that match every filter in use, in their order. Search looks in the name, email, subject and message. */
export function filterContacts<T extends Contact>(rows: readonly T[], { search, period }: ContactFilters): T[] {
  const query = search.trim().toLowerCase();
  return rows.filter(
    (c) =>
      (!query || [c.name, c.email, c.subject, c.message].some((text) => text.toLowerCase().includes(query))) &&
      /* ISO days compare as strings. */
      (!period || (c.receivedAt >= period.from && c.receivedAt <= period.to)),
  );
}

export interface ContactsFilterBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The filters (controlled). */
  value: ContactFilters;
  /** Called with the new filters as soon as one changes. */
  onChange: (filters: ContactFilters) => void;
  /** The date picker's Today; stories pin it. */
  today?: Date;
  /** Start with Select Period open (a story's snapshot). */
  defaultPeriodOpen?: boolean;
}

export const ContactsFilterBar = React.forwardRef<HTMLDivElement, ContactsFilterBarProps>(function ContactsFilterBar(
  { value, onChange, today, defaultPeriodOpen = false, 'aria-label': ariaLabel = 'Filter contacts', ...props },
  ref,
) {
  const searchRef = React.useRef<HTMLInputElement | HTMLButtonElement | null>(null);
  return (
    <FilterBar
      ref={ref}
      aria-label={ariaLabel}
      {...props}
      showClear={hasActiveContactFilters(value)}
      onClear={() => {
        onChange(EMPTY_CONTACT_FILTERS);
        searchRef.current?.focus();
      }}
    >
      <div className={FILTER_SLOT}>
        <FilterField
          ref={searchRef}
          label="Search contacts"
          placeholder="Search contacts..."
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
        />
      </div>
      <FilterDateRange
        className={FILTER_SLOT}
        label="Date received"
        placeholder="Select Period"
        value={toDateRange(value.period)}
        onValueChange={(next) => onChange({ ...value, period: toDayRange(next) })}
        today={today}
        defaultOpen={defaultPeriodOpen}
      />
    </FilterBar>
  );
});
ContactsFilterBar.displayName = 'ContactsFilterBar';
