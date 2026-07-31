import { describe, expect, it, vi } from "vitest";
import { build_documentation_review_service } from "./documentation-review.service";

const scope = {
  organization_id: "org",
  project_id: "project",
  project_version_id: "version",
  actor_org_user_id: "actor",
  site_id: "site",
};

describe("documentation review service", () => {
  it("authorizes policy management before updating policy", async () => {
    const authorize = vi.fn().mockResolvedValue({ role: "project_admin" });
    const update_policy = vi.fn().mockResolvedValue({ id: "policy" });
    const service = build_documentation_review_service(
      { update_policy } as never,
      { authorize },
    );
    await service.update_policy({
      ...scope,
      idempotency_key: "key",
      data: {
        expected_policy_version: 1,
        mode: "optional",
        required_approvals: 1,
        require_maintainer_approval: false,
        maintainer_org_user_ids: [],
      },
    });
    expect(authorize).toHaveBeenCalledWith({
      auth: {
        organization_id: "org",
        actor_org_user_id: "actor",
      },
      project_id: "project",
      capability: "documentation.review.manage",
    });
    expect(update_policy).toHaveBeenCalledAfter(authorize);
  });

  it("uses the narrow decision capability for assigned viewers", async () => {
    const authorize = vi.fn().mockResolvedValue({ role: "viewer" });
    const decide = vi.fn().mockResolvedValue({ status: "approved" });
    const service = build_documentation_review_service({ decide } as never, {
      authorize,
    });
    await service.decide({
      ...scope,
      review_request_id: "request",
      idempotency_key: "key",
      data: {
        expected_review_request_version: 1,
        decision: "approve",
        reason: null,
      },
    });
    expect(authorize.mock.calls[0]?.[0].capability).toBe(
      "documentation.review.decide",
    );
  });

  it("requires both publication and override authority for override", async () => {
    const authorize = vi.fn().mockResolvedValue({ role: "project_admin" });
    const service = build_documentation_review_service({} as never, {
      authorize,
    });
    await service.authorize_publication(scope, true);
    expect(authorize).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ capability: "publication.create" }),
    );
    expect(authorize).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ capability: "documentation.review.override" }),
    );
  });

  it("projects Admin cancellation and override availability into authorized reads", async () => {
    const authorize = vi
      .fn()
      .mockResolvedValue({
        role: "project_admin",
        source: "project_membership",
      });
    const get_request = vi.fn().mockResolvedValue({ id: "request" });
    const preview_gate = vi
      .fn()
      .mockResolvedValue({ outcome: "approval_pending" });
    const service = build_documentation_review_service(
      { get_request, preview_gate } as never,
      { authorize },
    );

    await service.get_request({ ...scope, review_request_id: "request" });
    await service.preview_gate({ ...scope, revision_id: "revision" });

    expect(get_request).toHaveBeenCalledWith(
      expect.objectContaining({ actor_is_admin: true }),
    );
    expect(preview_gate).toHaveBeenCalledWith(
      expect.objectContaining({ actor_can_override: true }),
    );
  });
});
