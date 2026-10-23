import * as React from 'react';
import { cn } from '../../lib/cn';
import { ICON_PATHS } from './icons';

/**
 * Icon — a Phosphor glyph (MIT) at Regular weight, the icon set the CAF Figma
 * library draws from. The set is the icons Figma uses (scripts/icons.mjs).
 *
 * Figma → code:
 * - The icon component (e.g. `CaretDown / Style=Regular, Size=20px`) →
 *   `name="caret-down"`, Phosphor's kebab-case name.
 * - Size → `size`: 16, 20 (default), 24, 32 or 48, the sizes Figma places.
 *
 * Colour is never set here: the glyph is filled with currentColor, so it
 * takes the text colour of whatever it sits in. Set a text token on the
 * parent (or on the Icon) and it follows Light and Dark.
 */
export type IconName = keyof typeof ICON_PATHS;

/** Every glyph CAF ships, sorted. */
export const ICON_NAMES = Object.keys(ICON_PATHS).sort() as IconName[];

/* The sizes Figma places icons at, on GDL's space scale. Written out so the class scanner sees them. */
const SIZE = { 16: 'size-4', 20: 'size-5', 24: 'size-6', 32: 'size-8', 48: 'size-12' } as const;
export const ICON_SIZES = [16, 20, 24, 32, 48] as const;

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref' | 'children'> {
  name: IconName;
  /** Box size in px. Default 20. */
  size?: (typeof ICON_SIZES)[number];
  /**
   * An accessible name, only when the icon alone carries the meaning (a status
   * glyph with no text beside it). Leave it off when a visible label or the
   * control's own name says the same thing: the icon is then decorative.
   */
  label?: string;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(({ name, size = 20, label, className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 256 256"
    fill="currentColor"
    className={cn('inline-block shrink-0', SIZE[size], className)}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    focusable="false"
    {...props}
  >
    <path d={ICON_PATHS[name]} />
  </svg>
));
Icon.displayName = 'Icon';
