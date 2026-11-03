import type { StatusPillStatus } from '../components/status-pill';
/**
 * Sample data for the Patterns and Templates stories. Plain, typed data: no
 * randomness, dates as fixed ISO strings, so stories and snapshots are stable.
 *
 * Taken from the CAF Figma library's pattern sections (Patterns – Admin
 * 504:13180, Patterns – User 544:13219) and the CAF Design file's screens
 * (z7L8r4nq6nL6Yfa8vvxJhO, pages "Admin screens" and "User Screens"). The
 * labels, IDs, amounts, statuses and copy are Figma's. Two departures:
 * - Personal-looking email addresses and the Contacts page's senders are
 *   replaced with fictional ones on example.com. The library's own sample
 *   people (Admin Account, Maria Santos, John Reyes, Ana Cruz on geekee.com)
 *   are kept.
 * - The screens show about eight costs; more are added in the same shape
 *   (statuses, currencies, payment methods, dates) so filters and
 *   pagination have something to do.
 *
 * This file is shared by every pattern and template. Add to it only in a
 * section of your own at the end, marked with your pattern's slug.
 */

/* ── Formatting, as the screens show values ──────────────────────────────── */

const LONG = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** "2026-09-24" → "September 24, 2026" (the Costs table's Date Submitted). */
export const formatDate = (iso: string) => LONG.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));

/** "2026-08-10" → "Aug 10, 2026" (Announcements, Payment Schedules' "Processed on"). */
export const formatShortDate = (iso: string) => SHORT.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));

/** "2026-09-24T00:49" → "2026-09-24 00:49" (Audit Logs' Timestamp). */
export const formatTimestamp = (iso: string) => iso.replace('T', ' ').slice(0, 16);

/** ("USD", 5130553.37) → "USD 5130553.37", as the Costs table prints amounts (no grouping). */
export const formatAmount = (currency: Currency, amount: number) => `${currency} ${amount}`;

/** A breakdown's period, as the expanded Costs row prints it: "May 15, 2026 - June 14, 2026". */
export const formatPeriod = (from: string, to: string) => `${formatDate(from)} - ${formatDate(to)}`;

/* ── Shared vocabularies ─────────────────────────────────────────────────── */

export type Currency = 'USD' | 'EUR' | 'GBP' | 'PHP' | 'RON' | 'HUF' | 'ALL';

/** Manage Currencies (U06, 545:23189): name, code, enabled. */
export interface CurrencyOption {
  code: Currency;
  name: string;
  enabled: boolean;
}

export const currencies: CurrencyOption[] = [
  { code: 'EUR', name: 'Euro', enabled: true },
  { code: 'HUF', name: 'Hungarian Forint', enabled: true },
  { code: 'PHP', name: 'Philippine Peso', enabled: true },
  { code: 'GBP', name: 'Pound Sterling', enabled: true },
  { code: 'RON', name: 'Romanian Leu', enabled: true },
  { code: 'USD', name: 'US Dollar', enabled: true },
  { code: 'ALL', name: 'Albanian Lek', enabled: false },
];

export type PaymentMethod = 'Wiretransfer' | 'YourSafe' | 'SEPA' | 'Credit Card';

/** "All Payment Method" filter's options, in the order the screens list them. */
export const paymentMethods: PaymentMethod[] = ['Wiretransfer', 'YourSafe', 'SEPA', 'Credit Card'];

export const locations = ['Philippines', 'United States', 'United Kingdom', 'Romania', 'Hungary'] as const;
export type Location = (typeof locations)[number];

/* ── Cost centres (Admin → Cost Centers, 2102:6033; pattern 01, 518:316) ─── */

export interface CostCentre {
  id: string;
  /** Cost center ("Employee Expenses"). */
  name: string;
  /** Nature of Service ("Salary"). */
  natureOfService: string;
  location: Location;
}

export const costCentres: CostCentre[] = [
  { id: 'cc-1', name: 'Employee Expenses', natureOfService: 'Salary', location: 'Philippines' },
  { id: 'cc-2', name: 'Travel Expenses', natureOfService: 'Testing', location: 'Philippines' },
  { id: 'cc-3', name: 'IT Expenses', natureOfService: 'Software', location: 'United States' },
  { id: 'cc-4', name: 'Legal Expenses', natureOfService: 'Consulting', location: 'United Kingdom' },
  { id: 'cc-5', name: 'HR Expenses', natureOfService: 'Recruitment', location: 'Romania' },
  { id: 'cc-6', name: 'Employee Expenses', natureOfService: 'Bonus', location: 'United States' },
  { id: 'cc-7', name: 'Travel Expenses', natureOfService: 'Accommodation', location: 'Romania' },
  { id: 'cc-8', name: 'IT Expenses', natureOfService: 'Hardware', location: 'Philippines' },
  { id: 'cc-9', name: 'Marketing Expenses', natureOfService: 'Advertising', location: 'United Kingdom' },
  { id: 'cc-10', name: 'Office Expenses', natureOfService: 'Rent', location: 'Hungary' },
  { id: 'cc-11', name: 'Legal Expenses', natureOfService: 'Notary', location: 'Romania' },
  { id: 'cc-12', name: 'HR Expenses', natureOfService: 'Training', location: 'Philippines' },
];

/* ── Partners (Admin → Partners, 2102:6128) ───────────────────────────────── */

export interface Partner {
  id: string;
  name: string;
  paymentMethod: PaymentMethod;
  /** The account a cost to this partner is paid into (IBAN, or a masked card). */
  account: string;
  createdAt: string;
}

export const partners: Partner[] = [
  { id: '282', name: 'Jane Doe', paymentMethod: 'Wiretransfer', account: '982389428934', createdAt: '2026-02-02' },
  { id: '328', name: 'Test Admin', paymentMethod: 'YourSafe', account: 'BE71096123456769', createdAt: '2026-07-27' },
  { id: '331', name: 'Riverlane Consulting BV', paymentMethod: 'SEPA', account: 'NL91ABNA0417164300', createdAt: '2026-08-04' },
  { id: '334', name: 'Northwind Advisory Ltd', paymentMethod: 'Wiretransfer', account: 'GB33BUKB20201555555555', createdAt: '2026-08-12' },
  { id: '337', name: 'Carpathia Events SRL', paymentMethod: 'SEPA', account: 'RO49AAAA1B31007593840000', createdAt: '2026-08-19' },
  { id: '339', name: 'Danube Logistics Kft', paymentMethod: 'Wiretransfer', account: 'HU42117730161111101800000000', createdAt: '2026-08-26' },
  { id: '342', name: 'Harbourline Studio', paymentMethod: 'Credit Card', account: '**** **** **** 4821', createdAt: '2026-09-02' },
  { id: '345', name: 'Manila Print Co.', paymentMethod: 'Wiretransfer', account: 'PH12345678901234', createdAt: '2026-09-08' },
];

/* ── Users (Admin → Users, 2102:6355; pattern 02, 520:1873) ───────────────── */

export type UserRole = 'Admin' | 'User' | 'Restricted User';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export const users: User[] = [
  { id: '109', name: 'Admin Account', email: 'admin1@geekee.com', role: 'Admin', createdAt: '2021-09-20', updatedAt: '2026-02-10' },
  { id: '110', name: 'QA Internal', email: 'qa.internal@example.com', role: 'User', createdAt: '2026-02-02', updatedAt: '2026-02-02' },
  { id: '111', name: 'QA Test', email: 'qa.test@example.com', role: 'User', createdAt: '2026-02-02', updatedAt: '2026-02-10' },
  { id: '112', name: 'QA Reviewer', email: 'qa.reviewer@example.com', role: 'Admin', createdAt: '2026-02-04', updatedAt: '2026-02-04' },
  { id: '113', name: 'QA Test 002', email: 'qa.test002@example.com', role: 'User', createdAt: '2026-02-12', updatedAt: '2026-06-19' },
  { id: '115', name: 'New Test', email: 'new.test@example.com', role: 'User', createdAt: '2026-02-26', updatedAt: '2026-02-26' },
  { id: '116', name: 'Maria Santos', email: 'maria.santos@geekee.com', role: 'User', createdAt: '2026-03-04', updatedAt: '2026-03-04' },
  { id: '119', name: 'QA Admin', email: 'qa.admin@example.com', role: 'Admin', createdAt: '2026-03-18', updatedAt: '2026-03-18' },
  { id: '123', name: 'QA Test Bryan', email: 'qa.bryan@example.com', role: 'User', createdAt: '2026-03-19', updatedAt: '2026-03-19' },
  { id: '124', name: 'John Reyes', email: 'john.reyes@geekee.com', role: 'User', createdAt: '2026-05-19', updatedAt: '2026-05-19' },
  { id: '125', name: 'Automation', email: 'regular@example.com', role: 'User', createdAt: '2026-06-02', updatedAt: '2026-07-14' },
  { id: '126', name: 'Ana Cruz', email: 'ana.cruz@geekee.com', role: 'Restricted User', createdAt: '2026-08-27', updatedAt: '2026-08-27' },
];

/** The roles filter ("All Roles") and the Add New User role field. */
export const userRoles: UserRole[] = ['Admin', 'User', 'Restricted User'];

/* ── Costs (Admin and User → Costs; Table / Row – Cost 121:2782) ──────────── */

/**
 * A cost's status: Pending, Approved, Rejected or Paid, as the bulk Change
 * Status menu offers them (pattern 07, 524:4713). Each is a Status Pill
 * variant (`costStatusPill`).
 */
export type CostStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export const costStatuses: CostStatus[] = ['pending', 'approved', 'rejected', 'paid'];

/** The status's label, as the Status column and the "All Status" filter print it. */
export const costStatusLabel: Record<CostStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
};

/**
 * How the Status column shows each status: Status Pill's own variant for each
 * (Pending orange, Approved blue, Paid green, Rejected red, as U01 asks;
 * added to the library on 2 Nov 2026).
 */
export const costStatusPill: Record<CostStatus, StatusPillStatus> = {
  pending: 'pending',
  approved: 'approved',
  paid: 'paid',
  rejected: 'rejected',
};

/** "Tabs / Cost Type": All | Recurring | Single. */
export type CostType = 'single' | 'recurring';

/** One line of a cost's breakdown: the expanded row (121:2957) and Card / Breakdown Item. */
export interface CostBreakdown {
  title: string;
  amount: number;
  natureOfService: string;
  costCentre: string;
  location: Location | '-';
  periodFrom: string;
  periodTo: string;
}

export interface Person {
  name: string;
  email: string;
}

export interface Cost {
  /** The cost's ID ("37023"): the Account column's first line. */
  id: string;
  /** What the cost is for: its first breakdown's title. */
  title: string;
  type: CostType;
  /** Invoice # ("Test Invoice", "INV-SEPA-2601"). Empty on a recurring cost, as on the screens. */
  invoiceNumber: string;
  /** The applicant: "Applicant: QA Test Bryan". */
  applicant: Person;
  /** The partner paid: "Beneficiary name: Jane Doe". */
  partner: string;
  /** The account line: "IBAN Account: …", or "Credit Card details: **** **** **** 1234" for a card. */
  account: string;
  paymentMethod: PaymentMethod;
  currency: Currency;
  amount: number;
  status: CostStatus;
  /** The first breakdown's cost centre ("Employee Expenses"), for the cost centre filter. */
  costCentre: string;
  /** Date Submitted (also the "Creation Date" filter). */
  submittedAt: string;
  /** The span of the breakdowns' periods (the "Select Period" filter). */
  periodFrom: string;
  periodTo: string;
  /** Who created the cost (Audit Logs' User, Drafts' Created By). */
  createdBy: Person;
  breakdowns: CostBreakdown[];
}

const ADMIN: Person = { name: 'Admin Account', email: 'admin1@geekee.com' };
const BRYAN: Person = { name: 'QA Test Bryan', email: 'qa.bryan@example.com' };
const QA: Person = { name: 'QA Test', email: 'qa.test@example.com' };
const QA002: Person = { name: 'QA Test 002', email: 'qa.test002@example.com' };
const NEW_TEST: Person = { name: 'New Test', email: 'new.test@example.com' };
const AUTOMATION: Person = { name: 'Automation', email: 'regular@example.com' };
const MARIA: Person = { name: 'Maria Santos', email: 'maria.santos@geekee.com' };
const JOHN: Person = { name: 'John Reyes', email: 'john.reyes@geekee.com' };
const ANA: Person = { name: 'Ana Cruz', email: 'ana.cruz@geekee.com' };

/** A cost with one breakdown line covering the whole amount. */
function single(
  line: Omit<CostBreakdown, 'amount'>,
  cost: Omit<Cost, 'title' | 'costCentre' | 'periodFrom' | 'periodTo' | 'breakdowns'>,
): Cost {
  return {
    ...cost,
    title: line.title,
    costCentre: line.costCentre,
    periodFrom: line.periodFrom,
    periodTo: line.periodTo,
    breakdowns: [{ ...line, amount: cost.amount }],
  };
}

/* Table / Row – Cost Expanded=true (121:2783): the library's six breakdown lines. */
const LIBRARY_BREAKDOWN: CostBreakdown[] = [
  ['Discovery workshop and requirements mapping', 1200, 'United States'],
  ['Invoice extraction workflow design', 2850, 'United States'],
  ['API integration review', 1750, '-'],
  ['Security and privacy checklist', 640, 'United States'],
  ['Implementation handover session', 520, '-'],
  ['Tax', 1461.6, '-'],
].map(([title, amount, location]) => ({
  title: title as string,
  amount: amount as number,
  natureOfService: 'Salary',
  costCentre: 'Employee Expenses',
  location: location as Location | '-',
  periodFrom: '2026-05-15',
  periodTo: '2026-06-14',
}));

/**
 * About 30 costs, newest first. The first eight are the Admin Costs screen
 * (2102:5749), then the User Costs screen (2102:1096), the library's pattern
 * rows (32430, 32431, 32436, 32402, 32411) and more in the same shape.
 */
export const costs: Cost[] = [
  {
    id: '32436', title: 'Quarterly accessibility audit', type: 'single', invoiceNumber: 'INV-2026-0436',
    applicant: JOHN, partner: 'Northwind Advisory Ltd', account: 'GB33BUKB20201555555555', paymentMethod: 'Wiretransfer',
    currency: 'USD', amount: 310.5, status: 'pending', costCentre: 'IT Expenses', submittedAt: '2026-10-22',
    periodFrom: '2026-10-01', periodTo: '2026-10-15', createdBy: JOHN,
    breakdowns: [
      { title: 'Quarterly accessibility audit', amount: 310.5, natureOfService: 'Software', costCentre: 'IT Expenses', location: 'United States', periodFrom: '2026-10-01', periodTo: '2026-10-15' },
    ],
  },
  {
    id: '32431', title: 'Monthly retainer', type: 'recurring', invoiceNumber: '',
    applicant: MARIA, partner: 'Riverlane Consulting BV', account: 'NL91ABNA0417164300', paymentMethod: 'SEPA',
    currency: 'EUR', amount: 1250, status: 'pending', costCentre: 'Legal Expenses', submittedAt: '2026-10-18',
    periodFrom: '2026-10-01', periodTo: '2026-10-31', createdBy: MARIA,
    breakdowns: [
      { title: 'Monthly retainer', amount: 1000, natureOfService: 'Consulting', costCentre: 'Legal Expenses', location: 'United Kingdom', periodFrom: '2026-10-01', periodTo: '2026-10-31' },
      { title: 'Tax', amount: 250, natureOfService: 'Consulting', costCentre: 'Legal Expenses', location: '-', periodFrom: '2026-10-01', periodTo: '2026-10-31' },
    ],
  },
  {
    id: '32430', title: LIBRARY_BREAKDOWN[0].title, type: 'recurring', invoiceNumber: '123456',
    applicant: BRYAN, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'Wiretransfer',
    currency: 'EUR', amount: 8421.6, status: 'pending', costCentre: 'Employee Expenses', submittedAt: '2026-10-14',
    periodFrom: '2026-05-15', periodTo: '2026-06-14', createdBy: BRYAN, breakdowns: LIBRARY_BREAKDOWN,
  },
  single(
    { title: 'Contract review', natureOfService: 'Consulting', costCentre: 'Legal Expenses', location: 'United Kingdom', periodFrom: '2026-09-15', periodTo: '2026-09-30' },
    { id: '32411', type: 'single', invoiceNumber: 'INV-2026-0411', applicant: JOHN, partner: 'Northwind Advisory Ltd', account: 'GB33BUKB20201555555555', paymentMethod: 'Wiretransfer', currency: 'GBP', amount: 2400, status: 'approved', submittedAt: '2026-10-07', createdBy: JOHN },
  ),
  single(
    { title: 'Invoice extraction workflow design', natureOfService: 'Software', costCentre: 'IT Expenses', location: 'United States', periodFrom: '2026-09-01', periodTo: '2026-09-30' },
    { id: '32402', type: 'single', invoiceNumber: 'INV-2026-0402', applicant: ADMIN, partner: 'Riverlane Consulting BV', account: 'NL91ABNA0417164300', paymentMethod: 'SEPA', currency: 'EUR', amount: 3150, status: 'approved', submittedAt: '2026-10-06', createdBy: ADMIN },
  ),
  single(
    { title: 'Automation Breakdown', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-09-19', periodTo: '2026-09-20' },
    { id: '37023', type: 'single', invoiceNumber: 'Test Invoice', applicant: AUTOMATION, partner: 'Jane Doe', account: '**** **** **** 1234', paymentMethod: 'Credit Card', currency: 'USD', amount: 100, status: 'pending', submittedAt: '2026-09-24', createdBy: AUTOMATION },
  ),
  single(
    { title: 'testing Bryan', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-07-01', periodTo: '2026-07-31' },
    { id: '37022', type: 'recurring', invoiceNumber: '', applicant: BRYAN, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'Wiretransfer', currency: 'USD', amount: 12312.99, status: 'pending', submittedAt: '2026-09-24', createdBy: BRYAN },
  ),
  {
    id: '37021', title: 'Platform development – September', type: 'recurring', invoiceNumber: '',
    applicant: BRYAN, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'Wiretransfer',
    currency: 'USD', amount: 5130553.37, status: 'pending', costCentre: 'Employee Expenses', submittedAt: '2026-09-24',
    periodFrom: '2026-09-01', periodTo: '2026-09-30', createdBy: BRYAN,
    breakdowns: [
      { title: 'Platform development – September', amount: 4800000, natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-09-01', periodTo: '2026-09-30' },
      { title: 'Licences', amount: 330553.37, natureOfService: 'Software', costCentre: 'IT Expenses', location: 'United States', periodFrom: '2026-09-01', periodTo: '2026-09-30' },
    ],
  },
  single(
    { title: 'Staff augmentation', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-09-01', periodTo: '2026-09-30' },
    { id: '37019', type: 'recurring', invoiceNumber: '', applicant: { name: 'Admin Account test bryan', email: ADMIN.email }, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'Wiretransfer', currency: 'USD', amount: 8296447.22, status: 'pending', submittedAt: '2026-09-24', createdBy: ADMIN },
  ),
  single(
    { title: 'Field testing', natureOfService: 'Testing', costCentre: 'Travel Expenses', location: 'Philippines', periodFrom: '2026-09-08', periodTo: '2026-09-12' },
    { id: '37012', type: 'single', invoiceNumber: '90909', applicant: { name: 'kyna test 2', email: QA.email }, partner: 'Test Admin', account: 'BE71096123456769', paymentMethod: 'YourSafe', currency: 'USD', amount: 5500, status: 'pending', submittedAt: '2026-09-23', createdBy: QA },
  ),
  single(
    { title: 'Travel allowance', natureOfService: 'Testing', costCentre: 'Travel Expenses', location: 'Philippines', periodFrom: '2026-09-15', periodTo: '2026-09-16' },
    { id: '37011', type: 'single', invoiceNumber: '09999', applicant: { name: 'Test Kyna', email: QA.email }, partner: 'Test Admin', account: 'BE71096123456769', paymentMethod: 'YourSafe', currency: 'USD', amount: 300, status: 'pending', submittedAt: '2026-09-23', createdBy: QA },
  ),
  single(
    { title: 'SEPA consulting invoice', natureOfService: 'Consulting', costCentre: 'Legal Expenses', location: 'United Kingdom', periodFrom: '2026-09-01', periodTo: '2026-09-15' },
    { id: '37010', type: 'single', invoiceNumber: 'INV-SEPA-2601', applicant: { name: 'JAZ TEST SINGLE COST', email: ADMIN.email }, partner: 'Riverlane Consulting BV', account: 'NL91ABNA0417164300', paymentMethod: 'SEPA', currency: 'EUR', amount: 4603.2, status: 'pending', submittedAt: '2026-09-23', createdBy: ADMIN },
  ),
  single(
    { title: 'Recurring 1', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-09-01', periodTo: '2026-09-30' },
    { id: '37003', type: 'recurring', invoiceNumber: '', applicant: QA002, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'Wiretransfer', currency: 'USD', amount: 9100001.88, status: 'pending', submittedAt: '2026-09-23', createdBy: QA002 },
  ),
  single(
    { title: 'Retainer', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-08-01', periodTo: '2026-08-31' },
    { id: '37001', type: 'recurring', invoiceNumber: '', applicant: ADMIN, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'Wiretransfer', currency: 'USD', amount: 123, status: 'paid', submittedAt: '2026-09-23', createdBy: ADMIN },
  ),
  single(
    { title: 'Print run – brochures', natureOfService: 'Advertising', costCentre: 'Marketing Expenses', location: 'Philippines', periodFrom: '2026-09-01', periodTo: '2026-09-15' },
    { id: '36950', type: 'single', invoiceNumber: 'MPC-0915', applicant: MARIA, partner: 'Manila Print Co.', account: 'PH12345678901234', paymentMethod: 'Wiretransfer', currency: 'PHP', amount: 48500, status: 'paid', submittedAt: '2026-09-21', createdBy: MARIA },
  ),
  single(
    { title: 'Team offsite venue', natureOfService: 'Accommodation', costCentre: 'Travel Expenses', location: 'Romania', periodFrom: '2026-09-10', periodTo: '2026-09-12' },
    { id: '36912', type: 'single', invoiceNumber: 'CE-2026-118', applicant: ANA, partner: 'Carpathia Events SRL', account: 'RO49AAAA1B31007593840000', paymentMethod: 'SEPA', currency: 'RON', amount: 7200, status: 'rejected', submittedAt: '2026-09-20', createdBy: ANA },
  ),
  single(
    { title: 'testing Bryan', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-07-01', periodTo: '2026-07-31' },
    { id: '36723', type: 'recurring', invoiceNumber: '', applicant: NEW_TEST, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'YourSafe', currency: 'USD', amount: 5002000, status: 'pending', submittedAt: '2026-09-20', createdBy: NEW_TEST },
  ),
  single(
    { title: 'Design tool licences', natureOfService: 'Software', costCentre: 'IT Expenses', location: 'United States', periodFrom: '2026-09-01', periodTo: '2026-09-30' },
    { id: '36871', type: 'single', invoiceNumber: 'HS-4471', applicant: JOHN, partner: 'Harbourline Studio', account: '**** **** **** 4821', paymentMethod: 'Credit Card', currency: 'USD', amount: 1840.5, status: 'approved', submittedAt: '2026-09-19', createdBy: JOHN },
  ),
  {
    id: '36840', title: 'Monthly retainer', type: 'recurring', invoiceNumber: '',
    applicant: MARIA, partner: 'Riverlane Consulting BV', account: 'NL91ABNA0417164300', paymentMethod: 'SEPA',
    currency: 'EUR', amount: 1250, status: 'paid', costCentre: 'Legal Expenses', submittedAt: '2026-09-18',
    periodFrom: '2026-09-01', periodTo: '2026-09-30', createdBy: MARIA,
    breakdowns: [
      { title: 'Monthly retainer', amount: 1000, natureOfService: 'Consulting', costCentre: 'Legal Expenses', location: 'United Kingdom', periodFrom: '2026-09-01', periodTo: '2026-09-30' },
      { title: 'Tax', amount: 250, natureOfService: 'Consulting', costCentre: 'Legal Expenses', location: '-', periodFrom: '2026-09-01', periodTo: '2026-09-30' },
    ],
  },
  single(
    { title: 'testing Bryan', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-07-01', periodTo: '2026-07-31' },
    { id: '36664', type: 'recurring', invoiceNumber: '', applicant: BRYAN, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'Wiretransfer', currency: 'USD', amount: 12312.99, status: 'pending', submittedAt: '2026-09-17', createdBy: BRYAN },
  ),
  single(
    { title: 'Platform development – August', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-08-01', periodTo: '2026-08-31' },
    { id: '36663', type: 'recurring', invoiceNumber: '', applicant: BRYAN, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'Wiretransfer', currency: 'USD', amount: 5130553.37, status: 'pending', submittedAt: '2026-09-17', createdBy: BRYAN },
  ),
  single(
    { title: 'Recurring 1', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-08-01', periodTo: '2026-08-31' },
    { id: '36612', type: 'recurring', invoiceNumber: '', applicant: QA002, partner: 'Jane Doe', account: '982389428934', paymentMethod: 'Wiretransfer', currency: 'USD', amount: 9100001.88, status: 'pending', submittedAt: '2026-09-16', createdBy: QA002 },
  ),
  single(
    { title: 'Warehouse handling', natureOfService: 'Rent', costCentre: 'Office Expenses', location: 'Hungary', periodFrom: '2026-08-15', periodTo: '2026-09-14' },
    { id: '36802', type: 'single', invoiceNumber: 'DL-77120', applicant: QA, partner: 'Danube Logistics Kft', account: 'HU42117730161111101800000000', paymentMethod: 'Wiretransfer', currency: 'HUF', amount: 385000, status: 'pending', submittedAt: '2026-09-15', createdBy: QA },
  ),
  single(
    { title: 'Brand photography', natureOfService: 'Advertising', costCentre: 'Marketing Expenses', location: 'United Kingdom', periodFrom: '2026-09-02', periodTo: '2026-09-03' },
    { id: '36755', type: 'single', invoiceNumber: 'HS-4402', applicant: ANA, partner: 'Harbourline Studio', account: '**** **** **** 4821', paymentMethod: 'Credit Card', currency: 'GBP', amount: 960, status: 'rejected', submittedAt: '2026-09-12', createdBy: ANA },
  ),
  single(
    { title: 'Recurring 1', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-08-01', periodTo: '2026-08-31' },
    { id: '36078', type: 'recurring', invoiceNumber: '', applicant: QA, partner: 'Test Admin', account: 'BE71096123456769', paymentMethod: 'YourSafe', currency: 'USD', amount: 900, status: 'pending', submittedAt: '2026-09-10', createdBy: QA },
  ),
  single(
    { title: 'Hardware refresh', natureOfService: 'Hardware', costCentre: 'IT Expenses', location: 'Philippines', periodFrom: '2026-08-20', periodTo: '2026-08-31' },
    { id: '36690', type: 'single', invoiceNumber: 'INV-2026-0390', applicant: ADMIN, partner: 'Northwind Advisory Ltd', account: 'GB33BUKB20201555555555', paymentMethod: 'Wiretransfer', currency: 'USD', amount: 2750, status: 'approved', submittedAt: '2026-09-09', createdBy: ADMIN },
  ),
  single(
    { title: 'Automation Breakdown', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-08-01', periodTo: '2026-08-31' },
    { id: '36540', type: 'recurring', invoiceNumber: '', applicant: AUTOMATION, partner: 'Test Admin', account: 'BE71096123456769', paymentMethod: 'YourSafe', currency: 'USD', amount: 450, status: 'paid', submittedAt: '2026-09-05', createdBy: AUTOMATION },
  ),
  single(
    { title: 'Security and privacy checklist', natureOfService: 'Consulting', costCentre: 'Legal Expenses', location: 'United Kingdom', periodFrom: '2026-08-18', periodTo: '2026-08-29' },
    { id: '36412', type: 'single', invoiceNumber: 'RCB-2026-031', applicant: JOHN, partner: 'Riverlane Consulting BV', account: 'NL91ABNA0417164300', paymentMethod: 'SEPA', currency: 'EUR', amount: 640, status: 'approved', submittedAt: '2026-09-03', createdBy: JOHN },
  ),
  single(
    { title: 'Recruitment fair stand', natureOfService: 'Recruitment', costCentre: 'HR Expenses', location: 'Philippines', periodFrom: '2026-08-24', periodTo: '2026-08-25' },
    { id: '36388', type: 'single', invoiceNumber: 'MPC-0826', applicant: BRYAN, partner: 'Manila Print Co.', account: 'PH12345678901234', paymentMethod: 'Wiretransfer', currency: 'PHP', amount: 12500, status: 'pending', submittedAt: '2026-09-02', createdBy: BRYAN },
  ),
  single(
    { title: 'Website redesign – phase 1', natureOfService: 'Advertising', costCentre: 'Marketing Expenses', location: 'United States', periodFrom: '2026-08-01', periodTo: '2026-08-28' },
    { id: '36254', type: 'single', invoiceNumber: 'HS-4388', applicant: MARIA, partner: 'Harbourline Studio', account: '**** **** **** 4821', paymentMethod: 'Credit Card', currency: 'USD', amount: 5200, status: 'paid', submittedAt: '2026-08-29', createdBy: MARIA },
  ),
  single(
    { title: 'Recurring 1', natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-07-01', periodTo: '2026-07-31' },
    { id: '36101', type: 'recurring', invoiceNumber: '', applicant: NEW_TEST, partner: 'Test Admin', account: 'BE71096123456769', paymentMethod: 'YourSafe', currency: 'USD', amount: 900, status: 'rejected', submittedAt: '2026-08-27', createdBy: NEW_TEST },
  ),
  single(
    { title: 'Training workshop', natureOfService: 'Training', costCentre: 'HR Expenses', location: 'Romania', periodFrom: '2026-08-11', periodTo: '2026-08-12' },
    { id: '35987', type: 'single', invoiceNumber: 'CE-2026-097', applicant: ANA, partner: 'Carpathia Events SRL', account: 'RO49AAAA1B31007593840000', paymentMethod: 'SEPA', currency: 'RON', amount: 1500, status: 'pending', submittedAt: '2026-08-25', createdBy: ANA },
  ),
];

/** The Account column's last line, as Detail Label's Label and Value: "IBAN Account:" …, or "Credit Card details:" … for a card. */
export const accountLine = (cost: Pick<Cost, 'paymentMethod' | 'account'>) => ({
  label: cost.paymentMethod === 'Credit Card' ? 'Credit Card details:' : 'IBAN Account:',
  value: cost.account,
});

/* ── Change history (Audit Logs: Admin 2102:5857; pattern 08, 526:5189) ──── */

export type AuditActivity = 'created' | 'updated' | 'deleted';

/** Activity's label and Tag status. Pattern 08 tags Updated as Info; the Admin screen tags it Completed. */
export const auditActivityTag: Record<AuditActivity, { label: string; status: 'completed' | 'info' | 'error' }> = {
  created: { label: 'Created', status: 'completed' },
  updated: { label: 'Updated', status: 'info' },
  deleted: { label: 'Deleted', status: 'error' },
};

/** One changed field: a Table / Change Diff row. */
export interface CostChange {
  field: string;
  /** The old value. None on a Created entry: Change Diff Row's Show Before off. */
  before?: string;
  after: string;
}

export interface AuditLogEntry {
  id: string;
  costId: string;
  user: Person;
  /** Timestamp, to the minute ("2026-10-08T09:42"). */
  at: string;
  activity: AuditActivity;
  /** The Before/After table "View Changes" opens. Empty for a deleted cost, which shows an Alert instead. */
  changes: CostChange[];
}

/** Newest first. Pattern 08's four entries, then the Admin screen's. */
export const auditLog: AuditLogEntry[] = [
  { id: 'log-12', costId: '32430', user: ADMIN, at: '2026-10-08T09:42', activity: 'updated', changes: [{ field: 'Status', before: 'Unknown', after: 'Pending' }] },
  { id: 'log-11', costId: '32418', user: MARIA, at: '2026-10-07T16:05', activity: 'deleted', changes: [] },
  { id: 'log-10', costId: '32411', user: JOHN, at: '2026-10-07T11:20', activity: 'created', changes: [{ field: 'Amount', after: 'GBP 2400' }, { field: 'Status', after: 'Pending' }] },
  { id: 'log-9', costId: '32402', user: ADMIN, at: '2026-10-06T14:58', activity: 'updated', changes: [{ field: 'Amount', before: 'EUR 3000', after: 'EUR 3150' }, { field: 'Status', before: 'Pending', after: 'Approved' }] },
  { id: 'log-8', costId: '37027', user: ADMIN, at: '2026-09-24T00:49', activity: 'deleted', changes: [] },
  { id: 'log-7', costId: '37026', user: ADMIN, at: '2026-09-24T00:48', activity: 'deleted', changes: [] },
  { id: 'log-6', costId: '37026', user: ADMIN, at: '2026-09-24T00:48', activity: 'updated', changes: [{ field: 'Payment Method', before: 'Wiretransfer', after: 'YourSafe' }] },
  { id: 'log-5', costId: '37024', user: ADMIN, at: '2026-09-24T00:47', activity: 'deleted', changes: [] },
  { id: 'log-4', costId: '37025', user: ADMIN, at: '2026-09-24T00:47', activity: 'deleted', changes: [] },
  { id: 'log-3', costId: '37018', user: ADMIN, at: '2026-09-23T13:50', activity: 'deleted', changes: [] },
  { id: 'log-2', costId: '37017', user: ADMIN, at: '2026-09-23T13:47', activity: 'deleted', changes: [] },
  { id: 'log-1', costId: '37017', user: ADMIN, at: '2026-09-23T13:46', activity: 'updated', changes: [{ field: 'Invoice #', before: 'INV-2601', after: 'INV-2602' }] },
];

/* ── Recurring costs (Admin 2102:6598, User 2102:1245; U04, 545:18695) ───── */

export type FrequencyUnit = 'Day' | 'Week' | 'Month';

/** One Payment Row in Payment Schedules: Done with its date, or Upcoming. */
export interface PaymentScheduleRow {
  date: string;
  status: 'done' | 'upcoming';
}

export interface RecurringCost {
  id: string;
  createdBy: Person;
  /** "Every 3 weeks": Frequency Value and Frequency Unit. The table prints "3 weeks". */
  frequency: { value: number; unit: FrequencyUnit };
  status: 'active' | 'stopped';
  applicant: Person;
  createdAt: string;
  startsAt: string;
  currency: Currency;
  partner: string;
  paymentMethod: PaymentMethod;
  account: string;
  breakdowns: CostBreakdown[];
  schedule: PaymentScheduleRow[];
}

/** "1 week", "3 weeks", "1 month": the Frequency column. */
export const formatFrequency = ({ value, unit }: RecurringCost['frequency']) =>
  `${value} ${unit.toLowerCase()}${value === 1 ? '' : 's'}`;

/** What each payment of a recurring cost comes to, as a Payment Row's Amount prints it: "USD 900". */
export const formatPaymentAmount = ({ currency, breakdowns }: Pick<RecurringCost, 'currency' | 'breakdowns'>) =>
  formatAmount(currency, breakdowns.reduce((sum, line) => sum + line.amount, 0));

const RECURRING_LINE: CostBreakdown = {
  title: 'Recurring 1', amount: 900, natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-08-01', periodTo: '2026-08-31',
};

/** The User screen's six (U04), then the Admin screen's. #1882 is the one Figma edits and schedules. */
export const recurringCosts: RecurringCost[] = [
  {
    id: '1882', createdBy: QA, frequency: { value: 3, unit: 'Week' }, status: 'active', applicant: QA, createdAt: '2026-07-29', startsAt: '2026-07-30',
    currency: 'USD', partner: 'Test Admin', paymentMethod: 'YourSafe', account: 'BE71096123456769', breakdowns: [RECURRING_LINE],
    schedule: [
      { date: '2026-07-30', status: 'done' },
      { date: '2026-08-20', status: 'done' },
      { date: '2026-09-10', status: 'done' },
      { date: '2026-10-01', status: 'upcoming' },
      { date: '2026-10-22', status: 'upcoming' },
    ],
  },
  {
    id: '1240', createdBy: QA, frequency: { value: 1, unit: 'Week' }, status: 'active', applicant: BRYAN, createdAt: '2026-07-02', startsAt: '2026-09-01',
    currency: 'USD', partner: 'Jane Doe', paymentMethod: 'Wiretransfer', account: '982389428934', breakdowns: [{ ...RECURRING_LINE, amount: 350, costCentre: 'Travel Expenses', natureOfService: 'Testing' }],
    schedule: [
      { date: '2026-09-01', status: 'done' },
      { date: '2026-09-08', status: 'done' },
      { date: '2026-09-15', status: 'done' },
      { date: '2026-09-22', status: 'upcoming' },
      { date: '2026-09-29', status: 'upcoming' },
    ],
  },
  {
    id: '1239', createdBy: QA, frequency: { value: 1, unit: 'Week' }, status: 'active', applicant: BRYAN, createdAt: '2026-07-02', startsAt: '2026-07-06',
    currency: 'USD', partner: 'Jane Doe', paymentMethod: 'Wiretransfer', account: '982389428934', breakdowns: [RECURRING_LINE],
    schedule: [
      { date: '2026-09-07', status: 'done' },
      { date: '2026-09-14', status: 'done' },
      { date: '2026-09-21', status: 'done' },
      { date: '2026-09-28', status: 'upcoming' },
    ],
  },
  {
    id: '1207', createdBy: QA, frequency: { value: 1, unit: 'Week' }, status: 'stopped', applicant: QA002, createdAt: '2026-07-01', startsAt: '2026-07-06',
    currency: 'USD', partner: 'Jane Doe', paymentMethod: 'Wiretransfer', account: '982389428934', breakdowns: [RECURRING_LINE],
    schedule: [
      { date: '2026-07-06', status: 'done' },
      { date: '2026-07-13', status: 'done' },
    ],
  },
  {
    id: '9', createdBy: QA, frequency: { value: 1, unit: 'Month' }, status: 'active', applicant: NEW_TEST, createdAt: '2026-04-16', startsAt: '2026-05-01',
    currency: 'EUR', partner: 'Riverlane Consulting BV', paymentMethod: 'SEPA', account: 'NL91ABNA0417164300', breakdowns: [{ ...RECURRING_LINE, amount: 1250, costCentre: 'Legal Expenses', natureOfService: 'Consulting', location: 'United Kingdom' }],
    schedule: [
      { date: '2026-08-01', status: 'done' },
      { date: '2026-09-01', status: 'done' },
      { date: '2026-10-01', status: 'upcoming' },
      { date: '2026-11-01', status: 'upcoming' },
    ],
  },
  {
    id: '6', createdBy: QA, frequency: { value: 1, unit: 'Month' }, status: 'active', applicant: QA, createdAt: '2026-02-26', startsAt: '2026-03-01',
    currency: 'USD', partner: 'Test Admin', paymentMethod: 'YourSafe', account: 'BE71096123456769', breakdowns: [RECURRING_LINE],
    schedule: [
      { date: '2026-08-01', status: 'done' },
      { date: '2026-09-01', status: 'done' },
      { date: '2026-10-01', status: 'upcoming' },
    ],
  },
  {
    id: '2494', createdBy: ADMIN, frequency: { value: 1, unit: 'Month' }, status: 'active', applicant: AUTOMATION, createdAt: '2026-09-21', startsAt: '2026-10-01',
    currency: 'USD', partner: 'Test Admin', paymentMethod: 'YourSafe', account: 'BE71096123456769', breakdowns: [{ ...RECURRING_LINE, amount: 450 }],
    schedule: [
      { date: '2026-10-01', status: 'upcoming' },
      { date: '2026-11-01', status: 'upcoming' },
    ],
  },
  {
    id: '2480', createdBy: ADMIN, frequency: { value: 1, unit: 'Month' }, status: 'active', applicant: AUTOMATION, createdAt: '2026-09-18', startsAt: '2026-10-01',
    currency: 'USD', partner: 'Test Admin', paymentMethod: 'YourSafe', account: 'BE71096123456769', breakdowns: [{ ...RECURRING_LINE, amount: 450 }],
    schedule: [{ date: '2026-10-01', status: 'upcoming' }],
  },
  {
    id: '2192', createdBy: ADMIN, frequency: { value: 1, unit: 'Week' }, status: 'active', applicant: { name: 'Test_Recurring_09.01', email: QA.email }, createdAt: '2026-09-01', startsAt: '2026-09-07',
    currency: 'PHP', partner: 'Manila Print Co.', paymentMethod: 'Wiretransfer', account: 'PH12345678901234', breakdowns: [{ ...RECURRING_LINE, amount: 12500 }],
    schedule: [
      { date: '2026-09-07', status: 'done' },
      { date: '2026-09-14', status: 'done' },
      { date: '2026-09-21', status: 'done' },
      { date: '2026-09-28', status: 'upcoming' },
    ],
  },
  {
    id: '2087', createdBy: ADMIN, frequency: { value: 2, unit: 'Month' }, status: 'active', applicant: { name: 'KYNA TEST 1 - EDIT 2', email: QA.email }, createdAt: '2026-08-26', startsAt: '2026-09-01',
    currency: 'USD', partner: 'Jane Doe', paymentMethod: 'Wiretransfer', account: '982389428934', breakdowns: [RECURRING_LINE],
    schedule: [
      { date: '2026-09-01', status: 'done' },
      { date: '2026-11-01', status: 'upcoming' },
    ],
  },
];

/* ── Drafts (Admin 2102:7086; U03) ────────────────────────────────────────── */

export interface Draft {
  id: string;
  createdBy: Person;
  /** "Single", or a recurring cost's frequency ("1 month"). */
  frequency: string;
  applicant: Person;
  createdAt: string;
}

export const drafts: Draft[] = [
  { id: '36741', createdBy: ADMIN, frequency: '1 month', applicant: AUTOMATION, createdAt: '2026-09-21' },
  { id: '36701', createdBy: ADMIN, frequency: 'Single', applicant: AUTOMATION, createdAt: '2026-09-18' },
  { id: '36700', createdBy: ADMIN, frequency: '1 month', applicant: AUTOMATION, createdAt: '2026-09-18' },
  { id: '36544', createdBy: ADMIN, frequency: 'Single', applicant: AUTOMATION, createdAt: '2026-09-15' },
  { id: '36037', createdBy: ADMIN, frequency: 'Single', applicant: AUTOMATION, createdAt: '2026-09-09' },
  { id: '36027', createdBy: ADMIN, frequency: '1 month', applicant: AUTOMATION, createdAt: '2026-09-09' },
  { id: '35323', createdBy: ADMIN, frequency: 'Single', applicant: AUTOMATION, createdAt: '2026-09-01' },
  { id: '34941', createdBy: ADMIN, frequency: 'Single', applicant: ADMIN, createdAt: '2026-08-28' },
];

/* ── Contacts (Admin → Contacts, 2102:6234) ───────────────────────────────── */

/** A message sent through the contact form. Senders are fictional (the screen shows real submissions). */
export interface Contact {
  id: string;
  name: string;
  email: string;
  receivedAt: string;
  subject: string;
  message: string;
}

export const contacts: Contact[] = [
  { id: 'c-1', name: 'Lena Ortiz', email: 'lena.ortiz@example.com', receivedAt: '2025-03-11', subject: 'Payments', message: 'test test' },
  { id: 'c-2', name: 'Lena Ortiz', email: 'lena.ortiz@example.com', receivedAt: '2025-03-13', subject: 'Payments', message: 'tttttttttt' },
  { id: 'c-3', name: 'Paolo Mendez', email: 'paolo.mendez@example.com', receivedAt: '2025-03-14', subject: 'Payments', message: 'Hello, this is for testing' },
  { id: 'c-4', name: 'ITPM', email: 'itpm@example.com', receivedAt: '2025-03-14', subject: 'Payments', message: 'Testing Messages' },
  { id: 'c-5', name: 'Sam Holt', email: 'sam.holt@example.com', receivedAt: '2025-07-16', subject: 'Payments', message: 'I am not offering SEO or Pay Per Click Advertising services. This is something entirely different. Let me demonstrate how it works.' },
  { id: 'c-6', name: 'testthis', email: 'testthis@example.com', receivedAt: '2025-09-01', subject: 'Payments', message: 'test mail, kindly ignore this' },
  { id: 'c-7', name: 'Rhea Valdez', email: 'rhea.valdez@example.com', receivedAt: '2025-09-16', subject: 'Payments', message: 'Can I get a free demo? Thanks' },
  { id: 'c-8', name: 'sample', email: 'sample@example.com', receivedAt: '2025-09-23', subject: 'Payments', message: 'This is a test. This is a test. This is a test. This is a test.' },
];

/* ── Exports (Admin → Exports, 2102:6902; pattern 13, 529:6821) ───────────── */

export type ExportStatus = 'completed' | 'processing' | 'failed';
export type ExportType = 'zip' | 'excel';

/** Status → Tag (Completed: Completed, Failed: Error, Processing: Pending). Type → Tag Info ("Zip", "Excel"). */
export const exportStatusTag: Record<ExportStatus, { label: string; status: 'completed' | 'pending' | 'error' }> = {
  completed: { label: 'Completed', status: 'completed' },
  processing: { label: 'Processing', status: 'pending' },
  failed: { label: 'Failed', status: 'error' },
};

export const exportTypeLabel: Record<ExportType, string> = { zip: 'Zip', excel: 'Excel' };

export interface ExportRecord {
  id: string;
  name: string;
  type: ExportType;
  status: ExportStatus;
  createdBy: string;
  createdAt: string;
  /** "253 B", "6.5 KB"; "-" when it failed. */
  size: string;
  /** The filters the export was made with (Filter / Summary, "Current Filters"). */
  filters: { key: string; value: string }[];
}

const ALL_FILTERS = [
  { key: 'Status', value: 'All' },
  { key: 'Payment Method', value: 'All' },
  { key: 'Currency', value: 'All' },
];

export const exportRecords: ExportRecord[] = [
  { id: '6846', name: 'invoices-12-2026-09-24-004712.zip', type: 'zip', status: 'completed', createdBy: 'Admin Account', createdAt: '2026-09-24', size: '253 B', filters: ALL_FILTERS },
  { id: '6845', name: 'costs-12-2026-09-24-004659.xlsx', type: 'excel', status: 'completed', createdBy: 'Admin Account', createdAt: '2026-09-24', size: '6.5 KB', filters: ALL_FILTERS },
  { id: '6844', name: 'invoices-12-2026-09-23-134447.zip', type: 'zip', status: 'completed', createdBy: 'Admin Account', createdAt: '2026-09-23', size: '253 B', filters: ALL_FILTERS },
  { id: '6843', name: 'costs-12-2026-09-23-134434.xlsx', type: 'excel', status: 'completed', createdBy: 'Admin Account', createdAt: '2026-09-23', size: '6.5 KB', filters: [{ key: 'Status', value: 'Pending' }, ...ALL_FILTERS.slice(1)] },
  { id: '6842', name: 'invoices-12-2026-09-23-084421.zip', type: 'zip', status: 'completed', createdBy: 'Admin Account', createdAt: '2026-09-23', size: '4.3 KB', filters: ALL_FILTERS },
  { id: '6841', name: 'costs-12-2026-09-23-084350.xlsx', type: 'excel', status: 'completed', createdBy: 'Admin Account', createdAt: '2026-09-23', size: '6.7 KB', filters: ALL_FILTERS },
  { id: '6840', name: 'Zip export', type: 'zip', status: 'failed', createdBy: 'Admin Account', createdAt: '2026-09-23', size: '-', filters: ALL_FILTERS },
  { id: '6839', name: 'costs-12-2026-09-23-084118.xlsx', type: 'excel', status: 'completed', createdBy: 'Admin Account', createdAt: '2026-09-23', size: '6.7 KB', filters: [{ key: 'Status', value: 'Approved' }, ...ALL_FILTERS.slice(1)] },
];

/** Card / Stat Row – Exports (387:3601): the totals across every export, not just the rows above. */
export const exportStats = { total: 6003, completed: 5665, processing: 0, failed: 338 };

/* ── Announcements and changelog (Admin 2102:6628; patterns 14 / U07) ────── */

export type AnnouncementAudience = 'All' | 'Admin' | 'User';

export interface Announcement {
  /** The # column. */
  id: string;
  title: string;
  /** "2.5.6": the Tag shows "v2.5.6". */
  version: string;
  releasedAt: string;
  /** Features: the table shows the first and "+N more". */
  features: string[];
  audience: AnnouncementAudience;
  active: boolean;
}

export const announcements: Announcement[] = [
  { id: '1', title: 'WELCOME TO THE NEW UPDATE FOR THIS MONTH', version: '2.5.6', releasedAt: '2026-08-10', features: ['New update for CAF'], audience: 'All', active: true },
  { id: '2', title: 'New Update Available', version: '2.1.2', releasedAt: '2026-07-31', features: ['Test'], audience: 'All', active: true },
  { id: '3', title: 'Testing 1234', version: '2.1.1', releasedAt: '2026-07-31', features: ['One', 'Two', 'Three'], audience: 'Admin', active: false },
  { id: '4', title: 'New Update Available', version: '2.2.4', releasedAt: '2026-07-30', features: ['Test'], audience: 'User', active: true },
  { id: '5', title: 'New Update Available', version: '2.2.2', releasedAt: '2026-07-24', features: ['TESTING FEATURE', 'Reporting'], audience: 'All', active: false },
  { id: '6', title: 'Test Announcement - Changelog', version: '2.2.1', releasedAt: '2026-07-09', features: ['One', 'Two'], audience: 'All', active: false },
  { id: '7', title: 'New Update Available Test', version: '2.1.13', releasedAt: '2026-07-05', features: ['Test', 'Two', 'Three'], audience: 'All', active: false },
];

/** Card / Stat Row – Announcements (389:163). */
export const announcementStats = { total: 7, latestVersion: '2.5.6', lastUpdated: '2026-08-10' };

/** The Changelog page (U07): newest first; only the latest has the New tag. */
export interface ChangelogRelease {
  title: string;
  version: string;
  releasedAt: string;
  notes: string[];
  isNew: boolean;
}

export const changelog: ChangelogRelease[] = [
  { title: 'WELCOME TO THE NEW UPDATE FOR CAF', version: '2.5.6', releasedAt: '2026-08-10', notes: ['new update for CAF', 'Improved export performance'], isNew: true },
  { title: 'IMPROVED BULK UPLOAD', version: '2.5.0', releasedAt: '2026-07-02', notes: ['new update for CAF', 'Improved export performance'], isNew: false },
  { title: 'RECURRING COSTS', version: '2.4.0', releasedAt: '2026-05-18', notes: ['new update for CAF', 'Improved export performance'], isNew: false },
];

/* ── Menu copy (pattern 03, 520:2387; pattern 07, 524:4713; Export 2102:5821) ── */

/** Each list's row menu, in Figma's order: the most common action first, the destructive one last. */
export const rowActionLabels = {
  costs: ['Approve', 'Reject', 'View invoices', 'Request adjustment', 'Delete'],
  recurringCosts: ['Edit', 'View Schedules', 'Stop', 'Delete'],
  exports: ['Download', 'Retry', 'View Details', 'Delete'],
  drafts: ['Edit', 'Delete'],
  default: ['Edit', 'Delete'],
} as const;

/** The bulk "Change Status (n)" menu: label → the status it sets. */
export const bulkStatusActions: { label: string; status: CostStatus }[] = [
  { label: 'Reject', status: 'rejected' },
  { label: 'Approve', status: 'approved' },
  { label: 'Mark as Paid', status: 'paid' },
];

/** The Costs page's Export menu. */
export const exportMenuItems = ['Export Costs', 'Export Invoices'] as const;

/* ── Pattern sections ─────────────────────────────────────────────────────
   Builders: add your own data below, in a section headed with your slug
   (e.g. "── list-page ──"), so merges stay clean. */

/* ── list-page, my-costs, filters (wf/list: patterns 01, U01, 02) ──────────── */

/**
 * The day the list patterns' date pickers treat as today: the last day of the
 * range Figma picks in pattern 02's step 4 (520:1867), so the picker opens on
 * October 2026 as Figma draws it. A local date, at midnight.
 */
export const LIST_TODAY = new Date(2026, 9, 24);

/** Rows per page on the Costs lists: the eight rows the Admin and User Costs screens show. */
export const COSTS_PAGE_SIZE = 8;

/* U01 · My costs list, step 1 (545:13511): the User Costs screen's eight rows, in its order. */
const MY_COSTS_SCREEN = ['37022', '37021', '37003', '36723', '36664', '36663', '36612', '36078'];

/**
 * The signed-in user's costs (U01, 545:13220), newest first: the User Costs
 * screen's eight rows, then the older costs, so pagination has a second page.
 * Figma's screen mixes applicants under "Hi, QA Test"; the rows are kept as
 * Figma draws them (a design question in docs/patterns.md).
 */
export const myCosts: Cost[] = [
  ...MY_COSTS_SCREEN.map((id) => costs.find((c) => c.id === id)!),
  ...costs.filter((c) => c.submittedAt < '2026-09-10'),
];

/* ── forms ─────────────────────────────────────────────────────────────────
   Patterns 04 Confirm destructive actions (523:2612), 05 Create or edit in a
   modal (523:3452), 06 Edit in a side sheet (524:3609), 09 / U02 Multi-section
   form (527:5661, 545:17897), 10 / U05 File upload (527:6028, 545:19071) and
   U03 Save and resume drafts (545:18365). */

/**
 * The signed-in user on the User screens ("Hi, QA Test"). Form / New Cost
 * pre-fills Applicant name and Email from the account (U02, step 2). Figma's
 * address is a personal one; this is the fixture's QA Test.
 */
export const currentUser: Person = { name: 'QA Test', email: 'qa.test@example.com' };

/** Cost Center options (Cost Breakdown dialog, Add New Cost Center): the distinct names, in fixture order. */
export const costCentreNames: string[] = [...new Set(costCentres.map((c) => c.name))];

/** Nature of Service options (Cost Breakdown dialog). */
export const natureOfServices: string[] = [...new Set(costCentres.map((c) => c.natureOfService))];

/** Frequency Unit options (U02's Recurring Details: Frequency Value and Frequency Unit). */
export const frequencyUnits: FrequencyUnit[] = ['Day', 'Week', 'Month'];

/** "Day" → "days": the recurrence summary ("This will recur every 1 month"). */
export const recurrenceSummary = (value: number, unit: FrequencyUnit) =>
  `This will recur every ${value} ${unit.toLowerCase()}${value === 1 ? '' : 's'}`;

/** Pattern 10's invoice rules: what the zone's Hint lists, and why a file is turned down. */
export const invoiceRules = {
  accept: '.doc,.docx,.pdf,.png,.jpg,.jpeg',
  hint: 'DOC, DOCX, PDF, PNG, JPG, JPEG accepted (Max 10.0MB)',
  maxBytes: 10 * 1024 * 1024,
  typeReason: 'File type not supported. Use DOC, DOCX, PDF, PNG, JPG or JPEG.',
  sizeReason: 'File is larger than 10.0MB.',
} as const;

/** Form / Bulk Upload (191:433): CSV only. */
export const csvRules = {
  accept: '.csv,text/csv',
  title: 'Click or drag CSV file to upload',
  hint: 'Only CSV files are accepted',
  typeReason: 'File type not supported. Upload a CSV file.',
} as const;

/** A saved attachment: the Invoices dialog (pattern 10 step 4, "Cost #32430 · 2 files"). */
export interface Attachment {
  name: string;
  /** Bytes; the chip shows formatFileSize(). */
  size: number;
  type: string;
}

/** Each cost's saved invoices. Costs not listed have none. */
export const costInvoices: Record<string, Attachment[]> = {
  '32430': [
    { name: 'invoice-september.pdf', size: 250_880, type: 'application/pdf' },
    { name: 'receipt-0927.png', size: 1_258_291, type: 'image/png' },
  ],
  '32436': [{ name: 'INV-2026-0436.pdf', size: 184_320, type: 'application/pdf' }],
};

/**
 * Pattern 09 step 4 / pattern 06's side sheet: the two breakdowns Figma lists
 * ("Breakdown 1 · Employee Expenses · Salary · Philippines · USD 900",
 * "Breakdown 2 · Travel Expenses · Testing · Philippines · USD 350").
 */
export const sampleBreakdowns: CostBreakdown[] = [
  { title: 'Breakdown 1', amount: 900, natureOfService: 'Salary', costCentre: 'Employee Expenses', location: 'Philippines', periodFrom: '2026-11-01', periodTo: '2026-11-30' },
  { title: 'Breakdown 2', amount: 350, natureOfService: 'Testing', costCentre: 'Travel Expenses', location: 'Philippines', periodFrom: '2026-11-01', periodTo: '2026-11-30' },
];

/**
 * Cost centres that costs still use, so deleting them fails (pattern 04 step
 * 4: "Couldn’t delete. This cost center is used by 12 costs."). Keyed by id.
 */
export const costCentreUsage: Record<string, number> = { 'cc-3': 12 };

/** Pattern U05 step 5: the rows a bulk upload turned down, and why. */
export const bulkUploadRejections = [
  { row: 4, reason: 'Amount is missing' },
  { row: 9, reason: 'Unknown cost center' },
];

/* ── feedback (patterns 11–14 and U07: states, feedback messages, overview,
   announcements) ─────────────────────────────────────────────────────────── */

/** "2026-10-08" + 7 → "2026-10-15": Export Details' Valid until is a week after the export (529:6740). */
export const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** A person's email, from `users`, for the two-line Created By cell (pattern 13 shows name over email). */
export const emailOf = (name: string) => users.find((u) => u.name === name)?.email ?? '';

/** The Exports table's Downloads column and Export Details' Downloads (pattern 13, 529:6242). */
export const exportDownloads: Record<string, number> = {
  '6846': 0,
  '6845': 3,
  '6844': 1,
  '6843': 0,
  '6842': 2,
  '6841': 0,
  '6840': 0,
  '6839': 1,
};

/** How long an export's file stays downloadable: Export Details' Valid until (529:6740). */
export const EXPORT_VALID_DAYS = 7;

/** Pattern 12's toasts (528:6052): short, past tense, specific; an error says what to do next. */
export const toastMessages = {
  costSaved: 'Cost saved.',
  exportStarted: 'Export started. It will appear in Exports when it’s ready.',
  rowsSkipped: '3 rows were skipped because the currency is disabled.',
  uploadFailed: 'Upload failed. Check your connection and try again.',
} as const;

/** Pattern 11's empty and not-found copy (528:5978, 528:6013). */
export const emptyStateCopy = {
  announcements: { title: 'No announcements yet', description: 'Create an announcement to tell users what’s new.' },
  noResults: { title: 'No items.' },
  notFound: {
    code: '404',
    title: 'The page you were looking for cannot be found.',
    description: 'It’s likely an incorrect or outdated link.',
    action: 'Go back home',
  },
} as const;

/** The Changelog page's heading and description (U07, 545:26637). */
export const changelogPage = { title: 'Changelog', description: 'Everything that’s new in the Cost Application Form.' };

/* ── app-shell, account-settings (patterns 15 / U08 and U06; branch wf/shell) ──── */

/**
 * Who is signed in to each app, as the headers greet them: "Hi, Admin
 * Account" (pattern 15, 530:7296) and "Hi, QA Test" (U08 and U06, 545:24751).
 */
export const signedInAccounts: Record<'admin' | 'user', User> = {
  admin: users.find((u) => u.id === '109')!,
  user: users.find((u) => u.id === '111')!,
};

/** A row of Manage Currencies (U06, 545:24755): Currency Name, Code, Enabled. */
export interface ManagedCurrency {
  code: string;
  name: string;
  enabled: boolean;
}

/**
 * Manage Currencies' list. Figma's seven rows come first, in its order (the
 * enabled ones, then Albanian Lek, off); the rest are more ISO currencies,
 * off and A–Z, so the dialog's pagination has pages to turn (Figma shows 25).
 */
export const managedCurrencies: ManagedCurrency[] = [
  ...currencies.map(({ code, name, enabled }) => ({ code, name, enabled })),
  { code: 'AUD', name: 'Australian Dollar', enabled: false },
  { code: 'BGN', name: 'Bulgarian Lev', enabled: false },
  { code: 'CAD', name: 'Canadian Dollar', enabled: false },
  { code: 'CZK', name: 'Czech Koruna', enabled: false },
  { code: 'DKK', name: 'Danish Krone', enabled: false },
  { code: 'JPY', name: 'Japanese Yen', enabled: false },
  { code: 'NOK', name: 'Norwegian Krone', enabled: false },
  { code: 'PLN', name: 'Polish Złoty', enabled: false },
  { code: 'RSD', name: 'Serbian Dinar', enabled: false },
  { code: 'SGD', name: 'Singapore Dollar', enabled: false },
  { code: 'ZAR', name: 'South African Rand', enabled: false },
  { code: 'SEK', name: 'Swedish Krona', enabled: false },
  { code: 'CHF', name: 'Swiss Franc', enabled: false },
  { code: 'TRY', name: 'Turkish Lira', enabled: false },
];

/* ── templates (wf/templates: Templates/App shell, List page, Overview list,
   Form page, Overlay flows; CAF Design file z7L8r4nq6nL6Yfa8vvxJhO) ──────── */

/** The templates' today (2 November 2026): calendars open on it, so snapshots hold still. */
export const TEMPLATE_TODAY = new Date(2026, 10, 2);

/** User → Recurring Costs (2102:1229): the signed-in user's six, as the screen lists them. */
export const userRecurringCosts: RecurringCost[] = recurringCosts.slice(0, 6);

/** The id Save to Drafts gives a new draft on the Create Cost screen: one after the newest. */
export const NEW_DRAFT_ID = String(Math.max(...drafts.map((d) => Number(d.id))) + 1);
