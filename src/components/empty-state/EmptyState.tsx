import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';

/**
 * EmptyState — built from the CAF Figma library, page "Feedback":
 * `Empty State` (Size × Title × Description × Show Action × Icon), what a
 * list or a page shows when it has nothing to show.
 *
 * Figma → code:
 * - Size → `size`: `default` (page level: the icon tile, title, description
 *   and an optional action) or `compact` (inside a table body: a small icon
 *   and the title only).
 * - Title → `title`; Description → `description` (Default only).
 * - Show Action, and the nested Button → `action`: the Button to show
 *   (Figma's is a Normal, Style=Default Button with a Plus icon, e.g.
 *   `<Button leftIcon={<Icon name="plus" />}>Add New</Button>`). Default only.
 * - Icon (an instance-swap property since 3 Nov 2026, default Tray 32) →
 *   `icon`, an Icon name (default `tray`), drawn at 32 in the tile. Figma
 *   binds it to Size=Default only: Compact keeps its fixed 20px Tray, so
 *   Compact has no `icon`.
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

const tile = cva('flex shrink-0 items-center justify-center', {
  variants: {
    size: {
      /* Icon Tile — 64×64, radius full; the neutral tonal pair (since 3 Nov 2026): a
         neutral.tonal.surface.default fill and the 32px glyph in neutral.tonal.content.default. */
      default: 'size-16 rounded-full bg-neutral-tonal-surface-default text-neutral-tonal-content-default',
      /* Icon Tile — 24×24, no fill; a 20px Tray in text.subtle. */
      compact: 'size-6 text-text-subtle',
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
        /** Figma Icon: the tile's glyph, an Icon name. Default `tray`, as in Figma. */
        icon?: IconName;
      }
    | {
        /** Figma Size=Compact: a small icon and the title, inside a table body. */
        size: 'compact';
        description?: never;
        action?: never;
        /** Compact's 20px Tray is fixed: Figma's Icon swap is bound to Size=Default only. */
        icon?: never;
      }
  );

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ size = 'default', title, description, action, icon = 'tray', className, ...props }, ref) => (
    <div ref={ref} className={cn(root({ size }), className)} {...props}>
      <span aria-hidden="true" className={tile({ size })}>
        {size === 'compact' ? <Icon name="tray" size={20} /> : <Icon name={icon} size={32} />}
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
