---
bump: patch
---
### Storybook's form pages and Settings sit in a PanelCard (November 2026)

Story-level only: nothing in the published package changes. In Storybook's
patterns and templates, the form pages and Settings now use the Layout
components added in 0.8.0, as the CAF design decisions add-card-panel,
add-form-heading and add-divider say:

- **New Cost**, **Bulk Upload**, the file-upload pattern's **Attach invoice**
  and **Settings**: the page's `PageHeader`, then, 24px under it, a
  `PanelCard` (surface.base, a 1px stroke.subtle edge, radius 12, 32px
  padding) that holds only the form. The heading and the card share a
  centred column as wide as Figma's form cards (`max-w-xl`, 576px; Figma
  578).
- **Dividers** where Figma draws a rule: New Cost's before Beneficiary
  Information and before Breakdowns (on both tabs), Bulk Upload's between
  the CSV upload and the template row. The labelled "Cost Details" rule stays
  a section header.
- New Cost's Save to Drafts and Save stack below 640px: on a 320 phone the
  card's padding leaves too little width for both side by side.

The pattern and template pages (Multi-section form, File upload &
attachments, Save and resume drafts, Account, settings & currencies, Form
page, App shell's Settings and Create Cost) look different in Light and Dark:
a white card on the slate-50 page in Light, a slate-800 card on slate-900 in
Dark, and the fields 64px narrower than before (512 instead of 576). Every
form's fields, checks and FormData are unchanged.
