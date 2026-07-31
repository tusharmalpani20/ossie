import { describe, expect, it } from "vitest";
import { get_documentation_operations_config } from "./documentation-operations.config";

describe("Documentation operations configuration", () => {
  it("uses conservative bounded defaults", () => {
    expect(get_documentation_operations_config({})).toMatchObject({
      heavy_work_concurrency: 2,
      publication_concurrency: 2,
      rebuild_concurrency: 1,
      publication_timeout_ms: 300_000,
      rebuild_batch_size: 100,
      initial_html_max_bytes: 16 * 1024 * 1024,
      try_it_dns_timeout_ms: 2_000,
    });
  });

  it("rejects invalid, out-of-range, and inconsistent values", () => {
    expect(() =>
      get_documentation_operations_config({
        OSSIE_DOCUMENTATION_HEAVY_WORK_CONCURRENCY: "0",
      }),
    ).toThrow();
    expect(() =>
      get_documentation_operations_config({
        OSSIE_DOCUMENTATION_HEAVY_WORK_CONCURRENCY: "2",
        OSSIE_DOCUMENTATION_PUBLICATION_CONCURRENCY: "3",
      }),
    ).toThrow(/cannot exceed total/u);
    expect(() =>
      get_documentation_operations_config({
        OSSIE_DOCUMENTATION_REBUILD_BATCH_SIZE: "1.5",
      }),
    ).toThrow();
  });
});
