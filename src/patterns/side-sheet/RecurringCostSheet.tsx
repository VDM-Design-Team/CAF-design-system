import * as React from 'react';
import { Button } from '../../components/button';
import { DateField } from '../../components/date-field';
import { FormSectionHeader } from '../../components/form-section-header';
import { ModalConfirm } from '../../components/modal-confirm';
import { SelectField } from '../../components/select-field';
import { SideSheet } from '../../components/side-sheet';
import { TextField } from '../../components/text-field';
import { TextareaField } from '../../components/textarea-field';
import {
  frequencyUnits,
  paymentMethods,
  type CostBreakdown,
  type FrequencyUnit,
  type PaymentMethod,
  type RecurringCost,
} from '../fixtures';
import { BreakdownsSection } from '../forms/BreakdownsSection';

/**
 * RecurringCostSheet — a story-level organism, not a DS component: pattern
 * 06's "Edit Recurring Cost #1882" (524:3295), a Panel / Side Sheet with the
 * record's sections in its Content slot.
 *
 * - "Recurring Details" (Form / Section Header, an `<h3>` under the sheet's
 *   title): Frequency Value and Frequency Unit (U02's fields; pattern 06 draws
 *   one "Frequency" dropdown, see docs/patterns.md), Starts At, Ends At and
 *   Payment Method, two to a row.
 * - Breakdowns (Section Header – Action and Card / Breakdown Items, with "Add
 *   new" opening the Cost Breakdown dialog over the sheet).
 * - Notes (Field – Textarea).
 * - Footer: Text "Cancel", Default "Update".
 *
 * Update checks the fields, shows the messages in place and focuses the first;
 * when they pass, `onUpdate` gets the values and the FormData. ×, Cancel and
 * Escape close without saving, but with unsaved changes they ask first
 * (pattern 06 step 5): a destructive Modal / Confirm, "Discard changes?",
 * whose Keep editing goes back to the sheet.
 */
export interface EditableRecurringCost extends RecurringCost {
  endsAt?: string;
  notes?: string;
}

export interface RecurringCostUpdate {
  frequency: { value: number; unit: FrequencyUnit };
  startsAt: string;
  endsAt?: string;
  paymentMethod: PaymentMethod;
  notes: string;
  breakdowns: CostBreakdown[];
}

export interface RecurringCostSheetProps {
  cost: EditableRecurringCost;
  open: boolean;
  /** Close it (after a save, a discard, or with nothing changed). */
  onClose: () => void;
  onUpdate: (update: RecurringCostUpdate, data: FormData) => void;
  /** The calendars' today. */
  today?: Date;
}

type Field = 'frequencyValue' | 'frequencyUnit' | 'startsAt' | 'endsAt' | 'paymentMethod' | 'breakdowns';
const ORDER: Field[] = ['frequencyValue', 'frequencyUnit', 'startsAt', 'endsAt', 'paymentMethod', 'breakdowns'];

export function RecurringCostSheet({ cost, open, onClose, onUpdate, today }: RecurringCostSheetProps) {
  const formId = `${React.useId()}-recurring`;
  const [breakdowns, setBreakdowns] = React.useState<CostBreakdown[]>(cost.breakdowns);
  const [dirty, setDirty] = React.useState(false);
  const [discarding, setDiscarding] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const refs: Record<Field, React.RefObject<HTMLElement | null>> = {
    frequencyValue: React.useRef(null),
    frequencyUnit: React.useRef(null),
    startsAt: React.useRef(null),
    endsAt: React.useRef(null),
    paymentMethod: React.useRef(null),
    breakdowns: React.useRef(null),
  };
  const setRef = (field: Field) => (node: HTMLElement | null) => {
    refs[field].current = node;
  };
  const changed = (field?: Field) => {
    setDirty(true);
    if (field) setErrors((all) => (all[field] ? { ...all, [field]: undefined } : all));
  };
  const requestClose = () => (dirty ? setDiscarding(true) : onClose());

  return (
    <>
      <SideSheet
        open={open}
        onClose={requestClose}
        title={`Edit Recurring Cost #${cost.id}`}
        footer={
          <>
            <Button variant="text" onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              Update
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-6"
          onChange={() => changed()}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const get = (name: string) => String(data.get(name) ?? '').trim();
            const every = Number(get('frequencyValue'));
            const found: Partial<Record<Field, string>> = {};
            if (!Number.isInteger(every) || every < 1) found.frequencyValue = 'Enter a whole number of 1 or more.';
            if (!get('frequencyUnit')) found.frequencyUnit = 'Frequency Unit is required.';
            if (!get('startsAt')) found.startsAt = 'Starts At is required.';
            if (get('endsAt') && get('startsAt') && get('endsAt') < get('startsAt'))
              found.endsAt = 'Ends At can’t be before Starts At.';
            if (!get('paymentMethod')) found.paymentMethod = 'Payment Method is required.';
            if (breakdowns.length === 0) found.breakdowns = 'Add at least one breakdown.';
            setErrors(found);
            const first = ORDER.find((field) => found[field]);
            if (first) {
              refs[first].current?.focus();
              return;
            }
            onUpdate(
              {
                frequency: { value: every, unit: get('frequencyUnit') as FrequencyUnit },
                startsAt: get('startsAt'),
                endsAt: get('endsAt') || undefined,
                paymentMethod: get('paymentMethod') as PaymentMethod,
                notes: get('notes'),
                breakdowns,
              },
              data,
            );
          }}
        >
          <div className="flex flex-col gap-4">
            <FormSectionHeader
              title="Recurring Details"
              description="How often this cost repeats and when it starts."
              headingLevel={3}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                ref={setRef('frequencyValue')}
                label="Frequency Value"
                name="frequencyValue"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={String(cost.frequency.value)}
                error={errors.frequencyValue}
                onChange={() => changed('frequencyValue')}
              />
              <SelectField
                ref={setRef('frequencyUnit')}
                label="Frequency Unit"
                name="frequencyUnit"
                required
                options={frequencyUnits}
                defaultValue={cost.frequency.unit}
                error={errors.frequencyUnit}
                onValueChange={() => changed('frequencyUnit')}
              />
              <DateField
                ref={setRef('startsAt')}
                label="Starts At"
                name="startsAt"
                required
                placeholder="Select date"
                defaultValue={cost.startsAt}
                today={today}
                error={errors.startsAt}
                onValueChange={() => changed('startsAt')}
              />
              <DateField
                ref={setRef('endsAt')}
                label="Ends At"
                name="endsAt"
                placeholder="Select date"
                defaultValue={cost.endsAt ?? null}
                today={today}
                error={errors.endsAt}
                onValueChange={() => changed('endsAt')}
              />
              <SelectField
                ref={setRef('paymentMethod')}
                label="Payment Method"
                name="paymentMethod"
                required
                options={paymentMethods}
                defaultValue={cost.paymentMethod}
                error={errors.paymentMethod}
                onValueChange={() => changed('paymentMethod')}
              />
            </div>
          </div>
          <BreakdownsSection
            headingLevel={3}
            breakdowns={breakdowns}
            onBreakdownsChange={(next) => {
              setBreakdowns(next);
              changed(next.length ? 'breakdowns' : undefined);
            }}
            currency={cost.currency}
            name="breakdown"
            error={errors.breakdowns}
            addRef={setRef('breakdowns')}
            today={today}
          />
          <TextareaField label="Notes" name="notes" rows={4} defaultValue={cost.notes} />
        </form>
      </SideSheet>
      <ModalConfirm
        open={discarding}
        type="destructive"
        title="Discard changes?"
        message={`Your changes to recurring cost #${cost.id} won’t be saved.`}
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onClose={() => setDiscarding(false)}
        onConfirm={() => {
          setDiscarding(false);
          onClose();
        }}
      />
    </>
  );
}
