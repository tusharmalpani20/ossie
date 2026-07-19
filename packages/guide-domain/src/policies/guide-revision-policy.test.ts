import { describe, expect, it } from "vitest";
import {
  GuideEditionConflictError,
  GuideNotEditableError,
  GuideWorkingDraftConflictError,
} from "../errors/guide-domain-error";
import { assert_guide_revision_writable } from "./guide-revision-policy";
describe("Guide Revision policy", () => {
  it("requires active writable matching aggregate versions", () => {
    expect(() =>
      assert_guide_revision_writable({
        project_status: "archived",
        project_version_status: "active",
        edition_status: "draft",
        edition_version: 1,
        working_draft_version: 1,
        expected_edition_version: 1,
        expected_working_draft_version: 1,
      }),
    ).toThrow(GuideNotEditableError);
    expect(() =>
      assert_guide_revision_writable({
        project_status: "active",
        project_version_status: "active",
        edition_status: "draft",
        edition_version: 2,
        working_draft_version: 1,
        expected_edition_version: 1,
        expected_working_draft_version: 1,
      }),
    ).toThrow(GuideEditionConflictError);
    expect(() =>
      assert_guide_revision_writable({
        project_status: "active",
        project_version_status: "active",
        edition_status: "draft",
        edition_version: 1,
        working_draft_version: 2,
        expected_edition_version: 1,
        expected_working_draft_version: 1,
      }),
    ).toThrow(GuideWorkingDraftConflictError);
  });
});
