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
          'Form / Field – Dropdown with Edit (Currency). Caption/sm-regular in `text/link/default`. It is a ' +
          '`<button type="button">`; pass it as a field’s `action`. In a field it is named by its text and the ' +
          'field’s label: “[Edit] Currency”.',
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

/* ── Light and Dark ────────────────────────────────────────────────────────
   Figma's one look, plus the focus ring code adds (forced with pseudo-states). */

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Look — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-6">
      {(['Default', 'Focus'] as const).map((state) => (
        <FormField
          key={state}
          label={`Currency (${state})`}
          className="w-96"
          action={<FormEditLink data-state={state} data-pseudo={state === 'Focus' ? 'focus-visible' : undefined} />}
        >
          <Select options={['EUR', 'USD']} defaultValue="EUR" />
        </FormField>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    pseudo: { rootSelector: 'body', focusVisible: ['[data-pseudo="focus-visible"]'] },
  },
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // afterEach: pseudo-states applies the forced Focus on STORY_RENDERED, after play.
  afterEach: async ({ canvasElement }) => {
    const link = tokenColour('text-link-default');
    const focused = tokenColour('stroke-focused');
    await waitFor(
      () => {
        for (const state of ['Default', 'Focus']) {
          const node = canvasElement.querySelector<HTMLElement>(`[data-state="${state}"]`)!;
          const style = getComputedStyle(node);
          expect(style.color).toBe(link);
          expect(style.fontSize).toBe('10px');
          expect(style.fontWeight).toBe('400');
          expect(style.lineHeight).toBe('14px');
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

export const LookLight = grid('light');
export const LookDark = grid('dark');
