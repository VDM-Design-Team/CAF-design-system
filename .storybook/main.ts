import type { StorybookConfig } from '@storybook/react-vite';

// GDL's Storybook setup (GDL-design-system/.storybook), plus what components
// need: the a11y and Vitest addons from VCP, and pseudo-states so Hover and
// Pressed can be shown, tested and snapshotted without a pointer.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    'storybook-addon-pseudo-states',
  ],
  framework: '@storybook/react-vite',
  async viteFinal(cfg) {
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    cfg.plugins = [...(cfg.plugins ?? []), tailwindcss()];
    return cfg;
  },
};
export default config;
