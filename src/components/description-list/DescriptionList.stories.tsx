import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Tag } from '../tag';
import { DescriptionList, DescriptionListItem } from './DescriptionList';

/* Figma's Export Details: the eight items `Description List` holds. */
const EXPORT_DETAILS = [
  ['Name', 'invoices-12-2026-10-08-053332.zip'],
  ['Type', 'Zip'],
  ['Created By', 'Admin Account'],
  ['File Size', '253 B'],
  ['Created', '2026-10-08'],
  ['Completed', '2026-10-08'],
  ['Valid until', '2026-10-15'],
  ['Downloads', '0'],
] as const;

function ExportDetails() {
  return (
    <>
      {EXPORT_DETAILS.map(([label, value]) => (
        <DescriptionListItem key={label} label={label} value={value} />
      ))}
    </>
  );
}

const meta = {
  title: 'Components/DescriptionList',
  component: DescriptionList,
  subcomponents: { DescriptionListItem },
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Cards** (`Description List` and `Description List / Item`): the ' +
          'label and value pairs of a record’s details, as in Export Details. `DescriptionList` is a `dl` in two ' +
          'columns, 24px apart, rows 16px apart. Each `DescriptionListItem` takes Figma’s `label` (a `dt`) and ' +
          '`value` (a `dd`), the label above the value. A value can be any content, such as a `Tag`.',
      },
    },
  },
  args: { children: <ExportDetails /> },
  argTypes: { children: { control: false } },
  // Figma's width: 464.
  render: (args) => <DescriptionList {...args} className="w-116" />,
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's Export Details at Figma's width. */
export const Playground: Story = {};

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

/* ── Export Details, in Light and Dark ─────────────────────────────────────
   Figma's list on the surfaces it sits on: the page canvas and a dialog's
   surface.base. Checked against Figma's layout and bindings. */

const SURFACES = [
  { name: 'On surface.canvas', className: 'bg-surface-canvas' },
  { name: 'On surface.base (a dialog)', className: 'bg-surface-base' },
] as const;

const details = (theme: 'light' | 'dark'): Story => ({
  name: `Export Details — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      {SURFACES.map(({ name, className }) => (
        <section key={name} aria-label={name} className="flex flex-col gap-2">
          <p className="text-caption-md-medium text-text-secondary">{name}</p>
          <div className={`rounded-12 p-6 ${className}`}>
            <DescriptionList className="w-116" data-list>
              <ExportDetails />
            </DescriptionList>
          </div>
        </section>
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { subtle: tokenColour('text-subtle'), primary: tokenColour('text-primary') };
    await waitFor(() => {
      for (const list of canvasElement.querySelectorAll<HTMLElement>('[data-list]')) {
        expect(list.tagName).toBe('DL');
        // Two columns 24px apart, rows 16px apart: 220px items at Figma's 464.
        const style = getComputedStyle(list);
        expect([style.columnGap, style.rowGap]).toEqual(['24px', '16px']);
        const items = [...list.children] as HTMLElement[];
        expect(items).toHaveLength(8);
        const box = items.map((item) => item.getBoundingClientRect());
        expect(box.map((b) => b.width)).toEqual(Array(8).fill(220));
        expect(box[1].left - box[0].right).toBe(24);
        expect(box[2].left).toBe(box[0].left);
        expect(box[2].top - box[0].bottom).toBe(16);
        for (const item of items) {
          const [dt, dd] = [...item.children] as HTMLElement[];
          expect([dt.tagName, dd.tagName]).toEqual(['DT', 'DD']);
          // Label above value, 2px apart.
          expect(dd.getBoundingClientRect().top - dt.getBoundingClientRect().bottom).toBe(2);
          // Label — Caption/md-regular, text.subtle; Value — Body/sm-medium, text.primary.
          expect(getComputedStyle(dt).color).toBe(want.subtle);
          expect([getComputedStyle(dt).fontSize, getComputedStyle(dt).fontWeight]).toEqual(['12px', '400']);
          expect(getComputedStyle(dd).color).toBe(want.primary);
          expect([getComputedStyle(dd).fontSize, getComputedStyle(dd).fontWeight]).toEqual(['14px', '500']);
        }
        // The long file name wraps inside its column, as in Figma.
        const name = items[0].lastElementChild as HTMLElement;
        expect(name.getBoundingClientRect().height).toBeGreaterThan(20);
        expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
      }
    });
    // Terms and definitions, in reading order.
    const first = within(canvasElement.querySelector<HTMLElement>('[data-list]')!);
    await expect(first.getAllByRole('term').map((t) => t.textContent)).toEqual(EXPORT_DETAILS.map(([label]) => label));
    await expect(first.getAllByRole('definition')[3]).toHaveTextContent('253 B');
  },
});

export const ExportDetailsLight = details('light');
export const ExportDetailsDark = details('dark');

/* ── Rich values ───────────────────────────────────────────────────────────
   A value can be any content: a Tag for a status, a multi-line address.
   Wider than Figma's frame, the two columns share the width. */

export const RichValues: Story = {
  name: 'Rich values',
  render: () => (
    <DescriptionList className="w-160">
      <DescriptionListItem label="Status" value={<Tag status="completed">Completed</Tag>} />
      <DescriptionListItem label="Type" value="Excel" />
      <DescriptionListItem label="Beneficiary" value="Jane Doe, 12 Harbour Road, Valletta, Malta" />
      <DescriptionListItem label="IBAN Account" value="MT84 MALT 0110 0001 2345 MTLC AST0 01S" />
    </DescriptionList>
  ),
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [status] = canvas.getAllByRole('definition');
    await expect(within(status).getByText('Completed')).toBeVisible();
    // (640 − 24) / 2 = 308 a column.
    for (const item of canvasElement.querySelectorAll('dl > div')) await expect(item.getBoundingClientRect().width).toBe(308);
  },
};
