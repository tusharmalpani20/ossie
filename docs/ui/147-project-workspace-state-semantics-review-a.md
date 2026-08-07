# Plan 147 — Project workspace state semantics review A

Candidate: `e94d6a9`
Surface: `projects-workspace`
Cycle: 3 (final allowed cycle)
Reviewer: visual and interaction review
Verdict: `incomplete` — do not accept for human review as a shipped surface

## What was reviewed

- `ProjectWorkspacePage` loading, unauthenticated, not-found, and recoverable
  error branches.
- The focused component contract: `ProjectWorkspacePage.test.tsx` passes 9/9.
- The shared shell and adjacent Project list contracts: focused tests pass
  21/21.
- The actual browser entry at `/projects/project_1` on the local runner.

## Findings

The component-level hierarchy is clearer: each transient branch has a level-one
`Projects` heading; loading exposes `role=status`; recoverable failure exposes
`role=alert`; the existing sign-in link and Retry action remain in place. The
CSS additions are small and preserve the existing state spacing.

The normal browser route does not mount this component. `App.tsx` sends
`project_workspace` to `LegacyProjectRedirect`, which calls `getProject` and,
on the local unauthenticated 401, renders the existing plain `Project was not
found.` fallback. The browser therefore cannot verify the candidate's visual
composition, responsive behavior, focus treatment, or axe result. The route
measured 1440px without overflow, but axe reported the existing missing-h1
violation on the redirect fallback; that result is not candidate evidence.

## Disposition

Do not claim desktop/narrow screenshots, runtime axe results, or shipped route
behavior for `e94d6a9`. Wiring `ProjectWorkspacePage` into the legacy project
route would change route ownership and normal navigation behavior, so it is a
human-direction item outside this bounded state-semantics cycle.

