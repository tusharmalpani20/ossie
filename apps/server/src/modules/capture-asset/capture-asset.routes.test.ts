import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import {
  CaptureAssetNotFoundError,
  CaptureSessionNotFoundError,
  FileBytesNotFoundError,
  FileStorageKeyConflictError,
  FileStorageWriteFailedError,
  InvalidCaptureAssetInputError,
  ProjectNotFoundError,
  UnsupportedCaptureAssetUploadTypeError,
  UnsupportedFileStorageProviderError,
  UnsupportedCaptureAssetTypeError,
  UploadFileRequiredError,
  UploadTooLargeError,
  type CaptureAsset,
} from "./capture-asset.service";
import { build_capture_asset_routes } from "./capture-asset.routes";

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

const capture_asset: CaptureAsset = {
  id: "capture_asset_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_1",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 123456,
    original_name: "screenshot-1.png",
    checksum_sha256: "checksum",
  },
  asset_type: "screenshot",
  status: "active",
  width: 1440,
  height: 900,
  device_pixel_ratio: 1,
  page_url: "https://example.internal/app/department",
  page_title: "Department",
  captured_at: "2026-06-05T00:00:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const build_test_app = async (
  overrides: {
    auth_service?: Partial<
      Parameters<typeof build_capture_asset_routes>[0]["auth_service"]
    >;
    capture_asset_service?: Partial<
      Parameters<typeof build_capture_asset_routes>[0]["capture_asset_service"]
    >;
  } = {},
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
  await app.register(
    build_capture_asset_routes({
      auth_service: {
        get_current_auth_context: async () => auth_context,
        ...overrides.auth_service,
      },
      capture_asset_service: {
        create_capture_asset: async () => capture_asset,
        upload_capture_asset: async () => capture_asset,
        list_capture_assets: async () => [capture_asset],
        get_capture_asset: async () => capture_asset,
        get_capture_asset_file: async () => ({
          stream: Readable.from(Buffer.from("fake png bytes")),
          mime_type: "image/png",
          size_bytes: 14,
        }),
        archive_capture_asset: async () => ({
          ...capture_asset,
          status: "archived",
          version: 2,
        }),
        restore_capture_asset: async () => capture_asset,
        get_capture_asset_protection: async () => ({
          capture_asset_id: capture_asset.id,
          status: "archived",
          purge_operation_status: null,
          can_purge: true,
          total_dependency_count: 0,
          dependencies: [],
        }),
        purge_capture_asset: async () => ({
          capture_asset_id: capture_asset.id,
          purge_operation_id: "purge_1",
          status: "completed",
          attempt_count: 1,
        }),
        ...overrides.capture_asset_service,
        list_project_capture_assets:
          overrides.capture_asset_service?.list_project_capture_assets ??
          (async () => [
            {
              ...capture_asset,
              file_url: `/api/v1/projects/${capture_asset.project_id}/capture-sessions/${capture_asset.capture_session_id}/assets/${capture_asset.id}/file`,
            },
          ]),
      },
    }),
    { prefix: "/api/v1/projects" },
  );
  return app;
};

const multipart_payload = (
  parts: Array<{
    name: string;
    value: string | Buffer;
    filename?: string;
    content_type?: string;
  }>,
) => {
  const boundary = "----ossie-test-boundary";
  const chunks: Buffer[] = [];

  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${part.name}"${
          part.filename ? `; filename="${part.filename}"` : ""
        }\r\n`,
      ),
    );
    if (part.content_type) {
      chunks.push(Buffer.from(`Content-Type: ${part.content_type}\r\n`));
    }
    chunks.push(Buffer.from("\r\n"));
    chunks.push(
      Buffer.isBuffer(part.value) ? part.value : Buffer.from(part.value),
    );
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

describe("capture asset routes", () => {
  it("rejects requests without a valid auth session", async () => {
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
      },
    });

    for (const request of [
      {
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets",
        payload: {
          asset_type: "screenshot",
          file: {
            storage_key: "capture.png",
            mime_type: "image/png",
            size_bytes: 1,
          },
        },
      },
      {
        method: "GET",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets",
      },
      {
        method: "GET",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1",
      },
      {
        method: "GET",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/file",
      },
      {
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/archive",
        payload: { expected_asset_version: 1 },
      },
    ] as const) {
      const response = await app.inject(request);
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: {
          type: "unauthenticated",
          message: "Authentication is required",
        },
      });
    }

    await app.close();
  });

  it("uploads screenshot bytes as multipart form data", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      capture_asset_service: {
        upload_capture_asset: async (input) => {
          seen_inputs.push(input);
          return capture_asset;
        },
      },
    });
    const request_body = multipart_payload([
      {
        name: "file",
        filename: "screenshot.png",
        content_type: "image/png",
        value: Buffer.from("fake png bytes"),
      },
      { name: "width", value: "1440" },
      { name: "height", value: "900" },
      { name: "device_pixel_ratio", value: "2" },
      { name: "page_url", value: " https://example.internal " },
      { name: "page_title", value: " Example " },
      { name: "captured_at", value: "2026-06-05T10:00:00.000Z" },
      { name: "metadata", value: JSON.stringify({ step: 1 }) },
    ]);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/upload",
      cookies: {
        ossie_session: "session-token",
      },
      ...request_body,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ capture_asset });
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        file: {
          stream: expect.any(Object),
          mime_type: "image/png",
          original_name: "screenshot.png",
        },
        data: {
          width: 1440,
          height: 900,
          device_pixel_ratio: 2,
          page_url: " https://example.internal ",
          page_title: " Example ",
          captured_at: "2026-06-05T10:00:00.000Z",
          metadata: { step: 1 },
        },
      },
    ]);
    await app.close();
  });

  it("uploads screenshot bytes with bearer auth", async () => {
    const seen_tokens: Array<string | undefined> = [];
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          seen_tokens.push(session_token);
          return auth_context;
        },
      },
      capture_asset_service: {
        upload_capture_asset: async (input) => {
          seen_inputs.push(input);
          return capture_asset;
        },
      },
    });
    const request_body = multipart_payload([
      {
        name: "file",
        filename: "screenshot.png",
        content_type: "image/png",
        value: Buffer.from("fake png bytes"),
      },
      { name: "captured_at", value: "2026-06-05T10:00:00.000Z" },
    ]);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/upload",
      headers: {
        authorization: "Bearer extension-session-token",
        ...request_body.headers,
      },
      payload: request_body.payload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ capture_asset });
    expect(seen_tokens).toEqual(["extension-session-token"]);
    expect(seen_inputs).toEqual([
      expect.objectContaining({
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        file: expect.objectContaining({
          mime_type: "image/png",
          original_name: "screenshot.png",
        }),
        data: {
          captured_at: "2026-06-05T10:00:00.000Z",
        },
      }),
    ]);
    await app.close();
  });

  it("lists capture assets with bearer auth", async () => {
    const seen_tokens: Array<string | undefined> = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          seen_tokens.push(session_token);
          return auth_context;
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets?asset_type=screenshot",
      headers: {
        authorization: "Bearer extension-session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ capture_assets: [capture_asset] });
    expect(seen_tokens).toEqual(["extension-session-token"]);
    await app.close();
  });

  it("streams capture asset file bytes with private cache headers", async () => {
    const app = await build_test_app();

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/file",
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    expect(response.headers["content-length"]).toBe("14");
    expect(response.headers["cache-control"]).toBe("private, max-age=300");
    expect(response.body).toBe("fake png bytes");
    await app.close();
  });

  it("maps capture asset upload and file read errors to stable responses", async () => {
    const cases = [
      {
        service: "upload_capture_asset",
        error: new UploadFileRequiredError(),
        status: 400,
        type: "upload_file_required",
      },
      {
        service: "upload_capture_asset",
        error: new UnsupportedCaptureAssetUploadTypeError(),
        status: 400,
        type: "unsupported_capture_asset_upload_type",
      },
      {
        service: "upload_capture_asset",
        error: new UploadTooLargeError(),
        status: 413,
        type: "upload_too_large",
      },
      {
        service: "upload_capture_asset",
        error: new FileStorageWriteFailedError(),
        status: 500,
        type: "file_storage_write_failed",
      },
      {
        service: "get_capture_asset_file",
        error: new FileBytesNotFoundError(),
        status: 404,
        type: "file_bytes_not_found",
      },
      {
        service: "get_capture_asset_file",
        error: new UnsupportedFileStorageProviderError(),
        status: 400,
        type: "unsupported_file_storage_provider",
      },
    ] as const;

    for (const test_case of cases) {
      const app = await build_test_app({
        capture_asset_service: {
          [test_case.service]: async () => {
            throw test_case.error;
          },
        },
      });
      const request_body = multipart_payload([
        {
          name: "file",
          filename: "screenshot.png",
          content_type: "image/png",
          value: Buffer.from("fake png bytes"),
        },
      ]);
      const response = await app.inject(
        test_case.service === "upload_capture_asset"
          ? {
              method: "POST",
              url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/upload",
              cookies: { ossie_session: "session-token" },
              ...request_body,
            }
          : {
              method: "GET",
              url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/file",
              cookies: { ossie_session: "session-token" },
            },
      );

      expect(response.statusCode).toBe(test_case.status);
      expect(response.json().error.type).toBe(test_case.type);
      await app.close();
    }
  });

  it("rejects malformed multipart upload fields before the service", async () => {
    const seen_inputs: unknown[] = [];
    const cases = [
      {
        parts: [
          {
            name: "screenshot",
            filename: "screenshot.png",
            content_type: "image/png",
            value: Buffer.from("fake png bytes"),
          },
        ],
        status: 400,
        type: "upload_file_required",
      },
      {
        parts: [
          {
            name: "file",
            filename: "",
            content_type: "image/png",
            value: Buffer.from("fake png bytes"),
          },
        ],
        status: 400,
        type: "upload_file_required",
      },
      {
        parts: [
          {
            name: "file",
            filename: "screenshot.png",
            content_type: "image/png",
            value: Buffer.from("fake png bytes"),
          },
          { name: "captured_at", value: "not-a-date" },
        ],
        status: 400,
        type: "invalid_capture_asset_upload",
      },
      {
        parts: [
          {
            name: "file",
            filename: "screenshot.png",
            content_type: "image/png",
            value: Buffer.from("fake png bytes"),
          },
          { name: "captured_at", value: "2026-06-05" },
        ],
        status: 400,
        type: "invalid_capture_asset_upload",
      },
      {
        parts: [
          {
            name: "file",
            filename: "screenshot.png",
            content_type: "image/png",
            value: Buffer.from("fake png bytes"),
          },
          { name: "metadata", value: JSON.stringify(["not", "an", "object"]) },
        ],
        status: 400,
        type: "invalid_capture_asset_upload",
      },
    ];

    const app = await build_test_app({
      capture_asset_service: {
        upload_capture_asset: async (input) => {
          seen_inputs.push(input);
          return capture_asset;
        },
      },
    });

    for (const test_case of cases) {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/upload",
        cookies: {
          ossie_session: "session-token",
        },
        ...multipart_payload(test_case.parts),
      });

      expect(response.statusCode).toBe(test_case.status);
      expect(response.json().error.type).toBe(test_case.type);
    }

    expect(seen_inputs).toEqual([]);
    await app.close();
  });

  it("creates screenshot asset metadata with auth context and URL scope", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("session-token");
          return auth_context;
        },
      },
      capture_asset_service: {
        create_capture_asset: async (input) => {
          seen_inputs.push(input);
          return capture_asset;
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 1,
        page_url: "https://example.internal/app/department",
        page_title: "Department",
        organization_id: "attacker_org",
        project_id: "attacker_project",
        capture_session_id: "attacker_session",
        created_by_id: "attacker_org_user",
        metadata: {
          capture_mode: "manual",
        },
        file: {
          storage_provider: "local",
          storage_key: "captures/org/project/session/screenshot-1.png",
          mime_type: "image/png",
          size_bytes: 123456,
          original_name: "screenshot-1.png",
          checksum_sha256: "checksum",
          metadata: {
            absolute_path: "/tmp/secret.png",
          },
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: {
          asset_type: "screenshot",
          width: 1440,
          height: 900,
          device_pixel_ratio: 1,
          page_url: "https://example.internal/app/department",
          page_title: "Department",
          metadata: {
            capture_mode: "manual",
          },
          file: {
            storage_provider: "local",
            storage_key: "captures/org/project/session/screenshot-1.png",
            mime_type: "image/png",
            size_bytes: 123456,
            original_name: "screenshot-1.png",
            checksum_sha256: "checksum",
            metadata: {
              absolute_path: "/tmp/secret.png",
            },
          },
        },
      },
    ]);
    expect(response.json()).toEqual({ capture_asset });
    expect(JSON.stringify(response.json())).not.toContain("storage_key");
    expect(JSON.stringify(response.json())).not.toContain("metadata");
    expect(JSON.stringify(response.json())).not.toContain("is_deleted");
    expect(JSON.stringify(response.json())).not.toContain("deleted_at");
    expect(JSON.stringify(response.json())).not.toContain("deleted_by_id");

    await app.close();
  });

  it("lists, gets, and archives capture assets through the service", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      capture_asset_service: {
        list_capture_assets: async (input) => {
          seen_inputs.push(input);
          return [capture_asset];
        },
        get_capture_asset: async (input) => {
          seen_inputs.push(input);
          return capture_asset;
        },
        archive_capture_asset: async (input) => {
          seen_inputs.push(input);
          return { ...capture_asset, status: "archived" as const, version: 2 };
        },
      },
    });

    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets?asset_type=screenshot",
      cookies: {
        ossie_session: "session-token",
      },
    });
    const get_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1",
      cookies: {
        ossie_session: "session-token",
      },
    });
    const delete_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/archive",
      payload: { expected_asset_version: 1 },
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json()).toEqual({ capture_assets: [capture_asset] });
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json()).toEqual({ capture_asset });
    expect(delete_response.statusCode).toBe(200);
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
        include_archived: undefined,
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 1,
      },
    ]);

    await app.close();
  });

  it("maps capture asset domain errors to stable responses", async () => {
    const cases = [
      {
        error: new ProjectNotFoundError(),
        status: 404,
        type: "project_not_found",
      },
      {
        error: new CaptureSessionNotFoundError(),
        status: 404,
        type: "capture_session_not_found",
      },
      {
        error: new CaptureAssetNotFoundError(),
        status: 404,
        type: "capture_asset_not_found",
      },
      {
        error: new UnsupportedCaptureAssetTypeError(),
        status: 400,
        type: "unsupported_capture_asset_type",
      },
      {
        error: new InvalidCaptureAssetInputError(),
        status: 400,
        type: "invalid_capture_asset",
      },
      {
        error: new FileStorageKeyConflictError(),
        status: 409,
        type: "file_storage_key_conflict",
      },
    ];

    for (const test_case of cases) {
      const app = await build_test_app({
        capture_asset_service: {
          create_capture_asset: async () => {
            throw test_case.error;
          },
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets",
        cookies: {
          ossie_session: "session-token",
        },
        payload: {
          asset_type: "screenshot",
          file: {
            storage_key: "capture.png",
            mime_type: "image/png",
            size_bytes: 1,
          },
        },
      });

      expect(response.statusCode).toBe(test_case.status);
      expect(response.json().error.type).toBe(test_case.type);
      await app.close();
    }
  });

  it("rejects invalid route payloads before the service", async () => {
    const app = await build_test_app();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        asset_type: "screenshot",
        width: 0,
        file: {
          storage_key: "",
          mime_type: "image/png",
          size_bytes: -1,
        },
      },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
