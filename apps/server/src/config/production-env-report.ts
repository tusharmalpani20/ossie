import path from "node:path";
import {
  get_json_body_limit_bytes,
  get_max_screenshot_upload_bytes,
  get_rate_limit_config,
} from "./production-hardening.config";
import { get_public_web_url } from "./public-web-url.config";
import { get_runtime_mode } from "./runtime.config";
import { validate_server_startup_config } from "./startup.config";
import { get_documentation_try_it_origin_config } from "./documentation-try-it.config";
import { get_documentation_operations_config } from "./documentation-operations.config";

const parse_origins = (value: string | undefined) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export type ProductionEnvReport = {
  status: "valid";
  runtime_mode: ReturnType<typeof get_runtime_mode>;
  startup_config: "valid";
  generated_at: string;
  deployment: {
    mode: string | null;
    onboarding_mode: string | null;
  };
  database: {
    host_configured: boolean;
    port: number | null;
    name_configured: boolean;
    user_configured: boolean;
    password_configured: boolean;
    max_pool: number | null;
  };
  cookies: {
    secret_configured: boolean;
    domain_configured: boolean;
    secure_cookies: boolean;
  };
  cors: {
    allowed_origins_count: number;
    allowed_origins: string[];
  };
  urls: {
    api_url: string | null;
    public_web_url: string | null;
  };
  local_storage: {
    provider: "local";
    root_configured: boolean;
    root_is_absolute: boolean;
    root_uses_default_development_path: boolean;
  };
  limits: {
    json_body_limit_bytes: number;
    max_screenshot_upload_bytes: number;
  };
  rate_limit: {
    backend: "in_memory";
    max_attempts: number;
    window_ms: number;
    multi_instance_safe: false;
  };
  documentation_try_it: {
    allowed_origins_count: number;
    origin_set_digest: string;
    dns_validation: "all_addresses_must_be_public";
    dns_timeout_ms: number;
  };
  documentation: {
    public_asset_manifest_configured: boolean;
    public_asset_base_configured: boolean;
    heavy_work_concurrency: number;
    publication_concurrency: number;
    publication_timeout_ms: number;
    rebuild_concurrency: number;
    rebuild_batch_size: number;
    initial_html_max_bytes: number;
  };
  operational_limitations: string[];
};

const number_from_env = (name: string) => {
  const value = process.env[name];

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const origin_from_env_url = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  return new URL(value).origin;
};

export const build_production_env_report = (): ProductionEnvReport => {
  validate_server_startup_config();

  const runtime_mode = get_runtime_mode();
  const local_storage_root = process.env.OSSIE_LOCAL_STORAGE_ROOT || "";
  const rate_limit = get_rate_limit_config();
  const documentation_try_it = get_documentation_try_it_origin_config();
  const documentation_operations = get_documentation_operations_config();

  return {
    status: "valid",
    runtime_mode,
    startup_config: "valid",
    generated_at: new Date().toISOString(),
    deployment: {
      mode: process.env.OSSIE_DEPLOYMENT_MODE || null,
      onboarding_mode: process.env.OSSIE_ONBOARDING_MODE || null,
    },
    database: {
      host_configured: Boolean(process.env.DB_HOST),
      port: number_from_env("DB_PORT"),
      name_configured: Boolean(process.env.DB_NAME),
      user_configured: Boolean(process.env.DB_USER),
      password_configured: Boolean(process.env.DB_PASSWORD),
      max_pool: number_from_env("DB_MAX_POOL"),
    },
    cookies: {
      secret_configured: Boolean(process.env.COOKIE_SECRET),
      domain_configured: Boolean(process.env.COOKIE_DOMAIN),
      secure_cookies: runtime_mode === "production",
    },
    cors: {
      allowed_origins_count: parse_origins(
        process.env.OSSIE_CORS_ALLOWED_ORIGINS,
      ).length,
      allowed_origins: parse_origins(process.env.OSSIE_CORS_ALLOWED_ORIGINS),
    },
    urls: {
      api_url: origin_from_env_url(process.env.API_URL),
      public_web_url: get_public_web_url(),
    },
    local_storage: {
      provider: "local",
      root_configured: Boolean(local_storage_root),
      root_is_absolute: path.isAbsolute(local_storage_root),
      root_uses_default_development_path: local_storage_root === "./storage",
    },
    limits: {
      json_body_limit_bytes: get_json_body_limit_bytes(),
      max_screenshot_upload_bytes: get_max_screenshot_upload_bytes(),
    },
    rate_limit: {
      backend: "in_memory",
      max_attempts: rate_limit.max_attempts,
      window_ms: rate_limit.window_ms,
      multi_instance_safe: false,
    },
    documentation_try_it: {
      allowed_origins_count: documentation_try_it.origins.length,
      origin_set_digest: documentation_try_it.digest,
      dns_validation: "all_addresses_must_be_public",
      dns_timeout_ms: documentation_operations.try_it_dns_timeout_ms,
    },
    documentation: {
      public_asset_manifest_configured: Boolean(
        process.env.OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH,
      ),
      public_asset_base_configured: Boolean(
        process.env.OSSIE_DOCUMENTATION_WEB_ASSET_BASE,
      ),
      heavy_work_concurrency: documentation_operations.heavy_work_concurrency,
      publication_concurrency: documentation_operations.publication_concurrency,
      publication_timeout_ms: documentation_operations.publication_timeout_ms,
      rebuild_concurrency: documentation_operations.rebuild_concurrency,
      rebuild_batch_size: documentation_operations.rebuild_batch_size,
      initial_html_max_bytes: documentation_operations.initial_html_max_bytes,
    },
    operational_limitations: [
      "Local file storage is the only storage provider.",
      "Automated retention cleanup is not built.",
      "Rate limiting is in-memory and not shared across API processes.",
      "One-command production packaging is still deferred.",
      "Backup/restore must be rehearsed by the operator against a disposable environment.",
    ],
  };
};
