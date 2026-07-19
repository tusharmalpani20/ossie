import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { build } from "../app";
import { pool } from "../config/database.config";
import { reset_test_database } from "../test-support/database";

const multipart_payload = (
  parts: Array<{
    name: string;
    value: string | Buffer;
    filename?: string;
    content_type?: string;
  }>,
) => {
  const boundary = "----ossie-v1-smoke-boundary";
  const chunks: Buffer[] = [];

  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${part.name}"${
          part.filename ? `; filename="${part.filename}"` : ""
        }\r\n`,
      ),
    );
    if (part.content_type) {
      chunks.push(Buffer.from(`Content-Type: ${part.content_type}\r\n`));
    }
    chunks.push(Buffer.from("\r\n"));
    chunks.push(
      Buffer.isBuffer(part.value) ? part.value : Buffer.from(part.value),
    );
    chunks.push(Buffer.from("\r\n"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
    payload: Buffer.concat(chunks),
  };
};

describe("v1 dogfood smoke workflow", () => {
  let storage_root: string;
  let previous_storage_root: string | undefined;
  let previous_max_upload_bytes: string | undefined;

  beforeEach(async () => {
    storage_root = await mkdtemp(path.join(tmpdir(), "ossie-v1-smoke-"));
    previous_storage_root = process.env.OSSIE_LOCAL_STORAGE_ROOT;
    previous_max_upload_bytes = process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES;
    process.env.OSSIE_LOCAL_STORAGE_ROOT = storage_root;
    process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES = "1048576";
    await reset_test_database();
  });

  afterEach(async () => {
    if (previous_storage_root === undefined) {
      delete process.env.OSSIE_LOCAL_STORAGE_ROOT;
    } else {
      process.env.OSSIE_LOCAL_STORAGE_ROOT = previous_storage_root;
    }

    if (previous_max_upload_bytes === undefined) {
      delete process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES;
    } else {
      process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES = previous_max_upload_bytes;
    }

    await rm(storage_root, { recursive: true, force: true });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates publishable guide and demo artifacts from one capture and accepts a teammate invite", async () => {
    const app = build({ logger: false });

    const health_response = await app.inject({
      method: "GET",
      url: "/healthz",
    });
    const readiness_response = await app.inject({
      method: "GET",
      url: "/readyz",
    });

    expect(health_response.statusCode).toBe(200);
    expect(health_response.json()).toMatchObject({
      status: "ok",
      service: "ossie-api",
    });
    expect(readiness_response.statusCode).toBe(200);
    expect(readiness_response.json()).toMatchObject({
      status: "ready",
      checks: {
        database: "ok",
      },
    });

    const setup_response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "owner@example.com",
          password: "safe local password",
          first_name: "Owner",
          last_name: "User",
        },
        organization: {
          name: "V1 Smoke Org",
        },
      },
    });

    expect(setup_response.statusCode).toBe(201);
    const owner_session =
      setup_response.cookies.find((cookie) => cookie.name === "ossie_session")
        ?.value ?? "";
    expect(owner_session).not.toBe("");

    const project_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: { ossie_session: owner_session },
      payload: {
        name: "V1 Dogfood Project",
        description: "Smoke source project",
        slug: "v1-dogfood-project",
      },
    });

    expect(project_response.statusCode).toBe(201);
    const project_id = project_response.json().project.id as string;
    const project_version_id = project_response.json().project
      .default_project_version.id as string;
    expect(
      project_response.json().project.default_project_version,
    ).toMatchObject({
      name: "Main",
      slug: "main",
      status: "active",
    });
    const named_version_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/versions`,
      cookies: { ossie_session: owner_session },
      payload: { name: "Summer 2026" },
    });
    expect(named_version_response.statusCode).toBe(201);
    const named_version = named_version_response.json().project_version as {
      id: string;
      version: number;
    };
    const renamed_version_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/versions/${named_version.id}`,
      cookies: { ossie_session: owner_session },
      payload: {
        expected_version: named_version.version,
        slug: "summer-release",
      },
    });
    expect(renamed_version_response.statusCode, renamed_version_response.body).toBe(200);
    const alias_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/versions/resolve/summer-2026`,
      cookies: { ossie_session: owner_session },
    });
    expect(alias_response.statusCode).toBe(200);
    expect(alias_response.json()).toMatchObject({
      resolution: "alias",
      project_version: { id: named_version.id, slug: "summer-release" },
    });
    const project_audit = await pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM audit_schema.audit_event WHERE project_id = $1 AND action = 'project.created'",
      [project_id],
    );
    expect(Number(project_audit.rows[0]?.count)).toBe(1);

    const capture_session_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions`,
      cookies: { ossie_session: owner_session },
      payload: {
        name: "Create department workflow",
        project_version_id,
        description: "Dogfood capture for guides and interactive demos",
        source_type: "manual",
        start_url: "https://example.test/departments",
        browser_name: "Chrome",
        browser_version: "126",
        operating_system: "Linux",
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 1,
      },
    });

    expect(capture_session_response.statusCode).toBe(201);
    const capture_session_id = capture_session_response.json().capture_session
      .id as string;

    const bytes = Buffer.from("fake png bytes for v1 dogfood smoke");
    const upload_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/upload`,
      cookies: { ossie_session: owner_session },
      ...multipart_payload([
        {
          name: "file",
          filename: "department-list.png",
          content_type: "image/png",
          value: bytes,
        },
        { name: "width", value: "1440" },
        { name: "height", value: "900" },
        { name: "device_pixel_ratio", value: "1" },
        { name: "page_url", value: "https://example.test/departments" },
        { name: "page_title", value: "Department List" },
      ]),
    });

    expect(upload_response.statusCode).toBe(201);
    const capture_asset_id = upload_response.json().capture_asset.id as string;

    const capture_event_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: owner_session },
      payload: {
        event_type: "click",
        event_index: 1,
        capture_asset_id,
        occurred_at: "2026-06-16T10:00:00.000Z",
        page_url: "https://example.test/departments",
        page_title: "Department List",
        target_label: "Add Department",
        target_text: "Add Department",
        client_x: 1210,
        client_y: 78,
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 1,
        metadata: {
          capture_mode: "dogfood-smoke",
        },
      },
    });

    expect(capture_event_response.statusCode).toBe(201);
    const capture_event_id = capture_event_response.json().capture_event
      .id as string;

    const complete_capture_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}`,
      cookies: { ossie_session: owner_session },
      payload: {
        status: "completed",
      },
    });

    expect(complete_capture_response.statusCode).toBe(200);
    expect(complete_capture_response.json().capture_session).toMatchObject({
      id: capture_session_id,
      status: "completed",
    });

    const guide_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { ossie_session: owner_session },
      payload: {
        title: "Department setup guide",
        selected_capture_event_ids: [capture_event_id],
      },
    });

    expect(guide_response.statusCode, guide_response.body).toBe(201);
    const guide_id = guide_response.json().artifact.id as string;
    expect(guide_response.json().guide_blocks).toHaveLength(1);
    expect(guide_response.json().guide_blocks[0]).toMatchObject({
      step: {
        source_capture_event_id: capture_event_id,
        source_capture_asset_id: capture_asset_id,
        title: 'Click "Add Department"',
      },
    });

    const guide_publish_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish?project_version_id=${project_version_id}`,
      cookies: { ossie_session: owner_session },
    });

    expect(guide_publish_response.statusCode).toBe(201);
    expect(guide_publish_response.json().publish_link).toMatchObject({
      artifact_type: "guide",
      artifact_id: guide_id,
      status: "active",
      visibility: "public",
    });
    const guide_slug = guide_publish_response.json().publish_link
      .slug as string;

    const public_guide_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${guide_slug}`,
      headers: { "x-ossie-access-surface": "public_reader" },
    });

    expect(public_guide_response.statusCode).toBe(200);
    expect(
      public_guide_response.json().published_artifact.snapshot,
    ).toMatchObject({
      artifact_type: "guide",
      guide: {
        id: guide_id,
        title: "Department setup guide",
      },
      blocks: [
        {
          source_asset: {
            id: capture_asset_id,
            file_url: `/api/v1/public/publish-links/${guide_slug}/assets/${capture_asset_id}/file`,
          },
        },
      ],
    });
    expect(JSON.stringify(public_guide_response.json())).not.toContain(
      "storage_key",
    );

    const public_asset_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${guide_slug}/assets/${capture_asset_id}/file`,
    });
    expect(public_asset_response.statusCode).toBe(200);
    expect(public_asset_response.rawPayload).toEqual(bytes);

    const demo_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/interactive-demos`,
      cookies: { ossie_session: owner_session },
      payload: {},
    });

    expect(
      demo_response.statusCode,
      demo_response.body,
    ).toBe(201);
    const interactive_demo_id = demo_response.json().artifact
      .id as string;
    const scene_id = demo_response.json().demo_scenes[0].id as string;
    expect(demo_response.json().edition).toMatchObject({
      interactive_demo_id,
      source_capture_session_id: capture_session_id,
      title: "Create department workflow",
    });
    expect(demo_response.json().demo_scenes).toEqual([
      expect.objectContaining({
        id: scene_id,
        source_capture_event_id: capture_event_id,
        background_capture_asset_id: capture_asset_id,
        title: "Click Add Department",
      }),
    ]);

    const hotspot_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/scenes/${scene_id}/hotspots?project_version_id=${project_version_id}`,
      cookies: { ossie_session: owner_session },
      payload: {
        hotspot_type: "info",
        label: "Add Department",
        content: "Open the department creation form.",
        x: 0.75,
        y: 0.08,
        width: 0.18,
        height: 0.1,
        expected_working_draft_version: demo_response.json().working_draft.version,
      },
    });

    expect(hotspot_response.statusCode).toBe(201);
    expect(hotspot_response.json().demo_hotspot).toMatchObject({
      demo_scene_id: scene_id,
      hotspot_type: "info",
      label: "Add Department",
    });

    const demo_publish_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/publish?project_version_id=${project_version_id}`,
      cookies: { ossie_session: owner_session },
    });

    expect(demo_publish_response.statusCode).toBe(201);
    expect(demo_publish_response.json().publish_link).toMatchObject({
      artifact_type: "interactive_demo",
      artifact_id: interactive_demo_id,
      status: "active",
      visibility: "public",
    });
    const demo_slug = demo_publish_response.json().publish_link.slug as string;

    const public_demo_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${demo_slug}`,
      headers: { "x-ossie-access-surface": "public_embed" },
    });

    expect(public_demo_response.statusCode).toBe(200);
    expect(
      public_demo_response.json().published_artifact.snapshot,
    ).toMatchObject({
      artifact_type: "interactive_demo",
      interactive_demo: {
        id: interactive_demo_id,
        title: "Create department workflow",
      },
      scenes: [
        {
          id: scene_id,
          background_asset: {
            id: capture_asset_id,
            file_url: `/api/v1/public/publish-links/${demo_slug}/assets/${capture_asset_id}/file`,
          },
          hotspots: [
            {
              hotspot_type: "info",
              label: "Add Department",
            },
          ],
        },
      ],
    });
    expect(JSON.stringify(public_demo_response.json())).not.toContain(
      "storage_key",
    );

    const invite_response = await app.inject({
      method: "POST",
      url: "/api/v1/organization/invites",
      cookies: { ossie_session: owner_session },
      payload: {
        email: "teammate@example.com",
        role: "member",
      },
    });

    expect(invite_response.statusCode).toBe(201);
    const invite_token = invite_response.json().invite_token as string;
    expect(invite_token).not.toBe("");

    const accept_invite_response = await app.inject({
      method: "POST",
      url: `/api/v1/public/invites/${invite_token}/accept`,
      payload: {
        password: "safe teammate password",
        display_name: "Teammate User",
      },
    });

    expect(accept_invite_response.statusCode).toBe(200);
    const teammate_session =
      accept_invite_response.cookies.find(
        (cookie) => cookie.name === "ossie_session",
      )?.value ?? "";
    expect(teammate_session).not.toBe("");
    expect(accept_invite_response.json().auth.org_user.role).toBe("member");
    const teammate_org_user_id = accept_invite_response.json().auth.org_user
      .id as string;

    const hidden_projects_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects",
      cookies: { ossie_session: teammate_session },
    });
    expect(hidden_projects_response.statusCode).toBe(200);
    expect(hidden_projects_response.json().projects).toEqual([]);

    const assign_membership_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/memberships`,
      cookies: { ossie_session: owner_session },
      payload: { org_user_id: teammate_org_user_id, role: "viewer" },
    });
    expect(assign_membership_response.statusCode).toBe(201);

    const teammate_projects_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects",
      cookies: { ossie_session: teammate_session },
    });

    expect(teammate_projects_response.statusCode).toBe(200);
    expect(teammate_projects_response.json().projects).toEqual([
      expect.objectContaining({
        id: project_id,
        name: "V1 Dogfood Project",
      }),
    ]);

    const member_compliance_response = await app.inject({
      method: "GET",
      url: "/api/v1/organization/compliance/events",
      cookies: { ossie_session: teammate_session },
    });
    expect(member_compliance_response.statusCode).toBe(403);
    expect(member_compliance_response.json()).toEqual({
      error: {
        type: "compliance_permission_denied",
        message: "Only organization owners can view compliance evidence.",
      },
    });

    const owner_compliance_response = await app.inject({
      method: "GET",
      url: "/api/v1/organization/compliance/events?limit=50",
      cookies: { ossie_session: owner_session },
    });
    expect(owner_compliance_response.statusCode).toBe(200);
    expect(owner_compliance_response.json().events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidence_kind: "access",
          action: "publish_link.viewed",
          access_surface: "public_reader",
        }),
        expect.objectContaining({
          evidence_kind: "access",
          action: "publish_link.viewed",
          access_surface: "public_embed",
        }),
        expect.objectContaining({
          evidence_kind: "access",
          action: "published_asset.downloaded",
          access_surface: "download",
          response_bytes: bytes.length,
        }),
        expect.objectContaining({
          evidence_kind: "access",
          action: "organization.access_denied",
          outcome: "denied",
          reason_code: "forbidden",
        }),
      ]),
    );
    const audit_summary = owner_compliance_response
      .json()
      .events.find(
        (event: { evidence_kind: string }) => event.evidence_kind === "audit",
      ) as { id: string } | undefined;
    expect(audit_summary).toBeDefined();

    const audit_detail_response = await app.inject({
      method: "GET",
      url: `/api/v1/organization/compliance/audit-events/${audit_summary!.id}`,
      cookies: { ossie_session: owner_session },
    });
    expect(audit_detail_response.statusCode).toBe(200);
    expect(
      audit_detail_response.json().event.change_items.length,
    ).toBeGreaterThan(0);

    const later_compliance_response = await app.inject({
      method: "GET",
      url: "/api/v1/organization/compliance/events?kind=access&limit=50",
      cookies: { ossie_session: owner_session },
    });
    expect(later_compliance_response.statusCode).toBe(200);
    expect(later_compliance_response.json().events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "compliance.timeline_viewed" }),
        expect.objectContaining({ action: "compliance.audit_event_viewed" }),
      ]),
    );

    await app.close();
  }, 30_000);
});
