import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Icon } from '../icon';
import { Button, BUTTON_SIZES, BUTTON_VARIANTS } from './Button';

const icon = <Icon name="add" />;

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'The new CAF design’s buttons: a pill, one primary action per area. ' +
          '`variant`: `default` (Primary), `outlined` (Secondary), `text` (Ghost), `destructive` (Danger), ' +
          '`text-destructive` (Ghost danger), and `tonal` (brand tint) and `success`, which the new design doesn’t draw. ' +
          '`size`: `normal` (40px, default), `small` (32px) and `big` (48px); `block` fills the width. ' +
          'Hover, Pressed and Focus are the element’s own states. `disabled` and `aria-disabled` share one grey look; ' +
          '`aria-disabled` keeps the button focusable and ignores clicks. `busy` shows a spinner and `busyLabel` and ignores clicks. ' +
          '`leftIcon` / `rightIcon` take the colour and size of the button. ' +
          'A Button that navigates takes `href` and renders an `<a href>` with the same look.',
      },
    },
  },
  args: { children: 'Label', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: BUTTON_VARIANTS },
    size: { control: 'radio', options: BUTTON_SIZES },
    disabled: { control: 'boolean' },
    busy: { control: 'boolean' },
    block: { control: 'boolean' },
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

export const Default: Story = { name: 'Default (Primary)', args: { variant: 'default', leftIcon: icon, children: 'New cost' } };
export const Outlined: Story = { name: 'Outlined (Secondary)', args: { variant: 'outlined', children: 'Preview' } };
export const Text: Story = { name: 'Text (Ghost)', args: { variant: 'text', children: 'Cancel' } };
export const Destructive: Story = { name: 'Destructive (Danger)', args: { variant: 'destructive', children: 'Delete' } };
export const TextDestructive: Story = {
  name: 'Text destructive (Ghost danger)',
  args: { variant: 'text-destructive', children: 'Remove line' },
};
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

/** `block`: the full width of its container, as on sign-in and mobile sheets. Use it with `big`. */
export const Block: Story = {
  args: { block: true, size: 'big', children: 'Sign in' },
  render: (args) => (
    <div className="w-80">
      <Button {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Sign in' });
    await expect(button.getBoundingClientRect().width).toBe(button.parentElement!.getBoundingClientRect().width);
  },
};

/**
 * `busy`: the action is running. A spinner and `busyLabel` replace the icon and label, `aria-busy`
 * is set, and a second click is ignored. Click Save changes: it's busy for two seconds.
 */
export const Busy: Story = {
  args: { busy: true, busyLabel: 'Saving…', children: 'Save changes', leftIcon: icon },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Saving…' });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

function BusyDemo() {
  const [busy, setBusy] = React.useState(false);
  const [saves, setSaves] = React.useState(0);
  return (
    <div className="flex items-center gap-4">
      <Button
        busy={busy}
        busyLabel="Saving…"
        onClick={() => {
          setSaves((n) => n + 1);
          setBusy(true);
          setTimeout(() => setBusy(false), 2000);
        }}
      >
        Save changes
      </Button>
      <span className="text-body-md-regular text-text-secondary">Saved {saves} times</span>
    </div>
  );
}

/** Busy in use: the first click saves, a second click while it's saving is ignored. */
export const BusyInUse: Story = {
  name: 'Busy, in use',
  render: () => <BusyDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }));
    const busy = canvas.getByRole('button', { name: 'Saving…' });
    await userEvent.click(busy);
    await expect(canvas.getByText('Saved 1 times')).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Save changes' })).toBeVisible(), { timeout: 3000 });
  },
};

/**
 * `aria-disabled`: the disabled look, but the button stays in the tab order (so a tooltip can say
 * why), and its clicks are ignored.
 */
export const AriaDisabled: Story = {
  name: 'Aria-disabled',
  args: { 'aria-disabled': true, children: 'Export' },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Export' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.click(button);
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).not.toHaveBeenCalled();
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
   A row per Style, without and
   with the icon, and a column per State. Hover, Pressed and Focus are forced
   with storybook-addon-pseudo-states, so Chromatic snapshots them too, and
   every cell is checked against the tokens for that Style and State. */

const STATES = ['default', 'hover', 'pressed', 'disabled', 'aria-disabled', 'focus'] as const;
type State = (typeof STATES)[number];
type Variant = (typeof BUTTON_VARIANTS)[number];
type Size = (typeof BUTTON_SIZES)[number];
const STATE_LABEL: Record<State, string> = {
  default: 'Default',
  hover: 'Hover',
  pressed: 'Pressed',
  disabled: 'Disabled',
  'aria-disabled': 'Aria-disabled',
  focus: 'Focus',
};
const STYLE_LABEL: Record<Variant, string> = {
  default: 'Default',
  outlined: 'Outlined',
  text: 'Text',
  'text-destructive': 'Text destructive',
  destructive: 'Destructive',
  tonal: 'Tonal',
  success: 'Success',
};
const SIZE_LABEL: Record<Size, string> = { big: 'Big', normal: 'Normal', small: 'Small' };

/* The tokens per Style and State: [fill, label and icon, 1px inside stroke]. Disabled and
   Aria-disabled share one look for every Style; Focus is the Default look plus the ring. */
type Look = readonly [fill: string, label: string, stroke?: string];
type Bound = Record<'default' | 'hover' | 'pressed', Look>;
const filled = (accent: string): Bound => ({
  default: [`${accent}-surface-default`, `${accent}-content-default`],
  hover: [`${accent}-surface-hover`, `${accent}-content-hover`],
  pressed: [`${accent}-surface-pressed`, `${accent}-content-pressed`],
});
const BOUND: Record<Variant, Bound> = {
  default: filled('action-primary'),
  outlined: {
    default: ['surface-base', 'text-primary', 'stroke-default'],
    hover: ['surface-base', 'text-primary', 'stroke-strong'],
    pressed: ['surface-neutral-faint', 'text-primary', 'stroke-strong'],
  },
  text: {
    default: ['action-tertiary-surface-default', 'text-primary'],
    hover: ['action-secondary-surface-hover', 'text-primary'],
    pressed: ['action-secondary-surface-pressed', 'text-primary'],
  },
  'text-destructive': {
    default: ['action-tertiary-surface-default', 'accent-critical-tonal-content-default'],
    hover: ['accent-critical-tonal-surface-default', 'accent-critical-tonal-content-hover'],
    pressed: ['accent-critical-tonal-surface-hover', 'accent-critical-tonal-content-hover'],
  },
  destructive: filled('accent-critical-filled'),
  tonal: {
    default: ['surface-brand-faint', 'text-brand-strong'],
    hover: ['surface-brand-subtle', 'text-brand-strong'],
    pressed: ['surface-brand-medium', 'text-brand-stronger'],
  },
  success: filled('accent-success-filled'),
};
const OFF: Look = ['surface-neutral-faint', 'neutral-outline-content-default', 'stroke-subtle'];

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
                  aria-disabled={state === 'aria-disabled' || undefined}
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

/* Per size: every Style. axe checks every cell, contrast included. With `asLink`,
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
  // Every cell is checked against the tokens for its Style and State.
  // This is in afterEach, not play: pseudo-states rewrites the :hover /
  // :active / :focus-visible CSS on STORY_RENDERED, which Storybook emits only
  // after play has finished. So in a fresh static build (Chromatic) a play
  // function could never see the forced states. afterEach runs after that
  // event, as axe does; a failure here still fails the story.
  afterEach: async ({ canvasElement }) => {
    const measure = (look: Look) => look.map((token) => token && tokenColour(token));
    const want = Object.fromEntries(
      BUTTON_VARIANTS.map((variant) => [
        variant,
        {
          ...Object.fromEntries(Object.entries(BOUND[variant]).map(([state, look]) => [state, measure(look)])),
          disabled: measure(OFF),
          'aria-disabled': measure(OFF),
        },
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
          // Focus: a 2px stroke.focused ring, 2px outside the button.
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
