# Child 121 Current UI Inventory

Date: 2026-07-26

Commit inspected: `dcfb6ab`

## Scope

This inventory records the current UI state before broad modernization children
`122` through `128`. It does not claim those modernization children are complete.

## Applications

- `apps/web`: React/Vite portal plus public Guide and Interactive Demo
  reader/viewer routes.
- `apps/extension`: React/Vite Manifest V3 popup.
- `packages/ui`: shared source-level primitives.
- `apps/docs`: project documentation hub, not customer-authored Documentation.

## Current UI Foundation

- Tailwind CSS 4 is already used by web and extension.
- Lucide is already the shared icon dependency.
- `packages/ui` uses CVA-style variants and class merging.
- New dependency installation is not required for child `121`.

Existing shared primitives:

- Alert
- Badge
- Button
- Card
- Code
- Input
- Label
- Select
- Separator
- Textarea

New child `121` foundation:

- `packages/ui/src/tokens.tsx`
- app-level CSS custom properties in `apps/web/src/index.css`
- app-level CSS custom properties in `apps/extension/src/index.css`
- dev-only review route `/__design-system`

## Route Surface Inventory

Portal route parsing is owned by `apps/web/src/lib/routes.ts`.

Current route families:

- setup and login;
- project list;
- organization members and organization compliance;
- project workspace and settings;
- canonical Project Version workspace;
- Project Version carry-forward;
- capture session list/detail;
- Guide list/editor/preview/public reader/embed;
- Interactive Demo list/editor/public viewer/embed;
- Artifact Revision history/preview;
- Project activity and compliance timelines;
- organization invite acceptance;
- dev-only `__design-system` review route.

Server/API route behavior is not changed by this child.

## CSS Module Inventory

Web currently relies on page-local CSS modules across project, capture, guide,
demo, organization, compliance, publishing, activity, and setup surfaces. This
child adds tokens and a review surface, but it does not rewrite those modules.

The future migration rule is additive first:

1. use `PRODUCT.md` and `DESIGN.md` for direction;
2. prefer `packages/ui` primitives and shared token names;
3. migrate one workflow family at a time in children `122` through `128`;
4. do not leave old and new styling as a permanent uncontrolled dual system.

## Known File-Size Pressure

Do not add code to these already-large files without first splitting the relevant
work:

- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/extension/src/App.tsx`
- `apps/web/src/App.test.tsx`

## State Coverage To Preserve

Later modernization must preserve:

- loading;
- empty and first-use;
- validation and recoverable errors;
- denied permission;
- read-only and archived;
- destructive confirmation;
- public restricted/password/expired/revoked states;
- failed media;
- keyboard/focus;
- 200% zoom/reflow;
- reduced motion;
- long names and dense data.

## Current Gaps

- Many screens still use hard-coded slate/hex colors.
- Page-local controls are repeated.
- Responsive behavior is uneven across workflow families.
- Shared tokens were minimal before this child.
- Extension popup uses global CSS and a large single `App.tsx`.
- Browser baseline evidence still needs real local runtime validation after the
  product/design direction is reviewed.
