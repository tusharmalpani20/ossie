import {
  GuideEditionConflictError,
  GuideNotEditableError,
  GuideWorkingDraftConflictError,
} from "../errors/guide-domain-error";
export const assert_guide_revision_writable = (input: {
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
    throw new GuideNotEditableError();
  if (input.edition_version !== input.expected_edition_version)
    throw new GuideEditionConflictError();
  if (input.working_draft_version !== input.expected_working_draft_version)
    throw new GuideWorkingDraftConflictError();
};
