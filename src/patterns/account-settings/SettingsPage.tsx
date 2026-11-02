import * as React from 'react';
import { Button } from '../../components/button';
import { FormSectionHeader } from '../../components/form-section-header';
import { TextField } from '../../components/text-field';
import { PageHeader } from '../../components/page-header';

/**
 * SettingsPage — a story-level composition, not a library component: U06's
 * Settings (545:25204), "its own page: My Account Details with Email and
 * Name, and Save".
 *
 * Figma → code:
 * - Settings Card (545:25208; 576 wide, centred, 32 padding, 20 between,
 *   `surface.base` fill, 1px `stroke.subtle`, radius 12) → a centred column,
 *   `max-w-xl` with `gap-5`. There is no Card component, so the fill, stroke
 *   and radius are left out (docs/patterns.md).
 * - "Settings" (text.primary) → PageHeader's title, the page's `<h1>`.
 * - "My Account Details" (text.secondary) → FormSectionHeader, an `<h2>`.
 * - Form / Field – Text ×2 (Email, Name) → TextField, `type="email"` and
 *   text. Both are required here (an account needs both), so they show the
 *   marker Figma doesn't draw.
 * - Button / Normal, Default, "Save" → Button, the form's submit.
 *
 * Save reads the form (FormData), checks it, and either shows the errors
 * (focus goes to the first field in error) or calls `onSave` with the
 * details. The owner confirms with a Toast (U06 "How it works" 4).
 */
export interface AccountDetails {
  email: string;
  name: string;
}

type Errors = Partial<Record<keyof AccountDetails, string>>;

const FIELDS = ['email', 'name'] as const;

/* Figma's error copy is "<Field> is required." (Add Cost Center – Errors, 523:2713). */
function validate({ email, name }: AccountDetails): Errors {
  const errors: Errors = {};
  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (!name) errors.name = 'Name is required.';
  return errors;
}

export interface SettingsPageProps {
  /** The account as it is: the fields start with it. */
  account: AccountDetails;
  /** Called with the checked details when Save succeeds. */
  onSave: (details: AccountDetails) => void;
}

export function SettingsPage({ account, onSave }: SettingsPageProps) {
  const [errors, setErrors] = React.useState<Errors>({});

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const details = {
      email: String(data.get('email') ?? '').trim(),
      name: String(data.get('name') ?? '').trim(),
    };
    const next = validate(details);
    setErrors(next);
    const first = FIELDS.find((field) => next[field]);
    if (first) {
      (form.elements.namedItem(first) as HTMLInputElement | null)?.focus();
      return;
    }
    onSave(details);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <PageHeader title="Settings" />
      <form noValidate aria-label="My Account Details" onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormSectionHeader title="My Account Details" />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={account.email}
          error={errors.email}
        />
        <TextField label="Name" name="name" autoComplete="name" required defaultValue={account.name} error={errors.name} />
        <Button type="submit" className="self-start">
          Save
        </Button>
      </form>
    </div>
  );
}
