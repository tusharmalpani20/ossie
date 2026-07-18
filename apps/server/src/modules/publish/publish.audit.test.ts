import { describe, expect, it } from "vitest";
import { build_publish_changes } from "./publish.audit";

describe("Publish Audit adapter", () => {
  it("retains publication relationships and redacts the immutable snapshot", () => {
    const changes = build_publish_changes({
      artifact_type: "guide",
      artifact_id: "guide_1",
      before_link: null,
      after_link: { id: "link_1", artifact_type: "guide", artifact_id: "guide_1", published_artifact_id: "publication_1", slug: "safe-slug", visibility: "public", status: "active", published_at: "2026-07-19T00:00:00.000Z", revoked_at: null, expires_at: null, password_protected: false, public_url: "https://private.example/p/safe-slug" },
      published_artifact: { id: "publication_1", artifact_type: "guide", artifact_id: "guide_1", version_number: 1, title: "Guide", published_at: "2026-07-19T00:00:00.000Z" },
    });
    const artifact = changes.find((change) => change.entity_type === "published_artifact")!;
    expect(artifact.redacted_fields).toContain("snapshot_json");
    expect(artifact.safe_fields).toHaveProperty("version_number", "integer");
    expect(JSON.stringify(changes)).not.toContain("private.example");
  });
});
