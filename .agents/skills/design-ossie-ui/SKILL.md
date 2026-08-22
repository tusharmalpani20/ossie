---
name: design-ossie-ui
description: Design, implement, or review Ossie product UI architecture, screen composition, interaction, motion, accessibility, and design-system work. Use for portal, editor, reader, extension, settings, activity, responsive, component, visual-polish, animation, or UX tasks where repository product context must govern external design guidance.
---

# Design Ossie UI

Design a quiet, coherent operational product while preserving repository behavior
and domain language.

## Load Product Context

Before child `121` completes, read in order:

1. `CONTEXT.md`.
2. Master Plan `005`, especially its design context and child `121` scope.
3. The active child plan and accepted ADRs.
4. Current `packages/ui` primitives and representative application UI/CSS.
5. Current product, roadmap, and status documentation.
6. Relevant reviewed external skills under `.agents/skills/`.

After child `121`, also read accepted root `PRODUCT.md` and `DESIGN.md` before
implementation. During Plan `147`, read the active plan and
`docs/ui/README.md`, including its evidence classifications, before treating any
screenshot as a visual reference. Those files guide product design but do not
override domain truth in `CONTEXT.md` or ADRs.

If `PRODUCT.md` or `DESIGN.md` does not exist before child `121`, proceed with a
scoped audit or implementation from current evidence. Do not generate either file
early and do not let an external skill do so implicitly.

## Inspect Before Designing

- Identify the surface archetype: focused entry, split first-run onboarding,
  library/operations, authoring workbench, reader/viewer, settings/admin,
  activity/compliance, or compact extension utility.
- State the user goal, primary action, chosen approved pattern, required states,
  and narrow-screen composition before implementation.
- Trace current behavior, routes, data states, permissions, tests, components,
  tokens, icons, and responsive rules.
- Capture a safe baseline for screens the active child will change.
- Preserve functional workflows and information density unless the accepted plan
  changes them.
- Use established Tailwind CSS 4, Lucide, CVA/class utilities, and `packages/ui`
  patterns before adding dependencies or one-off primitives.

## Design The Complete Workflow

Define and implement every applicable state:

- initial loading, background refresh, and progress;
- empty and first-use;
- validation and recoverable errors;
- denied permission, read-only, archived, and unavailable states;
- destructive confirmation, success, failure, and undo where accepted;
- narrow mobile, wide desktop, keyboard, focus, 200% zoom/reflow, and reduced
  motion;
- long names, dense data, slow images, and failed requests.

Use stable dimensions and responsive constraints so labels, icons, counters,
toolbars, editors, and viewers do not shift or overlap.

## Visual And Interaction Rules

- Optimize for repeated work, scanning, comparison, and predictable navigation.
- Build the usable operational workflow first. Do not turn portal surfaces into
  marketing pages, oversized hero compositions, or feature-explanation screens.
- Do not add navigation, tabs, buttons, or commands for unimplemented behavior.
  A future artifact family belongs in qualified direction documentation until an
  accepted implementation child owns the complete workflow.
- Keep typography proportional to its container. Do not scale font size with the
  viewport and keep letter spacing neutral unless an accepted token says otherwise.
- Avoid nested cards, floating page-section cards, decorative gradient/orb
  backgrounds, and a one-hue palette.
- Treat purple as Ossie's signature, not its wallpaper. Use accepted semantic
  purple tokens for brand regions, primary action, focus, and selection; do not
  recolor semantic status states or invent page-local purple values.
- Keep card radii at 8px or less unless the accepted design system specifies a
  different primitive.
- Use Lucide icons for familiar commands, accessible labels for icon controls,
  and tooltips for unfamiliar icons.
- Use controls that match the value: switches/checkboxes for binary state,
  segmented controls for small modes, selects/menus for option sets, and suitable
  inputs/sliders/steppers for numeric values.
- Make motion explain continuity, hierarchy, state change, and feedback. Avoid
  decorative bounce, layout-thrashing properties, and motion without a reduced
  alternative.
- Preserve visible focus, contrast, semantic HTML, keyboard behavior, target
  sizes, and screen-reader names.

## Use External Skills Deliberately

- Use `impeccable` for broad product-design critique and later design-context
  workflows, but keep hooks disabled and do not run `init` before child `121`.
- For a read-only review or when Impeccable's browser/subagent/evidence capability
  is unavailable, read the relevant installed guidance and perform a scoped
  repository review without running its scripts or persisting `.impeccable/`
  state. Mark unavailable evidence honestly.
- Use `emil-design-eng` for restraint and interaction polish.
- Use `review-animations` and `animation-vocabulary` for motion review and shared
  terminology.
- Use `apple-design` only when an accepted surface actually targets Apple
  conventions; do not turn a web workbench into an imitation native UI.
- Use `vercel-react-best-practices` for applicable React performance checks.
- Use `accessibility` for WCAG and interaction review.

Resolve conflicts through `AGENTS.md` precedence. External advice is supporting
evidence, not permission to change product semantics or framework boundaries.

## Implement And Verify

1. Establish behavior tests before changing visible behavior.
2. Compose existing primitives and tokens; add an abstraction only when it solves
   repeated real complexity.
3. Run focused tests, type checks, lint, and builds.
4. Use `dogfood-ossie` with a real browser at desktop and narrow mobile
   viewports.
5. Check keyboard order, focus, 200% zoom/reflow, reduced motion, console errors,
   failed requests, image loading, text clipping, overlap, and layout shift.
6. Compare against the safe baseline and record intentional visual changes.
7. During Plan `147`, present one verified page or bounded surface for explicit
   human inspection and stop before beginning the next surface.

Stop for explicit acceptance when the work chooses a product name, visual
direction, major dependency, or consequential design-system rule not settled by
the active plan. Continue with best judgment for reversible composition details.

## Review Output

Lead with concrete findings ordered by severity and include file/line references.
Separate behavioral defects, accessibility failures, visual inconsistency,
performance risks, and optional polish. State residual evidence gaps explicitly.
