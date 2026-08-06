# Child Plan 142: Documentation Authoring Experience Modernization

Date reserved: 2026-07-31

Last implementation-readiness audit: 2026-08-05
Last execution close-recheck: 2026-08-06

Status: Complete — Tiptap `partial-adopt` reverified on 2026-08-06 after the
stale metadata/Row-Version repair in `e13d7ca` and the caret-preservation
regression fix in `1e3bc40`.

Reopen finding: parent block identity, prose content, and metadata now sync
without emitting `onChange`, while conflicting unsaved prose remains local.
The regression covers sequential saves, heading/quote/callout metadata,
read-only fields, and local-work preservation.

Selected branch: prose-only(paragraph, heading, quote, callout,
ordered_list/unordered_list item text). Tiptap owns transient inline prose
editing only; the Ossie-native block editor remains authoritative for the
typed block graph, identities, structure, references, assets, comments, save,
and recovery contracts.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/141-documentation-editor-reader-adapter-proof-and-adoption-gate.md`

Authority:

- `CONTEXT.md`
- ADRs `0027`, `0028`, `0030`, `0031`, and `0032`
- Master `007` and the final Child `141` authoring disposition

## 1. Objective

Modernize the production Documentation Page and snippet authoring experience
using exactly the branch selected by Child `141`, while preserving shared
block schemas, stable identities, Row-Version concurrency, permissions,
comments, assets, imports/exports, Revisions, Publications, search, and
Carry-Forward.

The branch may be:

- **whole-graph Tiptap adapter** — only if Child `141` explicitly records
  `adopt`;
- **prose-only Tiptap adapter** — only for the exact kinds recorded by Child
  `141` as `partial-adopt`;
- **native modernization** — required if Tiptap is rejected.

This child is an experience change, not a new content model.

## 1.1 Execution intake and independent recheck

- Child `141` was complete and close-rechecked before runtime edits. Its exact
  Tiptap disposition and named prose kinds are copied above.
- Child `141` leftovers assigned here were the retained Tiptap packages,
  shared prose converter seam, lazy proof boundary, and native fallback. No
  rejected proof dependency or proof-only production route was carried over.
- Current Page and Snippet callers, shared `DocumentationBlock[]` contracts,
  Page Row-Version/autosave/conflict flow, comments, references, assets,
  preview, import/export, review, Publication, search, and Carry-Forward paths
  were rechecked. No API, server, migration, persistence, authority, or URL
  change was required.
- The exact retained package pins are `@tiptap/core`, `@tiptap/pm`,
  `@tiptap/react`, and `@tiptap/starter-kit`, all `3.29.2`, moved to web
  production dependencies because the selected runtime field imports them.
- The production adapter stayed lazy and was measured after removing the full
  server policy-module import from its client bundle. The final field chunk is
  5.64 kB raw / 2.20 kB gzip.

## 2. Required Preflight And Leftover Intake

Before runtime edits:

1. read the completed Child `141` status, scorecard, dependency disposition,
   implementation log, evidence, limitations, leftovers, and commits;
2. copy its exact authoring branch and selected block/mark list into this plan;
3. confirm rejected proof code/packages are absent and retained dependencies
   match the recorded exact versions;
4. inspect current Page/snippet editor callers, shared schemas, API clients,
   server request schemas, save/conflict tests, comments, preview, imports,
   checkpoint/publication/search paths, and current worktree;
5. list only Child `141` leftovers explicitly assigned here;
6. refresh exact file ownership and independently recheck this plan.

If Child `141` is incomplete, stop. If its selected adapter later fails a
production-only gate, use the already authorized native fallback and document
why; do not weaken schema or permission contracts.

## 3. Invariants

- PostgreSQL relational state and `DocumentationBlock[]` remain authoritative.
- Stable block, list-item, table-row/cell, and tab-item IDs remain unchanged
  unless the user explicitly inserts/deletes that item.
- `position` remains one-based and normalized after deliberate reorder.
- `expected_version` and Page/snippet Row-Version semantics remain intact.
- UI state cannot bypass `canWrite`, Project Membership, lifecycle read-only,
  archive, review, or publication rules.
- Page comments continue to anchor to Page/block identity under ADR `0030`.
- unknown, executable, or adapter-only nodes fail closed and are never saved.
- local unsaved content is never silently discarded after save failure,
  navigation, adapter failure, or conflict.
- Revisions/Publications remain immutable and are created only by existing
  server flows.
- snippets use the same selected editor contract as Pages for supported kinds;
  no Page-only adapter state may become required to edit a snippet.

## 4. Selected Branch Contract

At execution, replace this planning placeholder with one final line:

`Selected branch: whole-graph | prose-only(<exact kinds>) | native`.

### 4.1 Whole-graph branch

Allowed only when Child `141` proves exact round-trip for every accepted
block. Keep one shared conversion module. Every Tiptap transaction must either
produce a valid complete `DocumentationBlock[]` or leave the prior graph
unchanged with an accessible error. No HTML serialization.

### 4.2 Prose-only branch

Tiptap may own only the exact text fields proven by Child `141`. Structural
forms, references, assets, API blocks, code, tables/tabs, and any unselected
kind remain native. The UI must make the editing mode change understandable
without splitting save authority or producing nested forms.

### 4.3 Native branch

Improve the existing controlled inputs with Ossie components and CSS:

- clearer block insertion grouped by prose, structure, media, and references;
- explicit block type/name and position;
- keyboard-accessible move up/down and delete actions;
- better empty, read-only, invalid, conflict, saving, saved, and recovery states;
- preserved focus after insert/reorder/delete;
- no drag-only control; pointer reorder is optional only when keyboard parity
  exists.

The native branch must not imitate a free-form rich text editor by weakening
the constrained block model.

## 5. Authoring Behavior Rules

### 5.1 Load and readiness

- show a named loading state while Page/options load;
- render load failure with retry and retain route context;
- Viewer/read-only mode renders content and metadata without enabled mutation
  controls;
- a selected adapter chunk failure falls back to native controls over the same
  loaded graph and announces the fallback.

### 5.2 Insert, edit, and delete

- insertion creates ULID identities once, with `expected_version: null`;
- empty required fields prevent insertion with field-associated errors;
- edit preserves identity and only changes the selected fields;
- deletion requires confirmation when the block has content or references;
- referenced/protected asset/snippet behavior remains server-authoritative;
- destructive confirmation returns focus to a deterministic neighboring block.

### 5.3 Reorder

- move controls are buttons with accessible names containing block type and
  position;
- first/last unavailable moves are disabled;
- reorder emits one normalized graph and preserves nested identities;
- drag/drop, if retained, accepts only internal same-Page block payloads and
  has keyboard parity; file/HTML/external drops fail closed.

### 5.4 Paste

- plain text enters the active supported field;
- rich HTML is reduced to the accepted text/marks subset only in a selected
  Tiptap field;
- unsupported tags, scripts, event handlers, iframes, images, and custom nodes
  are discarded/rejected without executing or creating hidden content;
- multi-block conversion occurs only if Child `141` explicitly proved it;
  otherwise paste remains within one field.

### 5.5 Save and autosave

- preserve the existing 800 ms default unless measured evidence justifies a
  reversible constant change;
- coalesce changes but never issue overlapping saves for stale local graphs;
- status uses `aria-live` without announcing each keystroke;
- save sends only shared blocks plus the existing expected draft/Page versions;
- success adopts server-returned versions;
- network/server error retains local content and offers retry;
- conflict stops autosave, identifies server/local divergence, and offers the
  existing safe recovery/reload path—never last-write-wins;
- route unload warning applies when local unsaved changes exist.

### 5.6 Comments and anchors

- existing block DOM IDs remain
  `documentation-block-<stable-block-id>`;
- editor chrome must not duplicate those IDs;
- comment thread anchors survive text editing and reorder;
- deleting an anchored block follows existing server/comment behavior and must
  not silently retarget comments.

### 5.7 References, assets, and preview

- existing reference option APIs remain authoritative;
- image alt text remains required;
- Page links preserve Page/block target identity;
- snippet, Guide Publication, Demo Publication, and OpenAPI references retain
  typed fields;
- saved preview remains clearly server-saved state and excludes unsaved local
  edits unless existing behavior explicitly says otherwise;
- markdown/package export continues to project server-saved content.

## 6. Routes And API Contracts

No route or method change is planned.

Primary browser route:

- `/projects/:projectId/versions/:versionSlug/documentation/:siteId/pages/:pageId`

Existing clients remain in `apps/web/src/lib/documentationApi.ts`, including:

- Page load/update/save;
- preview/options;
- asset upload;
- snippet list/get/create/update/save/archive;
- export links.

The existing request/response Zod schemas in `packages/types/src/documentation.ts`
remain unchanged. If the selected UI cannot save through them losslessly, use
the native branch. Do not add an adapter-document field or endpoint.

Authorization remains server-side. Client `canWrite` controls presentation
only and is not accepted enforcement.

## 7. Exact File Plan

### 7.1 Expected production files

- `apps/web/src/features/documentation/DocumentationBlockEditor.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.tsx`
- `apps/web/src/features/documentation/DocumentationSnippetPanel.tsx`
- `apps/web/src/features/documentation/DocumentationCommentsPanel.tsx`
  only for proven anchor/focus integration
- `apps/web/src/features/documentation/DocumentationBlockRenderer.tsx`
  only for editor preview/anchor parity
- `apps/web/src/features/documentation/DocumentationContentWorkflows.module.css`
- a focused new editor CSS module if clearer than extending the shared file
- Child `141` retained adapter/converter files
- `apps/web/src/App.tsx` only for route-level lazy/fallback wiring already
  selected by Child `141`
- `apps/web/package.json` and `pnpm-lock.yaml` only for retained Tiptap core.

### 7.2 Expected tests

- `DocumentationBlockEditor.test.tsx`
- `DocumentationPageEditor.test.tsx`
- `DocumentationSnippetPanel.test.tsx`
- `DocumentationCommentsPanel.test.tsx` when touched
- adapter/converter tests retained from Child `141`
- `apps/web/src/lib/documentationApi.test.ts` only if caller typing changes
  without changing the wire contract
- existing server Documentation route/service/repository tests as regression
  evidence, not expected production edits.

### 7.3 Conditional shared files

Touch `packages/types`, `packages/documentation-domain`, server routes,
repositories, services, or a migration only if an independently rechecked
amendment demonstrates a pre-existing contract bug. A UI adapter need is not
sufficient. Such a change that alters semantics uses the Master stop policy.

### 7.4 Forbidden files

- public reader modernization owned by Child `143`, except shared renderer
  compatibility fixes;
- generated examples owned by Child `144`;
- `apps/docs`, extension, unrelated portal, deployment, or accepted-later
  feature files.

## 8. Schema, Migration, Compatibility, And Rollback

- New persisted schema: none.
- Migration: none.
- API version: unchanged.
- Existing content: opens and saves without conversion job.
- Import/export/package: exact shared blocks remain compatible.
- Revision/Publication: snapshots remain byte/semantic compatible at the
  accepted shared-contract layer.
- Rollback: switch the route/component to the retained native editor and remove
  the adapter dependency after verifying no persisted adapter state exists.
- Dependency removal must not require data rewrite.

## 9. Security And Permission Tests

Prove:

- Viewer cannot edit through hidden controls, keyboard shortcuts, DOM events,
  or direct client calls accepted by server;
- cross-Organization/Project IDs remain 404/403 under existing policy;
- archived/read-only states reject mutation;
- paste/drop does not execute or persist HTML/JS/iframe/custom nodes;
- adapter error messages do not expose content from other Pages/snippets;
- no editor state, content, comment, or asset data is sent to Tiptap/third-party
  services;
- debug/proof selectors from Child `141` are gone in production;
- CSP does not require unsafe script/eval changes.

## 10. Test-Driven Implementation Order

1. failing selected-branch conversion and unsupported-input tests;
2. failing Page and snippet parity tests;
3. load/read-only/empty/error states;
4. insertion/edit/delete/reorder and focus;
5. autosave/save/conflict/local recovery;
6. comments/anchors and references/assets;
7. lazy adapter failure/native fallback;
8. responsive/accessibility/browser polish;
9. compatibility and full focused regression;
10. close-recheck and records.

## 11. Verification Matrix

Focused:

- selected adapter/converter tests;
- BlockEditor, PageEditor, SnippetPanel, CommentsPanel, BlockRenderer tests;
- documentation API caller tests;
- shared block/type policy tests;
- relevant server Documentation route/service tests for save, permission,
  conflict, asset/reference, comments, checkpoint, and publication.

Package/workspace:

- `pnpm --filter web test -- <focused files>`
- `pnpm --filter @repo/types test`
- `pnpm --filter @repo/documentation-domain test`
- `pnpm --filter web check-types`
- `pnpm --filter web lint`
- `pnpm --filter web build`
- frozen install/audit/license review when dependencies remain
- broader server/DB tests only if shared/server files change
- `git diff --check` and scoped diff review.

Record exact commands and counts rather than copying these examples blindly.

## 12. Agent-Browser Requirements

Use the existing Documentation fixture and real Page route. Cover:

- Project Editor and Project Viewer;
- representative Page and snippet;
- desktop, 320px, 200% zoom, reduced motion;
- keyboard-only insert/edit/reorder/delete/save/comment navigation;
- visible focus and restoration;
- loading, empty, read-only, error, conflict, offline/failure, and recovery;
- unsaved navigation warning;
- adapter chunk failure/native fallback when selected;
- axe A/AA, accessibility tree, console, and failed requests;
- no private screenshots/credentials.

Chromium is required. Record optional Firefox/WebKit capability honestly.
Measure selected route chunk and representative interactions against Child
`141`'s native baseline.

## 13. Acceptance Criteria

- selected Child `141` branch is implemented exactly;
- authoring is measurably clearer/faster on recorded tasks;
- all accepted block and nested identities survive;
- Page and snippet behavior is equivalent for selected kinds;
- read-only/permission/conflict/local-recovery behavior is correct;
- no schema/API/migration/authority change;
- existing comments, preview, import/export, checkpoint, review, publication,
  search, and Carry-Forward tests pass;
- browser/accessibility/build/dependency gates pass;
- native fallback remains proven through the verification window;
- no unresolved in-scope S1/S2 issue.

## 14. Explicit Non-Scope

- reader modernization beyond shared renderer compatibility;
- new blocks/marks or arbitrary rich text;
- simultaneous collaboration, presence, offline editing, AI;
- review workflow redesign;
- import/export redesign;
- API examples, Try-It changes, SDK generation;
- accepted-later features or unrelated app redesign.

## 15. Commit Strategy

Suggested small commits:

- `refactor(documentation): establish production editor adapter boundary`
- `feat(documentation): modernize page and snippet authoring`
- `test(documentation): verify authoring compatibility and recovery`
- `docs(documentation): close authoring modernization`

These are upper-bound groupings. Commit each small, single-purpose,
independently reviewable, focused-test-green slice as soon as it is coherent.
Split contracts, Page authoring, snippet authoring, recovery, accessibility,
and browser fixes further when their diffs are broad or independently
revertible. Never accumulate the whole child into one end-of-child commit.
Stage exact paths and preserve unrelated work.

## 16. Checklist

### Intake and plan

- [x] Child `141` is complete/close-rechecked.
- [x] Selected branch/kinds/dependencies copied here.
- [x] Child `141` leftovers classified.
- [x] Current callers/contracts/worktree inspected.
- [x] Plan refreshed and independently rechecked.

### Implementation

- [x] Failing tests established first.
- [x] Shared adapter/native branch implemented.
- [x] Page and snippet paths modernized.
- [x] Insert/edit/delete/reorder/paste/focus remain native and were regression-tested; selected prose fields preserve block identity.
- [x] Save/autosave/conflict/recovery completed through the existing Page/Snippet clients.
- [x] Comments/references/assets/preview compatibility completed without shared-contract changes.
- [x] Read-only and permission behavior completed.
- [x] Lazy failure/native rollback completed.

### Verification and closeout

- [x] Focused tests/type/lint/build pass.
- [x] Dependency/frozen/audit checks pass if applicable.
- [x] Agent-browser matrix passes.
- [x] Compatibility regressions pass.
- [x] Independent close-recheck clean.
- [x] Status/log/evidence/limitations/leftovers/handoff/commits updated.
- [x] Commits are small, single-purpose, focused-test green, and independently
      reviewable; no large end-of-child commit was used.
- [x] Master Child `142` lifecycle updated.

## 17. Implementation Log

### 2026-08-05

- Retained Child `141`'s Tiptap `partial-adopt` branch and made the selected
  field lazy through `LazyDocumentationTiptapProseField`.
- Mounted the field by default on production Page and Snippet editor paths
  only for paragraph, heading, quote, callout, and ordered/unordered list-item
  text. Structural controls, typed references, assets, comments, save clients,
  autosave, Row-Version conflict handling, preview, and exports remain native.
- Added a client-safe bounded controlled-inline parser and converter. It
  supports text, bold, italic, inline code, and hard breaks; unsupported
  markup and unsupported Tiptap nodes fail closed. The server policy remains
  the authoritative validator at save boundaries.
- Disabled unowned StarterKit block extensions (`codeBlock` and
  `horizontalRule`) after browser evidence showed the schema correctly
  rejecting them but permitting them into a field transaction. This keeps the
  selected schema bounded without weakening the converter.
- Kept the existing native field as the Suspense/error-boundary fallback. A
  browser abort/recovery check confirmed the fallback and re-mounted adapter.
- Moved the exact retained Tiptap packages from web devDependencies to
  dependencies and passed a frozen install.
- Child `141` intake commits: `e4f8f81`, `6771cb6`, `47f8a35`, `39af63e`,
  `8ae5487`, `7690f1d`. Child `142` implementation and closeout commits are
  recorded below after staging.

### 2026-08-06 — reopened stale-metadata repair

- Reproduced a first edit/save followed by a parent refresh and second edit;
  the prose field previously retained stale source metadata and Row-Version
  identity.
- Added controlled parent synchronization with `emitUpdate: false`, preserving
  local unsaved prose on a conflicting parent text update while applying clean
  heading, quote, callout, identity, and metadata updates without spurious
  `onChange`.
- Added a regression that places the browser caret inside prose, applies an
  external metadata-only update, and verifies the caret remains in place;
  focused Page/editor tests passed 12/12 and the full web suite passed 92
  files/479 tests after `1e3bc40`.
- Added regression coverage for sequential Page saves, metadata updates,
  read-only behavior, and unsupported conversion recovery. Focused Page/editor
  tests and web type-check pass. Browser mount evidence is recorded in
  `docs/ui/2026-08-06-documentation-post-v1-repair-browser-evidence.md`.

## 18. Verification Record

### Automated verification

- `pnpm --filter web test`: **89 files / 462 tests passed**.
- `pnpm --filter @repo/types test`: **18 files / 95 tests passed**.
- `pnpm --filter @repo/documentation-domain test`: **19 files / 50 tests
  passed**.
- `pnpm --filter server test`: **127 files / 552 tests passed**.
- `pnpm --filter web check-types`: passed.
- `pnpm --filter web lint`: passed with zero warnings.
- `pnpm --filter web build`: passed. `DocumentationTiptapProseField` was
  **5.64 kB raw / 2.20 kB gzip**; native Documentation Page editor remained
  **51.51 kB raw / 13.77 kB gzip**; the existing API experience remained
  **130.58 kB raw / 32.73 kB gzip**.
- `pnpm install --frozen-lockfile`: passed.
- `pnpm licenses list --filter web`: passed; retained direct adapter packages
  are MIT. `pnpm audit --prod` retained the previously recorded unrelated
  workspace findings (server `fast-uri`, separate docs PostCSS/Babel); no new
  candidate direct advisory was identified.
- `git diff --check`: passed.

### Browser verification

Evidence is recorded in
`docs/ui/2026-08-05-documentation-authoring-modernization-browser-evidence.md`.
The synthetic fixture organization/project were
`01K12500000000000000000001` / `01K12500000000000000000002`; the final reseed
left the fixture clean. Chrome `151.0.7922.47` via agent-browser `0.33.1`
covered:

- admin Page production Tiptap prose field, edit, persistence after reload,
  existing Saved status, and structural native controls;
- Snippet production prose field with existing Save Snippet authority;
- viewer read-only Page content with no contenteditable/mutation controls;
- lazy adapter abort to native field and recovery back to Tiptap;
- 320px and equivalent 200% reflow (160px) with no horizontal overflow;
- reduced motion, accessibility tree, axe A/AA, console, and page-error
  checks. Axe reported zero violations; its existing partially obscured
  color-contrast checks were incomplete only.

Firefox/WebKit and an installed screen reader were unavailable and are not
claimed as passed.

## 19. Leftovers And Handoff

No in-scope authoring leftovers remain. Child `143` receives only:

- the exact retained Tiptap dependency/lazy-loading facts for integrated build
  accounting;
- the verified limitation that Tiptap is prose-field-only and must not be
  extended to reader content or typed structural blocks;
- the final authoring bundle baseline and browser evidence file.

There are no reader-affecting code changes or authoring defects routed to
Child `143`; its work remains limited to Child `141`'s Fumadocs reader
disposition.
