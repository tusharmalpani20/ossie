# Child Plan 141: Documentation Editor/Reader Adapter Proof And Adoption Gate

Date reserved: 2026-07-31

Status: Reserved. Not implementation-ready and not authorized for execution.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/140-post-v1-documentation-decision-gate.md`

## Objective

Build isolated, non-production proofs that compare Tiptap authoring and
Fumadocs reading with the shipped Ossie-native experience, then record one
adopt/partial-adopt/reject result for each tool.

## Required expansion scope

- current official package/version/license/advisory and compatibility research;
- exact proof-only dependency and file ownership;
- representative current block, comment-anchor, OpenAPI, asset, navigation,
  search, URL, access, and Publication fixtures;
- compare prose-field-only and whole-graph Tiptap adapter shapes; enumerate the
  exact selected blocks/marks and prove lossless identities, conversion, and
  unsupported-node/paste/drop behavior for Pages and snippets;
- exact authorized Fumadocs reader input and public/private exclusion proof;
- prove the selected Fumadocs core/UI subset works with the current React 19,
  Vite, Tailwind, and custom `App.tsx` router without introducing React Router,
  Next.js, customer MDX, or a second server/browser content source;
- test public exact-Publication, authenticated draft, and exact-Revision inputs
  independently, including crawler HTML and bootstrap serialization;
- usability, accessibility, browser, bundle, performance, security, and
  maintainability comparison against the native baseline;
- disposable test/development-only adapter seam on the existing Documentation
  fixture, excluded from production routing, with no schema migration,
  authoritative write, or parallel product/browser harness;
- explicit gate scorecard and native fallback.

Likely inspected/affected files include `DocumentationBlockEditor.tsx`,
`DocumentationPageEditor.tsx`, `DocumentationSnippetPanel.tsx`, block renderer,
public reader, preview pages, `documentationInitialDocument.ts`, `App.tsx`,
server initial-HTML routes, API-operation experience, their tests/styles, and
package manifests/lockfile only if the independently rechecked plan authorizes
isolated proof dependencies. Store a dated sanitized evidence record under
`docs/ui/`.

## Hard boundaries

- PostgreSQL, shared contracts, permissions, routes, and exact Publications
  remain authoritative.
- No customer MDX/HTML/JavaScript/React/iframe authority.
- No Tiptap/Fumadocs production route or persisted framework document.
- Product Documentation stays in `apps/web`; do not migrate it to `apps/docs`
  or add React Router/Next.js solely for Fumadocs.
- No data migration.
- No automatic adoption based only on appearance or feature count.
- Use agent-browser and the existing Documentation fixture; create no custom
  browser harness.

## Exit gate

The child closes with independent adopt/partial-adopt/reject results,
reproducible evidence, exact tool/package disposition, accepted limitations,
dependency cleanup or justified pins, and complete plan records. Rejected
dependencies and disposable proof UI are removed; selected seams are named for
children `142` and `143`. Expand and recheck this reservation before doing any
work.
