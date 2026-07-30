# Child Plan 133: Documentation Content, Snippets, And Asset Workflows

Date reserved: 2026-07-30

Date expanded: 2026-07-30

Date rechecked: 2026-07-30

Status: Complete — implemented and verified on 2026-07-30. Migration `026`,
expanded relational content, Edition-owned Snippets, protected
Documentation/Capture Asset workflows, exact artifact Publication references,
immutable Revision/public projections, authoring/reader UI, search, audit,
access, migration, smoke, and headless-browser evidence all pass.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/132-documentation-site-first-vertical-slice.md`

Next child:

- `docs/plan/134-documentation-import-export-and-package-portability.md`

## 1. Sequence Gate And Baseline

Child `132` is complete and its close-previous audit is committed at baseline
`d1c4210`. It established:

- additive migration `025_documentation_site_first_vertical_slice.sql`;
- `@repo/documentation-domain`, shared constants, and strict shared contracts;
- a PostgreSQL-authoritative Site/Edition/Working Draft/Page model;
- Page aggregate replacement under `expected_page_version` with retained child
  Row Versions;
- the first safe Page block set;
- protected raster upload and exact authorized File delivery;
- complete relational Site Revision snapshots and type-specific Site
  Publications;
- stable Documentation Publish Links, exact-publication public loading, search,
  rollback, and access policy;
- the Ossie-native typed-block editor/reader fallback after Tiptap/Fumadocs
  adoption was not justified;
- a deterministic Documentation browser fixture and browser evidence.

This plan extends those contracts. It must not replace the authority model,
change public URL ownership, introduce a universal JSON document, or reopen the
completed child `132` adapter decision.

Before implementation, the implementing agent must:

1. reread this plan, Master `006`, completed child `132`,
   `docs/documentation-domain-decisions.md`, `CONTEXT.md`, ADRs `0027`–`0030`,
   and the child `132` browser evidence;
2. record `git status --short`, current commit, migration head, dependency
   state, and unrelated user/agent changes;
3. inspect the actual files listed in section 7 and update this plan if their
   physical contracts changed;
4. commit the rechecked plan checkpoint before runtime changes;
5. use test-driven development for every runtime change.

No child `134` work may be pulled into this child to make content appear
portable. The exit gate is the authoritative relational runtime, not an import
or export format.

## 2. Mission

Complete the accepted V1 constrained Documentation content model on top of the
working child `132` vertical slice:

- add the remaining safe normal-writing and typed block forms;
- add Edition-owned reusable snippets with independent Row Version protection;
- add exact same-Project Guide and Interactive Demo Publication references;
- turn the minimal image upload into a Documentation Asset library with
  selection, archive, restore, and authorized Capture Asset reuse;
- protect every mutable and immutable File/publication dependency;
- freeze the entire expanded graph into exact Site Revisions and Publications;
- render and search only the safe, authorized exact snapshot;
- provide accessible authoring, preview, and reader workflows;
- leave stable, versionable contracts for child `134`.

This is a vertical deepening of one existing Documentation aggregate. A plan
that only adds editor controls, or only adds tables, does not complete child
`133`.

## 3. Required End-To-End Journey

The deterministic child `132` fixture must be extended, not replaced. The
implemented child is not complete until one repeatable journey proves:

1. an Admin or Editor opens an existing writable Site Edition;
2. the author creates an active reusable Snippet with constrained content;
3. two Pages reference that same Snippet;
4. editing the Snippet once changes both saved-draft previews without changing
   either Page Row Version;
5. the author uses every remaining V1 block kind, including quote, table,
   callout, tabs, code example, exact Guide Publication, and exact Interactive
   Demo Publication;
6. the author uploads, lists, selects, archives, and restores a Documentation
   Asset;
7. the author selects an authorized active Capture Asset from the same Project,
   including the explicit source Project Version label;
8. a cross-Project, cross-Organization, cross-Site, and cross-Edition identity
   swap fails without revealing existence;
9. archiving an in-use Snippet, Documentation Asset, or Capture Asset preserves
   the existing saved reference but prevents a new unrelated selection;
10. the existing Capture Asset protection report and physical-purge command
    identify and block Documentation Working Draft dependencies;
11. the author previews the complete expanded Working Draft;
12. the author creates Revision `R1`, publishes it as Publication `P1`, and
    verifies content, Snippet expansion, media, exact Guide/Demo references,
    and search;
13. the author edits the Snippet, replaces media, and selects different exact
    Guide/Demo Publications in the Working Draft;
14. `P1` and its protected Files/publication references remain byte-for-byte
    and semantically unchanged;
15. the author creates `R2`/`P2` and verifies the new exact graph;
16. link rollback exposes `P1` without rebuilding it or reading mutable rows;
17. another Site Edition proves no live Snippet or Documentation Asset sharing;
18. Admin, Editor, Viewer, public, conflict, archived-source, missing-media,
    restricted-link, narrow/reflow, keyboard, and reduced-motion cases pass.

## 4. Accepted Outcomes

### 4.1 Content

The complete V1 Page content set is:

- paragraph;
- heading levels `2`–`4`;
- ordered list;
- unordered list;
- quote;
- table;
- escaped code block;
- escaped code example;
- safe link;
- image/media reference;
- divider;
- callout;
- tabs;
- read-only API reference;
- reusable Snippet reference;
- exact Guide Publication reference;
- exact Interactive Demo Publication reference.

Normal text fields may contain the controlled inline Markdown subset defined in
section 9. They do not accept raw HTML or MDX.

### 4.2 Snippets

- A Snippet belongs to exactly one Site Edition.
- Many Pages in that Edition may reference it.
- A mutable Snippet edit is live across saved Working Draft uses only.
- A Page stores a stable Snippet identity, not copied mutable text.
- A Site Revision freezes the exact Snippet definition and exact Page uses.
- A Publication reads only the Revision copy.
- Snippets never nest other Snippets.
- There is no cross-Site or cross-Edition live Snippet reference.
- Child `135` will copy Snippets and remap uses during Carry-Forward.

### 4.3 Publication references

- A Guide or Interactive Demo block identifies one exact
  `publish_schema.published_artifact`.
- The target must belong to the same Organization and Project.
- The persisted type must match the Publication family.
- It never resolves a draft, “latest” Publication, title, slug, Publish Link,
  or mutable link entry.
- A Site Revision freezes both the exact Publication identity and the safe
  display projection needed by the reader.
- A Documentation Publish Link authorizes only the frozen reference
  presentation inside that Documentation Publication; it does not grant access
  to the referenced artifact's body, Files, or separate Publish Links.
- Child `133` renders one Ossie-owned, metadata-only Publication card containing
  the type, exact Revision-frozen title, description truncated to the
  Documentation `1,000`-character display ceiling, source Project Version
  label, Revision Number, and Publication Sequence.
- The card has no iframe, artifact body/media, automatic playback, guessed
  public URL, or click-through action. A richer inline Guide/Demo reader would
  require a later explicit access/rendering contract and is not implied by the
  word “reference.”

### 4.4 Assets

- Documentation Asset upload remains Edition-owned and File-backed.
- A Page or Snippet media use selects exactly one authorized Asset identity:
  `documentation_asset` or `capture_asset`.
- Presentation meaning belongs to the use: required alternative text and
  optional caption are not global Capture Asset metadata.
- Documentation Asset archive/restore is a Row-Versioned product command.
- Archive hides an Asset from normal new selection but never rewrites an
  existing Working Draft, Revision, or Publication.
- Same-Project Capture Assets may be selected across Project Versions with the
  source Version shown explicitly.
- Only Capture Assets backed by an exact decodable PNG, JPEG, or WebP File that
  satisfies the Documentation byte/dimension/pixel limits are eligible.
  `html_snapshot` and every non-raster Capture Asset remain ineligible.
- Active source Project Versions appear by default. An explicit archived-
  Version filter may show eligible active Assets from archived Project
  Versions with unambiguous read-only source labels.
- Capture Assets in `pending`, failed-purge, completed-purge, deleted, foreign,
  or otherwise non-resolvable state cannot be newly selected.
- An archived Capture Asset already in use remains resolvable and visibly
  labelled as archived.
- A new Capture Asset reference extends the existing protection report and
  purge guard atomically.

There is no implemented Derived Asset product identity at this baseline.
Master `006` permits Derived/Redacted selection only after its owning domain
proves an exact selection contract. Child `133` must document that future
extension seam and return the stable unsupported-source error if a caller
submits `derived_asset`; it must not advertise that source in the accepted
request union or invent a duplicate Derived Asset table, route, or shadow File
identity.

## 5. Explicit Non-Scope

Do not implement:

- Markdown, ZIP, or OpenAPI import/export;
- package schema/versioning or portability;
- Documentation Carry-Forward;
- multiple-Site management/lifecycle polish beyond the scoped Snippet/Asset
  archive behavior;
- Page, Site, or Edition archive/restore;
- formal review, approval, notifications, or public comments;
- API Try It, request execution, proxying, credentials, environments, or SDK
  generation;
- Tiptap, Fumadocs, MDX, filesystem, or Git authority;
- arbitrary React components, JavaScript, raw HTML, CSS, SVG markup, iframes,
  remote media, or server-side URL fetching;
- audio, video, PDF, arbitrary downloads, animated-image authoring, image
  transformation, crop, annotation, or redaction;
- creation of a Derived/Redacted Asset domain;
- a Documentation Asset physical-purge endpoint;
- automatic cleanup, permanent deletion, legal erasure, or retention-policy
  changes;
- translation, locale fallback, custom domains, analytics, public feedback,
  external reviewer tokens, or realtime collaboration;
- organization-configurable quotas, quota dashboards, production p75,
  Firefox/WebKit acquisition, or public-loader performance splitting owned by
  child `138`;
- child `134` package serialization;
- changes to unrelated Guide/Demo authoring or public routes.

## 6. Domain Ownership And Invariants

### 6.1 Aggregate map

```text
Project
  -> Documentation Site
       -> Site Edition
            -> Site Working Draft
                 -> Documentation Pages
                      -> Page blocks
                           -> table rows/cells
                           -> tab items
                           -> Snippet use
                           -> exact artifact Publication reference
                           -> Asset use
                 -> Reusable Documentation Snippets
                      -> Snippet blocks
                           -> table rows/cells
                           -> tab items
                           -> exact artifact Publication reference
                           -> Asset use
                 -> Documentation Assets
                 -> Navigation / routing / OpenAPI
            -> immutable Site Revisions
                 -> Page snapshots and Snippet-use graph
                 -> Snippet snapshots
                 -> exact artifact Publication references
                 -> exact Asset/File allowlist
            -> immutable Site Publications
                 -> exact Revision and derived search documents
```

### 6.2 Authority

Authoritative:

- explicit PostgreSQL records and constraints;
- protected File storage;
- exact `published_artifact` identities;
- immutable Revision and Publication records;
- Project Membership and Publish Link policy;
- Audit and Access Evidence.

Derived and disposable:

- editor component state;
- controlled-Markdown parse trees;
- expanded Snippet render trees;
- publication cards/previews;
- search vectors/documents;
- caches and browser state.

No derived state may be accepted back as authority without revalidation.

### 6.3 Working Draft version behavior

- A Page content replacement locks the Page and compares
  `expected_page_version`.
- A Snippet content replacement locks the Snippet and compares
  `expected_snippet_version`.
- Both commands compare supplied retained child Row Versions before replacing
  children.
- Editing a Snippet increments the Snippet and Working Draft structural
  versions; it does not increment referencing Page Row Versions.
- Adding/removing/reordering a Page Snippet use remains a Page content change.
- Asset archive/restore increments the Asset and Working Draft structural
  versions; it does not rewrite referencing blocks.
- Existing child `132` Page replacement semantics remain authoritative. Child
  `133` does not add an independently callable child-delete endpoint.
- A stale Page or Snippet command returns `409` with the latest authorized safe
  aggregate; it never silently merges or last-write-wins.

### 6.4 Archive behavior

- Snippet and Documentation Asset states are `active` or `archived`.
- Editors and Admins may archive/restore them in writable Projects, Versions,
  Sites, and Editions.
- Viewers may read them but cannot mutate them.
- Archived items are excluded from normal creation pickers.
- Existing mutable references and all immutable references continue resolving.
- A referenced archived Snippet must validate and checkpoint normally.
- New Page/Snippet content may retain an already-present archived reference but
  may not introduce that archived ID into a different block.
- Restoring a Snippet whose normalized active name is now claimed returns
  `409 documentation_snippet_name_conflict`; no implicit rename or overwrite
  occurs.
- There is no delete route. Database foreign keys use `ON DELETE RESTRICT`.

### 6.5 Transaction And Lock Order

To avoid reference/purge and replacement deadlocks, mutation code uses one
documented order:

1. resolve and authorize Organization, Project, Project Version, Site, and
   Edition;
2. lock the mutable aggregate root (`Page`, `Snippet`, or Documentation Asset)
   and compare its expected Row Version;
3. lock the Site Working Draft when its structural Row Version will change;
4. lock referenced Capture Assets in ascending Asset ID order, then their File
   rows in ascending File ID order;
5. resolve immutable Published Artifacts and same-Edition Snippets/Pages;
6. replace child rows, increment root/draft Row Versions, and write Audit
   Evidence;
7. commit once.

The existing Capture Asset purge path must use the same Capture Asset-then-File
order before checking the complete dependency graph. Publication retains the
child `132` Edition-scoped serialization lock. The Edition path-namespace
advisory lock remains unchanged and is not taken for content-only commands.

Root aggregate Row Version is the authoritative delete guard for child rows
omitted from a replacement command. Retained child rows still carry and compare
their `expected_version`. Child `133` does not add separate block/row/cell/tab
delete endpoints or pretend that an omitted child has an independently
supplied delete Row Version.

## 7. Exact File Inventory

The implementer must keep changes inside this inventory unless a directly
caused regression requires adding a file to this plan before editing it.

### 7.1 Required new files

- `apps/server/src/db/migrations/026_documentation_content_snippets_and_asset_workflows.sql`
- `packages/documentation-domain/src/policies/documentation-snippet-policy.ts`
- `packages/documentation-domain/src/policies/documentation-snippet-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-asset-policy.ts`
- `packages/documentation-domain/src/policies/documentation-asset-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-artifact-reference-policy.ts`
- `packages/documentation-domain/src/policies/documentation-artifact-reference-policy.test.ts`
- `apps/web/src/features/documentation/DocumentationSnippetPanel.tsx`
- `apps/web/src/features/documentation/DocumentationSnippetPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationAssetLibrary.tsx`
- `apps/web/src/features/documentation/DocumentationAssetLibrary.test.tsx`
- `apps/web/src/features/documentation/DocumentationPublicationReferencePicker.tsx`
- `apps/web/src/features/documentation/DocumentationPublicationReferencePicker.test.tsx`
- `apps/web/src/features/documentation/DocumentationBlockRenderer.tsx`
- `apps/web/src/features/documentation/DocumentationBlockRenderer.test.tsx`
- `apps/web/src/features/documentation/DocumentationBlockEditor.test.tsx`
- `apps/web/src/features/documentation/DocumentationContentWorkflows.module.css`
- `docs/ui/133-documentation-content-snippets-and-asset-workflows-browser-evidence.md`

The new shared renderer prevents draft preview and public reader from drifting.
It receives already-authorized draft or immutable data and has no fetching or
authorization responsibility.

### 7.2 Existing schema, shared-domain, and contract files

- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `packages/constants/src/documentation.ts`
- `packages/constants/src/constants.test.ts`
- `packages/constants/src/index.ts`
- `packages/types/src/documentation.ts`
- `packages/types/src/documentation.test.ts`
- `packages/types/src/capture.ts`
- `packages/types/src/capture.test.ts`
- `packages/types/src/index.ts`
- `packages/documentation-domain/src/types/documentation-domain.ts`
- `packages/documentation-domain/src/policies/documentation-content-policy.ts`
- `packages/documentation-domain/src/policies/documentation-content-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-revision-policy.ts`
- `packages/documentation-domain/src/policies/documentation-revision-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-publication-policy.ts`
- `packages/documentation-domain/src/policies/documentation-publication-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-search-policy.ts`
- `packages/documentation-domain/src/policies/documentation-search-policy.test.ts`
- `packages/documentation-domain/src/index.ts`

### 7.3 Server and cross-domain protection files

- `apps/server/src/app.ts`
- `apps/server/src/app.test.ts`
- `apps/server/src/modules/documentation/documentation.repository.ts`
- `apps/server/src/modules/documentation/documentation.repository.test.ts`
- `apps/server/src/modules/documentation/documentation.service.ts`
- `apps/server/src/modules/documentation/documentation.service.test.ts`
- `apps/server/src/modules/documentation/documentation.routes.ts`
- `apps/server/src/modules/documentation/documentation.routes.test.ts`
- `apps/server/src/modules/documentation/documentation.db.integration.test.ts`
- `apps/server/src/modules/documentation/documentation-asset.ts`
- `apps/server/src/modules/documentation/documentation-asset.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.repository.ts`
- `apps/server/src/modules/capture-asset/capture-asset.repository.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.service.ts`
- `apps/server/src/modules/capture-asset/capture-asset.service.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.routes.ts`
- `apps/server/src/modules/capture-asset/capture-asset.routes.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.db.integration.test.ts`
- `apps/server/src/modules/publish/publish.repository.ts`
- `apps/server/src/modules/publish/publish.repository.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-source-coverage.test.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.test.ts`
- `apps/server/src/test-support/database.ts`

`publish.repository.ts` is read-only for exact artifact Publication selection
unless a small shared query helper is required. Existing Guide/Demo Publication
creation, Publish Links, public routes, and serializers must remain unchanged.

The implemented Documentation server is intentionally consolidated into three
large files. This child may extract cohesive Snippet/Asset/reference repository
helpers only if the extraction is behavior-preserving and tested; it must not
perform an unrelated module rewrite.

### 7.4 Fixture, smoke, and scripts

- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.db.integration.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.cli.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`
- `apps/server/package.json`

No separate browser harness is allowed.

### 7.5 Portal and reader

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/lib/documentationApi.ts`
- `apps/web/src/lib/documentationApi.test.ts`
- `apps/web/src/features/documentation/DocumentationBlockEditor.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.test.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationDraftPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationDraftPreviewPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.test.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.test.tsx`
- `apps/web/src/features/documentation/documentationPermissions.ts`
- `apps/web/src/features/documentation/documentationPermissions.test.ts`
- `apps/web/src/features/capture-session/CaptureAssetLifecycleControls.tsx`
- `apps/web/src/features/capture-session/CaptureAssetLifecycleControls.test.tsx`

No new top-level browser route is required. Snippet, Asset, and publication
reference workflows live inside the existing version-scoped Site editor.

### 7.6 Truth, evidence, and plan files

- `CONTEXT.md`
- `README.md`
- `apps/web/README.md`
- `docs/development-setup.md`
- `docs/v1-dogfood-smoke-suite.md`
- `docs/plan/133-documentation-content-snippets-and-asset-workflows.md`
- `docs/plan/master/006-documentation-platform-v1-master-plan.md`
- `docs/ui/133-documentation-content-snippets-and-asset-workflows-browser-evidence.md`

Update current-truth language only after the corresponding behavior passes.

### 7.7 Read-only compatibility surfaces

Inspect, but do not edit unless a scoped regression proves it necessary:

- migrations `001` through `025`;
- ADRs `0027` through `0030`;
- completed child plans `109` through `132`;
- `docs/grill/2026-07-29-documentation-domain-grill.md`;
- `docs/documentation-domain-decisions.md`;
- `apps/extension/**`;
- `apps/docs/**`;
- unrelated Guide, Demo, capture, and publish UI;
- existing Guide/Demo public and embed routes.

Never commit generated `dist`, `.turbo`, coverage, local File storage, browser
profiles, or screenshots outside the named evidence file.

## 8. Migration `026`

Migration `026_documentation_content_snippets_and_asset_workflows.sql` is
additive over `025` and owns a truthful supported down path. Migrations
`001`–`025` remain byte-for-byte unchanged.

### 8.1 Extend Page blocks

Extend `documentation_schema.documentation_page_block` with:

- block kinds `quote`, `table`, `code_example`, `callout`, `tabs`,
  `snippet_reference`, `guide_publication`, and
  `interactive_demo_publication`;
- `callout_tone`, nullable and checked against `info`, `success`, `warning`,
  `danger`;
- `display_title`, nullable and bounded to `200`;
- `quote_attribution`, nullable and bounded to `200`;
- `table_caption`, nullable and bounded to `1,000`;
- `linked_block_id`, nullable and valid only with `linked_page_id`;
- `snippet_id`, nullable;
- `published_artifact_id`, nullable;
- `capture_asset_id`, nullable;

Replace the kind/field check with one exhaustive constraint. Each kind permits
only its fields and required child rows. An image must reference exactly one of
`documentation_asset_id` and `capture_asset_id`. A publication block must carry
exactly one matching `published_artifact_id`. Unknown combinations fail in the
database even if application validation is bypassed.

Existing rows require no destructive conversion. Existing plain text is valid
controlled Markdown with no marks.

Create:

- `documentation_schema.documentation_table_row`
  - stable ID, Page/block/Edition/Project/Organization scope, position,
    positive Row Version;
- `documentation_schema.documentation_table_cell`
  - stable ID, row/block/Page scope, column position, `is_header`, controlled
    Markdown text, positive Row Version;
- `documentation_schema.documentation_tab_item`
  - stable ID, block/Page scope, label, controlled Markdown body, position,
    positive Row Version.

Tables are rectangular. Header cells may occur only in the first row. Tabs have
unique normalized labels within one block.

Add deferred block-shape constraint triggers covering the block row and every
list/table/tab child mutation. At transaction commit they prove:

- only list blocks own list items;
- only table blocks own rows/cells and every table is rectangular and bounded;
- only tabs blocks own tab items and each has `2`–`20` valid items;
- scalar/reference fields match exactly one declared kind;
- image source, Snippet, OpenAPI, and Published Artifact references have the
  required scoped target.

Replacement temporarily deletes/reinserts children, so an immediate trigger is
not a substitute for the final deferred graph check.

### 8.2 Reusable Snippets

Create:

- `documentation_schema.documentation_snippet`
  - stable ID, Organization, Project, Site, Edition, Working Draft, name,
    status, positive aggregate Row Version, creator/updater, timestamps;
  - unique normalized name among active Snippets in one Edition;
  - scoped unique keys for composite foreign keys;
- `documentation_schema.documentation_snippet_block`
  - the same constrained scalar block model as Page content except
    `snippet_reference` is forbidden;
  - stable position, positive Row Version, creator/updater, timestamps;
- `documentation_schema.documentation_snippet_list_item`;
- `documentation_schema.documentation_snippet_table_row`;
- `documentation_schema.documentation_snippet_table_cell`;
- `documentation_schema.documentation_snippet_tab_item`.

Parallel Page/Snippet child tables are deliberate. Do not replace them with a
nullable universal owner or opaque JSON payload.

Page `snippet_reference` uses a composite foreign key to the same Organization,
Project, Site, and Edition. Snippet content cannot reference itself indirectly
because nested Snippet blocks are forbidden.

### 8.3 Documentation Assets

Add to `documentation_schema.documentation_asset`:

- `name VARCHAR(200) NOT NULL`;
- `status VARCHAR(20) NOT NULL DEFAULT 'active'`;
- positive `version`;
- `updated_by_id` and `updated_at`;
- check `status IN ('active','archived')`;
- an active-name uniqueness rule inside the Edition;
- updater composite foreign key and audit coverage.

Backfill existing rows deterministically from their safe original File name
when available, otherwise `Asset <short-id>`. Resolve collisions with a stable
ID suffix. Normalize control characters, separators, bidi controls, leading/
trailing whitespace, and overlong input before using an original File name. Do
not expose storage keys.

New uploads use the same normalized original-name rule and append a stable
short-ID suffix when that active name is already present. Explicit rename and
restore never silently suffix or overwrite; they return the typed name
conflict.

Restoring an archived Asset whose normalized active name has since been claimed
returns `409 documentation_asset_name_conflict`; it does not rename either
Asset implicitly. The authorized actor may rename the archived Asset and retry.

No `is_deleted`, purge-operation, or cascade is added.

### 8.4 Exact artifact Publication references

Every mutable Page/Snippet Publication reference uses a scoped foreign key to
`publish_schema.published_artifact` carrying:

- `published_artifact_id`;
- Organization;
- Project;
- expected artifact type.

If the current published-artifact table lacks a type-scoped composite unique
key required for this FK, add that key without changing existing rows or API
behavior. Add a database check/constraint trigger so a `guide_publication`
cannot reference an Interactive Demo Publication and vice versa.

Published Artifact archive/link state does not invalidate the immutable
Publication identity. The authoring picker may list exact Project publication
history regardless of whether a separate Publish Link currently exposes it.

### 8.5 Capture Asset references and purge protection

Page/Snippet image references to a Capture Asset carry composite
Organization/Project scope. A constraint trigger:

- locks the exact Capture Asset;
- rejects foreign, deleted, purged, pending-purge, failed-purge, or otherwise
  non-resolvable targets;
- rejects an archived target for a newly introduced reference;
- permits retention of an archived target already referenced by that exact
  block during unrelated edits.

Extend the accepted Capture Asset protection/purge database guard to count:

- active Page block references;
- active Snippet block references;
- Site Revision Asset references;
- every frozen Documentation/Capture Asset allowlist row introduced by this
  child.

The protection report uses bounded safe dependency rows. It may disclose the
authorized Documentation Site/Edition/Page/Snippet IDs and Revision number but
not content, File storage keys, private URLs, or actor data.

Reference creation and purge locking follow the existing deterministic lock
order. A race yields a conflict; it never leaves a dangling reference or
purged-but-referenced File.

### 8.6 Immutable snapshot expansion

Create:

- `documentation_schema.site_revision_snippet`;
- `documentation_schema.site_revision_snippet_block`;
- `documentation_schema.site_revision_snippet_list_item`;
- `documentation_schema.site_revision_snippet_table_row`;
- `documentation_schema.site_revision_snippet_table_cell`;
- `documentation_schema.site_revision_snippet_tab_item`;
- Page Revision table-row/cell/tab-item snapshot tables;
- `documentation_schema.site_revision_artifact_reference`;
- an expanded `site_revision_asset_reference` shape that records:
  - source kind;
  - source Asset identity;
  - exact File ID, digest, MIME, size, and dimensions;
  - the block-use alt text and caption in the block snapshot, not as global
    Asset truth.

Extend `site_revision_page_block` with
`linked_source_block_id` for exact internal heading destinations. Add deferred
Revision-graph validation proving that the target source Page and heading block
both exist in that Revision.

The Revision copies:

- all active valid Snippets, including active Snippets not currently used;
- any archived Snippet still used by an included Page;
- every exact Page-to-Snippet use;
- all expanded content children;
- exact artifact Publication IDs plus safe frozen card fields;
- exact Asset/File allowlist entries.

This resolves a wording mismatch in the planning sources by precedence. Master
`006` section 7.4 abbreviates the snapshot as Snippet content “actually
referenced,” while the final grill's accepted Carry-Forward and equality rules
require all active valid Edition-owned Snippets, including unused ones, to be
available from the exact source Revision. The final grill is higher in the
documented decision precedence, so active unused Snippets are frozen; archived
unused Snippets are not.

Snapshot blocks never foreign-key back to mutable Page/Snippet content.
Immutable artifact references may foreign-key to the immutable Published
Artifact identity, but all reader-visible labels are frozen so later artifact
metadata changes cannot alter the Documentation Publication.

`site_revision_asset_reference` uniqueness is
`(site_revision_id, source_kind, source_asset_id)`, not source ID alone. Public
File authorization always compares both the frozen source kind and source ID.

Extend immutable UPDATE, DELETE, and TRUNCATE guards, runtime grants,
controlled-maintenance tests, reset/reseed, and migration down order to every
new snapshot table.

### 8.7 Audit and runtime grants

Add accepted mutation commands/actions:

- `documentation.snippet.create` /
  `documentation.snippet_created`;
- `documentation.snippet.update` /
  `documentation.snippet_updated`;
- `documentation.snippet.content_replace` /
  `documentation.snippet_content_replaced`;
- `documentation.snippet.archive` /
  `documentation.snippet_archived`;
- `documentation.snippet.restore` /
  `documentation.snippet_restored`;
- `documentation.asset.update` /
  `documentation.asset_updated`;
- `documentation.asset.archive` /
  `documentation.asset_archived`;
- `documentation.asset.restore` /
  `documentation.asset_restored`.

The existing Page replacement action covers new Page blocks. Revision creation
evidence includes safe counts by kind, not bodies.

Runtime credentials receive only required SELECT/INSERT/UPDATE and controlled
DELETE privileges for mutable replacement children. They receive no direct
mutation privilege over immutable rows, permanent aliases, Audit/Access
evidence, or Files.

## 9. Content Contracts And Safety

### 9.1 Controlled inline Markdown

Text-bearing prose fields support only:

- plain text;
- emphasis and strong emphasis;
- inline code;
- hard/soft line breaks where the owning block allows them.

They reject:

- headings or block syntax inside inline fields;
- Markdown link/image syntax;
- raw HTML;
- images;
- MDX/JSX;
- imports/exports;
- directives/components;
- autoloaded remote content;
- embedded data, styles, events, or executable URLs.

The shared domain parser validates bounded input and produces an Ossie-owned
safe inline-node representation for rendering/search. The database stores the
controlled Markdown scalar; ProseMirror/Tiptap JSON and rendered HTML are never
stored as authority. Existing plain strings round-trip unchanged.

Links remain the explicit typed `link` block so internal relationships stay
relational and path changes cannot silently break them. Allowed external-link
protocols are `https:`, `http:`, `mailto:`, and `tel:`. Credentials, control
characters, protocol-relative URLs, encoded protocol bypasses, and every other
scheme are rejected. External links use safe opener and referrer behavior.

### 9.2 Block contracts

All block request objects are strict, carry stable ULIDs, deterministic
positions, and `expected_version` for retained children.

- `paragraph`
  - `text`, containing controlled inline Markdown;
- `heading`
  - `level: 2|3|4` and controlled-inline-Markdown `text`;
- `ordered_list` / `unordered_list`
  - ordered stable items with `id`, `position`, `expected_version`, and
    controlled-inline-Markdown `text`;
- `quote`
  - controlled-inline-Markdown `text` and optional `attribution`;
- `table`
  - optional visible `caption`;
  - stable rows with `id`, `position`, and `expected_version`;
  - stable cells with `id`, `column_position`, `expected_version`,
    `is_header`, and controlled-inline-Markdown `text`;
  - rectangular dimensions and first-row header option;
- `code`
  - escaped `code` plus optional normalized `language`;
- `code_example`
  - escaped `code`, optional normalized `language`, optional visible `title`,
    and a fixed Ossie-owned “Copy code” action; never executable;
- `link`
  - retained block-level `label` plus exactly one external `url` or
    same-Edition `page_id`;
  - an internal Page target may additionally carry a stable target heading
    `target_block_id` from that Page; same-Page fragments use the current Page
    ID plus the heading block ID;
  - raw relative paths and fragment strings are not persisted as relationship
    authority;
- `image`
  - `source: { kind: "documentation_asset"|"capture_asset", id }`, required
    non-empty `alt_text`, optional `caption`;
- `divider`
  - no payload;
- `callout`
  - `tone: info|success|warning|danger`, optional `title`, and
    controlled-inline-Markdown `text`;
- `tabs`
  - two to twenty stable items with `id`, `position`, `expected_version`,
    unique `label`, and controlled-inline-Markdown `body`; no arbitrary nested
    blocks in V1;
- `api_reference`
  - existing applied `openapi_source_id` plus optional `operation_key`;
- `snippet_reference`
  - same-Edition `snippet_id` and no copied content;
- `guide_publication`
  - exact same-Project Guide `published_artifact_id`;
- `interactive_demo_publication`
  - exact same-Project Interactive Demo `published_artifact_id`.

For API compatibility, the server accepts child `132` `text` fields for
existing paragraph/heading/list inputs and normalizes them as controlled
Markdown. Responses continue returning those legacy fields for those existing
kinds through child `133`; new rich inline syntax remains a string in the same
field. Do not rename the public V1 property merely to make implementation
internals cleaner.

### 9.3 Hard safety ceilings

Preserve all child `132` ceilings. Add:

- Snippets per Edition: `1,000`;
- blocks per Snippet: `1,000`;
- saved controlled Markdown text per Snippet: `1 MiB`;
- Documentation Assets per Edition: `2,000`;
- total distinct Asset identities in one Revision: `5,000`;
- total stored controlled-Markdown/code text in one Revision, before Snippet
  expansion: `128 MiB`;
- total reader-visible text after expanding every Snippet use in one Revision:
  `128 MiB`;
- total reader block/row/cell/tab nodes after expansion in one Revision:
  `250,000`;
- table rows per block: `200`;
- table columns per block: `20`;
- table cells per block: `4,000`;
- tabs per block: `20`;
- tab label: `100` Unicode code points;
- callout/code-example/quote title or attribution: `200`;
- table caption: `1,000`;
- individual controlled Markdown scalar: `256 KiB`;
- exact artifact Publication references per Page or Snippet remain bounded by
  the owning block count.

Existing raster hard limits remain `10 MiB`, `16,384` pixels per axis, and
`40,000,000` decoded pixels for PNG/JPEG/WebP. Client validation is advisory;
server and database/domain validation is authoritative.

Organization-owned configurable quota defaults/reporting remain child `138`.
Nullable later quota must never bypass these ceilings.

### 9.4 Search extraction

Working Draft and immutable Publication search include safe visible:

- Page title, headings, description, paths/aliases, breadcrumbs, and keywords;
- paragraph/list/quote/table/callout/tab text;
- expanded exact Snippet text at each Page use;
- code and code-example text at lower weight;
- media alternative text and visible caption;
- table captions and quote attributions;
- artifact-reference frozen title and short description only;
- existing safe OpenAPI fields.

Do not create standalone public results for Snippets. Do not copy Guide/Demo
bodies into Documentation search. Exclude archived unused Snippets/Assets,
comments, IDs not already part of an authorized result, File/provider data,
raw editor state, and private artifact metadata.

### 9.5 Capture Media Validation Boundary

The Asset picker is advisory. Introducing a Capture Asset into a Page or
Snippet performs authoritative validation before the database mutation:

1. authorize the same-Project Capture Asset and protected File;
2. require screenshot/raster product meaning and a non-deleted File;
3. stream within the existing `10 MiB` limit;
4. sniff and decode PNG/JPEG/WebP bytes with the child `132`
   `documentation-asset.ts` validator;
5. compute SHA-256 and validate dimensions/pixel count;
6. begin the database transaction, lock Asset/File in section 6.5 order, and
   compare identity, size, MIME, and any stored checksum to the inspected
   result;
7. persist the reference only if the exact File still matches.

A null legacy checksum does not authorize selection by itself; the computed
digest becomes the Revision protection fact without mutating Capture source
metadata. A checksum mismatch, MIME spoof, undecodable image, missing
dimensions, storage read failure, or concurrent purge fails the whole Page/
Snippet command. Temporary inspection buffers are bounded and discarded. The
server never substitutes another Capture Asset or a remote URL.

## 10. Shared Zod Types And Response Models

`packages/constants/src/documentation.ts` owns and tests:

- the complete `DOCUMENTATION_BLOCK_KINDS` tuple;
- `DOCUMENTATION_CALLOUT_TONES`;
- `DOCUMENTATION_SNIPPET_STATUSES`;
- `DOCUMENTATION_ASSET_STATUSES`;
- current `DOCUMENTATION_ASSET_SOURCE_KINDS` (`documentation_asset`,
  `capture_asset`);
- `DOCUMENTATION_CONTROLLED_MARKDOWN_VERSION = 1`;
- every new hard ceiling in section 9.3.

Code-language labels remain presentation hints, not executable configuration.
Normalize them to lowercase where meaningful and restrict them to at most `40`
characters from the safe language-token alphabet. Unknown safe labels render
as escaped plain code without dynamic grammar/package loading.

Update `packages/types/src/documentation.ts` with strict schemas and inferred
types for:

- the expanded `DocumentationBlockSchema`;
- `DocumentationSnippetBlockSchema`, reusing the safe block variants while
  statically excluding `snippet_reference`;
- table rows/cells and tab items;
- `DocumentationSnippetSummarySchema`;
- `DocumentationSnippetDetailSchema`;
- create/update/content-replace/archive/restore Snippet requests;
- `DocumentationAssetSourceSchema`, discriminated as
  `documentation_asset|capture_asset`;
- Asset list item, upload result, update/archive/restore requests;
- exact artifact Publication option and reference projections;
- updated Page, preview, Revision, Publication, public reader, and search
  responses.

Extend `packages/types/src/capture.ts` with explicit Documentation dependency
variants for Page Working Draft, Snippet Working Draft, and Site Revision
protection rows. Update the Capture Asset lifecycle control to label those
authorized dependencies. Do not collapse them into a generic string/metadata
record.

The variants are:

```text
{
  dependency_type: "documentation_page_working_draft",
  documentation_site_id,
  site_edition_id,
  documentation_page_id
}
{
  dependency_type: "documentation_snippet_working_draft",
  documentation_site_id,
  site_edition_id,
  documentation_snippet_id
}
{
  dependency_type: "documentation_site_revision",
  documentation_site_id,
  site_edition_id,
  site_revision_id,
  revision_number
}
```

They remain part of the existing bounded `100`-row dependency preview with an
untruncated `total_dependency_count`.

Required command shapes:

```text
POST /snippets
{
  "name": "Authentication warning"
}

PATCH /snippets/:snippet_id
{
  "expected_version": 3,
  "name": "Authentication safety"
}

PUT /snippets/:snippet_id/content
{
  "expected_snippet_version": 3,
  "blocks": [ strict block commands without snippet_reference ]
}

PATCH /snippets/:snippet_id/lifecycle
{
  "expected_version": 4,
  "transition": "archive" | "restore"
}

PATCH /assets/:asset_id
{
  "expected_version": 1,
  "name": "Installation overview"
}

PATCH /assets/:asset_id/lifecycle
{
  "expected_version": 2,
  "transition": "archive" | "restore"
}
```

Create is idempotent. PATCH/PUT compare Row Versions and are safe to retry only
with the returned current version. Unknown fields and mixed block payloads
fail.

Response models expose safe source labels:

```text
{
  "kind": "capture_asset",
  "id": "<ulid>",
  "status": "active",
  "mime_type": "image/png",
  "width": 1440,
  "height": 900,
  "source_project_version": {
    "id": "<ulid>",
    "name": "2.0",
    "slug": "2-0"
  }
}
```

They never expose File IDs, storage provider/key, capture browser URL,
Capture Event metadata, actor IDs, or raw publication internals.

## 11. Authenticated API Contracts

All routes retain the child `132` prefix:

```text
/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id
```

Nested IDs are resolved through Organization, Project, Project Version, Site,
and Edition scope before content is loaded. Foreign and unauthorized IDs return
the same safe `404`/authorization behavior as child `132`.

### 11.1 Snippets

```text
GET   /snippets?status=active|archived|all
POST  /snippets
GET   /snippets/:snippet_id
PATCH /snippets/:snippet_id
PUT   /snippets/:snippet_id/content
PATCH /snippets/:snippet_id/lifecycle
```

- GET list/detail: Admin, Editor, Viewer.
- POST/PATCH/PUT/lifecycle: Admin and Editor only, writable effective state.
- POST requires `Idempotency-Key`, returns `201` or replay `200`.
- GET list defaults to active, deterministic name/ID order, maximum `100`
  results and opaque cursor pagination.
- Content PUT returns the canonical Snippet with child Row Versions.
- Archive/restore returns the updated Snippet and does not mutate uses.
- There is no DELETE route.

### 11.2 Assets

Retain:

```text
POST /assets
GET  /assets/:asset_id/file
```

Add:

```text
GET   /assets?source=documentation|capture|all&status=active|archived|all&cursor=
PATCH /assets/:asset_id
PATCH /assets/:asset_id/lifecycle
GET   /assets/capture/:capture_asset_id/file
```

- GET list: Admin, Editor, Viewer.
- POST/PATCH/lifecycle: Admin and Editor.
- GET defaults to selectable active Documentation and Capture Assets.
- Capture results include only eligible raster sources, may span the same
  Project's Versions, and always include source-Version context.
- Active source Versions are the default. `include_archived_versions=true`
  explicitly includes eligible active Assets from archived source Versions;
  those results are visibly labelled.
- `include_in_use=true` may return archived IDs already referenced by the
  current Edition; it cannot turn them into selectable new sources.
- Upload preserves child `132` multipart validation and returns the new `name`,
  `status`, and `version`.
- File GET authorizes the specific Edition-owned Documentation Asset.
- The scoped Capture File GET reauthorizes Organization, Project, Site Edition,
  exact Capture Asset, File MIME/dimensions/status, and picker eligibility
  before streaming a preview. An archived Capture Asset is streamable through
  this route only when that Site Edition already has a mutable reference to it;
  archive cannot be used to enumerate unrelated historical media. The Asset
  list never emits a raw storage URL or requires the UI to know a Capture
  Session ID.
- There is no Documentation Asset purge route.

### 11.3 Exact artifact Publication options

```text
GET /artifact-publications?artifact_type=guide|interactive_demo&cursor=
```

Return exact immutable Publications from the same Project with:

- Published Artifact ID;
- type;
- owning stable artifact and Edition IDs as authorized internal identifiers;
- Project Version name/slug;
- publication and revision numbers;
- exact Revision-frozen safe label needed by the picker, never a current
  mutable Edition label;
- published timestamp.

The query is Project-scoped, paginated to `100`, and available to Admin,
Editor, and Viewer. It does not require or reveal a Publish Link. The Page/
Snippet content command reauthorizes the exact ID; picker results are never a
capability token.

### 11.4 Existing Page/content API

Keep:

```text
PUT /pages/:page_id/content
```

Extend its strict block union and conflict response. It remains one atomic Page
aggregate command. It validates all Snippet, Asset, Page, OpenAPI, and artifact
Publication references in the same transaction before replacing any children.

### 11.5 Preview, Revision, Publication, and public routes

Preserve every existing URL shape:

```text
GET  /preview
POST /revisions
GET  /revisions/:revision_number
POST /publications
GET  /api/v1/public/publish-links/:slug/documentation
GET  /api/v1/public/publish-links/:slug/versions/:version_slug/documentation
GET  .../documentation/search
GET  .../documentation/assets/:asset_id/file
```

Extend response unions with the new frozen block shapes. Public Page response
expands Snippet content from Revision rows, never from the Working Draft.
Existing child `132` blocks and public consumers remain parseable.

Add a source-disambiguated public route for Capture-backed Revision media:

```text
GET .../documentation/assets/capture/:capture_asset_id/file
```

The existing `/assets/:asset_id/file` remains the backward-compatible
Documentation Asset route. The new Capture route succeeds only when the
selected exact Site Publication's frozen Asset allowlist contains
`(capture_asset, capture_asset_id)`. It never reads the current Working Draft or
current Capture Asset selection state after authorization. Artifact Publication
cards have no nested File route and do not redirect to `/g`, `/d`, or a guessed
public link.

## 12. Errors And HTTP Semantics

Use existing error envelopes. Add stable codes:

- `documentation_snippet_not_found` → `404`;
- `documentation_snippet_conflict` → `409`;
- `documentation_snippet_name_conflict` → `409`;
- `documentation_snippet_limit_exceeded` → `413`;
- `documentation_snippet_archived` → `409`;
- `documentation_asset_conflict` → `409`;
- `documentation_asset_name_conflict` → `409`;
- `documentation_asset_archived` → `409`;
- `documentation_asset_limit_exceeded` → `413`;
- `documentation_asset_source_unavailable` → `409`;
- `documentation_asset_source_unsupported` → `400`;
- `documentation_artifact_publication_not_found` → safe `404`;
- `documentation_artifact_publication_type_mismatch` → `400`;
- `documentation_table_invalid` → `400`;
- `documentation_tabs_invalid` → `400`;
- `documentation_content_limit_exceeded` → `413`;
- `documentation_reference_protected` → `409`.

Schema errors use existing invalid-request handling. Effective archived state is
read-only. Authentication/authorization behavior remains consistent with
existing Project routes and does not reveal whether a nested foreign ID exists.

## 13. Revision, Publication, And Public Rendering Rules

### 13.1 Checkpoint validation

Before creating/reusing a Revision:

1. lock/validate the exact expected Working Draft version;
2. validate every included Page and every active Snippet;
3. resolve every referenced Snippet inside the same Edition;
4. reject nested/cyclic/foreign/unresolved Snippet uses;
5. resolve every Asset to an exact non-purged File and digest;
6. resolve every exact Published Artifact in the same Project and matching
   type;
7. validate tables, tabs, controlled Markdown, internal links, OpenAPI, and
   existing navigation/routing;
8. compute the complete deterministic digest;
9. copy all snapshot rows in one transaction;
10. create/reuse only a complete Revision.

Known missing File bytes block new checkpoint/publication. A database File row
without readable protected bytes is not publication-ready.

### 13.2 Digest and reuse

The Revision digest includes:

- every included Page and expanded content child;
- active Snippets and referenced archived Snippets;
- exact Page-to-Snippet uses;
- artifact Publication IDs and frozen safe display projection;
- Asset source kinds/IDs, File digest, and media-use fields;
- all existing child `132` Site/navigation/routing/OpenAPI/settings data.

It excludes mutable Row Versions, editor state, cache/search vectors,
timestamps, actor IDs, Audit/Access evidence, and File provider/storage keys.

Unchanged complete content may reuse the latest equivalent Revision. A
publication still follows the existing immutable Site Publication sequence.

### 13.3 Public renderer

- Render controlled Markdown through safe React nodes, never HTML injection.
- Expand a Snippet from the selected Revision only.
- Give each expanded Snippet use deterministic heading/DOM destination
  behavior without duplicating document-level IDs.
- Give Page heading blocks stable DOM IDs derived from their frozen block IDs;
  internal link blocks resolve only those frozen Page/heading identities.
- Render tables with captions/header semantics when supplied.
- Tabs use a keyboard-operable tablist. Every panel remains in the DOM with
  correct `aria-controls`/`aria-labelledby` relationships; inactive panels are
  hidden from interaction without becoming executable content.
- Code copy uses the Clipboard API only after explicit user action and provides
  a live-region result.
- Artifact publication cards identify type, frozen title/description, Project
  Version, Revision Number, and exact Publication Sequence. They contain no
  artifact body, media, playback, iframe, or inferred public link.
- Images use exact-publication protected routes and block layout shift with
  frozen dimensions.
- Unknown/retired block kinds fail closed with a visible unavailable-content
  state and operational evidence; they never disappear silently or execute.

### 13.4 Public authorization and cache identity

Authorize Publish Link status, version entry, visibility/password/session, and
exact Site Publication before loading Page, Snippet, artifact card, search, or
File data. Cache keys include exact Site Publication and resource identity.

Revocation, expiry, password denial, restriction, or removed version entry
denies nested media and artifact-card asset routes exactly as it denies the
Page. A cache populated under one link/policy/version cannot satisfy another.

## 14. Security And Threat Model

| Threat                                                      | Required control and proof                                                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Stored XSS through Markdown or new blocks                   | Strict parser/allowlist, escaped rendering, no raw HTML/MDX/JS/style/SVG/iframe, CSP regression proof.                  |
| Nested Snippet recursion/DoS                                | Snippet references forbidden inside Snippets, bounded expansion, count/text ceilings, DB constraints.                   |
| Cross-tenant/Site Snippet IDOR                              | Composite FKs, scoped lookup before load, same safe missing response.                                                   |
| Mutable or guessed artifact embed                           | Exact `published_artifact_id`, type/project constraints, no title/slug/latest lookup.                                   |
| Documentation link grants unrelated artifact access         | Frozen metadata-only card; no artifact body, media, inferred URL, or separate-link authority.                           |
| Cross-Project Asset/File injection                          | Product Asset identity, composite scope, no raw File ID input, transactional reauthorization.                           |
| Archived/purged Asset race                                  | Deterministic locks, active-on-introduction check, purge protection trigger/report, atomic conflict.                    |
| Immutable output changes after Snippet/Asset/artifact edits | Revision-owned copies and exact immutable identities; public loaders never join mutable draft rows.                     |
| Search leaks private/foreign content                        | Separate draft/public documents, authorization before query, exact Publication key, safe field extraction.              |
| Audit/log leaks content                                     | Typed IDs/counts/status only; no bodies, Markdown, captions, File data, URLs with credentials, or raw query.            |
| Resource exhaustion                                         | Server/DB ceilings for Snippets, blocks, tables, tabs, assets, text, expansion, query pagination, publication duration. |
| Remote tracking/content substitution                        | No remote media, server fetch, iframe, guessed public URL, or latest derivative.                                        |
| Unsafe browser copy/action                                  | Escaped text only, explicit user action, no execution, accessible result.                                               |
| Migration weakens old content                               | Additive conversion, old row round-trip, upgrade/down-up tests, existing public P1 fixture.                             |

Security headers are defense in depth, not permission to weaken content
validation.

## 15. Permissions, Audit, And Access Evidence

### 15.1 Capability matrix

| Operation                                         | Admin          | Editor         | Viewer         | Public         |
| ------------------------------------------------- | -------------- | -------------- | -------------- | -------------- |
| List/read Snippets and Asset options              | yes            | yes            | yes            | no             |
| Create/edit/archive/restore Snippet               | yes            | yes            | no             | no             |
| Upload/rename/archive/restore Documentation Asset | yes            | yes            | no             | no             |
| Select Capture Asset                              | yes            | yes            | no             | no             |
| List exact artifact Publications for authoring    | yes            | yes            | yes            | no             |
| Save Page/new block references                    | yes            | yes            | no             | no             |
| Preview/Revision history                          | yes            | yes            | yes            | no             |
| Checkpoint/publish                                | yes            | yes            | no             | no             |
| Capture Asset protection/purge                    | yes            | no             | no             | no             |
| Read selected public Publication                  | by link policy | by link policy | by link policy | by link policy |

Organization Owners retain implicit Project Admin behavior. Archived Project,
Project Version, Site, or Edition is effectively read-only.

### 15.2 Audit

Exactly one logical Audit Event and explicit typed change items commit with each
successful mutation. Snippet content replacement records Snippet/block kinds,
counts, and versions, never body content. Asset events record safe identity,
status, dimensions, MIME, digest classification, and versions; never File
provider/key or bytes.

Failed/denied attempts do not create mutation Audit Events. They may create
Access Evidence or bounded operational logs.

### 15.3 Access

Extend the registry for:

- Snippet list/detail;
- Asset library and protected File reads;
- exact artifact Publication picker;
- public Capture-backed Revision media.

Avoid one Access Event per decorative subrequest when an existing logical Page
view already owns the evidence, but direct protected File access remains
covered according to current policy. Evidence contains route/resource/outcome
and authorized scope, not bodies, captions, raw search, credentials, or storage
facts.

## 16. Authoring UI Behavior

### 16.1 Existing editor integration

Keep the existing version-scoped Site editor route. Add three clearly labelled
workbench surfaces:

- **Content**: the expanded block editor;
- **Snippets**: list/create/edit/archive/restore;
- **Assets**: upload, current-Edition library, same-Project Capture selection;
- Publication reference selection may be a modal/drawer opened from the block
  editor.

Use existing UI primitives and visual language. Do not introduce a parallel
application shell.

### 16.2 Block editor

- The add-block menu groups Writing, Structure, Media, Reuse, and API.
- Raw IDs are never the normal authoring input.
- Internal Page, Snippet, Asset, OpenAPI operation, and artifact Publication
  fields use authorized labelled pickers.
- Unsupported/archived existing references display a stable warning and remain
  removable.
- Reordering retains stable child IDs and Row Versions.
- Table editing has labelled row/column controls, header state, and clear
  structural limits.
- Tabs have keyboard-reorder controls and unique-label validation.
- Alternative text is required before image insertion; caption is optional.
- Validation is inline and summarized at save without clearing local input.
- Save conflict preserves the complete local Page or Snippet draft and offers
  reload/reapply guidance.

### 16.3 Snippet panel

Required states:

- loading;
- empty with create action for writers;
- active list;
- archived filter;
- selected detail;
- creating;
- saving;
- saved;
- stale conflict with local work retained;
- limit reached;
- permission denied/read-only;
- effective archived parent;
- general failure and retry.

When a Snippet is edited, the UI announces that all saved-draft uses in this
Edition will update. It does not imply existing Publications will change.
Archive confirmation states the existing-use behavior.

### 16.4 Asset library

Required states:

- current-Edition uploads;
- same-Project Capture Assets grouped/labeled by source Project Version;
- active/default filter;
- archived already-in-use;
- uploading/validation/progress;
- upload error and cleanup truth;
- archive/restore confirmation;
- empty/no-result;
- Viewer read-only;
- source unavailable/missing safe state.

The picker never offers “newest derivative,” raw File ID, foreign Project
assets, pending/failed/completed purge, or deleted assets.

### 16.5 Publication reference picker

- Separate Guide and Interactive Demo filters.
- Show stable title, Project Version, revision number, publication sequence,
  and published time.
- Store the exact Published Artifact ID.
- Explain that later artifact publications do not update this block.
- Do not require or select a separate Publish Link.
- Empty, loading, pagination, read-only, unavailable, type mismatch, and stale
  selection states are explicit.

### 16.6 Preview and reader accessibility

- semantic headings and landmarks;
- table caption/header associations;
- tablist/tab/tabpanel keyboard behavior;
- visible focus and opener restoration;
- copy-code status announcement;
- image alt/caption;
- no meaning conveyed by callout color alone;
- artifact type named in text;
- 320 CSS-pixel reflow and 200% zoom;
- reduced-motion compliance;
- bounded code/table overflow only;
- no forced focus churn during autosave.

## 17. Migration And Backwards Compatibility

- Clean install applies `001` through `026`.
- Upgrade applies `026` over representative child `132` content, Revision,
  Publication, public link, Asset, Guide/Demo Publication, and Capture Asset
  rows.
- Existing block IDs, positions, Page versions, aliases, paths, Revision
  numbers, Publication sequences, link entries, and public URLs do not change.
- Existing child `132` text is valid controlled Markdown and round-trips
  exactly.
- Existing Documentation Assets backfill active status/version/name without
  changing File identity or digest.
- Existing `P1` remains readable and byte/semantic-equivalent after migration.
- New snapshot tables are empty for old Revisions; loaders retain the child
  `132` path for old block kinds and treat absent child `133` rows as empty.
- Guide/Demo APIs, Publications, Publish Links, `/g`, `/d`, embeds, and asset
  routes remain unchanged.
- Capture Asset purge behavior changes only by adding truthful Documentation
  dependencies.
- Down migration is supported only after child `133` mutable and immutable test
  rows are removed through the controlled disposable test path. It restores
  `025` constraints and old Asset shape; it must refuse lossy downgrade when
  new block/Snippet/reference state exists.
- Runtime grants, immutable triggers, maintenance functions, fixture reset, and
  migration verification are updated.
- No Node engine or dependency pin change is expected. If implementation finds
  a new parser dependency necessary, stop, perform the same license/engine/
  bundle/supply-chain proof as child `132`, update this plan, and commit the
  decision before adding it.

## 18. TDD And Logical Implementation Order

### Stage 0: Reconcile and checkpoint

1. record clean/dirty worktree and baseline;
2. reread authoritative plans/ADRs/current code;
3. reconcile any intervening changes;
4. recheck and commit this plan only.

Suggested commit:

- `docs(documentation): prepare child 133 implementation plan`

### Stage 1: Domain and shared contracts

1. write failing controlled-Markdown and expanded block-policy tests;
2. write failing Snippet, Asset-source, and artifact-reference policy tests;
3. write failing constants/Zod tests for all unions and ceilings;
4. implement shared policies/contracts;
5. prove legacy child `132` shapes still parse and normalize.

Suggested commit:

- `feat(documentation): define content and snippet contracts`

### Stage 2: Relational schema and server

1. write migration and DB constraint tests first;
2. add migration `026`;
3. write repository/service/route tests for Snippets, Asset library, Capture
   selection, publication options, Row Versions, audit/access, and failures;
4. implement authorized commands and queries;
5. extend Capture Asset protection and race tests;
6. run clean/upgrade/down-up and runtime-role immutability tests.

Suggested commits:

- `feat(documentation): add relational snippet and content storage`
- `feat(documentation): add protected asset and publication references`

### Stage 3: Snapshot, search, and public rendering

1. write failing digest/snapshot/reuse/immutability tests;
2. write exact public/search/file authorization tests;
3. implement complete Revision copying and Publication projection;
4. add the shared safe block renderer;
5. prove old Publication compatibility and P1/P2/rollback exactness.

Suggested commit:

- `feat(documentation): publish expanded immutable content`

### Stage 4: Authoring workflows

1. write API client/component tests;
2. add Snippet, Asset, and artifact Publication picker workflows;
3. replace raw-ID entry for accepted relationships;
4. add accessible states, conflicts, archive/restore, and warnings;
5. integrate draft preview and public reader with the shared renderer.

Suggested commit:

- `feat(web): add documentation content and asset workflows`

### Stage 5: Fixture, browser, closeout

1. extend the existing deterministic fixture and V1 smoke;
2. run focused and broad verification;
3. run agent-browser matrix and record evidence;
4. fix scoped findings and repeat until clean;
5. update current-truth docs, this plan, and Master `006`;
6. audit staged files and commit only scoped evidence/docs.

Suggested commits:

- `test(documentation): cover content and asset workflows`
- `docs(documentation): close child 133`

Commit grouping follows cohesion. Do not manufacture empty commits or mix
unrelated formatting/refactors.

## 19. Test And Verification Plan

### 19.1 Domain and shared contracts

- every block accepts its exact fields and rejects mixed/unknown fields;
- controlled Markdown accepts the fixed inline subset and rejects
  HTML/MDX/JS/unsafe URLs/pathological nesting;
- legacy plain strings normalize unchanged;
- tables are rectangular, bounded, ordered, and versioned;
- tabs enforce count/label/order bounds;
- code/code example render escaped and never execute;
- Snippet blocks reject `snippet_reference`;
- media source union accepts only implemented kinds and rejects
  `derived_asset` as unavailable;
- artifact type must match exact Publication;
- all text/count/asset limits fail at boundary + 1;
- response schemas contain no File/provider/private publication fields.

### 19.2 Server unit and route tests

- all routes, status codes, idempotent replay, and error mapping;
- Admin/Editor/Viewer matrix and effective archived state;
- Organization/Project/version/Site/Edition/nested-ID swaps;
- Snippet create/update/content/archive/restore and no delete;
- independent Page and Snippet conflicts preserve latest-safe aggregates;
- Snippet edit updates draft expansion without Page version mutation;
- archived existing reference retained, new archived reference rejected;
- Documentation Asset list/upload/rename/archive/restore;
- same-Project cross-Version Capture selection with labels;
- foreign/deleted/purge-state Capture selection rejection;
- exact Guide/Demo Publication options and type mismatch;
- Page replacement is atomic when any reference fails;
- Audit/Access coverage and sensitive-field redaction;
- public route/cache/link-policy isolation.

### 19.3 Database integration

- clean `001`–`026` and upgrade from `025`;
- down/up refusal and controlled successful rehearsal;
- old child `132` Page/Asset/Revision/Publication remains exact;
- every composite FK rejects cross-scope references;
- all block-kind field checks;
- Snippet name/state/ownership and Page-use constraints;
- Page/Snippet child Row Version conflicts;
- table/tab positions and ownership;
- exact Published Artifact type/project constraints;
- Capture Asset active-on-introduction and archive-retention behavior;
- Capture purge dependency report and guard for Page, Snippet, Revision;
- purge/reference concurrency cannot dangle;
- Revision copies the complete graph and excludes comments;
- immutable new rows reject UPDATE/DELETE/TRUNCATE under runtime role;
- maintenance bypass only through accepted disposable path;
- digest reuse and change sensitivity;
- failed checkpoint/publication leaves live entry unchanged;
- P1 immutable after draft mutation/P2; rollback only repoints;
- search expansion and exclusion rules;
- runtime grants and audit atomicity.

### 19.4 Web component tests

- block menu and every editor form;
- no raw-ID normal path for Pages/Snippets/Assets/Publications;
- table/tab keyboard controls and limits;
- code copy accessible status;
- required alt text and caption;
- Snippet loading/empty/create/save/conflict/archive/restore/read-only states;
- Asset upload/list/filter/source-Version/archive/restore/unavailable states;
- exact artifact Publication picker and stale selection;
- local work survives request failure/conflict;
- Viewer controls absent and direct mutation failure handled;
- shared draft/public renderer parity;
- exact Snippet expansion and archived-use warning;
- semantic table/tabs/callout/media/artifact card;
- narrow/reflow/reduced-motion/focus/live-region behavior.

### 19.5 Focused commands

Use actual package scripts and record exact results:

```bash
pnpm --filter @repo/documentation-domain test
pnpm --filter @repo/documentation-domain check-types
pnpm --filter @repo/types test -- documentation
pnpm --filter server test -- documentation
pnpm --filter server test -- capture-asset
pnpm --filter web test -- documentation
pnpm --filter server test:db
pnpm --filter server test:smoke
pnpm lint
pnpm check-types
pnpm build
git diff --check
git status --short
```

Retain existing setup/auth/Project/version/Capture/Guide/Demo/carry-forward/
publication/password/public/embed/audit/access/protected-File smoke coverage.

## 20. Agent-Browser Validation

Use the installed `agent-browser` skill against running database, server, and
web processes with the extended deterministic fixture. Do not create another
harness.

Use isolated named sessions for Admin, Editor, Viewer, conflict peer, public,
and restricted public contexts. After each navigation or mutation:

- wait on semantic UI state or the required response;
- take a fresh accessibility snapshot;
- re-resolve element references;
- inspect console errors, page errors, failed required requests, and relevant
  network responses;
- close all sessions at the end.

Required passes:

1. Admin completes the full section 3 journey.
2. Editor proves authoring/publishing but cannot purge Capture Assets.
3. Viewer can inspect draft/Snippets/Assets/history but cannot mutate.
4. Two contexts create Page and Snippet Row Version conflicts; local work
   survives and recovery is understandable.
5. Public P1 renders every block, expanded Snippet, exact media, artifact cards,
   navigation, operation destinations, and search.
6. Draft changes/P2 do not alter P1; rollback restores exact P1.
7. Public, password, restricted, expired, revoked, removed-version, missing,
   direct nested media, and cross-link/cross-version attempts obey one policy.
8. Archive/restore preserves in-use draft/public media and blocks new archived
   selection.
9. Capture protection report/purge conflict is visible and safe.
10. Missing protected bytes and unknown/retired content kinds fail safely
    without substitution.

Run the critical authoring and reader journey:

- desktop viewport;
- 320 CSS-pixel reflow;
- 200% zoom;
- keyboard only;
- reduced-motion emulation.

Verify:

- skip link, headings, landmarks, labels, tab/table semantics;
- visible focus, dialog/drawer containment, Escape, and opener restoration;
- live save/copy/error announcements;
- no serious axe issue;
- no unexpected horizontal overflow except bounded code/table scrollers;
- no uncaught console error, unhandled rejection, required-request failure,
  mixed content, CSP violation, or secret/private content in URL/storage/logs.

Store transient screenshots/traces under `/tmp`, not the repository. Record
environment, commit, fixture IDs, browser executable/version, commands,
viewport, results, evidence locations, console/network findings, and honest
browser limitations in
`docs/ui/133-documentation-content-snippets-and-asset-workflows-browser-evidence.md`.
Firefox/WebKit remain capability-dependent child `138` evidence; do not claim
them if unavailable.

## 21. Exit Gate

Child `133` closes only when:

- all accepted V1 block kinds round-trip through command, database, preview,
  Revision, Publication, public reader, and search;
- Snippets are Edition-owned, independently versioned, non-nestable, and exact
  in immutable output;
- exact Guide/Demo Publication references never resolve mutable/latest/guessed
  state;
- Documentation Asset library/archive/restore and same-Project Capture
  selection pass;
- existing references survive archive and all protected purge guards pass;
- P1 remains exact after draft/P2 changes and rollback;
- old child `132` content/Publications and existing Guide/Demo behavior remain
  compatible;
- tenant/role/audit/access/security/immutability/migration tests pass;
- browser/accessibility evidence is complete;
- plan/master/current-truth docs reflect only passed behavior;
- child `134` receives stable packageable content contracts;
- commits contain only scoped work.

## 22. Completion Checklist

### Planning

- [x] Completed child `132` result and leftovers inspected.
- [x] Master `006`, grill decisions, decision consolidation, Context, and ADR
      boundaries reconciled.
- [x] Current schema/contracts/routes/server/UI/fixture/protection model mapped.
- [x] Exact affected/read-only files recorded.
- [x] Schemas, contracts, routes, behavior, security, migration,
      compatibility, verification, browser, non-scope, and handoff specified.
- [x] Missing Derived Asset runtime handled without inventing a shadow domain.
- [x] Independent plan recheck against current code and Master `006` complete.
- [x] Planning checkpoint committed.

### Runtime

- [x] Domain policies and shared contracts pass.
- [x] Migration `026` clean/upgrade/down-up/runtime-role tests pass.
- [x] Expanded Page and Snippet content APIs pass.
- [x] Asset library/Capture reuse/protection APIs pass.
- [x] Exact artifact Publication reference APIs pass.
- [x] Complete Revision/Publication/public/search graph passes.
- [x] Portal authoring and reader component tests pass.
- [x] Fixture, DB smoke, broad regression, and build pass.
- [x] Agent-browser and accessibility matrix passes.
- [x] Current-truth docs, evidence, plan, and Master are current.
- [x] Scoped logical commits complete.

## 23. Planning And Implementation Log

- 2026-07-30: Reserved from accepted Master Plan `006`.
- 2026-07-30: Expanded against completed child `132` at baseline `d1c4210`,
  Master `006`, the final grill ledger, decision consolidation, Context, ADRs
  `0027`–`0030`, migration `025`, actual consolidated server routes/repository,
  shared contracts/domain policies, portal/reader, deterministic fixture,
  Capture Asset purge protection, and child `132` evidence.
- 2026-07-30: Fixed the reservation's stale assumption that a Derived Asset
  domain already exists. The plan implements current Capture Asset reuse and
  preserves the accepted conditional future boundary.
- 2026-07-30: Chose parallel relational Page/Snippet child tables, controlled
  inline Markdown scalars, exact Published Artifact identities, immutable
  Revision-owned expansion, and no new Documentation Asset purge route.
- 2026-07-30: Independently rechecked the expansion against all Master `006`
  contracts, completed child `132` and its actual consolidated runtime,
  Context, ADRs `0027`–`0030`, the final grill ledger, child `134` reservation,
  current Capture Asset protection/types/UI, and current Guide/Demo Revision/
  Published Artifact schema. Closed unsafe ambiguity around non-raster Capture
  Assets, File-byte validation, capture-backed authenticated/public routes,
  artifact-reference access, internal heading links, table/quote fields,
  deferred child-graph constraints, aggregate Revision limits, lock order,
  archive-name conflicts, dependency response variants, and child `135`
  lifecycle ownership.
- 2026-07-30: Added strict shared block/Snippet/Asset contracts and policies,
  including safe scalar normalization, non-nesting, source discriminants,
  aggregate ceilings, and artifact-reference projections (`7fc8989`).
- 2026-07-30: Added migration `026` and the authorized relational repository,
  routes, complete immutable snapshot graph, public loaders, lifecycle
  commands, and database coverage (`dbed973`).
- 2026-07-30: Added the shared safe renderer, Snippet workbench, Asset library,
  publication selectors, expanded Page editor, draft/public rendering, and
  search integration (`eed0b41`).
- 2026-07-30: Extended Capture Asset protection reporting and purge refusal to
  mutable Documentation Page/Snippet uses and immutable Site Revision
  references, including portal dependency copy (`c3ee1b6`).
- 2026-07-30: Expanded the deterministic fixture and V1 smoke journey across
  Snippets, both image sources, exact immutable references, P1/P2, rollback,
  search, access, and response consistency (`11b8e32`).
- 2026-07-30: Closed audit/access registry coverage and expanded safe
  draft/public search extraction (`b461245`).
- 2026-07-30: Headless-browser QA found and fixed Snippet-only public search
  indexing and duplicate authenticated `main` landmarks; the repeated search,
  smoke, type, component, role, and axe checks passed (`aac2fd6`).
- 2026-07-30: Updated current-truth docs, browser evidence, this child, and
  Master `006` only for behavior actually verified by child `133`.

## 24. Verification Record

Implementation verification completed:

- repository baseline/worktree inspected;
- child `132` completion, verification, and handoff inspected;
- Master `006` child `133`, content, asset, security, retention, and sequencing
  sections inspected;
- final grill content/Snippet/asset/publication/search decisions inspected;
- actual migration `025`, constants, Zod unions, domain policies, server
  routes/repository, portal editor/reader, fixture, and Capture Asset
  protection paths mapped;
- actual migration `023`/`024` Capture Asset purge, Guide/Demo Revision, and
  Published Artifact contracts rechecked for exact child `133` integration;
- current first-slice limits, Page replacement semantics, Edition
  path-namespace serialization, immutable snapshot model, public URL model,
  and Ossie-native adapter fallback preserved;
- Documentation domain: 11 files / 21 tests passed;
- shared contract packages: 18 files / 78 tests passed;
- server unit: 105 files / 443 tests passed;
- web unit: 68 files / 385 tests passed;
- server DB: 22 files / 72 tests passed;
- V1 smoke: 1 file / 2 tests passed, including Snippet-only public search;
- migration: clean `001` through `026` and guarded `026` down/up passed;
- repository lint, type check, and production build passed; the build retains
  only the existing web chunk-size warning;
- focused post-browser verification: web Documentation 15 files / 33 tests,
  web type check, and smoke 1 file / 2 tests passed;
- `git diff --check` and scoped worktree review passed;
- headless Chrome `151.0.0.0` through `agent-browser 0.33.1` passed the public
  expanded reader/search/media, 320 CSS-pixel reflow at 200% zoom,
  reduced-motion, keyboard skip-link, Admin Snippet lifecycle, Viewer
  read-only, console/error, and axe checks;
- axe reported zero violations for public, Admin, and Viewer surfaces. The
  Admin run retained one non-violation `incomplete` contrast sample caused by
  textarea overlap during automated sampling;
- browser environment, results, transient evidence paths, and honest
  capability boundaries are recorded in
  `docs/ui/133-documentation-content-snippets-and-asset-workflows-browser-evidence.md`.

## 25. Leftovers And Handoff To Child 134

Child `134` must receive:

- the exact expanded block discriminants and field schemas;
- controlled Markdown grammar/version and safe plain-text extraction;
- Page/Snippet relational ownership and deterministic ordering;
- Snippet copy requirements and ID remapping rules;
- Documentation/Capture Asset source discriminants and exact File manifest
  fields;
- the unsupported-until-implemented `derived_asset` boundary;
- exact Guide/Demo Published Artifact reference semantics;
- complete Revision snapshot/digest rules;
- hard counts/sizes and archive behavior;
- public safe projections and fields that must never export;
- migration `026` compatibility results.

The handoff baseline is the completed child `133` relational runtime. Package
import/export must call the same validators and authorized selectors, preserve
ordered child rows and controlled Markdown scalars, remap package-local
Snippet/Asset identities transactionally, and never treat the serialized
package as a second source of truth.

Child `134` may serialize these authoritative contracts into a versioned safe
package. It must not reinterpret them as filesystem/Markdown/ZIP authority,
live-link Snippets across Editions, export private File paths, or import guessed
artifact/Asset identities.

Non-blocking future work remains with its owning children:

- child `135`: Carry-Forward copy/remap and broader lifecycle;
- child `136`: review/approval;
- child `137`: browser-direct API Try It;
- child `138`: configurable quota/reporting, loader profiling/splitting,
  production observability/p75, and capability-dependent browsers;
- child `139`: final V1 closure;
- a later separately accepted Asset child: real Derived/Redacted Asset domain.

The Snippet and Documentation Asset archive/restore commands in this child are
the narrow lifecycle required to make their new authoring workflows safe.
Child `135` must consume those commands while adding Site/Edition/Page/OpenAPI,
multi-Site, and cross-Project-Version lifecycle behavior; it must not create a
second Snippet/Asset lifecycle model.
