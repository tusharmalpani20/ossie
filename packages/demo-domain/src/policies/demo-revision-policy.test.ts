import { describe, expect, it } from "vitest";
import {
  InteractiveDemoEditionConflictError,
  InteractiveDemoNotEditableError,
  InteractiveDemoWorkingDraftConflictError,
} from "../errors/demo-domain-error";
import { assert_interactive_demo_revision_writable } from "./demo-revision-policy";
describe("Demo Revision policy", () => {
  it("requires active writable matching aggregate versions", () => {
    expect(() =>
      assert_interactive_demo_revision_writable({
        project_status: "active",
        project_version_status: "archived",
        edition_status: "draft",
        edition_version: 1,
        working_draft_version: 1,
        expected_edition_version: 1,
        expected_working_draft_version: 1,
      }),
    ).toThrow(InteractiveDemoNotEditableError);
    expect(() =>
      assert_interactive_demo_revision_writable({
        project_status: "active",
        project_version_status: "active",
        edition_status: "draft",
        edition_version: 2,
        working_draft_version: 1,
        expected_edition_version: 1,
        expected_working_draft_version: 1,
      }),
    ).toThrow(InteractiveDemoEditionConflictError);
    expect(() =>
      assert_interactive_demo_revision_writable({
        project_status: "active",
        project_version_status: "active",
        edition_status: "draft",
        edition_version: 1,
        working_draft_version: 2,
        expected_edition_version: 1,
        expected_working_draft_version: 1,
      }),
    ).toThrow(InteractiveDemoWorkingDraftConflictError);
  });
});
