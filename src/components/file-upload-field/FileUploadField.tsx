import * as React from 'react';
import { cn } from '../../lib/cn';
import { FileChip, formatFileSize } from '../file-chip';
import { FileUploadZone, type FileUploadZoneProps } from '../file-upload-zone';
import { FormField, type FormFieldProps } from '../form-field';

/**
 * FileUploadField — built from the CAF Figma library, page "Form":
 * `Form / Field – File Upload`, a labelled `_File Upload Zone` (Attach
 * invoice, Upload CSV File), with a File Chip under it for each file, as
 * pattern 10 ("File upload & attachments") places them. It is FormField
 * around a FileUploadZone, then the list of FileChips.
 *
 * Figma → code:
 * - _Form Label's Label and Required → `label`, `required` (the marker, and
 *   the input's native `required`: a form won't submit with no file).
 * - The exposed _File Upload Zone's Title and Hint → `title`, `hint`.
 * - Show Helper + Helper → `helper`; an error message in its place → `error`,
 *   which also makes the input `aria-invalid` and the zone's stroke critical.
 * - Pattern 10's chips → one FileChip per file (Action=Remove, Meta = its
 *   size), 12px apart and 12px under the field. × removes the file.
 * - A rejected file ("says why (type or size), and nothing is uploaded") →
 *   `validate`: return the reason, and the file shows as a State=Error chip
 *   with that reason, and isn't added. × dismisses it.
 *
 * The files: `files` / `defaultFiles` / `onFilesChange` (the accepted files,
 * after each add or remove). With `multiple`, new files are added to the
 * list (the same file twice is kept once); without it, a new file replaces
 * the old one. The native `<input type="file">` always holds the list, also
 * after a remove, so a `name` submits exactly the files shown. Every other
 * prop goes to the input, and so does the ref: `name`, `accept`,
 * `multiple`, `disabled`, `onChange`. `id` is the input's (the label points
 * at it); `className` styles the field.
 *
 * The list is a polite live region, so a screen reader hears each file
 * added and the reason a file was rejected. Removing a file moves focus to
 * the next file's ×, or back to the input after the last one.
 *
 * The bindings are FormField's, FileUploadZone's and FileChip's. Where code
 * departs from Figma, the reason is in docs/figma-sync.md
 * ("FileUploadField").
 */
export interface FileUploadFieldProps
  extends
    Omit<FileUploadZoneProps, 'className' | 'onFilesChange'>,
    Pick<FormFieldProps, 'label' | 'helper' | 'error' | 'action' | 'className'> {
  /** Controlled: the accepted files. Pair with `onFilesChange`. */
  files?: ReadonlyArray<File>;
  /** Uncontrolled: the files the field starts with. */
  defaultFiles?: ReadonlyArray<File>;
  /** Called with the accepted files after files are added or one is removed. */
  onFilesChange?: (files: File[]) => void;
  /**
   * Checks each file chosen or dropped. Return why it's rejected ("File type
   * not supported. Use DOC, DOCX, PDF, PNG, JPG or JPEG."), and it shows as an
   * Error chip and isn't added; return nothing to accept it. Dropped files
   * skip `accept`, so check the type here (`fileMatchesAccept`).
   */
  validate?: (file: File) => React.ReactNode;
}

/** Point several refs at one node. */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}

/* The same file, picked twice. */
const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;
const rejects = (reason: React.ReactNode) => reason !== undefined && reason !== null && reason !== false && reason !== '';

/** Put `files` in the native input, so FormData submits them. */
function writeFiles(input: HTMLInputElement | null, files: ReadonlyArray<File>) {
  if (!input || typeof DataTransfer === 'undefined') return;
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
}

interface Rejected {
  key: number;
  file: File;
  reason: React.ReactNode;
}

export const FileUploadField = React.forwardRef<HTMLInputElement, FileUploadFieldProps>(function FileUploadField(
  {
    label,
    required,
    helper,
    error,
    action,
    id,
    className,
    files,
    defaultFiles = [],
    onFilesChange,
    validate,
    multiple,
    disabled,
    ...zone
  },
  ref,
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const setRefs = React.useMemo(() => mergeRefs(ref, inputRef), [ref]);
  const listRef = React.useRef<HTMLUListElement>(null);
  const [uncontrolled, setUncontrolled] = React.useState<ReadonlyArray<File>>(defaultFiles);
  const controlled = files !== undefined;
  const current = controlled ? files : uncontrolled;
  const [rejected, setRejected] = React.useState<Rejected[]>([]);
  const nextKey = React.useRef(0);
  /* After a remove: the position whose × takes focus. */
  const focusAfterRemove = React.useRef<number | null>(null);

  /* The input holds the files shown, after every change (and on mount, for defaultFiles). */
  React.useLayoutEffect(() => writeFiles(inputRef.current, current), [current]);

  React.useLayoutEffect(() => {
    const index = focusAfterRemove.current;
    if (index === null) return;
    focusAfterRemove.current = null;
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [];
    if (buttons.length) buttons[Math.min(index, buttons.length - 1)].focus();
    else inputRef.current?.focus();
  });

  const commit = (next: File[]) => {
    if (!controlled) setUncontrolled(next);
    /* Controlled: the input keeps the current files until `files` changes. */
    else writeFiles(inputRef.current, current);
    onFilesChange?.(next);
  };

  const add = (chosen: File[]) => {
    const accepted: File[] = [];
    const turnedDown: Rejected[] = [];
    for (const file of chosen) {
      const reason = validate?.(file);
      if (rejects(reason)) turnedDown.push({ key: nextKey.current++, file, reason });
      else accepted.push(file);
    }
    if (turnedDown.length) setRejected((list) => [...list, ...turnedDown]);
    if (!accepted.length) {
      /* Nothing to add: the input goes back to the files shown. */
      writeFiles(inputRef.current, current);
      return;
    }
    commit(
      multiple
        ? [...current, ...accepted.filter((file) => !current.some((kept) => sameFile(kept, file)))]
        : accepted.slice(0, 1),
    );
  };

  /* The chips' ×s, in list order: the rejected files first, then the accepted ones. */
  const remove = (position: number, change: () => void) => {
    focusAfterRemove.current = position;
    change();
  };

  const count = rejected.length + current.length;

  return (
    <div className={cn('flex w-full min-w-0 flex-col', className)}>
      <FormField label={label} required={required} helper={helper} error={error} action={action} htmlFor={id}>
        <FileUploadZone
          ref={setRefs}
          multiple={multiple}
          disabled={disabled}
          onFilesChange={add}
          {...zone}
        />
      </FormField>
      {/* Pattern 10: the chips 12px under the field and 12px apart. Always in
          the DOM, so it is a live region before the first file arrives. */}
      <ul ref={listRef} aria-live="polite" className={cn('flex flex-col gap-3', count > 0 && 'mt-3')}>
        {rejected.map((entry, index) => (
          <li key={`rejected-${entry.key}`}>
            <FileChip
              fileName={entry.file.name}
              meta={entry.reason}
              state="error"
              onRemove={
                disabled
                  ? undefined
                  : () => remove(index, () => setRejected((list) => list.filter((r) => r.key !== entry.key)))
              }
            />
          </li>
        ))}
        {current.map((file, index) => (
          <li key={fileKey(file)}>
            <FileChip
              fileName={file.name}
              meta={formatFileSize(file.size)}
              onRemove={
                disabled
                  ? undefined
                  : () => remove(rejected.length + index, () => commit(current.filter((kept) => kept !== file)))
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
});
FileUploadField.displayName = 'FileUploadField';
