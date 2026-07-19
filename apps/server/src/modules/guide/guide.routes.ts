import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";
import {
  CreateGuideBlockRequestSchema,
  CreateGuideFromCaptureRequestSchema,
  ReorderGuideBlocksRequestSchema,
  UpdateGuideBlockAnnotationsRequestSchema,
  UpdateGuideBlockRequestSchema,
  UpdateGuideBlockScreenshotRequestSchema,
  UpdateGuideRequestSchema,
  UpdateGuideEditionStatusRequestSchema,
  UpdateGuideStepRequestSchema,
  GuideVersionQuerySchema,
  GuideContentDeleteQuerySchema,
  type GuideVersionQuery,
  type GuideContentDeleteQuery,
} from "@repo/types/guide";
import { z } from "zod";
import { CaptureArtifactVersionNotReadyError } from "@repo/capture-domain";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { web_session_cookie_name } from "../authentication/session-cookie";
import { error_response, unauthorized_response } from "../shared/http-errors";
import {
  FileStorageKeyConflictError,
  FileStorageWriteFailedError,
  InvalidCaptureAssetUploadError,
  UnsupportedCaptureAssetUploadTypeError,
  UploadFileRequiredError,
  UploadTooLargeError,
  type CaptureAsset,
  type CaptureAssetWithFileUrl,
  type UploadCaptureAssetInput,
} from "../capture-asset/capture-asset.service";
import {
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  GuideBlockNotFoundError,
  GuideExportFileNotFoundError,
  GuideNotFoundError,
  GuideNotEditableError,
  GuideStepNotFoundError,
  InvalidGuideBlockOrderError,
  InvalidGuideBlockContentError,
  InvalidGuideBlockScreenshotError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
  ProjectNotFoundError,
  UnsupportedGuideExportStorageProviderError,
  type CreateGuideBlockInput,
  type CreateGuideFromCaptureInput,
  type Guide,
  type GuideAuthContext,
  type GuideBlock,
  type GuideDetail,
  type GuideHtmlZipExport,
  type GuideMarkdownExport,
  type GuideStep,
  type GuideSummary,
  type GuideWorkingDraft,
  type PrepareGuideBlockScreenshotUploadResult,
  type UpdateGuideInput,
  type UpdateGuideBlockAnnotationsInput,
  type UpdateGuideBlockInput,
  type UpdateGuideBlockScreenshotInput,
  type UpdateGuideStepInput,
} from "./guide.service";

export type GuideRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  guide_service: {
    create_guide_from_capture: (input: {
      auth: GuideAuthContext;
      project_id: string;
      capture_session_id: string;
      data: CreateGuideFromCaptureInput;
    }) => Promise<GuideDetail>;
    list_guides: (input: {
      auth: GuideAuthContext;
      project_id: string;
      project_version_id: string;
    }) => Promise<GuideSummary[]>;
    get_guide_detail: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
    }) => Promise<GuideDetail>;
    export_guide_markdown: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
    }) => Promise<GuideMarkdownExport>;
    export_guide_html_zip: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
    }) => Promise<GuideHtmlZipExport>;
    update_guide: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      data: UpdateGuideInput;
    }) => Promise<Guide>;
    update_guide_status: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      status: "draft" | "archived";
      expected_edition_version: number;
    }) => Promise<Guide>;
    update_guide_step: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      guide_step_id: string;
      data: UpdateGuideStepInput;
    }) => Promise<{ guide_step: GuideStep; working_draft: GuideWorkingDraft }>;
    reorder_guide_blocks: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      block_ids: string[];
      expected_working_draft_version: number;
    }) => Promise<{
      guide_blocks: GuideBlock[];
      working_draft: GuideWorkingDraft;
    }>;
    create_guide_block: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      data: CreateGuideBlockInput;
    }) => Promise<{
      guide_blocks: GuideBlock[];
      working_draft: GuideWorkingDraft;
    }>;
    update_guide_block: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      guide_block_id: string;
      data: UpdateGuideBlockInput;
    }) => Promise<{
      guide_block: GuideBlock;
      working_draft: GuideWorkingDraft;
    }>;
    update_guide_block_screenshot: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      guide_block_id: string;
      data: UpdateGuideBlockScreenshotInput;
    }) => Promise<{
      guide_block: GuideBlock;
      working_draft: GuideWorkingDraft;
    }>;
    update_guide_block_annotations: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      guide_block_id: string;
      data: UpdateGuideBlockAnnotationsInput;
    }) => Promise<{
      guide_block: GuideBlock;
      working_draft: GuideWorkingDraft;
    }>;
    prepare_guide_block_screenshot_upload: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      guide_block_id: string;
      expected_working_draft_version: number;
    }) => Promise<PrepareGuideBlockScreenshotUploadResult>;
    delete_guide_block: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      guide_block_id: string;
      expected_working_draft_version: number;
    }) => Promise<GuideWorkingDraft | null>;
  };
  guide_screenshot_upload_service: {
    upload: (input: {
      auth: GuideAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      guide_block_id: string;
      expected_working_draft_version: number;
      capture_session_id: string;
      file: {
        stream: NodeJS.ReadableStream;
        mime_type: string;
        original_name?: string | null;
      };
      data: UploadCaptureAssetInput;
    }) => Promise<{
      capture_asset: CaptureAsset;
      guide_block: GuideBlock;
      working_draft: GuideWorkingDraft;
    }>;
  };
};

const create_guide_body_schema = CreateGuideFromCaptureRequestSchema;
const update_guide_body_schema = UpdateGuideRequestSchema;
const update_guide_step_body_schema = UpdateGuideStepRequestSchema;
const reorder_guide_blocks_body_schema = ReorderGuideBlocksRequestSchema;
const create_guide_block_body_schema = CreateGuideBlockRequestSchema;
const update_guide_block_body_schema = UpdateGuideBlockRequestSchema;
const update_guide_block_screenshot_body_schema =
  UpdateGuideBlockScreenshotRequestSchema;
const update_guide_block_annotations_body_schema =
  UpdateGuideBlockAnnotationsRequestSchema;

const guide_auth_context = (auth: AuthContext): GuideAuthContext => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const pick_create_guide_data = (
  body: CreateGuideFromCaptureInput,
): CreateGuideFromCaptureInput => ({
  title: body.title,
  description: body.description ?? null,
  selected_capture_event_ids: body.selected_capture_event_ids,
});

const pick_update_guide_data = (body: UpdateGuideInput): UpdateGuideInput => {
  const data: UpdateGuideInput = {
    expected_edition_version: body.expected_edition_version,
  };

  if (body.title !== undefined) {
    data.title = body.title;
  }
  if (body.description !== undefined) {
    data.description = body.description;
  }

  return data;
};

const pick_update_guide_step_data = (
  body: UpdateGuideStepInput,
): UpdateGuideStepInput => {
  const data: UpdateGuideStepInput = {
    expected_working_draft_version: body.expected_working_draft_version,
  };

  if (body.title !== undefined) {
    data.title = body.title;
  }
  if (body.body !== undefined) {
    data.body = body.body;
  }

  return data;
};

const pick_create_guide_block_data = (
  body: CreateGuideBlockInput,
): CreateGuideBlockInput => ({
  block_type: body.block_type,
  position: body.position ?? undefined,
  step: body.step ?? undefined,
  title: body.title ?? undefined,
  body: body.body ?? undefined,
  expected_working_draft_version: body.expected_working_draft_version,
});

const pick_update_guide_block_data = (
  body: UpdateGuideBlockInput,
): UpdateGuideBlockInput => ({
  title: body.title ?? undefined,
  body: body.body ?? undefined,
  expected_working_draft_version: body.expected_working_draft_version,
});

const pick_update_guide_block_screenshot_data = (
  body: UpdateGuideBlockScreenshotInput,
): UpdateGuideBlockScreenshotInput => ({
  capture_asset_id: body.capture_asset_id,
  expected_working_draft_version: body.expected_working_draft_version,
});

const pick_update_guide_block_annotations_data = (
  body: UpdateGuideBlockAnnotationsInput,
): UpdateGuideBlockAnnotationsInput => ({
  annotations: body.annotations.map((annotation) => ({
    id: annotation.id,
    type: annotation.type,
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
  })),
  expected_working_draft_version: body.expected_working_draft_version,
});

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

const with_file_url = (asset: CaptureAsset): CaptureAssetWithFileUrl => ({
  ...asset,
  file_url: `/api/v1/projects/${asset.project_id}/capture-sessions/${asset.capture_session_id}/assets/${asset.id}/file`,
});

const content_disposition_attachment = (filename: string) =>
  `attachment; filename="${filename.replace(/["\\\r\n]/g, "-")}"`;

export const build_guide_routes = (
  dependencies: GuideRouteDependencies,
): FastifyPluginAsync => {
  if (!dependencies.guide_screenshot_upload_service) {
    throw new Error("atomic Guide screenshot upload service is required");
  }
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) =>
      guide_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token),
      );

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      const database_constraint =
        typeof error === "object" && error !== null && "constraint" in error
          ? error.constraint
          : null;
      if (database_constraint === "artifact_project_version_active_guard") {
        return reply
          .status(409)
          .send(
            error_response(
              "project_version_read_only",
              "Archived Project Versions are read-only",
            ),
          );
      }
      if (database_constraint === "artifact_edition_active_guard") {
        return reply
          .status(409)
          .send(
            error_response(
              "artifact_edition_not_editable",
              "Archived Artifact Editions are read-only",
            ),
          );
      }
      if (database_constraint === "authored_asset_version_guard") {
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_guide_block_screenshot",
              "Guide screenshot selection is invalid",
            ),
          );
      }

      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(unauthorized_response());
      }

      if (error instanceof ProjectNotFoundError) {
        return reply
          .status(404)
          .send(error_response("project_not_found", "Project was not found"));
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

      if (error instanceof CaptureArtifactVersionNotReadyError) {
        return reply
          .status(409)
          .send(error_response(error.code, error.message));
      }

      if (error instanceof CaptureEventNotFoundError) {
        return reply
          .status(404)
          .send(
            error_response(
              "capture_event_not_found",
              "Capture event was not found",
            ),
          );
      }

      if (error instanceof GuideNotFoundError) {
        return reply
          .status(404)
          .send(error_response("guide_not_found", "Guide was not found"));
      }

      if (error instanceof GuideStepNotFoundError) {
        return reply
          .status(404)
          .send(
            error_response("guide_step_not_found", "Guide step was not found"),
          );
      }

      if (error instanceof GuideBlockNotFoundError) {
        return reply
          .status(404)
          .send(
            error_response(
              "guide_block_not_found",
              "Guide block was not found",
            ),
          );
      }

      if (error instanceof GuideNotEditableError) {
        return reply
          .status(409)
          .send(error_response("guide_not_editable", "Guide is not editable"));
      }

      if (error instanceof InvalidGuideInputError) {
        return reply
          .status(400)
          .send(error_response("invalid_guide", "Guide input is invalid"));
      }

      if (error instanceof InvalidGuideStepInputError) {
        return reply
          .status(400)
          .send(
            error_response("invalid_guide_step", "Guide step input is invalid"),
          );
      }

      if (error instanceof InvalidGuideBlockOrderError) {
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_guide_block_order",
              "Guide block order is invalid",
            ),
          );
      }

      if (error instanceof InvalidGuideBlockContentError) {
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_guide_block_content",
              "Guide block content is invalid",
            ),
          );
      }

      if (error instanceof InvalidGuideBlockScreenshotError) {
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_guide_block_screenshot",
              "Guide block screenshot is invalid",
            ),
          );
      }

      if (error instanceof GuideExportFileNotFoundError) {
        return reply
          .status(404)
          .send(
            error_response(
              "guide_export_file_not_found",
              "Guide export file was not found",
            ),
          );
      }

      if (error instanceof UnsupportedGuideExportStorageProviderError) {
        return reply
          .status(501)
          .send(
            error_response(
              "unsupported_guide_export_storage_provider",
              "Guide export storage provider is not supported",
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

      if (error instanceof UploadTooLargeError) {
        return reply
          .status(413)
          .send(
            error_response(
              "upload_too_large",
              "Capture asset upload is too large",
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
      Body: CreateGuideFromCaptureInput;
    }>(
      "/:project_id/guides/from-capture-session/:capture_session_id",
      {
        schema: {
          body: create_guide_body_schema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guide_detail =
            await dependencies.guide_service.create_guide_from_capture({
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.capture_session_id,
              data: pick_create_guide_data(request.body),
            });

          return reply.status(201).send(guide_detail);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.get<{
      Params: {
        project_id: string;
      };
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides",
      { schema: { querystring: GuideVersionQuerySchema } },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guides = await dependencies.guide_service.list_guides({
            auth,
            project_id: request.params.project_id,
            project_version_id: request.query.project_version_id,
          });

          return reply.status(200).send({ guide_editions: guides });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.get<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id",
      { schema: { querystring: GuideVersionQuerySchema } },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guide_detail =
            await dependencies.guide_service.get_guide_detail({
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
            });

          return reply.status(200).send(guide_detail);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.get<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id/export/markdown",
      { schema: { querystring: GuideVersionQuerySchema } },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const markdown_export =
            await dependencies.guide_service.export_guide_markdown({
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
            });

          return reply.status(200).send(markdown_export);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.get<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id/export/html.zip",
      { schema: { querystring: GuideVersionQuerySchema } },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const html_export =
            await dependencies.guide_service.export_guide_html_zip({
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
            });

          return reply
            .status(200)
            .header("content-type", html_export.mime_type)
            .header("content-length", String(html_export.size_bytes))
            .header(
              "content-disposition",
              content_disposition_attachment(html_export.filename),
            )
            .send(html_export.stream);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Body: UpdateGuideInput;
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id",
      {
        schema: {
          body: update_guide_body_schema,
          querystring: GuideVersionQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guide = await dependencies.guide_service.update_guide({
            auth,
            project_id: request.params.project_id,
            guide_id: request.params.guide_id,
            project_version_id: request.query.project_version_id,
            data: pick_update_guide_data(request.body),
          });

          return reply.status(200).send({ edition: guide });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    for (const command of ["archive", "restore"] as const) {
      fastify.post<{
        Params: { project_id: string; guide_id: string };
        Querystring: GuideVersionQuery;
        Body: { expected_edition_version: number };
      }>(
        `/:project_id/guides/:guide_id/${command}`,
        {
          schema: {
            querystring: GuideVersionQuerySchema,
            body: UpdateGuideEditionStatusRequestSchema,
          },
        },
        async (request, reply) => {
          try {
            const auth = await require_auth(
              request.cookies[web_session_cookie_name],
            );
            const edition =
              await dependencies.guide_service.update_guide_status({
                auth,
                project_id: request.params.project_id,
                guide_id: request.params.guide_id,
                project_version_id: request.query.project_version_id,
                status: command === "archive" ? "archived" : "draft",
                expected_edition_version: request.body.expected_edition_version,
              });
            return reply.status(200).send({ edition });
          } catch (error) {
            return handle_domain_error(error, reply);
          }
        },
      );
    }

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
        guide_step_id: string;
      };
      Body: UpdateGuideStepInput;
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id/steps/:guide_step_id",
      {
        schema: {
          body: update_guide_step_body_schema,
          querystring: GuideVersionQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guide_step = await dependencies.guide_service.update_guide_step(
            {
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
              guide_step_id: request.params.guide_step_id,
              data: pick_update_guide_step_data(request.body),
            },
          );

          return reply.status(200).send(guide_step);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Body: z.infer<typeof ReorderGuideBlocksRequestSchema>;
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id/blocks/reorder",
      {
        schema: {
          body: reorder_guide_blocks_body_schema,
          querystring: GuideVersionQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guide_blocks =
            await dependencies.guide_service.reorder_guide_blocks({
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
              block_ids: request.body.block_ids,
              expected_working_draft_version:
                request.body.expected_working_draft_version,
            });

          return reply.status(200).send(guide_blocks);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.post<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Body: CreateGuideBlockInput;
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id/blocks",
      {
        schema: {
          body: create_guide_block_body_schema,
          querystring: GuideVersionQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guide_blocks =
            await dependencies.guide_service.create_guide_block({
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
              data: pick_create_guide_block_data(request.body),
            });

          return reply.status(201).send(guide_blocks);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
        guide_block_id: string;
      };
      Body: UpdateGuideBlockScreenshotInput;
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot",
      {
        schema: {
          body: update_guide_block_screenshot_body_schema,
          querystring: GuideVersionQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guide_block =
            await dependencies.guide_service.update_guide_block_screenshot({
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
              guide_block_id: request.params.guide_block_id,
              data: pick_update_guide_block_screenshot_data(request.body),
            });

          return reply.status(200).send(guide_block);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
        guide_block_id: string;
      };
      Body: UpdateGuideBlockAnnotationsInput;
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id/blocks/:guide_block_id/annotations",
      {
        schema: {
          body: update_guide_block_annotations_body_schema,
          querystring: GuideVersionQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guide_block =
            await dependencies.guide_service.update_guide_block_annotations({
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
              guide_block_id: request.params.guide_block_id,
              data: pick_update_guide_block_annotations_data(request.body),
            });

          return reply.status(200).send(guide_block);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.post<{
      Params: {
        project_id: string;
        guide_id: string;
        guide_block_id: string;
      };
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload",
      { schema: { querystring: GuideVersionQuerySchema } },
      async (request, reply) => {
        try {
          const auth_context =
            await dependencies.auth_service.get_current_auth_context(
              request.cookies[web_session_cookie_name],
            );
          const guide_auth = guide_auth_context(auth_context);
          const upload = await request.file();

          if (!upload || upload.fieldname !== "file") {
            throw new UploadFileRequiredError();
          }

          if (!upload.filename?.trim()) {
            throw new InvalidCaptureAssetUploadError();
          }

          const expected_working_draft_version = optional_positive_number_field(
            upload.fields,
            "expected_working_draft_version",
            true,
          );
          if (!expected_working_draft_version)
            throw new InvalidCaptureAssetUploadError();
          const prepared =
            await dependencies.guide_service.prepare_guide_block_screenshot_upload(
              {
                auth: guide_auth,
                project_id: request.params.project_id,
                guide_id: request.params.guide_id,
                project_version_id: request.query.project_version_id,
                guide_block_id: request.params.guide_block_id,
                expected_working_draft_version,
              },
            );
          const upload_data = pick_upload_capture_asset_data(upload.fields);
          const result =
            await dependencies.guide_screenshot_upload_service.upload({
              auth: guide_auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
              guide_block_id: request.params.guide_block_id,
              expected_working_draft_version,
              capture_session_id: prepared.capture_session_id,
              file: {
                stream: upload.file,
                mime_type: upload.mimetype,
                original_name: upload.filename,
              },
              data: upload_data,
            });
          return reply.status(201).send({
            guide_block: result.guide_block,
            working_draft: result.working_draft,
            capture_asset: with_file_url(result.capture_asset),
          });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
        guide_block_id: string;
      };
      Body: UpdateGuideBlockInput;
      Querystring: GuideVersionQuery;
    }>(
      "/:project_id/guides/:guide_id/blocks/:guide_block_id",
      {
        schema: {
          body: update_guide_block_body_schema,
          querystring: GuideVersionQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const guide_block =
            await dependencies.guide_service.update_guide_block({
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
              guide_block_id: request.params.guide_block_id,
              data: pick_update_guide_block_data(request.body),
            });

          return reply.status(200).send(guide_block);
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.delete<{
      Params: {
        project_id: string;
        guide_id: string;
        guide_block_id: string;
      };
      Querystring: GuideContentDeleteQuery;
    }>(
      "/:project_id/guides/:guide_id/blocks/:guide_block_id",
      { schema: { querystring: GuideContentDeleteQuerySchema } },
      async (request, reply) => {
        try {
          const auth = await require_auth(
            request.cookies[web_session_cookie_name],
          );
          const working_draft =
            await dependencies.guide_service.delete_guide_block({
              auth,
              project_id: request.params.project_id,
              guide_id: request.params.guide_id,
              project_version_id: request.query.project_version_id,
              guide_block_id: request.params.guide_block_id,
              expected_working_draft_version:
                request.query.expected_working_draft_version,
            });

          return reply.status(200).send({ working_draft });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );
  };
};
