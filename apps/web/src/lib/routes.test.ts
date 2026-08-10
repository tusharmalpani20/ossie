/**
 * @fileoverview Tests for Ossie portal route parsing.
 */

import { describe, expect, it } from "vitest";
import { parsePortalRoute } from "./routes";

describe("parsePortalRoute", () => {
  it("parses login routes", () => {
    expect(parsePortalRoute("/login")).toEqual({ type: "login" });
    expect(parsePortalRoute("/login/")).toEqual({ type: "login" });
  });

  it("parses setup routes", () => {
    expect(parsePortalRoute("/setup")).toEqual({ type: "setup" });
    expect(parsePortalRoute("/setup/")).toEqual({ type: "setup" });
  });

  it("parses project list routes", () => {
    expect(parsePortalRoute("/")).toEqual({ type: "project_list" });
    expect(parsePortalRoute("/projects")).toEqual({ type: "project_list" });
    expect(parsePortalRoute("/projects/")).toEqual({ type: "project_list" });
  });

  it("parses the development-only design system review route", () => {
    expect(parsePortalRoute("/__design-system")).toEqual({
      type: "design_system_review",
    });
    expect(parsePortalRoute("/__design-system/extra")).toEqual({
      type: "unsupported",
    });
  });

  it("parses organization member routes", () => {
    expect(parsePortalRoute("/organization/members")).toEqual({
      type: "organization_members",
    });
    expect(parsePortalRoute("/organization/members/")).toEqual({
      type: "organization_members",
    });
  });

  it("parses the organization compliance route", () => {
    expect(parsePortalRoute("/organization/compliance")).toEqual({
      type: "organization_compliance",
    });
  });

  it("parses the organization Documentation operations route", () => {
    expect(parsePortalRoute("/organization/documentation")).toEqual({
      type: "organization_documentation",
    });
  });

  it("parses the browser extension route", () => {
    expect(parsePortalRoute("/extension")).toEqual({
      type: "browser_extension",
    });
    expect(parsePortalRoute("/extension/")).toEqual({
      type: "browser_extension",
    });
  });

  it("parses organization invite acceptance routes", () => {
    expect(parsePortalRoute("/invites/plain-token")).toEqual({
      type: "organization_invite_accept",
      token: "plain-token",
    });
    expect(parsePortalRoute("/invites/token%20%2F%201")).toEqual({
      type: "organization_invite_accept",
      token: "token / 1",
    });
  });

  it("parses project workspace routes", () => {
    expect(parsePortalRoute("/projects/project_1")).toEqual({
      type: "project_workspace",
      projectId: "project_1",
    });
    expect(parsePortalRoute("/projects/project_1/")).toEqual({
      type: "project_workspace",
      projectId: "project_1",
    });
  });

  it("parses canonical Project Version workspace and content routes", () => {
    expect(parsePortalRoute("/projects/project_1/versions/main")).toEqual({
      type: "project_version_workspace",
      projectId: "project_1",
      versionSlug: "main",
    });
    expect(
      parsePortalRoute(
        "/projects/project_1/versions/q3/guides/guide_1/preview",
      ),
    ).toEqual({
      type: "guide_preview",
      projectId: "project_1",
      versionSlug: "q3",
      guideId: "guide_1",
    });
    expect(
      parsePortalRoute(
        "/projects/project_1/versions/main/capture-sessions/capture_1",
      ),
    ).toEqual({
      type: "capture_session_detail",
      projectId: "project_1",
      versionSlug: "main",
      captureSessionId: "capture_1",
    });
  });

  it("parses Documentation authoring and multi-segment public Page routes", () => {
    expect(
      parsePortalRoute(
        "/projects/project_1/versions/main/documentation/carry-forward",
      ),
    ).toEqual({
      type: "documentation_carry_forward",
      projectId: "project_1",
      versionSlug: "main",
    });
    expect(
      parsePortalRoute(
        "/projects/project_1/versions/main/documentation/reviews",
      ),
    ).toEqual({
      type: "documentation_review_inbox",
      projectId: "project_1",
      versionSlug: "main",
    });
    expect(
      parsePortalRoute(
        "/projects/project_1/versions/main/documentation/site_1/pages/page_1",
      ),
    ).toEqual({
      type: "documentation_page_editor",
      projectId: "project_1",
      versionSlug: "main",
      siteId: "site_1",
      pageId: "page_1",
    });
    expect(
      parsePortalRoute("/docs/public-docs/getting-started/install"),
    ).toEqual({
      type: "public_documentation_reader",
      slug: "public-docs",
      pagePath: "getting-started/install",
    });
    expect(
      parsePortalRoute("/docs/public-docs/versions/v2/getting-started/install"),
    ).toEqual({
      type: "public_documentation_reader",
      slug: "public-docs",
      versionSlug: "v2",
      pagePath: "getting-started/install",
    });
    expect(parsePortalRoute("/docs/public-docs/embed")).toEqual({
      type: "public_documentation_reader",
      slug: "public-docs",
      pagePath: "embed",
    });
  });

  it("parses Project Version Carry-Forward and immutable Revision routes", () => {
    expect(
      parsePortalRoute("/projects/project_1/versions/q3/carry-forward"),
    ).toEqual({
      type: "project_carry_forward",
      projectId: "project_1",
      versionSlug: "q3",
    });
    expect(
      parsePortalRoute(
        "/projects/project_1/versions/q3/guides/guide_1/revisions",
      ),
    ).toEqual({
      type: "artifact_revision_history",
      projectId: "project_1",
      versionSlug: "q3",
      artifactType: "guide",
      artifactId: "guide_1",
    });
    expect(
      parsePortalRoute(
        "/projects/project_1/versions/q3/interactive-demos/demo_1/revisions/12",
      ),
    ).toEqual({
      type: "artifact_revision_preview",
      projectId: "project_1",
      versionSlug: "q3",
      artifactType: "interactive_demo",
      artifactId: "demo_1",
      revisionNumber: 12,
    });
  });

  it("parses project settings routes", () => {
    expect(parsePortalRoute("/projects/project_1/settings")).toEqual({
      type: "project_settings",
      projectId: "project_1",
    });
    expect(parsePortalRoute("/projects/project%20%2F%201/settings")).toEqual({
      type: "project_settings",
      projectId: "project / 1",
    });
  });

  it("parses capture session detail routes", () => {
    expect(
      parsePortalRoute(
        "/projects/project_1/capture-sessions/capture_session_1",
      ),
    ).toEqual({
      type: "capture_session_detail",
      projectId: "project_1",
      captureSessionId: "capture_session_1",
    });
  });

  it("parses project capture session list routes", () => {
    expect(parsePortalRoute("/projects/project_1/capture-sessions")).toEqual({
      type: "project_capture_session_list",
      projectId: "project_1",
    });
    expect(parsePortalRoute("/projects/project_1/capture-sessions/")).toEqual({
      type: "project_capture_session_list",
      projectId: "project_1",
    });
  });

  it("parses guide detail routes", () => {
    expect(parsePortalRoute("/projects/project_1/guides/guide_1")).toEqual({
      type: "guide_detail",
      projectId: "project_1",
      guideId: "guide_1",
    });
  });

  it("parses guide preview routes", () => {
    expect(
      parsePortalRoute("/projects/project_1/guides/guide_1/preview"),
    ).toEqual({
      type: "guide_preview",
      projectId: "project_1",
      guideId: "guide_1",
    });
    expect(
      parsePortalRoute("/projects/project%201/guides/guide%20%2F%201/preview"),
    ).toEqual({
      type: "guide_preview",
      projectId: "project 1",
      guideId: "guide / 1",
    });
  });

  it("parses project guide list routes", () => {
    expect(parsePortalRoute("/projects/project_1/guides")).toEqual({
      type: "project_guide_list",
      projectId: "project_1",
    });
    expect(parsePortalRoute("/projects/project_1/guides/")).toEqual({
      type: "project_guide_list",
      projectId: "project_1",
    });
  });

  it("parses interactive demo detail routes", () => {
    expect(
      parsePortalRoute(
        "/projects/project_1/interactive-demos/interactive_demo_1",
      ),
    ).toEqual({
      type: "interactive_demo_detail",
      projectId: "project_1",
      interactiveDemoId: "interactive_demo_1",
    });
    expect(
      parsePortalRoute(
        "/projects/project%201/interactive-demos/interactive%20%2F%201",
      ),
    ).toEqual({
      type: "interactive_demo_detail",
      projectId: "project 1",
      interactiveDemoId: "interactive / 1",
    });
  });

  it("parses Project-Version-qualified Interactive Demo draft previews", () => {
    expect(
      parsePortalRoute(
        "/projects/project_1/versions/q3/interactive-demos/demo_1/preview",
      ),
    ).toEqual({
      type: "interactive_demo_preview",
      projectId: "project_1",
      versionSlug: "q3",
      interactiveDemoId: "demo_1",
    });
    expect(
      parsePortalRoute("/projects/project_1/interactive-demos/demo_1/preview"),
    ).toEqual({
      type: "interactive_demo_preview",
      projectId: "project_1",
      interactiveDemoId: "demo_1",
    });
  });

  it("parses project interactive demo list routes", () => {
    expect(parsePortalRoute("/projects/project_1/interactive-demos")).toEqual({
      type: "project_interactive_demo_list",
      projectId: "project_1",
    });
    expect(
      parsePortalRoute("/projects/project%201/interactive-demos/"),
    ).toEqual({
      type: "project_interactive_demo_list",
      projectId: "project 1",
    });
  });

  it("parses Project compliance and Activity routes", () => {
    expect(parsePortalRoute("/projects/project%201/compliance")).toEqual({
      type: "project_compliance",
      projectId: "project 1",
    });
    expect(parsePortalRoute("/projects/project_1/activity")).toEqual({
      type: "project_activity",
      projectId: "project_1",
    });
  });

  it("parses public guide reader routes", () => {
    expect(parsePortalRoute("/p/abc123")).toEqual({
      type: "public_guide_reader",
      slug: "abc123",
    });
    expect(parsePortalRoute("/p/abc%20123")).toEqual({
      type: "public_guide_reader",
      slug: "abc 123",
    });
  });

  it("parses public guide embed routes", () => {
    expect(parsePortalRoute("/p/abc123/embed")).toEqual({
      type: "public_guide_embed",
      slug: "abc123",
    });
    expect(parsePortalRoute("/p/abc%20123/embed")).toEqual({
      type: "public_guide_embed",
      slug: "abc 123",
    });
  });

  it("parses canonical version-specific reader and embed routes", () => {
    expect(parsePortalRoute("/p/link-1/versions/docs-v2")).toEqual({
      type: "public_guide_reader",
      slug: "link-1",
      versionSlug: "docs-v2",
    });
    expect(parsePortalRoute("/p/link-1/versions/docs-v2/embed")).toEqual({
      type: "public_guide_embed",
      slug: "link-1",
      versionSlug: "docs-v2",
    });
    expect(parsePortalRoute("/d/link-1/versions/demo-v2")).toEqual({
      type: "public_interactive_demo_reader",
      slug: "link-1",
      versionSlug: "demo-v2",
    });
  });

  it("parses public interactive demo routes", () => {
    expect(parsePortalRoute("/d/demo123")).toEqual({
      type: "public_interactive_demo_reader",
      slug: "demo123",
    });
    expect(parsePortalRoute("/d/demo%20123")).toEqual({
      type: "public_interactive_demo_reader",
      slug: "demo 123",
    });
    expect(parsePortalRoute("/d/demo123/embed")).toEqual({
      type: "public_interactive_demo_embed",
      slug: "demo123",
    });
  });

  it("rejects unsupported routes", () => {
    expect(parsePortalRoute("/unknown")).toEqual({ type: "unsupported" });
    expect(parsePortalRoute("/p")).toEqual({ type: "unsupported" });
    expect(parsePortalRoute("/p/abc123/extra")).toEqual({
      type: "unsupported",
    });
    expect(parsePortalRoute("/p/abc123/embed/extra")).toEqual({
      type: "unsupported",
    });
    expect(parsePortalRoute("/d")).toEqual({ type: "unsupported" });
    expect(parsePortalRoute("/d/demo123/extra")).toEqual({
      type: "unsupported",
    });
    expect(parsePortalRoute("/d/demo123/embed/extra")).toEqual({
      type: "unsupported",
    });
    expect(parsePortalRoute("/organization")).toEqual({ type: "unsupported" });
    expect(parsePortalRoute("/organization/members/extra")).toEqual({
      type: "unsupported",
    });
    expect(parsePortalRoute("/invites")).toEqual({ type: "unsupported" });
    expect(parsePortalRoute("/invites/plain-token/extra")).toEqual({
      type: "unsupported",
    });
  });
});
