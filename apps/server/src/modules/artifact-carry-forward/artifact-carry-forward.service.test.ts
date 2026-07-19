import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { build_artifact_carry_forward_service } from "./artifact-carry-forward.service";

describe("Artifact Carry-Forward service", () => {
  it("passes only digests and a normalized ordered fingerprint to persistence", async () => {
    const carry_forward = vi.fn(async (_input: Record<string, unknown>) => ({
      replayed: false,
    }));
    const service = build_artifact_carry_forward_service({
      carry_forward,
    } as never);
    await service.carry_forward({
      auth: { organization_id: "org_1", actor_org_user_id: "actor_1" },
      project_id: "project_1",
      idempotency_key: "opaque-request-key-0001",
      source_project_version_id: "version_1",
      target_project_version_id: "version_2",
      artifacts: [{ artifact_type: "guide", artifact_id: "guide_1" }],
    });
    expect(carry_forward).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotency_key_hash: createHash("sha256")
          .update("opaque-request-key-0001")
          .digest("hex"),
        request_fingerprint_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    );
    expect(carry_forward.mock.calls[0]![0]).not.toHaveProperty(
      "idempotency_key",
    );
  });
});
