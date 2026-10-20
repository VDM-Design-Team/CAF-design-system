import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from '@phosphor-icons/react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Button, BUTTON_SIZES, BUTTON_VARIANTS, type ButtonProps } from './Button';

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
const STATE_LABEL: Record<State, string> = { default: 'Default', hover: 'Hover', pressed: 'Pressed', disabled: 'Disabled' };
const STYLE_LABEL: Record<(typeof BUTTON_VARIANTS)[number], string> = {
  default: 'Default',
  outlined: 'Outlined',
  text: 'Text',
  destructive: 'Destructive',
  tonal: 'Tonal',
  success: 'Success',
};

function Matrix({ size }: { size: NonNullable<ButtonProps['size']> }) {
  return (
    // No colour transition here: the forced states must be settled before
    // axe and Chromatic look at them.
    <table className="border-separate border-spacing-4 text-left [&_button]:transition-none">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Style
          </th>
          {STATES.map((s) => (
            <th key={s} scope="col" className="text-caption-md-medium text-text-secondary">
              {STATE_LABEL[s]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {BUTTON_VARIANTS.flatMap((variant) =>
          [false, true].map((withIcon) => (
            <tr key={`${variant}-${withIcon}`}>
              <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
                {STYLE_LABEL[variant]}
                {withIcon ? ' · icon' : ''}
              </th>
              {STATES.map((state) => (
                <td key={state}>
                  <Button
                    variant={variant}
                    size={size}
                    leftIcon={withIcon ? icon : undefined}
                    disabled={state === 'disabled'}
                    data-pseudo={state}
                  >
                    Label
                  </Button>
                </td>
              ))}
            </tr>
          )),
        )}
      </tbody>
    </table>
  );
}

const matrix = (size: NonNullable<ButtonProps['size']>, theme: 'light' | 'dark'): Story => ({
  name: `${size[0].toUpperCase()}${size.slice(1)} — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => <Matrix size={size} />,
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"]'], active: ['[data-pseudo="pressed"]'] },
    /* The grid shows the tokens exactly as Figma binds them, including the
       pairs below WCAG AA (Tonal Hover/Pressed in Light; Default, Destructive,
       Success and Tonal labels in Dark). axe reports them in the a11y panel
       without failing the run: CAF's rule 8, contrast is reported until the
       Figma fixes land. Tracked in docs/figma-sync.md ("Button"). */
    a11y: { test: 'todo' },
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

export const BigLight = matrix('big', 'light');
export const BigDark = matrix('big', 'dark');
export const NormalLight = matrix('normal', 'light');
export const NormalDark = matrix('normal', 'dark');
export const SmallLight = matrix('small', 'light');
export const SmallDark = matrix('small', 'dark');
