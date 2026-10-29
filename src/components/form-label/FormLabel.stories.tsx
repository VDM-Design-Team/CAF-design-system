import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { TextInput } from '../text-input';
import { FormLabel } from './FormLabel';

const meta = {
  title: 'Components/FormLabel',
  component: FormLabel,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`_Form Label`): the label above every Form / Field. ' +
          'Body/sm-regular in `text/secondary`. Figma’s Required is `required`: a “*” in ' +
          '`accent/critical/tonal/content/default`, space.2 after the label. The marker is decoration (`aria-hidden`); ' +
          'the control announces “required”. FormField renders it; `as="legend"` labels a fieldset.',
      },
    },
  },
  args: { children: 'Applicant name', htmlFor: 'applicant-name' },
  argTypes: { required: { control: 'boolean' } },
  render: (args) => (
    <div className="flex w-96 flex-col gap-5">
      <FormLabel {...args} />
      <TextInput id="applicant-name" placeholder="Placeholder" required={args.required} />
    </div>
  ),
} satisfies Meta<typeof FormLabel>;

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

/** Required=false. It names the input: clicking it focuses the input. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Applicant name'));
    await expect(canvas.getByRole('textbox', { name: 'Applicant name' })).toHaveFocus();
  },
};

/** Required=true: the marker. The input is `required`, so “required” is announced once, by the input. */
export const Required: Story = {
  args: { required: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Applicant name' });
    await expect(input).toBeRequired();
    const marker = canvas.getByText('*');
    await expect(marker).toHaveAttribute('aria-hidden', 'true');
    await expect(getComputedStyle(marker).color).toBe(tokenColour('accent-critical-tonal-content-default'));
  },
};

/** A fieldset’s label, for a group of radios or checkboxes. */
export const AsLegend: Story = {
  args: { as: 'legend', children: 'Target audience', required: true },
  render: (args) => (
    <fieldset className="flex flex-col gap-2">
      <FormLabel {...args} />
      {['All', 'Admin', 'User'].map((option) => (
        <label key={option} className="inline-flex items-center gap-2 text-body-sm-regular text-text-primary">
          <input type="radio" name="audience" value={option} />
          {option}
        </label>
      ))}
    </fieldset>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Target audience' })).toBeInTheDocument();
  },
};

/* ── Required × theme ──────────────────────────────────────────────────────
   Both variants of the Figma set, checked against its bindings. */

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Variants — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-4">
      {[false, true].map((required) => (
        <div key={String(required)} className="flex flex-col gap-2">
          <span className="text-caption-md-medium text-text-secondary">Required={String(required)}</span>
          <FormLabel htmlFor={`label-${required}`} required={required} data-required={required}>
            Label text
          </FormLabel>
          <TextInput id={`label-${required}`} placeholder="Placeholder" required={required} />
        </div>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  afterEach: async ({ canvasElement }) => {
    const label = tokenColour('text-secondary');
    const marker = tokenColour('accent-critical-tonal-content-default');
    await waitFor(() => {
      for (const required of [false, true]) {
        const node = canvasElement.querySelector<HTMLElement>(`[data-required="${required}"]`)!;
        const style = getComputedStyle(node);
        expect(style.color).toBe(label);
        expect(style.fontSize).toBe('14px');
        expect(style.fontWeight).toBe('400');
        expect(style.lineHeight).toBe('20px');
        const star = node.querySelector('[aria-hidden]');
        if (!required) {
          expect(star).toBeNull();
          continue;
        }
        expect(getComputedStyle(star!).color).toBe(marker);
        // space.2 between the label text and the marker.
        expect(style.columnGap).toBe('2px');
      }
    });
  },
});

export const VariantsLight = grid('light');
export const VariantsDark = grid('dark');
