import {
  InteractiveDemoEditionConflictError,
  InteractiveDemoNotEditableError,
  InteractiveDemoWorkingDraftConflictError,
} from "../errors/demo-domain-error";
export const assert_interactive_demo_revision_writable = (input: {
  project_status: string;
  project_version_status: string;
  edition_status: string;
  edition_version: number;
  working_draft_version: number;
  expected_edition_version: number;
  expected_working_draft_version: number;
}) => {
  if (
    input.project_status !== "active" ||
    input.project_version_status !== "active" ||
    input.edition_status !== "draft"
  )
    throw new InteractiveDemoNotEditableError();
  if (input.edition_version !== input.expected_edition_version)
    throw new InteractiveDemoEditionConflictError();
  if (input.working_draft_version !== input.expected_working_draft_version)
    throw new InteractiveDemoWorkingDraftConflictError();
};
