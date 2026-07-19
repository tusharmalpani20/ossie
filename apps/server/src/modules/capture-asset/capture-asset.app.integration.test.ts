import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { build } from "../../app";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import type { CaptureAsset } from "./capture-asset.service";

const capture_asset: CaptureAsset = {
  id: "capture_asset_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_1",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 1,
    original_name: null,
    checksum_sha256: null,
  },
  asset_type: "screenshot",
  width: null,
  height: null,
  device_pixel_ratio: null,
  page_url: null,
  page_title: null,
  captured_at: "2026-06-05T00:00:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

describe("capture asset app integration", () => {
  it("mounts capture asset routes on the project capture session path", async () => {
    const app = build({
      logger: false,
      access_event_writer: { append: async () => undefined },
      authentication_session_service: {
        login: async () => {
          throw new Error("not needed");
        },
        get_current_auth_context: async () => ({
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
        }),
        logout: async () => undefined,
      },
      capture_asset_service: {
        create_capture_asset: async () => capture_asset,
        upload_capture_asset: async () => capture_asset,
        list_capture_assets: async () => [capture_asset],
        list_project_capture_assets: async () => [{
          ...capture_asset,
          file_url: `/api/v1/projects/${capture_asset.project_id}/capture-sessions/${capture_asset.capture_session_id}/assets/${capture_asset.id}/file`,
        }],
        get_capture_asset: async () => capture_asset,
        get_capture_asset_file: async () => ({
          stream: Readable.from(Buffer.from("file")),
          mime_type: "image/png",
          size_bytes: 4,
        }),
        delete_capture_asset: async () => undefined,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets",
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ capture_assets: [capture_asset] });
    await app.close();
  });

  it("uses the default auth guard when no capture asset override is provided", async () => {
    const app = build({
      logger: false,
      authentication_session_service: {
        login: async () => {
          throw new Error("not needed");
        },
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
        logout: async () => undefined,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets",
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
