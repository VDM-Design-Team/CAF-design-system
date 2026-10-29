import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Alert, ALERT_SIZES, ALERT_TYPES } from './Alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Feedback** (`Alert`): the inline banner that sits inside a page or ' +
          'dialog, above the content it relates to. `type` is Figma’s Type: `info` (default), `success`, `warning` or ' +
          '`error`; it sets the tonal colours and the icon. `size` is `default` (title over message) or `compact` (one ' +
          'line: the message). `title` and `message` are Title and Message; `showDismiss` is Show Dismiss, an ' +
          'IconButton that hides the alert and calls `onDismiss`. Error and Warning are `role="alert"`; Info and ' +
          'Success are `role="status"`. It fills its container’s width. For the result of an action, use a Toast.',
      },
    },
  },
  args: {
    title: 'Alert title',
    message: 'Supporting message for this alert.',
    onDismiss: fn(),
  },
  argTypes: {
    type: { control: 'select', options: ALERT_TYPES },
    size: { control: 'radio', options: ALERT_SIZES },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/* The alert fills its container; the single-alert stories give it a column as wide as Figma's. */
const column: Story['decorators'] = [
  (Story) => (
    <div className="w-96">
      <Story />
    </div>
  ),
];

export const Playground: Story = { decorators: column };

/** How the patterns use it: Add New User’s temporary-password note, and Audit Logs’ one-line note. */
export const OnTheScreens: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert
        title="Temporary password"
        message="A temporary password is emailed to the user. They’ll be asked to change it the first time they sign in."
      />
      <Alert type="error" size="compact" message="This cost was deleted" />
    </div>
  ),
  decorators: column,
  parameters: { controls: { disable: true } },
};

/** Show Dismiss: the X hides the alert and calls `onDismiss`. */
export const Dismiss: Story = {
  args: { type: 'success', title: 'Cost centre added', message: 'It’s now available on new costs.', showDismiss: true },
  decorators: column,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('status');
    await expect(alert).toHaveTextContent('Cost centre added');
    const dismiss = canvas.getByRole('button', { name: 'Dismiss' });
    await userEvent.click(dismiss);
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
  },
};

/** The dismiss button with the keyboard: Tab reaches it, Enter dismisses. */
export const DismissWithKeyboard: Story = {
  args: { type: 'warning', title: 'Unsaved changes', message: 'Save before you leave this page.', showDismiss: true },
  decorators: column,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Unsaved changes');
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Dismiss' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

/* ── Every Type × Size × Show Dismiss, in Light and Dark ───────────────────
   The Figma component set, with the dismiss button off, on, and hovered
   (forced with storybook-addon-pseudo-states). Each alert is checked against
   the variables its Figma layers are bound to. */

/* Figma's bindings per Type: [fill, 1px inside border, content (icon, title, message)]. */
const BOUND = {
  info: ['accent-info-tonal-surface-default', 'accent-info-outline-border-default', 'accent-info-tonal-content-default'],
  success: [
    'accent-success-tonal-surface-default',
    'accent-success-outline-border-default',
    'accent-success-tonal-content-default',
  ],
  warning: [
    'accent-warning-tonal-surface-default',
    'accent-warning-outline-border-default',
    'accent-warning-tonal-content-default',
  ],
  error: [
    'accent-critical-tonal-surface-default',
    'accent-critical-outline-border-default',
    'accent-critical-tonal-content-default',
  ],
} as const;

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

const COLUMNS = [
  { key: 'off', heading: 'Show Dismiss off' },
  { key: 'on', heading: 'Show Dismiss on' },
  { key: 'hover', heading: 'Dismiss, Hover' },
] as const;

const label = (s: string) => s[0].toUpperCase() + s.slice(1);

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Types and sizes — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    // No colour transition in the grid, so the check reads the end colour, not a frame of the fade.
    <table className="border-separate border-spacing-4 text-left [&_button]:transition-none">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Type, Size
          </th>
          {COLUMNS.map(({ key, heading }) => (
            <th key={key} scope="col" className="text-caption-md-medium text-text-secondary">
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ALERT_TYPES.flatMap((type) =>
          ALERT_SIZES.map((size) => (
            <tr key={`${type}-${size}`}>
              <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
                {label(type)}, {label(size)}
              </th>
              {COLUMNS.map(({ key }) => (
                <td key={key} className="w-80 align-top">
                  <Alert
                    type={type}
                    size={size}
                    title="Alert title"
                    message={size === 'compact' ? 'This cost was deleted' : 'Supporting message for this alert.'}
                    showDismiss={key !== 'off'}
                    data-type={type}
                    data-size={size}
                    data-pseudo={key === 'hover' ? 'hover' : undefined}
                  />
                </td>
              ))}
            </tr>
          )),
        )}
      </tbody>
    </table>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    // The forced Hover goes on the dismiss button inside the marked alert.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"] button'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const want = Object.fromEntries(
      Object.entries(BOUND).map(([type, tokens]) => [type, tokens.map(tokenColour)]),
    );
    const none = 'rgba(0, 0, 0, 0)';
    const glyph = tokenColour('text-secondary');
    const hover = tokenColour('neutral-tonal-surface-default');
    await waitFor(
      () => {
        const alerts = canvasElement.querySelectorAll<HTMLElement>('[data-type]');
        expect(alerts).toHaveLength(ALERT_TYPES.length * ALERT_SIZES.length * COLUMNS.length);
        for (const el of alerts) {
          const { type, size } = el.dataset as { type: keyof typeof BOUND; size: string };
          const [fill, border, content] = want[type];
          const style = getComputedStyle(el);
          expect(el).toHaveAttribute('role', type === 'error' || type === 'warning' ? 'alert' : 'status');
          expect(style.backgroundColor).toBe(fill);
          // The border is a 1px inside stroke: an inset ring.
          expect(style.boxShadow).toContain(`${border} 0px 0px 0px 1px inset`);
          expect(style.borderRadius).toBe('8px');
          expect(style.padding).toBe(size === 'compact' ? '12px' : '16px');
          const [icon] = el.querySelectorAll('svg');
          expect(getComputedStyle(icon).color).toBe(content);
          expect(icon.getBoundingClientRect().width).toBe(20);
          const texts = el.querySelectorAll('p');
          // Compact is one line: the message only.
          expect(texts).toHaveLength(size === 'compact' ? 1 : 2);
          for (const text of texts) expect(getComputedStyle(text).color).toBe(content);
          const dismiss = el.querySelector('button');
          if (dismiss) {
            expect(getComputedStyle(dismiss.querySelector('svg')!).color).toBe(glyph);
            expect(getComputedStyle(dismiss).backgroundColor).toBe(el.dataset.pseudo === 'hover' ? hover : none);
          }
        }
      },
      { timeout: 3000 },
    );
  },
});

export const TypesLight = grid('light');
export const TypesDark = grid('dark');
