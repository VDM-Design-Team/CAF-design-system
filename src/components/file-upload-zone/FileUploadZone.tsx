import * as React from 'react';
import { cn } from '../../lib/cn';
import { useFormField, useFormFieldControl } from '../form-field';
import { joinIds } from '../form-field/useFormField';
import { Icon } from '../icon';

/**
 * FileUploadZone — built from the CAF Figma library, page "Form":
 * `_File Upload Zone` (Title, Hint), the dashed drop target that
 * Form / Field – File Upload puts under its label (Attach invoice, Upload
 * CSV File). It hands over the files chosen or dropped and nothing more:
 * uploading, the file list and validation are the caller's (FileUploadField
 * adds the list).
 *
 * Figma → code:
 * - Title → `title`: Body/sm-regular, text/secondary. Figma's default,
 *   "Click or drag files to upload", is the default here.
 * - Hint  → `hint`: the accepted types and size limit, Caption/md-regular,
 *   text/subtle (e.g. "DOC, DOCX, PDF, PNG, JPG, JPEG accepted (Max 10.0MB)").
 * - Icon / Upload → Phosphor FileArrowUp, 24px, in text/subtle (Figma's
 *   vector is a raw #E5E5E5; see docs/figma-sync.md).
 *
 * It is a native `<input type="file">`, visually hidden but real: Tab
 * reaches it and Enter or Space opens the browse dialog, clicking anywhere
 * on the zone does the same, and dropping files puts them in the input.
 * Every prop but `title`, `hint`, `onFilesChange` and `className` goes to the
 * input, and so does the ref: `name` (the files reach FormData), `multiple`,
 * `accept` (the dialog's filter; dropped files aren't filtered, see
 * `fileMatchesAccept`), `required`, `disabled`, `onChange`. `className`
 * styles the zone.
 *
 * States Figma doesn't draw (in docs/figma-sync.md): drag-over (a file held
 * over the zone) shows the dashed stroke in stroke/focused, the Focus colour
 * of `_Text Input`; keyboard focus shows the focus ring; Error (the input is
 * `aria-invalid`, which FormField sets) shows the stroke in
 * accent/critical/outline, as `_Text Input`'s Error; Disabled takes the
 * Title to text/subtle, as TextInput's disabled value.
 *
 * Inside a FormField (FileUploadField is one) the input takes the field's
 * id, message, error and required (`useFormFieldControl`), and the Hint is
 * added to its description. Outside a field it is named by its Title, unless
 * you pass `aria-label` or `aria-labelledby`.
 *
 * Every colour is the semantic variable the Figma layer is bound to. Where
 * code departs from Figma, the reason is in docs/figma-sync.md
 * ("FileUploadZone").
 */
const zoneClasses = [
  /* The zone: a centred column, 24px padding, 8px gap, radius 8, no fill.
     `relative` keeps the hidden input inside it. */
  'relative flex w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-8 p-6 text-center',
  /* The 1px dashed stroke/subtle stroke (Figma: inside, dash 6 gap 4). CSS
     can't set the dash pattern; the browser draws its own. */
  'border border-dashed border-stroke-subtle transition-colors',
  /* Keyboard focus is on the hidden input; the zone shows the ring, as Button's. */
  'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-stroke-focused',
];

/** Does `file` match an `accept` list (".pdf,image/*,text/csv")? An empty list accepts everything. */
export function fileMatchesAccept(file: File, accept?: string) {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) =>
    token.startsWith('.')
      ? name.endsWith(token)
      : token.endsWith('/*')
        ? type.startsWith(token.slice(0, -1))
        : type === token,
  );
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

/** Does a drag carry files (not text or a link)? */
const carriesFiles = (event: React.DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

export interface FileUploadZoneProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'title' | 'className' | 'children'> {
  /** Figma Title: what to do. Default "Click or drag files to upload". */
  title?: React.ReactNode;
  /** Figma Hint: the accepted types and the size limit. Added to the input's description. */
  hint?: React.ReactNode;
  /** Called with the files chosen in the dialog or dropped on the zone (one, unless `multiple`). */
  onFilesChange?: (files: File[]) => void;
  /** Styles the zone, not the hidden input. */
  className?: string;
}

export const FileUploadZone = React.forwardRef<HTMLInputElement, FileUploadZoneProps>(function FileUploadZone(
  ownProps,
  ref,
) {
  const field = useFormField();
  const {
    title = 'Click or drag files to upload',
    hint,
    onFilesChange,
    className,
    onChange,
    multiple,
    disabled,
    'aria-describedby': describedBy,
    'aria-labelledby': labelledBy,
    'aria-invalid': ariaInvalid,
    ...input
  } = useFormFieldControl(ownProps);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const setRefs = React.useMemo(() => mergeRefs(ref, inputRef), [ref]);
  const uid = React.useId();
  const titleId = `${uid}-title`;
  const hintId = hint !== undefined && hint !== null && hint !== '' ? `${uid}-hint` : undefined;
  const [dragging, setDragging] = React.useState(false);
  const invalid = ariaInvalid === true || ariaInvalid === 'true';

  /* Outside a field, and with no name of its own, the Title names the input. */
  const named = Boolean(field || input['aria-label'] || labelledBy);

  const drop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const target = inputRef.current;
    if (disabled || !target) return;
    const files = Array.from(event.dataTransfer.files);
    const chosen = multiple ? files : files.slice(0, 1);
    if (!chosen.length) return;
    /* Put the dropped files in the native input, so the form submits them,
       then run the same change as the dialog does. */
    const transfer = new DataTransfer();
    for (const file of chosen) transfer.items.add(file);
    target.files = transfer.files;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  };

  return (
    <div
      className={cn(
        zoneClasses,
        /* Error: the input is aria-invalid. */
        invalid && 'border-accent-critical-outline-border-default',
        /* Drag-over: a file is held over the zone. It wins over Error, so the target shows. */
        dragging && 'border-stroke-focused',
        disabled && 'cursor-not-allowed',
        className,
      )}
      data-dragging={dragging ? '' : undefined}
      onClick={(event) => {
        /* A click on the input itself (a label's, or Enter / Space) already opens the dialog. */
        if (event.target !== inputRef.current) inputRef.current?.click();
      }}
      onDragEnter={(event) => {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (disabled || !carriesFiles(event)) return;
        /* Allows the drop. */
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setDragging(true);
      }}
      onDragLeave={(event) => {
        /* Moving between the zone's own children fires this too. */
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={drop}
    >
      <input
        ref={setRefs}
        type="file"
        className="sr-only"
        multiple={multiple}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-labelledby={named ? labelledBy : titleId}
        aria-describedby={joinIds(hintId, describedBy)}
        onChange={(event) => {
          onChange?.(event);
          onFilesChange?.(Array.from(event.currentTarget.files ?? []));
        }}
        {...input}
      />
      {/* Icon / Upload: FileArrowUp 24px, text/subtle. */}
      <Icon name="file-arrow-up" size={24} className="text-text-subtle" />
      {/* Title: Body/sm-regular, text/secondary; text/subtle while disabled. */}
      <p
        id={titleId}
        className={cn('text-body-sm-regular', disabled ? 'text-text-subtle' : 'text-text-secondary')}
      >
        {title}
      </p>
      {/* Hint: Caption/md-regular, text/subtle. */}
      {hintId && (
        <p id={hintId} className="text-caption-md-regular text-text-subtle">
          {hint}
        </p>
      )}
    </div>
  );
});
FileUploadZone.displayName = 'FileUploadZone';
