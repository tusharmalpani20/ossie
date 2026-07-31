import { describe, expect, it, vi } from "vitest";
import {
  parse_projection_maintenance_args,
  run_documentation_projection_maintenance,
} from "./documentation-projection-rebuild.cli";

describe("Documentation projection maintenance command", () => {
  it("defaults to non-mutating dry-run and requires one explicit mutation mode", () => {
    expect(parse_projection_maintenance_args([])).toEqual({
      mode: "dry_run",
      publication_id: null,
    });
    expect(parse_projection_maintenance_args(["--all-legacy"])).toEqual({
      mode: "all_legacy",
      publication_id: null,
    });
    expect(
      parse_projection_maintenance_args([
        "--publication-id",
        "01J00000000000000000000001",
      ]),
    ).toEqual({
      mode: "publication",
      publication_id: "01J00000000000000000000001",
    });
    expect(() =>
      parse_projection_maintenance_args(["--dry-run", "--all-legacy"]),
    ).toThrow("Usage:");
    expect(() =>
      parse_projection_maintenance_args(["--publication-id"]),
    ).toThrow("Usage:");
  });

  it("reports only bounded aggregate candidate counts during dry-run", async () => {
    const output = vi.fn();
    const database = {
      connect: vi.fn(),
      query: vi.fn(async () => ({
        rows: [
          {
            organization_id: "01J00000000000000000000001",
            project_id: "01J00000000000000000000002",
            project_version_slug: "secret-version",
            site_id: "01J00000000000000000000003",
            publication_id: null,
            output_digest: null,
            projection: "draft_search" as const,
          },
        ],
      })),
    };

    await run_documentation_projection_maintenance({
      argv: [],
      database: database as never,
      output,
      batch_size: 25,
    });

    expect(database.connect).not.toHaveBeenCalled();
    expect(output).toHaveBeenCalledOnce();
    expect(output.mock.calls[0]?.[0]).toContain('"draft_search":1');
    expect(output.mock.calls[0]?.[0]).not.toContain("secret-version");
    expect(output.mock.calls[0]?.[0]).not.toContain(
      "01J00000000000000000000001",
    );
  });
});
