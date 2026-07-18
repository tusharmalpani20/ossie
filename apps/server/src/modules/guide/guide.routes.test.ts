import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastify from "fastify";
import { Readable } from "node:stream";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import type { CaptureAsset } from "../capture-asset/capture-asset.service";
import {
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  GuideBlockNotFoundError,
  GuideNotFoundError,
  GuideNotEditableError,
  GuideStepNotFoundError,
  InvalidGuideBlockContentError,
  InvalidGuideBlockOrderError,
  InvalidGuideBlockScreenshotError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
  ProjectNotFoundError,
  type GuideDetail,
} from "./guide.service";
import { build_guide_routes } from "./guide.routes";

const auth_context = {
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
  guide_blocks: [{
    id: "block_1",
    organization_id: "organization_1",
    project_id: "project_1",
    guide_id: "guide_1",
    source_capture_session_id: "capture_session_1",
    source_capture_event_id: "event_1",
    source_capture_asset_id: "asset_1",
    selected_capture_asset_id: null,
    screenshot_hidden: false,
    display_capture_asset_id: "asset_1",
    block_type: "step",
    content: null,
    block_index: 1,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:00:00.000Z",
    updated_at: "2026-06-05T00:00:00.000Z",
    step: {
      id: "step_1",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      title: "Navigate to \"Department List\"",
      body: null,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
    },
  }],
  source_capture_assets: [{
    id: "asset_1",
    capture_session_id: "capture_session_1",
    asset_type: "screenshot",
    width: 1440,
    height: 900,
    device_pixel_ratio: 1,
    page_url: "https://example.test/departments",
    page_title: "Department List",
    captured_at: "2026-06-05T00:00:00.000Z",
    file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
    file: {
      id: "file_1",
      original_name: "departments.png",
      mime_type: "image/png",
      size_bytes: 123456,
    },
  }],
};
const guide_block = guide_detail.guide_blocks[0]!;
const guide_step = guide_block.step!;
const uploaded_capture_asset: CaptureAsset = {
  id: "uploaded_asset_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_uploaded_1",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 123456,
    original_name: "replacement.png",
    checksum_sha256: "checksum",
  },
  asset_type: "screenshot",
  width: 1440,
  height: 900,
  device_pixel_ratio: 1,
  page_url: "https://example.test/departments/replacement",
  page_title: "Replacement",
  captured_at: "2026-06-05T00:10:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:10:00.000Z",
  updated_at: "2026-06-05T00:10:00.000Z",
};

const build_test_app = async (
  overrides: {
    auth_service?: Partial<Parameters<typeof build_guide_routes>[0]["auth_service"]>;
    guide_service?: Partial<Parameters<typeof build_guide_routes>[0]["guide_service"]>;
    capture_asset_service?: Partial<NonNullable<Parameters<typeof build_guide_routes>[0]["capture_asset_service"]>>;
    guide_screenshot_upload_service?: Parameters<typeof build_guide_routes>[0]["guide_screenshot_upload_service"];
  } = {}
) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: 20,
    },
  });
  await app.register(build_guide_routes({
    auth_service: {
      get_current_auth_context: async () => auth_context,
      ...overrides.auth_service,
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
      update_guide_step: async () => ({ ...guide_step, version: 2 }),
      reorder_guide_blocks: async () => guide_detail.guide_blocks,
      create_guide_block: async () => guide_detail.guide_blocks,
      update_guide_block: async () => ({ ...guide_block, block_type: "tip", content: { title: "Tip", body: "Details" }, step: null }),
      update_guide_block_annotations: async () => ({
        ...guide_block,
        content: {
          annotations: [{
            id: "ann_1",
            type: "highlight",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.4,
          }],
        },
      }),
      delete_guide_block: async () => undefined,
      prepare_guide_block_screenshot_upload: async () => ({ capture_session_id: "capture_session_1" }),
      ...overrides.guide_service,
      update_guide_block_screenshot: overrides.guide_service?.update_guide_block_screenshot ?? (async () => ({
        ...guide_block,
        selected_capture_asset_id: "asset_1",
        screenshot_hidden: false,
        display_capture_asset_id: "asset_1",
      })),
    },
    capture_asset_service: {
      upload_capture_asset: async () => uploaded_capture_asset,
      ...overrides.capture_asset_service,
    },
    guide_screenshot_upload_service: overrides.guide_screenshot_upload_service,
  }), { prefix: "/api/v1/projects" });
  return app;
};

const multipart_payload = (parts: Array<{
  name: string;
  value: string | Buffer;
  filename?: string;
  content_type?: string;
}>) => {
  const boundary = "----ossie-test-boundary";
  const chunks: Buffer[] = [];

  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(Buffer.from(
      `Content-Disposition: form-data; name="${part.name}"${
        part.filename ? `; filename="${part.filename}"` : ""
      }\r\n`
    ));
    if (part.content_type) {
      chunks.push(Buffer.from(`Content-Type: ${part.content_type}\r\n`));
    }
    chunks.push(Buffer.from("\r\n"));
    chunks.push(Buffer.isBuffer(part.value) ? part.value : Buffer.from(part.value));
    chunks.push(Buffer.from("\r\n"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
    payload: Buffer.concat(chunks),
  };
};

describe("guide routes", () => {
  it("creates a guide from a capture session using auth and URL scope", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("session-token");
          return auth_context;
        },
      },
      guide_service: {
        create_guide_from_capture: async (input) => {
          seen_inputs.push(input);
          return guide_detail;
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/from-capture-session/capture_session_1",
      cookies: { ossie_session: "session-token" },
      payload: {
        title: "Department guide",
        description: null,
        selected_capture_event_ids: ["event_2", "event_1"],
        organization_id: "attacker_org",
        target_selector: "button.secret",
        input_intent: "typed real value",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        title: "Department guide",
        description: null,
        selected_capture_event_ids: ["event_2", "event_1"],
      },
    }]);
    expect(response.json()).toEqual(guide_detail);
    expect(JSON.stringify(response.json())).not.toContain("target_selector");
    expect(JSON.stringify(response.json())).not.toContain("input_intent");
    expect(JSON.stringify(response.json())).not.toContain("storage_key");
    await app.close();
  });

  it("lists and gets guide details", async () => {
    const app = await build_test_app();

    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides",
      cookies: { ossie_session: "session-token" },
    });
    const get_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides/guide_1",
      cookies: { ossie_session: "session-token" },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json()).toEqual({ guides: [guide_detail.guide] });
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json()).toEqual(guide_detail);
    expect(JSON.stringify(get_response.json())).not.toContain("storage_key");
    expect(JSON.stringify(get_response.json())).not.toContain("checksum_sha256");
    await app.close();
  });

  it("exports guide markdown through the service", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("session-token");
          return auth_context;
        },
      },
      guide_service: {
        export_guide_markdown: async (input) => {
          seen_inputs.push(input);
          return {
            filename: "department-guide.md",
            markdown: "# Department guide\n",
          };
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides/guide_1/export/markdown?organization_id=attacker",
      cookies: { ossie_session: "session-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      filename: "department-guide.md",
      markdown: "# Department guide\n",
    });
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      guide_id: "guide_1",
    }]);
    expect(JSON.stringify(response.json())).not.toContain("attacker");
    await app.close();
  });

  it("exports guide HTML ZIP through the service", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      guide_service: {
        export_guide_html_zip: async (input) => {
          seen_inputs.push(input);
          return {
            filename: "department-guide-html-export.zip",
            mime_type: "application/zip",
            stream: Readable.from(Buffer.from("zip-bytes")),
            size_bytes: 9,
          };
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides/guide_1/export/html.zip?organization_id=attacker",
      cookies: { ossie_session: "session-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/zip");
    expect(response.headers["content-length"]).toBe("9");
    expect(response.headers["content-disposition"]).toBe(
      "attachment; filename=\"department-guide-html-export.zip\""
    );
    expect(response.body).toBe("zip-bytes");
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      guide_id: "guide_1",
    }]);
    await app.close();
  });

  it("updates guide metadata with auth and URL scope while ignoring client-managed fields", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      guide_service: {
        update_guide: async (input) => {
          seen_inputs.push(input);
          return { ...guide_detail.guide, title: "Updated", description: null, status: "archived", version: 2 };
        },
      },
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/guides/guide_1",
      cookies: { ossie_session: "session-token" },
      payload: {
        title: "Updated",
        description: null,
        status: "archived",
        organization_id: "attacker",
        version: 999,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().guide).toMatchObject({ title: "Updated", status: "archived", version: 2 });
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        title: "Updated",
        description: null,
        status: "archived",
      },
    }]);
  });

  it("updates guide steps reorders blocks and deletes blocks through the service", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      guide_service: {
        update_guide_step: async (input) => {
          seen_inputs.push(input);
          return { ...guide_step, title: "Updated step", body: "Details", version: 2 };
        },
        reorder_guide_blocks: async (input) => {
          seen_inputs.push(input);
          return [{ ...guide_block, id: "block_2", block_index: 1 }];
        },
        delete_guide_block: async (input) => {
          seen_inputs.push(input);
        },
      },
    });

    const step_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/guides/guide_1/steps/step_1",
      cookies: { ossie_session: "session-token" },
      payload: {
        title: "Updated step",
        body: "Details",
        source_capture_event_id: "attacker_event",
      },
    });
    const reorder_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/reorder",
      cookies: { ossie_session: "session-token" },
      payload: {
        block_ids: ["block_2", "block_1"],
      },
    });
    const delete_response = await app.inject({
      method: "DELETE",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/block_1",
      cookies: { ossie_session: "session-token" },
    });

    expect(step_response.statusCode).toBe(200);
    expect(step_response.json().guide_step).toMatchObject({ title: "Updated step", body: "Details", version: 2 });
    expect(reorder_response.statusCode).toBe(200);
    expect(reorder_response.json().guide_blocks).toEqual([{ ...guide_block, id: "block_2", block_index: 1 }]);
    expect(delete_response.statusCode).toBe(204);
    expect(delete_response.body).toBe("");
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
        guide_step_id: "step_1",
        data: {
          title: "Updated step",
          body: "Details",
        },
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
        block_ids: ["block_2", "block_1"],
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_1",
      },
    ]);
  });

  it("creates and updates guide blocks through the service while ignoring client-managed fields", async () => {
    const seen_inputs: unknown[] = [];
    const tip_block = {
      ...guide_block,
      id: "block_tip",
      block_type: "tip" as const,
      content: {
        title: "Helpful hint",
        body: "Use this when needed.",
      },
      step: null,
    };
    const app = await build_test_app({
      guide_service: {
        create_guide_block: async (input) => {
          seen_inputs.push(input);
          return [guide_block, tip_block];
        },
        update_guide_block: async (input) => {
          seen_inputs.push(input);
          return {
            ...tip_block,
            content: input.data.content ?? null,
            version: 2,
          };
        },
      },
    });

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks",
      cookies: { ossie_session: "session-token" },
      payload: {
        block_type: "tip",
        position: {
          placement: "after",
          guide_block_id: "block_1",
        },
        content: {
          title: "Helpful hint",
          body: "Use this when needed.",
        },
        block_index: 999,
        organization_id: "attacker",
      },
    });
    const update_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/block_tip",
      cookies: { ossie_session: "session-token" },
      payload: {
        content: {
          title: "Updated tip",
          body: "Updated body.",
        },
        block_type: "step",
        version: 999,
      },
    });

    expect(create_response.statusCode).toBe(201);
    expect(create_response.json().guide_blocks).toEqual([guide_block, tip_block]);
    expect(update_response.statusCode).toBe(200);
    expect(update_response.json().guide_block).toMatchObject({
      id: "block_tip",
      content: {
        title: "Updated tip",
        body: "Updated body.",
      },
      version: 2,
    });
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
        data: {
          block_type: "tip",
          position: {
            placement: "after",
            guide_block_id: "block_1",
          },
          step: undefined,
          content: {
            title: "Helpful hint",
            body: "Use this when needed.",
          },
        },
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_tip",
        data: {
          content: {
            title: "Updated tip",
            body: "Updated body.",
          },
        },
      },
    ]);
    expect(JSON.stringify(create_response.json())).not.toContain("attacker");
    await app.close();
  });

  it("creates paragraph and divider guide blocks through the service", async () => {
    const seen_inputs: unknown[] = [];
    const paragraph_block = {
      ...guide_block,
      id: "block_paragraph",
      block_type: "paragraph" as const,
      content: {
        body: "Add supporting context.",
      },
      step: null,
    };
    const divider_block = {
      ...guide_block,
      id: "block_divider",
      block_type: "divider" as const,
      content: null,
      step: null,
    };
    const app = await build_test_app({
      guide_service: {
        create_guide_block: async (input) => {
          seen_inputs.push(input);
          return input.data.block_type === "paragraph" ? [paragraph_block] : [divider_block];
        },
      },
    });

    const paragraph_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks",
      cookies: { ossie_session: "session-token" },
      payload: {
        block_type: "paragraph",
        position: {
          placement: "after",
          guide_block_id: "block_1",
        },
        content: {
          body: "Add supporting context.",
        },
      },
    });
    const divider_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks",
      cookies: { ossie_session: "session-token" },
      payload: {
        block_type: "divider",
        position: {
          placement: "after",
          guide_block_id: "block_paragraph",
        },
        content: {
          body: null,
        },
      },
    });

    expect(paragraph_response.statusCode).toBe(201);
    expect(divider_response.statusCode).toBe(201);
    expect(seen_inputs).toEqual([
      expect.objectContaining({
        data: {
          block_type: "paragraph",
          position: {
            placement: "after",
            guide_block_id: "block_1",
          },
          step: undefined,
          content: {
            body: "Add supporting context.",
          },
        },
      }),
      expect.objectContaining({
        data: {
          block_type: "divider",
          position: {
            placement: "after",
            guide_block_id: "block_paragraph",
          },
          step: undefined,
          content: {
            body: null,
          },
        },
      }),
    ]);
    await app.close();
  });

  it("updates guide block screenshot selection through the service", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      guide_service: {
        update_guide_block_screenshot: async (input) => {
          seen_inputs.push(input);
          return {
            ...guide_block,
            selected_capture_asset_id: input.data.capture_asset_id,
            screenshot_hidden: input.data.capture_asset_id === null,
            display_capture_asset_id: input.data.capture_asset_id,
          };
        },
      },
    });

    const replace_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/block_1/screenshot",
      cookies: { ossie_session: "session-token" },
      payload: {
        capture_asset_id: "asset_2",
        organization_id: "attacker",
        selected_capture_asset_id: "attacker_asset",
      },
    });
    const remove_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/block_1/screenshot",
      cookies: { ossie_session: "session-token" },
      payload: {
        capture_asset_id: null,
      },
    });

    expect(replace_response.statusCode).toBe(200);
    expect(replace_response.json().guide_block).toMatchObject({
      id: "block_1",
      selected_capture_asset_id: "asset_2",
      screenshot_hidden: false,
      display_capture_asset_id: "asset_2",
    });
    expect(remove_response.statusCode).toBe(200);
    expect(remove_response.json().guide_block).toMatchObject({
      id: "block_1",
      selected_capture_asset_id: null,
      screenshot_hidden: true,
      display_capture_asset_id: null,
    });
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_1",
        data: {
          capture_asset_id: "asset_2",
        },
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_1",
        data: {
          capture_asset_id: null,
        },
      },
    ]);
    expect(JSON.stringify(replace_response.json())).not.toContain("attacker");
    await app.close();
  });

  it("updates guide block annotations through the service", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      guide_service: {
        update_guide_block_annotations: async (input) => {
          seen_inputs.push(input);
          return {
            ...guide_block,
            content: {
              annotations: [{
                id: "ann_saved",
                type: "highlight" as const,
                x: 0.1,
                y: 0.2,
                width: 0.3,
                height: 0.4,
              }],
            },
          };
        },
      },
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/block_1/annotations",
      cookies: { ossie_session: "session-token" },
      payload: {
        annotations: [{
          id: "client_managed",
          type: "highlight",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
          organization_id: "attacker",
        }],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().guide_block.content).toEqual({
      annotations: [{
        id: "ann_saved",
        type: "highlight",
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.4,
      }],
    });
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      data: {
        annotations: [{
          id: "client_managed",
          type: "highlight",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
        }],
      },
    }]);
    expect(JSON.stringify(response.json())).not.toContain("attacker");
    await app.close();
  });

  it("uploads a guide block screenshot then selects the uploaded asset", async () => {
    const seen_inputs: unknown[] = [];
    const seen_order: string[] = [];
    const app = await build_test_app({
      guide_service: {
        prepare_guide_block_screenshot_upload: async (input) => {
          seen_order.push("prepare");
          seen_inputs.push({ step: "prepare", input });
          return { capture_session_id: "capture_session_1" };
        },
        update_guide_block_screenshot: async (input) => {
          seen_order.push("select");
          seen_inputs.push({ step: "select", input });
          return {
            ...guide_block,
            selected_capture_asset_id: input.data.capture_asset_id,
            screenshot_hidden: false,
            display_capture_asset_id: input.data.capture_asset_id,
          };
        },
      },
      capture_asset_service: {
        upload_capture_asset: async (input) => {
          seen_order.push("upload");
          seen_inputs.push({ step: "upload", input });
          return uploaded_capture_asset;
        },
      },
    });
    const request_body = multipart_payload([
      {
        name: "file",
        filename: "replacement.png",
        content_type: "image/png",
        value: Buffer.from("replacement png bytes"),
      },
      { name: "width", value: "1440" },
      { name: "height", value: "900" },
      { name: "device_pixel_ratio", value: "2" },
      { name: "page_url", value: " https://example.test/replacement " },
      { name: "page_title", value: " Replacement " },
      { name: "captured_at", value: "2026-06-05T10:00:00.000Z" },
      { name: "metadata", value: JSON.stringify({ source: "editor" }) },
      { name: "capture_session_id", value: "attacker_session" },
    ]);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/block_1/screenshot-upload",
      cookies: { ossie_session: "session-token" },
      ...request_body,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      guide_block: {
        ...guide_block,
        selected_capture_asset_id: "uploaded_asset_1",
        screenshot_hidden: false,
        display_capture_asset_id: "uploaded_asset_1",
      },
      capture_asset: {
        ...uploaded_capture_asset,
        file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/uploaded_asset_1/file",
      },
    });
    expect(seen_order).toEqual(["prepare", "upload", "select"]);
    expect(seen_inputs).toEqual([
      {
        step: "prepare",
        input: {
          auth: {
            organization_id: "organization_1",
            actor_org_user_id: "org_user_1",
          },
          project_id: "project_1",
          guide_id: "guide_1",
          guide_block_id: "block_1",
        },
      },
      {
        step: "upload",
        input: {
          auth: {
            organization_id: "organization_1",
            actor_org_user_id: "org_user_1",
          },
          project_id: "project_1",
          capture_session_id: "capture_session_1",
          file: {
            stream: expect.any(Object),
            mime_type: "image/png",
            original_name: "replacement.png",
          },
          data: {
            width: 1440,
            height: 900,
            device_pixel_ratio: 2,
            page_url: " https://example.test/replacement ",
            page_title: " Replacement ",
            captured_at: "2026-06-05T10:00:00.000Z",
            metadata: { source: "editor" },
          },
        },
      },
      {
        step: "select",
        input: {
          auth: {
            organization_id: "organization_1",
            actor_org_user_id: "org_user_1",
          },
          project_id: "project_1",
          guide_id: "guide_1",
          guide_block_id: "block_1",
          data: {
            capture_asset_id: "uploaded_asset_1",
          },
        },
      },
    ]);
    expect(JSON.stringify(response.json())).not.toContain("attacker_session");
    await app.close();
  });

  it("uses the atomic Guide screenshot upload command when available", async () => {
    const upload = vi.fn(async () => ({
      capture_asset: uploaded_capture_asset,
      guide_block: {
        ...guide_block,
        selected_capture_asset_id: uploaded_capture_asset.id,
        screenshot_hidden: false,
        display_capture_asset_id: uploaded_capture_asset.id,
      },
    }));
    const upload_capture_asset = vi.fn();
    const update_guide_block_screenshot = vi.fn();
    const app = await build_test_app({
      guide_screenshot_upload_service: { upload },
      capture_asset_service: { upload_capture_asset },
      guide_service: { update_guide_block_screenshot },
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/block_1/screenshot-upload",
      cookies: { ossie_session: "session-token" },
      ...multipart_payload([{ name: "file", filename: "replacement.png", content_type: "image/png", value: Buffer.from("replacement png bytes") }]),
    });

    expect(response.statusCode).toBe(201);
    expect(upload).toHaveBeenCalledOnce();
    expect(upload_capture_asset).not.toHaveBeenCalled();
    expect(update_guide_block_screenshot).not.toHaveBeenCalled();
    await app.close();
  });

  it("does not upload guide screenshot bytes when preflight fails", async () => {
    const upload_capture_asset = vi.fn(async () => uploaded_capture_asset);
    const app = await build_test_app({
      guide_service: {
        prepare_guide_block_screenshot_upload: async () => {
          throw new GuideBlockNotFoundError();
        },
      },
      capture_asset_service: {
        upload_capture_asset,
      },
    });
    const request_body = multipart_payload([
      {
        name: "file",
        filename: "replacement.png",
        content_type: "image/png",
        value: Buffer.from("replacement png bytes"),
      },
    ]);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/missing_block/screenshot-upload",
      cookies: { ossie_session: "session-token" },
      ...request_body,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.type).toBe("guide_block_not_found");
    expect(upload_capture_asset).not.toHaveBeenCalled();
    await app.close();
  });

  it("does not report success when guide screenshot selection fails after upload", async () => {
    const app = await build_test_app({
      guide_service: {
        prepare_guide_block_screenshot_upload: async () => ({ capture_session_id: "capture_session_1" }),
        update_guide_block_screenshot: async () => {
          throw new InvalidGuideBlockScreenshotError();
        },
      },
      capture_asset_service: {
        upload_capture_asset: async () => uploaded_capture_asset,
      },
    });
    const request_body = multipart_payload([
      {
        name: "file",
        filename: "replacement.png",
        content_type: "image/png",
        value: Buffer.from("replacement png bytes"),
      },
    ]);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/blocks/block_1/screenshot-upload",
      cookies: { ossie_session: "session-token" },
      ...request_body,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.type).toBe("invalid_guide_block_screenshot");
    await app.close();
  });

  it("maps auth and domain errors to stable responses", async () => {
    const unauthenticated_app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
      },
    });
    const unauthenticated_response = await unauthenticated_app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides",
    });
    expect(unauthenticated_response.statusCode).toBe(401);
    expect(unauthenticated_response.json().error.type).toBe("unauthenticated");
    await unauthenticated_app.close();

    const cases = [
      { error: new ProjectNotFoundError(), status: 404, type: "project_not_found" },
      { error: new CaptureSessionNotFoundError(), status: 404, type: "capture_session_not_found" },
      { error: new CaptureEventNotFoundError(), status: 404, type: "capture_event_not_found" },
      { error: new GuideNotFoundError(), status: 404, type: "guide_not_found" },
      { error: new InvalidGuideInputError(), status: 400, type: "invalid_guide" },
      { error: new GuideStepNotFoundError(), status: 404, type: "guide_step_not_found" },
      { error: new GuideBlockNotFoundError(), status: 404, type: "guide_block_not_found" },
      { error: new InvalidGuideBlockOrderError(), status: 400, type: "invalid_guide_block_order" },
      { error: new InvalidGuideBlockContentError(), status: 400, type: "invalid_guide_block_content" },
      { error: new InvalidGuideBlockScreenshotError(), status: 400, type: "invalid_guide_block_screenshot" },
      { error: new InvalidGuideStepInputError(), status: 400, type: "invalid_guide_step" },
      { error: new GuideNotEditableError(), status: 409, type: "guide_not_editable" },
    ];

    for (const test_case of cases) {
      const app = await build_test_app({
        guide_service: {
          create_guide_from_capture: async () => {
            throw test_case.error;
          },
        },
      });
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/projects/project_1/guides/from-capture-session/capture_session_1",
        cookies: { ossie_session: "session-token" },
        payload: { title: "Guide" },
      });

      expect(response.statusCode).toBe(test_case.status);
      expect(response.json().error.type).toBe(test_case.type);
      await app.close();
    }
  });
});
