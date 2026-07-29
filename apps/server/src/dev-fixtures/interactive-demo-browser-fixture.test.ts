import { describe, expect, it } from "vitest";
import {
  build_interactive_demo_browser_fixture,
  interactive_demo_browser_fixture_cli_summary,
  interactive_demo_browser_fixture_password,
} from "./interactive-demo-browser-fixture";

describe("Interactive Demo browser fixture", () => {
  it("describes role, lifecycle, media, Revision, and public-access state", () => {
    const fixture = build_interactive_demo_browser_fixture();

    expect(interactive_demo_browser_fixture_password).toBe(
      "safe local browser fixture password",
    );
    expect(
      fixture.users.map(({ project_role }) => project_role).sort(),
    ).toEqual(["editor", "project_admin", "viewer"]);
    expect(fixture.project_versions.map(({ status }) => status)).toContain(
      "archived",
    );
    expect(fixture.demos.map(({ state }) => state).sort()).toEqual([
      "active",
      "archived",
      "empty",
    ]);
    expect(fixture.scene_count).toBeGreaterThanOrEqual(12);
    expect([...fixture.hotspot_types].sort()).toEqual([
      "click",
      "info",
      "next",
    ]);
    expect([...fixture.transition_cases].sort()).toEqual([
      "backward",
      "forward",
      "self",
      "terminal",
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
      /^\/projects\/[0-9A-HJKMNP-TV-Z]{26}\/versions\/summer-release\/interactive-demos\//u,
    );
    expect(JSON.stringify(fixture)).not.toContain("storage_key");
  });

  it("redacts credentials from the CLI seed summary", () => {
    const fixture = build_interactive_demo_browser_fixture();
    const summary = interactive_demo_browser_fixture_cli_summary(fixture);
    const serialized = JSON.stringify(summary);

    expect(summary.users).toEqual(
      fixture.users.map(({ email, project_role }) => ({
        email,
        project_role,
      })),
    );
    expect(serialized).not.toContain(fixture.password);
    for (const user of fixture.users) {
      expect(serialized).not.toContain(user.session_token);
    }
  });
});
