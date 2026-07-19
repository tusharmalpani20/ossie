import { describe, expect, it } from "vitest";
import {
  ArtifactCarryForwardRequestSchema,
  ArtifactCarryForwardResponseSchema,
  IdempotencyKeySchema,
} from "./artifact-carry-forward";

const request = {
  source_project_version_id: "version_source",
  target_project_version_id: "version_target",
  artifacts: [
    { artifact_type: "guide", artifact_id: "guide_1" },
    { artifact_type: "interactive_demo", artifact_id: "demo_1" },
  ],
};

describe("Artifact Carry-Forward contracts", () => {
  it("accepts one ordered mixed-type batch and rejects duplicate typed artifacts", () => {
    expect(ArtifactCarryForwardRequestSchema.parse(request)).toEqual(request);
    expect(
      ArtifactCarryForwardRequestSchema.safeParse({
        ...request,
        artifacts: [request.artifacts[0], request.artifacts[0]],
      }).success,
    ).toBe(false);
  });

  it("requires distinct source and target Project Versions and a bounded batch", () => {
    expect(
      ArtifactCarryForwardRequestSchema.safeParse({
        ...request,
        target_project_version_id: request.source_project_version_id,
      }).success,
    ).toBe(false);
    expect(
      ArtifactCarryForwardRequestSchema.safeParse({
        ...request,
        artifacts: Array.from({ length: 51 }, (_, index) => ({
          artifact_type: "guide",
          artifact_id: `guide_${index}`,
        })),
      }).success,
    ).toBe(false);
  });

  it("validates opaque visible ASCII idempotency keys without normalizing them", () => {
    const key = "carry-forward-key-001";
    expect(IdempotencyKeySchema.parse(key)).toBe(key);
    expect(IdempotencyKeySchema.safeParse("short").success).toBe(false);
    expect(IdempotencyKeySchema.safeParse(`${key}\nsecret`).success).toBe(
      false,
    );
  });

  it("parses an ordered committed result without exposing key material", () => {
    const result = ArtifactCarryForwardResponseSchema.parse({
      carry_forward: {
        id: "operation_1",
        source_project_version_id: "version_source",
        target_project_version_id: "version_target",
        created_by_id: "org_user_1",
        created_at: "2026-07-19T00:00:00.000Z",
      },
      items: [
        {
          artifact_type: "guide",
          artifact_id: "guide_1",
          source_edition_id: "edition_1",
          source_revision_id: "revision_1",
          source_revision_number: 1,
          target_edition_id: "edition_2",
          target_working_draft_id: "draft_2",
        },
      ],
      replayed: false,
    });
    expect(result.items[0]?.artifact_type).toBe("guide");
    expect(result).not.toHaveProperty("idempotency_key");
  });
});
