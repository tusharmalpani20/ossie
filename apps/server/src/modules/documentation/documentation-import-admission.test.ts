import { describe, expect, it } from "vitest";

import { build_documentation_import_admission } from "./documentation-import-admission.js";

describe("Documentation import admission", () => {
  it("bounds process and actor concurrency and releases leases", () => {
    const admission = build_documentation_import_admission({
      parsers_per_process_max: 2,
      parsers_per_actor_max: 1,
      attempts_per_window_max: 20,
      attempt_window_ms: 600_000,
    });
    const first = admission.acquire({
      actor_key: "org:actor-a:version",
      now_ms: 1_000,
    });
    expect(() =>
      admission.acquire({
        actor_key: "org:actor-a:version",
        now_ms: 1_001,
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "documentation_import_busy",
        retry_after_seconds: 1,
      }),
    );
    const second = admission.acquire({
      actor_key: "org:actor-b:version",
      now_ms: 1_002,
    });
    expect(() =>
      admission.acquire({
        actor_key: "org:actor-c:version",
        now_ms: 1_003,
      }),
    ).toThrowError(
      expect.objectContaining({ code: "documentation_import_busy" }),
    );
    first.release();
    first.release();
    second.release();
    expect(
      admission.acquire({
        actor_key: "org:actor-c:version",
        now_ms: 1_004,
      }),
    ).toBeDefined();
  });

  it("rate limits attempts and prunes a completed window", () => {
    const admission = build_documentation_import_admission({
      parsers_per_process_max: 2,
      parsers_per_actor_max: 1,
      attempts_per_window_max: 2,
      attempt_window_ms: 1_000,
    });
    admission.acquire({ actor_key: "actor", now_ms: 1_000 }).release();
    admission.acquire({ actor_key: "actor", now_ms: 1_100 }).release();
    expect(() =>
      admission.acquire({ actor_key: "actor", now_ms: 1_200 }),
    ).toThrowError(
      expect.objectContaining({
        code: "documentation_import_busy",
        retry_after_seconds: 1,
      }),
    );
    expect(
      admission.acquire({ actor_key: "actor", now_ms: 2_001 }),
    ).toBeDefined();
  });
});
