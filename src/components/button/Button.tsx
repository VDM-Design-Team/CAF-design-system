import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Button — built from the CAF Figma library, page "Buttons":
 * `Button / Big`, `Button / Normal` and `Button / Small`
 * (Style × State × Show Icons).
 *
 * Figma → code:
 * - Style   → `variant`: Default, Outlined, Text, Destructive, Tonal, Success
 *   (React reserves `style`).
 * - Size    → `size`: the three component sets, Big / Normal / Small.
 * - State   → the element's own states: Hover = `:hover`, Pressed = `:active`,
 *   Disabled = the `disabled` attribute.
 * - Show Icons, and the nested Button_Normal's Show Left / Right Icon →
 *   `leftIcon` / `rightIcon`.
 *
 * Every colour below is the semantic variable the Figma layer is bound to,
 * in that state. Spacing, radius, type and elevation are GDL's. Never add a
 * hex, px value or arbitrary Tailwind class; if a value is missing, it goes
 * into Figma and the tokens first. Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("Button").
 */
const button = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none',
    'rounded-8 font-sans transition-colors',
    // Figma has no Focus state yet; the ring uses stroke.focused.
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
    'disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        /* Style=Default — action.primary, filled. */
        default: [
          'bg-action-primary-surface-default text-action-primary-content-default',
          'enabled:hover:bg-action-primary-surface-hover enabled:hover:text-action-primary-content-hover enabled:hover:shadow-elevation-2',
          'enabled:active:bg-action-primary-surface-pressed enabled:active:text-action-primary-content-pressed enabled:active:shadow-none',
          'disabled:bg-action-primary-surface-disabled disabled:text-action-primary-content-disabled',
        ],
        /* Style=Outlined — action.secondary. The 1px stroke is an inset ring,
           so it sits inside the box the way Figma's INSIDE stroke does and the
           button is as wide as the other styles. */
        outlined: [
          'bg-action-secondary-surface-default text-action-secondary-content-default',
          'inset-ring inset-ring-action-secondary-border-default',
          'enabled:hover:bg-action-secondary-surface-hover enabled:hover:text-action-secondary-content-hover enabled:hover:inset-ring-action-secondary-border-hover',
          'enabled:active:bg-action-secondary-surface-pressed enabled:active:text-action-secondary-content-pressed enabled:active:inset-ring-action-secondary-border-pressed',
          'disabled:bg-action-secondary-surface-disabled disabled:text-action-secondary-content-disabled disabled:inset-ring-action-secondary-border-disabled',
        ],
        /* Style=Text — action.tertiary, no container until hovered (Dark). */
        text: [
          'bg-action-tertiary-surface-default text-action-tertiary-content-default',
          'enabled:hover:bg-action-tertiary-surface-hover enabled:hover:text-action-tertiary-content-hover',
          'enabled:active:bg-action-tertiary-surface-pressed enabled:active:text-action-tertiary-content-pressed',
          'disabled:bg-action-tertiary-surface-disabled disabled:text-action-tertiary-content-disabled',
        ],
        /* Style=Destructive — accent.critical.filled surface. Figma binds the
           label and icon to action.primary.content.default in every state. */
        destructive: [
          'bg-accent-critical-filled-surface-default text-action-primary-content-default',
          'enabled:hover:bg-accent-critical-filled-surface-hover enabled:hover:shadow-elevation-2',
          'enabled:active:bg-accent-critical-filled-surface-pressed enabled:active:shadow-none',
          'disabled:bg-accent-critical-filled-surface-disabled',
        ],
        /* Style=Tonal — brand tint (e.g. View Changes): surface.brand
           faint → subtle → medium, label in action.primary.surface.default.
           Figma's Disabled is identical to Default. */
        tonal: [
          'bg-surface-brand-faint text-action-primary-surface-default',
          'enabled:hover:bg-surface-brand-subtle enabled:hover:shadow-elevation-2',
          'enabled:active:bg-surface-brand-medium enabled:active:shadow-none',
        ],
        /* Style=Success — accent.success.filled surface (e.g. Download). Figma
           binds the label and icon to action.primary.content.default. */
        success: [
          'bg-accent-success-filled-surface-default text-action-primary-content-default',
          'enabled:hover:bg-accent-success-filled-surface-hover enabled:hover:shadow-elevation-2',
          'enabled:active:bg-accent-success-filled-surface-pressed enabled:active:shadow-none',
          'disabled:bg-accent-success-filled-surface-disabled',
        ],
      },
      size: {
        /* Button / Big — Body/lg-semibold, 20px sides, 24px icon. */
        big: 'h-12 gap-2 px-5 text-body-lg-semibold',
        /* Button / Normal — Label/md-semibold, 16px sides, 20px icon. */
        normal: 'h-9 gap-2 px-4 text-label-md-semibold',
        /* Button / Small — Label/sm-semibold, 12px sides, 16px icon. */
        small: 'h-8 gap-2 px-3 text-label-sm-semibold',
      },
    },
    defaultVariants: { variant: 'default', size: 'normal' },
  },
);

/* The icon follows the label's colour (currentColor) and takes the size the
   Figma set gives it, whatever size the icon component itself asks for. */
const icon = cva('inline-flex shrink-0 [&>svg]:size-full', {
  variants: {
    size: { big: 'size-6', normal: 'size-5', small: 'size-4' },
  },
  defaultVariants: { size: 'normal' },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  /** Icon before the label (Figma: Show Icons / Show Left Icon). */
  leftIcon?: React.ReactNode;
  /** Icon after the label (Figma: Show Right Icon on the nested Button_Normal). */
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, leftIcon, rightIcon, children, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(button({ variant, size }), className)} {...props}>
      {leftIcon && (
        <span className={icon({ size })} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span className={icon({ size })} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  ),
);
Button.displayName = 'Button';

export const BUTTON_VARIANTS = ['default', 'outlined', 'text', 'destructive', 'tonal', 'success'] as const;
export const BUTTON_SIZES = ['big', 'normal', 'small'] as const;
