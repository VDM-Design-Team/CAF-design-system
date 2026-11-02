import * as React from 'react';
import { Alert } from '../../components/alert';
import { Button } from '../../components/button';
import { CheckboxField } from '../../components/checkbox-field';
import { ModalDialog } from '../../components/modal-dialog';
import { SelectField } from '../../components/select-field';
import { TextField } from '../../components/text-field';
import type { UserRole } from '../fixtures';

/**
 * AddUserDialog — a story-level organism, not a DS component: Add New User
 * as pattern 12 draws it (Step 2, "Alert: context that stays", 528:6197),
 * Modal / Dialog Size=Medium.
 *
 * Figma's content, in order: Name* and Email* (Form / Field – Text), Role*
 * (Form / Field – Dropdown, "User"), Restricted User (Form / Checkbox
 * Field, Bordered: "Users with this role can only see their own costs."),
 * then an Info Alert, "Temporary password": it explains what happens after
 * saving and stays visible while the user fills in the form. Footer: Cancel
 * (Text) and Save.
 *
 * A real form, checked on Save with FormData. Errors appear under the field
 * ("Enter a valid email address, like name@company.com.", 528:6288), say how
 * to fix it, and clear as soon as the value is valid (Step 3); focus goes to
 * the first field in error. Restricted User saves the user with the
 * Restricted User role (the Users list's third role).
 */
export interface NewUser {
  name: string;
  email: string;
  role: UserRole;
}

export interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the checked values. Close the dialog there. */
  onSave: (user: NewUser) => void;
}

type Field = 'name' | 'email';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const check: Record<Field, (value: string) => string | undefined> = {
  name: (v) => (v.trim() ? undefined : 'Enter a name.'),
  email: (v) => (EMAIL.test(v.trim()) ? undefined : 'Enter a valid email address, like name@company.com.'),
};

function AddUserForm({ formId, onSave }: { formId: string; onSave: (user: NewUser) => void }) {
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const [attempt, setAttempt] = React.useState(0);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (attempt > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt]);

  /* A field in error is checked again as it changes: its error clears once the value is valid. */
  const recheck = (field: Field) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setErrors((current) => (current[field] ? { ...current, [field]: check[field](value) } : current));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '');
    const email = String(data.get('email') ?? '');
    const next = { name: check.name(name), email: check.email(email) };
    setErrors(next);
    if (next.name || next.email) {
      setAttempt((n) => n + 1);
      return;
    }
    const role = data.get('restricted') === 'on' ? 'Restricted User' : (String(data.get('role')) as UserRole);
    onSave({ name: name.trim(), email: email.trim(), role });
  };

  return (
    <form id={formId} ref={formRef} noValidate onSubmit={submit} className="flex flex-col gap-6">
      <TextField label="Name" name="name" required autoComplete="off" error={errors.name} onChange={recheck('name')} />
      <TextField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="off"
        error={errors.email}
        onChange={recheck('email')}
      />
      <SelectField label="Role" name="role" required options={['Admin', 'User']} defaultValue="User" />
      <CheckboxField
        label="Restricted User"
        name="restricted"
        bordered
        description="Users with this role can only see their own costs."
      />
      <Alert
        type="info"
        title="Temporary password"
        message="A temporary password is emailed to the user. They’ll be asked to change it the first time they sign in."
      />
    </form>
  );
}

export function AddUserDialog({ open, onClose, onSave }: AddUserDialogProps) {
  const formId = `${React.useId()}-form`;
  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Add New User"
      size="medium"
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            Save
          </Button>
        </>
      }
    >
      {/* The form unmounts with the dialog, so it opens empty every time. */}
      <AddUserForm formId={formId} onSave={onSave} />
    </ModalDialog>
  );
}
