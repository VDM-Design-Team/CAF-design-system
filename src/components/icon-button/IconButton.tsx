import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../icon';

/**
 * IconButton — built from the CAF Figma library, page "Buttons":
 * `Button / Icon` (Size × Tone × State), the icon-only button for refresh,
 * close, theme, trash and the table row's •••.
 *
 * Figma → code:
 * - Size  → `size`: 32 (16px glyph, default) or 40 (20px glyph).
 * - Tone  → `tone`: ghost (default), tonal or destructive.
 * - State → the element's own state: Hover = `:hover`.
 * - The nested icon instance → `icon`, an Icon name (e.g. `dots-three`).
 *
 * It has no visible text, so `label` is required: it is the button's
 * accessible name. Every colour is the semantic variable the Figma layer is
 * bound to. Where code departs from Figma, the reason is in
 * docs/figma-sync.md ("IconButton").
 */
const iconButton = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-8 transition-colors',
    // Figma has no Focus state yet; the ring uses stroke.focused, as Button's does.
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
    'disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: { 32: 'size-8', 40: 'size-10' },
      tone: {
        /* Tone=Ghost — no fill; text.secondary glyph. Hover: neutral.tonal fill. */
        ghost: 'text-text-secondary enabled:hover:bg-neutral-tonal-surface-default',
        /* Tone=Tonal — surface.base fill; text.primary glyph. Hover: neutral.tonal fill. */
        tonal: 'bg-surface-base text-text-primary enabled:hover:bg-neutral-tonal-surface-default',
        /* Tone=Destructive — no fill; accent.critical.tonal glyph. Hover: its tonal fill. */
        destructive:
          'text-accent-critical-tonal-content-default enabled:hover:bg-accent-critical-tonal-surface-default',
      },
    },
    defaultVariants: { size: 32, tone: 'ghost' },
  },
);

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The glyph: an Icon name. */
  icon: IconName;
  /** The button's accessible name, e.g. "Row actions" or "Close". Required: the button has no visible text. */
  label: string;
  /** Figma Size: 32 (default) or 40. */
  size?: 32 | 40;
  /** Figma Tone: ghost (default), tonal or destructive. */
  tone?: 'ghost' | 'tonal' | 'destructive';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 32, tone, className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} aria-label={label} className={cn(iconButton({ size, tone }), className)} {...props}>
      <Icon name={icon} size={size === 40 ? 20 : 16} />
    </button>
  ),
);
IconButton.displayName = 'IconButton';

export const ICON_BUTTON_SIZES = [32, 40] as const;
export const ICON_BUTTON_TONES = ['ghost', 'tonal', 'destructive'] as const;
