import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { SelectOption } from '../select-option';
import { SelectMenu } from './SelectMenu';

/* Figma's example: Philippines chosen, then United States, United Kingdom, Romania, Hungary. */
const COUNTRIES = ['Philippines', 'United States', 'United Kingdom', 'Romania', 'Hungary'] as const;

const meta = {
  title: 'Components/SelectMenu',
  component: SelectMenu,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Form** (`Select / Menu`): the open list of a select, a ' +
          '`role="listbox"` of SelectOptions on the CAF overlay surface (surface/neutral/faint, a 1px stroke/subtle ' +
          'stroke inside, radius 8, Elevation 3, 6px padding, 2px between options). Select shows it under its trigger; ' +
          'on its own it is the list for a control that positions it and handles the keys itself. Past 256px it ' +
          'scrolls. Name it with `aria-label` or `aria-labelledby`.',
      },
    },
  },
  args: { 'aria-label': 'Country' },
  render: (args) => (
    <SelectMenu {...args} className="w-72">
      {COUNTRIES.map((country, i) => (
        <SelectOption key={country} selected={i === 0}>
          {country}
        </SelectOption>
      ))}
    </SelectMenu>
  ),
} satisfies Meta<typeof SelectMenu>;

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

/* The shadow a utility class sets, as computed text. */
function utilityShadow(className: string) {
  const probe = document.createElement('span');
  probe.className = className;
  document.body.append(probe);
  const value = getComputedStyle(probe).boxShadow;
  probe.remove();
  return value;
}

/* ── Figma's Select / Menu, in Light and Dark ──────────────────────────────
   Checked against its bindings and its auto layout. */

const menu = (theme: 'light' | 'dark'): Story => ({
  name: `Menu — ${theme === 'light' ? 'Light' : 'Dark'}`,
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
  play: async ({ canvasElement }) => {
    const want = {
      fill: tokenColour('surface-neutral-faint'),
      stroke: tokenColour('stroke-subtle'),
      selected: tokenColour('surface-base'),
      label: tokenColour('text-primary'),
      elevation: utilityShadow('shadow-elevation-3'),
    };
    const list = within(canvasElement).getByRole('listbox', { name: 'Country' });
    const options = within(list).getAllByRole('option');
    await expect(options.map((o) => o.textContent)).toEqual([...COUNTRIES]);
    await expect(within(list).getByRole('option', { selected: true })).toHaveTextContent('Philippines');

    const style = getComputedStyle(list);
    // Fill surface.neutral.faint; radius 8; 1px stroke.subtle inside, on top of Elevation 3.
    await expect(style.backgroundColor).toBe(want.fill);
    await expect(style.borderRadius).toBe('8px');
    await expect(style.boxShadow).toContain(`${want.stroke} 0px 0px 0px 1px inset`);
    for (const layer of want.elevation.split(/,(?![^(]*\))/)) await expect(style.boxShadow).toContain(layer.trim());
    // Auto layout: 6 padding, 2 between options, options fill the width.
    await expect(style.padding).toBe('6px');
    const box = list.getBoundingClientRect();
    const first = options[0].getBoundingClientRect();
    await expect(first.left - box.left).toBeCloseTo(6, 1);
    await expect(first.width).toBeCloseTo(box.width - 12, 1);
    await expect(options[1].getBoundingClientRect().top - first.bottom).toBeCloseTo(2, 1);
    // Five 36px options: 6 + 5 × 36 + 4 × 2 + 6 = 200, the height Figma's menu would have.
    await expect(box.height).toBeCloseTo(200, 1);
    // Selected: surface.base; the rest have no fill. Every label: text.primary.
    await expect(getComputedStyle(options[0]).backgroundColor).toBe(want.selected);
    for (const option of options.slice(1)) await expect(getComputedStyle(option).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    for (const option of options) await expect(getComputedStyle(option).color).toBe(want.label);
  },
});

export const MenuLight = menu('light');
export const MenuDark = menu('dark');
