import { describe, expect, it } from "vitest";
import {
  ArtifactRevisionListQuerySchema,
  ArtifactRevisionSummarySchema,
  CheckpointArtifactRevisionRequestSchema,
  GuideRevisionDetailSchema,
  InteractiveDemoRevisionDetailSchema,
  RestoreArtifactRevisionRequestSchema,
} from "./artifact-revision";

describe("Artifact Revision contracts", () => {
  it("requires both Edition and Working Draft Row Versions for writes", () => {
    const expected = {
      expected_edition_version: 2,
      expected_working_draft_version: 7,
    };
    expect(CheckpointArtifactRevisionRequestSchema.parse(expected)).toEqual(
      expected,
    );
    expect(RestoreArtifactRevisionRequestSchema.parse(expected)).toEqual(
      expected,
    );
    expect(
      CheckpointArtifactRevisionRequestSchema.safeParse({
        expected_edition_version: 2,
      }).success,
    ).toBe(false);
  });

  it("validates exclusive Revision pagination", () => {
    expect(ArtifactRevisionListQuerySchema.parse({})).toEqual({ limit: 50 });
    expect(
      ArtifactRevisionListQuerySchema.parse({
        limit: "100",
        before_revision_number: "3",
      }),
    ).toEqual({ limit: 100, before_revision_number: 3 });
    expect(
      ArtifactRevisionListQuerySchema.safeParse({ limit: "101" }).success,
    ).toBe(false);
  });

  it("keeps Revision identity distinct from Row Version and Publication Sequence", () => {
    const summary = ArtifactRevisionSummarySchema.parse({
      id: "revision_1",
      edition_id: "edition_1",
      revision_number: 3,
      trigger: "manual_checkpoint",
      title: "Configure SSO",
      description: null,
      source_working_draft_version: 12,
      created_by_id: "org_user_1",
      created_at: "2026-07-19T00:00:00.000Z",
    });
    expect(summary.revision_number).toBe(3);
    expect(summary).not.toHaveProperty("version");
    expect(summary).not.toHaveProperty("publication_sequence");
  });

  it("keeps Guide and Demo immutable content graphs type-specific", () => {
    const common = {
      id: "revision_1",
      edition_id: "edition_1",
      revision_number: 1,
      trigger: "manual_checkpoint",
      title: "Artifact",
      description: null,
      source_working_draft_version: 2,
      created_by_id: "org_user_1",
      created_at: "2026-07-19T00:00:00.000Z",
    };
    expect(
      GuideRevisionDetailSchema.parse({ revision: common, guide_blocks: [] }),
    ).toEqual({ revision: common, guide_blocks: [], capture_assets: [] });
    expect(
      InteractiveDemoRevisionDetailSchema.parse({
        revision: common,
        demo_scenes: [],
      }),
    ).toEqual({ revision: common, demo_scenes: [], capture_assets: [] });
    expect(
      GuideRevisionDetailSchema.safeParse({
        revision: common,
        guide_blocks: [],
        demo_scenes: [],
      }).success,
    ).toBe(false);
  });
});
