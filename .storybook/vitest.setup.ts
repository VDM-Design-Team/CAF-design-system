import { beforeEach } from 'vitest';
import { addons } from 'storybook/preview-api';
import { STORY_RENDERED } from 'storybook/internal/core-events';

// storybook-addon-pseudo-states rewrites :hover / :active rules into its
// forced-state classes when the preview emits STORY_RENDERED. Storybook and
// Chromatic emit it after every render; the Vitest runner does not. Emit it
// here, so story tests (and axe) see Hover and Pressed exactly as Storybook does.
beforeEach(() => {
  addons.getChannel().emit(STORY_RENDERED);
});
