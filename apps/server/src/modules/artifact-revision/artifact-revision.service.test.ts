import { describe, expect, it, vi } from "vitest";
import {
  ArtifactRevisionNotFoundError,
  build_artifact_revision_service,
} from "./artifact-revision.service";

const scope = {
  auth: { organization_id: "org_1", actor_org_user_id: "actor_1" },
  project_id: "project_1",
  project_version_id: "project_version_1",
  guide_id: "guide_1",
  revision_number: 1,
};

describe("Artifact Revision service", () => {
  it("returns an immutable Guide Revision detail from the repository", async () => {
    const detail = { revision: { revision_number: 1 }, guide_blocks: [] };
    const get_guide_revision = vi.fn().mockResolvedValue(detail);
    const service = build_artifact_revision_service({
      get_guide_revision,
    } as never);

    await expect(service.get_guide_revision(scope)).resolves.toBe(detail);
    expect(get_guide_revision).toHaveBeenCalledWith(scope);
  });

  it("maps a missing Revision detail or restore target to the domain error", async () => {
    const service = build_artifact_revision_service({
      get_guide_revision: vi.fn().mockResolvedValue(null),
      restore_guide_revision: vi.fn().mockResolvedValue(null),
    } as never);

    await expect(service.get_guide_revision(scope)).rejects.toBeInstanceOf(
      ArtifactRevisionNotFoundError,
    );
    await expect(
      service.restore_guide_revision({
        ...scope,
        expected_edition_version: 2,
        expected_working_draft_version: 3,
      }),
    ).rejects.toBeInstanceOf(ArtifactRevisionNotFoundError);
  });
});
