import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AUDIT_COVERAGE_REGISTRY } from "./audit-coverage-registry";

const source_root = new URL("../../", import.meta.url);
const excluded = new Set([
  "audit_schema.audit_change_item:INSERT",
  "audit_schema.audit_event:INSERT",
  "db_migration.schema_migrations:INSERT",
  "db_migration.schema_migrations:DELETE",
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
    expect([...excluded].sort()).toEqual([
      "audit_schema.audit_change_item:INSERT",
      "audit_schema.audit_event:INSERT",
      "db_migration.schema_migrations:DELETE",
      "db_migration.schema_migrations:INSERT",
    ]);
  });
});
