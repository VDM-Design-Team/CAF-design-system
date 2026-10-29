import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Pagination, pageWindow } from './Pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    docs: {
      description: {
        component:
          'Built from the CAF Figma library, page **Pagination** (`Pagination`): an optional “Page X of Y” label, ' +
          'the ‹ / › arrows, the page numbers and a … gap. `page` and `pageCount` set the items; `onPageChange` gets ' +
          'the page to show. Page Info is `pageInfo`; Show Page Info is `showPageInfo` (default true).',
      },
    },
  },
  args: { page: 1, pageCount: 25, onPageChange: fn() },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's example: page 1 of 25. ‹ is disabled; 1 is the current page. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: 'Page 3' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(3);
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(2);
  },
};

function Stateful({ pageCount }: { pageCount: number }) {
  const [page, setPage] = useState(1);
  return <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />;
}

/** Click through it: the window of numbers moves with the page, with a … gap at either end. */
export const ClickThrough: Story = {
  render: () => <Stateful pageCount={25} />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: 'Next page' });
    for (let i = 0; i < 9; i++) await userEvent.click(next);
    await expect(canvas.getByText('Page 10 of 25')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Page 10' })).toHaveAttribute('aria-current', 'page');
    // 1 … 9 10 11 … 25
    const pages = canvas.getAllByRole('button', { name: /^Page \d+$/ }).map((b) => b.textContent);
    await expect(pages).toEqual(['1', '9', '10', '11', '25']);
    await userEvent.click(canvas.getByRole('button', { name: 'Page 25' }));
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeDisabled();
  },
};

/** The window at the start, in the middle and at the end, and a short table with no gap. */
export const Windows: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {/* Several bars on one page each need their own name (axe: landmark-unique). */}
      <Pagination {...args} page={1} pageCount={25} aria-label="Pagination, first page" />
      <Pagination {...args} page={12} pageCount={25} aria-label="Pagination, middle page" />
      <Pagination {...args} page={25} pageCount={25} aria-label="Pagination, last page" />
      <Pagination {...args} page={2} pageCount={4} showPageInfo={false} aria-label="Pagination, short table" />
    </div>
  ),
  parameters: { controls: { disable: true } },
  play: async () => {
    await expect(pageWindow(1, 25)).toEqual([1, 2, 3, 4, 5, 'gap', 25]);
    await expect(pageWindow(12, 25)).toEqual([1, 'gap', 11, 12, 13, 'gap', 25]);
    await expect(pageWindow(25, 25)).toEqual([1, 'gap', 21, 22, 23, 24, 25]);
    await expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  },
};

const themed = (theme: 'light' | 'dark'): Story => ({
  name: theme === 'light' ? 'Light' : 'Dark',
  globals: { theme },
  parameters: { controls: { disable: true } },
  // The theme is set on <html>, so a Dark story would flip the whole docs page.
  tags: theme === 'dark' ? ['!autodocs'] : [],
});

export const Light = themed('light');
export const Dark = themed('dark');
