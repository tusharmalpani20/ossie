# Child 125 Browser Evidence: Capture Portal UI

Date: 2026-07-26

Scope:

- Capture Session list and detail route ownership.
- Archived Project Version read-only behavior.
- Named Project Version Guide and Interactive Demo generation entry points.

## Result

Full browser acceptance was blocked.

Reason:

- `agent-browser` is installed locally.
- This checkout does not provide the seeded authenticated local fixture required
  by child `125`.
- The missing fixture needs admin/editor and viewer sessions, active/default,
  named, and archived Project Versions, and representative Capture Session
  states with safe synthetic assets.

No screenshot evidence was captured, and no full browser matrix is claimed from
unit tests.

## Verified By Automated Checks

The browser-visible behavior changed in this child is covered by focused web
tests:

- Archived Project Version Capture list routes render read-only and hide the
  `New Capture Session` action.
- Named Project Version Capture Session detail can create Guide and Interactive
  Demo artifacts and redirect to canonical Project Version artifact routes.

Commands run:

```bash
rtk pnpm --filter web test -- AppCaptureRoutes.test.tsx
rtk pnpm --filter web test -- src/features/capture-session/CaptureSessionDetailGeneration.test.tsx
rtk pnpm --filter web test -- src/features/capture-session/CaptureSessionDetailGeneration.test.tsx src/features/capture-session/ProjectCaptureSessionListPage.test.tsx
rtk pnpm --filter web test -- src/features/capture-session/CaptureSessionDetailPage.test.tsx
rtk pnpm --filter web test -- src/features/capture-session AppCaptureRoutes.test.tsx
rtk pnpm -r --if-present test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

## Carry Forward

Before claiming full Capture portal browser acceptance, create or reuse a safe
authenticated local fixture with:

- one active Project;
- Default Project Version `Main`;
- one named active Project Version;
- one archived Project Version;
- one Project Admin or Editor session;
- one Viewer session or safe mocked equivalent;
- draft, capturing, completed, canceled, and archived Capture Sessions;
- at least one manual Capture Session with safe screenshot assets and events;
- one empty draft Capture Session that can be reassigned.
