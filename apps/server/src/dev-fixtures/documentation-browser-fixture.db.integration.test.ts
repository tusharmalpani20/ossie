import { describe, expect, it } from "vitest";
import { with_maintenance_client } from "../test-support/database";
import { seed_documentation_browser_fixture } from "./documentation-browser-fixture";

describe("Documentation browser fixture database seed", () => {
  it("creates mutable, private, immutable, and exact-publication state", async () => {
    const fixture = await seed_documentation_browser_fixture();
    const result = await with_maintenance_client(async (client) => {
      const count = async (table: string) => {
        const value = await client.query<{ count: number }>(
          `SELECT COUNT(*)::integer count FROM ${table}
            WHERE organization_id=$1 AND project_id=$2`,
          [fixture.organization_id, fixture.project_id],
        );
        return value.rows[0]?.count ?? 0;
      };
      const link = await client.query<{
        slug: string;
        selected_publication_id: string;
      }>(
        `SELECT link.slug,entry.site_publication_id selected_publication_id
           FROM publish_schema.publish_link link
           JOIN publish_schema.publish_link_entry entry
             ON entry.publish_link_id=link.id
          WHERE link.id=$1`,
        [fixture.link_id],
      );
      return {
        sites: await count("documentation_schema.documentation_site"),
        pages: await count("documentation_schema.documentation_page"),
        comments: await count("documentation_schema.comment_thread"),
        operations: await count("documentation_schema.openapi_operation"),
        snippets: await count("documentation_schema.documentation_snippet"),
        revision_snippets: await count(
          "documentation_schema.site_revision_snippet",
        ),
        revision_assets: await count(
          "documentation_schema.site_revision_asset_reference",
        ),
        revisions: await count("documentation_schema.site_revision"),
        publications: await count("publish_schema.site_publication"),
        link: link.rows[0],
      };
    });

    expect(result).toEqual({
      sites: 1,
      pages: 2,
      comments: 1,
      operations: 1,
      snippets: 1,
      revision_snippets: 2,
      revision_assets: 2,
      revisions: 2,
      publications: 2,
      link: {
        slug: "plan132-public",
        selected_publication_id: fixture.publication_id,
      },
    });
  });
});
