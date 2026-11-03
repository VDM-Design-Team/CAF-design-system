import * as React from 'react';
import { Button } from '../../components/button';
import { DateField } from '../../components/date-field';
import { Divider } from '../../components/divider';
import { FileUploadField } from '../../components/file-upload-field';
import { fileMatchesAccept } from '../../components/file-upload-zone';
import { FormEditLink } from '../../components/form-edit-link';
import { FormHint } from '../../components/form-hint';
import { FormSectionHeader } from '../../components/form-section-header';
import { FormTabNavigation } from '../../components/form-tab-navigation';
import { PageHeader } from '../../components/page-header';
import { PanelCard } from '../../components/panel-card';
import { SelectField } from '../../components/select-field';
import { TabItem } from '../../components/tab-item';
import { TextField } from '../../components/text-field';
import { cn } from '../../lib/cn';
import {
  currencies,
  currentUser,
  frequencyUnits,
  invoiceRules,
  locations,
  partners,
  paymentMethods,
  recurrenceSummary,
  type CostBreakdown,
  type CostType,
  type FrequencyUnit,
  type Person,
} from '../fixtures';
import { BreakdownsSection } from './BreakdownsSection';

/**
 * NewCostForm — a story-level organism, not a DS component (COMPONENT-PLAN
 * decision 4): `Form / New Cost` (184:3119, page "Form"), the full-page form a
 * cost is created in (patterns 09 and U02), composed from DS components.
 *
 * Figma → code, top to bottom:
 * - Page Heading "New Cost" → PageHeader's `<h1>`, above the card (decision
 *   add-form-heading; `description` can say which draft is open).
 * - The form's frame (578 wide: surface.base, 1px stroke.subtle, radius 12, 32
 *   padding) → PanelCard (Card / Panel, decision add-card-panel), 24 under the
 *   heading as Layout's Card / Panel example draws it (765:15978). The column
 *   is `max-w-xl` (576, the nearest container width to 578; GDL has no width
 *   scale), so the fields are 512 wide (Figma 510). The card holds only the
 *   `<form>`, whose parts stay 24 apart (184:3120).
 * - Form / Tab Navigation (Single Cost | Recurring Cost) → FormTabNavigation;
 *   the fields under it are its tab panel. Recurring adds "Recurring Details"
 *   at the top (U02: Starts At, Frequency Value and Unit, and the live summary
 *   "This will recur every 1 month") and drops Invoice number. The other
 *   fields stay mounted, so what was typed is kept when the tab changes.
 * - Form Fields (single column, 12 apart): Applicant name and Email
 *   (pre-filled from `applicant`), Invoice number, Currency (Field – Dropdown
 *   with Edit: "[Edit]" calls `onEditCurrency`), Select Partner, Payment
 *   method; the "Beneficiary Information" section (name, street, city, postal
 *   code, country, IBAN, Swift); Notes; Attach invoice (Field – File Upload,
 *   pattern 10's rules); then Breakdowns (BreakdownsSection).
 * - The two Dividers (184:3182 before Beneficiary Information, 184:3260
 *   before Breakdowns; U02 draws them on the Recurring tab too) → Divider,
 *   12 above and below it (the instances' padding) on top of the fields' 12
 *   gap. The labelled "Cost Details" rule (U02 545:18259) stays a
 *   FormSectionHeader (decision add-divider).
 * - Button Group → Outlined "Save to Drafts" and Default "Save", side by side
 *   (stacked below sm, where they don't fit the card side by side).
 *
 * Behaviour (patterns 09, U02, U03):
 * - Save checks every section, shows each message in place, and focuses the
 *   first invalid field (the browser scrolls it into view). When it passes,
 *   `onSubmit` gets the FormData: every field by name, `type`, the files under
 *   `invoices` and one JSON `breakdown` per breakdown.
 * - Save to Drafts doesn't check anything: `onSaveDraft` gets the FormData as
 *   it is.
 *
 * `className` goes on the page's column (the heading and the card); `ref`
 * and the other props go on the `<form>`.
 *
 * Where code departs from Figma (docs/patterns.md, 09 / U02): Figma's
 * Dividers are the remote Divider (184:1944), stroke.stronger; code's is the
 * library's (Layout → Divider), stroke.subtle. The heading is the Page
 * Header's Heading/xl-bold, not Figma's Title/md-bold inside the card.
 */
export type NewCostField =
  | 'applicantName'
  | 'email'
  | 'invoiceNumber'
  | 'currency'
  | 'partner'
  | 'paymentMethod'
  | 'beneficiaryName'
  | 'street'
  | 'city'
  | 'postalCode'
  | 'country'
  | 'iban'
  | 'swift'
  | 'notes'
  | 'startsAt'
  | 'frequencyValue'
  | 'frequencyUnit';

/** What a draft or a test pre-fills: field name → value, as FormData holds it. */
export type NewCostValues = Partial<Record<NewCostField, string>>;

type ErrorKey = NewCostField | 'invoices' | 'breakdowns';
type Errors = Partial<Record<ErrorKey, string>>;

/** The order Save looks for the first error in: the order on the page. */
const ERROR_ORDER: ErrorKey[] = [
  'startsAt',
  'frequencyValue',
  'frequencyUnit',
  'applicantName',
  'email',
  'currency',
  'partner',
  'paymentMethod',
  'invoices',
  'breakdowns',
];

export const NEW_COST_TABS: { value: CostType; label: string }[] = [
  { value: 'single', label: 'Single Cost' },
  { value: 'recurring', label: 'Recurring Cost' },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pattern 10: the type and size an invoice may have. */
export const validateInvoice = (file: File): string | undefined =>
  !fileMatchesAccept(file, invoiceRules.accept)
    ? invoiceRules.typeReason
    : file.size > invoiceRules.maxBytes
      ? invoiceRules.sizeReason
      : undefined;

/** Save's checks. Returns the messages by field; empty when the cost can be submitted. */
export function validateNewCost(data: FormData, breakdownCount: number): Errors {
  const value = (field: NewCostField) => String(data.get(field) ?? '').trim();
  const errors: Errors = {};
  const recurring = data.get('type') === 'recurring';
  if (recurring) {
    if (!value('startsAt')) errors.startsAt = 'Starts At is required.';
    const every = Number(value('frequencyValue'));
    if (!Number.isInteger(every) || every < 1) errors.frequencyValue = 'Enter a whole number of 1 or more.';
    if (!value('frequencyUnit')) errors.frequencyUnit = 'Frequency Unit is required.';
  }
  if (!value('applicantName')) errors.applicantName = 'Applicant name is required.';
  if (!value('email')) errors.email = 'Email is required.';
  else if (!EMAIL.test(value('email'))) errors.email = 'Enter an email address like name@example.com.';
  if (!value('currency')) errors.currency = 'Currency is required.';
  if (!value('partner')) errors.partner = 'Partner is required.';
  if (!value('paymentMethod')) errors.paymentMethod = 'Payment method is required.';
  const files = data.getAll('invoices').filter((f) => f instanceof File && f.name);
  if (!recurring && files.length === 0) errors.invoices = 'Attach at least one invoice.';
  if (breakdownCount === 0) errors.breakdowns = 'Add at least one breakdown.';
  return errors;
}

export interface NewCostFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children' | 'defaultValue'> {
  /** Controlled tab. Pair with `onTypeChange`. */
  type?: CostType;
  /** The tab shown first. Default single. */
  defaultType?: CostType;
  onTypeChange?: (type: CostType) => void;
  /** Pre-filled values (a resumed draft). Applicant name and Email default to `applicant`. */
  defaultValues?: NewCostValues;
  /** Breakdowns already added (a resumed draft). */
  defaultBreakdowns?: readonly CostBreakdown[];
  /** Invoices already attached (a resumed draft). */
  defaultFiles?: readonly File[];
  /** The signed-in user, who pre-fills Applicant name and Email. */
  applicant?: Person;
  /** Under the page's heading, e.g. "Draft #36741". */
  description?: React.ReactNode;
  /** Save, when every check passes. */
  onSubmit?: (data: FormData) => void;
  /** Save to Drafts: no checks. */
  onSaveDraft?: (data: FormData) => void;
  /** Currency's "[Edit]": opens Manage Currencies (pattern U06). */
  onEditCurrency?: () => void;
  /** Start with the Cost Breakdown dialog open. */
  defaultBreakdownDialogOpen?: boolean;
  /** The calendars' today (stories pin it). */
  today?: Date;
}

export const NewCostForm = React.forwardRef<HTMLFormElement, NewCostFormProps>(function NewCostForm(
  {
    type,
    defaultType = 'single',
    onTypeChange,
    defaultValues = {},
    defaultBreakdowns = [],
    defaultFiles,
    applicant = currentUser,
    description,
    onSubmit,
    onSaveDraft,
    onEditCurrency,
    defaultBreakdownDialogOpen,
    today,
    className,
    ...form
  },
  ref,
) {
  const uid = React.useId();
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [ownType, setOwnType] = React.useState<CostType>(defaultType);
  const current = type ?? ownType;
  const recurring = current === 'recurring';
  const [breakdowns, setBreakdowns] = React.useState<CostBreakdown[]>([...defaultBreakdowns]);
  const [currency, setCurrency] = React.useState<string | null>(defaultValues.currency ?? null);
  const [every, setEvery] = React.useState(defaultValues.frequencyValue ?? '1');
  const [unit, setUnit] = React.useState<FrequencyUnit>((defaultValues.frequencyUnit as FrequencyUnit) ?? 'Month');
  const [errors, setErrors] = React.useState<Errors>({});

  const refs: Record<ErrorKey, React.RefObject<HTMLElement | null>> = {
    applicantName: React.useRef(null),
    email: React.useRef(null),
    invoiceNumber: React.useRef(null),
    currency: React.useRef(null),
    partner: React.useRef(null),
    paymentMethod: React.useRef(null),
    beneficiaryName: React.useRef(null),
    street: React.useRef(null),
    city: React.useRef(null),
    postalCode: React.useRef(null),
    country: React.useRef(null),
    iban: React.useRef(null),
    swift: React.useRef(null),
    notes: React.useRef(null),
    startsAt: React.useRef(null),
    frequencyValue: React.useRef(null),
    frequencyUnit: React.useRef(null),
    invoices: React.useRef(null),
    breakdowns: React.useRef(null),
  };
  const setRef =
    <T extends HTMLElement>(key: ErrorKey) =>
    (node: T | null) => {
      refs[key].current = node;
    };

  const clear = (key: ErrorKey) => setErrors((all) => (all[key] ? { ...all, [key]: undefined } : all));
  const changeType = (next: string) => {
    if (type === undefined) setOwnType(next as CostType);
    onTypeChange?.(next as CostType);
  };

  const tabId = (value: CostType) => `${uid}-tab-${value}`;
  const panelId = `${uid}-panel`;
  const value = (field: NewCostField, fallback?: string) => defaultValues[field] ?? fallback;
  const everyNumber = Number(every);

  /* A text field: its value, its message, and clearing the message as the user types. */
  const text = (field: NewCostField, label: string, extra: Partial<React.ComponentProps<typeof TextField>> = {}) => (
    <TextField
      ref={setRef<HTMLInputElement>(field)}
      label={label}
      name={field}
      defaultValue={value(field)}
      error={errors[field]}
      onChange={() => clear(field)}
      {...extra}
    />
  );

  return (
    <div className={cn('flex w-full max-w-xl flex-col gap-6', className)}>
      <PageHeader title="New Cost" description={description} />
      <PanelCard>
        <form
          ref={(node) => {
            formRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const found = validateNewCost(data, breakdowns.length);
            setErrors(found);
            const first = ERROR_ORDER.find((key) => found[key]);
            if (first) {
              refs[first].current?.focus();
              return;
            }
            onSubmit?.(data);
          }}
          {...form}
        >
          <FormTabNavigation aria-label="Cost type" active={current} onActiveChange={changeType}>
            {NEW_COST_TABS.map((tab) => (
              <TabItem key={tab.value} value={tab.value} id={tabId(tab.value)} aria-controls={panelId}>
                {tab.label}
              </TabItem>
            ))}
          </FormTabNavigation>
          <input type="hidden" name="type" value={current} />

          <div role="tabpanel" id={panelId} aria-labelledby={tabId(current)} className="flex flex-col gap-3">
            {recurring && (
              <>
                <FormSectionHeader title="Recurring Details" description="How often this cost repeats and when it starts." />
                <DateField
                  ref={setRef<HTMLButtonElement>('startsAt')}
                  label="Starts At"
                  name="startsAt"
                  required
                  placeholder="Select start date"
                  defaultValue={value('startsAt') ?? null}
                  today={today}
                  error={errors.startsAt}
                  onValueChange={() => clear('startsAt')}
                />
                {/* U02's Frequency row (Value and Unit side by side), and its Recurrence hint space.8 under it. */}
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextField
                      ref={setRef<HTMLInputElement>('frequencyValue')}
                      label="Frequency Value"
                      name="frequencyValue"
                      type="number"
                      min={1}
                      step={1}
                      required
                      value={every}
                      error={errors.frequencyValue}
                      onChange={(event) => {
                        setEvery(event.target.value);
                        clear('frequencyValue');
                      }}
                    />
                    <SelectField
                      ref={setRef<HTMLButtonElement>('frequencyUnit')}
                      label="Frequency Unit"
                      name="frequencyUnit"
                      required
                      options={frequencyUnits}
                      value={unit}
                      error={errors.frequencyUnit}
                      onValueChange={(next) => {
                        setUnit(next as FrequencyUnit);
                        clear('frequencyUnit');
                      }}
                    />
                  </div>
                  {/* U02's Recurrence hint (545:18256): a FormHint; the live summary, as a polite status. */}
                  {Number.isInteger(everyNumber) && everyNumber >= 1 && (
                    <FormHint role="status">{recurrenceSummary(everyNumber, unit)}</FormHint>
                  )}
                </div>
                <FormSectionHeader title="Cost Details" />
              </>
            )}
            {text('applicantName', 'Applicant name', { required: true, defaultValue: value('applicantName', applicant.name), autoComplete: 'name' })}
            {text('email', 'Email', { required: true, type: 'email', defaultValue: value('email', applicant.email), autoComplete: 'email' })}
            {!recurring && text('invoiceNumber', 'Invoice number', { placeholder: 'e.g. INV-2026-0436' })}
            <SelectField
              ref={setRef<HTMLButtonElement>('currency')}
              label="Currency"
              action={<FormEditLink onClick={onEditCurrency} />}
              name="currency"
              required
              placeholder="Select option"
              options={currencies.filter((c) => c.enabled).map((c) => ({ value: c.code, label: c.name }))}
              defaultValue={value('currency') ?? null}
              error={errors.currency}
              onValueChange={(next) => {
                setCurrency(next);
                clear('currency');
              }}
            />
            <SelectField
              ref={setRef<HTMLButtonElement>('partner')}
              label="Select Partner"
              name="partner"
              required
              placeholder="Select option"
              options={partners.map((p) => p.name)}
              defaultValue={value('partner') ?? null}
              error={errors.partner}
              onValueChange={() => clear('partner')}
            />
            <SelectField
              ref={setRef<HTMLButtonElement>('paymentMethod')}
              label="Payment method"
              name="paymentMethod"
              required
              placeholder="Select option"
              options={paymentMethods}
              defaultValue={value('paymentMethod') ?? null}
              error={errors.paymentMethod}
              onValueChange={() => clear('paymentMethod')}
            />

            {/* Divider (184:3182): 12 above and below the rule, on top of the 12 gap. */}
            <Divider className="my-3" />
            <FormSectionHeader title="Beneficiary Information" description="Use a permanent address where you can receive mail" />
            {text('beneficiaryName', 'Beneficiary name')}
            {text('street', 'Street', { autoComplete: 'street-address' })}
            {text('city', 'City', { autoComplete: 'address-level2' })}
            {text('postalCode', 'Postal code', { autoComplete: 'postal-code' })}
            <SelectField
              ref={setRef<HTMLButtonElement>('country')}
              label="Country"
              name="country"
              placeholder="Select option"
              options={locations}
              defaultValue={value('country') ?? null}
            />
            {text('iban', 'IBAN account number')}
            {text('swift', 'Swift code')}
            {text('notes', 'Notes')}
            <FileUploadField
              ref={setRef<HTMLInputElement>('invoices')}
              label="Attach invoice"
              name="invoices"
              multiple
              required={!recurring}
              accept={invoiceRules.accept}
              hint={invoiceRules.hint}
              validate={validateInvoice}
              defaultFiles={defaultFiles}
              error={errors.invoices}
              onFilesChange={(files) => files.length && clear('invoices')}
            />

            {/* Divider (184:3260), before Breakdowns. */}
            <Divider className="my-3" />
            <BreakdownsSection
              breakdowns={breakdowns}
              onBreakdownsChange={(next) => {
                setBreakdowns(next);
                if (next.length) clear('breakdowns');
              }}
              currency={currency}
              name="breakdown"
              error={errors.breakdowns}
              addRef={setRef<HTMLButtonElement>('breakdowns')}
              defaultDialogOpen={defaultBreakdownDialogOpen}
              today={today}
            />
          </div>

          {/* Button Group: Save to Drafts and Save share the width, 12 apart. Below sm (a phone, where the card's
              padding leaves 224 for the fields) they stack, as the Frequency row does: side by side, "Save to
              Drafts" wouldn't fit its half. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outlined" className="w-full" onClick={() => formRef.current && onSaveDraft?.(new FormData(formRef.current))}>
              Save to Drafts
            </Button>
            <Button type="submit" className="w-full">
              Save
            </Button>
          </div>
        </form>
      </PanelCard>
    </div>
  );
});
NewCostForm.displayName = 'NewCostForm';
