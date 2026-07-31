# ADR 0034: Generated Documentation Request Examples Are Inert Projections

Date: 2026-07-31

Status: Accepted

## Context

Documentation V1 renders exact OpenAPI operations and supports a separately
governed browser-direct Try-It flow. Child `140`, Question 14, selected broader
copyable request examples as next work for curl, browser Fetch, Node.js, Python,
and Go, with an extensible language registry. A code example must not be
confused with an executed request or a maintained SDK package.

## Decision

- A generated request example is a deterministic, inert text projection of one
  exact accepted OpenAPI operation and one versioned language contract.
- Generation may use only the accepted descriptor fields and documented
  example/default values. Missing or unsupported information is reported
  instead of invented.
- Credentials and environment-specific values use visible placeholders.
  Entered Try-It credentials, browser memory, cookies, request/response bodies,
  and private configuration never flow into generated output.
- Generated text is escaped and displayed or copied; Ossie does not execute
  it, send a network request, install dependencies, or publish a package.
- Existing Project/Publication read authorization controls access. Generation
  grants no API-origin, credential, review, or publication authority.
- Publication output records enough language/generator version information to
  reproduce or preserve the exact rendered example.
- The initial registry covers curl, browser Fetch, Node.js, Python, and Go.
  Additional languages require bounded fixtures and the same security,
  determinism, compatibility, and accessibility contract.
- Full SDK archives, package-registry publication, generated dependency trees,
  and an SDK support promise remain deferred.

## Consequences

The example UI can grow without turning Ossie into a code-execution or software
supply-chain service. Generated examples may be incomplete when an OpenAPI
feature is outside the accepted descriptor subset; the UI must explain that
limit rather than claim a valid client. Try It remains a separate explicit
browser-direct action governed by ADR `0033`.

Tiptap and Fumadocs may present these examples only as replaceable UI adapters.
PostgreSQL, exact Site Revisions/Publications, accepted OpenAPI descriptors,
permissions, and Ossie-owned generation contracts remain authoritative.

Child `140` made no runtime, schema, route, migration, dependency, or browser
change. Implementation belongs to Master `007` and its separately expanded,
rechecked, and authorized request-example child.

## Sources

- `docs/grill/2026-07-31-post-v1-documentation-decision-gate.md`, Q14 and Q17
- `docs/plan/140-post-v1-documentation-decision-gate.md`
- ADR `0028`: database-authoritative constrained Documentation content
- ADR `0029`: authorized Publication reader adapter
- ADR `0033`: browser-direct, origin-governed Try It
