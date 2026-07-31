# Child 136 Browser Evidence

Date: 2026-07-30

Environment:

- deterministic `documentation-browser-fixture` in the disposable testing
  database;
- local server on `http://localhost:3002`;
- local Vite portal on `http://localhost:3000`;
- headless Chromium driven through `agent-browser`;
- isolated Admin and Viewer browser sessions.

## Journeys Passed

- Admin opened the exact Project Version Documentation Site, loaded the
  Edition-owned optional policy, candidate list, request history, and
  Publication Review Evidence.
- Viewer opened the Project-Version review inbox, saw one unread content-free
  notification, marked it read, and confirmed the read filter retained it.
- Viewer followed the safe display context to the exact Site/Revision request,
  saw decision controls only for their own active assignment, and could not see
  request cancellation controls.
- Viewer approved the exact Revision. The request transitioned to `approved`
  and retained immutable decision history.
- Admin changed the policy to `approval_required`; a reload showed the
  Publishing panel's exact gate as `approved`.
- Admin evidence history showed successful Publication/rollback outcomes
  without exposing private reasons in list responses. Admin-only reason detail
  was fetched only through an explicit evidence-detail action; a
  non-overridden entry rendered `Not overridden`.
- Direct Viewer access to the inbox remained correctly rooted at the resolved
  Project Version after authorization and did not produce a false
  not-found/availability failure.

## Accessibility And Privacy

- Automated axe evaluation with WCAG 2 A/AA tags reported zero violations.
- One color-contrast check was incomplete because the tool could not determine
  the effective background behind generic textarea controls; no failure was
  asserted from that incomplete result.
- Review list/inbox labels contain Site name, Revision/request numbers, state,
  and timestamps only. No Page body, comment, decision reason, override reason,
  credential, or raw protected content appeared.
- Public reader output was not changed by the review workflow and review state
  is absent from public contracts/projections.

## Captured Artifact

- `docs/ui/136-documentation-review-and-approval-workflow.png`

## Capability Boundary

This evidence covers the representative Chromium Admin/Viewer workflow,
permissions, inbox read state, exact approval, policy gate, evidence summary,
and automated accessibility scan. Cross-browser Firefox/WebKit coverage,
production-p75 performance, retention reporting, and full operational failure
injection remain child `138` scope under Master Plan `006`.
