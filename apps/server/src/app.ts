import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { ulid } from "ulid";
import sharp from "sharp";
import cookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";
import fastify, { type FastifyError, type FastifyServerOptions } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { error_handler } from "./common/helper_function/error_handler.helper.js";
import { get_cookie_config } from "./config/cookie.config.js";
import { get_cors_config } from "./config/cors.config.js";
import { initialize_event_emitter } from "./config/event.config.js";
import {
  get_json_body_limit_bytes,
  get_max_screenshot_upload_bytes,
  get_rate_limit_config,
} from "./config/production-hardening.config.js";
import requestDec from "./config/fastify_decoder.config.js";
import { pool } from "./config/database.config.js";
import {
  build_public_instance_routes,
  type PublicInstanceRouteService,
} from "./modules/public-instance/public-instance.routes.js";
import { build_public_instance_repository } from "./modules/public-instance/public-instance.repository.js";
import { build_public_instance_service } from "./modules/public-instance/public-instance.service.js";
import {
  build_first_run_setup_routes,
  type FirstRunSetupRouteService,
} from "./modules/setup/first-run-setup.routes.js";
import { build_first_run_setup_repository } from "./modules/setup/first-run-setup.repository.js";
import { build_first_run_setup_service } from "./modules/setup/first-run-setup.service.js";
import {
  build_authentication_session_routes,
  type AuthenticationSessionRouteService,
} from "./modules/authentication/session.routes.js";
import { build_authentication_session_repository } from "./modules/authentication/session.audit.js";
import { build_authentication_session_service } from "./modules/authentication/session.service.js";
import {
  build_organization_invites_routes,
  type OrganizationInvitesRouteDependencies,
} from "./modules/organization/organization-invites.routes.js";
import { build_organization_invites_repository } from "./modules/organization/organization-invites.audit.js";
import { build_organization_invites_service } from "./modules/organization/organization-invites.service.js";
import {
  build_project_routes,
  type ProjectRouteDependencies,
} from "./modules/project/project.routes.js";
import { build_project_service } from "./modules/project/project.service.js";
import {
  build_audited_project_repository,
  build_project_creation_writer,
} from "./modules/project/project.audit.js";
import {
  build_capture_session_routes,
  type CaptureSessionRouteDependencies,
} from "./modules/capture-session/capture-session.routes.js";
import { build_audited_capture_session_repository } from "./modules/capture-session/capture-session.audit.js";
import { build_capture_session_service } from "./modules/capture-session/capture-session.service.js";
import {
  build_capture_asset_routes,
  type CaptureAssetRouteDependencies,
} from "./modules/capture-asset/capture-asset.routes.js";
import { build_capture_asset_repository } from "./modules/capture-asset/capture-asset.audit.js";
import { build_capture_asset_service } from "./modules/capture-asset/capture-asset.service.js";
import { build_local_file_storage_provider } from "./modules/file-storage/local-file-storage.provider.js";
import {
  build_capture_event_routes,
  type CaptureEventRouteDependencies,
} from "./modules/capture-event/capture-event.routes.js";
import { build_audited_capture_event_repository } from "./modules/capture-event/capture-event.audit.js";
import { build_capture_event_service } from "./modules/capture-event/capture-event.service.js";
import {
  build_guide_routes,
  type GuideRouteDependencies,
} from "./modules/guide/guide.routes.js";
import { build_audited_guide_repository } from "./modules/guide/guide.audit.js";
import { build_audited_guide_screenshot_upload_service } from "./modules/guide/guide-screenshot-upload.audit.js";
import { build_guide_service } from "./modules/guide/guide.service.js";
import {
  build_interactive_demo_routes,
  type InteractiveDemoRouteDependencies,
} from "./modules/interactive-demo/interactive-demo.routes.js";
import { build_audited_interactive_demo_repository } from "./modules/interactive-demo/interactive-demo.audit.js";
import { build_interactive_demo_service } from "./modules/interactive-demo/interactive-demo.service.js";
import {
  build_publish_routes,
  type PublishRouteDependencies,
} from "./modules/publish/publish.routes.js";
import { build_audited_publish_repository } from "./modules/publish/publish.audit.js";
import { build_publish_service } from "./modules/publish/publish.service.js";
import { hash_public_link_password } from "./modules/publish/public-link-password.js";
import { validate_publish_password_input } from "@repo/publish-domain";
import {
  audit_request_context,
  run_with_audit_request_context,
  safe_audit_actor_label,
} from "./modules/audit/audit-request-context.js";
import type { AccessEvent } from "@repo/audit-domain";
import { build_access_repository } from "./modules/access/access.repository.js";
import { build_access_response_hook } from "./modules/access/access-response-hook.js";
import {
  access_request_context,
  run_with_access_request_context,
  set_access_auth_context,
  set_access_resolved_resource,
} from "./modules/access/access-request-context.js";
import {
  build_compliance_routes,
  build_project_compliance_routes,
  type ComplianceRouteDependencies,
} from "./modules/compliance/compliance.routes.js";
import { build_compliance_repository } from "./modules/compliance/compliance.repository.js";
import {
  build_compliance_service,
  build_project_compliance_service,
} from "./modules/compliance/compliance.service.js";
import { build_project_membership_repository } from "./modules/project-membership/project-membership.repository.js";
import { build_audited_project_membership_repository } from "./modules/project-membership/project-membership.audit.js";
import {
  build_project_access_service,
  build_project_membership_service,
} from "./modules/project-membership/project-membership.service.js";
import { build_project_membership_routes } from "./modules/project-membership/project-membership.routes.js";
import { with_project_authorization } from "./modules/project-membership/project-service-authorization.js";
import { build_project_activity_repository } from "./modules/project-activity/project-activity.repository.js";
import { build_project_activity_service } from "./modules/project-activity/project-activity.service.js";
import { build_project_activity_routes } from "./modules/project-activity/project-activity.routes.js";
import {
  build_project_version_routes,
  type ProjectVersionRouteService,
} from "./modules/project-version/project-version.routes.js";
import { build_project_version_service } from "./modules/project-version/project-version.service.js";
import { build_audited_project_version_repository } from "./modules/project-version/project-version.audit.js";
import { build_project_version_repository } from "./modules/project-version/project-version.repository.js";
import { build_artifact_revision_routes } from "./modules/artifact-revision/artifact-revision.routes.js";
import { build_artifact_revision_service } from "./modules/artifact-revision/artifact-revision.service.js";
import { build_audited_artifact_revision_repository } from "./modules/artifact-revision/artifact-revision.audit.js";
import { build_artifact_carry_forward_routes } from "./modules/artifact-carry-forward/artifact-carry-forward.routes.js";
import { build_artifact_carry_forward_service } from "./modules/artifact-carry-forward/artifact-carry-forward.service.js";
import { build_audited_artifact_carry_forward_repository } from "./modules/artifact-carry-forward/artifact-carry-forward.audit.js";
import {
  build_documentation_routes,
  type DocumentationRouteDependencies,
} from "./modules/documentation/documentation.routes.js";
import { build_documentation_repository } from "./modules/documentation/documentation.repository.js";
import { build_documentation_service } from "./modules/documentation/documentation.service.js";
import { parse_documentation_openapi } from "./modules/documentation/documentation-openapi.js";
import { inspect_documentation_markdown } from "./modules/documentation/documentation-markdown.js";
import {
  create_documentation_site_package,
  inspect_documentation_site_package,
} from "./modules/documentation/documentation-package.js";
import { create_portable_documentation_snapshot } from "./modules/documentation/documentation-portability.js";
import { build_documentation_import_cleanup } from "./modules/documentation/documentation-import-cleanup.js";
import {
  assert_documentation_image_dimensions,
  assert_documentation_image_format,
} from "./modules/documentation/documentation-asset.js";
import { validate_documentation_asset_bytes } from "./modules/documentation/documentation-asset-integrity.js";
import {
  canonicalize_documentation_package_json,
  export_documentation_page_markdown,
  normalize_documentation_blocks,
  validate_documentation_snippet_blocks,
} from "@repo/documentation-domain";
import {
  DOCUMENTATION_IMPORT_LIFETIME_MS,
  DOCUMENTATION_MARKDOWN_UPLOAD_MAX_BYTES,
  DOCUMENTATION_PACKAGE_UPLOAD_MAX_BYTES,
} from "@repo/constants";

type BuildOptions = FastifyServerOptions & {
  public_instance_service?: PublicInstanceRouteService;
  first_run_setup_service?: FirstRunSetupRouteService;
  authentication_session_service?: AuthenticationSessionRouteService;
  organization_invites_service?: OrganizationInvitesRouteDependencies["organization_invites_service"];
  project_service?: ProjectRouteDependencies["project_service"];
  project_version_service?: ProjectVersionRouteService;
  artifact_revision_service?: ReturnType<
    typeof build_artifact_revision_service
  >;
  artifact_carry_forward_service?: ReturnType<
    typeof build_artifact_carry_forward_service
  >;
  capture_session_service?: CaptureSessionRouteDependencies["capture_session_service"];
  capture_asset_service?: CaptureAssetRouteDependencies["capture_asset_service"];
  capture_event_service?: CaptureEventRouteDependencies["capture_event_service"];
  guide_service?: GuideRouteDependencies["guide_service"];
  guide_screenshot_upload_service?: GuideRouteDependencies["guide_screenshot_upload_service"];
  interactive_demo_service?: InteractiveDemoRouteDependencies["interactive_demo_service"];
  publish_service?: PublishRouteDependencies["publish_service"];
  documentation_service?: DocumentationRouteDependencies["documentation_service"];
  access_event_writer?: {
    append(event: AccessEvent): Promise<void>;
  };
  compliance_service?: ComplianceRouteDependencies["compliance_service"];
  readiness_check?: () => Promise<void>;
};

export const guide_project_capabilities = {
  create_guide_from_capture: "artifact.write",
  list_guides: "artifact.read",
  get_guide_detail: "artifact.read",
  export_guide_markdown: "artifact.read",
  export_guide_html_zip: "artifact.read",
  update_guide: "artifact.write",
  update_guide_status: "artifact.write",
  update_guide_step: "artifact.write",
  reorder_guide_blocks: "artifact.write",
  create_guide_block: "artifact.write",
  update_guide_block: "artifact.write",
  update_guide_block_screenshot: "artifact.write",
  update_guide_block_annotations: "artifact.write",
  prepare_guide_block_screenshot_upload: "artifact.write",
  delete_guide_block: "artifact.write",
} as const;

export const interactive_demo_project_capabilities = {
  create_interactive_demo_from_capture: "artifact.write",
  create_interactive_demo: "artifact.write",
  list_interactive_demos: "artifact.read",
  get_interactive_demo: "artifact.read",
  update_interactive_demo: "artifact.write",
  update_interactive_demo_status: "artifact.write",
  create_demo_scene: "artifact.write",
  list_demo_scenes: "artifact.read",
  update_demo_scene: "artifact.write",
  reorder_demo_scenes: "artifact.write",
  delete_demo_scene: "artifact.write",
  create_demo_hotspot: "artifact.write",
  list_demo_hotspots: "artifact.read",
  update_demo_hotspot: "artifact.write",
  reorder_demo_hotspots: "artifact.write",
  delete_demo_hotspot: "artifact.write",
} as const;

const default_local_storage_root = () =>
  process.env.OSSIE_LOCAL_STORAGE_ROOT || "./storage";

const production_hardened_routes = [
  {
    key: "authentication_login",
    method: "POST",
    pattern: /^\/api\/v1\/authentication\/login$/,
  },
  {
    key: "first_run_setup",
    method: "POST",
    pattern: /^\/api\/v1\/setup\/first-run$/,
  },
  {
    key: "public_viewer_session",
    method: "POST",
    pattern: /^\/api\/v1\/public\/publish-links\/[^/]+\/viewer-sessions$/,
  },
  {
    key: "public_invite_accept",
    method: "POST",
    pattern: /^\/api\/v1\/public\/invites\/[^/]+\/accept$/,
  },
] as const;

type RateLimitBucket = {
  count: number;
  reset_at: number;
};

const client_ip_from_request = (request: {
  headers: Record<string, unknown>;
  ip: string;
}) => {
  const forwarded_for = request.headers["x-forwarded-for"];

  if (typeof forwarded_for === "string" && forwarded_for.trim()) {
    return forwarded_for.split(",")[0]?.trim() || request.ip;
  }

  return request.ip;
};

const matched_rate_limited_route = (method: string, url: string) => {
  const pathname = url.split("?")[0] ?? url;

  return production_hardened_routes.find(
    (route) => route.method === method && route.pattern.test(pathname),
  );
};

export const build = (opts: BuildOptions = {}) => {
  const {
    public_instance_service,
    first_run_setup_service,
    authentication_session_service,
    organization_invites_service,
    project_service,
    project_version_service,
    artifact_revision_service,
    artifact_carry_forward_service,
    capture_session_service,
    capture_asset_service,
    capture_event_service,
    guide_service,
    guide_screenshot_upload_service,
    interactive_demo_service,
    publish_service,
    documentation_service,
    access_event_writer,
    compliance_service,
    readiness_check = async () => {
      await pool.query("SELECT 1");
    },
    ...fastify_options
  } = opts;
  const app = fastify({
    bodyLimit: get_json_body_limit_bytes(),
    ...fastify_options,
  });
  const max_screenshot_upload_bytes = get_max_screenshot_upload_bytes();
  const rate_limit_config = get_rate_limit_config();
  const rate_limit_buckets = new Map<string, RateLimitBucket>();

  app.addHook("onRequest", (request, _reply, done) => {
    run_with_audit_request_context(audit_request_context(request), () =>
      run_with_access_request_context(access_request_context(request), done),
    );
  });

  app.addHook(
    "onSend",
    build_access_response_hook(
      access_event_writer ?? build_access_repository(pool),
    ),
  );

  app.addHook("onRequest", async (request, reply) => {
    const route = matched_rate_limited_route(request.method, request.url);

    if (!route) {
      return;
    }

    const now = Date.now();
    const client_ip = client_ip_from_request(request);
    const bucket_key = `${route.key}:${client_ip}`;
    const existing_bucket = rate_limit_buckets.get(bucket_key);
    const bucket =
      existing_bucket && existing_bucket.reset_at > now
        ? existing_bucket
        : {
            count: 0,
            reset_at: now + rate_limit_config.window_ms,
          };

    bucket.count += 1;
    rate_limit_buckets.set(bucket_key, bucket);

    if (bucket.count > rate_limit_config.max_attempts) {
      const retry_after_seconds = Math.max(
        1,
        Math.ceil((bucket.reset_at - now) / 1000),
      );
      return reply
        .status(429)
        .header("retry-after", String(retry_after_seconds))
        .send({
          error: {
            type: "rate_limited",
            message: "Too many requests. Try again later.",
          },
        });
    }
  });

  app.get("/healthz", async (_request, reply) =>
    reply.status(200).send({
      status: "ok",
      service: "ossie-api",
    }),
  );

  app.get("/readyz", async (_request, reply) => {
    try {
      await readiness_check();
      return reply.status(200).send({
        status: "ready",
        checks: {
          database: "ok",
        },
      });
    } catch {
      return reply.status(503).send({
        status: "not_ready",
        checks: {
          database: "unavailable",
        },
      });
    }
  });

  // Register request decorators first
  app.register(requestDec);

  // Register CORS
  app.register(fastifyCors, get_cors_config().fastify_options);

  // Register cookie plugin here, after CORS but before other plugins
  app.register(cookie, get_cookie_config());

  // Register Multipart right after CORS
  app.register(fastifyMultipart, {
    limits: {
      fileSize: max_screenshot_upload_bytes,
      files: 10,
    },
  });

  app.setErrorHandler(async (error, request, response) => {
    return error_handler(error as FastifyError, request, response);
  });

  // Set up Zod as the validator and serializer
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register Swagger
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Ossie",
        description: "Ossie API",
        version: "1.0.0",
      },
      // Add security schemes definition
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter your JWT token",
          },
        },
      },

      tags: [
        {
          name: "authentication",
          description: "Authentication related end-points",
        },
      ],
      servers: [
        {
          url: "http://localhost:4000/api/v1",
          description: "Development server",
        },
      ],
    },
    transform: jsonSchemaTransform,
  });

  // Register Scalar API Reference
  if (process.env.DEV_TYPE === "development") {
    app.register(fastifyApiReference, {
      routePrefix: "/documentation",
      configuration: {
        theme: "bluePlanet", //'alternate' | 'default' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'deepSpace' | 'saturn' | 'kepler' | 'mars' | 'none';
        spec: {
          content: () => app.swagger(),
        },
        metaData: {
          title: "OSSIE API Documentation",
          description: "OSSIE API Documentation",
          ogDescription: "OSSIE API Documentation",
          ogTitle: "OSSIE API Documentation",
          // ogImage: 'https://example.com/image.png',
          // twitterCard: 'summary_large_image',
          // // Add more...
        },
      },
    });

    // app.register(fastifySwaggerUi, {
    //     routePrefix: '/documentation',
    //     uiConfig: {
    //         docExpansion: 'full',
    //         deepLinking: false
    //     },
    //     uiHooks: {
    //         onRequest: function (request, reply, next) { next() },
    //         preHandler: function (request, reply, next) { next() }
    //     },
    //     staticCSP: true,
    //     transformStaticCSP: (header) => header,
    //     transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
    //     transformSpecificationClone: true
    // })
  }

  initialize_event_emitter();

  const report_auth_context = (
    auth: Awaited<
      ReturnType<AuthenticationSessionRouteService["get_current_auth_context"]>
    >,
  ) => {
    if (auth.org_user.role !== "owner" && auth.org_user.role !== "member")
      return;
    set_access_auth_context({
      organization_id: auth.organization.id,
      org_user_id: auth.org_user.id,
      actor_label: safe_audit_actor_label(auth.user.display_name),
      organization_role: auth.org_user.role,
      auth_session_id: auth.session.id,
    });
  };
  const built_authentication_session_service =
    build_authentication_session_service(
      build_authentication_session_repository(pool),
      {
        on_auth_context_resolved: report_auth_context,
        on_login_identity_resolved: (identity) =>
          set_access_resolved_resource({
            organization_id: identity.organization.id,
            project_id: null,
            root_resource_type: "organization",
            root_resource_id: identity.organization.id,
          }),
      },
    );
  const default_authentication_session_service = authentication_session_service
    ? {
        get_current_auth_context: async (session_token?: string) => {
          const auth =
            await authentication_session_service.get_current_auth_context(
              session_token,
            );
          report_auth_context(auth);
          return auth;
        },
        login: async (
          ...args: Parameters<AuthenticationSessionRouteService["login"]>
        ) => {
          const result = await authentication_session_service.login(...args);
          report_auth_context(result.auth);
          return result;
        },
        logout: authentication_session_service.logout,
      }
    : built_authentication_session_service;

  app.register(
    build_public_instance_routes(
      public_instance_service ??
        build_public_instance_service(build_public_instance_repository(pool)),
    ),
    {
      prefix: "/api/v1/public",
    },
  );

  app.register(
    build_first_run_setup_routes(
      first_run_setup_service ??
        build_first_run_setup_service(build_first_run_setup_repository(pool)),
    ),
    {
      prefix: "/api/v1/setup",
    },
  );

  app.register(
    build_authentication_session_routes(default_authentication_session_service),
    {
      prefix: "/api/v1/authentication",
    },
  );

  app.register(
    build_organization_invites_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      organization_invites_service:
        organization_invites_service ??
        build_organization_invites_service(
          build_organization_invites_repository(pool),
          {
            on_public_invite_resolved: (invite) =>
              set_access_resolved_resource({
                organization_id: invite.organization_id,
                project_id: null,
                root_resource_type: "org_invite",
                root_resource_id: invite.invite_id,
              }),
          },
        ),
    }),
    {
      prefix: "/api/v1",
    },
  );

  const default_capture_file_storage = build_local_file_storage_provider({
    root: default_local_storage_root(),
  });
  if (process.env.NODE_ENV === "production") {
    const documentation_import_cleanup = build_documentation_import_cleanup({
      repository: build_documentation_repository(pool),
      storage: default_capture_file_storage,
    });
    const run_documentation_import_cleanup = () =>
      documentation_import_cleanup.run_once().catch((error: unknown) => {
        app.log.error(
          { error },
          "Documentation import cleanup pass failed",
        );
      });
    app.addHook("onReady", async () => {
      await run_documentation_import_cleanup();
    });
    const cleanup_interval = setInterval(
      run_documentation_import_cleanup,
      15 * 60 * 1000,
    );
    cleanup_interval.unref();
    app.addHook("onClose", async () => {
      clearInterval(cleanup_interval);
    });
  }
  const project_access_service = build_project_access_service(
    build_project_membership_repository(pool),
  );
  const default_capture_asset_service =
    capture_asset_service ??
    (() => {
      const service = build_capture_asset_service(
        build_capture_asset_repository(pool),
        {
          file_storage: default_capture_file_storage,
          max_upload_bytes: max_screenshot_upload_bytes,
        },
      );
      return with_project_authorization(service, project_access_service, {
        create_capture_asset: "capture.write",
        upload_capture_asset: "capture.write",
        list_capture_assets: "capture.read",
        list_project_capture_assets: "capture.read",
        get_capture_asset: "capture.read",
        get_capture_asset_file: "capture.read",
        archive_capture_asset: "capture.write",
        restore_capture_asset: "capture.write",
        get_capture_asset_protection: "asset.purge",
        purge_capture_asset: "asset.purge",
      });
    })();

  app.register(
    build_project_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      project_service:
        project_service ??
        (() => {
          const service = build_project_service(
            build_audited_project_repository(pool),
            {
              create_project: build_project_creation_writer(pool),
            },
          );
          return {
            ...service,
            async get_project(input) {
              const access = await project_access_service.authorize({
                ...input,
                capability: "project.read",
              });
              return { ...(await service.get_project(input)), access };
            },
            async update_project(input) {
              const access = await project_access_service.authorize({
                ...input,
                capability: "project.settings.manage",
              });
              return { ...(await service.update_project(input)), access };
            },
            async delete_project(input) {
              await project_access_service.authorize({
                ...input,
                capability: "project.settings.manage",
              });
              return service.delete_project(input);
            },
          };
        })(),
    }),
    {
      prefix: "/api/v1/projects",
    },
  );

  app.register(
    build_project_version_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      project_version_service:
        project_version_service ??
        build_project_version_service({
          access: project_access_service,
          repository: build_audited_project_version_repository(pool),
        }),
    }),
    { prefix: "/api/v1/projects" },
  );

  app.register(
    build_project_membership_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      membership_service: build_project_membership_service({
        access: project_access_service,
        repository: build_audited_project_membership_repository(pool),
      }),
    }),
    { prefix: "/api/v1/projects" },
  );

  app.register(
    build_project_activity_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      activity_service: build_project_activity_service(
        build_project_activity_repository(pool),
        project_access_service,
      ),
    }),
    { prefix: "/api/v1/projects" },
  );

  const documentation_public_access_service = build_publish_service(
    build_audited_publish_repository(pool),
    {
      on_public_publish_link_resolved: (link) =>
        set_access_resolved_resource({
          organization_id: link.organization_id,
          project_id: link.project_id,
          root_resource_type: "publish_link",
          root_resource_id: link.publish_link_id,
        }),
    },
  );

  app.register(
    build_documentation_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      documentation_service:
        documentation_service ??
        (() => {
          const unavailable = async () => {
            throw new Error("Documentation operation is not available");
          };
          const repository = build_documentation_repository(pool);
          const validate_referenced_asset_bytes = async (
            input: {
              organization_id: string;
              project_id: string;
              project_version_id: string;
              site_id: string;
            },
            blocks: Array<Record<string, unknown>>,
          ) => {
            const sources = new Map<
              string,
              { kind: "documentation_asset" | "capture_asset"; id: string }
            >();
            for (const block of blocks) {
              if (
                block.kind !== "image" ||
                !block.source ||
                typeof block.source !== "object"
              )
                continue;
              const source = block.source as { kind?: unknown; id?: unknown };
              if (
                (source.kind !== "documentation_asset" &&
                  source.kind !== "capture_asset") ||
                typeof source.id !== "string"
              )
                continue;
              sources.set(`${source.kind}:${source.id}`, {
                kind: source.kind,
                id: source.id,
              });
            }
            const inspected = await Promise.all(
              [...sources.values()].map(async (source) => {
                const file =
                  source.kind === "documentation_asset"
                    ? await repository.get_asset_file_record({
                        ...input,
                        asset_id: source.id,
                      })
                    : await repository.get_capture_asset_file_record({
                        ...input,
                        asset_id: source.id,
                      });
                if (!file) {
                  throw Object.assign(
                    new Error("Documentation Asset bytes are unavailable"),
                    { code: "documentation_asset_source_unavailable" },
                  );
                }
                const digest = await validate_documentation_asset_bytes({
                  file,
                  get: default_capture_file_storage.get,
                });
                return [`${source.kind}:${source.id}`, digest] as const;
              }),
            );
            return Object.fromEntries(inspected);
          };
          const service = build_documentation_service({
            ...repository,
            save_page: unavailable,
            create_revision: unavailable,
            prepare_publication: unavailable,
            switch_publication: unavailable,
            rollback_publication: unavailable,
          });
          return {
            list_sites: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.list_sites(input);
            },
            create_site: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.site.manage",
              });
              return service.create_site(input);
            },
            create_page: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.create_page(input);
            },
            get_page: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.get_page(input);
            },
            save_page: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              normalize_documentation_blocks(
                input.blocks as Parameters<
                  typeof normalize_documentation_blocks
                >[0],
              );
              await validate_referenced_asset_bytes(
                input,
                input.blocks as Array<Record<string, unknown>>,
              );
              return repository.save_page({
                ...input,
                blocks: input.blocks as Array<Record<string, unknown>>,
              });
            },
            list_snippets: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.list_snippets(input);
            },
            create_snippet: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.create_snippet(input);
            },
            get_snippet: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.get_snippet(input);
            },
            update_snippet: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.update_snippet(input);
            },
            save_snippet: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              validate_documentation_snippet_blocks(input.blocks);
              await validate_referenced_asset_bytes(
                input,
                input.blocks as Array<Record<string, unknown>>,
              );
              return repository.save_snippet({
                ...input,
                blocks: input.blocks as Array<Record<string, unknown>>,
              });
            },
            transition_snippet: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.transition_snippet(input);
            },
            list_assets: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.list_assets(input);
            },
            update_asset: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.update_asset(input);
            },
            transition_asset: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.transition_asset(input);
            },
            list_artifact_publications: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.list_artifact_publications(input);
            },
            update_page: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.update_page(input);
            },
            replace_navigation: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.replace_navigation(input);
            },
            replace_routing: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.replace_routing(input);
            },
            create_comment_thread: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.comment",
              });
              return repository.create_comment_thread(input);
            },
            list_comments: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.list_comments(input);
            },
            create_comment_reply: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.comment",
              });
              return repository.create_comment_reply(input);
            },
            transition_comment: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.comment",
              });
              return repository.transition_comment(input);
            },
            get_preview: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.get_preview(input);
            },
            search_draft: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.search_draft(input);
            },
            list_revisions: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.list_revisions(input);
            },
            list_publications: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.list_publications(input);
            },
            list_publish_links: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.list_publish_links(input);
            },
            get_revision: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.get_revision(input);
            },
            create_revision: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.checkpoint",
              });
              const preview = (await repository.get_preview(input)) as {
                pages?: Array<{ blocks?: Array<Record<string, unknown>> }>;
                snippets?: Array<{ blocks?: Array<Record<string, unknown>> }>;
              } | null;
              const verified_asset_digests =
                await validate_referenced_asset_bytes(input, [
                  ...(preview?.pages ?? []).flatMap(
                    (page) => page.blocks ?? [],
                  ),
                  ...(preview?.snippets ?? []).flatMap(
                    (snippet) => snippet.blocks ?? [],
                  ),
                ]);
              return repository.create_revision({
                ...input,
                verified_asset_digests,
              });
            },
            create_publication: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "publication.create",
              });
              if (input.link.mode === "existing")
                return repository.create_publication({
                  ...input,
                  link: input.link,
                });
              validate_publish_password_input(input.link.password);
              const password =
                input.link.password === null
                  ? { hash: null, salt: null }
                  : await hash_public_link_password(input.link.password);
              return repository.create_publication({
                ...input,
                link: {
                  ...input.link,
                  password_hash: password.hash,
                  password_salt: password.salt,
                },
              });
            },
            rollback_publication: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "publication.create",
              });
              return repository.rollback_publication(input);
            },
            revoke_publish_link: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "publish_link.manage",
              });
              return repository.revoke_publish_link(input);
            },
            resolve_public_site: async (input) => {
              await documentation_public_access_service.authorize_public_documentation(
                {
                  slug: input.slug,
                  viewer_token: input.viewer_token,
                },
              );
              return repository.resolve_public_site(input);
            },
            upload_asset: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              const metadata = await sharp(input.bytes, {
                limitInputPixels: 40_000_000,
              }).metadata();
              if (!metadata.width || !metadata.height) {
                const error = new Error("Documentation image is invalid");
                Object.assign(error, { code: "documentation_asset_invalid" });
                throw error;
              }
              assert_documentation_image_format(
                metadata.format,
                input.mime_type,
              );
              assert_documentation_image_dimensions(
                metadata.width,
                metadata.height,
              );
              const file_id = ulid();
              const asset_id = ulid();
              const stored = await default_capture_file_storage.put({
                organization_id: input.organization_id,
                project_id: input.project_id,
                documentation_site_id: input.site_id,
                file_id,
                mime_type: input.mime_type,
                stream: Readable.from(input.bytes),
                max_size_bytes: 10 * 1024 * 1024,
              });
              try {
                return await repository.create_asset({
                  ...input,
                  file_id,
                  asset_id,
                  width: metadata.width,
                  height: metadata.height,
                  file: {
                    ...stored,
                    mime_type: input.mime_type,
                    original_name: input.original_name,
                  },
                });
              } catch (error) {
                await default_capture_file_storage.delete_best_effort(stored);
                throw error;
              }
            },
            get_asset_file: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              const file = await repository.get_asset_file_record(input);
              if (!file || file.storage_provider !== "local") return null;
              const stored = await default_capture_file_storage.get({
                storage_key: file.storage_key,
              });
              return {
                stream: stored.stream,
                size_bytes: stored.size_bytes,
                mime_type: file.mime_type,
              };
            },
            get_capture_asset_file: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              const file =
                await repository.get_capture_asset_file_record(input);
              if (!file || file.storage_provider !== "local") return null;
              const stored = await default_capture_file_storage.get({
                storage_key: file.storage_key,
              });
              return {
                stream: stored.stream,
                size_bytes: stored.size_bytes,
                mime_type: file.mime_type,
              };
            },
            get_public_asset_file: async (input) => {
              await documentation_public_access_service.authorize_public_documentation(
                {
                  slug: input.slug,
                  viewer_token: input.viewer_token,
                },
              );
              const file = await repository.get_public_asset_file_record(input);
              if (!file || file.storage_provider !== "local") return null;
              const stored = await default_capture_file_storage.get({
                storage_key: file.storage_key,
              });
              return {
                stream: stored.stream,
                size_bytes: stored.size_bytes,
                mime_type: file.mime_type,
              };
            },
            get_public_capture_asset_file: async (input) => {
              await documentation_public_access_service.authorize_public_documentation(
                {
                  slug: input.slug,
                  viewer_token: input.viewer_token,
                },
              );
              const file =
                await repository.get_public_capture_asset_file_record(input);
              if (!file || file.storage_provider !== "local") return null;
              const stored = await default_capture_file_storage.get({
                storage_key: file.storage_key,
              });
              return {
                stream: stored.stream,
                size_bytes: stored.size_bytes,
                mime_type: file.mime_type,
              };
            },
            authorize_portability: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: input.capability,
              });
            },
            export_page_markdown: async (input) => {
              const exported = await repository.get_export_snapshot({
                ...input,
                ...(input.source === "draft"
                  ? {
                      expected_draft_version: input.expected_draft_version,
                      expected_page_id: input.page_id,
                      expected_page_version: input.expected_page_version,
                    }
                  : input.source === "revision"
                    ? { revision_number: input.revision_number }
                    : {
                        site_publication_id: input.site_publication_id,
                      }),
              } as never);
              if (!exported) return null;
              const raw = exported.snapshot as Record<string, any>;
              const snapshot = raw.working_draft
                ? raw
                : {
                    site: {
                      id: input.site_id,
                      name: raw.revision.site_name,
                      description: raw.revision.site_description,
                    },
                    edition: {
                      primary_language: raw.revision.primary_language,
                    },
                    working_draft: {
                      home_page_id: raw.revision.home_page_id,
                    },
                    pages: raw.pages,
                    snippets: raw.snippets,
                    assets: raw.assets ?? [],
                    navigation: { nodes: raw.navigation },
                    routing: {
                      aliases: raw.aliases,
                      rules: raw.redirects,
                    },
                    openapi_operations: raw.openapi_operations,
                  };
              const portable =
                create_portable_documentation_snapshot(snapshot);
              const pageIndex = snapshot.pages.findIndex(
                (page: Record<string, unknown>) => page.id === input.page_id,
              );
              const page = portable.pages[pageIndex];
              if (!page) return null;
              const markdown = export_documentation_page_markdown(page, {
                page_paths: Object.fromEntries(
                  portable.site.pages.map((candidate) => [
                    candidate.handle,
                    `${candidate.canonical_path}.md`,
                  ]),
                ),
              });
              const filename = `${
                page.canonical_path
                  .split("/")
                  .at(-1)
                  ?.replace(/[^a-z0-9._-]+/giu, "-") || "page"
              }.md`;
              return {
                bytes: Buffer.from(markdown, "utf8"),
                filename,
                mime_type: "text/markdown; charset=utf-8",
              };
            },
            export_site_package: async (input) => {
              const exported = await repository.get_export_snapshot(
                input as never,
              );
              if (!exported) return null;
              const raw = exported.snapshot as Record<string, any>;
              const snapshot = raw.working_draft
                ? raw
                : {
                    site: {
                      id: input.site_id,
                      name: raw.revision.site_name,
                      description: raw.revision.site_description,
                    },
                    edition: {
                      primary_language: raw.revision.primary_language,
                    },
                    working_draft: {
                      home_page_id: raw.revision.home_page_id,
                    },
                    pages: raw.pages,
                    snippets: raw.snippets,
                    assets: raw.assets ?? [],
                    navigation: { nodes: raw.navigation },
                    routing: {
                      aliases: raw.aliases,
                      rules: raw.redirects,
                    },
                    openapi_operations: raw.openapi_operations,
                  };
              const portable =
                create_portable_documentation_snapshot(snapshot);
              const entries: Array<{
                path: string;
                role:
                  | "page_typed"
                  | "page_markdown"
                  | "snippet"
                  | "asset";
                mime_type: string;
                bytes: Buffer | string | object;
              }> = [];
              for (const page of portable.pages) {
                entries.push({
                  path: `pages/${page.handle}.json`,
                  role: "page_typed",
                  mime_type: "application/json",
                  bytes: page,
                });
                entries.push({
                  path: `pages/${page.handle}.md`,
                  role: "page_markdown",
                  mime_type: "text/markdown",
                  bytes: export_documentation_page_markdown(page),
                });
              }
              for (const snippet of portable.snippets)
                entries.push({
                  path: `snippets/${snippet.handle}.json`,
                  role: "snippet",
                  mime_type: "application/json",
                  bytes: snippet,
                });
              if (exported.source === "draft")
                for (const [index, asset] of (
                  snapshot.assets as Array<Record<string, any>>
                ).entries()) {
                  const portableAsset = portable.site.assets[index];
                  const file = await repository.get_asset_file_record({
                    ...input,
                    asset_id: asset.id,
                  });
                  if (!file || !portableAsset)
                    throw Object.assign(
                      new Error(
                        "Documentation export Asset source is unavailable",
                      ),
                      { code: "documentation_export_source_unavailable" },
                    );
                  const stored = await default_capture_file_storage.get(file);
                  const chunks: Buffer[] = [];
                  for await (const chunk of stored.stream as AsyncIterable<
                    Buffer | string
                  >)
                    chunks.push(
                      Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                    );
                  const bytes = Buffer.concat(chunks);
                  if (
                    createHash("sha256").update(bytes).digest("hex") !==
                    portableAsset.sha256
                  )
                    throw Object.assign(
                      new Error(
                        "Documentation export Asset digest is unavailable",
                      ),
                      { code: "documentation_export_source_unavailable" },
                    );
                  entries.push({
                    path: portableAsset.path,
                    role: "asset",
                    mime_type: portableAsset.mime_type,
                    bytes,
                  });
                }
              const result = await create_documentation_site_package({
                source: {
                  kind:
                    exported.source === "draft"
                      ? "working_draft"
                      : exported.source === "revision"
                        ? "site_revision"
                        : "site_publication",
                  project_version_label: input.version_slug,
                  revision_number:
                    raw.revision?.revision_number ??
                    (input.source === "revision"
                      ? input.revision_number
                      : null),
                  publication_sequence:
                    exported.publication_sequence ?? null,
                },
                site: portable.site,
                entries,
              });
              const safeName =
                String(snapshot.site.name)
                  .normalize("NFKD")
                  .replace(/[^a-z0-9._-]+/giu, "-")
                  .replace(/^-+|-+$/gu, "")
                  .slice(0, 80) || "documentation";
              return {
                bytes: result.bytes,
                filename: `${safeName}-${input.version_slug}-documentation-v1.zip`,
                mime_type: "application/zip",
              };
            },
            export_openapi_source: async (input) => {
              const file = await repository.get_openapi_export_file(
                input as never,
              );
              if (!file) return null;
              const stored = await default_capture_file_storage.get(file);
              const chunks: Buffer[] = [];
              for await (const chunk of stored.stream as AsyncIterable<
                Buffer | string
              >)
                chunks.push(
                  Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                );
              const bytes = Buffer.concat(chunks);
              if (
                createHash("sha256").update(bytes).digest("hex") !== file.digest
              )
                throw Object.assign(
                  new Error("Documentation OpenAPI source is unavailable"),
                  { code: "documentation_export_source_unavailable" },
                );
              return {
                bytes,
                filename:
                  file.original_format === "json"
                    ? "openapi-source.json"
                    : "openapi-source.yaml",
                mime_type: file.mime_type,
              };
            },
            inspect_import: async (input) => {
              const inspection_id = ulid();
              const file_id = ulid();
              const stored = await default_capture_file_storage.put({
                organization_id: input.organization_id,
                project_id: input.project_id,
                documentation_import_inspection_id: inspection_id,
                file_id,
                mime_type: input.mime_type,
                stream: input.stream,
                max_size_bytes:
                  input.kind === "page_markdown"
                    ? DOCUMENTATION_MARKDOWN_UPLOAD_MAX_BYTES
                    : DOCUMENTATION_PACKAGE_UPLOAD_MAX_BYTES,
              });
              try {
                let content_fingerprint: string;
                let safe_report: Record<string, unknown>;
                if (input.kind === "page_markdown") {
                  const source = await default_capture_file_storage.get(stored);
                  const chunks: Buffer[] = [];
                  for await (const chunk of source.stream as AsyncIterable<
                    Buffer | string
                  >)
                    chunks.push(
                      Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                    );
                  const parsed = inspect_documentation_markdown(
                    Buffer.concat(chunks),
                    {
                      filename_stem: input.original_name.replace(/\.md$/iu, ""),
                    },
                  );
                  content_fingerprint = createHash("sha256")
                    .update(
                      canonicalize_documentation_package_json(parsed.blocks),
                    )
                    .digest("hex");
                  safe_report = {
                    summary: {
                      pages: 1,
                      snippets: 0,
                      assets: 0,
                      openapi_sources: 0,
                      external_bindings: 0,
                      expanded_bytes: stored.size_bytes,
                    },
                    proposal: {
                      package_profile: null,
                      claimed_source_kind: null,
                      title: parsed.title,
                      canonical_path: parsed.canonical_path,
                      site_name: null,
                      site_description: null,
                      primary_language: null,
                      home_page_handle: null,
                      pages: [],
                      required_bindings: [],
                    },
                    issues: [],
                    issue_counts: { blocking: 0, warnings: 0 },
                    has_blocking_issues: false,
                    issues_truncated: false,
                  };
                } else {
                  const parsed = await inspect_documentation_site_package(
                    default_capture_file_storage.resolve_internal_path(stored),
                  );
                  content_fingerprint = parsed.manifest.content_fingerprint;
                  safe_report = {
                    summary: {
                      pages: parsed.counts.pages,
                      snippets: parsed.counts.snippets,
                      assets: parsed.counts.assets,
                      openapi_sources: parsed.counts.openapi_sources,
                      external_bindings: parsed.counts.external_bindings,
                      expanded_bytes: parsed.archive.expanded_bytes,
                    },
                    proposal: {
                      package_profile: parsed.manifest.profile,
                      claimed_source_kind: parsed.manifest.source.kind,
                      title: null,
                      canonical_path: null,
                      site_name: parsed.site.site.name,
                      site_description: parsed.site.site.description,
                      primary_language: parsed.site.site.primary_language,
                      home_page_handle: parsed.site.home_page_handle,
                      pages: parsed.site.pages.map(
                        ({ handle, title, canonical_path }) => ({
                          handle,
                          title,
                          canonical_path,
                        }),
                      ),
                      required_bindings: parsed.site.external_bindings,
                    },
                    issues: [],
                    issue_counts: { blocking: 0, warnings: 0 },
                    has_blocking_issues: false,
                    issues_truncated: false,
                  };
                }
                const persisted =
                  (await repository.create_import_inspection({
                    ...input,
                    inspection_id,
                    file_id,
                    source_file: {
                      ...stored,
                      mime_type: input.mime_type,
                    },
                    content_fingerprint,
                    safe_report,
                    expires_at: new Date(
                      Date.now() + DOCUMENTATION_IMPORT_LIFETIME_MS,
                    ),
                  })) as unknown as Record<string, unknown> & {
                    id: string;
                    safe_report?: Record<string, unknown>;
                  };
                if (persisted.id !== inspection_id)
                  await default_capture_file_storage.delete_best_effort(stored);
                const { safe_report: report = safe_report, ...inspection } =
                  persisted;
                return {
                  ...inspection,
                  format_version: input.kind === "site_package" ? 1 : null,
                  ...report,
                };
              } catch (error) {
                await default_capture_file_storage.delete_best_effort(stored);
                throw error;
              }
            },
            get_import_inspection: async (input) => {
              const inspection = (await repository.get_import_inspection(
                input,
              )) as
                | (Record<string, unknown> & {
                    safe_report: Record<string, unknown> | null;
                  })
                | null;
              if (!inspection) return null;
              const {
                safe_report,
                source_file_id: _sourceFileId,
                storage_provider: _storageProvider,
                storage_key: _storageKey,
                ...safe
              } = inspection;
              return safe_report ? { ...safe, ...safe_report } : safe;
            },
            cancel_import_inspection: async (input) => {
              const inspection = (await repository.get_import_inspection(
                input,
              )) as
                | {
                    storage_provider?: string;
                    storage_key?: string;
                  }
                | null;
              const result =
                await repository.cancel_import_inspection(input);
              if (
                inspection?.storage_provider === "local" &&
                inspection.storage_key
              )
                await default_capture_file_storage.delete_best_effort({
                  storage_key: inspection.storage_key,
                });
              return result;
            },
            apply_import: async (input) => {
              const inspection = (await repository.get_import_inspection(
                input,
              )) as
                | {
                    kind: "page_markdown" | "site_package";
                    status: string;
                    source_digest: string;
                    content_fingerprint: string;
                    storage_provider: string;
                    storage_key: string;
                  }
                | null;
              if (
                !inspection ||
                inspection.storage_provider !== "local" ||
                inspection.status !== "ready"
              ) {
                const error = new Error(
                  "Documentation import inspection is unavailable",
                );
                Object.assign(error, {
                  code: inspection
                    ? "documentation_import_not_ready"
                    : "documentation_import_not_found",
                });
                throw error;
              }
              if (
                input.data.content_fingerprint !==
                inspection.content_fingerprint
              ) {
                const error = new Error(
                  "Documentation import fingerprint changed",
                );
                Object.assign(error, {
                  code: "documentation_import_conflict",
                });
                throw error;
              }
              if (
                inspection.kind !== "page_markdown" ||
                input.data.target.mode !== "page" ||
                input.data.external_bindings.length !== 0
              ) {
                const error = new Error(
                  "Documentation import target does not match its source",
                );
                Object.assign(error, {
                  code: "documentation_import_conflict",
                });
                throw error;
              }
              const source =
                await default_capture_file_storage.get(inspection);
              const chunks: Buffer[] = [];
              for await (const chunk of source.stream as AsyncIterable<
                Buffer | string
              >)
                chunks.push(
                  Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                );
              const bytes = Buffer.concat(chunks);
              if (
                createHash("sha256").update(bytes).digest("hex") !==
                inspection.source_digest
              ) {
                const error = new Error(
                  "Documentation import source bytes changed",
                );
                Object.assign(error, {
                  code: "documentation_import_conflict",
                });
                throw error;
              }
              const parsed = inspect_documentation_markdown(bytes, {
                filename_stem: "imported-page",
              });
              const fingerprint = createHash("sha256")
                .update(canonicalize_documentation_package_json(parsed.blocks))
                .digest("hex");
              if (fingerprint !== inspection.content_fingerprint) {
                const error = new Error(
                  "Documentation import content changed",
                );
                Object.assign(error, {
                  code: "documentation_import_conflict",
                });
                throw error;
              }
              const blocks = parsed.blocks.map((block) => ({
                ...block,
                id: ulid(),
                target_block_id: null,
                ...("items" in block && Array.isArray(block.items)
                  ? {
                      items: block.items.map((item) => ({
                        ...item,
                        id: ulid(),
                      })),
                    }
                  : {}),
              }));
              const result = await repository.apply_markdown_import({
                organization_id: input.organization_id,
                project_id: input.project_id,
                project_version_id: input.project_version_id,
                actor_org_user_id: input.actor_org_user_id,
                idempotency_key: input.idempotency_key,
                inspection_id: input.inspection_id,
                content_fingerprint: input.data.content_fingerprint,
                site_id: input.data.target.site_id,
                expected_draft_version:
                  input.data.target.expected_draft_version,
                title: input.data.target.title,
                canonical_path: input.data.target.canonical_path,
                set_as_home: input.data.target.set_as_home,
                blocks,
              });
              await default_capture_file_storage.delete_best_effort(
                inspection,
              );
              return result;
            },
            inspect_openapi: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              const file_id = ulid();
              const inspection_id = ulid();
              const stored = await default_capture_file_storage.put({
                organization_id: input.organization_id,
                project_id: input.project_id,
                documentation_site_id: input.site_id,
                file_id,
                mime_type: input.mime_type,
                stream: input.stream,
                max_size_bytes: 10 * 1024 * 1024,
              });
              try {
                const source = await default_capture_file_storage.get(stored);
                const chunks: Buffer[] = [];
                for await (const chunk of source.stream as AsyncIterable<
                  Buffer | string
                >)
                  chunks.push(
                    Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                  );
                const parsed = parse_documentation_openapi(
                  Buffer.concat(chunks),
                  input.mime_type,
                );
                return await repository.create_openapi_inspection({
                  ...input,
                  file_id,
                  inspection_id,
                  file: {
                    ...stored,
                    mime_type: input.mime_type,
                    original_name: input.original_name,
                  },
                  document: parsed.document,
                  summary: parsed.summary,
                });
              } catch (error) {
                await default_capture_file_storage.delete_best_effort(stored);
                throw error;
              }
            },
            apply_openapi_source: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.write",
              });
              return repository.apply_openapi_source(input);
            },
            get_openapi_source: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.read",
              });
              return repository.get_openapi_source(input);
            },
          };
        })(),
      resolve_project_version: async (input) => {
        await project_access_service.authorize({
          auth: {
            organization_id: input.organization_id,
            actor_org_user_id: input.actor_org_user_id,
          },
          project_id: input.project_id,
          capability: "documentation.read",
        });
        const resolution = await build_project_version_repository(
          pool,
        ).resolve_version({
          organization_id: input.organization_id,
          project_id: input.project_id,
          slug: input.version_slug,
        });
        if (!resolution) throw new Error("Project Version was not found");
        return { id: resolution.project_version.id };
      },
    }),
  );

  app.register(
    build_project_compliance_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      compliance_service: build_project_compliance_service(
        build_compliance_repository(pool),
        project_access_service,
      ),
    }),
    { prefix: "/api/v1/projects" },
  );

  app.register(
    build_capture_session_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      capture_session_service:
        capture_session_service ??
        (() => {
          const service = build_capture_session_service(
            build_audited_capture_session_repository(pool),
          );
          return with_project_authorization(service, project_access_service, {
            create_capture_session: "capture.write",
            list_capture_sessions: "capture.read",
            get_capture_session: "capture.read",
            get_capture_session_detail: "capture.read",
            update_capture_session: "capture.write",
            complete_capture_session: "capture.write",
            delete_capture_session: "capture.write",
          });
        })(),
    }),
    {
      prefix: "/api/v1/projects",
    },
  );

  app.register(
    build_capture_asset_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      capture_asset_service: default_capture_asset_service,
    }),
    {
      prefix: "/api/v1/projects",
    },
  );

  app.register(
    build_capture_event_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      capture_event_service:
        capture_event_service ??
        (() => {
          const service = build_capture_event_service(
            build_audited_capture_event_repository(pool),
          );
          return with_project_authorization(service, project_access_service, {
            create_capture_event: "capture.write",
            list_capture_events: "capture.read",
            get_capture_event: "capture.read",
            delete_capture_event: "capture.write",
            reorder_capture_events: "capture.write",
            update_capture_event: "capture.write",
          });
        })(),
    }),
    {
      prefix: "/api/v1/projects",
    },
  );

  app.register(
    build_guide_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      guide_service:
        guide_service ??
        (() => {
          const service = build_guide_service(
            build_audited_guide_repository(pool),
            {
              public_base_url: process.env.API_URL,
              file_storage: default_capture_file_storage,
            },
          );
          return with_project_authorization(
            service,
            project_access_service,
            guide_project_capabilities,
          );
        })(),
      guide_screenshot_upload_service:
        guide_screenshot_upload_service ??
        (() => {
          const service = build_audited_guide_screenshot_upload_service(pool, {
            file_storage: default_capture_file_storage,
            max_upload_bytes: max_screenshot_upload_bytes,
          });
          return with_project_authorization(service, project_access_service, {
            upload: "artifact.write",
          });
        })(),
    }),
    {
      prefix: "/api/v1/projects",
    },
  );

  app.register(
    build_interactive_demo_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      interactive_demo_service:
        interactive_demo_service ??
        (() => {
          const service = build_interactive_demo_service(
            build_audited_interactive_demo_repository(pool),
          );
          return with_project_authorization(
            service,
            project_access_service,
            interactive_demo_project_capabilities,
          );
        })(),
    }),
    {
      prefix: "/api/v1/projects",
    },
  );

  app.register(
    build_artifact_revision_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      artifact_revision_service:
        artifact_revision_service ??
        (() => {
          const service = build_artifact_revision_service(
            build_audited_artifact_revision_repository(pool),
          );
          return with_project_authorization(service, project_access_service, {
            checkpoint_guide: "revision.checkpoint_restore",
            list_guide_revisions: "artifact.read",
            get_guide_revision: "artifact.read",
            restore_guide_revision: "revision.checkpoint_restore",
            checkpoint_interactive_demo: "revision.checkpoint_restore",
            list_interactive_demo_revisions: "artifact.read",
            get_interactive_demo_revision: "artifact.read",
            restore_interactive_demo_revision: "revision.checkpoint_restore",
          });
        })(),
    }),
    { prefix: "/api/v1/projects" },
  );

  app.register(
    build_artifact_carry_forward_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      artifact_carry_forward_service:
        artifact_carry_forward_service ??
        with_project_authorization(
          build_artifact_carry_forward_service(
            build_audited_artifact_carry_forward_repository(pool),
          ),
          project_access_service,
          { carry_forward: "revision.carry_forward" },
        ),
    }),
    { prefix: "/api/v1/projects" },
  );

  app.register(
    build_publish_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      publish_service:
        publish_service ??
        (() => {
          const service = build_publish_service(
            build_audited_publish_repository(pool),
            {
              file_storage: default_capture_file_storage,
              on_public_publish_link_resolved: (link) =>
                set_access_resolved_resource({
                  organization_id: link.organization_id,
                  project_id: link.project_id,
                  root_resource_type: "publish_link",
                  root_resource_id: link.publish_link_id,
                }),
            },
          );
          return with_project_authorization(service, project_access_service, {
            publish: "publication.create",
            list_publications: "publication.read",
            list_publish_links: "publication.read",
            create_publish_link: "publish_link.manage",
            update_publish_link: "publish_link.manage",
            replace_publish_link_manifest: "publish_link.manage",
            rollback_publish_link_entry: "publish_link.manage",
            revoke_publish_link: "publish_link.manage",
          });
        })(),
      resolve_public_documentation: async (input) => {
        await documentation_public_access_service.authorize_public_documentation(
          {
            slug: input.slug,
            viewer_token: input.viewer_token,
          },
        );
        return build_documentation_repository(pool).resolve_public_site(input);
      },
    }),
    {
      prefix: "/api/v1",
    },
  );

  app.register(
    build_compliance_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      compliance_service:
        compliance_service ??
        build_compliance_service(build_compliance_repository(pool)),
    }),
    {
      prefix: "/api/v1/organization/compliance",
    },
  );

  return app;
};
