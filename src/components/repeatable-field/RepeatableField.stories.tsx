import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { TextField } from '../text-field';
import { RepeatableField, type RepeatableFieldProps } from './RepeatableField';

const meta = {
  title: 'Components/RepeatableField',
  component: RepeatableField,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Form / Repeatable Field` and its `Form / Repeatable ' +
          'Field Row`): a `_Form Label`, one row per entry (a `_Text Input` and a destructive trash `Button / Icon`), ' +
          'and an outlined “Add …” `Button / Small`. Placed as “Features” in the Create Announcement pattern. ' +
          '`values` / `defaultValues` / `onValuesChange` hold the list; every row submits `name` with the form; ' +
          '`min` hides the remove buttons and `max` disables the add button. Adding a row focuses it; removing one ' +
          'focuses its neighbour. The ref is the `<fieldset>`.',
      },
    },
  },
  args: {
    label: 'Features',
    required: true,
    addLabel: 'Add Feature',
    name: 'features',
    defaultValues: ['one', 'two', 'three'],
    placeholder: 'Feature',
    onValuesChange: fn(),
  },
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    values: { control: false },
    rowLabel: { control: false },
    removeLabel: { control: false },
  },
  decorators: [
    (Story) => (
      // Figma's Repeatable Field is 510 wide; the Create Announcement pattern sets it to Fill.
      <div className="w-128">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RepeatableField>;

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

/* The stroke drawn inside the edge (Tailwind's inset-ring), as computed box-shadow text. */
const insetStroke = (colour: string, width: 1 | 2) => `${colour} 0px 0px 0px ${width}px inset`;

const values = (canvas: ReturnType<typeof within>) =>
  canvas.queryAllByRole('textbox').map((input: HTMLElement) => (input as HTMLInputElement).value);

/** As Figma places it: “Features”, three rows and “Add Feature”. The legend names the group; each row is named by its place. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Features' })).toBeInTheDocument();
    const inputs = canvas.getAllByRole('textbox');
    await expect(inputs.map((input: HTMLElement) => input.getAttribute('aria-label'))).toEqual([
      'Features 1',
      'Features 2',
      'Features 3',
    ]);
    for (const input of inputs) await expect(input).toBeRequired();
    await expect(canvas.getAllByRole('button', { name: /^Remove Features/ })).toHaveLength(3);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Features 2' }), '!');
    await expect(args.onValuesChange).toHaveBeenLastCalledWith(['one', 'two!', 'three']);
  },
};

/**
 * Adding focuses the new row's input. Removing focuses the input that takes the removed row's place, or the one
 * before it when the last row goes. With the keyboard: Tab reaches each row's remove button, then the add button.
 */
export const AddAndRemove: Story = {
  name: 'Add and remove',
  play: async ({ args, canvas }) => {
    // Add: a fourth, empty row, focused.
    await userEvent.click(canvas.getByRole('button', { name: 'Add Feature' }));
    await expect(args.onValuesChange).toHaveBeenLastCalledWith(['one', 'two', 'three', '']);
    const fourth = canvas.getByRole('textbox', { name: 'Features 4' });
    await waitFor(() => expect(fourth).toHaveFocus());
    await userEvent.keyboard('four');
    await expect(values(canvas)).toEqual(['one', 'two', 'three', 'four']);

    // Remove the second: the third moves up into its place and takes focus.
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Features 2' }));
    await expect(values(canvas)).toEqual(['one', 'three', 'four']);
    await waitFor(() => expect(canvas.getByRole('textbox', { name: 'Features 2' })).toHaveFocus());
    await expect(canvas.getByRole('textbox', { name: 'Features 2' })).toHaveValue('three');

    // Remove the last: focus goes to the row before it.
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Features 3' }));
    await expect(values(canvas)).toEqual(['one', 'three']);
    await waitFor(() => expect(canvas.getByRole('textbox', { name: 'Features 2' })).toHaveFocus());

    // Keyboard: Tab to the focused row's remove button, Enter removes it. One row is left and the
    // field is required, so the remove buttons go (Show Remove off) and focus lands on that row.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Remove Features 2' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(values(canvas)).toEqual(['one']);
    await expect(canvas.queryAllByRole('button', { name: /^Remove/ })).toHaveLength(0);
    await waitFor(() => expect(canvas.getByRole('textbox', { name: 'Features 1' })).toHaveFocus());

    // Tab reaches the add button; Space adds a row and focuses it.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Add Feature' })).toHaveFocus();
    await userEvent.keyboard(' ');
    await waitFor(() => expect(canvas.getByRole('textbox', { name: 'Features 2' })).toHaveFocus());
    await expect(values(canvas)).toEqual(['one', '']);
  },
};

/** `min` and `max`: the remove buttons hide at `min` rows (Figma’s Show Remove), and the add button is disabled at `max`. */
export const MinAndMax: Story = {
  name: 'Min and max',
  args: { required: false, min: 2, max: 4 },
  play: async ({ canvas }) => {
    const add = canvas.getByRole('button', { name: 'Add Feature' });
    await userEvent.click(add);
    await expect(canvas.getAllByRole('textbox')).toHaveLength(4);
    await expect(add).toBeDisabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Remove Features 1' }));
    await expect(add).toBeEnabled();
    await expect(canvas.getAllByRole('button', { name: /^Remove/ })).toHaveLength(3);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Features 1' }));
    await expect(values(canvas)).toEqual(['three', '']);
    await expect(canvas.queryAllByRole('button', { name: /^Remove/ })).toHaveLength(0);
  },
};

/** Optional and empty (`defaultValues={[]}`): just the label and the add button. Removing the only row focuses the add button. */
export const Empty: Story = {
  args: { required: false, defaultValues: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryAllByRole('textbox')).toHaveLength(0);
    const add = canvas.getByRole('button', { name: 'Add Feature' });
    await userEvent.click(add);
    const first = canvas.getByRole('textbox', { name: 'Features 1' });
    await waitFor(() => expect(first).toHaveFocus());
    await expect(first).not.toBeRequired();
    await expect(first).toHaveAttribute('placeholder', 'Feature');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Features 1' }));
    await expect(canvas.queryAllByRole('textbox')).toHaveLength(0);
    await waitFor(() => expect(add).toHaveFocus());
  },
};

/** `disabled` is the fieldset’s own: every input and button in it is disabled, and none is submitted. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    for (const input of canvas.getAllByRole('textbox')) await expect(input).toBeDisabled();
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Add Feature' }), { pointerEventsCheck: 0 });
    await expect(canvas.getAllByRole('textbox')).toHaveLength(3);
    await expect(args.onValuesChange).not.toHaveBeenCalled();
  },
};

function ControlledFeatures(props: Pick<RepeatableFieldProps, 'onValuesChange'>) {
  const [features, setFeatures] = useState<string[]>(['Dark mode']);
  return (
    <div className="flex flex-col gap-3">
      <RepeatableField
        label="Features"
        required
        addLabel="Add Feature"
        values={features}
        onValuesChange={(next) => {
          props.onValuesChange?.(next);
          setFeatures(next);
        }}
      />
      <Button variant="text" size="small" className="self-start" onClick={() => setFeatures([''])}>
        Clear features
      </Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="features">
        {JSON.stringify(features)}
      </output>
    </div>
  );
}

/** Controlled (`values` + `onValuesChange`): the parent holds the list, and can replace it from outside. */
export const Controlled: Story = {
  render: (args) => <ControlledFeatures onValuesChange={args.onValuesChange} />,
  parameters: { controls: { disable: true } },
  play: async ({ canvas }) => {
    const output = canvas.getByTestId('features');
    await userEvent.type(canvas.getByRole('textbox', { name: 'Features 1' }), ' for tables');
    await expect(output).toHaveTextContent('["Dark mode for tables"]');
    await userEvent.click(canvas.getByRole('button', { name: 'Add Feature' }));
    await waitFor(() => expect(canvas.getByRole('textbox', { name: 'Features 2' })).toHaveFocus());
    await userEvent.keyboard('Bulk upload');
    await expect(output).toHaveTextContent('["Dark mode for tables","Bulk upload"]');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear features' }));
    await expect(values(canvas)).toEqual(['']);
    await expect(output).toHaveTextContent('[""]');
  },
};

/* ── A real form ───────────────────────────────────────────────────────────
   The Create Announcement pattern's Title and Features, submitted with FormData. */

function CreateAnnouncementForm() {
  const [submitted, setSubmitted] = useState<{ title: FormDataEntryValue | null; features: FormDataEntryValue[] } | null>(
    null,
  );
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted({ title: data.get('title'), features: data.getAll('features') });
      }}
    >
      <TextField label="Title" name="title" required defaultValue="Welcome to the new update for CAF" />
      <RepeatableField
        label="Features"
        name="features"
        required
        addLabel="Add Feature"
        defaultValues={['one', 'two', 'three']}
      />
      <Button type="submit" className="self-start">
        Create
      </Button>
      <output className="text-caption-md-regular text-text-secondary" data-testid="submitted">
        {submitted ? JSON.stringify(submitted) : 'Nothing submitted yet'}
      </output>
    </form>
  );
}

/**
 * Every row submits `name`, so FormData has one `features` entry per row, in order. A required list's empty row
 * stops the submit (the browser’s own check), and a removed row is no longer sent.
 */
export const SubmitsWithForm: Story = {
  render: () => <CreateAnnouncementForm />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole('button', { name: 'Create' });
    const output = canvas.getByTestId('submitted');

    // A new, empty row in a required list: the browser stops the submit and focuses it.
    await userEvent.click(canvas.getByRole('button', { name: 'Add Feature' }));
    const fourth = canvas.getByRole('textbox', { name: 'Features 4' });
    await userEvent.click(submit);
    await expect(output).toHaveTextContent('Nothing submitted yet');
    await expect(fourth).toBeInvalid();
    await expect(fourth).toHaveFocus();

    await userEvent.type(fourth, 'four');
    await userEvent.click(submit);
    await waitFor(() => expect(output).not.toHaveTextContent('Nothing submitted yet'));
    await expect(JSON.parse(output.textContent!)).toEqual({
      title: 'Welcome to the new update for CAF',
      features: ['one', 'two', 'three', 'four'],
    });

    await userEvent.click(canvas.getByRole('button', { name: 'Remove Features 2' }));
    await userEvent.click(submit);
    await waitFor(() =>
      expect(JSON.parse(output.textContent!)).toEqual({
        title: 'Welcome to the new update for CAF',
        features: ['one', 'three', 'four'],
      }),
    );
  },
};

/* ── Every state, in Light and Dark ────────────────────────────────────────
   The field as Figma draws it, at rest and with its buttons hovered (forced with
   storybook-addon-pseudo-states), an empty row at `min` (Default, Show Remove off),
   and a full list (`max`: the add button disabled). */

const FIELDS = [
  { state: 'Rest', props: { defaultValues: ['one', 'two', 'three'] }, filled: true, remove: true, add: 'rest' },
  { state: 'Hover', props: { defaultValues: ['one', 'two', 'three'] }, filled: true, remove: true, add: 'hover' },
  { state: 'Default', props: { defaultValues: [''], min: 1 }, filled: false, remove: false, add: 'rest' },
  { state: 'Max', props: { defaultValues: ['one', 'two'], max: 2 }, filled: true, remove: true, add: 'disabled' },
] as const;

const grid = (theme: 'light' | 'dark'): Story => ({
  name: `States — ${theme === 'light' ? 'Light' : 'Dark'}`,
  render: () => (
    // No colour transition in the grid, so the check reads the end colour, not a frame of the fade.
    <div className="flex flex-col gap-8 [&_button]:transition-none">
      {FIELDS.map(({ state, props }) => (
        <RepeatableField
          key={state}
          {...props}
          label={`${state} features`}
          required={state === 'Rest' || state === 'Hover'}
          addLabel="Add Feature"
          placeholder="Feature"
          data-state={state}
          data-pseudo={state === 'Hover' ? 'hover' : undefined}
        />
      ))}
    </div>
  ),
  globals: { theme },
  parameters: {
    controls: { disable: true },
    // rootSelector: Vitest doesn't render into #storybook-root, the addon's default.
    pseudo: { rootSelector: 'body', hover: ['[data-pseudo="hover"] button'] },
  },
  // The theme is set on <html>, so a Dark grid would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  // Checked in afterEach, not play: pseudo-states applies the forced Hover on
  // STORY_RENDERED, which comes after play.
  afterEach: async ({ canvasElement }) => {
    const none = 'rgba(0, 0, 0, 0)';
    const c = {
      label: tokenColour('text-secondary'),
      marker: tokenColour('accent-critical-tonal-content-default'),
      fill: tokenColour('surface-elevated-secondary'),
      stroke: insetStroke(tokenColour('stroke-subtle'), 1),
      value: tokenColour('text-primary'),
      placeholder: tokenColour('text-subtle'),
      glyph: tokenColour('accent-critical-tonal-content-default'),
      removeHover: tokenColour('accent-critical-tonal-surface-default'),
      add: {
        rest: [
          tokenColour('action-secondary-surface-default'),
          tokenColour('action-secondary-content-default'),
          tokenColour('action-secondary-border-default'),
        ],
        hover: [
          tokenColour('action-secondary-surface-hover'),
          tokenColour('action-secondary-content-hover'),
          tokenColour('action-secondary-border-hover'),
        ],
        disabled: [
          tokenColour('action-secondary-surface-disabled'),
          tokenColour('action-secondary-content-disabled'),
          tokenColour('action-secondary-border-disabled'),
        ],
      },
    };
    await waitFor(
      () => {
        for (const { state, filled, remove, add } of FIELDS) {
          const field = canvasElement.querySelector<HTMLFieldSetElement>(`fieldset[data-state="${state}"]`)!;
          const hovered = state === 'Hover';

          // _Form Label: Body/sm-regular in text.secondary, the marker when Required.
          const legend = field.querySelector('legend')!;
          expect(getComputedStyle(legend).color).toBe(c.label);
          expect(getComputedStyle(legend).fontSize).toBe('14px');
          const star = legend.querySelector('[aria-hidden]');
          if (hovered || state === 'Rest') expect(getComputedStyle(star!).color).toBe(c.marker);
          else expect(star).toBeNull();

          // The column: label, rows and add button, space.8 apart. The legend carries its 8 as
          // bottom padding (a fieldset's legend isn't a flex item), and the first row starts right under it.
          const inputs = [...field.querySelectorAll('input')];
          const addButton = [...field.querySelectorAll('button')].at(-1)!;
          const boxes = [...inputs.map((input) => input.parentElement!), addButton].map((el) =>
            el.getBoundingClientRect(),
          );
          expect(getComputedStyle(legend).paddingBottom).toBe('8px');
          expect(boxes[0].top).toBe(legend.getBoundingClientRect().bottom);
          for (let i = 1; i < boxes.length; i++) expect(boxes[i].top - boxes[i - 1].bottom).toBe(8);

          for (const input of inputs) {
            // _Text Input, State=Filled (or Default): the TextInput bindings.
            const style = getComputedStyle(input);
            expect(style.backgroundColor).toBe(c.fill);
            expect(style.boxShadow).toContain(c.stroke);
            expect(filled ? style.color : getComputedStyle(input, '::placeholder').color).toBe(
              filled ? c.value : c.placeholder,
            );
            expect(input.getBoundingClientRect().height).toBe(40);

            // Remove: Button / Icon, 40, Destructive, space.8 after the input (Show Remove).
            const button = input.parentElement!.querySelector('button');
            if (!remove) {
              expect(button).toBeNull();
              continue;
            }
            expect(button!.getBoundingClientRect().left - input.getBoundingClientRect().right).toBe(8);
            expect(button!.getBoundingClientRect().width).toBe(40);
            expect(getComputedStyle(button!).backgroundColor).toBe(hovered ? c.removeHover : none);
            const glyph = button!.querySelector('svg')!;
            expect(getComputedStyle(glyph).color).toBe(c.glyph);
            expect(glyph.getBoundingClientRect().width).toBe(20);
          }

          // Add Button: Button / Small, Outlined, with the Plus glyph.
          const [surface, content, border] = c.add[add];
          const addStyle = getComputedStyle(addButton);
          expect(addStyle.backgroundColor).toBe(surface);
          expect(addStyle.color).toBe(content);
          expect(addStyle.boxShadow).toContain(insetStroke(border, 1));
          expect(addButton.getBoundingClientRect().height).toBe(32);
          expect(addButton.querySelector('svg')!.getBoundingClientRect().width).toBe(16);
          expect(addButton.getBoundingClientRect().left).toBe(field.getBoundingClientRect().left);
        }
      },
      { timeout: 3000 },
    );
  },
});

export const StatesLight = grid('light');
export const StatesDark = grid('dark');
