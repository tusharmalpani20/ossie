import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";

describe("DB-backed Documentation review workflow", () => {
  beforeEach(reset_test_database);
  afterAll(() => pool.end());

  it("creates an optional policy with a new Edition and updates it optimistically", async () => {
    const app = build({ logger: false });
    const setup = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "review-owner@example.test",
          password: "safe local password",
          first_name: "Review",
          last_name: "Owner",
        },
        organization: { name: "Review Test" },
      },
    });
    const session = setup.cookies.find(
      (cookie) => cookie.name === "ossie_session",
    )?.value;
    const project = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: { ossie_session: session ?? "" },
      payload: { name: "Product" },
    });
    const projectId = project.json().project.id as string;
    const site = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/versions/main/documentation-sites`,
      cookies: { ossie_session: session ?? "" },
      headers: { "idempotency-key": "review-site" },
      payload: {
        name: "Product docs",
        description: null,
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      },
    });
    expect(site.statusCode).toBe(201);
    const siteId = site.json().site.id as string;
    const policy = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/versions/main/documentation-sites/${siteId}/review-policy`,
      cookies: { ossie_session: session ?? "" },
    });
    expect(policy.statusCode).toBe(200);
    expect(policy.json()).toMatchObject({ mode: "optional", version: 1 });

    const update = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${projectId}/versions/main/documentation-sites/${siteId}/review-policy`,
      cookies: { ossie_session: session ?? "" },
      headers: { "idempotency-key": "review-policy-1" },
      payload: {
        expected_policy_version: 1,
        mode: "approval_required",
        required_approvals: 1,
        require_maintainer_approval: false,
        maintainer_org_user_ids: [],
      },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json()).toMatchObject({
      mode: "approval_required",
      version: 2,
    });
    await app.close();
  });
});
