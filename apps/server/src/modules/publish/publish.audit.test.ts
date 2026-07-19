import { describe, expect, it } from "vitest";
import { build_publish_changes } from "./publish.audit";

describe("publication Audit Evidence", () => {
  it("records relational publication identifiers without snapshot payloads", () => {
    const changes = build_publish_changes({
      published_artifact: {
        id: "pa_1",
        artifact_type: "guide",
        artifact_id: "guide_1",
        edition_id: "edition_1",
        project_version_id: "pv_1",
        revision_id: "revision_1",
        revision_number: 2,
        publication_sequence: 3,
        publisher: { id: "member_1", display_name: "Editor" },
        published_at: "2026-07-20T00:00:00.000Z",
        created_at: "2026-07-20T00:00:00.000Z",
      },
    });
    expect(changes[0]?.after).toMatchObject({
      revision_id: "revision_1",
      publication_sequence: 3,
    });
    expect(JSON.stringify(changes)).not.toContain("snapshot_json");
  });
});
