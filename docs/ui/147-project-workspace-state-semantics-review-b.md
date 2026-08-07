# Plan 147 — Project workspace state semantics review B

Candidate: `e94d6a9`
Surface: `projects-workspace`
Cycle: 3 (final allowed cycle)
Reviewer: product, accessibility, and engineering review
Verdict: `needs_human_surface`

## Contract review

The candidate changes only `ProjectWorkspacePage`, its focused tests, and its
module CSS. It does not alter API calls, Project or Project Version data,
membership/tenant checks, permissions, public links, persistence, or mutation
handlers. The focused component suite passes 9/9; adjacent Project list and
PortalAppShell tests pass 21/21.

The loading/status and recoverable-error/alert semantics are appropriate at the
component boundary, and the existing retry and sign-in URL behavior is
preserved. Not-found remains a non-revealing message without an invented
recovery action.

## Blocking finding

The actual `App` route graph does not render `ProjectWorkspacePage`. The
`/projects/:projectId` route is owned by `LegacyProjectRedirect`; the local
unauthenticated browser check received API 401 responses and rendered the
legacy plain-text fallback with no level-one heading. As a result, this
candidate has no truthful browser proof for the branch semantics it changes.

Selecting whether the legacy redirect should be replaced, wrapped, or left as
the canonical route is a route-ownership/product decision, not a routine CSS
or ARIA repair. No routing change was made.

## Disposition

Keep `e94d6a9` as a reversible source/test candidate, mark the surface
`needs_human_surface`, and require an explicit route-ownership decision before
any further implementation or acceptance. Do not treat the component tests as
proof that the normal browser route ships these states.

