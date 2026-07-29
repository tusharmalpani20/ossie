/**
 * @fileoverview Capture portal browser fixture tests.
 */

import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  build_capture_portal_browser_fixture,
  capture_portal_browser_fixture_password,
  write_capture_portal_fixture_files,
} from "./capture-portal-browser-fixture";

describe("capture portal browser fixture", () => {
  it("describes the required local browser validation data without private source material", () => {
    const fixture = build_capture_portal_browser_fixture();

    expect(capture_portal_browser_fixture_password).toBe(
      "safe local browser fixture password",
    );
    expect(fixture.users.map((user) => user.email)).toEqual([
      "plan125-admin@example.test",
      "plan125-viewer@example.test",
    ]);
    expect(fixture.project_versions.map((version) => version.status)).toEqual([
      "active",
      "active",
      "archived",
    ]);
    expect(
      fixture.capture_sessions.map((session) => session.status).sort(),
    ).toEqual(["archived", "canceled", "capturing", "completed", "draft"]);
    expect(
      fixture.capture_sessions.some(
        (session) =>
          session.id === fixture.empty_reassignable_capture_session_id,
      ),
    ).toBe(true);
    const identifiers = [
      fixture.organization_id,
      fixture.project_id,
      fixture.empty_reassignable_capture_session_id,
      fixture.screenshot_asset_id,
      ...fixture.users.flatMap((user) => [
        user.id,
        user.org_user_id,
        user.session_id,
      ]),
      ...fixture.project_versions.map((version) => version.id),
      ...fixture.capture_sessions.map((session) => session.id),
    ];
    for (const identifier of identifiers) {
      expect(identifier).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/u);
    }
    expect(JSON.stringify(fixture)).not.toContain("raw_html");
    expect(JSON.stringify(fixture)).not.toContain("input_value");
  });

  it("writes safe local screenshot bytes for Capture Asset previews", async () => {
    const storage_root = await mkdtemp(
      path.join(tmpdir(), "ossie-plan125-fixture-"),
    );

    try {
      const result = await write_capture_portal_fixture_files(storage_root);
      const bytes = await readFile(
        path.join(result.storage_root, result.storage_key),
      );

      expect(result.storage_key).toContain("/capture-sessions/");
      expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    } finally {
      await rm(storage_root, { recursive: true, force: true });
    }
  });
});
