import * as React from 'react';
import { Button } from '../../components/button';
import { ComboboxField } from '../../components/combobox-field';
import { DateField } from '../../components/date-field';
import { ModalDialog } from '../../components/modal-dialog';
import { SelectField } from '../../components/select-field';
import { TextField } from '../../components/text-field';
import { costCentreNames, locations, natureOfServices, type CostBreakdown, type Location } from '../fixtures';

/**
 * CostBreakdownDialog — a story-level organism, not a DS component: the Cost
 * Breakdown dialog that Breakdowns → "Add new" opens (pattern 09 step 3,
 * 527:5473; U02 step 3, 545:18317). A Modal / Dialog (Medium) with the
 * breakdown's fields in its Content slot:
 *
 * - Title, Cost Center (Field – Dropdown), Nature of Service (Field –
 *   Dropdown), Location (Field – Combobox, "Select or type a location"),
 *   Period From and Period To side by side (Field – Date), Amount. All
 *   required, as pattern 09 marks them.
 * - Footer: Text "Cancel", Default "Add" (pattern 09's label; U02 draws
 *   "Submit", which pattern 05 rules out). Editing a breakdown says "Update".
 *
 * It validates on its own ("each one is validated on its own"): the primary
 * button checks every field, shows the messages in place, focuses the first
 * invalid field and keeps what was typed. When it passes, `onSave` gets the
 * breakdown; the owner closes the dialog. Focus starts on Title.
 */
export interface CostBreakdownDialogProps {
  open: boolean;
  /** Cancel, ×, Escape, a backdrop click. Set `open` to false. */
  onClose: () => void;
  /** Called with the valid breakdown. Close the dialog there. */
  onSave: (breakdown: CostBreakdown) => void;
  /** The breakdown being edited; leave it out to add one. */
  breakdown?: CostBreakdown | null;
  /** The calendars' today (stories pin it). */
  today?: Date;
}

type Field = 'title' | 'costCentre' | 'natureOfService' | 'location' | 'periodFrom' | 'periodTo' | 'amount';
type Errors = Partial<Record<Field, string>>;

const FIELD_ORDER: Field[] = ['title', 'costCentre', 'natureOfService', 'location', 'periodFrom', 'periodTo', 'amount'];

const LABEL: Record<Field, string> = {
  title: 'Title',
  costCentre: 'Cost Center',
  natureOfService: 'Nature of Service',
  location: 'Location',
  periodFrom: 'Period From',
  periodTo: 'Period To',
  amount: 'Amount',
};

/** The checks: every field required, the period in order, a positive amount. */
export function validateBreakdown(data: FormData): { errors: Errors; breakdown?: CostBreakdown } {
  const value = (field: Field) => String(data.get(field) ?? '').trim();
  const errors: Errors = {};
  for (const field of FIELD_ORDER) if (!value(field)) errors[field] = `${LABEL[field]} is required.`;
  if (!errors.periodFrom && !errors.periodTo && value('periodTo') < value('periodFrom'))
    errors.periodTo = 'Period To can’t be before Period From.';
  const amount = Number(value('amount').replace(/,/g, ''));
  if (!errors.amount && !(Number.isFinite(amount) && amount > 0)) errors.amount = 'Enter an amount greater than 0.';
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    breakdown: {
      title: value('title'),
      costCentre: value('costCentre'),
      natureOfService: value('natureOfService'),
      location: value('location') as Location,
      periodFrom: value('periodFrom'),
      periodTo: value('periodTo'),
      amount,
    },
  };
}

export function CostBreakdownDialog({ open, onClose, onSave, breakdown, today }: CostBreakdownDialogProps) {
  const formId = `${React.useId()}-breakdown`;
  const [errors, setErrors] = React.useState<Errors>({});
  const refs = {
    title: React.useRef<HTMLInputElement>(null),
    costCentre: React.useRef<HTMLButtonElement>(null),
    natureOfService: React.useRef<HTMLButtonElement>(null),
    location: React.useRef<HTMLInputElement>(null),
    periodFrom: React.useRef<HTMLButtonElement>(null),
    periodTo: React.useRef<HTMLButtonElement>(null),
    amount: React.useRef<HTMLInputElement>(null),
  };

  /* Each opening starts clean: the fields remount with the dialog, the messages go. */
  React.useEffect(() => {
    if (open) setErrors({});
  }, [open]);

  const clear = (field: Field) => setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  const editing = Boolean(breakdown);

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Cost Breakdown"
      size="medium"
      initialFocusRef={refs.title}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {editing ? 'Update' : 'Add'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="flex flex-col gap-4"
        /* The dialog is portalled, but React events still bubble to the form it sits in. */
        onChange={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const result = validateBreakdown(new FormData(event.currentTarget));
          setErrors(result.errors);
          const first = FIELD_ORDER.find((field) => result.errors[field]);
          if (first) {
            refs[first].current?.focus();
            return;
          }
          onSave(result.breakdown!);
        }}
      >
        <TextField
          ref={refs.title}
          label="Title"
          name="title"
          required
          placeholder="e.g. Breakdown 1"
          defaultValue={breakdown?.title}
          error={errors.title}
          onChange={() => clear('title')}
        />
        <SelectField
          ref={refs.costCentre}
          label="Cost Center"
          name="costCentre"
          required
          placeholder="Select cost center"
          options={costCentreNames}
          defaultValue={breakdown?.costCentre ?? null}
          error={errors.costCentre}
          onValueChange={() => clear('costCentre')}
        />
        <SelectField
          ref={refs.natureOfService}
          label="Nature of Service"
          name="natureOfService"
          required
          placeholder="Select nature of service"
          options={natureOfServices}
          defaultValue={breakdown?.natureOfService ?? null}
          error={errors.natureOfService}
          onValueChange={() => clear('natureOfService')}
        />
        <ComboboxField
          ref={refs.location}
          label="Location"
          name="location"
          required
          placeholder="Select or type a location"
          options={locations}
          defaultValue={breakdown && breakdown.location !== '-' ? breakdown.location : null}
          error={errors.location}
          onValueChange={() => clear('location')}
        />
        {/* Pattern 09 puts the period's two dates side by side. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateField
            ref={refs.periodFrom}
            label="Period From"
            name="periodFrom"
            required
            placeholder="Select date"
            defaultValue={breakdown?.periodFrom ?? null}
            today={today}
            error={errors.periodFrom}
            onValueChange={() => clear('periodFrom')}
          />
          <DateField
            ref={refs.periodTo}
            label="Period To"
            name="periodTo"
            required
            placeholder="Select date"
            defaultValue={breakdown?.periodTo ?? null}
            today={today}
            error={errors.periodTo}
            onValueChange={() => clear('periodTo')}
          />
        </div>
        <TextField
          ref={refs.amount}
          label="Amount"
          name="amount"
          required
          inputMode="decimal"
          placeholder="e.g. 900"
          defaultValue={breakdown ? String(breakdown.amount) : undefined}
          error={errors.amount}
          onChange={() => clear('amount')}
        />
      </form>
    </ModalDialog>
  );
}
