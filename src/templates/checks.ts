import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

/**
 * What the template stories check, shared: the page frame (landmarks and
 * heading order), the order of a page's parts, and moving between pages.
 * Templates check layout and structure; the patterns' stories check their
 * flows.
 */

/* Storybook's own "Small mobile" viewport (320 × 568). Chromatic ignores the
   global, so the mobile stories also set chromatic.viewports (CLAUDE.md). */
export const MOBILE_VIEWPORT = { value: 'mobile1', isRotated: false } as const;
export const MOBILE_SNAPSHOT = { viewports: [320] };

/* Tailwind's md:, where the header swaps the Mobile Header for the Nav Bar.
   Vitest and test:static's channel pass render at other widths than the
   story asks for, so the plays follow the width they get. */
export const isDesktop = () => window.matchMedia('(min-width: 48rem)').matches;

/** The `<body>` child the story renders in: the node an open overlay makes inert. */
export function bodyChildOf(element: HTMLElement): HTMLElement {
  let node = element;
  while (node.parentElement && node.parentElement !== document.body) node = node.parentElement;
  return node;
}

/** The levels of the headings shown under `root`, in document order (display: none ones left out). */
export function headingLevels(root: ParentNode): number[] {
  return Array.from(root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]'))
    .filter((heading) => heading.getClientRects().length > 0)
    .map((heading) => Number(heading.getAttribute('aria-level') ?? heading.tagName.slice(1)));
}

/**
 * The frame every template shares: one banner with the app's navigation (the
 * Nav Bar from 768px, ☰ below), one main, one h1 in main naming the page,
 * and headings in main that start at 1 and never skip a level. The queries
 * include the inaccessible tree, so they also work behind an open overlay
 * (which makes the page inert).
 */
export async function expectFrame(canvasElement: HTMLElement, title: string) {
  const canvas = within(canvasElement);
  const banners = canvas.getAllByRole('banner', { hidden: true });
  await expect(banners).toHaveLength(1);
  const mains = canvas.getAllByRole('main', { hidden: true });
  await expect(mains).toHaveLength(1);
  const [banner] = banners;
  const [main] = mains;

  if (isDesktop()) {
    await expect(within(banner).getByRole('navigation', { name: 'Main', hidden: true })).toBeVisible();
  } else {
    await expect(within(banner).getByRole('button', { name: 'Open menu', hidden: true })).toBeVisible();
  }

  const h1s = canvas.getAllByRole('heading', { level: 1, hidden: true });
  await expect(h1s).toHaveLength(1);
  await expect(main).toContainElement(h1s[0]);
  await expect(h1s[0]).toHaveTextContent(title);
  await expect(h1s[0]).toBeVisible();

  const levels = headingLevels(main);
  await expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i += 1) await expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);

  return { banner, main, heading: h1s[0] };
}

/** The parts of a page appear top to bottom in this order. */
export async function expectInOrder(parts: HTMLElement[]) {
  const tops = parts.map((part) => part.getBoundingClientRect().top);
  await expect(tops).toEqual([...tops].sort((a, b) => a - b));
}

/** Nothing scrolls sideways: the page fits the screen. */
export async function expectNoSidewaysScroll() {
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
}

/**
 * Moves to another page the way the width allows: a Nav Bar link from 768px,
 * the Mobile Menu below (☰, then the link; the menu closes).
 */
export async function navigateTo(canvasElement: HTMLElement, label: string) {
  const banner = within(canvasElement).getByRole('banner');
  if (isDesktop()) {
    const nav = within(banner).getByRole('navigation', { name: 'Main' });
    await userEvent.click(within(nav).getByRole('link', { name: label }));
    return;
  }
  await userEvent.click(within(banner).getByRole('button', { name: 'Open menu' }));
  const menu = await screen.findByRole('dialog', { name: 'Menu' });
  await userEvent.click(within(menu).getByRole('link', { name: label }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
}
