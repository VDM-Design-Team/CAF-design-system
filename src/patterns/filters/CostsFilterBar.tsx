import * as React from 'react';
import { dayKey, parseDayKey } from '../../components/calendar/dates';
import { FilterClear } from '../../components/filter-clear';
import { FilterDateRange } from '../../components/filter-date-range';
import { FilterField } from '../../components/filter-field';
import { FilterSelect } from '../../components/filter-select';
import { FilterSummary, type FilterSummaryFilter } from '../../components/filter-summary';
import type { DateRange } from '../../components/range-calendar';
import { cn } from '../../lib/cn';
import {
  costStatuses,
  costStatusLabel,
  currencies,
  paymentMethods,
  type Cost,
  type CostStatus,
  type Currency,
  type PaymentMethod,
} from '../fixtures';

/**
 * CostsFilterBar — a story-level organism, not a DS component (COMPONENT-PLAN
 * decision 4): the Costs lists' filter bar, composed from DS components the
 * way the CAF Figma library draws `Filter / Bar – Costs` (256:4585, Show Clear
 * false / true) and its per-page presets `Filter / Bar` (256:5338, Page=Costs
 * / Recurring), page "Filters". Patterns 01, 02 and U01 use it.
 *
 * - FilterBar: the bar's frame (surface.neutral.faint, a 1px stroke.subtle
 *   stroke, radius 12, 16 padding; the fields 12 apart) as a `search`
 *   landmark, with Filter / Clear (FilterClear, Clear Filters) on the far
 *   right and an optional row under the fields. Figma's Show Clear (Filter /
 *   Bar, `Show Clear#867:0`, since 5 Nov 2026) is `showClear`: on only while a
 *   filter is in use (decision filter-clear-disabled: hidden, never
 *   disabled, when nothing is filtered).
 * - The dropdowns are the DS's FilterSelect (Filter / Field – Select: All
 *   Status, Pending, …, with the chosen one checked) and FilterDateRange
 *   (Filter / Field – Date range: Select Period and Creation Date, as pattern
 *   02 step 4 draws it). The list filters as soon as one changes.
 *
 * Filtering is the story's: `filterCosts` applies a `CostFilters` to rows, and
 * `costFilterSummary` lists the filters in use for Filter / Summary.
 */

/* ── Filter values ─────────────────────────────────────────────────────────── */

/** A day range as `yyyy-mm-dd` strings, `from` on or before `to`. */
export interface DayRange {
  from: string;
  to: string;
}

/** "2026-10-12 – 2026-10-24", as pattern 02 step 4 (520:1213) prints a picked range: Filter / Summary's line. */
export const formatDayRange = ({ from, to }: DayRange) => `${from} – ${to}`;

/** A DayRange as FilterDateRange's `{ start, end }`, and back. */
export const toDateRange = (range: DayRange | null): DateRange | null =>
  range ? { start: parseDayKey(range.from), end: parseDayKey(range.to) } : null;
export const toDayRange = ({ start, end }: DateRange): DayRange => ({ from: dayKey(start), to: dayKey(end) });

/** The Costs bar's filters. `null` (or "") is "All". */
export interface CostFilters {
  search: string;
  status: CostStatus | null;
  paymentMethod: PaymentMethod | null;
  currency: Currency | null;
  /** Select Period: costs whose period overlaps the range. */
  period: DayRange | null;
  /** Creation Date: costs submitted in the range. */
  createdAt: DayRange | null;
}

export const EMPTY_COST_FILTERS: CostFilters = {
  search: '',
  status: null,
  paymentMethod: null,
  currency: null,
  period: null,
  createdAt: null,
};

/* What Search looks in: free text (pattern 02: "name, email, invoice #"), plus the ID, beneficiary and account. */
const searchable = (c: Cost) => [c.id, c.title, c.invoiceNumber, c.applicant.name, c.applicant.email, c.partner, c.account];

/** The rows that match every filter in use, in their order. */
export function filterCosts(rows: readonly Cost[], filters: CostFilters): Cost[] {
  const query = filters.search.trim().toLowerCase();
  const { status, paymentMethod, currency, period, createdAt } = filters;
  return rows.filter(
    (c) =>
      (!query || searchable(c).some((text) => text.toLowerCase().includes(query))) &&
      (!status || c.status === status) &&
      (!paymentMethod || c.paymentMethod === paymentMethod) &&
      (!currency || c.currency === currency) &&
      /* ISO days compare as strings. */
      (!period || (c.periodFrom <= period.to && c.periodTo >= period.from)) &&
      (!createdAt || (c.submittedAt.slice(0, 10) >= createdAt.from && c.submittedAt.slice(0, 10) <= createdAt.to)),
  );
}

/** Whether any filter is in use: Clear Filters shows then. */
export const hasActiveCostFilters = (f: CostFilters) =>
  f.search.trim() !== '' || !!(f.status || f.paymentMethod || f.currency || f.period || f.createdAt);

/** The filters in use, as Filter / Summary lines ("Status: Pending"), in the bar's order. */
export function costFilterSummary(f: CostFilters): FilterSummaryFilter[] {
  const lines: FilterSummaryFilter[] = [];
  if (f.search.trim()) lines.push({ key: 'Search', value: f.search.trim() });
  if (f.status) lines.push({ key: 'Status', value: costStatusLabel[f.status] });
  if (f.paymentMethod) lines.push({ key: 'Payment Method', value: f.paymentMethod });
  if (f.currency) lines.push({ key: 'Currency', value: f.currency });
  if (f.period) lines.push({ key: 'Period', value: formatDayRange(f.period) });
  if (f.createdAt) lines.push({ key: 'Creation Date', value: formatDayRange(f.createdAt) });
  return lines;
}

/* ── Filter / Bar ─────────────────────────────────────────────────────────── */

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The fields, left to right: search first, then the dropdowns (pattern 01). Each sits in a `FILTER_SLOT`. */
  children: React.ReactNode;
  /**
   * Figma Show Clear: Filter / Clear (Clear Filters) on the far right. Set it only while a filter
   * or a search is in use; when nothing is filtered it is hidden, never disabled (decision
   * filter-clear-disabled). Default false: Figma's default is on, so its screens keep their look.
   */
  showClear?: boolean;
  /** Clear Filters: reset every filter, and move focus to the search field, since the button goes away. */
  onClear?: () => void;
  /** A row under the fields, such as the filters in use. */
  footer?: React.ReactNode;
}

/**
 * The bar's frame: Figma's Bar (176:1690) — surface.neutral.faint, a 1px
 * stroke.subtle stroke inside the edge, radius 12 (radius-5), 16 padding; the
 * Filters row 12 apart, and Filter / Clear at its right end while `showClear`
 * (Filter / Bar's Show Clear). A `search` landmark: name it with `aria-label`.
 */
export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar(
  { children, showClear = false, onClear, footer, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="search"
      className={cn('flex flex-col gap-4 rounded-12 bg-surface-neutral-faint p-4 inset-ring inset-ring-stroke-subtle', className)}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {showClear && <FilterClear className="ml-auto" onClick={onClear} />}
      </div>
      {footer}
    </div>
  );
});
FilterBar.displayName = 'FilterBar';

/** Figma's Filter / Field instances are 240 wide in the bar; 240 isn't on GDL's space scale, so 256 (space.256). */
export const FILTER_SLOT = 'w-64';

/* ── Filter / Bar – Costs ─────────────────────────────────────────────────── */

const STATUS_OPTIONS = costStatuses.map((s) => ({ value: s, label: costStatusLabel[s] }));
const PAYMENT_OPTIONS = paymentMethods.map((p) => ({ value: p, label: p }));
const CURRENCY_OPTIONS = currencies.filter((c) => c.enabled).map((c) => ({ value: c.code, label: c.code }));

/** A field that can start open, for a story's snapshot of an open dropdown. */
export type CostFilterField = 'status' | 'paymentMethod' | 'currency' | 'period' | 'createdAt';

export interface CostsFilterBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The filters (controlled). */
  value: CostFilters;
  /** Called with the new filters as soon as one changes: there is no Apply button (pattern 02). */
  onChange: (filters: CostFilters) => void;
  /**
   * Filter / Bar's Page: `costs` (default) has every field; `recurring` has
   * search and status only (Page=Recurring, 256:5339).
   */
  page?: 'costs' | 'recurring';
  /** Show the filters in use under the fields (Filter / Summary), while any are. */
  showSummary?: boolean;
  /** The date pickers' Today; stories pin it. */
  today?: Date;
  /** A dropdown that starts open (a story's snapshot). */
  defaultOpen?: CostFilterField;
}

export const CostsFilterBar = React.forwardRef<HTMLDivElement, CostsFilterBarProps>(function CostsFilterBar(
  { value, onChange, page = 'costs', showSummary = false, today, defaultOpen, 'aria-label': ariaLabel = 'Filter costs', ...props },
  ref,
) {
  const searchRef = React.useRef<HTMLInputElement | HTMLButtonElement | null>(null);
  const set = <K extends keyof CostFilters>(key: K, next: CostFilters[K]) => onChange({ ...value, [key]: next });
  const active = hasActiveCostFilters(value);
  const all = page === 'costs';

  /* Clear Filters resets everything. It disappears with the filters, so focus goes to the search box. */
  const clearAll = () => {
    onChange(EMPTY_COST_FILTERS);
    searchRef.current?.focus();
  };

  return (
    <FilterBar
      ref={ref}
      aria-label={ariaLabel}
      {...props}
      showClear={active}
      onClear={clearAll}
      footer={showSummary && active && <FilterSummary filters={costFilterSummary(value)} />}
    >
      <div className={FILTER_SLOT}>
        <FilterField
          ref={searchRef}
          label="Search costs"
          placeholder="Search costs..."
          value={value.search}
          onChange={(event) => set('search', event.target.value)}
        />
      </div>
      <FilterSelect
        className={FILTER_SLOT}
        label="Status"
        allLabel="All Status"
        options={STATUS_OPTIONS}
        value={value.status}
        onValueChange={(next) => set('status', next as CostStatus | null)}
        defaultOpen={defaultOpen === 'status'}
      />
      {all && (
        <>
          <FilterSelect
            className={FILTER_SLOT}
            label="Payment method"
            allLabel="All Payment Method"
            icon="credit-card"
            options={PAYMENT_OPTIONS}
            value={value.paymentMethod}
            onValueChange={(next) => set('paymentMethod', next as PaymentMethod | null)}
            defaultOpen={defaultOpen === 'paymentMethod'}
          />
          <FilterSelect
            className={FILTER_SLOT}
            label="Currency"
            allLabel="All Currency"
            icon="currency-circle-dollar"
            options={CURRENCY_OPTIONS}
            value={value.currency}
            onValueChange={(next) => set('currency', next as Currency | null)}
            defaultOpen={defaultOpen === 'currency'}
          />
          <FilterDateRange
            className={FILTER_SLOT}
            label="Period"
            placeholder="Select Period"
            value={toDateRange(value.period)}
            onValueChange={(next) => set('period', toDayRange(next))}
            today={today}
            defaultOpen={defaultOpen === 'period'}
          />
          <FilterDateRange
            className={FILTER_SLOT}
            label="Creation date"
            placeholder="Creation Date"
            value={toDateRange(value.createdAt)}
            onValueChange={(next) => set('createdAt', toDayRange(next))}
            today={today}
            defaultOpen={defaultOpen === 'createdAt'}
          />
        </>
      )}
    </FilterBar>
  );
});
CostsFilterBar.displayName = 'CostsFilterBar';
