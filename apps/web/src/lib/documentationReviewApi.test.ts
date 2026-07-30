import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDocumentationReviewPolicy,
  createDocumentationReviewRequest,
} from "./documentationReviewApi";

describe("Documentation review API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the scoped Site policy endpoint", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "policy", mode: "optional" }),
    });
    vi.stubGlobal("fetch", fetch);
    await getDocumentationReviewPolicy("project", "v1", "site");
    expect(fetch.mock.calls[0]?.[0]).toContain(
      "/projects/project/versions/v1/documentation-sites/site/review-policy",
    );
  });

  it("uses an idempotency key for Review Request creation", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "request" }),
    });
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("crypto", { randomUUID: () => "key" });
    await createDocumentationReviewRequest("project", "v1", "site", {
      site_revision_id: "revision",
      expected_policy_version: 1,
      reviewer_org_user_ids: ["reviewer"],
    });
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ "idempotency-key": "key" }),
    });
  });
});
