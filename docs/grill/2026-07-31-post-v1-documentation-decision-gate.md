# Post-V1 Documentation Decision Gate

Date started: 2026-07-31

Status: In progress. Q1 through Q5 are provisionally recorded and Q6 is open
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
| Q6       | Public feedback                                                 | Open       | Pending                          | Pending         |
| Q7       | Public analytics                                                | Not opened | None                             | Pending         |
| Q8       | External reviewer access                                        | Not opened | None                             | Pending         |
| Q9       | Realtime collaboration and presence                             | Not opened | None                             | Pending         |
| Q10      | Offline editing and merge                                       | Not opened | None                             | Pending         |
| Q11      | Governed permanent deletion and retention                       | Not opened | None                             | Pending         |
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

Pending explicit user authority.

### Simple decision requested

Should we keep a simple “Helpful / Not helpful” reader-feedback feature as a
possible later capability?

Recommended answer: **Yes, later—but start with buttons and fixed reasons, not
public comments or open text.**

## 14. Questions Not Yet Opened

Q7 through Q17 remain unmade. Their full implementation-safe question
contracts are defined in Plan `140`. They will be copied into this record one
at a time with current primary-source research only when opened.

## 15. Session Log

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

## 16. Verification Record

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

## 17. Current Handoff

Awaiting explicit user/product authority for Q6. Do not open Q7 until Q6 is
recorded.
