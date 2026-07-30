# Child Plan 136: Documentation Review And Approval Workflow

Date reserved: 2026-07-30

Date expanded: 2026-07-30

Status: Expanded, independently rechecked, and implementation-ready; not
implemented. The child `135` sequence gate is satisfied, and the docs-only
checkpoint is complete.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/135-documentation-carry-forward-multi-site-and-lifecycle.md`

Next child:

- `docs/plan/137-documentation-api-try-it-and-example-experience.md`

## 1. Sequence Gate And Implemented Baseline

Child `135` is complete and independently close-rechecked. Plan `136` starts
from these implemented truths:

- one stable Project-owned Documentation Site may have one independently
  mutable Site Edition per Project Version;
- Site Revision is the exact immutable whole-Site snapshot and is the only
  accepted review target;
- Revision `creation_trigger` is immutable and may be
  `manual_checkpoint`, `publication`, or `carry_forward`;
- Carry-Forward returns a separate `carry_forward` operation and ordered
  `items`, creates or reuses the exact source Revision, creates fresh mutable
  target state, and carries no comment or review state;
- Project, Project Version, Edition, Page, Snippet, Asset, and OpenAPI
  lifecycle rules already produce authoritative stored/effective read-only
  behavior;
- comments are private Page-authoring records, are excluded from Revision,
  Publication, search, export, and public output, and become mutation-read-only
  with an archived Page or Edition;
- Publication is an immutable Site Publication plus an atomic Publish Link
  entry switch; retained immutable public output is not rewritten by later
  lifecycle or review changes;
- Project Membership is the only internal role/identity authority;
- Audit Events and Access Evidence are mandatory, tenant-scoped, and
  content-safe;
- the repository has no email provider, webhook provider, message queue, push
  provider, or general notification delivery service.

Review runtime must not begin until this expanded plan has been independently
rechecked against the then-current worktree. That recheck must account for any
changes after commit `569d33b`.

## 2. Goal

Add a formal, private, internal review workflow for exact Documentation Site
Revisions:

1. an Admin or Editor requests review of an exact Revision;
2. the request freezes its reviewer set and threshold;
3. assigned active Project users approve or reject;
4. a later exact Revision supersedes an older open request without changing
   historical decisions;
5. an optional Edition policy can require sufficient current valid approval
   before a Publication or rollback becomes live;
6. a Project Admin can perform an atomic, reasoned, audited publication
   override;
7. participants receive a durable, private in-product review inbox;
8. authorized users can inspect safe change summaries and complete review
   history without exposing bodies through notifications, Audit, Access
   Evidence, logs, or public output.

Approval is optional by default. This child does not make review mandatory for
existing or newly created Editions.

## 3. Accepted Product Decisions

### 3.1 Exact target

A Review Request targets exactly one immutable `site_revision.id`.

- It never targets a mutable Working Draft, Page, comment thread, Publication,
  Publish Link, stable Site identity, or an unspecified “latest” state.
- The Revision must belong to the route's Organization, Project, Project
  Version, stable Site, and selected Site Edition.
- A request may target only the latest Revision number for that Edition at
  request-creation time.
- Creating a Review Request never checkpoints the Working Draft implicitly. If
  the Working Draft has changed after the latest Revision, the UI warns that
  those changes are outside the request and requires the author to use the
  existing explicit checkpoint flow first when they want them reviewed.
- Review detail links open the existing immutable Revision preview.
- Publication enforcement compares the exact requested
  `site_revision_id`; approval for Revision `N` never authorizes Revision
  `N+1`.

### 3.2 Draft change and supersession rule

Ordinary Working Draft mutation does not rewrite or invalidate an exact
Revision review. The UI must state that review applies to the checkpoint, not
to unsaved or later draft content.

When `create_revision` creates a genuinely new Revision row:

- lock the Edition's open Review Request, if any;
- mark an open request for an older Revision `superseded`;
- record `superseded_by_revision_id`, `superseded_at`, and the Revision-creating
  actor;
- increment the request Row Version;
- create safe in-product inbox events for its requester and assigned
  reviewers;
- include the supersession as Change Items in the same logical Revision Audit
  Event and transaction.

When checkpoint, Publication, or Carry-Forward reuses an identical existing
Revision, it does not supersede anything. Closed approved/rejected/canceled
requests remain immutable history.

An approval for an older Revision remains approval of that exact immutable
Revision. It is “historical” relative to a later Revision and cannot satisfy a
gate for the later Revision.

### 3.3 Request lifecycle

Stored request statuses:

```text
open -> approved
open -> rejected
open -> canceled
open -> superseded
```

Rules:

- at most one `open` request exists per Site Edition;
- rejected, canceled, and superseded requests are terminal;
- approved requests are terminal;
- a new request may be created after a prior request closes, including for the
  same exact Revision;
- assignments are frozen when the request is created;
- assignment changes require canceling and creating a new request;
- requester cannot assign themself;
- one assigned reviewer may submit at most one decision;
- rejection closes the request immediately;
- approval closes the request when its frozen threshold and frozen maintainer
  rule are met;
- no decision is accepted after the request leaves `open`;
- terminal records are never reopened or edited.

Archiving a Project, Project Version, or Site Edition blocks request, decision,
cancel, policy, and publication mutations but does not rewrite Review Requests
or synthesize terminal decisions. Restore likewise performs no review-state
transition: a request that was open remains open, an exact approval remains
subject to the same Revision/current-policy/current-membership gate, and a
missing, rejected, canceled, superseded, or invalidated approval does not become
approved merely because a parent was restored. This is the child `135`
“restore must not reactivate approval” boundary.

### 3.4 Review policy

Each Site Edition owns exactly one Review Policy:

```text
mode: "optional" | "approval_required"
required_approvals: 1..10
require_maintainer_approval: boolean
maintainer_org_user_ids: 0..20
version: positive Row Version
```

Migration `029` creates a default policy for every existing Edition:

```text
mode = "optional"
required_approvals = 1
require_maintainer_approval = false
maintainers = []
version = 1
```

Only a Project Admin manages policy and maintainers. Policy belongs to the
Edition, not the stable Site, so different Project Versions may adopt
different governance.

Policy changes:

- use `expected_policy_version`;
- validate every maintainer still has active access to the Project;
- reject `require_maintainer_approval=true` with no maintainers;
- do not mutate or relabel historical Review Requests;
- apply immediately to future requests;
- apply immediately when evaluating a future Publication or rollback;
- never unpublish or rewrite an already-live Publication;
- never copy through Carry-Forward or import.

### 3.5 Request threshold snapshot

At request creation, copy the current policy's:

- `required_approvals`;
- `require_maintainer_approval`;
- maintainer qualification for each assignment.

The reviewer array must contain enough distinct people to satisfy the frozen
threshold. If maintainer approval is required, at least one assigned reviewer
must be a current policy maintainer.

The request reaches stored `approved` using this frozen request policy. The
Publication gate separately evaluates the current Edition policy so a later
policy tightening cannot be bypassed by an older, weaker request.

### 3.6 Current-valid approval

A decision is durable history, but it counts toward a Publication gate only
while its reviewer still has active Project access:

- an active Organization Owner has implicit Project Admin access;
- a non-owner must be an active Organization user with an active Project
  Membership;
- a disabled Organization user or revoked Project Membership does not count;
- current maintainer qualification comes from the current policy's
  maintainer set.

The server derives a request `effective_status`. While the current policy mode
is `approval_required`, it equals the stored terminal state except that stored
`approved` becomes `invalidated` when its current-valid approvals no longer
satisfy the current policy. In `optional` mode, the gate is bypassed and
historical requests retain their stored status in the UI.

Membership removal does not delete, rewrite, or forge the historical decision.
It makes that decision ineligible for future gate evaluation.

An invalidated terminal approval is never reopened. An authorized author must
create a new Review Request for the same latest exact Revision (or for a newer
Revision) under the current policy. The older request remains immutable
history.

### 3.7 Publication gate and override

The gate is checked inside the existing final Publication transaction after
authorization and exact Revision resolution but before creating a Publication
or switching a Publish Link entry.

If policy mode is `optional`, existing behavior remains unchanged.

If policy mode is `approval_required`, the exact target Revision must have a
governing terminal approved Review Request whose current-valid decisions
satisfy:

- current `required_approvals`;
- current `require_maintainer_approval`;
- current active Project access.

The governing request for an exact Revision is the request with the greatest
`request_number` for that Revision. The gate never searches older requests for
a more favorable outcome. Therefore a later rejected, canceled, open, or
invalidated request blocks that exact Revision even when an older request was
approved. Creating a new request for an already-approved exact Revision
deliberately reopens governance for later publication attempts while preserving
the older request as history.

A missing Review Policy row after migration is an invariant failure and fails
the Publication/rollback transaction closed. It is never interpreted as
`optional`, and an override cannot bypass missing policy state.

The same gate applies to:

- creating a first Publish Link and Publication;
- switching an existing link entry to a new Publication;
- rolling a link entry back to an older Site Publication.

Because new Review Requests are latest-Revision-only, an older rollback target
must already have a governing valid approval from when it was current. If it
does not, an Editor cannot manufacture a new historical approval; the rollback
remains blocked unless a Project Admin performs the exact atomic override. The
UI must explain this before submission.

Revocation does not require review. Retained live output is not re-evaluated in
the background after membership or policy changes.

A Project Admin may include an atomic override:

```ts
review_override: {
  expected_policy_version: PositiveInt;
  reason: bounded non-empty plain text;
} | null
```

Override rules:

- only Project Admin or Organization Owner;
- accepted only when policy requires approval and the exact target is blocked;
- rejected when unnecessary;
- reason is required, normalized/trimmed plain text of `20..1000` Unicode code
  points and is never interpreted as markup;
- policy row and target Revision are locked before checking;
- a durable Publication Review Evidence row records every successful gate and
  link switch, including ordinary approved and not-required outcomes; blocked
  attempts create no evidence or mutation Audit Event;
- override provenance is stored on that evidence row in the same transaction as
  the Publication or rollback switch;
- failure rolls back both override and Publication changes;
- Audit records evidence/request IDs, policy version, and safe scalar outcome,
  never the reason;
- all authorized readers may see safe evidence metadata; only a Project Admin
  may load a stored override reason through the private evidence-detail route;
- public output, notification payloads, Access Evidence, and Project Activity
  safe labels never contain the reason.

### 3.8 In-product inbox only

This child implements a durable in-product Documentation Review Inbox.

- No email, webhook, push, Slack, queue, cron delivery, retry worker, or
  external transport is added.
- Persisted notification type and IDs are the delivery source of truth.
- Delivery states are `unread | read`; “unread” means available in the
  authenticated inbox, not delivered externally.
- Notification rows contain no request note, decision reason, override reason,
  Page title/body, comment body, Revision content, email address, or URL.
- Safe display labels are joined only after current authorization.
- Mark-read is an explicit optimistic-concurrency command; GET has no hidden
  mutation.
- Revoked/disabled users cannot use an old inbox row to recover Project data.

Events:

- `review_assigned` to each assigned reviewer;
- `review_approved`, `review_rejected`, `review_canceled`, or
  `review_superseded` to requester and assigned reviewers;
- `publication_overridden` to requester and assigned reviewers when a Review
  Request exists for the exact Revision.

For every event, deduplicate recipients and omit the actor who caused the
event. Override notifications use only the governing exact-Revision request,
not every historical request for that Revision. An empty recipient set is
valid and does not fail the parent command.

No generic Organization notification framework is introduced.

### 3.9 Change summary

Review detail returns a safe structural summary comparing the target Revision
with the immediately preceding Revision in the same Edition, if one exists.
The summary is derived from immutable relational projections and is not a
second content authority.

```ts
{
  baseline_revision_id: Id | null;
  baseline_revision_number: PositiveInt | null;
  metadata_changed: boolean;
  home_page_changed: boolean;
  pages: {
    added: number;
    removed: number;
    changed: number;
  }
  navigation_changed: boolean;
  routing_changed: boolean;
  snippets: {
    added: number;
    removed: number;
    changed: number;
  }
  assets: {
    added: number;
    removed: number;
    changed: number;
  }
  openapi_changed: boolean;
  artifact_references_changed: boolean;
}
```

Comparison uses frozen source identities plus deterministic canonical digests
of each frozen subgraph. It does not return body diffs. A first Revision has a
null baseline and reports its frozen entities as additions.

## 4. Roles And Capabilities

Add Project capabilities:

```text
documentation.review.request
documentation.review.decide
documentation.review.manage
documentation.review.inbox
documentation.review.override
documentation.review.evidence.read_sensitive
```

Role matrix:

| Action                                     | Admin/Owner | Editor | Viewer |
| ------------------------------------------ | ----------- | ------ | ------ |
| Read policy/request/history/change summary | yes         | yes    | yes    |
| Read/mark own inbox                        | yes         | yes    | yes    |
| List safe reviewer candidates              | yes         | yes    | no     |
| Create Review Request                      | yes         | yes    | no     |
| Cancel own open request                    | yes         | yes    | no     |
| Cancel any open request                    | yes         | no     | no     |
| Decide when explicitly assigned            | yes         | yes    | yes    |
| Manage policy/maintainers                  | yes         | no     | no     |
| Publish when current gate passes           | yes         | yes    | no     |
| Override blocked Publication with reason   | yes         | no     | no     |
| Read a stored override reason              | yes         | no     | no     |

Additional rules:

- assignment never grants authoring, publication, membership-management, or
  policy-management capability;
- Admin cannot decide unless assigned;
- Viewer decision is a narrow review mutation and does not grant general
  `documentation.write`;
- request/decision/policy/cancel/override are Project content mutations and
  are blocked by archived Project, Project Version, or Edition state;
- `documentation.review.inbox` and
  `documentation.review.evidence.read_sensitive` are read capabilities, not
  content-mutation capabilities;
- inbox read-state updates remain allowed for an otherwise readable archived
  Project context, but never bypass revoked access;
- archived Revision history remains readable to authorized roles;
- no Page-level ACL or external reviewer token is introduced.

Update route-capability classification so the new review routes are classified
before both the generic `/documentation-sites` branch and the generic
`/versions` branch. Inbox routes under `/versions/:version_slug` must
resolve to `documentation.review.inbox`, never `project_version.manage`.

Exact route-capability mapping:

| Route family/action                                        | Capability                                                |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| GET policy/gate, Review Request list/detail, evidence list | `documentation.read`                                      |
| PATCH policy                                               | `documentation.review.manage`                             |
| GET candidates, POST request, POST cancel                  | `documentation.review.request`                            |
| POST decision                                              | `documentation.review.decide`                             |
| GET/PATCH own inbox                                        | `documentation.review.inbox`                              |
| GET evidence detail with override reason                   | `documentation.review.evidence.read_sensitive`            |
| Publication/rollback with no override                      | existing `publication.create`                             |
| Publication/rollback with override                         | `publication.create` plus `documentation.review.override` |

Cancellation ownership remains a service/repository check after capability
authorization; the route mapping alone never lets an Editor cancel another
author's request.

## 5. Shared Constants And Strict Contracts

### 5.1 Constants

Add to `packages/constants/src/documentation.ts` and tests:

```ts
DOCUMENTATION_REVIEW_POLICY_MODES = ["optional", "approval_required"] as const;
DOCUMENTATION_REVIEW_REQUEST_STATUSES = [
  "open",
  "approved",
  "rejected",
  "canceled",
  "superseded",
] as const;
DOCUMENTATION_REVIEW_EFFECTIVE_STATUSES = [
  ...DOCUMENTATION_REVIEW_REQUEST_STATUSES,
  "invalidated",
] as const;
DOCUMENTATION_REVIEW_DECISIONS = ["approve", "reject"] as const;
DOCUMENTATION_PUBLICATION_REVIEW_OUTCOMES = [
  "not_required",
  "approved",
  "overridden",
] as const;
DOCUMENTATION_REVIEW_INBOX_STATUSES = ["unread", "read"] as const;
DOCUMENTATION_REVIEW_NOTIFICATION_TYPES = [
  "review_assigned",
  "review_approved",
  "review_rejected",
  "review_canceled",
  "review_superseded",
  "publication_overridden",
] as const;

DOCUMENTATION_REVIEWERS_MAX = 10;
DOCUMENTATION_REVIEW_MAINTAINERS_MAX = 20;
DOCUMENTATION_REVIEW_REASON_MAX = 1000;
DOCUMENTATION_REVIEW_INBOX_PAGE_MAX = 50;
DOCUMENTATION_REVIEW_REQUESTS_PER_EDITION_HARD_MAX = 10_000;
```

Hard limits remain server-owned. Organization-configurable quotas and cleanup
reporting remain child `138`.

All cursors introduced by this child are opaque, tenant/scope/filter-bound,
stable under the documented ordering, and rejected when reused with different
filters or route scope. Clients never construct cursors.

### 5.2 Policy contracts

Add strict schemas in `packages/types/src/documentation.ts`:

```ts
DocumentationReviewPolicySchema = {
  id;
  site_id;
  site_edition_id;
  mode;
  required_approvals;
  require_maintainer_approval;
  maintainer_org_user_ids: Id[0..20];
  version;
  updated_at;
}

DocumentationReviewPolicyUpdateRequestSchema = {
  expected_policy_version;
  mode;
  required_approvals;
  require_maintainer_approval;
  maintainer_org_user_ids: Id[0..20];
}
```

Reject duplicate maintainers, impossible threshold/maintainer combinations,
unknown fields, and non-integer limits.

### 5.3 Candidate contract

```ts
DocumentationReviewCandidateSchema = {
  org_user_id;
  display_name;
  project_role: "project_admin" | "editor" | "viewer";
  is_organization_owner;
  is_maintainer;
}
```

The candidate response excludes email and includes only current active Project
access identities. Owners are represented as `project_admin`.

Candidate listing is cursor-paginated by normalized `(display_name,id)` and
accepts:

```text
limit=1..50
cursor=<opaque server cursor>
```

The response is `{ candidates, next_cursor }`. Server-side candidate search is
not introduced in this child, avoiding a new identity-search query/logging
surface. Selection remains ID-based and the server reauthorizes the complete
submitted reviewer/maintainer set inside the mutation transaction.

### 5.4 Request and detail contracts

```ts
DocumentationReviewRequestCreateRequestSchema = {
  site_revision_id;
  expected_policy_version;
  reviewer_org_user_ids: Id[1..10];
}

DocumentationReviewAssignmentSchema = {
  id;
  reviewer_org_user_id;
  reviewer_display_name;
  current_project_role: "project_admin" | "editor" | "viewer" | null;
  current_access_status: "active" | "revoked" | "disabled";
  is_maintainer_at_assignment;
  is_current_maintainer;
  decision: DocumentationReviewDecisionSchema | null;
}

DocumentationReviewDecisionSchema = {
  id;
  decision: "approve" | "reject";
  reason: string | null;
  decided_by_id;
  created_at;
}

DocumentationReviewRequestSchema = {
  id;
  site_id;
  site_edition_id;
  site_revision_id;
  revision_number;
  request_number;
  status;
  effective_status;
  required_approvals;
  require_maintainer_approval;
  valid_approval_count;
  valid_maintainer_approval_count;
  created_by_id;
  created_by_display_name;
  version;
  created_at;
  closed_at;
  superseded_by_revision_id;
  superseded_at;
}

DocumentationReviewGatePreviewSchema = {
  site_revision_id;
  policy_mode: "optional" | "approval_required";
  policy_version;
  outcome:
    | "not_required"
    | "approval_missing"
    | "approval_pending"
    | "approved"
    | "invalidated";
  governing_review_request_id;
  required_approvals;
  valid_approval_count;
  require_maintainer_approval;
  valid_maintainer_approval_count;
  override_available_to_actor;
}

DocumentationReviewRequestDetailResponseSchema = {
  review_request;
  assignments;
  change_summary;
  publication_gate;
  cancellation:
    | {
        canceled_by_org_user_id;
        canceled_at;
        reason;
      }
    | null;
}
```

`DocumentationReviewRequestSchema` is the reason-free summary used by lists
and command responses. Decision reasons appear only inside assignments on the
authorized detail response; cancellation reason appears only in the detail's
`cancellation` object. Supersession identifiers/timestamps remain safe summary
metadata.

Assignment access projection uses `disabled` when the Organization user is not
active; otherwise it uses `revoked` when the actor is neither an active
Organization Owner nor an active Project member. `current_project_role` is null
for both non-active outcomes.

List responses are cursor-paginated by `(created_at,id)` descending and default
to `open`.
The response envelope is `{ review_requests, next_cursor }`.
Filters:

```text
status=open|approved|rejected|canceled|superseded|invalidated|all
participation=all|requested_by_me|assigned_to_me
limit=1..50
cursor=<opaque server cursor>
```

`approved` filters effective approved requests and excludes currently
invalidated stored approvals; `invalidated` selects stored approved requests
whose derived current status is invalidated. Other filters use stored status.
Filtering and cursor predicates run in the tenant-scoped repository query, not
after pagination.

### 5.5 Decision, cancel, inbox, and override contracts

```ts
DocumentationReviewDecisionRequestSchema =
  | {
      expected_review_request_version;
      decision: "approve";
      reason: PlainReviewReasonSchema.nullable();
    }
  | {
      expected_review_request_version;
      decision: "reject";
      reason: PlainReviewReasonSchema.min(1);
    };

DocumentationReviewCancelRequestSchema = {
  expected_review_request_version;
  reason: PlainReviewReasonSchema.min(1);
}

DocumentationReviewNotificationSchema = {
  id;
  project_id;
  project_version_id;
  site_id;
  site_revision_id;
  review_request_id;
  type;
  status;
  version;
  created_at;
  read_at;
}

DocumentationPublicationReviewEvidenceSummarySchema = {
  id;
  site_revision_id;
  site_publication_id;
  publish_link_id;
  publish_link_entry_id;
  operation: "publication" | "rollback";
  policy_mode: "optional" | "approval_required";
  policy_version;
  required_approvals;
  require_maintainer_approval;
  valid_approval_count;
  valid_maintainer_approval_count;
  outcome: "not_required" | "approved" | "overridden";
  review_request_id;
  created_by_id;
  created_at;
}

DocumentationPublicationReviewEvidenceDetailSchema = {
  evidence: DocumentationPublicationReviewEvidenceSummarySchema;
  override_reason: string | null;
}

DocumentationReviewInboxItemSchema = {
  notification;
  display_context: {
    site_name;
    revision_number;
    request_number;
  };
}

DocumentationReviewNotificationReadRequestSchema = {
  expected_version;
}

DocumentationPublicationReviewOverrideSchema = {
  expected_policy_version;
  reason: PlainReviewReasonSchema.min(20);
}
```

`PlainReviewReasonSchema` normalizes CRLF to LF and Unicode to NFC, trims outer
whitespace, rejects NUL and disallowed C0 controls while allowing LF/TAB, and
enforces the shared 1,000-Unicode-code-point maximum. Reasons are rendered only
as escaped text, never Markdown/HTML. Rejection and cancellation require
`1..1000` code points, override requires `20..1000`, and an omitted or
whitespace-only approval reason normalizes to `null`.

Inbox `display_context` is joined at read time only after current authorization;
it is never copied into the persisted notification row.
Inbox GET returns `{ items, next_cursor, unread_count }`, where `unread_count`
uses the same recipient, Project Version, and current-authorization scope as the
page query. Items order by `(created_at,id)` descending.

Extend both existing strict publication commands additively:

```ts
DocumentationCreatePublicationRequestSchema += {
  review_override: DocumentationPublicationReviewOverrideSchema.nullable()
    .default(null);
}

DocumentationRollbackPublicationRequestSchema += {
  review_override: DocumentationPublicationReviewOverrideSchema.nullable()
    .default(null);
}
```

Existing callers that omit `review_override` continue to parse as `null`.
For idempotency compatibility, repository command-digest construction omits
`review_override` when it is `null`; this preserves the exact pre-`029`
Publication/rollback digest. A non-null override is included in the digest,
including its reason, through the existing one-way hash only.

Publication command responses add:

```ts
review_gate:
  | {
      evidence_id: Id;
      policy_mode: "optional" | "approval_required";
      policy_version: PositiveInt;
      outcome: "not_required" | "approved" | "overridden";
      review_request_id: Id | null;
    }
  | null
```

Every newly executed post-`029` Publication/rollback command returns non-null
`review_gate`. An exact replay whose command receipt was created before
migration `029` returns its unchanged legacy body, normalized by the route/client
adapter to `review_gate: null`, and creates no retroactive evidence. Existing
Publication and Publish Link list contracts remain unchanged; callers load safe
historical evidence through the dedicated evidence list route because one
immutable Publication may participate in multiple link switches. Public
responses never add review fields. Override reasons appear only in the
Admin-only evidence detail response, never in evidence lists, Publication
commands, Review Request detail, or public responses.

## 6. Persistence And Migration 029

Create:

`apps/server/src/db/migrations/029_documentation_review_and_approval_workflow.sql`

### 6.1 `documentation_schema.documentation_review_policy`

Columns:

- `id`, `organization_id`, `project_id`;
- `documentation_site_id`, `site_edition_id`, `project_version_id`;
- `mode`, `required_approvals`, `require_maintainer_approval`;
- positive `version`;
- `created_by_id`, `updated_by_id`, `created_at`, `updated_at`.

Constraints:

- one policy per Site Edition;
- scoped FK to Edition/Site/Version/Project/Organization;
- modes and approval bounds;
- positive version;
- composite unique keys required by child FKs.

Backfill one default optional policy for every existing Edition using the
Edition creator/updater without changing Edition Row Version.
This one-time maintenance migration does not fabricate historical Audit Events;
runtime Audit triggers/grants are installed after the deterministic backfill.

After migration, every Edition-creation path inserts its default policy in the
same transaction as the Edition. This includes ordinary Site/Edition creation,
Carry-Forward, and import. None of those paths copies source policy,
assignments, decisions, or review history.

The default-policy insert uses the parent command's existing mutation context:
`documentation.site.create`, `documentation.site_package_import.apply`, or
`documentation.carry_forward`. Its safe policy ID/mode/version Change Item is
added to that command's one logical Audit Event; it does not create a second
Audit Event or alter existing command response contracts.

### 6.2 `documentation_schema.documentation_review_maintainer`

Columns:

- `id`, tenant and Project scope;
- `review_policy_id`;
- `maintainer_org_user_id`;
- `created_by_id`, `created_at`.

Constraints:

- unique `(review_policy_id,maintainer_org_user_id)`;
- scoped policy and Organization-user FKs;
- no cascade delete;
- no direct row-update API;
- policy replacement deletes/reinserts the complete maintainer set inside one
  authorized, audited transaction;
- no standalone maintainer delete route.

Final eligibility is enforced in repository authorization, not inferred from a
bare Organization-user FK.

### 6.3 `documentation_schema.documentation_review_request`

Columns:

- `id`, tenant/Project/Site/Edition/Version scope;
- `site_revision_id`;
- positive `request_number`;
- stored `status`;
- frozen `required_approvals`;
- frozen `require_maintainer_approval`;
- `created_by_id`;
- nullable `canceled_by_org_user_id`, `canceled_at`, `cancel_reason`;
- nullable `superseded_by_revision_id`, `superseded_by_org_user_id`,
  `superseded_at`;
- nullable `closed_at`;
- positive `version`;
- `created_at`, `updated_at`.

Constraints/indexes:

- scoped exact Revision FK;
- unique `(site_edition_id,request_number)`;
- partial unique one open request per Edition;
- status/closure metadata consistency;
- cancel metadata all-or-none only for canceled;
- supersession metadata all-or-none only for superseded;
- bounded reason;
- list indexes for Edition, requester, status, and time.

### 6.4 `documentation_schema.documentation_review_assignment`

Columns:

- `id`, tenant/Project scope;
- `review_request_id`;
- `reviewer_org_user_id`;
- `is_maintainer_at_assignment`;
- `created_at`.

Constraints:

- unique reviewer per request;
- scoped request and Organization-user FKs;
- immutable/no delete;
- reviewer count protected by repository limit and DB trigger/constraint
  function.

### 6.5 `documentation_schema.documentation_review_decision`

Columns:

- `id`, tenant/Project scope;
- `review_request_id`, `review_assignment_id`;
- `decision`;
- nullable bounded `reason`;
- `decided_by_id`;
- `created_at`.

Constraints:

- one decision per assignment;
- assignment/request scope consistency;
- `decided_by_id` equals assignment reviewer, enforced by trigger;
- rejection reason non-empty;
- immutable/no update/delete.

### 6.6 `documentation_schema.documentation_review_notification`

Columns:

- `id`, tenant/Project/Project Version/Site scope;
- `recipient_org_user_id`;
- `review_request_id`, `site_revision_id`;
- `source_audit_event_id`;
- `type`, `status`;
- positive `version`;
- nullable `read_at`;
- `created_at`, `updated_at`.

Constraints:

- safe foreign keys only;
- unique `(source_audit_event_id,recipient_org_user_id,type)` so an exact
  command replay cannot duplicate one logical delivery;
- tenant-scoped deferred Audit Event FK, because the notification and its
  logical Audit Event commit together;
- unread/read timestamp consistency;
- only the optimistic `unread -> read` transition is allowed; read rows never
  become unread;
- accepted notification types;
- no body/label/email/URL/payload JSON column;
- indexes for recipient Project inbox `(recipient,status,created_at,id)`.

### 6.7 `publish_schema.documentation_publication_review_evidence`

Columns:

- `id`, tenant/Project/Site/Edition/Version scope;
- `site_revision_id`;
- `source_audit_event_id`;
- `operation` (`publication | rollback`);
- policy `mode`, `policy_version`, `required_approvals`, and
  `require_maintainer_approval` evaluated by the command;
- `valid_approval_count` and `valid_maintainer_approval_count` observed under
  the transaction locks;
- `outcome` (`not_required | approved | overridden`);
- nullable `review_request_id`;
- non-null `site_publication_id`, `publish_link_id`,
  `publish_link_entry_id`;
- nullable bounded `override_reason`, non-null only for `overridden`;
- `created_by_id`, `created_at`.

Constraints:

- unique `source_audit_event_id`, producing exactly one gate-evidence row per
  publication/rollback command;
- tenant-scoped deferred Audit Event FK;
- exact tenant/Project/Site/Edition/Version/Revision/Publication/Link/entry
  scoped FKs;
- frozen threshold/count fields satisfy the same hard bounds as policy and
  cannot be negative;
- `approved` requires a matching governing `review_request_id`;
- `not_required` requires optional policy, no Review Request reference, and
  zero observed approval counts because approvals were not authorization input;
- `overridden` requires a non-empty override reason and permits a nullable
  Review Request;
- all non-overridden outcomes require null `override_reason`.

The row is immutable. It records the exact gate result and publication switch
context, including approved and not-required paths. It is not an evergreen
permission token, and later policy/membership changes never rewrite it.

### 6.8 Database enforcement

Migration `029` must add:

- tenant-scoped FKs and composite uniqueness;
- runtime grants only for required tables/actions;
- immutable/no-truncate triggers for decisions, assignments, publication review
  evidence, and terminal provenance;
- Audit mutation-context/evidence triggers;
- allowed Audit command/action policy extensions;
- final guards for one-open-request, decision actor, terminal-state
  consistency, threshold bounds, notification privacy/deduplication shape, and
  publication evidence consistency;
- table comments describing private/non-public ownership.

No review table may use `ON DELETE CASCADE`.

### 6.9 Rollback and compatibility

Migration is additive.

- Existing Editions backfill optional policy and preserve current behavior.
- Existing Publication request bodies remain valid through defaulted null
  override.
- Null override preserves the pre-`029` command digest, so an old exact
  idempotency key replays instead of conflicting.
- Existing Publications are not retroactively assigned fabricated review
  evidence; the evidence table starts with post-`029` publication/rollback
  commands.
- Existing Publications, Publish Links, Revisions, comments, packages, and
  Carry-Forward provenance are unchanged.
- Import and Carry-Forward create the target Edition's default optional policy
  but copy no maintainers, requests, decisions, notifications, or publication
  review evidence.
- Package schemas and exports remain unchanged and exclude review state.
- Public routes and public response contracts remain unchanged.

`DOWN` must refuse when:

- any Review Request, assignment, decision, notification, or Publication Review
  Evidence exists;
- any policy differs from the default optional policy;
- any maintainer exists;
- Audit/Access records depend on review-only enum/policy values that cannot be
  represented by migration `028`.

After a clean refusal check, down may remove default policy rows, triggers,
grants, functions, tables, indexes, and policy extensions in dependency order.
Rehearse clean `029` down/up and populated refusal.

## 7. Server Architecture And Ownership

### 7.1 New review module

Add:

- `apps/server/src/modules/documentation-review/documentation-review.repository.ts`
- `apps/server/src/modules/documentation-review/documentation-review.repository.test.ts`
- `apps/server/src/modules/documentation-review/documentation-review.service.ts`
- `apps/server/src/modules/documentation-review/documentation-review.service.test.ts`
- `apps/server/src/modules/documentation-review/documentation-review.routes.ts`
- `apps/server/src/modules/documentation-review/documentation-review.routes.test.ts`
- `apps/server/src/modules/documentation-review/documentation-review.db.integration.test.ts`

Ownership:

- repository: locks, tenant-scoped SQL, persistence, derived effective status,
  change-summary projection, inbox rows, Audit Change Items;
- service: Project authorization, requester/reviewer/candidate validation,
  capability distinctions, safe labels, and database-verified Access resolved
  resource context for request/notification/evidence reads;
- routes: strict parse, cookie auth, target Version resolution, HTTP status,
  typed error mapping;
- no Fastify or SQL objects enter `@repo/documentation-domain`.

### 7.2 Pure domain policy

Add:

- `packages/documentation-domain/src/policies/documentation-review-policy.ts`
- `packages/documentation-domain/src/policies/documentation-review-policy.test.ts`

Update:

- `packages/documentation-domain/src/index.ts`
- `packages/documentation-domain/src/types/documentation-domain.ts`
- `packages/documentation-domain/src/errors/documentation-domain-error.ts`

Pure functions must decide:

- valid lifecycle transition;
- frozen threshold satisfaction;
- current Publication gate satisfaction;
- maintainer requirement;
- effective invalidation;
- whether override is required/allowed;
- reason and limit validation;
- safe change-summary count shape.

They receive facts and return decisions/errors; they do not query membership or
content.

### 7.3 Existing Documentation repository integration

Update:

- `apps/server/src/modules/documentation/documentation.repository.ts`
- `apps/server/src/modules/documentation/documentation.repository.test.ts`
- `apps/server/src/modules/documentation/documentation.db.integration.test.ts`
- `apps/server/src/modules/documentation/documentation.service.ts`
- `apps/server/src/modules/documentation/documentation.service.test.ts`

Required integration:

- genuinely new Revision creation supersedes an older open request in the same
  transaction;
- Revision reuse does not supersede;
- Site/Edition creation, Carry-Forward, and import insert the default policy in
  the target Edition transaction, never copied review state;
- those existing parent commands add safe default-policy Audit Change Items
  while preserving their current response shapes and idempotent replay;
- `create_publication` locks Edition, policy, exact Revision, relevant Review
  Request/decisions, and Publish Link entry in stable order;
- `rollback_publication` resolves the rollback Publication's exact Revision and
  applies the same gate;
- both operations create exact Publication Review Evidence and include safe
  evidence metadata in Publication Audit Changes;
- response exposes safe `review_gate`.

The gate helper may be exported from
`documentation-review.repository.ts`, but it must accept the existing
transaction client. It must never open a second transaction or make an
out-of-transaction authorization decision.

### 7.4 Application wiring

Update:

- `apps/server/src/app.ts`
- `apps/server/src/modules/project-membership/project-access.policy.ts`
- `apps/server/src/modules/project-membership/project-access.policy.test.ts`
- `apps/server/src/modules/project-membership/project-service-authorization.ts`
- `apps/server/src/modules/project-membership/project-service-authorization.test.ts`

Register the review service/routes with the existing authentication, Project
access, Version resolution, audit/request context, and database pool.

Publication service wiring:

- authorize `publication.create`;
- if an override is present, additionally authorize
  `documentation.review.override`;
- do not trust UI role flags;
- pass actor identity and exact route scope into the transaction.

### 7.5 Audit and Access Evidence

Update:

- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-source-coverage.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`

Commands/actions:

```text
documentation.review_policy.update
  -> documentation.review_policy_updated
documentation.review_request.create
  -> documentation.review_requested
documentation.review_request.cancel
  -> documentation.review_canceled
documentation.review_decision.approve
  -> documentation.review_approved | documentation.review_progressed
documentation.review_decision.reject
  -> documentation.review_rejected
documentation.review_notification.read
  -> documentation.review_notification_read
publish.documentation_link.create / manifest_update / rollback
  -> existing action plus Publication Review Evidence Change Item
documentation.revision.create
  -> existing action plus superseded request/notification Change Items
```

Audit Changes include only IDs, status, counts, Row Versions, policy mode, and
safe decision kind. Never include reason, Revision content, title, email,
comment, request body, or notification recipient label.

Access Evidence registrations:

- policy viewed;
- candidates listed;
- Review Request list/detail viewed;
- Project review inbox viewed;
- Publication Review Evidence list/Admin detail viewed;
- immutable Revision preview remains under existing evidence;
- gate preview is `denial_only` because the parent workbench/detail read already
  records meaningful evidence;
- no duplicate evidence for other static child fetches.

Extend access-scope inference for `review_request_id`, `notification_id`, and
`evidence_id`. Resolution must recover Organization, Project, Project Version,
Site, Edition, and Revision scope through tenant-scoped joins; a caller-supplied
parent route never substitutes for database-derived scope.

Access root mapping is exact:

- policy/candidate/request-list/evidence-list reads root at
  `documentation_site`;
- request detail roots at `documentation_review_request`;
- inbox list roots at the resolved `project_version`;
- mark-read roots at `documentation_review_notification`;
- sensitive evidence detail roots at
  `documentation_publication_review_evidence`.

### 7.6 Reset, migration, and test registries

Update:

- `apps/server/src/test-support/database.ts`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/package.json`

Reset order must delete notifications, Publication Review Evidence, decisions,
assignments, requests, maintainers, and policies before
Revision/Edition/Project rows.
Add the new DB integration test to `test:db`.

## 8. Routes And HTTP Contracts

All routes are authenticated and tenant/Project scoped.

### 8.1 Site review policy and candidates

```text
GET   /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-policy
PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-policy
GET   /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-candidates
GET   /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-gate?revision_id=:revision_id
```

- GET policy: `documentation.read`;
- PATCH policy: `documentation.review.manage`;
- candidates: `documentation.review.request`;
- gate preview: `documentation.read`, exact Revision scope, advisory only;
- PATCH policy requires `Idempotency-Key`; first execution returns `200` and an
  exact replay returns the same reason-free policy response;
- candidate response is safe and excludes email;
- gate preview returns `DocumentationReviewGatePreviewSchema`; Publication and
  rollback always recompute under transaction locks;
- archived parent/resource: policy/history reads remain allowed, while policy
  mutation and candidate enumeration are blocked because candidates exist only
  to prepare a new mutation.

### 8.2 Review Requests

```text
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews
GET  /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews
GET  /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews/:review_request_id
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews/:review_request_id/decisions
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews/:review_request_id/cancel
```

- create, decision, and cancel require `Idempotency-Key`;
- first create/decision returns `201`, exact replay `200`;
- list/detail return `200`;
- cancel returns `200`, exact replay returns the same response, and it uses Row
  Version;
- create, decision, and cancel return
  `{ review_request: DocumentationReviewRequestSchema }` without reasons;
- create reauthorizes all reviewer candidates and locks policy/Revision/request
  scope;
- decision reauthorizes the exact assigned actor before detail disclosure;
- cancel allows requester or Admin according to the matrix;
- detail returns stored reason only to authorized Project readers;
- list summaries omit reasons.

### 8.3 Inbox

```text
GET   /api/v1/projects/:project_id/versions/:version_slug/documentation-review-inbox
PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-review-inbox/:notification_id/read
```

GET supports:

```text
status=unread|read|all
limit=1..50
cursor=<opaque>
```

Inbox scope is the selected Project Version. Cross-Version aggregation is
deferred; changing the portal Version changes the inbox scope.

PATCH is recipient-only and requires `expected_version`.
It returns the updated `DocumentationReviewNotificationSchema`; neither GET nor
PATCH returns a persisted free-form payload.

### 8.4 Publication and rollback

Existing routes remain stable:

```text
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/entries/:entry_id/rollback
```

They accept the additive nullable `review_override`. The repository performs
the authoritative gate. UI preflight is advisory only.

Publication Review Evidence routes:

```text
GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-publication-evidence
GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-publication-evidence/:evidence_id
```

The list requires `documentation.read`, returns only
`DocumentationPublicationReviewEvidenceSummarySchema`, and supports strict
filters:

```text
revision_id=<Id>                 optional
site_publication_id=<Id>         optional
outcome=not_required|approved|overridden|all
limit=1..50
cursor=<opaque>
```

It orders by `(created_at,id)` descending. The detail route requires
`documentation.review.evidence.read_sensitive` and returns
`DocumentationPublicationReviewEvidenceDetailSchema`, including the override
reason only when the evidence outcome is `overridden`. Both routes rederive
scope from `evidence_id`/stored FKs and fail closed for mismatched route
parents.

### 8.5 Typed errors

| Condition                                       | HTTP | Type                                             |
| ----------------------------------------------- | ---: | ------------------------------------------------ |
| malformed strict request                        |  400 | `invalid_documentation_review_request`           |
| request/notification/evidence not found/hidden  |  404 | `documentation_review_not_found`                 |
| candidate lacks active Project access           |  422 | `documentation_review_candidate_invalid`         |
| requester assigned themself                     |  422 | `documentation_review_self_assignment_forbidden` |
| threshold/maintainer set impossible             |  422 | `documentation_review_policy_invalid`            |
| historical/non-latest Revision requested        |  409 | `documentation_review_revision_not_latest`       |
| open request already exists                     |  409 | `documentation_review_open_request_exists`       |
| policy/request/notification Row Version changed |  409 | `documentation_row_version_conflict`             |
| required Review Policy row missing              |  500 | existing safe internal invariant response        |
| request terminal/superseded                     |  409 | `documentation_review_state_conflict`            |
| actor not assigned/cancel not permitted         |  403 | existing safe permission response                |
| request hard ceiling reached                    |  422 | `documentation_review_limit_exceeded`            |
| archived parent/Edition                         |  409 | `documentation_read_only`                        |
| gate has no sufficient exact approval           |  409 | `documentation_review_approval_required`         |
| historical approval lost current eligibility    |  409 | `documentation_review_approval_invalidated`      |
| override unnecessary/invalid                    |  409 | `documentation_review_override_invalid`          |
| override actor forbidden                        |  403 | existing safe permission response                |
| concurrent Publication switch                   |  409 | existing `documentation_publication_busy`        |

Errors reveal no cross-tenant reviewer, request, membership, or Revision
existence.

## 9. Transaction And Locking Rules

All touched flows share this canonical lock prefix where the resources apply:

```text
Project Version -> Site -> Edition -> Working Draft -> Review Policy
-> Site Revision -> Review Request -> Assignment/Decision
-> Organization User/Project Membership -> Publish Link/entry
```

Rows within one kind lock by stable ID. Existing Revision creation already
locks Edition/Working Draft first; its review integration must acquire any open
request after that prefix and before inserting terminal supersession metadata.
No review helper may reverse the prefix or open a nested transaction.

### 9.1 Create request

One transaction:

1. authorize requester before content/detail load;
2. hash idempotency key and canonical strict request;
3. lock/replay actor/Project/key receipt;
4. lock Project Version, Site, Edition, policy, latest Revision, then any open
   request in stable ID order;
5. validate Edition effective writable state and policy Row Version;
6. validate reviewer identities as distinct active Project users;
7. freeze threshold and maintainer qualification;
8. enforce request hard ceiling and no open request;
9. insert request and assignments;
10. insert safe inbox rows;
11. write one logical Audit Event;
12. commit all-or-nothing.

### 9.2 Decision

One transaction:

1. authorize review-decision capability;
2. lock/replay actor/Project/key receipt;
3. lock Edition, request, assignment, and existing decision;
4. reject archived/terminal/wrong-assignee state;
5. insert immutable decision;
6. derive frozen threshold under the same locks;
7. transition request to rejected, approved, or keep open;
8. insert safe inbox rows only when terminal;
9. Audit once and commit.

Concurrent assigned decisions serialize on request. If one rejection closes the
request, a waiting approval receives state conflict and creates no decision.
Every decision increments the Review Request Row Version because its aggregate
approval state changed, even when status remains `open`. Two approvals using
fresh successive versions may both succeed; two concurrent decisions using the
same expected version produce one success and one Row Version conflict. The
losing client reloads and may retry if its assignment remains undecided and the
request remains open. The threshold-closing approval returns the approved
request.

The actor must have active Project access when deciding. If a reviewer loses
access while a request is open, the assignment and any earlier decision remain
history, but that actor cannot submit another decision. The request does not
auto-close; requester/Admin may cancel and replace it. Historical decisions
still determine the stored frozen-threshold result, while Publication always
rechecks current eligibility and may derive `invalidated`.

### 9.3 Cancel request

Require `Idempotency-Key`; lock/replay the command receipt, then lock Edition,
request, assignments, and existing terminal state. Reauthorize cancellation by
the requester or an Admin, validate `expected_review_request_version`,
transition only `open -> canceled`, insert deduplicated terminal inbox rows,
Audit once without the reason, store the reason-free response receipt, and
commit all-or-nothing.

### 9.4 Policy update

Require `Idempotency-Key`; lock/replay the command receipt, then lock Edition and
policy. Validate active maintainers, update policy Row Version, replace
maintainer rows atomically, Audit once, and store a reason-free receipt. It does
not lock or rewrite all historical requests.

### 9.5 Publication/rollback

Within the existing transaction:

1. authorize normal Publication and optional override capability outside SQL;
2. lock Edition and Review Policy;
3. resolve and lock exact target Revision;
4. lock the governing exact-Revision Review Request, assignments, decisions,
   current maintainer rows, and current Organization-user/Project-membership
   facts in stable order;
5. derive gate result from current policy and current active access;
6. if blocked, reject or validate an exact override intent;
7. only then create/reuse Publication and switch the entry;
8. once Publication/link identifiers exist, insert one immutable Publication
   Review Evidence row for `not_required`, `approved`, or `overridden`;
9. write the existing Publication Audit plus safe evidence/request/outcome
   Change Items, excluding any reason;
10. commit the gate check, Publication/link mutation, evidence row, and Audit
    all-or-nothing.

The database unique/immutable constraints remain final race guards.

## 10. Privacy, Security, And Threat Model

| Threat                                    | Required control                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| stale approval authorizes changed content | exact Revision FK and exact target gate; never “latest” by inference              |
| revoked reviewer still authorizes publish | current active Project access rechecked inside Publication transaction            |
| policy race                               | expected policy version plus locked policy row                                    |
| duplicate/concurrent decisions            | immutable unique decision per assignment and request lock                         |
| reviewer self-approval                    | requester excluded from assignments at service and transaction boundaries         |
| external reviewer enumeration             | active internal candidates only; non-enumerating errors                           |
| notification content leak                 | ID/type-only rows; labels joined after current authorization                      |
| reason leak through telemetry             | reasons excluded from Audit, Access, logs, notifications, Activity, public output |
| override used as reusable bypass          | immutable evidence binds it to one exact Publication/rollback transaction         |
| cross-tenant FK substitution              | composite tenant/Project/Site/Edition/Revision FKs and scoped queries             |
| archived-state mutation                   | Project/Version/Edition lifecycle checked server-side                             |
| hidden GET mutation                       | explicit PATCH for notification read state                                        |
| public review-state leak                  | no public route/projection/cache/search/export field                              |
| Carry-Forward approval inheritance        | review tables excluded; target receives default optional policy only              |
| import/package authority confusion        | review state excluded from package contracts                                      |
| denial of service                         | bounded reviewers/maintainers/reasons/page sizes and indexed cursor queries       |
| stored XSS in reasons                     | plain-text validation and escaped rendering                                       |

Additional rules:

- create, decide, cancel, and override command responses use a reason-free
  Review Request/Publication summary; where an idempotency receipt is used, it
  therefore never stores a request, decision, cancellation, or override
  reason;
- request fingerprints include normalized reason content only inside the
  existing one-way command digest; receipt/log/Audit rows never store the
  plaintext request body;
- only the authorized Review Request detail GET returns persisted decision and
  cancellation reasons; the client reloads that detail after a successful or
  replayed command;
- no review data in Revision content digest or public cache key;
- no background job or external network access;
- CSP and controlled renderer remain unchanged.

## 11. Portal Experience

### 11.1 New files

Add:

- `apps/web/src/features/documentation/DocumentationReviewPanel.tsx`
- `apps/web/src/features/documentation/DocumentationReviewPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationReviewInboxPage.tsx`
- `apps/web/src/features/documentation/DocumentationReviewInboxPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationReview.module.css`
- `apps/web/src/lib/documentationReviewApi.ts`
- `apps/web/src/lib/documentationReviewApi.test.ts`

### 11.2 Existing files to update

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/documentationApi.ts`
- `apps/web/src/lib/documentationApi.test.ts`
- `apps/web/src/features/documentation/documentationPermissions.ts`
- `apps/web/src/features/documentation/documentationPermissions.test.ts`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.test.tsx`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.tsx`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.test.tsx`

### 11.3 Site review panel

The Site workbench gains a “Review and approval” region:

- exact Revision selector, newest first;
- safe structural change summary;
- current policy status;
- Admin policy/maintainer controls;
- reviewer multi-select from safe candidates;
- request confirmation naming exact Revision number;
- warning that creating a newer request for an already-approved exact Revision
  makes that new request governing and blocks required-policy publication until
  it closes approved or an Admin overrides;
- open request progress and assignments;
- approve/reject controls only for assigned actor;
- rejection and cancel reason fields;
- terminal/superseded history;
- links to immutable Revision preview;
- explicit statement that comments are separate and unresolved comments do not
  block approval;
- explicit statement when the Working Draft may contain later uncheckpointed
  changes.

Do not mix formal decisions into `DocumentationCommentsPanel`.

### 11.4 Inbox

Route:

```text
/projects/:projectId/versions/:versionSlug/documentation/reviews
```

The Documentation Site library links to “Review inbox” and shows an unread
count fetched from the inbox response. The inbox:

- defaults to unread;
- supports assigned/requested/all participation filters through linked Review
  Request queries;
- shows safe Site, Version, Revision number, event type, and time only after
  authorization;
- opens Review detail in the Site workbench;
- marks one item read explicitly;
- preserves filter and focus after action;
- has empty, loading, denied, archived, conflict, and retry states.

### 11.5 Publishing panel

For each exact Revision:

- display `Review optional`, `Review pending`, `Approved`,
  `Approval invalidated`, or `Override required`;
- Editor publish control is disabled when advisory gate status is blocked, with
  explanation;
- Admin sees a required plain-text override reason and explicit confirmation;
- UI sends policy Row Version with override;
- all authorized readers see the safe Publication Review Evidence timeline for
  each link switch;
- pre-`029` Publications or legacy receipt replays with no evidence display
  “Legacy publication — no review evidence recorded,” never “Review optional”
  or “Approved” by inference;
- Admin may explicitly open private evidence detail to inspect an override
  reason; it is never prefetched, placed in list state, or echoed after submit;
- server errors remain authoritative and refocus the gate status;
- failed gate/override preserves link form, selected Revision, and reason;
- successful override displays safe confirmation without echoing reason;
- rollback UI applies the same gate behavior.

The panel must stop assuming only `revisions[0]` is publishable if the user
selects an exact reviewed historical Revision. Add an explicit Revision
selector and preserve the selection across refresh/conflict.

### 11.6 Accessibility and motion

- semantic headings/regions for policy, request, assignments, history, inbox,
  and gate;
- native fieldsets for reviewer/maintainer selection;
- every decision/reason control has a durable label and error description;
- terminal status is conveyed by text, not color;
- live regions announce request/decision/read-state outcomes without repeating
  private reasons;
- conflict/error region receives focus;
- keyboard-only create, decide, cancel, filter, mark-read, publish, override,
  and rollback flows;
- no focus loss when a request closes or inbox row disappears;
- `320` CSS-pixel reflow without horizontal page overflow;
- reduced-motion mode has no essential transition dependency;
- no new animation library.

## 12. Exact Affected And Read-Only Files

### 12.1 Required runtime/test changes

Shared:

- `packages/constants/src/documentation.ts`
- `packages/constants/src/constants.test.ts`
- `packages/types/src/documentation.ts`
- `packages/types/src/documentation.test.ts`
- `packages/documentation-domain/src/index.ts`
- `packages/documentation-domain/src/types/documentation-domain.ts`
- `packages/documentation-domain/src/errors/documentation-domain-error.ts`
- new review policy/test files from section 7.2.

Database/server:

- `apps/server/src/db/migrations/029_documentation_review_and_approval_workflow.sql`;
- new review module files from section 7.1;
- Documentation repository/test/DB integration files from section 7.3;
- application, authorization, Audit, Access, reset, foundation, and package
  files from sections 7.4–7.6;
- `apps/server/src/modules/documentation/documentation.routes.ts`
- `apps/server/src/modules/documentation/documentation.routes.test.ts`
  only for additive Publication/rollback request/response behavior and error
  mapping;
- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.db.integration.test.ts`.

Portal:

- new and existing files from section 11.

Docs/verification:

- `CONTEXT.md`
- `docs/documentation-domain-decisions.md`
- new
  `docs/adr/0032-documentation-review-targets-exact-revisions-and-gates-are-optional.md`
- `docs/v1-dogfood-smoke-suite.md`
- this child plan;
- Master `006` only for completed items after implementation;
- new browser evidence:
  `docs/ui/136-documentation-review-and-approval-workflow-browser-evidence.md`.

### 12.2 Conditional files

Touch only if implementation proves necessary:

- `apps/server/src/modules/audit/audit-route-coverage.test.ts`
- Project Activity mapping/tests, only if a safe body-free label is already
  supportable;
- shared portal navigation styles, only if the inbox link cannot reuse existing
  components.

### 12.3 Read-only compatibility surfaces

Do not change unless a failing scoped test proves a Plan `136` requirement:

- migrations `001`–`028`;
- comment schemas/routes/panel;
- Carry-Forward request/response shape and provenance tables;
- package/import/export schemas and ZIP/Markdown converters;
- public Documentation routes, reader, search, sitemap, robots, and asset
  delivery;
- Guide/Demo review/publication models;
- Capture/extension runtime;
- Fumadocs/Tiptap adoption boundary;
- File storage provider;
- authentication cookie/public-link password behavior.

No dependency or lockfile change is expected.

## 13. Documentation And Architecture Updates

Implementation must:

- add accepted glossary terms to `CONTEXT.md`: Documentation Review Policy,
  Review Request, Review Assignment, Review Decision, Review Inbox Event, and
  Publication Review Evidence/Override;
- record relationships and avoid confusing Review Request with private
  comments or mutable Draft Preview;
- add ADR `0032` for exact Revision targets, optional-by-default gate,
  current-valid reviewer eligibility, atomic override, and in-product-only
  inbox;
- update the consolidated Documentation decision matrix from planned to
  implemented without expanding V1 scope;
- leave ADR `0030` intact: comments remain separate private authoring records;
- document no external notification transport and no permanent deletion;
- update Master `006` only after verified completion.

## 14. TDD And Implementation Order

Use test-driven development for every behavior change.

1. **Shared red tests**
   - constants and strict schemas;
   - unknown fields, duplicates, bounds, reason rules, defaulted null override.
2. **Pure domain red tests**
   - lifecycle transitions;
   - threshold/maintainer satisfaction;
   - invalidated current approvals;
   - governing-latest-request selection;
   - optional/required/override gate and evidence matrix.
3. **Migration red tests**
   - tables, constraints, triggers, grants, Audit policy, default backfill,
     rollback refusal.
4. **Repository DB red tests**
   - request/assignment/decision lifecycle;
   - exact Revision and latest-only request;
   - supersede-on-new/reuse-does-not-supersede;
   - current membership invalidation;
   - policy races;
   - atomic Publication/rollback gate, evidence, and override;
   - tenant isolation, notification privacy, and delivery deduplication.
5. **Service/route red tests**
   - role matrix and safe candidate projection;
   - idempotency/replay;
   - typed non-enumerating errors;
   - archived state.
6. **Portal red tests**
   - request/decision/history/inbox;
   - policy management;
   - blocked publish and Admin override recovery;
   - exact Revision selector;
   - focus and keyboard behavior.
7. **Fixture/browser**
   - seed deterministic Admin, Editor requester, Viewer reviewer, optional and
     required-policy Sites, two Revisions, open/approved/rejected/superseded
     history, unread/read inbox, approved/overridden evidence, invalidated
     membership case, and blocked Publication.
8. **Docs and closure**
   - update truth only after verification.

Do not write production implementation before observing the applicable focused
test fail for the intended reason.

## 15. Focused Verification Plan

### 15.1 Shared/domain

- constants exact values and limits;
- strict Zod success/failure;
- decision transition matrix;
- threshold and maintainer combinations;
- optional/required/current-invalidated/override gate matrix;
- no comment or body fields in notification schema.

### 15.2 Database/repository

- default policy backfill for existing Edition;
- policy tenant/Edition scope and Row Version;
- active owner/member candidates; revoked/disabled rejection;
- self/duplicate/over-limit reviewer rejection;
- one open request per Edition;
- latest exact Revision enforcement;
- request number monotonicity;
- latest same-Revision request governs even when older approval is favorable;
- immutable assignments/decisions/Publication Review Evidence;
- fresh sequential approve/approve threshold close;
- concurrent same-version approve/approve produces one Row Version conflict and
  safe retry;
- concurrent reject/approve loser conflict;
- every decision increments request Row Version, including non-closing
  approval;
- exact idempotent replay and mismatched-key fingerprint conflict;
- null override preserves pre-`029` Publication/rollback digest and legacy
  receipt replay normalizes `review_gate: null`;
- new Revision supersedes open request atomically;
- identical Revision reuse does not supersede;
- archived Project/Version/Edition blocks mutation;
- approved exact Revision passes;
- next Revision cannot reuse prior approval;
- revoked reviewer invalidates gate without deleting history;
- current policy tightening is enforced;
- optional policy preserves publication;
- blocked publication creates no Publication/link/evidence;
- every successful post-`029` Publication/rollback creates exactly one evidence
  row;
- Admin override commits with evidence and Publication or rollback;
- injected failure rolls back evidence, override reason, and live pointer;
- Carry-Forward/import copy no review state;
- notification rows contain only accepted safe fields and exact replay cannot
  duplicate delivery;
- cross-tenant IDs fail closed;
- clean `029` down/up and populated rollback refusal.

### 15.3 Routes/security

- Admin/Editor/Viewer matrix;
- Viewer can decide only assigned request;
- Editor cannot manage policy or override;
- Admin cannot decide unless assigned;
- requester/assigned cancellation rules;
- policy/cancel command replay and reason-free receipts;
- safe candidate response excludes email;
- GET has no read-state mutation;
- route coverage maps exact capability before generic Documentation rules;
- Access Evidence contains no reason/content;
- Audit contains no reason/content;
- evidence list is reason-free and Admin-only detail loads reason explicitly;
- public routes expose no review fields.

### 15.4 Portal

- route parse/build for inbox;
- policy and candidate loading;
- exact Revision request;
- comments remain visually and semantically separate;
- assigned Viewer approve/reject;
- terminal and superseded history;
- unread/read inbox;
- safe empty/loading/error/conflict states;
- Editor blocked publish;
- Admin required override reason and retry;
- rollback gate;
- archived read-only;
- `320px` reflow, keyboard order, focus recovery, live-region copy,
  reduced-motion behavior.

### 15.5 Full regression

Run:

```text
pnpm check-types
pnpm lint
pnpm build
pnpm --filter @repo/constants test
pnpm --filter @repo/types test
pnpm --filter @repo/documentation-domain test
pnpm --filter server test
pnpm --filter server test:db
pnpm --filter server test:smoke
pnpm --filter web test
pnpm --filter extension test
git diff --check
```

Existing server lint-warning and web bundle-size baselines may remain
non-blocking only if unchanged and documented.

## 16. Mandatory Agent-Browser Validation

Use the installed `agent-browser` skill against the deterministic DB-backed
fixture on the headless server. Do not replace this with a custom browser
harness.

Required Admin journey:

1. open active Site with optional policy;
2. configure maintainers and required approval;
3. create request for latest exact Revision with Editor/Viewer reviewers;
4. verify safe summary and immutable Revision link;
5. observe blocked publish;
6. enter required override reason, confirm, publish atomically;
7. verify safe override history and retained public output;
8. verify reason does not appear in network-visible list payloads, Audit,
   public reader, or console;
9. explicitly open Admin-only evidence detail, verify the reason there, close
   it, and confirm it is not retained in list state or subsequent list
   responses.

Required Editor journey:

1. create a request;
2. fail to manage policy or override;
3. publish an approved exact Revision;
4. create a new Revision and verify older open request becomes superseded;
5. verify selection/local form state survives a recoverable conflict.

Required Viewer journey:

1. open assigned inbox item;
2. inspect exact Revision/change summary/comments separation;
3. approve one request and reject another with reason;
4. mark notification read;
5. fail all unassigned decision and authoring/publish mutations.

Required lifecycle/concurrency journey:

- archived Project Version/Edition is readable but review-mutation disabled;
- revoked reviewer causes approval-invalidated display and blocked publish;
- two-tab/concurrent decision state recovers with focused conflict;
- rollback to unapproved historical Publication is gated.

Required public/privacy journey:

- live public reader remains exact after policy/request/membership changes;
- no review, reviewer, inbox, reason, comment, or override state appears in
  reader/search/sitemap/robots/assets.

Required accessibility/quality checks:

- accessibility-tree snapshots for Site review panel, inbox, blocked gate,
  override confirmation, and Viewer decision;
- keyboard-only flow;
- `320` CSS-pixel reflow;
- reduced-motion emulation;
- console error review;
- failed-request/network review;
- axe on authenticated review/inbox and unchanged public reader;
- manual contrast review for any axe incomplete result;
- screenshots/evidence recorded in the child `136` UI evidence document.

## 17. Explicit Non-Scope

- mandatory approval by default;
- Organization-wide global review policy;
- policy copied through Carry-Forward or import;
- review of mutable Working Draft without an exact Revision;
- Page-level, Snippet-level, Asset-level, OpenAPI-operation-level, Guide, or
  Interactive Demo review;
- converting comments, mentions, or resolved threads into approval;
- requiring comment resolution before review or Publication;
- external reviewers, guest tokens, magic links, or public review pages;
- email, webhook, Slack, push, queue, worker, cron, or retry delivery;
- server-side reviewer-directory search or Organization-wide review inbox;
- realtime presence, collaborative editing, offline merge, or live cursors;
- automatic AI reviewer or approval;
- electronic signature/compliance certification;
- arbitrary approval chains, sequential stages, weighted votes, or groups;
- permanent deletion, retention cleanup job, configurable quotas/reporting;
- public feedback, public comments, analytics;
- Git/GitHub authority or third-party docs adapters;
- API Try It, credentials, proxy, SDK generation;
- translation, custom domains, cross-Site search, per-Page publication;
- dependency/framework adoption or lockfile changes.

## 18. Implementation Commit Strategy

Commit only scoped work in small logical commits:

1. `feat(documentation): define review workflow contracts and policy`
2. `feat(documentation): add review workflow persistence`
3. `feat(documentation): enforce review publication gates`
4. `feat(documentation): add review workflow portal`
5. `test(documentation): add review browser fixture and closure coverage`
6. `docs(documentation): close child 136 review workflow`

Do not stage unrelated user/agent changes. Inspect the worktree before every
commit. A commit may combine tightly coupled server pieces when splitting would
leave an invalid migration/runtime boundary, but must not absorb unrelated
formatting.

## 19. Exit Gate

Child `136` is complete only when:

- exact Revision Review Requests work end to end;
- comments remain private and separate;
- default policy is optional and existing publication remains compatible;
- stale/later content cannot borrow an older approval;
- current revoked/disabled reviewer state cannot satisfy a future gate;
- policy/decision/override races are deterministic;
- every override is Admin-only, exact, reasoned, atomic, and audited;
- notifications are in-product only and leak no content;
- archived state and tenant boundaries fail closed;
- public output contains no review state;
- migration `029`, rollback refusal, Audit, Access, reset, and fixtures pass;
- focused/full/browser/accessibility/privacy verification passes;
- plan status, checklist, implementation log, verification, leftovers, and
  Master completed items are truthful;
- scoped commits leave a clean worktree.

## 20. Checklist

### Planning

- [x] Sequence position reserved.
- [x] Actual independently closed child `135` result inspected.
- [x] Current publication, membership, Audit, Access, notification, portal,
      migration, and test ownership mapped.
- [x] Deferred in-boundary decisions resolved without mandatory-by-default or
      external reviewers.
- [x] Implementation-ready expansion completed.
- [x] Independent plan recheck completed.
- [x] Docs-only plan checkpoint committed.

### Implementation

- [ ] Shared constants/contracts/domain policy implemented test-first.
- [ ] Migration `029` implemented and rehearsed.
- [ ] Review repository/service/routes implemented.
- [ ] Publication and rollback gate/override implemented atomically.
- [ ] Audit/Access/reset/authorization coverage implemented.
- [ ] Portal review panel/inbox/publishing integration implemented.
- [ ] Deterministic browser fixture implemented.
- [ ] Focused/full/agent-browser verification passed.
- [ ] Context/ADR/decision/master/docs updated.
- [ ] Scoped logical commits complete.

## 21. Planning Log

- 2026-07-30: Reserved from Master Plan `006`; no review runtime was added.
- 2026-07-30: Child `135` close-recheck handoff recorded. No review runtime,
  schema, route, or policy decision was added.
- 2026-07-30: Expanded against closed child `135`, Master `006`, current
  Revision/Publication transactions, Project Membership capability policy,
  Audit/Access registries, consolidated Documentation repository, portal
  workbench/publishing UI, migration head `028`, and deterministic browser
  fixture.
- 2026-07-30: Chose exact immutable Revision review targets; optional
  Edition-owned policy; frozen request thresholds; current-valid Publication
  evaluation; active internal Project users including assigned Viewers; and
  Admin-only atomic override.
- 2026-07-30: Confirmed no external notification infrastructure exists and
  bounded this child to a private in-product inbox with explicit read state and
  content-free persisted events.
- 2026-07-30: Defined latest-only request creation, new-Revision
  supersession, immutable historical decisions, safe structural summaries,
  migration `029`, exact routes/contracts, TDD order, browser journeys,
  non-scope, and child `137` handoff.
- 2026-07-30: Independently rechecked the expansion against Master `006`,
  closed child `135`, current migration/repository/service/routes,
  authorization, Audit/Access, portal, fixture, and idempotency behavior.
- 2026-07-30: Closed unsafe ambiguities around the governing request,
  historical rollback, parent archive/restore, revoked reviewers, current-role
  projection, reason normalization/visibility, recipient deduplication, cursor
  scope, and route capability/Access roots.
- 2026-07-30: Replaced override-only persistence with immutable Publication
  Review Evidence for every successful post-`029` link switch, added safe
  history/Admin-only reason detail, and preserved pre-`029` request digests and
  legacy receipt replay.
- 2026-07-30: Made policy/cancel idempotency, decision Row Version behavior,
  default-policy parent Audit evidence, missing-policy fail-closed behavior,
  exact existing Documentation service ownership, and browser/DB verification
  explicit.

## 22. Planning Verification Record

Expansion inspection covered:

- child `135` final status, checklist, implementation/close-recheck log,
  verification, exact Carry-Forward response, concurrency fixes, lifecycle
  behavior, protected OpenAPI validation, and handoff;
- Master `006` review, authorization, Audit/Access, security, concurrency,
  testing, child sequence, and V1 boundary;
- `CONTEXT.md`, Documentation decisions, and ADR `0030`;
- migration head `028`, test reset order, foundation/audit verification;
- shared Documentation constants and strict contracts;
- Documentation Revision creation/reuse and Publication/rollback repository
  transactions/routes/application wiring;
- Project Membership roles, capabilities, active/revoked users, and implicit
  Organization Owner access;
- Audit command/source and Access route registries;
- Site workbench, Publishing panel, portal router, permissions, API adapters,
  and browser fixture;
- absence of email/webhook/queue/push/general notification infrastructure.

This planning pass changes only this child-plan document. It adds no runtime,
migration, API, schema, dependency, lockfile, Context, ADR, decision-record,
Master, or browser-evidence change.

Independent recheck verification:

- every required existing file named by the plan was confirmed present;
- migration head remains `028`, so `029` is the correct reservation;
- current Publication and rollback command bodies, digests, receipts,
  transactions, and response ownership were inspected;
- current Revision creation/reuse and Edition/Working Draft lock order were
  inspected;
- current Project capability ordering and archived-Project mutation policy were
  inspected;
- current Audit mutation-route/source coverage and Access root behavior were
  inspected;
- Plan `135` restore, immutable Revision, Carry-Forward, response, and
  no-inherited-review handoff were reconciled;
- Prettier and `git diff --check` passed after the recheck edits.

## 23. Leftovers And Handoff To Child 137

Child `137` receives:

- stable Edition-owned `optional | approval_required` publication policy;
- exact Revision identity and current gate result;
- authorized internal reviewer/maintainer identity rules;
- atomic Admin override provenance;
- private review state that is never public;
- unchanged self-contained OpenAPI source and public operation routes.

API Try It must not:

- treat review approval as authorization to execute requests;
- expose review policy, reviewers, reasons, inbox state, or override provenance
  publicly;
- store credentials in review/notification state;
- weaken current Publication/link access policy;
- add a server proxy or external notification transport.

Later children retain:

- child `138`: configurable quotas, retention cleanup/reporting, profiling,
  observability, bundle splitting, and operational hardening;
- child `139`: final Documentation V1 closeout;
- child `140`: Git/GitHub/third-party adapter decisions.

Accepted leftovers:

- review rows are retained indefinitely in V1; governed cleanup/reporting is
  child `138`;
- inbox is selected-Project-Version scoped; cross-Version aggregation is
  later work;
- no external delivery transport exists;
- no Project Activity broadening is required unless implementation proves an
  existing safe body-free label can be reused;
- review remains Documentation-only and does not establish a shared Guide/Demo
  approval framework.
