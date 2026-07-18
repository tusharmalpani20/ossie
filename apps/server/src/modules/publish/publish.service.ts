import { createHash, randomBytes } from "node:crypto";
import {
  type FileStorageProvider,
  type PublishArtifactType,
  type PublishLinkStatus,
  type PublishVisibility,
} from "@repo/constants";
import {
  assert_public_publish_link_access,
  assert_public_viewer_password_result,
  assert_public_viewer_session_access,
  build_published_guide_snapshot,
  build_published_interactive_demo_snapshot,
  GuideHasNoPublishableBlocksError,
  GuideNotPublishableError,
  PUBLISH_SLUG_RETRY_LIMIT,
  public_viewer_session_expires_at,
  PublishLinkPasswordRequiredError,
  publish_slug_for_link,
  validate_publish_access_input,
  validate_publish_password_input,
} from "@repo/publish-domain";
import type {
  PublishedArtifact,
  PublishedGuideSnapshot,
  PublishedInteractiveDemoSnapshot,
  PublishLink,
  PublishResult,
  RevokePublishResult,
  PublishStatusResponse,
  PublicPublishedArtifact,
  PublicPublishLink,
} from "@repo/types/publish";
import type {
  GuideDetail,
  GuideSourceCaptureAsset,
} from "../guide/guide.service";
import type {
  DemoHotspot,
  DemoScene,
  InteractiveDemo,
} from "../interactive-demo/interactive-demo.service";
import {
  hash_public_link_password,
  verify_public_link_password,
} from "./public-link-password";

export type {
  PublishedArtifact,
  PublishArtifactType,
  PublishLink,
  PublishLinkStatus,
  PublishVisibility,
};
export type PublishAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type PublishStatus = PublishStatusResponse;
export type GuidePublishStatus = PublishStatusResponse;
export type InteractiveDemoPublishStatus = PublishStatusResponse;

export type PublicPublishResult = {
  publish_link: PublicPublishLink;
  published_artifact: PublicPublishedArtifact;
  publish_link_id?: string;
  password?: {
    hash: string;
    salt: string;
  } | null;
};

export type PublicViewerSession = {
  token: string;
  expires_at: string;
};

export type PublishedAssetFileRead = {
  stream: NodeJS.ReadableStream;
  mime_type: string;
  size_bytes: number;
};

export type InteractiveDemoPublishDetail = {
  interactive_demo: InteractiveDemo;
  demo_scenes: DemoScene[];
  demo_hotspots: DemoHotspot[];
  source_capture_assets: GuideSourceCaptureAsset[];
};

export class PublishSlugConflictError extends Error {
  constructor() {
    super("Publish slug already exists");
  }
}

export type PublicAssetFile = {
  file: {
    storage_provider: FileStorageProvider;
    storage_key: string;
    mime_type: string;
  };
};

export type PublishRepository = {
  transaction: <Result>(work: (repository: PublishRepository) => Promise<Result>) => Promise<Result>;
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  find_guide_detail: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
  }) => Promise<GuideDetail | null>;
  find_interactive_demo_detail: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
  }) => Promise<InteractiveDemoPublishDetail | null>;
  find_active_publish_link: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
  }) => Promise<PublishLink | null>;
  next_published_artifact_version: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
  }) => Promise<number>;
  create_published_artifact: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    version_number: number;
    title: string;
    snapshot_json: PublishedGuideSnapshot | PublishedInteractiveDemoSnapshot;
    actor_org_user_id: string;
  }) => Promise<PublishedArtifact>;
  create_publish_link: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    published_artifact_id: string;
    slug: string;
    actor_org_user_id: string;
  }) => Promise<PublishLink>;
  update_publish_link_target: (input: {
    organization_id: string;
    project_id: string;
    publish_link_id: string;
    published_artifact_id: string;
  }) => Promise<PublishLink>;
  find_publish_status: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
  }) => Promise<PublishStatus | null>;
  revoke_active_publish_link: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    actor_org_user_id: string;
  }) => Promise<PublishLink | null>;
  update_publish_link_access: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    visibility: PublishVisibility;
    expires_at: string | null;
    actor_org_user_id: string;
  }) => Promise<PublishStatus | null>;
  update_publish_link_password: (input: {
    organization_id: string;
    project_id: string;
    artifact_type: PublishArtifactType;
    artifact_id: string;
    password_hash: string | null;
    password_salt: string | null;
    actor_org_user_id: string;
  }) => Promise<PublishStatus | null>;
  create_public_viewer_session: (input: {
    publish_link_id: string;
    token_hash: string;
    token: string;
    expires_at: string;
  }) => Promise<PublicViewerSession>;
  find_public_viewer_session_by_token_hash: (input: {
    token_hash: string;
    publish_link_slug: string;
  }) => Promise<{
    publish_link_id: string;
    expires_at: string;
    revoked_at: string | null;
  } | null>;
  touch_public_viewer_session: (input: {
    token_hash: string;
  }) => Promise<void>;
  revoke_public_viewer_sessions_for_publish_link: (input: {
    publish_link_id: string;
  }) => Promise<void>;
  find_active_publish_link_by_slug: (input: {
    slug: string;
  }) => Promise<PublicPublishResult | null>;
  find_public_asset_file: (input: {
    slug: string;
    capture_asset_id: string;
  }) => Promise<PublicAssetFile | null>;
};

export type PublishFileStorage = {
  get: (input: { storage_key: string }) => Promise<{
    stream: NodeJS.ReadableStream;
    size_bytes: number;
  }>;
};

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project was not found");
  }
}

export class GuideNotFoundError extends Error {
  constructor() {
    super("Guide was not found");
  }
}

export class InteractiveDemoNotFoundError extends Error {
  constructor() {
    super("Interactive demo was not found");
  }
}

export class PublishLinkNotFoundError extends Error {
  constructor() {
    super("Publish link was not found");
  }
}

export class PublishedAssetNotFoundError extends Error {
  constructor() {
    super("Published asset was not found");
  }
}

export class UnsupportedPublishedAssetStorageProviderError extends Error {
  constructor() {
    super("Published asset storage provider is not supported");
  }
}

const default_generate_slug = () => randomBytes(9).toString("base64url");
const default_generate_viewer_token = () => randomBytes(32).toString("base64url");
const hash_viewer_token = (token: string) => (
  createHash("sha256").update(token).digest("hex")
);

const public_publish_response = (result: PublicPublishResult): PublicPublishResult => ({
  publish_link: result.publish_link,
  published_artifact: result.published_artifact,
});

export const build_publish_service = (
  repository: PublishRepository,
  options: {
    generate_slug?: () => string;
    generate_viewer_token?: () => string;
    now?: () => Date;
    file_storage?: PublishFileStorage;
  } = {}
) => {
  const generate_slug = options.generate_slug ?? default_generate_slug;
  const generate_viewer_token = options.generate_viewer_token ?? default_generate_viewer_token;
  const now = options.now ?? (() => new Date());

  const ensure_project_exists = async (input: {
    organization_id: string;
    project_id: string;
  }) => {
    if (!await repository.project_exists(input)) {
      throw new ProjectNotFoundError();
    }
  };

  const publish_guide = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
  }) => {
    let last_error: unknown;

    for (let attempt = 0; attempt < PUBLISH_SLUG_RETRY_LIMIT; attempt += 1) {
      try {
        return await repository.transaction(async (transactional_repository) => {
          const scope = {
            organization_id: input.auth.organization_id,
            project_id: input.project_id,
          };

          await ensure_project_exists(scope);

          const guide_detail = await transactional_repository.find_guide_detail({
            ...scope,
            guide_id: input.guide_id,
          });

          if (!guide_detail) {
            throw new GuideNotFoundError();
          }

          if (guide_detail.guide.status !== "draft") {
            throw new GuideNotPublishableError();
          }

          if (guide_detail.guide_blocks.length === 0) {
            throw new GuideHasNoPublishableBlocksError();
          }

          const existing_link = await transactional_repository.find_active_publish_link({
            ...scope,
            artifact_type: "guide",
            artifact_id: input.guide_id,
          });
          const version_number = await transactional_repository.next_published_artifact_version({
            ...scope,
            artifact_type: "guide",
            artifact_id: input.guide_id,
          });
          const slug = publish_slug_for_link({
            existing_link,
            generated_slug: generate_slug(),
          });
          const published_at = now().toISOString();
          const snapshot_json = build_published_guide_snapshot({
            guide_detail,
            version_number,
            published_at,
            slug,
          });
          const published_artifact = await transactional_repository.create_published_artifact({
            ...scope,
            artifact_type: "guide",
            artifact_id: input.guide_id,
            version_number,
            title: guide_detail.guide.title,
            snapshot_json,
            actor_org_user_id: input.auth.actor_org_user_id,
          });
          const publish_link = existing_link
            ? await transactional_repository.update_publish_link_target({
              ...scope,
              publish_link_id: existing_link.id,
              published_artifact_id: published_artifact.id,
            })
            : await transactional_repository.create_publish_link({
              ...scope,
              artifact_type: "guide",
              artifact_id: input.guide_id,
              published_artifact_id: published_artifact.id,
              slug,
              actor_org_user_id: input.auth.actor_org_user_id,
            });

          return {
            publish_link,
            published_artifact,
          };
        });
      } catch (error) {
        if (!(error instanceof PublishSlugConflictError)) {
          throw error;
        }

        last_error = error;
      }
    }

    throw last_error;
  };

  const publish_interactive_demo = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }): Promise<PublishResult> => {
    let last_error: unknown;

    for (let attempt = 0; attempt < PUBLISH_SLUG_RETRY_LIMIT; attempt += 1) {
      try {
        return await repository.transaction(async (transactional_repository) => {
          const scope = {
            organization_id: input.auth.organization_id,
            project_id: input.project_id,
          };

          await ensure_project_exists(scope);

          const demo_detail = await transactional_repository.find_interactive_demo_detail({
            ...scope,
            interactive_demo_id: input.interactive_demo_id,
          });

          if (!demo_detail) {
            throw new InteractiveDemoNotFoundError();
          }

          const existing_link = await transactional_repository.find_active_publish_link({
            ...scope,
            artifact_type: "interactive_demo",
            artifact_id: input.interactive_demo_id,
          });
          const version_number = await transactional_repository.next_published_artifact_version({
            ...scope,
            artifact_type: "interactive_demo",
            artifact_id: input.interactive_demo_id,
          });
          const slug = publish_slug_for_link({
            existing_link,
            generated_slug: generate_slug(),
          });
          const published_at = now().toISOString();
          const snapshot_json = build_published_interactive_demo_snapshot({
            demo_detail,
            version_number,
            published_at,
            slug,
          });
          const published_artifact = await transactional_repository.create_published_artifact({
            ...scope,
            artifact_type: "interactive_demo",
            artifact_id: input.interactive_demo_id,
            version_number,
            title: demo_detail.interactive_demo.title,
            snapshot_json,
            actor_org_user_id: input.auth.actor_org_user_id,
          });
          const publish_link = existing_link
            ? await transactional_repository.update_publish_link_target({
              ...scope,
              publish_link_id: existing_link.id,
              published_artifact_id: published_artifact.id,
            })
            : await transactional_repository.create_publish_link({
              ...scope,
              artifact_type: "interactive_demo",
              artifact_id: input.interactive_demo_id,
              published_artifact_id: published_artifact.id,
              slug,
              actor_org_user_id: input.auth.actor_org_user_id,
            });

          return {
            publish_link,
            published_artifact,
          };
        });
      } catch (error) {
        if (!(error instanceof PublishSlugConflictError)) {
          throw error;
        }

        last_error = error;
      }
    }

    throw last_error;
  };

  const get_guide_publish_status = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    return await repository.find_publish_status({
      ...scope,
      artifact_type: "guide",
      artifact_id: input.guide_id,
    }) ?? {
      publish_link: null,
      published_artifact: null,
    };
  };

  const get_interactive_demo_publish_status = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }): Promise<InteractiveDemoPublishStatus> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    return await repository.find_publish_status({
      ...scope,
      artifact_type: "interactive_demo",
      artifact_id: input.interactive_demo_id,
    }) ?? {
      publish_link: null,
      published_artifact: null,
    };
  };

  const revoke_guide_publish_link = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
  }): Promise<RevokePublishResult> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const publish_link = await repository.revoke_active_publish_link({
      ...scope,
      artifact_type: "guide",
      artifact_id: input.guide_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!publish_link) {
      throw new PublishLinkNotFoundError();
    }

    await repository.revoke_public_viewer_sessions_for_publish_link({
      publish_link_id: publish_link.id,
    });

    return { publish_link };
  };

  const revoke_interactive_demo_publish_link = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }): Promise<RevokePublishResult> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const publish_link = await repository.revoke_active_publish_link({
      ...scope,
      artifact_type: "interactive_demo",
      artifact_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!publish_link) {
      throw new PublishLinkNotFoundError();
    }

    await repository.revoke_public_viewer_sessions_for_publish_link({
      publish_link_id: publish_link.id,
    });

    return { publish_link };
  };

  const update_guide_publish_access = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
    visibility: PublishVisibility;
    expires_at: string | null;
  }) => {
    const access_input = validate_publish_access_input(input);

    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const result = await repository.update_publish_link_access({
      ...scope,
      artifact_type: "guide",
      artifact_id: input.guide_id,
      visibility: access_input.visibility,
      expires_at: access_input.expires_at,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!result) {
      throw new PublishLinkNotFoundError();
    }

    return result;
  };

  const update_interactive_demo_publish_access = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
    visibility: PublishVisibility;
    expires_at: string | null;
  }): Promise<InteractiveDemoPublishStatus> => {
    const access_input = validate_publish_access_input(input);

    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const result = await repository.update_publish_link_access({
      ...scope,
      artifact_type: "interactive_demo",
      artifact_id: input.interactive_demo_id,
      visibility: access_input.visibility,
      expires_at: access_input.expires_at,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!result) {
      throw new PublishLinkNotFoundError();
    }

    return result;
  };

  const update_guide_publish_password = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    guide_id: string;
    password: string | null;
  }) => {
    validate_publish_password_input(input.password);

    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const password_hash = input.password === null
      ? null
      : await hash_public_link_password(input.password);

    const result = await repository.update_publish_link_password({
      ...scope,
      artifact_type: "guide",
      artifact_id: input.guide_id,
      password_hash: password_hash?.hash ?? null,
      password_salt: password_hash?.salt ?? null,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!result?.publish_link) {
      throw new PublishLinkNotFoundError();
    }

    await repository.revoke_public_viewer_sessions_for_publish_link({
      publish_link_id: result.publish_link.id,
    });

    return result;
  };

  const update_interactive_demo_publish_password = async (input: {
    auth: PublishAuthContext;
    project_id: string;
    interactive_demo_id: string;
    password: string | null;
  }): Promise<InteractiveDemoPublishStatus> => {
    validate_publish_password_input(input.password);

    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };

    await ensure_project_exists(scope);

    const password_hash = input.password === null
      ? null
      : await hash_public_link_password(input.password);

    const result = await repository.update_publish_link_password({
      ...scope,
      artifact_type: "interactive_demo",
      artifact_id: input.interactive_demo_id,
      password_hash: password_hash?.hash ?? null,
      password_salt: password_hash?.salt ?? null,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!result?.publish_link) {
      throw new PublishLinkNotFoundError();
    }

    await repository.revoke_public_viewer_sessions_for_publish_link({
      publish_link_id: result.publish_link.id,
    });

    return result;
  };

  const assert_viewer_access = async (input: {
    result: PublicPublishResult;
    viewer_token?: string;
  }) => {
    if (!input.viewer_token) {
      assert_public_viewer_session_access({
        publish_link: input.result.publish_link,
        session: null,
        now: now(),
      });
      return;
    }

    const token_hash = hash_viewer_token(input.viewer_token);
    const session = await repository.find_public_viewer_session_by_token_hash({
      token_hash,
      publish_link_slug: input.result.publish_link.slug,
    });

    const access = assert_public_viewer_session_access({
      publish_link: input.result.publish_link,
      session,
      now: now(),
    });

    if (access.should_touch_session) {
      await repository.touch_public_viewer_session({ token_hash });
    }
  };

  const resolve_public_publish_link = async (input: {
    slug: string;
    viewer_token?: string;
  }) => {
    const result = await repository.find_active_publish_link_by_slug(input);

    if (!result) {
      throw new PublishLinkNotFoundError();
    }

    assert_public_publish_link_access({
      publish_link: result.publish_link,
      now: now(),
    });
    await assert_viewer_access({ result, viewer_token: input.viewer_token });

    return public_publish_response(result);
  };

  const create_public_publish_viewer_session = async (input: {
    slug: string;
    password: string;
  }): Promise<PublicViewerSession> => {
    const result = await repository.find_active_publish_link_by_slug({ slug: input.slug });

    if (!result) {
      throw new PublishLinkNotFoundError();
    }

    assert_public_publish_link_access({
      publish_link: result.publish_link,
      now: now(),
    });

    if (!result.publish_link.password_protected) {
      return {
        token: "",
        expires_at: now().toISOString(),
      };
    }

    if (!result.password || !result.publish_link_id) {
      throw new PublishLinkPasswordRequiredError();
    }

    const valid_password = await verify_public_link_password(
      input.password,
      result.password.hash,
      result.password.salt
    );

    assert_public_viewer_password_result(valid_password);

    const token = generate_viewer_token();
    const expires_at = public_viewer_session_expires_at(now());

    return await repository.create_public_viewer_session({
      publish_link_id: result.publish_link_id,
      token_hash: hash_viewer_token(token),
      token,
      expires_at,
    });
  };

  const get_public_published_asset_file = async (input: {
    slug: string;
    capture_asset_id: string;
    viewer_token?: string;
  }): Promise<PublishedAssetFileRead> => {
    if (!options.file_storage) {
      throw new PublishedAssetNotFoundError();
    }

    const public_result = await repository.find_active_publish_link_by_slug({ slug: input.slug });

    if (!public_result) {
      throw new PublishedAssetNotFoundError();
    }

    assert_public_publish_link_access({
      publish_link: public_result.publish_link,
      now: now(),
    });
    await assert_viewer_access({ result: public_result, viewer_token: input.viewer_token });

    const asset_file = await repository.find_public_asset_file(input);

    if (!asset_file) {
      throw new PublishedAssetNotFoundError();
    }

    if (asset_file.file.storage_provider !== "local") {
      throw new UnsupportedPublishedAssetStorageProviderError();
    }

    const stored_file = await options.file_storage.get({
      storage_key: asset_file.file.storage_key,
    });

    return {
      stream: stored_file.stream,
      size_bytes: stored_file.size_bytes,
      mime_type: asset_file.file.mime_type,
    };
  };

  return {
    publish_guide,
    publish_interactive_demo,
    get_guide_publish_status,
    get_interactive_demo_publish_status,
    revoke_guide_publish_link,
    revoke_interactive_demo_publish_link,
    update_guide_publish_access,
    update_interactive_demo_publish_access,
    update_guide_publish_password,
    update_interactive_demo_publish_password,
    resolve_public_publish_link,
    create_public_publish_viewer_session,
    get_public_published_asset_file,
  };
};
