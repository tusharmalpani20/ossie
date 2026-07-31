# Child Plan 137: Documentation API Try-It And Example Experience

Date reserved: 2026-07-30

Date expanded: 2026-07-31

Status: Implementation-ready and independently rechecked on 2026-07-31.
Runtime implementation has not started.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/136-documentation-review-and-approval-workflow.md`

Next child:

- `docs/plan/138-documentation-v1-operational-hardening.md`

## 1. Sequence Gate

Child `136` is independently closed and supplies:

- stable exact Site Revision and Site Publication identity;
- optional-by-default Edition review policy and current-policy Publication
  gate;
- atomic Admin override evidence;
- private review state which never enters public projections;
- unchanged self-contained OpenAPI Source and exact public operation routes.

Plan `137` must preserve those contracts. Review approval proves only that an
exact Revision passed the Publication workflow. It never authorizes a browser
to call a target API.

The current read-only OpenAPI reference must remain fully usable when:

- no Try-It policy exists;
- a policy is disabled, stale, or operator-disallowed;
- a Publish Link has not opted in;
- an operation has no supported request projection;
- CORS or CSP prevents execution;
- the target request fails.

No Documentation runtime code is authorized by this planning pass.

## 2. Baseline From The Implemented Code

### 2.1 Current authority and storage

- PostgreSQL remains the authority for Documentation state.
- One Site Edition currently owns at most one active OpenAPI Source.
- The uploaded JSON/YAML File is immutable, protected, bounded, and
  self-contained.
- `openapi_inspection.parsed_document` is temporary inspection state.
- `openapi_source` stores source identity, digest, version, title, and File.
- `openapi_operation` stores only method, path, operation ID, destination key,
  summary, and Row Version.
- Site Revision tables freeze the OpenAPI Source/File and operation identity.
- Site Publication resolves one exact immutable Site Revision.
- Public operation destinations are derived under the owning Publish Link and
  exact version entry.
- The current public Site helper spreads the loaded Revision snapshot and
  removes only search documents. Before adding richer OpenAPI fields, this must
  be replaced by a strict public projection so source File/digest/server-policy
  fields cannot flow through incidentally.

### 2.2 Current routes that remain compatible

Authenticated:

```text
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/inspections
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/sources
GET  /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source
PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source/lifecycle
GET  /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source/export
```

Public:

```text
GET /api/v1/public/publish-links/:slug/documentation/operations/:operation_key
GET /api/v1/public/publish-links/:slug/versions/:version_slug/documentation/operations/:operation_key
```

Existing route response fields remain valid. Additive fields must be parsed by
strict shared schemas before the portal uses them.

### 2.3 Current portal behavior

- `DocumentationOpenApiPanel` uploads, inspects, applies, archives, restores,
  exports, and lists operation identities.
- Draft Preview renders API Reference blocks as controlled read-only content.
- Public operation URLs synthesize a minimal operation Page containing
  `METHOD path`.
- `PublicDocumentationReaderPage` authorizes the exact Publish Link before
  displaying the immutable operation.
- No current page sends a request to a customer API.
- No Fumadocs or Scalar customer-documentation runtime is installed.
- The current Ossie-native renderer remains the replaceable adapter selected
  by child `132`.

### 2.4 Current security and deployment facts

- The portal is a Vite SPA and the API is Fastify.
- The repository does not currently emit a customer-reader CSP with dynamic
  per-Site `connect-src`.
- Vite development proxies `/api` to the Ossie API.
- Target-API calls therefore require an explicit CSP/operator ceiling rather
  than assuming that a database setting can change an already-served document
  header.
- Migration head is `029`; this child owns additive migration `030`.

## 3. Goal

Add a safe, accessible browser-direct API request and example experience for
an exact OpenAPI operation without turning Ossie into:

- a server-side request proxy;
- a credential store;
- an OAuth broker;
- a mock server;
- an SDK generator;
- an authority for the target API.

The complete flow is:

1. an Admin configures an exact operator-allowed HTTPS origin and safe request
   policy for one Site Edition;
2. an Editor re-inspects/applies the OpenAPI Source so supported request
   descriptors are derived under bounded policy;
3. a Site Revision freezes that source, request descriptors, and Site policy;
4. a Publication continues to freeze that Revision;
5. an Admin separately enables Try It for a Publish Link;
6. an authorized internal reader or authorized public-link reader opens one
   exact operation;
7. the browser builds and confirms a request;
8. the browser sends directly to the approved target origin with
   `credentials: "omit"`;
9. the response is bounded and rendered only as escaped text or parsed JSON;
10. Ossie records at most a content-free attempt outcome.

## 4. Accepted V1 Decisions

### 4.1 Disabled by default

- Missing Site policy means read-only.
- A new Site receives no enabled Try-It policy.
- Existing Sites and Publications remain read-only.
- Site enablement does not enable any Publish Link.
- Every Publish Link requires a separate Admin opt-in.
- Restricted/password links must first pass their existing link authorization.
- Revoked, expired, missing, removed-version, and password-denied links expose
  neither configuration nor an execution surface.

### 4.2 Exact-origin and operator ceiling

An approved target consists of:

- one exact `https://host[:port]` origin;
- one optional normalized absolute base path;
- no username, password, query, fragment, wildcard, template, or trailing
  slash ambiguity.

Canonicalization lowercases and ASCII-normalizes the host, removes the default
`:443` port, preserves an explicitly operator-approved non-default port, and
stores no trailing slash on the origin. Base paths start with one `/`, contain
no query/fragment/backslash/control character, and reject literal or encoded
dot segments and encoded path separators.

An imported OpenAPI `servers` value is display-only guidance. It is never
approval.

Two approvals are required:

1. the deployment operator lists the exact origin in
   `OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS`;
2. a Project Admin or implicit Organization Owner configures that same exact
   origin on the Site Edition.

The production web build receives the matching exact-origin ceiling through
`VITE_OSSIE_DOCUMENTATION_TRY_IT_CONNECT_ORIGINS`. Build validation must reject
invalid values and construct the portal CSP from this set plus the Ossie API
origin. A server-approved origin missing from the web CSP fails closed with
actionable setup guidance.

An empty server/web ceiling is valid and disables all Try-It configuration.
Production startup/build fails on any malformed ceiling entry rather than
dropping it silently. Development remains disabled unless the fixture or
operator explicitly supplies a validated test ceiling.

The two-variable deployment contract is an operational necessity of the
current static Vite SPA. It is not a second product-level source of truth:
PostgreSQL owns Site/Link choices, while deployment configuration is only a
non-bypassable ceiling.

CSP and its origin list are browser-visible. Operators must therefore treat
every value in the deployment ceiling as a non-secret public API origin. A
private customer hostname must not be placed there merely to make an internal
Site work.

Public V1 rejects:

- `http`;
- localhost and single-label hosts;
- loopback, unspecified, link-local, private, carrier-grade NAT,
  documentation, benchmark, multicast, and reserved IP ranges;
- credential-bearing or wildcard hosts;
- protocol-relative and relative origins;
- IDNs that do not round-trip through normalized ASCII host handling;
- origins not in the operator ceiling.

The server resolves all returned A/AAAA addresses when a policy is saved and
again when an execution configuration is issued. Every resolved address must
be public. DNS failure, mixed public/private answers, or changed unsafe answers
fail closed. This is validation only; the Ossie server never contacts the
target API.

Self-hosted HTTP/private-network exceptions are not introduced by this child.

### 4.3 Supported requests

V1 supports only operations from the exact current/frozen source with methods:

```text
GET POST PUT PATCH DELETE
```

`HEAD`, `OPTIONS`, `TRACE`, `CONNECT`, and unknown methods remain read-only.
GET never accepts a request body. Other allowed methods accept a body only when
the exact derived descriptor declares one of the supported JSON media types.

Supported input:

- required path parameters with primitive values only;
- query parameters using OpenAPI `form` serialization for primitive values and
  arrays of primitive values;
- header parameters using `simple` serialization for primitive values;
- optional JSON body for `application/json` or a structured `+json` media type;
- strings, booleans, finite numbers/integers, enums, nullable values, flat or
  bounded nested JSON objects/arrays;
- local component `$ref` values already accepted by the self-contained parser.

Query `form` arrays use repeated keys when `explode: true` and comma-separated
encoded items when `explode: false`. Header `simple` arrays use comma-separated
items. Path arrays/objects, query/header objects, and optional path parameters
are unsupported.

An executable OpenAPI path must:

- start with exactly one `/`;
- contain no scheme, authority, query, fragment, backslash, control character,
  literal/encoded dot segment, or encoded separator;
- have each `{template}` name declared exactly once as an `in: path`, required
  parameter after path-item/operation override resolution;
- have no undeclared, duplicate, or missing path template parameter.

Unsupported styles, deepObject, matrix, label, cookie parameters, multipart,
form-urlencoded, binary/file, streaming, XML, arbitrary media types, recursive
schemas beyond the limit, `allowReserved: true`, ambiguous duplicate
parameters, callbacks, webhooks, and links remain visible as an explicit
limitation and disable sending for that operation/input. Header names/values
containing control characters or CR/LF always fail.

Request limits:

- URL: `8 KiB`;
- path/query fields: `100`;
- one field value: `8 KiB`;
- non-credential headers: `50`;
- total request header names/values: `32 KiB`;
- JSON body: `256 KiB` UTF-8;
- JSON/schema depth: `32`;
- JSON nodes: `10,000`;
- one in-flight request per operation panel;
- minimum `1,000 ms` between sends;
- maximum `10` sends per tab per exact origin in a rolling minute;
- timeout: default `15 s`, hard maximum `30 s`.

These are product hard ceilings, not Organization-configurable quotas. Child
`138` receives measurement and configurable operational-limit follow-up.
The tab-local send ceiling is UX abuse resistance, not a target-API security or
rate-limit guarantee; reloads and other clients can bypass it, so UI/docs must
not claim otherwise.

### 4.4 Credentials

V1 supports:

- optional bearer text sent as `Authorization: Bearer …`;
- optional API-key text sent in one Admin-approved custom header.

The custom header must correspond to a self-contained OpenAPI
`securitySchemes` entry with `type: apiKey` and `in: header`. Its normalized
name must not be a forbidden browser or hop-by-hop header.

Bearer input is available only when the exact operation's effective OpenAPI
security requirement references a `type: http`, `scheme: bearer` definition.
API-key input is available only when that operation references the configured
header scheme. A Site policy may narrow these derived modes but cannot add a
mode absent from the exact operation. Empty/optional OpenAPI security
requirements do not cause credentials to be sent automatically.

V1 does not support:

- cookie credentials;
- `credentials: "include"` or `"same-origin"`;
- query API keys;
- Basic auth;
- OAuth/OpenID redirects or tokens;
- client secrets, mutual TLS, browser certificates;
- automatic values from the OpenAPI file;
- values from Ossie cookies, sessions, environment variables, or server state.

`Authorization` is forbidden as an ordinary OpenAPI header parameter and is
constructed only by the supported bearer control. The configured API-key
header is likewise owned only by its credential control; a colliding ordinary
header parameter makes the operation unsupported rather than producing two
values.

Request fields marked `format: password`, `writeOnly: true`, or matching the
accepted credential/secret-name classifier are sensitive inputs. Sensitive
query/path parameters are unsupported because they would enter a URL.
Sensitive JSON-body values may be sent, but use password controls and follow
the same redaction, example-placeholder, teardown, logging, evidence,
screenshot, and storage rules as bearer/API-key values.

Credential and sensitive-body values exist only in React state owned by the
current operation panel. They are:

- password inputs with an explicit reveal control;
- redacted in confirmation and all errors;
- replaced with placeholders in copied examples;
- excluded from props passed to unrelated reader components;
- cleared on reload, unmount, route/Site/Link/version/operation change,
  logout/auth loss, policy identity change, explicit clear, and successful
  public viewer-session replacement;
- never written to local/session storage, IndexedDB, Cache API, URL, history,
  service worker, clipboard, console, analytics, error reporting, server API,
  Audit, Access Evidence, fixture evidence, or screenshot.

`credentials: "omit"` must also prevent ambient target cookies from being sent
and prevent target `Set-Cookie` responses from becoming playground state.
Browser tests cover both directions.

### 4.5 Redirects and browser fetch

The request uses:

```text
credentials: "omit"
redirect: "error"
referrerPolicy: "no-referrer"
cache: "no-store"
```

All redirects are rejected in V1. This is stricter and more testable than
attempting to inspect a cross-origin opaque redirect, and therefore satisfies
the accepted rule that redirects cannot escape the approved origin.

No request runs on render, focus, selection, example generation, or
confirmation opening.
The client never automatically retries a target request, including after a
network error, timeout, report failure, auth refresh, or React remount. A retry
requires a fresh user confirmation and counts as a new local send.

The builder starts with no user/request values. OpenAPI defaults and examples
are displayed as inert suggestions and are never silently inserted or sent.
Required values must be entered explicitly; optional parameters are omitted
until the user enables and supplies them.

The confirmation explains that the browser sends its own `Origin` header and
may issue an automatic CORS preflight before the target request, especially for
Authorization, API-key, mutation, or JSON requests. Ossie neither controls nor
records that preflight and never retries through a proxy.

### 4.6 Response handling

Response limits:

- reject a declared `Content-Length` above `1 MiB`;
- stream-read at most `1 MiB`, then abort;
- apply the stream ceiling to bytes delivered after browser content decoding,
  so compressed responses cannot bypass it;
- if a potentially non-empty response has no readable stream, block its body
  instead of falling back to an unbounded `arrayBuffer`, `blob`, `text`, or
  `json` read;
- collect at most `100` response headers and `32 KiB` of safe header text;
- finish or time out within the request timeout;
- never invoke browser download behavior.

Rendering:

- `application/json` and structured `+json`: bounded parse, pretty-print as
  escaped text;
- `text/*`: decode bounded UTF-8 and render as text;
- empty body: show status and safe headers;
- display the numeric target status and escaped status text as browser-local
  response metadata, but never send either to Ossie;
- HTML, SVG, XML, images, audio, video, archives, executables, unknown/binary,
  malformed encodings, or oversized output: show metadata and a safe
  unsupported/blocked message, never inline content;
- never use `innerHTML`, an iframe, object/embed, blob navigation, data URL, or
  active syntax execution;
- before rendering or copying accepted text/JSON, replace every exact current
  bearer/API-key/sensitive-body value with a fixed redaction marker in both
  response headers and body; perform this replacement before the value reaches
  render state;
- if any sent sensitive value is too short for reliable textual replacement
  (fewer than four Unicode scalar values), block response header/body display
  entirely rather than risk reflection;
- expose only a manual “Copy response text” action for already accepted
  text/JSON, with a warning that target data may be sensitive.

Only browser-visible CORS-safelisted or explicitly exposed response headers can
be shown. The UI must not imply that hidden target headers were absent.

Response body and headers are browser-memory-only and clear on the same
boundaries as credentials.

### 4.7 Examples

Generate tested copyable examples for:

- cURL;
- JavaScript `fetch`;
- Python `urllib.request`.

Examples:

- derive from the exact request descriptor and current in-memory non-secret
  values;
- use placeholders for bearer/API-key and sensitive-body values;
- include `--max-time`/abort guidance where the language supports it;
- never include Ossie cookies or viewer state;
- never execute automatically;
- refuse unsupported serialization rather than generating incorrect code;
- escape shell, JavaScript, and Python strings with language-specific tested
  emitters;
- are labelled examples, not SDKs.

Vendor extension samples remain escaped display text only. They are not trusted
as generator input.

## 5. Domain Model And Terminology

Add to `CONTEXT.md` after implementation:

**Documentation Try-It Policy**:
Edition-owned, Admin-managed, Row-Versioned configuration that approves one
exact operator-allowed HTTPS origin, optional base path, credential modes, and
explicit operation allowances. It is not a credential and does not authorize
the target API.

**Frozen Try-It Policy**:
The immutable safe policy and operation allowance copied into one exact Site
Revision. A later Edition policy change cannot alter that Revision or a
Publication derived from it.

**Publish Link Try-It Policy**:
Admin-owned, link-specific, disabled-by-default opt-in. It does not mutate a
Site Publication and cannot broaden the Frozen Try-It Policy.

**Try-It Configuration**:
A short-lived, authorization-filtered, secret-free browser contract for one
exact operation. It permits the Ossie UI to construct a browser-direct request;
it grants no target-API permission.

**Try-It Attempt Outcome**:
A bounded content-free observation such as completed, browser/network-blocked,
timed out, aborted, response-blocked, or client-validation-blocked. It contains
no URL, parameter, header, request body, response body, status text, or
credential.

Do not call any of these an API environment, integration credential, proxy
configuration, SDK, or approval token.

## 6. Shared Constants And Contracts

### 6.1 Constants

Update `packages/constants/src/documentation.ts` and
`packages/constants/src/constants.test.ts` with:

- policy status `disabled | enabled`;
- allowed method list;
- credential modes `none | bearer | api_key_header`;
- supported body media family;
- attempt outcomes;
- request/response/timeout/rate ceilings from section 4;
- derived descriptor ceiling `256 KiB` per operation and `16 MiB` per source;
- displayed vendor/example value ceiling `64 KiB` per variant;
- operation allowance maximum `500`;
- approved origin/base-path/header-name length limits;
- effective configuration lease `60 seconds`;
- signed attempt-report token lifetime `5 minutes`.

Do not put database table names or UI copy in shared constants.

### 6.2 Strict shared schemas

Update:

- `packages/types/src/documentation.ts`
- `packages/types/src/documentation.test.ts`

Add strict schemas/types:

```text
DocumentationTryItPolicy
DocumentationTryItPolicyResponse
DocumentationUpsertTryItPolicyRequest
DocumentationPublishLinkTryItPolicy
DocumentationPublishLinkTryItPolicyResponse
DocumentationUpdatePublishLinkTryItPolicyRequest
DocumentationTryItRequestDescriptor
DocumentationTryItParameterDescriptor
DocumentationTryItJsonSchema
DocumentationTryItSecurityDescriptor
DocumentationTryItConfiguration
DocumentationTryItAttemptReportRequest
PublicDocumentationOperationSchema
PublicDocumentationSiteSnapshotSchema
```

`DocumentationUpsertTryItPolicyRequest`:

```text
expected_policy_version: positive integer | null
status: disabled | enabled
approved_origin: normalized HTTPS origin | null
base_path: normalized absolute path | null
allow_bearer: boolean
api_key_header_name: bounded header name | null
operation_destination_keys: unique bounded array, max 500
```

Rules:

- `expected_policy_version: null` is create-only;
- enabled requires an origin and at least one operation;
- enabled `base_path: null` canonicalizes to `/`;
- disabled stores no origin, base-path override, credential modes, or operation
  allowances;
- API-key header is allowed only when present in derived source security
  metadata;
- bearer is allowed only when present in derived source security metadata;
- unknown keys fail;
- duplicate operation keys fail;
- client normalization never replaces server validation.

`DocumentationTryItPolicyResponse`:

```text
policy: null | {
  id
  version
  status
  approved_origin
  base_path
  allow_bearer
  api_key_header_name
  operation_destination_keys
  source_version
  effective_status
  operation_count
}
```

It omits source digest, File/storage identity, actor identity, raw operator
ceiling, DNS answers, and credentials. `effective_status` is one of
`disabled | enabled | stale_source | operator_disallowed |
origin_resolution_unsafe | archived`.

`DocumentationUpdatePublishLinkTryItPolicyRequest`:

```text
expected_policy_version: positive integer | null
expected_link_version: positive integer
enabled: boolean
```

Enabling requires the current default link entry to point to a Site Publication
with a compatible Frozen Try-It Policy. Non-default entries are evaluated
independently and may remain read-only. Return a safe compatibility list by
Project Version label without private source details. If the default entry is
incompatible, return a typed conflict.

`DocumentationPublishLinkTryItPolicyResponse`:

```text
policy: null | { id, version, enabled }
effective_status: off | available | partially_available | unavailable | revoked
entries: [{
  entry_id
  project_version_slug
  project_version_label
  is_default
  effective_status: available | unavailable
}]
```

The response omits Publication/Revision internals, origin, operation keys,
header names, source identity/digest, review state, and failure internals.

`DocumentationTryItConfiguration` contains only:

```text
configuration_id
policy_identity
configuration_expires_at
attempt_token_expires_at
surface: internal | public
operation: safe frozen/current descriptor
approved_origin
base_path
allowed_credential_modes
api_key_header_name
request_limits
response_limits
operator_origin_set_digest
attempt_token
```

It contains no review state, internal actor ID, File/storage identity, raw
OpenAPI document, credential, saved request value, or other operation.

All internal/public configuration responses and attempt-report responses send
`Cache-Control: private, no-store`; public configuration also sends
`Vary: Cookie` consistently with existing Publish Link session behavior.
Attempt/configuration tokens never enter shared/public caches. Immutable
read-only operation/reference responses retain their existing cache semantics.

The signed `attempt_token` binds:

- surface and authorization context;
- Site Edition or Publish Link entry;
- exact Source/Revision/Publication and operation destination;
- policy/link Row Versions;
- normalized origin;
- expiry and random nonce.

It authorizes only a content-free outcome report to Ossie. It is never sent to
the target API and does not authorize the target request.

The token payload must not expose raw internal IDs, slug, origin, operation
path/key, or policy values. Bind those values through keyed digests which the
report route recomputes from its already-authorized route context. The token
format is opaque and versioned.

`operator_origin_set_digest` is a SHA-256 digest of the canonical sorted
Try-It-origin ceiling, never the raw list. The web build embeds the same digest.
The client compares them before enabling Send and fails closed on mismatch.

`policy_identity` is an opaque keyed digest of the effective exact
source/Revision/Publication, operation, Site policy, link policy where public,
and origin/base-path/allowance values. Immediately before opening confirmation,
an expired 60-second configuration lease is reloaded. If the identity is
unchanged, the component may retain current in-memory inputs while replacing
only the token/lease. If it changed or became unavailable, abort, clear
credential/response state, cancel confirmation, and require the user to review
the new configuration. Send is disabled if the lease expires while the dialog
is open.

### 6.3 Request projection policy

Add:

- `packages/documentation-domain/src/policies/documentation-try-it-policy.ts`
- `packages/documentation-domain/src/policies/documentation-try-it-policy.test.ts`

Update:

- `packages/documentation-domain/src/index.ts`
- `packages/documentation-domain/src/types/documentation-domain.ts`
- `packages/documentation-domain/src/errors/documentation-domain-error.ts`
- existing OpenAPI policy/tests.

The pure policy must:

- normalize and validate origin/base path;
- classify forbidden IP/host/header/method/media values;
- normalize default ports and IDNs and reject ambiguous/encoded origin/base/
  operation path forms;
- resolve local `$ref` values with cycle/depth/node ceilings;
- derive only supported parameter/body/security/example metadata;
- retain bounded title/summary/description/schema/response text only as inert
  data; ignore raw HTML and never fetch `externalDocs`, `externalValue`,
  callbacks, links, examples, or vendor-extension URLs;
- replace potentially sensitive example values whose property/header name
  matches credential, authorization, cookie, secret, token, password, key, or
  session classes;
- return explicit unsupported reasons;
- enforce `256 KiB` per-operation and `16 MiB` aggregate derived-projection
  ceilings independently of the raw OpenAPI upload ceiling;
- canonicalize operation descriptors for digesting/freezing;
- build a URL without string concatenation ambiguity;
- encode each path value as one segment and build query values through
  `URLSearchParams`; never decode an entered value and splice it into a path;
- join the canonical base path and OpenAPI operation path without allowing the
  latter's leading slash to reset/escape the configured base path;
- validate user values before fetch;
- redact confirmation/error projections;
- generate cURL/fetch/Python examples safely.

No network, browser, React, PostgreSQL, or Fastify object belongs in the domain
package.

## 7. Persistence And Migration `030`

Add:

- `apps/server/src/db/migrations/030_documentation_api_try_it.sql`

### 7.1 Mutable Edition policy

Create `documentation_schema.openapi_try_it_policy`:

```text
id
organization_id
project_id
documentation_site_id
site_edition_id UNIQUE
openapi_source_id
openapi_source_version
openapi_source_digest
status
approved_origin
base_path
allow_bearer
api_key_header_name
version
created_by_id
updated_by_id
created_at
updated_at
```

Create `documentation_schema.openapi_try_it_operation_allowance`:

```text
id
organization_id
project_id
site_edition_id
try_it_policy_id
destination_key
created_at
```

Required constraints:

- composite tenant/Project/Edition foreign keys;
- one policy per Edition;
- unique destination key per policy;
- enabled/disabled field consistency;
- exact source identity/version/digest pin;
- no cascade deletion;
- Row Version and updated-at trigger;
- runtime role grants consistent with existing Documentation tables;
- Audit context/no-context guards;
- reset order and down migration.

An OpenAPI Source replacement does not silently retarget the policy. A source
identity/version/digest mismatch makes it effectively stale and read-only until
an Admin explicitly saves a new policy.

Mutable allowances deliberately do not foreign-key directly to
`openapi_operation`, because the accepted Source apply transaction deletes and
recreates operation rows. They are tenant-scoped children of the policy, and
the locked source identity/version/digest plus service validation establishes
their meaning. This allows a stale policy to remain inspectable instead of
blocking Source replacement. A disabled-policy write removes its allowance
rows.

### 7.2 Derived request descriptors

Add bounded `JSONB NOT NULL DEFAULT '{}'::jsonb` request/security/example
projection columns plus a descriptor version/digest to:

- `documentation_schema.openapi_operation`;
- `documentation_schema.site_revision_openapi_operation`.

Add safe server-candidate metadata to:

- `documentation_schema.openapi_source`;
- `documentation_schema.site_revision_openapi_source`.

The projection is derived only by the accepted bounded parser. It is data, not
executable configuration. Database checks enforce object/array shape and
maximum serialized size; shared/domain schemas enforce semantics.

Imported `servers` candidates remain authorized authoring guidance only. They
are excluded from public operation/reference/configuration responses, public
search, metadata, evidence, and examples even when frozen in a Revision. Public
configuration exposes only the separately approved exact origin when effective.

Existing rows receive empty version-`0` descriptors and remain read-only.
Migration `030` must not fetch or parse protected Files. Re-inspecting and
applying the same source is the explicit upgrade path.

Descriptor version `0` fields are omitted from canonical Revision and
Publication digest input so an unchanged legacy graph can still reuse its
existing Revision. Descriptor version `1` fields and any Frozen Try-It Policy
are included deterministically. Never recompute or rewrite a stored historical
content/output digest.

### 7.3 Immutable Revision policy

Create:

- `documentation_schema.site_revision_openapi_try_it_policy`;
- `documentation_schema.site_revision_openapi_try_it_operation_allowance`.

Freeze a policy only when it is enabled, current for the exact source, and all
allowances resolve to supported descriptors. The frozen row includes policy
fields, source digest, policy version, and a canonical digest.

Each frozen allowance must have a composite tenant/Revision/destination
reference to the corresponding `site_revision_openapi_operation`; unlike
mutable source operations, both sides are immutable.

Add update/delete/truncate refusal triggers consistent with other immutable
Site Revision tables.

Revision content/reuse digest must include the frozen policy and allowances.
Changing policy therefore requires a new Revision before it can affect a new
Publication. Existing Revision/Publication digests remain unchanged.

### 7.4 Link-specific policy

Create `publish_schema.documentation_try_it_policy`:

```text
id
organization_id
project_id
publish_link_id UNIQUE
enabled
version
created_by_id
updated_by_id
created_at
updated_at
```

It is mutable configuration attached to a Documentation-family Publish Link,
not to a Publication. It must:

- require `resource_family = documentation_site`;
- remain valid only for active link state;
- use expected policy and link Row Versions;
- validate the default current entry against its exact Publication frozen
  policy before enabling and classify every other current entry independently;
- automatically become ineffective, without rewriting history, when an entry
  later points to an incompatible Publication;
- never affect Guide/Demo link behavior.

The public resolver computes effective enablement from the current link,
selected entry, exact Publication/Revision, and frozen policy. It never consults
the mutable Edition policy.

### 7.5 Migration compatibility and rollback

- Existing Editions, Revisions, Publications, and links receive no enabled
  policy.
- Existing exact Revisions remain immutable descriptor-v0/read-only snapshots
  even after the mutable Source is re-applied; only a later Revision can freeze
  descriptor v1.
- Existing public/read-only operation responses do not change semantically.
- Removing currently spread, undocumented repository-only OpenAPI Source/File
  fields from the public Site payload is an intentional security correction,
  not a supported-contract break; the web client and shared public schemas must
  never depend on those fields.
- Package format V1 remains unchanged.
- Import and Carry-Forward rederive descriptor-v1 safe operation metadata from
  the already-validated self-contained source, but do not copy Try-It policies;
  their target Edition remains disabled.
- Export does not include derived request descriptors, policy, operator
  ceiling, attempt tokens, or values; import derives descriptors rather than
  trusting package-supplied executable/request metadata.
- Restore does not enable a previously ineffective policy without the normal
  current checks.
- Migration down succeeds only when no mutable/frozen/link policy rows or
  version-1 descriptors exist; otherwise it refuses with an operator-facing
  message.
- Migrations `001`–`029` are never edited.

## 8. Server Ownership

### 8.1 New files

Add:

- `apps/server/src/config/documentation-try-it.config.ts`
- `apps/server/src/config/documentation-try-it.config.test.ts`
- `apps/server/src/modules/documentation/documentation-try-it.origin.ts`
- `apps/server/src/modules/documentation/documentation-try-it.origin.test.ts`
- `apps/server/src/modules/documentation/documentation-try-it.token.ts`
- `apps/server/src/modules/documentation/documentation-try-it.token.test.ts`
- `apps/server/src/dev-fixtures/documentation-try-it-target-fixture.ts`
- `apps/server/src/dev-fixtures/documentation-try-it-target-fixture.test.ts`

The existing Documentation repository/service/routes remain the owning module;
do not create a second mega-module.

### 8.2 Existing files to update

- `apps/server/src/modules/documentation/documentation-openapi.ts`
- `apps/server/src/modules/documentation/documentation-openapi.test.ts`
- `apps/server/src/modules/documentation/documentation.repository.ts`
- `apps/server/src/modules/documentation/documentation.repository.test.ts`
- `apps/server/src/modules/documentation/documentation.db.integration.test.ts`
- `apps/server/src/modules/documentation/documentation.service.ts`
- `apps/server/src/modules/documentation/documentation.service.test.ts`
- `apps/server/src/modules/documentation/documentation.routes.ts`
- `apps/server/src/modules/documentation/documentation.routes.test.ts`
- `apps/server/src/modules/documentation-review/documentation-review.change-summary.ts`
- `apps/server/src/modules/documentation-review/documentation-review.change-summary.test.ts`
- `apps/server/src/app.ts` only for dependency/config wiring, never a proxy;
- `apps/server/src/config/production-env-report.ts`
- `apps/server/src/config/production-env-report.test.ts`
- `apps/server/src/config/startup.config.ts`
- `apps/server/src/config/startup.config.test.ts`
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/test-support/database.ts`
- `apps/server/src/test-support/database.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-route-coverage.test.ts`
- `apps/server/src/modules/audit/audit-source-coverage.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/project-membership/project-access.policy.ts`
- `apps/server/src/modules/project-membership/project-access.policy.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.db.integration.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.cli.ts`
- `apps/server/.env-cmdrc.example`.

### 8.3 No target fetch on the server

Production server code must contain no `fetch`, Axios/HTTP client, socket,
proxy, DNS-to-request bridge, redirect follower, or target-response parser for
Try It.

The only network-related server behavior is bounded DNS resolution used to
reject unsafe approved origins. Inject that resolver for deterministic tests.

Add a source-level test which fails if the Try-It server paths import an HTTP
client or call target-fetch APIs.

## 9. API Contracts

### 9.1 Site policy

```text
GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/try-it-policy
PUT /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/try-it-policy
```

GET:

- Admin/Editor/Viewer may read safe effective policy;
- returns `policy: null` when absent;
- returns safe `effective_status`:
  `disabled | enabled | stale_source | operator_disallowed | archived`;
- never returns operator-wide origin lists.

PUT:

- Admin/implicit Owner only;
- strict request plus `Idempotency-Key`;
- create returns `201`, replay/update `200`;
- locks Edition, source, and policy in fixed order;
- validates DNS/operator ceiling before mutation;
- atomically replaces allowances and writes one Audit Event;
- does not create a Revision automatically.

The idempotent PUT response/receipt contains only policy ID, Row Version,
status, effective status, and operation count. It does not duplicate the
approved origin, base path, header name, or operation keys into
`documentation_command_receipt`; the authorized client reloads GET after a
successful/replayed command.

### 9.2 Internal exact-operation configuration

```text
GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/operations/:operation_key/try-it-configuration?source=draft
GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/operations/:operation_key/try-it-configuration?source=revision&revision_number=:number
```

- all active authorized Project roles may request configuration;
- draft uses current enabled/non-stale Edition policy;
- revision uses only the immutable Frozen Try-It Policy;
- archived/read-only parent state may be read, but configuration is disabled so
  it cannot initiate a new target request;
- return `404` non-enumerating for cross-tenant/missing operation;
- return `409` typed disabled/stale/unsupported errors for authorized users.

### 9.3 Publish Link policy

```text
GET   /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/try-it-policy
PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/try-it-policy
```

- all authorized Project roles may read the safe state;
- Admin/implicit Owner only may mutate;
- mutation uses `Idempotency-Key`, expected policy version, and expected link
  version;
- enabling requires a compatible default entry and reclassifies all current
  entries;
- disabling is always allowed for an active link;
- revoked link is readable but immutable/ineffective.

The PATCH receipt contains only link-policy ID, Row Version, enabled/effective
state, and safe compatible/incompatible entry counts. The client reloads the
authorized detail; the receipt stores no origin, operation key, or Project
Version label.

This command is independent from Publication review gates. It must not catch,
translate, or reuse `documentation_review_*` outcomes.

Do not add Try-It fields to Publication/rollback command bodies, request
digests, idempotent receipts, or Publication Review Evidence. After a successful
Publication/rollback, the portal reloads the separate link policy/effective
entry classification. Pre-`030` Publication and rollback replays therefore stay
byte-compatible.

### 9.4 Public exact-operation configuration

Add both variants:

```text
GET /api/v1/public/publish-links/:slug/documentation/operations/:operation_key/try-it-configuration
GET /api/v1/public/publish-links/:slug/versions/:version_slug/documentation/operations/:operation_key/try-it-configuration
```

Authorization order:

1. resolve exact active Publish Link and access/session policy;
2. resolve selected exact entry and Site Publication;
3. load exact immutable Revision operation;
4. evaluate link-specific opt-in;
5. evaluate frozen policy and operator/DNS ceiling;
6. return one secret-free configuration.

All failures before authorization use existing non-enumerating public
not-found/password outcomes. An authorized reader may receive a safe
`documentation_try_it_unavailable` response. Public errors do not distinguish
disabled, incompatible, stale source, DNS, or operator/CSP configuration.

The public web adapter sends the existing
`x-ossie-access-surface: public_reader` classification header on configuration
and report calls. It sends no target values in Ossie request headers.

The existing operation GET gains only additive safe request/example descriptor
fields. It never gains the approved origin unless effective Try It is enabled
and the dedicated configuration route succeeds.

Replace the current permissive record spread with an explicit strict public
operation projection. Adding columns to repository rows must never
accidentally expose source/policy/internal fields through
`{ operation }`.

Likewise replace `public_site_response` with an explicit strict public Site
Publication projection. It may include only the accepted Site/Revision display
fields, Pages/blocks, navigation, routing-safe data, snippets, safe artifact
Publication projections, safe asset references, and safe operation
descriptors. It must exclude raw/frozen OpenAPI Source rows, File IDs, digests,
server candidates, policy rows, approved origin, the policy's selected security
header, review state, and repository-only fields. Read-only OpenAPI
security-scheme metadata may still include its documented header name.

### 9.5 Attempt outcome

Add exact internal and public report routes:

```text
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/operations/:operation_key/try-it-attempts
POST /api/v1/public/publish-links/:slug/documentation/operations/:operation_key/try-it-attempts
POST /api/v1/public/publish-links/:slug/versions/:version_slug/documentation/operations/:operation_key/try-it-attempts
```

Body:

```text
attempt_token
outcome:
  completed | browser_network_blocked | timed_out | aborted |
  response_blocked | client_validation_blocked
```

Rules:

- token required and usable only within five minutes;
- no status code, duration, URL, method, path, header, body, message, or value
  accepted;
- unknown fields fail;
- reporting failure never retries the target request;
- report endpoint returns `204`;
- completed does not mean the target operation succeeded;
- the browser reports at most once per attempt;
- the server does not create durable nonce/session state merely to deduplicate
  harmless reports; it rate-limits reports by configuration/access context;
- public report does not establish a viewer identity.

Outcome reporting is best effort while the operation panel remains mounted. It
does not delay response display, use `sendBeacon`, register a service worker,
survive unload, or retry in the background. Access Evidence is therefore an
observability signal, not a complete target-API request ledger.

The Fetch API does not reliably distinguish CORS, CSP, DNS, TLS, and general
network blocking. The client therefore reports the single
`browser_network_blocked` outcome and shows combined troubleshooting guidance;
it must not invent a more precise diagnosis.

### 9.6 Typed errors

Add and map:

```text
documentation_try_it_disabled
documentation_try_it_stale_source
documentation_try_it_origin_invalid
documentation_try_it_origin_not_allowed
documentation_try_it_origin_resolution_unsafe
documentation_try_it_operation_not_allowed
documentation_try_it_operation_unsupported
documentation_try_it_policy_conflict
documentation_try_it_link_incompatible
documentation_try_it_configuration_expired
documentation_try_it_attempt_invalid
documentation_try_it_unavailable
```

Authorized copy is actionable. Unauthorized/cross-tenant responses are
non-enumerating. Browser-local validation/CORS/timeout/response errors are not
sent to the server as raw text.

HTTP mapping:

- malformed request/origin/header/value: `400`;
- operator-disallowed or DNS-resolved unsafe origin while saving: `400`;
- unauthenticated internal access: existing `401`;
- authenticated role denial: existing `403`;
- cross-tenant/missing resource or unauthorized public resource: `404`;
- disabled, stale, unsupported, incompatible, or Row Version state: `409`;
- malformed/tampered attempt token: `400` without token detail;
- expired attempt token: `410` without token detail;
- transient DNS resolver failure while saving or issuing config: `503` with
  retry-safe authorized copy;
- a newly unsafe DNS answer while issuing config: authorized `409`
  unavailable, never `503` retry encouragement;
- public configuration collapses all post-authorization configuration
  failures, including transient DNS, to
  `409 documentation_try_it_unavailable`;
- local target fetch outcomes are UI state, not Ossie route errors.

## 10. Authorization, Audit, And Access Evidence

### 10.1 Role matrix

| Capability                             | Owner/Admin | Editor | Viewer | Authorized public |
| -------------------------------------- | ----------- | ------ | ------ | ----------------- |
| Read source/reference                  | Yes         | Yes    | Yes    | Exact link only   |
| Read safe Site/link Try-It state       | Yes         | Yes    | Yes    | Effective only    |
| Configure Site approved origin/policy  | Yes         | No     | No     | No                |
| Configure Publish Link opt-in          | Yes         | No     | No     | No                |
| Generate examples locally              | Yes         | Yes    | Yes    | Yes if authorized |
| Send browser-direct allowed request    | Yes         | Yes    | Yes    | Yes if opted in   |
| View request/response/credential later | No          | No     | No     | No                |

Target-API authorization remains entirely with the target API.

Reuse existing Project capabilities:

```text
documentation.read
documentation.site.manage
```

Map Site policy reads, operation configuration reads, and content-free internal
attempt reports explicitly to `documentation.read`; map Site policy writes to
`documentation.site.manage`; and map the security-sensitive Publish Link
Try-It-policy write to `documentation.site.manage` as well. Do not reuse generic
`publish_link.manage`, because Editors currently hold that capability while
Try-It enablement is explicitly Admin-only. Route ordering must prevent the
non-GET attempt report from falling through to generic `documentation.write`,
because active Viewers are allowed to use the reader. Public use is resolved
only through public-link policy and is not a Project capability. Do not add a
duplicate Try-It capability family.

### 10.2 Audit

Committed mutations:

- `documentation.openapi_try_it_policy.created`;
- `documentation.openapi_try_it_policy.updated`;
- `documentation.openapi_try_it_policy.disabled`;
- `documentation.publish_link_try_it_policy.enabled`;
- `documentation.publish_link_try_it_policy.disabled`.

Audit Change Items may contain:

- Site/Edition/link/policy IDs;
- status;
- policy Row Version;
- safe operation count;
- boolean credential-mode flags.

Audit must not contain:

- approved origin or base path;
- operation paths;
- header names;
- request/example values;
- attempt outcomes or target status;
- credentials or request/response content.

Policy mutation and Audit Event commit in one transaction. Failed mutations
create no mutation Audit Event.

Attempt-report POST routes are explicitly classified in Audit route coverage as
Access-only observations, not product mutations. They create no Audit Event and
must not be added to an Audit command merely because they use POST.

The existing private Revision review change summary treats descriptor/Frozen
Try-It-policy differences as `openapi_changed: true`. It never includes origin,
base path, operation allowance, credential mode/header, examples, or policy
digests. Review request/gate semantics and schemas otherwise remain unchanged.

### 10.3 Access Evidence

Register:

- internal/public configuration read or denial;
- report-route denial;
- policy read where current Access conventions require it.

The current Access Event schema has no arbitrary detail field, and this child
must not add one. Register the successful content-free outcomes as exact
non-transport Access actions:

```text
documentation.try_it.attempt_completed
documentation.try_it.attempt_browser_network_blocked
documentation.try_it.attempt_timed_out
documentation.try_it.attempt_aborted
documentation.try_it.attempt_response_blocked
documentation.try_it.attempt_client_validation_blocked
```

The report routes use denial-only route coverage. After a valid report, the
handler appends exactly one non-transport Access Event with the corresponding
allowlisted action, the already-resolved Site/Publish Link root, actor/surface/
authorization context, `outcome: succeeded`, and null request transport fields.
If append fails, return `503`; never claim the report succeeded. Do not create a
second success event through the response hook.

Evidence may contain safe root identity, surface, authorization context, and
the outcome encoded by the allowlisted action. It must not contain target
origin/path, operation key, headers, values, status code, error text, bodies,
credential mode, or the attempt token.

Ordinary static reference rendering must not create noisy per-component
evidence.

## 11. Portal Experience

### 11.1 New files

Add:

- `apps/web/src/features/documentation/DocumentationTryItPolicyPanel.tsx`
- `apps/web/src/features/documentation/DocumentationTryItPolicyPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationApiOperationExperience.tsx`
- `apps/web/src/features/documentation/DocumentationApiOperationExperience.test.tsx`
- `apps/web/src/features/documentation/DocumentationTryItRequestBuilder.tsx`
- `apps/web/src/features/documentation/DocumentationTryItRequestBuilder.test.tsx`
- `apps/web/src/features/documentation/DocumentationTryIt.module.css`
- `apps/web/src/lib/documentationTryItApi.ts`
- `apps/web/src/lib/documentationTryItApi.test.ts`
- `apps/web/src/lib/documentationTryItClient.ts`
- `apps/web/src/lib/documentationTryItClient.test.ts`
- `apps/web/src/lib/documentationTryItExamples.ts`
- `apps/web/src/lib/documentationTryItExamples.test.ts`
- `apps/web/src/lib/documentationCsp.ts`
- `apps/web/src/lib/documentationCsp.test.ts`

### 11.2 Existing files to update

- `apps/web/index.html`
- `apps/web/vite.config.ts`
- `apps/web/vite.config.test.ts`
- `apps/web/src/vite-env.d.ts`
- `apps/web/src/lib/documentationApi.ts`
- `apps/web/src/lib/documentationApi.test.ts`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationDraftPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationDraftPreviewPage.test.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationBlockRenderer.tsx`
- `apps/web/src/features/documentation/DocumentationBlockRenderer.test.tsx`
- `apps/web/src/features/documentation/documentationPermissions.ts`
- `apps/web/src/features/documentation/documentationPermissions.test.ts`

### 11.3 Admin policy UI

The OpenAPI workbench adds “API request access”:

- disabled-by-default explanation;
- exact source version/digest status without showing raw digest;
- imported server candidates labelled “not approved”;
- exact HTTPS origin and optional base path;
- bearer and supported API-key-header choices;
- operation search and explicit selection, max `500`; never render all
  potentially `20,000` operations at once—show at most `100` filtered rows per
  view with deterministic paging or virtualization;
- unsupported-method/schema explanation;
- operator-ceiling/DNS/CSP readiness;
- stale-source warning and re-inspect/apply action;
- explicit save confirmation naming the origin and operation count;
- disable action which never echoes credentials because none are stored.

Editor/Viewer sees safe state read-only.

### 11.4 Publish Link UI

The Publishing panel adds per-link:

- `Try It off`, `Try It on`, or `Try It unavailable`;
- Admin-only opt-in/out;
- warning that link access does not grant target-API access;
- entry compatibility list by safe Project Version label;
- explicit enable confirmation;
- no coupling to Review optional/approved/override state.

If a rollback or new Publication switches an entry to an incompatible frozen
policy, the link policy remains stored but effective Try It becomes unavailable
for that entry. Other compatible entries remain eligible, and the public
reference remains readable everywhere. If the default entry is now
incompatible, the unversioned reader is read-only until an Admin publishes a
compatible default or disables/reconfigures policy.

### 11.5 Operation experience

For draft, exact Revision, and public exact Publication operation views:

- method, path, summary, safe descriptions/parameters/body/response metadata;
- draft state is labelled with the current server-saved OpenAPI Source Row
  Version and is never described as frozen; Revision/public examples derive
  only from their exact immutable operation descriptor;
- examples tab;
- request-builder tab only when effective configuration is available;
- a clear read-only explanation otherwise;
- current approved origin and resolved request path before send;
- never display an entered secret in summary, history, live region, or DOM text;
- a confirmation dialog before every request;
- stronger mutation warning for POST/PUT/PATCH/DELETE plus an unchecked
  “I understand this can change real target data” checkbox which gates Send;
- Send, Abort, Clear credentials, Clear response;
- local rate-limit countdown;
- loading, completed, empty, aborted, timed-out, browser/network-blocked,
  unsupported, oversized, binary, and retry states;
- CORS/CSP/DNS/TLS guidance which explicitly says the browser does not expose a
  reliable distinction and Ossie will not proxy around target policy.

OpenAPI descriptions use the existing controlled CommonMark/sanitization
boundary and ignore raw HTML. Schema/example/code regions are escaped text and
never become authored HTML or executable Markdown.

Changing operation, Site, Link, version, or auth state unmounts the request
state synchronously.

### 11.6 Accessibility and motion

- semantic operation heading and labelled method/path;
- native labelled inputs/fieldsets;
- errors associated through `aria-describedby`;
- confirmation is a real focus-contained dialog, Escape-safe before send, and
  restores focus;
- request state uses a polite live region without secrets or response body;
- Abort remains keyboard reachable while pending;
- error summary receives focus after validation failure;
- tabs follow the existing accessible tab pattern or use simple headings if no
  proven tab primitive exists;
- code/example copy has durable label and feedback;
- status is never color-only;
- `320` CSS-pixel reflow without page-level horizontal overflow; code regions
  may scroll within labelled containers;
- 200% zoom;
- reduced motion has no essential transition;
- no countdown animation or automatic focus jump on response completion.

## 12. CSP And Browser Boundary

`apps/web/vite.config.ts` must parse and normalize the build-time connect-origin
ceiling. It must:

- inject a meta-delivered
  `connect-src 'self' <exact Ossie API origin> <exact configured Try-It origins>`
  policy into `apps/web/index.html` for static-host fallback;
- set the same CSP as an HTTP response header for Vite development/preview;
- expose a deterministic, documented header value for a production reverse
  proxy to set on the SPA response.

`connect-src` is valid in a meta-delivered policy. `frame-ancestors`,
`sandbox`, and report-only behavior are not, so the plan must not claim that a
meta tag supplies them. Production self-hosting guidance must require an HTTP
response header and show how to merge the exact `connect-src` set into the
operator's existing full CSP. Multiple policies intersect; an unrelated
stricter deployment policy may intentionally keep Try It unavailable.

Do not weaken an existing script/object/frame policy to implement Try It. Do
not add `https:`, `*`, `data:`, or a public proxy origin to `connect-src`.

Build/config validation must:

- normalize exact origins identically to server policy;
- reject malformed/wildcard/path-bearing entries;
- deduplicate and sort deterministically;
- keep local Vite development working through the same-origin `/api` proxy;
- allow only the exact Vite HMR WebSocket endpoint in development, never in the
  production header;
- embed the canonical Try-It-origin-set digest in the web build;
- include the server digest/count in the safe production environment report
  without printing origins;
- compare server configuration-response and web-build digests before Send and
  show a fail-closed operator configuration message on mismatch;
- explain rebuild/redeploy requirements in self-hosting docs.

Application validation still checks the one exact configuration origin before
every fetch. CSP is defense in depth, not the domain authority.

## 13. Concurrency, Idempotency, And Lifecycle

- Site policy writes lock Edition, Source, policy, and allowances in a stable
  order.
- Link policy writes lock link then policy.
- Both use expected Row Version and idempotency fingerprint.
- Same key/same body replays exact safe response.
- Same key/different body conflicts.
- Concurrent Admin updates produce one winner and one typed conflict.
- OpenAPI replacement racing policy save either pins the old exact source and
  becomes stale or loses with conflict; it never partially retargets.
- Revision creation locks and freezes a single coherent source/policy graph.
- Publication/rollback remains governed only by child `136` review policy.
- Link policy enable racing entry switch must validate the locked post-switch
  entries or conflict.
- Archive/read-only state blocks configuration mutation and execution config.
- Restore does not silently renew DNS/CSP validity.
- Site/link disablement or entry switching applies to new configuration
  immediately and to already-open cooperative clients no later than their
  60-second lease. It cannot recall a target request already dispatched from a
  browser; UI and ADR must state this residual honestly.
- Request builder uses one AbortController per send and discards late results
  by configuration/request identity.

### 13.1 URL, search, publication, and retention compatibility

- Existing public browser operation URLs remain
  `/docs/:slug[/versions/:version_slug]/operations/:operation_key`.
- Existing public API operation routes remain stable; this child adds only the
  configuration/report subresources listed in section 9.
- No moving `/latest`, external redirect, target-origin link, or query-carried
  request state is introduced.
- Existing operation destination identity and canonical metadata remain based
  on the exact immutable `destination_key`.
- Existing internal/public search continues to index only accepted safe
  operation metadata. Approved origins, base paths, security header names,
  request descriptors, generated examples, request/response values, attempt
  outcomes, and policies do not enter search documents.
- Sitemap and robots behavior remain unchanged; configuration/report endpoints
  are API resources, never reader destinations.
- Site Publication freezes descriptor-v1 operation data only through its exact
  Revision. Publish Link policy remains mutable link configuration and never
  changes Publication identity or output.
- Mutable policies/allowances are retained with the Edition/link lifecycle;
  frozen policy is immutable history; attempt tokens/request state are
  ephemeral; Access Evidence follows the existing append-only retention model.
- No permanent deletion or cleanup job is introduced.

## 14. Threat Model

| Threat                             | Required control                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server SSRF/open relay             | No production target HTTP client or proxy; DNS only validates configuration.                                                                          |
| Browser request to private network | HTTPS exact origin, operator ceiling, public-address DNS checks on save/config issue, CSP, no dev exception in public V1.                             |
| DNS rebinding                      | Re-resolve before config issue, reject mixed/unsafe answers, short config expiry, exact CSP origin; document browser/network residual risk.           |
| Redirect escape                    | `redirect: "error"`; all redirects fail.                                                                                                              |
| Credential leakage                 | Component-local memory, `credentials: "omit"`, redaction, teardown, no storage/URL/telemetry/server/example value.                                    |
| Cookie/CSRF confusion              | No cookie auth or browser credentials; target API authenticates explicit manual values.                                                               |
| Header smuggling                   | Browser-forbidden/hop-by-hop denylist, grammar/size validation, structured `Headers`.                                                                 |
| URL injection                      | `URL` construction from normalized origin/base path plus validated OpenAPI path and encoded parameters.                                               |
| Malicious schema/example           | Existing bounded self-contained parse plus descriptor depth/node/size limits and sensitive-example redaction.                                         |
| Stored/reflected XSS               | Escaped text/JSON only; no HTML/SVG/blob/data rendering or execution.                                                                                 |
| Response memory exhaustion         | Content-Length precheck, bounded stream reader, abort at `1 MiB`, timeout.                                                                            |
| Target abuse                       | Explicit operation allowance, confirmation every send, stronger mutation warning, local concurrency/rate ceiling; target retains auth/rate authority. |
| Public policy bypass               | Exact Publish Link authorization before config, link-specific off-by-default policy, immutable Publication descriptor.                                |
| Cross-tenant substitution          | Composite scope, parent resolution, authorization-before-load, signed scoped token.                                                                   |
| Stale/review confusion             | Source/policy digests and Row Versions; review state never consulted for execution.                                                                   |
| CSP misconfiguration               | Exact build-time ceiling, validation/reporting, visible fail-closed guidance.                                                                         |

No control claims to make a third-party API safe. The UI must state that the
request can change real data and that the user is responsible for the target
credential and environment.

## 15. Exact Affected And Read-Only Files

### 15.1 Required runtime/test changes

Shared/domain:

- constants/types/domain files from section 6.

Database/server:

- migration `030`;
- files from section 8;

Portal:

- files from section 11;

Docs:

- `CONTEXT.md`;
- `docs/documentation-domain-decisions.md`;
- new
  `docs/adr/0033-documentation-try-it-is-browser-direct-and-origin-governed.md`;
- `docs/self-hosting.md`;
- `docs/v1-dogfood-smoke-suite.md`;
- this plan;
- Master `006` only after verified completion;
- new browser evidence
  `docs/ui/137-documentation-api-try-it-and-example-experience-browser-evidence.md`.

### 15.2 Conditional files

Touch only if scoped verification proves necessary:

- shared UI primitives/styles, only to repair a reusable accessibility need;
- existing public-reader layout styles only when the new operation component
  cannot remain contained in its owned module.

### 15.3 Read-only compatibility surfaces

Do not change unless a failing scoped test proves a Plan `137` requirement:

- migrations `001`–`029`;
- review policy/request/decision/inbox/evidence schemas and routes;
- comment schemas/routes/panel;
- import/package format and converters;
- Carry-Forward selection/provenance semantics;
- Guide/Demo/capture/extension runtime;
- File delivery/storage;
- public search/sitemap/robots/canonical routing;
- existing Publish Link password/restricted session behavior;
- Fumadocs/Tiptap adoption decision;
- Scalar development-only Ossie API reference in `apps/server/src/app.ts`;
- generic Guide/Demo Publish Link behavior.
- `apps/server/package.json`, `apps/web/package.json`, and `pnpm-lock.yaml`; the
  plan is fully implementable with current dependencies and platform APIs.

## 16. Documentation And ADR

ADR `0033` is justified because browser-direct execution, dual operator/Admin
origin governance, link-specific enablement, immutable Revision freezing,
memory-only credentials, and no-redirect behavior are durable security
boundaries.

The ADR must record:

- why no server proxy is allowed;
- why imported servers are not approval;
- why operator and Admin ceilings are separate;
- why link opt-in is distinct from Site approval;
- why credentials are memory-only;
- why all redirects are blocked in V1;
- why package/import/Carry-Forward exclude environment policy;
- why review approval is unrelated;
- known CORS/CSP/DNS residual limitations.

Update the decision matrix only from planned to implemented after runtime and
browser proof pass.

## 17. TDD And Implementation Order

Use red-green-refactor for every behavior change.

1. Shared constants and strict schemas.
2. Pure origin/request projection/redaction/example policy.
3. Migration and foundation/reset/down-refusal tests.
4. Repository DB tests for policy, allowances, frozen Revision, link policy,
   tenant scope, audit, concurrency, and compatibility.
5. Service/route tests for role matrix, DNS/operator ceiling, exact public
   authorization, signed tokens, and typed errors.
6. CSP build/config tests.
7. Browser client tests for URL/header/body validation, AbortController,
   timeout, rate ceiling, redirect error, bounded stream, rendering, and
   teardown.
8. Portal component tests for policy/link controls, examples, confirmation,
   request lifecycle, accessibility, and disabled/read-only preservation.
9. Deterministic DB-backed browser fixture and synthetic CORS target.
10. Docs and truthful closure only after all gates pass.

The browser fixture may start a test-only synthetic HTTPS target with injected
public-address validation. No production private-origin bypass or proxy may be
introduced for test convenience.

## 18. Focused Verification

### 18.1 Domain/contracts

- strict unknown-key rejection;
- origin/path/header/method normalization matrix;
- base-path containment, template completeness, default-port/IDN normalization,
  and encoded traversal/separator rejection;
- public/private/reserved IPv4 and IPv6 classes;
- IDN and credential-bearing URL rejection;
- local `$ref`, recursion, depth/node/size handling;
- supported/unsupported serialization;
- query/header array explode behavior and credential/header collisions;
- sensitive examples redacted;
- exact URL construction and encoding;
- cURL/fetch/Python escaping and placeholder behavior;
- descriptor/digest determinism.

### 18.2 Database/repository

- clean `001`–`030`;
- existing row defaults stay read-only;
- source replacement makes policy stale;
- policy create/update/disable/replay/conflict;
- allowance replacement atomicity and max;
- exact Revision freeze and digest reuse;
- descriptor-v0 digest omission and unchanged historical digest/receipt values;
- old Revision immutability after policy change;
- link opt-in with compatible-default enforcement and per-entry classification;
- link enable/entry-switch race with every selected entry classified under
  lock;
- incompatible entry switch becomes ineffective;
- archived/revoked lifecycle;
- cross-tenant failures;
- Audit atomicity and sensitive-field absence;
- down/up empty success and populated refusal.

### 18.3 Routes/security

- Owner/Admin/Editor/Viewer/public matrix;
- operator-ceiling and DNS safe/unsafe/mixed/failure;
- no server target fetch;
- exact internal draft/Revision projection;
- exact public Publication projection;
- password/restricted/revoked/expired/missing behavior;
- review state never changes execution result;
- signed token expiry/scope/replay/tamper;
- report schema accepts only enum/token;
- Access Evidence contains no origin/path/value/content;
- accepted attempt reports create exactly one allowlisted content-free
  non-transport Access Event; denied reports use route evidence;
- public operation stays read-only without config.
- public Site and operation strict projections reject fixture-only extra
  source/File/digest/server/policy keys instead of spreading them;

### 18.4 Browser client/UI

- no automatic fetch;
- `credentials: omit`, `redirect: error`, no referrer/cache;
- forbidden header and body/media rejection;
- ambient target cookie omission and ignored `Set-Cookie`;
- confirmation every time and stronger mutation copy;
- abort/timeout/late response;
- Content-Length and streaming overflow;
- safe JSON/text and blocked active/binary types;
- exact credential-value redaction when a target reflects a bearer/API key in a
  header, JSON value, or text body;
- no-stream response fallback refusal and post-decompression byte ceiling;
- local send ceilings;
- credentials never appear in DOM text, copy output, URL, storage, console,
  report call, or screenshots;
- synchronous teardown;
- CORS/CSP guidance;
- server/web origin-set digest match/mismatch and no target Send on mismatch;
- policy/link loading, empty, denied, stale, conflict, archived, retry states;
- keyboard, dialog focus, live regions, 320px, 200% zoom, reduced motion.

### 18.5 Full regression

Run:

```text
pnpm check-types
pnpm lint
pnpm build
pnpm --filter @repo/constants test
pnpm --filter @repo/types test
pnpm --filter @repo/documentation-domain test
pnpm --filter server test
pnpm --filter server test:db
pnpm --filter server test:smoke
pnpm --filter web test
pnpm --filter extension test
git diff --check
```

Record unchanged warning/bundle baselines honestly. Child `138` owns production
profiling and configurable operational reporting, not regressions introduced
here.

## 19. Mandatory Agent-Browser Validation

Use the installed `agent-browser` skill on the headless server against the
deterministic DB fixture and a synthetic HTTPS CORS target. Do not replace it
with a custom general-purpose browser runner.

Required Admin journey:

1. open a Site with an existing descriptor-v0 source and verify reference
   remains read-only;
2. re-inspect/apply the source and inspect server suggestions labelled
   unapproved;
3. fail unsafe/unlisted origins;
4. configure one exact allowed origin, bearer/API-key modes, and selected
   operations;
5. create a Revision/Publication;
6. verify a public link remains off;
7. enable the link with explicit confirmation;
8. verify review state is unchanged and unrelated.

Required internal/public request journeys:

- generate and copy all three examples with placeholders;
- enter synthetic credential values and prove they appear nowhere outside
  password controls/network target request;
- confirm GET and mutation requests;
- exercise success JSON, success text, empty, CORS failure, CSP failure,
  timeout, abort, redirect, oversized stream, HTML/SVG, binary, malformed JSON,
  target network failure, and local rate-limit states;
- prove request target is the exact synthetic origin and the Ossie server
  receives no request/response/credential content;
- change operation/version/link and verify memory teardown;
- refresh and verify no credential/response restoration.

Required access/lifecycle journeys:

- Viewer can use enabled internal operation but cannot configure;
- Editor cannot configure Site/link policy;
- password link exposes nothing before unlock;
- restricted/expired/revoked/missing/version-removed link cannot configure or
  send;
- stale source and incompatible rollback disable Try It but retain reference;
- link opt-out clears public operation state immediately;
- later mutable Site policy does not change an old Publication;
- approval/override changes do not enable or disable Try It.

Required privacy evidence:

- inspect Ossie network requests, console, URL/history, DOM/accessibility tree,
  localStorage, sessionStorage, IndexedDB, Cache API, Audit, Access Evidence,
  and screenshots for the synthetic unique secret marker;
- only the direct target request may contain that marker;
- attempt reports contain token plus outcome only;
- public response contains no review/private/source/File identity.

Required accessibility/quality:

- accessibility-tree snapshots for disabled reference, request builder,
  confirmation, pending/Abort, safe response, and error guidance;
- keyboard-only completion;
- `320` CSS-pixel reflow and 200% zoom;
- reduced motion;
- axe WCAG 2 A/AA on Admin policy, Viewer operation, and public operation;
- manual contrast review for indeterminate results;
- console/page errors and failed network review;
- record screenshots only with placeholder credentials and synthetic data.

## 20. Explicit Non-Scope

- Ossie server proxy, relay, tunnel, gateway, secret injection, or CORS bypass;
- stored credentials, environments, request history, collections, or response
  history;
- cookies, query API keys, Basic auth, OAuth/OIDC, client secrets, mTLS;
- HTTP/private/localhost public targets;
- redirects of any kind;
- multipart, file upload, form-urlencoded, binary, streaming, SSE, WebSocket,
  GraphQL-specific tooling, callbacks, or webhooks;
- HEAD/OPTIONS/TRACE/CONNECT execution;
- arbitrary URL, method, header, JavaScript, HTML, MDX, React, iframe, widget,
  plugin, or vendor playground execution;
- vendor proxy/default playground;
- mock server;
- SDK generation/download/hosting;
- remote OpenAPI authority or external references;
- changing package format V1 or carrying/importing environment policy;
- making review/comments authorization for Try It;
- per-user target permissions or saved presets;
- analytics containing request details;
- configurable Organization quotas/reporting and production observability,
  which remain child `138`;
- translation, custom domains, Git/GitHub authority, realtime collaboration,
  permanent deletion, or cross-artifact search;
- Fumadocs/Scalar/Tiptap dependency adoption.

## 21. Commit Strategy For Later Implementation

1. `feat(documentation): define try-it contracts and request policy`
2. `feat(documentation): persist governed try-it configuration`
3. `feat(documentation): expose exact try-it configuration routes`
4. `feat(web): add safe api examples and browser-direct requests`
5. `test(documentation): prove try-it browser and privacy boundaries`
6. `docs(documentation): close child 137 api experience`

Do not stage unrelated user/agent changes. A migration/repository commit may
remain coupled where splitting would create an invalid schema/runtime boundary.

## 22. Exit Gate

Child `137` is complete only when:

- no production Ossie server code can send the target API request;
- exact operator/Admin origin governance and DNS checks pass;
- Site and Publish Link policies are disabled by default;
- exact Revision policy/request descriptors are immutable;
- existing sources/Publications remain safely read-only;
- public config follows exact link access and Publication identity;
- credential values remain browser-memory-only and pass unique-marker proof;
- confirmation, request bounds, no redirects, timeout/abort, local rate
  ceilings, and safe response rendering pass;
- examples are correct, escaped, and secret-free;
- review/comments/import/Carry-Forward/public reader compatibility passes;
- migration `030`, Audit, Access, tenant, concurrency, reset, and rollback
  tests pass;
- agent-browser/accessibility/privacy evidence passes;
- plan/master/docs/ADR records are truthful;
- scoped logical commits leave unrelated work untouched.

## 23. Checklist

### Planning

- [x] Sequence position reserved.
- [x] Actual independently closed child `136` result inspected.
- [x] Master `006`, Context, decision ledger, ADRs `0027`–`0032`, grill Q24,
      product/design guidance, and current code inspected.
- [x] Current routes, schemas, persistence, public reader, CSP/deployment,
      Audit/Access, permissions, fixture, and migration head mapped.
- [x] Implementation-ready expansion drafted.
- [x] Independent recheck completed.
- [x] Docs-only plan checkpoint committed.

### Implementation

- [ ] Shared contracts/domain policy implemented test-first.
- [ ] Migration `030` implemented and rehearsed.
- [ ] Site/link policy and exact configuration routes implemented.
- [ ] CSP/operator configuration implemented.
- [ ] Safe examples/request client/response renderer implemented.
- [ ] Portal policy/link/operation UX implemented.
- [ ] Audit/Access/tenant/concurrency/privacy coverage passed.
- [ ] Agent-browser evidence passed.
- [ ] Context/ADR/decision/master/docs updated.
- [ ] Scoped logical commits complete.

## 24. Planning Log

- 2026-07-30: Reserved from Master Plan `006`; no Try-It runtime or credential
  flow was added.
- 2026-07-31: Expanded against independently closed child `136`, Master `006`,
  accepted Q24, current migration head `029`, one-source OpenAPI persistence,
  immutable Revision/Publications, public operation routes, review gate,
  Audit/Access registries, Vite SPA deployment, and native reader.
- 2026-07-31: Resolved disabled-by-default Site and link policy, exact
  operator/Admin HTTPS origin governance, source-digest pinning, immutable
  Revision policy, descriptor-v0 compatibility, browser-memory credential
  lifecycle, no redirects, request/response ceilings, signed content-free
  attempt reporting, and static-SPA CSP deployment boundary.
- 2026-07-31: Kept Fumadocs/Scalar adoption, server proxy, stored
  credentials/environments, OAuth, SDKs, mocks, package-format changes,
  Carry-Forward inheritance, and operational reporting outside this child.
- 2026-07-31: Independently rechecked the plan against Master `006`, the closed
  child `136` implementation/handoff, accepted Q24, current authorization and
  Access Evidence mechanics, Source apply/import/Carry-Forward paths,
  Revision/Publication digests, public snapshot projection, and Vite CSP
  delivery.
- 2026-07-31: Removed duplicate Try-It capabilities in favor of exact existing
  `documentation.read`/`documentation.site.manage` mappings; corrected
  multi-version link enablement to compatible-default plus per-entry
  classification; and made publication/review command receipts independent.
- 2026-07-31: Closed unsafe gaps around strict public projections,
  descriptor-v0 digest compatibility, mutable-versus-frozen allowance
  references, Access-only attempt outcomes, expiring policy identity,
  reflected-secret redaction, cookie omission, URL/template encoding,
  no-stream/decompression response bounds, and truthful CORS/CSP failure
  classification.

## 25. Planning Verification Record

This expansion inspected:

- child `136` final implementation, close-recheck evidence, and child `137`
  handoff;
- Master `006` architecture, contracts, authorization, Audit/Access, OpenAPI,
  CSP/security, performance, child `137`, and handoff sections;
- accepted Documentation terminology and ADR boundaries;
- the complete Q24 origin/credential/request/response/example decision;
- current OpenAPI parser/domain projection;
- migration `025` OpenAPI and Publication tables, migration `027` frozen source,
  and migration head `029`;
- Documentation repository/service/routes and public exact-operation resolver;
- portal API adapter, OpenAPI panel, draft preview, block renderer, public
  reader, Publishing panel, and permissions;
- current Vite/API deployment and absence of dynamic reader CSP;
- current Audit/Access/foundation/reset/fixture ownership.

This planning pass changes only this child-plan document. It adds no runtime,
migration, schema, API, dependency, lockfile, Context, ADR, decision, Master, or
browser-evidence change.

Independent recheck verification:

- every required existing file named by the plan was confirmed against the
  current repository; new files remain explicitly marked;
- migration head `029` and reservation `030` were confirmed;
- current Source apply deletes/recreates mutable operations, so the plan now
  deliberately preserves stale mutable policy while requiring composite
  immutable Revision references;
- current public Site/operation record spreads were identified and made an
  explicit strict-projection security requirement;
- current capability ownership proved that `publish_link.manage` is
  Editor-accessible, so Admin-only Try-It policy uses
  `documentation.site.manage`;
- current Access Event schema/response hook cannot store arbitrary details, so
  attempt outcome uses exact allowlisted non-transport actions without a JSON
  evidence field;
- child `136` review summary, typed gate errors, command receipts, evidence,
  and public-private boundaries remain unchanged except for the safe
  `openapi_changed` summary signal;
- Master `006` goal, scope, security, browser, exit, and child `138` handoff are
  covered without expanding to proxy/OAuth/storage/SDK/framework scope;
- Prettier, Markdown structure inspection, exact scoped status, and
  `git diff --check` passed before the planning checkpoint commit.

## 26. Leftovers And Handoff To Child 138

Child `138` receives:

- measured request/config/report rates and failure categories without content;
- operator diagnostics for mismatched server/web origin ceilings;
- configurable Organization quotas only if justified by measurement;
- production observability with credential/content redaction;
- bundle splitting if the operation experience materially grows the reader;
- production performance and capability-dependent browser expansion;
- review of DNS validation caching/TTL and deployment reload ergonomics.

Child `138` must not weaken:

- browser-direct-only execution;
- exact-origin/operator ceiling;
- memory-only credentials;
- no redirect;
- exact immutable Publication projection;
- link-specific disabled-by-default policy;
- content-free evidence.

Later work retains OAuth, stored environments, server proxying, SDK generation,
file/streaming requests, custom domains, and private-network targets.
