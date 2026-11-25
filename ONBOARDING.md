# Welcome to the CAF Design System

This gets you from "I have access" to reviewing your first change. It takes
about twenty minutes. You don't need a terminal, Node or a code editor: a
browser and Claude are enough.

If something doesn't work, paste the error to Claude or ask the lead. The
repo's checks are written to fail with a clear message, so the error text is
worth reading.

## Who's who

| Role | Who |
|---|---|
| Lead (decides, says "merge") | Ali |
| Designers (design questions, reviews) | Ali · Marvin |

Update this table when the team changes.

## What CAF is, in four lines

1. **CAF is a child of GDL**, our parent design system. GDL owns the shared
   foundations: palette, spacing, radius, type ramp and elevation. CAF installs
   GDL as a package and adds only its own brand colours and components.
2. **This repository is the source of truth.** Tokens and components are
   changed here, in pull requests. CAF left Figma on 23 Nov 2026; the old CAF
   Figma files are a record, not a place to make changes.
3. **The code is a React component library** with a published Storybook.
   Apps install it as `@vdm-design-team/caf` (1.0.0 since 6 Nov 2026).
4. **Nothing reaches `main` without checks and the lead's "merge".**

## Step 1: check your access

You're a member of the VDM-Design-Team organisation with the **Maintain** role
on this repository.
- Open https://github.com/VDM-Design-Team/CAF-design-system. You should see
  the code, not a 404. If you don't, ask the lead.

## Step 2: watch the repository

GitHub only tells you about activity on a repo you watch. On the repo page,
click **Watch** → **All activity**, or **Participating and @mentions** if
that's too much. That way review requests and comments reach your inbox.

## Step 3: bookmark the places you'll use

| What | Where |
|---|---|
| The repository: every change, discussion and release | https://github.com/VDM-Design-Team/CAF-design-system |
| The published Storybook: the system as it is on `main`, rebuilt on every merge | https://main--6ad8873b88978c4e849351ae.chromatic.com |
| Releases: what changed in each version | https://github.com/VDM-Design-Team/CAF-design-system/releases |

Storybook answers "what does X look like in code today". It has three groups:
- **Components:** the building blocks, every variant and state, in Light and
  Dark.
- **Patterns:** flows built from them, such as filtering a table or adding a
  cost.
- **Templates:** whole pages.

Use the toolbar to switch between Light and Dark.

## Step 4: get Claude

Install the Claude desktop app (https://claude.com/claude-code) and sign in
with your work account. You can ask it things like:
- "Open the CAF Storybook and show me FilterClear in Dark."
- "Show me every state of FilterClear in Storybook, in Light and Dark."
- "What changed in CAF 1.0.0?"

Claude's browser is separate from your everyday browser. The first time it
opens GitHub, sign in there, on the site's own page. Claude never
needs your password.

## How a change travels

1. **A change is made in a pull request (PR), in this repository.** There is
   no Figma step. Colours and type come from tokens, never raw values, and
   spacing stays on GDL's scale (4, 8, 12, 16, 24, 32, 40 …). A 42 can't be
   built.
2. **The PR shows the change in Storybook:** every variant and state, in
   Light and Dark.
3. **Checks run on every PR:**
   - `verify`: the tests, the contrast check, and every story in the built
     Storybook;
   - `chromatic`: a Storybook build with a preview link.

   Both must be green.
4. **Review.** Open the PR's Storybook preview from its checks. Look at it in
   Light and Dark, and comment on the PR with what you see.
5. **Merge and release.** The lead says "merge" and the PR lands. A release
   bundles merged PRs, and its notes come from `CHANGELOG.md`.

Rules worth knowing as a designer:
- **Contrast is enforced.** Text needs 4.5:1, and borders and the focus ring
  need 3:1, in Light and Dark. A failing pair fails the checks, and it is
  fixed in the tokens, not with a one-off in a component.
- **Names are the API.** A property like Show Clear is the code prop
  `showClear`, and apps depend on it, so renaming one is a breaking change.
- **Every state matters:** Default, Hover, Pressed, Focus and Disabled, each in
  Light and Dark. A state the design doesn't show is a question for design,
  not a guess in code.

## Your first week

1. **Steps 1–4.**
2. **Tour Storybook.** Pick three components you know from the screens, and
   look at each one's stories in Light and Dark.
3. **Look at recent additions.** These arrived on 5–6 Nov and are good first
   reviews:
   - Filter / Clear, the Clear Filters button;
   - Modal / Dialog with Show Actions (Audit Logs' Refresh);
   - Navigation / Mobile Menu with Links=User;
   - the headers' Page=None.

   Look at each in Light and Dark, and note anything that looks wrong.
4. **Review your first PR.** The lead will request your review on the next
   PR. Open its Storybook preview, check it in Light and Dark, then comment or
   approve.

## If you also build apps

The README's "Using CAF in an app" section has the setup: a GitHub token with
`read:packages`, `npm i @vdm-design-team/caf`, then one CSS import. Claude can
set it up for you.

## Good to know right now

Chromatic's visual review (the "UI Tests" and "UI Review" checks) is paused
until the Chromatic plan is renewed. Until then, review the Storybook preview
by eye.
