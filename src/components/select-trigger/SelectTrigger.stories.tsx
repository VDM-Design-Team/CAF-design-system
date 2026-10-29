import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FormLabel } from '../form-label';
import { SelectTrigger } from './SelectTrigger';

const meta = {
  title: 'Components/SelectTrigger',
  component: SelectTrigger,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`_Dropdown Input`): the closed select, with the chosen option ' +
          'or a placeholder and a caret. Select opens its list from it. `value` is Figma’s Value (empty is State=Default, ' +
          'which shows `placeholder`); `open` is State=Open and sets `aria-expanded`; Focus is `:focus-visible`, Error is ' +
          '`aria-invalid` and Disabled is `disabled`. It is a `<button role="combobox">`: name it with a `<label htmlFor>`, ' +
          '`aria-label` or `aria-labelledby`.',
      },
    },
  },
  args: { 'aria-label': 'Frequency', placeholder: 'Select option', onClick: fn() },
  argTypes: {
    value: { control: 'text' },
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/* The stroke drawn inside the edge (Tailwind's inset-ring), as computed box-shadow text. */
const insetStroke = (colour: string, width: 1 | 2) => `${colour} 0px 0px 0px ${width}px inset`;

/* An open combobox names the list it controls (`aria-controls`; axe: aria-required-attr).
   That list is Select's, which isn't built yet, so these stories point at an empty, hidden stand-in. */
const ListStandIn = ({ id }: { id: string }) => <div id={id} role="listbox" aria-label="Options" hidden />;

/**
 * Pressing it toggles `open`, as Select will: by mouse, and by Enter and Space
 * (it is a button). Open shows `aria-expanded` and Focus's 2px stroke.
 */
export const Playground: Story = {
  render: function Render(args) {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <SelectTrigger
          {...args}
          open={open}
          aria-controls="frequency-list"
          onClick={(event) => {
            args.onClick?.(event);
            setOpen((o) => !o);
          }}
        />
        <ListStandIn id="frequency-list" />
      </>
    );
  },
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveTextContent('Select option');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const focused = tokenColour('stroke-focused');
    await waitFor(() => expect(getComputedStyle(trigger).boxShadow).toContain(insetStroke(focused, 2)));
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // The keyboard: it is in the tab order, and Enter and Space press it.
    trigger.blur();
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard(' ');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onClick).toHaveBeenCalledTimes(4);
  },
};

/**
 * The usual way to name it: a label above it (FormLabel, Figma's `_Form Label`), as
 * Form / Field – Dropdown does; SelectField does the wiring for you. The label is its
 * name; the chosen option is its value.
 */
export const WithLabel: Story = {
  args: { 'aria-label': undefined, id: 'cost-frequency', value: 'Monthly' },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <FormLabel htmlFor="cost-frequency">Frequency</FormLabel>
      <SelectTrigger {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await expect(trigger).toHaveTextContent('Monthly');
    await expect(trigger).not.toHaveAttribute('data-placeholder');
    await expect(getComputedStyle(trigger).color).toBe(tokenColour('text-primary'));
  },
};

/** State=Error: `aria-invalid`, described by its message. Focused, it keeps the error colour at Focus's 2px. */
export const ErrorState: Story = {
  name: 'Error',
  args: { value: 'Monthly', 'aria-invalid': true, 'aria-describedby': 'frequency-error' },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <SelectTrigger {...args} />
      <p id="frequency-error" className="text-body-sm-regular text-accent-critical-outline-content-default">
        Monthly costs need an end date.
      </p>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await expect(trigger).toBeInvalid();
    await expect(trigger).toHaveAccessibleDescription('Monthly costs need an end date.');
    const critical = tokenColour('accent-critical-outline-border-default');
    await expect(getComputedStyle(trigger).boxShadow).toContain(insetStroke(critical, 1));
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(trigger).boxShadow).toContain(insetStroke(critical, 2)));
  },
};

/** State=Disabled: it can't be focused or pressed, and a value shows in text.subtle, like the placeholder. */
export const Disabled: Story = {
  args: { disabled: true, value: 'Monthly' },
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    await expect(args.onClick).not.toHaveBeenCalled();
    await userEvent.tab();
    await expect(trigger).not.toHaveFocus();
    await expect(getComputedStyle(trigger).color).toBe(tokenColour('text-subtle'));
  },
};

/* ── Every State, in Light and Dark ────────────────────────────────────────
   The same six states as the Figma component set. Focus is forced with
   storybook-addon-pseudo-states, and each cell is checked against the
   variables Figma binds in that state (the caret against text.subtle, the
   binding code corrects; see docs/figma-sync.md). */

const STATES = [
  { state: 'Default', props: {}, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Filled', props: { value: 'Monthly' }, text: 'text-primary', stroke: ['stroke-subtle', 1] },
  { state: 'Focus', props: { value: 'Monthly' }, text: 'text-primary', stroke: ['stroke-focused', 2] },
  {
    state: 'Error',
    props: { value: 'Monthly', 'aria-invalid': true },
    text: 'text-primary',
    stroke: ['accent-critical-outline-border-default', 1],
  },
  { state: 'Disabled', props: { disabled: true }, text: 'text-subtle', stroke: ['stroke-subtle', 1] },
  { state: 'Open', props: { open: true, 'aria-controls': 'open-list' }, text: 'text-subtle', stroke: ['stroke-focused', 2] },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {STATES.map(({ state, props }) => (
        <div key={state} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">{state}</span>
          <SelectTrigger
            {...props}
            aria-label={`${state} select`}
            data-state={state}
            data-pseudo={state === 'Focus' ? 'focus-visible' : undefined}
          />
        </div>
      ))}
      <ListStandIn id="open-list" />
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', focusVisible: ['[data-pseudo="focus-visible"]'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Focus on
  // STORY_RENDERED, which comes after play (see Button's stories).
  afterEach: async ({ canvasElement }) => {
    const fill = tokenColour('surface-elevated-secondary');
    const caret = tokenColour('text-subtle');
    const want = STATES.map(({ state, text, stroke: [token, width] }) => ({
      state,
      text: tokenColour(text),
      stroke: insetStroke(tokenColour(token), width),
    }));
    await waitFor(
      () => {
        for (const { state, text, stroke } of want) {
          const trigger = canvasElement.querySelector<HTMLButtonElement>(`[data-state="${state}"]`)!;
          const style = getComputedStyle(trigger);
          expect(style.backgroundColor).toBe(fill);
          expect(style.boxShadow).toContain(stroke);
          expect(getComputedStyle(trigger.querySelector('span')!).color).toBe(text);
          const svg = trigger.querySelector('svg')!;
          expect(getComputedStyle(svg).color).toBe(caret);
          expect(svg.getBoundingClientRect().width).toBe(20);
          expect(trigger.getBoundingClientRect().height).toBe(40);
          expect(trigger.getAttribute('aria-expanded')).toBe(String(state === 'Open'));
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
