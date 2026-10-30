import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { UserGreeting } from './UserGreeting';

const meta = {
  title: 'Components/UserGreeting',
  component: UserGreeting,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Navigation** (`Navigation / User Greeting`): the “Hi, {name}” at the ' +
          'right of the top bar. Figma’s Username is `username`, the name alone; the component writes “Hi, ” before it. ' +
          'Body/sm-regular in `text.secondary`, on one line. UserActions puts it before the theme toggle and the account icon.',
      },
    },
  },
  args: { username: 'QA Test' },
} satisfies Meta<typeof UserGreeting>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's default: "Hi, QA Test". */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Hi, QA Test')).toBeInTheDocument();
  },
};

/* ── In Light and Dark ─────────────────────────────────────────────────────
   Figma's one state, with a short and a long name. Checked against the text
   layer's bindings: text.secondary, Body/sm-regular, hugging on one line. */

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

/* The type a utility class sets: size, line height, weight. */
function utilityType(className: string) {
  const probe = document.createElement('span');
  probe.className = className;
  document.body.append(probe);
  const { fontSize, lineHeight, fontWeight } = getComputedStyle(probe);
  probe.remove();
  return { fontSize, lineHeight, fontWeight };
}

const NAMES = ['QA Test', 'Admin Account', 'Maximilian Alexander von Habsburg-Lothringen'];

const themed = (theme: 'light' | 'dark'): Story => ({
  name: `Greeting — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    /* Narrower than the long name, to show it stays on one line (Figma: Hug × Hug). */
    <div className="flex w-64 flex-col items-start gap-4">
      {NAMES.map((name) => (
        <UserGreeting key={name} username={name} data-greeting="" />
      ))}
    </div>
  ),
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = { colour: tokenColour('text-secondary'), type: utilityType('text-body-sm-regular') };
    await waitFor(() => {
      const greetings = canvasElement.querySelectorAll<HTMLElement>('[data-greeting]');
      expect([...greetings].map((g) => g.textContent)).toEqual(NAMES.map((name) => `Hi, ${name}`));
      for (const greeting of greetings) {
        const style = getComputedStyle(greeting);
        expect(style.color).toBe(want.colour);
        expect({ fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight }).toEqual(want.type);
        // One line: its height is one Body/sm line.
        expect(greeting.getBoundingClientRect().height).toBe(parseFloat(want.type.lineHeight));
      }
    });
  },
});

export const GreetingLight = themed('light');
export const GreetingDark = themed('dark');
