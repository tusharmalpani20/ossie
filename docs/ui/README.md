# Ossie UI Patterns And Visual Evidence

This directory records browser-visible Ossie design evidence. It helps agents
reuse accepted product patterns without treating every historical screenshot as
a visual target.

## Authority

Use sources in this order for UI work:

1. `AGENTS.md`, `CONTEXT.md`, and accepted ADRs for product truth and behavior.
2. `PRODUCT.md` for product character and design principles.
3. `DESIGN.md` for accepted tokens, components, page patterns, and visual rules.
4. Plan `147` for work order, review gates, and evidence requirements.
5. This index and explicitly approved Ossie visual references.

Screenshots demonstrate only the route, state, viewport, and review purpose
recorded beside them. They never override shipped behavior or accepted domain
language.

## Evidence Classes

Every new screenshot or report must use one of these classes:

- **Approved visual reference**: explicitly accepted by the user as an Ossie
  composition and visual-quality target.
- **Candidate evidence**: a proposed visual result awaiting the required review
  and explicit human acceptance.
- **Functional evidence**: proves that a workflow, state, viewport, or browser
  behavior works; it is not a visual target.
- **Known-problem evidence**: intentionally captures a defect that should not be
  copied.
- **Historical-only evidence**: preserves an earlier implementation or closed
  plan record.

Unless a report explicitly says otherwise, screenshots and reports created
before Plan `147` are **functional evidence** or **historical-only evidence**.
They are not approved visual references.

## Approved Structural Patterns

These patterns are accepted in `DESIGN.md`. Their structure may guide a new
candidate even when no screenshot has yet received visual acceptance.

| Surface family                                          | Pattern                    | Current visual-reference status |
| ------------------------------------------------------- | -------------------------- | ------------------------------- |
| Self-hosted first-run setup                             | Split first-run onboarding | Candidate still required        |
| Login and invitation                                    | Focused entry              | Candidate still required        |
| Projects, Versions, Captures, and artifact libraries    | Library/operations         | Candidate still required        |
| Guide, Interactive Demo, and Documentation authoring    | Authoring workbench        | Candidate still required        |
| Draft, Revision, Publication, and public reading        | Reader/viewer              | Candidate still required        |
| Organization, Project, and Documentation administration | Settings/admin             | Candidate still required        |
| Activity, access, and compliance evidence               | Activity/compliance        | Candidate still required        |
| Browser capture popup                                   | Compact extension utility  | Candidate still required        |

The Child `121` directions remain useful historical structural input. Plan
`147` must validate each production pattern on a real route and at narrow and
wide sizes before it becomes a visual reference.

## Candidate-To-Approval Workflow

For each page or bounded surface:

1. State the user goal, primary action, chosen approved pattern, applicable
   states, and narrow-screen composition.
2. Capture the existing real route as known-problem or functional evidence.
3. Implement the smallest behavior-preserving candidate using semantic tokens
   and shared primitives.
4. Verify the real route at desktop, narrow mobile near 390px, keyboard-only,
   and 200% zoom/reflow, plus loading/error/permission/destructive states when
   applicable.
5. Record candidate screenshots under a stable Plan `147` surface name.
6. Score hierarchy, scanability, density, typography, spacing/alignment,
   primary action, state clarity, consistency, and responsive behavior. Every
   dimension must reach at least 4/5 for agent acceptance.
7. Present the candidate and its evidence to the user. Do not continue to the
   next page until the user accepts the surface or requests another iteration.
8. After acceptance, relabel the exact evidence as an approved visual reference
   and record what may and may not be reused.

## Exemplar Notes

Every approved visual reference needs a short note containing:

- route and exact state;
- viewport and browser;
- user goal and primary action;
- approved pattern and reusable decisions;
- applicable loading, empty, error, permission, read-only, archived, conflict,
  destructive, busy, and success states;
- intentional differences from the previous evidence;
- elements that agents must not copy into unrelated surfaces;
- acceptance date and approving human.

Do not add random inspiration galleries, third-party screenshots without a
specific pattern purpose, fake data that resembles customer information, or
unclassified screenshots.

## Existing Records

- `121-*`: initial design-system inventory, structural directions, and baseline
  evidence.
- `122-*` through `130-*`: portal shell and workflow modernization evidence.
- `132-*` through `146-*` and dated 2026-08 Documentation records: Product
  Documentation implementation and hardening evidence.
- `evidence/<plan>/`: route screenshots captured for the owning plan.

Plan `147` should create and maintain its canonical surface/evidence ledger
before classifying individual files. Do not rename historical evidence merely
to make it appear approved.
