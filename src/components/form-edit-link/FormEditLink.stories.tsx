import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FormField } from '../form-field';
import { Select } from '../select';
import { FormEditLink } from './FormEditLink';

const meta = {
  title: 'Components/FormEditLink',
  component: FormEditLink,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`_Edit Link`): the “[Edit]” beside a field’s label in ' +
          'Form / Field – Dropdown with Edit (Currency). Caption/sm-regular; State is Default (`text/link/default`), ' +
          'Hover (`:hover`, `text/link/hover`), Pressed (`:active`, `text/link/pressed`) or Disabled (`disabled`, ' +
          '`text/disabled`). It hugs its label, and an invisible 24×24 target (a `::before`, outside the layout) is ' +
          'centred on it. It is a `<button type="button">`; pass it as a field’s `action`. In a field it is named by ' +
          'its text and the field’s label: “[Edit] Currency”.',
      },
    },
  },
  args: { onClick: fn() },
  render: (args) => (
    <FormField label="Currency" action={<FormEditLink {...args} />} className="w-96">
      <Select options={['EUR', 'USD', 'PHP']} defaultValue="EUR" />
    </FormField>
  ),
} satisfies Meta<typeof FormEditLink>;

export default meta;
type Story = StoryObj<typeof meta>;

function tokenColour(token: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** Beside the Currency label: named “[Edit] Currency”. A click or Enter calls `onClick`; it never submits a form. */
export const InAField: Story = {
  play: async ({ args, canvas }) => {
    const edit = canvas.getByRole('button', { name: '[Edit] Currency' });
    await expect(edit).toHaveAttribute('type', 'button');
    await userEvent.click(edit);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await expect(edit).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
    // The label still names the select, not the link.
    await expect(canvas.getByRole('combobox', { name: 'Currency' })).toHaveTextContent('EUR');
  },
};

/** Outside a field it is named by its text, or by `aria-label`. */
export const OnItsOwn: Story = {
  args: { 'aria-label': 'Edit currency' },
  render: (args) => <FormEditLink {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Edit currency' })).toHaveTextContent('[Edit]');
  },
};

/** Disabled (State=Disabled): `text/disabled`; it can't be pressed or focused. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    const edit = canvas.getByRole('button', { name: '[Edit] Currency' });
    await expect(edit).toBeDisabled();
    await userEvent.click(edit, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
    await expect(getComputedStyle(edit).color).toBe(tokenColour('text-disabled'));
  },
};

/** The 24×24 target: a click on its edge, outside the 14px-high label, still presses it. */
export const Target: Story = {
  play: async ({ args, canvas }) => {
    const edit = canvas.getByRole('button', { name: '[Edit] Currency' });
    const box = edit.getBoundingClientRect();
    // 4px under the label's box, inside the 24px target (5px above and below the 14px label).
    const x = box.left + box.width / 2;
    const y = box.bottom + 4;
    const hit = document.elementFromPoint(x, y)!;
    await expect(hit).toBe(edit);
    await userEvent.pointer({ keys: '[MouseLeft]', target: hit, coords: { clientX: x, clientY: y } });
    await waitFor(() => expect(args.onClick).toHaveBeenCalledTimes(1));
  },
};

/* ── Every State, in Light and Dark ────────────────────────────────────────
   Figma's Default, Hover, Pressed and Disabled (Hover and Pressed forced with
   pseudo-states), plus the focus ring code adds. Each is checked against its
   bound colour, the type, and the Hit Area: 24 high, at least 24 wide,
   centred on the label, taking no layout space (the label row is as high as
   a field without the link). */

const STATES = [
  { state: 'Default', props: {}, colour: 'text-link-default', pseudo: undefined },
  { state: 'Hover', props: {}, colour: 'text-link-hover', pseudo: 'hover' },
  { state: 'Pressed', props: {}, colour: 'text-link-pressed', pseudo: 'active' },
  { state: 'Disabled', props: { disabled: true }, colour: 'text-disabled', pseudo: undefined },
  { state: 'Focus', props: {}, colour: 'text-link-default', pseudo: 'focus-visible' },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      <FormField label="Currency (no link)" className="w-96" data-state="none">
        <Select options={['EUR', 'USD']} defaultValue="EUR" />
      </FormField>
      {STATES.map(({ state, props, pseudo }) => (
        <FormField
          key={state}
          label={`Currency (${state})`}
          className="w-96"
          action={<FormEditLink {...props} data-state={state} data-pseudo={pseudo} className="transition-none" />}
        >
          <Select options={['EUR', 'USD']} defaultValue="EUR" />
        </FormField>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    pseudo: {
      rootSelector: 'body',
      hover: ['[data-pseudo="hover"]'],
      active: ['[data-pseudo="active"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // afterEach: pseudo-states applies the forced states on STORY_RENDERED, after play.
  afterEach: async ({ canvasElement }) => {
    const want = STATES.map(({ state, colour }) => ({ state, colour: tokenColour(colour) }));
    const focused = tokenColour('stroke-focused');
    await waitFor(
      () => {
        // The Label Row of the field without a link.
        const plain = canvasElement.querySelector('[data-state="none"]')!.firstElementChild!.getBoundingClientRect().height;
        for (const { state, colour } of want) {
          const node = canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
          const style = getComputedStyle(node);
          expect(style.color).toBe(colour);
          expect(style.fontSize).toBe('10px');
          expect(style.fontWeight).toBe('400');
          expect(style.lineHeight).toBe('14px');
          // Hit Area: 24 high, the label's width (26 or more) but at least 24, centred, absolute.
          const box = node.getBoundingClientRect();
          const target = getComputedStyle(node, '::before');
          expect(target.position).toBe('absolute');
          expect(target.height).toBe('24px');
          expect(parseFloat(target.width)).toBeCloseTo(Math.max(box.width, 24), 2);
          expect(box.height).toBe(14);
          // It takes no layout space: the label row is as high as one without the link.
          expect(node.parentElement!.getBoundingClientRect().height).toBe(plain);
          if (state === 'Focus') {
            expect(style.outlineStyle).toBe('solid');
            expect(style.outlineColor).toBe(focused);
            expect(style.outlineWidth).toBe('2px');
          } else {
            expect(style.outlineStyle).toBe('none');
          }
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
