import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon } from '../icon';

/**
 * EmptyState — built from the CAF Figma library, page "Feedback":
 * `Empty State` (Size × Title × Description × Show Action), what a list or a
 * page shows when it has nothing to show.
 *
 * Figma → code:
 * - Size → `size`: `default` (page level: the icon tile, title, description
 *   and an optional action) or `compact` (inside a table body: a small icon
 *   and the title only).
 * - Title → `title`; Description → `description` (Default only).
 * - Show Action, and the nested Button → `action`: the Button to show
 *   (Figma's is a Normal, Style=Default Button with a Plus icon, e.g.
 *   `<Button leftIcon={<Icon name="plus" />}>Add New</Button>`). Default only.
 * - The icon is Figma's fixed Tray glyph; Figma has no property to swap it.
 *
 * Every colour and type style is the one the Figma layer is bound to. The
 * title is a paragraph, not a heading: the empty state sits under the
 * page's or the table's own heading. It centres itself in the space it is
 * given (a page, or a `<td colSpan>` across the table). Where code departs
 * from Figma, the reason is in docs/figma-sync.md ("EmptyState").
 */
const root = cva(
  /* Figma's fixed 480px width → at most max-w-lg (512), centred. */
  'mx-auto flex w-full max-w-lg flex-col items-center text-center',
  {
    variants: {
      size: {
        /* Size=Default — 48px top and bottom, 24px sides, 12px gap. */
        default: 'gap-3 px-6 py-12',
        /* Size=Compact — 24px all round, 6px gap. */
        compact: 'gap-1.5 p-6',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

const tile = cva('flex shrink-0 items-center justify-center text-text-subtle', {
  variants: {
    size: {
      /* Icon Tile — 64×64, surface.base, radius 32 (half its size) → full; a 32px Tray in text.subtle. */
      default: 'size-16 rounded-full bg-surface-base',
      /* Icon Tile — 24×24, no fill; a 20px Tray in text.subtle. */
      compact: 'size-6',
    },
  },
  defaultVariants: { size: 'default' },
});

const titleText = cva('', {
  variants: {
    size: {
      /* Title — Body/md-semibold, text.primary. */
      default: 'text-body-md-semibold text-text-primary',
      /* Title — Body/sm-regular, text.subtle. */
      compact: 'text-body-sm-regular text-text-subtle',
    },
  },
  defaultVariants: { size: 'default' },
});

type Div = Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'children'>;

export type EmptyStateProps = Div & {
  /** Figma Title: what is empty, e.g. "No announcements yet". */
  title: React.ReactNode;
} & (
    | {
        /** Figma Size=Default: the page-level empty state. */
        size?: 'default';
        /** Figma Description: why it's empty, or what would fill it. */
        description?: React.ReactNode;
        /** Figma Show Action: the way forward, a `<Button>`. Leave it out to hide it. */
        action?: React.ReactNode;
      }
    | {
        /** Figma Size=Compact: a small icon and the title, inside a table body. */
        size: 'compact';
        description?: never;
        action?: never;
      }
  );

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ size = 'default', title, description, action, className, ...props }, ref) => (
    <div ref={ref} className={cn(root({ size }), className)} {...props}>
      <span aria-hidden="true" className={tile({ size })}>
        <Icon name="tray" size={size === 'compact' ? 20 : 32} />
      </span>
      <p className={titleText({ size })}>{title}</p>
      {size === 'default' && description && (
        /* Description — Body/sm-regular, text.subtle. */
        <p className="text-body-sm-regular text-text-subtle">{description}</p>
      )}
      {size === 'default' && action}
    </div>
  ),
);
EmptyState.displayName = 'EmptyState';

export const EMPTY_STATE_SIZES = ['default', 'compact'] as const;
