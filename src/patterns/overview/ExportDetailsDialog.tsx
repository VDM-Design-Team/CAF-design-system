import { Button } from '../../components/button';
import { DescriptionList, DescriptionListItem } from '../../components/description-list';
import { FilterSummary } from '../../components/filter-summary';
import { ModalDialog } from '../../components/modal-dialog';
import { Spinner } from '../../components/spinner';
import { addDays, EXPORT_VALID_DAYS, exportStatusTag, exportTypeLabel, type ExportRecord } from '../fixtures';

/**
 * ExportDetailsDialog — a story-level organism, not a DS component: the
 * read-only record dialog of pattern 13 (Step 2, 529:6740), and its loading
 * state from pattern 11 (Step 2, 528:5884).
 *
 * - Modal / Dialog, Size=Medium, titled "Export Details".
 * - Loading: "Open the dialog straight away and show a Spinner in its body
 *   until the content arrives." A 24px Spinner over "Loading…", centred; no
 *   footer (Figma draws none). The Spinner's status says what is loading
 *   ("Loading export details"), so the visible "Loading…" is hidden from
 *   screen readers rather than read twice.
 * - Loaded: a Description List (Name, Type, Created By, File Size, Created,
 *   the status's date, Valid until, Downloads) and a Filter / Summary of the
 *   filters the export was made with. The footer holds Close (Text) and the
 *   main action, Download (Default), for a completed export only: a failed
 *   or processing export has no file.
 */
export interface ExportDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  /** The export to show. */
  record: ExportRecord | null;
  /** How many times it was downloaded. */
  downloads: number;
  /** The details haven't arrived yet: the Spinner shows. */
  loading?: boolean;
  /** Download, in the footer. */
  onDownload?: (record: ExportRecord) => void;
}

export function ExportDetailsDialog({ open, onClose, record, downloads, loading = false, onDownload }: ExportDetailsDialogProps) {
  const completed = record?.status === 'completed';
  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Export Details"
      size="medium"
      footer={
        !loading && record ? (
          <>
            <Button variant="text" onClick={onClose}>
              Close
            </Button>
            {completed && <Button onClick={() => onDownload?.(record)}>Download</Button>}
          </>
        ) : undefined
      }
    >
      {loading || !record ? (
        <div data-loading="" className="flex flex-col items-center gap-3 py-12">
          <Spinner size={24} label="Loading export details" />
          <p aria-hidden="true" className="text-body-sm-regular text-text-secondary">
            Loading…
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <DescriptionList>
            <DescriptionListItem label="Name" value={record.name} />
            <DescriptionListItem label="Type" value={exportTypeLabel[record.type]} />
            <DescriptionListItem label="Created By" value={record.createdBy} />
            <DescriptionListItem label="File Size" value={record.size} />
            <DescriptionListItem label="Created" value={record.createdAt} />
            {record.status !== 'processing' && (
              /* Figma: "Completed 2026-10-08" — when the job ended, under its status. */
              <DescriptionListItem label={exportStatusTag[record.status].label} value={record.createdAt} />
            )}
            {completed && <DescriptionListItem label="Valid until" value={addDays(record.createdAt, EXPORT_VALID_DAYS)} />}
            <DescriptionListItem label="Downloads" value={String(downloads)} />
          </DescriptionList>
          <FilterSummary filters={record.filters} />
        </div>
      )}
    </ModalDialog>
  );
}
