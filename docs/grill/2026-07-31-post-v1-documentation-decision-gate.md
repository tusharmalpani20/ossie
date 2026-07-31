# Post-V1 Documentation Decision Gate

Date started: 2026-07-31

Status: In progress. Q1 is open for explicit user/product authority. No
post-V1 capability, Master `007`, child `141`, ADR, runtime change, or roadmap
commitment is accepted by this record yet.

Parent:

- `docs/plan/140-post-v1-documentation-decision-gate.md`

Shipped baseline:

- `docs/plan/139-documentation-v1-final-closeout.md`
- `docs/plan/master/006-documentation-platform-v1-master-plan.md`
- `CONTEXT.md`
- `docs/documentation-domain-decisions.md`
- accepted ADRs `0021` through `0033`

## 1. Session Boundary

This is an interactive decision session, not Product Documentation runtime
implementation.

The session may:

- inspect shipped V1 evidence;
- research opened candidates using current primary sources;
- recommend, compare, accept, defer, or reject future direction;
- update canonical decision documents after final acceptance;
- create accepted ADRs;
- close Master `006`;
- create one correctly owned Master `007` and bounded child reservations if
  next implementation is explicitly accepted.

The session must not:

- edit runtime, schema, migrations, routes, shared types, dependencies, UI, or
  browser behavior;
- treat a candidate as accepted merely because it is discussed;
- claim an accepted decision is implemented;
- create both Master `007` alternatives;
- choose legal/privacy/retention policy without authorized user input;
- hide a V1 defect in future scope.

## 2. Execution Baseline

Repository facts at session start:

- repository: `/home/ubuntu/ossie`;
- branch: `main`;
- commit: `df409d0cf9e4d8b5b1abd91a451a999e7d90ae7c`;
- worktree: clean;
- commits after the independently rechecked Plan `140`: none;
- migration head: `031_documentation_v1_operational_hardening.sql`;
- children `132` through `139`: complete and independently close-rechecked;
- child `139`: no unresolved S1/S2;
- Master `006`: active only because child `140` remains open;
- Master `007`: absent;
- child `141`: absent;
- accepted ADR head: `0033`;
- no post-V1 candidate: accepted.

## 3. Shipped V1 Facts

Product Documentation V1 currently provides:

- stable Project-owned Documentation Sites;
- one Site Edition per Site and Project Version;
- relational Working Draft Pages, Navigation, Snippets, Assets, redirects,
  OpenAPI Sources, private comments, settings, and search state;
- resource Row Versions and recoverable stale-write conflicts;
- complete immutable Site Revisions and exact Site Publications;
- stable multi-version Publish Links with link-wide access policy;
- exact-Publication public reader, search, metadata, assets, operations,
  aliases, redirects, and intentional `gone` behavior;
- database-authoritative constrained non-executable content;
- protected shared Files;
- inspected import/export portability;
- internal exact-Revision review and optional publication gates;
- browser-direct origin-governed Try It with memory-only credentials;
- Organization quotas, publication admission, search recovery, diagnostics,
  and projection-rebuild operations;
- append-only content-free Audit and Access Evidence.

PostgreSQL plus protected File storage remains authoritative. Git, Markdown,
ZIP exports, editor state, browser state, Fumadocs, Tiptap, and public caches
are not authority.

## 4. Shipped Verification And Limitations

Child `139` records:

- server: 126 files / 547 tests;
- web: 83 files / 442 tests;
- database: 24 files / 88 tests;
- V1 smoke: 1 file / 2 tests;
- repository docs: 4 files / 12 tests;
- all workspace type-check/build tasks passing;
- no unresolved S1/S2 after independent close-recheck;
- sanitized Headless Chrome Owner, Viewer, public, accessibility, responsive,
  motion, cache, search, routing, and local performance evidence.

Known limitations:

- no shipped user-feedback dataset is recorded;
- no production p75 telemetry is recorded;
- Chromium is the only locally proven browser;
- no supported installed screen reader was available for real assistive-
  technology evidence;
- one editor axe contrast result remained incomplete rather than violated;
- pg-9 overlapping-query compatibility remains future maintenance;
- server lint warnings remain recorded debt;
- admission/rate limiting is in-process;
- publication is synchronous;
- File storage is local;
- customer-content retention is manual and has no governed permanent deletion.

These limitations are evidence, not automatic authorization for a feature.

## 5. Disposition Vocabulary

Every opened decision must end as exactly one:

| Disposition    | Meaning                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| `accept-next`  | Accepted and selected for the one next separately reviewed implementation master.            |
| `accept-later` | Accepted in principle but outside the next sequence, with prerequisite and reopen trigger.   |
| `defer`        | No commitment; missing evidence/authority and reopen condition are explicit.                 |
| `reject`       | Explicit non-goal under the recorded rationale; reopening requires a new decision and proof. |

Answers remain provisional until the complete cross-question ledger is
reconciled and explicitly accepted by the user.

## 6. Evidence Labels

- **Fact:** shipped code/schema/test/decision or cited primary source.
- **Inference:** conclusion reasoned from facts.
- **Preference:** product/user choice.
- **Unknown:** missing evidence.
- **Decision:** explicit user/product authority.

Inference and preference must not be written as shipped fact.

## 7. Candidate Ledger

| Question | Candidate                                                       | State      | Provisional disposition | Final authority |
| -------- | --------------------------------------------------------------- | ---------- | ----------------------- | --------------- |
| Q1       | First post-V1 problem and priority                              | Open       | None                    | Pending         |
| Q2       | GitHub App proposals and export automation                      | Not opened | None                    | Pending         |
| Q3       | Bidirectional Git/conflict/branch/PR/force-push semantics       | Not opened | None                    | Pending         |
| Q4       | Translation identity, fallback, and workflow                    | Not opened | None                    | Pending         |
| Q5       | Custom domains                                                  | Not opened | None                    | Pending         |
| Q6       | Public feedback                                                 | Not opened | None                    | Pending         |
| Q7       | Public analytics                                                | Not opened | None                    | Pending         |
| Q8       | External reviewer access                                        | Not opened | None                    | Pending         |
| Q9       | Realtime collaboration and presence                             | Not opened | None                    | Pending         |
| Q10      | Offline editing and merge                                       | Not opened | None                    | Pending         |
| Q11      | Governed permanent deletion and retention                       | Not opened | None                    | Pending         |
| Q12      | Cross-artifact and Organization-wide search                     | Not opened | None                    | Pending         |
| Q13      | Rich interactive components                                     | Not opened | None                    | Pending         |
| Q14      | SDK generation                                                  | Not opened | None                    | Pending         |
| Q15      | Advanced publication distribution                               | Not opened | None                    | Pending         |
| Q16      | Tooling and operational follow-up                               | Not opened | None                    | Pending         |
| Q17      | Final prioritization, next-master ownership, and child sequence | Not opened | None                    | Pending         |

## 8. Q1 — What Problem Should The First Post-V1 Slice Solve?

### Why this question is open

Master `006` intentionally deferred multiple attractive capabilities. A useful
next sequence needs one evidence-backed problem and target user rather than an
omnibus feature list.

### Facts

- Product Documentation V1 is implemented and independently close-rechecked.
- The repository records no unresolved S1/S2 V1 defect.
- The repository records no production user-feedback dataset.
- The repository records no production p75 telemetry.
- The deferred candidate list spans different users, trust boundaries,
  infrastructure owners, and legal/privacy requirements.
- Organization-wide deletion and cross-artifact search are inherently
  cross-product; most other candidates can be Documentation-owned only if
  their first slice remains isolated.

### Inference

Selecting a feature from technical attractiveness alone risks building the
wrong next slice and prematurely committing to its security, privacy,
retention, and infrastructure costs.

### Recommendation

Choose **no immediate post-V1 implementation** unless there is concrete product
evidence not present in the repository: a named target user, a painful current
workflow, why V1 does not solve it, expected value, and a bounded success
measure.

Under this recommendation:

- Q2–Q16 are still discussed and explicitly deferred/rejected/accepted-later
  as appropriate;
- Master `006` closes after the ledger is accepted;
- no Master `007` is created now;
- a candidate can reopen when its evidence trigger is met.

This is a `defer`, not a rejection of all future Documentation work.

### Alternative

Select one known priority now. The user should name:

- target user;
- current workflow/problem;
- evidence or strategic reason;
- desired result;
- why it should be next;
- acceptable first-slice boundary.

The selected track still must pass its own Q2–Q16 security and authority gate.

### Rejected shortcut

Do not accept all candidates, create a mixed catch-all Master `007`, or infer
priority from the order of the candidate list.

### Security, permission, source-of-truth, and lifecycle impact

Q1 itself changes none. It selects planning priority only. Every selected
candidate must retain V1 authority until its later question explicitly accepts
a safe future boundary.

### Migration, API, UI, URL, and compatibility impact

None in child `140`. A selected candidate receives capability-level impact
analysis in its own question and exact contracts only in a future
implementation-ready child.

### Reversibility

Highly reversible. Deferring now preserves the option to reopen any candidate
with better evidence. Selecting a candidate is still only a planning decision,
not runtime implementation.

### Evidence gap

The repository cannot determine the user's current business priority, target
customer, or external product evidence.

### Provisional disposition

Pending explicit user authority.

### Decision requested

Choose one:

1. **No immediate post-V1 implementation** — recommended. Complete the gate,
   explicitly disposition every candidate, close Master `006`, and create no
   Master `007`.
2. **Select one priority** — provide the target user, concrete problem,
   evidence/strategic reason, desired result, and acceptable first slice.

Final decision: Pending.

## 9. Questions Not Yet Opened

Q2 through Q17 remain unmade. Their full implementation-safe question
contracts are defined in Plan `140`. They will be copied into this record one
at a time with current primary-source research only when opened.

## 10. Session Log

- 2026-07-31: started from clean `main` commit `df409d0`; no implementation
  drift existed after the independently rechecked Plan `140`.
- 2026-07-31: recorded shipped V1 facts, verification, limitations,
  disposition vocabulary, evidence labels, and the unopened candidate ledger.
- 2026-07-31: opened Q1. No provisional or final disposition has been recorded.

## 11. Verification Record

Initial checkpoint verification:

- Prettier over the grill record and child `140`: passed;
- `git diff --check`: passed;
- scoped path check: passed; only the grill record and child `140` changed;
- baseline drift check: passed; no commit exists after the independently
  rechecked plan checkpoint;
- candidate ledger: all Q1–Q17 entries present, with Q1 open and every other
  question explicitly unopened;
- no Master `007`, child `141`, ADR, runtime, schema, route, dependency, or
  browser artifact was created.

No runtime tests, migrations, dependency operations, or agent-browser sessions
are required for this documentation-only checkpoint.

## 12. Current Handoff

Awaiting explicit user/product authority for Q1. Do not open Q2 until Q1 is
recorded.
