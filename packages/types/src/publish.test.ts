import { describe, expect, it } from "vitest";
import {
  CreatePublishLinkRequestSchema,
  CreatePublicViewerSessionRequestSchema,
  PublicPublishLinkQuerySchema,
  PublicPublishLinkResponseSchema,
  PublishArtifactRequestSchema,
  PublishArtifactResponseSchema,
  PublishLinkSchema,
  ReplacePublishLinkManifestRequestSchema,
  RollbackPublishLinkEntryRequestSchema,
  UpdatePublishLinkSettingsRequestSchema,
} from "./publish";

const revision = {
  id: "revision_1",
  edition_id: "edition_1",
  revision_number: 2,
  trigger: "publication",
  title: "Configure SSO",
  description: null,
  source_working_draft_version: 7,
  created_by_id: "member_1",
  created_at: "2026-07-20T00:00:00.000Z",
};

const publication = {
  id: "publication_1",
  artifact_type: "guide",
  artifact_id: "guide_1",
  edition_id: "edition_1",
  project_version_id: "project_version_1",
  revision_id: "revision_1",
  revision_number: 2,
  publication_sequence: 3,
  publisher: { id: "member_1", display_name: "Editor" },
  published_at: "2026-07-20T00:00:00.000Z",
  created_at: "2026-07-20T00:00:00.000Z",
};

const entry = {
  id: "entry_1",
  project_version: {
    id: "project_version_1",
    name: "2.0",
    slug: "2-0",
    status: "active",
  },
  position: 1,
  is_default: true,
  version: 1,
  published_artifact: publication,
};

const link = {
  id: "link_1",
  artifact_type: "guide",
  artifact_id: "guide_1",
  name: "Customer docs",
  slug: "opaque-link",
  visibility: "public",
  status: "active",
  expires_at: null,
  password_protected: false,
  version: 1,
  entries: [entry],
  public_url: "/p/opaque-link",
  default_public_url: "/p/opaque-link/versions/2-0",
  created_at: "2026-07-20T00:00:00.000Z",
  updated_at: "2026-07-20T00:00:00.000Z",
  revoked_at: null,
};

describe("publication and Publish Link contracts", () => {
  it("parses relational Publication and manifest responses", () => {
    expect(PublishLinkSchema.parse(link)).toEqual(link);
    expect(
      PublishArtifactResponseSchema.parse({
        revision,
        revision_reused: false,
        published_artifact: publication,
        updated_publish_links: [link],
        created_publish_link: null,
      }),
    ).toEqual({
      revision,
      revision_reused: false,
      published_artifact: publication,
      updated_publish_links: [link],
      created_publish_link: null,
    });
  });

  it("requires explicit link Row Versions and rejects legacy publish fields", () => {
    expect(
      PublishArtifactRequestSchema.parse({
        expected_edition_version: 4,
        expected_working_draft_version: 7,
        update_publish_links: [
          {
            publish_link_id: "link_1",
            expected_link_version: 2,
          },
        ],
      }),
    ).toEqual({
      expected_edition_version: 4,
      expected_working_draft_version: 7,
      update_publish_links: [
        {
          publish_link_id: "link_1",
          expected_link_version: 2,
        },
      ],
    });

    expect(() =>
      PublishArtifactRequestSchema.parse({
        expected_edition_version: 4,
        expected_working_draft_version: 7,
        update_publish_links: [],
        version_number: 1,
      }),
    ).toThrow();
    expect(() =>
      PublishArtifactRequestSchema.parse({
        expected_edition_version: 4,
        expected_working_draft_version: 7,
        update_publish_links: [
          { publish_link_id: "link_1", expected_link_version: 1 },
          { publish_link_id: "link_1", expected_link_version: 1 },
        ],
      }),
    ).toThrow();
  });

  it("validates complete ordered manifests and defaults", () => {
    expect(
      CreatePublishLinkRequestSchema.parse({
        name: "Customer docs",
        visibility: "public",
        expires_at: null,
        password: null,
        published_artifact_ids: ["publication_1", "publication_2"],
        default_published_artifact_id: "publication_2",
      }).published_artifact_ids,
    ).toEqual(["publication_1", "publication_2"]);

    expect(() =>
      ReplacePublishLinkManifestRequestSchema.parse({
        expected_link_version: 2,
        published_artifact_ids: ["publication_1"],
        default_published_artifact_id: "publication_2",
      }),
    ).toThrow();
    expect(() =>
      ReplacePublishLinkManifestRequestSchema.parse({
        expected_link_version: 2,
        published_artifact_ids: ["publication_1", "publication_1"],
        default_published_artifact_id: "publication_1",
      }),
    ).toThrow();
  });

  it("keeps settings, rollback, and password inputs strict and write-only", () => {
    expect(
      UpdatePublishLinkSettingsRequestSchema.parse({
        expected_link_version: 2,
        name: "Support",
        password: null,
      }),
    ).toEqual({ expected_link_version: 2, name: "Support", password: null });
    expect(() =>
      UpdatePublishLinkSettingsRequestSchema.parse({
        expected_link_version: 2,
      }),
    ).toThrow();
    expect(
      RollbackPublishLinkEntryRequestSchema.parse({
        expected_link_version: 2,
        target_published_artifact_id: "publication_1",
        reason: "  Restore approved release  ",
      }).reason,
    ).toBe("Restore approved release");
    expect(() =>
      CreatePublicViewerSessionRequestSchema.parse({
        password: "password123",
        token: "must-not-pass",
      }),
    ).toThrow();
  });

  it("parses typed public Revision content without snapshot aliases", () => {
    const response = {
      publish_link: {
        slug: "opaque-link",
        artifact_type: "guide",
        visibility: "public",
        status: "active",
        expires_at: null,
        password_protected: false,
        entries: [
          {
            project_version_name: "2.0",
            project_version_slug: "2-0",
            position: 1,
            is_default: true,
            publication_sequence: 3,
            public_url: "/p/opaque-link/versions/2-0",
          },
        ],
      },
      selected_entry: {
        project_version_name: "2.0",
        project_version_slug: "2-0",
        position: 1,
        is_default: true,
        publication_sequence: 3,
        public_url: "/p/opaque-link/versions/2-0",
      },
      published_artifact: {
        artifact_type: "guide",
        publication_sequence: 3,
        revision: {
          revision_number: 2,
          title: "Configure SSO",
          description: null,
          created_at: "2026-07-20T00:00:00.000Z",
        },
        guide_blocks: [],
        capture_assets: [],
      },
      canonical_public_url: "/p/opaque-link/versions/2-0",
    };

    expect(PublicPublishLinkResponseSchema.parse(response)).toEqual(response);
    expect(() =>
      PublicPublishLinkResponseSchema.parse({
        ...response,
        snapshot: {},
      }),
    ).toThrow();
  });

  it("accepts only the public Guide projection and rejects authoring provenance", () => {
    const publicResponse = {
      publish_link: {
        slug: "opaque-link",
        artifact_type: "guide",
        visibility: "public",
        status: "active",
        expires_at: null,
        password_protected: false,
        entries: [
          {
            project_version_name: "2.0",
            project_version_slug: "2-0",
            position: 1,
            is_default: true,
            publication_sequence: 3,
            public_url: "/p/opaque-link/versions/2-0",
          },
        ],
      },
      selected_entry: {
        project_version_name: "2.0",
        project_version_slug: "2-0",
        position: 1,
        is_default: true,
        publication_sequence: 3,
        public_url: "/p/opaque-link/versions/2-0",
      },
      published_artifact: {
        artifact_type: "guide",
        publication_sequence: 3,
        revision: {
          revision_number: 2,
          title: "Configure SSO",
          description: null,
          created_at: "2026-07-20T00:00:00.000Z",
        },
        guide_blocks: [
          {
            id: "block_1",
            block_type: "step",
            title: "Open settings",
            body: null,
            block_index: 1,
            step: {
              display_capture_asset_id: "asset_1",
              screenshot_hidden: false,
              title: "Open settings",
              body: null,
              annotations: [
                {
                  annotation_type: "highlight",
                  annotation_index: 1,
                  x: 0.1,
                  y: 0.2,
                  width: 0.3,
                  height: 0.4,
                },
              ],
            },
          },
        ],
        capture_assets: [
          {
            id: "asset_1",
            status: "active",
            file_url: "/api/v1/public/assets/asset_1",
            mime_type: "image/png",
            width: 1280,
            height: 720,
          },
        ],
      },
      canonical_public_url: "/p/opaque-link/versions/2-0",
    };

    expect(PublicPublishLinkResponseSchema.parse(publicResponse)).toEqual(
      publicResponse,
    );
    expect(() =>
      PublicPublishLinkResponseSchema.parse({
        ...publicResponse,
        published_artifact: {
          ...publicResponse.published_artifact,
          revision: {
            ...publicResponse.published_artifact.revision,
            created_by_id: "member_1",
          },
        },
      }),
    ).toThrow();
    expect(() =>
      PublicPublishLinkResponseSchema.parse({
        ...publicResponse,
        published_artifact: {
          ...publicResponse.published_artifact,
          guide_blocks: [
            {
              ...publicResponse.published_artifact.guide_blocks[0],
              step: {
                ...publicResponse.published_artifact.guide_blocks[0]!.step,
                source_capture_session_id: "capture_1",
              },
            },
          ],
        },
      }),
    ).toThrow();
  });

  it("requires public callers to identify the browser artifact family", () => {
    expect(
      PublicPublishLinkQuerySchema.parse({ artifact_type: "guide" }),
    ).toEqual({
      artifact_type: "guide",
    });
    expect(() => PublicPublishLinkQuerySchema.parse({})).toThrow();
    expect(
      PublicPublishLinkQuerySchema.parse({
        resource_family: "documentation_site",
      }),
    ).toEqual({ resource_family: "documentation_site" });
  });
});
