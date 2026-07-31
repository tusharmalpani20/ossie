# ADR 0033: Documentation Try It Is Browser-Direct And Origin-Governed

Date: 2026-07-31

Status: Accepted and implemented by child `137`

## Context

Documentation readers need runnable API examples without making Ossie a
credential store, target-API proxy, SSRF surface, or CORS bypass. Mutable
OpenAPI sources and stable Publish Links also cannot silently change the
authority of an immutable Site Revision or Publication.

## Decision

- The reader browser sends the target request directly. Production Ossie server
  code validates policy and records content-free outcomes but never transports
  target request or response content.
- Deployment operators configure an exact HTTPS-origin ceiling. A Project Admin
  chooses one origin, optional base path, supported credential modes, and an
  explicit operation allowance within that ceiling.
- Origin approval fails closed for malformed, wildcard, non-HTTPS, unresolved,
  mixed public/private, or non-public DNS results. The web build and server
  expose matching deterministic origin-set digests; a mismatch disables Send.
- A Site Revision freezes the exact descriptor-v1 OpenAPI operation and effective
  Site policy. Existing descriptor-v0 sources and Publications stay readable
  but never gain execution authority.
- Every Publish Link remains disabled independently until a Project Admin opts
  it in. Link access, review approval, and Try-It target authority remain
  separate decisions.
- Bearer tokens and supported header API keys exist only in component memory.
  Requests use `credentials: omit`, `redirect: error`, no referrer, and no
  cache. Credentials are cleared on close, navigation, unmount, and refresh.
- Every send requires confirmation. Mutating methods require an additional
  explicit acknowledgement. Request/response bounds, local rate limits,
  timeout/Abort, active-content refusal, and exact-value redaction apply before
  display.
- Generated curl, Fetch, and Python examples use placeholders and never contain
  entered credential values.
- Configuration responses and attempt reports are private/no-store. Reports
  contain only a short-lived scoped token and an allowlisted outcome; Access
  Evidence contains no URL, headers, body, credential, response, or status.

## Consequences

Target CORS, TLS, DNS, authentication, and rate policy remain authoritative and
may block a browser-direct request. Ossie explains that boundary and never
offers a relay workaround. Operators must rebuild the SPA and deploy a matching
`connect-src` policy when changing the origin ceiling. A request already
dispatched by a browser cannot be recalled; policy changes affect newly issued
short-lived configurations.

This ADR does not introduce stored environments, cookies/query credentials,
OAuth, client secrets, mTLS, redirects, private-network targets, file or stream
uploads, arbitrary methods/headers/URLs, mock servers, SDK generation, or a
server-side target transport.
