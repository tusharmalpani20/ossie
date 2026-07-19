# Child Plan 115: Project Membership Foundation

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed children `112` through `114`, so membership mutations and reads use the accepted Audit/Access contracts.

Next child:

- `116` Project Version Foundation, only after Project Membership authorization and migration coverage pass.

## Planning Boundary

This file reserves the accepted child boundary and sequence from Master Plan
`005`. It is not yet an implementation-ready plan. Before runtime or product
changes begin, the active agent must re-read `CONTEXT.md`, the relevant accepted
ADRs, the parent master, preceding child closeouts, and current code/tests; then
expand this file with exact affected files, contracts, tests, verification,
ownership, migration/reset implications, browser evidence where applicable, and
a stable handoff.

Do not mark this child in progress or complete merely because this skeleton
exists. Preserve the master's ordering and stop at any unmet predecessor gate or
critical decision defined by `AGENTS.md`.

## Master-Defined Goal And Boundary

Goal:

- Add Project-scoped authorization with Project Admin, Project Editor, and Project Viewer roles before Project Version APIs and UI ship.

Expected scope:

- Add explicit relational Project Membership persistence with same-Organization constraints and active membership lifecycle.
- Keep Organization Owners as implicit Project Admins without duplicate Project Membership rows.
- Make a new Project's creator its initial Project Admin; do not grant other Organization Members automatic Project access.
- Allow Project Admins to assign/change/remove Project roles only for existing Organization Members; keep Organization invitation Owner-only.
- Centralize the accepted capability matrix for Project settings/version lifecycle, authoring, capture, checkpoint/restore, carry-forward, publication/link management, asset purge, and read-only access.
- Enforce Project Membership on discovery, list, read, mutation, audit/access timeline, extension, and artifact-generation paths.
- Extend child `114` queries/read models with the accepted Project Admin compliance scope, Project Editor curated Activity Timeline, and Project Viewer Revision/Publication-only history.
- Keep public Publish Link access independent from Project Membership.
- Audit every membership and authorization mutation through children `112` and `113`, and record accepted Access Events through child `114`.
- Update shared contracts, route authorization, fixtures, portal state, extension Project discovery, and tests together.

Verification requirements:

- clean-schema and same-Organization constraint tests;
- Owner implicit-access and creator-admin tests;
- no-auto-access tests for other Organization Members;
- complete Admin/Editor/Viewer capability-matrix route and domain tests;
- revoked/disabled membership and hidden-Project discovery tests;
- cross-Organization/cross-Project denial tests;
- audit/access evidence tests for membership changes and denials;
- portal and extension Project-list/selection behavior tests.

Acceptance:

- No non-owner can discover or access a Project without active Project Membership.
- Project Admin, Editor, and Viewer behavior matches the accepted matrix without route-local role invention.
- Removing membership revokes Project and compliance-timeline access immediately while preserving historical actor evidence.
- Project Version implementation can rely on one tested Project authorization boundary.

## Expansion And Recheck Gate

Before implementation:

- [ ] Confirm every preceding child gate is complete and record the starting
      commit and working-tree ownership.
- [ ] Reinspect every current route, schema, migration, contract, package,
      component, test, and operational surface named or implied by this child.
- [ ] Replace plan-era assumptions with current runtime facts without changing
      accepted product semantics.
- [ ] List exact affected files and explicit out-of-scope files.
- [ ] Define authorization, tenant isolation, lifecycle, data, API, UI, error,
      concurrency, migration/reset/reseed, audit/access, compatibility, and
      rollback contracts as applicable.
- [ ] Apply the shared-package reuse gate before moving any app-local contract.
- [ ] Define the TDD order, focused tests, broad regression checks, DB/smoke
      coverage, and real-browser evidence required by this child.
- [ ] Classify unresolved decisions under the repository decision policy and stop
      only for a genuinely critical decision.
- [ ] Record an attributable planning checkpoint before runtime implementation
      when expansion materially changes durable plan content.

## Delivery Checklist

- [ ] Establish the smallest meaningful failing focused test for each behavior
      boundary.
- [ ] Implement the smallest coherent change that passes, then refactor only
      while tests remain green.
- [ ] Preserve Organization tenant isolation, explicit authorization, immutable
      Capture source, protected shared assets, immutable Publications, and public
      access rules.
- [ ] Run the focused and broad verification defined by the expanded plan.
- [ ] For browser-visible work, collect safe synthetic desktop, narrow-mobile,
      keyboard, zoom/reflow, console, network, loading, empty, error, permission,
      and destructive-state evidence as applicable.
- [ ] Update this child status, implementation log, evidence, leftovers, and
      handoff together with the parent checklist only after acceptance passes.

## Implementation Log

Not started.

## Verification Record

Not run. Verification commands and outcomes must be added during execution; this
reservation does not claim test, database, browser, accessibility, performance,
or extension evidence.

## Leftovers And Handoff

- Expansion/recheck remains required.
- Start from the closed child `114` baseline at migration
  `018_access_evidence_constraint_hardening.sql`. Preserve its exact registered
  method/template/outcome action validation, successful resolved-root CHECK,
  response re-entry completion marker, Owner-wide upper boundary, and mandatory
  Organization predicates.
- Add Project-role authorization literals and database constraints through the
  next additive migration before emitting them; do not overload current
  Organization `owner | member` evidence.
- Register every membership/read/denial route in
  `ACCESS_ROUTE_COVERAGE_REGISTRY`; coverage must fail before an unclassified
  route ships.
- Real toolbar-popup and browser-injected writer validation remain honestly
  blocked environment capabilities from child `114`, not permission semantics
  for this child. Preserve fail-closed behavior and use available real browser
  evidence without making an unsupported toolbar claim.
- Next executable child is determined by the parent sequence and verified
  predecessor closeouts; this reservation does not advance that sequence.
