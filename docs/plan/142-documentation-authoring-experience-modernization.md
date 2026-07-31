# Child Plan 142: Documentation Authoring Experience Modernization

Date reserved: 2026-07-31

Status: Reserved. Not implementation-ready and not authorized for execution.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/141-documentation-editor-reader-adapter-proof-and-adoption-gate.md`

## Objective

Implement the child-`141` selected authoring route: bounded Tiptap adoption,
partial component adoption, or native-editor modernization.

## Required expansion scope

- exact affected authoring files and dependency result from child `141`;
- exact child-`141` selected adapter surface: prose-field-only, named partial
  primitives, whole-graph adapter, or native; untouched block kinds remain
  native and must not be coerced into generic rich text;
- complete selected block/mark/identity conversion and round-trip contract for
  both `DocumentationPageEditor.tsx` and `DocumentationSnippetPanel.tsx`;
- toolbar, insertion, selection, reorder, paste/drop, keyboard, focus, save,
  autosave, error, conflict, local recovery, comment-anchor, and preview rules;
- server authorization and Row-Version behavior unchanged;
- import/export, checkpoint, review, Publication, search, and Carry-Forward
  compatibility;
- schema/migration proof, expected to require no authoritative data migration;
- focused unit/integration/browser/accessibility/performance verification;
- rollout flag/fallback and dependency/license/security checks.

## Hard boundaries

- Existing shared block schemas and relational persistence remain authority.
- Existing stable block/list/table/tab identities remain comment, concurrency,
  import/export, checkpoint, Revision, Publication, and search anchors.
- Unknown/executable nodes fail closed.
- Tiptap collaboration/cloud, AI, offline mutation, and simultaneous editing
  remain out of scope.
- No unrelated portal redesign.
- Use agent-browser on the existing fixture.

## Exit gate

Authoring is measurably improved, every existing in-scope content/workflow path
remains compatible, fallback is proven, documentation is current, and the child
is independently close-rechecked before child `143` begins.
