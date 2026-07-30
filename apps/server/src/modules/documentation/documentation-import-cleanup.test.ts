import { describe, expect, it, vi } from "vitest";
import { build_documentation_import_cleanup } from "./documentation-import-cleanup";

describe("Documentation import cleanup", () => {
  it("expires database state before purging bounded transient bytes", async () => {
    const order: string[] = [];
    const cleanup = build_documentation_import_cleanup({
      repository: {
        expire_import_inspections: vi.fn(async () => {
          order.push("expire");
          return [{ storage_key: "terminal/source.md" }];
        }),
      },
      storage: {
        list_documentation_transients: vi.fn(async () => [
          { storage_key: "orphan/source.zip", modified_at: new Date(0) },
        ]),
        purge_exact: vi.fn(async ({ storage_key }) => {
          order.push(`purge:${storage_key}`);
        }),
      },
    });

    await cleanup.run_once(new Date("2026-07-30T00:00:00.000Z"), 20);
    expect(order).toEqual([
      "expire",
      "purge:terminal/source.md",
      "purge:orphan/source.zip",
    ]);
  });
});
