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
          'Hover, Pressed and Disabled are the element’s own states. ' +
          '`leftIcon` / `rightIcon` are Show Icons; the icon takes the colour and size of the button.',
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
   with the icon, and a column per State. Hover and Pressed are forced with
   storybook-addon-pseudo-states, so Chromatic snapshots them too. */

const STATES = ['default', 'hover', 'pressed', 'disabled'] as const;
type State = (typeof STATES)[number];
type Variant = (typeof BUTTON_VARIANTS)[number];
type Size = (typeof BUTTON_SIZES)[number];
const STATE_LABEL: Record<State, string> = { default: 'Default', hover: 'Hover', pressed: 'Pressed', disabled: 'Disabled' };
const STYLE_LABEL: Record<Variant, string> = {
  default: 'Default',
  outlined: 'Outlined',
  text: 'Text',
  destructive: 'Destructive',
  tonal: 'Tonal',
  success: 'Success',
};
const SIZE_LABEL: Record<Size, string> = { big: 'Big', normal: 'Normal', small: 'Small' };

/* Tonal's label (action.primary.surface.default) on its surface.brand fills
   is below WCAG AA: Light Hover 3.98, Pressed 2.48; Dark Default 3.59,
   Hover 2.79, Pressed 1.77. It's a Figma binding, tracked in
   docs/figma-sync.md ("Button"). Until it's fixed, axe's contrast rule skips
   cells marked like this in the per-size grids, and reports them in the
   Tonal grids below without failing the run. */
const CONTRAST_TODO: ReadonlySet<Variant> = new Set(['tonal']);

type Row = { label: string; variant: Variant; size: Size; withIcon: boolean };

function Matrix({ rows, rowHeader }: { rows: Row[]; rowHeader: string }) {
  return (
    // No colour transition here: the forced states must be settled before
    // axe and Chromatic look at them.
    <table className="border-separate border-spacing-4 text-left [&_button]:transition-none">
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
                  data-pseudo={state}
                  data-a11y-todo={CONTRAST_TODO.has(variant) ? 'contrast' : undefined}
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

const grid = (name: string, rowHeader: string, rows: Row[], theme: 'light' | 'dark', a11y: object): Story => ({
  name: `${name} — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => <Matrix rows={rows} rowHeader={rowHeader} />,
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'], active: ['[data-pseudo="pressed"]'] },
    a11y,
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // pseudo-states forces Hover and Pressed just after the first render. Wait
  // for it, so this also proves every Style has its own Hover and Pressed look
  // and axe (which runs after play) judges the forced states, not Default.
  play: async ({ canvasElement }) => {
    const look = (el: Element) => {
      const cs = getComputedStyle(el);
      return `${cs.backgroundColor} ${cs.color} ${cs.boxShadow}`;
    };
    await waitFor(() => {
      for (const row of canvasElement.querySelectorAll('tbody tr')) {
        const [rest, hover, pressed] = row.querySelectorAll('button');
        expect(look(hover)).not.toBe(look(rest));
        expect(look(pressed)).not.toBe(look(hover));
      }
    });
  },
});

/* Per size: every Style, as in Figma. axe fails the run on any violation;
   only the contrast check skips the Tonal cells (CONTRAST_TODO). */
const sizeGrid = (size: Size, theme: 'light' | 'dark') =>
  grid(
    SIZE_LABEL[size],
    'Style',
    BUTTON_VARIANTS.flatMap((v) => withAndWithoutIcon(STYLE_LABEL[v], v, size)),
    theme,
    {
      test: 'error',
      config: { rules: [{ id: 'color-contrast', selector: '*:not([data-a11y-todo~="contrast"])' }] },
    },
  );

export const BigLight = sizeGrid('big', 'light');
export const BigDark = sizeGrid('big', 'dark');
export const NormalLight = sizeGrid('normal', 'light');
export const NormalDark = sizeGrid('normal', 'dark');
export const SmallLight = sizeGrid('small', 'light');
export const SmallDark = sizeGrid('small', 'dark');

/* Tonal in every size: its contrast is reported in the a11y panel, not
   failed, until the Figma binding is fixed (see CONTRAST_TODO). */
const tonalGrid = (theme: 'light' | 'dark') =>
  grid(
    'Tonal contrast',
    'Size',
    BUTTON_SIZES.flatMap((size) => withAndWithoutIcon(SIZE_LABEL[size], 'tonal', size)),
    theme,
    { test: 'todo' },
  );

export const TonalContrastLight = tonalGrid('light');
export const TonalContrastDark = tonalGrid('dark');
