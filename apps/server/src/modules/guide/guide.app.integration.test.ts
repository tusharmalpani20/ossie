import { describe, expect, it } from "vitest";
import { Readable } from "node:stream";
import { build } from "../../app";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import type { GuideDetail } from "./guide.service";

const guide_detail: GuideDetail = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: null,
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:00:00.000Z",
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  guide_blocks: [],
  source_capture_assets: [],
};

describe("guide app integration", () => {
  it("mounts guide routes on the project path", async () => {
    const app = build({
      logger: false,
      access_event_writer: { append: async () => undefined },
      authentication_session_service: {
        login: async () => {
          throw new Error("not needed");
        },
        get_current_auth_context: async () => ({
          user: { id: "user_1", email: "owner@example.com", display_name: "Owner User" },
          organization: { id: "organization_1", name: "Acme" },
          org_user: { id: "org_user_1", role: "owner" },
          session: { id: "session_1", session_type: "web", expires_at: "2026-07-05T00:00:00.000Z" },
        }),
        logout: async () => undefined,
      },
      guide_service: {
        create_guide_from_capture: async () => guide_detail,
        list_guides: async () => [guide_detail.guide],
        get_guide_detail: async () => guide_detail,
        export_guide_markdown: async () => ({
          filename: "department-guide.md",
          markdown: "# Department guide\n",
        }),
        export_guide_html_zip: async () => ({
          filename: "department-guide-html-export.zip",
          mime_type: "application/zip",
          stream: Readable.from(Buffer.from("zip-bytes")),
          size_bytes: 9,
        }),
        update_guide: async () => ({ ...guide_detail.guide, version: 2 }),
        update_guide_step: async () => {
          throw new Error("not needed");
        },
        create_guide_block: async () => [],
        update_guide_block: async () => {
          throw new Error("not needed");
        },
        update_guide_block_screenshot: async () => {
          throw new Error("not needed");
        },
        update_guide_block_annotations: async () => {
          throw new Error("not needed");
        },
        prepare_guide_block_screenshot_upload: async () => ({
          capture_session_id: "capture_session_1",
        }),
        reorder_guide_blocks: async () => [],
        delete_guide_block: async () => undefined,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides",
      cookies: { ossie_session: "session-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ guides: [guide_detail.guide] });
    await app.close();
  });

  it("uses the default auth guard when no guide override is provided", async () => {
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
      url: "/api/v1/projects/project_1/guides",
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
