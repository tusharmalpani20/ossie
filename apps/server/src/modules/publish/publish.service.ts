import { createHash, randomBytes } from "node:crypto";
import type { FileStorageProvider, PublishArtifactType } from "@repo/constants";
import {
  assert_public_publish_link_access,
  assert_public_viewer_session_access,
  InvalidPublicViewerPasswordError,
  public_viewer_session_expires_at,
  PublishLinkNotFoundError,
  validate_publish_password_input,
} from "@repo/publish-domain";
import type {
  CreatePublishLinkRequest,
  PublicationHistoryResponse,
  PublishArtifactRequest,
  PublishArtifactResponse,
  PublishLink,
  PublicPublishLinkResponse,
  ReplacePublishLinkManifestRequest,
  RollbackPublishLinkEntryRequest,
  UpdatePublishLinkSettingsRequest,
} from "@repo/types/publish";
import {
  hash_public_link_password,
  verify_public_link_password,
} from "./public-link-password";

export type PublishAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};
export type ArtifactScope = {
  auth: PublishAuthContext;
  project_id: string;
  project_version_id: string;
  artifact_type: PublishArtifactType;
  artifact_id: string;
};
export type PublishedAssetFileRead = {
  stream: NodeJS.ReadableStream;
  mime_type: string;
  size_bytes: number;
};
export type PublicAssetFile = {
  file: {
    storage_provider: FileStorageProvider;
    storage_key: string;
    mime_type: string;
    size_bytes: number;
  };
};
export type PublicViewerSession = { token: string; expires_at: string };
export type PublicPublishAccessContext = {
  organization_id: string;
  project_id: string;
  publish_link_id: string;
};

export class ProjectNotFoundError extends Error {}
export class GuideNotFoundError extends Error {}
export class InteractiveDemoNotFoundError extends Error {}
export class PublishedAssetNotFoundError extends Error {}
export class UnsupportedPublishedAssetStorageProviderError extends Error {}
export class PublishSlugConflictError extends Error {}

type LinkCursor = { created_at: string; id: string };
export type PublishRepository = {
  transaction<Result>(
    work: (repository: PublishRepository) => Promise<Result>,
  ): Promise<Result>;
  publish(
    input: ArtifactScope & PublishArtifactRequest,
  ): Promise<PublishArtifactResponse>;
  list_publications(
    input: ArtifactScope & {
      limit: number;
      before_publication_sequence?: number;
    },
  ): Promise<PublicationHistoryResponse>;
  list_publish_links(
    input: ArtifactScope & {
      status: "active" | "revoked" | "all";
      limit: number;
      cursor: LinkCursor | null;
    },
  ): Promise<{ publish_links: PublishLink[]; next_cursor: LinkCursor | null }>;
  create_publish_link(
    input: ArtifactScope &
      CreatePublishLinkRequest & {
        password_hash: string | null;
        password_salt: string | null;
      },
  ): Promise<PublishLink>;
  update_publish_link(
    input: ArtifactScope & {
      link_id: string;
      settings: UpdatePublishLinkSettingsRequest;
      password_hash?: string | null;
      password_salt?: string | null;
    },
  ): Promise<PublishLink | null>;
  replace_publish_link_manifest(
    input: ArtifactScope & {
      link_id: string;
      manifest: ReplacePublishLinkManifestRequest;
    },
  ): Promise<PublishLink | null>;
  rollback_publish_link_entry(
    input: ArtifactScope & {
      link_id: string;
      entry_id: string;
      rollback: RollbackPublishLinkEntryRequest;
    },
  ): Promise<{
    publish_link: PublishLink;
    entry: PublishLink["entries"][number];
    previous_published_artifact: PublishLink["entries"][number]["published_artifact"];
  } | null>;
  revoke_publish_link(
    input: ArtifactScope & { link_id: string; expected_link_version: number },
  ): Promise<PublishLink | null>;
  resolve_public_publish_link(input: {
    slug: string;
    artifact_type: PublishArtifactType;
    version_slug: string | null;
  }): Promise<
    | (PublicPublishLinkResponse & {
        access_context: PublicPublishAccessContext;
        password_hash: string | null;
        password_salt: string | null;
      })
    | null
  >;
  resolve_public_documentation_link(input: { slug: string }): Promise<{
    publish_link: {
      visibility: "public" | "restricted";
      status: "active" | "revoked";
      expires_at: string | null;
      password_protected: boolean;
    };
    access_context: PublicPublishAccessContext;
    password_hash: string | null;
    password_salt: string | null;
  } | null>;
  find_public_viewer_session(input: {
    publish_link_id: string;
    token_hash: string;
  }): Promise<{
    publish_link_id: string;
    expires_at: string;
    revoked_at: string | null;
  } | null>;
  touch_public_viewer_session(input: {
    publish_link_id: string;
    token_hash: string;
  }): Promise<void>;
  create_public_viewer_session(input: {
    publish_link_id: string;
    token_hash: string;
    token: string;
    expires_at: string;
  }): Promise<PublicViewerSession>;
  get_public_asset(input: {
    slug: string;
    artifact_type: PublishArtifactType;
    version_slug: string;
    capture_asset_id: string;
  }): Promise<PublicAssetFile | null>;
};

const hash_token = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const build_publish_service = (
  repository: PublishRepository,
  options: {
    file_storage?: {
      get(input: {
        storage_key: string;
      }): Promise<{ stream: NodeJS.ReadableStream; size_bytes: number }>;
    };
    on_public_publish_link_resolved?: (
      context: PublicPublishAccessContext,
    ) => void;
  } = {},
) => {
  const public_access = async (input: {
    slug: string;
    artifact_type: PublishArtifactType;
    version_slug: string | null;
    viewer_token?: string;
  }) => {
    const resolved = await repository.resolve_public_publish_link(input);
    if (!resolved) throw new PublishLinkNotFoundError();
    assert_public_publish_link_access({
      publish_link: resolved.publish_link,
      now: new Date(),
    });
    const session = input.viewer_token
      ? await repository.find_public_viewer_session({
          publish_link_id: resolved.access_context.publish_link_id,
          token_hash: hash_token(input.viewer_token),
        })
      : null;
    const access = assert_public_viewer_session_access({
      publish_link: resolved.publish_link,
      session,
      now: new Date(),
    });
    if (access.should_touch_session && input.viewer_token) {
      await repository.touch_public_viewer_session({
        publish_link_id: resolved.access_context.publish_link_id,
        token_hash: hash_token(input.viewer_token),
      });
    }
    options.on_public_publish_link_resolved?.(resolved.access_context);
    return resolved;
  };
  const documentation_access = async (input: {
    slug: string;
    viewer_token?: string;
  }) => {
    const resolved = await repository.resolve_public_documentation_link(input);
    if (!resolved) throw new PublishLinkNotFoundError();
    if (resolved.publish_link.status !== "active")
      throw new PublishLinkNotFoundError();
    assert_public_publish_link_access({
      publish_link: resolved.publish_link,
      now: new Date(),
    });
    const session = input.viewer_token
      ? await repository.find_public_viewer_session({
          publish_link_id: resolved.access_context.publish_link_id,
          token_hash: hash_token(input.viewer_token),
        })
      : null;
    const access = assert_public_viewer_session_access({
      publish_link: resolved.publish_link,
      session,
      now: new Date(),
    });
    if (access.should_touch_session && input.viewer_token) {
      await repository.touch_public_viewer_session({
        publish_link_id: resolved.access_context.publish_link_id,
        token_hash: hash_token(input.viewer_token),
      });
    }
    options.on_public_publish_link_resolved?.(resolved.access_context);
    return resolved;
  };

  return {
    publish: (input: ArtifactScope & PublishArtifactRequest) => {
      if (input.create_publish_link)
        validate_publish_password_input(input.create_publish_link.password);
      return repository.transaction((tx) => tx.publish(input));
    },
    list_publications: repository.list_publications,
    list_publish_links: repository.list_publish_links,
    async create_publish_link(input: ArtifactScope & CreatePublishLinkRequest) {
      validate_publish_password_input(input.password);
      const password =
        input.password === null
          ? { hash: null, salt: null }
          : await hash_public_link_password(input.password);
      return repository.transaction((tx) =>
        tx.create_publish_link({
          ...input,
          password_hash: password.hash,
          password_salt: password.salt,
        }),
      );
    },
    async update_publish_link(
      input: ArtifactScope & {
        link_id: string;
        settings: UpdatePublishLinkSettingsRequest;
      },
    ) {
      if (input.settings.password !== undefined)
        validate_publish_password_input(input.settings.password);
      const password =
        input.settings.password === undefined
          ? {}
          : input.settings.password === null
            ? { password_hash: null, password_salt: null }
            : await hash_public_link_password(input.settings.password!).then(
                (value) => ({
                  password_hash: value.hash,
                  password_salt: value.salt,
                }),
              );
      return repository.transaction((tx) =>
        tx.update_publish_link({ ...input, ...password }),
      );
    },
    replace_publish_link_manifest: (
      input: ArtifactScope & {
        link_id: string;
        manifest: ReplacePublishLinkManifestRequest;
      },
    ) =>
      repository.transaction((tx) => tx.replace_publish_link_manifest(input)),
    rollback_publish_link_entry: (
      input: ArtifactScope & {
        link_id: string;
        entry_id: string;
        rollback: RollbackPublishLinkEntryRequest;
      },
    ) => repository.transaction((tx) => tx.rollback_publish_link_entry(input)),
    revoke_publish_link: (
      input: ArtifactScope & { link_id: string; expected_link_version: number },
    ) => repository.transaction((tx) => tx.revoke_publish_link(input)),
    async resolve_public_publish_link(input: {
      slug: string;
      artifact_type: PublishArtifactType;
      version_slug: string | null;
      viewer_token?: string;
    }) {
      const resolved = await public_access(input);
      return {
        publish_link: resolved.publish_link,
        selected_entry: resolved.selected_entry,
        published_artifact: resolved.published_artifact,
        canonical_public_url: resolved.canonical_public_url,
      };
    },
    async authorize_public_documentation(input: {
      slug: string;
      viewer_token?: string;
    }) {
      const resolved = await documentation_access(input);
      return resolved.access_context;
    },
    async create_public_publish_viewer_session(input: {
      slug: string;
      artifact_type: PublishArtifactType;
      password: string;
    }) {
      const resolved = await repository.resolve_public_publish_link({
        ...input,
        version_slug: null,
      });
      if (resolved) {
        assert_public_publish_link_access({
          publish_link: resolved.publish_link,
          now: new Date(),
        });
      }
      if (
        !resolved ||
        !resolved.password_hash ||
        !resolved.password_salt ||
        !(await verify_public_link_password(
          input.password,
          resolved.password_hash,
          resolved.password_salt,
        ))
      ) {
        throw new InvalidPublicViewerPasswordError();
      }
      const token = randomBytes(32).toString("base64url");
      return repository.create_public_viewer_session({
        publish_link_id: resolved.access_context.publish_link_id,
        token,
        token_hash: hash_token(token),
        expires_at: public_viewer_session_expires_at(new Date()),
      });
    },
    async create_public_documentation_viewer_session(input: {
      slug: string;
      password: string;
    }) {
      const resolved =
        await repository.resolve_public_documentation_link(input);
      if (resolved) {
        if (resolved.publish_link.status !== "active")
          throw new PublishLinkNotFoundError();
        assert_public_publish_link_access({
          publish_link: resolved.publish_link,
          now: new Date(),
        });
      }
      if (
        !resolved ||
        !resolved.password_hash ||
        !resolved.password_salt ||
        !(await verify_public_link_password(
          input.password,
          resolved.password_hash,
          resolved.password_salt,
        ))
      ) {
        throw new InvalidPublicViewerPasswordError();
      }
      const token = randomBytes(32).toString("base64url");
      return repository.create_public_viewer_session({
        publish_link_id: resolved.access_context.publish_link_id,
        token,
        token_hash: hash_token(token),
        expires_at: public_viewer_session_expires_at(new Date()),
      });
    },
    async get_public_published_asset_file(input: {
      slug: string;
      artifact_type: PublishArtifactType;
      version_slug: string;
      capture_asset_id: string;
      viewer_token?: string;
    }) {
      await public_access({ ...input, version_slug: input.version_slug });
      const asset = await repository.get_public_asset(input);
      if (!asset) throw new PublishedAssetNotFoundError();
      if (asset.file.storage_provider !== "local" || !options.file_storage)
        throw new UnsupportedPublishedAssetStorageProviderError();
      const file = await options.file_storage.get({
        storage_key: asset.file.storage_key,
      });
      return { ...file, mime_type: asset.file.mime_type };
    },
  };
};

export type PublishService = ReturnType<typeof build_publish_service>;
