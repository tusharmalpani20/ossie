# Post-V1 Documentation Decision Gate

Date started: 2026-07-31

Status: In progress. Q1 through Q10 are provisionally recorded and Q11 is open
for explicit user/product authority. No post-V1 capability, Master `007`, child
`141`, ADR, runtime change, or roadmap commitment is finally accepted by this
record yet.

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

| Question | Candidate                                                       | State      | Provisional disposition          | Final authority |
| -------- | --------------------------------------------------------------- | ---------- | -------------------------------- | --------------- |
| Q1       | First post-V1 problem and priority                              | Answered   | Review first; no immediate build | Provisional     |
| Q2       | GitHub App proposals and export automation                      | Answered   | `accept-later`: one-way proposal | Provisional     |
| Q3       | Bidirectional Git/conflict/branch/PR/force-push semantics       | Answered   | `defer` until Git is selected    | Provisional     |
| Q4       | Translation identity, fallback, and workflow                    | Answered   | `accept-later`: human-first      | Provisional     |
| Q5       | Custom domains                                                  | Answered   | `accept-later`: verified domain  | Provisional     |
| Q6       | Public feedback                                                 | Answered   | `accept-later`: structured only  | Provisional     |
| Q7       | Public analytics                                                | Answered   | `accept-later`: aggregate only   | Provisional     |
| Q8       | External reviewer access                                        | Answered   | `accept-later`: exact review     | Provisional     |
| Q9       | Realtime collaboration and presence                             | Answered   | Presence later; editing deferred | Provisional     |
| Q10      | Offline editing and merge                                       | Answered   | Read later; editing deferred     | Provisional     |
| Q11      | Governed permanent deletion and retention                       | Open       | Pending                          | Pending         |
| Q12      | Cross-artifact and Organization-wide search                     | Not opened | None                             | Pending         |
| Q13      | Rich interactive components                                     | Not opened | None                             | Pending         |
| Q14      | SDK generation                                                  | Not opened | None                             | Pending         |
| Q15      | Advanced publication distribution                               | Not opened | None                             | Pending         |
| Q16      | Tooling and operational follow-up                               | Not opened | None                             | Pending         |
| Q17      | Final prioritization, next-master ownership, and child sequence | Not opened | None                             | Pending         |

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

`defer` immediate implementation while the complete candidate list is reviewed.
Do not create Master `007` from Q1 alone.

### Decision requested

User answer:

> First review what has been implemented, list the possible things to include
> next, and only then decide and dive deeply into those features.

Recorded interpretation:

- review shipped V1 first;
- assess all next-feature candidates one by one;
- select nothing for immediate implementation yet;
- decide the next deep implementation only after cross-question
  reconciliation.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 9. Q2 — GitHub App Proposals And Export Automation

### Why this question is open

Teams may want Documentation snapshots in a GitHub repository for review,
backup-like portability, or an existing pull-request workflow. That is useful
only if GitHub does not silently replace Ossie's database authority.

### Shipped V1 facts

- PostgreSQL and protected Files are authoritative.
- Documentation Package V1 and Markdown exports are deterministic snapshots.
- Import already requires actor-bound Inspect followed by explicit atomic
  Apply.
- Import never overwrites a non-empty Site, checkpoints, publishes, or claims
  source lineage.
- No GitHub credential, integration, webhook, repository mapping, or runtime
  dependency exists.

### Current primary-source research

Retrieved 2026-07-31 from GitHub's official documentation:

- GitHub Apps have no permissions by default and should request the minimum
  required permissions. Repository Contents permission is required for HTTP
  Git/content access, and permissions govern available API endpoints and
  webhook subscriptions:
  [Choosing permissions for a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app).
- Installation access tokens can be narrowed to repositories and permissions
  already granted to the installation and expire after one hour:
  [Generating an installation access token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app).
- Installers can limit repository access and suspend or uninstall an App;
  suspension blocks installation access:
  [Reviewing and modifying installed GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/reviewing-and-modifying-installed-github-apps),
  [Suspending an installation](https://docs.github.com/en/apps/maintaining-github-apps/suspending-a-github-app-installation).
- GitHub recommends HMAC-SHA256 webhook signature validation, HTTPS, minimum
  event subscriptions, checking event/action, responding quickly, and using
  `X-GitHub-Delivery` for replay/idempotency handling:
  [Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries),
  [Webhook best practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks).
- Installation API limits are per installation and secondary/content-creation
  limits also apply:
  [REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

### Inference

A GitHub App can support a narrow proposal workflow safely, but it introduces
credential custody, external account/repository mapping, webhook replay,
revocation, rate-limit, background-job, and branch-protection responsibilities.
Those costs are not justified for an automatic two-way sync without stronger
evidence.

### Recommendation

Keep this as an **accepted-later** possibility with a deliberately narrow first
slice:

1. An Organization Owner connects and can revoke one GitHub App installation.
2. A Project Admin selects an allowed repository and base branch.
3. An authorized Editor/Admin explicitly exports one exact immutable Site
   Revision or Publication.
4. Ossie creates or updates a dedicated proposal branch and pull request.
5. GitHub receives a deterministic snapshot; it never becomes Documentation
   authority.
6. Nothing is imported, applied, checkpointed, or published automatically.
7. Any future inbound proposal must return through existing Inspect and
   explicit Apply.

Do not choose it as `accept-next` until the entire candidate review is
complete.

### Alternatives

- **Defer:** gather real demand for GitHub review/export first.
- **Reject:** keep manual Package/Markdown export as the only Git path.
- **Broader sync:** evaluate separately in Q3; do not hide it inside this
  answer.

### Rejected shortcuts

- personal access tokens;
- broad all-repository access when selected repositories are sufficient;
- long-lived installation tokens;
- unsigned or replayable webhook processing;
- Git pushes that automatically mutate or publish Ossie state;
- treating a merged PR as an implicit Apply or Publication;
- storing repository content as a second canonical database.

### Security and permission boundary

- Deployment operator owns the App registration/private key and webhook-secret
  storage.
- Organization Owner binds, suspends, or removes an installation in Ossie.
- Project Admin selects the repository/base branch.
- Editor/Admin may request an export proposal only for a Site they can read
  and checkpoint/publish under the future accepted policy.
- Every installation/repository mapping is tenant scoped and revalidated before
  use.
- Generate a short-lived repository-scoped installation token per job; do not
  persist it as customer data.
- Verify webhook bytes before parsing, deduplicate the delivery ID, allowlist
  event/action, and fail closed on suspended/uninstalled/repository-removed
  state.
- Audit configuration/export commands without Package bytes, tokens, webhook
  bodies, private repository URLs, branch content, or pull-request bodies.
- Access Evidence records allowed/denied integration reads without sensitive
  payloads.

### Source of truth, lifecycle, and failure

- Exact Site Revision/Publication remains the exported source.
- The repository/branch/PR is a proposal adapter and portable copy.
- Retry is idempotent by Ossie operation ID plus exact source digest and
  destination mapping.
- Rate limit, branch protection, conflict, outage, suspension, or token failure
  leaves Ossie unchanged and reports a safe actionable error.
- Removing an installation disables future jobs without deleting Ossie
  Documentation or immutable history.
- Repository deletion or force-push never deletes Ossie data.

### Migration, API, UI, and compatibility

Child `140` makes no change. A future child would require additive integration,
mapping, operation, idempotency, Audit/Access, API, portal, secret-management,
background-work, and browser contracts. Existing exports/imports and all
current Publications remain unchanged and opt-out by default.

### Reversibility

The proposal-adapter model is reversible because removing the integration does
not change Documentation authority. Bidirectional sync would be materially
harder to reverse and remains Q3.

### Evidence gaps

- no recorded user demand;
- no selected GitHub hosting scope (GitHub.com versus Enterprise);
- no deployment secret manager or background queue decision;
- no accepted repository layout or generated-file ownership markers;
- no accepted branch/PR conflict behavior.

### Provisional disposition

`accept-later` for the narrow one-way proposal adapter described above. This
does not select it as the next implementation and does not accept
bidirectional synchronization.

### Simple decision requested

Should we keep a safe GitHub export-to-pull-request feature as a possible later
feature?

Recommended answer: **Yes, later—but GitHub should only receive proposals.
Ossie stays the main source, and nothing syncs or publishes automatically.**

### User answer

> I agree with your recommendation here.

Recorded interpretation:

- retain the one-way export-to-pull-request capability as an accepted-later
  possibility;
- Ossie remains authoritative;
- no GitHub action automatically imports, applies, checkpoints, publishes, or
  deletes Ossie content;
- do not select this capability as `accept-next` before the complete candidate
  review;
- decide broad bidirectional synchronization separately in Q3.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 10. Q3 — Should Ossie And GitHub Synchronize Both Ways?

### Why this question is open

Q2 preserves a safe one-way proposal copy. Two-way synchronization is a
different capability: both Ossie and GitHub could change the same content, so
the product would need durable rules for identity, conflicts, history
rewrites, renames, deletions, and publication.

### Shipped V1 facts

- PostgreSQL and protected Files are authoritative.
- Site Revisions and Publications are immutable exact snapshots.
- Mutable Page, Snippet, Asset, Navigation, OpenAPI, and settings resources use
  stable Ossie identities and Row Versions.
- Existing import requires Inspect followed by explicit Apply and cannot
  overwrite a non-empty Site automatically.
- Git branches, paths, commits, pull requests, and authors have no accepted
  identity mapping to Ossie resources.
- No Git sync engine, webhook consumer, Git credential, repository mapping, or
  conflict store exists.

### Current primary-source research

Retrieved 2026-07-31:

- Git normally refuses a push that would replace remote history with a
  non-fast-forward update. A forced push disables that protection and can
  cause the remote repository to lose commits:
  [Git push documentation](https://git-scm.com/docs/git-push).
- A Git merge can stop with conflicts and requires the caller to resolve,
  continue, or abort the operation:
  [Git merge documentation](https://git-scm.com/docs/git-merge).
- GitHub branch protection can require pull requests, approvals, status
  checks, signed commits, linear history, and restricted or disabled force
  pushes. Rules vary by repository and branch:
  [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
- GitHub distinguishes line conflicts, which may be resolved in its web
  editor, from more complex conflicts that require local Git resolution:
  [Merge conflicts](https://docs.github.com/en/pull-requests/reference/merge-conflicts).

### Inference

Two editable authorities cannot be made safe by periodically copying files.
The system would have to decide which change wins when:

- the same content changes in both places;
- a file is renamed on one side and deleted on the other;
- a pull request is closed, reopened, reverted, or merged after Ossie changed;
- a branch is rebased or force-pushed;
- generated Markdown cannot preserve an Ossie resource identity;
- a Git change targets content already captured in an immutable Revision or
  Publication.

Without separately accepted rules for every case, automatic synchronization
could lose work, duplicate resources, revive deleted content, or misrepresent
what was published.

### Recommendation

**Reject broad two-way synchronization.**

Keep the Q2 boundary:

- Ossie may later send an exact snapshot to a GitHub proposal branch and pull
  request;
- GitHub does not automatically change Ossie;
- any future inbound content must use explicit Inspect and Apply;
- an immutable Revision or Publication is never rewritten.

This rejects the broad sync model, not the ability to reconsider one narrowly
defined inbound proposal workflow after real user demand exists.

### Alternatives

- **Defer:** leave two-way sync undecided until a concrete workflow and
  conflict model exist. This preserves optionality but leaves an unsafe idea
  appearing viable.
- **Accept:** build a full synchronization engine. This would require a
  dedicated ADR, authoritative identity manifest, branch/version rules,
  conflict UI, deletion tombstones, durable webhook/jobs, and explicit
  recovery semantics before implementation could begin.

### Rejected shortcuts

- last-write-wins;
- GitHub always wins;
- Ossie always wins while still calling the result “two-way”;
- matching resources only by path or slug;
- treating missing files as automatic deletion;
- treating a merged PR as automatic Apply, checkpoint, or publish;
- silently resolving conflicts;
- rewriting an immutable Revision or Publication after a Git change;
- trusting force-pushed history as a complete event record.

### Security, permission, source-of-truth, and lifecycle impact

Rejecting broad synchronization preserves the shipped V1 trust boundary:

- PostgreSQL and protected Files remain authority;
- existing Site and Project permissions remain the only mutation authority;
- GitHub credentials and webhooks cannot become ambient write authority;
- Git repository deletion, branch deletion, or force-push cannot delete Ossie
  content;
- immutable Revision and Publication history remains unchanged;
- no new credential, webhook, background-job, tenant-mapping, Audit, Access
  Evidence, or retention surface is created by child `140`.

### Migration, API, UI, URL, and compatibility impact

None. This is a planning decision only. Existing Package/Markdown export and
Inspect/Apply import remain compatible. Existing public URLs, Sites,
Revisions, Publications, and Git-independent deployments are unchanged.

### Reversibility

Rejecting broad synchronization is highly reversible at the planning level. A
future proposal can reopen it only with demonstrated demand and independently
accepted identity, conflict, deletion, credential, publication, and recovery
semantics.

### Evidence gaps

- no recorded user demand for editing the same content in both systems;
- no accepted identity manifest or Git repository layout;
- no accepted branch-to-Project-Version mapping;
- no conflict-resolution owner or UI;
- no accepted rename/delete/tombstone rules;
- no accepted force-push, PR lifecycle, or recovery model;
- no durable webhook/background-work infrastructure decision.

### Provisional disposition

`defer`. Do not design or implement bidirectional sync while Git integration
itself is only an accepted-later possibility. Reopen this question only if a
Git integration is selected for implementation.

### Simple decision requested

Should Ossie and GitHub automatically synchronize changes in both directions?

Recommended answer: **No. Keep the safer one-way Ossie-to-GitHub pull-request
proposal.**

### User clarification and answer

The user correctly challenged why this detailed question was being decided
when no Git integration is currently selected.

Revised recommendation:

- defer bidirectional-sync design rather than reject every possible future
  form;
- build no Git integration now;
- accept no two-way synchronization now;
- preserve Ossie as authority;
- reopen the question only if Git integration is selected.

User answer:

> Yes, I agree.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 11. Q4 — Should Ossie Support Documentation In Multiple Languages?

### Why this question is open

Some teams need the same Documentation Site in more than one language. This is
an independent product capability, not part of Git integration. Supporting it
safely requires more than translating text: Ossie must know which pages are
translations of each other, what to show when a translation is missing, and
which exact language variants belong to a Publication.

### Shipped V1 facts

- A Site has one `primary_language` declaration.
- V1 does not model translated Page variants or a translation workflow.
- Page identity, Navigation, search, Review, Revision, Publication, public
  URLs, and Carry-Forward currently operate without a locale dimension.
- Public output is always derived from one exact immutable Publication.
- No machine-translation provider or translator-specific role exists.
- No user demand or supported-language list is recorded.

### Current primary-source research

Retrieved 2026-07-31:

- BCP 47 defines standard language tags, including language, script, region,
  and variant subtags. Tags are case-insensitive and the IANA registry is the
  source for valid subtags:
  [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646).
- W3C recommends declaring a page's default language with the HTML `lang`
  attribute and changing the declaration where content switches language:
  [Declaring language in HTML](https://www.w3.org/International/questions/qa-html-language-declarations).
- W3C explains that language tags identify languages in HTML/XML and should
  use BCP 47 syntax:
  [Language tags in HTML and XML](https://www.w3.org/International/articles/language-tags/).
- Google documents that localized alternatives need explicit locale-specific
  URLs and `hreflang` relationships; every version should identify itself and
  the other alternatives:
  [Localized versions of pages](https://developers.google.com/search/docs/specialty/international/localized-versions).

### Inference

Translations cannot safely be represented as unrelated duplicate Pages. Ossie
would need stable translation identity and explicit behavior for:

- a source Page and its language variants;
- language/script/region tags such as `en`, `pt-BR`, or `zh-Hant`;
- missing or stale translations;
- localized Navigation, search, slugs, metadata, and accessibility language;
- review and publication completeness;
- Carry-Forward when the source changes;
- public locale URLs and fallback;
- optional machine-translation data leaving Ossie.

Adding only a language selector would create misleading or mixed-language
public output.

### Recommendation

Keep translation as an **accepted-later** capability, not the next
implementation by default.

If real users need it, begin with a small human-authored slice:

1. one primary language plus explicitly enabled BCP 47 locales;
2. stable Page-to-translation relationships;
3. a clear “translation unavailable” result instead of silently mixing
   languages;
4. locale-specific URLs, Navigation, search, metadata, and HTML language;
5. one immutable Publication containing exact variants;
6. stale-translation warnings when source content changes;
7. existing Site permissions for authors/reviewers;
8. no machine translation in the first slice.

Do not select it as `accept-next` until the full candidate review and actual
user need are known.

### Alternatives

- **Defer:** make no commitment until a target customer, languages, and
  workflow are known.
- **Reject:** keep one-language Sites as a permanent product boundary.
- **Accept-next:** select translation as the next master only if it is the
  strongest evidenced user problem after Q1–Q16.

### Rejected shortcuts

- treating `primary_language` as if it already models translations;
- copying Pages without stable translation relationships;
- falling back silently to another language inside a localized Page;
- publishing a locale with missing required Navigation or content while
  claiming it is complete;
- machine-translating private drafts without an accepted provider, consent,
  region, retention, and redaction policy;
- reinterpreting existing public URLs or Publications.

### Security, permission, source-of-truth, and lifecycle impact

- PostgreSQL and protected Files remain authority.
- Translation variants remain inside the same Organization, Project, Site, and
  permission boundary unless a future ADR explicitly changes it.
- Existing roles do not gain access merely because a locale exists.
- Review and Publication must authorize the exact language variants included.
- Search and public caches must separate locale results.
- Machine translation, if ever proposed, requires a separate provider-egress
  and confidential-draft decision.
- Removing a locale must not rewrite immutable Revisions or Publications.

### Migration, API, UI, URL, and compatibility impact

Child `140` changes none. A future implementation would require additive
translation identity, locale-aware API/types/UI, public URL and canonical/
`hreflang` rules, localized search projections, and a compatibility rule that
maps every existing Site to its current `primary_language` without changing
existing URLs or Publications.

### Reversibility

The accepted-later planning choice is reversible. The future data and URL model
would be expensive to change after launch, so it needs a dedicated ADR and an
implementation-ready plan before code.

### Evidence gaps

- no target users or requested languages;
- no translation volume or freshness expectation;
- no accepted translator role or review workflow;
- no fallback/completeness policy;
- no URL compatibility decision;
- no machine-translation provider or privacy authority.

### Provisional disposition

`accept-later` for a human-authored, locale-separated capability when supported
by real user demand. Do not select it as the next implementation from this
answer alone.

### Simple decision requested

Should we keep multi-language Documentation as a possible later feature?

Recommended answer: **Yes, later—but only when users need it. Start with human
translations and keep each language clearly separated.**

### User answer

> Yes, I agree.

Recorded interpretation:

- preserve multi-language Documentation as an accepted-later possibility;
- require real user demand before implementation;
- begin with human-authored translations;
- keep locale identity, content, URLs, Navigation, search, review, and
  Publication state explicitly separated;
- do not include machine translation in the first slice;
- do not select translation as `accept-next` before cross-question
  reconciliation.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 12. Q5 — Should Published Documentation Support Custom Domains?

### Why this question is open

Organizations may want readers to use a branded address such as
`docs.example.com` instead of an Ossie-owned address. This is an independent
access feature. It does not change which Publication is authoritative, but it
adds DNS ownership, HTTPS certificate, routing, and domain-takeover
responsibilities.

### Shipped V1 facts

- A stable Publish Link selects an exact immutable Publication.
- Link-wide public, restricted, or password access policy applies on the
  existing Ossie host.
- Public routing, canonical metadata, search, assets, operations, and Try It
  currently assume the configured Ossie deployment origin.
- No custom-domain mapping, DNS challenge, certificate issuance, renewal,
  revocation, or domain transfer model exists.
- No managed edge/domain provider or deployment-wide ACME owner is accepted.

### Current primary-source research

Retrieved 2026-07-31:

- ACME automates proof of domain control, certificate issuance, renewal, and
  revocation. The certificate authority must verify that the requester
  controls the domain:
  [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555).
- Let's Encrypt documents HTTP-01 and DNS-01 validation. DNS-01 can validate
  wildcard names but requires careful protection of DNS credentials:
  [Challenge types](https://letsencrypt.org/docs/challenge-types/).
- Let's Encrypt recommends automated renewal, retry/backoff, durable storage,
  monitoring, and testing against staging for large integrations:
  [Integration guide](https://letsencrypt.org/docs/integration-guide/).
- OWASP documents that untrusted Host headers can affect links, redirects,
  password-reset behavior, and internal routing if an application uses them
  without validation:
  [Testing for Host header injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection).

### Inference

A custom domain is not just a text setting. Ossie must prove control before
serving it and must keep certificate and routing state correct through:

- DNS propagation delays and stale records;
- failed or rate-limited certificate issuance or renewal;
- a domain moving between Organizations or Sites;
- deletion, archival, Publish Link revocation, or access-policy change;
- restricted/password cookies across different hosts;
- CSP, CORS, Try-It allowed origins, caches, canonical metadata, sitemap, and
  robots output;
- a former customer leaving DNS pointed at Ossie.

Without explicit deprovisioning and uniqueness rules, one tenant could claim or
receive traffic for another tenant's domain.

### Recommendation

Keep custom domains as an **accepted-later** capability for managed
deployments, not the next implementation by default.

A safe first slice should:

1. support one verified subdomain, such as `docs.example.com`, per Publish
   Link;
2. require an Organization Owner or Project Admin to configure it;
3. verify control with a unique expiring DNS challenge;
4. issue and renew HTTPS automatically through an operator-owned ACME service;
5. route only stored, active, verified host mappings;
6. keep the Publish Link's exact Publication selection and access policy;
7. define one canonical host and redirect the other supported host;
8. remove routing safely when verification, ownership, or the Publish Link
   ends.

Defer apex domains, wildcard domains, customer-uploaded certificates, and
multiple domains per link until demand is proven.

### Alternatives

- **Defer:** make no product commitment until deployment ownership and customer
  demand are known.
- **Reject:** require customers to place their own proxy/CDN in front of the
  existing Ossie host.
- **Accept-next:** choose managed custom domains only if branded public URLs
  are the strongest evidenced problem after the full candidate review.

### Rejected shortcuts

- trusting the request Host header without a stored active mapping;
- activating a domain before ownership verification;
- allowing duplicate active domain claims;
- never rechecking stale or transferred ownership;
- issuing certificates from user-controlled arbitrary ACME settings;
- sharing broad DNS-provider credentials;
- falling back to another tenant or default Site for an unknown custom host;
- widening restricted/password access because the hostname changed;
- treating the domain as Publication authority.

### Security, permission, source-of-truth, and lifecycle impact

- PostgreSQL remains authority for the domain-to-Publish-Link mapping.
- Protected Files and the exact Publication remain content authority.
- The deployment operator owns ACME account keys, certificate storage,
  renewal, monitoring, and provider configuration.
- Organization Owner or an explicitly authorized Project Admin owns the
  product mapping; ordinary public readers cannot configure it.
- Domain names are public configuration, but challenge tokens, ACME keys,
  certificate private keys, and DNS credentials must never enter Audit,
  Access Evidence, logs, or client responses.
- Unknown, expired, revoked, or duplicate hosts fail closed.
- Access cookies and Try-It origin rules must be scoped to the verified host
  without weakening existing link-wide access.

### Migration, API, UI, URL, and compatibility impact

Child `140` changes none. A future implementation would require additive domain
mapping and verification state, operator configuration, API/types/UI,
background renewal and monitoring, exact host routing, canonical/redirect/
cookie/CSP/CORS/cache behavior, and compatibility tests. Existing Ossie-hosted
Publish Links and URLs must continue to work unless a future explicit
canonical-host policy redirects them.

### Reversibility

The accepted-later planning choice is reversible. A future active domain must
be safely removable without deleting a Publish Link, Publication, Site, or
immutable history. DNS outside Ossie remains customer-owned and may continue
pointing at Ossie after deprovisioning, so unknown hosts must remain fail
closed.

### Evidence gaps

- no recorded customer demand;
- no accepted managed-hosting/edge provider;
- no ACME account and certificate-storage owner;
- no DNS challenge and revalidation interval;
- no apex-domain requirement;
- no accepted cookie/canonical redirect policy;
- no operational SLO for issuance or renewal failure.

### Provisional disposition

`accept-later` for one verified subdomain with managed HTTPS when supported by
real demand and an accepted deployment/operator model. Do not select it as the
next implementation from this answer alone.

### Simple decision requested

Should we keep branded addresses such as `docs.example.com` as a possible later
feature?

Recommended answer: **Yes, later—but start with one verified subdomain and
automatic HTTPS.**

### User answer

> Yes, later we should have these.

Recorded interpretation:

- preserve branded custom domains as an accepted-later possibility;
- begin with one verified subdomain per Publish Link;
- require proof of domain control and automatically managed HTTPS;
- preserve the exact Publication and Publish Link access policy as authority;
- do not select custom domains as `accept-next` before cross-question
  reconciliation and deployment ownership are resolved.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 13. Q6 — Should Public Readers Be Able To Leave Documentation Feedback?

### Why this question is open

Reader feedback can show authors which published pages are unclear or
unhelpful. Public input also creates spam, abuse, privacy, moderation,
retention, and notification responsibilities. It must remain separate from V1
private Page comments, which are an internal authoring workspace.

### Shipped V1 facts

- Page comments are private to authorized Project members.
- A public reader never becomes a Project member by opening a Publish Link.
- Public readers cannot mutate an immutable Publication.
- Audit and Access Evidence are content-free operational/security records, not
  product-feedback stores.
- No public feedback, moderation queue, spam control, notification, retention,
  consent, or data-subject workflow exists.
- No reader-feedback demand or desired success measure is recorded.

### Current primary-source research

Retrieved 2026-07-31:

- OWASP recommends identifying concrete feature-abuse cases and turning the
  selected risks into security requirements and tests. Its examples include
  hostile input in comment fields:
  [Abuse Case Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Abuse_Case_Cheat_Sheet.html).
- OWASP recommends syntactic and semantic input validation as early as
  possible, with allowlists and explicit size/range limits where practical:
  [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html).
- The NIST Privacy Framework is a voluntary risk-management framework for
  identifying and managing privacy risk while building products and services:
  [NIST Privacy Framework](https://www.nist.gov/privacy-framework).

### Inference

A public free-text comment box would collect untrusted and potentially
personal content before Ossie has accepted owners for moderation, abuse,
retention, deletion, export, or notification. A small structured signal can
answer whether a page helped while collecting much less data and creating a
smaller attack surface.

Feedback must be anchored to the exact Publication and Page the reader saw;
otherwise later edits would make the signal ambiguous.

### Recommendation

Keep public feedback as an **accepted-later** capability, but make its first
slice structured and minimal:

1. an Organization or Project explicitly enables feedback for a Publish Link;
2. a reader chooses “Helpful” or “Not helpful” on one exact Publication/Page;
3. an optional bounded reason uses a fixed list, not free text;
4. no account, email address, name, public profile, or public comment thread is
   created;
5. submissions are rate-limited and deduplicated with privacy-preserving,
   short-lived abuse controls;
6. authorized Project members see aggregate counts and fixed reasons;
7. retention and deletion are configurable and documented;
8. feedback never changes, comments on, or republishes Documentation.

Do not add public free-form comments in the first slice.

### Alternatives

- **Defer:** wait for evidence that authors need reader feedback and define the
  exact product question first.
- **Reject:** direct readers to an external support or issue channel.
- **Accept-next:** choose structured feedback only if it is the strongest
  evidenced problem after the full candidate review.
- **Free text later:** reconsider only with accepted moderation, abuse,
  identity, retention, deletion/export, and notification ownership.

### Rejected shortcuts

- exposing V1 private Page comments publicly;
- accepting unlimited anonymous free text;
- storing feedback text in Audit or Access Evidence;
- collecting email, IP address, full user agent, referrer, or stable tracking
  identity without an explicit need and privacy authority;
- showing raw feedback publicly;
- allowing feedback to mutate a Page or Publication;
- silently retaining submissions forever;
- relying on client-side validation or rate limiting alone.

### Security, permission, source-of-truth, and lifecycle impact

- PostgreSQL remains authority for feedback state; the exact Publication/Page
  anchor is immutable.
- Public readers may submit only when the Publish Link enables the feature;
  they receive no Project read or write permission.
- Project members need an explicit permission to view aggregates; only an
  authorized Admin controls enablement and retention.
- Fixed values are allowlisted and bounded; server-side rate, replay,
  duplicate, and tenant checks fail closed.
- Raw network identifiers, if temporarily required for abuse prevention, must
  be minimized, protected, time-limited, and excluded from author-facing data,
  Audit, and Access Evidence.
- Deleting feedback never changes an immutable Publication.

### Migration, API, UI, URL, and compatibility impact

Child `140` changes none. A future implementation would require additive
feedback policy and exact-anchor records, public submission and member
aggregate APIs, shared types, public-reader and portal UI, quotas/rate limits,
privacy/retention operations, and browser/security tests. Existing Publish
Links remain feedback-disabled by default.

### Reversibility

The structured, opt-in model is reversible: disabling it stops collection
without changing Documentation. Collected records still require an accepted
retention/deletion policy. Free-form or identity-bearing feedback would be
harder to reverse because it creates moderation and privacy obligations.

### Evidence gaps

- no recorded author or reader demand;
- no product question or success measure;
- no accepted retention duration or legal/privacy authority;
- no rate-limit infrastructure beyond the current in-process baseline;
- no moderation/notification owner;
- no decision on authenticated versus anonymous future feedback.

### Provisional disposition

`accept-later` for opt-in Helpful/Not helpful feedback with fixed reasons and
an exact Publication/Page anchor. Public comments, open text, and reader
identity are not accepted.

### Simple decision requested

Should we keep a simple “Helpful / Not helpful” reader-feedback feature as a
possible later capability?

Recommended answer: **Yes, later—but start with buttons and fixed reasons, not
public comments or open text.**

### User answer

> I agree with your recommendation.

Recorded interpretation:

- preserve structured reader feedback as an accepted-later capability;
- begin with Helpful/Not helpful and fixed reasons;
- collect no public comments, open text, reader names, or email addresses;
- attach feedback to the exact Publication/Page shown;
- require opt-in enablement, spam protection, minimized data, and a retention
  policy;
- do not select feedback as `accept-next` before cross-question
  reconciliation.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 14. Q7 — Should Documentation Include Reader Analytics?

### Why this question is open

Simple analytics can tell authors which published pages are used and where
readers encounter missing routes. Conventional analytics can also create
cross-page identifiers, cookies, fingerprints, detailed logs, third-party
data sharing, and legal/privacy obligations. This is separate from Q6's
explicit Helpful/Not helpful signal and from V1 security Access Evidence.

### Shipped V1 facts

- Public reads produce content-free Access Evidence for security and
  operations, not product analytics.
- V1 does not expose reader identities, page-view dashboards, visitor
  profiles, referrer reports, geography, sessions, funnels, or tracking IDs.
- Public search queries, Try-It requests, credentials, and content remain
  excluded from Audit/Access Evidence.
- Public output can be public, restricted, or password protected.
- No analytics processor, consent system, lawful/privacy owner, retention
  schedule, bot policy, or customer demand is recorded.

### Current primary-source research

Retrieved 2026-07-31:

- The European Commission explains privacy by design/default as building
  safeguards in from the beginning and, by default, processing only necessary
  data with short storage and limited access:
  [Data protection by design and by default](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations/what-does-data-protection-design-and-default-mean_en).
- The European Data Protection Board describes privacy by design/default as a
  continuous process whose defaults protect personal data:
  [Privacy by design and by default](https://www.edpb.europa.eu/topics/ai-and-technology/privacy-by-design-and-by-default_en).
- NIST's Privacy Framework treats privacy risk as an enterprise risk to manage
  across data processing and the data lifecycle:
  [NIST Privacy Framework](https://www.nist.gov/privacy-framework/privacy-framework).
- OWASP recommends transparency about collected information and warns about IP
  address leakage and privacy threats:
  [User Privacy Protection Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/User_Privacy_Protection_Cheat_Sheet.html).

### Inference

Ossie can answer a few useful Documentation questions without tracking a
person. Exact aggregate counters can show page demand and broken routes while
avoiding cookies, stable visitor IDs, IP retention, fingerprinting, and an
external analytics processor.

“Unique visitors,” sessions, journeys, geography, and detailed referrers would
require substantially more identifying or linkable data. They should not be
hidden inside a basic page-view feature.

### Recommendation

Keep analytics as an **accepted-later** capability, limited initially to
first-party, privacy-minimized aggregates:

1. an Organization or Project explicitly enables analytics for a Publish
   Link;
2. count page views against an exact Publication/Page and day;
3. count public not-found/gone outcomes and redirect use without storing the
   requested free-form path beyond what is safely predefined;
4. separate public, restricted, and password-link aggregates;
5. expose only thresholded aggregate counts to authorized Project members;
6. collect no cookies, persistent visitor IDs, fingerprints, IP addresses,
   user agents, raw referrers, geography, raw search queries, or Try-It data;
7. use no third-party analytics scripts or processor in the first slice;
8. define short retention and deletion for any temporary operational buffer,
   then retain only bounded aggregates.

Do not claim unique visitors, sessions, conversion funnels, or user journeys
in the first slice.

### Alternatives

- **Defer:** wait until authors identify a concrete question that current
  feedback and operations cannot answer.
- **Reject:** provide no product analytics and allow customers to operate an
  external proxy under their own policy.
- **Accept-next:** select the minimal aggregate model only if it is the
  strongest evidenced problem after the full candidate review.
- **Richer analytics later:** requires separate legal/privacy authority,
  consent/defaults, processor review, identifier model, retention, deletion,
  and data-subject handling.

### Rejected shortcuts

- repurposing Audit or Access Evidence as analytics;
- loading a third-party tracking script by default;
- setting tracking cookies or building browser fingerprints;
- retaining raw IP addresses, user agents, referrers, search terms, or Try-It
  request details;
- combining readers across Organizations, Sites, Publish Links, or access
  policies;
- calling an IP/hash/device key anonymous when it remains linkable;
- enabling analytics retroactively or silently;
- using analytics to weaken search or publication access isolation.

### Security, permission, source-of-truth, and lifecycle impact

- PostgreSQL remains authority for aggregate analytics state.
- Only an authorized Admin enables collection; authorized Project members see
  their tenant's aggregates only.
- Public readers gain no Project permission and receive no stable identifier.
- Restricted/password access identities and credentials never enter analytics.
- Raw event buffers, if operationally unavoidable, are minimized, access
  controlled, short lived, and excluded from Audit/Access Evidence and author
  exports.
- Publication/Page identity and access class are explicit aggregate keys.
- Disabling or deleting analytics does not alter Documentation, immutable
  history, security evidence, or feedback.

### Migration, API, UI, URL, and compatibility impact

Child `140` changes none. A future implementation would require additive
policy and aggregate records, bounded ingestion and rollup operations,
API/types/portal dashboards, quotas/retention/deletion, bot and cache behavior,
and privacy/security/browser verification. Existing Publish Links remain
analytics-disabled by default.

### Reversibility

An opt-in aggregate-only model is comparatively reversible: collection can be
disabled and aggregates deleted without changing published content. Tracking
identifiers, external processors, and detailed raw events would be harder to
reverse and are excluded from the first slice.

### Evidence gaps

- no concrete author question or success measure;
- no legal/privacy authority or target deployment regions;
- no accepted retention duration or minimum reporting threshold;
- no bot/cache counting policy;
- no durable event/rollup infrastructure beyond current in-process limits;
- no decision for richer authenticated-reader analytics.

### Provisional disposition

`accept-later` for opt-in, first-party, exact-Page aggregate counts that do not
track people. Persistent identifiers, personal details, third-party scripts,
and richer journey analytics are not accepted.

### Simple decision requested

Should we keep basic, privacy-friendly page statistics as a possible later
feature?

Recommended answer: **Yes, later—but count pages, not people. Do not use
tracking cookies or collect personal reader details.**

### User answer

> Yes, I agree.

Recorded interpretation:

- preserve privacy-minimized Documentation analytics as an accepted-later
  capability;
- count page demand and bounded routing outcomes, not people;
- use no tracking cookies, persistent visitor IDs, fingerprints, IP storage,
  personal reader details, or third-party scripts in the first slice;
- separate tenants, Publish Links, exact Publications/Pages, and access
  classes;
- leave richer analytics to a separate future privacy/legal decision;
- do not select analytics as `accept-next` before cross-question
  reconciliation.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 15. Q8 — Should People Outside A Project Be Invited To Review A Draft?

### Why this question is open

Documentation teams may need a customer, lawyer, partner, or subject expert to
review one draft without making that person a full Project member. This can
reduce account/permission overhead, but an invitation link could expose a
confidential draft if it is forwarded, guessed, retained too long, or scoped
too broadly.

### Shipped V1 facts

- V1 review is available only to authorized internal Project members.
- A Review Request targets one exact immutable Site Revision.
- Review approval is separate from permission to publish.
- Private review comments and decisions remain inside the Project boundary.
- Public/password Publish Links expose Publications, not draft Review
  Requests.
- No external reviewer identity, invitation, email delivery, token lifecycle,
  or conversion-to-membership model exists.

### Current primary-source research

Retrieved 2026-07-31:

- OWASP recommends least privilege, deny by default, permission checks on every
  request, protection of static resources, safe failure, and authorization
  tests:
  [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
- OWASP's token guidance recommends cryptographically random, sufficiently
  long, securely stored, single-use, expiring tokens, with rate limiting and
  no trust in a request Host header when constructing links:
  [Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- NIST SP 800-63B distinguishes authentication from session management and
  requires session secrets to be protected against prediction, disclosure,
  and unauthorized reuse:
  [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html).
- OWASP recommends unpredictable session identifiers, secure cookie handling,
  server-side expiration, logout invalidation, and reauthentication for risky
  events:
  [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

### Inference

A bare shareable URL is not enough for confidential review. The person who
opens the invitation should verify the invited email identity, and every
request should check that the invitation is active and limited to the exact
Review Request/Revision.

External review need not grant Project membership, working-draft access,
approval authority, or publication authority. Starting with read-only preview
and private comments gives useful review value with a narrower trust boundary.

### Recommendation

Keep external review as an **accepted-later** capability with a small first
slice:

1. an authorized Project Admin or Review Request owner invites one email
   address to one exact Review Request/Revision;
2. the invitation expires quickly, can be revoked, and cannot be reused to
   create new access after acceptance;
3. the reviewer must verify control of the invited email and receives a
   short-lived review session;
4. the reviewer can read the exact Revision and leave private review comments;
5. the reviewer cannot see the Working Draft, other Reviews, Project library,
   members, settings, assets outside the Revision, or internal comments;
6. the reviewer cannot approve, reject, checkpoint, edit, publish, export, or
   use Try It in the first slice;
7. closing, expiring, or revoking the Review removes access immediately;
8. Access Evidence records the invited external identity and allowed/denied
   review access without storing token or comment content.

Approval authority can be considered later only with explicit threshold,
self-review, identity, legal-signoff, and audit semantics.

### Alternatives

- **Defer:** require external people to become normal Project members until
  demand and notification infrastructure exist.
- **Reject:** export a Package/PDF-like snapshot outside Ossie under the
  customer's own process.
- **Accept-next:** choose read/comment external review only if it is the
  strongest evidenced problem after the full candidate review.
- **External approval later:** requires a separate high-assurance decision and
  must still never grant publication authority.

### Rejected shortcuts

- reusing a public/password Publish Link as a review invitation;
- granting implicit Project membership;
- using a permanent or reusable bearer link without identity verification;
- allowing a forwarded link to change the invited identity;
- targeting the mutable Working Draft instead of an exact Revision;
- exposing unrelated protected Files or Project resources;
- allowing external approval/publish in the first slice;
- constructing invitation URLs from an untrusted Host header;
- placing invitation tokens, private comments, email content, or draft content
  in Audit/Access Evidence or logs.

### Security, permission, source-of-truth, and lifecycle impact

- PostgreSQL remains authority for Review, invitation, identity binding,
  expiry, revocation, and comment state.
- Protected Files remain accessible only through the exact authorized Revision
  projection.
- The invitation is a narrow relationship, not a role or membership.
- Issuer permission and invitation status are revalidated on every request.
- Tokens are random, hashed at rest, single purpose, short lived, rate limited,
  and redacted everywhere.
- Email delivery is an external processor/infrastructure prerequisite with
  bounce, retry, abuse, privacy, and domain configuration ownership.
- Closing the Review or revoking the invitation invalidates sessions without
  rewriting immutable history.

### Migration, API, UI, URL, and compatibility impact

Child `140` changes none. A future implementation would require additive
external invitation/identity/session records, email delivery, exact-review
authorization, API/types, reviewer preview/comment UI, Project management UI,
Access Evidence, expiry/revocation operations, and security/browser tests.
Existing internal Review Requests and Publish Links remain unchanged.

### Reversibility

An exact, expiring invitation is reversible: revoke it or close the Review and
future access ends without changing the Revision or Project membership.
Comments already accepted need an explicit retention/deletion policy. Broad
membership or external approval authority would be harder to reverse and is
excluded from the first slice.

### Evidence gaps

- no recorded customer/expert review demand;
- no accepted email provider, sender-domain, retry, or bounce owner;
- no external identity/account model;
- no accepted invitation/session duration;
- no comment retention or external-reviewer data-subject workflow;
- no accepted future external approval requirement.

### Provisional disposition

`accept-later` for verified, expiring access to one exact Revision with private
comments only. Project membership, editing, approval, export, Try It, and
publication authority are not accepted.

### Simple decision requested

Should we keep invited external draft review as a possible later feature?

Recommended answer: **Yes, later—but external reviewers should only see one
exact draft and leave private comments. They should not become Project members
or approve/publish anything.**

### User answer

> Yes, I agree.

Recorded interpretation:

- preserve external draft review as an accepted-later capability;
- bind one verified external identity to one exact Review Request/Revision;
- allow temporary read access and private review comments only;
- grant no Project membership, Working Draft access, editing, approval,
  export, Try It, or publication permission;
- require expiration, immediate revocation, protected resources, and Access
  Evidence;
- do not select external review as `accept-next` before cross-question
  reconciliation.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 16. Q9 — Should Authors See And Edit With Each Other In Real Time?

### Why this question is open

When two authors work on the same Page, they may want to see each other's
presence and eventually edit together like a shared document. Presence is a
small awareness feature. Simultaneous editing is a much larger change to
Ossie's document authority, conflict, persistence, reconnect, undo, review,
and checkpoint model.

### Shipped V1 facts

- PostgreSQL relational Working Draft resources are authoritative.
- Page saves use Row Versions and preserve local work on stale-write conflict.
- Tiptap is an editor adapter; its browser state is not authority.
- Constrained blocks, server validation, limits, comments, Review, immutable
  Revisions, and Publication operate on persisted relational state.
- No WebSocket endpoint, presence room, CRDT/OT document, collaboration server,
  operation log, reconnect queue, or horizontal realtime infrastructure exists.
- No demonstrated simultaneous-editing demand or concurrency telemetry is
  recorded.

### Current primary-source research

Retrieved 2026-07-31:

- WebSocket provides a persistent two-way client/server channel, includes an
  origin-based browser security model, and requires explicit handling of
  authentication, origin, limits, invalid data, and abnormal closure:
  [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455).
- Yjs describes a CRDT shared-data model whose concurrent changes merge and
  which supports rich-text bindings, offline editing, snapshots, undo/redo,
  and shared cursors. Its networking and persistence are separate provider
  responsibilities:
  [Yjs repository and documentation](https://github.com/yjs/yjs).
- Yjs lists a Tiptap/ProseMirror binding and notes that providers manage client
  communication, awareness, and offline storage; provider selection still
  determines authentication, persistence, scaling, and operational ownership:
  [Yjs providers](https://github.com/yjs/yjs#providers).
- Hocuspocus is Tiptap's extensible Yjs WebSocket backend and therefore one
  possible adapter, not an automatic authority decision:
  [Hocuspocus repository](https://github.com/ueberdosis/hocuspocus).

### Inference

Adding cursors is not equivalent to making collaborative edits durable.
Presence can remain ephemeral and advisory. Shared editing requires a durable
mapping between a collaboration document and Ossie's constrained relational
Page, plus deterministic validation and checkpoint behavior.

A library can merge text operations, but it cannot decide Ossie's permissions,
block constraints, revoked-user behavior, Page deletion, asset ownership,
Review state, or immutable Revision rules. Those remain product/server
responsibilities.

### Recommendation

Keep realtime collaboration as an **accepted-later** direction, split into two
gates:

1. **Presence first:** authorized Project members can see who else currently
   has the same editable Page open. Presence is ephemeral, coarse, optional,
   and not retained as authoring history.
2. **Shared editing later:** do not accept simultaneous mutation until real
   demand and a dedicated ADR define the authoritative CRDT/operation model,
   persistence, validation, reconnect, revocation, undo, checkpoint, Review,
   and scaling semantics.

The presence slice must not claim that it prevents Row Version conflicts.

### Alternatives

- **Defer all realtime work:** keep current stale-write recovery until demand
  proves presence or shared editing is valuable.
- **Presence only permanently:** show viewers/editors while retaining ordinary
  single-author saves and Row Versions.
- **Accept shared editing next:** requires a dedicated master and ADR after the
  full candidate review; it cannot be a small editor-only patch.

### Rejected shortcuts

- storing authoritative edits only in browser/Tiptap/Yjs memory;
- assuming CRDT merge makes server validation unnecessary;
- running an unauthenticated or cross-tenant WebSocket room;
- checking authorization only during initial connection;
- allowing a revoked user to continue sending accepted operations;
- treating presence as Audit, approval, or durable authorship evidence;
- replacing Row Versions before a compatibility/migration decision;
- auto-checkpointing or publishing collaboration state;
- bundling offline mutation into the first presence slice;
- selecting a hosted collaboration provider without privacy, region,
  credential, retention, and failure ownership.

### Security, permission, source-of-truth, and lifecycle impact

- Presence is visible only to authorized Project members on the same resource
  and contains the minimum display identity already available to them.
- Permission, tenant, origin, connection, room, and message checks fail closed;
  authorization is refreshed and revocation disconnects promptly.
- Presence expires automatically on disconnect/timeout and is not retained in
  Audit or Access Evidence as behavioral history.
- PostgreSQL relational Working Drafts remain authority during presence-only.
- A future shared-editing model must persist server-authorized state durably
  before acknowledging it and project validated relational content for Review,
  Revision, Publication, search, export, and Carry-Forward.
- Tokens, raw operation payloads, cursor positions, and connection content do
  not enter logs, Audit, or Access Evidence.

### Migration, API, UI, URL, and compatibility impact

Child `140` changes none. Presence would require additive ephemeral room/
connection contracts, authenticated realtime transport, UI, deployment and
scaling configuration, and security/browser tests without changing current
save APIs. Shared editing would require a separate schema/authority/API/editor/
migration/compatibility plan and preservation of existing Page JSON, Row
Versions, revisions, and offline/error recovery until deliberately replaced.

### Reversibility

Presence-only is comparatively reversible because it does not own content.
Shared editing is difficult to reverse after CRDT state becomes authoritative,
so it must not be inferred from accepting presence or from Tiptap/Yjs library
availability.

### Evidence gaps

- no concurrent-author demand or measured conflict frequency;
- no accepted presence privacy preference;
- no durable realtime transport/scaling owner;
- no CRDT/OT and relational projection ADR;
- no revoked-user, reconnect, validation, undo, or checkpoint model;
- no provider region, retention, outage, or cost decision.

### Provisional disposition

`accept-later` for ephemeral same-Page presence. `defer` simultaneous editing
until demonstrated demand and a dedicated authority/persistence ADR exist.

### Simple decision requested

Should we keep realtime author collaboration as a possible later feature?

Recommended answer: **Yes, later—but first only show who is viewing the same
Page. Decide simultaneous editing separately when users actually need it.**

### User answer

> Yes, I agree.

Recorded interpretation:

- preserve ephemeral author presence as an accepted-later capability;
- retain PostgreSQL relational Working Drafts, Row Versions, and current save
  behavior during presence-only work;
- do not retain presence as authoring/Audit history;
- defer simultaneous editing until real demand and a dedicated CRDT/operation,
  persistence, permission, reconnect, validation, and checkpoint decision;
- do not select either collaboration slice as `accept-next` before
  cross-question reconciliation.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 17. Q10 — Should Authors Read Or Edit Documentation While Offline?

### Why this question is open

Authors may lose connectivity while traveling or working on an unreliable
network. Showing previously loaded information offline is different from
allowing edits that must later merge with server changes. Offline mutation
stores confidential drafts and authorization state on a device after the
server can no longer revoke access in real time.

### Shipped V1 facts

- PostgreSQL and protected Files are authority.
- The authoring UI reports online, saving, saved, offline, and error states but
  does not promise offline mutation.
- Stale Row Version conflicts preserve local work and require deliberate user
  recovery.
- No service worker, offline app shell, protected-content cache policy,
  IndexedDB draft store, encrypted device key, operation queue, reconnect
  merge, multi-device identity, or remote cleanup exists.
- Public reader caching is exact-Publication HTTP behavior, not an authoring
  offline guarantee.
- No user demand or target offline duration is recorded.

### Current primary-source research

Retrieved 2026-07-31:

- The W3C Service Workers specification provides fetch interception and a
  response store for offline-enabled web applications, while noting worker
  lifecycle, origin, CSP, cross-origin, security, and privacy concerns:
  [Service Workers](https://www.w3.org/TR/service-workers/).
- IndexedDB provides transactional persistent browser storage scoped through
  browser storage keys/origins, with its own privacy and security model:
  [Indexed Database API](https://www.w3.org/TR/IndexedDB/).
- OWASP warns against storing sensitive information or session identifiers in
  Web Storage, notes that local data is exposed to same-origin script/XSS, and
  recommends assuming client-side storage can be manipulated:
  [HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html).
- MDN describes cache-first, network-first, and stale-while-revalidate
  strategies and their different freshness/offline tradeoffs:
  [PWA caching guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching).

### Inference

Read-only caching can improve resilience without creating a second mutable
authority, but cached private drafts may remain available on a lost/shared
device after membership is revoked. It therefore still needs explicit opt-in,
scope, age, cleanup, and device-security rules.

Offline editing is materially harder. Every queued change must be authenticated
and fully revalidated after reconnect, then shown as a conflict when server
state, permissions, deletion, archive, or Project Version changed. Automatic
last-write-wins would risk lost or unauthorized work.

### Recommendation

Split the future direction:

1. **Accept later: offline read-only access** to explicitly saved, bounded
   authoring snapshots on trusted personal devices, only after a device-cache
   security and cleanup plan exists.
2. **Defer offline editing** until demonstrated demand and an independently
   accepted encrypted local-store, queued-operation, revocation, reconnect,
   merge/conflict, multi-device, and attribution model exist.

For a first read-only slice:

- make saving for offline use explicit per user/resource;
- show the snapshot time and a clear read-only/offline state;
- never cache credentials, Try-It data, review invitations, or unrestricted
  Project content automatically;
- bound storage size and maximum age;
- clear cached content on logout and provide a manual clear-device action;
- require a successful online authorization refresh before any edit, export,
  review decision, checkpoint, or publication action.

### Alternatives

- **Defer all offline work:** rely on current online/error recovery until user
  demand exists.
- **Reject private offline storage:** allow only already-public Publication
  caching through normal browser/HTTP behavior.
- **Accept offline mutation next:** requires a dedicated master and ADR after
  the complete candidate review; it cannot be inferred from the current
  autosave offline label.

### Rejected shortcuts

- claiming current autosave status supports offline editing;
- silently caching all private Project content;
- storing session tokens, passwords, Try-It credentials, or invitation tokens
  with offline content;
- trusting client-side queued operations or timestamps;
- replaying operations without current actor, tenant, permission, lifecycle,
  Row Version, limits, and validation checks;
- last-write-wins or invisible automatic merge;
- allowing offline edits to checkpoint, approve, publish, or delete;
- assuming logout can remotely erase data from an already offline device;
- bundling offline mutation into realtime collaboration.

### Security, permission, source-of-truth, and lifecycle impact

- PostgreSQL and protected Files remain authority; a cache is a labeled local
  copy, never publication or authoring authority.
- Offline availability is user/device/resource scoped and opt-in.
- The device cannot learn new permission or revocation state while offline;
  cached access must expire locally and all mutations require online
  reauthorization.
- Local records are minimized, integrity checked, origin scoped, encrypted
  where the accepted threat model makes that meaningful, and never contain
  reusable secrets.
- Server Access Evidence is emitted only for real server access, not inferred
  from offline reads.
- Clearing, expiry, logout cleanup, browser eviction, and device loss behavior
  must be explicit and honestly documented.

### Migration, API, UI, URL, and compatibility impact

Child `140` changes none. A future read-only slice would require a versioned
cache manifest, service worker/storage scope, opt-in/clear UI, freshness and
quota behavior, protected asset handling, CSP/security/browser verification,
and online authorization refresh. Offline mutation would require separate
operation/schema/API/merge/conflict/Audit compatibility planning and must
preserve current Row Version recovery until deliberately replaced.

### Reversibility

Read-only opt-in caching is partly reversible in the product but cannot
guarantee remote deletion from an offline or copied device; that limitation
must be explicit. Offline mutation becomes difficult to reverse once queued
operations and merge semantics are a supported contract, so it remains
deferred.

### Evidence gaps

- no offline user demand, target workflow, or maximum duration;
- no trusted-device or shared-device policy;
- no accepted browser/device encryption threat model;
- no cache retention, size, or protected-asset scope;
- no queued-operation or conflict model;
- no multi-device, revoked-user, lost-device, or remote-wipe guarantee;
- no browser support matrix beyond current Chromium evidence.

### Provisional disposition

`accept-later` for explicit, bounded, read-only offline snapshots after a
device-cache policy exists. `defer` offline mutation until demonstrated demand
and an independently accepted security/merge model exist.

### Simple decision requested

Should we keep offline Documentation use as a possible later capability?

Recommended answer: **Allow saved read-only pages later. Defer offline editing
until users need it and safe merge/security rules are designed.**

### User answer

> Yes, I agree with you.

Recorded interpretation:

- preserve explicit, bounded offline read-only snapshots as an accepted-later
  possibility;
- require trusted-device, expiry, clear/logout, protected-content, and online
  reauthorization rules before implementation;
- defer offline mutation until user demand and safe queued-operation,
  revocation, reconnect, validation, attribution, and merge semantics exist;
- retain PostgreSQL and protected Files as authority;
- do not select either offline slice as `accept-next` before cross-question
  reconciliation.

Final decision: Provisional until the complete Q1–Q17 ledger is reconciled and
accepted.

## 18. Q11 — When Should Ossie Permanently Delete Customer Data?

### Why this question is open

V1 supports recoverable archive and preserves immutable Publications and
append-only operational evidence. Permanent deletion is different: it can make
data unrecoverable and must account for shared Files, users, Projects,
Organizations, public links, caches, backups, restores, legal holds, security
records, contracts, and data-protection rights.

This is inherently cross-product when it includes a Project, Organization,
user identity, shared File, Audit, Access Evidence, or backup. It cannot be
owned by a Documentation-only implementation plan.

### Shipped V1 facts

- Archive is recoverable and is not permanent deletion.
- Site Revisions and Publications are immutable.
- Audit and Access Evidence are append-only and content-free.
- Files can be shared/protected outside one Documentation resource.
- Public URLs can have redirects, aliases, stable Publish Links, and
  intentional `gone` behavior.
- Customer-content retention and governed permanent deletion are not shipped.
- Backup/restore deletion propagation, legal hold, approval, dry-run impact,
  cancellation, and recovery windows are not defined.
- No authorized legal, contractual, statutory, billing, or security-evidence
  retention schedule is recorded.

### Current primary-source research

Retrieved 2026-07-31:

- The European Commission explains that erasure rights exist but are not
  absolute; data may need to be retained for legal obligations, public
  interest, expression, research/statistics, or legal claims:
  [When deletion is required](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/dealing-requests-individuals/do-we-always-have-delete-personal-data-if-person-asks_en).
- GDPR principles include purpose limitation, data minimization, storage
  limitation, security, and accountability, and require communicating the
  storage duration or criteria:
  [European Commission GDPR principles](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en).
- NIST SP 800-88 Rev. 2 defines media sanitization as making target data access
  infeasible for a stated effort level and requires a sensitivity-appropriate
  sanitization program:
  [NIST media sanitization guidance](https://csrc.nist.gov/pubs/sp/800/88/r2/final).
- PostgreSQL continuous backups and WAL can restore a database to an earlier
  state; backup retention is operator-managed and recovery operates at whole-
  cluster scope rather than deleting one row from old backups:
  [PostgreSQL continuous archiving and PITR](https://www.postgresql.org/docs/current/continuous-archiving.html).

### Inference

“Delete now” cannot honestly mean that every historical backup bit disappears
immediately. A safe product promise must distinguish:

- active-system inaccessibility;
- queued deletion from primary data, Files, projections, caches, and replicas;
- delayed expiry from protected backups;
- prevention of deleted data being resurrected after restore;
- legally retained evidence or identity pseudonymization;
- media/device sanitization at infrastructure end of life.

Deleting a Documentation Site alone can also break shared File references,
public URL semantics, actor attribution, or cross-product records. Engineering
cannot choose the required retention or legal exceptions.

### Recommendation

**Defer governed permanent deletion until an authorized cross-product
retention policy and legal/compliance owner exist.**

Keep recoverable archive as the current user-facing lifecycle. Before any
permanent-delete implementation, require a Knowledge Platform decision that
defines:

1. every resource/data class and its owner;
2. purpose and retention period or criteria;
3. legal hold and exception authority;
4. export-before-delete, reauthentication, approval/quorum, and exact impact
   report;
5. cancellation and recovery windows;
6. shared File/reference and immutable Publication behavior;
7. public URL tombstones and identifier/domain reuse;
8. primary, replica, cache, object/File storage, backup, restore, and restored-
   snapshot propagation;
9. Audit/Access Evidence and deleted-actor attribution;
10. idempotent asynchronous execution, partial failure, monitoring, and proof
    of completion;
11. truthful deletion and media/cryptographic-erasure claims.

This defers implementation, not the responsibility to create a compliant
retention/deletion policy.

### Alternatives

- **Accept-next as cross-product work:** only if the user appoints the legal/
  compliance/operator owners and makes retention/deletion the highest-priority
  problem after the complete candidate review.
- **Documentation-only deletion:** possible only for a narrowly proven data
  class with no shared identity/File/evidence/backup/public-link impact; no such
  safe slice is currently established.
- **Reject permanent deletion:** unsafe as a blanket product promise because
  legal/contractual requirements may require deletion in some deployments.

### Rejected shortcuts

- equating archive, export, or hiding UI with deletion;
- hard-cascade deleting a Site/Project/Organization;
- erasing immutable Publications or append-only evidence silently;
- deleting shared Files without complete reference proof;
- claiming immediate deletion from immutable/protected backups;
- restoring a backup without replaying deletion tombstones/ledger state;
- reusing public slugs, aliases, Publish Link tokens, custom domains, or stable
  identifiers without an accepted policy;
- choosing retention periods in code or an engineering plan;
- accepting permanent deletion without legal hold and exception behavior;
- emitting customer content or sensitive impact details into Audit logs.

### Security, permission, source-of-truth, and lifecycle impact

- PostgreSQL remains lifecycle authority; protected Files and all derived
  systems must follow an accepted deletion operation.
- Only explicitly authorized high-assurance actors can request or approve a
  future permanent deletion; reauthentication and separation/quorum may be
  required by scope.
- A dry-run impact report must be tenant scoped, permission checked, and safe
  from cross-tenant metadata disclosure.
- Legal hold overrides ordinary deletion until released by authorized policy.
- An append-only content-free deletion ledger may be necessary to prevent
  restore resurrection and prove orchestration without retaining deleted
  content; exact retention requires authority.
- Failed/partial jobs fail closed, remain retryable/idempotent, and never report
  completion prematurely.

### Migration, API, UI, URL, and compatibility impact

Child `140` changes none. A future cross-product implementation would require
data classification and policy, hold/deletion-operation schemas, dependency
graphs, async orchestration, File/cache/replica/backup adapters, dry-run and
approval APIs/UI, Audit/Access boundaries, restore reconciliation, public URL
semantics, operator runbooks, and destructive-path verification. Existing
archive and immutable records remain unchanged until that work is separately
accepted.

### Reversibility

Deferral is reversible. Permanent deletion is intentionally irreversible after
its recovery window, so its policy, authority, preview, cancellation, backup,
restore, and proof semantics must be accepted before implementation. A wrong
implementation may be impossible to repair.

### Evidence gaps

- no authorized retention schedule or governing jurisdiction/contract set;
- no legal/compliance, security-evidence, billing, or backup owner;
- no data-class dependency/reference inventory across the product;
- no legal hold or approval/quorum model;
- no backup/object-storage/replica deletion and restore policy;
- no accepted public URL/identifier reuse policy;
- no durable cross-product asynchronous job infrastructure;
- no truthful deletion-completion SLO or evidence contract.

### Provisional disposition

Pending explicit user authority.

### Simple decision requested

Should we defer permanent deletion until legal, retention, backup, and
cross-product rules are formally decided?

Recommended answer: **Yes. Keep recoverable archive for now. Design permanent
deletion later as a separate Knowledge Platform project with legal and
operational owners.**

## 19. Questions Not Yet Opened

Q12 through Q17 remain unmade. Their full implementation-safe question
contracts are defined in Plan `140`. They will be copied into this record one
at a time with current primary-source research only when opened.

## 20. Session Log

- 2026-07-31: started from clean `main` commit `df409d0`; no implementation
  drift existed after the independently rechecked Plan `140`.
- 2026-07-31: recorded shipped V1 facts, verification, limitations,
  disposition vocabulary, evidence labels, and the unopened candidate ledger.
- 2026-07-31: opened Q1. No provisional or final disposition has been recorded.
- 2026-07-31: the user chose the review-first Q1 direction. Recorded a
  provisional defer of immediate implementation and opened Q2.
- 2026-07-31: the user accepted the narrow Q2 recommendation. Recorded
  one-way Ossie-to-GitHub pull-request proposals as `accept-later`, preserved
  Ossie authority and explicit import/apply boundaries, and opened Q3.
- 2026-07-31: the user clarified that detailed two-way-sync design is
  premature while Git integration is not selected. Recorded Q3 as deferred
  until a Git implementation is selected, preserved Ossie authority, and
  opened the independent translation candidate in Q4.
- 2026-07-31: the user accepted human-first, locale-separated translation as
  an `accept-later` possibility subject to real demand. No machine translation
  or next implementation was selected. Opened custom domains as Q5.
- 2026-07-31: the user accepted verified custom domains with managed HTTPS as
  an `accept-later` possibility. No next implementation or infrastructure
  owner was selected. Opened bounded public feedback as Q6.
- 2026-07-31: the user accepted structured Helpful/Not helpful feedback as an
  `accept-later` possibility, with fixed reasons and no public comments, open
  text, or reader identity. Opened privacy-minimized public analytics as Q7.
- 2026-07-31: the user accepted first-party aggregate Documentation analytics
  as an `accept-later` possibility that counts pages, not people. Persistent
  identifiers, personal details, and third-party tracking remain excluded.
  Opened exact-scope external review as Q8.
- 2026-07-31: the user accepted exact-Revision external review as an
  `accept-later` possibility with verified, expiring read/comment access only.
  Project membership and decision/publication authority remain excluded.
  Opened realtime presence and collaboration as Q9.
- 2026-07-31: the user accepted ephemeral same-Page author presence as an
  `accept-later` possibility and deferred simultaneous editing until real
  demand and an authoritative collaboration model exist. Opened offline use as
  Q10.
- 2026-07-31: the user accepted bounded offline read-only snapshots as an
  `accept-later` possibility and deferred offline mutation until real demand
  and safe security/merge semantics exist. Opened governed permanent deletion
  as the cross-product Q11 decision.

## 21. Verification Record

Initial checkpoint verification:

- Prettier over the grill record and child `140`: passed;
- `git diff --check`: passed;
- scoped path check: passed; only the grill record and child `140` changed;
- baseline drift check: passed; no commit exists after the independently
  rechecked plan checkpoint;
- candidate ledger: all Q1–Q17 entries present, with only the current question
  open;
- no Master `007`, child `141`, ADR, runtime, schema, route, dependency, or
  browser artifact was created.

No runtime tests, migrations, dependency operations, or agent-browser sessions
are required for this documentation-only checkpoint.

## 22. Current Handoff

Awaiting explicit user/product authority for Q11. Do not open Q12 until Q11 is
recorded.
