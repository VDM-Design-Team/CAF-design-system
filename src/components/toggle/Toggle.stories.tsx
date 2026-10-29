import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Toggle } from './Toggle';

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Selection Controls** (`Toggle`): the on/off switch. Figma’s ' +
          'Checked is `checked` (or `defaultChecked`) and Disabled is `disabled`. It is a native ' +
          '`<input type="checkbox" role="switch">`: Space flips it, and in a form it submits `name` = `value` ' +
          '(“on”) while on. Name it with a `<label>`, `aria-labelledby` or `aria-label`; ToggleField adds Figma’s ' +
          'label and description.',
      },
    },
  },
  args: { 'aria-label': 'Active', onChange: fn() },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Toggle>;

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

/** A click flips it: Checked=false → true → false. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const toggle = canvas.getByRole('switch', { name: 'Active' });
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

export const Checked: Story = { args: { defaultChecked: true } };

/** Disabled: it can’t be flipped or focused, and a disabled switch isn’t submitted. */
export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
  play: async ({ args, canvas }) => {
    const toggle = canvas.getByRole('switch', { name: 'Active' });
    await expect(toggle).toBeDisabled();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** The keyboard: Tab reaches it and shows the stroke/focused ring (code’s; Figma has no Focus); Space flips it. */
export const Keyboard: Story = {
  play: async ({ args, canvas }) => {
    const toggle = canvas.getByRole('switch', { name: 'Active' });
    const focused = tokenColour('stroke-focused');
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await waitFor(() => {
      const style = getComputedStyle(toggle);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineOffset).toBe('2px');
      expect(style.outlineColor).toBe(focused);
    });
    await userEvent.keyboard(' ');
    await expect(toggle).toBeChecked();
    await userEvent.keyboard(' ');
    await expect(toggle).not.toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

function Controlled() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center gap-3">
      <Toggle aria-label="Show announcement" checked={on} onChange={(event) => setOn(event.target.checked)} />
      <span className="text-body-sm-regular text-text-secondary" data-testid="state">
        {on ? 'Shown' : 'Hidden'}
      </span>
    </div>
  );
}

/** Controlled: `checked` + `onChange`, as any checkbox. */
export const ControlledState: Story = {
  name: 'Controlled',
  render: () => <Controlled />,
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('switch', { name: 'Show announcement' });
    await expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
    await expect(canvas.getByTestId('state')).toHaveTextContent('Hidden');
  },
};

/* ── A real form ─────────────────────────────────────────────────────────── */

function NotificationsForm() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);
  return (
    <form
      className="flex flex-col items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <Toggle aria-label="Active" name="active" defaultChecked />
      <Toggle aria-label="Pinned" name="pinned" value="yes" />
      <Toggle aria-label="Archived" name="archived" defaultChecked disabled />
      <Button type="submit">Submit</Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/** It submits like a checkbox: `name` = `value` (“on” by default) while on, nothing while off or disabled. */
export const SubmitsWithForm: Story = {
  render: () => <NotificationsForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole('button', { name: 'Submit' });
    const output = canvas.getByTestId('submitted');
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({ active: 'on' });
    await userEvent.click(canvas.getByRole('switch', { name: 'Active' }));
    await userEvent.click(canvas.getByRole('switch', { name: 'Pinned' }));
    await userEvent.click(submit);
    await waitFor(() => expect(JSON.parse(output.textContent!)).toEqual({ pinned: 'yes' }));
  },
};

/* ── Every Checked × Disabled, in Light and Dark ───────────────────────────
   The same four variants as the Figma component set. */

const VARIANTS = [
  { checked: false, disabled: false },
  { checked: true, disabled: false },
  { checked: false, disabled: true },
  { checked: true, disabled: true },
] as const;

const variantName = ({ checked, disabled }: (typeof VARIANTS)[number]) =>
  `Checked=${checked}, Disabled=${disabled}`;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((variant) => (
        <div key={variantName(variant)} className="flex items-center gap-4">
          <Toggle
            aria-label={variantName(variant)}
            defaultChecked={variant.checked}
            disabled={variant.disabled}
            data-variant={variantName(variant)}
          />
          <span className="text-caption-md-regular text-text-secondary">{variantName(variant)}</span>
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  afterEach: async ({ canvasElement }) => {
    const off = tokenColour('neutral-tonal-surface-default');
    const on = tokenColour('action-primary-surface-default');
    const knobFill = tokenColour('action-primary-content-default');
    await waitFor(
      () => {
        for (const variant of VARIANTS) {
          const input = canvasElement.querySelector<HTMLInputElement>(`[data-variant="${variantName(variant)}"]`)!;
          const wrapper = input.parentElement!;
          const knob = input.nextElementSibling!;
          const track = input.getBoundingClientRect();
          const dot = knob.getBoundingClientRect();
          // Track: 36 × 20, a pill, neutral.tonal off and action.primary on.
          expect([track.width, track.height]).toEqual([36, 20]);
          expect(getComputedStyle(input).borderRadius).toBe('1000px');
          expect(getComputedStyle(input).backgroundColor).toBe(variant.checked ? on : off);
          // Knob: 16px, action.primary.content, 2px in from the start (off) or the end (on).
          expect([dot.width, dot.height]).toEqual([16, 16]);
          expect(getComputedStyle(knob).backgroundColor).toBe(knobFill);
          expect(dot.top - track.top).toBe(2);
          expect(dot.left - track.left).toBe(variant.checked ? 18 : 2);
          // Disabled: the whole switch at 50%.
          expect(getComputedStyle(wrapper).opacity).toBe(variant.disabled ? '0.5' : '1');
          // Forced colours keep these fills, so the switch doesn't vanish in High Contrast.
          expect(getComputedStyle(wrapper).forcedColorAdjust).toBe('none');
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
