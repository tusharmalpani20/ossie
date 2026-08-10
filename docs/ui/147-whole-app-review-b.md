# Plan 147 — Independent Whole-App Review B

Date: 2026-08-07

Candidate reviewed: the current whole-app UI-quality worktree after the
recovery-state and fail-closed publishing fixes. This is an independent audit;
it is not the final human review.

## Verdict

Revise. No P0 findings.

## Findings and reconciliation

The audit reported a P1 concern that Admin override controls could appear while
the Review gate was loading or failed, creating a possible null dereference
through `reviewGate!.policy_version`. The current worktree resolves this:

- `reviewOverride` requires both a ready gate and a non-null gate object.
- Publish, publish-to-existing, and rollback handlers independently fail closed
  when the gate is not ready.
- Override controls are rendered only after a ready gate is present.

The audit also described one publishing test as red because it clicked before
the gate was ready. A current rerun of that file is green: 9 tests passed.

## P2 findings

1. Destructive `Alert` instances defaulted to `role="status"`, and several
   mutation errors therefore had weaker screen-reader announcements. The
   shared `Alert` now defaults destructive variants to `role="alert"`, while
   explicit caller roles remain supported.

## Verification reported by the audit

- Targeted web tests reported: 14 files, 70 passed / 1 failed in the audit's
  earlier bounded run.
- UI tests: 5 files, 15 passed.
- Type-check, lint, production build, and `git diff --check`: passed.
- Browser spot checks at 390px showed branded, unclipped Guide/Documentation
  retry states with no console errors.
- The full web-suite invocation did not produce completion output during the
  bounded run, so that audit did not claim it green.

## Current coordinator recheck

The publishing gate concern and test timing observation were reconciled after
the audit: the override is now hidden until a ready gate exists, direct
publish/rollback handlers fail closed, and the publishing test awaits the gate.
The shared destructive `Alert` now announces as `role="alert"`. The current
full web suite passes 95 files and 548 tests.

## Exact references from the audit

- `apps/web/src/features/documentation/DocumentationPublishingPanel.tsx:259`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.tsx:649`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.test.tsx:423`
- `packages/ui/src/alert.tsx:30`
- `apps/web/src/features/project/ProjectListPage.tsx:304`
- `apps/web/src/features/extension/BrowserExtensionPage.tsx:196`
