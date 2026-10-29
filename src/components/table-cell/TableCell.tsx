import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * TableCell — built from the CAF Figma library, page "Table": `Table / Cell`,
 * the generic body cell (Type × its text properties). It is a `<td>`: put it
 * in a `<tr>` of a real `<table>`, so screen readers can move by row and
 * column and announce each cell with its header.
 *
 * Figma → code:
 * - Type → `type`: text (default), two-line, tag, checkbox, actions, list,
 *   status-date. List (Collapsed) and List (Expanded) are one `list` cell
 *   whose toggle switches between them (`defaultExpanded` sets the start).
 * - Text properties: Value → `children`, Primary / Secondary → `primary` /
 *   `secondary`, Date → `date`.
 * - Nested components are passed in as `children`: Type=Checkbox takes
 *   `<Checkbox>` and Type=Tag takes `<StatusPill>`; Actions and Status + Date
 *   take the row actions button and Tag, which aren't built yet.
 * - Figma sets the width per column; so does the table (`className`).
 *
 * Every colour and type style is the one the Figma layer is bound to. The
 * cell has no fill or border: the row draws those. In a selected TableRow,
 * secondary text and links switch to darker tokens (docs/figma-sync.md,
 * "TableRow"). Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("TableCell").
 */
const cell = cva('px-4 py-3', {
  variants: {
    type: {
      /* Text, Two Line, Tag: vertically centred, left-aligned */
      text: 'align-middle text-left',
      'two-line': 'align-middle text-left',
      tag: 'align-middle text-left',
      /* Checkbox, Actions: centred both ways */
      checkbox: 'align-middle text-center',
      actions: 'align-middle text-center',
      /* List, Status + Date: top-left */
      list: 'align-top text-left',
      'status-date': 'align-top text-left',
    },
  },
  defaultVariants: { type: 'text' },
});

const stack = cva('flex flex-col', {
  variants: {
    type: {
      text: 'items-start gap-0.5',
      'two-line': 'items-start gap-0.5',
      tag: 'items-start gap-0.5',
      checkbox: 'items-center gap-0.5',
      actions: 'items-center gap-0.5',
      list: 'items-start gap-0.5',
      'status-date': 'items-start gap-1',
    },
  },
  defaultVariants: { type: 'text' },
});

/* Secondary text (the second line, the date): text.subtle, or text.secondary in a
   selected TableRow, where text.subtle is below 4.5:1 on the row's tint in Light. */
const subtle = 'text-caption-md-regular text-text-subtle group-data-selected/row:text-text-secondary';

const toggle = [
  'cursor-pointer rounded-2 text-caption-md-regular text-text-link-default',
  // In a selected TableRow, links use text.link.selected to stay above 4.5:1 on its tint.
  'group-data-selected/row:text-text-link-selected',
  // Figma has no Focus state for the toggle; the ring is stroke.focused, as on Button.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
];

type Td = Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'children'>;

export type TableCellProps = Td &
  (
    | { /** Figma Type=Text: Value. */ type?: 'text'; children: React.ReactNode }
    | { type: 'two-line'; primary: React.ReactNode; secondary: React.ReactNode }
    | {
        /** Tag: a Status Pill. Checkbox: a `<Checkbox>`. Actions: the row actions button. */
        type: 'tag' | 'checkbox' | 'actions';
        children: React.ReactNode;
      }
    | { type: 'list'; items: React.ReactNode[]; defaultExpanded?: boolean }
    | { /** Status + Date: the Tag goes in children. */ type: 'status-date'; children: React.ReactNode; date: React.ReactNode }
  );

type AnyCellProps = Td & {
  type?: NonNullable<TableCellProps['type']>;
  children?: React.ReactNode;
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  items?: React.ReactNode[];
  defaultExpanded?: boolean;
  date?: React.ReactNode;
};

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>((props, ref) => {
  const { type = 'text', className, children, primary, secondary, items, defaultExpanded, date, ...td } =
    props as AnyCellProps;
  return (
    <td ref={ref} className={cn(cell({ type }), className)} {...td}>
      <div className={stack({ type })}>
        {type === 'text' && <span className="text-body-sm-regular text-text-primary">{children}</span>}
        {type === 'two-line' && (
          <>
            <span className="text-body-sm-medium text-text-primary">{primary}</span>
            <span className={subtle}>{secondary}</span>
          </>
        )}
        {(type === 'tag' || type === 'checkbox' || type === 'actions') && children}
        {type === 'list' && <ListCell items={items ?? []} defaultExpanded={defaultExpanded ?? false} />}
        {type === 'status-date' && (
          <>
            {children}
            <span className={subtle}>{date}</span>
          </>
        )}
      </div>
    </td>
  );
});
TableCell.displayName = 'TableCell';

/* List (Collapsed): the first item, then "+N more". List (Expanded): every
   item with a bullet, then "Show less". */
function ListCell({ items, defaultExpanded }: { items: React.ReactNode[]; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const listId = React.useId();
  const more = items.length - 1;
  return (
    <>
      {expanded ? (
        <ul id={listId} className="flex flex-col gap-0.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5 text-body-sm-regular text-text-primary">
              <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-text-primary" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <span id={listId} className="text-body-sm-semibold text-text-primary">
          {items[0]}
        </span>
      )}
      {more > 0 && (
        <button
          type="button"
          className={cn(toggle)}
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : `+${more} more`}
        </button>
      )}
    </>
  );
}

export const TABLE_CELL_TYPES = ['text', 'two-line', 'tag', 'checkbox', 'actions', 'list', 'status-date'] as const;
