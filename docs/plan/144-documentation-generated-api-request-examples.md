# Child Plan 144: Documentation Generated API Request Examples

Date reserved: 2026-07-31

Status: Reserved. Not implementation-ready and not authorized for execution.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/143-documentation-reader-experience-modernization.md`

Accepted decision:

- `docs/adr/0034-generated-documentation-request-examples-are-inert-projections.md`

## Objective

Add deterministic copyable request examples for curl, browser Fetch, Node.js,
Python, and Go through an extensible versioned language registry.

## Required expansion scope

- exact accepted OpenAPI descriptor input and unsupported-feature behavior;
- language ID/display/syntax/version contracts;
- exact runtime/library contract per language (including distinct browser Fetch
  and Node.js output) with no generated dependency-install promise;
- deterministic escaping, path/query/header/body/auth placeholder generation;
- documented OpenAPI example/default selection and placeholder policy;
- zero credential/Try-It-memory/form-value/private-origin/operator-config/
  request/response flow into examples, proven by tests that mutate each source
  without changing generated output;
- draft, Revision, Publication, search, export, and historical compatibility;
- an explicit immutable generator selection contract: either descriptor versions
  permanently route to their original generators or the smallest additive
  Revision/Publication metadata pins the generator; legacy Publications never
  inherit a latest-registry default;
- UI selection/copy/download, failure, unsupported, keyboard, focus, narrow
  viewport, and screen-reader behavior;
- output/count/time bounds and malicious-input fixtures;
- exact files, types, API decision, migration decision, dependency review, and
  agent-browser verification.

## Hard boundaries

- Generated code is inert and never executed.
- No server-side target request, proxy, remote reference fetch, package install,
  generated archive, registry publication, or SDK support promise.
- Placeholders only; no entered credentials or private configuration.
- Existing Try-It authority remains separate under ADR `0033`.
- Default to a client/shared pure generator over the accepted returned
  descriptor. A new endpoint requires separate explicit acceptance and cannot
  perform target transport.

## Exit gate

All five initial language contracts and unsupported cases are deterministic and
verified, the registry extension path is bounded, existing API-reference/Try-It
behavior remains compatible, and the child is independently close-rechecked.
