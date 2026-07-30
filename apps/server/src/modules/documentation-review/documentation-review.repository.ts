import { createHash } from "node:crypto";
import { ulid } from "ulid";
import { DOCUMENTATION_REVIEW_REQUESTS_PER_EDITION_HARD_MAX } from "@repo/constants";
import {
  documentation_review_effective_status,
  documentation_review_threshold_satisfied,
} from "@repo/documentation-domain";
import {
  build_entity_audit_event,
  resolve_org_user_audit_context,
  type EntityAuditChange,
} from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";

type QueryResult<Row> = { rows: Row[] };
type Queryable = {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>;
};
type Client = Queryable & { release(): void };
type Database = Queryable & { connect(): Promise<Client> };
type Scope = {
  organization_id: string;
  project_id: string;
  project_version_id: string;
  actor_org_user_id: string;
  site_id?: string;
};

export class DocumentationReviewError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DocumentationReviewError";
  }
}

const transaction = async <T>(
  database: Database,
  work: (client: Queryable) => Promise<T>,
) => {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const begin_review_audit = async (
  client: Queryable,
  input: Scope & { command: string; action: string },
) => {
  const event_id = ulid();
  const context = await resolve_org_user_audit_context(client, input);
  for (const [name, value] of [
    ["ossie.audit_event_id", event_id],
    ["ossie.audit_organization_id", input.organization_id],
    ["ossie.audit_action", input.action],
    ["ossie.audit_command", input.command],
    ["ossie.audit_actor_type", "org_user"],
    ["ossie.audit_source_type", context.mutation.source_type],
  ])
    await client.query("SELECT set_config($1,$2,true)", [name, value]);
  return {
    event_id,
    actor_label: context.actor_label,
    source_type: context.mutation.source_type,
    occurred_at: new Date().toISOString(),
  };
};

const write_review_audit = async (
  client: Queryable,
  input: Scope & {
    audit: Awaited<ReturnType<typeof begin_review_audit>>;
    action: string;
    before_version: number | null;
    after_version: number | null;
    changes: readonly EntityAuditChange[];
  },
) => {
  const event = build_entity_audit_event({
    id: input.audit.event_id,
    organization_id: input.organization_id,
    project_id: input.project_id,
    root_resource_type: "documentation_site",
    root_resource_id: input.site_id!,
    action: input.action,
    actor_org_user_id: input.actor_org_user_id,
    actor_label: input.audit.actor_label,
    source_type: input.audit.source_type,
    occurred_at: input.audit.occurred_at,
    before_row_version: input.before_version,
    after_row_version: input.after_version,
    changes: input.changes,
  });
  if (event) await write_audit_event(client, event);
};

const review_change = (
  entity_type: string,
  entity_id: string,
  site_id: string,
  operation: "create" | "update" | "delete",
  version?: { before: number; after: number },
): EntityAuditChange => ({
  entity_type,
  entity_id,
  parent_entity_type: "documentation_site",
  parent_entity_id: site_id,
  before:
    operation === "create" ? null : version ? { version: version.before } : {},
  after:
    operation === "delete" ? null : version ? { version: version.after } : {},
  safe_fields: version ? { version: "integer" } : undefined,
});

const review_digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

const read_review_receipt = async (
  client: Queryable,
  input: Scope & {
    operation: string;
    idempotency_key: string;
    request_digest: string;
  },
) => {
  const result = await client.query<{
    request_digest: string;
    response_body: Record<string, unknown>;
  }>(
    `SELECT request_digest,response_body
       FROM documentation_schema.documentation_command_receipt
      WHERE organization_id=$1 AND project_id=$2
        AND operation=$3 AND idempotency_key=$4`,
    [
      input.organization_id,
      input.project_id,
      input.operation,
      input.idempotency_key,
    ],
  );
  if (!result.rows[0]) return null;
  if (result.rows[0].request_digest !== input.request_digest)
    throw new DocumentationReviewError(
      "documentation_idempotency_conflict",
      "Idempotency key was already used for a different request",
    );
  return { ...result.rows[0].response_body, idempotent_replay: true };
};

const write_review_receipt = (
  client: Queryable,
  input: Scope & {
    operation: string;
    idempotency_key: string;
    request_digest: string;
    response_status: number;
    response_body: unknown;
  },
) =>
  client.query(
    `INSERT INTO documentation_schema.documentation_command_receipt
      (id,organization_id,project_id,operation,idempotency_key,request_digest,
       response_status,response_body,created_by_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`,
    [
      ulid(),
      input.organization_id,
      input.project_id,
      input.operation,
      input.idempotency_key,
      input.request_digest,
      input.response_status,
      JSON.stringify(input.response_body),
      input.actor_org_user_id,
    ],
  );

const policy_projection = `
  SELECT policy.id,policy.documentation_site_id site_id,
         policy.site_edition_id,policy.mode,policy.required_approvals,
         policy.require_maintainer_approval,policy.version,policy.updated_at,
         COALESCE(array_agg(maintainer.maintainer_org_user_id ORDER BY
           maintainer.maintainer_org_user_id)
           FILTER (WHERE maintainer.id IS NOT NULL),'{}') maintainer_org_user_ids
    FROM documentation_schema.documentation_review_policy policy
    LEFT JOIN documentation_schema.documentation_review_maintainer maintainer
      ON maintainer.review_policy_id=policy.id
   WHERE policy.organization_id=$1 AND policy.project_id=$2
     AND policy.project_version_id=$3 AND policy.documentation_site_id=$4
   GROUP BY policy.id`;

const to_policy = (row: Record<string, any>): Record<string, any> => ({
  ...row,
  updated_at:
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : row.updated_at,
});

const to_review_request = (
  row: Record<string, any>,
  effective_status: string,
  counts: { approvals: number; maintainers: number },
) => ({
  id: row.id,
  site_id: row.documentation_site_id ?? row.site_id,
  site_edition_id: row.site_edition_id,
  site_revision_id: row.site_revision_id,
  revision_number: row.revision_number,
  request_number: row.request_number,
  status: row.status,
  effective_status,
  required_approvals: row.required_approvals,
  require_maintainer_approval: row.require_maintainer_approval,
  valid_approval_count: counts.approvals,
  valid_maintainer_approval_count: counts.maintainers,
  created_by_id: row.created_by_id,
  created_by_display_name: row.created_by_display_name,
  version: row.version,
  created_at:
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at,
  closed_at:
    row.closed_at instanceof Date ? row.closed_at.toISOString() : row.closed_at,
  superseded_by_revision_id: row.superseded_by_revision_id,
  superseded_at:
    row.superseded_at instanceof Date
      ? row.superseded_at.toISOString()
      : row.superseded_at,
});

const access_candidate_sql = `
  SELECT actor.id org_user_id,actor_user.display_name,
         CASE WHEN actor.role='owner' THEN 'project_admin'
              ELSE membership.role END project_role,
         actor.role='owner' is_organization_owner
    FROM organization_schema.org_user actor
    JOIN user_schema.user actor_user ON actor_user.id=actor.user_id
    LEFT JOIN project_schema.project_membership membership
      ON membership.organization_id=actor.organization_id
     AND membership.project_id=$2 AND membership.org_user_id=actor.id
     AND membership.status='active'
   WHERE actor.organization_id=$1 AND actor.status='active'
     AND (actor.role='owner' OR membership.id IS NOT NULL)`;

export const build_documentation_review_repository = (database: Database) => {
  const get_policy = async (input: Scope) => {
    const result = await database.query<Record<string, any>>(
      policy_projection,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
      ],
    );
    if (!result.rows[0])
      throw new DocumentationReviewError(
        "documentation_review_policy_missing",
        "Documentation Review Policy is unavailable",
      );
    return to_policy(result.rows[0]);
  };

  const get_request = async (
    input: Scope & { review_request_id: string },
    db: Queryable = database,
  ) => {
    const result = await db.query<Record<string, any>>(
      `SELECT request.*,revision.revision_number,
              creator_user.display_name created_by_display_name
         FROM documentation_schema.documentation_review_request request
         JOIN documentation_schema.site_revision revision
           ON revision.id=request.site_revision_id
         JOIN organization_schema.org_user creator
           ON creator.id=request.created_by_id
         JOIN user_schema.user creator_user ON creator_user.id=creator.user_id
        WHERE request.organization_id=$1 AND request.project_id=$2
          AND request.project_version_id=$3
          AND request.documentation_site_id=$4 AND request.id=$5`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.review_request_id,
      ],
    );
    const request = result.rows[0];
    if (!request)
      throw new DocumentationReviewError(
        "documentation_review_request_not_found",
        "Review Request was not found",
      );
    const assignments = await db.query<Record<string, any>>(
      `SELECT assignment.id,assignment.reviewer_org_user_id,
              reviewer_user.display_name reviewer_display_name,
              membership.role current_project_role,
              CASE WHEN reviewer.status<>'active' THEN 'disabled'
                   WHEN reviewer.role='owner' OR membership.status='active'
                     THEN 'active' ELSE 'revoked' END current_access_status,
              assignment.is_maintainer_at_assignment,
              maintainer.id IS NOT NULL is_current_maintainer,
              CASE WHEN decision.id IS NULL THEN NULL ELSE jsonb_build_object(
                'id',decision.id,'decision',decision.decision,
                'reason',decision.reason,'decided_by_id',decision.decided_by_id,
                'created_at',decision.created_at) END decision
         FROM documentation_schema.documentation_review_assignment assignment
         JOIN organization_schema.org_user reviewer
           ON reviewer.id=assignment.reviewer_org_user_id
         JOIN user_schema.user reviewer_user ON reviewer_user.id=reviewer.user_id
         LEFT JOIN project_schema.project_membership membership
           ON membership.project_id=$1
          AND membership.org_user_id=assignment.reviewer_org_user_id
         LEFT JOIN documentation_schema.documentation_review_decision decision
           ON decision.review_assignment_id=assignment.id
         LEFT JOIN documentation_schema.documentation_review_policy policy
           ON policy.site_edition_id=$3
         LEFT JOIN documentation_schema.documentation_review_maintainer maintainer
           ON maintainer.review_policy_id=policy.id
          AND maintainer.maintainer_org_user_id=assignment.reviewer_org_user_id
        WHERE assignment.review_request_id=$2
        ORDER BY reviewer_user.display_name,assignment.id`,
      [input.project_id, input.review_request_id, request.site_edition_id],
    );
    const counts = assignments.rows.reduce<{
      approvals: number;
      maintainers: number;
    }>(
      (value, assignment) => {
        if (
          assignment.decision?.decision === "approve" &&
          assignment.current_access_status === "active"
        ) {
          value.approvals += 1;
          if (assignment.is_current_maintainer) value.maintainers += 1;
        }
        return value;
      },
      { approvals: 0, maintainers: 0 },
    );
    const valid = documentation_review_threshold_satisfied({
      required_approvals: request.required_approvals,
      require_maintainer_approval: request.require_maintainer_approval,
      valid_approval_count: counts.approvals,
      valid_maintainer_approval_count: counts.maintainers,
    });
    const effective_status = documentation_review_effective_status(
      request.status,
      valid,
    );
    return {
      review_request: {
        ...to_review_request(request, effective_status, counts),
      },
      assignments: assignments.rows,
      change_summary: {
        pages_added: 0,
        pages_changed: 0,
        pages_removed: 0,
        snippets_changed: 0,
        assets_changed: 0,
        navigation_changed: false,
        openapi_changed: false,
      },
      publication_gate: null,
      cancellation:
        request.status === "canceled"
          ? {
              canceled_by_org_user_id: request.canceled_by_org_user_id,
              canceled_at: request.canceled_at,
              reason: request.cancel_reason,
            }
          : null,
    };
  };

  return {
    get_policy,

    update_policy: (
      input: Scope & {
        idempotency_key?: string;
        data: Record<string, any>;
      },
    ) =>
      transaction(database, async (client) => {
        const operation = "documentation.review_policy.update";
        const request_digest = review_digest({
          project_version_id: input.project_version_id,
          site_id: input.site_id,
          data: input.data,
        });
        const replay = await read_review_receipt(client, {
          ...input,
          operation,
          idempotency_key: input.idempotency_key!,
          request_digest,
        });
        if (replay) return replay;
        const audit = await begin_review_audit(client, {
          ...input,
          command: "documentation.review_policy.update",
          action: "documentation.review_policy_updated",
        });
        const locked = await client.query<Record<string, any>>(
          `SELECT id,version,site_edition_id
             FROM documentation_schema.documentation_review_policy
            WHERE organization_id=$1 AND project_id=$2
              AND project_version_id=$3 AND documentation_site_id=$4
            FOR UPDATE`,
          [
            input.organization_id,
            input.project_id,
            input.project_version_id,
            input.site_id,
          ],
        );
        const policy = locked.rows[0];
        if (!policy)
          throw new DocumentationReviewError(
            "documentation_review_policy_missing",
            "Documentation Review Policy is unavailable",
          );
        if (policy.version !== input.data.expected_policy_version)
          throw new DocumentationReviewError(
            "documentation_review_version_conflict",
            "Documentation Review Policy changed",
          );
        if (input.data.maintainer_org_user_ids.length) {
          const eligible = await client.query<{ id: string }>(
            `${access_candidate_sql}
              AND actor.id=ANY($3::varchar[]) FOR SHARE`,
            [
              input.organization_id,
              input.project_id,
              input.data.maintainer_org_user_ids,
            ],
          );
          if (
            eligible.rows.length !== input.data.maintainer_org_user_ids.length
          )
            throw new DocumentationReviewError(
              "documentation_review_candidate_ineligible",
              "A selected maintainer no longer has Project access",
            );
        }
        if (
          input.data.require_maintainer_approval &&
          input.data.maintainer_org_user_ids.length === 0
        )
          throw new DocumentationReviewError(
            "documentation_review_policy_invalid",
            "Maintainer approval requires at least one maintainer",
          );
        const removed = await client.query<{ id: string }>(
          `DELETE FROM documentation_schema.documentation_review_maintainer
            WHERE review_policy_id=$1 RETURNING id`,
          [policy.id],
        );
        const addedIds: string[] = [];
        for (const maintainer of input.data.maintainer_org_user_ids) {
          const maintainerId = ulid();
          addedIds.push(maintainerId);
          await client.query(
            `INSERT INTO documentation_schema.documentation_review_maintainer
              (id,organization_id,project_id,review_policy_id,
               maintainer_org_user_id,created_by_id)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              maintainerId,
              input.organization_id,
              input.project_id,
              policy.id,
              maintainer,
              input.actor_org_user_id,
            ],
          );
        }
        const updated = await client.query<Record<string, any>>(
          `UPDATE documentation_schema.documentation_review_policy
              SET mode=$2,required_approvals=$3,
                  require_maintainer_approval=$4,version=version+1,
                  updated_by_id=$5,updated_at=CURRENT_TIMESTAMP
            WHERE id=$1
            RETURNING id,documentation_site_id site_id,site_edition_id,mode,
                      required_approvals,require_maintainer_approval,version,
                      updated_at`,
          [
            policy.id,
            input.data.mode,
            input.data.required_approvals,
            input.data.require_maintainer_approval,
            input.actor_org_user_id,
          ],
        );
        const response = to_policy({
          ...updated.rows[0],
          maintainer_org_user_ids: input.data.maintainer_org_user_ids,
        });
        await write_review_audit(client, {
          ...input,
          audit,
          action: "documentation.review_policy_updated",
          before_version: policy.version,
          after_version: response.version,
          changes: [
            review_change(
              "documentation_review_policy",
              policy.id,
              input.site_id!,
              "update",
              { before: policy.version, after: response.version },
            ),
            ...removed.rows.map(({ id }) =>
              review_change(
                "documentation_review_maintainer",
                id,
                input.site_id!,
                "delete",
              ),
            ),
            ...addedIds.map((id) =>
              review_change(
                "documentation_review_maintainer",
                id,
                input.site_id!,
                "create",
              ),
            ),
          ],
        });
        await write_review_receipt(client, {
          ...input,
          operation,
          idempotency_key: input.idempotency_key!,
          request_digest,
          response_status: 200,
          response_body: response,
        });
        return response;
      }),

    list_candidates: async (
      input: Scope & { limit?: number; cursor?: string },
    ) => {
      const policy = await get_policy(input);
      const result = await database.query<Record<string, any>>(
        `${access_candidate_sql}
          ORDER BY lower(actor_user.display_name),actor.id LIMIT $3`,
        [input.organization_id, input.project_id, input.limit ?? 50],
      );
      const maintainers = new Set(policy.maintainer_org_user_ids);
      return {
        candidates: result.rows.map((row) => ({
          ...row,
          is_maintainer: maintainers.has(row.org_user_id),
        })),
        next_cursor: null,
      };
    },

    create_request: (
      input: Scope & {
        idempotency_key?: string;
        data: Record<string, any>;
      },
    ) =>
      transaction(database, async (client) => {
        const operation = "documentation.review_request.create";
        const request_digest = review_digest({
          project_version_id: input.project_version_id,
          site_id: input.site_id,
          data: input.data,
        });
        const replay = await read_review_receipt(client, {
          ...input,
          operation,
          idempotency_key: input.idempotency_key!,
          request_digest,
        });
        if (replay) return replay;
        const audit = await begin_review_audit(client, {
          ...input,
          command: "documentation.review_request.create",
          action: "documentation.review_requested",
        });
        const policy = await client.query<Record<string, any>>(
          `SELECT policy.*,edition.status edition_status
             FROM documentation_schema.documentation_review_policy policy
             JOIN documentation_schema.site_edition edition
               ON edition.id=policy.site_edition_id
            WHERE policy.organization_id=$1 AND policy.project_id=$2
              AND policy.project_version_id=$3
              AND policy.documentation_site_id=$4 FOR UPDATE`,
          [
            input.organization_id,
            input.project_id,
            input.project_version_id,
            input.site_id,
          ],
        );
        const row = policy.rows[0];
        if (!row)
          throw new DocumentationReviewError(
            "documentation_review_policy_missing",
            "Documentation Review Policy is unavailable",
          );
        if (row.version !== input.data.expected_policy_version)
          throw new DocumentationReviewError(
            "documentation_review_version_conflict",
            "Documentation Review Policy changed",
          );
        if (row.edition_status !== "active")
          throw new DocumentationReviewError(
            "documentation_read_only",
            "Archived Documentation cannot enter review",
          );
        const latest = await client.query<{ id: string }>(
          `SELECT id FROM documentation_schema.site_revision
            WHERE site_edition_id=$1 ORDER BY revision_number DESC LIMIT 1`,
          [row.site_edition_id],
        );
        if (latest.rows[0]?.id !== input.data.site_revision_id)
          throw new DocumentationReviewError(
            "documentation_review_revision_not_latest",
            "Only the latest Revision can enter review",
          );
        if (input.data.reviewer_org_user_ids.includes(input.actor_org_user_id))
          throw new DocumentationReviewError(
            "documentation_review_self_assignment_forbidden",
            "The requester cannot review their own request",
          );
        if (input.data.reviewer_org_user_ids.length < row.required_approvals)
          throw new DocumentationReviewError(
            "documentation_review_policy_invalid",
            "The reviewer set cannot satisfy the approval threshold",
          );
        const priorRequests = await client.query<{ count: number }>(
          `SELECT count(*)::int count
             FROM documentation_schema.documentation_review_request
            WHERE site_edition_id=$1`,
          [row.site_edition_id],
        );
        if (
          (priorRequests.rows[0]?.count ?? 0) >=
          DOCUMENTATION_REVIEW_REQUESTS_PER_EDITION_HARD_MAX
        )
          throw new DocumentationReviewError(
            "documentation_review_limit_exceeded",
            "The Review Request limit has been reached",
          );
        const openRequest = await client.query<{ id: string }>(
          `SELECT id FROM documentation_schema.documentation_review_request
            WHERE site_edition_id=$1 AND status='open' FOR UPDATE`,
          [row.site_edition_id],
        );
        if (openRequest.rows[0])
          throw new DocumentationReviewError(
            "documentation_review_open_request_exists",
            "An open Review Request already exists",
          );
        const candidates = await client.query<{
          org_user_id: string;
          is_maintainer: boolean;
        }>(
          `SELECT candidate.org_user_id,
                  maintainer.id IS NOT NULL is_maintainer
             FROM (${access_candidate_sql}) candidate
             LEFT JOIN documentation_schema.documentation_review_maintainer maintainer
               ON maintainer.review_policy_id=$4
              AND maintainer.maintainer_org_user_id=candidate.org_user_id
            WHERE candidate.org_user_id=ANY($3::varchar[])`,
          [
            input.organization_id,
            input.project_id,
            input.data.reviewer_org_user_ids,
            row.id,
          ],
        );
        if (candidates.rows.length !== input.data.reviewer_org_user_ids.length)
          throw new DocumentationReviewError(
            "documentation_review_candidate_ineligible",
            "A selected reviewer no longer has Project access",
          );
        if (
          row.require_maintainer_approval &&
          !candidates.rows.some((candidate) => candidate.is_maintainer)
        )
          throw new DocumentationReviewError(
            "documentation_review_policy_invalid",
            "The reviewer set must include a current maintainer",
          );
        const number = await client.query<{ request_number: number }>(
          `SELECT COALESCE(max(request_number),0)+1 request_number
             FROM documentation_schema.documentation_review_request
            WHERE site_edition_id=$1`,
          [row.site_edition_id],
        );
        const requestId = ulid();
        const assignmentIds: string[] = [];
        const notificationIds: string[] = [];
        const inserted = await client.query<Record<string, any>>(
          `INSERT INTO documentation_schema.documentation_review_request
            (id,organization_id,project_id,documentation_site_id,
             site_edition_id,project_version_id,site_revision_id,request_number,
             status,required_approvals,require_maintainer_approval,created_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open',$9,$10,$11)
           RETURNING *`,
          [
            requestId,
            input.organization_id,
            input.project_id,
            input.site_id,
            row.site_edition_id,
            input.project_version_id,
            input.data.site_revision_id,
            number.rows[0]?.request_number ?? 1,
            row.required_approvals,
            row.require_maintainer_approval,
            input.actor_org_user_id,
          ],
        );
        for (const candidate of candidates.rows) {
          const assignmentId = ulid();
          assignmentIds.push(assignmentId);
          await client.query(
            `INSERT INTO documentation_schema.documentation_review_assignment
              (id,organization_id,project_id,review_request_id,
               reviewer_org_user_id,is_maintainer_at_assignment)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              assignmentId,
              input.organization_id,
              input.project_id,
              requestId,
              candidate.org_user_id,
              candidate.is_maintainer,
            ],
          );
          const notificationId = ulid();
          notificationIds.push(notificationId);
          await client.query(
            `INSERT INTO documentation_schema.documentation_review_notification
              (id,organization_id,project_id,project_version_id,
               documentation_site_id,recipient_org_user_id,review_request_id,
               site_revision_id,source_audit_event_id,type)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'review_assigned')
             ON CONFLICT DO NOTHING`,
            [
              notificationId,
              input.organization_id,
              input.project_id,
              input.project_version_id,
              input.site_id,
              candidate.org_user_id,
              requestId,
              input.data.site_revision_id,
              audit.event_id,
            ],
          );
        }
        const response = {
          review_request: (
            await get_request(
              { ...input, review_request_id: requestId },
              client,
            )
          ).review_request,
        };
        await write_review_audit(client, {
          ...input,
          audit,
          action: "documentation.review_requested",
          before_version: null,
          after_version: 1,
          changes: [
            review_change(
              "documentation_review_request",
              requestId,
              input.site_id!,
              "create",
            ),
            ...assignmentIds.map((id) =>
              review_change(
                "documentation_review_assignment",
                id,
                input.site_id!,
                "create",
              ),
            ),
            ...notificationIds.map((id) =>
              review_change(
                "documentation_review_notification",
                id,
                input.site_id!,
                "create",
              ),
            ),
          ],
        });
        await write_review_receipt(client, {
          ...input,
          operation,
          idempotency_key: input.idempotency_key!,
          request_digest,
          response_status: 201,
          response_body: response,
        });
        return response;
      }),

    get_request: (input: Scope & { review_request_id: string }) =>
      get_request(input),

    list_requests: async (
      input: Scope & {
        status?: string;
        participation?: string;
        limit?: number;
      },
    ) => {
      const values: unknown[] = [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.actor_org_user_id,
        input.limit ?? 50,
      ];
      const participation =
        input.participation === "requested_by_me"
          ? "AND request.created_by_id=$5"
          : input.participation === "assigned_to_me"
            ? `AND EXISTS (SELECT 1 FROM
                documentation_schema.documentation_review_assignment assigned
                WHERE assigned.review_request_id=request.id
                  AND assigned.reviewer_org_user_id=$5)`
            : "";
      const status =
        input.status && input.status !== "all" ? "AND request.status=$7" : "";
      if (status) values.push(input.status);
      const result = await database.query<Record<string, any>>(
        `SELECT request.*,revision.revision_number,
                creator_user.display_name created_by_display_name,
                request.status effective_status,
                0 valid_approval_count,0 valid_maintainer_approval_count
           FROM documentation_schema.documentation_review_request request
           JOIN documentation_schema.site_revision revision
             ON revision.id=request.site_revision_id
           JOIN organization_schema.org_user creator
             ON creator.id=request.created_by_id
           JOIN user_schema.user creator_user ON creator_user.id=creator.user_id
          WHERE request.organization_id=$1 AND request.project_id=$2
            AND request.project_version_id=$3
            AND request.documentation_site_id=$4
            ${participation} ${status}
          ORDER BY request.created_at DESC,request.id DESC LIMIT $6`,
        values,
      );
      return {
        review_requests: await Promise.all(
          result.rows.map(async (request) => {
            const detail = await get_request(
              { ...input, review_request_id: request.id },
              database,
            );
            return detail.review_request;
          }),
        ),
        next_cursor: null,
      };
    },

    decide: (
      input: Scope & {
        review_request_id: string;
        idempotency_key?: string;
        data: Record<string, any>;
      },
    ) =>
      transaction(database, async (client) => {
        const command =
          input.data.decision === "approve"
            ? "documentation.review_decision.approve"
            : "documentation.review_decision.reject";
        const action =
          input.data.decision === "approve"
            ? "documentation.review_approved"
            : "documentation.review_rejected";
        const request_digest = review_digest({
          project_version_id: input.project_version_id,
          site_id: input.site_id,
          review_request_id: input.review_request_id,
          data: input.data,
        });
        const replay = await read_review_receipt(client, {
          ...input,
          operation: command,
          idempotency_key: input.idempotency_key!,
          request_digest,
        });
        if (replay) return replay;
        const audit = await begin_review_audit(client, {
          ...input,
          command,
          action,
        });
        const locked = await client.query<Record<string, any>>(
          `SELECT request.*,assignment.id assignment_id
             FROM documentation_schema.documentation_review_request request
             JOIN documentation_schema.documentation_review_assignment assignment
               ON assignment.review_request_id=request.id
              AND assignment.reviewer_org_user_id=$6
            WHERE request.organization_id=$1 AND request.project_id=$2
              AND request.project_version_id=$3
              AND request.documentation_site_id=$4 AND request.id=$5
            FOR UPDATE OF request`,
          [
            input.organization_id,
            input.project_id,
            input.project_version_id,
            input.site_id,
            input.review_request_id,
            input.actor_org_user_id,
          ],
        );
        const request = locked.rows[0];
        if (!request)
          throw new DocumentationReviewError(
            "documentation_review_assignment_required",
            "Only an assigned reviewer can decide",
          );
        if (
          request.status !== "open" ||
          request.version !== input.data.expected_review_request_version
        )
          throw new DocumentationReviewError(
            "documentation_review_version_conflict",
            "Review Request changed",
          );
        const decisionId = ulid();
        await client.query(
          `INSERT INTO documentation_schema.documentation_review_decision
            (id,organization_id,project_id,review_request_id,
             review_assignment_id,decision,reason,decided_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            decisionId,
            input.organization_id,
            input.project_id,
            input.review_request_id,
            request.assignment_id,
            input.data.decision,
            input.data.reason,
            input.actor_org_user_id,
          ],
        );
        let status = input.data.decision === "reject" ? "rejected" : "open";
        if (status === "open") {
          const count = await client.query<{
            approvals: number;
            maintainer_approvals: number;
          }>(
            `SELECT count(*)::int approvals,
                    count(*) FILTER
                      (WHERE assignment.is_maintainer_at_assignment)::int
                      maintainer_approvals
               FROM documentation_schema.documentation_review_decision decision
               JOIN documentation_schema.documentation_review_assignment assignment
                 ON assignment.id=decision.review_assignment_id
               JOIN organization_schema.org_user reviewer
                 ON reviewer.id=assignment.reviewer_org_user_id
                AND reviewer.status='active'
               LEFT JOIN project_schema.project_membership membership
                 ON membership.project_id=$2
                AND membership.org_user_id=reviewer.id
                AND membership.status='active'
              WHERE decision.review_request_id=$1 AND decision.decision='approve'
                AND (reviewer.role='owner' OR membership.id IS NOT NULL)`,
            [input.review_request_id, input.project_id],
          );
          if (
            documentation_review_threshold_satisfied({
              required_approvals: request.required_approvals,
              require_maintainer_approval: request.require_maintainer_approval,
              valid_approval_count: count.rows[0]?.approvals ?? 0,
              valid_maintainer_approval_count:
                count.rows[0]?.maintainer_approvals ?? 0,
            })
          )
            status = "approved";
        }
        const updated = await client.query<Record<string, any>>(
          `UPDATE documentation_schema.documentation_review_request
              SET status=$2,version=version+1,updated_at=CURRENT_TIMESTAMP,
                  closed_at=CASE WHEN $2='open' THEN NULL
                                 ELSE CURRENT_TIMESTAMP END
            WHERE id=$1 RETURNING *`,
          [input.review_request_id, status],
        );
        const recipients =
          status === "open"
            ? { rows: [] }
            : await client.query<{ org_user_id: string }>(
                `SELECT DISTINCT recipient.org_user_id
             FROM (
               SELECT created_by_id org_user_id
                 FROM documentation_schema.documentation_review_request
                WHERE id=$1
               UNION
               SELECT reviewer_org_user_id
                 FROM documentation_schema.documentation_review_assignment
                WHERE review_request_id=$1
             ) recipient
            WHERE recipient.org_user_id<>$2`,
                [input.review_request_id, input.actor_org_user_id],
              );
        const notificationIds: string[] = [];
        for (const recipient of recipients.rows) {
          const notificationId = ulid();
          notificationIds.push(notificationId);
          await client.query(
            `INSERT INTO documentation_schema.documentation_review_notification
              (id,organization_id,project_id,project_version_id,
               documentation_site_id,recipient_org_user_id,review_request_id,
               site_revision_id,source_audit_event_id,type)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             ON CONFLICT DO NOTHING`,
            [
              notificationId,
              input.organization_id,
              input.project_id,
              input.project_version_id,
              input.site_id,
              recipient.org_user_id,
              input.review_request_id,
              request.site_revision_id,
              audit.event_id,
              input.data.decision === "approve"
                ? "review_approved"
                : "review_rejected",
            ],
          );
        }
        const updatedRequest = updated.rows[0]!;
        const response = {
          review_request: (
            await get_request(
              { ...input, review_request_id: input.review_request_id },
              client,
            )
          ).review_request,
        };
        await write_review_audit(client, {
          ...input,
          audit,
          action,
          before_version: request.version,
          after_version: updatedRequest.version,
          changes: [
            review_change(
              "documentation_review_decision",
              decisionId,
              input.site_id!,
              "create",
            ),
            review_change(
              "documentation_review_request",
              input.review_request_id,
              input.site_id!,
              "update",
              { before: request.version, after: updatedRequest.version },
            ),
            ...notificationIds.map((id) =>
              review_change(
                "documentation_review_notification",
                id,
                input.site_id!,
                "create",
              ),
            ),
          ],
        });
        await write_review_receipt(client, {
          ...input,
          operation: command,
          idempotency_key: input.idempotency_key!,
          request_digest,
          response_status: 200,
          response_body: response,
        });
        return response;
      }),

    cancel: (
      input: Scope & {
        review_request_id: string;
        idempotency_key?: string;
        data: Record<string, any>;
      },
    ) =>
      transaction(database, async (client) => {
        const operation = "documentation.review_request.cancel";
        const request_digest = review_digest({
          project_version_id: input.project_version_id,
          site_id: input.site_id,
          review_request_id: input.review_request_id,
          data: input.data,
        });
        const replay = await read_review_receipt(client, {
          ...input,
          operation,
          idempotency_key: input.idempotency_key!,
          request_digest,
        });
        if (replay) return replay;
        const audit = await begin_review_audit(client, {
          ...input,
          command: "documentation.review_request.cancel",
          action: "documentation.review_canceled",
        });
        const locked = await client.query<Record<string, any>>(
          `SELECT request.*,
                  (actor.role='owner' OR membership.role='project_admin')
                    actor_is_admin
             FROM documentation_schema.documentation_review_request request
             JOIN organization_schema.org_user actor
               ON actor.id=$6 AND actor.organization_id=request.organization_id
             LEFT JOIN project_schema.project_membership membership
               ON membership.project_id=request.project_id
              AND membership.org_user_id=actor.id AND membership.status='active'
            WHERE request.organization_id=$1 AND request.project_id=$2
              AND request.project_version_id=$3
              AND request.documentation_site_id=$4 AND request.id=$5
            FOR UPDATE OF request`,
          [
            input.organization_id,
            input.project_id,
            input.project_version_id,
            input.site_id,
            input.review_request_id,
            input.actor_org_user_id,
          ],
        );
        const request = locked.rows[0];
        if (
          !request ||
          (request.created_by_id !== input.actor_org_user_id &&
            !request.actor_is_admin)
        )
          throw new DocumentationReviewError(
            "documentation_review_cancel_forbidden",
            "Only the requester or an Admin can cancel this request",
          );
        if (
          request.status !== "open" ||
          request.version !== input.data.expected_review_request_version
        )
          throw new DocumentationReviewError(
            "documentation_review_version_conflict",
            "Review Request changed",
          );
        const updated = await client.query<Record<string, any>>(
          `UPDATE documentation_schema.documentation_review_request
              SET status='canceled',version=version+1,closed_at=CURRENT_TIMESTAMP,
                  canceled_by_org_user_id=$2,canceled_at=CURRENT_TIMESTAMP,
                  cancel_reason=$3,updated_at=CURRENT_TIMESTAMP
            WHERE id=$1 RETURNING *`,
          [input.review_request_id, input.actor_org_user_id, input.data.reason],
        );
        const recipients = await client.query<{ org_user_id: string }>(
          `SELECT reviewer_org_user_id org_user_id
             FROM documentation_schema.documentation_review_assignment
            WHERE review_request_id=$1 AND reviewer_org_user_id<>$2`,
          [input.review_request_id, input.actor_org_user_id],
        );
        const notificationIds: string[] = [];
        for (const recipient of recipients.rows) {
          const notificationId = ulid();
          notificationIds.push(notificationId);
          await client.query(
            `INSERT INTO documentation_schema.documentation_review_notification
              (id,organization_id,project_id,project_version_id,
               documentation_site_id,recipient_org_user_id,review_request_id,
               site_revision_id,source_audit_event_id,type)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'review_canceled')
             ON CONFLICT DO NOTHING`,
            [
              notificationId,
              input.organization_id,
              input.project_id,
              input.project_version_id,
              input.site_id,
              recipient.org_user_id,
              input.review_request_id,
              request.site_revision_id,
              audit.event_id,
            ],
          );
        }
        const updatedRequest = updated.rows[0]!;
        const response = {
          review_request: (
            await get_request(
              { ...input, review_request_id: input.review_request_id },
              client,
            )
          ).review_request,
        };
        await write_review_audit(client, {
          ...input,
          audit,
          action: "documentation.review_canceled",
          before_version: request.version,
          after_version: updatedRequest.version,
          changes: [
            review_change(
              "documentation_review_request",
              input.review_request_id,
              input.site_id!,
              "update",
              { before: request.version, after: updatedRequest.version },
            ),
            ...notificationIds.map((id) =>
              review_change(
                "documentation_review_notification",
                id,
                input.site_id!,
                "create",
              ),
            ),
          ],
        });
        await write_review_receipt(client, {
          ...input,
          operation,
          idempotency_key: input.idempotency_key!,
          request_digest,
          response_status: 200,
          response_body: response,
        });
        return response;
      }),

    preview_gate: async (input: Scope & { revision_id: string }) => {
      const policy = await get_policy(input);
      const request = await database.query<Record<string, any>>(
        `SELECT request.id,request.status,request.required_approvals,
                request.require_maintainer_approval,
                count(decision.id) FILTER
                  (WHERE decision.decision='approve'
                    AND reviewer.status='active'
                    AND (reviewer.role='owner' OR membership.id IS NOT NULL))::int
                  valid_approval_count,
                count(decision.id) FILTER
                  (WHERE decision.decision='approve'
                   AND reviewer.status='active'
                   AND (reviewer.role='owner' OR membership.id IS NOT NULL)
                   AND maintainer.id IS NOT NULL)::int
                  valid_maintainer_approval_count
           FROM documentation_schema.documentation_review_request request
           LEFT JOIN documentation_schema.documentation_review_assignment assignment
             ON assignment.review_request_id=request.id
           LEFT JOIN documentation_schema.documentation_review_decision decision
             ON decision.review_assignment_id=assignment.id
           LEFT JOIN organization_schema.org_user reviewer
             ON reviewer.id=assignment.reviewer_org_user_id
           LEFT JOIN project_schema.project_membership membership
             ON membership.project_id=$2
            AND membership.org_user_id=reviewer.id
            AND membership.status='active'
           LEFT JOIN documentation_schema.documentation_review_maintainer maintainer
             ON maintainer.review_policy_id=$6
            AND maintainer.maintainer_org_user_id=assignment.reviewer_org_user_id
          WHERE request.organization_id=$1 AND request.project_id=$2
            AND request.project_version_id=$3
            AND request.documentation_site_id=$4
            AND request.site_revision_id=$5
          GROUP BY request.id ORDER BY request.request_number DESC LIMIT 1`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.revision_id,
          policy.id,
        ],
      );
      const governing = request.rows[0];
      const approved =
        governing?.status === "approved" &&
        documentation_review_threshold_satisfied({
          required_approvals: governing.required_approvals,
          require_maintainer_approval: governing.require_maintainer_approval,
          valid_approval_count: governing.valid_approval_count,
          valid_maintainer_approval_count:
            governing.valid_maintainer_approval_count,
        });
      return {
        site_revision_id: input.revision_id,
        policy_mode: policy.mode,
        policy_version: policy.version,
        outcome:
          policy.mode === "optional"
            ? "not_required"
            : !governing
              ? "approval_missing"
              : approved
                ? "approved"
                : governing.status === "approved"
                  ? "invalidated"
                  : "approval_pending",
        governing_review_request_id: governing?.id ?? null,
        required_approvals: policy.required_approvals,
        valid_approval_count: governing?.valid_approval_count ?? 0,
        require_maintainer_approval: policy.require_maintainer_approval,
        valid_maintainer_approval_count:
          governing?.valid_maintainer_approval_count ?? 0,
        override_available_to_actor: false,
      };
    },

    list_inbox: async (
      input: Scope & { status?: string; limit?: number; cursor?: string },
    ) => {
      const values: unknown[] = [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.actor_org_user_id,
        input.limit ?? 50,
      ];
      const status =
        input.status && input.status !== "all"
          ? "AND notification.status=$6"
          : "";
      if (status) values.push(input.status);
      const result = await database.query<Record<string, any>>(
        `SELECT notification.*,
                jsonb_build_object('site_name',site.name,
                  'revision_number',revision.revision_number,
                  'request_number',request.request_number) display_context
           FROM documentation_schema.documentation_review_notification notification
           JOIN documentation_schema.documentation_site site
             ON site.id=notification.documentation_site_id
           JOIN documentation_schema.site_revision revision
             ON revision.id=notification.site_revision_id
           JOIN documentation_schema.documentation_review_request request
             ON request.id=notification.review_request_id
          WHERE notification.organization_id=$1
            AND notification.project_id=$2
            AND notification.project_version_id=$3
            AND notification.recipient_org_user_id=$4
            ${status}
          ORDER BY notification.created_at DESC,notification.id DESC LIMIT $5`,
        values,
      );
      const unread = await database.query<{ count: number }>(
        `SELECT count(*)::int count
           FROM documentation_schema.documentation_review_notification
          WHERE organization_id=$1 AND project_id=$2 AND project_version_id=$3
            AND recipient_org_user_id=$4 AND status='unread'`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.actor_org_user_id,
        ],
      );
      return {
        items: result.rows.map(({ display_context, ...notification }) => ({
          notification: {
            ...notification,
            site_id: notification.documentation_site_id,
          },
          display_context,
        })),
        next_cursor: null,
        unread_count: unread.rows[0]?.count ?? 0,
      };
    },

    mark_read: (
      input: Scope & {
        notification_id: string;
        data: { expected_version: number };
      },
    ) =>
      transaction(database, async (client) => {
        const audit = await begin_review_audit(client, {
          ...input,
          command: "documentation.review_notification.read",
          action: "documentation.review_notification_read",
        });
        const result = await client.query<Record<string, any>>(
          `UPDATE documentation_schema.documentation_review_notification
            SET status='read',read_at=CURRENT_TIMESTAMP,version=version+1,
                updated_at=CURRENT_TIMESTAMP
          WHERE id=$1 AND organization_id=$2 AND project_id=$3
            AND project_version_id=$4 AND recipient_org_user_id=$5
            AND version=$6 AND status='unread' RETURNING *`,
          [
            input.notification_id,
            input.organization_id,
            input.project_id,
            input.project_version_id,
            input.actor_org_user_id,
            input.data.expected_version,
          ],
        );
        if (!result.rows[0])
          throw new DocumentationReviewError(
            "documentation_review_version_conflict",
            "Notification changed",
          );
        await write_review_audit(client, {
          ...input,
          site_id: result.rows[0].documentation_site_id,
          audit,
          action: "documentation.review_notification_read",
          before_version: input.data.expected_version,
          after_version: result.rows[0].version,
          changes: [
            review_change(
              "documentation_review_notification",
              input.notification_id,
              result.rows[0].documentation_site_id,
              "update",
              {
                before: input.data.expected_version,
                after: result.rows[0].version,
              },
            ),
          ],
        });
        return result.rows[0];
      }),

    list_evidence: async (
      input: Scope & {
        revision_id?: string;
        site_publication_id?: string;
        outcome?: string;
        limit?: number;
        cursor?: string;
      },
    ) => {
      const values: unknown[] = [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.limit ?? 50,
      ];
      const filters: string[] = [];
      if (input.revision_id) {
        values.push(input.revision_id);
        filters.push(`site_revision_id=$${values.length}`);
      }
      if (input.site_publication_id) {
        values.push(input.site_publication_id);
        filters.push(`site_publication_id=$${values.length}`);
      }
      if (input.outcome && input.outcome !== "all") {
        values.push(input.outcome);
        filters.push(`outcome=$${values.length}`);
      }
      const result = await database.query<Record<string, any>>(
        `SELECT id,site_revision_id,site_publication_id,publish_link_id,
                publish_link_entry_id,operation,policy_mode,policy_version,
                required_approvals,require_maintainer_approval,
                valid_approval_count,valid_maintainer_approval_count,outcome,
                review_request_id,created_by_id,created_at
           FROM publish_schema.documentation_publication_review_evidence
          WHERE organization_id=$1 AND project_id=$2
            AND project_version_id=$3 AND documentation_site_id=$4
            ${filters.length ? `AND ${filters.join(" AND ")}` : ""}
          ORDER BY created_at DESC,id DESC LIMIT $5`,
        values,
      );
      return { evidence: result.rows, next_cursor: null };
    },

    get_evidence: async (input: Scope & { evidence_id: string }) => {
      const result = await database.query<Record<string, any>>(
        `SELECT * FROM publish_schema.documentation_publication_review_evidence
          WHERE id=$1 AND organization_id=$2 AND project_id=$3
            AND project_version_id=$4 AND documentation_site_id=$5`,
        [
          input.evidence_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      const row = result.rows[0];
      if (!row)
        throw new DocumentationReviewError(
          "documentation_review_evidence_not_found",
          "Publication Review Evidence was not found",
        );
      const { override_reason, ...evidence } = row;
      return { evidence, override_reason };
    },
  };
};
