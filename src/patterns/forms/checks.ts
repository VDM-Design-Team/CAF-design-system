import { expect, waitFor, within } from 'storybook/test';

/**
 * What the form stories check about a form page's layout, shared by the
 * patterns (09 / U02, 10 / U05, U03, U06) and the Form page template: the
 * page's heading above a PanelCard that holds only the form (decisions
 * add-form-heading and add-card-panel), and the form's plain Dividers
 * (add-divider). The flows themselves are each story's own.
 */

/* Figma's form cards are 578 wide; the column is max-w-xl, 576. */
const COLUMN_MAX = 576;
/* Layout's Card / Panel example (765:15978): the heading, then the card 24 under it. */
const HEADER_TO_CARD = 24;

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

/**
 * The page's PageHeader (its `heading`) and, 24 under it, a PanelCard
 * (surface.base, a stroke.subtle edge, radius 12, 32 padding) with only the
 * form in it. The two share one column, at most 576 wide. Returns the card
 * and the column.
 */
export async function expectFormInCard(form: HTMLFormElement, heading: HTMLElement) {
  const fill = tokenColour('surface-base');
  const stroke = tokenColour('stroke-subtle');
  const card = form.parentElement!;
  const column = card.parentElement!;
  await expect(card.children).toHaveLength(1);
  await expect(card).not.toContainElement(heading);
  await expect(column).toContainElement(heading);
  await waitFor(() => {
    const style = getComputedStyle(card);
    expect(style.backgroundColor).toBe(fill);
    expect(style.boxShadow).toContain(stroke);
    expect(style.boxShadow).toContain('inset');
    expect(parseFloat(style.borderTopLeftRadius)).toBe(12);
    expect(parseFloat(style.paddingTop)).toBe(32);
    expect(parseFloat(style.paddingLeft)).toBe(32);
  });

  let header = heading;
  while (header.parentElement !== column) header = header.parentElement!;
  const headerBox = header.getBoundingClientRect();
  const cardBox = card.getBoundingClientRect();
  const columnBox = column.getBoundingClientRect();
  await expect(cardBox.top - headerBox.bottom).toBeCloseTo(HEADER_TO_CARD, 0);
  await expect(columnBox.width).toBeLessThanOrEqual(COLUMN_MAX + 0.5);
  await expect(cardBox.width).toBeCloseTo(columnBox.width, 0);
  await expect(headerBox.width).toBeCloseTo(columnBox.width, 0);
  // The form fills the card inside its padding.
  await expect(form.getBoundingClientRect().left - cardBox.left).toBeCloseTo(32, 0);
  await expect(cardBox.right - form.getBoundingClientRect().right).toBeCloseTo(32, 0);
  return { card, column };
}

/**
 * The form's plain Dividers, in order: each a horizontal separator as wide
 * as the fields, `gap` under the part before it and `gap` above the part
 * after it, which starts with the text in `before` (the section it opens).
 */
export async function expectDividers(form: HTMLFormElement, gap: number, before: string[]) {
  const rules = within(form).getAllByRole('separator');
  await expect(rules).toHaveLength(before.length);
  for (const [i, rule] of rules.entries()) {
    await expect(rule).toHaveAttribute('aria-orientation', 'horizontal');
    const previous = rule.previousElementSibling!.getBoundingClientRect();
    const next = rule.nextElementSibling!;
    const box = rule.getBoundingClientRect();
    await expect(next.textContent?.startsWith(before[i])).toBe(true);
    await expect(box.width).toBeCloseTo(previous.width, 0);
    await expect(box.top - previous.bottom).toBeCloseTo(gap, 0);
    await expect(next.getBoundingClientRect().top - box.bottom).toBeCloseTo(gap, 0);
  }
  return rules;
}
