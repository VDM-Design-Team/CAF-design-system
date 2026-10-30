import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Icon } from '../icon';
import { FormSectionHeader } from './FormSectionHeader';

const meta = {
  title: 'Components/FormSectionHeader',
  component: FormSectionHeader,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Form / Section Header` and `Form / Section Header – ' +
          'Action`): the title of a section of a long form, with an optional description under it (Show Description) ' +
          'or an action at the far end (“Breakdowns → Add new”). The title is a heading: an `<h2>` by default; ' +
          '`headingLevel` moves it without changing the look.',
      },
    },
  },
  args: {
    title: 'Beneficiary Information',
    description: 'Use a permanent address where you can receive mail',
  },
  argTypes: { headingLevel: { control: 'radio', options: [2, 3, 4] }, action: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-128">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormSectionHeader>;

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

/** Form / Section Header, Show Description on (Form / New Cost’s second section). */
export const Default: Story = {
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { level: 2, name: 'Beneficiary Information' });
    await expect(heading).toBeInTheDocument();
    await expect(canvas.getByText('Use a permanent address where you can receive mail').tagName).toBe('P');
  },
};

/** Show Description off: the title alone. */
export const TitleOnly: Story = {
  args: { title: 'Recurring Details', description: undefined },
};

/** Inside a modal or a side sheet, whose own title is the `<h2>`: `headingLevel={3}`. The look doesn’t change. */
export const InsideADialog: Story = {
  args: { title: 'Recurring Details', description: 'How often this cost repeats and when it starts.', headingLevel: 3 },
  render: (args) => (
    <section aria-labelledby="sheet-title" className="flex flex-col gap-4">
      <h2 id="sheet-title" className="text-body-lg-semibold text-text-primary">
        Edit Recurring Cost
      </h2>
      <FormSectionHeader {...args} />
    </section>
  ),
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { level: 3, name: 'Recurring Details' });
    await expect(getComputedStyle(heading).fontSize).toBe('18px');
  },
};

function Breakdowns() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <FormSectionHeader
        title="Breakdowns"
        action={
          <Button size="small" variant="text" leftIcon={<Icon name="plus" />} onClick={() => setCount((n) => n + 1)}>
            Add new
          </Button>
        }
      />
      <p role="status" className="text-body-sm-regular text-text-secondary">
        {count} {count === 1 ? 'breakdown' : 'breakdowns'}
      </p>
    </div>
  );
}

/** Form / Section Header – Action: “Breakdowns” with Add new at the far end, centred on the title. */
export const WithAction: Story = {
  render: () => <Breakdowns />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add new' });
    await userEvent.click(add);
    await expect(canvas.getByRole('status')).toHaveTextContent('1 breakdown');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent('2 breakdowns');
  },
};

/* ── Every variant, in Light and Dark ──────────────────────────────────────
   Section Header with and without its description, and Section Header –
   Action, checked against the Figma bindings and layout. */

const VARIANTS = [
  {
    variant: 'Description',
    title: 'Beneficiary Information',
    description: 'Use a permanent address where you can receive mail',
  },
  { variant: 'Title only', title: 'Recurring Details' },
  { variant: 'Action', title: 'Breakdowns', action: true },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Variants — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col gap-8">
      {VARIANTS.map((v) => (
        <FormSectionHeader
          key={v.variant}
          data-variant={v.variant}
          title={v.title}
          description={'description' in v ? v.description : undefined}
          action={
            'action' in v ? (
              <Button size="small" variant="text" leftIcon={<Icon name="plus" />}>
                Add new
              </Button>
            ) : undefined
          }
        />
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  afterEach: async ({ canvasElement }) => {
    const primary = tokenColour('text-primary');
    const subtle = tokenColour('text-subtle');
    await waitFor(() => {
      for (const v of VARIANTS) {
        const header = canvasElement.querySelector<HTMLElement>(`[data-variant="${v.variant}"]`)!;
        const title = header.querySelector('h2')!;
        // _Section Title: Body/lg-regular, text.primary.
        const t = getComputedStyle(title);
        expect(t.color).toBe(primary);
        expect([t.fontSize, t.fontWeight, t.lineHeight]).toEqual(['18px', '400', '26px']);
        const description = header.querySelector('p');
        if ('description' in v) {
          // _Description Text: Body/sm-regular, text.subtle, space.4 under the title.
          const d = getComputedStyle(description!);
          expect(d.color).toBe(subtle);
          expect([d.fontSize, d.fontWeight]).toEqual(['14px', '400']);
          expect(description!.getBoundingClientRect().top - title.getBoundingClientRect().bottom).toBe(4);
        } else {
          expect(description).toBeNull();
        }
        const button = header.querySelector('button');
        if ('action' in v) {
          // The action at the far end, centred on the title.
          const b = button!.getBoundingClientRect();
          const box = header.getBoundingClientRect();
          const h = title.getBoundingClientRect();
          expect(b.right).toBe(box.right);
          expect(b.top + b.height / 2).toBe(h.top + h.height / 2);
        } else {
          expect(button).toBeNull();
        }
      }
    });
  },
});

export const VariantsLight = grid('light');
export const VariantsDark = grid('dark');
