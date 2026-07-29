import { describe, expect, it } from "vitest";
import { buildPortalCaptureSessionUrl, normalizeInstanceUrl } from "./url";

describe("normalizeInstanceUrl", () => {
  it("normalizes valid http and https instance URLs", () => {
    expect(normalizeInstanceUrl(" http://localhost:4000/ ")).toEqual({
      ok: true,
      value: "http://localhost:4000",
    });
    expect(normalizeInstanceUrl("https://demo.example.com///")).toEqual({
      ok: true,
      value: "https://demo.example.com",
    });
  });

  it("rejects missing protocols and invalid URL strings", () => {
    expect(normalizeInstanceUrl("localhost:4000")).toEqual({
      ok: false,
      error: "Enter a valid http:// or https:// instance URL.",
    });
    expect(normalizeInstanceUrl("not a url")).toEqual({
      ok: false,
      error: "Enter a valid http:// or https:// instance URL.",
    });
  });

  it("preserves base paths and rejects credentials, queries, and fragments", () => {
    expect(normalizeInstanceUrl("https://demo.example.com/ossie/api/")).toEqual({
      ok: true,
      value: "https://demo.example.com/ossie/api",
    });

    for (const value of [
      "https://user:secret@demo.example.com",
      "https://demo.example.com?tenant=one",
      "https://demo.example.com/#capture",
    ]) {
      expect(normalizeInstanceUrl(value)).toEqual({
        ok: false,
        error: "Enter a valid http:// or https:// instance URL.",
      });
    }
  });
});

describe("buildPortalCaptureSessionUrl", () => {
  it("builds absolute portal URLs from safe relative redirect paths", () => {
    expect(buildPortalCaptureSessionUrl(
      "https://demo.example.com/",
      null,
      "/projects/project_1/capture-sessions/capture_session_1",
      "fallback_project",
      "main",
      "fallback_session"
    )).toBe("https://demo.example.com/projects/fallback_project/versions/main/capture-sessions/fallback_session");
  });

  it("falls back to encoded local paths when redirect paths are missing or unsafe", () => {
    expect(buildPortalCaptureSessionUrl(
      "https://demo.example.com///",
      null,
      null,
      "project with spaces",
      "Q3 latest",
      "capture/session"
    )).toBe("https://demo.example.com/projects/project%20with%20spaces/versions/Q3%20latest/capture-sessions/capture%2Fsession");

    expect(buildPortalCaptureSessionUrl(
      "https://demo.example.com",
      null,
      "https://evil.example/projects/project_1",
      "project with spaces",
      "main",
      "capture/session"
    )).toBe("https://demo.example.com/projects/project%20with%20spaces/versions/main/capture-sessions/capture%2Fsession");

    expect(buildPortalCaptureSessionUrl(
      "https://demo.example.com",
      null,
      "//evil.example/projects/project_1",
      "project with spaces",
      "main",
      "capture/session"
    )).toBe("https://demo.example.com/projects/project%20with%20spaces/versions/main/capture-sessions/capture%2Fsession");
  });

  it("uses a separate portal origin for split API and web deployments", () => {
    expect(buildPortalCaptureSessionUrl(
      "http://localhost:4021",
      "http://localhost:3000",
      "/projects/project_1/capture-sessions/capture_session_1",
      "fallback_project",
      "main",
      "fallback_session"
    )).toBe("http://localhost:3000/projects/fallback_project/versions/main/capture-sessions/fallback_session");

    expect(buildPortalCaptureSessionUrl(
      "http://localhost:4021",
      "http://localhost:3000/",
      "https://evil.example/projects/project_1",
      "project with spaces",
      "main",
      "capture/session"
    )).toBe("http://localhost:3000/projects/project%20with%20spaces/versions/main/capture-sessions/capture%2Fsession");
  });

  it("accepts only the exact canonical Capture Session redirect", () => {
    const expected =
      "https://portal.example.com/base/projects/project_1/versions/main/capture-sessions/session_1";
    const build = (redirectPath: string) =>
      buildPortalCaptureSessionUrl(
        "https://api.example.com/base",
        "https://portal.example.com/base",
        redirectPath,
        "project_1",
        "main",
        "session_1",
      );

    expect(
      build(
        "/projects/project_1/versions/main/capture-sessions/session_1",
      ),
    ).toBe(expected);
    expect(
      build(
        "/projects/other/versions/main/capture-sessions/session_1",
      ),
    ).toBe(expected);
    expect(
      build(
        "/projects/project_1/versions/other/capture-sessions/session_1",
      ),
    ).toBe(expected);
    expect(
      build(
        "/projects/project_1/versions/main/capture-sessions/other",
      ),
    ).toBe(expected);
    expect(
      build(
        "/projects/project_1/versions/main/capture-sessions/session_1?tab=events",
      ),
    ).toBe(expected);
    expect(
      build(
        "/projects/project_1/versions/main/capture-sessions/session_1#events",
      ),
    ).toBe(expected);
  });
});
