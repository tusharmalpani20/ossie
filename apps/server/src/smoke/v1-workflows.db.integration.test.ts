import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { build } from "../app";
import { pool } from "../config/database.config";
import { reset_test_database } from "../test-support/database";
import { seed_documentation_browser_fixture } from "../dev-fixtures/documentation-browser-fixture";

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
    const project_version_slug = project_response.json().project
      .default_project_version.slug as string;
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
    expect(
      renamed_version_response.statusCode,
      renamed_version_response.body,
    ).toBe(200);
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
    const guide_checkpoint_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/revisions/checkpoint?project_version_id=${project_version_id}`,
      cookies: { ossie_session: owner_session },
      payload: {
        expected_edition_version: guide_response.json().edition.version,
        expected_working_draft_version:
          guide_response.json().working_draft.version,
      },
    });
    expect(guide_checkpoint_response.statusCode).toBe(201);

    const guide_publish_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publications?project_version_id=${project_version_id}`,
      cookies: { ossie_session: owner_session },
      payload: {
        expected_edition_version: guide_response.json().edition.version,
        expected_working_draft_version:
          guide_response.json().working_draft.version,
        update_publish_links: [],
        create_publish_link: {
          name: "Guide smoke link",
          visibility: "public",
          expires_at: null,
          password: null,
        },
      },
    });

    expect(guide_publish_response.statusCode).toBe(201);
    expect(guide_publish_response.json().created_publish_link).toMatchObject({
      artifact_type: "guide",
      artifact_id: guide_id,
      status: "active",
      visibility: "public",
    });
    const guide_slug = guide_publish_response.json().created_publish_link
      .slug as string;

    const public_guide_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${guide_slug}?artifact_type=guide`,
      headers: { "x-ossie-access-surface": "public_reader" },
    });

    expect(public_guide_response.statusCode).toBe(200);
    expect(public_guide_response.json().published_artifact).toMatchObject({
      artifact_type: "guide",
      revision: { title: "Department setup guide" },
      guide_blocks: [
        {
          step: { display_capture_asset_id: capture_asset_id },
        },
      ],
    });
    for (const prohibited_field of [
      "storage_key",
      "created_by_id",
      "updated_by_id",
      "source_capture_session_id",
      "source_working_draft_version",
      "guide_edition_id",
    ]) {
      expect(JSON.stringify(public_guide_response.json())).not.toContain(
        prohibited_field,
      );
    }

    const public_asset_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${guide_slug}/versions/${project_version_slug}/assets/${capture_asset_id}/file?artifact_type=guide`,
    });
    expect(public_asset_response.statusCode).toBe(200);
    expect(public_asset_response.rawPayload).toEqual(bytes);

    const demo_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/interactive-demos`,
      cookies: { ossie_session: owner_session },
      payload: {},
    });

    expect(demo_response.statusCode, demo_response.body).toBe(201);
    const interactive_demo_id = demo_response.json().artifact.id as string;
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
        expected_working_draft_version:
          demo_response.json().working_draft.version,
      },
    });

    expect(hotspot_response.statusCode).toBe(201);
    expect(hotspot_response.json().demo_hotspot).toMatchObject({
      demo_scene_id: scene_id,
      hotspot_type: "info",
      label: "Add Department",
    });
    const demo_checkpoint_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/revisions/checkpoint?project_version_id=${project_version_id}`,
      cookies: { ossie_session: owner_session },
      payload: {
        expected_edition_version: demo_response.json().edition.version,
        expected_working_draft_version:
          hotspot_response.json().working_draft.version,
      },
    });
    expect(demo_checkpoint_response.statusCode).toBe(201);

    const carry_forward_payload = {
      source_project_version_id: project_version_id,
      target_project_version_id: named_version.id,
      artifacts: [
        { artifact_type: "guide", artifact_id: guide_id },
        {
          artifact_type: "interactive_demo",
          artifact_id: interactive_demo_id,
        },
      ],
    };
    const carry_forward_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/artifact-editions/carry-forward`,
      cookies: { ossie_session: owner_session },
      headers: { "idempotency-key": "v1-smoke-carry-forward-0001" },
      payload: carry_forward_payload,
    });
    expect(carry_forward_response.statusCode).toBe(201);
    expect(carry_forward_response.json()).toMatchObject({
      replayed: false,
      items: [
        { artifact_type: "guide", artifact_id: guide_id },
        {
          artifact_type: "interactive_demo",
          artifact_id: interactive_demo_id,
        },
      ],
    });
    const carry_forward_replay = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/artifact-editions/carry-forward`,
      cookies: { ossie_session: owner_session },
      headers: { "idempotency-key": "v1-smoke-carry-forward-0001" },
      payload: carry_forward_payload,
    });
    expect(carry_forward_replay.statusCode).toBe(200);
    expect(carry_forward_replay.json()).toMatchObject({ replayed: true });

    const demo_publish_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${interactive_demo_id}/publications?project_version_id=${project_version_id}`,
      cookies: { ossie_session: owner_session },
      payload: {
        expected_edition_version: demo_response.json().edition.version,
        expected_working_draft_version:
          hotspot_response.json().working_draft.version,
        update_publish_links: [],
        create_publish_link: {
          name: "Demo smoke link",
          visibility: "public",
          expires_at: null,
          password: null,
        },
      },
    });

    expect(demo_publish_response.statusCode).toBe(201);
    expect(demo_publish_response.json().created_publish_link).toMatchObject({
      artifact_type: "interactive_demo",
      artifact_id: interactive_demo_id,
      status: "active",
      visibility: "public",
    });
    const demo_slug = demo_publish_response.json().created_publish_link
      .slug as string;

    const public_demo_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${demo_slug}?artifact_type=interactive_demo`,
      headers: { "x-ossie-access-surface": "public_embed" },
    });

    expect(public_demo_response.statusCode).toBe(200);
    expect(public_demo_response.json().published_artifact).toMatchObject({
      artifact_type: "interactive_demo",
      revision: { title: "Create department workflow" },
      demo_scenes: [
        {
          background_capture_asset_id: capture_asset_id,
          hotspots: [
            {
              hotspot_type: "info",
              label: "Add Department",
            },
          ],
        },
      ],
    });
    expect(
      public_demo_response.json().published_artifact.demo_scenes[0].id,
    ).not.toBe(scene_id);
    for (const prohibited_field of [
      "storage_key",
      "created_by_id",
      "updated_by_id",
      "source_capture_session_id",
      "source_working_draft_version",
      "interactive_demo_edition_id",
    ]) {
      expect(JSON.stringify(public_demo_response.json())).not.toContain(
        prohibited_field,
      );
    }

    const archive_asset_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}/archive`,
      cookies: { ossie_session: owner_session },
      payload: { expected_asset_version: 1 },
    });
    expect(archive_asset_response.statusCode).toBe(200);
    const protection_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}/protection`,
      cookies: { ossie_session: owner_session },
    });
    expect(protection_response.statusCode).toBe(200);
    expect(protection_response.json()).toMatchObject({
      status: "archived",
      can_purge: false,
    });
    expect(protection_response.json().total_dependency_count).toBeGreaterThan(
      0,
    );
    const protected_purge_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}`,
      cookies: { ossie_session: owner_session },
      payload: { expected_asset_version: 2 },
    });
    expect(protected_purge_response.statusCode).toBe(409);
    expect(protected_purge_response.json().error.type).toBe(
      "capture_asset_protected",
    );
    const archived_public_asset_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${guide_slug}/versions/${project_version_slug}/assets/${capture_asset_id}/file?artifact_type=guide`,
    });
    expect(archived_public_asset_response.statusCode).toBe(200);
    expect(archived_public_asset_response.rawPayload).toEqual(bytes);

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

  it("publishes and rolls back an exact Documentation Site vertical slice", async () => {
    const fixture = await seed_documentation_browser_fixture();
    const app = build({ logger: false });
    try {
      const admin = fixture.users.find(
        ({ project_role }) => project_role === "project_admin",
      )!;
      const viewer = fixture.users.find(
        ({ project_role }) => project_role === "viewer",
      )!;
      const operations = await app.inject({
        method: "GET",
        url: "/api/v1/organization/documentation/operations",
        cookies: { ossie_session: admin.session_token },
      });
      expect(operations.statusCode, operations.body).toBe(200);
      expect(operations.json()).toMatchObject({
        limits: {
          active_sites_limit: null,
          active_pages_limit: null,
          version: 0,
        },
        usage: { active_sites: 2 },
        permissions: { can_manage_limits: true },
      });
      const limits = await app.inject({
        method: "PUT",
        url: "/api/v1/organization/documentation/limits",
        cookies: { ossie_session: admin.session_token },
        payload: {
          expected_version: 0,
          active_sites_limit: 2,
          active_pages_limit: null,
        },
      });
      expect(limits.statusCode, limits.body).toBe(200);
      expect(limits.json()).toMatchObject({
        limits: { active_sites_limit: 2, version: 1 },
      });
      const denied_limits = await app.inject({
        method: "PUT",
        url: "/api/v1/organization/documentation/limits",
        cookies: { ossie_session: viewer.session_token },
        payload: {
          expected_version: 1,
          active_sites_limit: null,
          active_pages_limit: null,
        },
      });
      expect(denied_limits.statusCode, denied_limits.body).toBe(403);
      const rebuild = await app.inject({
        method: "POST",
        url:
          `/api/v1/projects/${fixture.project_id}/versions/${fixture.version_slug}` +
          `/documentation-sites/${fixture.site_id}/projections/rebuild`,
        cookies: { ossie_session: admin.session_token },
        payload: { projection: "draft_search" },
      });
      expect(rebuild.statusCode, rebuild.body).toBe(200);
      expect(rebuild.json()).toMatchObject({
        projection: "draft_search",
        site_id: fixture.site_id,
      });
      const currentPage = await app.inject({
        method: "GET",
        url:
          `/api/v1/projects/${fixture.project_id}/versions/${fixture.version_slug}` +
          `/documentation-sites/${fixture.site_id}/pages/${fixture.page_ids.home}`,
        cookies: { ossie_session: admin.session_token },
      });
      expect(currentPage.statusCode, currentPage.body).toBe(200);
      const captureDraft = await app.inject({
        method: "PUT",
        url:
          `/api/v1/projects/${fixture.project_id}/versions/${fixture.version_slug}` +
          `/documentation-sites/${fixture.site_id}/pages/${fixture.page_ids.home}/content`,
        cookies: { ossie_session: admin.session_token },
        payload: {
          expected_page_version: currentPage.json().page.version,
          blocks: [
            {
              id: "01K13400000000000000000001",
              kind: "image",
              position: 1,
              expected_version: null,
              source: {
                kind: "capture_asset",
                id: fixture.capture_asset_id,
              },
              alt_text: "Portable captured dashboard",
              caption: "Capture-backed media remains portable.",
            },
          ],
        },
      });
      expect(captureDraft.statusCode, captureDraft.body).toBe(200);
      const exportVersions = await pool.query<{
        site_version: number;
        draft_version: number;
      }>(
        `SELECT site.version site_version,draft.version draft_version
           FROM documentation_schema.documentation_site site
           JOIN documentation_schema.site_edition edition
             ON edition.documentation_site_id=site.id
           JOIN documentation_schema.site_working_draft draft
             ON draft.site_edition_id=edition.id
          WHERE site.id=$1`,
        [fixture.site_id],
      );
      const portableDraft = await app.inject({
        method: "GET",
        url:
          `/api/v1/projects/${fixture.project_id}/versions/${fixture.version_slug}` +
          `/documentation-sites/${fixture.site_id}/export/package.zip?source=draft` +
          `&expected_site_version=${exportVersions.rows[0]!.site_version}` +
          `&expected_draft_version=${exportVersions.rows[0]!.draft_version}`,
        cookies: { ossie_session: admin.session_token },
      });
      expect(portableDraft.statusCode, portableDraft.body).toBe(200);
      const portableArchive = await JSZip.loadAsync(portableDraft.rawPayload);
      const portableManifest = JSON.parse(
        await portableArchive.file("site.json")!.async("string"),
      );
      expect(portableManifest.assets).toHaveLength(2);
      expect(portableManifest.assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
          }),
        ]),
      );
      expect(
        Object.keys(portableArchive.files).filter((name) =>
          name.startsWith("assets/"),
        ),
      ).toHaveLength(2);

      const public_page = await app.inject({
        method: "GET",
        url: "/api/v1/public/publish-links/plan132-public/documentation/pages/install-guide",
        headers: { "x-ossie-access-surface": "public_reader" },
      });
      expect(public_page.statusCode, public_page.body).toBe(200);
      expect(public_page.json()).toMatchObject({
        publication: { id: fixture.publication_id },
        page: { title: "Install" },
        snippets: [
          expect.objectContaining({
            id: fixture.snippet_id,
            name: "Reusable safety note",
          }),
        ],
      });
      const initial_document = await app.inject({
        method: "GET",
        url: "/docs/plan132-public/install-guide",
      });
      expect(initial_document.statusCode, initial_document.body).toBe(200);
      expect(initial_document.headers.etag).toMatch(
        /^"documentation-[a-f0-9]{64}-html"$/u,
      );
      expect(initial_document.body).toContain(
        "<title>Install · Plan 132 Product Documentation</title>",
      );
      const not_modified = await app.inject({
        method: "GET",
        url: "/docs/plan132-public/install-guide",
        headers: { "if-none-match": initial_document.headers.etag! },
      });
      expect(not_modified.statusCode).toBe(304);
      const snippet_search = await app.inject({
        method: "GET",
        url: "/api/v1/public/publish-links/plan132-public/documentation/search?q=production",
        headers: { "x-ossie-access-surface": "public_reader" },
      });
      expect(snippet_search.statusCode, snippet_search.body).toBe(200);
      expect(snippet_search.json().results).toEqual([
        expect.objectContaining({ page_id: fixture.page_ids.home }),
      ]);
      const alias = await app.inject({
        method: "GET",
        url: "/api/v1/public/publish-links/plan132-public/documentation/pages/install",
      });
      expect(alias.statusCode).toBe(308);
      expect(alias.headers.location).toBe("/docs/plan132-public/install-guide");
      const image = await app.inject({
        method: "GET",
        url: `/api/v1/public/publish-links/plan132-public/documentation/assets/${fixture.asset_id}/file`,
        headers: { "x-ossie-access-surface": "public_reader" },
      });
      expect(image.statusCode, image.body).toBe(200);
      expect(image.headers["content-type"]).toBe("image/png");
      const capture_image = await app.inject({
        method: "GET",
        url: `/api/v1/public/publish-links/plan132-public/documentation/assets/capture/${fixture.capture_asset_id}/file`,
        headers: { "x-ossie-access-surface": "public_reader" },
      });
      expect(capture_image.statusCode, capture_image.body).toBe(200);
      expect(capture_image.headers["content-type"]).toBe("image/png");
      const foreign_image = await app.inject({
        method: "GET",
        url: "/api/v1/public/publish-links/plan132-public/documentation/assets/01K00000000000000000000000/file",
      });
      expect(foreign_image.statusCode).toBe(404);

      const persisted = await pool.query<{
        selected_publication_id: string;
        revision_count: string;
        publication_count: string;
      }>(
        `SELECT entry.site_publication_id selected_publication_id,
                (SELECT COUNT(*) FROM documentation_schema.site_revision
                  WHERE documentation_site_id=$1)::text revision_count,
                (SELECT COUNT(*) FROM publish_schema.site_publication
                  WHERE documentation_site_id=$1)::text publication_count
           FROM publish_schema.publish_link_entry entry
          WHERE entry.id=$2`,
        [fixture.site_id, fixture.entry_id],
      );
      expect(persisted.rows[0]).toEqual({
        selected_publication_id: fixture.publication_id,
        revision_count: "2",
        publication_count: "2",
      });
    } finally {
      await app.close();
    }
  }, 30_000);
});
