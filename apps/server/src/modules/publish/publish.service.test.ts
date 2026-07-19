import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import type { GuideDetail } from "../guide/guide.service";
import type {
  DemoHotspot,
  DemoScene,
  InteractiveDemo,
} from "../interactive-demo/interactive-demo.service";
import {
  GuideHasNoPublishableBlocksError,
  GuideNotPublishableError,
  InteractiveDemoHasNoPublishableScenesError,
  PublishLinkPasswordRequiredError,
} from "@repo/publish-domain";
import {
  build_publish_service,
  GuideNotFoundError,
  InteractiveDemoNotFoundError,
  ProjectNotFoundError,
  PublishLinkNotFoundError,
  PublishedAssetNotFoundError,
  type PublishRepository,
} from "./publish.service";

const guide_detail: GuideDetail = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: "Set up departments.",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:00:00.000Z",
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  guide_blocks: [
    {
      id: "block_2",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_2",
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "step",
      content: null,
      block_index: 2,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:02:00.000Z",
      updated_at: "2026-06-05T00:02:00.000Z",
      step: {
        id: "step_2",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_2",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_2",
        source_capture_asset_id: null,
        title: "Click Add Department",
        body: null,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:02:00.000Z",
        updated_at: "2026-06-05T00:02:00.000Z",
      },
    },
    {
      id: "block_1",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: "asset_1",
      block_type: "step",
      content: {
        annotations: [
          {
            id: "ann_1",
            type: "highlight",
            x: 0.64,
            y: 0.12,
            width: 0.18,
            height: 0.08,
          },
        ],
      },
      block_index: 1,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:01:00.000Z",
      updated_at: "2026-06-05T00:01:00.000Z",
      step: {
        id: "step_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        title: "Navigate to Department List",
        body: "Open the Department module.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:01:00.000Z",
        updated_at: "2026-06-05T00:01:00.000Z",
      },
    },
    {
      id: "block_3",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "header",
      content: {
        title: "Department fields",
      },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:03:00.000Z",
      updated_at: "2026-06-05T00:03:00.000Z",
      step: null,
    },
    {
      id: "block_4",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "paragraph",
      content: {
        body: "Choose the right department settings before saving.",
      },
      block_index: 4,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:04:00.000Z",
      updated_at: "2026-06-05T00:04:00.000Z",
      step: null,
    },
    {
      id: "block_5",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "divider",
      content: null,
      block_index: 5,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:05:00.000Z",
      updated_at: "2026-06-05T00:05:00.000Z",
      step: null,
    },
  ],
  source_capture_assets: [
    {
      id: "asset_1",
      capture_session_id: "capture_session_1",
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 1,
      page_url: "https://example.test/departments",
      page_title: "Department List",
      captured_at: "2026-06-05T00:01:00.000Z",
      file_url:
        "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
      file: {
        id: "file_1",
        original_name: "departments.png",
        mime_type: "image/png",
        size_bytes: 123456,
      },
    },
    {
      id: "asset_2",
      capture_session_id: "capture_session_1",
      asset_type: "screenshot",
      width: 1280,
      height: 720,
      device_pixel_ratio: 1,
      page_url: "https://example.test/departments/new",
      page_title: "New Department",
      captured_at: "2026-06-05T00:02:00.000Z",
      file_url:
        "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_2/file",
      file: {
        id: "file_2",
        original_name: "new-department.png",
        mime_type: "image/png",
        size_bytes: 654321,
      },
    },
  ],
};

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const interactive_demo: InteractiveDemo = {
  id: "interactive_demo_1",
  organization_id: "organization_1",
  project_id: "project_1",
  source_capture_session_id: "capture_session_1",
  title: "Department demo",
  description: "Interactive department walkthrough.",
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const demo_scenes: DemoScene[] = [
  {
    id: "scene_2",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_id: "interactive_demo_1",
    source_capture_session_id: "capture_session_1",
    source_capture_event_id: "event_2",
    source_capture_asset_id: "asset_2",
    scene_index: 2,
    title: "Click Add Department",
    description: null,
    background_capture_asset_id: "asset_2",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:02:00.000Z",
    updated_at: "2026-06-05T00:02:00.000Z",
  },
  {
    id: "scene_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_id: "interactive_demo_1",
    source_capture_session_id: "capture_session_1",
    source_capture_event_id: "event_1",
    source_capture_asset_id: "asset_1",
    scene_index: 1,
    title: "Navigate to Department List",
    description: "Open the Department module.",
    background_capture_asset_id: "asset_1",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:01:00.000Z",
    updated_at: "2026-06-05T00:01:00.000Z",
  },
];

const demo_hotspots: DemoHotspot[] = [
  {
    id: "hotspot_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_id: "interactive_demo_1",
    demo_scene_id: "scene_1",
    hotspot_type: "click",
    label: "Continue",
    content: null,
    x: 0.62,
    y: 0.12,
    width: 0.16,
    height: 0.08,
    target_scene_id: "scene_2",
    hotspot_index: 1,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:01:00.000Z",
    updated_at: "2026-06-05T00:01:00.000Z",
  },
  {
    id: "hotspot_2",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_id: "interactive_demo_1",
    demo_scene_id: "scene_1",
    hotspot_type: "info",
    label: "Read first",
    content: "Check the department list before continuing.",
    x: 0.1,
    y: 0.8,
    width: 0.24,
    height: 0.1,
    target_scene_id: null,
    hotspot_index: 2,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:01:00.000Z",
    updated_at: "2026-06-05T00:01:00.000Z",
  },
];

const interactive_demo_detail = {
  interactive_demo,
  demo_scenes,
  demo_hotspots,
  source_capture_assets: guide_detail.source_capture_assets,
};

const create_repository = (
  overrides: Partial<PublishRepository> = {},
): PublishRepository => {
  const repository: PublishRepository = {
    transaction: async (work) => work(repository),
    project_exists: vi.fn(async () => true),
    find_guide_detail: vi.fn(async () => guide_detail),
    find_interactive_demo_detail: vi.fn(async () => interactive_demo_detail),
    find_active_publish_link: vi.fn(async () => null),
    next_published_artifact_version: vi.fn(async () => 1),
    create_published_artifact: vi.fn(async (input) => ({
      id: "published_artifact_1",
      artifact_type: input.artifact_type,
      artifact_id: input.artifact_id,
      version_number: input.version_number,
      title: input.title,
      published_at: "2026-06-10T00:00:00.000Z",
    })),
    create_publish_link: vi.fn(async (input) => ({
      id: "publish_link_1",
      artifact_type: input.artifact_type,
      artifact_id: input.artifact_id,
      published_artifact_id: input.published_artifact_id,
      slug: input.slug,
      visibility: "public" as const,
      status: "active" as const,
      published_at: "2026-06-10T00:00:00.000Z",
      revoked_at: null,
      expires_at: null,
      password_protected: false,
      public_url: `/p/${input.slug}`,
    })),
    update_publish_link_target: vi.fn(async (input) => ({
      id: input.publish_link_id,
      artifact_type: "guide" as const,
      artifact_id: "guide_1",
      published_artifact_id: input.published_artifact_id,
      slug: "existing-slug",
      visibility: "public" as const,
      status: "active" as const,
      published_at: "2026-06-10T00:00:00.000Z",
      revoked_at: null,
      expires_at: null,
      password_protected: false,
      public_url: "/p/existing-slug",
    })),
    find_publish_status: vi.fn(async () => null),
    revoke_active_publish_link: vi.fn(async () => null),
    update_publish_link_access: vi.fn(async () => null),
    update_publish_link_password: vi.fn(async () => null),
    create_public_viewer_session: vi.fn(async () => ({
      token: "viewer-token",
      expires_at: "2026-06-10T12:00:00.000Z",
    })),
    find_public_viewer_session_by_token_hash: vi.fn(async () => null),
    touch_public_viewer_session: vi.fn(async () => undefined),
    find_active_publish_link_by_slug: vi.fn(async () => null),
    find_public_asset_file: vi.fn(async () => null),
    ...overrides,
  };

  return repository;
};

describe("publish service", () => {
  it("publishes an interactive demo as an immutable scene and hotspot snapshot", async () => {
    const repository = create_repository();
    const service = build_publish_service(repository, {
      generate_slug: () => "demo123",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await service.publish_interactive_demo({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
    });

    expect(result.publish_link.slug).toBe("demo123");
    expect(repository.create_published_artifact).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "organization_1",
        project_id: "project_1",
        artifact_type: "interactive_demo",
        artifact_id: "interactive_demo_1",
        version_number: 1,
        title: "Department demo",
        actor_org_user_id: "org_user_1",
      }),
    );
    const snapshot = vi.mocked(repository.create_published_artifact).mock
      .calls[0]?.[0].snapshot_json;
    expect(snapshot).toEqual({
      artifact_type: "interactive_demo",
      schema_version: 1,
      interactive_demo: {
        id: "interactive_demo_1",
        title: "Department demo",
        description: "Interactive department walkthrough.",
        source_capture_session_id: "capture_session_1",
        published_version: 1,
        published_at: "2026-06-10T00:00:00.000Z",
      },
      scenes: [
        {
          id: "scene_1",
          scene_index: 1,
          title: "Navigate to Department List",
          description: "Open the Department module.",
          background_asset: {
            id: "asset_1",
            asset_type: "screenshot",
            width: 1440,
            height: 900,
            page_title: "Department List",
            page_url: "https://example.test/departments",
            file: {
              id: "file_1",
              original_name: "departments.png",
              mime_type: "image/png",
              size_bytes: 123456,
            },
            file_url:
              "/api/v1/public/publish-links/demo123/assets/asset_1/file",
          },
          hotspots: [
            {
              id: "hotspot_1",
              hotspot_type: "click",
              label: "Continue",
              content: null,
              x: 0.62,
              y: 0.12,
              width: 0.16,
              height: 0.08,
              target_scene_id: "scene_2",
              hotspot_index: 1,
            },
            {
              id: "hotspot_2",
              hotspot_type: "info",
              label: "Read first",
              content: "Check the department list before continuing.",
              x: 0.1,
              y: 0.8,
              width: 0.24,
              height: 0.1,
              target_scene_id: null,
              hotspot_index: 2,
            },
          ],
        },
        {
          id: "scene_2",
          scene_index: 2,
          title: "Click Add Department",
          description: null,
          background_asset: {
            id: "asset_2",
            asset_type: "screenshot",
            width: 1280,
            height: 720,
            page_title: "New Department",
            page_url: "https://example.test/departments/new",
            file: {
              id: "file_2",
              original_name: "new-department.png",
              mime_type: "image/png",
              size_bytes: 654321,
            },
            file_url:
              "/api/v1/public/publish-links/demo123/assets/asset_2/file",
          },
          hotspots: [],
        },
      ],
    });
    expect(JSON.stringify(snapshot)).not.toContain("organization_id");
    expect(JSON.stringify(snapshot)).not.toContain("storage_key");
  });

  it("rejects missing and empty interactive demos", async () => {
    await expect(
      build_publish_service(
        create_repository({
          project_exists: vi.fn(async () => false),
        }),
      ).publish_interactive_demo({
        auth,
        project_id: "project_1",
        interactive_demo_id: "interactive_demo_1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);

    await expect(
      build_publish_service(
        create_repository({
          find_interactive_demo_detail: vi.fn(async () => null),
        }),
      ).publish_interactive_demo({
        auth,
        project_id: "project_1",
        interactive_demo_id: "interactive_demo_1",
      }),
    ).rejects.toBeInstanceOf(InteractiveDemoNotFoundError);

    await expect(
      build_publish_service(
        create_repository({
          find_interactive_demo_detail: vi.fn(async () => ({
            ...interactive_demo_detail,
            demo_scenes: [],
          })),
        }),
      ).publish_interactive_demo({
        auth,
        project_id: "project_1",
        interactive_demo_id: "interactive_demo_1",
      }),
    ).rejects.toBeInstanceOf(InteractiveDemoHasNoPublishableScenesError);

    await expect(
      build_publish_service(
        create_repository({
          find_interactive_demo_detail: vi.fn(async () => ({
            ...interactive_demo_detail,
            demo_scenes: [
              { ...demo_scenes[0]!, background_capture_asset_id: null },
            ],
          })),
        }),
      ).publish_interactive_demo({
        auth,
        project_id: "project_1",
        interactive_demo_id: "interactive_demo_1",
      }),
    ).rejects.toBeInstanceOf(InteractiveDemoHasNoPublishableScenesError);
  });

  it("publishes a draft guide as an immutable safe snapshot", async () => {
    const repository = create_repository();
    const service = build_publish_service(repository, {
      generate_slug: () => "abc123",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await service.publish_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    });

    expect(result.publish_link.slug).toBe("abc123");
    expect(result.published_artifact.version_number).toBe(1);
    expect(repository.create_published_artifact).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "organization_1",
        project_id: "project_1",
        artifact_type: "guide",
        artifact_id: "guide_1",
        version_number: 1,
        title: "Department guide",
        actor_org_user_id: "org_user_1",
      }),
    );
    const snapshot = vi.mocked(repository.create_published_artifact).mock
      .calls[0]?.[0].snapshot_json;
    expect(snapshot).toEqual({
      artifact_type: "guide",
      guide: {
        id: "guide_1",
        title: "Department guide",
        description: "Set up departments.",
        source_capture_session_id: "capture_session_1",
        published_version: 1,
        published_at: "2026-06-10T00:00:00.000Z",
      },
      blocks: [
        {
          id: "block_1",
          block_type: "step",
          block_index: 1,
          content: {
            annotations: [
              {
                id: "ann_1",
                type: "highlight",
                x: 0.64,
                y: 0.12,
                width: 0.18,
                height: 0.08,
              },
            ],
          },
          step: {
            id: "step_1",
            title: "Navigate to Department List",
            body: "Open the Department module.",
          },
          source_asset: {
            id: "asset_1",
            asset_type: "screenshot",
            width: 1440,
            height: 900,
            page_title: "Department List",
            page_url: "https://example.test/departments",
            file: {
              id: "file_1",
              original_name: "departments.png",
              mime_type: "image/png",
              size_bytes: 123456,
            },
            file_url: "/api/v1/public/publish-links/abc123/assets/asset_1/file",
          },
        },
        {
          id: "block_2",
          block_type: "step",
          block_index: 2,
          content: null,
          step: {
            id: "step_2",
            title: "Click Add Department",
            body: null,
          },
          source_asset: null,
        },
        {
          id: "block_3",
          block_type: "header",
          block_index: 3,
          content: {
            title: "Department fields",
          },
          step: null,
          source_asset: null,
        },
        {
          id: "block_4",
          block_type: "paragraph",
          block_index: 4,
          content: {
            body: "Choose the right department settings before saving.",
          },
          step: null,
          source_asset: null,
        },
        {
          id: "block_5",
          block_type: "divider",
          block_index: 5,
          content: null,
          step: null,
          source_asset: null,
        },
      ],
    });
    expect(JSON.stringify(snapshot)).not.toContain("organization_id");
    expect(JSON.stringify(snapshot)).not.toContain("source_capture_event_id");
    expect(JSON.stringify(snapshot)).not.toContain("storage_key");
  });

  it("republishes with the same active slug but uses a new slug after revoke", async () => {
    const active_repository = create_repository({
      find_active_publish_link: vi.fn(async () => ({
        id: "publish_link_existing",
        artifact_type: "guide" as const,
        artifact_id: "guide_1",
        published_artifact_id: "published_artifact_1",
        slug: "existing-slug",
        visibility: "public" as const,
        status: "active" as const,
        published_at: "2026-06-10T00:00:00.000Z",
        revoked_at: null,
        expires_at: null,
        password_protected: false,
        public_url: "/p/existing-slug",
      })),
      next_published_artifact_version: vi.fn(async () => 2),
    });
    const service = build_publish_service(active_repository, {
      generate_slug: () => "new-slug",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await service.publish_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    });

    expect(result.publish_link.slug).toBe("existing-slug");
    expect(active_repository.create_publish_link).not.toHaveBeenCalled();
    expect(active_repository.update_publish_link_target).toHaveBeenCalledWith(
      expect.objectContaining({
        publish_link_id: "publish_link_existing",
        published_artifact_id: "published_artifact_1",
      }),
    );

    const revoked_repository = create_repository();
    const revoked_service = build_publish_service(revoked_repository, {
      generate_slug: () => "after-revoke",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });
    const revoked_result = await revoked_service.publish_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    });

    expect(revoked_result.publish_link.slug).toBe("after-revoke");
    expect(revoked_repository.create_publish_link).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "after-revoke",
      }),
    );
  });

  it("uses the same generated slug for the new link and snapshot asset URLs", async () => {
    const repository = create_repository();
    const slugs = ["snapshot-slug", "link-slug"];
    const service = build_publish_service(repository, {
      generate_slug: () => slugs.shift() ?? "unexpected-slug",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await service.publish_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    });
    const snapshot = vi.mocked(repository.create_published_artifact).mock
      .calls[0]?.[0].snapshot_json;

    expect(result.publish_link.slug).toBe("snapshot-slug");
    if (!snapshot) {
      throw new Error("Expected snapshot to be created");
    }
    if (snapshot.artifact_type !== "guide") {
      throw new Error("Expected guide snapshot");
    }
    expect(snapshot.blocks[0]?.source_asset?.file_url).toBe(
      `/api/v1/public/publish-links/${result.publish_link.slug}/assets/asset_1/file`,
    );
  });

  it("publishes selected screenshot assets and omits hidden screenshots", async () => {
    const selected_detail: GuideDetail = {
      ...guide_detail,
      guide_blocks: guide_detail.guide_blocks.map((block) => {
        if (block.id === "block_1") {
          return {
            ...block,
            selected_capture_asset_id: "asset_2",
            screenshot_hidden: false,
            display_capture_asset_id: "asset_2",
          };
        }

        if (block.id === "block_2") {
          return {
            ...block,
            source_capture_asset_id: "asset_1",
            selected_capture_asset_id: null,
            screenshot_hidden: true,
            display_capture_asset_id: null,
            step: block.step
              ? {
                  ...block.step,
                  source_capture_asset_id: "asset_1",
                }
              : null,
          };
        }

        return block;
      }),
    };
    const repository = create_repository({
      find_guide_detail: vi.fn(async () => selected_detail),
    });
    const service = build_publish_service(repository, {
      generate_slug: () => "abc123",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    await service.publish_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    });

    const snapshot = vi.mocked(repository.create_published_artifact).mock
      .calls[0]?.[0].snapshot_json;
    if (snapshot?.artifact_type !== "guide") {
      throw new Error("Expected guide snapshot");
    }
    expect(snapshot?.blocks[0]?.source_asset).toMatchObject({
      id: "asset_2",
      file_url: "/api/v1/public/publish-links/abc123/assets/asset_2/file",
    });
    expect(snapshot?.blocks[1]?.source_asset).toBeNull();
  });

  it("rejects missing archived and empty guides", async () => {
    await expect(
      build_publish_service(
        create_repository({
          project_exists: vi.fn(async () => false),
        }),
      ).publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);

    await expect(
      build_publish_service(
        create_repository({
          find_guide_detail: vi.fn(async () => null),
        }),
      ).publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" }),
    ).rejects.toBeInstanceOf(GuideNotFoundError);

    await expect(
      build_publish_service(
        create_repository({
          find_guide_detail: vi.fn(async () => ({
            ...guide_detail,
            guide: { ...guide_detail.guide, status: "archived" as const },
          })),
        }),
      ).publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" }),
    ).rejects.toBeInstanceOf(GuideNotPublishableError);

    await expect(
      build_publish_service(
        create_repository({
          find_guide_detail: vi.fn(async () => ({
            ...guide_detail,
            guide_blocks: [],
          })),
        }),
      ).publish_guide({ auth, project_id: "project_1", guide_id: "guide_1" }),
    ).rejects.toBeInstanceOf(GuideHasNoPublishableBlocksError);
  });

  it("reads status revokes active links and resolves public snapshots", async () => {
    const repository = create_repository({
      find_publish_status: vi.fn(async () => ({
        publish_link: {
          id: "publish_link_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          published_artifact_id: "published_artifact_1",
          slug: "abc123",
          visibility: "public" as const,
          status: "active" as const,
          published_at: "2026-06-10T00:00:00.000Z",
          revoked_at: null,
          expires_at: null,
          password_protected: false,
          public_url: "/p/abc123",
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
        },
      })),
      revoke_active_publish_link: vi.fn(async () => ({
        id: "publish_link_1",
        artifact_type: "guide" as const,
        artifact_id: "guide_1",
        published_artifact_id: "published_artifact_1",
        slug: "abc123",
        visibility: "public" as const,
        status: "revoked" as const,
        published_at: "2026-06-10T00:00:00.000Z",
        revoked_at: "2026-06-10T01:00:00.000Z",
        expires_at: null,
        password_protected: false,
        public_url: "/p/abc123",
      })),
      find_active_publish_link_by_slug: vi.fn(async () => ({
        publish_link: {
          slug: "abc123",
          artifact_type: "guide" as const,
          visibility: "public" as const,
          status: "active" as const,
          expires_at: null,
          password_protected: false,
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
          snapshot: { artifact_type: "guide", blocks: [] },
        },
      })),
    });
    const service = build_publish_service(repository);

    await expect(
      service.get_guide_publish_status({
        auth,
        project_id: "project_1",
        guide_id: "guide_1",
      }),
    ).resolves.toMatchObject({ publish_link: { slug: "abc123" } });
    await expect(
      service.revoke_guide_publish_link({
        auth,
        project_id: "project_1",
        guide_id: "guide_1",
      }),
    ).resolves.toMatchObject({ publish_link: { status: "revoked" } });
    await expect(
      service.resolve_public_publish_link({ slug: "abc123" }),
    ).resolves.toMatchObject({ publish_link: { slug: "abc123" } });
  });

  it("updates active guide publish link access settings", async () => {
    const repository = create_repository();
    const update_publish_link_access = vi.fn(async () => ({
      publish_link: {
        id: "publish_link_1",
        artifact_type: "guide" as const,
        artifact_id: "guide_1",
        published_artifact_id: "published_artifact_1",
        slug: "abc123",
        visibility: "restricted" as const,
        status: "active" as const,
        published_at: "2026-06-10T00:00:00.000Z",
        revoked_at: null,
        expires_at: null,
        public_url: "/p/abc123",
      },
      published_artifact: {
        id: "published_artifact_1",
        artifact_type: "guide" as const,
        artifact_id: "guide_1",
        version_number: 1,
        title: "Department guide",
        published_at: "2026-06-10T00:00:00.000Z",
      },
    }));
    (
      repository as unknown as {
        update_publish_link_access: typeof update_publish_link_access;
      }
    ).update_publish_link_access = update_publish_link_access;
    const service = build_publish_service(repository);

    await expect(
      (
        service as unknown as {
          update_guide_publish_access: (input: {
            auth: typeof auth;
            project_id: string;
            guide_id: string;
            visibility: "restricted";
            expires_at: string | null;
          }) => Promise<unknown>;
        }
      ).update_guide_publish_access({
        auth,
        project_id: "project_1",
        guide_id: "guide_1",
        visibility: "restricted",
        expires_at: null,
      }),
    ).resolves.toMatchObject({
      publish_link: {
        slug: "abc123",
        visibility: "restricted",
        expires_at: null,
      },
    });
    expect(update_publish_link_access).toHaveBeenCalledWith({
      actor_org_user_id: "org_user_1",
      organization_id: "organization_1",
      project_id: "project_1",
      artifact_type: "guide",
      artifact_id: "guide_1",
      visibility: "restricted",
      expires_at: null,
    });
  });

  it("delegates password changes to the repository's atomic link/session mutation", async () => {
    const repository = create_repository({
      update_publish_link_password: vi.fn(async () => ({
        publish_link: {
          id: "publish_link_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          published_artifact_id: "published_artifact_1",
          slug: "abc123",
          visibility: "public" as const,
          status: "active" as const,
          published_at: "2026-06-10T00:00:00.000Z",
          revoked_at: null,
          expires_at: null,
          password_protected: true,
          public_url: "/p/abc123",
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
        },
      })),
    });
    const service = build_publish_service(repository);

    await expect(
      service.update_guide_publish_password({
        auth,
        project_id: "project_1",
        guide_id: "guide_1",
        password: "shared password",
      }),
    ).resolves.toMatchObject({
      publish_link: {
        slug: "abc123",
        password_protected: true,
      },
    });
    expect(repository.update_publish_link_password).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "organization_1",
        project_id: "project_1",
        artifact_type: "guide",
        artifact_id: "guide_1",
        password_hash: expect.any(String),
        password_salt: expect.any(String),
      }),
    );
  });

  it("rejects invalid guide publish access settings before persistence", async () => {
    const repository = create_repository();
    const service = build_publish_service(repository);
    const update_access = (
      service as unknown as {
        update_guide_publish_access: (input: {
          auth: typeof auth;
          project_id: string;
          guide_id: string;
          visibility: "public";
          expires_at: string | null;
        }) => Promise<unknown>;
      }
    ).update_guide_publish_access;

    await expect(
      update_access({
        auth,
        project_id: "project_1",
        guide_id: "guide_1",
        visibility: "private" as never,
        expires_at: null,
      }),
    ).rejects.toThrow("Invalid publish access settings");

    await expect(
      update_access({
        auth,
        project_id: "project_1",
        guide_id: "guide_1",
        visibility: "public",
        expires_at: "not-a-date",
      }),
    ).rejects.toThrow("Invalid publish access settings");
    expect(repository.update_publish_link_access).not.toHaveBeenCalled();
  });

  it("rejects restricted and expired public publish links", async () => {
    const restricted_service = build_publish_service(
      create_repository({
        find_active_publish_link_by_slug: vi.fn(async () => ({
          publish_link: {
            slug: "abc123",
            artifact_type: "guide" as const,
            visibility: "restricted" as never,
            status: "active" as const,
            expires_at: null,
            password_protected: false,
          },
          published_artifact: {
            id: "published_artifact_1",
            artifact_type: "guide" as const,
            artifact_id: "guide_1",
            version_number: 1,
            title: "Department guide",
            published_at: "2026-06-10T00:00:00.000Z",
            snapshot: { artifact_type: "guide", blocks: [] },
          },
        })),
      }),
    );
    const expired_service = build_publish_service(
      create_repository({
        find_active_publish_link_by_slug: vi.fn(async () => ({
          publish_link: {
            slug: "abc123",
            artifact_type: "guide" as const,
            visibility: "public" as const,
            status: "active" as const,
            expires_at: "2026-06-09T23:59:59.000Z" as never,
            password_protected: false,
          },
          published_artifact: {
            id: "published_artifact_1",
            artifact_type: "guide" as const,
            artifact_id: "guide_1",
            version_number: 1,
            title: "Department guide",
            published_at: "2026-06-10T00:00:00.000Z",
            snapshot: { artifact_type: "guide", blocks: [] },
          },
        })),
      }),
      {
        now: () => new Date("2026-06-10T00:00:00.000Z"),
      },
    );

    await expect(
      restricted_service.resolve_public_publish_link({ slug: "abc123" }),
    ).rejects.toThrow("Publish link is not public");
    await expect(
      expired_service.resolve_public_publish_link({ slug: "abc123" }),
    ).rejects.toThrow("Publish link has expired");
  });

  it("requires a viewer session before resolving password protected public links", async () => {
    const repository = create_repository({
      find_active_publish_link_by_slug: vi.fn(async () => ({
        publish_link: {
          slug: "abc123",
          artifact_type: "guide" as const,
          visibility: "public" as const,
          status: "active" as const,
          expires_at: null,
          password_protected: true,
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
          snapshot: { artifact_type: "guide", blocks: [] },
        },
      })),
      find_public_viewer_session_by_token_hash: vi.fn(async () => null),
    });
    const service = build_publish_service(repository);

    await expect(
      service.resolve_public_publish_link({ slug: "abc123" }),
    ).rejects.toBeInstanceOf(PublishLinkPasswordRequiredError);

    await expect(
      service.resolve_public_publish_link({
        slug: "abc123",
        viewer_token: "viewer-token",
      }),
    ).rejects.toBeInstanceOf(PublishLinkPasswordRequiredError);
    expect(
      repository.find_public_viewer_session_by_token_hash,
    ).toHaveBeenCalledWith({
      token_hash: expect.any(String),
      publish_link_slug: "abc123",
    });
  });

  it("does not expose public password verifier internals when resolving authorized public links", async () => {
    const repository = create_repository({
      find_active_publish_link_by_slug: vi.fn(async () => ({
        publish_link: {
          slug: "abc123",
          artifact_type: "guide" as const,
          visibility: "public" as const,
          status: "active" as const,
          expires_at: null,
          password_protected: true,
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
          snapshot: { artifact_type: "guide", blocks: [] },
        },
        publish_link_id: "publish_link_1",
        password: {
          hash: "stored-password-hash",
          salt: "stored-password-salt",
        },
      })),
      find_public_viewer_session_by_token_hash: vi.fn(async () => ({
        publish_link_id: "publish_link_1",
        expires_at: "2026-06-10T12:00:00.000Z",
        revoked_at: null,
      })),
    });
    const service = build_publish_service(repository, {
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await service.resolve_public_publish_link({
      slug: "abc123",
      viewer_token: "viewer-token",
    });

    expect(result).not.toHaveProperty("publish_link_id");
    expect(result).not.toHaveProperty("password");
    expect(JSON.stringify(result)).not.toContain("stored-password");
  });

  it("creates scoped public viewer sessions for correct passwords", async () => {
    const repository = create_repository({
      find_active_publish_link_by_slug: vi.fn(async () => ({
        publish_link: {
          slug: "abc123",
          artifact_type: "guide" as const,
          visibility: "public" as const,
          status: "active" as const,
          expires_at: null,
          password_protected: true,
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
          snapshot: { artifact_type: "guide", blocks: [] },
        },
        password: await import("./public-link-password").then(
          async ({ hash_public_link_password }) =>
            hash_public_link_password("shared password"),
        ),
        publish_link_id: "publish_link_1",
      })),
      create_public_viewer_session: vi.fn(async (input) => ({
        token: input.token,
        expires_at: input.expires_at,
      })),
    });
    const service = build_publish_service(repository, {
      now: () => new Date("2026-06-10T00:00:00.000Z"),
      generate_viewer_token: () => "viewer-token",
    });

    await expect(
      service.create_public_publish_viewer_session({
        slug: "abc123",
        password: "shared password",
      }),
    ).resolves.toEqual({
      token: "viewer-token",
      expires_at: "2026-06-10T12:00:00.000Z",
    });
    expect(repository.create_public_viewer_session).toHaveBeenCalledWith({
      publish_link_id: "publish_link_1",
      token_hash: expect.any(String),
      token: "viewer-token",
      expires_at: "2026-06-10T12:00:00.000Z",
    });
  });

  it("checks public access before streaming published asset files", async () => {
    const repository = create_repository({
      find_active_publish_link_by_slug: vi.fn(async () => ({
        publish_link: {
          slug: "abc123",
          artifact_type: "guide" as const,
          visibility: "restricted" as never,
          status: "active" as const,
          expires_at: null,
          password_protected: false,
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
          snapshot: { artifact_type: "guide", blocks: [] },
        },
      })),
      find_public_asset_file: vi.fn(async () => ({
        file: {
          storage_provider: "local" as const,
          storage_key: "private/file.png",
          mime_type: "image/png",
        },
      })),
    });
    const file_storage = {
      get: vi.fn(async () => ({
        stream: Readable.from(Buffer.from("file")),
        size_bytes: 4,
      })),
    };
    const service = build_publish_service(repository, { file_storage });

    await expect(
      service.get_public_published_asset_file({
        slug: "abc123",
        capture_asset_id: "asset_1",
      }),
    ).rejects.toThrow("Publish link is not public");
    expect(repository.find_public_asset_file).not.toHaveBeenCalled();
    expect(file_storage.get).not.toHaveBeenCalled();
  });

  it("streams only assets referenced by the active snapshot", async () => {
    const repository = create_repository({
      find_active_publish_link_by_slug: vi.fn(async () => ({
        publish_link: {
          slug: "abc123",
          artifact_type: "guide" as const,
          visibility: "public" as const,
          status: "active" as const,
          expires_at: null,
          password_protected: false,
        },
        published_artifact: {
          id: "published_artifact_1",
          artifact_type: "guide" as const,
          artifact_id: "guide_1",
          version_number: 1,
          title: "Department guide",
          published_at: "2026-06-10T00:00:00.000Z",
          snapshot: { artifact_type: "guide", blocks: [] },
        },
      })),
      find_public_asset_file: vi.fn(async () => ({
        file: {
          storage_provider: "local" as const,
          storage_key:
            "organizations/org/projects/project/capture-sessions/session/file.png",
          mime_type: "image/png",
        },
      })),
    });
    const file_storage = {
      get: vi.fn(async () => ({
        stream: Readable.from(Buffer.from("file")),
        size_bytes: 4,
      })),
    };
    const service = build_publish_service(repository, { file_storage });

    const file = await service.get_public_published_asset_file({
      slug: "abc123",
      capture_asset_id: "asset_1",
    });

    expect(file.mime_type).toBe("image/png");
    expect(file.size_bytes).toBe(4);
    expect(file_storage.get).toHaveBeenCalledWith({
      storage_key:
        "organizations/org/projects/project/capture-sessions/session/file.png",
    });

    await expect(
      build_publish_service(
        create_repository(),
      ).get_public_published_asset_file({
        slug: "abc123",
        capture_asset_id: "missing",
      }),
    ).rejects.toBeInstanceOf(PublishedAssetNotFoundError);
    await expect(
      build_publish_service(create_repository()).resolve_public_publish_link({
        slug: "missing",
      }),
    ).rejects.toBeInstanceOf(PublishLinkNotFoundError);
  });
});
