import { describe, expect, it } from "vitest";
import {
  build_guide_browser_fixture,
  guide_browser_fixture_password,
} from "./guide-browser-fixture";

describe("Guide browser fixture", () => {
  it("describes every role, lifecycle, media, Revision, and public-access state", () => {
    const fixture = build_guide_browser_fixture();

    expect(guide_browser_fixture_password).toBe(
      "safe local browser fixture password",
    );
    expect(fixture.users.map(({ project_role }) => project_role).sort()).toEqual(
      ["editor", "project_admin", "viewer"],
    );
    expect(fixture.project_versions.map(({ status }) => status)).toContain(
      "archived",
    );
    expect(fixture.guides.map(({ state }) => state).sort()).toEqual([
      "active",
      "archived",
      "empty",
    ]);
    expect(fixture.public_links.map(({ access }) => access).sort()).toEqual([
      "expired",
      "password",
      "public",
      "restricted",
      "revoked",
    ]);
    expect(fixture.media_cases).toEqual([
      "active",
      "archived_protected",
      "broken",
      "missing",
    ]);
    expect(fixture.revision_count).toBeGreaterThanOrEqual(2);
    expect(fixture.routes.editor).toMatch(
      /^\/projects\/[0-9A-HJKMNP-TV-Z]{26}\/versions\/summer-release\/guides\//u,
    );
    expect(JSON.stringify(fixture)).not.toContain("storage_key");
  });
});
