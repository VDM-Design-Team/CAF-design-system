import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Toast, TOAST_TYPES } from './Toast';
import { TOAST_DURATION, ToastProvider, useToast, type ToastOptions } from './ToastProvider';

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Feedback** (`Toast`): the transient notification after Save, Upload ' +
          'or Export. `type` is Figma’s Type: `info` (default), `success`, `warning` or `error`; it sets the icon and its ' +
          'colour, on a neutral card. `message` is Message; `action` is Action (default “Undo”) and `showAction` is Show ' +
          'Action; `onAction` runs when it’s pressed. The X calls `onDismiss`.\n\n' +
          'Raise toasts with `useToast()` under one `ToastProvider` (code only, from pattern 12): they stack at the ' +
          'bottom right in an `aria-live="polite"` region named “Notifications”. Info and Success close after 5 seconds; ' +
          'Warning, Error and any toast with an action stay until dismissed. The timer pauses on hover and while focus is ' +
          'inside the toast.',
      },
    },
  },
  args: { message: 'Notification message.', onDismiss: fn(), onAction: fn() },
  argTypes: { type: { control: 'select', options: TOAST_TYPES } },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The X and the action call their handlers. */
export const Playground: Story = {
  args: { type: 'error', message: 'Upload failed. Check your connection and try again.', showAction: true, action: 'Retry' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(args.onAction).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};

/* ── Every Type × Show Action, and the X on hover, in Light and Dark ───────
   The Figma component set. Hover is forced on the X with
   storybook-addon-pseudo-states. Each toast is checked against the variables
   its Figma layers are bound to. */

/* Figma's icon binding per Type. The card, message, action and X are the same for every Type. */
const ICON_BOUND = {
  info: 'accent-info-tonal-content-default',
  success: 'accent-success-tonal-content-default',
  warning: 'accent-warning-tonal-content-default',
  error: 'accent-critical-tonal-content-default',
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
/* The box-shadow utility classes compose to (see Popover's stories): Tailwind inlines a theme
   shadow into its utility, so compare against the utilities, not the `--shadow-*` variable. */
function utilityShadow(className: string) {
  const probe = document.createElement('div');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).boxShadow;
  probe.remove();
  return value;
}

const COLUMNS = [
  { key: 'off', heading: 'Show Action off' },
  { key: 'on', heading: 'Show Action on' },
  { key: 'hover', heading: 'X, Hover' },
] as const;

const MESSAGE = {
  info: 'Export started. It will appear in Exports when it’s ready.',
  success: 'Cost saved.',
  warning: '3 rows were skipped because the currency is disabled.',
  error: 'Upload failed. Check your connection and try again.',
} as const;

const label = (s: string) => s[0].toUpperCase() + s.slice(1);

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Types — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    // No colour transition in the grid, so the check reads the end colour, not a frame of the fade.
    <table className="border-separate border-spacing-4 text-left [&_button]:transition-none">
      <thead>
        <tr>
          <th scope="col" className="text-caption-md-medium text-text-secondary">
            Type
          </th>
          {COLUMNS.map(({ key, heading }) => (
            <th key={key} scope="col" className="text-caption-md-medium text-text-secondary">
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {TOAST_TYPES.map((type) => (
          <tr key={type}>
            <th scope="row" className="pr-4 text-caption-md-medium text-text-secondary">
              {label(type)}
            </th>
            {COLUMNS.map(({ key }) => (
              <td key={key} className="align-top">
                <Toast
                  type={type}
                  message={MESSAGE[type]}
                  showAction={key === 'on'}
                  action={type === 'error' ? 'Retry' : 'Undo'}
                  data-type={type}
                  data-pseudo={key === 'hover' ? 'hover' : undefined}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    // The forced Hover goes on the X inside the marked toast.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"] [data-toast-dismiss]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const icon = Object.fromEntries(Object.entries(ICON_BOUND).map(([type, token]) => [type, tokenColour(token)]));
    const want = {
      fill: tokenColour('surface-base'),
      stroke: tokenColour('stroke-subtle'),
      shadow: utilityShadow('shadow-elevation-3 inset-ring inset-ring-stroke-subtle'),
      message: tokenColour('text-primary'),
      action: tokenColour('text-link-default'),
      glyph: tokenColour('text-secondary'),
      hover: tokenColour('neutral-tonal-surface-default'),
      none: 'rgba(0, 0, 0, 0)',
    };
    await waitFor(
      () => {
        const toasts = canvasElement.querySelectorAll<HTMLElement>('[data-type]');
        expect(toasts).toHaveLength(TOAST_TYPES.length * COLUMNS.length);
        for (const el of toasts) {
          const style = getComputedStyle(el);
          expect(style.backgroundColor).toBe(want.fill);
          // 1px inside stroke.subtle (an inset ring), with Elevation 3 and nothing else.
          expect(style.boxShadow).toContain(`${want.stroke} 0px 0px 0px 1px inset`);
          expect(style.boxShadow).toBe(want.shadow);
          expect(style.borderRadius).toBe('8px');
          expect(style.padding).toBe('12px 16px');
          const [glyph] = el.querySelectorAll('svg');
          expect(getComputedStyle(glyph).color).toBe(icon[el.dataset.type!]);
          expect(glyph.getBoundingClientRect().width).toBe(20);
          expect(getComputedStyle(el.querySelector('p')!).color).toBe(want.message);
          const action = el.querySelector('button:not([data-toast-dismiss])');
          if (action) expect(getComputedStyle(action).color).toBe(want.action);
          const dismiss = el.querySelector<HTMLElement>('[data-toast-dismiss]')!;
          expect(getComputedStyle(dismiss.querySelector('svg')!).color).toBe(want.glyph);
          expect(getComputedStyle(dismiss).backgroundColor).toBe(el.dataset.pseudo === 'hover' ? want.hover : want.none);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const TypesLight = grid('light');
export const TypesDark = grid('dark');

/* ── The host: ToastProvider and useToast ──────────────────────────────────
   Toasts are fixed to the viewport's bottom right, so these stories are kept
   off the docs page, where they'd cover the other stories. */

/** Raises `toasts` once, on mount, so the stack renders open (and Chromatic snapshots it). */
function RaiseOnMount({ toasts }: { toasts: ToastOptions[] }) {
  const { toast } = useToast();
  const raised = React.useRef(false);
  React.useEffect(() => {
    if (raised.current) return;
    raised.current = true;
    for (const options of toasts) toast(options);
  }, [toast, toasts]);
  return null;
}

/** Buttons that raise toasts, as the screens would after Save, Export or Upload. */
function Triggers() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap items-start gap-2 p-4">
      <Button onClick={() => toast({ type: 'success', message: 'Cost saved.' })}>Save cost</Button>
      <Button
        variant="outlined"
        onClick={() => toast({ type: 'info', message: 'Export started. It will appear in Exports when it’s ready.' })}
      >
        Export
      </Button>
      <Button variant="outlined" onClick={() => toast({ type: 'error', message: 'Upload failed.' })}>
        Upload
      </Button>
      <Button variant="outlined" onClick={() => toast({ type: 'success', message: 'Draft saved.', duration: 300 })}>
        Quick save
      </Button>
    </div>
  );
}

/* Pattern 12's four toasts. Info and Success get `duration: null` here only so the snapshot is stable. */
const PATTERN_12: ToastOptions[] = [
  { type: 'success', message: 'Cost saved.', duration: null },
  { type: 'info', message: 'Export started. It will appear in Exports when it’s ready.', duration: null },
  { type: 'warning', message: '3 rows were skipped because the currency is disabled.' },
  { type: 'error', message: 'Upload failed. Check your connection and try again.', showAction: true, action: 'Retry' },
];

/**
 * Pattern 12’s stack, open. The X closes a toast; when focus was on it, focus moves to the next toast’s X.
 * The stack is the live region, named “Notifications”.
 */
export const Stack: Story = {
  render: () => (
    <ToastProvider>
      <RaiseOnMount toasts={PATTERN_12} />
      <Triggers />
    </ToastProvider>
  ),
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Notifications' });
    await expect(region).toHaveAttribute('aria-live', 'polite');
    await waitFor(() => expect(region.querySelectorAll('[data-toast-id]')).toHaveLength(4));
    const stack = within(region);

    // Stacked bottom right, in the order raised, 12px apart.
    const items = [...region.querySelectorAll<HTMLElement>('[data-toast-id]')];
    await expect(items.map((t) => t.textContent)).toEqual(PATTERN_12.map((t) => `${t.message}${t.action ?? ''}`));
    const [first, second] = items.map((t) => t.getBoundingClientRect());
    await expect(second.top - first.bottom).toBeCloseTo(12, 1);
    await expect(document.documentElement.clientWidth - first.right).toBeCloseTo(16, 1);

    // Warning and Error, and anything with an action, have no timer.
    await expect(items[2]).not.toHaveAttribute('data-duration');
    await expect(items[3]).not.toHaveAttribute('data-duration');

    // Dismiss with the keyboard: focus moves on to the next toast's X.
    const xs = stack.getAllByRole('button', { name: 'Dismiss' });
    xs[1].focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(region.querySelectorAll('[data-toast-id]')).toHaveLength(3));
    await expect(region).not.toHaveTextContent('Export started.');
    await expect(region.querySelectorAll('[data-toast-id]')[1].querySelector('[data-toast-dismiss]')).toHaveFocus();

    // Dismiss with a click.
    await userEvent.click(stack.getAllByRole('button', { name: 'Dismiss' })[0]);
    await waitFor(() => expect(region.querySelectorAll('[data-toast-id]')).toHaveLength(2));
    await expect(region).not.toHaveTextContent('Cost saved.');

    // A new toast joins the end of the stack.
    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }));
    await waitFor(() => expect(region.querySelectorAll('[data-toast-id]')).toHaveLength(3));
    await expect(region.querySelectorAll('[data-toast-id]')[2]).toHaveTextContent('Upload failed.');
  },
};

/**
 * The timer. Info and Success close after 5 seconds (`TOAST_DURATION`); Error stays until its X is pressed. Hovering
 * a toast pauses its timer, and leaving resumes it. “Quick save” uses a 300ms timer so the test doesn’t wait 5 seconds.
 */
export const Timer: Story = {
  render: () => (
    <ToastProvider>
      <Triggers />
    </ToastProvider>
  ),
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The live region is in the page before any toast, empty.
    const region = canvas.getByRole('region', { name: 'Notifications' });
    await expect(region).toBeEmptyDOMElement();
    const toasts = () => [...region.querySelectorAll<HTMLElement>('[data-toast-id]')];

    await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(toasts()).toHaveLength(1));
    await expect(toasts()[0]).toHaveAttribute('data-duration', String(TOAST_DURATION));
    await expect(toasts()[0]).toHaveAttribute('data-paused', 'false');
    // The X closes it before its 5 seconds are up.
    await userEvent.click(within(toasts()[0]).getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(toasts()).toHaveLength(0));

    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }));
    await waitFor(() => expect(toasts()).toHaveLength(1));
    await expect(toasts()[0]).not.toHaveAttribute('data-duration');

    // A timed toast closes itself.
    await userEvent.click(canvas.getByRole('button', { name: 'Quick save' }));
    await waitFor(() => expect(region).toHaveTextContent('Draft saved.'));
    await waitFor(() => expect(region).not.toHaveTextContent('Draft saved.'), { timeout: 2000 });

    // Hover pauses it; leaving resumes it.
    await userEvent.click(canvas.getByRole('button', { name: 'Quick save' }));
    await waitFor(() => expect(region).toHaveTextContent('Draft saved.'));
    const quick = toasts().find((t) => t.textContent?.includes('Draft saved.'))!;
    await userEvent.hover(quick);
    await waitFor(() => expect(quick).toHaveAttribute('data-paused', 'true'));
    await new Promise((resolve) => setTimeout(resolve, 600));
    await expect(region).toHaveTextContent('Draft saved.');
    await userEvent.unhover(quick);
    await waitFor(() => expect(region).not.toHaveTextContent('Draft saved.'), { timeout: 2000 });

    // Error stays until its X is pressed.
    await expect(region).toHaveTextContent('Upload failed.');
    await userEvent.click(within(region).getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(toasts()).toHaveLength(0));
  },
};

/** `useToast()` outside a `ToastProvider` throws: a toast without the live region would be silent. */
export const NeedsProvider: Story = {
  render: () => {
    function Probe() {
      try {
        useToast();
        return <p className="text-body-sm-regular">No error</p>;
      } catch (error) {
        return <p className="text-body-sm-regular">{(error as Error).message}</p>;
      }
    }
    return <Probe />;
  },
  parameters: { controls: { disable: true } },
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/useToast\(\) needs a <ToastProvider>/)).toBeInTheDocument();
  },
};
