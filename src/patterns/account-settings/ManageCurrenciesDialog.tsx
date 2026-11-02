import * as React from 'react';
import { ModalDialog } from '../../components/modal-dialog';
import { Pagination } from '../../components/pagination';
import { TableCell } from '../../components/table-cell';
import { TableHeaderCell } from '../../components/table-header-cell';
import { TableRow } from '../../components/table-row';
import { Toggle } from '../../components/toggle';
import type { ManagedCurrency } from '../fixtures';

/**
 * ManageCurrenciesDialog — a story-level composition, not a library
 * component: U06's Manage Currencies (545:24755), the dialog behind the
 * account menu's first item and the New Cost form's [Edit] link next to
 * Currency.
 *
 * Figma → code:
 * - Modal / Dialog, Size=Medium, Title "Manage Currencies", Show Footer=false
 *   → ModalDialog `size="medium"` with no footer. × and Escape close it.
 * - Content `_Pattern Content / Manage Currencies` (545:22175): a header row of
 *   three Table / Header Cells (Currency Name, Code, Enabled), rows of two
 *   Table / Cells and a Toggle, then Pagination without its page info →
 *   a `<table>` of TableHeaderCells and TableRows, a Toggle per row, and
 *   Pagination `showPageInfo={false}` right under it, at the start.
 * - The Enabled column is a plain frame round the Toggle (16 at the start):
 *   no Table / Cell type holds a control, so TableCell `type="tag"` (left,
 *   the same padding) stands in.
 *
 * There is no Save: a Toggle applies as soon as it changes, and calls
 * `onEnabledChange` (the owner confirms it with a Toast, U06 "How it works" 3).
 * The dialog keeps its own page, `pageSize` rows at a time (Figma shows 7),
 * and starts on the first each time it opens.
 */
export interface ManageCurrenciesDialogProps {
  open: boolean;
  /** Asked to close: ×, Escape, a click on the backdrop. */
  onClose: () => void;
  /** Every currency, in order. */
  currencies: readonly ManagedCurrency[];
  /** Called when a currency's Enabled toggle changes. */
  onEnabledChange: (currency: ManagedCurrency, enabled: boolean) => void;
  /** Rows per page. Default 7, as Figma. */
  pageSize?: number;
}

export function ManageCurrenciesDialog({ open, onClose, currencies, onEnabledChange, pageSize = 7 }: ManageCurrenciesDialogProps) {
  const [page, setPage] = React.useState(1);
  /* Each opening starts on the first page. */
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPage(1);
  }
  const pageCount = Math.max(1, Math.ceil(currencies.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = currencies.slice((current - 1) * pageSize, current * pageSize);

  return (
    <ModalDialog open={open} onClose={onClose} title="Manage Currencies" size="medium" showFooter={false}>
      <div className="flex flex-col">
        <table aria-label="Currencies" className="w-full border-collapse">
          <thead>
            <tr>
              <TableHeaderCell className="px-4">Currency Name</TableHeaderCell>
              <TableHeaderCell className="px-4">Code</TableHeaderCell>
              <TableHeaderCell className="px-4">Enabled</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((currency) => (
              <TableRow key={currency.code} data-code={currency.code}>
                <TableCell>{currency.name}</TableCell>
                <TableCell>{currency.code}</TableCell>
                <TableCell type="tag">
                  <Toggle
                    aria-label={`Enable ${currency.name}`}
                    checked={currency.enabled}
                    onChange={(event) => onEnabledChange(currency, event.currentTarget.checked)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
        <Pagination page={current} pageCount={pageCount} onPageChange={setPage} showPageInfo={false} />
      </div>
    </ModalDialog>
  );
}
