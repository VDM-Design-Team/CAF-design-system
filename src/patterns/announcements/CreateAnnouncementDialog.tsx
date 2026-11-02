import * as React from 'react';
import { Alert } from '../../components/alert';
import { Button } from '../../components/button';
import { DateField } from '../../components/date-field';
import { ModalDialog } from '../../components/modal-dialog';
import { RadioGroup } from '../../components/radio-group';
import { RepeatableField } from '../../components/repeatable-field';
import { TextField } from '../../components/text-field';
import { ToggleField } from '../../components/toggle-field';
import type { Announcement, AnnouncementAudience } from '../fixtures';

/**
 * CreateAnnouncementDialog — a story-level organism, not a DS component:
 * "Admins create an announcement in a dialog" (pattern 14, Step 1, Modal /
 * Dialog Size=Large, 529:7050).
 *
 * Figma's fields, in order: Title*, Version*, Release Date* (Form / Field –
 * Text, Text, Date); Target Audience (Form / Radio Group: All, Admin, User;
 * "Who should see this announcement."); Features* (Form / Repeatable Field,
 * "Add Feature"); Active (Form / Toggle Field, on; "Only active
 * announcements are shown to users."). Footer: Cancel (Text) and Create.
 *
 * It is a real form: Create submits it, the values are read with FormData,
 * and each field is checked. A field's error shows under it, in the
 * helper's place, and clears as soon as the value is valid (pattern 12);
 * focus goes to the first field in error. RepeatableField has no error
 * slot, so a list with no feature shows a compact error Alert under it
 * (docs/patterns.md asks for one). `onCreate` gets the new announcement.
 */
export type NewAnnouncement = Omit<Announcement, 'id'>;

export interface CreateAnnouncementDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the checked values. Close the dialog there. */
  onCreate: (announcement: NewAnnouncement) => void;
  /** The day the Release Date calendar draws as Today (stories pin it). */
  today?: Date;
}

type Field = 'title' | 'version' | 'releasedAt' | 'features';
type Errors = Partial<Record<Field, string>>;

const MESSAGES: Record<Field, string> = {
  title: 'Enter a title.',
  version: 'Enter a version, like 2.5.6.',
  releasedAt: 'Choose a release date.',
  features: 'Add at least one feature.',
};

const VERSION = /^\d+\.\d+\.\d+$/;

/** Each field's check: the error to show, or nothing. */
const check: Record<Field, (value: string | string[]) => string | undefined> = {
  title: (v) => (String(v).trim() ? undefined : MESSAGES.title),
  version: (v) => (VERSION.test(String(v).trim()) ? undefined : MESSAGES.version),
  releasedAt: (v) => (String(v) ? undefined : MESSAGES.releasedAt),
  features: (v) => ((v as string[]).some((f) => f.trim()) ? undefined : MESSAGES.features),
};

function CreateAnnouncementForm({ formId, onCreate, today }: { formId: string; onCreate: (a: NewAnnouncement) => void; today?: Date }) {
  const [errors, setErrors] = React.useState<Errors>({});
  const [attempt, setAttempt] = React.useState(0);
  const formRef = React.useRef<HTMLFormElement>(null);

  /* After a failed submit, focus the first field in error. */
  React.useEffect(() => {
    if (attempt > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt]);

  /* A field already in error is checked again as it changes, so its error clears once it's valid. */
  const recheck = (field: Field, value: string | string[]) =>
    setErrors((current) => (current[field] ? { ...current, [field]: check[field](value) } : current));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = {
      title: String(data.get('title') ?? ''),
      version: String(data.get('version') ?? ''),
      releasedAt: String(data.get('releasedAt') ?? ''),
      features: data.getAll('features').map(String),
    };
    const next: Errors = {};
    for (const field of Object.keys(check) as Field[]) {
      const error = check[field](values[field]);
      if (error) next[field] = error;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setAttempt((n) => n + 1);
      return;
    }
    onCreate({
      title: values.title.trim(),
      version: values.version.trim(),
      releasedAt: values.releasedAt,
      features: values.features.map((f) => f.trim()).filter(Boolean),
      audience: String(data.get('audience') ?? 'All') as AnnouncementAudience,
      active: data.get('active') === 'on',
    });
  };

  return (
    <form id={formId} ref={formRef} noValidate onSubmit={submit} className="flex flex-col gap-6">
      <TextField
        label="Title"
        name="title"
        required
        error={errors.title}
        onChange={(e) => recheck('title', e.target.value)}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label="Version"
          name="version"
          required
          error={errors.version}
          onChange={(e) => recheck('version', e.target.value)}
        />
        <DateField
          label="Release Date"
          name="releasedAt"
          required
          today={today}
          error={errors.releasedAt}
          onValueChange={(value) => recheck('releasedAt', value)}
        />
      </div>
      <RadioGroup
        label="Target Audience"
        name="audience"
        options={['All', 'Admin', 'User']}
        defaultValue="All"
        helper="Who should see this announcement."
      />
      <div className="flex flex-col gap-2">
        <RepeatableField
          label="Features"
          name="features"
          required
          addLabel="Add Feature"
          onValuesChange={(values) => recheck('features', values)}
        />
        {errors.features && <Alert type="error" size="compact" message={errors.features} />}
      </div>
      <ToggleField label="Active" name="active" defaultChecked description="Only active announcements are shown to users." />
    </form>
  );
}

export function CreateAnnouncementDialog({ open, onClose, onCreate, today }: CreateAnnouncementDialogProps) {
  const formId = `${React.useId()}-form`;
  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Create Announcement"
      size="large"
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            Create
          </Button>
        </>
      }
    >
      {/* The form unmounts with the dialog, so it opens empty every time. */}
      <CreateAnnouncementForm formId={formId} onCreate={onCreate} today={today} />
    </ModalDialog>
  );
}
