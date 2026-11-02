---
bump: minor
---
### PageHeader, Divider and PanelCard (November 2026)

Three components from the CAF Figma library's new **Layout** page, added
there first from the CAF design decisions:

- **`PageHeader`** (Page Header): the top of every list and form page.
  `title` is an `<h1>` in Heading/xl-bold, `description` a line under it,
  `tabs` sit after the title and a vertical divider, and `actions` are the
  page's buttons, primary last, named for their item ("New Announcement").
  Form pages use it too. It wraps on a narrow screen. The patterns and
  templates in Storybook now use it instead of their own page header.
- **`Divider`** (Divider): a 1px `stroke.subtle` rule, `orientation`
  horizontal (default) or vertical (1 × 32). A `role="separator"`.
- **`PanelCard`** (Card / Panel): the surface around a form page's form and
  the Settings page: `surface.base`, a 1px `stroke.subtle` border, radius 12,
  32px padding, content 20px apart.

In Storybook's Costs pages, a 1px rule now separates the title from the Cost
Type tabs, as Figma draws it.
