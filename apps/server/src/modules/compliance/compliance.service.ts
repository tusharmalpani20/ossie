import type {
  ComplianceAccessEvent,
  ComplianceAuditChangeItem,
  ComplianceAuditEventSummary,
  ComplianceKind,
} from "@repo/types/compliance";
import type { ComplianceCursor } from "./compliance.repository";

export class CompliancePermissionError extends Error {
  constructor() {
    super("Only organization owners can view compliance evidence");
  }
}

export class ComplianceCursorError extends Error {
  constructor() {
    super("Compliance cursor is invalid");
  }
}

export class ComplianceAuditEventNotFoundError extends Error {
  constructor() {
    super("Audit event was not found");
  }
}

export class ComplianceEvidenceIntegrityError extends Error {
  constructor() {
    super("Compliance evidence integrity check failed");
  }
}

type ComplianceRepository = {
  list_events(input: {
    organization_id: string;
    project_id: string | null;
    kind: ComplianceKind;
    cursor: ComplianceCursor | null;
    limit: number;
  }): Promise<{
    events: Array<ComplianceAuditEventSummary | ComplianceAccessEvent>;
    has_more: boolean;
    totals: {
      audit_events: number;
      audit_change_items: number;
      access_events: number;
      oldest_occurred_at: string | null;
      newest_occurred_at: string | null;
    };
  }>;
  get_audit_event_detail(input: {
    organization_id: string;
    audit_event_id: string;
  }): Promise<{
    event: ComplianceAuditEventSummary;
    change_items: ComplianceAuditChangeItem[];
  } | null>;
};

type CursorPayload = ComplianceCursor & {
  version: 1;
  filter: string;
};

const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/u;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

const filter_fingerprint = (kind: ComplianceKind, project_id: string | null) =>
  `${kind}:${project_id ?? ""}`;

const encode_cursor = (payload: CursorPayload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

const decode_cursor = (
  cursor: string,
  kind: ComplianceKind,
  project_id: string | null,
): ComplianceCursor => {
  if (
    cursor.length > 2048 ||
    !BASE64URL_PATTERN.test(cursor)
  ) throw new ComplianceCursorError();
  try {
    const value = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Partial<CursorPayload>;
    if (
      value.version !== 1 ||
      value.filter !== filter_fingerprint(kind, project_id) ||
      typeof value.id !== "string" ||
      !ULID_PATTERN.test(value.id) ||
      typeof value.occurred_at !== "string" ||
      !ISO_DATE_TIME_PATTERN.test(value.occurred_at) ||
      (value.evidence_kind !== "audit" && value.evidence_kind !== "access") ||
      Number.isNaN(new Date(value.occurred_at).valueOf()) ||
      new Date(value.occurred_at).toISOString() !== value.occurred_at
    ) throw new ComplianceCursorError();
    return {
      id: value.id,
      occurred_at: new Date(value.occurred_at).toISOString(),
      evidence_kind: value.evidence_kind,
    };
  } catch (error) {
    if (error instanceof ComplianceCursorError) throw error;
    throw new ComplianceCursorError();
  }
};

const assert_owner = (role: string) => {
  if (role !== "owner") throw new CompliancePermissionError();
};

export const build_compliance_service = (repository: ComplianceRepository) => ({
  async list_events(input: {
    auth: { organization_id: string; actor_role: string };
    query: {
      limit?: number;
      cursor?: string | null;
      kind?: ComplianceKind;
      project_id?: string | null;
    };
  }) {
    assert_owner(input.auth.actor_role);
    const kind = input.query.kind ?? "all";
    const project_id = input.query.project_id ?? null;
    const limit = input.query.limit ?? 25;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
      throw new ComplianceCursorError();
    const cursor = input.query.cursor
      ? decode_cursor(input.query.cursor, kind, project_id)
      : null;
    const result = await repository.list_events({
      organization_id: input.auth.organization_id,
      project_id,
      kind,
      cursor,
      limit,
    });
    const last = result.events.at(-1);
    const next_cursor =
      result.has_more && last
        ? encode_cursor({
            version: 1,
            filter: filter_fingerprint(kind, project_id),
            id: last.id,
            occurred_at: last.occurred_at,
            evidence_kind: last.evidence_kind,
          })
        : null;
    return {
      events: result.events,
      page: { next_cursor, has_more: result.has_more },
      totals: result.totals,
    };
  },

  async get_audit_event_detail(input: {
    auth: { organization_id: string; actor_role: string };
    audit_event_id: string;
  }) {
    assert_owner(input.auth.actor_role);
    const result = await repository.get_audit_event_detail({
      organization_id: input.auth.organization_id,
      audit_event_id: input.audit_event_id,
    });
    if (!result) throw new ComplianceAuditEventNotFoundError();
    if (result.event.change_item_count !== result.change_items.length)
      throw new ComplianceEvidenceIntegrityError();
    return {
      event: { ...result.event, change_items: result.change_items },
    };
  },
});
