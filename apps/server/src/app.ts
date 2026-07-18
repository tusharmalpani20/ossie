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
import { build_guide_repository } from "./modules/guide/guide.repository.js";
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
import { build_publish_repository } from "./modules/publish/publish.repository.js";
import { build_publish_service } from "./modules/publish/publish.service.js";

type BuildOptions = FastifyServerOptions & {
  public_instance_service?: PublicInstanceRouteService;
  first_run_setup_service?: FirstRunSetupRouteService;
  authentication_session_service?: AuthenticationSessionRouteService;
  organization_invites_service?: OrganizationInvitesRouteDependencies["organization_invites_service"];
  project_service?: ProjectRouteDependencies["project_service"];
  capture_session_service?: CaptureSessionRouteDependencies["capture_session_service"];
  capture_asset_service?: CaptureAssetRouteDependencies["capture_asset_service"];
  capture_event_service?: CaptureEventRouteDependencies["capture_event_service"];
  guide_service?: GuideRouteDependencies["guide_service"];
  interactive_demo_service?: InteractiveDemoRouteDependencies["interactive_demo_service"];
  publish_service?: PublishRouteDependencies["publish_service"];
  readiness_check?: () => Promise<void>;
};

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
    capture_session_service,
    capture_asset_service,
    capture_event_service,
    guide_service,
    interactive_demo_service,
    publish_service,
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
    error_handler(error as FastifyError, request, response);
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
    build_authentication_session_routes(
      authentication_session_service ??
        build_authentication_session_service(
          build_authentication_session_repository(pool),
        ),
    ),
    {
      prefix: "/api/v1/authentication",
    },
  );

  const default_authentication_session_service =
    authentication_session_service ??
    build_authentication_session_service(
      build_authentication_session_repository(pool),
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
        ),
    }),
    {
      prefix: "/api/v1",
    },
  );

  const default_capture_file_storage = build_local_file_storage_provider({
    root: default_local_storage_root(),
  });
  const default_capture_asset_service =
    capture_asset_service ??
    build_capture_asset_service(build_capture_asset_repository(pool), {
      file_storage: default_capture_file_storage,
      max_upload_bytes: max_screenshot_upload_bytes,
    });

  app.register(
    build_project_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      project_service:
        project_service ??
        build_project_service(build_audited_project_repository(pool), {
          create_project: build_project_creation_writer(pool),
        }),
    }),
    {
      prefix: "/api/v1/projects",
    },
  );

  app.register(
    build_capture_session_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      capture_session_service:
        capture_session_service ??
        build_capture_session_service(
          build_audited_capture_session_repository(pool),
        ),
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
        build_capture_event_service(
          build_audited_capture_event_repository(pool),
        ),
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
        build_guide_service(build_guide_repository(pool), {
          public_base_url: process.env.API_URL,
          file_storage: default_capture_file_storage,
        }),
      capture_asset_service: default_capture_asset_service,
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
        build_interactive_demo_service(build_audited_interactive_demo_repository(pool)),
    }),
    {
      prefix: "/api/v1/projects",
    },
  );

  app.register(
    build_publish_routes({
      auth_service: {
        get_current_auth_context:
          default_authentication_session_service.get_current_auth_context,
      },
      publish_service:
        publish_service ??
        build_publish_service(build_publish_repository(pool), {
          file_storage: default_capture_file_storage,
        }),
    }),
    {
      prefix: "/api/v1",
    },
  );

  return app;
};
