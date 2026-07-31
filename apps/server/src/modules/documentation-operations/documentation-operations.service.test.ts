import { describe, expect, it, vi } from "vitest";
import {
  DocumentationOperationsPermissionError,
  build_documentation_operations_service,
} from "./documentation-operations.service";

const limits = {
  active_sites_limit: null,
  active_pages_limit: 10,
  version: 1,
  updated_at: "2026-07-31T00:00:00.000Z",
};
const usage = {
  active_sites: 2,
  active_pages: 10,
  retained_file_bytes: 1024,
  retained_revisions: 3,
  retained_publications: 2,
  active_import_inspections: 0,
  open_review_requests: 1,
};

describe("Documentation operations service", () => {
  it("allows active members to read safe aggregate state", async () => {
    const repository = {
      read_limits_and_usage: vi.fn().mockResolvedValue({ limits, usage }),
      update_limits: vi.fn(),
      rebuild_projection: vi.fn(),
    };
    const service = build_documentation_operations_service(repository);

    const result = await service.get_summary({
      organization_id: "org",
      actor_org_user_id: "member",
      actor_role: "member",
    });

    expect(result.permissions.can_manage_limits).toBe(false);
    expect(result.states).toEqual([
      {
        dimension: "active_sites",
        usage: 2,
        limit: null,
        state: "within_limit",
      },
      {
        dimension: "active_pages",
        usage: 10,
        limit: 10,
        state: "at_limit",
      },
      {
        dimension: "retained_file_bytes",
        usage: 1024,
        limit: null,
        state: "within_limit",
      },
    ]);
  });

  it("reserves limit mutation and projection rebuild for owners", async () => {
    const repository = {
      read_limits_and_usage: vi.fn().mockResolvedValue({ limits, usage }),
      update_limits: vi.fn(),
      rebuild_projection: vi.fn(),
    };
    const service = build_documentation_operations_service(repository);
    const member = {
      organization_id: "org",
      actor_org_user_id: "member",
      actor_role: "member",
    };

    await expect(
      service.update_limits(member, {
        expected_version: 1,
        active_sites_limit: 2,
        active_pages_limit: 10,
      }),
    ).rejects.toBeInstanceOf(DocumentationOperationsPermissionError);
    await expect(
      service.rebuild_projection(member, {
        project_id: "project",
        project_version_slug: "v1",
        site_id: "site",
        request: { projection: "draft_search" },
      }),
    ).rejects.toBeInstanceOf(DocumentationOperationsPermissionError);
    expect(repository.update_limits).not.toHaveBeenCalled();
    expect(repository.rebuild_projection).not.toHaveBeenCalled();
  });
});
