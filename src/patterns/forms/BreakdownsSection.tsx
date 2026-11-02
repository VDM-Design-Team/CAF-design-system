import * as React from 'react';
import { Alert } from '../../components/alert';
import { BreakdownItem } from '../../components/breakdown-item';
import { Button } from '../../components/button';
import { FormSectionHeader } from '../../components/form-section-header';
import { Icon } from '../../components/icon';
import { MenuItem } from '../../components/menu-item';
import type { CostBreakdown } from '../fixtures';
import { CostBreakdownDialog } from './CostBreakdownDialog';

/**
 * BreakdownsSection — a story-level organism, not a DS component: the
 * Breakdowns part of Form / New Cost (184:3263) and of the Edit Recurring Cost
 * side sheet (524:3295). A `Form / Section Header – Action` ("Breakdowns",
 * "Add new"), then a Card / Breakdown Item for each saved breakdown, each with
 * a ••• menu to edit or remove it (pattern 09: "Each saved breakdown appears
 * as a Card / Breakdown Item with a ••• menu to edit or remove it").
 *
 * - "Add new" opens the CostBreakdownDialog; "Edit" opens it pre-filled.
 * - "Remove" takes the breakdown out at once (it isn't saved yet, so there is
 *   nothing to confirm) and moves focus to the next item's •••, or to "Add new".
 * - With `name`, each breakdown is a hidden input (its JSON), so the form's
 *   FormData carries them: `data.getAll(name)`.
 * - `error` ("Add at least one breakdown.") shows as a compact error Alert
 *   under the header, and `addRef` lets the form focus "Add new".
 */
export interface BreakdownsSectionProps {
  breakdowns: readonly CostBreakdown[];
  onBreakdownsChange: (breakdowns: CostBreakdown[]) => void;
  /** The cost's currency code, shown before each amount ("USD 900"). */
  currency?: string | null;
  /** The hidden inputs' name. */
  name?: string;
  /** The section title's heading level: 2 on a page, 3 in a side sheet. */
  headingLevel?: 2 | 3;
  error?: string;
  /** The "Add new" button, for focusing it on an error. */
  addRef?: React.Ref<HTMLButtonElement>;
  /** Start with the dialog open (an Add). */
  defaultDialogOpen?: boolean;
  /** The calendars' today. */
  today?: Date;
}

const amountLabel = (currency: string | null | undefined, amount: number) => (currency ? `${currency} ${amount}` : String(amount));

export function BreakdownsSection({
  breakdowns,
  onBreakdownsChange,
  currency,
  name,
  headingLevel = 2,
  error,
  addRef,
  defaultDialogOpen = false,
  today,
}: BreakdownsSectionProps) {
  /* null: closed; 'new': adding; a number: editing that index. */
  const [editing, setEditing] = React.useState<'new' | number | null>(defaultDialogOpen ? 'new' : null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const ownAddRef = React.useRef<HTMLButtonElement | null>(null);
  const focusAfterRemove = React.useRef<number | null>(null);

  React.useEffect(() => {
    const index = focusAfterRemove.current;
    if (index === null) return;
    focusAfterRemove.current = null;
    const triggers = listRef.current?.querySelectorAll<HTMLButtonElement>('[aria-haspopup="menu"]') ?? [];
    if (triggers.length) triggers[Math.min(index, triggers.length - 1)].focus();
    else ownAddRef.current?.focus();
  });

  const setAddRef = (node: HTMLButtonElement | null) => {
    ownAddRef.current = node;
    if (typeof addRef === 'function') addRef(node);
    else if (addRef) (addRef as React.RefObject<HTMLButtonElement | null>).current = node;
  };

  return (
    <div className="flex flex-col gap-3">
      <FormSectionHeader
        title="Breakdowns"
        headingLevel={headingLevel}
        action={
          <Button ref={setAddRef} size="small" variant="text" leftIcon={<Icon name="plus" />} onClick={() => setEditing('new')}>
            Add new
          </Button>
        }
      />
      {error && <Alert type="error" size="compact" message={error} />}
      {breakdowns.length > 0 && (
        <ul ref={listRef} aria-label="Breakdowns" className="flex flex-col gap-3">
          {breakdowns.map((line, index) => (
            <li key={`${index}-${line.title}`}>
              <BreakdownItem
                title={line.title}
                meta={[line.costCentre, line.natureOfService, line.location].join(' · ')}
                period={`${line.periodFrom} - ${line.periodTo}`}
                amount={amountLabel(currency, line.amount)}
                actionsLabel={`Actions for ${line.title}`}
                actions={
                  <>
                    <MenuItem onClick={() => setEditing(index)}>Edit</MenuItem>
                    <MenuItem
                      destructive
                      onClick={() => {
                        focusAfterRemove.current = index;
                        onBreakdownsChange(breakdowns.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </MenuItem>
                  </>
                }
              />
              {name && <input type="hidden" name={name} value={JSON.stringify(line)} />}
            </li>
          ))}
        </ul>
      )}
      <CostBreakdownDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        breakdown={typeof editing === 'number' ? breakdowns[editing] : null}
        today={today}
        onSave={(line) => {
          onBreakdownsChange(
            typeof editing === 'number' ? breakdowns.map((old, i) => (i === editing ? line : old)) : [...breakdowns, line],
          );
          setEditing(null);
        }}
      />
    </div>
  );
}
