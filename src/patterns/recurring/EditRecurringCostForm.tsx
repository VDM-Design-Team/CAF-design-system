import * as React from 'react';
import { cn } from '../../lib/cn';
import { BreakdownItem } from '../../components/breakdown-item';
import { Button } from '../../components/button';
import { DateField } from '../../components/date-field';
import { FileUploadField } from '../../components/file-upload-field';
import { FormEditLink } from '../../components/form-edit-link';
import { FormHint } from '../../components/form-hint';
import { FormSectionHeader } from '../../components/form-section-header';
import { Icon } from '../../components/icon';
import { SelectField } from '../../components/select-field';
import { TextField } from '../../components/text-field';
import {
  currencies,
  formatAmount,
  formatFrequency,
  partners,
  paymentMethods,
  type Currency,
  type FrequencyUnit,
  type PaymentMethod,
  type RecurringCost,
} from '../fixtures';

/**
 * EditRecurringCostForm — a story-level composition, not a DS component: the
 * content of the "Edit Recurring Cost #1882" side sheet in U04 · Manage
 * recurring costs (Patterns – User 545:18695, step 4), built from DS form
 * components in Figma's order:
 *
 * - Recurring Details (Form / Section Header): Starts At, Frequency Value,
 *   Frequency Unit, and the line under them, "This will recur every 3 weeks"
 *   (545:19043): a FormHint, space.8 under the frequency fields, and a polite
 *   live region.
 * - Cost Details: Applicant name, Email, Currency (Field – Dropdown with
 *   Edit), Select Partner, Payment method.
 * - Beneficiary Information ("Use a permanent address where you can receive
 *   mail"): Beneficiary name, IBAN account number, Attach invoice.
 * - Breakdowns (Form / Section Header – Action, "Add new"): one Card /
 *   Breakdown Item per line.
 *
 * Stand-ins, each a design question in docs/patterns.md:
 * - Figma's Dividers between sections: there is no Divider component.
 *
 * It validates on submit (and clears an error as soon as the value is valid),
 * then reads the form's FormData and calls `onSave`. The footer's Update
 * button sits outside the form, in the side sheet's footer: give the form an
 * `id` and the button `type="submit" form={id}`.
 */

export interface RecurringCostUpdate {
  startsAt: string;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  applicantName: string;
  email: string;
  currency: Currency;
  partner: string;
  paymentMethod: PaymentMethod;
  beneficiaryName: string;
  iban: string;
}

export const FREQUENCY_UNITS: FrequencyUnit[] = ['Day', 'Week', 'Month'];

/* Pattern 12's field-error copy: say how to fix it. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHECKS = {
  frequencyValue: (v: string) => (/^\d+$/.test(v) && Number(v) >= 1 ? undefined : 'Enter a whole number, 1 or more.'),
  applicantName: (v: string) => (v.trim() ? undefined : 'Enter the applicant’s name.'),
  email: (v: string) => (EMAIL.test(v.trim()) ? undefined : 'Enter a valid email address, like name@company.com.'),
} as const;
type Checked = keyof typeof CHECKS;
type Errors = Partial<Record<Checked, string>>;

export interface EditRecurringCostFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'> {
  /** The recurring cost being edited: the fields start with its values. */
  cost: RecurringCost;
  /** Called with the form's values once they are valid. */
  onSave: (values: RecurringCostUpdate) => void;
  /** The day Starts At's calendar draws as Today. Stories pin it. */
  today?: Date;
}

export const EditRecurringCostForm = React.forwardRef<HTMLFormElement, EditRecurringCostFormProps>(function EditRecurringCostForm(
  { cost, onSave, today, className, ...form },
  ref,
) {
  const [frequencyValue, setFrequencyValue] = React.useState(String(cost.frequency.value));
  const [frequencyUnit, setFrequencyUnit] = React.useState<FrequencyUnit>(cost.frequency.unit);
  const [errors, setErrors] = React.useState<Errors>({});
  const formRef = React.useRef<HTMLFormElement | null>(null);

  /* An error clears as soon as its field is valid; a new one waits for the next submit. */
  const recheck = (name: Checked, value: string) => {
    if (errors[name] && !CHECKS[name](value)) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? '');
    const found: Errors = {};
    for (const name of Object.keys(CHECKS) as Checked[]) {
      const message = CHECKS[name](text(name));
      if (message) found[name] = message;
    }
    setErrors(found);
    const first = (Object.keys(CHECKS) as Checked[]).find((name) => found[name]);
    if (first) {
      /* Focus the first field to fix, in the form's order. */
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    onSave({
      startsAt: text('startsAt'),
      frequencyValue: Number(text('frequencyValue')),
      frequencyUnit: text('frequencyUnit') as FrequencyUnit,
      applicantName: text('applicantName').trim(),
      email: text('email').trim(),
      currency: text('currency') as Currency,
      partner: text('partner'),
      paymentMethod: text('paymentMethod') as PaymentMethod,
      beneficiaryName: text('beneficiaryName').trim(),
      iban: text('iban').trim(),
    });
  };

  const frequencyValid = !CHECKS.frequencyValue(frequencyValue);
  const invoice = React.useMemo(
    () => [new File([''], '98092257-f104-4665-af91-19a8e07742e91711462981604WallArt1.jpg', { type: 'image/jpeg' })],
    [],
  );

  return (
    <form
      ref={(node) => {
        formRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      noValidate
      onSubmit={submit}
      className={cn('flex flex-col gap-8', className)}
      {...form}
    >
      <section className="flex flex-col gap-4">
        <FormSectionHeader title="Recurring Details" headingLevel={3} />
        <DateField label="Starts At" name="startsAt" defaultValue={cost.startsAt} required today={today} />
        {/* The frequency fields, and the FormHint space.8 under them. */}
        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Frequency Value"
              name="frequencyValue"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              value={frequencyValue}
              error={errors.frequencyValue}
              onChange={(e) => {
                setFrequencyValue(e.target.value);
                recheck('frequencyValue', e.target.value);
              }}
            />
            <SelectField
              label="Frequency Unit"
              name="frequencyUnit"
              options={FREQUENCY_UNITS}
              value={frequencyUnit}
              onValueChange={(v) => setFrequencyUnit(v as FrequencyUnit)}
            />
          </div>
          {frequencyValid && (
            <FormHint role="status">
              {`This will recur every ${formatFrequency({ value: Number(frequencyValue), unit: frequencyUnit })}`}
            </FormHint>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <FormSectionHeader title="Cost Details" headingLevel={3} />
        <TextField
          label="Applicant name"
          name="applicantName"
          required
          defaultValue={cost.applicant.name}
          error={errors.applicantName}
          onChange={(e) => recheck('applicantName', e.target.value)}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="off"
          required
          defaultValue={cost.applicant.email}
          error={errors.email}
          onChange={(e) => recheck('email', e.target.value)}
        />
        <SelectField
          label="Currency"
          name="currency"
          options={currencies.filter((c) => c.enabled).map((c) => ({ value: c.code, label: c.name }))}
          defaultValue={cost.currency}
          /* Field – Dropdown with Edit: "[Edit]" goes to Manage Currencies (U06), not wired in the pattern. */
          action={<FormEditLink />}
        />
        <SelectField label="Select Partner" name="partner" options={partners.map((p) => p.name)} defaultValue={cost.partner} />
        <SelectField label="Payment method" name="paymentMethod" options={paymentMethods} defaultValue={cost.paymentMethod} />
      </section>

      <section className="flex flex-col gap-4">
        <FormSectionHeader
          title="Beneficiary Information"
          description="Use a permanent address where you can receive mail"
          headingLevel={3}
        />
        <TextField label="Beneficiary name" name="beneficiaryName" defaultValue={cost.partner} />
        <TextField label="IBAN account number" name="iban" defaultValue={cost.account} />
        <FileUploadField
          label="Attach invoice"
          accept=".doc,.docx,.pdf,.png,.jpg,.jpeg"
          hint="DOC, DOCX, PDF, PNG, JPG, JPEG accepted (Max 10.0MB)"
          defaultFiles={invoice}
        />
      </section>

      <section className="flex flex-col gap-4">
        <FormSectionHeader
          title="Breakdowns"
          headingLevel={3}
          /* Opens the breakdown form (Form / New Cost's), not wired in the pattern. */
          action={
            <Button variant="text" size="small" leftIcon={<Icon name="plus" />}>
              Add new
            </Button>
          }
        />
        <ul className="flex flex-col gap-3">
          {cost.breakdowns.map((line, i) => (
            <li key={i}>
              <BreakdownItem
                title={line.title}
                meta={`${line.costCentre} · ${line.natureOfService} · ${line.location}`}
                period={`${line.periodFrom} - ${line.periodTo}`}
                amount={formatAmount(cost.currency, line.amount)}
              />
            </li>
          ))}
        </ul>
      </section>
    </form>
  );
});
EditRecurringCostForm.displayName = 'EditRecurringCostForm';
