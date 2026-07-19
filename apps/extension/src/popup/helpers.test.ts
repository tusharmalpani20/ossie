import { describe, expect, it, vi } from "vitest";
import { ApiClientError, type Project } from "../lib/api";
import type { CurrentTabSnapshot } from "../lib/current-tab";
import {
  browserNameFromUserAgent,
  buildCaptureName,
  buildCaptureSessionInput,
  errorMessage,
  persistManualCaptureDiagnostic,
  screenshotFileName,
} from "./helpers";

const project = (name: string): Project => ({
  id: "project_1",
  organization_id: "organization_1",
  name,
  description: null,
  slug: null,
  color: null,
  icon: null,
  status: "active",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:00:00.000Z",
  updated_at: "2026-06-05T10:05:00.000Z",
  access: { role: "editor", source: "project_membership" },
  default_project_version: { id: "version_1", name: "Main", slug: "main", status: "active", position: 1 },
});

const tab = (input: Partial<CurrentTabSnapshot>): CurrentTabSnapshot => ({
  url: Object.hasOwn(input, "url") ? input.url ?? null : "https://example.com/path",
  title: Object.hasOwn(input, "title") ? input.title ?? null : "Example Page",
});

describe("popup helpers", () => {
  it("uses API client messages and fallback messages consistently", () => {
    expect(errorMessage(new ApiClientError({
      status: 401,
      type: "unauthenticated",
      message: "Authentication is required",
    }), "Fallback")).toBe("Authentication is required");

    expect(errorMessage(new Error("Network failed"), "Fallback")).toBe("Fallback");
  });

  it("builds capture names from tab titles, project names, and fallback text", () => {
    expect(buildCaptureName({ project: project("Project Name"), tab: tab({ title: " Example Page " }) })).toBe(
      "Capture from Example Page",
    );
    expect(buildCaptureName({ project: project(" Project Name "), tab: tab({ title: " " }) })).toBe(
      "Capture from Project Name",
    );
    expect(buildCaptureName({ project: null, tab: tab({ title: null }) })).toBe("Extension capture");
  });

  it("builds extension capture session input with safe tab metadata", () => {
    expect(buildCaptureSessionInput({
      project: project("Project Name"),
      tab: tab({ title: "Example Page", url: "https://example.com/path" }),
      userAgent: "Mozilla/5.0 Chrome/126.0.0.0",
    })).toEqual({
      name: "Capture from Example Page",
      source_type: "extension",
      start_url: "https://example.com/path",
      browser_name: "Chrome",
      user_agent: "Mozilla/5.0 Chrome/126.0.0.0",
      metadata: {
        extension_version: "0.1.0",
        tab_title: "Example Page",
      },
    });
  });

  it("preserves an explicit null user agent override", () => {
    expect(buildCaptureSessionInput({
      project: null,
      tab: tab({ title: "Example Page", url: "https://example.com/path" }),
      userAgent: null,
    })).toMatchObject({
      browser_name: null,
      user_agent: null,
    });
  });

  it("formats screenshot filenames and browser names", () => {
    expect(screenshotFileName("2026-06-05T10:00:00.000Z")).toBe(
      "screenshot-2026-06-05T10-00-00-000Z.png",
    );
    expect(browserNameFromUserAgent("Mozilla/5.0 Chrome/126.0.0.0")).toBe("Chrome");
    expect(browserNameFromUserAgent("Mozilla/5.0 Firefox/128.0")).toBeNull();
    expect(browserNameFromUserAgent(null)).toBeNull();
  });

  it("does not let manual diagnostic persistence failures hide capture outcomes", async () => {
    const saveManualCaptureDiagnostic = vi.fn(async () => {
      throw new Error("storage unavailable");
    });

    await expect(persistManualCaptureDiagnostic(saveManualCaptureDiagnostic, {
      status: "failed",
      message: "Capture asset upload is too large",
      eventIndex: null,
      occurredAt: "2026-06-05T10:00:00.000Z",
    })).resolves.toBeUndefined();

    expect(saveManualCaptureDiagnostic).toHaveBeenCalledWith({
      status: "failed",
      message: "Capture asset upload is too large",
      eventIndex: null,
      occurredAt: "2026-06-05T10:00:00.000Z",
    });
  });
});
