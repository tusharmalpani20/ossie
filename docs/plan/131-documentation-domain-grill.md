# Child Plan 131: Documentation Domain Grill

Date reserved: 2026-07-12

Date completed: 2026-07-30

Status: Complete. All 32 grill answers are finally accepted against the
completed child `129`/`130` codebase state. This child changed documentation and
ADRs only; Product Documentation runtime remains unimplemented.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Canonical decision record:

- `docs/grill/2026-07-29-documentation-domain-grill.md`
- `docs/documentation-domain-decisions.md`

## Sequence Gate

Prerequisite:

- Child `130` complete and accepted.

Result:

- Passed. Child `130` completed on 2026-07-29 and established a clean
  pre-Documentation runtime baseline.

The former prerequisite also required every Documentation Implementation Entry
Gate in Master Plan `005`. That was circular because the gate itself required
child `131` acceptance. The corrected order is:

1. child `130` closes the implemented foundation;
2. child `131` accepts the Documentation model and satisfies the remaining
   decision portions of the implementation gate;
3. child `132` is expanded/rechecked as the first implementation plan;
4. runtime implementation may begin only after child `132` proves every
   implementation-entry condition against the then-current codebase.

Next child:

- `132 — Documentation Site First Vertical Slice`, as bounded in
  `docs/documentation-domain-decisions.md`.

## Goal And Outcome

Goal:

- Produce an accepted, implementation-ready Documentation-domain model and
  phased scope without writing Documentation runtime code.

Outcome:

- Accepted. The final model defines stable Documentation Sites, one Site
  Edition per Project Version, relational Working Drafts and Pages, complete
  immutable Site Revisions, exact Site Publications, private Page comments,
  protected assets, OpenAPI Sources, stable Publish Links, and an end-to-end
  first slice.
- Fumadocs and Tiptap are preferred replaceable adapters after focused proof;
  neither owns domain state, permissions, persistence, or publication.
- The database plus protected File storage is authoritative. Git synchronization
  and executable customer content are excluded.
- The implementation sequence begins at child `132`; no runtime was added here.

## Post-130 Facts Rechecked

- Child `129` and child `130` are complete, with no blocking S1/S2 regression.
- The current product implements Capture, Guide, and Interactive Demo workflows,
  Project Membership, Project Versions, relational Working Drafts, immutable
  Revisions/Publications, multi-version Publish Links, protected Files,
  append-only Audit/Access Evidence, and the modernized portal/browser surfaces.
- Migrations end at `024`.
- There are no Documentation tables, schemas, shared contracts, API routes,
  portal routes, editor/reader dependencies, search indexes, public routes, or
  operational navigation entries.
- ADRs `0021` through `0026` are the valid implemented foundation. The grill's
  original filenames for ADRs `0023` and `0026` were stale and are corrected.
- The accepted Question `31` comments boundary is compatible with the current
  Project Membership, relational persistence, audit privacy, and immutable
  publication rules when implemented as private Page authoring state.
- No code change after child `130` invalidated any of the 32 answers.

## Final Decisions

The authoritative detailed decisions are in
`docs/documentation-domain-decisions.md`. In summary:

- **Identity/versioning:** Project-owned Site; at most one Site Edition per
  Project Version; resource Row Versions; complete immutable Site Revisions and
  Site Publications.
- **Source of truth:** explicit relational data plus protected File storage;
  imports are mutations and exports are snapshots; no V1 Git authority.
- **Content:** constrained typed blocks and safe Markdown interchange; no
  customer-authored MDX, JavaScript, React, raw HTML, or arbitrary iframes.
- **Tooling:** replaceable Tiptap authoring adapter and Fumadocs reader/search/
  OpenAPI adapter, each gated by focused proof.
- **Publication:** prepare complete exact-Revision material before atomic stable
  link switch; failed preparation preserves live output; rollback repoints an
  older immutable Publication.
- **Access/search:** Project Membership protects internal state; Publish Link
  policy protects outside access; search authorization precedes indexing and
  return; public search is exact-Publication scoped.
- **Comments:** private Project-member Page threads/replies/mentions/resolve/
  reopen are in the first slice and excluded from Revisions/Publications.
- **Lifecycle:** archive first, protect referenced files, retain immutable
  history/evidence, and defer governed permanent deletion.
- **First slice:** the Question `32` 15-step Site/OpenAPI/comment/publication/
  search/immutability/rollback journey is child `132`.

## Durable Decisions

- ADR `0027`: Documentation Sites use edition-wide Revisions and Publications.
- ADR `0028`: Documentation is database-authoritative constrained content.
- ADR `0029`: the Documentation reader is an authorized Publication adapter.
- ADR `0030`: Documentation comments are private authoring workspace.

These ADRs build on:

- ADR `0021`: Project Versions are release contexts.
- ADR `0022`: Artifacts use Editions, Revisions, and Publications.
- ADR `0023`: comprehensive Audit and Access Evidence from day one.
- ADR `0024`: Project Membership governs Project access.
- ADR `0025`: core domain persistence is explicitly relational.
- ADR `0026`: Publish Links are multi-version Artifact manifests.

## Files Changed By This Child

Canonical decision/docs:

- `CONTEXT.md`
- `docs/documentation-domain-decisions.md`
- `docs/grill/2026-07-29-documentation-domain-grill.md`
- `docs/adr/0027-documentation-sites-use-edition-wide-revisions-and-publications.md`
- `docs/adr/0028-documentation-is-database-authoritative-constrained-content.md`
- `docs/adr/0029-documentation-reader-is-an-authorized-publication-adapter.md`
- `docs/adr/0030-documentation-comments-are-private-authoring-workspace.md`
- `docs/plan/131-documentation-domain-grill.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Current-truth/handoff copy, if required by the final drift check:

- `README.md`
- `docs/roadmap.md`
- `docs/project-zoomout-status.md`
- `apps/docs/app/docs-content.ts`
- `apps/docs/app/docs-content.test.ts`

Explicit non-scope:

- `apps/server/**`
- `apps/web/**`
- `apps/extension/**`
- `packages/**`
- `scripts/migrations/**`
- package manifests and lockfiles
- Product Documentation runtime routes, navigation, persistence, editor, reader,
  search, OpenAPI runtime, comments runtime, or publication code
- Video runtime or planning

## Feature, Security, Ownership, And Compatibility Outputs

The consolidated matrix and contracts are not repeated here in full:

- first slice / remaining V1 / later / rejected matrix:
  `docs/documentation-domain-decisions.md#7-feature-matrix`;
- source-of-truth and ownership:
  `docs/documentation-domain-decisions.md#2-source-of-truth-and-ownership`;
- Tiptap/Fumadocs boundaries:
  `docs/documentation-domain-decisions.md#3-authoring-and-reader-boundaries`;
- URL/access/search/publication:
  `docs/documentation-domain-decisions.md#4-url-access-search-and-publication-decisions`;
- concurrency/retention/migration:
  `docs/documentation-domain-decisions.md#5-concurrency-lifecycle-retention-and-migration`;
- threat model:
  `docs/documentation-domain-decisions.md#6-security-and-threat-model`;
- accessibility/performance/limits:
  `docs/documentation-domain-decisions.md#8-accessibility-performance-and-operational-targets`.

Backward compatibility:

- this child makes no runtime or persistence change;
- Guide, Interactive Demo, existing Publication/Publish Link, extension, API,
  portal, embed, and public routes remain unchanged;
- accepted Documentation language is explicitly labeled target state;
- child `132` must use additive migrations after `024`, preserve existing
  behavior, and define clean-install/upgrade/reset/reseed evidence;
- no legacy Documentation data migration exists because no Documentation
  runtime exists.

## Ordered Implementation Handoff

1. `132 — Documentation Site First Vertical Slice`
2. `133 — Documentation Portability, Snippets, And Assets`
3. `134 — Documentation Version Carry-Forward And Lifecycle`
4. `135 — Documentation Review Workflow`
5. `136 — Documentation API Experience`
6. `137 — Documentation V1 Hardening And Closeout`
7. `138 — Post-V1 Documentation Decision Gate`

Child `132` must be expanded and rechecked before implementation. It owns exact
schemas, migrations, routes, API contracts, UI components, dependency pins,
permissions, audit/access actions, errors, tests, rollback, and agent-browser
journeys. It may refine implementation mechanics but cannot silently change the
accepted domain semantics.

## Completed Checklist

- [x] Confirm child `130` completion and record the current runtime/migration
      baseline.
- [x] Recheck all 32 provisional answers against completed children `129`/`130`
      and current code.
- [x] Resolve the Question `31` comments boundary and apply it to Question `32`.
- [x] Remove the circular child `131` sequence prerequisite.
- [x] Correct invalid ADR `0023` and `0026` filenames.
- [x] Separate historical provisional workshop wording from final acceptance.
- [x] Add accepted Documentation terms and relationships to `CONTEXT.md` without
      claiming runtime implementation.
- [x] Record durable decisions in justified ADRs.
- [x] Consolidate the feature matrix, source-of-truth/ownership model, threat
      model, tooling boundaries, and URL/access/search/publication/concurrency/
      retention/migration decisions.
- [x] Define the complete first slice and ordered implementation sequence
      beginning at `132`.
- [x] Keep Documentation and Video runtime, routes, packages, schemas, and
      navigation out of this child.
- [x] Run focused formatting/link/terminology/decision/runtime-absence checks.
- [x] Update the parent only for genuinely completed Master Plan `005` items.

## Grill Log

- 2026-07-29: the 32-question one-at-a-time grill began from commit `5e78723`
  while children `129`/`130` were still being completed elsewhere.
- 2026-07-29: Questions `1` through `32` received attributable recommendation,
  alternatives, tradeoffs, reversibility, affected scope, and provisional
  outcome records.
- 2026-07-30: the user accepted basic private Page comments in the first slice,
  closing the reopened Questions `23`/`31` boundary and Question `32` step `8`.
- 2026-07-30: all 32 answers were rechecked against the completed child
  `129`/`130` repository state; no contradicting runtime change was found.
- 2026-07-30: canonical target language, four ADRs, consolidated decisions,
  threat/ownership/tooling boundaries, feature matrix, and children `132`–`138`
  were finalized.

## Verification Record

Verification date: 2026-07-30

Focused commands and final outcomes are recorded after the final clean pass:

- `pnpm exec prettier --check` over all child-`131` Markdown and docs-app files:
  passed.
- repository-local Markdown link target validator over the scoped Markdown
  files: passed, `23` local links checked.
- invalid ADR filename, circular gate, and stale active-phase wording scans:
  passed.
- final acceptance ledger coverage: passed, exactly `32` accepted Question rows.
- `git diff --check`: passed.
- scoped diff path assertion: passed; no `apps/server`, `apps/web`,
  `apps/extension`, `packages`, migration, package-manifest, or lockfile change.
- `pnpm --filter docs test`: passed, `4` files / `12` tests.
- `pnpm --filter docs lint`: passed.
- `pnpm --filter docs check-types`: passed, including Next route type
  generation and TypeScript.

Browser validation is not required for child `131`: it intentionally changes no
runtime UI. Child `132` must include agent-browser authoring, preview, comments,
reader, search, publication, failure, and rollback evidence.

## Leftovers And Handoff

- Product Documentation runtime is not implemented.
- Fumadocs/Tiptap versions recorded during the grill are research snapshots;
  child `132` owns exact compatible pins, transitive review, and proofs.
- Exact route shapes, schemas, API payloads/errors, quota defaults, and hard
  safety ceilings are implementation mechanics owned by expanded child `132`
  within the accepted semantics.
- Git synchronization, translations, custom domains, public feedback/analytics,
  permanent deletion, realtime collaboration, offline-first merge, arbitrary
  executable content, server-side API proxying, and stored API credentials
  remain deferred or rejected as recorded.
- The next action is to rewrite/expand and recheck child `132`; do not implement
  it from the sequence summary alone.
