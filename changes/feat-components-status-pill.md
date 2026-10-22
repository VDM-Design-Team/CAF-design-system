---
bump: minor
---
### Components: StatusPill (October 2026)

`StatusPill` is the filled status pill of the Costs and Recurring Costs
tables, built straight from the CAF Figma library (page **Tags**,
`Status Pill`).
- `status` is Figma's Status: `pending` (default, orange) or `active`
  (CAF blue, as on the Default button).
- The label is `children`: "Pending", "Recurring", "Active" on the CAF
  screens.

It goes in a `TableCell` of `type="tag"`, which shows it in TableCell's
stories instead of the old stand-in. Every colour is the one the Figma
layer is bound to, and every label passes AA in Light and Dark.

Where code differs from Figma (details in `docs/figma-sync.md`):
- **Padding and radius** use GDL's `space/12` and `radius/full`, as Tag
  does, where Figma has raw 10px and 9999. The pill is 24px tall (Figma 23)
  and a few pixels wider.
- **Dark:** Figma pins Pending to Light, so it never turns Dark. In code
  both statuses follow the theme; in Dark, Pending is orange-500 with a
  near-black label.
