import { describe, expect, it } from "vitest";
import {
  audit_request_context,
  current_audit_request_context,
  run_with_audit_request_context,
  safe_audit_actor_label,
} from "./audit-request-context";

describe("Audit request context", () => {
  it("derives only the supported source from server-owned request data", () => {
    expect(audit_request_context({ id: "request-1", headers: {} })).toEqual({
      request_id: "request-1",
      source_type: "web",
    });
    expect(
      audit_request_context({
        id: "request-2",
        headers: { "x-ossie-client": "extension" },
      }),
    ).toEqual({ request_id: "request-2", source_type: "extension" });
    expect(
      audit_request_context({
        id: "request-3",
        headers: { "x-ossie-client": "migration" },
      }),
    ).toEqual({ request_id: "request-3", source_type: "web" });
  });

  it("uses a stable non-sensitive actor-label fallback", () => {
    expect(safe_audit_actor_label(" Owner User ")).toBe("Owner User");
    expect(safe_audit_actor_label("x".repeat(201))).toBe("organization-member");
    expect(safe_audit_actor_label("unsafe\nname")).toBe("organization-member");
  });

  it("keeps provenance available throughout an asynchronous command", async () => {
    await run_with_audit_request_context(
      { request_id: "request-4", source_type: "extension" },
      async () => {
        await Promise.resolve();
        expect(current_audit_request_context()).toEqual({
          request_id: "request-4",
          source_type: "extension",
        });
      },
    );
    expect(current_audit_request_context()).toBeNull();
  });
});
