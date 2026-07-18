# Child Plan 113: Existing Mutation Audit Coverage

Date reserved: 2026-07-12

Status: Not started. Reserved from Master Plan `005`; expansion and recheck are required before implementation.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Completed child `112`, including its accepted schema-transition mechanism and proven representative audit integration.

Next child:

- `114` Access Evidence And Compliance Timelines, only after repository-wide mutation coverage and guard activation are verified.

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

## Inherited Child 112 Closeout

Child `112` passed its close-previous implementation recheck on 2026-07-19.
Expansion of this child must preserve and account for these concrete boundaries:

- Project creation is the only converted and guarded business mutation; the
  coverage registry is intentionally incomplete until this child inventories
  and converts every remaining mutation.
- The existing pre-route authentication session `last_seen_at` update is the
  first known adjacent unaudited mutation and must be included in the inventory.
- Runtime business-table grants are operation-specific and intentionally omit
  blanket `DELETE`; extend the grant manifest only for operations required by
  converted commands.
- Each new database guard or required Audit object must be reflected in both the
  coverage registry and the operational Audit catalog verifier.
- API processes must remain on runtime credentials. Migration, provisioning,
  reset, and direct synthetic fixture state setup use distinct maintenance
  credentials and must not become application behavior.
- Updated child records must emit typed field items through the scalar helper
  with explicit parent identity; JSON-backed content may use explicit
  typed/redacted adapters but must never be copied into Audit Evidence.
- Preserve stable internal persistence errors, mutation-context validation
  before business writes, same-transaction rollback, no-op suppression,
  restrictive foreign keys, append-only evidence, and maintenance-bypass
  protections established by child `112`.
- Keep Audit query APIs, Access Events, compliance timelines, and their UI in
  child `114`.

## Master-Defined Goal And Boundary

Goal:

- Apply child `112` to every existing committed mutation before new version-domain mutations are introduced.

Expected scope:

- Inventory every current mutable table, repository command, route, background/system path, and data-changing migration.
- Cover user, Organization, authentication/session, Project, Capture, file/asset, Guide, Interactive Demo, Publish Link, extension, import, migration, and system mutations.
- Emit one logical event for a transaction even when multiple aggregates or child rows change; include every affected record and field as typed relational change items.
- Cover Working Draft-equivalent autosaves and bounded batch operations without creating per-keystroke or per-SQL-statement noise.
- Ensure later data-changing migrations use the accepted `migration` source context.
- Populate the coverage registry and add automated schema/command checks that fail when a mutable table or command has no declared audit path.
- Where current JSON-backed alpha content must be described temporarily, use explicit type-specific adapters that emit known relational change items; do not copy JSON into Audit Evidence. Child `118` removes the underlying core content JSON.
- Preserve current behavior and API contracts; Access Evidence and product timeline UI remain child `114`.

Verification requirements:

- mutation-coverage tests for every mutable table and command category;
- representative field, child-record, batch, autosave, file, extension, import, migration, and system tests;
- atomic rollback, no-op, retry/idempotency, actor/source, tenant-scope, and redaction tests;
- DB-backed smoke coverage across portal, extension, publishing, and administrative mutations.

Acceptance:

- Every existing committed logical mutation is explainable through immutable Audit Event/Change Items.
- Coverage automation fails when a new mutable table or command lacks an explicit audit path.
- The repository-wide mutation-context guard is active only after the coverage inventory passes; there is no silent partial-compliance claim.
- New Project Membership and version-domain mutations can reuse one proven integration contract.

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
- Next executable child is determined by the parent sequence and verified
  predecessor closeouts; this reservation does not advance that sequence.
