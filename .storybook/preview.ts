import './storybook.css';
import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'CAF colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'sun',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    // The same switch CAF apps use: `.dark` on <html> applies dist/tokens.dark.css.
    // On <html>, not a wrapper, so portalled overlays are themed too.
    (Story, context) => {
      document.documentElement.classList.toggle('dark', context.globals.theme === 'dark');
      return Story();
    },
  ],
  parameters: {
    // Every story is an axe test, and a violation fails `npm test` (as in VCP).
    // The one exception is a component pair Figma binds below AA: a story
    // that shows it uses `a11y: { test: 'todo' }` and says where it's tracked.
    a11y: { test: 'error' },
    options: {
      storySort: { order: ['Components', ['Button']] },
    },
  },
};
export default preview;
