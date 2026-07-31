import {
  calculate_documentation_limit_state,
  DocumentationDomainError,
} from "@repo/documentation-domain";
import type {
  DocumentationOrganizationLimitsSchema,
  DocumentationOrganizationUsageSchema,
  DocumentationProjectionRebuildReceiptSchema,
  DocumentationProjectionRebuildRequestSchema,
  UpdateDocumentationOrganizationLimitsRequestSchema,
} from "@repo/types";
import type { z } from "zod";
import type { DocumentationWorkAdmission } from "../documentation/documentation-work-admission";

type Limits = z.infer<typeof DocumentationOrganizationLimitsSchema>;
type Usage = z.infer<typeof DocumentationOrganizationUsageSchema>;
type LimitsRequest = z.infer<
  typeof UpdateDocumentationOrganizationLimitsRequestSchema
>;
type RebuildRequest = z.infer<
  typeof DocumentationProjectionRebuildRequestSchema
>;
type RebuildReceipt = z.infer<
  typeof DocumentationProjectionRebuildReceiptSchema
>;

export type DocumentationOperationsAuth = {
  organization_id: string;
  actor_org_user_id: string;
  actor_role: string;
};

export class DocumentationOperationsPermissionError extends Error {
  constructor() {
    super("Organization Owner permission is required");
  }
}

export type DocumentationOperationsRepository = {
  read_limits_and_usage(input: {
    organization_id: string;
  }): Promise<{ limits: Limits; usage: Usage }>;
  update_limits(input: {
    organization_id: string;
    actor_org_user_id: string;
    request: LimitsRequest;
  }): Promise<{ limits: Limits; usage: Usage }>;
  rebuild_projection(input: {
    organization_id: string;
    actor_org_user_id: string | null;
    actor_type?: "org_user" | "system";
    project_id: string;
    project_version_slug: string;
    site_id: string;
    request: RebuildRequest;
  }): Promise<RebuildReceipt>;
};

const states_for = (limits: Limits, usage: Usage) => [
  {
    dimension: "active_sites" as const,
    usage: usage.active_sites,
    limit: limits.active_sites_limit,
    state: calculate_documentation_limit_state(
      usage.active_sites,
      limits.active_sites_limit,
    ),
  },
  {
    dimension: "active_pages" as const,
    usage: usage.active_pages,
    limit: limits.active_pages_limit,
    state: calculate_documentation_limit_state(
      usage.active_pages,
      limits.active_pages_limit,
    ),
  },
  {
    dimension: "retained_file_bytes" as const,
    usage: usage.retained_file_bytes,
    limit: null,
    state: "within_limit" as const,
  },
];

export const build_documentation_operations_service = (
  repository: DocumentationOperationsRepository,
  options: {
    admission?: DocumentationWorkAdmission;
    now?: () => Date;
  } = {},
) => {
  const now = options.now ?? (() => new Date());
  const assert_owner = (auth: DocumentationOperationsAuth) => {
    if (auth.actor_role !== "owner") {
      throw new DocumentationOperationsPermissionError();
    }
  };

  return {
    get_summary: async (auth: DocumentationOperationsAuth) => {
      const result = await repository.read_limits_and_usage({
        organization_id: auth.organization_id,
      });
      return {
        ...result,
        states: states_for(result.limits, result.usage),
        permissions: { can_manage_limits: auth.actor_role === "owner" },
        generated_at: now().toISOString(),
      };
    },
    update_limits: async (
      auth: DocumentationOperationsAuth,
      request: LimitsRequest,
    ) => {
      assert_owner(auth);
      const result = await repository.update_limits({
        organization_id: auth.organization_id,
        actor_org_user_id: auth.actor_org_user_id,
        request,
      });
      return { ...result, states: states_for(result.limits, result.usage) };
    },
    rebuild_projection: async (
      auth: DocumentationOperationsAuth,
      input: {
        project_id: string;
        project_version_slug: string;
        site_id: string;
        request: RebuildRequest;
      },
    ) => {
      assert_owner(auth);
      const slot = options.admission?.try_acquire("rebuild");
      if (slot && !slot.acquired) {
        throw new DocumentationDomainError(
          "documentation_rebuild_capacity_exceeded",
          "Documentation rebuild capacity is currently full",
        );
      }
      try {
        return await repository.rebuild_projection({
          organization_id: auth.organization_id,
          actor_org_user_id: auth.actor_org_user_id,
          actor_type: "org_user",
          ...input,
        });
      } finally {
        if (slot?.acquired) slot.release();
      }
    },
  };
};

export type DocumentationOperationsService = ReturnType<
  typeof build_documentation_operations_service
>;
