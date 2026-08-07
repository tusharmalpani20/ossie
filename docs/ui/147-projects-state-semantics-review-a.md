# Plan 147 projects-state-semantics review A

Candidate: `aa6f892`  
Starting commit: `e67d392`  
Preflight commit: `36d77f6`  
Cycle: 2 follow-up to the `projects-workspace` surface  
Reviewer: A — visual and interaction quality  
Verdict: `accept`

## Scope

This bounded candidate improves only the transient loading and recoverable
error states of the existing Project list. Both states now retain a clear
`Projects` page heading. Loading exposes its message as status text; the
recoverable error exposes its message as an alert and keeps the existing Retry
action.

## Visual and interaction review

- The loading and error cards share the existing Project state composition and
  do not introduce a competing visual system.
- The error state has a clear hierarchy of `Projects`, explanation, and Retry;
  the recovery action remains easy to find at desktop and narrow widths.
- The narrow navigation continues to wrap inside the viewport, and the state
  card remains bounded without clipped text or horizontal page overflow.
- Loaded Project content was not visually changed; the adjusted async tests
  wait on stable loaded content after the new transient heading appears.

## Evidence

- [Error desktop](./147-projects-state-error-after-desktop.png)
- [Error narrow](./147-projects-state-error-after-narrow.png)
- Loading semantics are covered by the deterministic ProjectListPage test;
  the available browser route tool can abort or return a response but cannot
  delay a local response safely enough to capture a truthful loading frame.
- Browser audits at 1440×1000 and 390×900 report axe 0 violations / 0
  incomplete, one level-one `Projects` heading, visible Retry, and body/
  document width equal to the viewport.

## Disposition

Accept pending human review. No blocking visual or interaction finding remains.
Actual browser zoom control remains unavailable in this environment.
