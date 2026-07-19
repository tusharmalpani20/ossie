import { describe, expect, it } from "vitest";
import type { CaptureAsset } from "../capture-asset/capture-asset.service";
import type { CaptureEvent } from "../capture-event/capture-event.service";
import {
  build_capture_session_service,
  CaptureSessionNotFoundError,
  CaptureSessionNotCompletableError,
  CaptureSessionProjectVersionLockedError,
  EmptyCaptureSessionUpdateError,
  ProjectNotFoundError,
  type CaptureSession,
  type CaptureSessionRepository,
} from "./capture-session.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const capture_session: CaptureSession = {
  id: "capture_session_1",
  organization_id: "organization_1",
  project_id: "project_1",
  project_version_id: "version_1",
  project_version: {
    id: "version_1",
    name: "Main",
    slug: "main",
    status: "active",
    position: 1,
  },
  name: "Create department workflow",
  description: "Source capture for the department setup guide",
  status: "draft",
  source_type: "manual",
  started_at: null,
  completed_at: null,
  canceled_at: null,
  start_url: "https://example.internal/app/department",
  browser_name: "Chrome",
  browser_version: "126",
  operating_system: "Linux",
  viewport_width: 1440,
  viewport_height: 900,
  device_pixel_ratio: 1,
  user_agent: "Mozilla/5.0",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const capture_event: CaptureEvent = {
  id: "capture_event_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: "capture_asset_1",
  event_type: "capture",
  event_index: 1,
  occurred_at: "2026-06-05T00:01:00.000Z",
  page_url: "https://example.internal/app/department",
  page_title: "Department",
  target_label: null,
  target_selector: null,
  target_role: null,
  target_test_id: null,
  target_text: null,
  client_x: null,
  client_y: null,
  viewport_width: 1440,
  viewport_height: 900,
  device_pixel_ratio: 1,
  input_intent: null,
  input_value_redacted: true,
  note: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:01:00.000Z",
  updated_at: "2026-06-05T00:01:00.000Z",
};

const capture_asset: CaptureAsset = {
  id: "capture_asset_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_1",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 123,
    original_name: "screenshot.png",
    checksum_sha256: "checksum",
  },
      asset_type: "screenshot",
      status: "active",
  width: 1440,
  height: 900,
  device_pixel_ratio: 1,
  page_url: "https://example.internal/app/department",
  page_title: "Department",
  captured_at: "2026-06-05T00:01:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:01:00.000Z",
  updated_at: "2026-06-05T00:01:00.000Z",
};

const build_repository = (): CaptureSessionRepository & {
  project_checks: unknown[];
  creates: unknown[];
  lists: unknown[];
  finds: unknown[];
  details: unknown[];
  updates: unknown[];
  completions: unknown[];
  deletes: unknown[];
  reassignments: unknown[];
} => {
  const project_checks: unknown[] = [];
  const creates: unknown[] = [];
  const lists: unknown[] = [];
  const finds: unknown[] = [];
  const details: unknown[] = [];
  const updates: unknown[] = [];
  const completions: unknown[] = [];
  const deletes: unknown[] = [];
  const reassignments: unknown[] = [];

  return {
    project_checks,
    creates,
    lists,
    finds,
    details,
    updates,
    completions,
    deletes,
    reassignments,
    async project_exists(input) {
      project_checks.push(input);
      return input.project_id === "project_1";
    },
    async create_capture_session(input) {
      creates.push(input);
      return {
        ...capture_session,
        ...input.data,
        status: input.data.start_immediately ? "capturing" : "draft",
        started_at: input.data.start_immediately
          ? "2026-06-05T00:00:00.000Z"
          : null,
        organization_id: input.organization_id,
        project_id: input.project_id,
        created_by_id: input.actor_org_user_id,
        updated_by_id: input.actor_org_user_id,
      };
    },
    async list_capture_sessions(input) {
      lists.push(input);
      return [capture_session];
    },
    async find_capture_session(input) {
      finds.push(input);
      return input.capture_session_id === "capture_session_1"
        ? capture_session
        : null;
    },
    async get_capture_session_detail(input) {
      details.push(input);

      if (input.capture_session_id === "missing") {
        return null;
      }

      if (input.capture_session_id === "empty") {
        return {
          capture_session: {
            ...capture_session,
            id: "empty",
          },
          capture_events: [],
          capture_assets: [],
        };
      }

      return {
        capture_session,
        capture_events: [capture_event],
        capture_assets: [capture_asset],
      };
    },
    async update_capture_session(input) {
      updates.push(input);
      if (input.capture_session_id !== "capture_session_1") {
        return null;
      }

      return {
        ...capture_session,
        ...input.data,
        status: input.data.status ?? capture_session.status,
        started_at:
          input.data.status === "capturing"
            ? "2026-06-05T00:00:01.000Z"
            : capture_session.started_at,
        completed_at:
          input.data.status === "completed"
            ? "2026-06-05T00:00:02.000Z"
            : capture_session.completed_at,
        canceled_at:
          input.data.status === "canceled"
            ? "2026-06-05T00:00:03.000Z"
            : capture_session.canceled_at,
        updated_by_id: input.actor_org_user_id,
        version: 2,
      };
    },
    async complete_capture_session(input) {
      completions.push(input);

      if (input.capture_session_id === "missing") {
        return {
          outcome: "not_found",
          capture_session: null,
        };
      }

      if (input.capture_session_id === "canceled") {
        return {
          outcome: "not_completable",
          capture_session: {
            ...capture_session,
            id: "canceled",
            status: "canceled",
          },
        };
      }

      if (input.capture_session_id === "completed") {
        return {
          outcome: "already_completed",
          capture_session: {
            ...capture_session,
            id: "completed",
            status: "completed",
            completed_at: "2026-06-05T00:00:02.000Z",
            version: 2,
          },
        };
      }

      return {
        outcome: "completed",
        capture_session: {
          ...capture_session,
          status: "completed",
          completed_at: "2026-06-05T00:00:02.000Z",
          updated_by_id: input.actor_org_user_id,
          version: 2,
        },
      };
    },
    async delete_capture_session(input) {
      deletes.push(input);
      return input.capture_session_id === "capture_session_1";
    },
    async reassign_project_version(input) {
      reassignments.push(input);
      if (input.capture_session_id === "locked")
        return { outcome: "locked", capture_session: null };
      return {
        outcome: "reassigned",
        capture_session: {
          ...capture_session,
          project_version_id: input.project_version_id,
          project_version: {
            id: input.project_version_id,
            name: "2.0",
            slug: "2-0",
            status: "active",
            position: 2,
          },
          version: 2,
        },
      };
    },
  };
};

describe("capture session service", () => {
  it("completes capture sessions and returns the portal redirect target", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.complete_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      }),
    ).resolves.toEqual({
      capture_session: {
        ...capture_session,
        status: "completed",
        completed_at: "2026-06-05T00:00:02.000Z",
        updated_by_id: "org_user_1",
        version: 2,
      },
      redirect: {
        path: "/projects/project_1/versions/main/capture-sessions/capture_session_1",
        reason: "capture_session_completed",
      },
    });

    expect(repository.project_checks).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
      },
    ]);
    expect(repository.completions).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        actor_org_user_id: "org_user_1",
      },
    ]);
  });

  it("reassigns only through the dedicated repository command", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);
    await expect(
      service.reassign_project_version({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: { project_version_id: "version_2", expected_version: 1 },
      }),
    ).resolves.toMatchObject({ project_version_id: "version_2", version: 2 });
    expect(repository.reassignments).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        project_version_id: "version_2",
        expected_version: 1,
        actor_org_user_id: "org_user_1",
      },
    ]);
    await expect(
      service.reassign_project_version({
        auth,
        project_id: "project_1",
        capture_session_id: "locked",
        data: { project_version_id: "version_2", expected_version: 1 },
      }),
    ).rejects.toBeInstanceOf(CaptureSessionProjectVersionLockedError);
  });

  it("treats already completed capture sessions as idempotent success", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.complete_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "completed",
      }),
    ).resolves.toMatchObject({
      capture_session: {
        id: "completed",
        status: "completed",
        completed_at: "2026-06-05T00:00:02.000Z",
        version: 2,
      },
      redirect: {
        path: "/projects/project_1/versions/main/capture-sessions/completed",
        reason: "capture_session_completed",
      },
    });
  });

  it("maps missing and non-completable capture sessions", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.complete_capture_session({
        auth,
        project_id: "missing",
        capture_session_id: "capture_session_1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(
      service.complete_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "missing",
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);
    await expect(
      service.complete_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "canceled",
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotCompletableError);

    expect(repository.completions).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "missing",
        actor_org_user_id: "org_user_1",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "canceled",
        actor_org_user_id: "org_user_1",
      },
    ]);
  });

  it("creates capture sessions under an accessible project using auth context", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.create_capture_session({
        auth,
        project_id: "project_1",
        data: {
          name: " Create department workflow ",
          project_version_id: "version_1",
          start_immediately: true,
          description: "",
          source_type: "extension",
          status: "completed",
          started_at: "attacker timestamp",
          viewport_width: 1440,
          viewport_height: 900,
          device_pixel_ratio: 2,
          metadata: {
            capture_mode: "screenshot",
          },
        },
      }),
    ).resolves.toMatchObject({
      name: "Create department workflow",
      description: null,
      source_type: "extension",
      status: "capturing",
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
    });

    expect(repository.project_checks).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
      },
    ]);
    expect(repository.creates).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        actor_org_user_id: "org_user_1",
        data: {
          name: "Create department workflow",
          project_version_id: "version_1",
          start_immediately: true,
          description: null,
          source_type: "extension",
          start_url: undefined,
          browser_name: undefined,
          browser_version: undefined,
          operating_system: undefined,
          viewport_width: 1440,
          viewport_height: 900,
          device_pixel_ratio: 2,
          user_agent: undefined,
          metadata: {
            capture_mode: "screenshot",
          },
        },
      },
    ]);
  });

  it("rejects create when the project is missing or deleted", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.create_capture_session({
        auth,
        project_id: "missing",
        data: {
          name: "Capture",
          project_version_id: "version_1",
        },
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("lists and gets capture sessions scoped to the current project and organization", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.list_capture_sessions({
        auth,
        project_id: "project_1",
        project_version_id: "version_1",
      }),
    ).resolves.toEqual([capture_session]);
    await expect(
      service.list_capture_sessions({
        auth,
        project_id: "project_1",
        project_version_id: "version_1",
        status: "completed",
      }),
    ).resolves.toEqual([capture_session]);
    await expect(
      service.get_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      }),
    ).resolves.toEqual(capture_session);
    await expect(
      service.get_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "missing",
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    expect(repository.lists).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        project_version_id: "version_1",
        status: undefined,
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        project_version_id: "version_1",
        status: "completed",
      },
    ]);
    expect(repository.finds).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "missing",
      },
    ]);
  });

  it("gets capture session detail and adds relative asset file URLs", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.get_capture_session_detail({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      }),
    ).resolves.toEqual({
      capture_session,
      capture_events: [capture_event],
      capture_assets: [
        {
          ...capture_asset,
          file_url:
            "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/file",
        },
      ],
    });

    await expect(
      service.get_capture_session_detail({
        auth,
        project_id: "project_1",
        capture_session_id: "empty",
      }),
    ).resolves.toMatchObject({
      capture_session: {
        id: "empty",
      },
      capture_events: [],
      capture_assets: [],
    });

    expect(repository.project_checks).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
      },
    ]);
    expect(repository.details).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "empty",
      },
    ]);
  });

  it("maps missing project and capture session for capture session detail", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.get_capture_session_detail({
        auth,
        project_id: "missing",
        capture_session_id: "capture_session_1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(
      service.get_capture_session_detail({
        auth,
        project_id: "project_1",
        capture_session_id: "missing",
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    expect(repository.details).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "missing",
      },
    ]);
  });

  it("updates capture sessions and lets the repository manage lifecycle timestamps", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.update_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: {
          name: " Updated Capture ",
          description: "",
          status: "capturing",
          started_at: "attacker timestamp",
        },
      }),
    ).resolves.toMatchObject({
      name: "Updated Capture",
      description: null,
      status: "capturing",
      started_at: "2026-06-05T00:00:01.000Z",
      updated_by_id: "org_user_1",
      version: 2,
    });
    await expect(
      service.update_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: {},
      }),
    ).rejects.toBeInstanceOf(EmptyCaptureSessionUpdateError);
    await expect(
      service.update_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "missing",
        data: {
          name: "Updated Capture",
        },
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    expect(repository.updates).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        actor_org_user_id: "org_user_1",
        data: {
          name: "Updated Capture",
          description: null,
          status: "capturing",
        },
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "missing",
        actor_org_user_id: "org_user_1",
        data: {
          name: "Updated Capture",
        },
      },
    ]);
  });

  it("soft deletes capture sessions using auth context", async () => {
    const repository = build_repository();
    const service = build_capture_session_service(repository);

    await expect(
      service.delete_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      }),
    ).resolves.toBeUndefined();
    await expect(
      service.delete_capture_session({
        auth,
        project_id: "project_1",
        capture_session_id: "missing",
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    expect(repository.deletes).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        actor_org_user_id: "org_user_1",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "missing",
        actor_org_user_id: "org_user_1",
      },
    ]);
  });
});
