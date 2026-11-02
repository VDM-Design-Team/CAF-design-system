import * as React from 'react';
import { Button } from '../../components/button';
import { dayKey, parseDayKey } from '../../components/calendar/dates';
import { FilterField } from '../../components/filter-field';
import { FilterSummary, type FilterSummaryFilter } from '../../components/filter-summary';
import type { IconName } from '../../components/icon';
import { MenuDropdown } from '../../components/menu-dropdown';
import { MenuItem } from '../../components/menu-item';
import { Popover } from '../../components/popover';
import { RangeCalendar } from '../../components/range-calendar';
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
 *   landmark, with Clear Filters on the far right (pattern 02: it appears once
 *   a filter is active) and an optional row under the fields.
 * - FilterMenu: a Filter / Field Dropdown that opens a Menu / Dropdown of the
 *   values (All Status, Pending, …). It stands in for the Select / Menu the
 *   plan pairs with the field: Select brings its own trigger, and no DS
 *   component lets a Filter / Field open a listbox (docs/patterns.md, design
 *   questions).
 * - FilterDateRange: a Filter / Field Dropdown that opens Date Picker / Range
 *   (RangeCalendar) in a Popover under it, as pattern 02 step 4 draws it. The
 *   first day picked is the start, the second the end; the list filters
 *   straight away and focus returns to the field.
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

/** "2026-10-12 – 2026-10-24", as pattern 02 step 4 (520:1213) prints a picked range. */
export const formatDayRange = ({ from, to }: DayRange) => `${from} – ${to}`;

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
  /** Clear Filters, on the far right. Pass it only while a filter is in use (pattern 02). */
  clear?: React.ReactNode;
  /** A row under the fields, such as the filters in use. */
  footer?: React.ReactNode;
}

/**
 * The bar's frame: Figma's Bar (176:1690) — surface.neutral.faint, a 1px
 * stroke.subtle stroke inside the edge, radius 12 (radius-5), 16 padding; the
 * Filters row 12 apart. A `search` landmark: name it with `aria-label`.
 */
export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar(
  { children, clear, footer, className, ...props },
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
        {clear && <div className="ml-auto flex">{clear}</div>}
      </div>
      {footer}
    </div>
  );
});
FilterBar.displayName = 'FilterBar';

/** Figma's Filter / Field instances are 240 wide in the bar; 240 isn't on GDL's space scale, so 256 (space.256). */
export const FILTER_SLOT = 'w-64';

/* ── A dropdown filter: Filter / Field Dropdown + Menu / Dropdown ─────────── */

export interface FilterMenuOption<T extends string = string> {
  value: T;
  label: string;
}

export interface FilterMenuProps<T extends string> {
  /** The field's accessible name ("Status"). The button reads "Status: All Status". */
  label: string;
  /** The "no filter" choice: the menu's first item, and the field's value while nothing is chosen ("All Status"). */
  allLabel: string;
  /** Shown instead of `allLabel`, in text.subtle, while nothing is chosen ("Filter by Cost Center"). */
  placeholder?: string;
  options: readonly FilterMenuOption<T>[];
  /** The chosen value, or `null` for all. */
  value: T | null;
  onChange: (value: T | null) => void;
  /** The field's leading icon. Default `funnel`. */
  icon?: IconName;
  /** Start with the menu open (a story's snapshot). */
  defaultOpen?: boolean;
  className?: string;
}

export function FilterMenu<T extends string>({
  label,
  allLabel,
  placeholder,
  options,
  value,
  onChange,
  icon,
  defaultOpen,
  className,
}: FilterMenuProps<T>) {
  const chosen = options.find((o) => o.value === value);
  return (
    <MenuDropdown
      className={cn(FILTER_SLOT, className)}
      defaultOpen={defaultOpen}
      trigger={
        <FilterField
          type="dropdown"
          label={label}
          icon={icon}
          value={chosen?.label ?? (placeholder ? undefined : allLabel)}
          placeholder={placeholder}
        />
      }
    >
      <MenuItem onClick={() => onChange(null)}>{allLabel}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </MenuItem>
      ))}
    </MenuDropdown>
  );
}

/* ── A date range filter: Filter / Field Dropdown + Date Picker / Range ───── */

/* RangeCalendar draws its own surface (Date Picker / Range: radius 12, Elevation
   3), so the Popover's panel only positions it — as DateInput does with Calendar. */
const BARE_PANEL = 'rounded-12 bg-transparent p-0 shadow-none inset-ring-0';

export interface FilterDateRangeProps {
  /** The field's accessible name ("Creation date"). */
  label: string;
  /** Shown while no range is picked, and the picker's name ("Creation Date"). */
  placeholder: string;
  value: DayRange | null;
  onChange: (value: DayRange) => void;
  /** The day drawn as Today; stories pin it. */
  today?: Date;
  /** Start with the picker open (a story's snapshot). Focus stays where it is. */
  defaultOpen?: boolean;
  className?: string;
}

export function FilterDateRange({
  label,
  placeholder,
  value,
  onChange,
  today,
  defaultOpen = false,
  className,
}: FilterDateRangeProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  /* Opening moves focus to the calendar's one tab stop (the start, else today), as DateInput does.
     Not on the first render: a picker that starts open doesn't take focus from the page. */
  const wasOpen = React.useRef(open);
  React.useEffect(() => {
    if (open && !wasOpen.current) panelRef.current?.querySelector<HTMLElement>('[data-date][tabindex="0"]')?.focus();
    wasOpen.current = open;
  }, [open]);

  const range = value ? { start: parseDayKey(value.from), end: parseDayKey(value.to) } : null;
  return (
    <Popover
      className={cn(FILTER_SLOT, className)}
      open={open}
      onOpenChange={setOpen}
      panelRole="dialog"
      label={placeholder}
      panelRef={panelRef}
      panelClassName={BARE_PANEL}
      trigger={
        <FilterField
          type="dropdown"
          label={label}
          icon="calendar-blank"
          placeholder={placeholder}
          value={value ? formatDayRange(value) : undefined}
        />
      }
    >
      <RangeCalendar
        value={range}
        today={today}
        onChange={({ start, end }) => {
          onChange({ from: dayKey(start), to: dayKey(end) });
          /* Both ends picked: close. Popover puts focus back on the field. */
          setOpen(false);
        }}
      />
    </Popover>
  );
}

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
      clear={
        active && (
          <Button variant="outlined" onClick={clearAll}>
            Clear Filters
          </Button>
        )
      }
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
      <FilterMenu
        label="Status"
        allLabel="All Status"
        options={STATUS_OPTIONS}
        value={value.status}
        onChange={(next) => set('status', next)}
        defaultOpen={defaultOpen === 'status'}
      />
      {all && (
        <>
          <FilterMenu
            label="Payment method"
            allLabel="All Payment Method"
            icon="credit-card"
            options={PAYMENT_OPTIONS}
            value={value.paymentMethod}
            onChange={(next) => set('paymentMethod', next)}
            defaultOpen={defaultOpen === 'paymentMethod'}
          />
          <FilterMenu
            label="Currency"
            allLabel="All Currency"
            icon="currency-circle-dollar"
            options={CURRENCY_OPTIONS}
            value={value.currency}
            onChange={(next) => set('currency', next)}
            defaultOpen={defaultOpen === 'currency'}
          />
          <FilterDateRange
            label="Period"
            placeholder="Select Period"
            value={value.period}
            onChange={(next) => set('period', next)}
            today={today}
            defaultOpen={defaultOpen === 'period'}
          />
          <FilterDateRange
            label="Creation date"
            placeholder="Creation Date"
            value={value.createdAt}
            onChange={(next) => set('createdAt', next)}
            today={today}
            defaultOpen={defaultOpen === 'createdAt'}
          />
        </>
      )}
    </FilterBar>
  );
});
CostsFilterBar.displayName = 'CostsFilterBar';
