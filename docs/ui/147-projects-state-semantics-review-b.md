# Plan 147 projects-state-semantics review B

Candidate: `aa6f892`  
Starting commit: `e67d392`  
Preflight commit: `36d77f6`  
Cycle: 2 follow-up to the `projects-workspace` surface  
Reviewer: B — product, accessibility, engineering, and adversarial QA  
Verdict: `accept`

## Gates

- Pass: the candidate changes only Project list loading/error markup and the
  focused compatibility assertions needed after making the transient heading
  discoverable. It does not change API/auth contracts, permission checks,
  tenant isolation, Project or Project Version semantics, public links, Capture
  immutability, or retry behavior.
- Pass: the loading heading assertion failed before implementation and passed
  after the change. The ProjectListPage suite passes 17/17; the adjacent shared
  shell tests pass 4/4; the App route suite passes 20/20.
- Pass: the clean full web suite passes 95 files / 498 tests. Web typecheck,
  lint, build, CSS-token check (130 definitions / 123 consumers), and diff
  check pass.
- Pass: loading uses a `role=status` message and recoverable error uses a
  `role=alert` message. The existing Retry button remains a keyboard-focusable
  control and the error browser snapshot shows the expected recovery shape.
- Pass: local browser evidence at desktop and narrow widths reports axe 0/0,
  one h1, no horizontal overflow, and no candidate page errors. The induced
  error used only a local aborted Project request and was removed after the
  check.

## Residual risk

The loading state has deterministic component-test evidence rather than a
browser screenshot because this runner's network router has no safe delayed
response mode. Authenticated owner/viewer Project fixtures, actual browser
zoom controls, and the wider Plan 147 state/matrix remain separate residuals.
This slice does not claim to resolve P2-001 or the broader Projects create and
workspace review.

## Disposition

Accept pending human review. Preserve the prior `projects-workspace` review
records and do not mark Plan 147 complete until human feedback and final
closeout requirements pass.
