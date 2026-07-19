import type {
  ArtifactRevisionListQuery,
  ArtifactRevisionWriteRequest,
  GuideRevisionDetail,
  InteractiveDemoRevisionDetail,
} from "@repo/types";

export class ArtifactEditionNotFoundError extends Error {
  constructor() {
    super("Artifact Edition was not found");
  }
}
export class ArtifactRevisionNotFoundError extends Error {
  constructor() {
    super("Artifact Revision was not found");
  }
}
export class ArtifactEditionNotEditableError extends Error {
  constructor() {
    super("Artifact Edition is read-only");
  }
}
export class ArtifactRevisionEditionConflictError extends Error {
  constructor() {
    super("Artifact Edition changed; reload and retry");
  }
}
export class ArtifactRevisionWorkingDraftConflictError extends Error {
  constructor() {
    super("Artifact Working Draft changed; reload and retry");
  }
}

type Auth = { organization_id: string; actor_org_user_id: string };
type Scope = {
  auth: Auth;
  project_id: string;
  project_version_id: string;
};
type GuideScope = Scope & { guide_id: string };
type DemoScope = Scope & { interactive_demo_id: string };
type RevisionNumber = { revision_number: number };

export type ArtifactRevisionRepository = {
  checkpoint_guide(
    input: GuideScope & ArtifactRevisionWriteRequest,
  ): Promise<{ revision: GuideRevisionDetail["revision"]; reused: boolean }>;
  list_guide_revisions(
    input: GuideScope & ArtifactRevisionListQuery,
  ): Promise<{
    revisions: GuideRevisionDetail["revision"][];
    next_before_revision_number: number | null;
  }>;
  get_guide_revision(
    input: GuideScope & RevisionNumber,
  ): Promise<GuideRevisionDetail | null>;
  restore_guide_revision(
    input: GuideScope & RevisionNumber & ArtifactRevisionWriteRequest,
  ): Promise<Record<string, unknown> | null>;
  checkpoint_interactive_demo(
    input: DemoScope & ArtifactRevisionWriteRequest,
  ): Promise<{
    revision: InteractiveDemoRevisionDetail["revision"];
    reused: boolean;
  }>;
  list_interactive_demo_revisions(
    input: DemoScope & ArtifactRevisionListQuery,
  ): Promise<{
    revisions: InteractiveDemoRevisionDetail["revision"][];
    next_before_revision_number: number | null;
  }>;
  get_interactive_demo_revision(
    input: DemoScope & RevisionNumber,
  ): Promise<InteractiveDemoRevisionDetail | null>;
  restore_interactive_demo_revision(
    input: DemoScope & RevisionNumber & ArtifactRevisionWriteRequest,
  ): Promise<Record<string, unknown> | null>;
};

export const build_artifact_revision_service = (
  repository: ArtifactRevisionRepository,
) => ({
  checkpoint_guide: repository.checkpoint_guide,
  list_guide_revisions: repository.list_guide_revisions,
  async get_guide_revision(input: GuideScope & RevisionNumber) {
    const result = await repository.get_guide_revision(input);
    if (!result) throw new ArtifactRevisionNotFoundError();
    return result;
  },
  async restore_guide_revision(
    input: GuideScope & RevisionNumber & ArtifactRevisionWriteRequest,
  ) {
    const result = await repository.restore_guide_revision(input);
    if (!result) throw new ArtifactRevisionNotFoundError();
    return result;
  },
  checkpoint_interactive_demo: repository.checkpoint_interactive_demo,
  list_interactive_demo_revisions: repository.list_interactive_demo_revisions,
  async get_interactive_demo_revision(input: DemoScope & RevisionNumber) {
    const result = await repository.get_interactive_demo_revision(input);
    if (!result) throw new ArtifactRevisionNotFoundError();
    return result;
  },
  async restore_interactive_demo_revision(
    input: DemoScope & RevisionNumber & ArtifactRevisionWriteRequest,
  ) {
    const result = await repository.restore_interactive_demo_revision(input);
    if (!result) throw new ArtifactRevisionNotFoundError();
    return result;
  },
});
