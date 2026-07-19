import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";
import {
  CaptureAssetListQuerySchema,
  ProjectCaptureAssetListQuerySchema,
  CreateCaptureAssetRequestSchema,
  CaptureAssetLifecycleRequestSchema,
} from "@repo/types/capture";
import { z } from "zod";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { session_token_from_request } from "../authentication/request-session-token";
import { error_response, unauthorized_response } from "../shared/http-errors";
import {
  CaptureAssetNotFoundError,
  CaptureAssetLifecycleConflictError,
  CaptureAssetProtectedError,
  CaptureAssetPurgeFailedError,
  CaptureSessionNotFoundError,
  FileBytesNotFoundError,
  FileStorageKeyConflictError,
  FileStorageWriteFailedError,
  InvalidCaptureAssetUploadError,
  InvalidCaptureAssetInputError,
  ProjectNotFoundError,
  UnsupportedCaptureAssetUploadTypeError,
  UnsupportedFileStorageProviderError,
  UnsupportedCaptureAssetTypeError,
  UploadFileRequiredError,
  UploadTooLargeError,
  type CaptureAsset,
  type CaptureAssetAuthContext,
  type CaptureAssetFileRead,
  type CaptureAssetType,
  type CaptureAssetWithFileUrl,
  type CreateCaptureAssetInput,
  type UploadCaptureAssetInput,
} from "./capture-asset.service";

export type CaptureAssetRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  capture_asset_service: {
    create_capture_asset: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      data: CreateCaptureAssetInput;
    }) => Promise<CaptureAsset>;
    upload_capture_asset: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      file: {
        stream: NodeJS.ReadableStream;
        mime_type: string;
        original_name?: string | null;
      };
      data: UploadCaptureAssetInput;
    }) => Promise<CaptureAsset>;
    list_capture_assets: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      asset_type?: CaptureAssetType;
      include_archived?: boolean;
    }) => Promise<CaptureAsset[]>;
    list_project_capture_assets: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      project_version_id: string;
      asset_type?: CaptureAssetType;
    }) => Promise<CaptureAssetWithFileUrl[]>;
    get_capture_asset: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_asset_id: string;
    }) => Promise<CaptureAsset>;
    get_capture_asset_file: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_asset_id: string;
    }) => Promise<CaptureAssetFileRead>;
    archive_capture_asset: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_asset_id: string;
      expected_asset_version: number;
    }) => Promise<CaptureAsset>;
    restore_capture_asset: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_asset_id: string;
      expected_asset_version: number;
    }) => Promise<CaptureAsset>;
    get_capture_asset_protection: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_asset_id: string;
    }) => Promise<unknown>;
    purge_capture_asset: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_asset_id: string;
      expected_asset_version: number;
    }) => Promise<unknown>;
  };
};

const capture_asset_auth_context = (auth: AuthContext) => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const pick_create_capture_asset_data = (
  body: CreateCaptureAssetInput,
): CreateCaptureAssetInput => {
  const data: CreateCaptureAssetInput = {
    asset_type: body.asset_type,
    file: {
      storage_key: body.file.storage_key,
      mime_type: body.file.mime_type,
      size_bytes: body.file.size_bytes,
    },
  };

  if (body.width !== undefined) {
    data.width = body.width;
  }
  if (body.height !== undefined) {
    data.height = body.height;
  }
  if (body.device_pixel_ratio !== undefined) {
    data.device_pixel_ratio = body.device_pixel_ratio;
  }
  if (body.page_url !== undefined) {
    data.page_url = body.page_url;
  }
  if (body.page_title !== undefined) {
    data.page_title = body.page_title;
  }
  if (body.captured_at !== undefined) {
    data.captured_at = body.captured_at;
  }
  if (body.metadata !== undefined) {
    data.metadata = body.metadata;
  }
  if (body.file.storage_provider !== undefined) {
    data.file.storage_provider = body.file.storage_provider;
  }
  if (body.file.original_name !== undefined) {
    data.file.original_name = body.file.original_name;
  }
  if (body.file.checksum_sha256 !== undefined) {
    data.file.checksum_sha256 = body.file.checksum_sha256;
  }
  if (body.file.metadata !== undefined) {
    data.file.metadata = body.file.metadata;
  }

  return data;
};

const multipart_field_value = (
  fields: Record<string, unknown>,
  name: string,
) => {
  const field = fields[name] as
    | { value?: unknown }
    | { value?: unknown }[]
    | undefined;
  const first_field = Array.isArray(field) ? field[0] : field;
  const value = first_field?.value;

  return typeof value === "string" ? value : undefined;
};

const optional_positive_number_field = (
  fields: Record<string, unknown>,
  name: string,
  integer: boolean,
) => {
  const value = multipart_field_value(fields, name);

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0 ||
    (integer && !Number.isInteger(number))
  ) {
    throw new InvalidCaptureAssetUploadError();
  }

  return number;
};

const optional_metadata_field = (fields: Record<string, unknown>) => {
  const value = multipart_field_value(fields, "metadata");

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new InvalidCaptureAssetUploadError();
    }

    return parsed;
  } catch {
    throw new InvalidCaptureAssetUploadError();
  }
};

const optional_datetime_field = (
  fields: Record<string, unknown>,
  name: string,
) => {
  const value = multipart_field_value(fields, name);

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  if (!z.string().datetime().safeParse(value).success) {
    throw new InvalidCaptureAssetUploadError();
  }

  return value;
};

const pick_upload_capture_asset_data = (
  fields: Record<string, unknown>,
): UploadCaptureAssetInput => {
  const data: UploadCaptureAssetInput = {};
  const width = optional_positive_number_field(fields, "width", true);
  const height = optional_positive_number_field(fields, "height", true);
  const device_pixel_ratio = optional_positive_number_field(
    fields,
    "device_pixel_ratio",
    false,
  );
  const page_url = multipart_field_value(fields, "page_url");
  const page_title = multipart_field_value(fields, "page_title");
  const captured_at = optional_datetime_field(fields, "captured_at");
  const metadata = optional_metadata_field(fields);

  if (width !== undefined) {
    data.width = width;
  }
  if (height !== undefined) {
    data.height = height;
  }
  if (device_pixel_ratio !== undefined) {
    data.device_pixel_ratio = device_pixel_ratio;
  }
  if (page_url !== undefined) {
    data.page_url = page_url;
  }
  if (page_title !== undefined) {
    data.page_title = page_title;
  }
  if (captured_at !== undefined) {
    data.captured_at = captured_at;
  }
  if (metadata !== undefined) {
    data.metadata = metadata;
  }

  return data;
};

export const build_capture_asset_routes = (
  dependencies: CaptureAssetRouteDependencies,
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) =>
      capture_asset_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token),
      );

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      if (
        (error as { constraint?: string })?.constraint ===
        "capture_project_version_active_guard"
      ) {
        return reply
          .status(409)
          .send(
            error_response(
              "project_version_conflict",
              "Archived Project Versions are read-only",
            ),
          );
      }
      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(unauthorized_response());
      }

      if (error instanceof CaptureSessionNotFoundError) {
        return reply
          .status(404)
          .send(
            error_response(
              "capture_session_not_found",
              "Capture session was not found",
            ),
          );
      }

      if (error instanceof ProjectNotFoundError) {
        return reply
          .status(404)
          .send(error_response("project_not_found", "Project was not found"));
      }

      if (error instanceof CaptureAssetNotFoundError) {
        return reply
          .status(404)
          .send(
            error_response(
              "capture_asset_not_found",
              "Capture asset was not found",
            ),
          );
      }
      if (error instanceof CaptureAssetLifecycleConflictError)
        return reply
          .status(409)
          .send(
            error_response("capture_asset_lifecycle_conflict", error.message),
          );
      if (error instanceof CaptureAssetProtectedError)
        return reply
          .status(409)
          .send(error_response("capture_asset_protected", error.message));
      if (error instanceof CaptureAssetPurgeFailedError)
        return reply
          .status(503)
          .send(error_response("capture_asset_purge_failed", error.message));

      if (error instanceof UnsupportedCaptureAssetTypeError) {
        return reply
          .status(400)
          .send(
            error_response(
              "unsupported_capture_asset_type",
              "Capture asset type is not supported yet",
            ),
          );
      }

      if (error instanceof InvalidCaptureAssetInputError) {
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_capture_asset",
              "Capture asset input is invalid",
            ),
          );
      }

      if (error instanceof InvalidCaptureAssetUploadError) {
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_capture_asset_upload",
              "Capture asset upload input is invalid",
            ),
          );
      }

      if (error instanceof UnsupportedCaptureAssetUploadTypeError) {
        return reply
          .status(400)
          .send(
            error_response(
              "unsupported_capture_asset_upload_type",
              "Capture asset upload type is not supported",
            ),
          );
      }

      if (error instanceof UploadFileRequiredError) {
        return reply
          .status(400)
          .send(
            error_response("upload_file_required", "Upload file is required"),
          );
      }

      if (
        error instanceof UploadTooLargeError ||
        (error as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE"
      ) {
        return reply
          .status(413)
          .send(
            error_response(
              "upload_too_large",
              "Capture asset upload is too large",
            ),
          );
      }

      if (error instanceof FileBytesNotFoundError) {
        return reply
          .status(404)
          .send(
            error_response("file_bytes_not_found", "File bytes were not found"),
          );
      }

      if (error instanceof UnsupportedFileStorageProviderError) {
        return reply
          .status(400)
          .send(
            error_response(
              "unsupported_file_storage_provider",
              "File storage provider is not supported",
            ),
          );
      }

      if (error instanceof FileStorageWriteFailedError) {
        return reply
          .status(500)
          .send(
            error_response(
              "file_storage_write_failed",
              "File storage write failed",
            ),
          );
      }

      if (error instanceof FileStorageKeyConflictError) {
        return reply
          .status(409)
          .send(
            error_response(
              "file_storage_key_conflict",
              "File storage key already exists",
            ),
          );
      }

      throw error;
    };

    fastify.post<{
      Params: {
        project_id: string;
        capture_session_id: string;
      };
      Body: CreateCaptureAssetInput;
    }>(
      "/:project_id/capture-sessions/:capture_session_id/assets",
      {
        schema: {
          body: CreateCaptureAssetRequestSchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const capture_asset =
            await dependencies.capture_asset_service.create_capture_asset({
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.capture_session_id,
              data: pick_create_capture_asset_data(request.body),
            });
          return reply.status(201).send({ capture_asset });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.post<{
      Params: {
        project_id: string;
        capture_session_id: string;
      };
    }>(
      "/:project_id/capture-sessions/:capture_session_id/assets/upload",
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const upload = await request.file();

          if (!upload) {
            throw new UploadFileRequiredError();
          }

          if (upload.fieldname !== "file") {
            throw new UploadFileRequiredError();
          }

          if (!upload.filename?.trim()) {
            throw new InvalidCaptureAssetUploadError();
          }

          const capture_asset =
            await dependencies.capture_asset_service.upload_capture_asset({
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.capture_session_id,
              file: {
                stream: upload.file,
                mime_type: upload.mimetype,
                original_name: upload.filename,
              },
              data: pick_upload_capture_asset_data(upload.fields),
            });
          return reply.status(201).send({ capture_asset });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.get<{
      Params: {
        project_id: string;
      };
      Querystring: {
        project_version_id: string;
        asset_type?: CaptureAssetType;
      };
    }>(
      "/:project_id/capture-assets",
      {
        schema: {
          querystring: ProjectCaptureAssetListQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const capture_assets =
            await dependencies.capture_asset_service.list_project_capture_assets(
              {
                auth,
                project_id: request.params.project_id,
                project_version_id: request.query.project_version_id,
                asset_type: request.query.asset_type,
              },
            );
          return reply.status(200).send({ capture_assets });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.get<{
      Params: {
        project_id: string;
        capture_session_id: string;
      };
      Querystring: {
        asset_type?: CaptureAssetType;
        include_archived?: boolean;
      };
    }>(
      "/:project_id/capture-sessions/:capture_session_id/assets",
      {
        schema: {
          querystring: CaptureAssetListQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const capture_assets =
            await dependencies.capture_asset_service.list_capture_assets({
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.capture_session_id,
              asset_type: request.query.asset_type,
              include_archived: request.query.include_archived,
            });
          return reply.status(200).send({ capture_assets });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.get<{
      Params: {
        project_id: string;
        capture_session_id: string;
        id: string;
      };
    }>(
      "/:project_id/capture-sessions/:capture_session_id/assets/:id",
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const capture_asset =
            await dependencies.capture_asset_service.get_capture_asset({
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.capture_session_id,
              capture_asset_id: request.params.id,
            });
          return reply.status(200).send({ capture_asset });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.get<{
      Params: {
        project_id: string;
        capture_session_id: string;
        id: string;
      };
    }>(
      "/:project_id/capture-sessions/:capture_session_id/assets/:id/file",
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const file =
            await dependencies.capture_asset_service.get_capture_asset_file({
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.capture_session_id,
              capture_asset_id: request.params.id,
            });
          reply.header("Content-Type", file.mime_type);
          reply.header("Content-Length", String(file.size_bytes));
          reply.header("Cache-Control", "private, max-age=300");
          return reply.status(200).send(file.stream);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    const lifecycle = (command: "archive" | "restore") =>
      fastify.post<{
        Params: {
          project_id: string;
          capture_session_id: string;
          id: string;
        };
        Body: { expected_asset_version: number };
      }>(
        `/:project_id/capture-sessions/:capture_session_id/assets/:id/${command}`,
        { schema: { body: CaptureAssetLifecycleRequestSchema } },
        async (request, reply) => {
          try {
            const auth = await require_auth(
              session_token_from_request(request),
            );
            const capture_asset = await dependencies.capture_asset_service[
              command === "archive"
                ? "archive_capture_asset"
                : "restore_capture_asset"
            ]({
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.capture_session_id,
              capture_asset_id: request.params.id,
              expected_asset_version: request.body.expected_asset_version,
            });
            return reply.status(200).send({ capture_asset });
          } catch (error) {
            return handle_domain_error(error, reply);
          }
        },
      );
    lifecycle("archive");
    lifecycle("restore");
    fastify.get<{
      Params: { project_id: string; capture_session_id: string; id: string };
    }>(
      "/:project_id/capture-sessions/:capture_session_id/assets/:id/protection",
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          return reply
            .status(200)
            .send(
              await dependencies.capture_asset_service.get_capture_asset_protection(
                {
                  auth,
                  project_id: request.params.project_id,
                  capture_session_id: request.params.capture_session_id,
                  capture_asset_id: request.params.id,
                },
              ),
            );
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );
    fastify.delete<{
      Params: { project_id: string; capture_session_id: string; id: string };
      Body: { expected_asset_version: number };
    }>(
      "/:project_id/capture-sessions/:capture_session_id/assets/:id",
      { schema: { body: CaptureAssetLifecycleRequestSchema } },
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const result =
            await dependencies.capture_asset_service.purge_capture_asset({
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.capture_session_id,
              capture_asset_id: request.params.id,
              expected_asset_version: request.body.expected_asset_version,
            });
          return reply.status(200).send(result);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );
  };
};
