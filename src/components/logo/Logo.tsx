import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Logo — built from the CAF Figma library, page "Navigation":
 * `Navigation / Logo` (4:238), the CAF mark and wordmark at the left of the
 * Top Bar and the Mobile Header. Figma has no properties and one version,
 * which the Dark headers use too.
 *
 * Figma → code:
 * - Logo Mark (four vectors) → four `<path>`s, the vectors' own geometry.
 *   Figma's fills are raw brand colours ("intentionally not tokenized"); each
 *   is the nearest step of CAF's brand ramp, which doesn't change with the
 *   theme, as Figma's raw fills don't (the raw values are in the docs):
 *     Part 1 and Part 4 → `fill-caf-blue-600`
 *     Part 2            → `fill-caf-blue-300`
 *     Part 3            → `fill-caf-blue-400`
 * - Wordmark ("CAF", Work Sans Medium 40, bound to text/primary) → one
 *   `<path>`, Figma's own outline of the text, in `fill-text-primary`. As a
 *   path it needs no Work Sans, and it follows Light and Dark.
 * - Size: 123 × 48 (`h-12`). Where Figma scales an instance (92 × 36 in the
 *   Mobile Header), set the height with `className` (`h-9`); the width
 *   follows.
 *
 * It is an `<svg role="img">` named "CAF". Give it another `aria-label`, or
 * `aria-hidden` when something next to it already says "CAF" (a home link
 * named "CAF home" can hold it as is). Where code departs from Figma, the
 * reason is in docs/figma-sync.md ("Logo").
 */
export type LogoProps = React.ComponentPropsWithoutRef<'svg'>;

export const Logo = React.forwardRef<SVGSVGElement, LogoProps>(function Logo(
  { className, 'aria-label': ariaLabel = 'CAF', 'aria-hidden': ariaHidden, ...props },
  ref,
) {
  const hidden = ariaHidden === true || ariaHidden === 'true';
  return (
    <svg
      ref={ref}
      viewBox="0 0 123 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={hidden ? undefined : 'img'}
      aria-label={hidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden}
      focusable="false"
      className={cn('h-12 w-auto shrink-0', className)}
      {...props}
    >
      {/* Logo Mark / Part 1 */}
      <path
        data-part="mark-1"
        className="fill-caf-blue-600"
        d="M15.5957 18.4092C12.0012 18.224 8.46226 19.352 5.64101 21.5819C5.45951 21.7288 5.30951 21.9107 5.19994 22.1167C5.09036 22.3227 5.02346 22.5485 5.0032 22.7809C4.98295 23.0132 5.00976 23.2472 5.08204 23.469C5.15432 23.6907 5.2706 23.8957 5.42394 24.0717L7.69832 26.7202C8.01039 27.073 8.44234 27.298 8.91085 27.3517C9.37935 27.4054 9.85121 27.2842 10.2354 27.0113C11.7755 25.8638 13.6896 25.3316 15.6026 25.5188C19.1407 25.8498 22.3511 29.1605 22.5737 32.6918C22.6386 33.7229 22.4953 34.7565 22.1523 35.7314C21.8092 36.7062 21.2735 37.6024 20.5768 38.3668C19.8802 39.1311 19.0367 39.7482 18.0966 40.1812C17.1564 40.6143 16.1386 40.8546 15.1036 40.8878C14.0686 40.9211 13.0375 40.7466 12.0713 40.3748C11.1052 40.003 10.2237 39.4414 9.47916 38.7234C8.73462 38.0053 8.1422 37.1454 7.73702 36.1946C7.33183 35.2438 7.12215 34.2215 7.12039 33.1884V33.067C7.11776 32.7518 6.99343 32.4497 6.77325 32.2236C6.55308 31.9975 6.25401 31.8648 5.93826 31.8531L1.3826 31.7276C1.20325 31.722 1.02462 31.7525 0.857271 31.817C0.689924 31.8816 0.537269 31.9791 0.408345 32.1036C0.279422 32.2281 0.176853 32.3771 0.106712 32.5419C0.0365703 32.7067 0.000284118 32.8838 0 33.0629V33.1884C0.00476695 37.1187 1.57423 40.8861 4.36313 43.6619C5.74405 45.0363 7.38279 46.1259 9.18578 46.8685C10.9888 47.611 12.9207 47.992 14.8712 47.9897C16.8218 47.9873 18.7528 47.6017 20.554 46.8548C22.3552 46.1078 23.9912 45.0143 25.3688 43.6365C26.7464 42.2588 27.8385 40.6238 28.5828 38.8249C29.3271 37.0261 29.7089 35.0986 29.7065 33.1525C29.6817 25.3367 23.4323 18.7885 15.5957 18.4092Z"
      />
      {/* Logo Mark / Part 2 */}
      <path
        data-part="mark-2"
        className="fill-caf-blue-300"
        d="M29.8048 25.8415V5.67425C29.8054 5.38835 29.7494 5.10514 29.6402 4.84082C29.5309 4.57651 29.3705 4.33627 29.1682 4.13385C28.9658 3.93143 28.7254 3.77079 28.4608 3.66113C28.1961 3.55147 27.9124 3.49493 27.6258 3.49475H25.6722C25.3869 3.49453 25.1052 3.55764 24.8474 3.6795C24.5896 3.80136 24.3621 3.97892 24.1816 4.19931C24.0011 4.41971 23.872 4.67741 23.8036 4.95374C23.7352 5.23008 23.7293 5.51813 23.7864 5.79702L26.9663 21.5749L29.8048 25.8415Z"
      />
      {/* Logo Mark / Part 3 */}
      <path
        data-part="mark-3"
        className="fill-caf-blue-400"
        d="M25.9488 20.8355L20.6423 3.02849C20.4771 2.4708 20.1355 1.98139 19.6685 1.63333C19.2015 1.28528 18.6342 1.09724 18.0514 1.09729H15.8157C15.4841 1.0971 15.158 1.1819 14.8687 1.34357C14.5794 1.50524 14.3365 1.73835 14.1635 2.02055C13.9904 2.30276 13.8929 2.62459 13.8803 2.95519C13.8677 3.28579 13.9405 3.61408 14.0916 3.90857L20.9963 17.4463C20.9963 17.4463 24.0905 18.6767 25.9488 20.8355Z"
      />
      {/* Logo Mark / Part 4 */}
      <path
        data-part="mark-4"
        className="fill-caf-blue-600"
        d="M19.7587 17.158L10.1469 1.56351C9.79058 0.985667 9.26368 0.532077 8.63857 0.265069C8.01346 -0.00193933 7.32081 -0.0692616 6.6558 0.0723514L5.00498 0.424106C4.63453 0.502664 4.2888 0.669934 3.99758 0.911495C3.70636 1.15306 3.4784 1.46166 3.33334 1.8107C3.18829 2.15974 3.1305 2.53874 3.16496 2.91502C3.19941 3.2913 3.32508 3.65358 3.53112 3.97062L11.7147 16.5483C11.7147 16.5483 16.0464 16.2324 19.7587 17.158Z"
      />
      {/* Wordmark: Figma's outline of "CAF" (Work Sans Medium 40), text/primary. */}
      <path
        data-part="wordmark"
        className="fill-text-primary"
        d="M69.8 31C69.2667 32.6 68.4667 33.96 67.4 35.08C66.3333 36.1733 65.08 37 63.64 37.56C62.2 38.12 60.6133 38.4 58.88 38.4C56.3467 38.4 54.1467 37.8533 52.28 36.76C50.4133 35.6667 48.9733 34.1067 47.96 32.08C46.9467 30.0533 46.44 27.6267 46.44 24.8C46.44 21.9733 46.9467 19.5467 47.96 17.52C48.9733 15.4933 50.4133 13.9333 52.28 12.84C54.1467 11.7467 56.3333 11.2 58.84 11.2C60.5733 11.2 62.1333 11.44 63.52 11.92C64.9333 12.4 66.1333 13.12 67.12 14.08C68.1067 15.04 68.8667 16.24 69.4 17.68L65.36 19.48C64.8267 17.9067 64.0533 16.76 63.04 16.04C62.0267 15.2933 60.7067 14.92 59.08 14.92C57.4533 14.92 56.0267 15.3067 54.8 16.08C53.5733 16.8533 52.6133 17.9733 51.92 19.44C51.2533 20.9067 50.92 22.6933 50.92 24.8C50.92 26.88 51.24 28.6667 51.88 30.16C52.52 31.6267 53.44 32.7467 54.64 33.52C55.84 34.2933 57.28 34.68 58.96 34.68C60.5867 34.68 61.9867 34.2667 63.16 33.44C64.36 32.5867 65.2133 31.32 65.72 29.64L69.8 31ZM97.1838 38H92.6638L90.1438 31.08H79.0638L76.5438 38H72.1438L82.1038 11.6H87.2238L97.1838 38ZM80.2638 27.6H88.9438L84.6238 15.28L80.2638 27.6ZM120.945 15.28H106.145V22.96H117.745V26.64H106.145V38H101.865V11.6H120.945V15.28Z"
      />
    </svg>
  );
});
Logo.displayName = 'Logo';
