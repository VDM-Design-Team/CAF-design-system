import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Tag } from '../tag';
import { VersionBadge } from './VersionBadge';

const meta = {
  title: 'Components/VersionBadge',
  component: VersionBadge,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Modals** (`Modal / Version Badge`): the release number beside the ' +
          'date in the what’s-new dialog (ChangelogHeader). Figma’s Version is `children`. A `surface.base` pill with ' +
          'the version in Body/sm-semibold, `accent.info.tonal.content`; it sits on the dialog’s `surface.canvas`. ' +
          'It isn’t Tag Status=Info (the Announcements table’s version column), which is tinted and set in Label/sm.',
      },
    },
  },
  args: { children: 'v2.5.6' },
} satisfies Meta<typeof VersionBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/* ── The bindings, in Light and Dark ───────────────────────────────────────
   On the dialog's surface.canvas, as in Figma, beside the Tag it is not. */
const bindings = (theme: 'light' | 'dark'): Story => ({
  name: `Bindings — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    <div className="flex flex-col items-start gap-4 bg-surface-canvas p-4">
      <div className="flex items-center gap-3">
        <span className="text-caption-md-medium text-text-secondary">Version Badge</span>
        <VersionBadge data-testid="badge">v2.5.6</VersionBadge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-caption-md-medium text-text-secondary">Tag Status=Info, for comparison</span>
        <Tag status="info" showIcon={false}>
          v2.5.6
        </Tag>
      </div>
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-base'),
      text: tokenColour('accent-info-tonal-content-default'),
    };
    const badge = within(canvasElement).getByTestId('badge');
    await waitFor(() => {
      const style = getComputedStyle(badge);
      // surface.base fill; Version in Body/sm-semibold, accent.info.tonal.content.default.
      expect(style.backgroundColor).toBe(want.fill);
      expect(style.color).toBe(want.text);
      expect([style.fontSize, style.fontWeight, style.lineHeight]).toEqual(['14px', '600', '20px']);
      // 4px top and bottom, 12px sides; a full radius.
      expect([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]).toEqual([
        '4px',
        '12px',
        '4px',
        '12px',
      ]);
      expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(badge.getBoundingClientRect().height / 2);
      expect(badge).toHaveTextContent('v2.5.6');
    });
  },
});

export const BindingsLight = bindings('light');
export const BindingsDark = bindings('dark');
