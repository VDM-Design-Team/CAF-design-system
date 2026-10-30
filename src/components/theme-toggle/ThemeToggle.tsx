import * as React from 'react';
import { cn } from '../../lib/cn';
import { IconButton, type IconButtonProps } from '../icon-button';

/**
 * ThemeToggle — built from the CAF Figma library, page "Navigation":
 * `Navigation / Theme Toggle` (462:792, Theme Dark/Light), the header's
 * switch between CAF's Light and Dark themes.
 *
 * Figma → code:
 * - Theme → `theme`: `dark` shows the moon, `light` the sun. Figma's
 *   description: "Theme=Dark shows the moon (click → light)". The glyph shows
 *   the theme in use; a click asks for the other one.
 * - The 40×40 frame, radius 8 and 20px Phosphor glyph → IconButton size 40
 *   (Button / Icon, whose description names it for the theme button).
 * - Glyph fill → `text.primary`, the Theme Toggle's own binding. (Button /
 *   Icon Ghost's glyph is `text.secondary`; the Toggle's binding wins.)
 * - Figma has no Hover → Button / Icon Ghost's, `neutral.tonal.surface.default`.
 *
 * It is controlled: `theme` is the theme in use, and `onThemeChange` gets the
 * one the user asked for. It never touches the document itself. The app
 * switches CAF's theme (the `.dark` class on <html>, as Storybook's toolbar
 * does) and remembers the choice (pattern 15).
 *
 * It is a button whose accessible name says what a click does: "Switch to
 * light theme" in Dark, "Switch to dark theme" in Light. Pass `aria-label` to
 * translate it. Pattern 15 asks for a tooltip; UserActions adds one.
 *
 * Where code departs from Figma, the reason is in docs/figma-sync.md
 * ("ThemeToggle").
 */
export type ThemeToggleTheme = 'dark' | 'light';

/** Figma's Theme values, in Figma's order. */
export const THEME_TOGGLE_THEMES = ['dark', 'light'] as const;

/** The accessible name for each theme in use: what a click does. A tooltip can reuse it. */
export const THEME_TOGGLE_LABELS = {
  dark: 'Switch to light theme',
  light: 'Switch to dark theme',
} as const satisfies Record<ThemeToggleTheme, string>;

/** The glyph for the theme in use (Figma's Theme variants), and the theme a click asks for. */
const SHOWS = {
  dark: { icon: 'moon', next: 'light' },
  light: { icon: 'sun', next: 'dark' },
} as const satisfies Record<ThemeToggleTheme, { icon: string; next: ThemeToggleTheme }>;

export interface ThemeToggleProps extends Omit<IconButtonProps, 'icon' | 'label' | 'size' | 'tone'> {
  /** Figma Theme: the theme in use. `dark` shows the moon, `light` the sun. */
  theme: ThemeToggleTheme;
  /** Called with the other theme when the user clicks. Switch the theme here; the toggle doesn't. */
  onThemeChange?: (theme: ThemeToggleTheme) => void;
}

export const ThemeToggle = React.forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ theme, onThemeChange, onClick, className, ...props }, ref) => {
    const { icon, next } = SHOWS[theme];
    return (
      <IconButton
        ref={ref}
        icon={icon}
        label={THEME_TOGGLE_LABELS[theme]}
        size={40}
        tone="ghost"
        /* Figma binds the glyph to text.primary, over Ghost's text.secondary. */
        className={cn('text-text-primary', className)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onThemeChange?.(next);
        }}
        {...props}
      />
    );
  },
);
ThemeToggle.displayName = 'ThemeToggle';
