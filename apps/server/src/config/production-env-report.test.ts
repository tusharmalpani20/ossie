import { afterEach, describe, expect, it } from "vitest";
import { build_production_env_report } from "./production-env-report";

const valid_production_env = {
  TZ: "UTC",
  SERVER_PORT: "3002",
  NODE_ENV: "production",
  DEV_TYPE: "production",
  DB_HOST: "db.internal.example",
  DB_PORT: "5432",
  DB_USER: "demo",
  DB_PASSWORD: "super-secret-db-password",
  DB_NAME: "ossie",
  DB_MAX_POOL: "10",
  COOKIE_SECRET: "super-secret-cookie-value",
  COOKIE_DOMAIN: "demo.example.com",
  OSSIE_CORS_ALLOWED_ORIGINS:
    "https://demo.example.com,chrome-extension://abcdefghijklmnopabcdefghijklmnop",
  OSSIE_DEPLOYMENT_MODE: "self_hosted",
  OSSIE_ONBOARDING_MODE: "first_run_setup",
  OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
  OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES: "10485760",
  OSSIE_JSON_BODY_LIMIT_BYTES: "1048576",
  OSSIE_RATE_LIMIT_MAX_ATTEMPTS: "20",
  OSSIE_RATE_LIMIT_WINDOW_MS: "60000",
  API_URL: "https://api.example.com",
  OSSIE_PUBLIC_WEB_URL: "https://demo.example.com",
  OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS:
    "https://b.example.com,https://a.example.com",
  OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH:
    "/opt/ossie/apps/web/dist/.vite/manifest.json",
  OSSIE_DOCUMENTATION_WEB_ASSET_BASE: "/assets/",
  OSSIE_DOCUMENTATION_HEAVY_WORK_CONCURRENCY: "4",
  OSSIE_DOCUMENTATION_PUBLICATION_CONCURRENCY: "2",
  OSSIE_DOCUMENTATION_REBUILD_CONCURRENCY: "1",
  OSSIE_DOCUMENTATION_PUBLICATION_TIMEOUT_MS: "45000",
  OSSIE_DOCUMENTATION_REBUILD_BATCH_SIZE: "250",
  OSSIE_DOCUMENTATION_INITIAL_HTML_MAX_BYTES: "1048576",
  OSSIE_DOCUMENTATION_TRY_IT_DNS_TIMEOUT_MS: "4000",
};

describe("production env report", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("builds a secret-safe report from a valid production environment", () => {
    process.env = {
      ...original_env,
      ...valid_production_env,
    };

    const report = build_production_env_report();
    const serialized = JSON.stringify(report);

    expect(report).toMatchObject({
      status: "valid",
      runtime_mode: "production",
      startup_config: "valid",
      deployment: {
        mode: "self_hosted",
        onboarding_mode: "first_run_setup",
      },
      database: {
        host_configured: true,
        port: 5432,
        name_configured: true,
        user_configured: true,
        password_configured: true,
        max_pool: 10,
      },
      cookies: {
        secret_configured: true,
        domain_configured: true,
        secure_cookies: true,
      },
      cors: {
        allowed_origins_count: 2,
        allowed_origins: [
          "https://demo.example.com",
          "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
        ],
      },
      urls: {
        api_url: "https://api.example.com",
        public_web_url: "https://demo.example.com",
      },
      local_storage: {
        provider: "local",
        root_configured: true,
        root_is_absolute: true,
        root_uses_default_development_path: false,
      },
      limits: {
        json_body_limit_bytes: 1048576,
        max_screenshot_upload_bytes: 10485760,
      },
      rate_limit: {
        backend: "in_memory",
        max_attempts: 20,
        window_ms: 60000,
        multi_instance_safe: false,
      },
      documentation_try_it: {
        allowed_origins_count: 2,
        dns_validation: "all_addresses_must_be_public",
        dns_timeout_ms: 4000,
      },
      documentation: {
        public_asset_manifest_configured: true,
        public_asset_base_configured: true,
        heavy_work_concurrency: 4,
        publication_concurrency: 2,
        publication_timeout_ms: 45000,
        rebuild_concurrency: 1,
        rebuild_batch_size: 250,
        initial_html_max_bytes: 1048576,
      },
    });
    expect(report.operational_limitations).toContain(
      "Local file storage is the only storage provider.",
    );
    expect(report.operational_limitations).toContain(
      "Rate limiting is in-memory and not shared across API processes.",
    );
    expect(serialized).not.toContain("super-secret-cookie-value");
    expect(serialized).not.toContain("super-secret-db-password");
    expect(serialized).not.toContain("COOKIE_SECRET");
    expect(serialized).not.toContain("DB_PASSWORD");
    expect(serialized).not.toContain("/var/lib/ossie/storage");
    expect(serialized).not.toContain("https://a.example.com");
    expect(report.documentation_try_it.origin_set_digest).toMatch(
      /^[a-f0-9]{64}$/u,
    );
  });

  it("fails through startup validation when production config is invalid", () => {
    process.env = {
      ...original_env,
      ...valid_production_env,
      COOKIE_SECRET: "",
    };

    expect(() => build_production_env_report()).toThrow(
      "COOKIE_SECRET must be defined in production",
    );
  });

  it("reports only the public API origin when API_URL contains extra URL parts", () => {
    process.env = {
      ...original_env,
      ...valid_production_env,
      API_URL:
        "https://api-user:api-password@api.example.com/internal?token=secret-token",
    };

    const report = build_production_env_report();
    const serialized = JSON.stringify(report);

    expect(report.urls.api_url).toBe("https://api.example.com");
    expect(serialized).not.toContain("api-user");
    expect(serialized).not.toContain("api-password");
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("/internal");
  });
});
