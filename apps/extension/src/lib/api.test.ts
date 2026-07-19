import { afterEach, describe, expect, it, vi } from "vitest";
import {
  completeCaptureSession,
  createCaptureEvent,
  createCaptureSession,
  getCaptureSession,
  getCurrentAuth,
  listProjectVersions,
  listProjects,
  login,
  logout,
  uploadCaptureAsset,
} from "./api";

const auth = {
  user: {
    id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_1",
    role: "owner",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-05T00:00:00.000Z",
  },
};

const project = {
  id: "project_1",
  organization_id: "organization_1",
  name: "Internal onboarding demos",
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
};

const captureSession = {
  id: "capture_session_1",
  organization_id: "organization_1",
  project_id: "project_1",
  name: "Capture from Example Page",
  description: null,
  status: "draft",
  source_type: "extension",
  started_at: null,
  completed_at: null,
  canceled_at: null,
  start_url: "https://example.com/path",
  browser_name: "Chrome",
  browser_version: null,
  operating_system: null,
  viewport_width: null,
  viewport_height: null,
  device_pixel_ratio: null,
  user_agent: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:00:00.000Z",
  updated_at: "2026-06-05T10:00:00.000Z",
};

const completedCaptureSession = {
  ...captureSession,
  status: "completed",
  completed_at: "2026-06-05T10:05:00.000Z",
};

const captureAsset = {
  id: "capture_asset_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_1",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 1024,
    original_name: "screenshot-2026-06-05T10-00-00-000Z.png",
    checksum_sha256: null,
  },
  asset_type: "screenshot",
  width: 1440,
  height: 900,
  device_pixel_ratio: 2,
  page_url: "https://example.com/path",
  page_title: "Example Page",
  captured_at: "2026-06-05T10:00:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:00:00.000Z",
  updated_at: "2026-06-05T10:00:00.000Z",
};

const captureEvent = {
  id: "capture_event_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: "capture_asset_1",
  event_type: "capture",
  event_index: 1,
  occurred_at: "2026-06-05T10:00:00.000Z",
  page_url: "https://example.com/path",
  page_title: "Example Page",
  target_label: null,
  target_selector: null,
  target_role: null,
  target_test_id: null,
  target_text: null,
  client_x: null,
  client_y: null,
  viewport_width: null,
  viewport_height: null,
  device_pixel_ratio: null,
  input_intent: null,
  input_value_redacted: true,
  note: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:00:00.000Z",
  updated_at: "2026-06-05T10:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extension API client", () => {
  it("logs in against the configured instance and returns the extension token", async () => {
    const response = { auth, session_token: "extension-session-token" };
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
    );
    vi.stubGlobal("fetch", fetch);

    await expect(
      login("https://demo.example.com", {
        email: "owner@example.com",
        password: "safe password",
      }),
    ).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "https://demo.example.com/api/v1/authentication/login",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-ossie-client": "extension",
        },
        body: JSON.stringify({
          email: "owner@example.com",
          password: "safe password",
        }),
      },
    );
  });

  it("checks current auth and lists projects with bearer auth", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ auth }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ projects: [project] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );
    vi.stubGlobal("fetch", fetch);

    await expect(
      getCurrentAuth("https://demo.example.com", "extension-session-token"),
    ).resolves.toEqual({ auth });
    await expect(
      listProjects("https://demo.example.com", "extension-session-token"),
    ).resolves.toEqual({ projects: [project] });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://demo.example.com/api/v1/authentication/me",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
          authorization: "Bearer extension-session-token",
        },
      },
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "https://demo.example.com/api/v1/projects?status=active&purpose=capture",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
          authorization: "Bearer extension-session-token",
          "x-ossie-client": "extension",
        },
      },
    );
  });

  it("lists active Project Versions and restores an exact Capture Session", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ project_versions: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ capture_session: captureSession }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetch);

    await expect(
      listProjectVersions(
        "https://demo.example.com",
        "extension-session-token",
        "project with spaces",
      ),
    ).resolves.toEqual({ project_versions: [] });
    await expect(
      getCaptureSession(
        "https://demo.example.com",
        "extension-session-token",
        "project with spaces",
        "capture/session",
      ),
    ).resolves.toEqual({ capture_session: captureSession });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://demo.example.com/api/v1/projects/project%20with%20spaces/versions?status=active",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
          authorization: "Bearer extension-session-token",
          "x-ossie-client": "extension",
        },
      },
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "https://demo.example.com/api/v1/projects/project%20with%20spaces/capture-sessions/capture%2Fsession",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
          authorization: "Bearer extension-session-token",
          "x-ossie-client": "extension",
        },
      },
    );
  });

  it("logs out with bearer auth", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);

    await expect(
      logout("https://demo.example.com", "extension-session-token"),
    ).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      "https://demo.example.com/api/v1/authentication/logout",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          authorization: "Bearer extension-session-token",
        },
      },
    );
  });

  it("creates capture sessions with bearer auth and extension attribution", async () => {
    const response = { capture_session: captureSession };
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(JSON.stringify(response), {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        }),
    );
    vi.stubGlobal("fetch", fetch);

    await expect(
      createCaptureSession(
        "https://demo.example.com/",
        "extension-session-token",
        "project with spaces",
        {
          name: "Capture from Example Page",
          project_version_id: "version_1",
          source_type: "extension",
          start_url: "https://example.com/path",
          metadata: {
            tab_title: "Example Page",
          },
        },
      ),
    ).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "https://demo.example.com/api/v1/projects/project%20with%20spaces/capture-sessions",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          authorization: "Bearer extension-session-token",
          "content-type": "application/json",
          "x-ossie-client": "extension",
        },
        body: JSON.stringify({
          name: "Capture from Example Page",
          project_version_id: "version_1",
          source_type: "extension",
          start_url: "https://example.com/path",
          metadata: {
            tab_title: "Example Page",
          },
        }),
      },
    );
  });

  it("uploads capture assets as bearer-authenticated multipart form data", async () => {
    const response = { capture_asset: captureAsset };
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(JSON.stringify(response), {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const file = new Blob(["fake png bytes"], { type: "image/png" });

    await expect(
      uploadCaptureAsset(
        "https://demo.example.com/",
        "extension-session-token",
        "project with spaces",
        "capture session with spaces",
        {
          file,
          fileName: "screenshot-2026-06-05T10-00-00-000Z.png",
          width: 1440,
          height: 900,
          devicePixelRatio: 2,
          pageUrl: "https://example.com/path",
          pageTitle: "Example Page",
          capturedAt: "2026-06-05T10:00:00.000Z",
          metadata: {
            extension_version: "0.1.0",
            capture_source: "extension_popup",
          },
        },
      ),
    ).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(
      "https://demo.example.com/api/v1/projects/project%20with%20spaces/capture-sessions/capture%20session%20with%20spaces/assets/upload",
    );
    expect(init).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
        authorization: "Bearer extension-session-token",
        "x-ossie-client": "extension",
      },
    });
    expect((init as RequestInit).headers).not.toHaveProperty("content-type");
    const body = (init as RequestInit).body;
    expect(body).toBeInstanceOf(FormData);
    const formData = body as FormData;
    expect(formData.get("width")).toBe("1440");
    expect(formData.get("height")).toBe("900");
    expect(formData.get("device_pixel_ratio")).toBe("2");
    expect(formData.get("page_url")).toBe("https://example.com/path");
    expect(formData.get("page_title")).toBe("Example Page");
    expect(formData.get("captured_at")).toBe("2026-06-05T10:00:00.000Z");
    expect(formData.get("metadata")).toBe(
      JSON.stringify({
        extension_version: "0.1.0",
        capture_source: "extension_popup",
      }),
    );
    const uploadedFile = formData.get("file");
    expect(uploadedFile).toBeInstanceOf(File);
    expect((uploadedFile as File).name).toBe(
      "screenshot-2026-06-05T10-00-00-000Z.png",
    );
    expect((uploadedFile as File).type).toBe("image/png");
  });

  it("creates capture events with bearer auth and safe screenshot metadata", async () => {
    const response = { capture_event: captureEvent };
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(JSON.stringify(response), {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        }),
    );
    vi.stubGlobal("fetch", fetch);

    await expect(
      createCaptureEvent(
        "https://demo.example.com/",
        "extension-session-token",
        "project with spaces",
        "capture session with spaces",
        {
          event_type: "capture",
          event_index: 1,
          capture_asset_id: "capture_asset_1",
          occurred_at: "2026-06-05T10:00:00.000Z",
          page_url: "https://example.com/path",
          page_title: "Example Page",
          input_value_redacted: true,
          metadata: {
            extension_version: "0.1.0",
            capture_source: "extension_popup",
            asset_type: "screenshot",
          },
        },
      ),
    ).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "https://demo.example.com/api/v1/projects/project%20with%20spaces/capture-sessions/capture%20session%20with%20spaces/events",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          authorization: "Bearer extension-session-token",
          "content-type": "application/json",
          "x-ossie-client": "extension",
        },
        body: JSON.stringify({
          event_type: "capture",
          event_index: 1,
          capture_asset_id: "capture_asset_1",
          occurred_at: "2026-06-05T10:00:00.000Z",
          page_url: "https://example.com/path",
          page_title: "Example Page",
          input_value_redacted: true,
          metadata: {
            extension_version: "0.1.0",
            capture_source: "extension_popup",
            asset_type: "screenshot",
          },
        }),
      },
    );
    const body = JSON.parse(
      (fetch.mock.calls[0]![1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(body).not.toHaveProperty("input_value");
    expect(body).not.toHaveProperty("value");
    expect(body).not.toHaveProperty("typed_value");
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("secret");
    expect(body).not.toHaveProperty("viewport_width");
    expect(body).not.toHaveProperty("viewport_height");
    expect(body).not.toHaveProperty("device_pixel_ratio");
  });

  it("creates click capture events with safe target metadata", async () => {
    const response = {
      capture_event: {
        ...captureEvent,
        event_type: "click",
        target_text: "Add Department",
        target_selector: "button[data-testid='add-department']",
        target_role: "button",
        client_x: 240,
        client_y: 80,
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 2,
      },
    };
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(JSON.stringify(response), {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        }),
    );
    vi.stubGlobal("fetch", fetch);

    await expect(
      createCaptureEvent(
        "https://demo.example.com/",
        "extension-session-token",
        "project with spaces",
        "capture session with spaces",
        {
          event_type: "click",
          event_index: 2,
          capture_asset_id: "capture_asset_1",
          occurred_at: "2026-06-05T10:00:00.000Z",
          page_url: "https://example.com/path",
          page_title: "Example Page",
          target_text: "Add Department",
          target_selector: "button[data-testid='add-department']",
          target_role: "button",
          client_x: 240,
          client_y: 80,
          viewport_width: 1440,
          viewport_height: 900,
          device_pixel_ratio: 2,
          input_value_redacted: true,
          metadata: {
            extension_version: "0.1.0",
            capture_source: "extension_auto_click",
            asset_type: "screenshot",
          },
        },
      ),
    ).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetch.mock.calls[0]![1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(body).toMatchObject({
      event_type: "click",
      event_index: 2,
      capture_asset_id: "capture_asset_1",
      target_text: "Add Department",
      target_selector: "button[data-testid='add-department']",
      target_role: "button",
      client_x: 240,
      client_y: 80,
      viewport_width: 1440,
      viewport_height: 900,
      device_pixel_ratio: 2,
      input_value_redacted: true,
    });
    expect(body).not.toHaveProperty("input_value");
    expect(body).not.toHaveProperty("value");
    expect(body).not.toHaveProperty("password");
  });

  it("completes capture sessions with bearer auth and no request body", async () => {
    const response = {
      capture_session: completedCaptureSession,
      redirect: {
        path: "/projects/project with spaces/capture-sessions/capture session with spaces",
        reason: "capture_session_completed",
      },
    };
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
    );
    vi.stubGlobal("fetch", fetch);

    await expect(
      completeCaptureSession(
        "https://demo.example.com/",
        "extension-session-token",
        "project with spaces",
        "capture session with spaces",
      ),
    ).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "https://demo.example.com/api/v1/projects/project%20with%20spaces/capture-sessions/capture%20session%20with%20spaces/complete",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          authorization: "Bearer extension-session-token",
          "x-ossie-client": "extension",
        },
      },
    );
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).not.toContain("extension-session-token");
    expect((init as RequestInit).body).toBeUndefined();
    expect((init as RequestInit).headers).not.toHaveProperty("content-type");
  });

  it("maps backend errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: {
                type: "invalid_credentials",
                message: "Email or password is incorrect",
              },
            }),
            {
              status: 401,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
      ),
    );

    await expect(
      login("https://demo.example.com", {
        email: "owner@example.com",
        password: "bad password",
      }),
    ).rejects.toMatchObject({
      type: "invalid_credentials",
      message: "Email or password is incorrect",
      status: 401,
    });
  });
});
