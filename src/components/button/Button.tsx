import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Icon } from '../icon';

/**
 * Button — the new CAF design's buttons (Components board, "Buttons"): a pill,
 * 40 high, one primary action per area.
 *
 * - `variant`: the style. The design's four are `default` (Primary),
 *   `outlined` (Secondary: white with a grey border), `text` (Ghost: no
 *   container until hovered) and `destructive` (Danger: only for actions that
 *   remove something, and always behind a confirm). `text-destructive` is the
 *   design's ghost-danger, a red Ghost for a remove action that isn't the main
 *   one. `tonal` (brand tint, e.g. View Changes) and `success` (e.g. Download)
 *   aren't drawn in the new design and stay, in its pill shape.
 * - `size`: `normal` (40, default), `small` (32) and `big` (48).
 * - `block`: the full width of its container (the design's `.btn-block`, on
 *   sign-in and mobile sheets; use it with `big`).
 * - States are the element's own: Hover = `:hover`, Pressed = `:active`,
 *   Focus = `:focus-visible`.
 * - Disabled: every style turns the same quiet grey. `disabled` takes the
 *   button out of the tab order; `aria-disabled` keeps it focusable (so a
 *   tooltip can say why), and its clicks are ignored. Prefer neither while a
 *   form has errors: the design keeps Submit enabled and shows what to fix.
 * - `busy`: the action is running. A spinner and `busyLabel` ("Saving…")
 *   replace the icon and label, `aria-busy` is set, and a second click is
 *   ignored. The style stays, so the button doesn't flash grey. Confirm with a
 *   toast when it's done.
 * - `leftIcon` / `rightIcon`: an icon before or after the label; it takes the
 *   label's colour and the size's icon size.
 * - `href`: a Button that navigates renders an `<a href>` with the same look.
 *   A link can't be disabled, so with `disabled` it stays a disabled `<button>`.
 *
 * Hover and Pressed are written `not-disabled:not-aria-disabled:hover:` (and
 * `active:`) rather than `enabled:`, which only matches form controls: so the
 * same classes style the `<a>` too, and a disabled button stays still.
 *
 * Only token utilities: where the design has a raw value, the nearest token is
 * used, and the PR that brought it in says which.
 */
const button = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none',
    'rounded-full font-sans transition-colors',
    /* Focus: a 2px stroke.focused ring, 2px outside the pill. The design's 3px halo waits on
       GDL issue #13. */
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused',
    /* Disabled, either way: the same quiet grey for every style (the design's
       `.btn[aria-disabled="true"]`): surface.neutral.faint, a stroke.subtle border, and the
       label in neutral.outline.content.default so it still reads. */
    'disabled:cursor-not-allowed disabled:bg-surface-neutral-faint disabled:text-neutral-outline-content-default disabled:inset-ring disabled:inset-ring-stroke-subtle',
    'aria-disabled:cursor-not-allowed aria-disabled:bg-surface-neutral-faint aria-disabled:text-neutral-outline-content-default aria-disabled:inset-ring aria-disabled:inset-ring-stroke-subtle',
    'aria-busy:cursor-progress',
  ],
  {
    variants: {
      variant: {
        /* Primary — action.primary, filled. */
        default: [
          'bg-action-primary-surface-default text-action-primary-content-default',
          'not-disabled:not-aria-disabled:hover:bg-action-primary-surface-hover not-disabled:not-aria-disabled:hover:text-action-primary-content-hover',
          'not-disabled:not-aria-disabled:active:bg-action-primary-surface-pressed not-disabled:not-aria-disabled:active:text-action-primary-content-pressed',
        ],
        /* Secondary — surface.base with a 1px stroke.default border (an inset ring, so it's as
           wide as the other styles) and the label in text.primary. Hover darkens the border to
           stroke.strong; Pressed fills surface.neutral.faint. */
        outlined: [
          'bg-surface-base text-text-primary inset-ring inset-ring-stroke-default',
          'not-disabled:not-aria-disabled:hover:inset-ring-stroke-strong',
          'not-disabled:not-aria-disabled:active:bg-surface-neutral-faint not-disabled:not-aria-disabled:active:inset-ring-stroke-strong',
        ],
        /* Ghost — no container, the label in text.primary. Hover and Pressed fill
           action.secondary's hover and pressed surfaces (a brand tint in Light, a lift in Dark). */
        text: [
          'bg-action-tertiary-surface-default text-text-primary',
          'not-disabled:not-aria-disabled:hover:bg-action-secondary-surface-hover',
          'not-disabled:not-aria-disabled:active:bg-action-secondary-surface-pressed',
        ],
        /* Ghost danger — no container, the label in accent.critical.tonal content. Hover and
           Pressed fill its tonal surface. */
        'text-destructive': [
          'bg-action-tertiary-surface-default text-accent-critical-tonal-content-default',
          'not-disabled:not-aria-disabled:hover:bg-accent-critical-tonal-surface-default not-disabled:not-aria-disabled:hover:text-accent-critical-tonal-content-hover',
          'not-disabled:not-aria-disabled:active:bg-accent-critical-tonal-surface-hover not-disabled:not-aria-disabled:active:text-accent-critical-tonal-content-hover',
        ],
        /* Danger — accent.critical.filled, state by state. */
        destructive: [
          'bg-accent-critical-filled-surface-default text-accent-critical-filled-content-default',
          'not-disabled:not-aria-disabled:hover:bg-accent-critical-filled-surface-hover not-disabled:not-aria-disabled:hover:text-accent-critical-filled-content-hover',
          'not-disabled:not-aria-disabled:active:bg-accent-critical-filled-surface-pressed not-disabled:not-aria-disabled:active:text-accent-critical-filled-content-pressed',
        ],
        /* Tonal — brand tint (e.g. View Changes): surface.brand faint → subtle → medium, the label
           in text.brand.strong (text.brand.stronger while pressed). */
        tonal: [
          'bg-surface-brand-faint text-text-brand-strong',
          'not-disabled:not-aria-disabled:hover:bg-surface-brand-subtle',
          'not-disabled:not-aria-disabled:active:bg-surface-brand-medium not-disabled:not-aria-disabled:active:text-text-brand-stronger',
        ],
        /* Success — accent.success.filled (e.g. Download), state by state. */
        success: [
          'bg-accent-success-filled-surface-default text-accent-success-filled-content-default',
          'not-disabled:not-aria-disabled:hover:bg-accent-success-filled-surface-hover not-disabled:not-aria-disabled:hover:text-accent-success-filled-content-hover',
          'not-disabled:not-aria-disabled:active:bg-accent-success-filled-surface-pressed not-disabled:not-aria-disabled:active:text-accent-success-filled-content-pressed',
        ],
      },
      size: {
        /* 48 high, 20px sides, Body/lg-semibold, 24px icon. The design's block button (46,
           15px) snaps to it. */
        big: 'h-12 gap-2 px-5 text-body-lg-semibold',
        /* 40 high, 16px sides, Label/md-semibold (14/600), 20px icon. */
        normal: 'h-10 gap-2 px-4 text-label-md-semibold',
        /* 32 high, 12px sides, Label/md-semibold, 16px icon. The design's 34 / 14px sides / 13px
           snap to GDL's scale. */
        small: 'h-8 gap-2 px-3 text-label-md-semibold',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'default', size: 'normal', block: false },
  },
);

/* The icon follows the label's colour (currentColor) and takes the size's icon size, whatever
   size the icon component itself asks for. */
const icon = cva('inline-flex shrink-0 [&>svg]:size-full', {
  variants: {
    size: { big: 'size-6', normal: 'size-5', small: 'size-4' },
  },
  defaultVariants: { size: 'normal' },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  /** Icon before the label. */
  leftIcon?: React.ReactNode;
  /** Icon after the label. */
  rightIcon?: React.ReactNode;
  /**
   * Where it navigates. It then renders an `<a href>` with the same look. Ignored while
   * `disabled`: a link can't be disabled, so it stays a disabled `<button>`. The ref is the `<a>`
   * or the `<button>`.
   */
  href?: string;
  /** The action is running: a spinner and `busyLabel` show, `aria-busy` is set and clicks are ignored. */
  busy?: boolean;
  /** The label while `busy`, saying what's happening, e.g. "Saving…". Default: the label. */
  busyLabel?: React.ReactNode;
}

const isTrue = (value: unknown) => value === true || value === 'true';

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      block,
      leftIcon,
      rightIcon,
      children,
      type = 'button',
      href,
      busy = false,
      busyLabel,
      onClick,
      ...props
    },
    ref,
  ) => {
    const classes = cn(button({ variant, size, block }), className);
    /* aria-disabled and busy keep the button focusable, so its clicks are stopped here: a submit
       button doesn't submit, a link doesn't navigate. */
    const inert = busy || isTrue(props['aria-disabled']);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };
    const content = busy ? (
      <>
        <span className={icon({ size })} aria-hidden="true">
          <Icon name="spinner" className="motion-safe:animate-spin" />
        </span>
        {busyLabel ?? children}
      </>
    ) : (
      <>
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
      </>
    );
    const busyProps = busy ? { 'aria-busy': true as const } : {};
    if (href !== undefined && !props.disabled) {
      /* A link: the button-only `type` and `disabled` stay behind. */
      const { disabled: _disabled, ...link } = props;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...(link as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          {...busyProps}
          onClick={handleClick}
        >
          {content}
        </a>
      );
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        className={classes}
        {...props}
        {...busyProps}
        onClick={handleClick}
      >
        {content}
      </button>
    );
  },
);
Button.displayName = 'Button';

export const BUTTON_VARIANTS = ['default', 'outlined', 'text', 'text-destructive', 'destructive', 'tonal', 'success'] as const;
export const BUTTON_SIZES = ['big', 'normal', 'small'] as const;
