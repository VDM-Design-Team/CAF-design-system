import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';
import { Tooltip, type TooltipPlacement } from '../tooltip';

/**
 * IconButton — the new CAF design's icon-only button (Components board,
 * "Buttons": `.icon-btn`), for refresh, close, download, delete and the table
 * row's •••.
 *
 * - `size`: 36 (default; 20px glyph), 32 (16px glyph, for tight spots inside
 *   a field, an alert or a toast) or 40 (20px glyph, the header).
 * - `tone`: `ghost` (default; a muted glyph, no fill until hovered), `tonal`
 *   (surface.base fill) or `destructive` (a red glyph).
 * - Radius 8. Hover fills action.secondary's hover surface (a brand tint in
 *   Light, a lift in Dark), as the Ghost Button does, and the glyph darkens to
 *   text.primary.
 * - Disabled: the glyph in text.disabled, no hover fill; the tone's container
 *   stays.
 *
 * It has no visible text, so `label` is required: it is the button's
 * accessible name, and a tooltip with the same words shows on hover and on
 * keyboard focus (the design: "Icon-only buttons always get an aria-label and
 * a tooltip with the same words"). The tooltip only repeats the name, so
 * screen readers don't hear it twice. `tooltipPlacement` puts it below (in a
 * header at the top of the screen); `tooltip={false}` turns it off where
 * something else already names the button.
 *
 * With the tooltip on, the button sits in the tooltip's wrapper, and
 * `className` goes on that wrapper: use it to place the button (margins,
 * absolute positioning), not to restyle it.
 */
const iconButton = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-8 transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
    /* Disabled: every tone keeps its container (Tonal's surface.base) and draws the glyph in
       text.disabled; the hover fills are enabled-only. */
    'disabled:cursor-not-allowed disabled:text-text-disabled',
  ],
  {
    variants: {
      size: { 32: 'size-8', 36: 'size-9', 40: 'size-10' },
      tone: {
        /* Ghost — no fill, a text.secondary glyph. Hover: action.secondary's hover surface, the
           glyph in text.primary. */
        ghost: 'text-text-secondary enabled:hover:bg-action-secondary-surface-hover enabled:hover:text-text-primary',
        /* Tonal — surface.base fill, a text.primary glyph. Hover: action.secondary's hover surface. */
        tonal: 'bg-surface-base text-text-primary enabled:hover:bg-action-secondary-surface-hover',
        /* Destructive — no fill, an accent.critical.tonal glyph. Hover: its tonal fill. */
        destructive:
          'text-accent-critical-tonal-content-default enabled:hover:bg-accent-critical-tonal-surface-default enabled:hover:text-accent-critical-tonal-content-hover',
      },
    },
    defaultVariants: { size: 36, tone: 'ghost' },
  },
);

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The glyph: an Icon name. */
  icon: IconName;
  /** The button's accessible name, e.g. "Row actions" or "Close", and its tooltip. Required: the button has no visible text. */
  label: string;
  /** 36 (default), 32 or 40. */
  size?: 32 | 36 | 40;
  /** ghost (default), tonal or destructive. */
  tone?: 'ghost' | 'tonal' | 'destructive';
  /** Show the label as a tooltip on hover and keyboard focus. Default true. */
  tooltip?: boolean;
  /** Where the tooltip goes: above (default) or below. It flips when there's no room. */
  tooltipPlacement?: TooltipPlacement;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 36, tone, className, type = 'button', tooltip = true, tooltipPlacement, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(iconButton({ size, tone }), !tooltip && className)}
        {...props}
      >
        <Icon name={icon} size={size === 32 ? 16 : 20} />
      </button>
    );
    if (!tooltip) return button;
    return (
      <Tooltip text={label} placement={tooltipPlacement} describes={false} className={className}>
        {button}
      </Tooltip>
    );
  },
);
IconButton.displayName = 'IconButton';

export const ICON_BUTTON_SIZES = [32, 36, 40] as const;
export const ICON_BUTTON_TONES = ['ghost', 'tonal', 'destructive'] as const;
