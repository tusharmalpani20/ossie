import { describe, expect, it } from "vitest";
import { with_maintenance_client } from "../test-support/database";
import { seed_guide_browser_fixture } from "./guide-browser-fixture";

describe("Guide browser fixture database seed", () => {
  it("creates valid Guide, Revision, Publication, role, and public-link state", async () => {
    const fixture = await seed_guide_browser_fixture();
    const result = await with_maintenance_client(async (client) => {
      const guides = await client.query<{ count: number }>(
            `SELECT COUNT(*)::integer AS count FROM guide_schema.guide
             WHERE organization_id=$1 AND project_id=$2`,
            [fixture.organization_id, fixture.project_id],
          );
      const revisions = await client.query<{ count: number }>(
            `SELECT COUNT(*)::integer AS count FROM guide_schema.guide_revision
             WHERE organization_id=$1 AND project_id=$2`,
            [fixture.organization_id, fixture.project_id],
          );
      const publications = await client.query<{ count: number }>(
            `SELECT COUNT(*)::integer AS count FROM publish_schema.published_artifact
             WHERE organization_id=$1 AND project_id=$2 AND artifact_type='guide'`,
            [fixture.organization_id, fixture.project_id],
          );
      const links = await client.query<{ count: number }>(
            `SELECT COUNT(*)::integer AS count FROM publish_schema.publish_link
             WHERE organization_id=$1 AND project_id=$2 AND artifact_type='guide'`,
            [fixture.organization_id, fixture.project_id],
          );
      const roles = await client.query<{ role: string }>(
            `SELECT role FROM project_schema.project_membership
             WHERE organization_id=$1 AND project_id=$2 ORDER BY role`,
            [fixture.organization_id, fixture.project_id],
          );
      const blocks = await client.query<{ count: number }>(
            `SELECT COUNT(*)::integer AS count FROM guide_schema.guide_block
             WHERE organization_id=$1 AND project_id=$2 AND is_deleted=FALSE`,
            [fixture.organization_id, fixture.project_id],
          );
      return { guides, revisions, publications, links, roles, blocks };
    });

    expect(result.guides.rows[0]?.count).toBe(3);
    expect(result.revisions.rows[0]?.count).toBe(2);
    expect(result.publications.rows[0]?.count).toBe(2);
    expect(result.links.rows[0]?.count).toBe(5);
    expect(result.roles.rows.map(({ role }) => role)).toEqual([
      "editor",
      "viewer",
    ]);
    expect(result.blocks.rows[0]?.count).toBe(20);
  });
});
