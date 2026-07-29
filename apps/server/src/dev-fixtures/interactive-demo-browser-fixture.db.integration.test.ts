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
        public_link_entries: await client.query<{
          entry_count: number;
          version_count: number;
        }>(
          `SELECT COUNT(*)::integer AS entry_count,
                  COUNT(DISTINCT entry.project_version_id)::integer AS version_count
           FROM publish_schema.publish_link_entry entry
           INNER JOIN publish_schema.publish_link link
             ON link.id=entry.publish_link_id
           WHERE link.organization_id=$1
             AND link.project_id=$2
             AND link.slug='plan128-public'`,
          [fixture.organization_id, fixture.project_id],
        ),
      };
    });

    expect({
      ...result,
      public_link_entries: result.public_link_entries.rows[0],
    }).toEqual({
      demos: 3,
      scenes: 12,
      hotspots: 12,
      transitions: 11,
      revisions: 3,
      publications: 3,
      links: 5,
      public_link_entries: {
        entry_count: 2,
        version_count: 2,
      },
    });
  });
});
