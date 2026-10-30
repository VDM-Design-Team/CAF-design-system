import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';

/**
 * StatCard — built from the CAF Figma library, page "Cards": `Card / Stat`
 * with its private `_Stat Icon` tile. One total in the row of stats above a
 * list (Exports, Announcements). Put several in a StatRow.
 *
 * Figma → code:
 * - Label → `label`, the card's name ("Total Exports").
 * - Value → `value`, the number or text it reports ("5981", "2.5.6",
 *   "Aug 10, 2026").
 * - Status Indicator (an instance swap of `_Stat Icon`) → `icon` and `tone`.
 *   `_Stat Icon`'s Type picks a glyph and an accent colour; code takes the
 *   two apart so any stat can use them:
 *
 *   | `_Stat Icon` Type   | `icon`           | `tone`     |
 *   |---------------------|------------------|------------|
 *   | Total Exports       | `file-text`      | `info`     |
 *   | Completed           | `check-circle`   | `success`  |
 *   | Processing          | `clock`          | `pending`  |
 *   | Failed              | `x-circle`       | `critical` |
 *   | Total Announcements | `bell`           | `info`     |
 *   | Latest Version      | `tag`            | `success`  |
 *   | Last Updated        | `calendar-blank` | `info`     |
 *
 * `_Stat Icon` is used only here, so it stays inside StatCard rather than
 * being its own component. The tile is decorative: the label says what the
 * stat is. The card is an `<article>` named by its label; the value is a
 * paragraph, not a heading (docs/figma-sync.md, "StatCard"). It has no
 * states. Every colour and type style is the one the Figma layer is bound
 * to. Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("StatCard").
 */
const tile = cva('flex size-10 shrink-0 items-center justify-center rounded-8', {
  variants: {
    tone: {
      /* Each tone: accent.<tone>.tonal surface for the tile, its content for the glyph. */
      info: 'bg-accent-info-tonal-surface-default text-accent-info-tonal-content-default',
      success: 'bg-accent-success-tonal-surface-default text-accent-success-tonal-content-default',
      pending: 'bg-accent-pending-tonal-surface-default text-accent-pending-tonal-content-default',
      critical: 'bg-accent-critical-tonal-surface-default text-accent-critical-tonal-content-default',
    },
  },
  defaultVariants: { tone: 'info' },
});

export type StatCardTone = 'info' | 'success' | 'pending' | 'critical';

export interface StatCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Figma Label: what the stat counts, e.g. "Total Exports". It names the card. */
  label: React.ReactNode;
  /** Figma Value: the figure, e.g. "5981". */
  value: React.ReactNode;
  /** The Status Indicator's glyph, a Phosphor name (`file-text`, `check-circle`, …). */
  icon: IconName;
  /** The Status Indicator's colour: info (default), success, pending or critical. */
  tone?: StatCardTone;
}

export const StatCard = React.forwardRef<HTMLElement, StatCardProps>(
  ({ label, value, icon, tone = 'info', className, ...props }, ref) => {
    const labelId = React.useId();
    return (
      /* Horizontal, centred; 24px padding, 12px gap, radius 12; surface.base. */
      <article
        ref={ref}
        aria-labelledby={labelId}
        className={cn('flex items-center gap-3 rounded-12 bg-surface-base p-6', className)}
        {...props}
      >
        {/* _Stat Icon — 40×40, radius 8; a 24px glyph. */}
        <span aria-hidden="true" className={tile({ tone })}>
          <Icon name={icon} size={24} />
        </span>
        {/* Text Group — vertical, 4px gap, fills the rest. */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Label — Body/sm-regular, text.subtle. */}
          <p id={labelId} className="text-body-sm-regular text-text-subtle">
            {label}
          </p>
          {/* Value — Heading/lg-semibold, text.primary. */}
          <p className="text-heading-lg-semibold text-text-primary">{value}</p>
        </div>
      </article>
    );
  },
);
StatCard.displayName = 'StatCard';

export const STAT_CARD_TONES = ['info', 'success', 'pending', 'critical'] as const;
