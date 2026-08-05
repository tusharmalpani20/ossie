# Child Plan 144: Documentation Generated API Request Examples

Date reserved: 2026-07-31

Last implementation-readiness audit: 2026-08-05

Status: Conditionally implementation-ready. Execute only after Child `143`
is complete and independently close-rechecked.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/143-documentation-reader-experience-modernization.md`

Accepted decision:

- `docs/adr/0034-generated-documentation-request-examples-are-inert-projections.md`

Related authority:

- ADR `0028`: constrained database-authoritative content
- ADR `0029`: authorized reader adapter
- ADR `0033`: separate browser-direct Try-It boundary

## 1. Objective

Add deterministic, inert, copyable/downloadable request examples for:

- curl;
- browser Fetch;
- Node.js using native Fetch;
- Python using the standard library;
- Go using the standard library.

Implement them through a pure, extensible, versioned language registry over the
exact accepted `DocumentationTryItRequestDescriptor`. Examples never execute,
never load Try-It configuration, and never contain mutable form values,
credentials, private approved origins, cookies, responses, or operator state.

## 2. Fixed Decisions — No Goal-Time User Input

The following implementation choices are accepted by this plan:

1. `descriptor_version: 1` permanently selects example contract
   `documentation-request-example-v1`.
2. `descriptor_version: 0` returns a typed unsupported result.
3. Contract V1 permanently contains exactly the initial five language IDs:
   `curl`, `browser_fetch`, `node_fetch`, `python_urllib`, and
   `go_net_http`.
4. The neutral public placeholder origin is
   `https://api.example.com`; approved/private Try-It origin and base path are
   never inputs.
5. Future semantic output changes, language-set changes for historical
   Publications, or descriptor capabilities require a new accepted descriptor/
   example contract version and tests. Code must never route an old descriptor
   to “latest”.
6. Generation is a browser-safe pure policy in
   `@repo/documentation-domain`; no endpoint, database column, migration, or
   stored rendered code is added.
7. One downloaded snippet file is allowed. Archives, dependency manifests,
   package publishing, generated clients, and an SDK support promise remain
   prohibited.
8. Existing mutable Try-It request previews remain a separately labeled live
   builder feature. They cannot be reused or presented as ADR `0034`
   generated examples.

These choices implement ADR `0034` using its permitted permanent descriptor-
version routing option and eliminate the historical-reproducibility blocker.

## 3. Required Preflight And Handoff Intake

Before code changes:

1. read Child `143` status, reader component seam, lazy-loading result,
   limitations, leftovers, browser evidence, and commits;
2. inspect the current descriptor schema/policy, public/draft/Revision response
   shapes, both existing mutable Try-It example helpers, API operation
   component, reader/preview/OpenAPI panel callers, and fixture descriptors;
   record that current derivation preserves direct parameter examples but does
   not yet preserve schema example/default or request-body example/schema;
3. confirm descriptor V1 fields and current migrations still match this plan;
4. inspect current worktree and preserve unrelated changes;
5. add exact execution-date file/caller changes to this plan if needed;
6. independently recheck this plan against ADRs `0028`, `0029`, `0033`,
   and `0034`.

A missing required input returns unsupported; do not ask the user to invent a
fallback example.

## 4. Source Input Contract

The only generator input is:

- one exact `DocumentationTryItRequestDescriptor`;
- one language ID.

Allowed descriptor fields:

- `descriptor_version`;
- `method`;
- `path`;
- parameter name/location/required/type/array/explode/sensitive/example;
- request-body required/media type/schema/example;
- security bearer/API-key-header names;
- `unsupported_reasons`.

The UI may pass display context such as operation summary separately, but it
cannot affect generated text.

Explicitly forbidden generator inputs:

- Try-It `approved_origin`, `base_path`, policy identity, allowances,
  configuration/attempt token, timeout/response limits;
- form values, selected credentials, request body textarea, built request,
  actual request/response, cookies, local/session storage;
- server environment variables or Organization/Project secrets;
- raw OpenAPI or remote references;
- current time, locale-dependent formatting, random values, network, DOM, or
  filesystem.

## 4.1 Descriptor Admission Refinement

ADR `0034` permits documented examples/defaults, but generation must still use
only the accepted descriptor returned by Ossie. Extend the existing descriptor
derivation policy without adding a wire field:

- parameter value precedence is explicit OpenAPI parameter `example`, then
  primitive schema `example`, then primitive schema `default`;
- sensitive parameters never retain a real example/default;
- request-body value precedence is media entry `example`, then bounded schema
  `example`, then bounded schema `default`;
- derive the already-accepted bounded `DocumentationTryItJsonSchema` subset for
  inline JSON schemas only; remote/local `$ref`, composition, unsupported types,
  or structures outside existing ceilings produce an unsupported reason;
- mark a field sensitive from password format, write-only, or accepted sensitive
  names and replace its documented example/default with
  `<SENSITIVE_VALUE>` before the descriptor can be stored, frozen, or returned;
- validate depth/node/byte/finite-number constraints before admission;
- descriptor digests/source versions change naturally only when a source is
  explicitly re-inspected; existing draft rows, Revisions, and Publications are
  not backfilled or mutated.

The optional `example` and `schema` fields already exist in the accepted
request descriptor, so this is a compatible admission refinement with no schema
or migration. Tests must cover new inspected sources and unchanged historical
descriptors.

## 5. Shared Types And Registry

Create in
`packages/documentation-domain/src/policies/documentation-request-example-policy.ts`:

- `DOCUMENTATION_REQUEST_EXAMPLE_CONTRACT_VERSION =
"documentation-request-example-v1"`;
- `DocumentationRequestExampleLanguageId`;
- an ordered frozen registry entry with:
  - stable ID;
  - display name;
  - runtime label;
  - syntax/highlight name;
  - safe file extension;
  - generator function;
- a discriminated result:
  - `{ status: "generated", contract_version, descriptor_version,
language_id, display_name, runtime, syntax, file_extension, code }`;
  - `{ status: "unsupported", contract_version, descriptor_version,
language_id, reasons[] }`.

Export through `packages/documentation-domain/src/index.ts`.

Do not add a wire schema unless an API starts transporting this result; this
child explicitly does not add such an API. Keep constants/types local to the
domain module unless an existing package rule requires a separate constants
export.

Registry order is stable: curl, Browser Fetch, Node.js, Python, Go. The default
UI selection is curl. Unknown IDs fail closed and do not fall back to curl.

## 6. Deterministic Value Policy

### 6.1 Operation URL

Build from literal `https://api.example.com` plus the descriptor path.

- path parameter with documented non-sensitive example: use that example with
  language-appropriate URL encoding;
- required path parameter without example, or any sensitive path parameter:
  use visible `<PATH_NAME>` placeholder;
- malformed/unmatched path template: unsupported;
- no OpenAPI server, Try-It origin, deployment hostname, or private base path is
  inferred.

### 6.2 Query parameters

- documented non-sensitive example: include it;
- required missing/sensitive value: visible `<QUERY_NAME>` placeholder;
- optional without example: omit;
- preserve descriptor array/explode behavior;
- stable descriptor order; no locale sorting;
- encode values consistently while keeping placeholder meaning visible in code.

### 6.3 Headers and credentials

- documented non-sensitive required/optional example: include it;
- required/sensitive header: `<HEADER_NAME>`;
- bearer security: `Authorization: Bearer <BEARER_TOKEN>`;
- API-key header: `<API_KEY>`;
- never emit an actual credential;
- reject invalid/control-character header names/values;
- add `Content-Type` only when a body is emitted.

### 6.4 Request body

- use only the accepted descriptor's documented `request_body.example`;
- recursively replace schema-marked sensitive scalar/branch values with
  `<SENSITIVE_VALUE>`;
- stable JSON serialization with deterministic property traversal;
- required body without documented example: unsupported, because inventing a
  payload violates ADR `0034`;
- optional body without example: omit;
- unsupported schema/body/media behavior: unsupported;
- apply existing descriptor size/depth/node ceilings and an explicit output
  byte ceiling.

### 6.5 Unsupported reasons

If the descriptor already contains `unsupported_reasons`, return one
deduplicated, bounded, user-readable unsupported result for every language.
Do not generate a “best effort” request that appears runnable.

Reasons are safe fixed/category text; do not echo raw hostile OpenAPI fragments.

## 7. Language Contracts

### 7.1 curl

- POSIX-compatible command text;
- `--fail-with-body`, explicit method, quoted URL/headers/body;
- shell escaping for single quotes and control characters;
- no `--location-trusted`; redirects must not forward credentials;
- no environment lookup or command substitution.

### 7.2 Browser Fetch

- browser standard `fetch`;
- `credentials: "omit"`, `redirect: "error"`,
  `referrerPolicy: "no-referrer"`, and `cache: "no-store"`;
- no Node imports or process environment;
- illustrative only; the UI explains that browser CORS/security still applies.

### 7.3 Node.js Fetch

- native `fetch` contract for Node.js 18+; no npm dependency;
- no `process.env` secret placeholder because it implies environment
  integration; visible literal placeholders remain;
- explicit method/headers/body;
- use `AbortSignal.timeout` only if the frozen V1 contract and current engine
  floor support it; otherwise omit timeout rather than adding a package.

### 7.4 Python

- standard-library `urllib.request`;
- explicit UTF-8 body encoding, method, headers;
- safe Python string escaping;
- no `requests`/pip dependency claim.

### 7.5 Go

- standard-library `net/http`, `bytes`, `fmt`, and `io` only as needed;
- complete small `package main` example;
- explicit request construction, headers, client call, body close/read, and
  error handling;
- no generated module, dependency, or client package.

Every emitted file must be syntactically parseable by an appropriate local
parser/compiler when available. “Copy” does not mean Ossie runs the target
request.

## 8. Historical Reproducibility

Implement an exhaustive mapping:

- descriptor `0` → unsupported legacy result;
- descriptor `1` → `documentation-request-example-v1`.

Tests must assert:

- a frozen descriptor V1 fixture produces exact normalized output for all five
  languages;
- output is identical across repeated calls, time zones/locales, draft,
  Revision, and Publication surfaces given the same descriptor;
- mutating registry implementation for a hypothetical V2 cannot affect V1;
- an unknown future descriptor version fails closed at runtime/type boundary;
- no code path says “latest generator”.

Because existing Revision/Publication operation snapshots already freeze
`descriptor_version` and `request_descriptor`, no migration or new
Publication metadata is needed. This mapping is part of the durable
compatibility contract and must be called out in current-truth documentation.

## 9. UI Contract

Create:

- `DocumentationRequestExamples.tsx`;
- optional `LazyDocumentationRequestExamples.tsx`;
- focused CSS module or extension of
  `documentation-api-operation.css`.

Behavior:

- render independently of Try-It policy/configuration;
- show only for descriptor V1 operations the viewer is already authorized to
  read;
- tab/listbox pattern uses native buttons/tabs with correct roles, arrow-key
  behavior when tabs are used, visible focus, and selected state;
- default curl; preserve user selection only in component memory;
- code is text in `<pre><code>`, never `innerHTML`;
- Copy writes exact displayed code and announces success/failure;
- Download creates one client-side Blob with safe operation/language filename,
  triggers no server call, and revokes the object URL;
- unsupported state names the bounded reason and offers no copy/download;
- loading is used only for a lazy UI chunk, not generator/network work;
- narrow layout scrolls the code region locally, not the whole Page.

Surfaces:

- public exact-Publication operation in
  `PublicDocumentationReaderPage.tsx`;
- exact Revision operation in
  `DocumentationRevisionPreviewPage.tsx`;
- draft/current OpenAPI operation in
  `DocumentationOpenApiPanel.tsx` or the exact current authoring surface
  confirmed during preflight.

Do not require Try-It to be enabled. Place generated examples outside the live
Try-It form so mutable values cannot visually or programmatically alter them.

## 10. Existing Mutable Try-It Preview

Both
`packages/documentation-domain/src/policies/documentation-try-it-policy.ts`
and `apps/web/src/lib/documentationTryItExamples.ts` currently expose curl,
JavaScript, and Python text from a live built request. It may remain only as a
clearly named “current Try-It request preview” inside the explicit builder.

Required changes/tests:

- consolidate or clearly rename these helpers as
  `generateDocumentationTryItRequestPreviews` (following repository naming
  conventions) so only one tested live-preview implementation remains;
- update imports/tests and label the UI “Current Try-It request preview”;
- never import the live helper into `DocumentationRequestExamples`;
- mutating live fields, credentials, approved origin, base path, policy, and
  response must change only the live preview, never ADR `0034` examples;
- generated example component must not receive the Try-It configuration object;
- no entered secret may appear in either output; existing live preview
  redaction tests remain.

## 11. Exact File Plan

### 11.1 Shared domain

- new request-example policy and test under
  `packages/documentation-domain/src/policies/`;
- existing `documentation-try-it-policy.ts` and test for bounded descriptor
  example/default/schema admission and live-preview rename/consolidation;
- `packages/documentation-domain/src/index.ts`;
- `packages/types/src/documentation.ts` and tests only if type inference/docs
  need clarification around already-existing optional example/schema fields; no
  new wire field is planned;
- package config only if a browser-safe build issue is proven.

### 11.2 Web

- new request-example component/test and optional lazy boundary;
- `DocumentationApiOperationExperience.tsx` and existing Try-It helper/tests
  only for separation/labeling;
- `PublicDocumentationReaderPage.tsx` and test;
- `DocumentationRevisionPreviewPage.tsx` and test;
- `DocumentationOpenApiPanel.tsx` and test;
- focused CSS;
- `apps/web/src/lib/documentationApi.ts` only for existing descriptor type
  reuse, with no wire change.

### 11.3 Fixture/docs

- Documentation browser fixture/tests only if it lacks one supported and one
  unsupported V1 descriptor;
- ADR/current-truth/plan evidence only where actual behavior must be documented;
- Master `007`.

### 11.4 No expected writes

- server routes/services/repositories, except focused regression tests proving
  refined descriptors flow through existing responses;
- new `packages/types` wire fields;
- migrations;
- public route parser;
- package dependencies/lockfile (standard-language generation requires none).

A discovered need for a new endpoint or stored rendered output is a critical
plan change, not routine scope.

## 12. Security And Abuse Controls

- pure function: no eval, Function, subprocess, Web Worker execution, network,
  dynamic import from input, template hooks, or package install;
- fixed registry only; no user-supplied generator/plugin;
- escape every language context separately;
- output and reason counts/bytes bounded;
- descriptor already bounded; revalidate supported version/result at policy
  boundary;
- no secrets/private origins/configuration as inputs;
- Clipboard/Blob only after explicit user action;
- safe filename allowlist and immediate object URL revocation;
- CSP unchanged;
- no analytics/telemetry containing code/descriptor.

Malicious fixtures include quotes, backticks, dollar/command syntax, CR/LF/NUL,
Unicode, braces, path/query/header injection, deep/large JSON, sensitive nested
body fields, duplicate parameters, invalid template, and unsupported reasons.

## 13. Tests

Test first at four levels:

### 13.1 Pure policy

- registry order/metadata/unknown ID;
- exact five-language golden semantic assertions;
- descriptor admission precedence/sensitivity/bounds;
- parameter/body/security placeholder rules;
- language-specific escaping;
- supported/unsupported results;
- deterministic repeated output;
- V1 permanent mapping and legacy/unknown versions;
- byte/depth/count ceilings;
- forbidden-value corpus absent from every result.

Avoid brittle whole-file snapshots as sole proof; assert important tokens,
parseability, and exact normalized fixtures.

### 13.2 Separation

Construct a descriptor once, then mutate:

- Try-It approved origin/base path;
- form parameters/body;
- bearer/API key;
- attempt/configuration tokens and policy;
- request/response and timeout;
- browser storage/cookie mock.

Generated output must remain byte-identical.

### 13.3 UI

- language keyboard selection;
- copy success/failure;
- one-file download metadata/content and URL revocation;
- unsupported/no-descriptor;
- lazy load failure;
- independent rendering when Try-It disabled;
- no unsafe HTML;
- draft/Revision/Publication same descriptor output.

### 13.4 Regression

Run existing Try-It, OpenAPI, public reader, Revision preview, initial document,
domain/types, server route, import/export/checkpoint/publication tests
proportionate to touched files.

## 14. Verification Commands

Use current workspace commands, at minimum:

- focused `@repo/documentation-domain` policy tests;
- focused web component/Try-It/reader/preview/OpenAPI tests;
- domain package type-check/lint/build;
- web test/type-check/lint/build;
- server route tests proving descriptor/public response compatibility;
- workspace build or affected package build graph;
- production manifest/chunk comparison;
- `git diff --check` and prohibited-string/import scans.

Compile/parse generated snippets locally without sending them:

- shell syntax parse when available;
- Node syntax check;
- Python compile-to-bytecode directed to temporary storage;
- `gofmt`/compile in a temporary module only if Go is installed.

Absence of an optional language tool is recorded; pure generator tests remain
mandatory.

## 15. Agent-Browser Requirements

Using the existing fixture and real authorized routes, cover:

- public supported and unsupported operation;
- Revision preview operation;
- draft/current OpenAPI operation;
- Try-It enabled and disabled;
- all five selections;
- keyboard selection, Copy success/failure, Download;
- desktop, 320px, 200% zoom, reduced motion;
- local code overflow/no page overflow;
- screen-reader names/selected state/live copy status;
- lazy chunk loading/failure;
- axe A/AA, accessibility tree, console, failed requests;
- verify no request to the placeholder/target origin occurs.

Chromium is required. Evidence must not include actual credentials or private
URLs.

## 16. Migration, Compatibility, And Rollback

- Migration: none.
- API: none.
- Existing descriptor V1: gains deterministic derived display only.
- Legacy descriptor V0: safe unsupported UI.
- Publications: no rewrite; frozen descriptor selects frozen contract.
- Try-It: unchanged authority and transport.
- Rollback: remove UI and pure policy; no persisted state to reverse.
- Future language/semantic change: new accepted contract/version, never edit V1
  meaning silently.

## 17. Acceptance Criteria

- all five language contracts implemented;
- pure registry and V1 historical mapping are explicit;
- examples use only exact descriptor/documented examples/placeholders;
- required missing/unsupported input fails visibly;
- mutable Try-It/private values cannot influence output;
- output never executes or triggers network;
- copy/download accessible and bounded;
- documented examples/defaults are admitted safely into existing optional
  descriptor fields for newly inspected sources;
- no new endpoint/wire field/migration/dependency;
- draft/Revision/Publication authorization remains existing;
- focused, build, browser, security, and compatibility evidence passes;
- independent close-recheck finds no S1/S2.

## 18. Explicit Non-Scope

- full SDK/client libraries, archives, package manifests/publication;
- server proxy/target execution;
- dependency installation instructions beyond truthful runtime labels;
- OpenAPI remote reference fetch or broader descriptor support;
- Try-It authority/UI redesign;
- new language beyond initial five;
- static export, AI, custom components, accepted-later work.

## 19. Commit Strategy

Suggested commits:

- `test(documentation): define request example contracts`
- `feat(documentation): add versioned request example registry`
- `feat(documentation): present copyable api request examples`
- `docs(documentation): close generated request examples`

These are upper-bound groupings. Commit each small, single-purpose,
independently reviewable, focused-test-green slice as soon as it is coherent.
Split shared contracts, individual generator groups, descriptor/example
admission, UI presentation, and browser fixes further when their diffs are broad
or independently revertible. Never accumulate the whole child into one
end-of-child commit. Stage exact paths and preserve unrelated work.

## 20. Checklist

### Intake and plan

- [ ] Child `143` complete/close-rechecked and handoff read.
- [ ] Descriptor/callers/current Try-It helper inspected.
- [ ] V1 mapping and zero-migration decision revalidated.
- [ ] Worktree/code drift recorded.
- [ ] Plan refreshed and independently rechecked.

### Domain implementation

- [ ] Failing descriptor admission/sensitivity tests first.
- [ ] Bounded documented example/default/schema admission implemented.
- [ ] Failing registry/mapping/determinism tests first.
- [ ] Pure policy and five contracts implemented.
- [ ] Placeholder/example/body/unsupported rules complete.
- [ ] Language escaping and output ceilings complete.
- [ ] Try-It/private-value isolation proven.
- [ ] Historical V1 behavior frozen.

### UI implementation

- [ ] Component/lazy boundary implemented.
- [ ] Public/Revision/draft surfaces wired.
- [ ] Live Try-It preview clearly separated.
- [ ] Keyboard/copy/download/unsupported/failure states complete.
- [ ] No network/execution behavior proven.

### Verification and closure

- [ ] Focused/domain/web/server regressions pass.
- [ ] Type/lint/build/chunk checks pass.
- [ ] Optional syntax-tool results recorded.
- [ ] Agent-browser matrix passes.
- [ ] Independent close-recheck clean.
- [ ] Status/log/evidence/limitations/leftovers/handoff/commits updated.
- [ ] Commits are small, single-purpose, focused-test green, and independently
      reviewable; no large end-of-child commit was used.
- [ ] Master Child `144` lifecycle updated.

## 21. Implementation Log

Not started. Append dated facts.

## 22. Verification Record

Not started. Record exact commands, test counts, generated contract hash/fixture
identity if used, browser routes, and results.

## 23. Leftovers And Handoff

No planning-time user blocker remains. Child `145` receives:

- exact retained dependencies/chunk boundaries from children `141`–`143`;
- all five example UI routes/states;
- frozen V1 generator fixtures;
- optional language parser/tool limitations;
- any non-S1/S2 accessibility/browser/performance issue explicitly deferred to
  integrated hardening.

Security, determinism, credential isolation, or historical reproduction defects
must close here and may not be deferred.
