import { describe, expect, it } from "vitest";
import {
  ArtifactNotPublishableError,
  PublishLinkManifestInvalidError,
  PublishLinkRollbackInvalidError,
} from "../errors/publish-domain-error";
import {
  assert_artifact_publishable,
  assert_publish_link_selections,
  assert_same_edition_rollback,
  normalize_publish_link_manifest,
  select_public_publish_link_entry,
} from "./publication-policy";

describe("publication policy", () => {
  it("requires an active Project and Project Version with a draft Edition", () => {
    expect(() =>
      assert_artifact_publishable({
        project_status: "active",
        project_version_status: "active",
        edition_status: "draft",
      }),
    ).not.toThrow();
    expect(() =>
      assert_artifact_publishable({
        project_status: "archived",
        project_version_status: "active",
        edition_status: "draft",
      }),
    ).toThrow(ArtifactNotPublishableError);
  });

  it("normalizes the explicit default to position one and preserves other order", () => {
    expect(
      normalize_publish_link_manifest({
        published_artifact_ids: [
          "publication_1",
          "publication_2",
          "publication_3",
        ],
        default_published_artifact_id: "publication_2",
      }),
    ).toEqual([
      { published_artifact_id: "publication_2", position: 1, is_default: true },
      {
        published_artifact_id: "publication_1",
        position: 2,
        is_default: false,
      },
      {
        published_artifact_id: "publication_3",
        position: 3,
        is_default: false,
      },
    ]);
  });

  it("rejects empty, duplicate, missing-default, and over-limit manifests", () => {
    for (const input of [
      {
        published_artifact_ids: [],
        default_published_artifact_id: "publication_1",
      },
      {
        published_artifact_ids: ["publication_1", "publication_1"],
        default_published_artifact_id: "publication_1",
      },
      {
        published_artifact_ids: ["publication_1"],
        default_published_artifact_id: "publication_2",
      },
      {
        published_artifact_ids: Array.from(
          { length: 51 },
          (_, index) => `publication_${index}`,
        ),
        default_published_artifact_id: "publication_0",
      },
    ]) {
      expect(() => normalize_publish_link_manifest(input)).toThrow(
        PublishLinkManifestInvalidError,
      );
    }
  });

  it("allows zero explicit rollout selections but rejects duplicates", () => {
    expect(assert_publish_link_selections([])).toEqual([]);
    expect(() =>
      assert_publish_link_selections([
        { publish_link_id: "link_1", expected_link_version: 1 },
        { publish_link_id: "link_1", expected_link_version: 1 },
      ]),
    ).toThrow(PublishLinkManifestInvalidError);
  });

  it("limits rollback to another Publication from the same Edition", () => {
    expect(() =>
      assert_same_edition_rollback({
        current_edition_id: "edition_1",
        target_edition_id: "edition_1",
        current_published_artifact_id: "publication_2",
        target_published_artifact_id: "publication_1",
      }),
    ).not.toThrow();
    expect(() =>
      assert_same_edition_rollback({
        current_edition_id: "edition_1",
        target_edition_id: "edition_2",
        current_published_artifact_id: "publication_2",
        target_published_artifact_id: "publication_1",
      }),
    ).toThrow(PublishLinkRollbackInvalidError);
  });

  it("selects only the default or an explicitly included canonical/alias version", () => {
    const entries = [
      {
        id: "entry_1",
        project_version_slug: "2-0",
        aliases: ["v2"],
        is_default: true,
      },
      {
        id: "entry_2",
        project_version_slug: "1-0",
        aliases: [],
        is_default: false,
      },
    ];
    expect(
      select_public_publish_link_entry({
        entries,
        requested_version_slug: null,
      }),
    ).toEqual({
      entry: entries[0],
      alias_used: false,
    });
    expect(
      select_public_publish_link_entry({
        entries,
        requested_version_slug: "v2",
      }),
    ).toEqual({
      entry: entries[0],
      alias_used: true,
    });
    expect(
      select_public_publish_link_entry({
        entries,
        requested_version_slug: "missing",
      }),
    ).toBeNull();
  });
});
