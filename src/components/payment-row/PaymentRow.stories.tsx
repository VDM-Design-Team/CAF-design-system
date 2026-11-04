import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { PaymentRow, PAYMENT_ROW_STATUSES } from './PaymentRow';

const meta = {
  title: 'Components/PaymentRow',
  component: PaymentRow,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Payment Row`): one payment in the Payment ' +
          'Schedules modal. `status` is Figma’s Status, `done` (default) or `upcoming`: it sets the round status icon ' +
          '(CheckCircle or Clock), the 1px edge, the subtitle’s colour and the status Tag (Completed “Done” or Warning ' +
          '“Upcoming”, no icon). `date`, `subtitle` and `amount` are Figma’s Date, Subtitle and Amount; the amount is ' +
          'Body/sm-semibold in `text.primary`, between the text and the Tag. The icon is decorative; the Tag says the ' +
          'status in text. `Modal / Status Icon` is only placed in this row, so it is part of it.',
      },
    },
  },
  args: { date: 'September 1, 2026', subtitle: 'Processed on Sep 1, 2026', amount: 'USD 900' },
  argTypes: { status: { control: 'select', options: PAYMENT_ROW_STATUSES } },
  // Figma's row is 460 wide.
  decorators: [
    (Story) => (
      <div className="w-115 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PaymentRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's default: Status=Done, Amount "USD 900". */
export const Playground: Story = {};

/** No `amount`: nothing renders for it, and the text block takes the room. */
export const WithoutAmount: Story = {
  args: { amount: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-part="amount"]')).toBeNull();
    await expect(within(canvasElement).getByText('Done')).toBeVisible();
  },
};

/** Status=Upcoming: a payment that is scheduled, not yet processed. */
export const Upcoming: Story = {
  args: { status: 'upcoming', date: 'September 22, 2026', subtitle: 'Scheduled' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Upcoming')).toBeVisible();
    // The icon is decorative: only the text says the status.
    await expect(canvasElement.querySelector('[data-part="status-icon"]')).toHaveAttribute('aria-hidden', 'true');
  },
};

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

/* The type a utility class sets: size, line height, weight. Measure before waitFor, never inside it. */
function utilityType(className: string) {
  const probe = document.createElement('span');
  probe.className = className;
  document.body.append(probe);
  const { fontSize, lineHeight, fontWeight } = getComputedStyle(probe);
  probe.remove();
  return { fontSize, lineHeight, fontWeight };
}

/* The stroke drawn inside the edge (Tailwind's inset-ring), as computed box-shadow text. */
const insetStroke = (colour: string) => `${colour} 0px 0px 0px 1px inset`;

/* Figma's bindings per Status: the edge, the tonal [surface, content] pair the icon
   and the Tag share, and the subtitle's colour. */
const BOUND = {
  done: {
    edge: 'accent-success-outline-border-default',
    tonal: ['accent-success-tonal-surface-default', 'accent-success-tonal-content-default'],
    subtitle: 'text-subtle',
    label: 'Done',
  },
  upcoming: {
    edge: 'accent-warning-outline-border-default',
    tonal: ['accent-warning-tonal-surface-default', 'accent-warning-tonal-content-default'],
    subtitle: 'accent-warning-tonal-content-default',
    label: 'Upcoming',
  },
} as const;

/* ── Every Status, in Light and Dark ───────────────────────────────────────
   The Figma component set, as Payment Schedules places it, each row checked
   against the variables its Figma layers are bound to. */
const grid = (theme: 'light' | 'dark'): Story => ({
  name: `Statuses — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <ul className="flex flex-col gap-2">
      <li>
        <PaymentRow status="done" date="September 1, 2026" subtitle="Processed on Sep 1, 2026" amount="USD 900" />
      </li>
      <li>
        <PaymentRow status="upcoming" date="September 22, 2026" subtitle="Scheduled" amount="USD 900" />
      </li>
    </ul>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const canvas = tokenColour('surface-canvas');
    const primary = tokenColour('text-primary');
    const amountType = utilityType('text-body-sm-semibold');
    const tagType = utilityType('text-label-sm-medium');
    const want = Object.fromEntries(
      Object.entries(BOUND).map(([status, b]) => [
        status,
        {
          edge: insetStroke(tokenColour(b.edge)),
          surface: tokenColour(b.tonal[0]),
          content: tokenColour(b.tonal[1]),
          subtitle: tokenColour(b.subtitle),
          label: b.label,
        },
      ]),
    );
    const rows = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-status]'));
    await expect(rows).toHaveLength(2);
    await waitFor(() => {
      for (const row of rows) {
        const w = want[row.dataset.status!];
        const style = getComputedStyle(row);
        // Row: surface.canvas, the status's 1px outline border inside, radius 8, 12px padding and gap; 60 tall.
        expect(style.backgroundColor).toBe(canvas);
        expect(row.getBoundingClientRect().height).toBe(60);
        expect(style.boxShadow).toContain(w.edge);
        expect(style.borderTopLeftRadius).toBe('8px');
        expect(style.paddingTop).toBe('12px');
        expect(style.columnGap).toBe('12px');
        // Status Icon: a 36px circle on the tonal surface, the 24px glyph in its content colour.
        const icon = row.querySelector<HTMLElement>('[data-part="status-icon"]')!;
        expect(getComputedStyle(icon).backgroundColor).toBe(w.surface);
        expect(icon.getBoundingClientRect().width).toBe(36);
        expect(getComputedStyle(icon.querySelector('svg')!).color).toBe(w.content);
        expect(icon.querySelector('svg')!.getBoundingClientRect().width).toBe(24);
        // Date text.primary; Subtitle text.subtle (Done) or the warning content (Upcoming).
        const [date, subtitle] = Array.from(row.children[1].children);
        expect(getComputedStyle(date).color).toBe(primary);
        expect(getComputedStyle(subtitle).color).toBe(w.subtitle);
        // Amount: Body/sm-semibold, text.primary, on one line, between the text and the status.
        const amount = row.querySelector<HTMLElement>('[data-part="amount"]')!;
        const a = getComputedStyle(amount);
        expect(amount.textContent).toBe('USD 900');
        expect(a.color).toBe(primary);
        expect({ fontSize: a.fontSize, lineHeight: a.lineHeight, fontWeight: a.fontWeight }).toEqual(amountType);
        expect(a.whiteSpace).toBe('nowrap');
        expect(amount.previousElementSibling).toBe(row.children[1]);
        // Status: a Tag (Show Icon off) with the same tonal pair, Label/sm-medium, 4 / 12 padding, 25 high.
        const tag = row.querySelector<HTMLElement>('[data-part="status"]')!;
        const t = getComputedStyle(tag);
        expect(tag.previousElementSibling).toBe(amount);
        expect(tag.textContent).toBe(w.label);
        expect(tag.querySelector('svg')).toBeNull();
        expect(t.backgroundColor).toBe(w.surface);
        expect(t.color).toBe(w.content);
        expect({ fontSize: t.fontSize, lineHeight: t.lineHeight, fontWeight: t.fontWeight }).toEqual(tagType);
        expect(t.padding).toBe('4px 12px');
      }
    });
  },
});

export const StatusesLight = grid('light');
export const StatusesDark = grid('dark');
