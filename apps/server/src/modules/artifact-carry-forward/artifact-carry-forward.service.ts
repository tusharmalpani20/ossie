import { createHash } from "node:crypto";
import type {
  ArtifactCarryForwardRequest,
  ArtifactCarryForwardResponse,
} from "@repo/types";

export class ArtifactCarryForwardProjectVersionNotFoundError extends Error {}
export class ArtifactCarryForwardTargetConflictError extends Error {
  constructor(
    public readonly blockers: Array<{
      artifact_type: string;
      artifact_id: string;
    }>,
  ) {
    super("One or more target Artifact Editions already exist");
  }
}
export class ArtifactCarryForwardIdempotencyConflictError extends Error {}
export class ArtifactCarryForwardTargetReadOnlyError extends Error {}

type Input = ArtifactCarryForwardRequest & {
  auth: { organization_id: string; actor_org_user_id: string };
  project_id: string;
  idempotency_key: string;
};
export type PersistedCarryForwardInput = Omit<Input, "idempotency_key"> & {
  idempotency_key_hash: string;
  request_fingerprint_sha256: string;
};
export type ArtifactCarryForwardRepository = {
  carry_forward(
    input: PersistedCarryForwardInput,
  ): Promise<ArtifactCarryForwardResponse>;
};

const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export const build_artifact_carry_forward_service = (
  repository: ArtifactCarryForwardRepository,
) => ({
  carry_forward(input: Input) {
    const normalized = {
      project_id: input.project_id,
      source_project_version_id: input.source_project_version_id,
      target_project_version_id: input.target_project_version_id,
      artifacts: input.artifacts.map(({ artifact_type, artifact_id }) => ({
        artifact_type,
        artifact_id,
      })),
    };
    return repository.carry_forward({
      auth: input.auth,
      ...normalized,
      idempotency_key_hash: digest(input.idempotency_key),
      request_fingerprint_sha256: digest(JSON.stringify(normalized)),
    });
  },
});
