import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Button } from '../button';
import { Icon } from '../icon';
import { IconButton } from '../icon-button';

/**
 * FileChip — built from the CAF Figma library, page "Form": `File Chip`
 * (State × Action), one uploaded or attached file. Under a file upload field
 * a chip can be removed before saving; in the Invoices dialog it has a
 * Download action (pattern 10, "File upload & attachments").
 *
 * Figma → code:
 * - File Name → `fileName`: Body/sm-medium, text/primary, cut short with an
 *   ellipsis (the full name is the `title` tooltip).
 * - Meta      → `meta`: the size (`formatFileSize(file.size)`), the type, or
 *   the reason a file was rejected. Caption/md-regular, text/subtle.
 * - State     → `state`: `default`, or `error` for a rejected file: the
 *   stroke in accent/critical/outline and the Meta in accent/critical/tonal.
 * - Action    → `action`: `remove` (default) or `download`.
 * - Show Remove → the × shows when you pass `onRemove` (Action=Remove). It is
 *   an IconButton (ghost, 32) named "Remove <file name>", with Figma's
 *   text/subtle glyph.
 * - Action=Download's Button / Small, Style=Tonal, DownloadSimple icon →
 *   a Button (`size="small"`, `variant="tonal"`) labelled "Download", named
 *   "Download <file name>"; `onDownload` runs on click.
 * - Icon / File → Phosphor FileText 20px, text/subtle.
 *
 * It fills its container's width, as the patterns place it. Every colour is
 * the semantic variable the Figma layer is bound to. Where code departs from
 * Figma, the reason is in docs/figma-sync.md ("FileChip").
 */
const fileChip = cva(
  [
    /* Every state: surface.neutral.faint fill, radius 8, 12px sides, 8px gap
       (Figma: raw 10), at least 44px tall (Figma: fixed 44). The 1px stroke
       is drawn inside the edge, as Figma's INSIDE stroke. */
    'flex min-h-11 w-full min-w-0 items-center gap-2 rounded-8 bg-surface-neutral-faint px-3 py-0.5',
    'inset-ring',
  ],
  {
    variants: {
      state: {
        /* State=Default: stroke.subtle stroke. */
        default: 'inset-ring-stroke-subtle',
        /* State=Error: the accent.critical.outline border. */
        error: 'inset-ring-accent-critical-outline-border-default',
      },
    },
    defaultVariants: { state: 'default' },
  },
);

/** A file's size as Figma writes it in Meta: "820 B", "245 KB", "1.2 MB". */
export function formatFileSize(bytes: number) {
  const units = ['KB', 'MB', 'GB'];
  if (bytes < 1024) return `${bytes} B`;
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${Math.round(size)} KB` : `${size.toFixed(1)} ${units[unit]}`;
}

export interface FileChipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma File Name: the file's name, shortened with an ellipsis when it doesn't fit. */
  fileName: string;
  /** Figma Meta: the size or type, or for State=Error the reason the file was rejected. */
  meta?: React.ReactNode;
  /** Figma State: `default`, or `error` for a rejected file. */
  state?: 'default' | 'error';
  /** Figma Action: `remove` (the ×, default) or `download` (a Download button). */
  action?: 'remove' | 'download';
  /** Figma Show Remove: with Action=Remove, the × shows when this is given. Called when it is pressed. */
  onRemove?: () => void;
  /** Action=Download: called when Download is pressed. */
  onDownload?: () => void;
}

export const FileChip = React.forwardRef<HTMLDivElement, FileChipProps>(function FileChip(
  { fileName, meta, state = 'default', action = 'remove', onRemove, onDownload, className, ...props },
  ref,
) {
  const shows = meta !== undefined && meta !== null && meta !== '';
  return (
    <div ref={ref} className={cn(fileChip({ state }), className)} data-state={state} {...props}>
      {/* Icon / File: FileText 20px, text/subtle. */}
      <Icon name="file-text" size={20} className="text-text-subtle" />
      {/* Text: the name over the meta, 2px apart. */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body-sm-medium text-text-primary" title={fileName}>
          {fileName}
        </p>
        {shows && (
          <p
            className={cn(
              'text-caption-md-regular',
              state === 'error' ? 'text-accent-critical-tonal-content-default' : 'text-text-subtle',
            )}
          >
            {meta}
          </p>
        )}
      </div>
      {action === 'remove' && onRemove && (
        <IconButton
          icon="x"
          label={`Remove ${fileName}`}
          onClick={onRemove}
          /* Figma's × is text/subtle; hovered, it takes IconButton ghost's own
             glyph, text/secondary, over its hover fill. The -8px margin puts the
             16px glyph 12px from the edge, where Figma draws it. */
          className="-mr-2 text-text-subtle enabled:hover:text-text-secondary"
        />
      )}
      {action === 'download' && (
        <Button
          size="small"
          variant="tonal"
          leftIcon={<Icon name="download-simple" size={16} />}
          aria-label={`Download ${fileName}`}
          onClick={onDownload}
        >
          Download
        </Button>
      )}
    </div>
  );
});
FileChip.displayName = 'FileChip';

export const FILE_CHIP_STATES = ['default', 'error'] as const;
export const FILE_CHIP_ACTIONS = ['remove', 'download'] as const;
