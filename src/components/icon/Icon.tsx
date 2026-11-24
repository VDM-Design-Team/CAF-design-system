import * as React from 'react';
import { cn } from '../../lib/cn';
import { CAF_ICONS, ICON_ALIASES, LEGACY_PATHS } from './icons';

/**
 * Icon — CAF Icons v1.4, the set drawn for the new CAF design: a 24-unit grid,
 * 2px lines with round caps and joins, and an open ring on every outlined
 * circle. The SVG sources are in icons/caf/; `npm run icons` builds them.
 *
 * - `name`: a CAF icon (`chevron-down`, `delete`, `search` …). The old
 *   Phosphor names still work as deprecated aliases (`caret-down` draws
 *   `chevron-down`; see ICON_ALIASES). A few Phosphor glyphs CAF Icons has no
 *   counterpart for yet (`funnel`, `tray`, `tag` …) still draw as Phosphor.
 * - `size`: 16, 20 (default), 24, 32 or 48. The line scales with the icon.
 *
 * Colour is never set here: the icon draws in currentColor, so it takes the
 * text colour of whatever it sits in, in Light and Dark.
 */
export type CafIconName = keyof typeof CAF_ICONS;
export type IconName = CafIconName | keyof typeof LEGACY_PATHS | keyof typeof ICON_ALIASES;

/** Every icon you can draw by its own name (CAF, then the Phosphor glyphs not yet redrawn), sorted. Aliases are left out. */
export const ICON_NAMES = [...Object.keys(CAF_ICONS), ...Object.keys(LEGACY_PATHS)].sort() as IconName[];
export { ICON_ALIASES };

/* The sizes icons are placed at, on GDL's space scale. Written out so the class scanner sees them. */
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

const isCaf = (name: string): name is CafIconName => name in CAF_ICONS;

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(({ name, size = 20, label, className, ...props }, ref) => {
  const resolved: string = (ICON_ALIASES as Record<string, string>)[name] ?? name;
  const shared = {
    ref,
    className: cn('inline-block shrink-0', SIZE[size], className),
    role: label ? 'img' : undefined,
    'aria-label': label,
    'aria-hidden': label ? undefined : true,
    focusable: 'false' as const,
    'data-icon': resolved,
  };
  if (isCaf(resolved)) {
    const { root, children } = CAF_ICONS[resolved];
    return (
      <svg viewBox="0 0 24 24" {...root} {...shared} {...props}>
        {children.map(([Tag, attrs], i) => (
          <Tag key={i} {...attrs} />
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" {...shared} {...props}>
      <path d={LEGACY_PATHS[resolved as keyof typeof LEGACY_PATHS]} />
    </svg>
  );
});
Icon.displayName = 'Icon';
