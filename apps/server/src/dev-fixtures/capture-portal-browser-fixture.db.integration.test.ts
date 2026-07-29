/**
 * @fileoverview PostgreSQL integration coverage for the Capture portal browser fixture.
 */

import { describe, expect, it } from "vitest";
import { with_maintenance_client } from "../test-support/database";
import { seed_capture_portal_browser_fixture } from "./capture-portal-browser-fixture";

describe("capture portal browser fixture database seed", () => {
  it("persists every required Capture Session state in the disposable test database", async () => {
    const { fixture } = await seed_capture_portal_browser_fixture();

    const result = await with_maintenance_client((client) =>
      client.query<{ status: string }>(
        `
        SELECT status
        FROM capture_schema.capture_session
        WHERE organization_id = $1 AND project_id = $2
        ORDER BY status
      `,
        [fixture.organization_id, fixture.project_id],
      ),
    );

    expect(result.rows.map(({ status }) => status)).toEqual([
      "archived",
      "canceled",
      "capturing",
      "completed",
      "draft",
    ]);

    const owners = await with_maintenance_client((client) =>
      client.query<{ owner_count: number }>(
        `
        SELECT COUNT(*)::integer AS owner_count
        FROM organization_schema.org_user
        WHERE organization_id = $1 AND role = 'owner'
      `,
        [fixture.organization_id],
      ),
    );

    expect(owners.rows[0]?.owner_count).toBe(1);
  });
});
