import { PUBLISH_LINK_ENTRY_MAX } from "@repo/constants";
import {
  ArtifactNotPublishableError,
  PublishLinkManifestInvalidError,
  PublishLinkRollbackInvalidError,
} from "../errors/publish-domain-error";

export const assert_artifact_publishable = (input: {
  project_status: string;
  project_version_status: string;
  edition_status: string;
}) => {
  if (
    input.project_status !== "active" ||
    input.project_version_status !== "active" ||
    input.edition_status !== "draft"
  ) {
    throw new ArtifactNotPublishableError();
  }
};

export const assert_publish_link_selections = <
  T extends {
    publish_link_id: string;
    expected_link_version: number;
  },
>(
  selections: T[],
) => {
  if (
    selections.length > PUBLISH_LINK_ENTRY_MAX ||
    new Set(selections.map((selection) => selection.publish_link_id)).size !==
      selections.length
  ) {
    throw new PublishLinkManifestInvalidError();
  }
  return selections;
};

export const normalize_publish_link_manifest = (input: {
  published_artifact_ids: string[];
  default_published_artifact_id: string;
}) => {
  const ids = input.published_artifact_ids;
  if (
    ids.length < 1 ||
    ids.length > PUBLISH_LINK_ENTRY_MAX ||
    new Set(ids).size !== ids.length ||
    !ids.includes(input.default_published_artifact_id)
  ) {
    throw new PublishLinkManifestInvalidError();
  }

  return [
    input.default_published_artifact_id,
    ...ids.filter((id) => id !== input.default_published_artifact_id),
  ].map((published_artifact_id, index) => ({
    published_artifact_id,
    position: index + 1,
    is_default: index === 0,
  }));
};

export const assert_same_edition_rollback = (input: {
  current_edition_id: string;
  target_edition_id: string;
  current_published_artifact_id: string;
  target_published_artifact_id: string;
  current_publication_sequence: number;
  target_publication_sequence: number;
}) => {
  if (
    input.current_edition_id !== input.target_edition_id ||
    input.current_published_artifact_id === input.target_published_artifact_id ||
    input.target_publication_sequence >= input.current_publication_sequence
  ) {
    throw new PublishLinkRollbackInvalidError();
  }
};

export const select_public_publish_link_entry = <
  T extends {
    project_version_slug: string;
    aliases: string[];
    is_default: boolean;
  },
>(input: {
  entries: T[];
  requested_version_slug: string | null;
}) => {
  if (input.requested_version_slug === null) {
    const entry = input.entries.find((candidate) => candidate.is_default);
    return entry ? { entry, alias_used: false } : null;
  }

  const canonical = input.entries.find(
    (candidate) =>
      candidate.project_version_slug === input.requested_version_slug,
  );
  if (canonical) return { entry: canonical, alias_used: false };

  const alias = input.entries.find((candidate) =>
    candidate.aliases.includes(input.requested_version_slug!),
  );
  return alias ? { entry: alias, alias_used: true } : null;
};
