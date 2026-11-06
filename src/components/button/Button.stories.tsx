import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from '@phosphor-icons/react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Button, BUTTON_SIZES, BUTTON_VARIANTS } from './Button';

/* The Figma components use Phosphor's Plus (Regular). */
const icon = <Plus />;

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Buttons** (`Button / Big`, `Button / Normal`, `Button / Small`). ' +
          '`variant` is Figma’s **Style**: `default` (primary), `outlined`, `text`, `destructive`, ' +
          '`tonal` (brand tint, e.g. View Changes) and `success` (e.g. Download). ' +
          '`size` is the component set: `big` (48px), `normal` (36px) and `small` (32px). ' +
          'Hover, Pressed, Focus and Disabled are the element’s own states. ' +
          '`leftIcon` / `rightIcon` are Show Icons; the icon takes the colour and size of the button. ' +
          'A Button that navigates takes `href` and renders an `<a href>` with the same look (code only).',
      },
    },
  },
  args: { children: 'Label', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: BUTTON_VARIANTS },
    size: { control: 'radio', options: BUTTON_SIZES },
    disabled: { control: 'boolean' },
    leftIcon: { control: false },
    rightIcon: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Label' }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Default: Story = { args: { variant: 'default', leftIcon: icon } };
export const Outlined: Story = { args: { variant: 'outlined', leftIcon: icon } };
export const Text: Story = { args: { variant: 'text', leftIcon: icon } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete' } };
export const Tonal: Story = { args: { variant: 'tonal', children: 'View Changes' } };
export const Success: Story = { args: { variant: 'success', children: 'Download' } };

export const WithRightIcon: Story = { args: { rightIcon: icon } };

/**
 * `href`: a Button that navigates, such as pattern 11's "Go back home" (528:6013), is an `<a href>`
 * with the same look (Button / Normal's description; code only). With `disabled` it stays a
 * disabled `<button>`, since a link can't be disabled.
 */
export const AsLink: Story = {
  name: 'As a link (href)',
  args: { href: '#costs', children: 'Go back home' },
  render: (args) => (
    <div className="flex items-center gap-4">
      {/* The story stands in for the router: the click doesn't leave the page. */}
      <Button
        {...args}
        onClick={(event) => {
          event.preventDefault();
          args.onClick?.(event);
        }}
      />
      <Button {...args} variant="outlined" disabled>
        Disabled
      </Button>
      {/* The same Button without href, to compare the look. */}
      <Button variant={args.variant} size={args.size}>
        As a button
      </Button>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const link = canvas.getByRole('link', { name: 'Go back home' });
    await expect(link.tagName).toBe('A');
    await expect(link).toHaveAttribute('href', '#costs');
    await expect(link).not.toHaveAttribute('type');
    // The same classes as the button.
    await expect(link.className).toBe(canvas.getByRole('button', { name: 'As a button' }).className);
    await userEvent.click(link);
    await expect(args.onClick).toHaveBeenCalledOnce();
    // Disabled: a disabled <button>, not a link.
    const disabled = canvas.getByRole('button', { name: 'Disabled' });
    await expect(disabled).toBeDisabled();
    await expect(disabled).not.toHaveAttribute('href');
  },
};

/** A disabled button ignores clicks. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Label' });
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/* ── Every Style × State, per size, in Light and Dark ─────────────────────
   The same grid as the Figma component sets: a row per Style, without and
   with the icon, and a column per State. Hover, Pressed and Focus are forced
   with storybook-addon-pseudo-states, so Chromatic snapshots them too, and
   every cell is checked against the variables Figma binds in that state. */

const STATES = ['default', 'hover', 'pressed', 'disabled', 'focus'] as const;
type State = (typeof STATES)[number];
type Variant = (typeof BUTTON_VARIANTS)[number];
type Size = (typeof BUTTON_SIZES)[number];
const STATE_LABEL: Record<State, string> = {
  default: 'Default',
  hover: 'Hover',
  pressed: 'Pressed',
  disabled: 'Disabled',
  focus: 'Focus',
};
const STYLE_LABEL: Record<Variant, string> = {
  default: 'Default',
  outlined: 'Outlined',
  text: 'Text',
  destructive: 'Destructive',
  tonal: 'Tonal',
  success: 'Success',
};
const SIZE_LABEL: Record<Size, string> = { big: 'Big', normal: 'Normal', small: 'Small' };

/* Figma's bindings per Style and State: [fill, label and icon, 1px inside stroke].
   Focus is the Default look plus the ring. */
type Look = readonly [fill: string, label: string, stroke?: string];
const filled = (accent: string): Record<Exclude<State, 'focus'>, Look> => ({
  default: [`${accent}-surface-default`, `${accent}-content-default`],
  hover: [`${accent}-surface-hover`, `${accent}-content-hover`],
  pressed: [`${accent}-surface-pressed`, `${accent}-content-pressed`],
  disabled: [`${accent}-surface-disabled`, `${accent}-content-disabled`],
});
const BOUND: Record<Variant, Record<Exclude<State, 'focus'>, Look>> = {
  default: {
    ...filled('action-primary'),
    disabled: ['neutral-tonal-surface-disabled', 'neutral-tonal-content-disabled'],
  },
  outlined: {
    default: ['action-secondary-surface-default', 'action-secondary-content-default', 'action-secondary-border-default'],
    hover: ['action-secondary-surface-hover', 'action-secondary-content-hover', 'action-secondary-border-hover'],
    pressed: ['action-secondary-surface-pressed', 'action-secondary-content-pressed', 'action-secondary-border-pressed'],
    disabled: ['action-secondary-surface-disabled', 'neutral-outline-content-disabled', 'neutral-outline-border-disabled'],
  },
  text: {
    ...filled('action-tertiary'),
    disabled: ['action-tertiary-surface-disabled', 'neutral-outline-content-disabled'],
  },
  destructive: filled('accent-critical-filled'),
  tonal: {
    default: ['surface-brand-faint', 'text-brand-strong'],
    hover: ['surface-brand-subtle', 'text-brand-strong'],
    pressed: ['surface-brand-medium', 'text-brand-stronger'],
    disabled: ['neutral-tonal-surface-disabled', 'neutral-tonal-content-disabled'],
  },
  success: filled('accent-success-filled'),
};
/* Hover lifts every filled Style (not Outlined or Text) with elevation 2. */
const LIFTS: ReadonlySet<Variant> = new Set(['default', 'destructive', 'tonal', 'success']);

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

type Row = { label: string; variant: Variant; size: Size; withIcon: boolean };

function Matrix({ rows, rowHeader, asLink = false }: { rows: Row[]; rowHeader: string; asLink?: boolean }) {
  return (
    // No colour transition here: the forced states must be settled before
    // axe and Chromatic look at them. No pointer either: the checks read each
    // cell's own state, so a stray pointer mustn't hover one.
    <table className="pointer-events-none border-separate border-spacing-4 text-left [&_a]:transition-none [&_button]:transition-none">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            {rowHeader}
          </th>
          {STATES.map((s) => (
            <th key={s} scope="col" className="text-caption-md-medium text-text-secondary">
              {STATE_LABEL[s]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ label, variant, size, withIcon }) => (
          <tr key={label}>
            <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
              {label}
            </th>
            {STATES.map((state) => (
              <td key={state}>
                <Button
                  variant={variant}
                  size={size}
                  leftIcon={withIcon ? icon : undefined}
                  disabled={state === 'disabled'}
                  // A link (href): the Disabled cell stays a disabled <button>.
                  href={asLink ? '#' : undefined}
                  data-variant={variant}
                  data-pseudo={state}
                >
                  Label
                </Button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const withAndWithoutIcon = (label: string, variant: Variant, size: Size): Row[] => [
  { label, variant, size, withIcon: false },
  { label: `${label} · icon`, variant, size, withIcon: true },
];

/* Per size: every Style, as in Figma. axe checks every cell, contrast included. With `asLink`,
   every cell but Disabled is an <a href> (Button `href`), and must look the same. */
const sizeGrid = (size: Size, theme: 'light' | 'dark', asLink = false): Story => ({
  name: `${asLink ? 'As a link, ' : ''}${SIZE_LABEL[size]} — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <Matrix
      rows={BUTTON_VARIANTS.flatMap((v) => withAndWithoutIcon(STYLE_LABEL[v], v, size))}
      rowHeader="Style"
      asLink={asLink}
    />
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: {
      rootSelector: 'body',
      hover: ['[data-pseudo="hover"]'],
      active: ['[data-pseudo="pressed"]'],
      focusVisible: ['[data-pseudo="focus"]'],
    },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Every cell is checked against Figma's bindings for its Style and State.
  // This is in afterEach, not play: pseudo-states rewrites the :hover /
  // :active / :focus-visible CSS on STORY_RENDERED, which Storybook emits only
  // after play has finished. So in a fresh static build (Chromatic) a play
  // function could never see the forced states. afterEach runs after that
  // event, as axe does; a failure here still fails the story.
  afterEach: async ({ canvasElement }) => {
    const want = Object.fromEntries(
      BUTTON_VARIANTS.map((variant) => [
        variant,
        Object.fromEntries(
          Object.entries(BOUND[variant]).map(([state, look]) => [state, look.map((token) => token && tokenColour(token))]),
        ),
      ]),
    ) as Record<Variant, Record<Exclude<State, 'focus'>, string[]>>;
    const ring = tokenColour('stroke-focused');
    await waitFor(
      () => {
        for (const button of canvasElement.querySelectorAll<HTMLElement>('[data-variant]')) {
          const variant = button.dataset.variant as Variant;
          const state = button.dataset.pseudo as State;
          expect(button.tagName).toBe(asLink && state !== 'disabled' ? 'A' : 'BUTTON');
          const [fill, label, stroke] = want[variant][state === 'focus' ? 'default' : state];
          const style = getComputedStyle(button);
          expect(style.backgroundColor).toBe(fill);
          expect(style.color).toBe(label);
          // The icon follows the label.
          const svg = button.querySelector('svg');
          if (svg) expect(getComputedStyle(svg).color).toBe(label);
          if (stroke) expect(style.boxShadow).toContain(`${stroke} 0px 0px 0px 1px inset`);
          if (state === 'hover' && LIFTS.has(variant)) expect(style.boxShadow).not.toBe('none');
          // Focus: Figma's Focus Ring, 2px stroke.focused, 2px outside the button.
          if (state === 'focus') {
            expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '2px']);
            expect(style.outlineColor).toBe(ring);
          } else {
            expect(style.outlineStyle).toBe('none');
          }
        }
      },
      { timeout: 3000 },
    );
  },
});

export const BigLight = sizeGrid('big', 'light');
export const BigDark = sizeGrid('big', 'dark');
export const NormalLight = sizeGrid('normal', 'light');
export const NormalDark = sizeGrid('normal', 'dark');
export const SmallLight = sizeGrid('small', 'light');
export const SmallDark = sizeGrid('small', 'dark');
export const LinkNormalLight = sizeGrid('normal', 'light', true);
export const LinkNormalDark = sizeGrid('normal', 'dark', true);
