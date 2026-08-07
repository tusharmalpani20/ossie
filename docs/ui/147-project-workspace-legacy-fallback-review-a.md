# Plan 147 — legacy Project redirect fallback review A

Candidate: `879a1bd`
Surface: `projects-workspace` — route-neutral legacy redirect fallback
Cycle: bounded continuation after `e94d6a9`; does not reopen the workspace
route-ownership cycle
Reviewer: visual and interaction review
Verdict: `accept` — bounded fallback only, pending human review

## What was reviewed

- The `LegacyProjectRedirect` loading and failed-fetch presentation in
  `apps/web/src/App.tsx`.
- The two focused App tests covering the unresolved loading request and the
  404 failure response.
- Fresh local Chromium evidence for the real anonymous
  `/projects/project_1` entry at desktop, 390px narrow, and native Page zoom
  200%.

## Findings

The fallback now has a clear level-one heading in both transient branches:
`Opening Project` while the existing Default Project Version redirect is
pending, and `Project not found` when the existing project request fails. The
loading copy remains the existing copy and is announced through `role=status`;
the existing failure copy is announced through `role=alert`. The change uses
the existing `App` page/main/title styles, so it adds hierarchy and assistive
technology affordance without introducing a new visual treatment or changing
the successful redirect composition.

The real route remained `/projects/project_1`; the anonymous API request
returned the expected `401`, and no route navigation, retry control, or
mutation was introduced. At 1440×900, 390×844, and native Chrome Page zoom
200% (`dpr=2`, 525px CSS width), the fallback stayed within the document
viewport. The browser audit reported axe 0 violations at each sampled state;
console output contained only expected Vite/React development notices and the
request log contained the expected public-instance 200 and Project 401
responses. The fallback has no interactive controls, so Tab correctly left the
body without inventing a recovery action.

## Disposition

Accept this narrow presentation correction as a reversible candidate pending
human review. It does not accept `ProjectWorkspacePage`, does not provide
runtime evidence for that component, and does not resolve whether
`/projects/:projectId` should remain owned by `LegacyProjectRedirect`. That
route-ownership decision remains a human-direction item.
