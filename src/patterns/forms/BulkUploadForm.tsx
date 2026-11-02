import * as React from 'react';
import { Button } from '../../components/button';
import { FileUploadField } from '../../components/file-upload-field';
import { fileMatchesAccept } from '../../components/file-upload-zone';
import { Icon } from '../../components/icon';
import { SelectField } from '../../components/select-field';
import { cn } from '../../lib/cn';
import { csvRules, paymentMethods } from '../fixtures';
import { PageHeader } from '../../components/page-header';

/**
 * BulkUploadForm — a story-level organism, not a DS component (COMPONENT-PLAN
 * decision 4): `Form / Bulk Upload` (191:433, page "Form"), "payment method,
 * CSV upload, template download, Upload action" (patterns 10 step 5 and U05).
 *
 * Figma → code, top to bottom:
 * - Page Heading "Bulk Upload" → PageHeader's `<h1>`.
 * - Form / Field – Dropdown "Payment Method" → SelectField (U05's placeholder,
 *   "Select payment method").
 * - Form / Field – File Upload "Upload CSV File" → FileUploadField, one file,
 *   CSV only ("Click or drag CSV file to upload", "Only CSV files are
 *   accepted"). Any other type shows as a red File Chip that says why.
 * - Download Template Row → the label "Download CSV Template" (Body/sm-regular,
 *   text.tertiary, as Figma binds it) and an Outlined "Download" Button with
 *   the DownloadSimple icon, at either end. The button is described by the
 *   label. The template depends on the payment method, so Download asks for one
 *   first (U05: "1. Pick the Payment method… 2. Download CSV Template").
 * - The full-width Default "Upload" Button submits.
 *
 * Upload checks both fields, shows the messages in place and focuses the
 * first; when they pass, `onUpload` gets the FormData (`paymentMethod`,
 * `file`). The result (a Toast) is the page's to show.
 *
 * Left out, with the reason in docs/patterns.md: the card (surface.base, stroke
 * subtle, radius 12, 32 padding) and the Divider, which have no DS component.
 */
export interface BulkUploadFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children' | 'defaultValue'> {
  /** Upload, when both fields are filled. */
  onUpload?: (data: FormData) => void;
  /** Download, with the chosen payment method. */
  onDownloadTemplate?: (paymentMethod: string) => void;
  defaultPaymentMethod?: string;
  defaultFiles?: readonly File[];
}

type Errors = { paymentMethod?: string; file?: string };

/** Only a CSV file is accepted. */
export const validateCsv = (file: File): string | undefined =>
  fileMatchesAccept(file, csvRules.accept) ? undefined : csvRules.typeReason;

export const BulkUploadForm = React.forwardRef<HTMLFormElement, BulkUploadFormProps>(function BulkUploadForm(
  { onUpload, onDownloadTemplate, defaultPaymentMethod, defaultFiles, className, ...form },
  ref,
) {
  const uid = React.useId();
  const [paymentMethod, setPaymentMethod] = React.useState<string | null>(defaultPaymentMethod ?? null);
  const [errors, setErrors] = React.useState<Errors>({});
  const methodRef = React.useRef<HTMLButtonElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const templateLabelId = `${uid}-template`;

  return (
    <form
      ref={ref}
      noValidate
      className={cn('flex w-full max-w-xl flex-col gap-6', className)}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const file = data.get('file');
        const found: Errors = {
          paymentMethod: data.get('paymentMethod') ? undefined : 'Payment Method is required.',
          file: file instanceof File && file.name ? undefined : 'Choose a CSV file to upload.',
        };
        setErrors(found);
        if (found.paymentMethod) methodRef.current?.focus();
        else if (found.file) fileRef.current?.focus();
        else onUpload?.(data);
      }}
      {...form}
    >
      <PageHeader title="Bulk Upload" />
      <div className="flex flex-col gap-3">
        <SelectField
          ref={methodRef}
          label="Payment Method"
          name="paymentMethod"
          required
          placeholder="Select payment method"
          options={paymentMethods}
          value={paymentMethod}
          error={errors.paymentMethod}
          onValueChange={(next) => {
            setPaymentMethod(next);
            setErrors((all) => ({ ...all, paymentMethod: undefined }));
          }}
        />
        <FileUploadField
          ref={fileRef}
          label="Upload CSV File"
          name="file"
          required
          accept={csvRules.accept}
          title={csvRules.title}
          hint={csvRules.hint}
          validate={validateCsv}
          defaultFiles={defaultFiles}
          error={errors.file}
          onFilesChange={(files) => {
            if (files.length) setErrors((all) => ({ ...all, file: undefined }));
          }}
        />
        {/* Download Template Row: 20 above, 16 below, label and button at either end. */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-5 pb-4">
          <p id={templateLabelId} className="text-body-sm-regular text-text-tertiary">
            Download CSV Template
          </p>
          <Button
            variant="outlined"
            leftIcon={<Icon name="download-simple" />}
            aria-describedby={templateLabelId}
            onClick={() => {
              if (!paymentMethod) {
                setErrors((all) => ({ ...all, paymentMethod: 'Choose a payment method to get its template.' }));
                methodRef.current?.focus();
                return;
              }
              onDownloadTemplate?.(paymentMethod);
            }}
          >
            Download
          </Button>
        </div>
        <Button type="submit" className="w-full">
          Upload
        </Button>
      </div>
    </form>
  );
});
BulkUploadForm.displayName = 'BulkUploadForm';
