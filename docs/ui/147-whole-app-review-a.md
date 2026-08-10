# Plan 147 — Independent Whole-App Review A

Date: 2026-08-07

Candidate reviewed: the current whole-app UI-quality worktree after the
recovery-state and fail-closed publishing fixes. This is an independent audit;
it is not the final human review.

## Verdict

Revise. No P0 or P1 findings.

## P2 findings

1. Nested `<main>` landmarks can appear during Documentation lazy loading and
   error states. `DocumentationSuspense` renders a `<main>` fallback/error
   wrapper while project Documentation routes already render inside
   `PortalAppShell`'s `<main>`. Use a non-landmark wrapper for fallback/error
   states.

2. OpenAPI Try It policy-load failure is silently ignored in
   `DocumentationOpenApiPanel.tsx`. The UI retains default `false`/`null`
   policy state and still exposes Save. Add explicit loading/error/retry and
   prevent saving until policy state is known.

3. Interactive Demo workbench panels use 12px corners, exceeding the accepted
   8px panel maximum in `DESIGN.md`.

4. Public Interactive Demo does not reset to loading when route props change.
   SPA navigation between public demo links can briefly show stale published
   content.

5. Private Documentation comment mutations have no visible failure handling or
   in-flight disabling. Rejected requests have no retry/status feedback.

## Verification reported

- Web tests: 95 files, 545 tests passed.
- UI tests: 5 files, 15 tests passed.
- TypeScript, ESLint, CSS-token check, and `git diff --check`: passed.
- Browser checked at 390×844: `/p/abc123` and `/projects`; axe reported 0
  violations on both.
- The local API returned 500, so authenticated/public success states could not
  be browser-verified.
- Confirmed current fixes for setup retry, Guide/Demo Revision retry,
  Documentation review boundaries, auxiliary recovery, publishing fail-closed
  behavior, lazy-route fallback, and filter-scoped pagination.

## Current coordinator recheck

After this report, the coordinator added the P2 recovery/polish fixes recorded
in the current worktree and reran the full web suite: 95 files and 548 tests
passed. The local API/browser success-state limitation remains unchanged.

## Exact references from the audit

- `apps/web/src/App.tsx:118` and `:733`
- `apps/web/src/features/portal/PortalAppShell.tsx:106`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.tsx:138` and
  `:510`
- `apps/web/src/features/interactive-demo/InteractiveDemoWorkbench.module.css:14`
- `apps/web/src/features/interactive-demo/InteractiveDemoSceneEditor.module.css:6`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx:35`
- `apps/web/src/features/documentation/DocumentationCommentsPanel.tsx:57` and
  `:125`
