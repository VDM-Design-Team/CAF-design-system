import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * GDL's scales, as tailwind-merge needs to know them.
 *
 * Out of the box tailwind-merge only knows Tailwind's default names, so it
 * misfiles GDL's:
 * - `text-label-md-semibold` sets size, line height, weight and tracking, but
 *   any unknown `text-…` is taken for a colour. Then `text-label-md-semibold`
 *   and `text-action-primary-content-default` look like the same property, and
 *   one is silently dropped (VCP shipped that bug in its Button).
 * - `rounded-8` and `shadow-elevation-2` aren't recognised as radius and
 *   shadow, so a `className` override wouldn't replace them.
 *
 * Keep these in step with GDL's tokens (`tokens/semantic/type.json`,
 * `tokens/core/dimension.json`, `tokens/core/elevation.json` in
 * @vdm-design-team/gdl). `npm run lint:components` fails if they drift.
 */
const TYPE_RAMP = [
  'display-xl-bold',
  'display-xl-semibold',
  'display-lg-bold',
  'display-lg-semibold',
  'display-md-bold',
  'display-md-semibold',
  'heading-xl-bold',
  'heading-xl-semibold',
  'heading-xl-regular',
  'heading-lg-bold',
  'heading-lg-semibold',
  'heading-lg-regular',
  'heading-md-bold',
  'title-md-bold',
  'title-md-semibold',
  'title-md-regular',
  'title-sm-bold',
  'title-sm-semibold',
  'title-sm-medium',
  'title-sm-regular',
  'body-lg-bold',
  'body-lg-semibold',
  'body-lg-medium',
  'body-lg-regular',
  'body-md-bold',
  'body-md-semibold',
  'body-md-medium',
  'body-md-regular',
  'body-sm-bold',
  'body-sm-semibold',
  'body-sm-medium',
  'body-sm-regular',
  'label-md-semibold',
  'label-md-medium',
  'label-md-regular',
  'label-sm-bold',
  'label-sm-semibold',
  'label-sm-medium',
  'label-sm-regular',
  'caption-md-bold',
  'caption-md-semibold',
  'caption-md-medium',
  'caption-md-regular',
  'caption-sm-bold',
  'caption-sm-semibold',
  'caption-sm-medium',
  'caption-sm-regular',
] as const;

const RADIUS = ['0', '2', '4', '6', '8', '12', '16', '20', '24', '28', '32', '64', 'full'] as const;

const ELEVATION = ['elevation-1', 'elevation-2', 'elevation-3', 'elevation-4', 'elevation-5', 'elevation-6', 'elevation-7'] as const;

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [...TYPE_RAMP],
      radius: [...RADIUS],
      shadow: [...ELEVATION],
    },
  },
});

/** Merge Tailwind classes safely — later classes win on conflict. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
