/**
 * @fileoverview Dev-only Capture portal browser fixture seeding.
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Password } from "../common/services/password.common.service";
import { hash_session_token } from "../modules/authentication/session-token";
import {
  reset_test_database,
  with_maintenance_client,
} from "../test-support/database";

type FixtureQuery = (
  text: string,
  values?: unknown[],
) => Promise<{ rows: unknown[] }>;

type FixtureUser = {
  id: string;
  org_user_id: string;
  session_id: string;
  email: string;
  display_name: string;
  project_role: "project_admin" | "viewer";
  session_token: string;
};

type FixtureProjectVersion = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "archived";
  is_default: boolean;
};

type FixtureCaptureSession = {
  id: string;
  name: string;
  project_version_id: string;
  status: "draft" | "capturing" | "completed" | "canceled" | "archived";
};

export type CapturePortalBrowserFixture = {
  organization_id: string;
  project_id: string;
  password: string;
  users: FixtureUser[];
  project_versions: FixtureProjectVersion[];
  capture_sessions: FixtureCaptureSession[];
  empty_reassignable_capture_session_id: string;
  screenshot_asset_id: string;
  routes: {
    main_capture_list: string;
    named_capture_list: string;
    archived_capture_list: string;
    completed_capture_detail: string;
    empty_draft_capture_detail: string;
  };
};

export const capture_portal_browser_fixture_password =
  "safe local browser fixture password";

const ids = {
  organization: "01K125ORG0000000000001",
  project: "01K125PROJ000000000000",
  admin_user: "01K125USERADMIN0000000",
  admin_org_user: "01K125ORGUSERADMIN000",
  admin_session: "01K125SESSIONADMIN000",
  viewer_user: "01K125USERVIEWER00000",
  viewer_org_user: "01K125ORGUSERVIEWER00",
  viewer_session: "01K125SESSIONVIEWER00",
  main_version: "01K125VERSIONMAIN0000",
  named_version: "01K125VERSIONNAMED000",
  archived_version: "01K125VERSIONARCH0000",
  membership_admin: "01K125MEMBERADMIN000",
  membership_viewer: "01K125MEMBERVIEWER00",
  empty_draft_session: "01K125CAPEMPTYDRAFT00",
  capturing_session: "01K125CAPCAPTURING000",
  completed_session: "01K125CAPCOMPLETED00",
  canceled_session: "01K125CAPCANCELED000",
  archived_session: "01K125CAPARCHIVED000",
  file: "01K125FILESCREEN00000",
  asset: "01K125ASSETSCREEN0000",
  event_one: "01K125EVENT000000001",
  event_two: "01K125EVENT000000002",
};

const admin_session_token = "plan125-admin-browser-session-token";
const viewer_session_token = "plan125-viewer-browser-session-token";

const png_bytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const screenshot_storage_key = [
  "organizations",
  ids.organization,
  "projects",
  ids.project,
  "capture-sessions",
  ids.completed_session,
  `${ids.file}.png`,
].join("/");

export const build_capture_portal_browser_fixture =
  (): CapturePortalBrowserFixture => ({
    organization_id: ids.organization,
    project_id: ids.project,
    password: capture_portal_browser_fixture_password,
    users: [
      {
        id: ids.admin_user,
        org_user_id: ids.admin_org_user,
        session_id: ids.admin_session,
        email: "plan125-admin@example.test",
        display_name: "Plan 125 Admin",
        project_role: "project_admin",
        session_token: admin_session_token,
      },
      {
        id: ids.viewer_user,
        org_user_id: ids.viewer_org_user,
        session_id: ids.viewer_session,
        email: "plan125-viewer@example.test",
        display_name: "Plan 125 Viewer",
        project_role: "viewer",
        session_token: viewer_session_token,
      },
    ],
    project_versions: [
      {
        id: ids.main_version,
        name: "Main",
        slug: "main",
        status: "active",
        is_default: true,
      },
      {
        id: ids.named_version,
        name: "Summer release",
        slug: "summer-release",
        status: "active",
        is_default: false,
      },
      {
        id: ids.archived_version,
        name: "Archived release",
        slug: "archived-release",
        status: "archived",
        is_default: false,
      },
    ],
    capture_sessions: [
      {
        id: ids.empty_draft_session,
        name: "Empty draft for reassignment",
        project_version_id: ids.main_version,
        status: "draft",
      },
      {
        id: ids.capturing_session,
        name: "Capturing checkout workflow",
        project_version_id: ids.main_version,
        status: "capturing",
      },
      {
        id: ids.completed_session,
        name: "Completed department workflow",
        project_version_id: ids.named_version,
        status: "completed",
      },
      {
        id: ids.canceled_session,
        name: "Canceled onboarding workflow",
        project_version_id: ids.main_version,
        status: "canceled",
      },
      {
        id: ids.archived_session,
        name: "Archived release capture",
        project_version_id: ids.archived_version,
        status: "archived",
      },
    ],
    empty_reassignable_capture_session_id: ids.empty_draft_session,
    screenshot_asset_id: ids.asset,
    routes: {
      main_capture_list: `/projects/${ids.project}/versions/main/capture-sessions`,
      named_capture_list: `/projects/${ids.project}/versions/summer-release/capture-sessions`,
      archived_capture_list: `/projects/${ids.project}/versions/archived-release/capture-sessions`,
      completed_capture_detail: `/projects/${ids.project}/versions/summer-release/capture-sessions/${ids.completed_session}`,
      empty_draft_capture_detail: `/projects/${ids.project}/versions/main/capture-sessions/${ids.empty_draft_session}`,
    },
  });

const insert_users = async (query: FixtureQuery, password_hash: string) => {
  const fixture = build_capture_portal_browser_fixture();

  await query(
    `
    INSERT INTO organization_schema.organization (id, name, slug)
    VALUES ($1, 'Plan 125 Browser Fixture Org', 'plan-125-browser-fixture')
  `,
    [fixture.organization_id],
  );

  for (const user of fixture.users) {
    await query(
      `
      INSERT INTO user_schema.user (id, email, password_hash, display_name)
      VALUES ($1, $2, $3, $4)
    `,
      [user.id, user.email, password_hash, user.display_name],
    );
    await query(
      `
      INSERT INTO organization_schema.org_user (
        id, organization_id, user_id, role
      ) VALUES ($1, $2, $3, 'member')
    `,
      [user.org_user_id, fixture.organization_id, user.id],
    );
    await query(
      `
      INSERT INTO auth_schema.auth_session (
        id, user_id, organization_id, org_user_id, token_hash, expires_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP + interval '30 days')
    `,
      [
        user.session_id,
        user.id,
        fixture.organization_id,
        user.org_user_id,
        hash_session_token(user.session_token),
      ],
    );
  }
};

const insert_project = async (query: FixtureQuery) => {
  const fixture = build_capture_portal_browser_fixture();
  const admin = fixture.users[0]!;

  await query(
    `
    INSERT INTO project_schema.project (
      id, organization_id, name, description, slug, default_project_version_id,
      created_by_id, updated_by_id
    ) VALUES ($1, $2, 'Plan 125 Capture Browser Project',
      'Safe local fixture for Capture portal validation',
      'plan-125-capture-browser-project', $3, $4, $4)
  `,
    [
      fixture.project_id,
      fixture.organization_id,
      ids.main_version,
      admin.org_user_id,
    ],
  );

  for (const [index, version] of fixture.project_versions.entries()) {
    await query(
      `
      INSERT INTO project_schema.project_version (
        id, organization_id, project_id, name, slug, position, status,
        created_by_id, updated_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
    `,
      [
        version.id,
        fixture.organization_id,
        fixture.project_id,
        version.name,
        version.slug,
        index + 1,
        version.status,
        admin.org_user_id,
      ],
    );
  }

  for (const user of fixture.users) {
    await query(
      `
      INSERT INTO project_schema.project_membership (
        id, organization_id, project_id, org_user_id, role,
        created_by_id, updated_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $6)
    `,
      [
        user.project_role === "project_admin"
          ? ids.membership_admin
          : ids.membership_viewer,
        fixture.organization_id,
        fixture.project_id,
        user.org_user_id,
        user.project_role,
        admin.org_user_id,
      ],
    );
  }
};

const insert_capture_sessions = async (query: FixtureQuery) => {
  const fixture = build_capture_portal_browser_fixture();
  const admin = fixture.users[0]!;

  for (const session of fixture.capture_sessions) {
    await query(
      `
      INSERT INTO capture_schema.capture_session (
        id, organization_id, project_id, project_version_id, name, description,
        status, source_type, started_at, completed_at, canceled_at, start_url,
        browser_name, browser_version, operating_system, viewport_width,
        viewport_height, device_pixel_ratio, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, 'Safe synthetic Capture Session fixture',
        $6, 'manual',
        CASE WHEN $6 IN ('capturing', 'completed', 'canceled', 'archived')
          THEN CURRENT_TIMESTAMP - interval '2 hours' ELSE NULL END,
        CASE WHEN $6 = 'completed' THEN CURRENT_TIMESTAMP - interval '1 hour'
          ELSE NULL END,
        CASE WHEN $6 = 'canceled' THEN CURRENT_TIMESTAMP - interval '1 hour'
          ELSE NULL END,
        'https://example.test/safe-fixture',
        'Chromium', 'fixture', 'Linux', 1440, 900, 1, $7, $7
      )
    `,
      [
        session.id,
        fixture.organization_id,
        fixture.project_id,
        session.project_version_id,
        session.name,
        session.status,
        admin.org_user_id,
      ],
    );
  }
};

const insert_screenshot_asset = async (query: FixtureQuery) => {
  const fixture = build_capture_portal_browser_fixture();
  const admin = fixture.users[0]!;
  const checksum = createHash("sha256").update(png_bytes).digest("hex");

  await query(
    `
    INSERT INTO file_schema.file (
      id, organization_id, storage_provider, storage_key, mime_type,
      size_bytes, original_name, checksum_sha256, created_by_id, updated_by_id
    ) VALUES ($1, $2, 'local', $3, 'image/png', $4,
      'safe-capture-fixture.png', $5, $6, $6)
  `,
    [
      ids.file,
      fixture.organization_id,
      screenshot_storage_key,
      png_bytes.length,
      checksum,
      admin.org_user_id,
    ],
  );

  await query(
    `
    INSERT INTO capture_schema.capture_asset (
      id, organization_id, project_id, capture_session_id, file_id, asset_type,
      width, height, device_pixel_ratio, page_url, page_title, captured_at,
      created_by_id, updated_by_id
    ) VALUES ($1, $2, $3, $4, $5, 'screenshot', 1, 1, 1,
      'https://example.test/safe-fixture/departments',
      'Safe fixture departments page',
      CURRENT_TIMESTAMP - interval '90 minutes', $6, $6)
  `,
    [
      ids.asset,
      fixture.organization_id,
      fixture.project_id,
      ids.completed_session,
      ids.file,
      admin.org_user_id,
    ],
  );

  await query(
    `
    INSERT INTO capture_schema.capture_event (
      id, organization_id, project_id, capture_session_id, capture_asset_id,
      event_type, event_index, page_url, page_title, target_label,
      target_text, input_intent, note, created_by_id, updated_by_id
    ) VALUES
      ($1, $3, $4, $5, $6, 'capture', 1,
        'https://example.test/safe-fixture/departments',
        'Safe fixture departments page', 'Open departments',
        'Departments', 'Open the department list',
        'Safe synthetic screenshot event', $7, $7),
      ($2, $3, $4, $5, NULL, 'note', 2,
        'https://example.test/safe-fixture/departments',
        'Safe fixture departments page', 'Review departments',
        'Review', 'Confirm the list is visible',
        'Safe synthetic note event', $7, $7)
  `,
    [
      ids.event_one,
      ids.event_two,
      fixture.organization_id,
      fixture.project_id,
      ids.completed_session,
      ids.asset,
      admin.org_user_id,
    ],
  );
};

export const write_capture_portal_fixture_files = async (
  storage_root = process.env.OSSIE_LOCAL_STORAGE_ROOT || "./storage",
) => {
  const file_path = path.resolve(storage_root, screenshot_storage_key);
  await mkdir(path.dirname(file_path), { recursive: true });
  await writeFile(file_path, png_bytes);
  return {
    storage_root: path.resolve(storage_root),
    storage_key: screenshot_storage_key,
  };
};

export const seed_capture_portal_browser_fixture = async () => {
  const fixture = build_capture_portal_browser_fixture();
  await reset_test_database();
  const file = await write_capture_portal_fixture_files();
  const password_hash = await Password.to_hash(
    capture_portal_browser_fixture_password,
  );

  await with_maintenance_client(async (client) => {
    await insert_users(client.query.bind(client), password_hash);
    await insert_project(client.query.bind(client));
    await insert_capture_sessions(client.query.bind(client));
    await insert_screenshot_asset(client.query.bind(client));
  });

  return {
    fixture,
    file,
  };
};
