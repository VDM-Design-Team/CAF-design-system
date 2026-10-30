import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Logo } from './Logo';

const meta = {
  title: 'Components/Logo',
  component: Logo,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation** (`Navigation / Logo`): the CAF mark and wordmark at the ' +
          'left of the Top Bar and the Mobile Header. An `<svg role="img">` named “CAF”. The mark’s raw brand colours are ' +
          'the nearest steps of CAF’s brand ramp (`caf-blue` 600 / 300 / 400), the same in Light and Dark, as in Figma; ' +
          'the wordmark is `text/primary`, so it follows the theme. It is 48 high (`h-12`); set another height with ' +
          '`className` (`h-9` in the Mobile Header) and the width follows.',
      },
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One image named “CAF”, 123 × 48 as in Figma. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const logo = canvas.getByRole('img', { name: 'CAF' });
    const box = logo.getBoundingClientRect();
    await expect(box.height).toBe(48);
    await expect(box.width).toBe(123);
  },
};

/** As the home link at the left of the Top Bar: the link is named by the logo, “CAF”. */
export const HomeLink: Story = {
  render: () => (
    <a
      href="#home"
      className="inline-flex rounded-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused"
    >
      <Logo />
    </a>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'CAF' })).toHaveAttribute('href', '#home');
  },
};

/** `aria-hidden` when its container is already named, here a link labelled “Home”: no image in the accessibility tree. */
export const Decorative: Story = {
  render: () => (
    <a
      href="#home"
      aria-label="Home"
      className="inline-flex rounded-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focused"
    >
      <Logo aria-hidden className="h-9" />
    </a>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.queryByRole('img')).toBeNull();
    await expect(canvas.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    const svg = canvasElement.querySelector('svg')!;
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
    await expect(svg).not.toHaveAttribute('aria-label');
  },
};

/* ── Light and Dark ────────────────────────────────────────────────────────
   Figma's one Logo, at its two sizes: 48 high (Top Bar) and 36 high (the
   Mobile Header's instance). Each part is checked against the token it maps
   to: the mark keeps its brand colours in both themes, the wordmark is
   text.primary. */

const PARTS = [
  { part: 'mark-1', token: 'caf-blue-600' },
  { part: 'mark-2', token: 'caf-blue-300' },
  { part: 'mark-3', token: 'caf-blue-400' },
  { part: 'mark-4', token: 'caf-blue-600' },
  { part: 'wordmark', token: 'text-primary' },
] as const;

/* A token's computed colour in the current theme. Measure before waitFor, never inside it:
   the probe is a DOM mutation, and waitFor reruns its callback on every mutation. */
function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

const SIZES = [
  { name: 'Top Bar, 123 × 48', className: undefined, width: 123, height: 48 },
  { name: 'Mobile Header, 92 × 36', className: 'h-9', width: 92.25, height: 36 },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Look — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex items-end gap-12">
      {SIZES.map(({ name, className }) => (
        <div key={name} className="flex flex-col items-start gap-2">
          <span className="text-caption-md-medium text-text-secondary">{name}</span>
          <Logo className={className} data-size={name} aria-label={`CAF, ${name}`} />
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = PARTS.map(({ part, token }) => ({ part, colour: tokenColour(token) }));
    await waitFor(() => {
      for (const { name, width, height } of SIZES) {
        const logo = canvasElement.querySelector<SVGSVGElement>(`[data-size="${name}"]`)!;
        const box = logo.getBoundingClientRect();
        expect(box.height).toBe(height);
        expect(box.width).toBeCloseTo(width, 1);
        for (const { part, colour } of want) {
          expect(getComputedStyle(logo.querySelector(`[data-part="${part}"]`)!).fill).toBe(colour);
        }
      }
    });
  },
});

export const LookLight = grid('light');
export const LookDark = grid('dark');
