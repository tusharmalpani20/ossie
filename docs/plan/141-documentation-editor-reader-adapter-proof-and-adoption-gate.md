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
- lossless Tiptap conversion and unsupported-node/paste/drop behavior;
- exact authorized Fumadocs reader input and public/private exclusion proof;
- usability, accessibility, browser, bundle, performance, security, and
  maintainability comparison against the native baseline;
- disposable proof mechanism with no production route, schema migration,
  authoritative write, or parallel harness;
- explicit gate scorecard and native fallback.

Likely inspected/affected files include the Documentation editor, Page editor,
block renderer, public reader, preview pages, API-operation experience, their
tests/styles, package manifests/lockfile only if the independently rechecked
plan authorizes isolated proof dependencies, and a dated sanitized evidence
record under `docs/ui/`.

## Hard boundaries

- PostgreSQL, shared contracts, permissions, routes, and exact Publications
  remain authoritative.
- No customer MDX/HTML/JavaScript/React/iframe authority.
- No Tiptap/Fumadocs production route or persisted framework document.
- No data migration.
- No automatic adoption based only on appearance or feature count.
- Use agent-browser and the existing Documentation fixture; create no custom
  browser harness.

## Exit gate

The child closes with reproducible evidence, exact tool/package disposition,
accepted limitations, dependency cleanup or pins, complete plan records, and a
clear handoff to child `142`. Expand and recheck this reservation before doing
any work.
