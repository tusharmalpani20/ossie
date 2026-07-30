import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AUDIT_COVERAGE_REGISTRY } from "./audit-coverage-registry";

const source_root = new URL("../../", import.meta.url);
const excluded = new Set([
  "audit_schema.audit_change_item:INSERT",
  "audit_schema.audit_event:INSERT",
  "audit_schema.access_event:INSERT",
  "db_migration.schema_migrations:INSERT",
  "db_migration.schema_migrations:DELETE",
  // Documentation aggregate roots are DB-guarded and audited. These rows are
  // receipts, derived projections, or children that cannot be mutated by an
  // independent runtime command.
  "documentation_schema.documentation_command_receipt:INSERT",
  "documentation_schema.comment_mention:INSERT",
  "documentation_schema.documentation_draft_search_document:INSERT",
  "documentation_schema.documentation_draft_search_document:UPDATE",
  "documentation_schema.documentation_draft_search_document:DELETE",
  "documentation_schema.openapi_inspection:INSERT",
  "documentation_schema.openapi_inspection:UPDATE",
  "documentation_schema.openapi_operation:INSERT",
  "documentation_schema.openapi_operation:DELETE",
  "documentation_schema.site_revision_page:INSERT",
  "documentation_schema.site_revision_page_keyword:INSERT",
  "documentation_schema.site_revision_page_block:INSERT",
  "documentation_schema.site_revision_page_tab_item:INSERT",
  "documentation_schema.site_revision_page_table_row:INSERT",
  "documentation_schema.site_revision_page_table_cell:INSERT",
  "documentation_schema.site_revision_snippet:INSERT",
  "documentation_schema.site_revision_snippet_block:INSERT",
  "documentation_schema.site_revision_snippet_list_item:INSERT",
  "documentation_schema.site_revision_snippet_tab_item:INSERT",
  "documentation_schema.site_revision_snippet_table_row:INSERT",
  "documentation_schema.site_revision_snippet_table_cell:INSERT",
  "documentation_schema.site_revision_artifact_reference:INSERT",
  "documentation_schema.site_revision_list_item:INSERT",
  "documentation_schema.site_revision_navigation_node:INSERT",
  "documentation_schema.site_revision_page_alias:INSERT",
  "documentation_schema.site_revision_redirect_rule:INSERT",
  "documentation_schema.site_revision_openapi_operation:INSERT",
  "documentation_schema.site_revision_asset_reference:INSERT",
  "documentation_schema.page_slug_alias:INSERT",
  "documentation_schema.documentation_page_keyword:INSERT",
  "documentation_schema.documentation_page_keyword:DELETE",
  "documentation_schema.navigation_node:INSERT",
  "documentation_schema.navigation_node:UPDATE",
  "documentation_schema.navigation_node:DELETE",
  "documentation_schema.documentation_redirect_rule:INSERT",
  "documentation_schema.documentation_redirect_rule:UPDATE",
  "documentation_schema.documentation_redirect_rule:DELETE",
  "documentation_schema.documentation_page_block:INSERT",
  "documentation_schema.documentation_page_block:DELETE",
  "documentation_schema.documentation_list_item:INSERT",
  "documentation_schema.documentation_list_item:DELETE",
  "documentation_schema.documentation_tab_item:INSERT",
  "documentation_schema.documentation_tab_item:DELETE",
  "documentation_schema.documentation_table_row:INSERT",
  "documentation_schema.documentation_table_row:DELETE",
  "documentation_schema.documentation_table_cell:INSERT",
  "documentation_schema.documentation_table_cell:DELETE",
  "documentation_schema.documentation_snippet_block:INSERT",
  "documentation_schema.documentation_snippet_block:DELETE",
  "documentation_schema.documentation_snippet_list_item:INSERT",
  "documentation_schema.documentation_snippet_list_item:DELETE",
  "documentation_schema.documentation_snippet_tab_item:INSERT",
  "documentation_schema.documentation_snippet_tab_item:DELETE",
  "documentation_schema.documentation_snippet_table_row:INSERT",
  "documentation_schema.documentation_snippet_table_row:DELETE",
  "documentation_schema.documentation_snippet_table_cell:INSERT",
  "documentation_schema.documentation_snippet_table_cell:DELETE",
  "documentation_schema.site_edition:INSERT",
  "documentation_schema.site_edition:UPDATE",
  "documentation_schema.site_working_draft:INSERT",
  "documentation_schema.site_working_draft:UPDATE",
  "documentation_schema.navigation_tree:INSERT",
  "documentation_schema.routing_set:INSERT",
  "documentation_schema.site_revision_openapi_source:INSERT",
  "publish_schema.site_publication:INSERT",
  "publish_schema.site_publication_search_document:INSERT",
]);

describe("Audit production SQL source coverage", () => {
  it("maps every production product write to a registered table operation", () => {
    const registered = new Set(
      AUDIT_COVERAGE_REGISTRY.flatMap(({ writes }) =>
        writes.map(({ table, sql_operation }) => `${table}:${sql_operation}`),
      ),
    );
    const uncovered: string[] = [];
    const discovered = new Set<string>();
    const patterns = [
      {
        operation: "INSERT",
        expression: /\bINSERT\s+INTO\s+([a-z_]+\.[a-z_]+)/giu,
      },
      { operation: "UPDATE", expression: /\bUPDATE\s+([a-z_]+\.[a-z_]+)/giu },
      {
        operation: "DELETE",
        expression: /\bDELETE\s+FROM\s+([a-z_]+\.[a-z_]+)/giu,
      },
    ] as const;

    for (const file of globSync("**/*.ts", {
      cwd: source_root.pathname,
      exclude: ["**/*.test.ts", "**/test-support/**", "**/dist/**"],
    })) {
      const contents = readFileSync(new URL(file, source_root), "utf8");
      for (const { operation, expression } of patterns) {
        for (const match of contents.matchAll(expression)) {
          const key = `${match[1]}:${operation}`;
          discovered.add(key);
          if (!registered.has(key) && !excluded.has(key)) {
            const line = contents.slice(0, match.index).split("\n").length;
            uncovered.push(
              `${relative(source_root.pathname, new URL(file, source_root).pathname)}:${line} ${key}`,
            );
          }
        }
      }
    }

    expect(uncovered).toEqual([]);
    expect([...registered].filter((key) => !discovered.has(key))).toEqual([]);
    expect(
      [...excluded]
        .filter(
          (key) =>
            !key.startsWith("documentation_schema.") &&
            !key.startsWith("publish_schema.site_publication"),
        )
        .sort(),
    ).toEqual([
      "audit_schema.access_event:INSERT",
      "audit_schema.audit_change_item:INSERT",
      "audit_schema.audit_event:INSERT",
      "db_migration.schema_migrations:DELETE",
      "db_migration.schema_migrations:INSERT",
    ]);
  });
});
