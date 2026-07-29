import { describe, expect, it } from "vitest";
import { with_maintenance_client } from "../test-support/database";
import { seed_interactive_demo_browser_fixture } from "./interactive-demo-browser-fixture";

describe("Interactive Demo browser fixture database seed", () => {
  it("creates relational authoring, Revision, Publication, role, and Link state", async () => {
    const fixture = await seed_interactive_demo_browser_fixture();
    const result = await with_maintenance_client(async (client) => {
      const count = async (table: string, extra = "") => {
        const value = await client.query<{ count: number }>(
          `SELECT COUNT(*)::integer AS count FROM ${table}
           WHERE organization_id=$1 AND project_id=$2 ${extra}`,
          [fixture.organization_id, fixture.project_id],
        );
        return value.rows[0]?.count ?? 0;
      };
      return {
        demos: await count("interactive_demo_schema.interactive_demo"),
        scenes: await count(
          "interactive_demo_schema.demo_scene",
          "AND is_deleted=FALSE",
        ),
        hotspots: await count(
          "interactive_demo_schema.demo_hotspot",
          "AND is_deleted=FALSE",
        ),
        transitions: await count(
          "interactive_demo_schema.demo_transition",
          "AND is_deleted=FALSE",
        ),
        revisions: await count(
          "interactive_demo_schema.interactive_demo_revision",
        ),
        publications: await count(
          "publish_schema.published_artifact",
          "AND artifact_type='interactive_demo'",
        ),
        links: await count(
          "publish_schema.publish_link",
          "AND artifact_type='interactive_demo'",
        ),
      };
    });

    expect(result).toEqual({
      demos: 3,
      scenes: 12,
      hotspots: 12,
      transitions: 11,
      revisions: 2,
      publications: 2,
      links: 5,
    });
  });
});
