import { validate_audit_coverage } from "@repo/audit-domain";

export const AUDIT_COVERAGE_REGISTRY = validate_audit_coverage([
  {
    table: "project_schema.project",
    operation: "INSERT",
    command: "project.create",
    route: "POST /api/v1/projects",
    context_guard: "project_insert_audit_context_guard",
    deferred_guard: "project_insert_audit_evidence_guard",
  },
]);
