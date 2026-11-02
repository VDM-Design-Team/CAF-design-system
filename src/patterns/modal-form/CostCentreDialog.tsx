import * as React from 'react';
import { Button } from '../../components/button';
import { ModalDialog } from '../../components/modal-dialog';
import { SelectField } from '../../components/select-field';
import { TextField } from '../../components/text-field';
import { costCentreNames } from '../fixtures';

/**
 * CostCentreDialog — a story-level organism, not a DS component: pattern 05's
 * "Add New Cost Center" dialog (523:2985), and the same dialog pre-filled for
 * Edit from a row menu. A Modal / Dialog (Medium) with the form in its Content
 * slot, as Figma draws it:
 * - Cost Center (Field – Dropdown, "Select cost center"), Nature of Service
 *   (Field – Text, "e.g. Salary"), Location (Field – Text, "e.g.
 *   Philippines"); all three Required.
 * - Footer: Text "Cancel", Default "Save".
 *
 * Focus starts on the first field. Save checks the fields: an empty one turns
 * red with "<Label> is required." (523:3204, "Location is required."), the
 * first is focused, and the dialog stays open with what was typed. When they
 * pass, `onSave` gets the values and the FormData; the owner closes the dialog.
 */
export interface CostCentreValues {
  name: string;
  natureOfService: string;
  location: string;
}

export interface CostCentreDialogProps {
  open: boolean;
  onClose: () => void;
  /** The record being edited; leave it out to add one. */
  record?: CostCentreValues | null;
  onSave: (values: CostCentreValues, data: FormData) => void;
}

type Field = keyof CostCentreValues;
const LABEL: Record<Field, string> = { name: 'Cost Center', natureOfService: 'Nature of Service', location: 'Location' };
const ORDER: Field[] = ['name', 'natureOfService', 'location'];

export function CostCentreDialog({ open, onClose, record, onSave }: CostCentreDialogProps) {
  const formId = `${React.useId()}-cost-centre`;
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const nameRef = React.useRef<HTMLButtonElement>(null);
  const natureRef = React.useRef<HTMLInputElement>(null);
  const locationRef = React.useRef<HTMLInputElement>(null);
  const refs: Record<Field, React.RefObject<HTMLElement | null>> = { name: nameRef, natureOfService: natureRef, location: locationRef };

  React.useEffect(() => {
    if (open) setErrors({});
  }, [open]);

  const clear = (field: Field) => setErrors((all) => (all[field] ? { ...all, [field]: undefined } : all));

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={record ? 'Edit Cost Center' : 'Add New Cost Center'}
      size="medium"
      initialFocusRef={nameRef}
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
      <form
        id={formId}
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const values = Object.fromEntries(ORDER.map((f) => [f, String(data.get(f) ?? '').trim()])) as unknown as CostCentreValues;
          const found = Object.fromEntries(
            ORDER.filter((f) => !values[f]).map((f) => [f, `${LABEL[f]} is required.`]),
          ) as Partial<Record<Field, string>>;
          setErrors(found);
          const first = ORDER.find((f) => found[f]);
          if (first) {
            refs[first].current?.focus();
            return;
          }
          onSave(values, data);
        }}
      >
        <SelectField
          ref={nameRef}
          label="Cost Center"
          name="name"
          required
          placeholder="Select cost center"
          options={costCentreNames}
          defaultValue={record?.name ?? null}
          error={errors.name}
          onValueChange={() => clear('name')}
        />
        <TextField
          ref={natureRef}
          label="Nature of Service"
          name="natureOfService"
          required
          placeholder="e.g. Salary"
          defaultValue={record?.natureOfService}
          error={errors.natureOfService}
          onChange={() => clear('natureOfService')}
        />
        <TextField
          ref={locationRef}
          label="Location"
          name="location"
          required
          placeholder="e.g. Philippines"
          defaultValue={record?.location}
          error={errors.location}
          onChange={() => clear('location')}
        />
      </form>
    </ModalDialog>
  );
}
