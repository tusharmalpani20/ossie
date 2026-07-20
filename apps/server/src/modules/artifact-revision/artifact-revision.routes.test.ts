import fastify from "fastify";
import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import {
  ArtifactEditionNotFoundError,
  ArtifactRevisionNotFoundError,
} from "./artifact-revision.service";
import { build_artifact_revision_routes } from "./artifact-revision.routes";

const auth = {
  user: { id: "user_1", email: "user@example.com", display_name: "User" },
  organization: { id: "org_1" },
  org_user: { id: "org_user_1" },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-21T00:00:00.000Z",
  },
} as never;
const summary = {
  id: "revision_1",
  edition_id: "edition_1",
  revision_number: 1,
  trigger: "manual_checkpoint" as const,
  title: "Guide",
  description: null,
  source_working_draft_version: 2,
  created_by_id: "org_user_1",
  created_at: "2026-07-19T00:00:00.000Z",
};

const build = async (overrides: Record<string, unknown> = {}) => {
  const service = {
    checkpoint_guide: vi
      .fn()
      .mockResolvedValue({ revision: summary, reused: false }),
    list_guide_revisions: vi
      .fn()
      .mockResolvedValue({
        revisions: [summary],
        next_before_revision_number: null,
      }),
    get_guide_revision: vi
      .fn()
      .mockResolvedValue({
        revision: summary,
        guide_blocks: [],
        capture_assets: [],
      }),
    restore_guide_revision: vi
      .fn()
      .mockResolvedValue({ revision: summary, restored: true }),
    checkpoint_interactive_demo: vi
      .fn()
      .mockResolvedValue({ revision: summary, reused: true }),
    list_interactive_demo_revisions: vi
      .fn()
      .mockResolvedValue({
        revisions: [summary],
        next_before_revision_number: null,
      }),
    get_interactive_demo_revision: vi
      .fn()
      .mockResolvedValue({
        revision: summary,
        demo_scenes: [],
        capture_assets: [],
      }),
    restore_interactive_demo_revision: vi
      .fn()
      .mockResolvedValue({ revision: summary, restored: true }),
    ...overrides,
  };
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(
    build_artifact_revision_routes({
      auth_service: {
        get_current_auth_context: vi.fn().mockResolvedValue(auth),
      },
      artifact_revision_service: service as never,
    }),
    { prefix: "/api/v1/projects" },
  );
  return { app, service };
};

describe("Artifact Revision routes", () => {
  it("returns 201 for a new checkpoint and 200 for reused Demo content", async () => {
    const { app } = await build();
    const guide = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/revisions/checkpoint?project_version_id=version_1",
      payload: {
        expected_edition_version: 1,
        expected_working_draft_version: 2,
      },
    });
    const demo = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/interactive-demos/demo_1/revisions/checkpoint?project_version_id=version_1",
      payload: {
        expected_edition_version: 1,
        expected_working_draft_version: 2,
      },
    });
    expect(guide.statusCode).toBe(201);
    expect(demo.statusCode).toBe(200);
  });

  it("validates list pagination and maps tenant-safe missing resources", async () => {
    const { app } = await build({
      get_guide_revision: vi
        .fn()
        .mockRejectedValue(new ArtifactRevisionNotFoundError()),
      checkpoint_guide: vi
        .fn()
        .mockRejectedValue(new ArtifactEditionNotFoundError()),
    });
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/projects/project_1/guides/guide_1/revisions?project_version_id=version_1&limit=101",
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/projects/project_1/guides/guide_1/revisions/3?project_version_id=version_1",
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/projects/project_1/guides/guide_1/revisions/checkpoint?project_version_id=version_1",
          payload: {
            expected_edition_version: 1,
            expected_working_draft_version: 2,
          },
        })
      ).statusCode,
    ).toBe(404);
  });
});
