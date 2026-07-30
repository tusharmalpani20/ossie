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
              return repository.save_page({
                ...input,
                blocks: input.blocks as Array<Record<string, unknown>>,
              });
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
              return repository.create_revision(input);
            },
            create_publication: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.site.manage",
              });
              return repository.create_publication(input);
            },
            rollback_publication: async (input) => {
              await project_access_service.authorize({
                auth: {
                  organization_id: input.organization_id,
                  actor_org_user_id: input.actor_org_user_id,
                },
                project_id: input.project_id,
                capability: "documentation.site.manage",
              });
              return repository.rollback_publication(input);
            },
            resolve_public_site: repository.resolve_public_site,
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
