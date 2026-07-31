# Child Plan 140: Post-V1 Documentation Decision Gate

Date reserved: 2026-07-30

Date expanded: 2026-07-31

Status: In progress. The documentation-only decision session began on
2026-07-31 from clean commit `df409d0`. Q1 through Q5 are provisionally
recorded and Q6 is open for explicit user/product authority. Product
Documentation V1 remains implemented and independently close-rechecked through
child `139`; this child authorizes no runtime, schema, route, dependency, or
browser-visible implementation.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/139-documentation-v1-final-closeout.md`

Canonical shipped-decision baseline:

- `CONTEXT.md`
- `docs/documentation-domain-decisions.md`
- `docs/grill/2026-07-29-documentation-domain-grill.md`
- ADRs `0021` through `0033`

Planned decision-session record:

- `docs/grill/2026-07-31-post-v1-documentation-decision-gate.md`

Successor:

- None is authorized yet.
- If this gate accepts a Documentation-owned implementation objective, it must
  create and commit
  `docs/plan/master/007-documentation-post-v1-master-plan.md`.
- If the selected objective is inherently cross-product, such as governed
  Project/Organization deletion or Organization-wide cross-artifact search, it
  must instead create and commit
  `docs/plan/master/007-knowledge-platform-post-v1-master-plan.md`.
- The two Master `007` filenames are mutually exclusive. Q17 must select the
  correct owner and exact filename before either file is created.
- Any future implementation children begin at `141` and must be separately
  expanded, independently rechecked, and explicitly authorized.

## 1. Sequence Gate And Frozen Starting State

Child `140` may begin because child `139` is complete, independently
close-rechecked, committed, and free of unresolved S1/S2 defects.

Expansion baseline:

- repository: `/home/ubuntu/ossie`;
- branch: `main`;
- expansion commit:
  `18be224fdb00df434a480d2ff16f8e82b75edb10`;
- expansion worktree: clean;
- current migration head:
  `031_documentation_v1_operational_hardening.sql`;
- children `132` through `139`: complete, independently close-rechecked, and
  verified;
- Master `006`: active only because this final decision gate remains open;
- Product Documentation V1: shipped and current, not a proposal;
- no post-V1 candidate: accepted merely because it appears in this plan.

Before executing the decision session:

1. record `git rev-parse HEAD`, branch, and `git status --porcelain=v1`;
2. reread this child, Master `006`, child `139`, `CONTEXT.md`,
   `docs/documentation-domain-decisions.md`, and accepted ADRs `0021`–`0033`;
3. inspect every commit after the expansion baseline and reconcile any
   documentation, schema, route, dependency, security, or operational drift;
4. record every pre-existing worktree path and its owner;
5. do not edit, stage, format, or commit another user or agent's work;
6. confirm child `139` still has no unresolved S1/S2 defect;
7. stop and return a V1 defect to a separately scoped repair if the gate finds
   one; do not disguise a missing V1 repair as a post-V1 decision;
8. confirm the proposed grill filename still matches the actual session-start
   date. If the session starts after 2026-07-31, update this plan first and use
   the actual date consistently.

The gate fails closed if the starting state is dirty, contradictory, or no
longer matches the shipped V1 evidence.

## 2. Purpose

Use shipped Product Documentation V1 evidence to decide what, if anything,
should follow V1.

The child must:

- preserve V1 identities, access, immutable history, publication, public URL,
  protected File, Audit/Access, and database-authority guarantees;
- distinguish observed product facts from inference, preference, unknowns, and
  explicit product authority;
- open each candidate as a real decision question rather than a presumed
  roadmap item;
- provide a recommendation, alternatives, consequences, reversibility,
  security/privacy/retention impact, and implementation ownership before
  requesting a decision;
- record an explicit `accept-next`, `accept-later`, `defer`, or `reject`
  disposition for every opened candidate;
- create ADRs only for accepted durable decisions;
- close Master `006` without changing Product Documentation runtime;
- create a new master-level implementation sequence only if the user accepts
  post-V1 implementation scope.

This child is complete when decisions and planning ownership are explicit. It
is not complete merely because all candidates were discussed.

## 3. Decision Authority And Precedence

When sources disagree, use this order:

1. explicit user/product decisions recorded during this gate;
2. accepted ADRs `0021`–`0033`;
3. accepted child-`131` grill decisions and
   `docs/documentation-domain-decisions.md`;
4. canonical terms and relationships in `CONTEXT.md`;
5. shipped behavior and evidence closed by child `139`;
6. Master `006`;
7. implementation details in children `132`–`139`;
8. current-truth operator/contributor documentation;
9. external product examples and current technology research;
10. historical or provisional planning text.

Rules:

- Existing accepted V1 semantics remain authoritative unless this gate
  explicitly accepts a future change and records compatibility consequences.
- This gate cannot rewrite history to claim a future decision was part of V1.
- Current code is evidence of shipped behavior, not automatic authority for a
  new product decision.
- Competitor behavior and library capabilities are inputs, not product
  authority.
- Unknown evidence produces `defer`, not an invented answer.
- A recommendation from an agent remains provisional until the user accepts
  it.

## 4. Shipped V1 Baseline That Must Remain Stable

### 4.1 Domain and source of truth

Product Documentation V1 currently provides:

- stable Project-owned Documentation Sites;
- at most one Site Edition per Site and Project Version;
- relational Site Working Drafts with Pages, Navigation, Snippets, Assets,
  redirects, OpenAPI Sources, private comments, settings, and search state;
- explicit resource Row Versions and recoverable conflicts;
- complete immutable Site Revisions;
- exact immutable Site Publications;
- stable multi-version Publish Links with one link-wide access policy;
- exact-Publication public reader, search, metadata, assets, operation pages,
  sitemap, robots, aliases, redirects, and `gone` behavior;
- protected shared File references;
- database-authoritative constrained content and inspected portability;
- internal exact-Revision review and optional publication gates;
- browser-direct, origin-governed Try It with memory-only credentials;
- Organization-owned quotas, publication admission, search generation
  recovery, diagnostics, and projection rebuild controls;
- append-only Audit and Access Evidence.

Relational PostgreSQL records plus protected File storage are authoritative.
Neither Git, Markdown, ZIP exports, editor state, Fumadocs, Tiptap, browser
state, nor public caches are authority.

### 4.2 Shipped migration and compatibility baseline

- Migrations `001` through `031` are immutable history.
- Documentation V1 was added by migrations `025` through `031`.
- Clean `001 -> 031`, `024 -> 031`, and `030 -> 031` paths are verified.
- Populated migration `031` rollback refuses to weaken shipped operational
  state.
- Existing Guide, Interactive Demo, Capture, extension, Publish Link, File,
  Audit, and Access behavior remains compatible.
- Existing descriptor-v0 API references remain readable and non-executable.
- Existing Documentation Package V1 and Markdown portability contracts remain
  supported.
- Existing Site Revisions and Site Publications remain immutable and
  resolvable subject to their access policy.

### 4.3 Shipped evidence baseline

Child `139` records:

- server: 126 files / 547 tests;
- web: 83 files / 442 tests;
- database: 24 files / 88 tests;
- V1 smoke: 1 file / 2 tests;
- repository docs: 4 files / 12 tests;
- all workspace type-check and production-build tasks passing;
- no known production dependency vulnerability at the recorded audit point;
- Headless Chrome Owner, Viewer, public, accessibility, responsive, reduced
  motion, routing, cache, search, and performance evidence;
- no unresolved S1/S2 defect after the independent close-recheck.

This gate may reference that evidence. It must not rerun or reinterpret it as
proof that an unbuilt post-V1 candidate works.

### 4.4 Accepted V1 limitations

The following are current limitations, not automatic child-`140` scope:

- Chromium is the only locally proven browser;
- no supported installed screen reader was available for recorded real
  assistive-technology evidence;
- production p75 telemetry is absent;
- one editor axe contrast check remained incomplete rather than violated;
- PostgreSQL client paths emit a future pg-9 overlapping-query warning;
- workspace lint passes its configured gate with recorded server warnings;
- admission/rate limits are in-process;
- publication is synchronous;
- File storage is local;
- customer-content retention is manual and has no governed permanent-deletion
  workflow.

The gate must assign these to `operational follow-up`, `candidate decision`, or
`accepted limitation`; it must not silently fold them into a product feature.

## 5. Required Disposition Vocabulary

Every opened question must end in exactly one state:

| Disposition    | Meaning                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accept-next`  | Durable direction accepted and selected for the next separately planned implementation master.                                                      |
| `accept-later` | Durable direction accepted in principle, but not selected for the next implementation sequence; prerequisites and review trigger are explicit.      |
| `defer`        | No product commitment. Missing evidence, unresolved risk, dependency, or authority is named, along with the evidence needed to reopen the question. |
| `reject`       | Explicit non-goal under the stated rationale. Reopening requires new evidence and a new decision, not routine implementation planning.              |

Do not use ambiguous labels such as `maybe`, `later` without an owner, `planned`,
`considering`, `future`, or `TBD`.

An accepted candidate must additionally record:

- durable semantic decision;
- why it is accepted;
- what remains undecided;
- first safe slice;
- explicit non-scope;
- prerequisites;
- affected terms and relationships;
- source of truth and ownership;
- roles and authorization;
- security/privacy/retention model;
- Audit and Access Evidence;
- persistence/migration implications;
- API/UI/public URL implications;
- backward compatibility;
- rollout and rollback direction;
- verification and browser requirements;
- future master/child owner.

## 6. Evidence Classification And Decision Ledger

### 6.1 Evidence labels

Every material statement in the grill record must be labeled or clearly
written as one of:

- `fact`: supported by current code, schema, tests, accepted decision, or
  primary source;
- `inference`: reasoned conclusion from facts;
- `preference`: product/user choice;
- `unknown`: evidence not yet available;
- `decision`: explicitly accepted user/product authority.

Do not present inference or preference as shipped fact.

### 6.2 Per-question ledger

Each question in the grill record must include:

1. question and why it is being opened;
2. shipped V1 facts;
3. user/problem evidence;
4. current primary-source research, if technology or external platform behavior
   matters;
5. recommended answer;
6. at least one viable alternative;
7. explicit rejected shortcuts;
8. threat and privacy analysis;
9. role/permission implications;
10. source-of-truth and lifecycle implications;
11. migration/API/UI/public URL implications;
12. backwards-compatibility implications;
13. reversibility;
14. first safe implementation slice if accepted;
15. explicit non-scope;
16. affected future files/modules;
17. evidence gaps;
18. provisional disposition;
19. final user decision and date;
20. ADR required: `yes` or `no`, with rationale.

### 6.3 Evidence quality

- Use repository evidence before asking the user for discoverable facts.
- Ask the user for product priority, business policy, privacy posture, legal
  authority, target users, or other non-discoverable decisions.
- Technology/platform research must use current primary documentation and cite
  the direct source in the grill record.
- Do not copy credentials, private repositories, private domains, customer
  content, analytics payloads, user identifiers, or raw API responses into the
  decision record.
- If user feedback or production telemetry does not exist, record that absence
  honestly.
- Privacy, retention, deletion, consent, data residency, and external-review
  questions may require jurisdiction-specific legal authority. Engineering
  research must identify the issue but must not claim legal compliance or
  choose a lawful basis without the user's authorized policy/legal input.
- Record the research retrieval date and relevant platform/library version.
  A search result, blog, competitor page, or package README alone is not enough
  for a durable security or platform decision.

### 6.4 Minimum primary-source research map

Research only the tracks actually opened for a final decision:

| Track                          | Minimum current primary sources                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| GitHub App/proposal automation | GitHub App permission, installation-token, webhook validation/delivery, rate-limit, repository-content, pull-request, and audit docs |
| Git synchronization            | Git object/reference/merge behavior plus official GitHub branch-protection, force-push, webhook, and pull-request behavior           |
| Localization                   | IETF BCP 47 language tags, Unicode locale data guidance, and web-standard language/canonical metadata                                |
| Custom domains                 | DNS/ACME/TLS standards and the selected deployment/DNS/certificate provider's official ownership and lifecycle documentation         |
| Feedback/analytics             | Applicable regulator/standards authority, selected processor's data model/retention docs, and user-approved privacy/legal policy     |
| External reviewer identity     | Selected identity/delivery provider docs and applicable token/session/email-security standards                                       |
| Realtime/offline               | Selected protocol/library primary design and security docs plus relevant browser storage/service-worker standards                    |
| Permanent deletion             | User-approved legal/retention authority, database/File/backup provider deletion guarantees, and restore/replication behavior         |
| Cross-artifact search          | Selected index/database authorization, consistency, deletion, backup, and tenant-isolation documentation                             |
| Interactive components/SDKs    | Selected sandbox/generator/runtime primary docs, package license/provenance, and relevant browser security standards                 |
| Publication distribution       | Selected storage/CDN/deployment provider identity, atomicity, cache, signing, credential, rollback, and retention docs               |
| Adapter/operational follow-up  | Current official Fumadocs/Tiptap/browser/PostgreSQL/File-store/runtime docs for the exact proposed proof                             |

The grill record should cite direct sources near the claims they support and
separate sourced fact from Ossie inference.

## 7. Decision Session Agenda

The session should resolve one consequential question at a time. A later
question may depend on an earlier answer, but no answer becomes final merely
because another question assumes it.

### 7.1 Q1 — What problem should the first post-V1 slice solve?

Required decision:

- select one highest-value problem for `accept-next`, or explicitly decide
  there is no immediate post-V1 implementation;
- identify target user and workflow;
- identify observed evidence rather than feature enthusiasm;
- define measurable success and failure;
- name prerequisite operational work.

Recommended default:

- do not accept a capability track until a concrete shipped-V1 pain point,
  target user, security owner, and bounded first slice exist.

This question controls prioritization but cannot override safety decisions in
later questions.

### 7.2 Q2 — GitHub App proposals and export automation

Decide separately:

- one-way export automation;
- one-way import proposal creation;
- GitHub App installation/account/repository ownership;
- repository and branch selection;
- private repository, fork, submodule, Git LFS, binary Asset, and repository
  size behavior;
- webhook/event ingestion;
- pull-request proposal workflow;
- commit authorship, signing, status-check, and branch-protection behavior;
- whether imports target a new Site, an empty Site, or an explicit reviewed
  proposal;
- whether automatic apply is prohibited;
- credential/token storage and rotation;
- installation revocation and orphaned proposal behavior;
- GitHub API rate-limit, retry, duplicate delivery, and outage behavior.

Preserved boundary:

- PostgreSQL and protected Files remain Documentation authority unless a new
  ADR explicitly changes that model;
- Git commits, branches, and PRs must not silently mutate or publish a Site;
- existing Inspect/Apply portability remains the safe import boundary;
- exports remain snapshots and are not deletion.

Reject by default:

- broad repository write tokens;
- ambient user credentials;
- webhook payloads as trusted tenant scope;
- automatic publish on push;
- remote content as live public authority.

Evidence required before `accept-next`:

- exact target workflow;
- GitHub App permission matrix;
- installation/repository/Organization mapping;
- webhook authenticity/replay/order model;
- token storage/rotation/revocation model;
- proposal diff and human-approval path;
- duplicate/conflict/idempotency behavior.

### 7.3 Q3 — Git synchronization, conflict, branch, PR, deletion, and force-push semantics

Open only after Q2 distinguishes proposal/import automation from
bidirectional authority.

Decide:

- whether bidirectional sync is rejected, deferred, or accepted;
- canonical identity mapping for Site/Edition/Page/Snippet/Asset/OpenAPI;
- branch-to-Project-Version semantics, if any;
- rename versus delete detection;
- force-push/history rewrite behavior;
- merge conflict authority;
- concurrent Ossie and Git edits;
- PR merge, close, reopen, and revert behavior;
- publication and immutable Revision interaction;
- archived and permanently deleted content behavior.

Recommended default:

- keep bidirectional Git authority deferred or rejected until identity,
  deletion, merge, and credential semantics are independently accepted.

An `accept-next` result requires a dedicated durable ADR and cannot be bundled
into a generic “GitHub integration” checkbox.

### 7.4 Q4 — Translation identity, fallback, and workflow

Decide:

- locale identity and standards;
- whether locale belongs to Site, Site Edition, Page variant, or a separate
  translation artifact;
- primary language versus translation source;
- fallback chain and missing-page behavior;
- slug/canonical/hreflang behavior;
- locale-aware Navigation and search;
- immutable Site Revision and Publication completeness;
- Carry-Forward across Project Versions;
- review requirements and translator role;
- stale-translation detection;
- machine translation boundaries and provider data handling;
- public version/locale selector interaction.

Preserved boundary:

- `primary_language` in V1 remains a language declaration, not translation
  state;
- no existing Site identity or public URL may be reinterpreted retroactively;
- translation must not create mixed mutable/immutable public output.

Required security/privacy analysis:

- provider egress;
- confidential draft exposure;
- regional processing;
- prompt/log retention;
- tenant isolation;
- public cache key and search separation.

### 7.5 Q5 — Custom domains

Decide:

- ownership verification;
- DNS challenge type and expiry;
- apex/subdomain support;
- TLS issuance, renewal, and revocation owner;
- canonical host selection;
- redirect behavior between Ossie and custom hosts;
- one domain to Site/Publish Link mapping;
- domain reuse and transfer;
- Organization/Project role allowed to configure;
- restricted/password access and cookie/session host scope;
- CSP, CORS, Try-It origin, sitemap, robots, social metadata, and cache keys;
- deleted/revoked/expired link behavior;
- self-hosted versus managed deployment responsibility.

Preserved boundary:

- a custom domain is an access adapter to an exact Publish Link selection, not
  Publication authority;
- exact Site Publication identity and link-wide access remain unchanged;
- host-header input is never trusted without stored verified ownership.

An accepted direction must define takeover prevention, certificate failure,
stale DNS, and deprovisioning before implementation planning.

### 7.6 Q6 — Public feedback

Decide separately from private authoring comments:

- feedback type: rating, structured reason, free text, issue proposal, or none;
- anonymous versus authenticated identity;
- exact Publication/Page anchoring;
- moderation and abuse handling;
- spam/rate controls;
- public visibility;
- author notification;
- retention and deletion;
- export and data-subject access;
- whether feedback may ever become authoring content.

Preserved boundary:

- V1 private Page comments remain Project-member authoring workspace and never
  become public comments;
- feedback cannot mutate a Publication;
- public access never grants Project membership;
- free text must not enter Audit/Access Evidence or analytics by default.

Recommended default:

- reject public free-form comments as the first slice; if evidence supports
  feedback, begin with bounded structured feedback tied to an exact
  Publication/Page and a complete abuse/privacy model.

### 7.7 Q7 — Public analytics

Decide:

- product question analytics must answer;
- aggregate versus event-level data;
- first-party versus external processor;
- lawful/privacy basis and consent;
- IP, user agent, referrer, geography, session, and identity treatment;
- restricted/password link behavior;
- Do Not Track/global privacy control;
- retention, aggregation, deletion, and export;
- Organization/Admin visibility;
- tenant isolation;
- bot filtering;
- public performance telemetry relationship;
- whether analytics can influence search/ranking.

Preserved boundary:

- Access Evidence is security/operational evidence and must not be repurposed
  casually as product analytics;
- raw search queries, credentials, comment/review content, and Try-It request
  details remain excluded;
- analytics cannot weaken public cache or link-access isolation.

No analytics candidate can be accepted without an explicit privacy and
retention decision.

### 7.8 Q8 — External reviewer access

Decide:

- external identity model;
- invitation issuer;
- exact Site Revision or Review Request scope;
- expiration, revocation, resend, and reuse;
- email/domain requirements;
- read-only preview versus decision authority;
- comment capability;
- self-review and approval threshold rules;
- external reviewer reason/privacy;
- Access Evidence identity;
- link forwarding;
- Project membership conversion;
- notification delivery;
- Publication access after review closes.

Preserved boundary:

- V1 review is internal and never grants Project access;
- Review approval is not authorization to publish;
- public Publish Links are not review tokens;
- exact immutable Revision targeting remains mandatory.

Recommended default:

- use short-lived, exact-Review-Request capability plus verified external
  identity if accepted; do not overload public links or create implicit Project
  membership.

### 7.9 Q9 — Realtime collaboration and presence

Decide:

- whether realtime presence alone is useful without collaborative editing;
- authoritative document model;
- operation/CRDT/OT representation;
- server and persistence authority;
- participant identity and Project authorization refresh;
- reconnect and revoked-user behavior;
- Page versus Navigation/Snippet/OpenAPI/comment scope;
- undo/redo and checkpoint semantics;
- offline operation queues;
- conflict with current Row Version writes;
- immutable Revision creation;
- presence privacy and retention;
- horizontal scaling and failure behavior.

Preserved boundary:

- current relational Working Draft remains authoritative until a durable
  decision says otherwise;
- collaboration state cannot bypass constrained blocks, lifecycle, limits,
  review, Audit, or Publication validation;
- ephemeral presence is not durable authoring evidence.

An accepted first slice should consider presence-only separately from shared
editing.

### 7.10 Q10 — Offline editing and merge

Decide separately from realtime collaboration:

- offline read versus offline mutation;
- encryption and local storage;
- device/user/session binding;
- revocation while offline;
- queued operation format;
- maximum offline age;
- server validation on reconnect;
- conflict visualization;
- automatic versus manual merge;
- assets/OpenAPI/Navigation behavior;
- deletion/archive conflicts;
- multiple device conflicts;
- cleanup on logout;
- service-worker and cache scope;
- audit timing and actor attribution.

Preserved boundary:

- current autosave `offline/error` state does not promise offline mutation;
- stale writes preserve local work and require deliberate conflict recovery;
- no client cache may become publication or database authority.

Recommended default:

- defer offline mutation until its security, storage, and merge semantics are
  accepted; offline read-only caching may be evaluated independently.

### 7.11 Q11 — Governed permanent deletion and retention

Decide:

- resource scope: Page, Site Edition, Site, Project, Organization, File,
  import temporary data, or user identity;
- archive waiting period;
- legal hold;
- backup/restore implications;
- immutable Revision/Publication treatment;
- active and revoked Publish Links;
- protected File references;
- Audit/Access Evidence retention;
- review/comment/feedback/analytics records;
- actor attribution after user deletion;
- export-before-delete;
- approval/quorum and reauthentication;
- dry run, impact report, cancellation, and recovery window;
- asynchronous job ownership;
- idempotency and partial failure;
- customer-managed versus operator-managed policy;
- public URL tombstone, alias, slug, domain, and identifier reuse;
- deletion propagation through replicas, caches, object storage, backups, and
  restored snapshots;
- cryptographic erasure claims, if encryption keys are involved;
- minimum statutory, contractual, security-evidence, and billing retention.

Preserved boundary:

- export is not deletion;
- archive remains recoverable lifecycle;
- existing immutable Publications and append-only evidence cannot be silently
  erased;
- no migration may cascade-delete cross-tenant or protected state.

This is a legal/compliance/product authority question. It cannot be accepted
from engineering convenience alone. Project- or Organization-wide deletion is
cross-product ownership and must not be placed in a Documentation-only master.
A Documentation-only first slice is possible only if its boundaries preserve
shared Project, File, identity, Audit, Access, backup, and public-link
invariants.

### 7.12 Q12 — Cross-artifact and Organization-wide search

Decide:

- search scope: one Project, Organization, or permitted cross-Organization;
- included artifact families;
- draft versus immutable/public content;
- identity and ranking normalization;
- permission filtering before indexing and return;
- membership changes and revocation latency;
- comments/review/evidence exclusion;
- stable result links;
- Project Version filters;
- archived content;
- public versus authenticated separation;
- operator/rebuild ownership;
- index technology and database authority;
- result count and query limits.

Preserved boundary:

- current internal search is Project/Project-Version authorized;
- current public search is exact Site Publication scoped;
- a search index is derived, never authorization authority;
- raw queries and bodies remain absent from Audit/Access Evidence.

Recommended default:

- begin, if accepted, with Organization-scoped authenticated discovery over
  safe metadata from already-authorized artifacts; defer cross-content full
  text until revocation and ranking proof exists.

Any result spanning Guide, Interactive Demo, Capture, Project, File, or
Organization data is cross-product ownership. It belongs in the
knowledge-platform Master `007`, not a Documentation-only master. A
Documentation-only search enhancement may use the Documentation master only
when it does not claim cross-artifact scope.

### 7.13 Q13 — Rich interactive components

Decide:

- exact allowed component families;
- authored configuration schema;
- executable versus declarative behavior;
- network access;
- sandboxing;
- asset and dependency authority;
- accessibility fallback;
- server rendering and no-JavaScript output;
- immutable snapshot behavior;
- search text;
- CSP;
- versioning and deprecation;
- third-party embed privacy;
- export/import portability.

Preserved boundary:

- customer-authored MDX, JavaScript, React, raw HTML, arbitrary iframes, and
  arbitrary executable code remain rejected;
- only Ossie-owned typed blocks may add behavior;
- immutable Publications must not execute mutable remote authority.

Each accepted component family requires its own threat model and constrained
schema. Do not accept a generic “custom component” escape hatch.

### 7.14 Q14 — SDK generation

Decide:

- target languages;
- generated artifact purpose;
- OpenAPI descriptor version and completeness;
- generator ownership and supply chain;
- server-side versus client-side generation;
- package registry publication;
- credentials and environment placeholders;
- deterministic/reproducible output;
- versioning and support policy;
- unsafe code/template handling;
- download retention;
- relation to browser-direct Try It.

Preserved boundary:

- Ossie remains no API proxy and stores no target credentials;
- generated code is not executed by Ossie;
- descriptor-v0 remains non-executable;
- SDK generation cannot grant new origin authority.

Placeholder code examples and full SDK generation are separate capabilities.

### 7.15 Q15 — Advanced publication distribution

Decide:

- static export;
- object-storage/CDN publish;
- deploy hooks;
- signed package/artifact delivery;
- environment promotion;
- scheduled publication;
- multi-channel link updates;
- rollback;
- cache purge;
- custom-domain relationship;
- credentials and deployment ownership;
- immutable artifact digest/signature;
- partial failure;
- Audit/Access Evidence;
- self-hosted portability.

Preserved boundary:

- one exact immutable Site Publication remains the source artifact;
- preparation must finish before any live pointer changes;
- failure leaves the current live selection unchanged;
- external distribution is an adapter, not a second mutable Publication.

### 7.16 Q16 — Tooling and operational follow-up

Reassess, without automatically expanding product scope:

- Ossie-native editor/reader versus a fresh Tiptap/Fumadocs adapter proof;
- Firefox/WebKit support evidence;
- real assistive-technology validation;
- production p75 telemetry;
- pg-9 compatibility warning;
- server lint debt;
- distributed admission/rate limiting;
- asynchronous publication;
- non-local File storage.

For each item decide:

- product decision, engineering maintenance, deployment capability, or accepted
  limitation;
- owner and trigger;
- whether it belongs in the next Documentation master, a cross-product master,
  dependency maintenance, or operations work.

Do not turn maintenance debt into a Documentation feature merely to close this
gate.

### 7.17 Q17 — Final prioritization and sequence

After Q1–Q16:

- confirm every opened question has one final disposition;
- select at most one coherent next master objective unless dependencies require
  a tightly coupled group;
- order accepted-next slices by prerequisite and risk;
- separate research/decision children from runtime children;
- define a final-closeout child;
- leave accepted-later, deferred, and rejected items outside the implementation
  checklist;
- explicitly decide whether Master `007` is needed now.

No candidate is accepted by inclusion in the proposed sequence. The user must
accept the final sequence itself.

### 7.18 Planning-owner classification

Q17 must assign the accepted-next objective to exactly one owner:

| Candidate/result                                                                  | Default planning owner                                                                                             |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Documentation-only Git proposals, localization, custom domains, feedback, review  | `007-documentation-post-v1-master-plan.md`                                                                         |
| Documentation-only collaboration/offline, typed components, SDK, distribution     | `007-documentation-post-v1-master-plan.md`                                                                         |
| Organization/Project permanent deletion or shared retention                       | `007-knowledge-platform-post-v1-master-plan.md`                                                                    |
| Cross-artifact/Organization search                                                | `007-knowledge-platform-post-v1-master-plan.md`                                                                    |
| Shared identity, analytics, storage, background work, or admission infrastructure | Cross-product master unless the accepted first slice is provably isolated and does not create a shared abstraction |
| Browser coverage, pg-9, lint, dependency, or deployment proof                     | Maintenance/operations owner; not automatically Master `007`                                                       |

If accepted-next items require both master owners, choose one prerequisite
objective for Master `007` and leave the other `accept-later` with an explicit
handoff. Do not create two Master `007` files or a mixed catch-all master.

## 8. Cross-Candidate Behavior Rules

Any accepted post-V1 direction must preserve or explicitly supersede:

- stable Site, Site Edition, Page, Revision, Publication, and Publish Link
  identities;
- server-side Organization/Project scope resolution;
- current Project Membership and Organization Owner authority;
- authorization before data load, cache, index, render, or mutation;
- exact immutable Publication output;
- prepare-before-switch and failure-preserves-live behavior;
- protected File reference safety;
- constrained non-executable content;
- private comments and review state;
- content-free Audit/Access Evidence;
- Row Version/idempotency/transaction rules;
- archive-first lifecycle;
- current public URL and cache compatibility;
- database authority.

If a candidate conflicts with one of these:

1. name the conflict;
2. identify the accepted decision or ADR being superseded;
3. explain data and URL compatibility;
4. require explicit user acceptance;
5. create a superseding ADR;
6. move implementation to a new master;
7. do not edit current runtime in child `140`.

## 9. Security, Privacy, Permission, And Evidence Gate

### 9.1 Required threat analysis

Every candidate must address, where applicable:

- cross-tenant ID or external-account substitution;
- token/secret/credential storage, rotation, revocation, and logging;
- webhook replay and spoofing;
- SSRF, DNS rebinding, redirects, private-network access, and proxying;
- stored/reflected XSS and executable content;
- supply-chain and generated-code risk;
- public enumeration and capability-link forwarding;
- draft/comment/review/search leakage;
- analytics/feedback personal data and consent;
- external processor egress and retention;
- cache/access-policy confusion;
- stale authorization;
- immutable history corruption;
- protected File deletion;
- merge/conflict data loss;
- denial of service and unbounded background work;
- backup/restore and deletion inconsistency.

### 9.2 Permission decision template

For every mutation or privileged read proposed by an accepted candidate, record
the minimum role among:

- deployment operator;
- Organization Owner;
- Organization member;
- Project Admin;
- Editor;
- Viewer;
- external reviewer;
- authenticated public-link visitor;
- anonymous public visitor;
- system/background actor.

Also record:

- tenant and Project scope;
- whether Organization Owner implies Project Admin;
- current-role reevaluation timing;
- revocation behavior;
- UI visibility versus server authorization;
- non-enumerating denial behavior;
- Audit action;
- Access Evidence action;
- sensitive fields excluded from evidence.

### 9.3 Security stop conditions

The session must not mark a candidate `accept-next` when:

- its authority/source of truth is ambiguous;
- a credential or personal-data owner is missing;
- tenant mapping is unresolved;
- deletion/retention is undefined;
- immutable/publication compatibility is unknown;
- external processor terms or current primary documentation are unavailable;
- it requires weakening V1 security merely to make the first slice easy.

Use `defer` with explicit evidence requirements instead.

## 10. Existing Routes And API Contracts

Child `140` changes no API route, request/response schema, status code, OpenAPI
document, Access coverage registration, or public URL.

Read-only route authorities:

- `apps/server/src/modules/documentation/documentation.routes.ts`
- `apps/server/src/modules/documentation-review/documentation-review.routes.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.routes.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/App.tsx`
- `docs/backend-route-inventory.md`

The decision session must use the method-plus-template inventory closed by
child `139`, including:

- authenticated version-scoped Site, Page, Navigation, routing, Snippet, Asset,
  comment, OpenAPI, preview, Revision, Publication, Publish Link, search,
  portability, lifecycle, review, Try-It, and Carry-Forward routes;
- Organization Documentation operations and limits;
- exact-Publication public JSON routes;
- external `/docs/*` initial-document/reader routes;
- normalized `/api/v1/docs/*` Access-registry representation;
- portal list, editor, preview, revision, publication, review, Carry-Forward,
  and operations routes.

For each accepted candidate, the grill record must describe future route
semantics at the capability level:

- actor;
- scope;
- resource identity;
- command/query;
- idempotency/concurrency;
- status/error classes;
- Audit/Access obligation;
- public/cache behavior.

Exact HTTP path syntax belongs in the future implementation child after its
master is accepted. Do not reserve or add runtime routes here.

## 11. Existing Schemas, Types, And Persistence

Child `140` changes no runtime schema or type.

Read-only schema/type authorities:

- `apps/server/src/db/migrations/025_documentation_site_first_vertical_slice.sql`
- `apps/server/src/db/migrations/026_documentation_content_snippets_and_asset_workflows.sql`
- `apps/server/src/db/migrations/027_documentation_import_export_portability.sql`
- `apps/server/src/db/migrations/028_documentation_carry_forward_multi_site_lifecycle.sql`
- `apps/server/src/db/migrations/029_documentation_review_and_approval_workflow.sql`
- `apps/server/src/db/migrations/030_documentation_api_try_it.sql`
- `apps/server/src/db/migrations/031_documentation_v1_operational_hardening.sql`
- `packages/constants/src/documentation.ts`
- `packages/types/src/documentation.ts`
- `packages/documentation-domain/src/types/documentation-domain.ts`
- `packages/documentation-domain/src/policies/documentation-*.ts`
- `apps/server/src/modules/documentation/documentation.repository.ts`
- `apps/server/src/modules/documentation-review/documentation-review.repository.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.repository.ts`

For each `accept-next` candidate, the decision record must state:

- new stable identity, if any;
- owning Organization/Project/Site/Edition/Revision/Publication;
- mutable versus immutable state;
- relational authority versus derived cache;
- Row Version or append-only behavior;
- uniqueness and tenant-scope constraints;
- protected File ownership;
- retention and deletion;
- migration/backfill need;
- compatibility with existing rows;
- whether a new discriminated Zod contract is likely;
- whether current Package V1 or descriptor versions remain readable.

Do not invent columns, table names, enum values, or Zod fields in this child.
Those become exact only in a future implementation-ready child after the
durable model is accepted.

## 12. Exact File Ownership

### 12.1 Mandatory write set during decision execution

- `docs/plan/140-post-v1-documentation-decision-gate.md`
- `docs/grill/2026-07-31-post-v1-documentation-decision-gate.md`
- `docs/documentation-domain-decisions.md`
- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

### 12.2 Conditional write set

Update only when the final decisions require it:

- `CONTEXT.md` for accepted new canonical terms, relationships, or resolved
  ambiguity;
- `README.md` only if a committed next direction changes repository-level
  current/future wording;
- `docs/roadmap.md` only for accepted-next scope, never deferred candidates;
- `docs/project-zoomout-status.md` only if the active planning sequence changes;
- `apps/docs/app/docs-content.ts` and
  `apps/docs/app/docs-content.test.ts` only if the new final decision record or
  selected Master `007` must be discoverable from repository docs;
- `docs/adr/0034-*.md` onward only for finally accepted durable decisions;
- `docs/plan/master/007-documentation-post-v1-master-plan.md` only when at
  least one coherent Documentation-owned implementation objective is finally
  accepted and selected as next;
- `docs/plan/master/007-knowledge-platform-post-v1-master-plan.md` instead when
  the one selected objective is inherently cross-product;
- `docs/plan/141-*.md` onward only as bounded reservations created by an
  accepted, uniquely selected Master `007`; reservations must not pretend to be
  implementation-ready.

Never create both Master `007` alternatives. The final ledger and Q17 must name
the one selected exact path before it enters the write set.

If the session date changes, rename the planned grill record before creating it
and update all references in the same commit.

### 12.3 Read-only evidence set

- child plans `131` through `139`;
- all matching browser evidence under `docs/ui/132-*` through `docs/ui/139-*`;
- ADRs `0021` through `0033`;
- migrations `001` through `031`;
- `packages/documentation-domain/**`;
- `packages/types/src/documentation.ts`;
- `packages/constants/src/documentation.ts`;
- Documentation server/review/operations modules;
- Documentation web features and route owners;
- Audit/Access coverage registries;
- active operator, self-hosting, portability, route-inventory, smoke, and
  production-readiness docs.

### 12.4 Forbidden write set

This child must not change:

- `apps/server/**`;
- `apps/web/**`;
- `apps/extension/**`;
- `packages/**`;
- `apps/server/src/db/migrations/**`;
- `package.json`, workspace package manifests, or `pnpm-lock.yaml`;
- environment files;
- fixtures or seeds;
- browser screenshots, traces, profiles, videos, HAR files, or auth state;
- production/deployment configuration;
- generated build output;
- runtime route inventory to claim unimplemented APIs.

If a decision appears to require any forbidden path, record it as future scope
and place it in the selected next master; do not edit the path.

## 13. Conditional ADR Plan

Create an ADR only when a final accepted decision is important, durable, and
costly to reverse.

Provisional filename ownership, subject to collision recheck immediately
before creation:

- `0034-documentation-git-integrations-are-proposals-not-authority.md`
- `0035-documentation-localization-has-explicit-locale-identity.md`
- `0036-custom-domains-are-verified-publish-link-adapters.md`
- `0037-public-documentation-engagement-data-has-explicit-privacy-and-retention.md`
- `0038-external-documentation-review-uses-explicit-limited-identity.md`
- `0039-documentation-collaboration-preserves-relational-publication-authority.md`
- `0040-governed-permanent-deletion-is-scope-and-evidence-aware.md`
- `0041-cross-artifact-search-is-authorization-first-derived-discovery.md`
- `0042-interactive-documentation-remains-typed-and-sandboxed.md`
- `0043-documentation-distribution-uses-immutable-publication-artifacts.md`

Rules:

- do not create empty or speculative ADRs;
- do not create one ADR per question mechanically;
- combine questions only when one durable decision genuinely governs them;
- split Git proposal automation from bidirectional Git authority if their
  decisions differ;
- split public feedback from analytics if their identity/privacy/retention
  decisions differ;
- split realtime presence, collaborative editing, and offline merge if their
  authority decisions differ;
- verify the next free ADR number before writing;
- if another ADR claims a provisional number, renumber without rewriting its
  history;
- status must be `Accepted`, not `Implemented`;
- link the grill question and future implementation owner;
- state explicitly that child `140` made no runtime change.

Rejected and deferred outcomes belong in the grill ledger and consolidated
feature matrix, not speculative ADRs.

## 14. Conditional Master 007 Contract

Create Master `007` only if at least one candidate is `accept-next`.

Before creation, Q17 must select exactly one:

- `docs/plan/master/007-documentation-post-v1-master-plan.md` for a
  Documentation-owned objective; or
- `docs/plan/master/007-knowledge-platform-post-v1-master-plan.md` for an
  inherently cross-product objective.

Do not create both. Do not use a Documentation master to smuggle in
Organization/Project deletion, shared identity, shared analytics
infrastructure, or cross-artifact search.

Master `007` must:

- have one coherent objective grounded in Q1;
- cite the accepted child-`140` decisions and ADRs;
- start from shipped migration head `031`;
- preserve V1 unless a superseding decision explicitly says otherwise;
- separate decision/research prerequisites from runtime implementation;
- define a dependency-ordered child sequence beginning at `141`;
- give each child one closable security/behavior boundary;
- include a final operational hardening child and independent closeout child;
- reserve, but not prematurely expand, children;
- define exact feature matrix, non-scope, threat model, source of truth,
  permissions, migration strategy, compatibility, test matrix, browser matrix,
  and handoff;
- keep accepted-later/deferred/rejected candidates out of implementation
  checklists;
- require the standard rewrite/recheck/implement/recheck chain for each runtime
  child.

If no candidate is `accept-next`:

- do not create either Master `007` alternative;
- close Master `006`;
- record the evidence needed to reopen each deferred item;
- leave the repository with no falsely active Documentation implementation
  plan.

## 15. Migration And Backwards-Compatibility Rules

Child `140`:

- creates no migration;
- edits no historical migration;
- changes no database role or grant;
- changes no schema verifier;
- performs no backfill;
- runs no destructive database command;
- changes no Package, descriptor, route, URL, or API contract.

Every accepted future candidate must answer:

- additive migration after `031` or no persistence change;
- clean install;
- upgrade from `031`;
- populated upgrade;
- down/rollback or refusal behavior;
- backup/restore;
- existing Site/Edition/Revision/Publication interpretation;
- current public URL and link-session compatibility;
- existing Package V1 and descriptor compatibility;
- Guide/Demo/Capture/extension compatibility;
- Audit/Access backfill policy;
- deletion/retention compatibility.

Default:

- no fabricated historical Audit/Access events;
- no mutation of immutable Revisions/Publications;
- no reassignment of stable IDs, slugs, aliases, or Publication sequences;
- no implicit opt-in of existing Sites, links, domains, reviewers, analytics,
  integrations, or external processors;
- new policies default disabled/optional/fail-closed unless explicitly
  accepted otherwise.

## 16. Fumadocs And Tiptap Boundary

The shipped V1 uses Ossie-native React/Fastify/PostgreSQL adapters. Neither
Fumadocs nor Tiptap is installed as Product Documentation runtime authority.

Child `140` may decide whether a new adapter proof is worth future work, but it
must preserve:

- database-authoritative relational content;
- Ossie-owned authorization;
- exact Publication loading;
- Ossie-owned URL, canonical, redirect, search, cache, and access behavior;
- constrained block schemas;
- safe import/export;
- no customer-authored executable content.

Any `accept-next` adapter proof must specify:

- exact current version/license/peer/engine research at implementation time;
- isolated adapter boundary;
- round-trip and fallback proof;
- accessibility and initial-document behavior;
- bundle/performance budget;
- removal path;
- no migration to framework-native persistence;
- no dependency addition in child `140`.

## 17. Decision Session Execution Protocol

### Stage 1 — Baseline

1. freeze HEAD/worktree ownership;
2. recheck child `139` and Master `006`;
3. create the grill record with status `In progress`;
4. copy the disposition vocabulary and evidence labels;
5. record the shipped V1 baseline and limitations;
6. confirm no candidate is accepted.

### Stage 2 — One-question grill

For each question:

1. inspect repository facts;
2. obtain current primary research only where required;
3. write the recommendation and alternatives;
4. map security, permissions, source of truth, lifecycle, compatibility, and
   first slice;
5. ask for explicit user/product authority;
6. record the answer as provisional;
7. do not modify runtime or create an ADR yet.

### Stage 3 — Cross-question reconciliation

After all opened questions:

1. find contradictions and hidden dependencies;
2. reconcile Git versus database authority;
3. reconcile custom domains/distribution/public access;
4. reconcile feedback/analytics/privacy/retention/deletion;
5. reconcile external reviewers with identity and review gates;
6. reconcile realtime/offline with relational authority and Row Versions;
7. reconcile localization with URLs/search/Publications;
8. reconcile interactive components/SDK with executable-content and Try-It
   boundaries;
9. revise recommendations where dependencies changed;
10. present the consolidated matrix and sequence for final acceptance.

### Stage 4 — Final acceptance

1. ask the user to accept the complete disposition ledger;
2. mark every answer final only after that acceptance;
3. create only justified ADRs;
4. update Context only for accepted terms/relationships;
5. update Documentation decisions and feature matrix;
6. create the one correctly owned Master `007` only if required;
7. mark Master `006` complete;
8. update child `140` status, checklist, decision log, verification, leftovers,
   and handoff.

### Stage 5 — Verification and commit

1. validate final disposition completeness;
2. validate no candidate appears in both accepted and deferred/rejected bands;
3. validate ADR links/numbers/status;
4. validate Master `006` closure;
5. validate exactly one correctly owned Master `007` exists when and only when
   `accept-next` exists;
6. validate no runtime/schema/dependency path changed;
7. run focused documentation checks;
8. commit documentation-only outputs in logical commits.

## 18. Test And Verification Plan

### 18.1 Expansion verification

For this plan expansion:

- confirm clean worktree and baseline commit;
- confirm child `139` and Master `006` final state;
- confirm migrations end at `031`;
- confirm planned mandatory/conditional files and ADR numbers do not already
  conflict;
- confirm all runtime files named by the baseline exist;
- run Prettier over this plan;
- run `git diff --check`;
- assert only this plan changed;
- do not run runtime tests, migrations, dependency installation, or browser
  automation.

### 18.2 Decision-session documentation verification

Required final checks:

- exactly one final disposition per opened question;
- every candidate in Master `006` appears in the ledger;
- every `accept-next` item maps to the selected Master `007`;
- every `accept-later` item has owner/prerequisite/reopen trigger;
- every `defer` item names missing evidence and reopen condition;
- every `reject` item has rationale and no implementation checkbox;
- all final decisions have explicit user authority and date;
- all ADRs map to accepted durable decisions;
- no rejected/deferred question has an ADR that implies acceptance;
- Context contains only accepted canonical language;
- Documentation decisions and feature matrix match the ledger;
- Master `006` final checklist and status are complete;
- child `140` status/checklist/log/verification/leftovers/handoff are complete;
- exactly one correctly owned Master `007` and its child reservations exist if
  and only if next implementation is accepted;
- local Markdown links resolve;
- active decision/plan wording contains no stale `Reserved`, `provisional`,
  or false runtime claims;
- Prettier passes on every changed Markdown/TypeScript docs file;
- `git diff --check` passes;
- docs tests/lint/type-check pass if `apps/docs` changes;
- scoped diff contains no forbidden runtime/schema/dependency path.

### 18.3 Suggested commands

Use repository-equivalent commands at execution time:

```bash
pnpm exec prettier --check <changed files>
git diff --check
git status --short
git diff --name-only <baseline>..HEAD
pnpm --filter docs test
pnpm --filter docs lint
pnpm --filter docs check-types
```

Only run the docs package commands when its files change or when final Master
closure requires the repository-doc hub proof. Do not rerun the full V1
runtime matrix merely to conduct a docs-only decision session. If the session
finds a runtime contradiction, stop and scope a separate repair.

## 19. Agent-Browser Requirements

Child `140` contains no frontend or browser-visible behavior. Agent-browser is
therefore not required to execute or verify this child.

Use the existing sanitized child-`139` browser evidence as read-only decision
input:

- `docs/ui/139-documentation-v1-final-closeout-browser-evidence.md`

Do not create a custom harness, start runtime services, seed new browser data,
or capture new screenshots merely for this decision gate.

Future plans must require agent-browser when an accepted candidate changes:

- portal or public-reader UI;
- custom-domain/public routing;
- public feedback or analytics consent;
- external reviewer flows;
- realtime/offline state;
- locale selection/canonical behavior;
- interactive blocks;
- SDK/example experiences;
- publication/distribution controls.

Those future browser plans must cover desktop, 320px, keyboard, focus,
zoom/reflow, reduced motion, loading/empty/error/conflict/permission/destructive
states, failed requests, console errors, and accessibility checks as
applicable.

## 20. Explicit Non-Scope

This child does not:

- implement any candidate;
- fix unrelated V1 runtime debt;
- add Product Documentation routes or UI;
- add migrations, schemas, columns, tables, indexes, constraints, triggers, or
  grants;
- add or change Zod schemas/types;
- add dependencies or update the lockfile;
- install Fumadocs, Tiptap, GitHub SDKs, analytics SDKs, collaboration
  frameworks, localization libraries, certificate clients, search engines, or
  SDK generators;
- create GitHub Apps, repositories, webhooks, tokens, or credentials;
- configure DNS, TLS, custom domains, CDN, object storage, or deployment hooks;
- collect feedback, analytics, telemetry, or personal data;
- invite external reviewers;
- add realtime presence, CRDT/OT, service workers, or offline mutation;
- delete customer data;
- widen search scope;
- permit executable customer content;
- generate or publish SDKs;
- change publication distribution;
- reopen accepted V1 identities casually;
- rewrite historical ADRs or grill chronology;
- treat an `accept-next` decision as implemented;
- create a runtime child without separate expansion/recheck/authorization.

Video remains outside this Documentation decision gate unless the user
explicitly opens a separate cross-product decision.

## 21. Commit Strategy

Do not commit during this expansion unless separately requested.

During decision execution, use logical documentation-only commits:

1. `docs(documentation): record post-v1 decision session`
   - grill ledger and child-`140` in-progress log;
2. `docs(documentation): accept post-v1 documentation decisions`
   - final ledger, Context, Documentation decisions, justified ADRs;
3. `docs(documentation): close documentation v1 master`
   - Master `006`, final child `140`, current-truth/roadmap/docs-hub updates;
4. `docs(documentation): plan accepted post-v1 sequence`
   - the selected Master `007` and bounded child reservations, only if
     authorized.

Combine commits when the actual diff is smaller and one cohesive commit is
clearer. Never manufacture empty commits. Stage exact paths and inspect the
staged diff before every commit.

## 22. Exit Gate

Child `140` may close only when:

- starting V1 baseline remains clean and stable;
- every opened question has one explicit final disposition;
- all Master `006` candidates are represented;
- every final decision has rationale and user authority;
- security, privacy, permission, evidence, lifecycle, retention, migration,
  API/UI/public URL, compatibility, and first-slice implications are recorded;
- accepted terms and relationships are synchronized;
- justified ADRs exist only for durable accepted decisions;
- deferred/rejected items are not roadmap or implementation claims;
- exactly one correctly owned Master `007` exists only if `accept-next` scope
  exists;
- the selected Master `007` sequence is dependency ordered and separately
  gated;
- Master `006` is marked complete;
- Product Documentation V1 current-truth wording remains accurate;
- no runtime/schema/dependency/browser change occurred;
- documentation verification passes;
- worktree ownership and commits are scoped;
- handoff states either the next planning prompt or that no implementation is
  currently authorized.

## 23. Checklist

### Expansion

- [x] Confirm child `139` completion and independent close-recheck.
- [x] Confirm Master `006` leaves only child `140` open.
- [x] Record clean expansion baseline and migration head.
- [x] Map shipped domain, routes, schema/types, permissions, security,
      migration, compatibility, evidence, and limitations.
- [x] Expand all Master `006` post-V1 candidates into decision-safe questions.
- [x] Define disposition vocabulary and evidence ledger.
- [x] Define exact mandatory, conditional, read-only, and forbidden files.
- [x] Define conditional ADR and Master `007` rules.
- [x] Define verification, browser, non-scope, commit, exit, and handoff rules.
- [x] Complete focused expansion formatting, path, and scoped-diff
      verification.
- [x] Independently recheck this expanded plan against child `139`, Master
      `006`, accepted ADRs, and current code.
- [x] Commit the independently rechecked plan checkpoint.

### Decision execution

- [x] Freeze execution HEAD/worktree and reconcile drift.
- [x] Create the dated grill record.
- [x] Record shipped facts, evidence gaps, and current limitations.
- [ ] Conduct Q1–Q16 one consequential question at a time.
- [ ] Reconcile cross-question conflicts and dependencies.
- [ ] Complete Q17 final prioritization and sequence.
- [ ] Obtain explicit user acceptance of the complete disposition ledger.
- [ ] Mark every opened answer finally accepted/deferred/rejected.
- [ ] Update Documentation decisions and feature matrix.
- [ ] Update Context only for accepted canonical language.
- [ ] Create only justified accepted ADRs.
- [ ] Create exactly one correctly owned Master `007` and bounded reservations
      only if authorized.
- [ ] Close Master `006`.
- [ ] Run focused documentation verification.
- [ ] Complete this child's decision log, verification, leftovers, and handoff.
- [ ] Commit only scoped documentation/plan/ADR changes.

## 24. Planning Log

- 2026-07-30: Master `006` reserved child `140` as a decision-only post-V1
  gate. No post-V1 capability was accepted or implemented.
- 2026-07-31: child `139` completed and independently close-rechecked Product
  Documentation V1, including exact migration/schema/API/UI/security/browser/
  operational evidence and no unresolved S1/S2.
- 2026-07-31: expanded child `140` from the shipped child-`139` result and
  Master `006`. The expansion converts the candidate list into a controlled
  evidence/disposition session, fixes documentation-only ownership, preserves
  runtime non-scope, and makes a correctly owned Master `007` conditional on
  explicit accepted next scope.
- 2026-07-31: independently rechecked the expanded gate against Master `006`,
  child `139`, the accepted Documentation decisions/ADRs, and current runtime
  ownership. The recheck separated Documentation-owned and inherently
  cross-product next-master paths, routed Organization/Project deletion and
  cross-artifact search away from a Documentation-only master, added primary-
  source/legal-authority requirements, and closed Git, deletion, backup,
  identifier-reuse, and infrastructure-ownership edge cases.
- 2026-07-31: began decision execution from clean `main` commit `df409d0`.
  There were no commits or worktree changes after the reviewed plan checkpoint,
  migration head remains `031`, and child `139` remains clean. Created the
  dated grill ledger, recorded the shipped evidence/limitations, and opened Q1
  without accepting any post-V1 candidate.
- 2026-07-31: the user provisionally accepted the Q1 review-first direction:
  assess shipped V1, list and evaluate possible next capabilities, and only
  then select and deeply plan an implementation. This authorizes no immediate
  Master `007` or runtime work. Q2 opened next.
- 2026-07-31: the user provisionally accepted Q2 as an `accept-later` one-way
  proposal adapter: an exact Ossie Revision/Publication may later be exported
  to a dedicated GitHub branch and pull request, while Ossie remains authority
  and GitHub cannot automatically import, apply, checkpoint, publish, or
  delete content. Q3 opened separately to decide broad bidirectional
  synchronization.
- 2026-07-31: the user challenged the need to decide detailed two-way-sync
  semantics while Git integration itself is not selected. Q3 was consequently
  recorded as `defer`: no Git integration or two-way sync is accepted now,
  Ossie remains authority, and Q3 reopens only if Git implementation is
  selected. The independent translation candidate opened as Q4.
- 2026-07-31: the user provisionally accepted Q4 as an `accept-later`,
  human-authored, locale-separated translation capability triggered by real
  user demand. It is not selected as the next implementation, and machine
  translation is excluded from its first slice. Custom domains opened as Q5.
- 2026-07-31: the user provisionally accepted Q5 as an `accept-later` managed
  custom-domain capability beginning with one verified subdomain and automatic
  HTTPS. It is not selected as the next implementation, and deployment/ACME
  ownership remains a prerequisite. Structured public feedback opened as Q6.

The expansion itself made no decision. At the current execution checkpoint Q1
through Q5 are provisionally recorded, Q6 is open, and final cross-question
acceptance remains pending.

## 25. Expansion Verification Record

Expansion and independent implementation-readiness verification completed on
2026-07-31.

At expansion time:

- child `139` status is complete, independently close-rechecked, and verified;
- Master `006` marks children `132`–`139` independently close-rechecked and
  leaves only child `140` open;
- migration head is `031`;
- accepted ADRs currently end at `0033`;
- neither Master `007` alternative, child `141`, nor the post-V1 grill record
  exists;
- no candidate is accepted by current authoritative documentation;
- this expansion changes only this child-plan file;
- no runtime test, migration, browser session, dependency operation, or runtime
  implementation is required.

Focused expansion checks:

- Prettier check for this child: passed;
- `git diff --check`: passed;
- mandatory predecessor/master/Context/decision/ADR/runtime-owner/browser-
  evidence path checks: passed;
- both Master `007` alternatives, child `141`, and the planned post-V1 grill
  record absence checks: passed;
- scoped diff assertion: passed; only this child-plan file changed;
- runtime tests, migrations, dependency installation, and agent-browser were
  not run because this expansion changes no executable or browser-visible
  behavior.

Independent implementation-readiness recheck:

- all Master `006` child-`140` candidates map to explicit Q2–Q16 questions;
- shipped child-`139` migrations, contracts, routes, roles, security,
  compatibility, browser evidence, limitations, and no-S1/S2 state remain
  represented without reopening V1;
- Q17 now selects exactly one next-master owner and forbids creating both
  Master `007` alternatives;
- Documentation-only and cross-product ownership is explicit for permanent
  deletion, cross-artifact search, shared identity, analytics, storage,
  admission, and background infrastructure;
- research requirements now identify primary-source and retrieval/version
  evidence, while privacy/deletion/legal conclusions require authorized
  jurisdiction-specific input;
- conditional ADRs remain provisional, collision-safe, accepted-only, and
  documentation-only;
- no exact runtime route, schema, Zod field, migration, dependency, or UI is
  invented by this gate;
- the mandatory/conditional/read-only/forbidden write sets remain disjoint;
- Prettier, `git diff --check`, referenced-path, candidate-coverage,
  future-plan-absence, and scoped-diff checks passed;
- only this plan changed; no runtime test, migration, browser session, or
  dependency operation was needed.

## 26. Leftovers And Handoff

The next prompt-chain step is execution of this decision gate: create the dated
grill record and conduct Q1–Q17 one consequential question at a time with
explicit user authority. Executing child `140` means conducting and recording
the decision session. It still does not mean implementing an accepted
candidate.

Possible final handoffs:

- one or more `accept-next` decisions:
  the correctly owned Master `007` plus bounded child reservations, followed
  by the normal rewrite/recheck/implement/recheck chain;
- no `accept-next` decision:
  Master `006` closes with explicit accepted-later/deferred/rejected records and
  no active Documentation implementation plan;
- unresolved critical authority:
  child `140` remains in progress with the exact blocked question and required
  user/external evidence;
- newly discovered V1 defect:
  stop the decision gate and create a separately scoped V1 repair; do not hide
  it in future scope.
